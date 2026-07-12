import { NextRequest, NextResponse } from "next/server";
import { requireMaster, logSecurity } from "@/lib/security/master";
import { generateMasterReport } from "@/lib/diagnostics/generate";
import { parseFilters } from "@/lib/diagnostics/parse-filters";
import { setModelPreference } from "@/lib/coding/model-preference";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const denied = await requireMaster("/api/master/generate");
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const body = await req.json().catch(() => ({}));
  const filters = parseFilters(body);
  const useAi = Boolean(body?.useAi);
  const model = typeof body?.model === "string" ? body.model : undefined;
  const label = typeof body?.label === "string" ? body.label : null;

  if (useAi && model) await setModelPreference("master", model);

  const result = await generateMasterReport({ filters, useAi, model, generatedBy: label });

  await logSecurity({
    action: "master_generate",
    result: result.ok ? "allowed" : "denied",
    route: "/api/master/generate",
    resourceType: "master_report",
    resourceId: result.reportId,
    metadata: { source: result.source, useAi, hardness: filters.hardness, error: result.error },
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
