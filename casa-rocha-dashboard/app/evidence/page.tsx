import Link from "next/link";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/db";
import { SCORE_FIELDS } from "@/lib/coding/score-fields";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const METHOD_LABELS: Record<string, string> = {
  dictionary: "dicionário (lexical)",
  ai_coding: "codificação IA",
  human_review: "revisão humana",
};

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; method?: string; page?: string; q?: string }>;
}) {
  const { field, method, page: pageStr, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const where: Prisma.SermonEvidenceWhereInput = {};
  if (field) where.scoreField = field;
  if (method) where.analysisMethod = method;
  if (q) where.evidenceQuote = { contains: q };

  const [total, rows, fieldsInUse] = await Promise.all([
    prisma.sermonEvidence.count({ where }),
    prisma.sermonEvidence.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { sermon: { select: { id: true, title: true, series: true, year: true } } },
    }),
    prisma.sermonEvidence.groupBy({ by: ["scoreField"], orderBy: { scoreField: "asc" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fieldLabel = (f: string) => SCORE_FIELDS.find((s) => s.field === f)?.label ?? f;
  const qp = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ field, method, q, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Evidências auditáveis</h1>
      <p className="text-sm text-secondary max-w-3xl">
        Todo score relevante está ancorado num trecho literal da transcrição. Esta página permite ao
        presbitério auditar qualquer dado: filtre, leia o trecho e abra a pregação original.
      </p>

      <form method="get" className="flex flex-wrap gap-2 items-center text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar no texto da evidência…"
          className="rounded-lg border border-hairline bg-surface px-3 py-1.5 w-64"
        />
        <select name="field" defaultValue={field ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5 max-w-64">
          <option value="">Todas as categorias</option>
          {fieldsInUse.map((f) => (
            <option key={f.scoreField} value={f.scoreField}>{fieldLabel(f.scoreField)}</option>
          ))}
        </select>
        <select name="method" defaultValue={method ?? ""} className="rounded-lg border border-hairline bg-surface px-2 py-1.5">
          <option value="">Todos os métodos</option>
          {Object.entries(METHOD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="rounded-lg bg-foreground text-background px-3 py-1.5">Filtrar</button>
        {(field || method || q) && <Link href="/evidence" className="underline text-secondary">limpar</Link>}
      </form>

      <p className="text-sm text-secondary">{total.toLocaleString("pt-BR")} evidências</p>

      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="rounded-xl border border-hairline bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
              <span className="font-medium">{fieldLabel(e.scoreField)}</span>
              {e.scoreValue != null && <span className="text-secondary">score {e.scoreValue}</span>}
              <Badge kind={e.analysisMethod === "human_review" ? "reviewed" : e.analysisMethod === "ai_coding" ? "ai_coded" : "lexical"} text={METHOD_LABELS[e.analysisMethod] ?? e.analysisMethod} />
              {e.confidence && <span className="text-muted">confiança {e.confidence}</span>}
            </div>
            <blockquote className="text-sm text-secondary border-l-2 pl-3" style={{ borderColor: "var(--series-1)" }}>
              “{e.evidenceQuote.length > 400 ? e.evidenceQuote.slice(0, 400) + "…" : e.evidenceQuote}”
            </blockquote>
            {e.analyticalComment && <p className="text-xs text-muted mt-1">{e.analyticalComment}</p>}
            <p className="text-xs mt-2">
              <Link href={`/sermons/${e.sermon.id}`} className="underline">
                {e.sermon.title}
              </Link>{" "}
              <span className="text-muted">· {e.sermon.series ?? "—"} · {e.sermon.year ?? "—"}</span>
            </p>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted py-6 text-center">Nenhuma evidência com esses filtros.</li>}
      </ul>

      {pages > 1 && (
        <div className="flex gap-2 text-sm">
          {page > 1 && <Link className="underline" href={`/evidence${qp({ page: String(page - 1) })}`}>← anterior</Link>}
          <span className="text-muted">página {page} de {pages}</span>
          {page < pages && <Link className="underline" href={`/evidence${qp({ page: String(page + 1) })}`}>próxima →</Link>}
        </div>
      )}
    </div>
  );
}
