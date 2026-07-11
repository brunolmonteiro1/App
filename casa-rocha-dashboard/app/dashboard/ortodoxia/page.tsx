import { Card } from "@/components/Card";
import CodedBanner from "@/components/CodedBanner";
import { average, getCodedScores } from "@/lib/aggregates";
import { SCORE_FIELDS } from "@/lib/coding/score-fields";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SEQ = ["#f3f7fd", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
function cellColor(v: number, max: number): { bg: string; fg: string } {
  if (v <= 0 || max <= 0) return { bg: "transparent", fg: "var(--muted)" };
  const t = v / max;
  const idx = Math.min(SEQ.length - 1, 1 + Math.floor(t * (SEQ.length - 2)));
  return { bg: SEQ[idx], fg: t > 0.55 ? "#fff" : "var(--foreground)" };
}

const DOCTRINE_FIELDS = SCORE_FIELDS.filter(
  (f) => f.axis === "2. Ortodoxia" && f.field !== "orthodoxyScore"
);

export default async function OrtodoxiaPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const { reviewed } = await searchParams;
  const onlyReviewed = reviewed === "1";

  const [rows, total, codedCount, reviewedCount] = await Promise.all([
    getCodedScores({ onlyReviewed }),
    prisma.sermon.count({ where: { isSermon: true } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "ai_coded" } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "reviewed" } }),
  ]);

  // Ranking de doutrinas: média + centralidade (score >= 4)
  const ranking = DOCTRINE_FIELDS.map((f) => {
    const { value, n } = average(rows, f.field);
    const central = rows.filter((r) => {
      const s = (r.scores as unknown as Record<string, number | null>)[f.field];
      return s !== null && s !== undefined && s >= 4;
    }).length;
    return { field: f.field, label: f.label, avg: value, n, central };
  })
    .filter((r) => r.n > 0)
    .sort((a, b) => b.avg - a.avg);
  const maxAvg = Math.max(0.1, ...ranking.map((r) => r.avg));

  // Heatmap doutrina × ano (média por ano)
  const years = [...new Set(rows.map((r) => r.year).filter((y): y is number => y !== null))].sort();
  const cell = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    if (!r.year) continue;
    const s = r.scores as unknown as Record<string, number | null>;
    for (const f of DOCTRINE_FIELDS) {
      const v = s[f.field];
      if (v === null || v === undefined) continue;
      const key = `${f.field}|${r.year}`;
      const acc = cell.get(key) ?? { sum: 0, n: 0 };
      acc.sum += v;
      acc.n += 1;
      cell.set(key, acc);
    }
  }

  // Distribuições interpretativas
  const analyses = await prisma.sermonAnalysis.findMany({
    where: { analysisStatus: { in: onlyReviewed ? ["reviewed"] : ["ai_coded", "reviewed"] } },
    select: { sermonType: true, testamentPredominant: true, doctrineMain: true },
  });
  const count = (key: "sermonType" | "testamentPredominant" | "doctrineMain") => {
    const m = new Map<string, number>();
    for (const a of analyses) {
      const v = a[key] ?? "não identificado";
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Ortodoxia — análise doutrinária</h1>
        <CodedBanner coded={codedCount} reviewed={reviewedCount} total={total} onlyReviewed={onlyReviewed} />
      </div>

      {rows.length > 0 && (
        <>
          <Card
            title="Ranking de doutrinas (score médio 0–5 · centralidade = pregações com score ≥ 4)"
            footnote="Mede a ênfase doutrinária média nas pregações codificadas — não é nota de correção teológica."
          >
            <ul className="space-y-2">
              {ranking.map((r) => (
                <li key={r.field} className="flex items-center gap-3 text-sm">
                  <span className="w-64 shrink-0">{r.label}</span>
                  <div className="flex-1 h-4 rounded bg-background overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(r.avg / maxAvg) * 100}%`, background: "var(--series-1)" }} />
                  </div>
                  <span className="w-32 text-right text-secondary tabular-nums text-xs">
                    {r.avg.toFixed(2)} · central em {r.central} <span className="text-muted">(n={r.n})</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {years.length > 1 && (
            <Card title="Heatmap doutrina × ano (score médio)" footnote="Célula mais escura = ênfase média maior naquele ano.">
              <div className="overflow-x-auto">
                <table className="text-sm border-separate" style={{ borderSpacing: 2 }}>
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-muted font-medium pr-2">Doutrina</th>
                      {years.map((y) => <th key={y} className="text-xs text-muted font-medium px-1">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DOCTRINE_FIELDS.map((f) => (
                      <tr key={f.field}>
                        <td className="text-xs pr-2 whitespace-nowrap">{f.label}</td>
                        {years.map((y) => {
                          const c = cell.get(`${f.field}|${y}`);
                          const avg = c ? c.sum / c.n : 0;
                          const { bg, fg } = cellColor(avg, 5);
                          return (
                            <td
                              key={y}
                              className="rounded text-center text-[11px] tabular-nums min-w-12 px-1 py-1.5"
                              style={{ background: bg, color: fg }}
                              title={`${f.label} · ${y}: média ${avg.toFixed(2)} (n=${c?.n ?? 0})`}
                            >
                              {c ? avg.toFixed(1) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {(
              [
                ["Tipo de pregação", count("sermonType")],
                ["Testamento predominante", count("testamentPredominant")],
                ["Doutrina principal declarada", count("doctrineMain")],
              ] as const
            ).map(([title, entries]) => (
              <Card key={title} title={title}>
                <ul className="text-sm space-y-1">
                  {entries.slice(0, 8).map(([k, n]) => (
                    <li key={k} className="flex justify-between border-b border-hairline last:border-0 py-1">
                      <span className="truncate">{k.replace(/_/g, " ")}</span>
                      <span className="text-secondary tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
