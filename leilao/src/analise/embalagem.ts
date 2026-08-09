/**
 * O que é UM item, quando o manifesto mistura peça solta, kit fechado e caixa de diversos.
 *
 * A coluna "quantidade" do manifesto **não** significa unidades em 70 das linhas deste evento.
 * Em 30 dos 57 lotes existe linha com quantidade 1 cuja contagem real está escrita na descrição,
 * e são dois casos que exigem tratamento **oposto**:
 *
 * ```
 * qtd 1 · "APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS ALWAYSFIT, MAX HEYLLAIR…"
 *          → uma caixa fechada com ~256 peças baratas e não nomeadas
 *
 * qtd 1 · "Faqueiro Viena 30 Peças Wolff - Inox"
 *          → UM produto vendável, com um preço só. Não são 30 itens.
 * ```
 *
 * Contar o faqueiro como 30 é tão errado quanto contar a caixa de suplementos como 1. Sem a
 * distinção, o lote 42 saltaria de 304 para 5.556 "unidades" por causa de seis caixas de 5.000
 * grampos, e o custo por item viraria ficção — para baixo, que é o lado que faz pagar caro.
 *
 * ## Por que isto é o miolo da análise, e não um detalhe de parsing
 *
 * É a resposta exata para a pergunta do operador: *"dizem que tem quatrocentos itens, mas tem
 * trezentos, porque cem é um negócio muito barato"*. Os cem baratos são a caixa de diversos.
 *
 * E derruba uma leitura errada que eu havia publicado. Eu lia a divergência entre o título e a
 * soma do manifesto como inflação do anúncio. **Não é.** O lote 11 declara 283 itens; o manifesto
 * tem 27 itens nomeados mais uma caixa de 256 → 283, no ponto. O vendedor é preciso; a métrica
 * estava errada. O que o título esconde não é a contagem, é **quanto do lote vem sem nome**.
 */

import type { ItemManifesto } from './faixa.ts';

export type TipoLinha = 'unitario' | 'kit' | 'caixa-diversos';

/**
 * Contagem escrita na descrição: "APROXIMADAMENTE 256 ITENS", "30 Peças", "(100 unidades)".
 *
 * O `aproximadament\s*e` cobre a quebra de linha que o PDF injeta no meio da palavra —
 * "APROXIMADAMENT E 264 ITENS" aparece assim em vários manifestos deste evento.
 */
const RX_CONTAGEM_NO_TEXTO =
  /(?:aproximadament\s*e|aproximadamente|aprox\.?|cerca de)?\s*(\d{2,4})\s*(?:itens|item|pe[cç]as?|p[cç]s?|un(?:idades)?)\b/i;

/**
 * Marcadores de CAIXA DE DIVERSOS: o texto declara N peças sem dizer que produto são.
 * Vêm dos manifestos reais — "ITENS DIVERSOS (PAPELARIA/UTENSÍLIOS)", "ITENS LEVE SENDO
 * VESTUARIO / CALÇADO", "itens sendo (papelaria, vestuario, moveis)".
 */
const MARCADORES_CAIXA = [
  'diversos', 'diversas', 'divers ', 'diverso ',
  'sendo (', 'sendo(', 'sendo /', 'sendo vestuario', 'sendo movel',
  'itens leve', 'itens de cosmetic', 'itens sendo',
];

/**
 * Marcadores de KIT COMERCIAL: o produto **é** o conjunto e vale um preço só.
 * Também dos manifestos reais deste evento.
 */
const MARCADORES_KIT = [
  'jogo', 'kit', 'conjunto', 'aparelho de jantar', 'faqueiro', 'maleta', 'estojo',
  'material dourado', 'quebra cabeca', 'quebra-cabeca', 'pacote', 'caixa de',
  'rolo', ' rl ', 'fardo', 'blister', 'cartela', 'jg ',
];

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface LinhaEmbalada {
  tipo: TipoLinha;
  /** Quantas peças a linha representa para efeito de contagem de itens. */
  itens: number;
  /** Só em `caixa-diversos`: as peças que vêm sem nome dentro da caixa. */
  internos: number;
}

/**
 * Classifica uma linha do manifesto.
 *
 * A ordem das regras é a decisão de projeto:
 *
 * 1. Sem contagem no texto, ou contagem próxima da coluna, é linha comum.
 * 2. Caixa ganha de kit — "APROXIMADAMENTE 264 ITENS DIVERSOS (PAPELARIA…)" contém a palavra
 *    "caixa" em alguns casos, e continua sendo caixa de diversos.
 * 3. Kit conta **1**.
 * 4. Contagem grande sem marcador nenhum → trata como kit. **Default conservador de propósito**:
 *    inflar o divisor derruba o custo por item e levanta o teto, e teto alto é o erro que custa
 *    dinheiro. Subestimar só faz perder um lote.
 */
