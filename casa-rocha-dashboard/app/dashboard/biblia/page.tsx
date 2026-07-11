import Link from "next/link";
import Badge from "@/components/Badge";
import { Card, StatTile } from "@/components/Card";
import { prisma } from "@/lib/db";
import { BIBLE_BOOKS } from "@/lib/bible-books";

export const dynamic = "force-dynamic";

// Escala sequencial (azul, claro→escuro) para o mapa de cobertura.
const SEQ = ["#e8f0fb", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
function seqColor(n: number, max: number): string {
  if (n === 0) return "transparent";
  const idx = Math.min(SEQ.length - 1, 1 + Math.floor((n / max) * (SEQ.length - 2)));
  return SEQ[idx];
}

export default async function BibliaPage() {
  const [refsByBook, totalSermons, refsTotal, topPassages, byTestament] = await Promise.all([
    prisma.biblicalReference.groupBy({
      by: ["bookSlug"],
      _count: true,
    }),
    prisma.sermon.count({ where: { isSermon: true } }),
    prisma.biblicalReference.count(),
    prisma.$queryRaw<{ book: string; chapter: number; n: number }[]>`
      SELECT book, chapter, COUNT(DISTINCT sermonId) as n
      FROM biblical_references
      WHERE chapter IS NOT NULL
      GROUP BY book, chapter
      ORDER BY n DESC
      LIMIT 12
    `,
    prisma.biblicalReference.groupBy({ by: ["testament"], _count: true }),
  ]);

  // Nº de pregações distintas que citam cada livro
  const sermonsByBook = await prisma.$queryRaw<{ bookSlug: string; n: number }[]>`
    SELECT bookSlug, COUNT(DISTINCT sermonId) as n
    FROM biblical_references
    GROUP BY bookSlug
  `;
  const sermonCount = new Map(sermonsByBook.map((r) => [r.bookSlug, Number(r.n)]));
  const refCount = new Map(refsByBook.map((r) => [r.bookSlug, r._count]));
  const maxSermons = Math.max(1, ...sermonsByBook.map((r) => Number(r.n)));

  const at = byTestament.find((t) => t.testament === "AT")?._count ?? 0;
  const nt = byTestament.find((t) => t.testament === "NT")?._count ?? 0;
  const booksCovered = sermonsByBook.length;

  const grid = (testament: "AT" | "NT") =>
    BIBLE_BOOKS.filter((b) => b.testament === testament).map((b) => {
      const n = sermonCount.get(b.slug) ?? 0;
      return (
        <Link
          key={b.slug}
          href={`/sermons?book=${b.slug}`}
          title={`${b.name}: citado em ${n} pregações (${refCount.get(b.slug) ?? 0} referências)`}
          className="rounded-lg border border-hairline px-2 py-2 text-center text-[11px] leading-tight hover:ring-2 hover:ring-blue-300"
          style={{ background: seqColor(n, maxSermons), color: n / maxSermons > 0.55 ? "#fff" : "var(--foreground)" }}
        >
          <span className="block font-medium truncate">{b.name}</span>
          <span className="block opacity-80">{n || "—"}</span>
        </Link>
      );
    });

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Bíblia e homilética</h1>
        <div className="flex gap-2 items-center text-xs text-muted">
          <Badge kind="lexical" text="detecção automática (regex)" />
          <span>{refsTotal.toLocaleString("pt-BR")} referências em {totalSermons} pregações — dado determinístico</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="livros da Bíblia citados" value={`${booksCovered} / 66`} />
        <StatTile label="referências no AT" value={at.toLocaleString("pt-BR")} hint={`${((at / Math.max(1, at + nt)) * 100).toFixed(0)}% do total`} />
        <StatTile label="referências no NT" value={nt.toLocaleString("pt-BR")} hint={`${((nt / Math.max(1, at + nt)) * 100).toFixed(0)}% do total`} />
        <StatTile label="referências por pregação (média)" value={(refsTotal / Math.max(1, totalSermons)).toFixed(1)} />
      </div>

      <Card
        title="Mapa de cobertura da Bíblia — nº de pregações que citam cada livro"
        footnote="Clique num livro para abrir as pregações que o citam. Cor mais escura = mais pregações. '—' = livro nunca detectado no corpus (informação, não acusação: pode ter sido citado sem capítulo, ou tratado fora do púlpito dominical)."
      >
        <h3 className="text-xs font-medium text-muted mb-2">Antigo Testamento (ordem canônica)</h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-1.5 mb-4">{grid("AT")}</div>
        <h3 className="text-xs font-medium text-muted mb-2">Novo Testamento</h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-9 gap-1.5">{grid("NT")}</div>
      </Card>

      <Card title="Textos mais recorrentes (livro + capítulo, por nº de pregações)" footnote="Clique para abrir as pregações do livro.">
        <ul className="grid md:grid-cols-2 gap-1 text-sm">
          {topPassages.map((p) => {
            const book = BIBLE_BOOKS.find((b) => b.name === p.book);
            return (
              <li key={`${p.book}-${p.chapter}`} className="flex justify-between border-b border-hairline last:border-0 py-1">
                <Link href={`/sermons?book=${book?.slug ?? ""}`} className="hover:underline">
                  {p.book} {p.chapter}
                </Link>
                <span className="text-secondary">{Number(p.n)} pregações</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
