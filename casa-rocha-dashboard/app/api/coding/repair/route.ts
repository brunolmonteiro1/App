import { NextRequest, NextResponse } from "next/server";
import { repairEvidence } from "@/lib/coding/repair";
import { setModelPreference } from "@/lib/coding/model-preference";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Reparo por evidência de uma tentativa que falhou (BLUEPRINT v2 §18).
export async function POST(req: NextRequest) {
  const { attemptId, model } = await req.json().catch(() => ({}));
  if (!attemptId || !model) {
    return NextResponse.json({ ok: false, error: "attemptId e model são obrigatórios" }, { status: 400 });
  }
  await setModelPreference("repair", model);
  const result = await repairEvidence(attemptId, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
