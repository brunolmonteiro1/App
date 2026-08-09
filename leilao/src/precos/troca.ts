/**
 * Ida e volta com outra IA: exporta os itens a precificar, importa o arquivo preenchido.
 *
 * O motivo é o volume. Este evento tem 2.347 linhas de item e ~1.900 descrições distintas.
 * Pesquisar preço de cada uma na mão é o que mantinha a cobertura em 3% — e sem cobertura não
 * existe teto. Então o caminho é: baixar o JSON, dar para um modelo pesquisar e preencher,
 * subir de volta.
 *
 * ## O que é frágil aqui, e como é tratado
 *
 * Arquivo que sai daqui, passa por um chat e volta **não volta igual**. Os modos de falha são
 * conhecidos e todos tratados na importação:
 *
 * | O que o modelo faz | Tratamento |
 * |---|---|
 * | envolve em ```json … ``` | as cercas são removidas antes do parse |
 * | devolve só o array, sem o envelope | aceito |
 * | devolve `{ "itens": { chave: {...} } }` (formato do precos.json) | aceito |
 * | escreve `"R$ 1.299,90"` em vez de `1299.90` | normalizado, incluindo separador de milhar |
 * | reescreve ou traduz a `chave` | casamento reserva pela descrição do item |
 * | reordena, remove ou duplica linhas | irrelevante: o casamento é por chave, não por posição |
 * | inventa item que não existe no manifesto | rejeitado e relatado, não gravado |
 * | devolve preço absurdo (R$ 250.000 numa caneca) | aceito mas SINALIZADO na resposta |
 *
 * O que **não** é tratado, de propósito: preço errado mas plausível. Isso é chute informado de
 * modelo, não cotação — e é por isso que a tela mostra a origem de cada preço e o teto sai
 * como faixa, não como número único.
 */

import type { Faixa } from '../config.ts';
import { chave } from '../analise/valor.ts';
import type { LinhaPrioritaria } from '../analise/valor.ts';
import type { EntradaPreco } from './arquivo.ts';

export interface ItemTroca {
  /** NÃO alterar: é o que liga a linha de volta ao manifesto. */
  chave: string;
  item: string;
  unidades: number;
  lotes: number[];
  faixa: Faixa;
  /** É o que o modelo preenche. */
  preco: number | null;
}

export interface ArquivoTroca {
  instrucoes: string;
  regras: Record<string, string>;
  evento: number;
  escopo: string;
  itens: ItemTroca[];
}

/**
 * O prompt vai DENTRO do arquivo, no primeiro campo.
 *
 * Assim o operador não precisa guardar instrução em lugar nenhum: ele anexa o arquivo no chat,
 * escreve "faça o que está em instrucoes" e pronto. Se o prompt vivesse só na documentação,
 * seria a parte que se perde entre um leilão e o próximo.
 */
export const INSTRUCOES = [
  'Preencha o campo "preco" de cada item deste arquivo com o PREÇO ONLINE POR UNIDADE, em reais,',
  'do produto NOVO, à venda hoje no Brasil (nível de Mercado Livre, Amazon BR, Magazine Luiza).',
  '',
  'REGRAS, todas obrigatórias:',
  '1. Devolva o MESMO JSON, com a mesma estrutura. Só o "preco" e, se discordar, a "faixa" mudam.',
  '2. NÃO altere o campo "chave" de jeito nenhum — é ele que liga a linha ao lote. Nem traduzir,',
  '   nem corrigir, nem reordenar palavras.',
  '3. "preco" é NÚMERO, ponto como decimal, sem "R$" e sem separador de milhar: 1299.90',
  '4. É preço por UMA unidade. Se a descrição já é um conjunto ("JOGO DE 6 TAÇAS"), o preço é do',
  '   conjunto inteiro, porque a quantidade do manifesto conta conjuntos.',
  '5. Não souber, ou descrição genérica demais ("ITENS DIVERSOS")? Deixe null. Null é resposta',
  '   correta e esperada — chute alto faz o comprador pagar caro, o que é o erro que não se paga.',
  '6. Na dúvida entre dois valores, use o MENOR.',
  '7. Não considere estado de conservação, avaria ou falta de peça: isso é tratado fora deste',
  '   arquivo. Aqui é o preço do produto novo.',
  '8. Responda SÓ o JSON. Sem texto antes, sem texto depois, sem cercas de markdown.',
  '',
  'FAIXA — mude só se discordar da classificação:',
  '  "A" = vale vender com preço próprio (eletro, ferramenta, marca reconhecível, cristal)',
  '  "B" = só sai a preço baixo de bazar (genérico, usado, meia, chinelo, papelaria)',
  '  "C" = irrisório, sem preço individual (brinde, amostra, retalho, bugiganga). Vale ZERO no',
  '        cálculo, então nem precisa de preço.',
].join('\n');

