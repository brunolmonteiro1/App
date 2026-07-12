"use client";

// Combobox pesquisável de modelos OpenRouter (BLUEPRINT v2 §21).
// Agrupa por provedor, mostra nome amigável, id técnico, preço, contexto e tags,
// destaca recomendados e mantém um "modo avançado" para digitar qualquer id.

import { useEffect, useMemo, useRef, useState } from "react";

export type ModelTag =
  | "melhor_qualidade"
  | "economico"
  | "rapido"
  | "contexto_longo"
  | "experimental"
  | "recomendado_para_codificacao"
  | "recomendado_para_reparo"
  | "recomendado_para_relatorio";

const TAG_LABELS: Record<ModelTag, string> = {
  melhor_qualidade: "melhor qualidade",
  economico: "econômico",
  rapido: "rápido",
  contexto_longo: "contexto longo",
  experimental: "experimental",
  recomendado_para_codificacao: "rec. codificação",
  recomendado_para_reparo: "rec. reparo",
  recomendado_para_relatorio: "rec. relatório",
};

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  promptPrice: number | null;
  completionPrice: number | null;
  contextLength: number | null;
  tags: ModelTag[];
  recommended: boolean;
}
export interface ModelCatalog {
  models: ModelInfo[];
  source: "openrouter" | "fallback";
  error?: string;
}

const PROVIDER_ORDER = [
  "Anthropic", "OpenAI", "Google", "DeepSeek", "Meta/Llama", "Mistral", "Qwen", "Outros",
];

function priceLabel(m: ModelInfo): string | null {
  if (m.promptPrice == null) return null;
  const out = m.completionPrice != null ? `/$${m.completionPrice.toFixed(2)}` : "";
  return `$${m.promptPrice.toFixed(2)}${out} por 1M`;
}
function ctxLabel(m: ModelInfo): string | null {
  if (!m.contextLength) return null;
  return `${Math.round(m.contextLength / 1000)}k ctx`;
}

export default function ModelSelector({
  value,
  onChange,
  preferredTag,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  // Tag priorizada no topo da lista (ex.: recomendado_para_codificacao).
  preferredTag?: ModelTag;
  disabled?: boolean;
}) {
  const [catalog, setCatalog] = useState<ModelCatalog | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/coding/models")
      .then((r) => r.json())
      .then((d: ModelCatalog) => setCatalog(d))
      .catch(() => setCatalog({ models: [], source: "fallback", error: "falha ao carregar" }));
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const models = catalog?.models ?? [];
  const selected = models.find((m) => m.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? models.filter(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q) ||
            m.tags.some((t) => TAG_LABELS[t].toLowerCase().includes(q))
        )
      : models;
    // Ordena provedores; dentro de cada um, recomendados/preferidos primeiro.
    const groups = new Map<string, ModelInfo[]>();
    for (const m of list) {
      const g = groups.get(m.provider) ?? [];
      g.push(m);
      groups.set(m.provider, g);
    }
    const rank = (m: ModelInfo) =>
      (preferredTag && m.tags.includes(preferredTag) ? 0 : 1) * 10 + (m.recommended ? 0 : 1);
    const ordered: [string, ModelInfo[]][] = [];
    for (const p of PROVIDER_ORDER) {
      const g = groups.get(p);
      if (g) ordered.push([p, g.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))]);
    }
    // Provedores fora da ordem conhecida (defensivo).
    for (const [p, g] of groups) if (!PROVIDER_ORDER.includes(p)) ordered.push([p, g]);
    return ordered;
  }, [models, query, preferredTag]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  if (advanced) {
    return (
      <div className="space-y-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-hairline bg-background px-3 py-1.5 w-80 font-mono text-xs"
          placeholder="ex.: anthropic/claude-sonnet-4.5"
        />
        <button
          type="button"
          onClick={() => setAdvanced(false)}
          className="block text-[11px] text-muted underline"
        >
          voltar à lista de modelos
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="rounded-lg border border-hairline bg-background px-3 py-1.5 w-80 text-left text-sm disabled:opacity-40 flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {selected ? (
            <>
              <span className="font-medium">{selected.name}</span>
              {selected.recommended && <span className="ml-1 text-[10px] text-green-700">★</span>}
            </>
          ) : value ? (
            <span className="font-mono text-xs">{value}</span>
          ) : (
            <span className="text-muted">Escolher modelo…</span>
          )}
        </span>
        <span className="text-muted text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-96 max-h-96 overflow-y-auto rounded-lg border border-hairline bg-surface shadow-lg">
          <div className="sticky top-0 bg-surface p-2 border-b border-hairline">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, provedor ou tag…"
              className="w-full rounded border border-hairline bg-background px-2 py-1 text-sm"
            />
            {catalog?.source === "fallback" && (
              <p className="text-[10px] text-amber-700 mt-1">
                Lista offline (presets) — disponibilidade e preços podem ter mudado.
              </p>
            )}
          </div>
          {filtered.length === 0 && (
            <p className="p-3 text-xs text-muted">Nenhum modelo. Use o modo avançado para digitar o id.</p>
          )}
          {filtered.map(([provider, list]) => (
            <div key={provider}>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted bg-background/50">
                {provider}
              </div>
              {list.map((m) => {
                const price = priceLabel(m);
                const ctx = ctxLabel(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pick(m.id)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-background ${m.id === value ? "bg-background" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.recommended && <span className="text-[10px] text-green-700" title="recomendado">★</span>}
                    </div>
                    <div className="font-mono text-[10px] text-muted truncate">{m.id}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5 items-center">
                      {price && <span className="text-[10px] text-secondary">{price}</span>}
                      {price && ctx && <span className="text-[10px] text-muted">·</span>}
                      {ctx && <span className="text-[10px] text-muted">{ctx}</span>}
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] rounded-full border border-hairline px-1.5 py-px text-secondary"
                        >
                          {TAG_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            onClick={() => { setAdvanced(true); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[11px] text-muted underline border-t border-hairline"
          >
            modo avançado — digitar id manualmente
          </button>
        </div>
      )}
    </div>
  );
}
