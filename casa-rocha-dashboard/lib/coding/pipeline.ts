// Orquestrador do pipeline multi-etapas (Rodada H).
// COMPREENDER → INTERPRETAR → PONTUAR → PROVAR → REVISAR → AGREGAR.
// - Cada execução completa é um AnalysisRun (histórico preservado);
// - cada chamada de IA grava um CodingAttempt imutável vinculado ao run;
// - falha numa etapa preserva as anteriores (retomável da etapa que falhou);
// - nenhum score é alterado automaticamente em etapa alguma.
import crypto from "node:crypto";
import { prisma } from "../db";
import { locateAnchors } from "./locate-anchors";
import { chatCompletion, extractJson } from "./openrouter";
import { buildAuditStagePrompt, parseAuditStageResponse } from "./auditStagePrompt";
import { batchFields, buildEvidencePrompt, parseEvidenceResponse, type FieldNeedingEvidence } from "./evidencePrompt";
import { buildFormativePrompt, parseFormativeResponse } from "./formativePrompt";
import {
  buildInterpretationPrompt,
  compactInterpretationSummary,
  parseInterpretationResponse,
  type InterpretationResponse,
} from "./interpretationPrompt";
import { detectCompositeQuote, locateEvidence } from "./locate-evidence";
import { RUBRIC } from "./rubric";
import {
  applyConditionalApplicability,
  computeNeedsReview,
  CodingResponseSchema,
  validateBusinessRules,
  type CodingResponse,
} from "./schema";
import {
  AGGREGATE_SCORE_FIELDS,
  applicationModeToOntological,
  FAMILY_SEMANTICS,
  familyOf,
  INTERPRETATION_QUALITY_FIELDS,
  RISK_EVIDENCE_THRESHOLDS,
  SCORE_FIELD_NAMES,
  SCORE_FIELDS,
} from "./score-fields";
import { buildStructurePrompt, compactStructureMap, parseStructureResponse, type StructureResponse } from "./structurePrompt";
import {
  PIPELINE_STAGES,
  PIPELINE_VERSION,
  STAGE_ATTEMPT_TYPES,
  STRUCTURE_PROMPT_VERSION,
  INTERPRETATION_PROMPT_VERSION,
  FORMATIVE_PROMPT_VERSION,
  EVIDENCE_PROMPT_VERSION,
  AUDIT_STAGE_PROMPT_VERSION,
  type PipelineStage,
} from "./versions";

export interface StageResult {
  ok: boolean;
  runId: string;
  stage: PipelineStage;
  error?: string;
  attemptId?: string;
  skipped?: boolean;
}

export interface RunResult {
  ok: boolean;
  runId: string;
  sermonId: string;
  completedStages: PipelineStage[];
  stoppedAt?: PipelineStage;
  error?: string;
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number } | undefined;

// Acumula tokens/custo da etapa nos totais do run (Entregável 7).
async function accumulateUsage(runId: string, usage: Usage) {
  if (!usage) return;
  const tokens = usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
  const run = await prisma.analysisRun.findUnique({ where: { id: runId }, select: { totalTokens: true, totalCostUsd: true } });
  await prisma.analysisRun.update({
    where: { id: runId },
    data: {
      totalTokens: (run?.totalTokens ?? 0) + tokens,
      totalCostUsd: usage.cost != null ? (run?.totalCostUsd ?? 0) + usage.cost : run?.totalCostUsd,
    },
  });
}

async function recordStageAttempt(opts: {
  sermonId: string;
  runId: string;
  stage: PipelineStage;
  model: string;
  status: string;
  failStage?: string | null;
  promptVersion: string;
  extras?: Record<string, unknown>;
}): Promise<string> {
  const attempt = await prisma.codingAttempt.create({
    data: {
      sermonId: opts.sermonId,
      analysisRunId: opts.runId,
      attemptType: STAGE_ATTEMPT_TYPES[opts.stage],
      model: opts.model,
      status: opts.status,
      failStage: opts.failStage ?? null,
      promptVersion: opts.promptVersion,
      schemaVersion: PIPELINE_VERSION,
      ...(opts.extras ?? {}),
    },
  });
  return attempt.id;
}

// ── Criação do run ───────────────────────────────────────────────────────────
export async function startRun(
  sermonId: string,
  model: string,
  requestedBy?: string
): Promise<{ ok: true; runId: string } | { ok: false; error: string }> {
  const sermon = await prisma.sermon.findUnique({
    where: { id: sermonId },
    select: { id: true, isSermon: true, transcriptText: true, analysis: { select: { analysisStatus: true } } },
  });
  if (!sermon || !sermon.isSermon) return { ok: false, error: "pregação não encontrada" };
  if (sermon.analysis?.analysisStatus === "reviewed") {
    return { ok: false, error: "já revisada — recodificação exige desfazer a revisão" };
  }
  const run = await prisma.analysisRun.create({
    data: {
      sermonId,
      status: "running",
      currentStage: "structure",
      isCurrent: false, // vira true (e o anterior superseded) só quando completar
      requestedBy: requestedBy ?? null,
      modelConfigurationJson: JSON.stringify({ default: model }),
      pipelineVersion: PIPELINE_VERSION,
      structurePromptVersion: STRUCTURE_PROMPT_VERSION,
      interpretationPromptVersion: INTERPRETATION_PROMPT_VERSION,
      formativePromptVersion: FORMATIVE_PROMPT_VERSION,
      evidencePromptVersion: EVIDENCE_PROMPT_VERSION,
      auditPromptVersion: AUDIT_STAGE_PROMPT_VERSION,
      sourceTranscriptHash: sha256(sermon.transcriptText),
    },
  });
  return { ok: true, runId: run.id };
}

