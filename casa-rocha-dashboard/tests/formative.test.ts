import { describe, it, expect } from "vitest";
import { deriveAxisPanel } from "@/lib/coding/derived-scores";
import { parseFormativeResponse } from "@/lib/coding/formativePrompt";
import { FAMILY_SEMANTICS, familyOf, SCORE_FIELDS } from "@/lib/coding/score-fields";

// Commit 5 — famílias de score, agregados derivados e schema formativo (§5-C, §13).

describe("matriz de famílias de score (Entregável 2)", () => {
  it("todo campo tem família válida", () => {
    for (const f of SCORE_FIELDS) {
      expect(FAMILY_SEMANTICS[f.family], `campo ${f.field}`).toBeDefined();
    }
  });

  it("os 5 agregados são família aggregate", () => {
    for (const f of ["biblicalHealthScore", "orthodoxyScore", "orthopraxyScore", "spiritualityScore", "pastoralHealthScore"]) {
      expect(familyOf(f)).toBe("aggregate");
    }
  });

  it("riscos são exclude_from_averages", () => {
    expect(familyOf("passivityRiskScore")).toBe("risk");
    expect(familyOf("cynicismElitismRiskScore")).toBe("risk");
    expect(FAMILY_SEMANTICS.risk.aggregationMethod).toContain("exclude_from_averages");
  });

  it("aplicabilidade cobre método/ativação/disciplinas/ação institucional", () => {
    for (const f of ["practicalMethodScore", "practicalActivationScore", "spiritualDisciplinesScore", "institutionalActionScore", "activationAfterCritiqueScore"]) {
      expect(familyOf(f)).toBe("applicability");
    }
  });
});

describe("deriveAxisPanel (Entregável 4 — nunca média simples)", () => {
  it("pregação cristológica concentrada NÃO é penalizada por não ensinar as outras doutrinas", () => {
    const p = deriveAxisPanel("orthodoxyScore", {
      christologyScore: 5,
      crucicentrismScore: 5,
      soteriologyScore: 4,
      trinityScore: 0, // ausente ≠ fraco
      eschatologyScore: 0,
      ecclesiologyScore: null, // não avaliado
      orthodoxyScore: 4,
    });
    expect(p.presentMean).toBeCloseTo(4.67, 1); // média SÓ dos presentes
    expect(p.top3Mean).toBeCloseTo(4.67, 1);
    expect(p.breadthCount).toBe(3);
    expect(p.holisticAiScore).toBe(4);
  });

  it("null nunca vira zero; eixo sem presença → presentMean null", () => {
    const p = deriveAxisPanel("orthodoxyScore", { christologyScore: null, trinityScore: 0 });
    expect(p.presentMean).toBeNull();
    expect(p.top3Mean).toBeNull();
    expect(p.presentCount).toBe(0);
  });

  it("riscos NÃO entram na média do eixo pastoral", () => {
    const p = deriveAxisPanel("pastoralHealthScore", {
      healingWoundedScore: 4,
      passivityRiskScore: 5, // risco alto NÃO deve puxar a média
      cynicismElitismRiskScore: 5,
      pastoralHealthScore: 4,
    });
    expect(p.presentMean).toBe(4); // só healingWounded conta
    expect(p.totalComponents).toBeGreaterThan(1);
  });
});

describe("parseFormativeResponse (Etapa C)", () => {
  function base(over: Record<string, unknown> = {}) {
    return {
      tema_central: "A cruz",
      resumo_3_linhas: "Resumo com mais de dez caracteres.",
      scores: { christologyScore: 4 },
      formation: {
        beliefsFormed: ["a cruz inverte a queda"],
        identityFormed: ["crucificado com Cristo"],
        affectionsFormed: [],
        practicesCalledFor: [],
        methodsOffered: [],
        communityImplications: [],
        missionImplications: [],
        hopePresented: ["vida nova"],
        dominantFormationMode: "orthodoxy",
        discipleProfile: ["biblically_formed", "repentant"],
      },
      gap_analysis: {
        notDevelopedInThisSermon: ["método devocional"],
        formativeComplement: { status: "strong_identity_weak_practice", theme: "prática", reason: "identidade forte sem passo" },
        corpusHypotheses: ["verificar se sermões de santificação têm método baixo no corpus"],
      },
      ...over,
    };
  }

  it("resposta válida sem evidencias passa (evidências são da Etapa D)", () => {
    const r = parseFormativeResponse(base());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.evidencias).toEqual([]);
      expect(r.data.formation.dominantFormationMode).toBe("orthodoxy");
      expect(r.data.gap_analysis.formativeComplement.status).toBe("strong_identity_weak_practice");
    }
  });

  it("discipleProfile desconhecido normaliza com registro", () => {
    const b = base();
    (b.formation as Record<string, unknown>).discipleProfile = ["guerreiro_de_oracao"];
    const r = parseFormativeResponse(b);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.formation.discipleProfile).toEqual(["not_identifiable"]);
      expect(r.normalizations.some((n) => n.received === "guerreiro_de_oracao")).toBe(true);
    }
  });

  it("enums categóricos v1 continuam normalizados com registro (critic_target)", () => {
    const r = parseFormativeResponse(base({ critic_target: "Hipocrisia Religiosa" }));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.critic_target).toBe("hipocrisia_religiosa");
      expect(r.normalizations.some((n) => n.field === "critic_target")).toBe(true);
    }
  });

  it("blocos formation/gap ausentes caem em defaults (não derrubam a etapa)", () => {
    const r = parseFormativeResponse({ tema_central: "A cruz", resumo_3_linhas: "Resumo com mais de dez caracteres.", scores: {} });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.gap_analysis.formativeComplement.status).toBe("not_applicable");
  });
});
