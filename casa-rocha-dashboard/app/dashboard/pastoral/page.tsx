import { Card } from "@/components/Card";
import CodedBanner from "@/components/CodedBanner";
import QuadrantScatter from "@/components/charts/QuadrantScatter";
import { average, getCodedScores, MATURITY_FUNNEL } from "@/lib/aggregates";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PastoralPage({
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

  const funnel = MATURITY_FUNNEL.map(({ label, field }) => {
    const { value, n } = average(rows, field);
    return { label, value, n };
  });
  const maxVal = Math.max(0.1, ...funnel.map((f) => f.value));

  const deconRecon = rows
    .map((r) => {
      const s = r.scores as unknown as Record<string, number | null>;
      if (s.religiousDeconstructionScore == null || s.discipleshipReconstructionScore == null) return null;
      return {
        id: r.id,
        title: r.title,
        x: s.religiousDeconstructionScore,
        y: s.discipleshipReconstructionScore,
        status: r.analysis!.analysisStatus,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const cynicism = average(rows, "cynicismElitismRiskScore");
  const passivity = average(rows, "passivityRiskScore");
  const method = average(rows, "practicalMethodScore");

  const ontoCounts = new Map<string, number>();
  for (const r of rows) {
    const v = r.analysis?.ontologicalVsPragmatic ?? "nao_identificavel";
    ontoCounts.set(v, (ontoCounts.get(v) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Saúde pastoral: cura, desconstrução e envio</h1>
        <CodedBanner coded={codedCount} reviewed={reviewedCount} total={total} onlyReviewed={onlyReviewed} />
      </div>

      {rows.length > 0 && (
        <>
          <Card
            title="Funil de maturidade — score médio por estágio (0–5)"
            footnote="Hipótese central do projeto: estágios iniciais (acolhimento/desconstrução) fortes e finais (envio/corresponsabilidade) mais fracos? Só afirmável sobre dados revisados. Denominador ao lado de cada barra."
          >
            <ul className="space-y-2">
              {funnel.map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  <span className="w-56 shrink-0">{f.label}</span>
                  <div className="flex-1 h-4 rounded bg-background overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{ width: `${(f.value / maxVal) * 100}%`, background: "var(--series-1)" }}
                    />
                  </div>
                  <span className="w-24 text-right text-secondary tabular-nums">
                    {f.value.toFixed(2)} <span className="text-muted text-xs">(n={f.n})</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Desconstrução religiosa × Reconstrução discipular"
            footnote="Pergunta do painel: a crítica ao sistema é acompanhada de reconstrução prática? Clique num ponto para abrir a pregação."
          >
            <QuadrantScatter data={deconRecon} xLabel="Desconstrução (0–5)" yLabel="Reconstrução (0–5)" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                ["Risco de passividade (médio)", passivity, "score de risco — a monitorar, não acusação"],
                ["Risco de cinismo/elitismo (médio)", cynicism, "paradoxo de Lc 18:11 — a monitorar"],
                ["Método prático (médio)", method, "há passo aplicável? mede o modo 'fazer'"],
              ] as const
            ).map(([label, agg, hint]) => (
              <div key={label} className="rounded-xl border border-hairline bg-surface p-4">
                <div className="text-3xl font-semibold tabular-nums">{agg.value.toFixed(2)}</div>
                <div className="text-sm text-secondary mt-1">{label}</div>
                <div className="text-[11px] text-muted mt-1">{hint} · n={agg.n}</div>
              </div>
            ))}
          </div>

          <Card
            title="Modo de ensino: ontológico (ser) × pragmático (fazer)"
            footnote="Lente mais direta para a hipótese central (CODEBOOK §4b). Score pragmático baixo não é defeito — orienta trilhas complementares, nunca mudança do púlpito."
          >
            <div className="flex flex-wrap gap-4">
              {["ontologico", "equilibrado", "pragmatico", "nao_identificavel"].map((k) => (
                <div key={k} className="rounded-lg border border-hairline bg-background px-4 py-3 text-center">
                  <div className="text-2xl font-semibold">{ontoCounts.get(k) ?? 0}</div>
                  <div className="text-xs text-secondary">{k.replace(/_/g, " ")}</div>
                </div>
              ))}
              <p className="text-xs text-muted self-center">de {rows.length} codificadas</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
