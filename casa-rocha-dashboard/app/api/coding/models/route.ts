import { NextResponse } from "next/server";
import { listModels } from "@/lib/coding/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json({ models });
  } catch (e) {
    return NextResponse.json(
      { models: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 } // lista é opcional; o campo livre continua funcionando
    );
  }
}