export function classificarLinha(descricao: string, quantidade: number): LinhaEmbalada {
  const d = normalizar(descricao);
  const m = RX_CONTAGEM_NO_TEXTO.exec(d);
  const noTexto = m ? Number(m[1]) : 0;

  // "3 × JOGO CANECAS 12 UN" não é linha embalada: a coluna já diz 3 jogos.
  if (!noTexto || noTexto <= quantidade * 3) {
    return { tipo: 'unitario', itens: quantidade, internos: 0 };
  }
  if (MARCADORES_CAIXA.some((t) => d.includes(t))) {
    return { tipo: 'caixa-diversos', itens: quantidade, internos: noTexto };
  }
  return { tipo: 'kit', itens: quantidade, internos: 0 };
}

export interface Composicao {
  /** Peças com nome, marca ou modelo — kit conta 1. É o que se sabe que está lá. */
  itensNomeados: number;
  /** Peças que vêm dentro de caixa de diversos, sem nome. */
  volumeEmCaixa: number;
  /** `itensNomeados + volumeEmCaixa`. Deve reconciliar com a contagem do título. */
  total: number;
  /** Fração do lote que é caixa fechada. Alto = risco de natureza diferente. */
  fracaoEmCaixa: number;
  linhasKit: number;
  caixas: { descricao: string; internos: number }[];
}

/** Composição do lote a partir das linhas do manifesto. */
export function compor(itens: ItemManifesto[]): Composicao {
  let nomeados = 0;
  let volume = 0;
  let linhasKit = 0;
  const caixas: { descricao: string; internos: number }[] = [];

  for (const i of itens) {
    const c = classificarLinha(i.descricao, i.quantidade);
    if (c.tipo === 'caixa-diversos') {
      // A caixa em si é uma linha do manifesto, e o conteúdo dela é o volume sem nome.
      volume += c.internos;
      caixas.push({ descricao: i.descricao, internos: c.internos });
      continue;
    }
    if (c.tipo === 'kit') linhasKit++;
    nomeados += c.itens;
  }

  const total = nomeados + volume;
  return {
    itensNomeados: nomeados,
    volumeEmCaixa: volume,
    total,
    fracaoEmCaixa: total > 0 ? volume / total : 0,
    linhasKit,
    caixas,
  };
}

/** Como a contagem do título se relaciona com o que o manifesto de fato lista. */
export type Reconciliacao =
  /** Título ≈ nomeados + conteúdo das caixas. O vendedor contou direito. */
  | 'confere'
  /** Título conta peças DENTRO de embalagem: 6 pacotes de 500 parafusos viram 3.000 itens. */
  | 'titulo-conta-pecas'
  /** Título conta MENOS do que o manifesto lista. Raro, e merece olhar. */
  | 'titulo-menor';

/**
 * Confere a composição contra a contagem do título.
 *
 * Confere em 45 dos 54 lotes deste evento — o vendedor conta o conteúdo das caixas de diversos, e
 * era a minha métrica antiga que estava errada ao ler isso como inflação.
 *
 * Nos 9 que não conferem, a diferença tem explicação e é **acionável**. O lote 41 declara 799
 * itens e o manifesto lista 291; a diferença vem de linhas como `6 × "500 PARAFUSO CHIPBOARD"` e
 * `17 × "PAPEL SULFITE A4 500 FOLHAS"` — o título conta parafuso por parafuso e folha por folha.
 * Isso **é** inflação do anúncio, de um tipo diferente da caixa de diversos, e muda o custo por
 * item por um fator de 2,7 neste lote. Vira `titulo-conta-pecas`, não erro.
 */
export function reconciliarComTitulo(
  c: Composicao,
  unidadesDoTitulo: number | null,
  tolerancia = 0.1,
): { tipo: Reconciliacao; diferenca: number; fator: number } | null {
  if (!unidadesDoTitulo || unidadesDoTitulo <= 0 || c.total === 0) return null;
  const diferenca = c.total - unidadesDoTitulo;
  const tipo: Reconciliacao =
    Math.abs(diferenca) <= unidadesDoTitulo * tolerancia
      ? 'confere'
      : diferenca < 0
        ? 'titulo-conta-pecas'
        : 'titulo-menor';
  // Quanto o custo por item muda ao usar a base honesta em vez da do título.
  return { tipo, diferenca, fator: unidadesDoTitulo / c.total };
}
