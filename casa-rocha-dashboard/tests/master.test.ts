import { describe, it, expect, beforeAll } from "vitest";
import { MasterReportSchema, validateMasterReport } from "@/lib/diagnostics/masterSchema";
import type { MasterPayload } from "@/lib/diagnostics/master-aggregate";
import { verifyMasterPassword, verifyToken, expectedToken, isMasterConfigured } from "@/lib/security/master-token";
import { providerOf } from "@/lib/coding/model-presets";

// §40.7 Master report + §40.1 autorização (token).

function payload(over: Partial<MasterPayload> = {}): MasterPayload {
  return {
    calcVersion: "master-calc-v1",
    generatedAt: "",
    filters: { onlyReviewed: true, includePreliminary: false, includeSensitiveSnippets: false, hardness: "MODERATE" },
    denominators: { totalInFilter: 10, validCoded: 8, reviewed: 8, preliminary: 0, usedForMetrics: 8, needsHumanReview: 0, pendingRepairSuggestions: 0 },
    provenanceNote: "reviewed",
    cards: [],
    gaps: [],
    tensions: { version: "tensions-v1", tensions: [] },
    snippets: [{ sermonId: "abc", title: "t", series: null, year: 2024, scoreField: "orthodoxyScore", scoreValue: 4, quote: "q", comment: null, method: "ai_coding", confidence: "alta", reviewed: true }],
    reviewedCoverage: 1,
    limitations: [],
    inputHash: "h",
    ...over,
  };
}

describe("validateMasterReport (§35.6)", () => {
  it("rejeita quando denominador total é zero (§30.4)", () => {
    const report = MasterReportSchema.parse({});
    const issues = validateMasterReport(report, payload({ denominators: { ...payload().denominators, totalInFilter: 0 } }));
    expect(issues.some((i) => i.includes("Denominador"))).toBe(true);
  });

  it("rejeita achado que cita fonte inexistente (§35.6)", () => {
    const report = MasterReportSchema.parse({
      hardFindings: [{ finding: "x", sourceIds: ["S99"] }],
    });
    const issues = validateMasterReport(report, payload());
    expect(issues.some((i) => i.includes("S99"))).toBe(true);
  });

  it("aceita achado que cita snippet válido (S1) ou sermonId presente", () => {
    const report = MasterReportSchema.parse({
      hardFindings: [{ finding: "x", sourceIds: ["S1", "abc"] }],
    });
    expect(validateMasterReport(report, payload())).toHaveLength(0);
  });
});

describe("master token (§40.1)", () => {
  beforeAll(() => { process.env.MASTER_PASSWORD = "segredo-de-teste"; });

  it("isMasterConfigured true com senha ≥6 chars", () => {
    expect(isMasterConfigured()).toBe(true);
  });
  it("senha correta verifica; incorreta não", async () => {
    expect(await verifyMasterPassword("segredo-de-teste")).toBe(true);
    expect(await verifyMasterPassword("errada")).toBe(false);
  });
  it("token gerado é aceito por verifyToken; token adulterado não", async () => {
    const tok = await expectedToken();
    expect(await verifyToken(tok)).toBe(true);
    expect(await verifyToken("deadbeef")).toBe(false);
    expect(await verifyToken(undefined)).toBe(false);
  });
});

describe("providerOf (§21)", () => {
  it("mapeia prefixos conhecidos", () => {
    expect(providerOf("anthropic/claude-sonnet-4.5")).toBe("Anthropic");
    expect(providerOf("openai/gpt-4o")).toBe("OpenAI");
    expect(providerOf("meta-llama/llama-3.3-70b-instruct")).toBe("Meta/Llama");
    expect(providerOf("algum/modelo-desconhecido")).toBe("Outros");
  });
});