async function failRun(runId: string, reason: string) {
  await prisma.analysisRun.update({
    where: { id: runId },
    data: { status: "failed", failedAt: new Date(), failReason: reason },
  });
}

// ── Etapa A — estrutura ──────────────────────────────────────────────────────
export async function runStructureStage(runId: string, modelOverride?: string): Promise<StageResult> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    include: { structure: { select: { id: true } }, sermon: { select: { id: true, title: true, series: true, year: true, transcriptText: true } } },
  });
  if (!run) return { ok: false, runId, stage: "structure", error: "run não encontrado" };
  if (run.structure) return { ok: true, runId, stage: "structure", skipped: true };

  const model = modelOverride ?? defaultModel(run.modelConfigurationJson);
  const startedAt = Date.now();
  const { system, user, version } = buildStructurePrompt(run.sermon);

  let raw;
  try {
    raw = await chatCompletion({ model, system, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordStageAttempt({
      sermonId: run.sermonId, runId, stage: "structure", model, status: "FAILED_OPENROUTER",
      failStage: "estrutura: chamada ao provedor", promptVersion: version,
    });
    await failRun(runId, `estrutura: ${msg}`);
    return { ok: false, runId, stage: "structure", error: msg };
  }
  const meta = raw.usage ? JSON.stringify(raw.usage) : null;

  let extracted: unknown;
  try {
    extracted = extractJson(raw.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordStageAttempt({
      sermonId: run.sermonId, runId, stage: "structure", model, status: "FAILED_JSON",
      failStage: "estrutura: extração de JSON", promptVersion: version,
      extras: { rawResponseText: raw.content, openrouterMetaJson: meta },
    });
    await failRun(runId, `estrutura: ${msg}`);
    return { ok: false, runId, stage: "structure", error: msg };
  }

  const parsedRes = parseStructureResponse(extracted);
  if (!parsedRes.success) {
    const msg = `estrutura inválida: ${parsedRes.issues.slice(0, 3).join("; ")}`;
    await recordStageAttempt({
      sermonId: run.sermonId, runId, stage: "structure", model, status: "FAILED_SCHEMA",
      failStage: "estrutura: validação de schema", promptVersion: version,
      extras: {
        rawResponseText: raw.content,
        extractedJson: JSON.stringify(extracted),
        validationIssuesJson: JSON.stringify({ schemaIssues: parsedRes.issues, enumNormalizations: parsedRes.normalizations }),
        openrouterMetaJson: meta,
      },
    });
    await failRun(runId, msg);
    return { ok: false, runId, stage: "structure", error: msg };
  }
  const structure = parsedRes.data;

  // Localização determinística dos anchors (ajuste 10)
  const anchors = locateAnchors(
    run.sermon.transcriptText,
    structure.discourseUnits.map((u) => ({ order: u.order, startAnchor: u.startAnchor, endAnchor: u.endAnchor }))
  );

  const attemptId = await recordStageAttempt({
    sermonId: run.sermonId, runId, stage: "structure", model, status: "SUCCESS",
    promptVersion: version,
    extras: {
      rawResponseText: raw.content,
      extractedJson: JSON.stringify(structure),
      validationIssuesJson: parsedRes.normalizations.length
        ? JSON.stringify({ enumNormalizations: parsedRes.normalizations })
        : null,
      evidenceValidationJson: JSON.stringify(anchors),
      openrouterMetaJson: meta,
    },
  });

  await prisma.sermonStructureAnalysis.create({
    data: {
      analysisRunId: runId,
      structureJson: JSON.stringify(structure),
      anchorsLocatedJson: JSON.stringify(anchors),
      model,
      promptVersion: version,
      inputHash: sha256(system + "\n" + user),
      outputHash: sha256(raw.content),
      tokenUsageJson: meta,
      durationMs: Date.now() - startedAt,
    },
  });
  await accumulateUsage(runId, raw.usage as Usage);
  await prisma.analysisRun.update({ where: { id: runId }, data: { currentStage: "interpretation" } });

  return { ok: true, runId, stage: "structure", attemptId };
}

function defaultModel(modelConfigurationJson: string | null): string {
  try {
    const cfg = JSON.parse(modelConfigurationJson ?? "{}");
    return cfg.default ?? "anthropic/claude-sonnet-4.5";
  } catch {
    return "anthropic/claude-sonnet-4.5";
  }
}

// Helper genérico: chamada de IA de uma etapa com falhas registradas
// (CodingAttempt imutável) e run marcado como failed — reduz boilerplate.
async function stageCall(opts: {
  sermonId: string;
  runId: string;
  stage: PipelineStage;
  model: string;
  system: string;
  user: string;
  version: string;
}): Promise<
  | { ok: true; raw: Awaited<ReturnType<typeof chatCompletion>>; extracted: unknown; meta: string | null }
  | { ok: false; error: string }
> {
  let raw;
  try {
    raw = await chatCompletion({ model: opts.model, system: opts.system, user: opts.user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordStageAttempt({
      sermonId: opts.sermonId, runId: opts.runId, stage: opts.stage, model: opts.model,
      status: "FAILED_OPENROUTER", failStage: `${opts.stage}: chamada ao provedor`, promptVersion: opts.version,
    });
    await failRun(opts.runId, `${opts.stage}: ${msg}`);
    return { ok: false, error: msg };
  }
  const meta = raw.usage ? JSON.stringify(raw.usage) : null;
  let extracted: unknown;
  try {
    extracted = extractJson(raw.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordStageAttempt({
      sermonId: opts.sermonId, runId: opts.runId, stage: opts.stage, model: opts.model,
      status: "FAILED_JSON", failStage: `${opts.stage}: extração de JSON`, promptVersion: opts.version,
      extras: { rawResponseText: raw.content, openrouterMetaJson: meta },
    });
    await failRun(opts.runId, `${opts.stage}: ${msg}`);
    return { ok: false, error: msg };
  }
  return { ok: true, raw, extracted, meta };
}

async function recordSchemaFailure(opts: {
  sermonId: string;
  runId: string;
  stage: PipelineStage;
  model: string;
  version: string;
  rawContent: string;
  extracted: unknown;
  issues: string[];
  normalizations: unknown[];
  meta: string | null;
}): Promise<string> {
  const msg = `${opts.stage}: schema inválido: ${opts.issues.slice(0, 3).join("; ")}`;
  await recordStageAttempt({
    sermonId: opts.sermonId, runId: opts.runId, stage: opts.stage, model: opts.model,
    status: "FAILED_SCHEMA", failStage: `${opts.stage}: validação de schema`, promptVersion: opts.version,
    extras: {
      rawResponseText: opts.rawContent,
      extractedJson: JSON.stringify(opts.extracted),
      validationIssuesJson: JSON.stringify({ schemaIssues: opts.issues, enumNormalizations: opts.normalizations }),
      openrouterMetaJson: opts.meta,
    },
  });
  await failRun(opts.runId, msg);
  return msg;
}

// ── Etapa B — interpretação (hermenêutica/argumentação/homilética) ──────────
export async function runInterpretationStage(runId: string, modelOverride?: string): Promise<StageResult> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    include: {
      structure: { select: { structureJson: true } },
      interpretation: { select: { id: true } },
      sermon: { select: { id: true, title: true, series: true, year: true, transcriptText: true } },
    },
  });
  if (!run) return { ok: false, runId, stage: "interpretation", error: "run não encontrado" };
  if (run.interpretation) return { ok: true, runId, stage: "interpretation", skipped: true };
  if (!run.structure) return { ok: false, runId, stage: "interpretation", error: "estrutura ausente — execute a Etapa A primeiro" };

  const model = modelOverride ?? defaultModel(run.modelConfigurationJson);
  const startedAt = Date.now();
  const structure = JSON.parse(run.structure.structureJson) as StructureResponse;
  const { system, user, version } = buildInterpretationPrompt({
    title: run.sermon.title,
    series: run.sermon.series,
    year: run.sermon.year,
    transcriptText: run.sermon.transcriptText,
    structureMap: compactStructureMap(structure),
  });

  const call = await stageCall({ sermonId: run.sermonId, runId, stage: "interpretation", model, system, user, version });
  if (!call.ok) return { ok: false, runId, stage: "interpretation", error: call.error };

  const parsed = parseInterpretationResponse(call.extracted);
  if (!parsed.success) {
    const msg = await recordSchemaFailure({
      sermonId: run.sermonId, runId, stage: "interpretation", model, version,
      rawContent: call.raw.content, extracted: call.extracted, issues: parsed.issues,
      normalizations: parsed.normalizations, meta: call.meta,
    });
    return { ok: false, runId, stage: "interpretation", error: msg };
  }

  const attemptId = await recordStageAttempt({
    sermonId: run.sermonId, runId, stage: "interpretation", model, status: "SUCCESS", promptVersion: version,
    extras: {
      rawResponseText: call.raw.content,
      extractedJson: JSON.stringify(parsed.data),
      validationIssuesJson: parsed.normalizations.length
        ? JSON.stringify({ enumNormalizations: parsed.normalizations })
        : null,
      openrouterMetaJson: call.meta,
    },
  });

  await prisma.sermonInterpretationAnalysis.create({
    data: {
      analysisRunId: runId,
      hermeneuticsJson: JSON.stringify(parsed.data.hermeneutics),
      argumentationJson: JSON.stringify(parsed.data.argumentation),
      homileticsJson: JSON.stringify(parsed.data.homiletics),
      model,
      promptVersion: version,
      inputHash: sha256(system + "\n" + user),
      outputHash: sha256(call.raw.content),
      tokenUsageJson: call.meta,
      durationMs: Date.now() - startedAt,
    },
  });
  await accumulateUsage(runId, call.raw.usage as Usage);
  await prisma.analysisRun.update({ where: { id: runId }, data: { currentStage: "formative" } });

  return { ok: true, runId, stage: "interpretation", attemptId };
}

// ── Etapa C — formação e scores por família ─────────────────────────────────
// Status inicial de evidência por campo (§12): definido AQUI, refinado na Etapa D.
function initialScoreMetadata(parsed: { scores: Record<string, number | null>; confianca: string }) {
  const meta: Record<string, { confidence: string; evidenceStatus: string; evidenceBasis: string | null }> = {};
  for (const f of SCORE_FIELDS) {
    const v = parsed.scores[f.field];
    if (v == null) continue;
    if (AGGREGATE_SCORE_FIELDS.has(f.field)) {
      meta[f.field] = { confidence: parsed.confianca, evidenceStatus: "aggregate_derived", evidenceBasis: "aggregate_derived" };
      continue;
    }
    const threshold = RISK_EVIDENCE_THRESHOLDS[f.field] ?? 4;
    meta[f.field] =
      v >= threshold
        ? { confidence: parsed.confianca, evidenceStatus: "evidence_pending", evidenceBasis: null }
        : { confidence: parsed.confianca, evidenceStatus: "evidence_not_required", evidenceBasis: null };
  }
  return meta;
}

export async function runFormativeStage(runId: string, modelOverride?: string): Promise<StageResult> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    include: {
      structure: { select: { structureJson: true } },
      interpretation: { select: { hermeneuticsJson: true, argumentationJson: true, homileticsJson: true } },
      formative: { select: { id: true } },
      sermon: { select: { id: true, title: true, series: true, year: true, transcriptText: true } },
    },
  });
  if (!run) return { ok: false, runId, stage: "formative", error: "run não encontrado" };
  if (run.formative) return { ok: true, runId, stage: "formative", skipped: true };
  if (!run.structure || !run.interpretation) {
    return { ok: false, runId, stage: "formative", error: "etapas A/B ausentes — execute-as primeiro" };
  }

  const model = modelOverride ?? defaultModel(run.modelConfigurationJson);
  const startedAt = Date.now();
  const structure = JSON.parse(run.structure.structureJson) as StructureResponse;
  const interpretation = {
    hermeneutics: JSON.parse(run.interpretation.hermeneuticsJson),
    argumentation: JSON.parse(run.interpretation.argumentationJson),
    homiletics: JSON.parse(run.interpretation.homileticsJson),
  } as InterpretationResponse;

  const { system, user, version } = buildFormativePrompt({
    title: run.sermon.title,
    series: run.sermon.series,
    year: run.sermon.year,
    transcriptText: run.sermon.transcriptText,
    structureMap: compactStructureMap(structure),
    interpretationSummary: compactInterpretationSummary(interpretation),
  });

  const call = await stageCall({ sermonId: run.sermonId, runId, stage: "formative", model, system, user, version });
  if (!call.ok) return { ok: false, runId, stage: "formative", error: call.error };

  const parsed = parseFormativeResponse(call.extracted);
  if (!parsed.success) {
    const msg = await recordSchemaFailure({
      sermonId: run.sermonId, runId, stage: "formative", model, version,
      rawContent: call.raw.content, extracted: call.extracted, issues: parsed.issues,
      normalizations: parsed.normalizations, meta: call.meta,
    });
    return { ok: false, runId, stage: "formative", error: msg };
  }

  // Aplicabilidade condicional: incoerência → gatilho de revisão (nunca falha
  // técnica; nenhum score alterado). Persistido para as etapas D/E.
  const conditional = applyConditionalApplicability(parsed.data);
  const scoreMetadata = initialScoreMetadata(parsed.data);

  const { formation, gap_analysis, ...categorical } = parsed.data;

  const attemptId = await recordStageAttempt({
    sermonId: run.sermonId, runId, stage: "formative", model, status: "SUCCESS", promptVersion: version,
    extras: {
      rawResponseText: call.raw.content,
      extractedJson: JSON.stringify(parsed.data),
      validationIssuesJson:
        parsed.normalizations.length || conditional.warnings.length || conditional.reviewTriggers.length
          ? JSON.stringify({
              enumNormalizations: parsed.normalizations,
              warnings: conditional.warnings,
              reviewTriggers: conditional.reviewTriggers,
            })
          : null,
      openrouterMetaJson: call.meta,
    },
  });

  await prisma.sermonFormativeAnalysis.create({
    data: {
      analysisRunId: runId,
      formationJson: JSON.stringify(formation),
      categoricalFieldsJson: JSON.stringify(categorical),
      gapAnalysisJson: JSON.stringify(gap_analysis),
      scoreMetadataJson: JSON.stringify(scoreMetadata),
      model,
      promptVersion: version,
      inputHash: sha256(system + "\n" + user),
      outputHash: sha256(call.raw.content),
      tokenUsageJson: call.meta,
      durationMs: Date.now() - startedAt,
    },
  });
  await accumulateUsage(runId, call.raw.usage as Usage);
  await prisma.analysisRun.update({ where: { id: runId }, data: { currentStage: "evidence" } });

  return { ok: true, runId, stage: "formative", attemptId };
}

