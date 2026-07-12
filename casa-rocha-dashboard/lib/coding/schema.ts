// Schema Zod da resposta da IA (PIPELINE.md §4): valida ANTES de salvar.
import { z } from "zod";
import {
  AGGREGATE_SCORE_FIELDS,
  APPLICATION_MODES,
  axisComponentFields,
  CRITIC_TARGETS,
  CRITIC_TONES,
  CRITIQUE_HEALTH,
  CRITIQUE_SHARE,
  DISCOURSE_MODES,
  ONTOLOGICAL_VALUES,
  POLITICAL_TARGETS,
  RISK_EVIDENCE_THRESHOLDS,
  SCORE_FIELD_NAMES,
  SENSITIVITY_LEVELS,
  SERMON_TYPES,
} from "./score-fields";

const score = z.number().int().min(0).max(5).nullable();

export const EvidenceSchema = z.object({
  campo: z.string(),
  citacao: z.string().min(10, "citação curta demais"),
  comentario: z.string().optional().default(""),
});

export const CodingResponseSchema = z.object({
  texto_biblico_principal: z.string().nullable().default(null),
  tipo_de_pregacao: z.enum(SERMON_TYPES).catch("hibrida"),
  tema_central: z.string().min(3),
  temas_secundarios: z.array(z.string()).default([]),
  doutrina_principal: z.string().nullable().default(null),
  ontological_vs_pragmatic: z.enum(ONTOLOGICAL_VALUES).catch("nao_identificavel"),
  // Campos categóricos contextuais novos (BLUEPRINT v2 §12) — tolerantes (catch)
  application_mode: z.enum(APPLICATION_MODES).catch("not_identifiable"),
  discourse_mode: z.enum(DISCOURSE_MODES).catch("mixed"),
  critique_share_estimate: z.enum(CRITIQUE_SHARE).catch("none"),
  critic_target: z.enum(CRITIC_TARGETS).catch("nao_identificavel"),
  critic_tone: z.enum(CRITIC_TONES).catch("nao_identificavel"),
  healthy_or_demobilizing_critique: z.enum(CRITIQUE_HEALTH).catch("not_identifiable"),
  political_critique_target: z.enum(POLITICAL_TARGETS).catch("nao_identificavel"),
  sensitivity_level: z.enum(SENSITIVITY_LEVELS).catch("baixa"),
  resumo_3_linhas: z.string().min(10),
  aplicacao_principal: z.string().nullable().default(null),
  possivel_lacuna_formativa: z.string().nullable().default(null),
  comentario_analitico: z.string().nullable().default(null),
  confianca: z.enum(["alta", "media", "baixa"]).catch("baixa"),
  scores: z.record(z.string(), score),
  evidencias: z.array(EvidenceSchema).default([]),
});

export type CodingResponse = z.infer<typeof CodingResponseSchema>;

export interface ValidationIssue {
  field: string;
  message: string;
}

// Regras além do shape: campos de score conhecidos; evidência obrigatória a partir
// do limiar (score>=4 geral, ou limiar mais baixo para riscos — §16.1).
export function validateBusinessRules(resp: CodingResponse): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const known = new Set(SCORE_FIELD_NAMES);
  const evidenceFields = new Set(resp.evidencias.map((e) => e.campo));

  for (const [field, value] of Object.entries(resp.scores)) {
    if (!known.has(field)) {
      issues.push({ field, message: `campo de score desconhecido: ${field}` });
      continue;
    }
    if (value === null) continue;
    const threshold = RISK_EVIDENCE_THRESHOLDS[field] ?? 4;
    if (value < threshold) continue;

    // Campos AGREGADOS de eixo (ortodoxia, saúde bíblica geral…) são sínteses:
    // não exigem citação própria; ficam fundamentados quando o próprio agregado
    // OU alguma categoria específica do mesmo eixo trouxe evidência (§16.1 adaptado).
    if (AGGREGATE_SCORE_FIELDS.has(field)) {
      const supported =
        evidenceFields.has(field) || axisComponentFields(field).some((c) => evidenceFields.has(c));
      if (!supported) {
        issues.push({
          field,
          message: `agregado ${field}=${value} sem evidência em nenhuma categoria do eixo — codifique ao menos uma categoria específica com citação`,
        });
      }
      continue;
    }

    if (!evidenceFields.has(field)) {
      issues.push({
        field,
        message: `score ${value} em ${field} exige evidência textual (limiar ${threshold}) — nenhuma fornecida`,
      });
    }
  }
  for (const e of resp.evidencias) {
    if (!known.has(e.campo)) {
      issues.push({ field: e.campo, message: `evidência aponta para campo desconhecido: ${e.campo}` });
    }
  }
  return issues;
}

// Gatilhos de revisão humana obrigatória (BLUEPRINT v2 §20.3).
export function computeNeedsReview(resp: CodingResponse): { needs: boolean; reason: string | null } {
  const reasons: string[] = [];
  const s = resp.scores;
  const ge = (f: string, n: number) => (s[f] ?? 0) >= n;
  if (ge("contextualCritiqueIntensityScore", 4)) reasons.push("crítica contextual intensa (≥4)");
  if (resp.healthy_or_demobilizing_critique === "potentially_demobilizing") reasons.push("crítica potencialmente desmobilizadora");
  if (ge("passivityRiskScore", 3)) reasons.push("risco de passividade (≥3)");
  if (ge("cynicismElitismRiskScore", 3)) reasons.push("risco de cinismo/elitismo (≥3)");
  if (ge("politicalIdolatryCritiqueScore", 4)) reasons.push("crítica à idolatria política (≥4)");
  if (resp.confianca === "baixa") reasons.push("confiança global baixa");
  if (resp.sensitivity_level === "alta") reasons.push("sensibilidade alta");
  return { needs: reasons.length > 0, reason: reasons.length ? reasons.join("; ") : null };
}
