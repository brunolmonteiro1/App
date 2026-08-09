import { describe, it, expect } from "vitest";
import { buildAuditStagePrompt, parseAuditStageResponse } from "@/lib/coding/auditStagePrompt";

// Etapa E — auditoria semântica (§11): só relata; nada é aplicado automaticamente.

describe("parseAuditStageResponse", () => {
  it("resposta válida com issues passa", () => {
    const r = parseAuditStageResponse({
      auditStatus: "approved_with_warnings",
      issues: [{ type: "conditional_applicability", field: "reconstructionAfterCritiqueScore", severity: "medium", description: "crítica baixa com reconstrução alta" }],
      suggestedCorrections: [],
      needsHumanReview: true,
      reviewReason: "coerência da crítica",
      confidenceAfterAudit: "medium",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.auditStatus).toBe("approved_with_warnings");
  });

  it("auditStatus desconhecido normaliza para human_review_required com registro (fail-safe)", () => {
    const r = parseAuditStageResponse({ auditStatus: "tudo_certo", issues: [], needsHumanReview: false });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.auditStatus).toBe("human_review_required");
      expect(r.normalizations.some((n) => n.received === "tudo_certo")).toBe(true);
    }
  });

  it("shape vazio cai em defaults conservadores (needsHumanReview true)", () => {
    const r = parseAuditStageResponse({ auditStatus: "approved" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.needsHumanReview).toBe(true);
  });
});

describe("buildAuditStagePrompt", () => {
  it("NÃO inclui a transcrição integral; inclui evidências e achados determinísticos", () => {
    const { system, user } = buildAuditStagePrompt({
      title: "Teste",
      structureMap: "TESE: x",
      interpretationSummary: "AFIRMAÇÃO CENTRAL: y",
      categoricalJson: "{}",
      scoreMetadataJson: "{}",
      locatedEvidence: [{ field: "christologyScore", score: 4, quote: "trecho literal localizado" }],
      conditionalFindings: ["crítica contextual baixa (2) com reconstrução alta (4)"],
    });
    expect(user).not.toContain("TRANSCRIÇÃO COMPLETA");
    expect(user).toContain("EVIDÊNCIAS LOCALIZADAS");
    expect(user).toContain("christologyScore");
    expect(user).toContain("ACHADOS DETERMINÍSTICOS");
    expect(system).toContain("NUNCA recodifica");
    expect(system).toContain("frase isolada");
  });
});
