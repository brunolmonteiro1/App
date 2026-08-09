// Gerador de relatório master (BLUEPRINT v2 §35). Dois modos:
//  - deterministic: monta o relatório a partir do payload calculado, sem LLM
//    (sempre disponível, custo zero — cobre a base do §17.3);
//  - ai: chama o modelo com o prompt canônico e VALIDA a saída (Zod + regras).
// Persiste em MasterDiagnosticReport (versionado, nunca sobrescreve). Nunca publica
// automaticamente: status inicial GENERATED.

import { prisma } from "@/lib/db";
import { chatCompletion, extractJson } from "@/lib/coding/openrouter";
import { buildMasterPayload, type MasterFilters, type MasterPayload } from "./master-aggregate";
import { buildMasterSystemPrompt, buildMasterUserPrompt, MASTER_PROMPT_VERSION } from "./masterPrompt";
import { MasterReportSchema, validateMasterReport, type MasterReport } from "./masterSchema";

export interface GenerateResult {
  ok: boolean;
  reportId?: string;
  report?: MasterReport;
  source: "deterministic" | "ai";
  error?: string;
  issues?: string[];
}

// Relatório determinístico: transforma o payload em texto estruturado factual.
function deterministicReport(payload: MasterPayload): MasterReport {
  const active = payload.tensions.tensions.filter((t) => t.active);
  const d = payload.denominators;
  const hardFindings: MasterReport["hardFindings"] = active.map((t) => ({
    finding: t.title,
    findingType: "strong_hypothesis" as const,
    dataEvidence: `${t.highLabel}=${t.highValue} (n=${t.highN}) vs ${t.lowLabel}=${t.lowValue} (n=${t.lowN}); gap ${t.gap}`,
    denominator: `${d.usedForMetrics} de ${d.totalInFilter} no filtro`,
    textualEvidence: [],
    sourceIds: [],
    confidence: payload.reviewedCoverage >= 0.5 ? "média" : "baixa",
    provenance: payload.provenanceNote,
    counterEvidence: "",
    limitations: t.reason,
    pastoralRisk: t.internalReading,
    internalReading: t.internalReading,
    recommendedAction: t.suggestedAction,
  }));
  return MasterReportSchema.parse({
    executiveDiagnosis:
      active.length > 0
        ? `Sobre ${d.usedForMetrics} pregações codificadas (${d.reviewed} revisadas), o detector determinístico ativou ${active.length} tensão(ões): ${active.map((t) => t.title).join("; ")}. Números calculados; leitura a validar com revisão humana.`
        : `Sobre ${d.usedForMetrics} pregações codificadas (${d.reviewed} revisadas), nenhuma tensão ultrapassou os limiares configurados (${payload.tensions.version}). Ampliar a cobertura revisada antes de conclusões.`,
    datasetSummary: {
      totalDenominator: d.totalInFilter,
      reviewedCount: d.reviewed,
      preliminaryCount: d.preliminary,
      limitations: payload.limitations,
    },
    hardFindings,
    mainTensions: active.map((t) => `${t.title} — ${t.internalReading}`),
    blindSpots: [],
    confirmedData: payload.cards.filter((c) => c.value != null).map((c) => `${c.label}: ${c.value} (n=${c.n}, ${c.provenance})`),
    strongHypotheses: active.map((t) => t.internalReading),
    pastoralRisks: payload.cards
      .filter((c) => (c.key === "passivity" || c.key === "cynicism") && c.value != null && (c.value ?? 0) >= 3)
      .map((c) => `${c.label} em ${c.value} (n=${c.n}) — acima do limiar de atenção.`),
    counterEvidence: [],
    whatThePublicDashboardShouldSay: [],
    whatOnlyInternalLeadershipShouldSee: [],
    questionsForPresbytery: active.map((t) => `Sobre "${t.title}": ${t.suggestedAction}`),
    recommendedNextSteps:
      payload.reviewedCoverage < 0.5
        ? ["Elevar a cobertura de revisão humana antes de decisões (cobertura atual abaixo de 50%)."]
        : ["Cruzar as tensões ativas com dados de engajamento fora do corpus."],
  });
}

export async function generateMasterReport(opts: {
  filters: MasterFilters;
  useAi: boolean;
  model?: string;
  generatedBy?: string | null;
}): Promise<GenerateResult> {
  const payload = await buildMasterPayload(opts.filters);
  if (payload.denominators.totalInFilter <= 0) {
    return { ok: false, source: opts.useAi ? "ai" : "deterministic", error: "Nenhuma pregação no filtro — relatório não permitido (§30.4)." };
  }
  if (payload.denominators.usedForMetrics <= 0) {
    return { ok: false, source: opts.useAi ? "ai" : "deterministic", error: "Nenhuma pregação codificada no filtro — codifique antes de gerar o diagnóstico." };
  }

  let report: MasterReport;
  let rawResponseText: string | null = null;
  const source: "deterministic" | "ai" = opts.useAi ? "ai" : "deterministic";

  if (opts.useAi) {
    if (!opts.model) return { ok: false, source, error: "Modelo obrigatório para geração por IA." };
    let parsed: unknown;
    try {
      const res = await chatCompletion({
        model: opts.model,
        system: buildMasterSystemPrompt(opts.filters.hardness),
        user: buildMasterUserPrompt(payload),
      });
      rawResponseText = res.content;
      parsed = extractJson(res.content);
    } catch (e) {
      return { ok: false, source, error: e instanceof Error ? e.message : String(e) };
    }
    report = MasterReportSchema.parse(parsed);
    const issues = validateMasterReport(report, payload);
    if (issues.length > 0) {
      // Não descarta a resposta bruta: persiste como GENERATED com as pendências
      // registradas, mas sinaliza para revisão. Aqui devolvemos o erro sem salvar
      // relatório publicável — o auditor humano decide.
      return { ok: false, source, error: "Saída reprovada na validação de regras.", issues };
    }
  } else {
    report = deterministicReport(payload);
  }

  const saved = await prisma.masterDiagnosticReport.create({
    data: {
      generatedBy: opts.generatedBy ?? null,
      filtersJson: JSON.stringify(opts.filters),
      inputMetricsHash: payload.inputHash,
      inputDenominatorJson: JSON.stringify(payload.denominators),
      promptVersion: opts.useAi ? MASTER_PROMPT_VERSION : null,
      model: opts.useAi ? opts.model : null,
      hardnessLevel: opts.filters.hardness,
      datasetJson: JSON.stringify(payload),
      reportJson: JSON.stringify(report),
      rawResponseText,
      source,
      includesPreliminaryData: opts.filters.includePreliminary,
      reviewedOnly: opts.filters.onlyReviewed,
      includesLexicalSignals: false,
      includesSensitiveSnippets: opts.filters.includeSensitiveSnippets,
      status: "GENERATED",
    },
  });

  return { ok: true, reportId: saved.id, report, source };
}
