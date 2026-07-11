import Link from "next/link";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; series?: string; page?: string; fulltext?: string; book?: string }>;
}) {
  const { q, year, series, page: pageStr, fulltext, book } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const where: Prisma.SermonWhereInput = { isSermon: true };
  if (year) where.year = parseInt(year, 10);
  if (series) where.series = series;
  if (book) where.references = { some: { bookSlug: book } };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { normalizedTitle: { contains: q } },
      ...(fulltext === "1" ? [{ transcriptText: { contains: q } }] : []),
    ];
  }

  const [total, rows, allSeries, allYears] = await Promise.all([
    prisma.sermon.count({ where }),
    prisma.sermon.findMany({
      where,
      orderBy: [{ dateEstimated: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, series: true, year: true, dateEstimated: true,
        dateConfidence: true, youtubeUrl: true, durationRaw: true,
        transcriptWordCount: true, metadataConflict: true,
        analysis: { select: { analysisStatus: true } },
      },
    }),
    prisma.sermon.groupBy({ by: ["series"], where: { isSermon: true, series: { not: null } }, orderBy: { series: "asc" } }),
    prisma.sermon.groupBy({ by: ["year"], where: { isSermon: true, year: { not: null } }, orderBy: { year: "asc" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qp = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, year, series, fulltext, book, ...over })) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Acervo de pregações</h1>

      <form className="flex flex-wrap gap-2 items-center" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título…"
          className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm w-64"
        />
        <label className="text-xs text-secondary flex items-center gap-1">
          <input type="checkbox" name="fulltext" value="1" defaultChecked={fulltext === "1"} />
          buscar também nas transcrições
        </label>
        <select name="year" defaultValue={year ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm">
          <option value="">Todos os anos</option>
          {allYears.map((r) => (
            <option key={r.year} value={String(r.year)}>{r.year}</option>
          ))}
        </select>
        <select name="series" defaultValue={series ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm">
          <option value="">Todas as séries</option>
          {allSeries.map((r) => (
            <option key={r.series} value={r.series as string}>{r.series}</option>
          ))}
        </select>
        <button className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm" type="submit">
          Filtrar
        </button>
        {(q || year || series || book) && (
          <Link href="/sermons" className="text-sm text-secondary underline">limpar</Link>
        )}
      </form>

      <p className="text-sm text-secondary">
        {total} pregações{year ? ` · ano ${year}` : ""}{series ? ` · série ${series}` : ""}
        {book ? ` · citando ${book}` : ""}{q ? ` · busca "${q}"` : ""}
      </p>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-hairline">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Título</th>
              <th className="px-3 py-2 font-medium">Série</th>
              <th className="px-3 py-2 font-medium">Duração</th>
              <th className="px-3 py-2 font-medium">Palavras</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-hairline last:border-0 hover:bg-background">
                <td className="px-3 py-2 whitespace-nowrap text-secondary">
                  {s.dateEstimated ? new Date(s.dateEstimated).toISOString().slice(0, 10) : "—"}
                  {s.dateConfidence && s.dateConfidence.toLowerCase() !== "alta" && (
                    <span className="ml-1"><Badge kind="estimada" /></span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/sermons/${s.id}`} className="hover:underline">{s.title}</Link>
                  {s.metadataConflict && <span className="ml-1"><Badge kind="conflito" /></span>}
                </td>
                <td className="px-3 py-2 text-secondary whitespace-nowrap">{s.series ?? "—"}</td>
                <td className="px-3 py-2 text-secondary">{s.durationRaw ?? "—"}</td>
                <td className="px-3 py-2 text-secondary">{s.transcriptWordCount.toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2">
                  <Badge kind={s.analysis?.analysisStatus === "reviewed" ? "reviewed" : s.analysis?.analysisStatus === "ai_coded" ? "ai_coded" : "lexical"} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">Nenhuma pregação encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2 text-sm">
          {page > 1 && <Link className="underline" href={`/sermons${qp({ page: String(page - 1) })}`}>← anterior</Link>}
          <span className="text-muted">página {page} de {pages}</span>
          {page < pages && <Link className="underline" href={`/sermons${qp({ page: String(page + 1) })}`}>próxima →</Link>}
        </div>
      )}
    </div>
  );
}
