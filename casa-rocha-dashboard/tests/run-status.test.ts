import { describe, it, expect } from "vitest";
import { derivePipelineStatus } from "@/lib/coding/run-status";

// Fonte única de status (ajuste 2): o estado real vem das tabelas de etapa.

describe("derivePipelineStatus", () => {
  it("run vazio → structure_pending, próxima etapa structure", () => {
    const s = derivePipelineStatus({ status: "running", currentStage: "structure" });
    expect(s.summary).toBe("structure_pending");
    expect(s.nextStage).toBe("structure");
    expect(s.inconsistent).toBe(false);
  });

  it("estrutura pronta → structure_completed, próxima interpretation", () => {
    const s = derivePipelineStatus({ status: "running", currentStage: "interpretation", structure: {} });
    expect(s.summary).toBe("structure_completed");
    expect(s.nextStage).toBe("interpretation");
  });

  it("scores prontos sem evidências → scored_by_ai", () => {
    const s = derivePipelineStatus({
      status: "running",
      currentStage: "evidence",
      structure: {},
      interpretation: {},
      formative: {},
    });
    expect(s.summary).toBe("scored_by_ai");
    expect(s.nextStage).toBe("evidence");
  });

  it("tudo pronto → audit_approved, nextStage null", () => {
    const s = derivePipelineStatus({
      status: "completed",
      currentStage: "done",
      structure: {},
      interpretation: {},
      formative: {},
      evidenceValidated: true,
      auditDone: true,
    });
    expect(s.summary).toBe("audit_approved");
    expect(s.nextStage).toBeNull();
  });

  it("divergência entre currentStage gravado e estado real é sinalizada", () => {
    // tabela de estrutura existe, mas currentStage diz "structure" — inconsistente
    const s = derivePipelineStatus({ status: "running", currentStage: "structure", structure: {} });
    expect(s.inconsistent).toBe(true);
  });

  it("run failed/superseded preservam o rótulo terminal", () => {
    expect(derivePipelineStatus({ status: "failed", currentStage: "formative", structure: {} }).summary).toBe("failed");
    expect(derivePipelineStatus({ status: "superseded", currentStage: null, structure: {} }).summary).toBe("superseded");
  });
});
