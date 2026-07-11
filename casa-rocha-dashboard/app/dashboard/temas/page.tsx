import Link from "next/link";
import Badge from "@/components/Badge";
import { Card } from "@/components/Card";
import { prisma } from "@/lib/db";
import { DICTIONARIES } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

// Heatmap tema × ano por densidade lexical média (por 10k palavras).
const SEQ = ["#f3f7fd", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
function cellColor(v: number, max: number): { bg: string; fg: string } {
  if (v <= 0 || max <= 0) return { bg: "transparent", fg: "var(--muted)" };
  const t = v / max;
  const idx = Math.min(SEQ.length - 1, 1 + Math.floor(t * (SEQ.length - 2)));
  return { bg: SEQ[idx], fg: t > 0.55 ? "#fff" : "var(--foreground)" };
}

export default async function TemasPage() {
  // densidade média por tema × ano (agregados do tema: term IS NULL)
  const rows = await prisma.$queryRaw<{ theme: string; year: number; avgDensity: number; n: number }[]>`
    SELECT lm.theme as theme, s.year as year, AVG(lm.densityPer10k) as avgDensity, COUNT(*) as n
    FROM lexical_metrics lm
    JOIN sermons s ON s.id = lm.sermonId
    WHERE lm.term IS NULL AND s.isSermon = 1 AND s.year IS NOT NULL
    GROUP BY lm.theme, s.year
    ORDER BY s.year
  `;

  const years = [...new Set(rows.map((r) => Number(r.year)))].sort();
  const themes = DICTIONARIES.map((d) => ({ theme: d.theme, label: d.label }));
  const cell = new Map<string, { v: number; n: number }>();
  let max = 0;
  for (const r of rows) {
    const v = Number(r.avgDensity);
    cell.set(`${r.theme}|${r.year}`, { v, n: Number(r.n) });
    if (v > max) max = v;
  }

  // termos mais frequentes no corpus (para leitura rápida)
  const topTerms = await prisma.$queryRaw<{ term: string; total: number }[]>`
    SELECT term, SUM(rawCount) as total
    FROM lexical_metrics
    WHERE term IS NOT NULL
    GROUP BY term
    ORDER BY total DESC
    LIMIT 20
  `;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Temas × ano (vocabulário)</h1>
        <div className="flex gap-2 items-center text-xs text-muted">
          <Badge kind="lexical" />
          <span>densidade lexical média por 10.000 palavras — frequência de vocabulário, não score teológico</span>
        </div>
      </div>

      <Card
        title="Heatmap: densidade lexical média por tema e ano"
        footnote="Célula mais escura = vocabulário do tema mais denso naquele ano. Clique num ano para abrir as pregações. Pergunta típica: a linguagem de crítica ao sistema mudou ao longo dos anos? O vocabulário de comunidade cresceu?"
      >
        <div className="overflow-x-auto">
          <table className="text-sm border-separate" style={{ borderSpacing: 2 }}>
            <thead>
              <tr>
                <th className="text-left text-xs text-muted font-medium pr-2">Tema</th>
                {years.map((y) => (
                  <th key={y} className="text-xs text-muted font-medium px-1">
                    <Link href={`/sermons?year=${y}`} className="hover:underline">{y}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {themes.map((t) => (
                <tr key={t.theme}>
                  <td className="text-xs pr-2 whitespace-nowrap">{t.label}</td>
                  {years.map((y) => {
                    const c = cell.get(`${t.theme}|${y}`);
                    const { bg, fg } = cellColor(c?.v ?? 0, max);
                    return (
                      <td
                        key={y}
                        className="rounded text-center text-[11px] tabular-nums min-w-14 px-1 py-1.5"
                        style={{ background: bg, color: fg }}
                        title={`${t.label} · ${y}: ${c ? c.v.toFixed(1) : 0} por 10k palavras (${c?.n ?? 0} pregações)`}
                      >
                        {c ? c.v.toFixed(0) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Termos mais frequentes no corpus (contagem bruta)" footnote="Contagem lexical simples — o sentido depende do contexto (ver CODEBOOK §5).">
        <div className="flex flex-wrap gap-2">
          {topTerms.map((t) => (
            <span key={t.term} className="rounded-full border border-hairline bg-background px-3 py-1 text-xs">
              {t.term} <span className="text-muted">({Number(t.total).toLocaleString("pt-BR")})</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
