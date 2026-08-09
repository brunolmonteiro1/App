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

// ── Normalização explícita de enums (nunca silenciosa) ──────────────────────
// O `.catch()` do Zod continua como última rede de segurança, mas a normalização
// registrada abaixo roda ANTES do parse e preserva o valor original recebido.
export interface EnumNormalization {
  field: string;
  received: string;
  normalized: string;
  reason: string;
}

// Aliases conhecidos (chaves já em forma canônica: minúsculas, sem acento, _).
const ENUM_ALIASES: Record<string, string> = {
  hipocrisia: "hipocrisia_religiosa",
  religious_hypocrisy: "hipocrisia_religiosa",
  performatividade: "performatividade_religiosa",
  espiritualizacao: "espiritualizacao_abusiva",
  farisaismo: "hipocrisia_religiosa",
  prosperidade: "mercado_gospel",
  teologia_da_prosperidade: "mercado_gospel",
};

const ENUM_FIELD_SPECS: { key: string; allowed: readonly string[]; fallback: string }[] = [
  { key: "tipo_de_pregacao", allowed: SERMON_TYPES, fallback: "hibrida" },
  { key: "ontological_vs_pragmatic", allowed: ONTOLOGICAL_VALUES, fallback: "nao_identificavel" },
  { key: "application_mode", allowed: APPLICATION_MODES, fallback: "not_identifiable" },
  { key: "discourse_mode", allowed: DISCOURSE_MODES, fallback: "mixed" },
  { key: "critique_share_estimate", allowed: CRITIQUE_SHARE, fallback: "none" },
  { key: "critic_target", allowed: CRITIC_TARGETS, fallback: "outro" },
  { key: "critic_tone", allowed: CRITIC_TONES, fallback: "nao_identificavel" },
  { key: "healthy_or_demobilizing_critique", allowed: CRITIQUE_HEALTH, fallback: "not_identifiable" },
  { key: "political_critique_target", allowed: POLITICAL_TARGETS, fallback: "outro" },
  { key: "sensitivity_level", allowed: SENSITIVITY_LEVELS, fallback: "baixa" },
];

export function foldEnumValue(v: string): string {
  return v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
}

// Normaliza os campos de enum do JSON bruto, registrando cada mudança.
// Valores desconhecidos NÃO expandem o catálogo: caem no fallback com o valor
// original preservado no registro (auditável em validationIssuesJson).
export function normalizeEnums(raw: unknown): { value: unknown; normalizations: EnumNormalization[] } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { value: raw, normalizations: [] };
  }
  const obj: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  const normalizations: EnumNormalization[] = [];
  for (const spec of ENUM_FIELD_SPECS) {
    const v = obj[spec.key];
    if (typeof v !== "string" || spec.allowed.includes(v)) continue;
    const folded = foldEnumValue(v);
    let normalized: string;
    let reason: string;
    if (spec.allowed.includes(folded)) {
      normalized = folded;
      reason = "normalização de formato (caixa/acento/espaço)";
    } else if (ENUM_ALIASES[folded] && spec.allowed.includes(ENUM_ALIASES[folded])) {
      normalized = ENUM_ALIASES[folded];
      reason = "alias conhecido";
    } else {
      normalized = spec.fallback;
      reason = "categoria não canônica";
    }
    obj[spec.key] = normalized;
    normalizations.push({ field: spec.key, received: v, normalized, reason });
  }
  return { value: obj, normalizations };
}

// ── Aplicabilidade condicional e severidade (§6.1) ──────────────────────────
// Incoerência semântica NÃO é falha técnica: errors bloqueiam gravação,
// warnings são registrados, reviewTriggers marcam revisão humana obrigatória.
// Nenhum score é alterado aqui.
export interface StageValidation {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  reviewTriggers: ValidationIssue[];
}

const CRITIQUE_DEPENDENT_FIELDS = [
  "biblicalGroundingOfCritiqueScore",
  "reconstructionAfterCritiqueScore",
  "activationAfterCritiqueScore",
];

export function applyConditionalApplicability(resp: CodingResponse): StageValidation {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const reviewTriggers: ValidationIssue[] = [];
  const s = resp.scores;
  const intensity = s["contextualCritiqueIntensityScore"];

  if (intensity === 0) {
    for (const f of CRITIQUE_DEPENDENT_FIELDS) {
      const v = s[f];
      if (v != null && v > 0) {
        reviewTriggers.push({
          field: f,
          message: `crítica contextual = 0, mas ${f}=${v} — campo dependente deveria ser null/0 (coerência a revisar)`,
        });
      }
    }
    if (resp.critic_target !== "nao_identificavel") {
      warnings.push({ field: "critic_target", message: `crítica contextual = 0, mas critic_target="${resp.critic_target}"` });
    }
    if (resp.critic_tone !== "nao_identificavel") {
      warnings.push({ field: "critic_tone", message: `crítica contextual = 0, mas critic_tone="${resp.critic_tone}"` });
    }
  } else if (intensity != null && intensity <= 2) {
    const rec = s["reconstructionAfterCritiqueScore"];
    if (rec != null && rec >= 4) {
      reviewTriggers.push({
        field: "reconstructionAfterCritiqueScore",
        message: `crítica contextual baixa (${intensity}) com reconstrução após crítica alta (${rec}) — combinação incoerente; requer revisão humana`,
      });
    }
    const act = s["activationAfterCritiqueScore"];
    if (act != null && act >= 4) {
      reviewTriggers.push({
        field: "activationAfterCritiqueScore",
        message: `crítica contextual baixa (${intensity}) com ativação após crítica alta (${act}) — combinação incoerente; requer revisão humana`,
      });
    }
  }
  return { errors, warnings, reviewTriggers };
}

// Regras além do shape: campos de score conhecidos; evidência obrigatória a partir
// do limiar (score>=4 geral, ou limiar mais baixo para riscos — §16.1).
// Quando `locatedFields` é fornecido (pós-localização), só evidência REALMENTE
// localizada na transcrição satisfaz a regra — citação fabricada não conta.
export function validateBusinessRules(resp: CodingResponse, locatedFields?: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const known = new Set(SCORE_FIELD_NAMES);
  const evidenceFields = locatedFields ?? new Set(resp.evidencias.map((e) => e.campo));
  const suffix = locatedFields ? " localizada na transcrição" : "";

  for (const [field, value] of Object.entries(resp.scores)) {
    if (!known.has(field)) {
      issues.push({ field, message: `campo de score desconhecido: ${field}` });
      continue;
    }
    if (value === null) continue;
    const threshold = RISK_EVIDENCE_THRESHOLDS[field] ?? 4;
    if (value < threshold) continue;

    // Campos AGREGADOS de eixo (ortodoxia, saúde bíblica geral…) são sínteses:
    // nunca têm evidência própria (é sempre descartada); ficam fundamentados
    // apenas quando alguma categoria ESPECÍFICA do mesmo eixo tem evidência.
    if (AGGREGATE_SCORE_FIELDS.has(field)) {
      const supported = axisComponentFields(field).some((c) => evidenceFields.has(c));
      if (!supported) {
        issues.push({
          field,
          message: `agregado ${field}=${value} sem evidência${suffix} em nenhuma categoria do eixo — codifique ao menos uma categoria específica com citação`,
        });
      }
      continue;
    }

    if (!evidenceFields.has(field)) {
      issues.push({
        field,
        message: `score ${value} em ${field} exige evidência textual${suffix} (limiar ${threshold}) — nenhuma ${locatedFields ? "localizada" : "fornecida"}`,
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
