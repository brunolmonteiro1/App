import { describe, it, expect } from "vitest";
import { detectTensions, evaluateTension } from "@/lib/diagnostics/tensions";
import { TENSION_DEFS } from "@/lib/diagnostics/tensions-config";
import type { CodedSermon } from "@/lib/aggregates";

// §40.7-ish: detector determinístico de tensões. Rows sintéticas (só `scores`).
function rows(n: number, scores: Record<string, number | null>): CodedSermon[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    title: `t${i}`,
    year: 2024,
    series: null,
    scores: scores as unknown,
    analysis: { analysisStatus: "reviewed", ontologicalVsPragmatic: null },
  })) as unknown as CodedSermon[];
}

const corpoVsEstrutura = TENSION_DEFS.find((t) => t.id === "corpo_vs_estrutura")!;

describe("evaluateTension — corpo elevado × estrutura baixa", () => {
  it("ativa quando lado alto ≥ limiar, lado baixo ≤ limiar e cobertura suficiente", () => {
    const r = rows(6, { communityMutualityScore: 5, ecclesiologyScore: 4, institutionalActionScore: 1 });
    const res = evaluateTension(r, corpoVsEstrutura);
    expect(res.active).toBe(true);
    expect(res.highValue).not.toBeNull();
    expect(res.gap).toBeGreaterThan(0);
  });

  it("NÃO ativa com poucos registros (abaixo do mínimo de cobertura)", () => {
    const r = rows(2, { communityMutualityScore: 5, ecclesiologyScore: 4, institutionalActionScore: 1 });
    expect(evaluateTension(r, corpoVsEstrutura).active).toBe(false);
  });

  it("NÃO ativa quando o lado baixo também está alto", () => {
    const r = rows(6, { communityMutualityScore: 5, ecclesiologyScore: 4, institutionalActionScore: 5 });
    expect(evaluateTension(r, corpoVsEstrutura).active).toBe(false);
  });

  it("null não conta como zero (ignora null na média)", () => {
    // institutionalActionScore null em todas → lado baixo sem dados → não ativa
    const r = rows(6, { communityMutualityScore: 5, ecclesiologyScore: 4, institutionalActionScore: null });
    const res = evaluateTension(r, corpoVsEstrutura);
    expect(res.lowValue).toBeNull();
    expect(res.active).toBe(false);
  });
});

describe("detectTensions", () => {
  it("retorna versão e todas as tensões definidas", () => {
    const out = detectTensions(rows(6, { communityMutualityScore: 5, ecclesiologyScore: 4, institutionalActionScore: 1 }));
    expect(out.version).toBeTruthy();
    expect(out.tensions).toHaveLength(TENSION_DEFS.length);
  });
});
