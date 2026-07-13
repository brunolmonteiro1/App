import { NextRequest, NextResponse } from "next/server";
import { setModelPreference } from "@/lib/coding/model-preference";
import { resumeRun, runPipeline } from "@/lib/coding/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Dispara (ou retoma) o pipeline multi-etapas (Rodada H). Diferente de
// /api/coding/analyze (fluxo v1 de chamada única), aqui a codificação percorre
// as 5 etapas — cada uma retomável se uma falhar.
export async function POST(req: NextRequest) {
  const { sermonId, model, runId } = await req.json().catch(() => ({}));
  if (runId) {
    const result = await resumeRun(runId, model || undefined);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }
  if (!sermonId || !model) {
    return NextResponse.json({ ok: false, error: "sermonId e model são obrigatórios" }, { status: 400 });
  }
  await setModelPreference("coding", model);
  const result = await runPipeline(sermonId, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
