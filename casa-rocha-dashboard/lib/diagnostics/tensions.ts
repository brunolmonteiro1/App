// Detector DETERMINÍSTICO de tensões (BLUEPRINT v2 §33). Recebe as pregações
// codificadas e a config versionada; devolve tensões ATIVAS com valores, fórmula,
// denominador e leitura interna. O modelo de linguagem, quando usado, recebe estes
// números prontos — nunca os inventa.

import { average, type CodedSermon } from "@/lib/aggregates";
import { TENSION_DEFS, TENSIONS_CONFIG_VERSION, type TensionDef } from "./tensions-config";

export interface TensionResult {
  id: string;
  title: string;
  active: boolean;
  formula: string;
  highLabel: string;
  lowLabel: string;
  highValue: number | null;
  lowValue: number | null;
  highN: number;
  lowN: number;
  gap: number | null;
  highThreshold: number;
  lowThreshold: number;
  minRecords: number;
  internalReading: string;
  suggestedAction: string;
  reason: string; // por que ativou ou não (auditável)
}

function sideAverage(rows: CodedSermon[], fields: string[]): { value: number | null; n: number } {
  // Média das médias de campo (cada campo ignora null); n = mínimo de cobertura entre campos.
  const perField = fields.map((f) => average(rows, f));
  const withData = perField.filter((r) => r.n > 0);
  if (withData.length === 0) return { value: null, n: 0 };
  const value = withData.reduce((a, r) => a + r.value, 0) / withData.length;
  const n = Math.min(...withData.map((r) => r.n));
  return { value, n };
}

export function evaluateTension(rows: CodedSermon[], def: TensionDef): TensionResult {
  const high = sideAverage(rows, def.high.fields);
  const low = sideAverage(rows, def.low.fields);
  const enoughData = high.n >= def.minRecords && low.n >= def.minRecords;
  const highOk = high.value != null && high.value >= def.highThreshold;
  const lowOk = low.value != null && low.value <= def.lowThreshold;
  const active = enoughData && highOk && lowOk;

  let reason: string;
  if (!enoughData) reason = `dados insuficientes (n alto=${high.n}, n baixo=${low.n}; mínimo ${def.minRecords})`;
  else if (!highOk) reason = `lado alto não atingiu o limiar (${high.value?.toFixed(2)} < ${def.highThreshold})`;
  else if (!lowOk) reason = `lado baixo acima do limiar (${low.value?.toFixed(2)} > ${def.lowThreshold})`;
  else reason = "ambos os limiares satisfeitos com cobertura suficiente";

  return {
    id: def.id,
    title: def.title,
    active,
    formula: def.formula,
    highLabel: def.high.label,
    lowLabel: def.low.label,
    highValue: high.value != null ? Number(high.value.toFixed(2)) : null,
    lowValue: low.value != null ? Number(low.value.toFixed(2)) : null,
    highN: high.n,
    lowN: low.n,
    gap: high.value != null && low.value != null ? Number((high.value - low.value).toFixed(2)) : null,
    highThreshold: def.highThreshold,
    lowThreshold: def.lowThreshold,
    minRecords: def.minRecords,
    internalReading: def.internalReading,
    suggestedAction: def.suggestedAction,
    reason,
  };
}

export function detectTensions(rows: CodedSermon[]): { version: string; tensions: TensionResult[] } {
  return {
    version: TENSIONS_CONFIG_VERSION,
    tensions: TENSION_DEFS.map((d) => evaluateTension(rows, d)),
  };
}
