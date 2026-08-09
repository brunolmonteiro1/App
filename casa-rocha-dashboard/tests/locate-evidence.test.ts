import { describe, it, expect } from "vitest";
import { detectCompositeQuote, locateEvidence } from "@/lib/coding/locate-evidence";

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

  it("citação com reticências naturais mas fragmentos CONTÍGUOS ainda localiza (folding ignora pontuação)", () => {
    const loc = locateEvidence(transcript, "a graça de Deus... nos alcança quando menos merecemos");
    expect(loc).not.toBeNull();
  });

  it("citação costurada de fragmentos NÃO contíguos não localiza", () => {
    const loc = locateEvidence(transcript, "a graça de Deus nos alcança e serviço ao próximo");
    expect(loc).toBeNull();
  });
});

describe("detectCompositeQuote (§7 — citações compostas)", () => {
  it("detecta '[...]' entre fragmentos", () => {
    const r = detectCompositeQuote("sejamos tua igreja que sinaliza [...] somos uma comunidade de gente crucificada");
    expect(r.isComposite).toBe(true);
    expect(r.reason).toBe("square_bracket_ellipsis");
  });

  it("detecta '[…]' (reticência unicode entre colchetes)", () => {
    expect(detectCompositeQuote("primeiro trecho […] segundo trecho").isComposite).toBe(true);
  });

  it("detecta marcador editorial '[trecho omitido]'", () => {
    const r = detectCompositeQuote("começo da fala [trecho omitido] fim da fala");
    expect(r.isComposite).toBe(true);
    expect(r.reason).toBe("editorial_omission");
  });

  it("NÃO invalida reticência natural de fala (sem colchetes)", () => {
    expect(detectCompositeQuote("e eu pensei... será que é isso mesmo que Deus quer").isComposite).toBe(false);
  });

  it("NÃO invalida parênteses legítimos na fala", () => {
    expect(detectCompositeQuote("o texto (que lemos hoje) fala da graça").isComposite).toBe(false);
  });
});
