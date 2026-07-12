// Fonte ÚNICA de status do pipeline multi-etapas (ajuste 2 da revisão).
// Regra: AnalysisRun.currentStage é o estado operacional; a fonte REAL é a
// presença das tabelas de etapa; SermonAnalysis.analysisStatus é só o resumo
// de compatibilidade para a UI antiga. Nenhuma página/API deriva status por
// conta própria — todas chamam derivePipelineStatus.
import { PIPELINE_STAGES, type PipelineStage } from "./versions";

export interface RunStageState {
  structure: boolean;
  interpretation: boolean;
  formative: boolean;
  evidence: boolean; // evidências do run validadas e gravadas
  audit: boolean;
}

export interface RunLike {
  status: string; // running | completed | failed | superseded
  currentStage: string | null;
  structure?: unknown | null;
  interpretation?: unknown | null;
  formative?: unknown | null;
  evidenceValidated?: boolean; // derivado: existe SermonEvidence do run
  auditDone?: boolean; // derivado: existe CodingAttempt AUDIT SUCCESS do run
}

export interface PipelineStatus {
  // Estado derivado das tabelas (fonte real)
  stages: RunStageState;
  // Próxima etapa a executar (null = pipeline completo)
  nextStage: PipelineStage | null;
  // Rótulo resumido para a UI / SermonAnalysis.analysisStatus
  summary:
    | "structure_pending"
    | "structure_completed"
    | "interpretation_completed"
    | "scored_by_ai"
    | "evidence_validated"
    | "audit_approved"
    | "failed"
    | "superseded";
  // Divergência entre currentStage gravado e o estado real (para alerta)
  inconsistent: boolean;
}

export function derivePipelineStatus(run: RunLike): PipelineStatus {
  const stages: RunStageState = {
    structure: Boolean(run.structure),
    interpretation: Boolean(run.interpretation),
    formative: Boolean(run.formative),
    evidence: Boolean(run.evidenceValidated),
    audit: Boolean(run.auditDone),
  };

  let nextStage: PipelineStage | null = null;
  for (const s of PIPELINE_STAGES) {
    if (!stages[s]) {
      nextStage = s;
      break;
    }
  }

  let summary: PipelineStatus["summary"];
  if (run.status === "superseded") summary = "superseded";
  else if (run.status === "failed") summary = "failed";
  else if (stages.audit) summary = "audit_approved";
  else if (stages.evidence) summary = "evidence_validated";
  else if (stages.formative) summary = "scored_by_ai";
  else if (stages.interpretation) summary = "interpretation_completed";
  else if (stages.structure) summary = "structure_completed";
  else summary = "structure_pending";

  // currentStage gravado deveria apontar para a próxima etapa (ou "done").
  const expectedStage = nextStage ?? "done";
  const inconsistent =
    run.status === "running" && run.currentStage !== null && run.currentStage !== expectedStage;

  return { stages, nextStage, summary, inconsistent };
}
