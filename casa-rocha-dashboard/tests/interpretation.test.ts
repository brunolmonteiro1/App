import { describe, it, expect } from "vitest";
import { compactInterpretationSummary, parseInterpretationResponse } from "@/lib/coding/interpretationPrompt";

// Etapa B — schema tolerante; scores de QUALIDADE: null = não aplicável, nunca 0.

function baseInterpretation(over: Record<string, unknown> = {}) {
  return {
    hermeneutics: {
      primaryTexts: ["Gênesis 2:16-17"],
      secondaryTexts: [],
      literaryContext: { assessment: "trabalha o contexto do Éden", qualityScore: 4 },
      historicalContext: { assessment: "", qualityScore: null },
      authorialIntent: { assessment: "", qualityScore: null },
      lexicalWork: [],
      intertextualConnections: [],
      typologyAndAnalogy: [],
      christocentricPath: { description: "do Éden ao Getsêmani", organicToText: true, assessment: "orgânico" },
      originalMeaningToCurrentApplication: { description: "", bridgeQualityScore: 3 },
      textSermonAlignment: { score: 4, assessment: "alinhado", stronglySupportedClaims: [], weaklySupportedClaims: [] },
    },
    argumentation: {
      mainClaim: "No Éden o homem escolheu a própria vontade; no Getsêmani Cristo escolheu a do Pai.",
      premises: [
        { description: "Adão desobedeceu no jardim", supportType: "biblical", supportReference: "Gênesis 3" },
        { description: "Cristo obedeceu no jardim", supportType: "biblical", supportReference: "Mateus 26:39" },
      ],
      inferentialChain: [],
      conclusions: ["a cruz inverte a queda"],
      argumentativeLeaps: [],
      internalTensions: [],
      unresolvedQuestions: [],
      coherenceAssessment: "coerente",
      argumentativeCoherenceScore: 4,
    },
    homiletics: {
      sermonType: "expositiva_isolada",
      discourseModes: ["expository"],
      dynamicUnity: { score: 4, assessment: "" },
      progression: { score: 3, assessment: "" },
      transitions: { score: 3, assessment: "" },
      proportion: { score: null, assessment: "" },
      clarity: { score: 4, assessment: "" },
      integrationOfEmergentMovements: { score: null, assessment: "sem movimentos emergentes" },
      abilityToResumeThreads: { score: null, assessment: "" },
      closure: { score: 4, assessment: "fecha o arco" },
      illustrations: [],
      rhetoricalDevices: ["direct_address", "contrast"],
      emotionalArc: { description: "", movements: [] },
      audiencePositioning: { description: "", dominantPosture: "challenged" },
    },
    ...over,
  };
}

describe("parseInterpretationResponse", () => {
  it("resposta válida com número variável de premissas passa", () => {
    const r = parseInterpretationResponse(baseInterpretation());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.argumentation.premises).toHaveLength(2);
  });

  it("qualityScore 0 (proibido na família qualidade) vira null COM registro (ajuste 3)", () => {
    const base = baseInterpretation();
    (base.hermeneutics as Record<string, unknown>).historicalContext = { assessment: "não trabalha", qualityScore: 0 };
    const r = parseInterpretationResponse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.hermeneutics.historicalContext.qualityScore).toBeNull();
      expect(r.normalizations.some((n) => n.field === "hermeneutics.historicalContext" && n.received === "0")).toBe(true);
    }
  });

  it("enum desconhecido (supportType) normaliza com registro", () => {
    const base = baseInterpretation();
    (base.argumentation as Record<string, unknown>).premises = [
      { description: "x", supportType: "filosofico", supportReference: null },
    ];
    const r = parseInterpretationResponse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.argumentation.premises[0].supportType).toBe("assumed");
      expect(r.normalizations.some((n) => n.received === "filosofico")).toBe(true);
    }
  });

  it("rhetoricalDevices desconhecido vira 'other' sem quebrar", () => {
    const base = baseInterpretation();
    (base.homiletics as Record<string, unknown>).rhetoricalDevices = ["humor", "anafora_inventada"];
    const r = parseInterpretationResponse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.homiletics.rhetoricalDevices).toEqual(["humor", "other"]);
  });

  it("blocos ausentes → rejeição dura (shape estrutural)", () => {
    const r = parseInterpretationResponse({ hermeneutics: {} });
    expect(r.success).toBe(false);
  });

  it("compactInterpretationSummary resume para a Etapa C", () => {
    const r = parseInterpretationResponse(baseInterpretation());
    expect(r.success).toBe(true);
    if (r.success) {
      const s = compactInterpretationSummary(r.data);
      expect(s).toContain("AFIRMAÇÃO CENTRAL:");
      expect(s).toContain("COERÊNCIA ARGUMENTATIVA: 4");
    }
  });
});
