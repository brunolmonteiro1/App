import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lista tentativas de IA de uma pregação (mais recentes primeiro).
export async function GET(req: NextRequest) {
  const sermonId = req.nextUrl.searchParams.get("sermonId");
  if (!sermonId) {
    return NextResponse.json({ error: "sermonId obrigatório" }, { status: 400 });
  }
  const attempts = await prisma.codingAttempt.findMany({
    where: { sermonId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      attemptType: true,
      model: true,
      status: true,
      failStage: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ attempts });
}
