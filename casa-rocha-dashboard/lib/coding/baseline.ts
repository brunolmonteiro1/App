// Lê o padrão confessional de docs/THEOLOGY_BASELINE.md (runtime, com cache).
// A análise é julgada contra o padrão da PRÓPRIA igreja, não contra suposições do modelo.

import { readFileSync } from "node:fs";
import { join } from "node:path";

let cache: { text: string; isPlaceholder: boolean } | null = null;

export function getBaseline(): { text: string; isPlaceholder: boolean } {
  if (cache) return cache;
  try {
    const raw = readFileSync(join(process.cwd(), "docs", "THEOLOGY_BASELINE.md"), "utf-8");
    const m = raw.match(/<!-- BASELINE:START -->([\s\S]*?)<!-- BASELINE:END -->/);
    const text = (m?.[1] ?? "").trim();
    const isPlaceholder = text.startsWith("PLACEHOLDER");
    cache = text
      ? { text: isPlaceholder ? text.replace(/^PLACEHOLDER[^\n]*\n/, "").trim() : text, isPlaceholder }
      : { text: "", isPlaceholder: true };
  } catch {
    cache = { text: "", isPlaceholder: true };
  }
  return cache;
}

export function baselinePromptSection(): string {
  const { text, isPlaceholder } = getBaseline();
  if (!text) return "";
  const label = isPlaceholder
    ? "PADRÃO DE REFERÊNCIA PARA 'SAUDÁVEL' (evangélico histórico — padrão neutro; a igreja ainda não definiu o próprio)"
    : "PADRÃO CONFESSIONAL DA IGREJA (referência oficial para 'saudável' nesta análise)";
  return `${label}:\n${text}`;
}
