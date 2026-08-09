import { describe, it, expect } from "vitest";
import { batchFields, buildEvidencePrompt, EVIDENCE_BATCH_SIZE, parseEvidenceResponse } from "@/lib/coding/evidencePrompt";

// Etapa D — extração direcionada (§7): lotes, schema e regras do prompt.

describe("batchFields", () => {
  it("divide em lotes de no máximo 8", () => {
    const fields = Array.from({ length: 19 }, (_, i) => i);
    const batches = batchFields(fields);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(EVIDENCE_BATCH_SIZE);
    expect(batches[2]).toHaveLength(3);
  });

  it("lista vazia → nenhum lote (nenhuma chamada de IA)", () => {
    expect(batchFields([])).toHaveLength(0);
  });
});

describe("parseEvidenceResponse", () => {
  it("aceita múltiplas evidências para o mesmo campo", () => {
    const r = parseEvidenceResponse({
      evidences: [
        { field: "christologyScore", quote: "primeiro trecho contínuo da fala", reason: "a" },
        { field: "christologyScore", quote: "segundo trecho contínuo da fala", reason: "b" },
      ],
      fieldsWithoutEvidence: ["passivityRiskScore"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.evidences).toHaveLength(2);
      expect(r.data.fieldsWithoutEvidence).toEqual(["passivityRiskScore"]);
    }
  });

  it("admitir ausência é válido (arrays vazios)", () => {
    const r = parseEvidenceResponse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.evidences).toEqual([]);
  });

  it("citação curta demais (<10 chars) é rejeitada pelo shape", () => {
    const r = parseEvidenceResponse({ evidences: [{ field: "x", quote: "curta", reason: "" }] });
    expect(r.success).toBe(false);
  });
});

describe("buildEvidencePrompt", () => {
  it("lista só os campos pedidos, com score e família; proíbe [...] e paráfrase", () => {
    const { system, user } = buildEvidencePrompt({
      title: "Teste",
      transcriptText: "texto",
      fields: [
        { field: "christologyScore", label: "Cristologia", score: 4, familyLabel: "Presença/centralidade" },
        { field: "passivityRiskScore", label: "Risco de passividade", score: 3, familyLabel: "Risco" },
      ],
    });
    expect(user).toContain('"christologyScore"');
    expect(user).toContain("score atribuído: 3");
    expect(system).toContain("NUNCA use \"[...]\"");
    expect(system).toContain("fieldsWithoutEvidence");
    expect(system).toContain("NÃO parafraseie referência bíblica");
  });
});
