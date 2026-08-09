"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Botão "Reparar evidência com IA" — só localiza evidência, nunca altera score.
export default function RepairButton({ attemptId, model }: { attemptId: string; model: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/coding/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, model }),
      });
      const data = await res.json();
      setOk(data.ok);
      setMsg(data.message ?? data.error ?? "concluído");
      if (data.ok) setTimeout(() => router.refresh(), 1500);
    } catch (e) {
      setOk(false);
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm disabled:opacity-40"
      >
        {busy ? "Reparando…" : "Reparar evidência com IA"}
      </button>
      <p className="text-xs text-muted">
        A IA apenas procura citações literais que sustentem os scores já atribuídos. Nenhum score é alterado.
      </p>
      {msg && (
        <p className={`text-sm rounded-lg border p-2 ${ok ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
