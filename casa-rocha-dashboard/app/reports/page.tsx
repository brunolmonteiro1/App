import Link from "next/link";
import Badge from "@/components/Badge";
import { Card } from "@/components/Card";
import { buildReportData } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ preliminar?: string }>;
}) {
  const { preliminar } = await searchParams;
  const preliminary = preliminar === "1";
  const d = await buildReportData(preliminary);
  const noFinalData = !preliminary && d.totals.used === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Relatórios para o presbitério</h1>
        <div className="flex gap-2 items-center">
          {!noFinalData && (
            <a
              href={`/api/reports/executive${preliminary ? "?preliminar=1" : ""}`}
              className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm"
            >
              Baixar resumo executivo (.md)
            </a>
          )}
        </div>
      </div>

      <p className="text-xs text-muted max-w-3xl">
        Percentuais finais usam apenas pregações <strong>revisadas</strong>. O modo preliminar
        (codificadas por IA, sem revisão) existe para acompanhamento interno e é sempre rotulado.
        {" "}
        {preliminary ? (
          <Link href="/reports" className="underline">ver modo final</Link>
        ) : (
          <Link href="/reports?preliminar=1" className="underline">ver modo preliminar</Link>
        )}
      </p>

      {preliminary && d.totals.used > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>RELATÓRIO PRELIMINAR</strong> — baseado em {d.totals.used} pregações codificadas por IA
          ainda não revisadas. Não usar como resultado final.
        </div>
      )}

      {noFinalData ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Nenhuma pregação revisada ainda.</strong> O relatório final se libera conforme você
          aprova pregações na <Link href="/coding" className="underline">revisão</Link>. Regra
          metodológica: sem revisão humana, sem percentual final.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                ["base do relatório", `${d.totals.used} de ${d.totals.sermons}`],
                ["revisadas", d.totals.reviewed],
                ["aguardando revisão", d.totals.coded],
                ["modo", d.mode],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-xl border border-hairline bg-surface p-4">
                <div className="text-2xl font-semibold">{v}</div>
                <div className="text-sm text-secondary mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Principais forças observadas">
              <ol className="text-sm space-y-1 list-decimal list-inside">
                {d.strengths.map((s) => (
                  <li key={s.label}>
                    {s.label} — <strong className="tabular-nums">{s.value.toFixed(2)}</strong>{" "}
                    <span className="text-muted text-xs">(n={s.n})</span>
                  </li>
                ))}
              </ol>
            </Card>
            <Card title="Oportunidades de formação (hipóteses a validar)" footnote="Candidatas a trilha complementar — grupos, cursos, discipulado. Nunca 'o púlpito deve mudar'.">
              <ol className="text-sm space-y-1 list-decimal list-inside">
                {d.opportunities.map((s) => (
                  <li key={s.label}>
                    {s.label} — <strong className="tabular-nums">{s.value.toFixed(2)}</strong>{" "}
                    <span className="text-muted text-xs">(n={s.n})</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card title="Por série (ortodoxia × ortopraxia médias)">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-hairline">
                    <th className="py-2 pr-3 font-medium">Série</th>
                    <th className="py-2 pr-3 font-medium">Codificadas</th>
                    <th className="py-2 pr-3 font-medium">Ortodoxia</th>
                    <th className="py-2 font-medium">Ortopraxia</th>
                  </tr>
                </thead>
                <tbody>
                  {d.bySeries.map((s) => (
                    <tr key={s.series} className="border-b border-hairline last:border-0">
                      <td className="py-1.5 pr-3">{s.series}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{s.n}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{s.orthodoxy ?? "—"}</td>
                      <td className="py-1.5 tabular-nums">{s.orthopraxy ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {d.reliability && d.reliability.length > 0 && (
            <Card
              title="Confiabilidade do método — concordância IA × revisor"
              footnote="Comparação entre os scores originais da IA (snapshot) e os scores finais após revisão. Transforma 'a IA disse' em 'método com confiabilidade medida' (METHODOLOGY §6)."
            >
              <div className="mb-2"><Badge kind="reviewed" /></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-hairline">
                      <th className="py-2 pr-3 font-medium">Eixo</th>
                      <th className="py-2 pr-3 font-medium">Concordância exata</th>
                      <th className="py-2 pr-3 font-medium">Adjacente (±1)</th>
                      <th className="py-2 font-medium">Comparações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.reliability.map((r) => (
                      <tr key={r.axis} className="border-b border-hairline last:border-0">
                        <td className="py-1.5 pr-3">{r.axis}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{r.exact}%</td>
                        <td className="py-1.5 pr-3 tabular-nums">{r.adjacent}%</td>
                        <td className="py-1.5 tabular-nums">{r.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <p className="text-xs text-muted max-w-3xl">
            O arquivo .md inclui tudo desta página + funil de maturidade, ISC anual e a seção fixa de
            limitações. Todo dado é auditável na página <Link href="/evidence" className="underline">Evidências</Link>.
          </p>
        </>
      )}
    </div>
  );
}