// ── Etapa D — extração direcionada e validação de evidências (§7) ───────────
function pathGet(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj);
}

const FIELD_LABELS = new Map(SCORE_FIELDS.map((f) => [f.field, f.label]));

export async function runEvidenceStage(runId: string, modelOverride?: string): Promise<StageResult> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    include: {
      formative: { select: { categoricalFieldsJson: true, scoreMetadataJson: true } },
      interpretation: { select: { hermeneuticsJson: true, argumentationJson: true, homileticsJson: true } },
      sermon: { select: { id: true, title: true, transcriptText: true } },
    },
  });
  if (!run) return { ok: false, runId, stage: "evidence", error: "run não encontrado" };
  if (!run.formative) return { ok: false, runId, stage: "evidence", error: "etapa formativa ausente — execute-a primeiro" };
  const alreadyValidated = await prisma.sermonEvidence.count({ where: { analysisRunId: runId } });
  if (alreadyValidated > 0) return { ok: true, runId, stage: "evidence", skipped: true };

  const catParse = CodingResponseSchema.safeParse(JSON.parse(run.formative.categoricalFieldsJson));
  if (!catParse.success) return { ok: false, runId, stage: "evidence", error: "categoricalFieldsJson inválido no run" };
  const categorical: CodingResponse = catParse.data;
  const model = modelOverride ?? defaultModel(run.modelConfigurationJson);
  const transcript = run.sermon.transcriptText;

  // Campos que exigem evidência: score ≥ limiar; agregados NUNCA entram (§9).
  const needing: FieldNeedingEvidence[] = Object.entries(categorical.scores)
    .filter(([field, score]) => {
      if (score == null || AGGREGATE_SCORE_FIELDS.has(field)) return false;
      return score >= (RISK_EVIDENCE_THRESHOLDS[field] ?? 4);
    })
    .map(([field, score]) => ({
      field,
      label: FIELD_LABELS.get(field) ?? field,
      score: score as number,
      familyLabel: FAMILY_SEMANTICS[familyOf(field)].label,
      rubricHint: RUBRIC[field],
    }));

  // Rerun da etapa substitui as candidatas anteriores DESTE run (auditoria
  // completa continua nos CodingAttempts imutáveis).
  await prisma.evidenceCandidate.deleteMany({ where: { analysisRunId: runId } });

  // Lotes de 5–8 campos (ajuste 11)
  const collected: { field: string; quote: string; reason: string }[] = [];
  for (const batch of batchFields(needing)) {
    const { system, user, version } = buildEvidencePrompt({ title: run.sermon.title, transcriptText: transcript, fields: batch });
    const call = await stageCall({ sermonId: run.sermonId, runId, stage: "evidence", model, system, user, version });
    if (!call.ok) return { ok: false, runId, stage: "evidence", error: call.error };
    const parsed = parseEvidenceResponse(call.extracted);
    if (!parsed.success) {
      const msg = await recordSchemaFailure({
        sermonId: run.sermonId, runId, stage: "evidence", model, version,
        rawContent: call.raw.content, extracted: call.extracted, issues: parsed.issues,
        normalizations: parsed.normalizations, meta: call.meta,
      });
      return { ok: false, runId, stage: "evidence", error: msg };
    }
    await recordStageAttempt({
      sermonId: run.sermonId, runId, stage: "evidence", model, status: "SUCCESS",
      promptVersion: version,
      extras: {
        rawResponseText: call.raw.content,
        extractedJson: JSON.stringify(parsed.data),
        openrouterMetaJson: call.meta,
      },
    });
    await accumulateUsage(runId, call.raw.usage as Usage);
    collected.push(...parsed.data.evidences);
  }

  // Classificar e localizar TODAS as candidatas (nenhuma interrompe o loop).
  const located: { field: string; quote: string; reason: string; startIndex: number; endIndex: number }[] = [];
  const candidateRows: {
    analysisRunId: string; field: string; quote: string; reason: string;
    locationStatus: string; rejectionReason: string | null; startIndex: number | null; endIndex: number | null;
    model: string; promptVersion: string;
  }[] = [];
  for (const ev of collected) {
    const base = {
      analysisRunId: runId, field: ev.field, quote: ev.quote, reason: ev.reason,
      model, promptVersion: run.evidencePromptVersion ?? "",
    };
    if (AGGREGATE_SCORE_FIELDS.has(ev.field)) {
      candidateRows.push({ ...base, locationStatus: "ignored_aggregate", rejectionReason: "agregado nunca tem evidência própria", startIndex: null, endIndex: null });
      continue;
    }
    const comp = detectCompositeQuote(ev.quote);
    if (comp.isComposite) {
      candidateRows.push({ ...base, locationStatus: "composite_rejected", rejectionReason: comp.reason, startIndex: null, endIndex: null });
      continue;
    }
    const loc = locateEvidence(transcript, ev.quote);
    if (!loc) {
      candidateRows.push({ ...base, locationStatus: "unlocated", rejectionReason: "não localizada na transcrição", startIndex: null, endIndex: null });
      continue;
    }
    candidateRows.push({ ...base, locationStatus: "located", rejectionReason: null, startIndex: loc.startIndex, endIndex: loc.endIndex });
    located.push({ field: ev.field, quote: loc.exactQuote, reason: ev.reason, startIndex: loc.startIndex, endIndex: loc.endIndex });
  }
  await prisma.evidenceCandidate.createMany({ data: candidateRows });

  const locatedFields = new Set(located.map((e) => e.field));
  const bizIssues = validateBusinessRules(categorical, locatedFields);
  if (bizIssues.length > 0) {
    // Gap reparável: run NÃO é marcado failed — fica em "evidence", retomável
    // (reparo/revisão humana). Nenhum score é alterado (Entregável 6, caso 2).
    await recordStageAttempt({
      sermonId: run.sermonId, runId, stage: "evidence", model, status: "REPAIRABLE_EVIDENCE_GAP",
      failStage: "evidência obrigatória não localizada", promptVersion: run.evidencePromptVersion ?? "",
      extras: {
        businessRuleIssuesJson: JSON.stringify(bizIssues),
        evidenceValidationJson: JSON.stringify(candidateRows.map((c) => ({ campo: c.field, status: c.locationStatus }))),
      },
    });
    return {
      ok: false, runId, stage: "evidence",
      error: `evidência obrigatória não localizada para ${bizIssues.length} campo(s): ${bizIssues.slice(0, 3).map((i) => i.field).join(", ")} — nenhum score alterado; use reparo ou revisão humana`,
    };
  }

  // ── Projeção "atual": SermonScores/SermonAnalysis/SermonEvidence ──────────
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) scoresData[f] = categorical.scores[f] ?? null;
  // Campos de qualidade da Etapa B (mapeados dos JSONs da interpretação)
  const interp = run.interpretation
    ? {
        hermeneutics: JSON.parse(run.interpretation.hermeneuticsJson),
        argumentation: JSON.parse(run.interpretation.argumentationJson),
        homiletics: JSON.parse(run.interpretation.homileticsJson),
      }
    : null;
  for (const q of INTERPRETATION_QUALITY_FIELDS) {
    const v = interp ? pathGet(interp, q.source) : null;
    scoresData[q.field] = typeof v === "number" ? v : null;
  }

  const conditional = applyConditionalApplicability(categorical);
  const baseReview = computeNeedsReview(categorical);
  const triggerReasons = conditional.reviewTriggers.map((t) => t.message);
  const needs = baseReview.needs || triggerReasons.length > 0;
  const reason = [baseReview.reason, ...triggerReasons].filter(Boolean).join("; ") || null;

  const analysisFields = {
    confidenceGlobal: categorical.confianca,
    biblicalMainText: categorical.texto_biblico_principal,
    sermonType: categorical.tipo_de_pregacao,
    mainTheme: categorical.tema_central,
    secondaryThemes: JSON.stringify(categorical.temas_secundarios),
    doctrineMain: categorical.doutrina_principal,
    ontologicalVsPragmatic:
      categorical.application_mode !== "not_identifiable"
        ? applicationModeToOntological(categorical.application_mode)
        : categorical.ontological_vs_pragmatic,
    applicationMode: categorical.application_mode,
    discourseMode: categorical.discourse_mode,
    critiqueShareEstimate: categorical.critique_share_estimate,
    criticTarget: categorical.critic_target,
    criticTone: categorical.critic_tone,
    healthyOrDemobilizingCritique: categorical.healthy_or_demobilizing_critique,
    politicalCritiqueTarget: categorical.political_critique_target,
    sensitivityLevel: categorical.sensitivity_level,
    needsHumanReview: needs,
    reviewReason: reason,
    summary3Lines: categorical.resumo_3_linhas,
    mainApplication: categorical.aplicacao_principal,
    possibleFormativeGap: categorical.possivel_lacuna_formativa,
    pipelineVersion: run.pipelineVersion,
  };

  await prisma.$transaction([
    prisma.sermonAnalysis.upsert({
      where: { sermonId: run.sermonId },
      create: {
        sermonId: run.sermonId, analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), ...analysisFields,
      },
      update: {
        analysisStatus: "ai_coded", aiModel: model, aiCodedAt: new Date(), aiError: null,
        aiScoresJson: JSON.stringify(scoresData), reviewStatus: null, reviewedBy: null, reviewedAt: null,
        ...analysisFields,
      },
    }),
    prisma.sermonScores.upsert({
      where: { sermonId: run.sermonId },
      create: { sermonId: run.sermonId, ...scoresData },
      update: scoresData,
    }),
    prisma.sermonEvidence.deleteMany({
      where: { sermonId: run.sermonId, analysisMethod: { in: ["ai_coding", "ai_repair", "ai_pipeline"] } },
    }),
    prisma.sermonEvidence.createMany({
      data: located.map((ev) => ({
        sermonId: run.sermonId,
        category: ev.field,
        scoreField: ev.field,
        scoreValue: categorical.scores[ev.field] ?? null,
        evidenceQuote: ev.quote,
        evidenceStartIndex: ev.startIndex,
        evidenceEndIndex: ev.endIndex,
        analyticalComment: ev.reason,
        analysisMethod: "ai_pipeline",
        confidence: categorical.confianca,
        analysisRunId: runId,
        promptVersion: run.evidencePromptVersion,
        evidenceBasis: "direct_quote",
      })),
    }),
    // Troca do run atual: anterior vira superseded (histórico preservado)
    prisma.analysisRun.updateMany({
      where: { sermonId: run.sermonId, isCurrent: true, NOT: { id: runId } },
      data: { isCurrent: false, status: "superseded" },
    }),
    prisma.analysisRun.update({ where: { id: runId }, data: { isCurrent: true, currentStage: "audit" } }),
  ]);

  // Refina scoreMetadata (§12): validated/evidence_missing + supportingEvidenceIds
  const savedEvidence = await prisma.sermonEvidence.findMany({
    where: { analysisRunId: runId },
    select: { id: true, scoreField: true },
  });
  const byField = new Map<string, string[]>();
  for (const e of savedEvidence) byField.set(e.scoreField, [...(byField.get(e.scoreField) ?? []), e.id]);
  const scoreMetadata = JSON.parse(run.formative.scoreMetadataJson ?? "{}") as Record<string, Record<string, unknown>>;
  for (const [field, meta] of Object.entries(scoreMetadata)) {
    const ids = byField.get(field) ?? [];
    if (ids.length > 0) {
      meta.evidenceStatus = "validated";
      meta.evidenceBasis = ids.length > 1 ? "multiple_quotes" : "direct_quote";
      meta.supportingEvidenceIds = ids;
    } else if (meta.evidenceStatus === "evidence_pending") {
      meta.evidenceStatus = "evidence_missing";
    }
  }
  const metaStr = JSON.stringify(scoreMetadata);
  await prisma.sermonAnalysis.update({ where: { sermonId: run.sermonId }, data: { scoreMetadataJson: metaStr } });
  await prisma.sermonFormativeAnalysis.update({ where: { analysisRunId: runId }, data: { scoreMetadataJson: metaStr } });

  return { ok: true, runId, stage: "evidence" };
}

