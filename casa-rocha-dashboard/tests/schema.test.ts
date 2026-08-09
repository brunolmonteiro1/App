import { describe, it, expect } from "vitest";
import {
  applyConditionalApplicability,
  CodingResponseSchema,
  computeNeedsReview,
  normalizeEnums,
  validateBusinessRules,
} from "@/lib/coding/schema";

// §40.2 Codificação e schema + regra de evidência ciente de agregados.

function baseResponse(overrides: Record<string, unknown> = {}) {
  return {
    tema_central: "A cruz",
    resumo_3_linhas: "Resumo com mais de dez caracteres.",
    scores: {},
    evidencias: [],
    ...overrides,
  };
}

describe("CodingResponseSchema", () => {
  it("aceita JSON válido mínimo", () => {
    const r = CodingResponseSchema.safeParse(baseResponse());
    expect(r.success).toBe(true);
  });

  it("score fora de 0–5 falha", () => {
    const r = CodingResponseSchema.safeParse(baseResponse({ scores: { orthodoxyScore: 7 } }));
    expect(r.success).toBe(false);
  });

  it("enum inválido cai no default (catch), não quebra", () => {
    const r = CodingResponseSchema.safeParse(baseResponse({ tipo_de_pregacao: "xpto" }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo_de_pregacao).toBe("hibrida");
  });

  it("campo crítico ausente (tema_central) falha", () => {
    const r = CodingResponseSchema.safeParse({ resumo_3_linhas: "abcabcabcabc", scores: {}, evidencias: [] });
    expect(r.success).toBe(false);
  });

  it("scores com null não quebram (null≠zero)", () => {
    const r = CodingResponseSchema.safeParse(baseResponse({ scores: { orthodoxyScore: null, christologyScore: 3 } }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.scores.orthodoxyScore).toBeNull();
  });
});

describe("validateBusinessRules — evidência por limiar", () => {
  it("score 4 em categoria específica sem evidência falha", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ scores: { christologyScore: 4 } }));
    const issues = validateBusinessRules(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].field).toBe("christologyScore");
  });

  it("score 4 em categoria específica COM evidência passa", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { christologyScore: 4 },
        evidencias: [{ campo: "christologyScore", citacao: "Cristo é o centro de tudo aqui", comentario: "" }],
      })
    );
    expect(validateBusinessRules(parsed)).toHaveLength(0);
  });

  it("risco (passividade) usa limiar mais baixo (≥3) e exige evidência", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ scores: { passivityRiskScore: 3 } }));
    const issues = validateBusinessRules(parsed);
    expect(issues.some((i) => i.field === "passivityRiskScore")).toBe(true);
  });
});

describe("validateBusinessRules — agregados de eixo (correção do caso #03)", () => {
  it("agregado orthodoxyScore=4 SEM evidência em nenhuma categoria do eixo falha", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ scores: { orthodoxyScore: 4 } }));
    const issues = validateBusinessRules(parsed);
    expect(issues.some((i) => i.field === "orthodoxyScore")).toBe(true);
  });

  it("agregado orthodoxyScore=4 é fundamentado por evidência numa categoria do MESMO eixo (christologyScore)", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { orthodoxyScore: 4, christologyScore: 4 },
        evidencias: [{ campo: "christologyScore", citacao: "Cristo é o centro de tudo aqui", comentario: "" }],
      })
    );
    // Nem orthodoxyScore (agregado, coberto pelo eixo) nem christologyScore (tem evidência própria) devem falhar.
    expect(validateBusinessRules(parsed)).toHaveLength(0);
  });

  it("agregado biblicalHealthScore=4 coberto por evidência em christocentricReadingScore", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { biblicalHealthScore: 4, christocentricReadingScore: 4 },
        evidencias: [{ campo: "christocentricReadingScore", citacao: "toda a pregação aponta para Cristo crucificado", comentario: "" }],
      })
    );
    expect(validateBusinessRules(parsed)).toHaveLength(0);
  });
});

describe("validateBusinessRules — pós-localização (evidência fabricada não satisfaz)", () => {
  it("score 4 com evidência FORNECIDA mas NÃO LOCALIZADA falha quando locatedFields é passado", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { christologyScore: 4 },
        evidencias: [{ campo: "christologyScore", citacao: "citação fabricada que não existe na transcrição", comentario: "" }],
      })
    );
    // Sem locatedFields (pré-localização): passa — a evidência foi fornecida.
    expect(validateBusinessRules(parsed)).toHaveLength(0);
    // Com locatedFields vazio (nada localizado): falha — fabricada não conta.
    const issues = validateBusinessRules(parsed, new Set());
    expect(issues.some((i) => i.field === "christologyScore")).toBe(true);
  });

  it("agregado com evidência própria (mesmo localizada) NÃO se auto-sustenta — precisa de componente do eixo", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { orthodoxyScore: 4 },
        evidencias: [{ campo: "orthodoxyScore", citacao: "uma citação qualquer do agregado aqui", comentario: "" }],
      })
    );
    const issues = validateBusinessRules(parsed, new Set(["orthodoxyScore"]));
    expect(issues.some((i) => i.field === "orthodoxyScore")).toBe(true);
  });

  it("caso real #03: agregado com evidência fabricada + categoria específica localizada → passa", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({
        scores: { biblicalHealthScore: 4, christologyScore: 4 },
        evidencias: [
          { campo: "christologyScore", citacao: "e disse Deus façamos o ser humano a nossa imagem", comentario: "" },
          { campo: "biblicalHealthScore", citacao: "gênesis capítulo dois versos 16 e 17 paráfrase fabricada", comentario: "" },
        ],
      })
    );
    // biblicalHealthScore está no eixo 1; christologyScore (eixo 2) localizada
    // não sustenta o eixo 1 — mas christocentricReadingScore sim. Simulamos a
    // localização apenas da evidência válida de cristologia:
    const issues = validateBusinessRules(parsed, new Set(["christologyScore"]));
    // christologyScore ok; biblicalHealthScore (agregado eixo 1) sem componente
    // do eixo 1 localizado → falha (exige categoria específica do MESMO eixo).
    expect(issues.some((i) => i.field === "christologyScore")).toBe(false);
    expect(issues.some((i) => i.field === "biblicalHealthScore")).toBe(true);
  });
});

