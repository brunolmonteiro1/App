// Etapa A — reconstrução integral da pregação como discurso fluido (§5-A).
// NÃO atribui scores teológicos nem exige evidências em massa: o objetivo é
// reconstruir o sermão como efetivamente aconteceu (planejado, narrativo,
// recursivo, espontâneo, não linear) sem impor modelo homilético artificial.
import { z } from "zod";
import { foldEnumValue, type EnumNormalization } from "./schema";
import { STRUCTURE_PROMPT_VERSION } from "./versions";

// ── Enums canônicos da estrutura ─────────────────────────────────────────────
export const UNIT_FUNCTIONS = [
  "opening", "scripture_reading", "exposition", "lexical_explanation",
  "theological_development", "argument", "illustration", "testimony",
  "pastoral_comment", "criticism", "application", "warning", "prayer",
  "appeal", "transition", "synthesis", "conclusion", "digression",
  "emerging_insight", "return_to_thesis", "other",
] as const;

export const RELATIONS_TO_PREVIOUS = [
  "start", "develops", "deepens", "contrasts", "illustrates", "supports",
  "interrupts", "temporarily_deviates", "returns", "reformulates", "applies",
  "concludes", "opens_new_line",
] as const;

export const RELATIONS_TO_THESIS = [
  "introduces", "supports", "develops", "applies", "complicates", "deviates",
  "returns", "concludes", "unrelated",
] as const;

// Ajuste 9: NÃO usar "apparently_planned" — a transcrição raramente prova
// preparação prévia. "Declarado" exige fala explícita do pregador; o resto é
// inferência estrutural ou emergência discursiva, nunca estado mental.
export const PERCEIVED_ORIGINS = [
  "explicitly_declared_structure",
  "structurally_inferred",
  "explicitly_presented_as_spontaneous",
  "discourse_emergent",
  "not_identifiable",
] as const;

export const INTEGRATION_QUALITIES = [
  "strong", "moderate", "lateral_but_useful", "weak", "not_identifiable",
] as const;

export const THREAD_TYPES = ["main", "secondary", "pastoral", "theological", "rhetorical"] as const;

export const EMERGENT_TYPES = [
  "emerging_insight", "pastoral_insertion", "spontaneous_application",
  "unexpected_scriptural_connection", "contextual_comment", "other",
] as const;

export const EMERGENT_INTEGRATIONS = ["strong", "moderate", "weak", "changes_direction", "not_identifiable"] as const;

export const CLIMAX_TYPES = ["theological", "emotional", "pastoral", "rhetorical", "practical"] as const;