export const REGRAS: Record<string, string> = {
  preco: 'número em reais, por unidade, produto novo, ponto decimal. null se não souber.',
  chave: 'NÃO ALTERAR — liga a linha ao lote de origem.',
  faixa: 'A = preço próprio · B = preço baixo de bazar · C = irrisório, vale zero',
  unidades: 'quantas unidades existem no total (só informativo, não multiplique o preço por isso)',
  lotes: 'em quais lotes esta descrição aparece (só informativo)',
};

/** Monta o arquivo para download, na ordem de impacto — o modelo acerta o que importa primeiro. */
export function exportar(
  linhas: LinhaPrioritaria[],
  opcoes: { evento: number; escopo: string; precoAtual?: (chave: string) => number | null },
): ArquivoTroca {
  return {
    instrucoes: INSTRUCOES,
    regras: REGRAS,
    evento: opcoes.evento,
    escopo: opcoes.escopo,
    itens: linhas.map((l) => ({
      chave: l.chave,
      item: l.descricao,
      unidades: l.unidadesTotais,
      lotes: l.lotes,
      faixa: l.faixa,
      // Preço já conhecido vai preenchido: o modelo não repesquisa o que ele já resolveu, e
      // o operador vê que a tabela é cumulativa entre eventos.
      preco: opcoes.precoAtual?.(l.chave) ?? null,
    })),
  };
}

const FAIXAS = new Set<string>(['A', 'B', 'C']);

/** Um valor acima disto é quase certamente erro de unidade ou alucinação — vale avisar. */
const SUSPEITO_ACIMA_DE = 50_000;

export interface ResultadoImportacao {
  /** Pronto para `mesclar()`: chave real do manifesto → preço/faixa. */
  entrada: Record<string, EntradaPreco>;
  /** Casou pela `chave`, como esperado. */
  porChave: number;
  /** A chave veio alterada e o casamento foi pela descrição — funcionou, mas vale saber. */
  porDescricao: number;
  /** Linhas que não existem em nenhum manifesto deste evento. */
  desconhecidos: string[];
  /** Linhas com preço que o parser não entendeu. */
  invalidos: string[];
  /** Preço aceito, mas alto o bastante para merecer conferência. */
  suspeitos: { item: string; preco: number }[];
  /** Linhas que voltaram com preço nulo — o modelo não soube, e isso é legítimo. */
  semPreco: number;
}

/** Remove cerca de markdown e qualquer prosa em volta do JSON. */
function limpar(texto: string): string {
  let t = texto.trim();
  // ```json … ```  ou  ``` … ```
  const cerca = /^```[a-z]*\s*([\s\S]*?)\s*```$/i.exec(t);
  if (cerca) t = cerca[1]!.trim();
  // Prosa antes/depois: corta do primeiro { ou [ até o último } ou ] correspondente.
  const iniObj = t.indexOf('{');
  const iniArr = t.indexOf('[');
  const ini = iniArr > -1 && (iniObj === -1 || iniArr < iniObj) ? iniArr : iniObj;
  if (ini > 0) {
    const fim = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (fim > ini) t = t.slice(ini, fim + 1);
  }
  return t;
}

/**
 * `"R$ 1.299,90"` → `1299.9`.
 *
 * A ordem importa: em pt-BR o ponto é milhar e a vírgula é decimal, mas o modelo pode devolver
 * no padrão americano. Havendo vírgula, ela é o decimal e os pontos são milhar; sem vírgula, o
 * ponto é o decimal — exceto quando é claramente milhar (`1.299` sem casas depois de 3 dígitos).
 */
