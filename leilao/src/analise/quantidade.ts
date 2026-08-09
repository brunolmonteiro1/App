/**
 * A quantidade real de peças de um lote só existe em texto livre no título.
 *
 * `quantityInLot` da API é sempre 1 nos 61 lotes — significa "1 lote", não a contagem de
 * peças. E o título usa seis formatos inconsistentes, incluindo um erro de digitação real.
 *
 * Regra que não se negocia: quando não há quantidade no título, devolve `null` para cair
 * no manifesto. **Nunca chutar** — três lotes deste evento não têm quantidade nenhuma, e
 * um número inventado no denominador do custo/unidade é pior que a ausência dele.
 */

export type FonteUnidades = 'titulo' | 'manifesto' | 'desconhecida';

export interface Unidades {
  valor: number | null;
  fonte: FonteUnidades;
  /** Qual formato casou. Útil para diagnosticar título novo que o regex não pega. */
  formato: string | null;
  /** true quando o título diz "aprox" — o número é estimativa do próprio vendedor. */
  aproximado: boolean;
}

/**
 * Formatos observados nos 61 títulos reais. A ordem importa: o mais específico primeiro.
 * `AROX` sem o P é typo real do lote 49 — está aqui de propósito.
 */
const PADROES: { nome: string; rx: RegExp }[] = [
  // "Qtde. 265", "Qtde Aprox. 74"
  { nome: 'qtde', rx: /Qtde\.?\s*(?:Aprox\.?)?\s*:?\s*(\d[\d.]*)/i },
  // "APROX. 142 UN", "APROX.: 431 PÇS", "APROX. 81 PC", "AROX. 44 UN"
  {
    nome: 'aprox+unidade',
    rx: /A(?:P)?ROX\.?\s*:?\s*(\d[\d.]*)\s*(?:UN|PÇS|PCS|PÇ|PC|UNID)/i,
  },
  // "(19 UN)", "(45 PÇS)", "(82 UN)" — sem "aprox" nenhum
  { nome: 'unidade-nua', rx: /\(\s*(\d[\d.]*)\s*(?:UN|PÇS|PCS|PÇ|PC|UNID)\b/i },
  // Último recurso: "APROX. 1000" sem unidade explícita
  { nome: 'aprox-solto', rx: /A(?:P)?ROX\.?\s*:?\s*(\d[\d.]*)/i },
];

export function daTitulo(titulo: string): Unidades {
  for (const { nome, rx } of PADROES) {
    const m = rx.exec(titulo);
    if (m) {
      const valor = Number((m[1] ?? '').replaceAll('.', ''));
      if (Number.isFinite(valor) && valor > 0) {
        return {
          valor,
          fonte: 'titulo',
          formato: nome,
          aproximado: /a(?:p)?rox/i.test(titulo),
        };
      }
    }
  }
  return { valor: null, fonte: 'desconhecida', formato: null, aproximado: false };
}

/**
 * Reconcilia título e manifesto. O manifesto ganha sempre que existe: é contagem
 * item a item, não estimativa. O título é só o que o anúncio promete.
 */
export function reconciliar(titulo: string, somaManifesto: number | null): Unidades {
  const doTitulo = daTitulo(titulo);
  if (somaManifesto && somaManifesto > 0) {
    return {
      valor: somaManifesto,
      fonte: 'manifesto',
      formato: doTitulo.formato,
      aproximado: false,
    };
  }
  return doTitulo;
}

/** Extrai a referência SB do título, que valida o pareamento com o PDF de anexo. */
export function refDoTitulo(titulo: string): string | null {
  return /\b(SB\d{5,})\b/i.exec(titulo)?.[1]?.toUpperCase() ?? null;
}
