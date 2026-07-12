"use client";

// Modo Diagnóstico Interno (BLUEPRINT v2 §29–35). Todos os números são
// determinísticos (vêm do payload calculado no servidor); a IA, quando usada,
// apenas interpreta. Nível de dureza altera só linguagem do relatório gerado.

import { useCallback, useEffect, useState } from "react";
import ModelSelector from "@/components/coding/ModelSelector";

type Hardness = "MODERATE" | "DIRECT" | "VERY_DIRECT";

interface Card { key: string; label: string; value: number | null; n: number; provenance: string }
interface Gap { key: string; label: string; value: number | null; a: string; b: string }
interface Tension {
  id: string; title: string; active: boolean; formula: string;
  highLabel: string; lowLabel: string; highValue: number | null; lowValue: number | null;
  highN: number; lowN: number; gap: number | null; internalReading: string;
  suggestedAction: string; reason: string;
}
interface Snippet {
  sermonId: string; title: string; series: string | null; year: number | null;
  scoreField: string; scoreValue: number | null; quote: string; comment: string | null;
  method: string; confidence: string | null; reviewed: boolean;
}
interface Payload {
  denominators: {
    totalInFilter: number; validCoded: number; reviewed: number; preliminary: number;
    usedForMetrics: number; needsHumanReview: number; pendingRepairSuggestions: number;
  };
  provenanceNote: string;
  cards: Card[];
  gaps: Gap[];
  tensions: { version: string; tensions: Tension[] };
  snippets: Snippet[];
  reviewedCoverage: number;
  limitations: string[];
}
interface ReportRow {
  id: string; createdAt: string; source: string; model: string | null; hardnessLevel: string;
  status: string; reviewedOnly: boolean; includesPreliminaryData: boolean;
  generatedBy: string | null; notes: string | null; reportJson: string | null;
}

