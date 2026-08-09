"use client";
import { useState } from "react";

// Abas da análise multi-etapas na página da pregação (Rodada H, §17).
// Recebe os JSONs já desserializados do run atual (isCurrent). Read-only.

type Json = Record<string, unknown>;

export interface PipelineTabsData {
  runId: string;
  pipelineVersion: string | null;
  status: string;
  currentStage: string | null;
  totalTokens: number | null;
  totalCostUsd: number | null;
  structure: Json | null;
  anchors: { order: number; startIndex: number | null; endIndex: number | null; locationStatus: string }[] | null;
  hermeneutics: Json | null;
  argumentation: Json | null;
  homiletics: Json | null;
  formation: Json | null;
  categorical: Json | null;
  gapAnalysis: Json | null;
  scoreMetadata: Json | null;
  scores: Record<string, number | null>;
  derivedPanels: {
    aggregateField: string;
    presentMean: number | null;
    top3Mean: number | null;
    breadthCount: number;
    presentCount: number;
    totalComponents: number;
    holisticAiScore: number | null;
  }[];
  evidence: { id: string; scoreField: string; scoreValue: number | null; quote: string; comment: string | null; startIndex: number | null; endIndex: number | null }[];
  audit: Json | null;
  attempts: { id: string; attemptType: string; status: string; model: string; createdAt: string }[];
  transcript: string;
}

const TABS = [
  "Visão geral", "Estrutura", "Fios", "Argumentação", "Hermenêutica",
  "Homilética", "Teologia", "Formação", "Evidências", "Auditoria", "Histórico",
] as const;
type Tab = (typeof TABS)[number];

const AGG_LABELS: Record<string, string> = {
  biblicalHealthScore: "Síntese bíblico-homilética",
  orthodoxyScore: "Síntese de ortodoxia",
  orthopraxyScore: "Síntese de ortopraxia",
  spiritualityScore: "Síntese de espiritualidade",
  pastoralHealthScore: "Síntese pastoral",
};

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function obj(v: unknown): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm text-secondary">{children}</div>
    </div>
  );
}

function List({ items }: { items: unknown[] }) {
  if (items.length === 0) return <span className="text-muted">—</span>;
  return (
    <ul className="list-disc pl-5 space-y-0.5">
      {items.map((it, i) => (
        <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>
      ))}
    </ul>
  );
}

