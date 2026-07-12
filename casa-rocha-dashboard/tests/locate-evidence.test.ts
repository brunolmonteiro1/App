import { describe, it, expect } from "vitest";
import { locateEvidence } from "@/lib/coding/locate-evidence";

// §40.3 Evidências: localização literal, normalizada e citação inexistente.

const transcript =
  "Hoje vamos falar sobre a cruz de Cristo. A graça de Deus nos alcança quando menos merecemos, " +
  "e o Espírito Santo nos capacita para uma vida nova de obediência e serviço ao próximo.";

describe("locateEvidence", () => {
  it("snippet literal é localizado com offsets corretos", () => {
    const loc = locateEvidence(transcript, "A graça de Deus nos alcança quando menos merecemos");
    expect(loc).not.toBeNull();
    expect(transcript.slice(loc!.startIndex, loc!.endIndex).toLowerCase()).toContain("graça de deus");
  });

  it("citação com espaços/caixa normalizados é localizada e recortada do original", () => {
    const loc = locateEvidence(transcript, "  a GRAÇA   de deus   nos alcança  ");
    expect(loc).not.toBeNull();
    expect(loc!.exactQuote).toContain("graça de Deus"); // recorte real preserva o original
  });

  it("citação inexistente retorna null", () => {
    const loc = locateEvidence(transcript, "predestinação dupla e supralapsarianismo detalhado");
    expect(loc).toBeNull();
  });

  it("citação curtíssima (<10 chars normalizados) retorna null", () => {
    expect(locateEvidence(transcript, "cruz")).toBeNull();
  });
});
