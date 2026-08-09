import Link from "next/link";
import Badge from "@/components/Badge";
import { Card } from "@/components/Card";
import SeriesRadar, { type SeriesRadarRow } from "@/components/charts/SeriesRadar";
import { average, getCodedScores, RADAR_AXES } from "@/lib/aggregates";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}) {
  const { a, b, c } = await searchParams;
  const selected = [a, b, c].filter((s): s is string => Boolean(s)).slice(0, 3);

  const [seriesStats, codedAll] = await Promise.all([
    prisma.$queryRaw<
      { series: string; n: number; avgWords: number; avgIsc: number | null; firstYear: number; lastYear: number }[]
    >`
      SELECT s.series as series, COUNT(*) as n, AVG(s.transcriptWordCount) as avgWords,
             AVG(sat.iscRatio) as avgIsc, MIN(s.year) as firstYear, MAX(s.year) as lastYear
      FROM sermons s
      LEFT JOIN saturation_metrics sat ON sat.sermonId = s.id
      WHERE s.isSermon = 1 AND s.series IS NOT NULL
      GROUP BY s.series
      ORDER BY n DESC
    `,
    getCodedScores({}),
  ]);

  const codedBySeries = new Map<string, typeof codedAll>();
  for (const row of codedAll) {
    if (!row.series) continue;
    const list = codedBySeries.get(row.series) ?? [];
    list.push(row);
    codedBySeries.set(row.series, list);
  }

  const radarData: SeriesRadarRow[] = RADAR_AXES.map(({ axis, field }) => {
    const row: SeriesRadarRow = { axis };
    for (const name of selected) {
      const rows = codedBySeries.get(name) ?? [];
      const { value, n } = average(rows, field);
      row[name] = n > 0 ? Number(value.toFixed(2)) : null;
    }
    return row;
  });

  const codedCounts = selected.map((name) => ({ name, n: (codedBySeries.get(name) ?? []).length }));
  const hasCoded = codedCounts.some((s) => s.n > 0);

  const qp = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Séries — panorama e comparador</h1>

      <Card
        title="Todas as séries (métricas determinísticas + lexicais)"
        footnote="O sinal lexical de crítica médio é métrica lexical (hipótese a validar). Clique no nome para abrir as pregações; use os botões A/B/C para comparar no radar."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-hairline">
                <th className="py-2 pr-3 font-medium">Série</th>
                <th className="py-2 pr-3 font-medium">Pregações</th>
                <th className="py-2 pr-3 font-medium">Período</th>
                <th className="py-2 pr-3 font-medium">Palavras (média)</th>
                <th className="py-2 pr-3 font-medium">Sinal lexical de crítica (médio)</th>
                <th className="py-2 pr-3 font-medium">Codificadas</th>
                <th className="py-2 font-medium">Comparar</th>
              </tr>
            </thead>
            <tbody>
              {seriesStats.map((s) => (
                <tr key={s.series} className="border-b border-hairline last:border-0">
                  <td className="py-1.5 pr-3">
                    <Link href={`/sermons?series=${encodeURIComponent(s.series)}`} className="hover:underline">{s.series}</Link>
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{Number(s.n)}</td>
                  <td className="py-1.5 pr-3 text-secondary">{Number(s.firstYear)}–{Number(s.lastYear)}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{Math.round(Number(s.avgWords)).toLocaleString("pt-BR")}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{s.avgIsc != null ? `${Number(s.avgIsc).toFixed(1)}%` : "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{(codedBySeries.get(s.series) ?? []).length}</td>
                  <td className="py-1.5 flex gap-1">
                    <Link href={`/dashboard/series${qp({ a: s.series, b, c })}`} className="rounded border border-hairline px-1.5 text-xs">A</Link>
                    <Link href={`/dashboard/series${qp({ a, b: s.series, c })}`} className="rounded border border-hairline px-1.5 text-xs">B</Link>
                    <Link href={`/dashboard/series${qp({ a, b, c: s.series })}`} className="rounded border border-hairline px-1.5 text-xs">C</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected.length >= 2 && (
        <Card
          title={`Comparador: ${selected.join(" × ")}`}
          footnote={
            hasCoded
              ? `Radar sobre pregações codificadas por série: ${codedCounts.map((s) => `${s.name} (n=${s.n})`).join(" · ")}. Série sem codificação aparece vazia.`
              : "Nenhuma das séries selecionadas tem pregações codificadas ainda — o radar se popula conforme a codificação avança (página Codificação)."
          }
        >
          <div className="mb-2"><Badge kind="ai_coded" text="dados codificados (IA + revisadas)" /></div>
          {hasCoded ? (
            <SeriesRadar data={radarData} seriesNames={selected} />
          ) : (
            <p className="text-sm text-muted py-8 text-center">Sem dados codificados para comparar.</p>
          )}
          <p className="text-xs text-muted mt-2">
            <Link href="/dashboard/series" className="underline">limpar seleção</Link>
          </p>
        </Card>
      )}
      {selected.length < 2 && (
        <p className="text-sm text-muted">Selecione 2 ou 3 séries (botões A/B/C) para sobrepor no radar.</p>
      )}
    </div>
  );
}
