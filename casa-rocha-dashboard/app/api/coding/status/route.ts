import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasApiKey, SUGGESTED_MODELS } from "@/lib/coding/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  const [pending, failed, coded, reviewed, modelSetting, codedList] = await Promise.all([
    prisma.sermon.findMany({
      where: {
        isSermon: true,
        OR: [{ analysis: null }, { analysis: { analysisStatus: "pending" } }],
      },
      select: { id: true, title: true, year: true, series: true, analysis: { select: { aiError: true } } },
      orderBy: { dateEstimated: "asc" },
    }),
    prisma.sermonAnalysis.count({ where: { aiError: { not: null } } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "ai_coded" } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "reviewed" } }),
    prisma.appSetting.findUnique({ where: { key: "coding_model" } }),
    prisma.sermonAnalysis.findMany({
      where: { analysisStatus: "ai_coded" },
      select: { sermonId: true, aiModel: true, confidenceGlobal: true, sermon: { select: { title: true } } },
      orderBy: { aiCodedAt: "asc" },
    }),
  ]);

  // Última tentativa por pregação com falha (para o link "Ver resposta da IA")
  const failedIds = pending.filter((s) => s.analysis?.aiError).map((s) => s.id);
  const latestAttempts = failedIds.length
    ? await prisma.codingAttempt.findMany({
        where: { sermonId: { in: failedIds } },
        orderBy: { createdAt: "desc" },
        select: { id: true, sermonId: true },
      })
    : [];
  const attemptBySermon = new Map<string, string>();
  for (const at of latestAttempts) if (!attemptBySermon.has(at.sermonId)) attemptBySermon.set(at.sermonId, at.id);

  return NextResponse.json({
    hasApiKey: hasApiKey(),
    pending: pending.map((s) => ({
      id: s.id,
      title: s.title,
      year: s.year,
      series: s.series,
      aiError: s.analysis?.aiError ?? null,
      latestAttemptId: attemptBySermon.get(s.id) ?? null,
    })),
    counts: { pending: pending.length, coded, reviewed, failed },
    reviewQueue: codedList.map((a) => ({
      id: a.sermonId,
      title: a.sermon.title,
      model: a.aiModel,
      confidence: a.confidenceGlobal,
    })),
    model: modelSetting?.value ?? SUGGESTED_MODELS[0],
    suggestedModels: SUGGESTED_MODELS,
  });
}