describe("normalizeEnums — normalização explícita e registrada", () => {
  it("valor canônico não gera normalização", () => {
    const { normalizations } = normalizeEnums({ critic_target: "legalismo" });
    expect(normalizations).toHaveLength(0);
  });

  it("caixa/acento/espaço são normalizados com registro", () => {
    const { value, normalizations } = normalizeEnums({ critic_target: "Hipocrisia Religiosa" });
    expect((value as Record<string, unknown>).critic_target).toBe("hipocrisia_religiosa");
    expect(normalizations).toHaveLength(1);
    expect(normalizations[0].received).toBe("Hipocrisia Religiosa");
  });

  it("alias conhecido mapeia para categoria canônica", () => {
    const { value, normalizations } = normalizeEnums({ critic_target: "farisaismo" });
    expect((value as Record<string, unknown>).critic_target).toBe("hipocrisia_religiosa");
    expect(normalizations[0].reason).toBe("alias conhecido");
  });

  it("categoria desconhecida cai no fallback COM valor original preservado (não expande o catálogo)", () => {
    const { value, normalizations } = normalizeEnums({ critic_target: "categoria_inventada_xyz" });
    expect((value as Record<string, unknown>).critic_target).toBe("outro");
    expect(normalizations[0].received).toBe("categoria_inventada_xyz");
    expect(normalizations[0].reason).toBe("categoria não canônica");
  });

  it("hipocrisia_religiosa agora é canônica (caso real observado)", () => {
    const { normalizations } = normalizeEnums({ critic_target: "hipocrisia_religiosa" });
    expect(normalizations).toHaveLength(0);
  });
});

describe("applyConditionalApplicability — §6.1 (incoerência ≠ falha técnica)", () => {
  it("crítica 0 com reconstrução 4 → reviewTrigger (não error)", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({ scores: { contextualCritiqueIntensityScore: 0, reconstructionAfterCritiqueScore: 4 } })
    );
    const r = applyConditionalApplicability(parsed);
    expect(r.errors).toHaveLength(0);
    expect(r.reviewTriggers.some((t) => t.field === "reconstructionAfterCritiqueScore")).toBe(true);
  });

  it("crítica 2 com reconstrução 4 → reviewTrigger de coerência (caso real #03)", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({ scores: { contextualCritiqueIntensityScore: 2, reconstructionAfterCritiqueScore: 4 } })
    );
    const r = applyConditionalApplicability(parsed);
    expect(r.reviewTriggers.some((t) => t.field === "reconstructionAfterCritiqueScore")).toBe(true);
  });

  it("crítica 0 com critic_target preenchido → warning (não bloqueia)", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({ scores: { contextualCritiqueIntensityScore: 0 }, critic_target: "legalismo" })
    );
    const r = applyConditionalApplicability(parsed);
    expect(r.warnings.some((w) => w.field === "critic_target")).toBe(true);
    expect(r.reviewTriggers.filter((t) => t.field === "critic_target")).toHaveLength(0);
  });

  it("crítica alta (4) com reconstrução alta é coerente — nada disparado", () => {
    const parsed = CodingResponseSchema.parse(
      baseResponse({ scores: { contextualCritiqueIntensityScore: 4, reconstructionAfterCritiqueScore: 4 } })
    );
    const r = applyConditionalApplicability(parsed);
    expect(r.reviewTriggers).toHaveLength(0);
  });

  it("scores nulos não disparam nada", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ scores: {} }));
    const r = applyConditionalApplicability(parsed);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
    expect(r.reviewTriggers).toHaveLength(0);
  });
});

describe("computeNeedsReview", () => {
  it("sensibilidade alta dispara revisão humana", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ sensitivity_level: "alta" }));
    expect(computeNeedsReview(parsed).needs).toBe(true);
  });
  it("caso neutro não dispara revisão", () => {
    const parsed = CodingResponseSchema.parse(baseResponse({ confianca: "alta" }));
    expect(computeNeedsReview(parsed).needs).toBe(false);
  });
});
