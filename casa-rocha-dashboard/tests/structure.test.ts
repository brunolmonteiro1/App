import { describe, it, expect } from "vitest";
import { compactStructureMap, parseStructureResponse } from "@/lib/coding/structurePrompt";
import { locateAnchors } from "@/lib/coding/locate-anchors";

// §23.3 — estrutura fluida: sem número fixo de pontos, digressão ≠ falha,
// enums desconhecidos normalizados com registro, anchors localizados.

function unit(order: number, over: Record<string, unknown> = {}) {
  return {
    order,
    descriptiveTitle: `Unidade ${order}`,
    summary: "resumo",
    function: "exposition",
    associatedThreads: [],
    scriptureReferences: [],
    relationToPrevious: "develops",
    relationToMainThesis: "supports",
    perceivedOrigin: "structurally_inferred",
    spontaneityEvidence: null,
    integrationQuality: "strong",
    startAnchor: "inicio da unidade",
    endAnchor: "fim da unidade",
    ...over,
  };
}

function baseStructure(over: Record<string, unknown> = {}) {
  return {
    declaredStructure: { exists: false, description: null, evidenceQuote: null },
    mainThesis: { description: "A cruz inverte a lógica do Éden.", confidence: "high" },
    governingQuestion: null,
    threads: [],
    discourseUnits: [unit(1)],
    emergentMovements: [],
    returnsAndResumptions: [],
    unresolvedLines: [],
    climaxes: [],
    conclusion: { summary: "fechamento", finalAppeal: null, relationToOpening: "responde", relationToThesis: "conclui", newContentIntroducedAtEnd: false },
    globalArc: { type: "linear_expository", description: "arco linear" },
    openingClosureRelation: { openingQuestion: null, finalAnswer: null, resolved: true, comment: "" },
    ...over,
  };
}

describe("parseStructureResponse — estrutura fluida", () => {
  it("pregação linear com 1 unidade é aceita (sem mínimo de 3 pontos)", () => {
    const r = parseStructureResponse(baseStructure());
    expect(r.success).toBe(true);
  });

  it("pregação circular com 9 unidades, digressão integrada e retomadas é aceita", () => {
    const units = [
      unit(1, { function: "opening" }),
      unit(2, { function: "scripture_reading" }),
      unit(3, { function: "exposition" }),
      unit(4, { function: "digression", relationToPrevious: "temporarily_deviates", integrationQuality: "lateral_but_useful" }),
      unit(5, { function: "return_to_thesis", relationToPrevious: "returns" }),
      unit(6, { function: "emerging_insight", perceivedOrigin: "discourse_emergent" }),
      unit(7, { function: "prayer" }),
      unit(8, { function: "application" }),
      unit(9, { function: "conclusion", relationToMainThesis: "concludes" }),
    ];
    const r = parseStructureResponse(
      baseStructure({
        discourseUnits: units,
        globalArc: { type: "circular", description: "volta ao jardim do início" },
        returnsAndResumptions: [{ threadId: "t1", openedAtUnit: 3, returnedAtUnit: 5, functionOfReturn: "retoma a tese" }],
        emergentMovements: [{ type: "emerging_insight", description: "insight sobre o Getsêmani", integrationWithMainThesis: "strong", evidenceQuote: null }],
      })
    );
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.discourseUnits).toHaveLength(9);
  });

  it("pregação sem conclusão formal é aceita (openingClosureRelation.resolved=false)", () => {
    const r = parseStructureResponse(
      baseStructure({
        conclusion: { summary: "termina abruptamente na oração", finalAppeal: null, relationToOpening: "não retorna", relationToThesis: "implícita", newContentIntroducedAtEnd: true },
        openingClosureRelation: { openingQuestion: "quem é você no jardim?", finalAnswer: null, resolved: false, comment: "pergunta fica aberta" },
      })
    );
    expect(r.success).toBe(true);
  });

  it("enum desconhecido é normalizado com REGISTRO, não rejeição", () => {
    const r = parseStructureResponse(baseStructure({ discourseUnits: [unit(1, { function: "explicacao_inventada" })] }));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.discourseUnits[0].function).toBe("other");
      expect(r.normalizations.some((n) => n.field === "discourseUnits.function" && n.received === "explicacao_inventada")).toBe(true);
    }
  });

  it("'apparently_planned' (proibido — ajuste 9) é normalizado para not_identifiable com registro", () => {
    const r = parseStructureResponse(baseStructure({ discourseUnits: [unit(1, { perceivedOrigin: "apparently_planned" })] }));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.discourseUnits[0].perceivedOrigin).toBe("not_identifiable");
      expect(r.normalizations.some((n) => n.field === "discourseUnits.perceivedOrigin")).toBe(true);
    }
  });

  it("sem unidades discursivas → rejeição dura (shape estrutural)", () => {
    const r = parseStructureResponse(baseStructure({ discourseUnits: [] }));
    expect(r.success).toBe(false);
  });

  it("sem tese → rejeição dura", () => {
    const r = parseStructureResponse(baseStructure({ mainThesis: { description: "", confidence: "high" } }));
    expect(r.success).toBe(false);
  });

  it("compactStructureMap gera 1 linha por unidade", () => {
    const r = parseStructureResponse(baseStructure({ discourseUnits: [unit(1), unit(2), unit(3)] }));
    expect(r.success).toBe(true);
    if (r.success) {
      const map = compactStructureMap(r.data);
      expect(map).toContain("TESE:");
      expect(map.split("\n").filter((l) => /^\s{2}\d+\./.test(l))).toHaveLength(3);
    }
  });
});