// ── Etapa E — auditoria semântica (§11) ─────────────────────────────────────
// Entrada SEM transcrição integral (custo): análises estruturadas + scores +
// evidências localizadas + achados determinísticos. Só RELATA — nenhuma
// correção é aplicada; incoerência apenas eleva needsHumanReview.
export async function runAuditStage(runId: string, modelOverride?: string): Promise<StageResult> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    include: {
      structure: { select: { structureJson: true } },
      interpretation: { select: { hermeneuticsJson: true, argumentationJson: true, homileticsJson: true } },
      formative: { select: { categoricalFieldsJson: true, scoreMetadataJson: true } },
      sermon: { select: { id: true, title: true } },
    },
  });
  if (!run) return { ok: false, runId, stage: "audit", error: "run não encontrado" };
  if (!run.structure || !run.interpretation || !run.formative) {
    return { ok: false, runId, stage: "audit", error: "etapas anteriores ausentes — complete A–D primeiro" };
  }
  const done = await prisma.codingAttempt.findFirst({
    where: { analysisRunId: runId, attemptType: "AUDIT", status: "SUCCESS" },
    select: { id: true },
  });
  if (done) return { ok: true, runId, stage: "audit", skipped: true };

  const model = modelOverride ?? defaultModel(run.modelConfigurationJson);
  const structure = JSON.parse(run.structure.structureJson) as StructureResponse;
  const interpretation = {
    hermeneutics: JSON.parse(run.interpretation.hermeneuticsJson),
    argumentation: JSON.parse(run.interpretation.argumentationJson),
    homiletics: JSON.parse(run.interpretation.homileticsJson),
  } as InterpretationResponse;
  const catParse = CodingResponseSchema.safeParse(JSON.parse(run.formative.categoricalFieldsJson));
  const categorical = catParse.success ? catParse.data : null;
  const conditional = categorical ? applyConditionalApplicability(categorical) : { warnings: [], reviewTriggers: [] };

  const savedEvidence = await prisma.sermonEvidence.findMany({
    where: { analysisRunId: runId },
    select: { scoreField: true, scoreValue: true, evidenceQuote: true },
  });

  const { system, user, version } = buildAuditStagePrompt({
    title: run.sermon.title,
    structureMap: compactStructureMap(structure),
    interpretationSummary: compactInterpretationSummary(interpretation),
    categoricalJson: run.formative.categoricalFieldsJson,
    scoreMetadataJson: run.formative.scoreMetadataJson ?? "{}",
    locatedEvidence: savedEvidence.map((e) => ({ field: e.scoreField, score: e.scoreValue, quote: e.evidenceQuote })),
    conditionalFindings: [
      ...conditional.warnings.map((w) => w.message),
      ...conditional.reviewTriggers.map((t) => t.message),
    ],
  });

  const call = await stageCall({ sermonId: run.sermonId, runId, stage: "audit", model, system, user, version });
  if (!call.ok) return { ok: false, runId, stage: "audit", error: call.error };

  const parsed = parseAuditStageResponse(call.extracted);
  if (!parsed.success) {
    const msg = await recordSchemaFailure({
      sermonId: run.sermonId, runId, stage: "audit", model, version,
      rawContent: call.raw.content, extracted: call.extracted, issues: parsed.issues,
      normalizations: parsed.normalizations, meta: call.meta,
    });
    return { ok: false, runId, stage: "audit", error: msg };
  }
  const audit = parsed.data;

  const attemptId = await recordStageAttempt({
    sermonId: run.sermonId, runId, stage: "audit", model, status: "SUCCESS", promptVersion: version,
    extras: {
      rawResponseText: call.raw.content,
      extractedJson: JSON.stringify(parsed.data),
      evidenceValidationJson: JSON.stringify(audit),
      openrouterMetaJson: call.meta,
    },
  });
  await accumulateUsage(runId, call.raw.usage as Usage);

  // A auditoria NUNCA altera scores — apenas eleva needsHumanReview e anota o
  // parecer. O run é finalizado (completed / done).
  const auditNeedsReview =
    audit.needsHumanReview ||
    audit.auditStatus === "needs_adjustment" ||
    audit.auditStatus === "human_review_required" ||
    audit.auditStatus === "rejected";

  const existing = await prisma.sermonAnalysis.findUnique({
    where: { sermonId: run.sermonId },
    select: { needsHumanReview: true, reviewReason: true },
  });
  if (auditNeedsReview) {
    const auditReason = `auditoria: ${audit.auditStatus}${audit.reviewReason ? ` — ${audit.reviewReason}` : ""}`;
    await prisma.sermonAnalysis.update({
      where: { sermonId: run.sermonId },
      data: {
        needsHumanReview: true,
        reviewReason: [existing?.reviewReason, auditReason].filter(Boolean).join("; "),
      },
    });
  }

  await prisma.analysisRun.update({
    where: { id: runId },
    data: { currentStage: "done", status: "completed", completedAt: new Date() },
  });

  return { ok: true, runId, stage: "audit", attemptId };
}

