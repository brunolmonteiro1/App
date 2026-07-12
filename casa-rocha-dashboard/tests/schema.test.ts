import { describe, it, expect } from "vitest";
import { CodingResponseSchema, validateBusinessRules, computeNeedsReview } from "@/lib/coding/schema";

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
