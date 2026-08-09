// Worker interno de fila durável (Rodada H). Reclama UMA pregação por vez e
// roda o pipeline v3 até o fim, sobrevivendo a fechar o navegador e a restart
// do processo (retomado por instrumentation.ts). Concorrência 1 (SQLite).
//
// INVARIANTE: o worker só ORQUESTRA. Prompts, chamadas ao OpenRouter, validação,
// localização de evidências e persistência ficam em lib/coding/pipeline.ts.
import { prisma } from "../db";
import { getModelPreference } from "./model-preference";
import { advanceRun, getRunSnapshot, startRun } from "./pipeline";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [30_000, 120_000]; // após a 1ª e 2ª falha transitória

// Erros transitórios: vale re-tentar. Metodológicos: mandam para revisão humana.
const TRANSIENT_ATTEMPT_STATUS = new Set(["FAILED_OPENROUTER", "FAILED_JSON"]);

let workerRunning = false;

export interface QueueCounts {
  queued: number;
  running: number;
  done: number;
  needs_review: number;
  failed: number;
}

// ── Enfileirar ───────────────────────────────────────────────────────────────
export async function enqueueSermons(sermonIds: string[], model?: string): Promise<number> {
  let n = 0;
  for (const sermonId of sermonIds) {
    const existing = await prisma.codingJob.findUnique({ where: { sermonId }, select: { status: true } });
    if (existing && (existing.status === "running" || existing.status === "done")) continue;
    await prisma.codingJob.upsert({
      where: { sermonId },
      create: { sermonId, status: "queued", model: model ?? null },
      update: { status: "queued", model: model ?? undefined, lockedAt: null, nextAttemptAt: null, lastError: null },
    });
    n++;
  }
  return n;
}

// Pregações ainda não codificadas por v3 (sem run isCurrent) e não revisadas.
export async function pendingSermonIds(limit?: number): Promise<string[]> {
  const rows = await prisma.sermon.findMany({
    where: {
      isSermon: true,
      analysisRuns: { none: { isCurrent: true } },
      analysis: { is: { analysisStatus: { not: "reviewed" } } },
    },
    select: { id: true },
    orderBy: { dateEstimated: "asc" },
    take: limit,
  });
  // Inclui pregações sem análise alguma (o filtro acima exige analysis existir):
  const noAnalysis = await prisma.sermon.findMany({
    where: { isSermon: true, analysis: { is: null }, analysisRuns: { none: { isCurrent: true } } },
    select: { id: true },
    orderBy: { dateEstimated: "asc" },
    take: limit,
  });
  const ids = [...new Set([...noAnalysis.map((r) => r.id), ...rows.map((r) => r.id)])];
  return limit ? ids.slice(0, limit) : ids;
}

// ── Claim atômico ────────────────────────────────────────────────────────────
async function claimNext(): Promise<{ id: string; sermonId: string; model: string | null; analysisRunId: string | null; attempts: number } | null> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const next = await tx.codingJob.findFirst({
      where: { status: "queued", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: { id: true, sermonId: true, model: true, analysisRunId: true, attempts: true },
    });
    if (!next) return null;
    await tx.codingJob.update({ where: { id: next.id }, data: { status: "running", lockedAt: now } });
    return next;
  });
}

// Classifica o desfecho de um run que NÃO terminou, pela última tentativa falha.
async function lastFailureKind(runId: string): Promise<{ transient: boolean; detail: string }> {
  const att = await prisma.codingAttempt.findFirst({
    where: { analysisRunId: runId, status: { not: "SUCCESS" } },
    orderBy: { createdAt: "desc" },
    select: { status: true, failStage: true },
  });
  const status = att?.status ?? "UNKNOWN";
  return { transient: TRANSIENT_ATTEMPT_STATUS.has(status), detail: `${att?.failStage ?? status}` };
}

