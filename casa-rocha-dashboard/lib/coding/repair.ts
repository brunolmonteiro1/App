// Reparo seguro por evidência (BLUEPRINT v2 §18). Fluxos:
//  A) evidências localizadas SEM mudança de score → completa a análise (ai_repair).
//  B) evidência não localizada → mantém a falha; nada é salvo como aprovado.
//  C) IA sugere alteração de score → grava em CodingRepairSuggestion (PENDING), nunca aplica.
// Invariante: nenhum score é alterado automaticamente.
import { z } from "zod";
import { prisma } from "../db";
import { locateEvidence } from "./locate-evidence";
import { chatCompletion, extractJson } from "./openrouter";
import { buildRepairPrompt } from "./repairPrompt";
import { CodingResponseSchema, type CodingResponse } from "./schema";
import { SCORE_FIELD_NAMES } from "./score-fields";
import { PROMPT_VERSION, SCHEMA_VERSION } from "./analyze";

const RepairResponseSchema = z.object({
  evidencias: z
    .array(z.object({ campo: z.string(), citacao: z.string(), comentario: z.string().optional().default("") }))
    .default([]),
  camposSemEvidencia: z.array(z.string()).default([]),
  scoreSuggestions: z
    .array(
      z.object({
        field: z.string(),
        originalScore: z.number().int().nullable().optional(),
        suggestedScore: z.number().int().min(0).max(5).nullable().optional(),
        reason: z.string().optional().default(""),
      })
    )
    .default([]),
});

export interface RepairResult {
  ok: boolean;
  flow: "A_REPAIRED" | "B_GAP" | "ERROR";
  message: string;
  attemptId?: string;
  evidenceSaved?: number;
  suggestionsCreated?: number;
}

