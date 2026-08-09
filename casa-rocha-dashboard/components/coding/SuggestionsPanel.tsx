"use client";

// Painel de sugestões de reparo pendentes (BLUEPRINT v2 §8.8/§18.6).
// Aplicar exige nome do revisor; nada muda no banco sem ação humana.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Suggestion {
  id: string;
  sermonId: string;
  sermonTitle: string;
  scoreField: string;
  scoreLabel: string;
  originalScore: number | null;
  suggestedScore: number | null;
  reason: string | null;
  model: string | null;
}

export default function SuggestionsPanel() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [reviewer, setReviewer] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/coding/repair-suggestions");
    const data = await res.json();
    setItems(data.suggestions ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "apply" | "reject") => {
    if (action === "apply" && !reviewer.trim()) {
      alert("Informe seu nome (revisor) para aplicar uma sugestão.");
      return;
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/coding/repair-suggestions/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: reviewer || undefined }),
      });
      const data = await res.json();
      if (!data.ok) alert(data.error ?? "erro");
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-hairline bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-medium text-secondary">Sugestões de reparo pendentes ({items.length})</h2>
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="seu nome (para aplicar)"
          className="rounded-lg border border-hairline bg-background px-2 py-1 text-sm w-48"
        />
      </div>
      <p className="text-[11px] text-muted">
        Sugestões de score geradas pela IA no reparo. Aplicar altera o score e registra um evento de revisão
        com antes/depois. Nada muda sem sua ação.
      </p>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 border-b border-hairline last:border-0 py-2 text-sm">
            <Link href={`/sermons/${s.sermonId}`} className="flex-1 min-w-48 hover:underline">{s.sermonTitle}</Link>
            <span className="text-xs">
              <strong>{s.scoreLabel}</strong>: {s.originalScore ?? "—"} → <strong>{s.suggestedScore ?? "—"}</strong>
            </span>
            {s.reason && <span className="text-xs text-muted flex-1 min-w-48">{s.reason}</span>}
            <button
              onClick={() => act(s.id, "apply")}
              disabled={busy === s.id}
              className="rounded border border-hairline px-2 py-0.5 text-xs disabled:opacity-40"
            >
              aplicar
            </button>
            <button
              onClick={() => act(s.id, "reject")}
              disabled={busy === s.id}
              className="rounded border border-hairline px-2 py-0.5 text-xs disabled:opacity-40"
            >
              rejeitar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
