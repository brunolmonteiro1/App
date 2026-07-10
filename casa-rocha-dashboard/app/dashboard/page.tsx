import Badge from "@/components/Badge";
import { Card, StatTile } from "@/components/Card";
import BarChartLink from "@/components/charts/BarChartLink";
import IscTimeline from "@/components/charts/IscTimeline";
import { prisma } from "@/lib/db";
import { ISC_DEFAULT_THRESHOLD } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalSources, totalSermons, byYear, bySeries, analyzed, reviewed, satRows, lastImport] =
    await Promise.all([
      prisma.sermon.count(),
      prisma.sermon.count({ where: { isSermon: true } }),
      prisma.sermon.groupBy({
        by: ["year"],
        where: { isSermon: true, year: { not: null } },
        _count: true,
        orderBy: { year: "asc" },
      }),
      prisma.sermon.groupBy({
        by: ["series"],
        where: { isSermon: true, series: { not: null } },
        _count: true,
        orderBy: { _count: { series: "desc" } },
      }),
      prisma.sermonAnalysis.count({ where: { analysisStatus: "ai_coded" } }),
      prisma.sermonAnalysis.count({ where: { analysisStatus: "reviewed" } }),
      prisma.saturationMetric.findMany({
        where: { iscRatio: { not: null } },
        select: { iscRatio: true, sermon: { select: { year: true } } },
      }),
      prisma.importRun.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

  const threshold = Number(process.env.ISC_THRESHOLD ?? ISC_DEFAULT_THRESHOLD);
  const yearsCovered = byYear.map((r) => r.year as number);
  const iscByYear = new Map<number, { sum: number; n: number }>();
  for (const r of satRows) {
    const y = r.sermon.year;
    if (!y || r.iscRatio == null) continue;
    const acc = iscByYear.get(y) ?? { sum: 0, n: 0 };
    acc.sum += r.iscRatio;
    acc.n += 1;
    iscByYear.set(y, acc);
  }
  const iscData = [...iscByYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, { sum, n }]) => ({ year, isc: sum / n, n }));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Visão geral</h1>
        <div className="flex gap-2 items-center text-xs text-muted">
          <Badge kind="lexical" />
          <span>
            {analyzed + reviewed} de {totalSermons} pregações codificadas — dados interpretativos
            parciais; hipóteses a validar
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="pregações com transcrição" value={totalSermons} hint={`${totalSources} fontes no total`} />
        <StatTile
          label="anos cobertos"
          value={`${Math.min(...yearsCovered)}–${Math.max(...yearsCovered)}`}
          hint={`${yearsCovered.length} anos`}
        />
        <StatTile label="séries identificadas" value={bySeries.length} />
        <StatTile
          label="codificadas / revisadas"
          value={`${analyzed} / ${reviewed}`}
          hint="camadas interpretativas — Fase 3"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Pregações por ano" footnote="Clique numa barra para abrir as pregações do ano. Datas estimadas por interpolação (ver Qualidade de dados).">
          <BarChartLink
            data={byYear.map((r) => ({ key: String(r.year), label: String(r.year), value: r._count }))}
            drillParam="year"
          />
        </Card>
        <Card title="Pregações por série" footnote="Clique numa barra para abrir a série.">
          <BarChartLink
            data={bySeries.map((r) => ({ key: r.series as string, label: r.series as string, value: r._count }))}
            drillParam="series"
            vertical
            height={Math.max(260, bySeries.length * 26)}
          />
        </Card>
      </div>

      <Card
        title={`Índice de Saturação Crítica (ISC) — média anual · limiar ${threshold}%`}
        footnote="Métrica lexical: proporção entre menções de crítica ao sistema religioso e menções do Evangelho (cruz + cristologia). Hipótese a validar — não mede intenção. Denominadores no tooltip."
      >
        <div className="mb-2 flex gap-2">
          <Badge kind="lexical" />
        </div>
        <IscTimeline data={iscData} threshold={threshold} />
      </Card>

      {lastImport && (
        <p className="text-xs text-muted">
          Última importação: {lastImport.fileName} — {lastImport.sourcesTotal} fontes (
          {lastImport.sourcesNew} novas, {lastImport.sourcesUpdated} atualizadas,{" "}
          {lastImport.sourcesSkipped} inalteradas).
        </p>
      )}
    </div>
  );
}
