import { NextRequest, NextResponse } from "next/server";
import { requireMaster, logSecurity } from "@/lib/security/master";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Revisão do relatório master (§35.8): marcar revisado/arquivado e adicionar notas.
// Não apaga versões — apenas muda status/notas do registro.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireMaster("/api/master/reports/[id]/review");
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const { status, notes } = await req.json().catch(() => ({}));
  const allowed = ["GENERATED", "REVIEWED", "ARCHIVED"];
  if (status && !allowed.includes(status)) {
    return NextResponse.json({ ok: false, error: "status inválido" }, { status: 400 });
  }

  const existing = await prisma.masterDiagnosticReport.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "relatório não encontrado" }, { status: 404 });

  const updated = await prisma.masterDiagnosticReport.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(typeof notes === "string" ? { notes: notes.slice(0, 4000) } : {}),
    },
    select: { id: true, status: true, notes: true },
  });

  await logSecurity({
    action: "master_review",
    result: "allowed",
    route: "/api/master/reports/[id]/review",
    resourceType: "master_report",
    resourceId: id,
    metadata: { status: updated.status },
  });

  return NextResponse.json({ ok: true, report: updated }, { headers: { "Cache-Control": "no-store" } });
}
