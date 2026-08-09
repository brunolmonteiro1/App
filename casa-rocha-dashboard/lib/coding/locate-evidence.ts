// Localiza uma citação da IA dentro da transcrição original, tolerando
// diferenças de acentuação, caixa, pontuação e espaçamento.
// Retorna índices REAIS na transcrição (para destaque na revisão) ou null.

interface Folded {
  text: string;
  map: number[]; // map[i] = índice do caractere original correspondente a text[i]
}

function foldWithMap(original: string): Folded {
  let text = "";
  const map: number[] = [];
  let lastWasSpace = true;
  let i = 0;
  for (const ch of original) {
    const decomposed = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const c of decomposed) {
      if (/[a-z0-9]/.test(c)) {
        text += c;
        map.push(i);
        lastWasSpace = false;
      } else if (!lastWasSpace) {
        text += " ";
        map.push(i);
        lastWasSpace = true;
      }
    }
    i += ch.length;
  }
  return { text: text.trimEnd(), map };
}

function foldNeedle(s: string): string {
  return foldWithMap(s).text.trim();
}

export interface EvidenceLocation {
  startIndex: number;
  endIndex: number;
  exactQuote: string; // trecho real da transcrição
}

export interface CompositeQuoteCheck {
  isComposite: boolean;
  reason: "square_bracket_ellipsis" | "editorial_omission" | "none";
}

// Detecta apenas marcadores EDITORIAIS de costura entre passagens não contíguas
// ("[...]", "[…]", "[trecho omitido]"). Reticências naturais de fala ("...")
// NÃO invalidam a citação: o folding abaixo ignora pontuação, então uma citação
// com "..." só localiza se os fragmentos forem de fato contíguos na transcrição.
export function detectCompositeQuote(quote: string): CompositeQuoteCheck {
  if (/\[\s*(\.{2,}|…)\s*\]/.test(quote)) {
    return { isComposite: true, reason: "square_bracket_ellipsis" };
  }
  if (/\[[^\]]*(omitid|suprimid|cortad|trecho|continua)[^\]]*\]/i.test(quote)) {
    return { isComposite: true, reason: "editorial_omission" };
  }
  return { isComposite: false, reason: "none" };
}

export function locateEvidence(transcript: string, quote: string): EvidenceLocation | null {
  const needle = foldNeedle(quote);
  if (needle.length < 10) return null;
  const hay = foldWithMap(transcript);

  let pos = hay.text.indexOf(needle);
  if (pos === -1 && needle.length > 60) {
    // fallback: tenta um núcleo central da citação (a IA às vezes ajusta as bordas)
    const core = needle.slice(10, needle.length - 10);
    pos = hay.text.indexOf(core);
    if (pos !== -1) pos = Math.max(0, pos - 10);
  }
  if (pos === -1) return null;

  const startIndex = hay.map[pos];
  const endFold = Math.min(pos + needle.length - 1, hay.map.length - 1);
  const endIndex = hay.map[endFold] + 1;
  return {
    startIndex,
    endIndex,
    exactQuote: transcript.slice(startIndex, endIndex),
  };
}