// Reconstrói a resposta original a partir do extractedJson da tentativa que falhou.
function parseOriginal(extractedJson: string | null): CodingResponse | null {
  if (!extractedJson) return null;
  try {
    const res = CodingResponseSchema.safeParse(JSON.parse(extractedJson));
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function repairEvidence(attemptId: string, model: string): Promise<RepairResult> {
  const attempt = await prisma.codingAttempt.findUnique({
    where: { id: attemptId },
    include: { sermon: { select: { id: true, transcriptText: true, analysis: { select: { analysisStatus: true } } } } },
  });
  if (!attempt) return { ok: false, flow: "ERROR", message: "tentativa não encontrada" };
  if (attempt.sermon.analysis?.analysisStatus === "reviewed") {
    return { ok: false, flow: "ERROR", message: "pregação já revisada — reparo indisponível" };
  }
  const original = parseOriginal(attempt.extractedJson);
  if (!original) {
    return { ok: false, flow: "ERROR", message: "reparo indisponível: a resposta original não é um JSON de análise válido (recodifique)" };
  }
  const sermonId = attempt.sermonId;
  const transcript = attempt.sermon.transcriptText;

  // Localiza as evidências ORIGINAIS que de fato existem na transcrição.
  const originalLocated: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  for (const ev of original.evidencias) {
    const loc = locateEvidence(transcript, ev.citacao);
    if (loc) originalLocated.push({ campo: ev.campo, citacao: loc.exactQuote, comentario: ev.comentario, startIndex: loc.startIndex, endIndex: loc.endIndex });
  }
  const locatedFields = new Set(originalLocated.map((e) => e.campo));

  // Campos que precisam de evidência: score >=4 sem evidência LOCALIZÁVEL.
  const needing = Object.entries(original.scores)
    .filter(([field, score]) => score !== null && score >= 4 && !locatedFields.has(field))
    .map(([field, score]) => ({ field, score }));

  const recordAttempt = async (status: string, extras: Record<string, unknown>) =>
    prisma.codingAttempt.create({
      data: {
        sermonId,
        parentAttemptId: attemptId,
        attemptType: "EVIDENCE_REPAIR",
        model,
        status,
        promptVersion: PROMPT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        ...extras,
      },
    });

  // 1. Chamar o modelo pedindo apenas evidências
  let repairRaw;
  try {
    const { system, user } = buildRepairPrompt({ transcript, fieldsNeedingEvidence: needing });
    repairRaw = await chatCompletion({ model, system, user });
  } catch (e) {
    await recordAttempt("FAILED_OPENROUTER", { failStage: "reparo: chamada ao provedor" });
    return { ok: false, flow: "ERROR", message: e instanceof Error ? e.message : String(e) };
  }

  let repair;
  try {
    repair = RepairResponseSchema.parse(extractJson(repairRaw.content));
  } catch (e) {
    await recordAttempt("FAILED_SCHEMA", { failStage: "reparo: JSON", rawResponseText: repairRaw.content });
    return { ok: false, flow: "ERROR", message: "resposta de reparo inválida: " + (e instanceof Error ? e.message : String(e)) };
  }

  // 2. Localizar cada evidência candidata na transcrição
  const located: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  const foundFields = new Set<string>();
  for (const ev of repair.evidencias) {
    if (!SCORE_FIELD_NAMES.includes(ev.campo)) continue;
    const loc = locateEvidence(transcript, ev.citacao);
    if (loc) {
      located.push({ campo: ev.campo, citacao: loc.exactQuote, comentario: ev.comentario, startIndex: loc.startIndex, endIndex: loc.endIndex });
      foundFields.add(ev.campo);
    }
  }

  // 3. Sempre registrar sugestões de score como PENDING (fluxo C) — nunca aplicar
  let suggestionsCreated = 0;
  for (const s of repair.scoreSuggestions) {
    if (!SCORE_FIELD_NAMES.includes(s.field)) continue;
    await prisma.codingRepairSuggestion.create({
      data: {
        sermonId,
        codingAttemptId: attemptId,
        scoreField: s.field,
        originalScore: s.originalScore ?? original.scores[s.field] ?? null,
        suggestedScore: s.suggestedScore ?? null,
        suggestionReason: s.reason,
        suggestedByModel: model,
        promptVersion: PROMPT_VERSION,
        status: "PENDING",
      },
    });
    suggestionsCreated++;
  }

  const stillMissing = needing.filter((n) => !foundFields.has(n.field));

  // 4B. Evidência não localizada para algum campo obrigatório → mantém falha
  if (stillMissing.length > 0) {
    await recordAttempt("REPAIRABLE_EVIDENCE_GAP", {
      failStage: "reparo: evidência não localizada",
      rawResponseText: repairRaw.content,
      evidenceValidationJson: JSON.stringify(stillMissing.map((m) => ({ campo: m.field, found: false }))),
    });
    return {
      ok: false,
      flow: "B_GAP",
      message: `A IA não encontrou evidência literal para ${stillMissing.length} campo(s). Nenhum score foi alterado. ${suggestionsCreated ? `Foram criadas ${suggestionsCreated} sugestão(ões) para decisão humana.` : "Revise manualmente ou recodifique."}`,
      suggestionsCreated,
    };
  }

  // 4A. Todas as evidências obrigatórias localizadas SEM mudança de score → completar a análise
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) scoresData[f] = original.scores[f] ?? null;

  // Reaproveita as evidências originais localizáveis + as novas do reparo
  const allEvidence = [...originalLocated, ...located];

  await prisma.$transaction([
    prisma.sermonAnalysis.upsert({
      where: { sermonId },
      create: {
        sermonId, analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), confidenceGlobal: original.confianca,
        biblicalMainText: original.texto_biblico_principal, sermonType: original.tipo_de_pregacao,
        mainTheme: original.tema_central, secondaryThemes: JSON.stringify(original.temas_secundarios),
        doctrineMain: original.doutrina_principal, ontologicalVsPragmatic: original.ontological_vs_pragmatic,
        summary3Lines: original.resumo_3_linhas, mainApplication: original.aplicacao_principal,
        possibleFormativeGap: original.possivel_lacuna_formativa,
      },
      update: {
        analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), reviewStatus: null, reviewedBy: null, reviewedAt: null,
        confidenceGlobal: original.confianca, biblicalMainText: original.texto_biblico_principal,
        sermonType: original.tipo_de_pregacao, mainTheme: original.tema_central,
        secondaryThemes: JSON.stringify(original.temas_secundarios), doctrineMain: original.doutrina_principal,
        ontologicalVsPragmatic: original.ontological_vs_pragmatic, summary3Lines: original.resumo_3_linhas,
        mainApplication: original.aplicacao_principal, possibleFormativeGap: original.possivel_lacuna_formativa,
      },
    }),
    prisma.sermonScores.upsert({ where: { sermonId }, create: { sermonId, ...scoresData }, update: scoresData }),
    prisma.sermonEvidence.deleteMany({ where: { sermonId, analysisMethod: { in: ["ai_coding", "ai_repair"] } } }),
    prisma.sermonEvidence.createMany({
      data: allEvidence.map((ev) => ({
        sermonId, category: ev.campo, scoreField: ev.campo, scoreValue: original.scores[ev.campo] ?? null,
        evidenceQuote: ev.citacao, evidenceStartIndex: ev.startIndex, evidenceEndIndex: ev.endIndex,
        analyticalComment: ev.comentario, analysisMethod: "ai_repair", confidence: original.confianca,
      })),
    }),
  ]);

  const rec = await recordAttempt("SUCCESS", {
    failStage: null,
    rawResponseText: repairRaw.content,
    evidenceValidationJson: JSON.stringify(allEvidence.map((e) => ({ campo: e.campo, found: true }))),
  });

  return {
    ok: true,
    flow: "A_REPAIRED",
    message: `Reparo por evidência concluído: ${located.length} evidência(s) localizada(s). Scores preservados (nenhum foi alterado).`,
    attemptId: rec.id,
    evidenceSaved: allEvidence.length,
    suggestionsCreated,
  };
}
