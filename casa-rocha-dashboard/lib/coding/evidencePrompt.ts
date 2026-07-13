// Etapa D — extração DIRECIONADA de evidências (§7 do blueprint).
// Ocorre DEPOIS da pontuação: recebe apenas os campos que exigem evidência
// (score ≥ limiar; agregados NUNCA entram) e devolve citações literais
// contínuas. Lotes de no máximo 8 campos por chamada (custo, ajuste 11).
import { z } from "zod";
import type { EnumNormalization } from "./schema";
import { EVIDENCE_PROMPT_VERSION } from "./versions";

export interface FieldNeedingEvidence {
  field: string;
  label: string;
  score: number;
  familyLabel: string;
  rubricHint?: string;
}

export const EVIDENCE_BATCH_SIZE = 8;

export function batchFields<T>(fields: T[], size = EVIDENCE_BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < fields.length; i += size) batches.push(fields.slice(i, i + size));
  return batches;
}

const EvidenceResponseSchema = z.object({
  evidences: z
    .array(
      z.object({
        field: z.string(),
        quote: z.string().min(10),
        reason: z.string().optional().default(""),
      })
    )
    .default([]),
  fieldsWithoutEvidence: z.array(z.string()).default([]),
});

export type EvidenceResponse = z.infer<typeof EvidenceResponseSchema>;

export function parseEvidenceResponse(raw: unknown):
  | { success: true; data: EvidenceResponse; normalizations: EnumNormalization[] }
  | { success: false; issues: string[]; normalizations: EnumNormalization[] } {
  const res = EvidenceResponseSchema.safeParse(raw);
  if (!res.success) {
    return {
      success: false,
      issues: res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      normalizations: [],
    };
  }
  return { success: true, data: res.data, normalizations: [] };
}

export function buildEvidencePrompt(input: {
  title: string;
  transcriptText: string;
  fields: FieldNeedingEvidence[];
}): { system: string; user: string; version: string } {
  const fieldList = input.fields
    .map(
      (f) =>
        `- "${f.field}" (${f.label}) — score atribuído: ${f.score} · família: ${f.familyLabel}${f.rubricHint ? ` · o trecho deve provar: ${f.rubricHint}` : ""}`
    )
    .join("\n");

  const system = `Você é um verificador de evidências textuais num estudo de análise de pregações. Os scores JÁ FORAM atribuídos numa etapa anterior; sua ÚNICA tarefa é localizar, para cada campo listado, trechos LITERAIS da transcrição que sustentem o score dado. Você NÃO reavalia nem altera scores.

REGRAS DE CITAÇÃO (invioláveis):
- cada citação é UM trecho CONTÍNUO da transcrição: copie exatamente o texto, incluindo erros de transcrição, gramática e pontuação — NUNCA corrija nada;
- NUNCA use "[...]", "[…]" ou qualquer marcador para unir passagens: duas passagens diferentes = DOIS objetos separados no array;
- aproximadamente 12–80 palavras por citação;
- múltiplas evidências para o MESMO campo são permitidas e bem-vindas (uma por trecho);
- NÃO parafraseie referência bíblica em vez de citar a fala real do pregador;
- NÃO use comentário/resumo como substituto de citação;
- se NÃO existir trecho literal que sustente um campo, liste-o em "fieldsWithoutEvidence" — NUNCA invente nem "aproxime" uma citação. Admitir ausência é a resposta correta.

Exemplo INCORRETO: { "quote": "primeiro trecho [...] segundo trecho" }
Exemplo CORRETO: dois objetos, um com "primeiro trecho contínuo", outro com "segundo trecho contínuo".

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido (sem markdown):
{
  "evidences": [ { "field": "<campo>", "quote": "trecho literal contínuo", "reason": "por que sustenta o score" } ],
  "fieldsWithoutEvidence": ["<campo sem trecho literal>"]
}`;

  const user = `PREGAÇÃO: ${input.title}

CAMPOS QUE PRECISAM DE EVIDÊNCIA LITERAL:
${fieldList}

TRANSCRIÇÃO COMPLETA:
${input.transcriptText}`;

  return { system, user, version: EVIDENCE_PROMPT_VERSION };
}
