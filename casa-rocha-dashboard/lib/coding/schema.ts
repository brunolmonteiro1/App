// Schema Zod da resposta da IA (PIPELINE.md §4): valida ANTES de salvar.
import { z } from "zod";
import { ONTOLOGICAL_VALUES, SCORE_FIELD_NAMES, SERMON_TYPES } from "./score-fields";

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

// Regras além do shape: campos de score conhecidos; todo score >=4 tem evidência do campo.
export function validateBusinessRules(resp: CodingResponse): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const known = new Set(SCORE_FIELD_NAMES);
  const evidenceFields = new Set(resp.evidencias.map((e) => e.campo));

  for (const [field, value] of Object.entries(resp.scores)) {
    if (!known.has(field)) {
      issues.push({ field, message: `campo de score desconhecido: ${field}` });
      continue;
    }
    if (value !== null && value >= 4 && !evidenceFields.has(field)) {
      issues.push({ field, message: `score ${value} exige evidência textual (nenhuma fornecida para ${field})` });
    }
  }
  for (const e of resp.evidencias) {
    if (!known.has(e.campo)) {
      issues.push({ field: e.campo, message: `evidência aponta para campo desconhecido: ${e.campo}` });
    }
  }
  return issues;
}
