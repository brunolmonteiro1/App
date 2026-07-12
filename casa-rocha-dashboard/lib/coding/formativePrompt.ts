// Etapa C — análise teológica, pastoral e formativa (§5-C do blueprint).
// Entrada: transcrição + mapa estrutural (A) + resumo interpretativo (B).
// Produz: campos categóricos contextuais, TODOS os scores 0–5 com régua POR
// FAMÍLIA, resultado formativo (C.1) e lacuna formativa revisada (§13).
// NÃO produz evidências — a extração direcionada é a Etapa D.
import { z } from "zod";
import { baselinePromptSection } from "./baseline";
import { GLOSSARY } from "./glossary";
import { scoreCatalog } from "./prompt";
import {
  CodingResponseSchema,
  foldEnumValue,
  normalizeEnums,
  type CodingResponse,
  type EnumNormalization,
} from "./schema";
import { FAMILY_SEMANTICS, SCORE_FIELDS, type ScoreFamily } from "./score-fields";
import { FORMATIVE_PROMPT_VERSION } from "./versions";

export const FORMATION_MODES = [
  "orthodoxy", "orthopathy", "orthopraxy", "method", "community", "mission", "balanced",
] as const;

export const DISCIPLE_PROFILES = [
  "worshiper", "biblically_formed", "healed_listener", "servant", "missionary",
  "critical_of_system", "community_member", "contemplative", "repentant", "not_identifiable",
] as const;

// §13 — lacuna formativa revisada: "não desenvolvido" ≠ "falha";
// expected_but_not_developed só quando a PRÓPRIA pregação cria a expectativa.
export const COMPLEMENT_STATUSES = [
  "not_applicable", "optional_complement", "expected_but_not_developed",
  "strong_identity_weak_practice", "strong_doctrine_weak_method",
] as const;

function tolerant<const T extends readonly [string, ...string[]]>(
  allowed: T,
  fallback: T[number],
  log: EnumNormalization[],
  field: string
) {
  return z.preprocess((v) => {
    if (typeof v !== "string") return v;
    if ((allowed as readonly string[]).includes(v)) return v;
    const folded = foldEnumValue(v);
    const normalized = (allowed as readonly string[]).includes(folded) ? folded : fallback;
    log.push({
      field,
      received: v,
      normalized,
      reason: normalized === folded ? "normalização de formato (caixa/acento/espaço)" : "categoria não canônica",
    });
    return normalized;
  }, z.enum(allowed));
}

function buildExtraSchema(log: EnumNormalization[]) {
  return z.object({
    formation: z
      .object({
        beliefsFormed: z.array(z.string()).catch([]),
        identityFormed: z.array(z.string()).catch([]),
        affectionsFormed: z.array(z.string()).catch([]),
        practicesCalledFor: z.array(z.string()).catch([]),
        methodsOffered: z.array(z.string()).catch([]),
        communityImplications: z.array(z.string()).catch([]),
        missionImplications: z.array(z.string()).catch([]),
        hopePresented: z.array(z.string()).catch([]),
        dominantFormationMode: tolerant(FORMATION_MODES, "balanced", log, "formation.dominantFormationMode"),
        discipleProfile: z.array(tolerant(DISCIPLE_PROFILES, "not_identifiable", log, "formation.discipleProfile")).catch([]),
      })
      .catch({
        beliefsFormed: [], identityFormed: [], affectionsFormed: [], practicesCalledFor: [],
        methodsOffered: [], communityImplications: [], missionImplications: [], hopePresented: [],
        dominantFormationMode: "balanced", discipleProfile: [],
      }),
    gap_analysis: z
      .object({
        notDevelopedInThisSermon: z.array(z.string()).catch([]),
        formativeComplement: z
          .object({
            status: tolerant(COMPLEMENT_STATUSES, "not_applicable", log, "gap_analysis.formativeComplement.status"),
            theme: z.string().nullable().catch(null),
            reason: z.string().nullable().catch(null),
          })
          .catch({ status: "not_applicable", theme: null, reason: null }),
        corpusHypotheses: z.array(z.string()).catch([]),
      })
      .catch({ notDevelopedInThisSermon: [], formativeComplement: { status: "not_applicable", theme: null, reason: null }, corpusHypotheses: [] }),
  });
}

