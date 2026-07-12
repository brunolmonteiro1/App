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
import { buildFormativePrompt, parseFormativeResponse } from "./formativePrompt";
import {
  buildInterpretationPrompt,
  compactInterpretationSummary,
  parseInterpretationResponse,
  type InterpretationResponse,
} from "./interpretationPrompt";
import { applyConditionalApplicability } from "./schema";
import { AGGREGATE_SCORE_FIELDS, RISK_EVIDENCE_THRESHOLDS, SCORE_FIELDS } from "./score-fields";
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

// ── Driver genérico ──────────────────────────────────────────────────────────
// Registro de executores por etapa; as etapas B–E entram nos Commits 4–7.
type StageRunner = (runId: string, modelOverride?: string) => Promise<StageResult>;
const STAGE_RUNNERS: Partial<Record<PipelineStage, StageRunner>> = {
  structure: runStructureStage,
  interpretation: runInterpretationStage,
  formative: runFormativeStage,
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
