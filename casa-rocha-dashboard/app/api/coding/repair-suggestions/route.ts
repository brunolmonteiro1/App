import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SCORE_FIELDS } from "@/lib/coding/score-fields";

export const dynamic = "force-dynamic";

// Lista sugestões de reparo pendentes (BLUEPRINT v2 §8.8).
export async function GET() {
  const suggestions = await prisma.codingRepairSuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { sermon: { select: { id: true, title: true } } },
  });
  const label = (f: string) => SCORE_FIELDS.find((s) => s.field === f)?.label ?? f;
  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      sermonId: s.sermonId,
      sermonTitle: s.sermon.title,
      scoreField: s.scoreField,
      scoreLabel: label(s.scoreField),
      originalScore: s.originalScore,
      suggestedScore: s.suggestedScore,
      reason: s.suggestionReason,
      model: s.suggestedByModel,
    })),
  });
}
