// Parsing determinístico de títulos, URLs e metadados (PIPELINE.md §1.3–1.4)

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ??
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ??
    url.match(/youtube\.com\/(?:embed|live|shorts)\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export interface ParsedTitle {
  messageNumber: number | null;
  normalizedTitle: string;
  preacher: string | null;
  seriesRaw: string | null;
}

// Padrão: "#NN - Título - Zé Bruno - Série" (tolerante a espaços/hífens irregulares)
export function parseSermonTitle(title: string): ParsedTitle {
  const t = title.trim().replace(/\s+/g, " ");
  const numMatch = t.match(/^#\s*(\d+)\s*-?\s*/);
  const messageNumber = numMatch ? parseInt(numMatch[1], 10) : null;
  const rest = numMatch ? t.slice(numMatch[0].length) : t;

  const parts = rest.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  let preacher: string | null = null;
  let seriesRaw: string | null = null;
  let normalizedTitle = rest;

  if (parts.length >= 3) {
    // [título..., pregador, série] — pregador é o penúltimo segmento
    seriesRaw = parts[parts.length - 1];
    preacher = parts[parts.length - 2];
    normalizedTitle = parts.slice(0, parts.length - 2).join(" - ");
  } else if (parts.length === 2) {
    normalizedTitle = parts[0];
    seriesRaw = parts[1];
  }
  return { messageNumber, normalizedTitle, preacher, seriesRaw };
}

const KNOWN_SERIES = [
  "O Caminho da Cruz",
  "A Videira",
  "Do Princípio ao Fim",
  "A Vida em Parábolas",
  "A Última Semana",
  "Meu Caro Amigo 2",
  "Meu Caro Amigo",
  "Quem é Jesus?",
  "O Povo da Cruz",
  "Juntos no Natal",
  "Deus Conosco",
  "Mensagens Especiais",
];

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[?!.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SERIES_INDEX = new Map(KNOWN_SERIES.map((s) => [fold(s), s]));

export function normalizeSeries(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = fold(raw);
  if (SERIES_INDEX.has(key)) return SERIES_INDEX.get(key)!;
  // ordem importa: "meu caro amigo 2" antes de "meu caro amigo"
  for (const [k, canonical] of SERIES_INDEX) {
    if (key === k || key.startsWith(k + " ") || k.startsWith(key + " ")) return canonical;
  }
  return null;
}

export function parseDurationToSeconds(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
