import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import { Card } from "@/components/Card";
import RepairButton from "@/components/coding/RepairButton";
import { prisma } from "@/lib/db";

const REPAIRABLE = new Set(["FAILED_VALIDATION", "FAILED_EVIDENCE_LOCATION", "REPAIRABLE_EVIDENCE_GAP"]);

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "sucesso",
  FAILED_JSON: "falha de JSON",
  FAILED_SCHEMA: "falha de schema",
  FAILED_VALIDATION: "regra de negócio violada",
  FAILED_EVIDENCE_LOCATION: "evidência não localizada",
  FAILED_OPENROUTER: "falha no provedor",
  REPAIRABLE_EVIDENCE_GAP: "lacuna de evidência (reparável)",
  HUMAN_REVIEW_REQUIRED: "requer revisão humana",
};

// Mensagens amigáveis (BLUEPRINT v2 §19.3)
const FRIENDLY: Record<string, string> = {
  FAILED_VALIDATION:
    "A IA atribuiu score alto, mas não forneceu evidência textual obrigatória. O sistema bloqueou a gravação para evitar uma conclusão sem base literal. Nenhum score foi alterado automaticamente.",
  FAILED_EVIDENCE_LOCATION:
    "A IA forneceu uma citação, mas o trecho não foi localizado literalmente na transcrição. A análise permanece registrada como tentativa falha.",
  FAILED_JSON: "A IA respondeu, mas o conteúdo não pôde ser interpretado como JSON válido.",
  FAILED_SCHEMA:
    "O JSON foi lido, mas contém campos ausentes, tipos inválidos ou valores fora da régua permitida.",
  FAILED_OPENROUTER: "A chamada ao provedor de IA (OpenRouter) falhou.",
};

function pretty(json: string | null): string {
  if (!json) return "";
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.codingAttempt.findUnique({
    where: { id },
    include: { sermon: { select: { id: true, title: true, series: true, year: true } } },
  });
  if (!a) notFound();

  // Tolerante aos formatos v1 (array de strings) e Rodada H (objeto com
  // schemaIssues/enumNormalizations/warnings/reviewTriggers).
  function safeJson<T>(s: string | null): T | null {
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
  const bizIssues: { field: string; message: string }[] = safeJson(a.businessRuleIssuesJson) ?? [];

  const rawVal = safeJson<unknown>(a.validationIssuesJson);
  const valIssues: string[] = [];
  if (Array.isArray(rawVal)) {
    for (const v of rawVal) valIssues.push(typeof v === "string" ? v : JSON.stringify(v));
  } else if (rawVal && typeof rawVal === "object") {
    const o = rawVal as Record<string, unknown>;
    for (const s of (o.schemaIssues as string[]) ?? []) valIssues.push(String(s));
    for (const n of (o.enumNormalizations as { field: string; received: string; normalized: string }[]) ?? [])
      valIssues.push(`enum normalizado — ${n.field}: "${n.received}" → "${n.normalized}"`);
    for (const w of (o.warnings as { field: string; message: string }[]) ?? [])
      valIssues.push(`aviso — ${w.field}: ${w.message}`);
    for (const t of (o.reviewTriggers as { field: string; message: string }[]) ?? [])
      valIssues.push(`revisão humana — ${t.field}: ${t.message}`);
  }

  // Relatório de evidências: v1 usava {campo, found}; Rodada H usa {campo, status}.
  const rawEv = safeJson<{ campo: string; found?: boolean; status?: string; citacao?: string }[]>(a.evidenceValidationJson) ?? [];
  const evReport = (Array.isArray(rawEv) ? rawEv : []).map((e) => ({
    campo: e.campo,
    ok: e.status ? e.status === "located" : Boolean(e.found),
    statusLabel: e.status ?? (e.found ? "located" : "unlocated"),
    citacao: e.citacao ?? "",
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/sermons/${a.sermon.id}`} className="text-sm text-secondary underline">← pregação</Link>
        <h1 className="text-xl font-semibold tracking-tight mt-1">Resposta da IA</h1>
        <p className="text-xs text-muted mt-1">{a.sermon.title} · {a.sermon.series ?? "—"} · {a.sermon.year ?? "—"}</p>
      </div>

      <Card title="Resumo da tentativa">
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted">Tipo:</span> {a.attemptType}</div>
          <div><span className="text-muted">Modelo:</span> <span className="font-mono">{a.model}</span></div>
          <div><span className="text-muted">Data:</span> {new Date(a.createdAt).toISOString().slice(0, 16).replace("T", " ")}</div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Status:</span>
            <Badge kind={a.status === "SUCCESS" ? "reviewed" : "conflito"} text={STATUS_LABEL[a.status] ?? a.status} />
          </div>
          {a.failStage && <div><span className="text-muted">Etapa da falha:</span> {a.failStage}</div>}
          {a.promptVersion && <div><span className="text-muted">Prompt:</span> {a.promptVersion}</div>}
        </div>
        {FRIENDLY[a.status] && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {FRIENDLY[a.status]}
          </p>
        )}
        {REPAIRABLE.has(a.status) && a.extractedJson && (
          <div className="mt-3 border-t border-hairline pt-3">
            <RepairButton attemptId={a.id} model={a.model} />
          </div>
        )}
      </Card>

      {(bizIssues.length > 0 || valIssues.length > 0) && (
        <Card title="Regras violadas">
          <ul className="text-sm space-y-1">
            {bizIssues.map((i, n) => (
              <li key={`b${n}`} className="text-red-700">
                <span className="font-mono text-xs">{i.field}</span> — {i.message}
              </li>
            ))}
            {valIssues.map((i, n) => (
              <li key={`v${n}`} className="text-red-700 text-xs font-mono">{i}</li>
            ))}
          </ul>
        </Card>
      )}

      {evReport.length > 0 && (
        <Card title="Evidências fornecidas">
          <ul className="text-sm space-y-1">
            {evReport.map((e, n) => (
              <li key={n} className="flex items-start gap-2 border-b border-hairline last:border-0 py-1">
                <span>{e.ok ? "✅" : "❌"}</span>
                <span className="font-mono text-xs shrink-0">{e.campo}</span>
                {!e.ok && <span className="text-[10px] text-muted shrink-0">{e.statusLabel}</span>}
                {e.citacao && <span className="text-secondary">“{e.citacao}…”</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {a.extractedJson && (
        <Card title="JSON extraído">
          <pre className="max-h-96 overflow-auto text-xs bg-background rounded-lg p-3 whitespace-pre-wrap">{pretty(a.extractedJson)}</pre>
        </Card>
      )}

      {a.rawResponseText && (
        <Card title="Resposta bruta do modelo">
          <pre className="max-h-96 overflow-auto text-xs bg-background rounded-lg p-3 whitespace-pre-wrap">{a.rawResponseText}</pre>
        </Card>
      )}

      {a.openrouterMetaJson && (
        <p className="text-xs text-muted">Uso (tokens): <span className="font-mono">{a.openrouterMetaJson}</span></p>
      )}
    </div>
  );
}
