// Versionamento do pipeline multi-etapas (Rodada H, §16 do blueprint).
// Toda mudança de prompt/schema exige bump aqui — o dashboard filtra e compara
// apenas análises compatíveis e sinaliza corpus com versões misturadas.

export const STRUCTURE_PROMPT_VERSION = "structure-v1-fluid-discourse";
export const INTERPRETATION_PROMPT_VERSION = "interpretation-v1-hermeneutic-homiletic";
export const FORMATIVE_PROMPT_VERSION = "formative-v1-theological-health";
export const EVIDENCE_PROMPT_VERSION = "evidence-v2-contiguous-quotes";
export const AUDIT_STAGE_PROMPT_VERSION = "audit-v1-semantic-coherence";

// Versão do pipeline completo (gravada em AnalysisRun.pipelineVersion e em
// SermonAnalysis.pipelineVersion na projeção atual). Análises antigas de
// chamada única têm pipelineVersion = null (v1).
export const PIPELINE_VERSION = "coding-v3-multistage";

// Ordem canônica das etapas.
export const PIPELINE_STAGES = ["structure", "interpretation", "formative", "evidence", "audit"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  structure: "Estrutura (reconstrução do discurso)",
  interpretation: "Interpretação (hermenêutica/argumentação/homilética)",
  formative: "Formação e scores",
  evidence: "Extração e validação de evidências",
  audit: "Auditoria semântica",
};

// attemptType em CodingAttempt por etapa.
export const STAGE_ATTEMPT_TYPES: Record<PipelineStage, string> = {
  structure: "STRUCTURE",
  interpretation: "INTERPRETATION",
  formative: "FORMATIVE_SCORING",
  evidence: "EVIDENCE_EXTRACTION",
  audit: "AUDIT",
};
