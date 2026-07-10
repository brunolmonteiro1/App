import Link from "next/link";
import Badge from "@/components/Badge";
import { Card, StatTile } from "@/components/Card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QualityPage() {
  const [conflicts, noSeries, qualityFlags, lowDateConfidence, imports, nonSermon] = await Promise.all([
    prisma.sermon.findMany({ where: { metadataConflict: { not: null } }, select: { id: true, title: true, metadataConflict: true } }),
    prisma.sermon.findMany({ where: { isSermon: true, series: null }, select: { id: true, title: true, seriesRaw: true } }),
    prisma.sermon.findMany({ where: { transcriptQualityFlag: { not: null } }, select: { id: true, title: true, transcriptQualityFlag: true } }),
    prisma.sermon.count({ where: { isSermon: true, OR: [{ dateConfidence: null }, { NOT: { dateConfidence: { contains: "alta" } } }] } }),
    prisma.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.sermon.findMany({ where: { isSermon: false }, select: { id: true, title: true, sourceType: true } }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Qualidade de dados</h1>
      <p className="text-sm text-secondary max-w-2xl">
        Pendências que afetam a confiança das análises. Nada aqui é conclusão — são itens a corrigir
        ou a considerar como limitação (ver METHODOLOGY.md do projeto).
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="conflitos JSON × TSV" value={conflicts.length} />
        <StatTile label="pregações sem série" value={noSeries.length} />
        <StatTile label="flags de transcrição" value={qualityFlags.length} />
        <StatTile label="datas sem confiança alta" value={lowDateConfidence} hint="todas as datas são estimadas por interpolação" />
      </div>

      {noSeries.length > 0 && (
        <Card title="Pregações sem série identificada">
          <ul className="text-sm space-y-1">
            {noSeries.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 border-b border-hairline last:border-0 py-1">
                <Link href={`/sermons/${s.id}`} className="hover:underline">{s.title}</Link>
                <span className="text-muted text-xs">série bruta: {s.seriesRaw ?? "—"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {conflicts.length > 0 && (
        <Card title="Conflitos de metadados (título × TSV)">
          <ul className="text-sm space-y-1">
            {conflicts.map((s) => (
              <li key={s.id} className="border-b border-hairline last:border-0 py-1">
                <Link href={`/sermons/${s.id}`} className="hover:underline">{s.title}</Link>{" "}
                <Badge kind="conflito" text={s.metadataConflict ?? "conflito"} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {qualityFlags.length > 0 && (
        <Card title="Transcrições com flag de qualidade">
          <ul className="text-sm space-y-1">
            {qualityFlags.map((s) => (
              <li key={s.id} className="border-b border-hairline last:border-0 py-1">
                <Link href={`/sermons/${s.id}`} className="hover:underline">{s.title}</Link>{" "}
                <span className="text-muted text-xs">{s.transcriptQualityFlag}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Fontes que não são pregações (fora das análises)">
        <ul className="text-sm space-y-1">
          {nonSermon.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-hairline last:border-0 py-1">
              <span>{s.title}</span>
              <span className="text-muted text-xs">{s.sourceType}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Histórico de importações">
        <ul className="text-sm space-y-1">
          {imports.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline last:border-0 py-1">
              <span>{r.fileName}</span>
              <span className="text-secondary text-xs">
                {new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")} · {r.sourcesTotal} fontes ·{" "}
                {r.sourcesNew} novas · {r.sourcesUpdated} atualizadas · {r.sourcesSkipped} inalteradas
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
