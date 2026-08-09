// Etapa B — análise hermenêutica (B.1), argumentativa (B.2) e homilética/
// retórica (B.3) do blueprint §5-B. Entrada: transcrição + mapa estrutural
// COMPACTO da Etapa A (não o JSON integral — estratégia de custo, ajuste 11).
// Scores desta etapa são da FAMÍLIA QUALIDADE: null = não aplicável/impossível
// avaliar; 1–5 = muito frágil→exemplar. NUNCA 0 (0 contaminaria médias).
import { z } from "zod";
import { foldEnumValue, type EnumNormalization } from "./schema";
import { INTERPRETATION_PROMPT_VERSION } from "./versions";

export const CONNECTION_TYPES = ["quotation", "thematic", "typological", "doctrinal", "analogy", "association"] as const;
export const STRENGTHS = ["strong", "moderate", "weak"] as const;
export const TYPOLOGY_TYPES = ["typology", "analogy", "allegory", "comparison"] as const;
export const SUPPORT_TYPES = ["biblical", "theological", "experiential", "rhetorical", "assumed"] as const;
export const IMPACTS = ["low", "medium", "high"] as const;
export const RHETORICAL_DEVICES = [
  "humor", "irony", "repetition", "personal_vulnerability", "direct_address",
  "contrast", "storytelling", "hyperbole", "questions", "other",
] as const;
export const AUDIENCE_POSTURES = ["confronted", "welcomed", "instructed", "consoled", "challenged", "sent", "mixed"] as const;

// Score de QUALIDADE: 1–5 ou null (não aplicável). Valor 0 vindo do modelo é
// convertido para null com registro — 0 não existe nesta família (ajuste 3).
function qualityScore(log: EnumNormalization[], field: string) {
  return z.preprocess((v) => {
    if (v === 0) {
      log.push({ field, received: "0", normalized: "null", reason: "família qualidade não tem 0 — convertido para null (não aplicável)" });
      return null;
    }
    return v;
  }, z.number().int().min(1).max(5).nullable().catch(null));
}

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

function assessedQuality(log: EnumNormalization[], field: string) {
  return z
    .object({ assessment: z.string().catch(""), qualityScore: qualityScore(log, field) })
    .catch({ assessment: "", qualityScore: null });
}

function scoredAssessment(log: EnumNormalization[], field: string) {
  return z
    .object({ score: qualityScore(log, field), assessment: z.string().catch("") })
    .catch({ score: null, assessment: "" });
}

