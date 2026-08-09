import { NextResponse } from "next/server";
import { listCatalog } from "@/lib/coding/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  // listCatalog já trata falha internamente (cai no fallback de presets);
  // por isso nunca lança — a lista sempre volta preenchida, com `source`
  // indicando se veio da API do OpenRouter ou dos presets locais.
  const catalog = await listCatalog();
  return NextResponse.json(catalog);
}
