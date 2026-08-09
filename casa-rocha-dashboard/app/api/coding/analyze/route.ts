import { NextRequest, NextResponse } from "next/server";
import { analyzeSermon } from "@/lib/coding/analyze";
import { setModelPreference } from "@/lib/coding/model-preference";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { sermonId, model } = await req.json().catch(() => ({}));
  if (!sermonId || !model) {
    return NextResponse.json({ ok: false, error: "sermonId e model são obrigatórios" }, { status: 400 });
  }
  // Persiste o modelo escolhido como preferência da função "codificação".
  await setModelPreference("coding", model);
  const result = await analyzeSermon(sermonId, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
