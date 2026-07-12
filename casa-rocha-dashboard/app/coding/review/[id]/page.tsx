import { notFound } from "next/navigation";
import ReviewForm from "@/components/coding/ReviewForm";
import AuditButton from "@/components/coding/AuditButton";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sermon = await prisma.sermon.findUnique({
    where: { id },
    include: {
      analysis: true,
      scores: true,
      evidence: {
        where: { analysisMethod: { in: ["ai_coding", "human_review"] } },
        orderBy: { evidenceStartIndex: "asc" },
      },
    },
  });
  if (!sermon || !sermon.analysis) notFound();

  // próxima da fila (para navegação)
  const next = await prisma.sermonAnalysis.findFirst({
    where: { analysisStatus: "ai_coded", sermonId: { not: id } },
    select: { sermonId: true },
    orderBy: { aiCodedAt: "asc" },
  });

  const scores: Record<string, number | null> = {};
  if (sermon.scores) {
    for (const [k, v] of Object.entries(sermon.scores)) {
      if (k.endsWith("Score")) scores[k] = v as number | null;
    }
  }

  return (
    <div className="space-y-4">
    <ReviewForm
      sermon={{
        id: sermon.id,
        title: sermon.title,
        series: sermon.series,
        year: sermon.year,
        youtubeUrl: sermon.youtubeUrl,
        transcriptText: sermon.transcriptText,
      }}
      analysis={{
        status: sermon.analysis.analysisStatus,
        aiModel: sermon.analysis.aiModel,
        confidence: sermon.analysis.confidenceGlobal,
        mainTheme: sermon.analysis.mainTheme,
        biblicalMainText: sermon.analysis.biblicalMainText,
        sermonType: sermon.analysis.sermonType,
        doctrineMain: sermon.analysis.doctrineMain,
        ontologicalVsPragmatic: sermon.analysis.ontologicalVsPragmatic,
        applicationMode: sermon.analysis.applicationMode,
        discourseMode: sermon.analysis.discourseMode,
        criticTarget: sermon.analysis.criticTarget,
        criticTone: sermon.analysis.criticTone,
        healthyOrDemobilizingCritique: sermon.analysis.healthyOrDemobilizingCritique,
        needsHumanReview: sermon.analysis.needsHumanReview,
        reviewReason: sermon.analysis.reviewReason,
        sensitivityLevel: sermon.analysis.sensitivityLevel,
        summary3Lines: sermon.analysis.summary3Lines,
        mainApplication: sermon.analysis.mainApplication,
        possibleFormativeGap: sermon.analysis.possibleFormativeGap,
      }}
      scores={scores}
      evidence={sermon.evidence.map((e) => ({
        id: e.id,
        field: e.scoreField,
        quote: e.evidenceQuote,
        comment: e.analyticalComment,
        start: e.evidenceStartIndex,
        end: e.evidenceEndIndex,
        scoreValue: e.scoreValue,
      }))}
      nextId={next?.sermonId ?? null}
    />
    <AuditButton sermonId={sermon.id} />
    </div>
  );
}