describe("locateAnchors — localização determinística (ajuste 10)", () => {
  const transcript =
    "No princípio Deus criou os céus e a terra. E a terra era sem forma e vazia. " +
    "Disse Deus: haja luz, e houve luz. E viu Deus que a luz era boa. " +
    "E chamou Deus à luz dia, e às trevas chamou noite.";

  it("anchors literais → exact, com índices coerentes", () => {
    const [a] = locateAnchors(transcript, [
      { order: 1, startAnchor: "No princípio Deus criou", endAnchor: "sem forma e vazia" },
    ]);
    expect(a.locationStatus).toBe("exact");
    expect(a.startIndex).toBe(0);
    expect(a.endIndex).toBeGreaterThan(a.startIndex!);
  });

  it("anchor com caixa/acento diferente → normalized", () => {
    const [a] = locateAnchors(transcript, [
      { order: 1, startAnchor: "no principio deus criou", endAnchor: "SEM FORMA E VAZIA" },
    ]);
    expect(a.locationStatus).toBe("normalized");
    expect(a.startIndex).toBe(0);
  });

  it("anchor inexistente → not_found (unidade permitida sem localização)", () => {
    const [a] = locateAnchors(transcript, [
      { order: 1, startAnchor: "texto que não existe na fala", endAnchor: "sem forma e vazia" },
    ]);
    expect(a.locationStatus).toBe("not_found");
  });

  it("fim antes do início → ambiguous (intervalo impossível)", () => {
    const [a] = locateAnchors(transcript, [
      { order: 1, startAnchor: "haja luz, e houve luz", endAnchor: "No princípio Deus criou" },
    ]);
    expect(a.locationStatus).toBe("ambiguous");
  });

  it("ordem invertida entre unidades → segunda rebaixada para ambiguous", () => {
    const locs = locateAnchors(transcript, [
      { order: 1, startAnchor: "haja luz, e houve luz", endAnchor: "a luz era boa" },
      { order: 2, startAnchor: "No princípio Deus criou", endAnchor: "sem forma e vazia" },
    ]);
    expect(locs[0].locationStatus).toBe("exact");
    expect(locs[1].locationStatus).toBe("ambiguous");
  });
});
