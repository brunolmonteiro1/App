// Agregações interpretativas — SEMPRE sobre pregações codificadas (ai_coded/reviewed),
// com denominador explícito (METHODOLOGY §4). onlyReviewed restringe a percentuais finais.

import { prisma } from "./db";

export interface CodedFilter {
  onlyReviewed?: boolean;
  year?: number;
  series?: string;
}

function statusList(onlyReviewed?: boolean): string[] {
  return onlyReviewed ? ["reviewed"] : ["ai_coded", "reviewed"];
}

export async function getCodedScores(filter: CodedFilter) {
  return prisma.sermon.findMany({
    where: {
      isSermon: true,
      ...(filter.year ? { year: filter.year } : {}),
      ...(filter.series ? { series: filter.series } : {}),
      analysis: { analysisStatus: { in: statusList(filter.onlyReviewed) } },
      scores: { isNot: null },
    },
    select: {
      id: true,
      title: true,
      year: true,
      series: true,
      scores: true,
      analysis: { select: { analysisStatus: true, ontologicalVsPragmatic: true } },
    },
    orderBy: { dateEstimated: "asc" },
  });
}

export type CodedSermon = Awaited<ReturnType<typeof getCodedScores>>[number];

export function average(rows: CodedSermon[], field: string): { value: number; n: number } {
  const vals = rows
    .map((r) => (r.scores as unknown as Record<string, number | null>)[field])
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return { value: 0, n: 0 };
  return { value: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}

// Eixos do radar: campo agregado representativo por eixo (CODEBOOK §4)
export const RADAR_AXES: { axis: string; field: string }[] = [
  { axis: "Saúde bíblica", field: "biblicalHealthScore" },
  { axis: "Ortodoxia", field: "orthodoxyScore" },
  { axis: "Ortopraxia", field: "orthopraxyScore" },
  { axis: "Espiritualidade", field: "spiritualityScore" },
  { axis: "Comunidade", field: "communityMutualityScore" },
  { axis: "Missão", field: "missionEvangelismScore" },
  { axis: "Vida cotidiana", field: "familyRelationshipsScore" },
  { axis: "Saúde pastoral", field: "pastoralHealthScore" },
];

// Funil de maturidade (Eixo 8): acolhimento → cura → reconstrução → ativação → envio → corresponsabilidade
export const MATURITY_FUNNEL: { label: string; field: string }[] = [
  { label: "Acolhimento dos feridos", field: "healingWoundedScore" },
  { label: "Desconstrução religiosa", field: "religiousDeconstructionScore" },
  { label: "Reconstrução discipular", field: "discipleshipReconstructionScore" },
  { label: "Ativação prática", field: "practicalActivationScore" },
  { label: "Envio dos curados", field: "sendingHealedScore" },
  { label: "Corresponsabilidade", field: "coresponsibilityScore" },
];
