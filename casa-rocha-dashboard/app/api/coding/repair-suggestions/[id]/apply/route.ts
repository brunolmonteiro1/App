import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SCORE_FIELD_NAMES } from "@/lib/coding/score-fields";

export const dynamic = "force-dynamic";

// Aplica uma sugestão de score — EXIGE ação humana (nome do revisor).
// Gera HumanReviewEvent com antes/depois. Nunca automático.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { reviewedBy, note } = await req.json().catch(() => ({}));
  if (!reviewedBy) {
    return NextResponse.json({ ok: false, error: "reviewedBy (nome do revisor) é obrigatório para aplicar" }, { status: 400 });
  }
  const sug = await prisma.codingRepairSuggestion.findUnique({ where: { id } });
  if (!sug) return NextResponse.json({ ok: false, error: "sugestão não encontrada" }, { status: 404 });
  if (sug.status !== "PENDING") return NextResponse.json({ ok: false, error: `sugestão já está ${sug.status}` }, { status: 409 });
  if (!SCORE_FIELD_NAMES.includes(sug.scoreField)) {
    return NextResponse.json({ ok: false, error: "campo de score inválido" }, { status: 400 });
  }

  const scores = await prisma.sermonScores.findUnique({ where: { sermonId: sug.sermonId } });
  const oldValue = scores ? (scores as unknown as Record<string, number | null>)[sug.scoreField] ?? null : null;

  await prisma.$transaction([
    prisma.sermonScores.upsert({
      where: { sermonId: sug.sermonId },
      create: { sermonId: sug.sermonId, [sug.scoreField]: sug.suggestedScore },
      update: { [sug.scoreField]: sug.suggestedScore },
    }),
    prisma.codingRepairSuggestion.update({
      where: { id },
      data: { status: "APPLIED", reviewedBy, reviewedAt: new Date(), reviewNote: note ?? null },
    }),
    prisma.humanReviewEvent.create({
      data: {
        sermonId: sug.sermonId,
        entityType: "suggestion",
        entityId: id,
        action: "apply_suggestion",
        fieldName: sug.scoreField,
        oldValueJson: JSON.stringify(oldValue),
        newValueJson: JSON.stringify(sug.suggestedScore),
        reason: note ?? sug.suggestionReason ?? null,
        performedBy: reviewedBy,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, applied: { field: sug.scoreField, from: oldValue, to: sug.suggestedScore } });
}
