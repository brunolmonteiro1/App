import { NextRequest, NextResponse } from "next/server";
import { auditCoding } from "@/lib/coding/audit";
import { setModelPreference } from "@/lib/coding/model-preference";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Auditoria por IA sob demanda (§17): segunda passagem que só aponta problemas —
// nunca altera a análise persistida.
export async function POST(req: NextRequest) {
  const { sermonId, model } = await req.json().catch(() => ({}));
  if (!sermonId || !model) {
    return NextResponse.json({ ok: false, error: "sermonId e model são obrigatórios" }, { status: 400 });
  }
  await setModelPreference("audit", model);
  const result = await auditCoding(sermonId, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
