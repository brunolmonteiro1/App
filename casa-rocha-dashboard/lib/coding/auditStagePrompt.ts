// Etapa E — auditoria semântica do pipeline multi-etapas (§11 do blueprint).
// Estende a auditoria sob demanda da Rodada G (auditPrompt.ts): aqui a entrada
// NÃO inclui a transcrição integral (custo, ajuste 11) — o auditor recebe as
// análises estruturadas, os scores, as evidências LOCALIZADAS e trechos
// relevantes. NENHUMA correção é aplicada automaticamente: a auditoria só
// relata; incoerência vira revisão humana.
import { z } from "zod";
import { foldEnumValue, type EnumNormalization } from "./schema";
import { AUDIT_STAGE_PROMPT_VERSION } from "./versions";

export const AUDIT_STATUSES = [
  "approved",
  "approved_with_warnings",
  "needs_adjustment",
  "human_review_required",
  "rejected",
] as const;

function tolerant<const T extends readonly [string, ...string[]]>(
  allowed: T,
  fallback: T[number],
  log: EnumNormalization[],
  field: string
) {
  return z.preprocess((v) => {
    if (typeof v !== "string") return v === undefined ? fallback : v;
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
  }, z.enum(allowed).catch(fallback));
}

function buildSchema(log: EnumNormalization[]) {
  return z.object({
    auditStatus: tolerant(AUDIT_STATUSES, "human_review_required", log, "auditStatus"),
    issues: z
      .array(
        z.object({
          type: z.string().catch(""),
          field: z.string().nullable().catch(null),
          severity: tolerant(["low", "medium", "high"] as const, "medium", log, "issues.severity"),
          description: z.string().catch(""),
        })
      )
      .catch([]),
    suggestedCorrections: z.array(z.unknown()).catch([]),
    needsHumanReview: z.boolean().catch(true),
    reviewReason: z.string().nullable().catch(null),
    confidenceAfterAudit: tolerant(["high", "medium", "low"] as const, "low", log, "confidenceAfterAudit"),
  });
}

export type AuditStageResponse = z.infer<ReturnType<typeof buildSchema>>;

export function parseAuditStageResponse(raw: unknown):
  | { success: true; data: AuditStageResponse; normalizations: EnumNormalization[] }
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

export function buildAuditStagePrompt(input: {
  title: string;
  structureMap: string;
  interpretationSummary: string;
  categoricalJson: string; // campos categóricos + scores (JSON compacto)
  scoreMetadataJson: string;
  locatedEvidence: { field: string; score: number | null; quote: string }[];
  conditionalFindings: string[]; // reviewTriggers/warnings já detectados deterministicamente
}): { system: string; user: string; version: string } {
  const system = `Você é o AUDITOR SEMÂNTICO da codificação de uma pregação (etapa final de um pipeline). Você recebe a estrutura reconstruída, o resumo interpretativo, os scores, as evidências LOCALIZADAS (já verificadas literalmente na transcrição) e os achados determinísticos. Sua tarefa é CONFERIR coerência — você NUNCA recodifica e NENHUMA correção sua é aplicada automaticamente.

VERIFIQUE (§11):
- coerência começo–meio–fim e entre tese e conclusão (use o mapa estrutural);
- aplicação derivada do texto bíblico (não solta);
- score compatível com a análise e com as evidências apresentadas;
- campo contextual aplicável (ex.: reconstrução pós-crítica só se houve crítica relevante);
- menção pontual tratada como centralidade (4/5);
- risco (passividade/cinismo) sustentado por padrão + ausência de contrapeso, não por frase isolada;
- ausência de inferência de intenção/caráter/espiritualidade privada;
- ausência de conclusão global sobre a igreja a partir de UMA pregação;
- lacuna formativa individual não confundida com lacuna do corpus;
- confiança global adequada ao que foi entregue;
- necessidade de revisão humana.

Regras:
- agregados de eixo não têm evidência própria (correto por design) — não os marque por isso;
- issues são observações objetivas, nunca acusações;
- "suggestedCorrections" é apenas sugestão para decisão HUMANA.

FORMATO DE SAÍDA: APENAS JSON válido:
{
  "auditStatus": "${AUDIT_STATUSES.join("|")}",
  "issues": [ { "type": string, "field": string | null, "severity": "low|medium|high", "description": string } ],
  "suggestedCorrections": [],
  "needsHumanReview": boolean,
  "reviewReason": string | null,
  "confidenceAfterAudit": "high|medium|low"
}`;

  const user = [
    `PREGAÇÃO: ${input.title}`,
    "",
    "MAPA ESTRUTURAL (Etapa A):",
    input.structureMap,
    "",
    "RESUMO INTERPRETATIVO (Etapa B):",
    input.interpretationSummary,
    "",
    "CODIFICAÇÃO (campos categóricos + scores):",
    input.categoricalJson,
    "",
    "METADADOS DE EVIDÊNCIA POR CAMPO:",
    input.scoreMetadataJson,
    "",
    "EVIDÊNCIAS LOCALIZADAS (verificadas literalmente na transcrição):",
    input.locatedEvidence.length
      ? input.locatedEvidence.map((e) => `- ${e.field} (score ${e.score ?? "?"}): "${e.quote.slice(0, 200)}"`).join("\n")
      : "- nenhuma",
    "",
    "ACHADOS DETERMINÍSTICOS (aplicabilidade condicional / gatilhos):",
    input.conditionalFindings.length ? input.conditionalFindings.map((f) => `- ${f}`).join("\n") : "- nenhum",
  ].join("\n");

  return { system, user, version: AUDIT_STAGE_PROMPT_VERSION };
}
