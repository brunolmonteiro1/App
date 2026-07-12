// Localização determinística dos anchors das unidades discursivas (ajuste 10).
// startAnchor/endAnchor vindos da IA não ficam como texto livre: são localizados
// na transcrição (via locateEvidence, tolerante a acento/caixa/pontuação) e
// recebem startIndex/endIndex reais + status de confiança. Unidade sem
// localização exata é permitida (not_found) — a linha do tempo degrada com aviso.
import { locateEvidence } from "./locate-evidence";

export type AnchorLocationStatus = "exact" | "normalized" | "ambiguous" | "not_found";

export interface AnchorLocation {
  order: number;
  startIndex: number | null;
  endIndex: number | null;
  locationStatus: AnchorLocationStatus;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1 && n < 3) {
    n++;
    i = haystack.indexOf(needle, i + 1);
  }
  return n;
}

export function locateAnchors(
  transcript: string,
  units: { order: number; startAnchor: string; endAnchor: string }[]
): AnchorLocation[] {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const result: AnchorLocation[] = sorted.map((u) => {
    const start = locateEvidence(transcript, u.startAnchor);
    const end = locateEvidence(transcript, u.endAnchor);
    if (!start || !end) {
      return {
        order: u.order,
        startIndex: start?.startIndex ?? null,
        endIndex: end?.endIndex ?? null,
        locationStatus: "not_found",
      };
    }
    // Intervalo impossível (fim antes do início) → ambíguo
    if (end.endIndex <= start.startIndex) {
      return { order: u.order, startIndex: start.startIndex, endIndex: end.endIndex, locationStatus: "ambiguous" };
    }
    // Anchor repetido na transcrição → localização ambígua
    const ambiguous =
      countOccurrences(transcript, u.startAnchor.trim()) > 1 || countOccurrences(transcript, u.endAnchor.trim()) > 1;
    const exact = transcript.includes(u.startAnchor.trim()) && transcript.includes(u.endAnchor.trim());
    return {
      order: u.order,
      startIndex: start.startIndex,
      endIndex: end.endIndex,
      locationStatus: ambiguous ? "ambiguous" : exact ? "exact" : "normalized",
    };
  });

  // Ordem invertida entre unidades consecutivas → rebaixa para ambiguous
  let lastStart = -1;
  for (const loc of result) {
    if (loc.locationStatus === "not_found" || loc.startIndex === null) continue;
    if (loc.startIndex < lastStart) {
      loc.locationStatus = "ambiguous";
    } else {
      lastStart = loc.startIndex;
    }
  }
  return result;
}
