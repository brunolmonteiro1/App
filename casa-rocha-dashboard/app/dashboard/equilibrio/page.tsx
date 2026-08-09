import Link from "next/link";
import { Card } from "@/components/Card";
import CodedBanner from "@/components/CodedBanner";
import AxisRadar from "@/components/charts/AxisRadar";
import QuadrantScatter from "@/components/charts/QuadrantScatter";
import { average, getCodedScores, RADAR_AXES } from "@/lib/aggregates";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EquilibrioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; series?: string; reviewed?: string }>;
}) {
  const { year, series, reviewed } = await searchParams;
  const onlyReviewed = reviewed === "1";

  const [rows, total, codedCount, reviewedCount, allYears, allSeries] = await Promise.all([
    getCodedScores({ onlyReviewed, year: year ? Number(year) : undefined, series: series || undefined }),
    prisma.sermon.count({ where: { isSermon: true } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "ai_coded" } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "reviewed" } }),
    prisma.sermon.groupBy({ by: ["year"], where: { isSermon: true, year: { not: null } }, orderBy: { year: "asc" } }),
    prisma.sermon.groupBy({ by: ["series"], where: { isSermon: true, series: { not: null } }, orderBy: { series: "asc" } }),
  ]);

  const points = rows
    .map((r) => {
      const s = r.scores as unknown as Record<string, number | null>;
      if (s.orthodoxyScore == null || s.orthopraxyScore == null) return null;
      return {
        id: r.id,
        title: r.title,
        x: s.orthodoxyScore,
        y: s.orthopraxyScore,
        status: r.analysis!.analysisStatus,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const quad = { q1: 0, q2: 0, q3: 0, q4: 0 };
  for (const p of points) {
    if (p.x >= 2.5 && p.y >= 2.5) quad.q1++;
    else if (p.x >= 2.5) quad.q2++;
    else if (p.y >= 2.5) quad.q3++;
    else quad.q4++;
  }

  const radarData = RADAR_AXES.map(({ axis, field }) => {
    const { value, n } = average(rows, field);
    return { axis, value: Number(value.toFixed(2)), n };
  });

  const qp = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ year, series, reviewed, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Ortodoxia × Ortopraxia</h1>
        <CodedBanner coded={codedCount} reviewed={reviewedCount} total={total} onlyReviewed={onlyReviewed} />
      </div>

      <form method="get" className="flex flex-wrap gap-2 items-center text-sm">
        <select name="year" defaultValue={year ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5">
          <option value="">Todos os anos</option>
          {allYears.map((r) => <option key={r.year} value={String(r.year)}>{r.year}</option>)}
        </select>
        <select name="series" defaultValue={series ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5">
          <option value="">Todas as séries</option>
          {allSeries.map((r) => <option key={r.series} value={r.series as string}>{r.series}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs text-secondary">
          <input type="checkbox" name="reviewed" value="1" defaultChecked={onlyReviewed} />
          só revisadas (percentuais finais)
        </label>
        <button className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm">Filtrar</button>
        {(year || series || reviewed) && <Link href="/dashboard/equilibrio" className="underline text-secondary">limpar</Link>}
      </form>

      {points.length > 0 && (
        <>
          <Card
            title="Cada ponto é uma pregação — clique para abrir"
            footnote="Pergunta do painel: a formação de crença correta é acompanhada de prática estruturada? Pontos claros = codificadas por IA (pendentes de revisão); escuros = revisadas. Quadrante superior direito destacado = alta ortodoxia + alta ortopraxia."
          >
            <QuadrantScatter data={points} xLabel="Ortodoxia (0–5)" yLabel="Ortopraxia (0–5)" />
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                ["Alta ortodoxia · alta ortopraxia", quad.q1],
                ["Alta ortodoxia · baixa ortopraxia", quad.q2],
                ["Baixa ortodoxia · alta ortopraxia", quad.q3],
                ["Baixa ortodoxia · baixa ortopraxia", quad.q4],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-xl border border-hairline bg-surface p-4">
                <div className="text-2xl font-semibold">{n}</div>
                <div className="text-xs text-secondary mt-1">{label}</div>
                <div className="text-[11px] text-muted">de {points.length} codificadas</div>
              </div>
            ))}
          </div>

          <Card
            title="Radar dos eixos de saúde formativa (score médio 0–5)"
            footnote="Média por eixo sobre as pregações codificadas do filtro atual — denominador no tooltip. Não é nota da igreja: é a ênfase média observada no púlpito dominical."
          >
            <AxisRadar data={radarData} />
          </Card>

          <p className="text-xs text-muted">
            Filtros por link: {" "}
            <Link href={qp({ reviewed: "1" })} className="underline">só revisadas</Link>
          </p>
        </>
      )}
    </div>
  );
}
