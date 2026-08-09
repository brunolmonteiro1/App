// Reparo seguro por evidência (BLUEPRINT v2 §18). Fluxos:
//  A) evidências localizadas SEM mudança de score → completa a análise (ai_repair).
//  B) evidência não localizada → mantém a falha; nada é salvo como aprovado.
//  C) IA sugere alteração de score → grava em CodingRepairSuggestion (PENDING), nunca aplica.
// Invariante: nenhum score é alterado automaticamente.
import { z } from "zod";
import { prisma } from "../db";
import { detectCompositeQuote, locateEvidence } from "./locate-evidence";
import { chatCompletion, extractJson } from "./openrouter";
import { buildRepairPrompt } from "./repairPrompt";
import { applyConditionalApplicability, computeNeedsReview, CodingResponseSchema, type CodingResponse } from "./schema";
import {
  AGGREGATE_SCORE_FIELDS,
  applicationModeToOntological,
  axisComponentFields,
  RISK_EVIDENCE_THRESHOLDS,
  SCORE_FIELD_NAMES,
} from "./score-fields";
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
  // Evidência de agregado NUNCA é reaproveitada (descarte incondicional).
  const originalLocated: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  for (const ev of original.evidencias) {
    if (AGGREGATE_SCORE_FIELDS.has(ev.campo)) continue;
    const loc = locateEvidence(transcript, ev.citacao);
    if (loc) originalLocated.push({ campo: ev.campo, citacao: loc.exactQuote, comentario: ev.comentario, startIndex: loc.startIndex, endIndex: loc.endIndex });
  }
  const locatedFields = new Set(originalLocated.map((e) => e.campo));

  // Auditoria de coerência ANTES de caçar evidência (§10): score semanticamente
  // incoerente (ex.: crítica baixa + reconstrução alta) não deve ganhar uma
  // citação "qualquer" — vira sugestão pendente para decisão humana.
  const conditional = applyConditionalApplicability(original);
  const incoherentFields = new Set(conditional.reviewTriggers.map((t) => t.field));

  // Campos que precisam de evidência: score >= limiar (4 geral; 3 para riscos —
  // RISK_EVIDENCE_THRESHOLDS) sem evidência LOCALIZÁVEL. Agregados de eixo não
  // precisam de citação própria — ficam satisfeitos se alguma categoria
  // específica do mesmo eixo já tem evidência localizada.
  const needing = Object.entries(original.scores)
    .filter(([field, score]) => {
      if (score === null) return false;
      const threshold = RISK_EVIDENCE_THRESHOLDS[field] ?? 4;
      if (score < threshold) return false;
      if (locatedFields.has(field)) return false;
      if (AGGREGATE_SCORE_FIELDS.has(field)) {
        return !axisComponentFields(field).some((c) => locatedFields.has(c));
      }
      return true;
    })
    .map(([field, score]) => ({ field, score: score as number }));

  // Separa os incoerentes: não entram na busca de evidência.
  const coherentNeeding = needing.filter((n) => !incoherentFields.has(n.field));
  const incoherentNeeding = needing.filter((n) => incoherentFields.has(n.field));

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

  // 0. Fluxo C antecipado: campos incoerentes viram sugestão PENDING para
  // decisão humana — o reparo NÃO procura evidência para sustentá-los.
  let suggestionsCreated = 0;
  for (const n of incoherentNeeding) {
    const trigger = conditional.reviewTriggers.find((t) => t.field === n.field);
    await prisma.codingRepairSuggestion.create({
      data: {
        sermonId,
        codingAttemptId: attemptId,
        scoreField: n.field,
        originalScore: n.score,
        suggestedScore: null,
        suggestionReason: null,
        missingEvidenceReason: trigger?.message ?? "score incoerente com os campos relacionados — revisar antes de buscar evidência",
        suggestedByModel: null,
        promptVersion: PROMPT_VERSION,
        status: "PENDING",
      },
    });
    suggestionsCreated++;
  }

  // 1. Chamar o modelo pedindo apenas evidências (só para os campos coerentes)
  let repairRaw: Awaited<ReturnType<typeof chatCompletion>> | null = null;
  let repair: z.infer<typeof RepairResponseSchema> = { evidencias: [], camposSemEvidencia: [], scoreSuggestions: [] };
  if (coherentNeeding.length > 0) {
    try {
      const { system, user } = buildRepairPrompt({ transcript, fieldsNeedingEvidence: coherentNeeding });
      repairRaw = await chatCompletion({ model, system, user });
    } catch (e) {
      await recordAttempt("FAILED_OPENROUTER", { failStage: "reparo: chamada ao provedor" });
      return { ok: false, flow: "ERROR", message: e instanceof Error ? e.message : String(e) };
    }
    try {
      repair = RepairResponseSchema.parse(extractJson(repairRaw.content));
    } catch (e) {
      await recordAttempt("FAILED_SCHEMA", { failStage: "reparo: JSON", rawResponseText: repairRaw.content });
      return { ok: false, flow: "ERROR", message: "resposta de reparo inválida: " + (e instanceof Error ? e.message : String(e)) };
    }
  }

  // 2. Localizar cada evidência candidata na transcrição (agregados e citações
  // compostas nunca entram)
  const located: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  const foundFields = new Set<string>();
  for (const ev of repair.evidencias) {
    if (!SCORE_FIELD_NAMES.includes(ev.campo)) continue;
    if (AGGREGATE_SCORE_FIELDS.has(ev.campo)) continue;
    if (detectCompositeQuote(ev.citacao).isComposite) continue;
    const loc = locateEvidence(transcript, ev.citacao);
    if (loc) {
      located.push({ campo: ev.campo, citacao: loc.exactQuote, comentario: ev.comentario, startIndex: loc.startIndex, endIndex: loc.endIndex });
      foundFields.add(ev.campo);
    }
  }

  // 3. Sempre registrar sugestões de score do modelo como PENDING (fluxo C) — nunca aplicar
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

  const stillMissing = coherentNeeding.filter((n) => !foundFields.has(n.field));

  // 4B. Evidência não localizada OU campo incoerente pendente → mantém falha
  if (stillMissing.length > 0 || incoherentNeeding.length > 0) {
    await recordAttempt("REPAIRABLE_EVIDENCE_GAP", {
      failStage: incoherentNeeding.length > 0 ? "reparo: coerência a revisar" : "reparo: evidência não localizada",
      rawResponseText: repairRaw?.content ?? null,
      evidenceValidationJson: JSON.stringify([
        ...stillMissing.map((m) => ({ campo: m.field, found: false })),
        ...incoherentNeeding.map((m) => ({ campo: m.field, found: false, reason: "incoerência semântica — sugestão pendente" })),
      ]),
    });
    const parts: string[] = [];
    if (stillMissing.length > 0) parts.push(`A IA não encontrou evidência literal para ${stillMissing.length} campo(s).`);
    if (incoherentNeeding.length > 0) parts.push(`${incoherentNeeding.length} campo(s) com score incoerente foram encaminhados para revisão humana (sem busca de evidência).`);
    parts.push("Nenhum score foi alterado.");
    if (suggestionsCreated) parts.push(`Foram criadas ${suggestionsCreated} sugestão(ões) para decisão humana.`);
    return {
      ok: false,
      flow: "B_GAP",
      message: parts.join(" "),
      suggestionsCreated,
    };
  }

  // 4A. Todas as evidências obrigatórias localizadas SEM mudança de score → completar a análise
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) scoresData[f] = original.scores[f] ?? null;

  // Reaproveita as evidências originais localizáveis + as novas do reparo
  const allEvidence = [...originalLocated, ...located];

  const base = computeNeedsReview(original);
  const triggerReasons = conditional.reviewTriggers.map((t) => t.message);
  const needs = base.needs || triggerReasons.length > 0;
  const reason = [base.reason, ...triggerReasons].filter(Boolean).join("; ") || null;
  const analysisFields = {
    confidenceGlobal: original.confianca,
    biblicalMainText: original.texto_biblico_principal,
    sermonType: original.tipo_de_pregacao,
    mainTheme: original.tema_central,
    secondaryThemes: JSON.stringify(original.temas_secundarios),
    doctrineMain: original.doutrina_principal,
    ontologicalVsPragmatic:
      original.application_mode !== "not_identifiable"
        ? applicationModeToOntological(original.application_mode)
        : original.ontological_vs_pragmatic,
    applicationMode: original.application_mode,
    discourseMode: original.discourse_mode,
    critiqueShareEstimate: original.critique_share_estimate,
    criticTarget: original.critic_target,
    criticTone: original.critic_tone,
    healthyOrDemobilizingCritique: original.healthy_or_demobilizing_critique,
    politicalCritiqueTarget: original.political_critique_target,
    sensitivityLevel: original.sensitivity_level,
    needsHumanReview: needs,
    reviewReason: reason,
    summary3Lines: original.resumo_3_linhas,
    mainApplication: original.aplicacao_principal,
    possibleFormativeGap: original.possivel_lacuna_formativa,
  };

  await prisma.$transaction([
    prisma.sermonAnalysis.upsert({
      where: { sermonId },
      create: {
        sermonId, analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), ...analysisFields,
      },
      update: {
        analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), reviewStatus: null, reviewedBy: null, reviewedAt: null,
        ...analysisFields,
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
    rawResponseText: repairRaw?.content ?? null,
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