export default function SermonPipelineTabs({ data }: { data: PipelineTabsData }) {
  const [tab, setTab] = useState<Tab>("Visão geral");
  const [highlight, setHighlight] = useState<{ start: number; end: number } | null>(null);

  const thesis = obj(data.structure?.mainThesis);
  const arc = obj(data.structure?.globalArc);
  const units = arr(data.structure?.discourseUnits);
  const anchorByOrder = new Map((data.anchors ?? []).map((a) => [a.order, a]));
  const cat = data.categorical ?? {};

  return (
    <section className="rounded-xl border border-hairline bg-surface">
      <div className="flex flex-wrap gap-1 border-b border-hairline p-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-2.5 py-1 text-xs ${tab === t ? "bg-foreground text-background" : "text-secondary hover:bg-background"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === "Visão geral" && (
          <div className="space-y-2">
            <Field label="Tese principal">{str(thesis.description) || "—"} <span className="text-muted">(confiança {str(thesis.confidence)})</span></Field>
            <Field label="Pergunta governante">{str(data.structure?.governingQuestion) || "—"}</Field>
            <Field label="Arco global">{str(arc.type)} — {str(arc.description)}</Field>
            <Field label="Tema central">{str(cat.tema_central) || "—"}</Field>
            <Field label="Texto bíblico principal">{str(cat.texto_biblico_principal) || "—"}</Field>
            <Field label="Tipo de pregação">{str(cat.tipo_de_pregacao) || "—"}</Field>
            <Field label="Resumo">{str(cat.resumo_3_linhas) || "—"}</Field>
            <Field label="Confiança global">{str(cat.confianca) || "—"}</Field>
            <div className="text-[11px] text-muted pt-2 border-t border-hairline">
              pipeline {data.pipelineVersion ?? "?"} · {data.status} · {data.totalTokens?.toLocaleString("pt-BR") ?? "?"} tokens
              {data.totalCostUsd != null ? ` · US$ ${data.totalCostUsd.toFixed(3)}` : ""}
            </div>
          </div>
        )}

        {tab === "Estrutura" && (
          <ol className="space-y-2">
            {units.map((u, i) => {
              const unit = obj(u);
              const order = typeof unit.order === "number" ? unit.order : i + 1;
              const anchor = anchorByOrder.get(order);
              const canHighlight = anchor && anchor.startIndex != null && anchor.endIndex != null;
              return (
                <li key={i} className="border-l-2 pl-3" style={{ borderColor: "var(--series-1)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted">{order}</span>
                    <span className="text-sm font-medium">{str(unit.descriptiveTitle)}</span>
                    <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted">{str(unit.function)}</span>
                    {canHighlight && (
                      <button
                        className="text-[10px] text-secondary underline"
                        onClick={() => setHighlight({ start: anchor!.startIndex!, end: anchor!.endIndex! })}
                      >
                        ver na transcrição{anchor!.locationStatus !== "exact" ? ` (${anchor!.locationStatus})` : ""}
                      </button>
                    )}
                    {anchor && anchor.locationStatus === "not_found" && (
                      <span className="text-[10px] text-muted">trecho não localizado</span>
                    )}
                  </div>
                  <p className="text-sm text-secondary">{str(unit.summary)}</p>
                  <div className="text-[11px] text-muted">
                    relação com a tese: {str(unit.relationToMainThesis)} · origem: {str(unit.perceivedOrigin)} · integração: {str(unit.integrationQuality)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {tab === "Fios" && (
          <div className="space-y-2">
            {arr(data.structure?.threads).map((t, i) => {
              const th = obj(t);
              return (
                <div key={i} className="rounded border border-hairline p-2">
                  <div className="text-sm font-medium">{str(th.theme)} <span className="text-[10px] text-muted">({str(th.type)})</span></div>
                  <div className="text-[11px] text-muted">{th.resolved ? "resolvido" : "em aberto"}{th.resolution ? ` — ${str(th.resolution)}` : ""}</div>
                </div>
              );
            })}
            {arr(data.structure?.threads).length === 0 && <p className="text-sm text-muted">Nenhum fio condutor destacado.</p>}
            {arr(data.structure?.unresolvedLines).length > 0 && (
              <Field label="Linhas não resolvidas"><List items={arr(data.structure?.unresolvedLines).map((l) => str(obj(l).description))} /></Field>
            )}
          </div>
        )}

        {tab === "Argumentação" && data.argumentation && (
          <div className="space-y-2">
            <Field label="Afirmação central">{str(data.argumentation.mainClaim) || "—"}</Field>
            <Field label="Premissas">
              <List items={arr(data.argumentation.premises).map((p) => `${str(obj(p).description)} (${str(obj(p).supportType)})`)} />
            </Field>
            <Field label="Saltos argumentativos">
              <List items={arr(data.argumentation.argumentativeLeaps).map((l) => `${str(obj(l).description)} [${str(obj(l).impact)}]`)} />
            </Field>
            <Field label="Tensões internas"><List items={arr(data.argumentation.internalTensions)} /></Field>
            <Field label="Coerência argumentativa">{str(data.argumentation.argumentativeCoherenceScore) || "n/a"} — {str(data.argumentation.coherenceAssessment)}</Field>
          </div>
        )}

        {tab === "Hermenêutica" && data.hermeneutics && (
          <div className="space-y-2">
            <Field label="Textos principais">{arr(data.hermeneutics.primaryTexts).map(str).join("; ") || "—"}</Field>
            {(["literaryContext", "historicalContext", "authorialIntent"] as const).map((k) => {
              const c = obj(data.hermeneutics?.[k]);
              return <Field key={k} label={k}>{str(c.qualityScore) || "n/a"} — {str(c.assessment) || "—"}</Field>;
            })}
            <Field label="Caminho cristocêntrico">{str(obj(data.hermeneutics.christocentricPath).assessment) || "—"}</Field>
            <Field label="Alinhamento texto-sermão">{str(obj(data.hermeneutics.textSermonAlignment).score) || "n/a"} — {str(obj(data.hermeneutics.textSermonAlignment).assessment)}</Field>
          </div>
        )}

        {tab === "Homilética" && data.homiletics && (
          <div className="grid sm:grid-cols-2 gap-2">
            {(["dynamicUnity", "progression", "transitions", "clarity", "integrationOfEmergentMovements", "abilityToResumeThreads", "closure"] as const).map((k) => {
              const c = obj(data.homiletics?.[k]);
              return <Field key={k} label={k}>{c.score == null ? "n/a" : str(c.score)}{c.assessment ? ` — ${str(c.assessment)}` : ""}</Field>;
            })}
            <Field label="Recursos retóricos">{arr(data.homiletics.rhetoricalDevices).map(str).join(", ") || "—"}</Field>
            <Field label="Postura da audiência">{str(obj(data.homiletics.audiencePositioning).dominantPosture)}</Field>
          </div>
        )}

        {tab === "Teologia" && (
          <div className="space-y-3">
            <div className="text-[11px] text-muted">
              Agregados: painel derivado (calculado) ao lado do holístico da IA. null nunca é tratado como zero.
            </div>
            {data.derivedPanels.map((p) => (
              <div key={p.aggregateField} className="rounded border border-hairline p-2">
                <div className="text-sm font-medium">{AGG_LABELS[p.aggregateField] ?? p.aggregateField}</div>
                <div className="text-[11px] text-secondary flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>holístico IA: <strong>{p.holisticAiScore ?? "—"}</strong></span>
                  <span>média dos presentes: <strong>{p.presentMean ?? "—"}</strong></span>
                  <span>top-3: <strong>{p.top3Mean ?? "—"}</strong></span>
                  <span>amplitude: <strong>{p.breadthCount}/{p.totalComponents}</strong> (≥3)</span>
                  <span>presentes: <strong>{p.presentCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Formação" && data.formation && (
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="O que crer"><List items={arr(data.formation.beliefsFormed)} /></Field>
            <Field label="Quem ser"><List items={arr(data.formation.identityFormed)} /></Field>
            <Field label="O que amar"><List items={arr(data.formation.affectionsFormed)} /></Field>
            <Field label="O que fazer"><List items={arr(data.formation.practicesCalledFor)} /></Field>
            <Field label="Como fazer (método)"><List items={arr(data.formation.methodsOffered)} /></Field>
            <Field label="Com quem"><List items={arr(data.formation.communityImplications)} /></Field>
            <Field label="Para onde ser enviado"><List items={arr(data.formation.missionImplications)} /></Field>
            <Field label="Esperança apresentada"><List items={arr(data.formation.hopePresented)} /></Field>
            <Field label="Modo formativo dominante">{str(data.formation.dominantFormationMode)}</Field>
            {data.gapAnalysis && (
              <div className="sm:col-span-2 border-t border-hairline pt-2">
                <Field label="Não desenvolvido nesta pregação (não é falha)"><List items={arr(data.gapAnalysis.notDevelopedInThisSermon)} /></Field>
                <Field label="Hipóteses para o corpus"><List items={arr(data.gapAnalysis.corpusHypotheses)} /></Field>
              </div>
            )}
          </div>
        )}

        {tab === "Evidências" && (
          <div className="space-y-2">
            {data.evidence.length === 0 && <p className="text-sm text-muted">Nenhuma evidência validada neste run.</p>}
            {data.evidence.map((e) => {
              const meta = obj(data.scoreMetadata?.[e.scoreField]);
              return (
                <div key={e.id} className="rounded border border-hairline p-2">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted">
                    <span className="font-mono">{e.scoreField}</span>
                    <span>score {e.scoreValue ?? "—"}</span>
                    {meta.evidenceBasis ? <span className="rounded bg-background px-1.5 py-0.5">{str(meta.evidenceBasis)}</span> : null}
                    {e.startIndex != null && e.endIndex != null && (
                      <button className="underline" onClick={() => setHighlight({ start: e.startIndex!, end: e.endIndex! })}>
                        ver na transcrição
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-secondary mt-1">“{e.quote}”</p>
                  {e.comment && <p className="text-[11px] text-muted mt-1">{e.comment}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === "Auditoria" && (
          <div className="space-y-2">
            {!data.audit && <p className="text-sm text-muted">Auditoria não executada neste run.</p>}
            {data.audit && (
              <>
                <Field label="Status">{str(data.audit.auditStatus)}</Field>
                <Field label="Confiança após auditoria">{str(data.audit.confidenceAfterAudit)}</Field>
                <Field label="Revisão humana necessária">{data.audit.needsHumanReview ? "sim" : "não"}{data.audit.reviewReason ? ` — ${str(data.audit.reviewReason)}` : ""}</Field>
                <Field label="Problemas apontados">
                  <List items={arr(data.audit.issues).map((i) => `[${str(obj(i).severity)}] ${str(obj(i).field) || "—"}: ${str(obj(i).description)}`)} />
                </Field>
                <p className="text-[11px] text-muted">A auditoria apenas relata — nenhum score é alterado automaticamente.</p>
              </>
            )}
          </div>
        )}

        {tab === "Histórico" && (
          <ul className="text-sm space-y-1">
            {data.attempts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 border-b border-hairline last:border-0 py-1">
                <span>{a.status === "SUCCESS" ? "✅" : "❌"}</span>
                <span className="flex-1">{a.attemptType.toLowerCase()} <span className="text-muted">· {a.status}</span></span>
                <span className="text-xs text-muted font-mono">{a.model}</span>
                <span className="text-xs text-muted">{a.createdAt.slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {highlight && (
        <div className="border-t border-hairline p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">trecho destacado na transcrição</span>
            <button className="text-xs underline" onClick={() => setHighlight(null)}>fechar</button>
          </div>
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-secondary">
            {data.transcript.slice(Math.max(0, highlight.start - 200), highlight.start)}
            <mark className="bg-yellow-200 dark:bg-yellow-700/50">{data.transcript.slice(highlight.start, highlight.end)}</mark>
            {data.transcript.slice(highlight.end, highlight.end + 200)}
          </div>
        </div>
      )}
    </section>
  );
}
