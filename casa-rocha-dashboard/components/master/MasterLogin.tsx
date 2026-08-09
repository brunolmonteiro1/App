"use client";

import { useState } from "react";

// Tela de acesso ao Modo Diagnóstico Interno. Envia a senha ao endpoint, que
// valida server-side e devolve um cookie assinado. Acessos são registrados.
export default function MasterLogin() {
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/master/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, label }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "Falha ao autenticar.");
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-5">
      <div className="rounded-xl border border-hairline bg-surface p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Modo Diagnóstico Interno</h1>
          <p className="text-xs text-muted mt-1">
            Área protegida por senha própria. Este painel não é relatório público; o acesso é registrado.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            <span className="block text-xs text-muted mb-1">Quem está acessando (rótulo para o log)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-sm"
              placeholder="ex.: presbitério / Pr. Fulano"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted mb-1">Senha master</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-sm"
            />
          </label>
          {err && <p className="text-sm text-red-700">{err}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="rounded-lg bg-foreground text-background px-4 py-1.5 text-sm disabled:opacity-40"
          >
            {busy ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
