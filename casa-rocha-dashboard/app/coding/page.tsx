"use client";

// Página de codificação por IA via OpenRouter: escolha de modelo, fila com
// progresso, falhas com re-tentativa e fila de revisão humana.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface PendingItem {
  id: string;
  title: string;
  year: number | null;
  series: string | null;
  aiError: string | null;
}
interface ReviewItem {
  id: string;
  title: string;
  model: string | null;
  confidence: string | null;
}
interface Status {
  hasApiKey: boolean;
  pending: PendingItem[];
  counts: { pending: number; coded: number; reviewed: number; failed: number };
  reviewQueue: ReviewItem[];
  model: string;
  suggestedModels: string[];
}
interface ModelInfo {
  id: string;
  name: string;
  promptPrice: number | null;
  completionPrice: number | null;
}
interface LogEntry {
  title: string;
  ok: boolean;
  detail: string;
}

export default function CodingPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState("");
  const [batch, setBatch] = useState(5);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const stopRef = useRef(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/coding/status");
    const data: Status = await res.json();
    setStatus(data);
    setModel((m) => m || data.model);
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/coding/models")
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => {});
  }, [refresh]);

  const run = async (onlyFailed: boolean) => {
    if (!status || running) return;
    const queue = status.pending
      .filter((p) => (onlyFailed ? p.aiError : true))
      .slice(0, batch === -1 ? undefined : batch);
    if (queue.length === 0) return;

    setRunning(true);
    stopRef.current = false;
    setLog([]);
    setProgress({ done: 0, total: queue.length });

    for (const item of queue) {
      if (stopRef.current) break;
      try {
        const res = await fetch("/api/coding/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sermonId: item.id, model }),
        });
        const data = await res.json();
        setLog((l) => [
          {
            title: item.title,
            ok: data.ok,
            detail: data.ok
              ? `${data.scoresSaved} scores · ${data.evidenceSaved} evidências · confiança ${data.confidence}`
              : data.error ?? "erro",
          },
          ...l,
        ]);
      } catch (e) {
        setLog((l) => [{ title: item.title, ok: false, detail: String(e) }, ...l]);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setRunning(false);
    refresh();
  };

  const priceOf = (id: string) => {
    const m = models.find((x) => x.id === id);
    if (!m || m.promptPrice == null) return null;
    return `$${m.promptPrice.toFixed(2)} / $${m.completionPrice?.toFixed(2) ?? "?"} por 1M tokens`;
  };

  if (!status) return <p className="text-sm text-muted">Carregando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Codificação por IA</h1>

      {!status.hasApiKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Chave do OpenRouter não configurada.</strong> Defina{" "}
          <code className="font-mono">OPENROUTER_API_KEY</code> no arquivo <code className="font-mono">.env.deploy</code>{" "}
          (VPS) ou <code className="font-mono">.env</code> (local) e reinicie. Crie sua chave em{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {(
          [
            ["pendentes", status.counts.pending],
            ["codificadas (IA)", status.counts.coded],
            ["revisadas", status.counts.reviewed],
            ["com falha", status.counts.failed],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-xl border border-hairline bg-surface p-4">
            <div className="text-3xl font-semibold">{n}</div>
            <div className="text-sm text-secondary">{label}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-hairline bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-secondary">Configuração da análise</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-xs text-muted mb-1">Modelo (qualquer id do OpenRouter)</span>
            <input
              list="model-list"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-hairline bg-background px-3 py-1.5 w-80 font-mono text-xs"
              placeholder="ex.: anthropic/claude-sonnet-4.5"
            />
            <datalist id="model-list">
              {status.suggestedModels.map((m) => (
                <option key={m} value={m} />
              ))}
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </datalist>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted mb-1">Quantidade</span>
            <select
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
              className="rounded-lg border border-hairline bg-background px-2 py-1.5"
            >
              <option value={1}>1 (teste)</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={-1}>todas as pendentes</option>
            </select>
          </label>
          {!running ? (
            <>
              <button
                onClick={() => run(false)}
                disabled={!status.hasApiKey || !model || status.counts.pending === 0}
                className="rounded-lg bg-foreground text-background px-4 py-1.5 text-sm disabled:opacity-40"
              >
                Analisar
              </button>
              {status.counts.failed > 0 && (
                <button
                  onClick={() => run(true)}
                  disabled={!status.hasApiKey || !model}
                  className="rounded-lg border border-hairline px-4 py-1.5 text-sm"
                >
                  Re-tentar falhas ({status.counts.failed})
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => { stopRef.current = true; }}
              className="rounded-lg border border-hairline px-4 py-1.5 text-sm"
            >
              Parar após a atual
            </button>
          )}
          {model && priceOf(model) && (
            <span className="text-xs text-muted">{priceOf(model)}</span>
          )}
        </div>
        <p className="text-[11px] text-muted">
          Cada pregação é analisada individualmente (prompt com regras metodológicas + régua 0–5 + transcrição).
          A resposta só é salva se passar na validação: JSON íntegro, scores 0–5, score ≥4 com evidência,
          e evidência <strong>localizada literalmente na transcrição</strong> — citação que não existe é rejeitada.
        </p>
      </section>

      {(running || log.length > 0) && (
        <section className="rounded-xl border border-hairline bg-surface p-4 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-secondary">Progresso</h2>
            <div className="flex-1 h-2 rounded bg-background overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%",
                  background: "var(--series-1)",
                }}
              />
            </div>
            <span className="text-xs text-muted">{progress.done}/{progress.total}</span>
          </div>
          <ul className="max-h-64 overflow-y-auto text-sm space-y-1">
            {log.map((e, i) => (
              <li key={i} className="flex gap-2 border-b border-hairline last:border-0 py-1">
                <span>{e.ok ? "✅" : "❌"}</span>
                <span className="flex-1 truncate" title={e.title}>{e.title}</span>
                <span className={`text-xs ${e.ok ? "text-secondary" : "text-red-700"}`}>{e.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-hairline bg-surface p-4">
        <h2 className="text-sm font-medium text-secondary mb-2">
          Fila de revisão humana ({status.reviewQueue.length})
        </h2>
        {status.reviewQueue.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma pregação aguardando revisão.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {status.reviewQueue.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-2 items-center border-b border-hairline last:border-0 py-1">
                <Link href={`/coding/review/${r.id}`} className="flex-1 hover:underline">{r.title}</Link>
                <span className="text-xs text-muted font-mono">{r.model}</span>
                <span className="text-xs text-muted">confiança {r.confidence ?? "?"}</span>
                <Link href={`/coding/review/${r.id}`} className="rounded border border-hairline px-2 py-0.5 text-xs">
                  revisar →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {status.counts.failed > 0 && (
        <section className="rounded-xl border border-hairline bg-surface p-4">
          <h2 className="text-sm font-medium text-secondary mb-2">Falhas ({status.counts.failed})</h2>
          <ul className="text-sm space-y-1">
            {status.pending.filter((p) => p.aiError).map((p) => (
              <li key={p.id} className="border-b border-hairline last:border-0 py-1">
                <span className="font-medium">{p.title}</span>
                <p className="text-xs text-red-700">{p.aiError}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
