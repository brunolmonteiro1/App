import { NextRequest, NextResponse } from "next/server";
import { setModelPreference } from "@/lib/coding/model-preference";
import { enqueueSermons, pendingSermonIds, queueSnapshot, startWorker } from "@/lib/coding/worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Fila durável de codificação (worker interno). O estado vive no servidor: a
// página pode ser fechada sem interromper o processamento.
//   POST { sermonIds }        → enfileira essas pregações
//   POST { all:true, limit? } → enfileira todas as pendentes (até limit)
//   GET                        → snapshot da fila (contagens + job corrente)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sermonIds, all, limit, model } = body as {
    sermonIds?: string[];
    all?: boolean;
    limit?: number;
    model?: string;
  };
  if (model) await setModelPreference("coding", model);

  let ids: string[] = Array.isArray(sermonIds) ? sermonIds : [];
  if (all) ids = await pendingSermonIds(typeof limit === "number" ? limit : undefined);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "nenhuma pregação para enfileirar" }, { status: 400 });
  }

  const enqueued = await enqueueSermons(ids, model);
  startWorker();
  const snap = await queueSnapshot();
  return NextResponse.json({ ...snap, enqueued });
}

export async function GET() {
  const snap = await queueSnapshot();
  return NextResponse.json(snap);
}
