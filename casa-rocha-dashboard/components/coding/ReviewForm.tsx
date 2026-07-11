"use client";

// Revisão humana side-by-side (PIPELINE.md §5): transcrição com evidências
// destacadas à esquerda; scores e campos editáveis à direita.

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SCORE_FIELDS } from "@/lib/coding/score-fields";

interface EvidenceItem {
  id: string;
  field: string;
  quote: string;
  comment: string | null;
  start: number | null;
  end: number | null;
  scoreValue: number | null;
}

export default function ReviewForm({
  sermon,
  analysis,
  scores: initialScores,
  evidence,
  nextId,
}: {
  sermon: { id: string; title: string; series: string | null; year: number | null; youtubeUrl: string | null; transcriptText: string };
  analysis: {
    status: string;
    aiModel: string | null;
    confidence: string | null;
    mainTheme: string | null;
    biblicalMainText: string | null;
    sermonType: string | null;
    doctrineMain: string | null;
    ontologicalVsPragmatic: string | null;
    summary3Lines: string | null;
    mainApplication: string | null;
    possibleFormativeGap: string | null;
  };
  scores: Record<string, number | null>;
  evidence: EvidenceItem[];
  nextId: string | null;
}) {
  const router = useRouter();
  const [scores, setScores] = useState(initialScores);
  const [reviewedBy, setReviewedBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusEvidence, setFocusEvidence] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(scores) !== JSON.stringify(initialScores),
    [scores, initialScores]
  );

  // Divide a transcrição em segmentos com <mark> nas evidências
  const segments = useMemo(() => {
    const marks = evidence
      .filter((e) => e.start != null && e.end != null && e.end! > e.start!)
      .sort((a, b) => a.start! - b.start!);
    const out: { text: string; ev?: EvidenceItem }[] = [];
    let pos = 0;
    for (const m of marks) {
      if (m.start! > pos) out.push({ text: sermon.transcriptText.slice(pos, m.start!) });
      if (m.start! >= pos) {
        out.push({ text: sermon.transcriptText.slice(m.start!, m.end!), ev: m });
        pos = m.end!;
      }
    }
    out.push({ text: sermon.transcriptText.slice(pos) });
    return out;
  }, [evidence, sermon.transcriptText]);

  const act = async (action: "approve" | "adjust" | "reject") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coding/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sermonId: sermon.id,
          action: action === "approve" && dirty ? "adjust" : action,
          reviewedBy: reviewedBy || undefined,
          scores: dirty ? scores : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "erro");
      if (nextId) router.push(`/coding/review/${nextId}`);
      else router.push("/coding");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const byAxis = useMemo(() => {
    const groups = new Map<string, typeof SCORE_FIELDS>();
    for (const f of SCORE_FIELDS) {
      const list = groups.get(f.axis) ?? [];
      list.push(f);
      groups.set(f.axis, list);
    }
    return [...groups.entries()];
  }, []);

  const fieldLabel = (field: string) =>
    SCORE_FIELDS.find((f) => f.field === field)?.label ?? field;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/coding" className="text-sm text-secondary underline">← fila de codificação</Link>
          <h1 className="text-lg font-semibold tracking-tight">{sermon.title}</h1>
          <p className="text-xs text-muted">
            {sermon.series} · {sermon.year} · modelo: <span className="font-mono">{analysis.aiModel}</span> ·
            confiança da IA: {analysis.confidence ?? "?"}
            {analysis.status === "reviewed" && " · JÁ REVISADA"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            placeholder="seu nome (revisor)"
            className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm w-40"
          />
          <button onClick={() => act("approve")} disabled={busy} className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm disabled:opacity-40">
            {dirty ? "Salvar ajustes e aprovar" : "Aprovar"}
          </button>
          <button onClick={() => act("reject")} disabled={busy} className="rounded-lg border border-hairline px-3 py-1.5 text-sm">
            Rejeitar (volta à fila)
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ESQUERDA: transcrição com destaques */}
        <section className="rounded-xl border border-hairline bg-surface p-4">
          <h2 className="text-sm font-medium text-secondary mb-2">
            Transcrição — {evidence.length} evidência(s) destacada(s)
          </h2>
          <div className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-secondary">
            {segments.map((seg, i) =>
              seg.ev ? (
                <mark
                  key={i}
                  id={`ev-${seg.ev.id}`}
                  className={`rounded px-0.5 ${focusEvidence === seg.ev.id ? "bg-amber-300" : "bg-amber-100"}`}
                  title={`${fieldLabel(seg.ev.field)} (score ${seg.ev.scoreValue ?? "?"})`}
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </div>
        </section>

        {/* DIREITA: análise e scores */}
        <section className="space-y-4">
          <div className="rounded-xl border border-hairline bg-surface p-4 text-sm space-y-1">
            <h2 className="text-sm font-medium text-secondary mb-1">Análise interpretativa (IA)</h2>
            <p><span className="text-muted">Tema central:</span> {analysis.mainTheme}</p>
            <p><span className="text-muted">Texto bíblico:</span> {analysis.biblicalMainText ?? "—"}</p>
            <p><span className="text-muted">Tipo:</span> {analysis.sermonType} · <span className="text-muted">Doutrina:</span> {analysis.doctrineMain ?? "—"}</p>
            <p><span className="text-muted">Ser × fazer:</span> {analysis.ontologicalVsPragmatic}</p>
            <p><span className="text-muted">Resumo:</span> {analysis.summary3Lines}</p>
            {analysis.mainApplication && <p><span className="text-muted">Aplicação:</span> {analysis.mainApplication}</p>}
            {analysis.possibleFormativeGap && <p><span className="text-muted">Hipótese de lacuna:</span> {analysis.possibleFormativeGap}</p>}
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-2">Evidências</h2>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {evidence.map((e) => (
                <li key={e.id} className="text-xs border-l-2 pl-2" style={{ borderColor: "var(--series-1)" }}>
                  <button
                    className="text-left"
                    onMouseEnter={() => setFocusEvidence(e.id)}
                    onMouseLeave={() => setFocusEvidence(null)}
                    onClick={() => document.getElementById(`ev-${e.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}
                  >
                    <span className="font-medium">{fieldLabel(e.field)}</span>{" "}
                    <span className="text-muted">(score {e.scoreValue ?? "?"})</span>
                    <p className="text-secondary">“{e.quote.slice(0, 160)}{e.quote.length > 160 ? "…" : ""}”</p>
                    {e.comment && <p className="text-muted">{e.comment}</p>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-4">
            <h2 className="text-sm font-medium text-secondary mb-2">
              Scores 0–5 {dirty && <span className="text-amber-700">(ajustados — serão salvos como revisão humana)</span>}
            </h2>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {byAxis.map(([axis, fields]) => (
                <div key={axis}>
                  <h3 className="text-xs font-medium text-muted mb-1">{axis}</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {fields.map((f) => (
                      <label key={f.field} className="flex items-center gap-2 text-xs">
                        <span className="flex-1">{f.label}</span>
                        <select
                          value={scores[f.field] ?? ""}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [f.field]: e.target.value === "" ? null : Number(e.target.value) }))
                          }
                          className="rounded border border-hairline bg-background px-1 py-0.5 w-14"
                        >
                          <option value="">—</option>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
