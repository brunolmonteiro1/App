// Análise lexical (PIPELINE.md §3): densidade por tema/termo por 10k palavras,
// snippets de evidência (dictionary) e Índice de Saturação Crítica (ISC).
// Uso: npx tsx scripts/run-lexical-analysis.ts

import { prisma } from "../lib/db";
import {
  critiqueSignalThreshold,
  DICTIONARIES,
  ISC_CRITIC_THEME,
  ISC_GOSPEL_THEMES,
  ISC_MIN_MENTIONS,
} from "../lib/dictionaries";
import { countWords } from "../lib/parsing";

function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const SNIPPET_WINDOW = 160; // chars de contexto para cada lado
const MAX_SNIPPETS_PER_SERMON = 5; // só do campo crítica (ISC), os mais relevantes

interface TermHit {
  term: string;
  index: number;
  length: number;
}

function findTerm(foldedText: string, term: string): TermHit[] {
  const t = fold(term);
  const hits: TermHit[] = [];
  const re = new RegExp(`(?<![a-z0-9à-ú])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
  for (const m of foldedText.matchAll(re)) {
    hits.push({ term, index: m.index ?? 0, length: t.length });
  }
  return hits;
}

async function main() {
  const threshold = critiqueSignalThreshold();
  const sermons = await prisma.sermon.findMany({
    where: { isSermon: true },
    select: { id: true, transcriptText: true, transcriptWordCount: true },
  });
  console.log(`Análise lexical de ${sermons.length} pregações (limiar ISC: ${threshold}%)…`);

  for (const s of sermons) {
    const folded = fold(s.transcriptText);
    const words = s.transcriptWordCount || countWords(s.transcriptText);
    const per10k = (n: number) => (words > 0 ? (n / words) * 10000 : 0);

    await prisma.lexicalMetric.deleteMany({ where: { sermonId: s.id } });
    await prisma.sermonEvidence.deleteMany({
      where: { sermonId: s.id, analysisMethod: "dictionary" },
    });

    const themeCounts = new Map<string, number>();
    const criticHits: TermHit[] = [];

    for (const dict of DICTIONARIES) {
      let themeTotal = 0;
      const termRows: { term: string; count: number }[] = [];
      for (const term of dict.terms) {
        const hits = findTerm(folded, term);
        if (hits.length === 0) continue;
        themeTotal += hits.length;
        termRows.push({ term, count: hits.length });
        if (dict.theme === ISC_CRITIC_THEME) criticHits.push(...hits);
      }
      themeCounts.set(dict.theme, themeTotal);

      const rows = [
        { sermonId: s.id, theme: dict.theme, term: null as string | null, rawCount: themeTotal, densityPer10k: per10k(themeTotal) },
        ...termRows.map((r) => ({
          sermonId: s.id,
          theme: dict.theme,
          term: r.term as string | null,
          rawCount: r.count,
          densityPer10k: per10k(r.count),
        })),
      ];
      await prisma.lexicalMetric.createMany({ data: rows });
    }

    // ISC (CRITICAL_SATURATION.md)
    const criticCount = themeCounts.get(ISC_CRITIC_THEME) ?? 0;
    const gospelCount = ISC_GOSPEL_THEMES.reduce((acc, t) => acc + (themeCounts.get(t) ?? 0), 0);
    let iscRatio: number | null = null;
    let label = "nao_calculavel";
    if (gospelCount >= ISC_MIN_MENTIONS) {
      iscRatio = (criticCount / gospelCount) * 100;
      label = iscRatio >= threshold ? "saturacao_alta" : iscRatio >= threshold / 2 ? "saturacao_moderada" : "saturacao_baixa";
    }
    await prisma.saturationMetric.upsert({
      where: { sermonId: s.id },
      create: {
        sermonId: s.id,
        iscRatio,
        criticDensityPer10k: per10k(criticCount),
        gospelDensityPer10k: per10k(gospelCount),
        criticRawCount: criticCount,
        gospelRawCount: gospelCount,
        saturationLabel: label,
        thresholdUsed: threshold,
      },
      update: {
        iscRatio,
        criticDensityPer10k: per10k(criticCount),
        gospelDensityPer10k: per10k(gospelCount),
        criticRawCount: criticCount,
        gospelRawCount: gospelCount,
        saturationLabel: label,
        thresholdUsed: threshold,
      },
    });

    // Snippets do campo crítica (drill-down do ISC) — espaçados ao longo do texto
    criticHits.sort((a, b) => a.index - b.index);
    const picked: TermHit[] = [];
    let lastEnd = -Infinity;
    for (const h of criticHits) {
      if (h.index - lastEnd > 2000 && picked.length < MAX_SNIPPETS_PER_SERMON) {
        picked.push(h);
        lastEnd = h.index + h.length;
      }
    }
    if (picked.length) {
      await prisma.sermonEvidence.createMany({
        data: picked.map((h) => {
          const start = Math.max(0, h.index - SNIPPET_WINDOW);
          const end = Math.min(s.transcriptText.length, h.index + h.length + SNIPPET_WINDOW);
          return {
            sermonId: s.id,
            category: "critica_ao_sistema",
            scoreField: "iscRatio",
            evidenceQuote: (start > 0 ? "…" : "") + s.transcriptText.slice(start, end) + (end < s.transcriptText.length ? "…" : ""),
            evidenceStartIndex: h.index,
            evidenceEndIndex: h.index + h.length,
            keywordMatched: h.term,
            analysisMethod: "dictionary",
            confidence: "media",
          };
        }),
      });
    }
  }

  const metrics = await prisma.lexicalMetric.count();
  const sat = await prisma.saturationMetric.groupBy({ by: ["saturationLabel"], _count: true });
  const ev = await prisma.sermonEvidence.count({ where: { analysisMethod: "dictionary" } });
  console.log(`Métricas lexicais: ${metrics} · Evidências (dictionary): ${ev}`);
  console.log("ISC:", sat.map((r) => `${r.saturationLabel}=${r._count}`).join(" · "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
