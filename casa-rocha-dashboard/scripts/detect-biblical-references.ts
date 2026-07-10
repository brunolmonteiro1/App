// Motor bíblico determinístico (PIPELINE.md §2): detecta referências
// "Livro Capítulo[:.]Verso[-a Verso]" em pt-BR e grava BiblicalReference.
// Anti-falso-positivo: só conta livro seguido de número de capítulo.
// Uso: npx tsx scripts/detect-biblical-references.ts

import { prisma } from "../lib/db";
import { BIBLE_BOOKS } from "../lib/bible-books";

function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Mapa variante(fold) → livro. Variantes mais longas primeiro (evita "João" engolir "1 João").
const VARIANTS: { pattern: string; slug: string }[] = [];
for (const book of BIBLE_BOOKS) {
  for (const v of book.variants) {
    VARIANTS.push({ pattern: fold(v), slug: book.slug });
    // abreviações de 2 letras só valem com capítulo colado — já garantido pela regex geral
  }
}
VARIANTS.sort((a, b) => b.pattern.length - a.pattern.length);

const BOOK_ALTERNATION = VARIANTS.map((v) =>
  v.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");

// "gênesis 1:26 a 31" | "joão 15" | "romanos 8.28-30" | "gênesis capítulo 1 verso 26 a 31"
const REF_REGEX = new RegExp(
  `\\b(${BOOK_ALTERNATION})\\s+(?:cap[ií]tulo\\s+)?(\\d{1,3})` +
    `(?:\\s*(?:[:.]|vers[ií]culos?\\s|verso\\s)\\s*(\\d{1,3})(?:\\s*(?:-|a|ao|até)\\s*(\\d{1,3}))?)?`,
  "gi"
);

const SLUG_BY_FOLDED = new Map(VARIANTS.map((v) => [v.pattern, v.slug]));
const BOOK_BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]));

// Abreviações curtas (<=3 chars) exigem que o match original preserve maiúscula inicial
// ou padrão "1Co"-like, para não casar "as 3", "ex 2" em fala transcrita.
function acceptShortAbbrev(rawBook: string): boolean {
  return /^[0-9]?\s?[A-Z]/.test(rawBook.trim());
}

async function main() {
  const sermons = await prisma.sermon.findMany({
    where: { isSermon: true },
    select: { id: true, transcriptText: true },
  });
  console.log(`Detectando referências em ${sermons.length} transcrições…`);

  let total = 0;
  for (const s of sermons) {
    await prisma.biblicalReference.deleteMany({ where: { sermonId: s.id } });
    const text = s.transcriptText;
    const folded = fold(text);
    const refs: {
      sermonId: string;
      book: string;
      bookSlug: string;
      testament: string;
      chapter: number | null;
      verseStart: number | null;
      verseEnd: number | null;
      rawMatch: string;
      startIndex: number;
      endIndex: number;
    }[] = [];

    for (const m of folded.matchAll(REF_REGEX)) {
      const [full, bookRaw, chapterStr, verseStartStr, verseEndStr] = m;
      const slug = SLUG_BY_FOLDED.get(bookRaw.toLowerCase());
      if (!slug) continue;
      const book = BOOK_BY_SLUG.get(slug)!;
      const start = m.index ?? 0;
      const rawOriginal = text.slice(start, start + full.length);
      const bookOriginal = rawOriginal.slice(0, bookRaw.length);
      if (bookRaw.length <= 3 && !acceptShortAbbrev(bookOriginal)) continue;
      const chapter = parseInt(chapterStr, 10);
      if (!chapter || chapter > 176) continue; // Sl 119 é o maior capítulo; 176 versos
      refs.push({
        sermonId: s.id,
        book: book.name,
        bookSlug: book.slug,
        testament: book.testament,
        chapter,
        verseStart: verseStartStr ? parseInt(verseStartStr, 10) : null,
        verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : null,
        rawMatch: rawOriginal,
        startIndex: start,
        endIndex: start + full.length,
      });
    }
    if (refs.length) await prisma.biblicalReference.createMany({ data: refs });
    total += refs.length;
  }

  const byBook = await prisma.biblicalReference.groupBy({
    by: ["book"],
    _count: true,
    orderBy: { _count: { book: "desc" } },
    take: 10,
  });
  console.log(`Total de referências: ${total}`);
  console.log("Top 10 livros:", byBook.map((r) => `${r.book}(${r._count})`).join(" · "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