export default function MasterView() {
  const [hardness, setHardness] = useState<Hardness>("MODERATE");
  const [includePreliminary, setIncludePreliminary] = useState(false);
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const [useAi, setUseAi] = useState(false);
  const [model, setModel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [openReport, setOpenReport] = useState<string | null>(null);

  const filters = useCallback(
    () => ({ hardness, includePreliminary, includeSensitiveSnippets: includeSensitive }),
    [hardness, includePreliminary, includeSensitive]
  );

  const loadPayload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/payload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters()),
      });
      const d = await res.json();
      if (d.ok) setPayload(d.payload);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/master/reports");
    const d = await res.json();
    if (d.ok) setReports(d.reports);
  }, []);

  useEffect(() => { loadPayload(); }, [loadPayload]);
  useEffect(() => { loadReports(); }, [loadReports]);

  const generate = async () => {
    setGenerating(true);
    setGenMsg(null);
    try {
      const res = await fetch("/api/master/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...filters(), useAi, model: useAi ? model : undefined }),
      });
      const d = await res.json();
      if (d.ok) {
        setGenMsg(`Relatório gerado (${d.source}). Status inicial: em revisão.`);
        loadReports();
      } else {
        setGenMsg(`Falha: ${d.error}${d.issues ? " — " + d.issues.join("; ") : ""}`);
      }
    } catch (e) {
      setGenMsg(String(e));
    } finally {
      setGenerating(false);
    }
  };

  const reviewReport = async (id: string, status: string) => {
    await fetch(`/api/master/reports/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadReports();
  };

  const logout = async () => {
    await fetch("/api/master/logout", { method: "POST" });
    window.location.href = "/";
  };

  const d = payload?.denominators;
  const activeTensions = payload?.tensions.tensions.filter((t) => t.active) ?? [];
  const inactiveTensions = payload?.tensions.tensions.filter((t) => !t.active) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Modo Diagnóstico Interno</h1>
          <p className="text-xs text-muted">Painel interno · números determinísticos · linguagem estratégica</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-hairline px-3 py-1.5 text-sm">Sair</button>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Este é um painel interno de diagnóstico. Não é relatório público. Dados preliminares ou não
        revisados não devem ser usados em decisões pastorais finais sem validação humana.
        {includeSensitive && (
          <div className="mt-1 font-medium">
            O conteúdo pode incluir trechos sensíveis de pregações. O acesso e o uso deste material ficam registrados.
          </div>
        )}
      </div>

      {/* Filtros e controles (§30) */}
      <section className="rounded-xl border border-hairline bg-surface p-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="block text-xs text-muted mb-1">Nível de dureza</span>
          <select
            value={hardness}
            onChange={(e) => setHardness(e.target.value as Hardness)}
            className="rounded-lg border border-hairline bg-background px-2 py-1.5 text-sm"
          >
            <option value="MODERATE">Moderado</option>
            <option value="DIRECT">Direto</option>
            <option value="VERY_DIRECT">Muito direto</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={includePreliminary} onChange={(e) => setIncludePreliminary(e.target.checked)} />
          <span>Incluir preliminares de IA</span>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={includeSensitive} onChange={(e) => setIncludeSensitive(e.target.checked)} />
          <span>Incluir snippets sensíveis</span>
        </label>
        <span className="text-[11px] text-muted">
          O nível de dureza muda só a linguagem do relatório gerado — nunca dados, limiares ou evidências.
        </span>
      </section>

      {loading && <p className="text-sm text-muted">Calculando…</p>}

      {d && (
        <>
          {/* Denominadores (§30.4) */}
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {([
              ["no filtro", d.totalInFilter],
              ["codificadas", d.validCoded],
              ["revisadas", d.reviewed],
              ["preliminares", d.preliminary],
              ["usadas", d.usedForMetrics],
              ["p/ revisão", d.needsHumanReview],
              ["reparos pend.", d.pendingRepairSuggestions],
            ] as const).map(([label, n]) => (
              <div key={label} className="rounded-xl border border-hairline bg-surface p-3">
                <div className="text-xl font-semibold tabular-nums">{n}</div>
                <div className="text-[11px] text-secondary">{label}</div>
              </div>
            ))}
          </section>
          <p className="text-[11px] text-muted -mt-3">
            Proveniência do conjunto: <strong>{payload!.provenanceNote}</strong> · cobertura revisada{" "}
            {(payload!.reviewedCoverage * 100).toFixed(0)}%
          </p>

          {/* Cards (§31) */}
          <section className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-3">Métricas agregadas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {payload!.cards.map((c) => (
                <div key={c.key} className="rounded-lg border border-hairline p-3">
                  <div className="text-lg font-semibold tabular-nums">{c.value ?? "—"}</div>
                  <div className="text-[11px] text-secondary leading-tight">{c.label}</div>
                  <div className="text-[10px] text-muted mt-0.5">n={c.n} · {c.provenance}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {payload!.gaps.map((g) => (
                <div key={g.key} className="rounded-lg border border-hairline px-3 py-2">
                  <span className="text-[11px] text-secondary">{g.label}: </span>
                  <span className="text-sm font-semibold tabular-nums">{g.value ?? "—"}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tensões (§33) */}
          <section className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-1">Contradições e tensões</h2>
            <p className="text-[11px] text-muted mb-3">
              Detector determinístico ({payload!.tensions.version}). Uma tensão só ativa com cobertura
              suficiente e ambos os limiares satisfeitos.
            </p>
            {activeTensions.length === 0 && (
              <p className="text-sm text-muted">Nenhuma tensão ativa no conjunto atual.</p>
            )}
            <div className="space-y-2">
              {activeTensions.map((t) => (
                <div key={t.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium text-amber-900">{t.title}</span>
                    <span className="text-[11px] text-amber-800 tabular-nums">
                      {t.highLabel} {t.highValue} (n={t.highN}) × {t.lowLabel} {t.lowValue} (n={t.lowN}) · gap {t.gap}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1">{t.internalReading}</p>
                  <p className="text-[11px] text-amber-800 mt-1"><strong>Ação sugerida:</strong> {t.suggestedAction}</p>
                  <p className="text-[10px] text-amber-700 mt-1 font-mono">{t.formula}</p>
                </div>
              ))}
            </div>
            {inactiveTensions.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-muted cursor-pointer">
                  {inactiveTensions.length} tensões consideradas e não ativadas (auditoria)
                </summary>
                <ul className="mt-2 text-[11px] text-muted space-y-1">
                  {inactiveTensions.map((t) => (
                    <li key={t.id}>• <strong>{t.title}</strong> — {t.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Painel de evidências (§34) */}
          <section className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-2">
              Evidências ({payload!.snippets.length}){!includeSensitive && " · sensíveis ocultos"}
            </h2>
            {payload!.snippets.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma evidência (score ≥4) no conjunto atual.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
                {payload!.snippets.map((s, i) => (
                  <li key={i} className="border-b border-hairline last:border-0 pb-2">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted">
                      <span className="font-mono">S{i + 1}</span>
                      <span className="font-medium text-secondary">{s.title}</span>
                      <span>· {s.scoreField} = {s.scoreValue}</span>
                      <span>· {s.method}{s.reviewed ? " · revisado" : ""}</span>
                    </div>
                    <p className="text-xs mt-0.5 italic">“{s.quote}”</p>
                    {s.comment && <p className="text-[11px] text-muted mt-0.5">{s.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Gerador de relatório master (§35) */}
          <section className="rounded-xl border border-hairline bg-surface p-4 space-y-3">
            <h2 className="text-sm font-medium text-secondary">Gerar diagnóstico interno</h2>
            <div className="flex flex-wrap items-end gap-4">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
                <span>Interpretar com IA (opcional)</span>
              </label>
              {useAi && (
                <div>
                  <span className="block text-xs text-muted mb-1">Modelo</span>
                  <ModelSelector value={model} onChange={setModel} preferredTag="recomendado_para_relatorio" />
                </div>
              )}
              <button
                onClick={generate}
                disabled={generating || (useAi && !model)}
                className="rounded-lg bg-foreground text-background px-4 py-1.5 text-sm disabled:opacity-40"
              >
                {generating ? "Gerando…" : useAi ? "Gerar com IA" : "Gerar (determinístico)"}
              </button>
            </div>
            <p className="text-[11px] text-muted">
              O relatório determinístico monta os achados a partir dos números acima, sem custo. A opção com
              IA envia os mesmos números (não a transcrição inteira) para interpretação, e a saída é validada
              (Zod + regras). Nenhum relatório é publicado automaticamente — nasce em revisão.
            </p>
            {genMsg && <p className="text-sm rounded-lg border border-hairline p-2">{genMsg}</p>}
          </section>

          {/* Relatórios salvos (§35.7/§35.8) */}
          <section className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-2">Relatórios gerados ({reports.length})</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-muted">Nenhum relatório ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {reports.map((r) => (
                  <li key={r.id} className="border border-hairline rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-muted">
                        {new Date(r.createdAt).toLocaleString("pt-BR")} · {r.source}
                        {r.model ? ` · ${r.model}` : ""} · {r.hardnessLevel} ·{" "}
                        {r.reviewedOnly ? "só revisadas" : "inclui preliminares"}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`text-[11px] rounded-full px-2 py-0.5 ${r.status === "REVIEWED" ? "bg-green-100 text-green-800" : r.status === "ARCHIVED" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
                          {r.status}
                        </span>
                        <button onClick={() => setOpenReport(openReport === r.id ? null : r.id)} className="text-xs underline">
                          {openReport === r.id ? "fechar" : "ver"}
                        </button>
                      </span>
                    </div>
                    {openReport === r.id && r.reportJson && (
                      <div className="mt-2">
                        <ReportBody json={r.reportJson} />
                        <div className="flex gap-2 mt-2">
                          {r.status !== "REVIEWED" && (
                            <button onClick={() => reviewReport(r.id, "REVIEWED")} className="rounded border border-hairline px-2 py-1 text-xs">
                              marcar revisado
                            </button>
                          )}
                          {r.status !== "ARCHIVED" && (
                            <button onClick={() => reviewReport(r.id, "ARCHIVED")} className="rounded border border-hairline px-2 py-1 text-xs">
                              arquivar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ReportBody({ json }: { json: string }) {
  let r: Record<string, unknown>;
  try { r = JSON.parse(json); } catch { return <p className="text-xs text-red-700">JSON inválido.</p>; }
  const exec = String(r.executiveDiagnosis ?? "");
  const list = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(String) : []);
  const section = (title: string, items: string[]) =>
    items.length > 0 && (
      <div className="mt-2">
        <div className="text-[11px] font-medium text-secondary">{title}</div>
        <ul className="list-disc list-inside text-xs text-secondary">
          {items.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    );
  return (
    <div className="rounded-lg bg-background p-3">
      {exec && <p className="text-xs">{exec}</p>}
      {section("Tensões principais", list(r.mainTensions))}
      {section("Hipóteses fortes", list(r.strongHypotheses))}
      {section("Riscos pastorais", list(r.pastoralRisks))}
      {section("Perguntas para o presbitério", list(r.questionsForPresbytery))}
      {section("Próximos passos", list(r.recommendedNextSteps))}
      {section("O que só a liderança interna deve ver", list(r.whatOnlyInternalLeadershipShouldSee))}
    </div>
  );
}