export const ARC_TYPES = [
  "linear_expository", "narrative", "circular", "recursive", "theological_mosaic",
  "dialogical", "contemplative", "prophetic_associative", "pastoral_emergent", "hybrid",
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

// ── Schema tolerante com normalização REGISTRADA ────────────────────────────
// Enum desconhecido não derruba a etapa: cai no fallback com log (ajuste 13);
// rejeição dura só por shape estrutural impossível (sem tese ou sem unidades).
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

function buildSchema(log: EnumNormalization[]) {
  return z.object({
    declaredStructure: z
      .object({
        exists: z.boolean().catch(false),
        description: z.string().nullable().catch(null),
        evidenceQuote: z.string().nullable().catch(null),
      })
      .catch({ exists: false, description: null, evidenceQuote: null }),
    mainThesis: z.object({
      description: z.string().min(3),
      confidence: tolerant(CONFIDENCE_LEVELS, "low", log, "mainThesis.confidence"),
    }),
    governingQuestion: z.string().nullable().catch(null),
    threads: z
      .array(
        z.object({
          id: z.string(),
          type: tolerant(THREAD_TYPES, "secondary", log, "threads.type"),
          theme: z.string().catch(""),
          opening: z.string().catch(""),
          development: z.string().catch(""),
          resolution: z.string().nullable().catch(null),
          resolved: z.boolean().catch(false),
        })
      )
      .catch([]),
    discourseUnits: z
      .array(
        z.object({
          order: z.number().int(),
          descriptiveTitle: z.string().catch(""),
          summary: z.string().catch(""),
          function: tolerant(UNIT_FUNCTIONS, "other", log, "discourseUnits.function"),
          associatedThreads: z.array(z.string()).catch([]),
          scriptureReferences: z.array(z.string()).catch([]),
          relationToPrevious: tolerant(RELATIONS_TO_PREVIOUS, "develops", log, "discourseUnits.relationToPrevious"),
          relationToMainThesis: tolerant(RELATIONS_TO_THESIS, "supports", log, "discourseUnits.relationToMainThesis"),
          perceivedOrigin: tolerant(PERCEIVED_ORIGINS, "not_identifiable", log, "discourseUnits.perceivedOrigin"),
          spontaneityEvidence: z.string().nullable().catch(null),
          integrationQuality: tolerant(INTEGRATION_QUALITIES, "not_identifiable", log, "discourseUnits.integrationQuality"),
          startAnchor: z.string().catch(""),
          endAnchor: z.string().catch(""),
        })
      )
      .min(1, "a pregação precisa de ao menos uma unidade discursiva"),
    emergentMovements: z
      .array(
        z.object({
          type: tolerant(EMERGENT_TYPES, "other", log, "emergentMovements.type"),
          description: z.string().catch(""),
          integrationWithMainThesis: tolerant(EMERGENT_INTEGRATIONS, "not_identifiable", log, "emergentMovements.integrationWithMainThesis"),
          evidenceQuote: z.string().nullable().catch(null),
        })
      )
      .catch([]),
    returnsAndResumptions: z
      .array(
        z.object({
          threadId: z.string().catch(""),
          openedAtUnit: z.number().int().catch(0),
          returnedAtUnit: z.number().int().catch(0),
          functionOfReturn: z.string().catch(""),
        })
      )
      .catch([]),
    unresolvedLines: z
      .array(
        z.object({
          description: z.string().catch(""),
          openedAtUnit: z.number().int().catch(0),
          reason: z.string().catch(""),
        })
      )
      .catch([]),
    climaxes: z
      .array(
        z.object({
          type: tolerant(CLIMAX_TYPES, "theological", log, "climaxes.type"),
          unitOrder: z.number().int().catch(0),
          description: z.string().catch(""),
        })
      )
      .catch([]),
    conclusion: z
      .object({
        summary: z.string().catch(""),
        finalAppeal: z.string().nullable().catch(null),
        relationToOpening: z.string().catch(""),
        relationToThesis: z.string().catch(""),
        newContentIntroducedAtEnd: z.boolean().catch(false),
      })
      .catch({ summary: "", finalAppeal: null, relationToOpening: "", relationToThesis: "", newContentIntroducedAtEnd: false }),
    globalArc: z.object({
      type: tolerant(ARC_TYPES, "hybrid", log, "globalArc.type"),
      description: z.string().catch(""),
    }),
    openingClosureRelation: z
      .object({
        openingQuestion: z.string().nullable().catch(null),
        finalAnswer: z.string().nullable().catch(null),
        resolved: z.boolean().catch(false),
        comment: z.string().catch(""),
      })
      .catch({ openingQuestion: null, finalAnswer: null, resolved: false, comment: "" }),
  });
}

export type StructureResponse = z.infer<ReturnType<typeof buildSchema>>;

export function parseStructureResponse(raw: unknown):
  | { success: true; data: StructureResponse; normalizations: EnumNormalization[] }
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

// Mapa estrutural COMPACTO (1 linha por unidade) para as etapas seguintes —
// evita reenviar o JSON integral (estratégia de custo, ajuste 11).
export function compactStructureMap(s: StructureResponse): string {
  const lines = [
    `TESE: ${s.mainThesis.description}`,
    s.governingQuestion ? `PERGUNTA GOVERNANTE: ${s.governingQuestion}` : null,
    `ARCO GLOBAL: ${s.globalArc.type} — ${s.globalArc.description}`,
    `FIOS: ${s.threads.map((t) => `${t.id}(${t.type}: ${t.theme}${t.resolved ? ", resolvido" : ", em aberto"})`).join("; ") || "—"}`,
    "UNIDADES:",
    ...s.discourseUnits.map(
      (u) =>
        `  ${u.order}. [${u.function}] ${u.descriptiveTitle} — ${u.summary.slice(0, 140)}` +
        (u.scriptureReferences.length ? ` (refs: ${u.scriptureReferences.join(", ")})` : "")
    ),
    `CONCLUSÃO: ${s.conclusion.summary.slice(0, 200)}`,
  ];
  return lines.filter(Boolean).join("\n");
}

// ── Prompt ───────────────────────────────────────────────────────────────────
export function buildStructurePrompt(sermon: {
  title: string;
  series: string | null;
  year: number | null;
  transcriptText: string;
}): { system: string; user: string; version: string } {
  const system = `Você é um pesquisador de homilética empírica e análise do discurso, reconstruindo a arquitetura REAL de uma pregação da igreja A Casa da Rocha a partir da transcrição completa. Esta é a ETAPA DE ESTRUTURA de um pipeline: aqui você NÃO atribui scores teológicos e NÃO julga qualidade — apenas reconstrói o que aconteceu no discurso.

REGRAS INEGOCIÁVEIS:
- analise o sermão REALIZADO, não um esboço presumido;
- NÃO imponha três pontos, três premissas nem sequência linear: identifique quantas unidades discursivas forem necessárias, na ordem em que ocorrem;
- uma pregação pode ser linear, narrativa, circular, recursiva, mosaico teológico, dialógica, contemplativa, associativa ou híbrida — descreva a forma real;
- NÃO chame automaticamente todo desvio de falha: diferencie digressão integrada (volta e serve à tese) de digressão sem integração;
- NÃO atribua ação divina invisível nem estado mental do pregador. "Estrutura declarada" exige fala explícita ("preparei três pontos", "meu esboço hoje"); sem isso, use inferência estrutural ("structurally_inferred") ou emergência discursiva ("discourse_emergent"). Espontaneidade só quando o próprio pregador apresenta assim ("explicitly_presented_as_spontaneous", cite a fala em spontaneityEvidence);
- não invente conteúdo: tudo deve ser derivável da transcrição;
- startAnchor e endAnchor de cada unidade: copie um trecho LITERAL CURTO (5-15 palavras) do INÍCIO e do FIM da unidade, exatamente como está na transcrição (serão localizados automaticamente; não parafraseie);
- threads (fios condutores): temas que atravessam a pregação; registre onde abrem, como se desenvolvem e se são resolvidos;
- registre movimentos emergentes (insights, inserções pastorais, aplicações espontâneas, conexões inesperadas) e como se integram à tese;
- registre retomadas (fio aberto numa unidade e retomado noutra), linhas não resolvidas e clímax (pode haver vários ou nenhum);
- a conclusão pode não ser formal: descreva a relação real entre abertura e fechamento.

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido (sem markdown), com esta estrutura:
{
  "declaredStructure": { "exists": boolean, "description": string | null, "evidenceQuote": string | null },
  "mainThesis": { "description": string, "confidence": "high|medium|low" },
  "governingQuestion": string | null,
  "threads": [ { "id": "t1", "type": "main|secondary|pastoral|theological|rhetorical", "theme": string, "opening": string, "development": string, "resolution": string | null, "resolved": boolean } ],
  "discourseUnits": [ {
    "order": number,
    "descriptiveTitle": string,
    "summary": string,
    "function": "${UNIT_FUNCTIONS.join("|")}",
    "associatedThreads": ["t1"],
    "scriptureReferences": ["Gênesis 2:16-17"],
    "relationToPrevious": "${RELATIONS_TO_PREVIOUS.join("|")}",
    "relationToMainThesis": "${RELATIONS_TO_THESIS.join("|")}",
    "perceivedOrigin": "${PERCEIVED_ORIGINS.join("|")}",
    "spontaneityEvidence": string | null,
    "integrationQuality": "${INTEGRATION_QUALITIES.join("|")}",
    "startAnchor": "trecho literal curto do início",
    "endAnchor": "trecho literal curto do fim"
  } ],
  "emergentMovements": [ { "type": "${EMERGENT_TYPES.join("|")}", "description": string, "integrationWithMainThesis": "${EMERGENT_INTEGRATIONS.join("|")}", "evidenceQuote": string | null } ],
  "returnsAndResumptions": [ { "threadId": "t1", "openedAtUnit": number, "returnedAtUnit": number, "functionOfReturn": string } ],
  "unresolvedLines": [ { "description": string, "openedAtUnit": number, "reason": string } ],
  "climaxes": [ { "type": "${CLIMAX_TYPES.join("|")}", "unitOrder": number, "description": string } ],
  "conclusion": { "summary": string, "finalAppeal": string | null, "relationToOpening": string, "relationToThesis": string, "newContentIntroducedAtEnd": boolean },
  "globalArc": { "type": "${ARC_TYPES.join("|")}", "description": string },
  "openingClosureRelation": { "openingQuestion": string | null, "finalAnswer": string | null, "resolved": boolean, "comment": string }
}`;

  const user = `PREGAÇÃO A RECONSTRUIR
Título: ${sermon.title}
Série: ${sermon.series ?? "não identificada"}
Ano: ${sermon.year ?? "não identificado"}

TRANSCRIÇÃO COMPLETA:
${sermon.transcriptText}`;

  return { system, user, version: STRUCTURE_PROMPT_VERSION };
}
