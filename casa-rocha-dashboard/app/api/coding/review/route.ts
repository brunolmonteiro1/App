import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SCORE_FIELD_NAMES } from "@/lib/coding/score-fields";

export const dynamic = "force-dynamic";

// Ações de revisão humana: approve | adjust (scores/campos editados) | reject (volta a pending)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sermonId, action, reviewedBy, scores, fields } = body as {
    sermonId?: string;
    action?: "approve" | "adjust" | "reject";
    reviewedBy?: string;
    scores?: Record<string, number | null>;
    fields?: Record<string, string | null>;
  };
  if (!sermonId || !action) {
    return NextResponse.json({ ok: false, error: "sermonId e action são obrigatórios" }, { status: 400 });
  }
  const analysis = await prisma.sermonAnalysis.findUnique({ where: { sermonId } });
  if (!analysis) {
    return NextResponse.json({ ok: false, error: "pregação sem análise para revisar" }, { status: 404 });
  }

  if (action === "reject") {
    await prisma.sermonAnalysis.update({
      where: { sermonId },
      data: { analysisStatus: "pending", reviewStatus: "rejected", reviewedBy: reviewedBy ?? null, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "pending" });
  }

  // approve / adjust
  if (action === "adjust" && scores) {
    const clean: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (!SCORE_FIELD_NAMES.includes(k)) continue;
      if (v === null) clean[k] = null;
      else if (Number.isInteger(v) && v >= 0 && v <= 5) clean[k] = v;
      else return NextResponse.json({ ok: false, error: `score inválido em ${k}: ${v}` }, { status: 400 });
    }
    await prisma.sermonScores.upsert({
      where: { sermonId },
      create: { sermonId, ...clean },
      update: clean,
    });
    // Marca evidências ajustadas como revisão humana (proveniência)
    await prisma.sermonEvidence.updateMany({
      where: { sermonId, analysisMethod: "ai_coding" },
      data: { analysisMethod: "human_review" },
    });
  }

  const editableFields = ["mainTheme", "biblicalMainText", "sermonType", "doctrineMain", "ontologicalVsPragmatic", "summary3Lines", "mainApplication", "possibleFormativeGap", "confidenceGlobal"];
  const fieldData: Record<string, string | null> = {};
  if (action === "adjust" && fields) {
    for (const [k, v] of Object.entries(fields)) {
      if (editableFields.includes(k)) fieldData[k] = v;
    }
  }

  await prisma.sermonAnalysis.update({
    where: { sermonId },
    data: {
      ...fieldData,
      analysisStatus: "reviewed",
      reviewStatus: action === "adjust" ? "adjusted" : "approved",
      reviewedBy: reviewedBy || "revisor",
      reviewedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true, status: "reviewed" });
}
