// Agregador do Modo Diagnóstico Interno (BLUEPRINT v2 §30–34). Monta o payload
// estruturado (cards, denominadores, proveniência, tensões, snippets rastreáveis)
// que alimenta a exibição e o gerador de relatório master. TODOS os números vêm
// daqui — determinísticos — para que o modelo de linguagem apenas os interprete.

import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { average, getCodedScores, type CodedSermon } from "@/lib/aggregates";
import { detectTensions, type TensionResult } from "./tensions";

export const MASTER_CALC_VERSION = "master-calc-v1";

export interface MasterFilters {
  year?: number;
  series?: string;
  onlyReviewed: boolean;
  includePreliminary: boolean;
  includeSensitiveSnippets: boolean;
  hardness: "MODERATE" | "DIRECT" | "VERY_DIRECT";
}

export interface CardMetric {
  key: string;
  label: string;
  value: number | null;
  n: number;
  provenance: string;
}

export interface MasterSnippet {
  sermonId: string;
  title: string;
  series: string | null;
  year: number | null;
  scoreField: string;
  scoreValue: number | null;
  quote: string;
  comment: string | null;
  method: string;
  confidence: string | null;
  reviewed: boolean;
}

export interface Denominators {
  totalInFilter: number;
  validCoded: number;
  reviewed: number;
  preliminary: number;
  usedForMetrics: number;
  needsHumanReview: number;
  pendingRepairSuggestions: number;
}

export interface MasterPayload {
  calcVersion: string;
  generatedAt: string;
  filters: MasterFilters;
  denominators: Denominators;
  provenanceNote: string;
  cards: CardMetric[];
  gaps: { key: string; label: string; value: number | null; a: string; b: string }[];
  tensions: { version: string; tensions: TensionResult[] };
  snippets: MasterSnippet[];
  reviewedCoverage: number; // fração 0–1 do conjunto que é revisado
  limitations: string[];
  inputHash: string;
}

// Cards obrigatórios (§31). label + campo agregado.
const CARD_FIELDS: { key: string; label: string; field: string }[] = [
  { key: "orthodoxy", label: "Ortodoxia média", field: "orthodoxyScore" },
  { key: "orthopraxy", label: "Ortopraxia média", field: "orthopraxyScore" },
  { key: "spirituality", label: "Espiritualidade média", field: "spiritualityScore" },
  { key: "community", label: "Comunidade / corpo", field: "communityMutualityScore" },
  { key: "mission", label: "Missão / evangelismo", field: "missionEvangelismScore" },
  { key: "everyday", label: "Vida cotidiana", field: "familyRelationshipsScore" },
  { key: "pastoral", label: "Saúde pastoral", field: "pastoralHealthScore" },
  { key: "organicDiaconia", label: "Diaconia orgânica", field: "organicDiaconiaScore" },
  { key: "institutionalAction", label: "Ação institucional", field: "institutionalActionScore" },
  { key: "contextualCritique", label: "Crítica contextual", field: "contextualCritiqueIntensityScore" },
  { key: "biblicalGrounding", label: "Fundamentação bíblica da crítica", field: "biblicalGroundingOfCritiqueScore" },
  { key: "reconstruction", label: "Reconstrução após crítica", field: "reconstructionAfterCritiqueScore" },
  { key: "activation", label: "Ativação após crítica", field: "activationAfterCritiqueScore" },
  { key: "healing", label: "Acolhimento dos feridos", field: "healingWoundedScore" },
  { key: "sending", label: "Envio dos curados", field: "sendingHealedScore" },
  { key: "passivity", label: "Risco de passividade", field: "passivityRiskScore" },
  { key: "cynicism", label: "Risco de cinismo/elitismo", field: "cynicismElitismRiskScore" },
];

function provenanceOf(onlyReviewed: boolean): string {
  return onlyReviewed ? "reviewed" : "ai_coded+reviewed";
}