// ── Driver genérico ──────────────────────────────────────────────────────────
// Registro de executores por etapa; as etapas B–E entram nos Commits 4–7.
type StageRunner = (runId: string, modelOverride?: string) => Promise<StageResult>;
const STAGE_RUNNERS: Partial<Record<PipelineStage, StageRunner>> = {
  structure: runStructureStage,
  interpretation: runInterpretationStage,
  formative: runFormativeStage,
  evidence: runEvidenceStage,
  audit: runAuditStage,
};

export function registerStageRunner(stage: PipelineStage, runner: StageRunner) {
  STAGE_RUNNERS[stage] = runner;
}

// Executa as etapas pendentes do run, em ordem, parando na primeira falha ou
// na primeira etapa ainda não implementada.
export async function runPipeline(sermonId: string, model: string, requestedBy?: string): Promise<RunResult> {
  const started = await startRun(sermonId, model, requestedBy);
  if (!started.ok) return { ok: false, runId: "", sermonId, completedStages: [], error: started.error };
  return await resumeRun(started.runId, model);
}

export interface StepResult {
  ok: boolean;
  runId: string;
  ranStage?: PipelineStage;
  nextStage: PipelineStage | null; // próxima etapa pendente (null = pipeline completo)
  done: boolean;
  error?: string;
}