export function numeroBR(bruto: unknown): number | null {
  if (typeof bruto === 'number') return Number.isFinite(bruto) && bruto >= 0 ? bruto : null;
  if (typeof bruto !== 'string') return null;
  let t = bruto.replace(/r\$/i, '').replace(/\s| /g, '').trim();
  if (!t || /^(null|nulo|n\/a|na|-|—|\?)$/i.test(t)) return null;

  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else {
    // "1.299" com exatamente 3 dígitos depois do ponto e nenhum outro ponto: milhar.
    if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Lê o arquivo que voltou do chat e devolve o que dá para gravar, mais o relatório do resto.
 *
 * `chavesConhecidas` mapeia descrição normalizada → chave real do manifesto. É o que permite
 * recuperar a linha quando o modelo mexeu na `chave` mas manteve a descrição.
 */
export function importar(
  texto: string,
  chavesConhecidas: Set<string>,
): ResultadoImportacao {
  const r: ResultadoImportacao = {
    entrada: {},
    porChave: 0,
    porDescricao: 0,
    desconhecidos: [],
    invalidos: [],
    suspeitos: [],
    semPreco: 0,
  };

  let dados: unknown;
  try {
    dados = JSON.parse(limpar(texto));
  } catch (e) {
    throw new Error(
      `não consegui ler o arquivo como JSON (${(e as Error).message}). ` +
        'Se o chat respondeu com texto em volta do JSON, apague o texto e deixe só o JSON.',
    );
  }

  // Três formatos aceitos: array puro, { itens: [...] } e { itens: { chave: {...} } }.
  let lista: unknown[];
  const env = dados as { itens?: unknown };
  if (Array.isArray(dados)) lista = dados;
  else if (Array.isArray(env?.itens)) lista = env.itens;
  else if (env?.itens && typeof env.itens === 'object') {
    lista = Object.entries(env.itens as Record<string, unknown>).map(([k, v]) => ({
      chave: k,
      ...(v as object),
    }));
  } else {
    throw new Error('esperava uma lista de itens, ou { "itens": [...] }, ou { "itens": { ... } }');
  }

  for (const bruto of lista) {
    if (!bruto || typeof bruto !== 'object') continue;
    const it = bruto as Record<string, unknown>;
    const descricao = String(it.item ?? it.descricao ?? it.nota ?? '');
    const rotulo = descricao || String(it.chave ?? '(sem descrição)');

    // Casa pela chave; se ela veio mexida, tenta pela descrição normalizada.
    let alvo: string | null = null;
    const candidatoChave = typeof it.chave === 'string' ? it.chave : '';
    if (candidatoChave && chavesConhecidas.has(candidatoChave)) {
      alvo = candidatoChave;
      r.porChave++;
    } else {
      const porDesc = chave(descricao || candidatoChave);
      if (porDesc && chavesConhecidas.has(porDesc)) {
        alvo = porDesc;
        r.porDescricao++;
      }
    }

    if (!alvo) {
      r.desconhecidos.push(rotulo.slice(0, 70));
      continue;
    }

    const temPreco = 'preco' in it || 'preço' in it || 'price' in it;
    const cru = it.preco ?? it['preço'] ?? it.price ?? null;
    const preco = cru === null || cru === undefined || cru === '' ? null : numeroBR(cru);
    if (temPreco && cru !== null && cru !== undefined && cru !== '' && preco === null) {
      r.invalidos.push(`${rotulo.slice(0, 50)}: ${String(cru).slice(0, 20)}`);
      continue;
    }
    if (preco === null) r.semPreco++;
    if (preco !== null && preco > SUSPEITO_ACIMA_DE) {
      r.suspeitos.push({ item: rotulo.slice(0, 60), preco });
    }

    const faixa = typeof it.faixa === 'string' ? it.faixa.trim().toUpperCase() : '';
    r.entrada[alvo] = {
      preco,
      ...(FAIXAS.has(faixa) ? { faixa } : {}),
    };
  }

  return r;
}
