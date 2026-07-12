// Prompt canônico do gerador de relatório master (BLUEPRINT v2 §35.3/§35.4).
// O nível de dureza altera SOMENTE a linguagem — nunca dados, thresholds,
// evidências, confiança ou classificação de revisado/preliminar (§30.2).

import type { MasterPayload } from "./master-aggregate";

export const MASTER_PROMPT_VERSION = "master-prompt-v1";

const HARDNESS_LANGUAGE: Record<MasterPayload["filters"]["hardness"], string> = {
  MODERATE:
    "Nível de dureza MODERATE: linguagem sóbria e equilibrada; explicite riscos sem dramatizar.",
  DIRECT:
    "Nível de dureza DIRECT: seja direto e conciso; nomeie tensões com clareza, mantendo o rigor.",
  VERY_DIRECT:
    "Nível de dureza VERY_DIRECT: máxima franqueza estratégica; priorize as tensões mais fortes. Ainda assim, nunca invente dado, nunca julgue caráter e nunca declare causalidade sem base.",
};

const RULES = `Regras:
1. Não invente dados.
2. Não julgue intenção, caráter ou motivação do pregador.
3. Não faça diagnóstico espiritual invisível.
4. Não use linguagem diplomática desnecessária.
5. Seja direto, mas vincule afirmações fortes a métricas e evidências FORNECIDAS.
6. Separe dado confirmado, interpretação, hipótese e risco.
7. Aponte contraevidências quando existirem.
8. Não transforme sinal lexical em conclusão.
9. Priorize dados revisados por humano.
10. Quando usar dados preliminares, marque-os como preliminares.
11. Todo achado duro deve ter métrica, denominador, evidência, confiança, risco e recomendação.
12. Não altere os dados segundo o nível de dureza; altere somente a linguagem.
13. Não declare causalidade quando os dados mostram apenas associação discursiva.
14. Não trate ausência de tema no corpus como prova de ausência absoluta no ministério.
15. Use APENAS os números, tensões e snippets do payload. Não cite dado que não foi enviado.
16. sourceIds e textualEvidence devem referenciar apenas snippets presentes no payload.`;

export function buildMasterSystemPrompt(hardness: MasterPayload["filters"]["hardness"]): string {
  return [
    "Você é um auditor teológico-pastoral interno, contratado para produzir um diagnóstico frio, direto e estratégico a partir dos dados codificados das pregações da igreja A Casa da Rocha.",
    "",
    "Sua tarefa não é proteger sensibilidades institucionais, nem escrever um relatório pastoral público. Sua tarefa é dizer, com base nos dados fornecidos, quais padrões, tensões, lacunas e riscos aparecem.",
    "",
    RULES,
    "",
    HARDNESS_LANGUAGE[hardness],
    "",
    "Responda SOMENTE com um objeto JSON válido no schema pedido, sem texto fora do JSON.",
  ].join("\n");
}

// O payload já é determinístico; enviamos um recorte enxuto (sem transcrições
// inteiras — §35.2) e pedimos a interpretação.
export function buildMasterUserPrompt(payload: MasterPayload): string {
  const compact = {
    filters: payload.filters,
    denominators: payload.denominators,
    reviewedCoverage: payload.reviewedCoverage,
    cards: payload.cards,
    gaps: payload.gaps,
    activeTensions: payload.tensions.tensions.filter((t) => t.active),
    inactiveTensionsConsidered: payload.tensions.tensions
      .filter((t) => !t.active)
      .map((t) => ({ id: t.id, reason: t.reason })),
    snippets: payload.snippets.map((s, i) => ({
      id: `S${i + 1}`,
      sermonId: s.sermonId,
      title: s.title,
      field: s.scoreField,
      score: s.scoreValue,
      reviewed: s.reviewed,
      quote: s.quote.slice(0, 400),
    })),
    limitations: payload.limitations,
    calcVersion: payload.calcVersion,
    inputHash: payload.inputHash,
  };
  return [
    "DADOS DO CONJUNTO (determinísticos — não recalcule, apenas interprete):",
    "```json",
    JSON.stringify(compact, null, 2),
    "```",
    "",
    "Produza o diagnóstico interno no schema de saída. Toda afirmação forte deve citar métrica/denominador do payload e, quando textual, referenciar os ids de snippet (S1, S2, …).",
  ].join("\n");
}
