// Validação Zod da saída do relatório master (BLUEPRINT v2 §35.5/§35.6).
// Tolerante a campos ausentes (defaults), mas garante a forma. Além do Zod,
// validamos regras: denominador presente e snippets referenciados existem.

import { z } from "zod";
import type { MasterPayload } from "./master-aggregate";

const HardFinding = z.object({
  finding: z.string().catch(""),
  findingType: z.enum(["confirmed_data", "strong_hypothesis", "pastoral_risk"]).catch("strong_hypothesis"),
  dataEvidence: z.string().catch(""),
  denominator: z.string().catch(""),
  textualEvidence: z.array(z.string()).catch([]),
  sourceIds: z.array(z.string()).catch([]),
  confidence: z.enum(["alta", "média", "media", "baixa"]).catch("baixa"),
  provenance: z.string().catch(""),
  counterEvidence: z.string().catch(""),
  limitations: z.string().catch(""),
  pastoralRisk: z.string().catch(""),
  internalReading: z.string().catch(""),
  recommendedAction: z.string().catch(""),
});

export const MasterReportSchema = z.object({
  executiveDiagnosis: z.string().catch(""),
  datasetSummary: z
    .object({
      totalDenominator: z.number().catch(0),
      reviewedCount: z.number().catch(0),
      preliminaryCount: z.number().catch(0),
      limitations: z.array(z.string()).catch([]),
    })
    .catch({ totalDenominator: 0, reviewedCount: 0, preliminaryCount: 0, limitations: [] }),
  hardFindings: z.array(HardFinding).catch([]),
  mainTensions: z.array(z.string()).catch([]),
  blindSpots: z.array(z.string()).catch([]),
  confirmedData: z.array(z.string()).catch([]),
  strongHypotheses: z.array(z.string()).catch([]),
  pastoralRisks: z.array(z.string()).catch([]),
  counterEvidence: z.array(z.string()).catch([]),
  whatThePublicDashboardShouldSay: z.array(z.string()).catch([]),
  whatOnlyInternalLeadershipShouldSee: z.array(z.string()).catch([]),
  questionsForPresbytery: z.array(z.string()).catch([]),
  recommendedNextSteps: z.array(z.string()).catch([]),
});

export type MasterReport = z.infer<typeof MasterReportSchema>;

// Regras além do schema (§35.6). Retorna lista de problemas (vazio = ok).
export function validateMasterReport(report: MasterReport, payload: MasterPayload): string[] {
  const issues: string[] = [];
  if (payload.denominators.totalInFilter <= 0) issues.push("Denominador total é zero — relatório não permitido.");
  const validIds = new Set(payload.snippets.map((_, i) => `S${i + 1}`));
  const alsoSermonIds = new Set(payload.snippets.map((s) => s.sermonId));
  for (const f of report.hardFindings) {
    for (const id of f.sourceIds) {
      if (!validIds.has(id) && !alsoSermonIds.has(id)) {
        issues.push(`Achado cita fonte inexistente: ${id}`);
      }
    }
  }
  return issues;
}