export type FormativeExtra = z.infer<ReturnType<typeof buildExtraSchema>>;
export type FormativeResponse = CodingResponse & FormativeExtra;

export function parseFormativeResponse(raw: unknown):
  | { success: true; data: FormativeResponse; normalizations: EnumNormalization[] }
  | { success: false; issues: string[]; normalizations: EnumNormalization[] } {
  // Reusa a normalização registrada dos enums categóricos do v1 (schema.ts)
  const { value, normalizations } = normalizeEnums(raw);
  const log: EnumNormalization[] = [...normalizations];
  const base = CodingResponseSchema.safeParse(value);
  const extra = buildExtraSchema(log).safeParse(value);
  if (!base.success || !extra.success) {
    const issues = [
      ...(base.success ? [] : base.error.issues),
      ...(extra.success ? [] : extra.error.issues),
    ].map((i) => `${i.path.join(".")}: ${i.message}`);
    return { success: false, issues, normalizations: log };
  }
  return { success: true, data: { ...base.data, ...extra.data }, normalizations: log };
}

function familyScales(): string {
  const order: ScoreFamily[] = ["presence", "quality", "applicability", "risk", "aggregate"];
  return order
    .map((fam) => {
      const s = FAMILY_SEMANTICS[fam];
      const fields = SCORE_FIELDS.filter((f) => f.family === fam).map((f) => `"${f.field}"`);
      return `• ${s.label.toUpperCase()} — escala: ${s.scale}\n  0 significa: ${s.zeroMeaning} · null significa: ${s.nullMeaning}\n  campos: ${fields.join(", ")}`;
    })
    .join("\n\n");
}

