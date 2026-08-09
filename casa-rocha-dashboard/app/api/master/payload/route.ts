import { NextRequest, NextResponse } from "next/server";
import { requireMaster, logSecurity } from "@/lib/security/master";
import { buildMasterPayload } from "@/lib/diagnostics/master-aggregate";
import { parseFilters } from "@/lib/diagnostics/parse-filters";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireMaster("/api/master/payload");
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const filters = parseFilters(await req.json().catch(() => ({})));
  const payload = await buildMasterPayload(filters);
  await logSecurity({
    action: "master_view",
    result: "allowed",
    route: "/api/master/payload",
    metadata: { year: filters.year, series: filters.series, includePreliminary: filters.includePreliminary },
  });
  return NextResponse.json(
    { ok: true, payload },
    { headers: { "Cache-Control": "no-store" } }
  );
}
