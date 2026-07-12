// Normaliza filtros vindos do cliente para MasterFilters. includePreliminary
// determina onlyReviewed (revisado-só quando NÃO incluir preliminar).

import type { MasterFilters } from "./master-aggregate";

export function parseFilters(input: unknown): MasterFilters {
  const o = (input ?? {}) as Record<string, unknown>;
  const includePreliminary = Boolean(o.includePreliminary);
  const hardnessRaw = String(o.hardness ?? "MODERATE");
  const hardness = (["MODERATE", "DIRECT", "VERY_DIRECT"].includes(hardnessRaw)
    ? hardnessRaw
    : "MODERATE") as MasterFilters["hardness"];
  return {
    year: o.year ? Number(o.year) : undefined,
    series: o.series ? String(o.series) : undefined,
    onlyReviewed: !includePreliminary,
    includePreliminary,
    includeSensitiveSnippets: Boolean(o.includeSensitiveSnippets),
    hardness,
  };
}