// ── Processa um job até done / falha ────────────────────────────────────────
async function processJob(job: { id: string; sermonId: string; model: string | null; analysisRunId: string | null; attempts: number }) {
  const model = job.model || (await getModelPreference("coding")) || DEFAULT_MODEL;

  // Retoma o run existente se ainda não terminou; senão cria um novo.
  let runId = job.analysisRunId ?? undefined;
  if (runId) {
    const snap = await getRunSnapshot(runId);
    if (!snap.ok || snap.status === "completed" || snap.status === "superseded") runId = undefined;
  }
  if (!runId) {
    const started = await startRun(job.sermonId, model, "worker");
    if (!started.ok) {
      await prisma.codingJob.update({ where: { id: job.id }, data: { status: "needs_review", lastError: started.error } });
      return;
    }
    runId = started.runId;
    await prisma.codingJob.update({ where: { id: job.id }, data: { analysisRunId: runId } });
  }

  // Dirige o pipeline uma etapa por vez até done/falha.
  let guard = 0;
  let step = await advanceRun(runId, model);
  while (step.ok && !step.done && guard++ < 8) {
    step = await advanceRun(runId, model);
  }

  if (step.ok && step.done) {
    await prisma.codingJob.update({ where: { id: job.id }, data: { status: "done", lastError: null } });
    return;
  }

  // Não terminou: classifica transitório × metodológico.
  const kind = await lastFailureKind(runId);
  if (kind.transient && job.attempts + 1 < MAX_ATTEMPTS) {
    const backoff = BACKOFF_MS[job.attempts] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
    await prisma.codingJob.update({
      where: { id: job.id },
      data: {
        status: "queued",
        attempts: { increment: 1 },
        nextAttemptAt: new Date(Date.now() + backoff),
        lastError: `transitório: ${step.error ?? kind.detail}`,
        lockedAt: null,
      },
    });
  } else if (kind.transient) {
    await prisma.codingJob.update({
      where: { id: job.id },
      data: { status: "failed", attempts: { increment: 1 }, lastError: `transitório (esgotou tentativas): ${step.error ?? kind.detail}` },
    });
  } else {
    // Metodológico (schema, gap de evidência, regra): revisão humana, sem loop.
    await prisma.codingJob.update({
      where: { id: job.id },
      data: { status: "needs_review", lastError: `${kind.detail}: ${step.error ?? ""}`.trim() },
    });
  }
}

// ── Loop singleton ──────────────────────────────────────────────────────────
export async function runWorkerLoop(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;
  try {
    let guard = 0;
    while (guard++ < 10_000) {
      const job = await claimNext();
      if (!job) break; // fila vazia (ou só há jobs em backoff futuro)
      try {
        await processJob(job);
      } catch (e) {
        await prisma.codingJob
          .update({ where: { id: job.id }, data: { status: "failed", lastError: e instanceof Error ? e.message : String(e) } })
          .catch(() => {});
      }
    }
  } finally {
    workerRunning = false;
  }
}

export function startWorker(): { started: boolean } {
  if (workerRunning) return { started: false };
  void runWorkerLoop();
  return { started: true };
}

export function isWorkerRunning(): boolean {
  return workerRunning;
}

// No boot: jobs 'running' são órfãos (concorrência 1 ⇒ nada roda após restart).
export async function resumeOrphans(): Promise<number> {
  const res = await prisma.codingJob.updateMany({
    where: { status: "running" },
    data: { status: "queued", lockedAt: null },
  });
  return res.count;
}

// ── Snapshot da fila para a UI ──────────────────────────────────────────────
export async function queueSnapshot() {
  const grouped = await prisma.codingJob.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: QueueCounts = { queued: 0, running: 0, done: 0, needs_review: 0, failed: 0 };
  for (const g of grouped) {
    if (g.status in counts) counts[g.status as keyof QueueCounts] = g._count._all;
  }

  const runningJob = await prisma.codingJob.findFirst({
    where: { status: "running" },
    orderBy: { lockedAt: "desc" },
    select: { sermonId: true, analysisRunId: true, sermon: { select: { title: true } } },
  });
  let current: { title: string; stagesDone: number; currentStage: string | null; costUsd: number | null } | null = null;
  if (runningJob?.analysisRunId) {
    const snap = await getRunSnapshot(runningJob.analysisRunId);
    current = {
      title: runningJob.sermon.title,
      stagesDone: snap.stagesDone,
      currentStage: snap.currentStage,
      costUsd: snap.totalCostUsd,
    };
  } else if (runningJob) {
    current = { title: runningJob.sermon.title, stagesDone: 0, currentStage: "iniciando", costUsd: null };
  }

  const totalCost = await prisma.analysisRun.aggregate({ _sum: { totalCostUsd: true }, where: { isCurrent: true } });

  return {
    ok: true,
    counts,
    processing: isWorkerRunning(),
    current,
    totalCostUsd: totalCost._sum.totalCostUsd ?? 0,
  };
}
