import { NextRequest, NextResponse } from "next/server";
import { setModelPreference } from "@/lib/coding/model-preference";
import { getRunSnapshot, launchRunInBackground, startRun } from "@/lib/coding/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pipeline multi-etapas (Rodada H) em SEGUNDO PLANO + polling de status.
// Etapas longas (a estrutura pode levar minutos) não seguram a conexão HTTP:
// o servidor roda o pipeline em background e o cliente consulta o snapshot.
//   - { sermonId, model }        → cria o run, dispara em background, devolve snapshot
//   - { runId }                  → devolve o snapshot atual (polling)
//   - { runId, action:"resume" } → re-dispara o background (retomar após restart)
export async function POST(req: NextRequest) {
  const { sermonId, model, runId, action } = await req.json().catch(() => ({}));

  if (runId && action === "resume") {
    launchRunInBackground(runId, model || undefined);
    const snap = await getRunSnapshot(runId);
    return NextResponse.json(snap, { status: snap.ok ? 200 : 404 });
  }

  if (runId) {
    const snap = await getRunSnapshot(runId);
    return NextResponse.json(snap, { status: snap.ok ? 200 : 404 });
  }

  if (!sermonId || !model) {
    return NextResponse.json({ ok: false, error: "sermonId e model são obrigatórios" }, { status: 400 });
  }
  await setModelPreference("coding", model);
  const started = await startRun(sermonId, model);
  if (!started.ok) {
    return NextResponse.json({ ok: false, error: started.error }, { status: 422 });
  }
  launchRunInBackground(started.runId, model);
  const snap = await getRunSnapshot(started.runId);
  return NextResponse.json(snap, { status: 200 });
}
