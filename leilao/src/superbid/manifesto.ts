/**
 * Parser do manifesto item a item — o PDF de anexo do lote.
 *
 * Duas armadilhas já pagas no reconhecimento e travadas em teste:
 *
 * 1. **Nunca usar regex lazy global com dotAll** do tipo
 *    `(.*?)(\d+)\s+(SB\d+)\s+Somente...` sobre o texto inteiro. Causa backtracking
 *    catastrófico e travou o processo (morto por timeout). O certo é **dividir primeiro**
 *    pelo delimitador e só então aplicar regex ancorada em cada pedaço.
 * 2. Depois do split a descrição vem contaminada com o boilerplate da tabela. Exige lista
 *    explícita de fragmentos a remover, senão a descrição fica inútil para precificar.
 */

import { textoCompleto } from './pdf.ts';
import type { ItemManifesto } from '../analise/faixa.ts';

/** Frase que encerra cada linha da tabela. É o delimitador de registro. */
const DELIMITADOR = 'Somente os itens citados';

/** Fragmentos do boilerplate que sobram na descrição depois do split. */
const RUIDO = [
  'na descrição fazem parte do lote',
  '(Fotos meramente ilustrativas)',
  'Detalhes produtos',
  'Descrição Quantidade Referência Observações Vencimento Desmontado Incompleto Marca Frases Padrões',
];

const RX_CABECALHO = /Condição do bem.*?informado/gs;
const RX_TESTADOS = /Itens não testados.*?componentes/gs;
/** Ancorada no FIM do registro: "<descrição> <quantidade> <referência>". */
const RX_QTD_REF = /(\d+)\s+(SB\d+)\s*$/;

export interface Manifesto {
  itens: ItemManifesto[];
  /** Referências encontradas. Deve ser exatamente uma, e igual à do lote. */
  refs: string[];
  somaQuantidades: number;
  paginas: number;
  /**
   * Condição declarada por item. No lote 3 é sempre "não informado" — o vendedor não
   * declara estado de nada, e as colunas Vencimento/Desmontado/Incompleto vêm vazias.
   */
  condicaoDeclarada: string | null;
}

/** Extrai os itens do texto já lido do PDF. Separado para testar sem tocar disco. */
export function parsearTexto(corpo: string, paginas = 0): Manifesto {
  const pedacos = corpo.split(DELIMITADOR);
  // O último pedaço vem depois do delimitador final e não é um registro.
  const registros = pedacos.slice(0, -1);

  const itens: ItemManifesto[] = [];
  for (let pedaco of registros) {
    pedaco = pedaco.replace(RX_CABECALHO, '').replace(RX_TESTADOS, '');
    pedaco = pedaco.replaceAll('<br>', ' ');
    for (const r of RUIDO) pedaco = pedaco.replaceAll(r, '');
    pedaco = pedaco.replace(/\s+/g, ' ').trim();

    const m = RX_QTD_REF.exec(pedaco);
    if (!m) continue;
    const descricao = pedaco.slice(0, m.index).replace(/^[\s.\-]+|[\s.\-]+$/g, '');
    itens.push({ descricao, quantidade: Number(m[1]), ref: m[2] ?? '' });
  }

  return {
    itens,
    refs: [...new Set(itens.map((i) => i.ref))],
    somaQuantidades: itens.reduce((s, i) => s + i.quantidade, 0),
    paginas,
    condicaoDeclarada: /Condição do bem não informado/.test(corpo) ? 'não informado' : null,
  };
}

export async function lerManifesto(caminho: string): Promise<Manifesto> {
  const corpo = await textoCompleto(caminho);
  return parsearTexto(corpo);
}

/**
 * Confere se o manifesto pertence ao lote e se a contagem fecha com o anúncio.
 * Divergência é **alerta no estudo**, nunca exceção silenciosa — o operador precisa
 * saber que o número não bate, não receber um erro no lugar do lote.
 */
export function conferir(
  m: Manifesto,
  refDoLote: string | null,
  unidadesDeclaradas: number | null,
  /**
   * Total da composição (itens nomeados + conteúdo das caixas de diversos), quando conhecido.
   *
   * Existe porque comparar o título com a soma da COLUNA quantidade produzia alerta falso em 30
   * lotes: uma linha com quantidade 1 e descrição "APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS"
   * vale 256 na contagem do vendedor. Quem sabe disso é `analise/embalagem.ts`; aqui só se
   * compara contra o número certo, e a divergência que sobra é real.
   */
  totalDaComposicao: number | null = null,
): string[] {
  const alertas: string[] = [];
  if (m.itens.length === 0) alertas.push('manifesto sem itens legíveis');
  if (m.refs.length > 1) alertas.push(`manifesto mistura referências: ${m.refs.join(', ')}`);
  if (refDoLote && m.refs.length && !m.refs.includes(refDoLote)) {
    alertas.push(`manifesto é do lote ${m.refs[0]}, não de ${refDoLote}`);
  }
  // Sem a composição, cai na soma da coluna — e aí a tolerância é maior, porque a comparação é
  // sabidamente grosseira. Com a composição, quem alerta sobre divergência é `montar.ts`.
  if (unidadesDeclaradas && totalDaComposicao === null && m.somaQuantidades !== unidadesDeclaradas) {
    const dif = m.somaQuantidades - unidadesDeclaradas;
    alertas.push(
      `título declara ${unidadesDeclaradas} un, manifesto soma ${m.somaQuantidades} (${dif > 0 ? '+' : ''}${dif})`,
    );
  }
  return alertas;
}