export function buildFormativePrompt(input: {
  title: string;
  series: string | null;
  year: number | null;
  transcriptText: string;
  structureMap: string;
  interpretationSummary: string;
}): { system: string; user: string; version: string } {
  const system = `Você é um pesquisador de teologia pastoral e análise de conteúdo codificando UMA pregação da igreja A Casa da Rocha (pregador Zé Bruno) para um estudo formativo encomendado pelo presbitério. Esta é a ETAPA FORMATIVA de um pipeline: a estrutura (mapa) e a interpretação (resumo) já foram analisadas — aqui você pontua os eixos teológicos e formativos e descreve o resultado formativo. As EVIDÊNCIAS literais serão extraídas numa etapa posterior: NÃO inclua array "evidencias" nesta resposta.

REGRAS INEGOCIÁVEIS:
- não faça julgamento pessoal sobre o pregador; não infira intenção, caráter ou motivação;
- não invente dados; não use conhecimento externo à transcrição;
- não estime percentuais globais nem faça conclusão geral sobre a igreja;
- UMA pregação isolada NÃO representa a dieta inteira: ausência de um tema NESTA mensagem não é lacuna da igreja;
- campo incerto → confiança baixa.

FAMÍLIAS DE SCORE — cada campo pertence a UMA família e usa a escala DELA (não misture):
${familyScales()}

REGRAS DE APLICABILIDADE CONDICIONAL (crítica religiosa contextual):
- se "contextualCritiqueIntensityScore" = 0: use null em biblicalGroundingOfCritiqueScore, reconstructionAfterCritiqueScore e activationAfterCritiqueScore; critic_target e critic_tone = "nao_identificavel"; healthy_or_demobilizing_critique = "not_identifiable";
- se intensidade 1–2 (crítica pontual): reconstructionAfterCritiqueScore deve ser null ou baixo, salvo desenvolvimento explícito; não classifique fortemente como saudável/desmobilizadora;
- se intensidade ≥3: avalie alvo, tom, fundamentação, reconstrução, ativação e saúde da crítica normalmente.
- DISTINÇÃO: "discipleshipReconstructionScore" mede a construção positiva de identidade/maturidade/comunidade na pregação COMO UM TODO; "reconstructionAfterCritiqueScore" mede APENAS a reconstrução que responde a uma crítica religiosa relevante. Uma pregação pode ter alta reconstrução discipular e reconstrução pós-crítica null.

${baselinePromptSection()}

${GLOSSARY}

CAMPOS DE SCORE (use exatamente estes nomes; rubrica por categoria):
${scoreCatalog()}

LACUNA FORMATIVA (regras §13 — "não desenvolvido" NÃO significa "falha"):
- "notDevelopedInThisSermon": temas relevantes simplesmente não desenvolvidos NESTA mensagem (registro neutro de cobertura);
- "formativeComplement.status": use "expected_but_not_developed" SOMENTE quando a própria pregação criar a expectativa (ex.: anuncia aplicação prática e não entrega); "strong_identity_weak_practice"/"strong_doctrine_weak_method" quando o contraste for interno à mensagem; senão "not_applicable" ou "optional_complement";
- "corpusHypotheses": perguntas para verificar no CORPUS depois (ex.: "verificar se mensagens sobre santificação costumam ter identidade forte e método devocional baixo") — nunca conclusões.

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido (sem markdown), com a estrutura do v1 SEM "evidencias", mais "formation" e "gap_analysis":
{
  "texto_biblico_principal": "Livro Cap:Verso" | null,
  "tipo_de_pregacao": "expositiva_sequencial|expositiva_isolada|tematica_biblica|doutrinaria|pastoral_devocional|profetica_confrontativa|evangelistica|institucional_eclesiologica|testemunhal|motivacional_terapeutica|hibrida",
  "tema_central": "…",
  "temas_secundarios": ["…"],
  "doutrina_principal": "…" | null,
  "ontological_vs_pragmatic": "ontologico|equilibrado|pragmatico|nao_identificavel",
  "application_mode": "identity_being|generic_exhortation|concrete_practice|structured_method|balanced|not_identifiable",
  "discourse_mode": "expository|doctrinal|pastoral|therapeutic|prophetic|apologetic|systemic_critique|reconstructive_formative|devotional|mixed",
  "critique_share_estimate": "none|low|moderate|high|dominant",
  "critic_target": "abuso_religioso|legalismo|moralismo|mercado_gospel|barganha_financeira|lideranca_abusiva|institucionalismo|clericalismo|ativismo_religioso|politica_religiosa|idolatria_politica|hipocrisia_religiosa|triunfalismo|performatividade_religiosa|sectarismo|espiritualizacao_abusiva|outro|nao_identificavel",
  "critic_tone": "pastoral|profetico|terapeutico|ironico|combativo|academico|desmobilizador|misto|nao_identificavel",
  "healthy_or_demobilizing_critique": "healthy|potentially_demobilizing|mixed|not_identifiable",
  "political_critique_target": "partidarismo_religioso|messianismo_politico|nacionalismo_religioso|teologia_do_poder|confusao_igreja_estado|idolatria_de_lider_politico|uso_eleitoral_da_fe|outro|nao_identificavel",
  "sensitivity_level": "baixa|media|alta",
  "resumo_3_linhas": "…",
  "aplicacao_principal": "…" | null,
  "possivel_lacuna_formativa": "redigida como hipótese, nunca acusação" | null,
  "comentario_analitico": "…" | null,
  "confianca": "alta|media|baixa",
  "scores": { "<campo>": 0-5 | null, … (todos os campos do catálogo, respeitando a família) },
  "formation": {
    "beliefsFormed": ["o que crer"], "identityFormed": ["quem ser"], "affectionsFormed": ["o que amar"],
    "practicesCalledFor": ["o que fazer"], "methodsOffered": ["como fazer"],
    "communityImplications": ["com quem"], "missionImplications": ["para onde ser enviado"], "hopePresented": ["…"],
    "dominantFormationMode": "${FORMATION_MODES.join("|")}",
    "discipleProfile": ["${DISCIPLE_PROFILES.join('","')}"] (somente os formados por ESTA mensagem)
  },
  "gap_analysis": {
    "notDevelopedInThisSermon": ["…"],
    "formativeComplement": { "status": "${COMPLEMENT_STATUSES.join("|")}", "theme": string | null, "reason": string | null },
    "corpusHypotheses": ["…"]
  }
}`;

  const user = `PREGAÇÃO A CODIFICAR
Título: ${input.title}
Série: ${input.series ?? "não identificada"}
Ano: ${input.year ?? "não identificado"}

MAPA ESTRUTURAL (Etapa A):
${input.structureMap}

RESUMO INTERPRETATIVO (Etapa B):
${input.interpretationSummary}

TRANSCRIÇÃO COMPLETA:
${input.transcriptText}`;

  return { system, user, version: FORMATIVE_PROMPT_VERSION };
}
