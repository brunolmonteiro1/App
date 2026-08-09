// Agregados DERIVADOS por eixo (Entregável 4 do plano; ajuste 4 da revisão).
// NUNCA média simples de todos os componentes: uma pregação cristológica não
// precisa ensinar escatologia — média geral penalizaria sermões tematicamente
// concentrados e misturaria ausência temática com baixa qualidade.
//
// Fórmulas (documentadas também em CODEBOOK.md):
// - presentMean:  média dos componentes PRESENTES (score ≥ 1). Exclui 0
//   (ausente ≠ fraco), null (não avaliado), riscos (exclude_from_averages) e
//   agregados. Para família QUALIDADE, todo não-null conta (não existe 0).
// - top3Mean:     média dos 3 maiores scores do eixo (intensidade dominante).
// - breadthCount: nº de componentes com score ≥ 3 (amplitude) / total.
// - holisticAiScore: o agregado avaliado pela IA (coluna existente, intocada).
// O painel é calculado em RUNTIME — nada é persistido, então "substituição
// silenciosa" de um valor pelo outro é impossível por construção.
import { AGGREGATE_SCORE_FIELDS, axisComponentFields, familyOf } from "./score-fields";

export interface DerivedAxisPanel {
  aggregateField: string;
  presentMean: number | null; // média dos presentes (≥1), null se nenhum presente
  top3Mean: number | null; // média dos top-3 (dos presentes), null se nenhum
  breadthCount: number; // componentes com score ≥3
  presentCount: number; // componentes presentes (≥1, ou não-null na qualidade)
  totalComponents: number; // componentes avaliáveis do eixo (sem riscos/agregados)
  holisticAiScore: number | null; // valor da IA (coluna do agregado)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function deriveAxisPanel(
  aggregateField: string,
  scores: Record<string, number | null | undefined>
): DerivedAxisPanel {
  const components = axisComponentFields(aggregateField).filter((f) => familyOf(f) !== "risk");
  const values: number[] = [];
  for (const f of components) {
    const v = scores[f];
    if (v == null) continue; // null/undefined = não avaliado — NUNCA vira zero
    if (familyOf(f) === "quality") {
      values.push(v); // qualidade: não existe 0; todo não-null conta
    } else if (v >= 1) {
      values.push(v); // presença/aplicabilidade: 0 = ausente (fora da média)
    }
  }
  const top3 = [...values].sort((a, b) => b - a).slice(0, 3);
  return {
    aggregateField,
    presentMean: values.length ? round2(values.reduce((a, b) => a + b, 0) / values.length) : null,
    top3Mean: top3.length ? round2(top3.reduce((a, b) => a + b, 0) / top3.length) : null,
    breadthCount: values.filter((v) => v >= 3).length,
    presentCount: values.length,
    totalComponents: components.length,
    holisticAiScore: scores[aggregateField] ?? null,
  };
}

// Painel completo dos 5 eixos para uma pregação.
export function deriveAllAxisPanels(scores: Record<string, number | null | undefined>): DerivedAxisPanel[] {
  return [...AGGREGATE_SCORE_FIELDS].map((agg) => deriveAxisPanel(agg, scores));
}