function buildSchema(log: EnumNormalization[]) {
  const hermeneutics = z.object({
    primaryTexts: z.array(z.string()).catch([]),
    secondaryTexts: z.array(z.string()).catch([]),
    literaryContext: assessedQuality(log, "hermeneutics.literaryContext"),
    historicalContext: assessedQuality(log, "hermeneutics.historicalContext"),
    authorialIntent: assessedQuality(log, "hermeneutics.authorialIntent"),
    lexicalWork: z
      .array(
        z.object({
          term: z.string(),
          language: z.string().nullable().catch(null),
          functionInSermon: z.string().catch(""),
          appearsResponsible: z.boolean().nullable().catch(null),
        })
      )
      .catch([]),
    intertextualConnections: z
      .array(
        z.object({
          sourceText: z.string().catch(""),
          connectedText: z.string().catch(""),
          connectionType: tolerant(CONNECTION_TYPES, "association", log, "hermeneutics.connectionType"),
          justification: z.string().catch(""),
          strength: tolerant(STRENGTHS, "weak", log, "hermeneutics.connectionStrength"),
        })
      )
      .catch([]),
    typologyAndAnalogy: z
      .array(
        z.object({
          description: z.string().catch(""),
          type: tolerant(TYPOLOGY_TYPES, "comparison", log, "hermeneutics.typologyType"),
          biblicalSupport: z.string().catch(""),
          assessment: z.string().catch(""),
        })
      )
      .catch([]),
    christocentricPath: z
      .object({
        description: z.string().catch(""),
        organicToText: z.boolean().nullable().catch(null),
        assessment: z.string().catch(""),
      })
      .catch({ description: "", organicToText: null, assessment: "" }),
    originalMeaningToCurrentApplication: z
      .object({
        description: z.string().catch(""),
        bridgeQualityScore: qualityScore(log, "hermeneutics.bridgeQualityScore"),
      })
      .catch({ description: "", bridgeQualityScore: null }),
    textSermonAlignment: z
      .object({
        score: qualityScore(log, "hermeneutics.textSermonAlignment"),
        assessment: z.string().catch(""),
        stronglySupportedClaims: z.array(z.string()).catch([]),
        weaklySupportedClaims: z.array(z.string()).catch([]),
      })
      .catch({ score: null, assessment: "", stronglySupportedClaims: [], weaklySupportedClaims: [] }),
  });

  const argumentation = z.object({
    mainClaim: z.string().catch(""),
    premises: z
      .array(
        z.object({
          description: z.string().catch(""),
          supportType: tolerant(SUPPORT_TYPES, "assumed", log, "argumentation.supportType"),
          supportReference: z.string().nullable().catch(null),
        })
      )
      .catch([]),
    inferentialChain: z
      .array(
        z.object({
          from: z.string().catch(""),
          to: z.string().catch(""),
          relation: z.string().catch(""),
          strength: tolerant(STRENGTHS, "weak", log, "argumentation.chainStrength"),
        })
      )
      .catch([]),
    conclusions: z.array(z.string()).catch([]),
    argumentativeLeaps: z
      .array(
        z.object({
          description: z.string().catch(""),
          impact: tolerant(IMPACTS, "low", log, "argumentation.leapImpact"),
        })
      )
      .catch([]),
    internalTensions: z.array(z.string()).catch([]),
    unresolvedQuestions: z.array(z.string()).catch([]),
    coherenceAssessment: z.string().catch(""),
    argumentativeCoherenceScore: qualityScore(log, "argumentation.argumentativeCoherenceScore"),
  });

  const homiletics = z.object({
    sermonType: z.string().catch(""),
    discourseModes: z.array(z.string()).catch([]),
    dynamicUnity: scoredAssessment(log, "homiletics.dynamicUnity"),
    progression: scoredAssessment(log, "homiletics.progression"),
    transitions: scoredAssessment(log, "homiletics.transitions"),
    proportion: scoredAssessment(log, "homiletics.proportion"),
    clarity: scoredAssessment(log, "homiletics.clarity"),
    integrationOfEmergentMovements: scoredAssessment(log, "homiletics.integrationOfEmergentMovements"),
    abilityToResumeThreads: scoredAssessment(log, "homiletics.abilityToResumeThreads"),
    closure: scoredAssessment(log, "homiletics.closure"),
    illustrations: z
      .array(
        z.object({
          description: z.string().catch(""),
          function: z.string().catch(""),
          integration: tolerant(STRENGTHS, "weak", log, "homiletics.illustrationIntegration"),
        })
      )
      .catch([]),
    rhetoricalDevices: z.array(tolerant(RHETORICAL_DEVICES, "other", log, "homiletics.rhetoricalDevices")).catch([]),
    emotionalArc: z
      .object({ description: z.string().catch(""), movements: z.array(z.string()).catch([]) })
      .catch({ description: "", movements: [] }),
    audiencePositioning: z
      .object({
        description: z.string().catch(""),
        dominantPosture: tolerant(AUDIENCE_POSTURES, "mixed", log, "homiletics.dominantPosture"),
      })
      .catch({ description: "", dominantPosture: "mixed" }),
  });

  return z.object({ hermeneutics, argumentation, homiletics });
}

export type InterpretationResponse = z.infer<ReturnType<typeof buildSchema>>;

export function parseInterpretationResponse(raw: unknown):
  | { success: true; data: InterpretationResponse; normalizations: EnumNormalization[] }
  | { success: false; issues: string[]; normalizations: EnumNormalization[] } {
  const log: EnumNormalization[] = [];
  const res = buildSchema(log).safeParse(raw);
  if (!res.success) {
    return {
      success: false,
      issues: res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      normalizations: log,
    };
  }
  return { success: true, data: res.data, normalizations: log };
}

// Resumo compacto da Etapa B para a Etapa C (custo, ajuste 11).
export function compactInterpretationSummary(d: InterpretationResponse): string {
  return [
    `TEXTOS PRINCIPAIS: ${d.hermeneutics.primaryTexts.join("; ") || "—"}`,
    `ALINHAMENTO TEXTO-SERMÃO: ${d.hermeneutics.textSermonAlignment.score ?? "n/a"} — ${d.hermeneutics.textSermonAlignment.assessment.slice(0, 160)}`,
    `CAMINHO CRISTOCÊNTRICO: ${d.hermeneutics.christocentricPath.assessment.slice(0, 160)}`,
    `AFIRMAÇÃO CENTRAL: ${d.argumentation.mainClaim.slice(0, 200)}`,
    `COERÊNCIA ARGUMENTATIVA: ${d.argumentation.argumentativeCoherenceScore ?? "n/a"} — ${d.argumentation.coherenceAssessment.slice(0, 160)}`,
    `SALTOS ARGUMENTATIVOS: ${d.argumentation.argumentativeLeaps.length}`,
    `POSTURA DOMINANTE DA AUDIÊNCIA: ${d.homiletics.audiencePositioning.dominantPosture}`,
    `FECHAMENTO: ${d.homiletics.closure.score ?? "n/a"} — ${d.homiletics.closure.assessment.slice(0, 140)}`,
  ].join("\n");
}

