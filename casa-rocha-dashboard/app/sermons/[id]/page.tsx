import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import { Card, StatTile } from "@/components/Card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SermonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sermon = await prisma.sermon.findUnique({
    where: { id },
    include: {
      references: { orderBy: { startIndex: "asc" } },
      lexical: { where: { term: null }, orderBy: { densityPer10k: "desc" } },
      saturation: true,
      evidence: { where: { analysisMethod: "dictionary" }, orderBy: { evidenceStartIndex: "asc" } },
      analysis: true,
      attempts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!sermon) notFound();

  const ATTEMPT_STATUS: Record<string, string> = {
    SUCCESS: "sucesso",
    FAILED_JSON: "falha de JSON",
    FAILED_SCHEMA: "falha de schema",
    FAILED_VALIDATION: "regra violada",
    FAILED_EVIDENCE_LOCATION: "evidência não localizada",
    FAILED_OPENROUTER: "falha no provedor",
  };

  const refSummary = new Map<string, number>();
  for (const r of sermon.references) refSummary.set(r.book, (refSummary.get(r.book) ?? 0) + 1);
  const topRefs = [...refSummary.entries()].sort((a, b) => b[1] - a[1]);

  const THEME_LABELS: Record<string, string> = {
    cruz_soteriologia: "Cruz / Soteriologia",
    cristologia_trindade: "Cristologia / Trindade",
    critica_ao_sistema: "Crítica ao sistema",
    santificacao_maturidade: "Santificação",
    servico_diaconia: "Serviço / Diaconia",
    ortopraxia_pratica: "Ortopraxia prática",
    espiritualidade: "Espiritualidade",
    missao_presenca_publica: "Missão",
  };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sermons" className="text-sm text-secondary underline">← acervo</Link>
        <h1 className="text-xl font-semibold tracking-tight mt-1">{sermon.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2 items-center text-sm text-secondary">
          {sermon.series && (
            <Link href={`/sermons?series=${encodeURIComponent(sermon.series)}`} className="underline">
              {sermon.series}
            </Link>
          )}
          {sermon.dateEstimated && (
            <span>
              {new Date(sermon.dateEstimated).toISOString().slice(0, 10)}{" "}
              <Badge kind="estimada" text={`data ${sermon.dateConfidence?.toLowerCase() === "alta" ? "estimada · confiança alta" : "estimada"}`} />
            </span>
          )}
          {sermon.durationRaw && <span>{sermon.durationRaw}</span>}
          {sermon.youtubeUrl && (
            <a href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline">
              abrir vídeo ↗
            </a>
          )}
          <Badge kind={sermon.analysis?.analysisStatus === "reviewed" ? "reviewed" : sermon.analysis?.analysisStatus === "ai_coded" ? "ai_coded" : "lexical"} />
          {sermon.metadataConflict && <Badge kind="conflito" text={sermon.metadataConflict} />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="palavras na transcrição" value={sermon.transcriptWordCount.toLocaleString("pt-BR")} />
        <StatTile label="referências bíblicas detectadas" value={sermon.references.length} hint="motor regex — determinístico" />
        <StatTile
          label="sinal lexical de crítica"
          value={sermon.saturation?.iscRatio != null ? `${sermon.saturation.iscRatio.toFixed(1)}%` : "n/c"}
          hint={sermon.saturation ? `${sermon.saturation.criticRawCount} crítica / ${sermon.saturation.gospelRawCount} evangelho` : undefined}
        />
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="mt-1">{sermon.saturation?.saturationLabel && <Badge kind={sermon.saturation.saturationLabel} />}</div>
          <div className="text-sm text-secondary mt-2">rótulo do sinal lexical de crítica</div>
          <div className="text-[11px] text-muted mt-1">vocabulário lexical — não mede intenção</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Livros bíblicos citados (detecção automática)">
          {topRefs.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma referência com capítulo detectada.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {topRefs.map(([book, n]) => (
                <li key={book} className="flex justify-between border-b border-hairline last:border-0 py-1">
                  <span>{book}</span>
                  <span className="text-secondary">{n}×</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Densidade lexical por tema (por 10.000 palavras)" footnote="Frequência de vocabulário — não é score teológico.">
          <ul className="text-sm space-y-1">
            {sermon.lexical.map((m) => (
              <li key={m.id} className="flex items-center gap-2 py-1 border-b border-hairline last:border-0">
                <span className="flex-1">{THEME_LABELS[m.theme] ?? m.theme}</span>
                <div className="w-40 h-2 rounded bg-background overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(100, (m.densityPer10k / 250) * 100)}%`,
                      background: "var(--series-1)",
                    }}
                  />
                </div>
                <span className="text-secondary w-16 text-right">{m.densityPer10k.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {sermon.evidence.length > 0 && (
        <Card
          title="Trechos com vocabulário de crítica ao sistema (snippets automáticos)"
          footnote="Selecionados por dicionário para auditoria do ISC — o sentido real depende de leitura no contexto (camadas 2–3)."
        >
          <ul className="space-y-3">
            {sermon.evidence.map((e) => (
              <li key={e.id} className="text-sm border-l-2 pl-3" style={{ borderColor: "var(--series-1)" }}>
                <p className="text-secondary">“{e.evidenceQuote}”</p>
                <p className="text-[11px] text-muted mt-1">
                  termo: <strong>{e.keywordMatched}</strong> · método: dicionário · confiança: {e.confidence}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {sermon.attempts.length > 0 && (
        <Card title="Histórico de tentativas de IA" footnote="Toda tentativa fica registrada e não é sobrescrita (auditoria). Clique para ver a resposta completa.">
          <ul className="text-sm space-y-1">
            {sermon.attempts.map((at) => (
              <li key={at.id} className="flex items-center gap-2 border-b border-hairline last:border-0 py-1">
                <span>{at.status === "SUCCESS" ? "✅" : "❌"}</span>
                <Link href={`/coding/attempts/${at.id}`} className="hover:underline flex-1">
                  {ATTEMPT_STATUS[at.status] ?? at.status}
                  <span className="text-muted"> · {at.attemptType.toLowerCase()}</span>
                </Link>
                <span className="text-xs text-muted font-mono">{at.model}</span>
                <span className="text-xs text-muted">{new Date(at.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Transcrição completa">
        <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-secondary">
          {sermon.transcriptText}
        </div>
      </Card>
    </div>
  );
}
