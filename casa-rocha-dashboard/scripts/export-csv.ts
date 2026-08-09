// Exporta tabelas analíticas para CSV em data/processed/ (PIPELINE.md §6).
// Uso: npx tsx scripts/export-csv.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/db";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
}

async function main() {
  const outDir = join(process.cwd(), "data", "processed");
  mkdirSync(outDir, { recursive: true });

  const sermons = await prisma.sermon.findMany({
    select: {
      id: true, notebookSourceId: true, title: true, series: true, preacher: true,
      dateEstimated: true, dateConfidence: true, year: true, youtubeUrl: true,
      sourceType: true, isSermon: true, durationRaw: true,
      transcriptCharCount: true, transcriptWordCount: true, metadataConflict: true,
    },
    orderBy: { dateEstimated: "asc" },
  });
  writeFileSync(join(outDir, "sermons.csv"), toCsv(sermons));

  const refs = await prisma.biblicalReference.findMany({
    select: { sermonId: true, book: true, testament: true, chapter: true, verseStart: true, verseEnd: true, rawMatch: true },
  });
  writeFileSync(join(outDir, "biblical_references.csv"), toCsv(refs));

  const lexical = await prisma.lexicalMetric.findMany({
    select: { sermonId: true, theme: true, term: true, rawCount: true, densityPer10k: true },
  });
  writeFileSync(join(outDir, "lexical_metrics.csv"), toCsv(lexical));

  const saturation = await prisma.saturationMetric.findMany({
    select: { sermonId: true, iscRatio: true, criticRawCount: true, gospelRawCount: true, saturationLabel: true, thresholdUsed: true },
  });
  writeFileSync(join(outDir, "saturation_metrics.csv"), toCsv(saturation));

  const evidence = await prisma.sermonEvidence.findMany({
    select: { sermonId: true, category: true, scoreField: true, scoreValue: true, evidenceQuote: true, keywordMatched: true, analysisMethod: true, confidence: true },
  });
  writeFileSync(join(outDir, "evidence.csv"), toCsv(evidence));

  console.log(`CSVs exportados em ${outDir}: sermons(${sermons.length}) refs(${refs.length}) lexical(${lexical.length}) saturation(${saturation.length}) evidence(${evidence.length})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