export function buildInterpretationPrompt(input: {
  title: string;
  series: string | null;
  year: number | null;
  transcriptText: string;
  structureMap: string;
}): { system: string; user: string; version: string } {
  const system = `Você é um pesquisador de hermenêutica, retórica e homilética empírica analisando UMA pregação da igreja A Casa da Rocha. Esta é a ETAPA DE INTERPRETAÇÃO de um pipeline: a estrutura do sermão já foi reconstruída (mapa fornecido) — aqui você avalia COMO a pregação interpreta o texto bíblico, constrói argumentos e organiza a comunicação. Você NÃO atribui scores teológicos formativos (etapa posterior) e NÃO exige citações literais em massa (etapa posterior).

REGRAS INEGOCIÁVEIS:
- baseie-se exclusivamente na transcrição e no mapa estrutural; não use conhecimento externo sobre o pregador;
- não infira intenção, caráter ou estado espiritual do pregador;
- a pregação pode operar narrativamente, por recorrência, contraste ou associação — avalie a forma REAL do sermão, sem exigir silogismo explícito; não limite a quantidade de premissas;
- SCORES DE QUALIDADE (todos os campos *score* desta etapa): use null quando for impossível avaliar ou não se aplica (ex.: sermão que não trabalha contexto histórico); 1 = muito frágil · 2 = frágil · 3 = adequado · 4 = forte · 5 = exemplar. NUNCA use 0 — ausência de trabalho hermenêutico não é "qualidade péssima", é null;
- registre saltos argumentativos e tensões internas como observações, não acusações;
- para cada conexão intertextual, tipologia ou analogia, diga o que a sustenta e a força da conexão.

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido (sem markdown) com esta estrutura:
{
  "hermeneutics": {
    "primaryTexts": string[], "secondaryTexts": string[],
    "literaryContext": { "assessment": string, "qualityScore": 1-5 | null },
    "historicalContext": { "assessment": string, "qualityScore": 1-5 | null },
    "authorialIntent": { "assessment": string, "qualityScore": 1-5 | null },
    "lexicalWork": [ { "term": string, "language": string | null, "functionInSermon": string, "appearsResponsible": boolean | null } ],
    "intertextualConnections": [ { "sourceText": string, "connectedText": string, "connectionType": "${CONNECTION_TYPES.join("|")}", "justification": string, "strength": "${STRENGTHS.join("|")}" } ],
    "typologyAndAnalogy": [ { "description": string, "type": "${TYPOLOGY_TYPES.join("|")}", "biblicalSupport": string, "assessment": string } ],
    "christocentricPath": { "description": string, "organicToText": boolean | null, "assessment": string },
    "originalMeaningToCurrentApplication": { "description": string, "bridgeQualityScore": 1-5 | null },
    "textSermonAlignment": { "score": 1-5 | null, "assessment": string, "stronglySupportedClaims": string[], "weaklySupportedClaims": string[] }
  },
  "argumentation": {
    "mainClaim": string,
    "premises": [ { "description": string, "supportType": "${SUPPORT_TYPES.join("|")}", "supportReference": string | null } ],
    "inferentialChain": [ { "from": string, "to": string, "relation": string, "strength": "${STRENGTHS.join("|")}" } ],
    "conclusions": string[],
    "argumentativeLeaps": [ { "description": string, "impact": "${IMPACTS.join("|")}" } ],
    "internalTensions": string[], "unresolvedQuestions": string[],
    "coherenceAssessment": string, "argumentativeCoherenceScore": 1-5 | null
  },
  "homiletics": {
    "sermonType": string, "discourseModes": string[],
    "dynamicUnity": { "score": 1-5 | null, "assessment": string },
    "progression": { "score": 1-5 | null, "assessment": string },
    "transitions": { "score": 1-5 | null, "assessment": string },
    "proportion": { "score": 1-5 | null, "assessment": string },
    "clarity": { "score": 1-5 | null, "assessment": string },
    "integrationOfEmergentMovements": { "score": 1-5 | null, "assessment": string },
    "abilityToResumeThreads": { "score": 1-5 | null, "assessment": string },
    "closure": { "score": 1-5 | null, "assessment": string },
    "illustrations": [ { "description": string, "function": string, "integration": "${STRENGTHS.join("|")}" } ],
    "rhetoricalDevices": ["${RHETORICAL_DEVICES.join('","')}"] (somente os presentes),
    "emotionalArc": { "description": string, "movements": string[] },
    "audiencePositioning": { "description": string, "dominantPosture": "${AUDIENCE_POSTURES.join("|")}" }
  }
}`;

  const user = `PREGAÇÃO A INTERPRETAR
Título: ${input.title}
Série: ${input.series ?? "não identificada"}
Ano: ${input.year ?? "não identificado"}

MAPA ESTRUTURAL (Etapa A):
${input.structureMap}

TRANSCRIÇÃO COMPLETA:
${input.transcriptText}`;

  return { system, user, version: INTERPRETATION_PROMPT_VERSION };
}
