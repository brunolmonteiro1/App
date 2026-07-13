import { NextRequest, NextResponse } from "next/server";
import { setModelPreference } from "@/lib/coding/model-preference";
import { advanceRun, startRun } from "@/lib/coding/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Pipeline multi-etapas (Rodada H) conduzido UMA ETAPA POR REQUISIÇÃO, para que
// cada chamada HTTP seja uma única chamada de IA (dentro do timeout do proxy) e
// o cliente possa mostrar progresso por etapa.
//   - { sermonId, model }  → cria o run e roda a 1ª etapa (estrutura)
//   - { runId, model }     → roda a próxima etapa pendente do run
export async function POST(req: NextRequest) {
  const { sermonId, model, runId } = await req.json().catch(() => ({}));

  if (runId) {
    const step = await advanceRun(runId, model || undefined);
    return NextResponse.json(step, { status: step.ok ? 200 : 422 });
  }

  if (!sermonId || !model) {
    return NextResponse.json({ ok: false, error: "sermonId e model são obrigatórios" }, { status: 400 });
  }
  await setModelPreference("coding", model);
  const started = await startRun(sermonId, model);
  if (!started.ok) {
    return NextResponse.json({ ok: false, error: started.error, done: false, nextStage: null }, { status: 422 });
  }
  const step = await advanceRun(started.runId, model);
  return NextResponse.json(step, { status: step.ok ? 200 : 422 });
}
