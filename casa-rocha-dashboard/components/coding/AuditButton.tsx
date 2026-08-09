"use client";

// Botão "Auditar com IA" (BLUEPRINT v2 §17). Segunda passagem OPCIONAL: um modelo
// confere a codificação já feita e aponta problemas. NUNCA altera scores — só relata.
import { useState } from "react";
import ModelSelector from "./ModelSelector";

interface AuditIssue { code: string; field: string; message: string; severity: string }
interface AuditResult {
  auditStatus: string;
  issues: AuditIssue[];
  needsHumanReview: boolean;
  reviewReason: string;
  confidenceAfterAudit: string;
}

export default function AuditButton({ sermonId }: { sermonId: string }) {
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setAudit(null);
    try {
      const res = await fetch("/api/coding/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sermonId, model }),
      });
      const d = await res.json();
      if (d.ok) setAudit(d.audit);
      else setErr(d.error ?? "falha na auditoria");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const statusColor = (s: string) =>
    s === "approved" ? "text-green-700" : s === "rejected" ? "text-red-700" : "text-amber-700";
  const sevColor = (s: string) =>
    s === "high" ? "text-red-700" : s === "low" ? "text-muted" : "text-amber-700";

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 space-y-3">
      <button onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-secondary">
        {open ? "▾" : "▸"} Auditar com IA (opcional)
      </button>
      {open && (
        <>
          <p className="text-[11px] text-muted">
            Uma segunda IA confere esta codificação e aponta problemas (score alto sem evidência,
            citação improvável, comentário que julga intenção…). É opcional e <strong>não altera
            nenhum score</strong> — serve para orientar sua revisão. A validação determinística já roda
            sempre; isto é um reforço.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className="block text-xs text-muted mb-1">Modelo</span>
              <ModelSelector value={model} onChange={setModel} preferredTag="recomendado_para_codificacao" disabled={busy} />
            </div>
            <button
              onClick={run}
              disabled={busy || !model}
              className="rounded-lg bg-foreground text-background px-4 py-1.5 text-sm disabled:opacity-40"
            >
              {busy ? "Auditando…" : "Auditar"}
            </button>
          </div>
          {err && <p className="text-sm text-red-700">{err}</p>}
          {audit && (
            <div className="rounded-lg border border-hairline bg-background p-3 space-y-2">
              <div className="flex flex-wrap gap-3 text-sm">
                <span>Parecer: <strong className={statusColor(audit.auditStatus)}>{audit.auditStatus}</strong></span>
                <span>Confiança após auditoria: <strong>{audit.confidenceAfterAudit}</strong></span>
                <span>{audit.needsHumanReview ? "⚠ pede revisão humana" : "✓ sem alerta de revisão"}</span>
              </div>
              {audit.reviewReason && <p className="text-xs text-muted">{audit.reviewReason}</p>}
              {audit.issues.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {audit.issues.map((it, i) => (
                    <li key={i} className="border-b border-hairline last:border-0 py-1">
                      <span className={`font-medium ${sevColor(it.severity)}`}>[{it.severity}]</span>{" "}
                      {it.field && <span className="font-mono">{it.field}</span>} — {it.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">Nenhum problema apontado pela auditoria.</p>
              )}
              <p className="text-[10px] text-muted">
                Parecer registrado como tentativa de auditoria (imutável). Nenhum score foi alterado.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
