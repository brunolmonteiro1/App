// Importador do backup do NotebookLM (PIPELINE.md §1).
// Uso: npx tsx scripts/import-notebooklm-backup.ts [caminho-do-json]

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/db";
import {
  countWords,
  extractYoutubeId,
  normalizeSeries,
  parseDurationToSeconds,
  parseSermonTitle,
} from "../lib/parsing";

interface BackupSource {
  id: string;
  title: string;
  url?: string | null;
  sourceType: string;
  content: string;
}

interface Backup {
  version: string;
  exportedAt: string;
  notebook: { id: string; title: string };
  sources: BackupSource[];
}

interface TsvRow {
  date: string;
  title: string;
  preacher: string;
  url: string;
  duration: string;
  series: string;
  confidence: string;
  notes: string;
}

function resolveBackupPath(): string {
  const arg = process.argv[2];
  if (arg) return arg;
  const rawDir = join(process.cwd(), "data", "raw");
  const jsons = readdirSync(rawDir).filter((f) => f.endsWith(".json"));
  if (jsons.length === 0) throw new Error(`Nenhum .json em ${rawDir}`);
  return join(rawDir, jsons.sort().reverse()[0]);
}

function parseEmbeddedTsv(sources: BackupSource[]): Map<string, TsvRow> {
  const byYoutubeId = new Map<string, TsvRow>();
  const tsvSource = sources.find(
    (s) => s.sourceType === "SOURCE_TYPE_TEXT" && s.title.toLowerCase().includes(".csv")
  );
  if (!tsvSource) {
    console.warn("⚠ TSV de metadados não encontrado no backup — datas/durações ficarão vazias.");
    return byYoutubeId;
  }
  const lines = tsvSource.content.split("\n").map((l) => l.replace(/\r$/, ""));
  for (const line of lines.slice(1)) {
    const cols = line.split("\t");
    if (cols.length < 7) continue;
    const row: TsvRow = {
      date: cols[0]?.trim() ?? "",
      title: cols[1]?.trim() ?? "",
      preacher: cols[2]?.trim() ?? "",
      url: cols[3]?.trim() ?? "",
      duration: cols[4]?.trim() ?? "",
      series: cols[6]?.trim() ?? "",
      confidence: cols[8]?.trim() ?? "",
      notes: cols[9]?.trim() ?? "",
    };
    const yid = extractYoutubeId(row.url);
    if (yid) byYoutubeId.set(yid, row);
  }
  console.log(`TSV embutido: ${byYoutubeId.size} linhas indexadas por YouTube ID.`);
  return byYoutubeId;
}

async function main() {
  const path = resolveBackupPath();
  console.log(`Importando: ${path}`);
  const backup: Backup = JSON.parse(readFileSync(path, "utf-8"));
  const tsv = parseEmbeddedTsv(backup.sources);

  let created = 0,
    updated = 0,
    skipped = 0;
  const conflicts: string[] = [];

  for (const src of backup.sources) {
    const content = src.content ?? "";
    const contentHash = createHash("sha256").update(content).digest("hex");
    const isSermon = src.sourceType === "SOURCE_TYPE_YOUTUBE_VIDEO";
    const youtubeId = extractYoutubeId(src.url);
    const parsed = parseSermonTitle(src.title);
    const row = youtubeId ? tsv.get(youtubeId) : undefined;

    const seriesFromTitle = normalizeSeries(parsed.seriesRaw);
    const seriesFromTsv = normalizeSeries(row?.series);
    let series = seriesFromTsv ?? seriesFromTitle;
    let metadataConflict: string | null = null;
    if (seriesFromTitle && seriesFromTsv && seriesFromTitle !== seriesFromTsv) {
      metadataConflict = `Série divergente: título="${seriesFromTitle}" TSV="${seriesFromTsv}"`;
      conflicts.push(`${src.title}: ${metadataConflict}`);
      series = seriesFromTsv; // TSV prevalece, mas o conflito fica registrado para revisão
    }

    const dateEstimated = row?.date ? new Date(row.date + "T12:00:00Z") : null;
    const durationSeconds = parseDurationToSeconds(row?.duration);
    const wordCount = countWords(content);

    // Qualidade: transcrição curta demais para a duração (menos de ~40 palavras/min)
    let transcriptQualityFlag: string | null = null;
    if (isSermon && durationSeconds && wordCount / (durationSeconds / 60) < 40) {
      transcriptQualityFlag = "curta_para_duracao";
    }

    const data = {
      contentHash,
      title: src.title,
      normalizedTitle: parsed.normalizedTitle,
      messageNumber: parsed.messageNumber,
      series,
      seriesRaw: parsed.seriesRaw ?? row?.series ?? null,
      preacher: parsed.preacher ?? row?.preacher ?? null,
      dateEstimated,
      dateConfidence: row?.confidence || null,
      year: dateEstimated ? dateEstimated.getUTCFullYear() : null,
      youtubeUrl: src.url ?? null,
      youtubeId,
      sourceType: src.sourceType,
      isSermon,
      durationRaw: row?.duration || null,
      durationSeconds,
      transcriptText: content,
      transcriptCharCount: content.length,
      transcriptWordCount: wordCount,
      transcriptQualityFlag,
      metadataConflict,
    };

    const existing = await prisma.sermon.findUnique({
      where: { notebookSourceId: src.id },
      select: { id: true, contentHash: true },
    });

    if (!existing) {
      await prisma.sermon.create({ data: { notebookSourceId: src.id, ...data } });
      created++;
    } else if (existing.contentHash === contentHash) {
      skipped++;
    } else {
      // Conteúdo mudou: atualiza transcrição, preserva análises, marca desatualização
      await prisma.sermon.update({ where: { id: existing.id }, data });
      await prisma.sermonAnalysis.updateMany({
        where: { sermonId: existing.id },
        data: { analysisStatus: "pending" },
      });
      updated++;
    }
  }

  await prisma.importRun.create({
    data: {
      fileName: path.split("/").pop() ?? path,
      exportedAt: backup.exportedAt ? new Date(backup.exportedAt) : null,
      sourcesTotal: backup.sources.length,
      sourcesNew: created,
      sourcesUpdated: updated,
      sourcesSkipped: skipped,
      conflicts: conflicts.length ? JSON.stringify(conflicts) : null,
    },
  });

  const sermons = await prisma.sermon.count({ where: { isSermon: true } });
  console.log(
    `Importação concluída: ${created} novas · ${updated} atualizadas · ${skipped} inalteradas · ${conflicts.length} conflitos`
  );
  console.log(`Total no banco: ${await prisma.sermon.count()} fontes (${sermons} pregações).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
