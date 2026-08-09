import { NextResponse } from "next/server";
import { requireMaster } from "@/lib/security/master";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireMaster("/api/master/reports");
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const reports = await prisma.masterDiagnosticReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, createdAt: true, source: true, model: true, hardnessLevel: true,
      status: true, reviewedOnly: true, includesPreliminaryData: true,
      generatedBy: true, notes: true, reportJson: true,
    },
  });
  return NextResponse.json(
    { ok: true, reports },
    { headers: { "Cache-Control": "no-store" } }
  );
}
