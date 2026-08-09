import Link from "next/link";

// Calendário anual de pregações (estilo GitHub): linhas = anos, colunas = semanas.
// Server component — dados determinísticos (datas estimadas sinalizadas na página).

const SEQ = ["#eceff3", "#9ec5f4", "#3987e5", "#184f95"];

export default function CalendarHeatmap({
  dates,
}: {
  dates: { date: Date; year: number }[];
}) {
  const byYearWeek = new Map<number, Map<number, number>>();
  for (const { date, year } of dates) {
    const start = Date.UTC(year, 0, 1);
    const week = Math.min(52, Math.floor((date.getTime() - start) / (7 * 24 * 3600 * 1000)));
    const weeks = byYearWeek.get(year) ?? new Map<number, number>();
    weeks.set(week, (weeks.get(week) ?? 0) + 1);
    byYearWeek.set(year, weeks);
  }
  const years = [...byYearWeek.keys()].sort();

  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <tbody>
          {years.map((y) => {
            const weeks = byYearWeek.get(y)!;
            const total = [...weeks.values()].reduce((a, b) => a + b, 0);
            return (
              <tr key={y}>
                <td className="pr-2 text-xs text-secondary whitespace-nowrap">
                  <Link href={`/sermons?year=${y}`} className="hover:underline">{y}</Link>{" "}
                  <span className="text-muted">({total})</span>
                </td>
                {Array.from({ length: 53 }, (_, w) => {
                  const n = weeks.get(w) ?? 0;
                  return (
                    <td
                      key={w}
                      className="rounded-sm"
                      style={{
                        width: 10,
                        height: 10,
                        background: SEQ[Math.min(SEQ.length - 1, n)],
                      }}
                      title={n > 0 ? `${y}, semana ${w + 1}: ${n} pregação(ões)` : undefined}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