export async function buildMasterPayload(filters: MasterFilters): Promise<MasterPayload> {
  const provenance = provenanceOf(filters.onlyReviewed);

  // Universo total no filtro (independe de codificação).
  const totalInFilter = await prisma.sermon.count({
    where: {
      isSermon: true,
      ...(filters.year ? { year: filters.year } : {}),
      ...(filters.series ? { series: filters.series } : {}),
    },
  });

  const [reviewedRows, allCodedRows] = await Promise.all([
    getCodedScores({ onlyReviewed: true, year: filters.year, series: filters.series }),
    getCodedScores({ onlyReviewed: false, year: filters.year, series: filters.series }),
  ]);

  // Conjunto usado para métricas segue o filtro de proveniência.
  const rows: CodedSermon[] = filters.onlyReviewed ? reviewedRows : allCodedRows;
  const reviewedCount = reviewedRows.length;
  const preliminaryCount = allCodedRows.length - reviewedRows.length;

  const [needsReview, pendingRepairs] = await Promise.all([
    prisma.sermonAnalysis.count({ where: { needsHumanReview: true } }),
    prisma.codingRepairSuggestion.count({ where: { status: "PENDING" } }),
  ]);

  const cards: CardMetric[] = CARD_FIELDS.map((c) => {
    const { value, n } = average(rows, c.field);
    return { key: c.key, label: c.label, value: n > 0 ? Number(value.toFixed(2)) : null, n, provenance };
  });

  const gap = (label: string, key: string, fa: string, fb: string, la: string, lb: string) => {
    const a = average(rows, fa);
    const b = average(rows, fb);
    const value = a.n > 0 && b.n > 0 ? Number((a.value - b.value).toFixed(2)) : null;
    return { key, label, value, a: la, b: lb };
  };
  const gaps = [
    gap("Gap ortodoxia × ortopraxia", "gap_orthodoxy_orthopraxy", "orthodoxyScore", "orthopraxyScore", "ortodoxia", "ortopraxia"),
    gap("Gap orgânico × institucional", "gap_organic_institutional", "organicDiaconiaScore", "institutionalActionScore", "diaconia orgânica", "ação institucional"),
    gap("Gap cura × envio", "gap_healing_sending", "healingWoundedScore", "sendingHealedScore", "acolhimento", "envio"),
  ];

  const tensions = detectTensions(rows);

  // Snippets rastreáveis: das evidências das pregações no conjunto (§34/§35.2).
  // Sensíveis só entram se explicitamente habilitado. Volume limitado.
  const sermonIds = rows.map((r) => r.id);
  const evidences = sermonIds.length
    ? await prisma.sermonEvidence.findMany({
        where: {
          sermonId: { in: sermonIds },
          scoreValue: { gte: 4 },
        },
        select: {
          sermonId: true, scoreField: true, scoreValue: true, evidenceQuote: true,
          analyticalComment: true, analysisMethod: true, confidence: true,
          sermon: { select: { title: true, series: true, year: true, analysis: { select: { analysisStatus: true, sensitivityLevel: true } } } },
        },
        orderBy: { scoreValue: "desc" },
        take: 60,
      })
    : [];

  const snippets: MasterSnippet[] = evidences
    .filter((e) => {
      const sens = e.sermon.analysis?.sensitivityLevel;
      const isSensitive = sens === "alta" || sens === "high";
      return filters.includeSensitiveSnippets || !isSensitive;
    })
    .slice(0, 40)
    .map((e) => ({
      sermonId: e.sermonId,
      title: e.sermon.title,
      series: e.sermon.series,
      year: e.sermon.year,
      scoreField: e.scoreField,
      scoreValue: e.scoreValue,
      quote: e.evidenceQuote,
      comment: e.analyticalComment,
      method: e.analysisMethod,
      confidence: e.confidence,
      reviewed: e.sermon.analysis?.analysisStatus === "reviewed",
    }));

  const denominators: Denominators = {
    totalInFilter,
    validCoded: allCodedRows.length,
    reviewed: reviewedCount,
    preliminary: preliminaryCount,
    usedForMetrics: rows.length,
    needsHumanReview: needsReview,
    pendingRepairSuggestions: pendingRepairs,
  };

  const reviewedCoverage = allCodedRows.length > 0 ? reviewedCount / allCodedRows.length : 0;

  const limitations = [
    "Mede o púlpito dominical, não toda a vida formativa da igreja.",
    "Transcrições automáticas do YouTube; datas parcialmente estimadas.",
    "Sinais lexicais não medem intenção, tom nem fundamentação.",
    filters.onlyReviewed
      ? "Conjunto restrito a pregações revisadas por humano."
      : "Inclui codificação preliminar por IA (não revisada) — marcada como tal.",
  ];

  // Hash do input: garante que o relatório salvo corresponde a este payload.
  const hashBasis = JSON.stringify({ filters, denominators, cards, gaps, tensions: tensions.tensions.map((t) => ({ id: t.id, active: t.active, highValue: t.highValue, lowValue: t.lowValue })) });
  const inputHash = createHash("sha256").update(hashBasis).digest("hex").slice(0, 32);

  return {
    calcVersion: MASTER_CALC_VERSION,
    generatedAt: new Date().toISOString(),
    filters,
    denominators,
    provenanceNote: provenance,
    cards,
    gaps,
    tensions,
    snippets,
    reviewedCoverage: Number(reviewedCoverage.toFixed(2)),
    limitations,
    inputHash,
  };
}
