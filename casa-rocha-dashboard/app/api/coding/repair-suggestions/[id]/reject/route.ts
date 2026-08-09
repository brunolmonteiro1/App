import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Rejeita uma sugestão — registra a decisão (não altera score).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { reviewedBy, note } = await req.json().catch(() => ({}));
  const sug = await prisma.codingRepairSuggestion.findUnique({ where: { id } });
  if (!sug) return NextResponse.json({ ok: false, error: "sugestão não encontrada" }, { status: 404 });
  if (sug.status !== "PENDING") return NextResponse.json({ ok: false, error: `sugestão já está ${sug.status}` }, { status: 409 });

  await prisma.$transaction([
    prisma.codingRepairSuggestion.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: reviewedBy ?? "revisor", reviewedAt: new Date(), reviewNote: note ?? null },
    }),
    prisma.humanReviewEvent.create({
      data: {
        sermonId: sug.sermonId,
        entityType: "suggestion",
        entityId: id,
        action: "reject_suggestion",
        fieldName: sug.scoreField,
        reason: note ?? null,
        performedBy: reviewedBy ?? "revisor",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