// Executa EXATAMENTE UMA etapa pendente e retorna — para o cliente conduzir o
// loop mostrando progresso por etapa (cada requisição HTTP = 1 chamada de IA,
// dentro do limite de timeout). Idempotente: etapas já feitas são puladas.
export async function advanceRun(runId: string, modelOverride?: string): Promise<StepResult> {
  const run = await prisma.analysisRun.findUnique({ where: { id: runId }, select: { id: true } });
  if (!run) return { ok: false, runId, nextStage: null, done: false, error: "run não encontrado" };

  for (const stage of PIPELINE_STAGES) {
    const runner = STAGE_RUNNERS[stage];
    if (!runner) return { ok: false, runId, nextStage: stage, done: false, error: `etapa ${stage} não implementada` };
    const res = await runner(runId, modelOverride);
    if (res.skipped) continue; // já feita — tenta a próxima
    if (!res.ok) return { ok: false, runId, ranStage: stage, nextStage: stage, done: false, error: res.error };
    // Rodou esta etapa com sucesso — descobre a próxima pendente sem executá-la.
    const idx = PIPELINE_STAGES.indexOf(stage);
    const next = PIPELINE_STAGES[idx + 1] ?? null;
    return { ok: true, runId, ranStage: stage, nextStage: next, done: next === null };
  }
  // Todas as etapas já estavam feitas.
  return { ok: true, runId, nextStage: null, done: true };
}

export async function resumeRun(runId: string, modelOverride?: string): Promise<RunResult> {
  const run = await prisma.analysisRun.findUnique({ where: { id: runId }, select: { sermonId: true } });
  if (!run) return { ok: false, runId, sermonId: "", completedStages: [], error: "run não encontrado" };

  const completed: PipelineStage[] = [];
  for (const stage of PIPELINE_STAGES) {
    const runner = STAGE_RUNNERS[stage];
    if (!runner) {
      // Etapa ainda não implementada: para aqui SEM marcar falha (retomável).
      return { ok: true, runId, sermonId: run.sermonId, completedStages: completed, stoppedAt: stage };
    }
    const res = await runner(runId, modelOverride);
    if (!res.ok) {
      return { ok: false, runId, sermonId: run.sermonId, completedStages: completed, stoppedAt: stage, error: res.error };
    }
    completed.push(stage);
  }
  return { ok: true, runId, sermonId: run.sermonId, completedStages: completed };
}
