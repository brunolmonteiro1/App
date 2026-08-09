/**
 * Preço por item — o que transforma manifesto em teto.
 *
 * Três fontes possíveis, em ordem de confiança:
 *
 * 1. **`manual`** — o operador digitou. Ganha de tudo: ele conhece o giro do bazar dele.
 * 2. **`llm`** — estimativa automática (Fase 2, exige `ANTHROPIC_API_KEY`).
 * 3. **`heuristica`** — só classifica faixa, não precifica. É o estado inicial.
 *
 * Sem preço, `valorOnline` é zero e o lote entra no estudo **sem teto e com alerta**, nunca
 * com número inventado. Um teto fabricado viraria lance real — é o erro que não se paga.
 */

import { readFile } from 'node:fs/promises';
import type { Faixa } from '../config.ts';
import type { ItemAvaliado, ItemManifesto } from './faixa.ts';
import { classificar } from './faixa.ts';

/** Chave de casamento: descrição normalizada, para item repetido entre lotes valer uma vez. */
export function chave(descricao: string): string {
  return descricao
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface PrecoItem {
  /** Preço online por unidade, em reais. null = ainda não precificado. */
  preco: number | null;
  /** Sobrescreve a faixa da heurística quando o operador discorda. */
  faixa?: Faixa;
  nota?: string;
}

export type TabelaPrecos = Record<string, PrecoItem>;

export interface ArquivoPrecos {
  /** Marca a tabela como exemplo, o que faz o estudo exibir aviso vermelho. */
  exemplo?: boolean;
  fonte?: string;
  itens: TabelaPrecos;
}

export async function carregarPrecos(caminho: string): Promise<ArquivoPrecos> {
  const bruto = JSON.parse(await readFile(caminho, 'utf8')) as ArquivoPrecos;
  if (!bruto || typeof bruto !== 'object' || !bruto.itens) {
    throw new Error(`${caminho}: esperava { "itens": { ... } }`);
  }
  return bruto;
}

/** Aplica faixa (heurística ou override) e preço aos itens do manifesto. */
export function aplicar(
  itens: ItemManifesto[],
  tabela: TabelaPrecos = {},
  termosIgnorados: string[] = [],
): ItemAvaliado[] {
  return itens.map((i) => {
    const reg = tabela[chave(i.descricao)];
    const d = chave(i.descricao);
    // Termo ignorado ganha até de override manual: se o operador não trabalha com a
    // categoria, o item vale zero mesmo que alguém tenha posto preço e faixa A nele.
    const ignorado = termosIgnorados.some((t) => d.includes(chave(t)));
    const faixa: Faixa = ignorado ? 'C' : (reg?.faixa ?? classificar(i));
    // Item da faixa C vale zero no teto por decisão do operador, mesmo que tenha preço.
    const preco = faixa === 'C' ? null : (reg?.preco ?? null);
    return {
      ...i,
      faixa,
      precoOnline: preco,
      fontePreco: reg?.preco != null ? 'manual' : 'heuristica',
    };
  });
}

/**
 * Esqueleto para o operador preencher: uma entrada por descrição distinta, com a faixa que
 * a heurística sugeriu e preço em branco. Sem números inventados — ele preenche o que
 * conhece e deixa o resto nulo, e o lote fica sem teto até ter preço.
 */
export function esqueleto(itens: ItemManifesto[]): ArquivoPrecos {
  const tabela: TabelaPrecos = {};
  for (const i of itens) {
    const k = chave(i.descricao);
    if (!tabela[k]) {
      tabela[k] = { preco: null, faixa: classificar(i), nota: i.descricao };
    }
  }
  return {
    fonte: 'esqueleto gerado do manifesto — preencha "preco" com o valor online por unidade',
    itens: tabela,
  };
}

/**
 * Marcas vistas nos manifestos deste evento. Não é catálogo — é sinal de que a linha descreve
 * um produto concreto, e não "ITENS DIVERSOS".
 */
const MARCAS = [
  'bosch', 'britania', 'britânia', 'tramontina', 'mondial', 'oster', 'philco', 'brastemp',
  'spyderco', 'bessey', 'sata', 'vonder', 'raven', 'stanley', 'duracell', 'gillette',
  'pampers', 'huggies', 'tena', 'coza', 'lyor', 'kitchenaid', 'adidas', 'decathlon',
  'nivea', 'dove', 'loreal', 'elseve', 'tresemme', 'tresemmé', 'skala', 'johnsons',
  'nakazaki', 'nakasaki', 'wap', 'elgin', 'springer', 'redsilver', 'queens', 'solden',
  'havaianas', 'positiva', 'brilhante', 'vanish', 'downy', 'omo', 'veja',
];

/** Termos que denunciam linha genérica — descem o score. */
const GENERICOS = ['diversos', 'diversas', 'variados', 'variadas', 'outros', 'sortidos'];

/**
 * Classe de grandeza do preço unitário, de 1 (centavos) a 5 (centenas/milhares).
 *
 * **Não é preço** — é ordem de magnitude, e existe só para ordenar a lista. É o sinal que
 * mais importa no ranking: preço unitário varia de R$ 2 (copo descartável) a R$ 1.200
 * (martelete Bosch), três ordens de grandeza, enquanto quantidade varia de 1 a ~110. Sem
 * isso, quantidade domina e a lista enche de consumível barato — foi o que aconteceu na
 * primeira versão, que pôs copo descartável e vela acima de ferramenta elétrica.
 */
const CLASSES: { classe: number; termos: string[] }[] = [
  {
    classe: 5, // centenas a milhares
    termos: ['martelete', 'rompedor', 'esmerilhadeira', 'serra', 'furadeira', 'roçadeira',
      'rocadeira', 'notebook', 'quadriciclo', 'cama elastica', 'cama elástica', 'bicicleta',
      'amplificador', 'transformador', 'cooktop', 'micro-ondas', 'microondas', 'climatizador',
      'lavadora', 'compressor', 'gerador', 'violão', 'violao', 'drone', 'monitor',
      'cabeçote', 'cabecote', 'catalisador', 'poltrona', 'sofa', 'sofá', 'geladeira'],
  },
  {
    classe: 4, // ~R$ 100 a 400
    termos: ['air fryer', 'fritadeira', 'liquidificador', 'cafeteira', 'sanduicheira',
      'ventilador', 'bebedouro', 'depurador', 'secador', 'balança', 'balanca', 'alicate',
      'seladora', 'churrasqueira', 'tenda', 'gazebo', 'banheira', 'pneu', 'amortecedor',
      'bateria', 'jogo de panela', 'jogo de ferramentas', 'faca spyderco',
      'sapateira', 'prateleira', 'bancada', 'armario', 'armário', 'mochila', 'mala',
      'grampeador', 'soprador', 'trena', 'cadeira', 'colchao', 'colchão', 'patinete'],
  },
  {
    classe: 3, // ~R$ 30 a 100
    termos: ['travessa', 'panela', 'frigideira', 'garrafa', 'termica', 'térmica', 'bolsa',
      'tenis', 'tênis', 'calçado', 'calcado', 'bota', 'sandalia', 'sandália', 'havaianas',
      'calça', 'calca', 'blusa', 'camiseta', 'toalha', 'jogo de cama', 'lençol', 'lencol',
      'brinquedo', 'quebra cabeça', 'quebra cabeca', 'fralda', 'whey', 'creatina',
      'porta faca', 'ralador', 'abridor', 'tapete', 'vaso', 'pote de vidro', 'taça', 'taca'],
  },
  {
    classe: 1, // centavos a poucos reais — consumível
    termos: ['copo de plastico', 'copo de plástico', 'descartavel', 'descartável', 'guardanapo',
      'papel sulfite', 'papel report', 'sulfite', 'saco', 'sacola', 'vela', 'lamina',
      'lâmina', 'carregador', 'cabo', 'adesivo', 'caneta', 'lapis', 'lápis', 'borracha',
      'elastico', 'elástico', 'prendedor', 'mascara', 'máscara', 'chaveiro', 'ima', 'ímã',
      'balão', 'balao', 'pilha', 'grampo para', 'parafuso', 'arruela', 'bucha', 'fita'],
  },
];

/** Ordem de magnitude do preço unitário. 2 é o default: não reconhecido, nem barato nem caro. */
export function classeValor(descricao: string): number {
  const d = chave(descricao);
  for (const { classe, termos } of CLASSES) {
    if (termos.some((t) => d.includes(t))) return classe;
  }
  return 2;
}

/**
 * Quão concreta é a descrição, de 0,2 a ~3.
 *
 * É o que separa produto de bugiganga **sem precisar de preço** — e é por isso que o ranking
 * não pode ser só quantidade: um martelete Bosch (qtd 1) vale mais que 60 máscaras de
 * gatinho.
 */
export function especificidade(descricao: string): number {
  const d = chave(descricao);
  if (!d) return 0.2;
  let s = 1;

  if (MARCAS.some((m) => d.includes(m))) s *= 2.2;
  // Número de modelo: "gbh 2 24d", "aw 4800", "ehkxl24" — mistura de letra e dígito.
  if (/\b[a-z]+\d|\d+[a-z]\b/.test(d)) s *= 1.6;
  // Medida declarada: 820w, 5 5 litros, 25 pcs, 1000 pecas.
  if (/\b\d+\s*(w|v|ml|l|litros?|kg|g|cm|mm|m|pcs|pecas|un|und)\b/.test(d)) s *= 1.4;

  if (GENERICOS.some((g) => d.includes(g))) s *= 0.3;
  const palavras = d.split(' ').length;
  if (palavras <= 2) s *= 0.5;
  else if (palavras >= 5) s *= 1.3;

  return s;
}

export interface LinhaPrioritaria {
  chave: string;
  descricao: string;
  faixa: Faixa;
  /** Soma da quantidade desta descrição em todos os lotes. */
  unidadesTotais: number;
  /** Em quais lotes ela aparece. Precificar uma linha aqui destrava vários tetos. */
  lotes: number[];
  impacto: number;
}

/**
 * Consolida os manifestos de todos os lotes numa lista **ordenada por impacto**, para o
 * operador precificar as primeiras ~150 linhas e já ter teto útil na maioria dos lotes.
 *
 *     impacto = unidadesTotais × especificidade × alcance
 *
 * `alcance` (nº de lotes onde a descrição aparece) entra porque precificar uma linha que
 * aparece em 10 lotes destrava valor em 10 tetos de uma vez.
 *
 * Itens da faixa C entram no fim: valem zero no teto por decisão do operador, então
 * precificá-los não muda nada — mas ficam listados para ele poder discordar da classificação.
 */
export function priorizar(porLote: Map<number, ItemManifesto[]>): LinhaPrioritaria[] {
  const acc = new Map<string, LinhaPrioritaria>();

  for (const [numeroLote, itens] of porLote) {
    for (const item of itens) {
      const k = chave(item.descricao);
      if (!k) continue;
      let linha = acc.get(k);
      if (!linha) {
        linha = {
          chave: k,
          descricao: item.descricao,
          faixa: classificar(item),
          unidadesTotais: 0,
          lotes: [],
          impacto: 0,
        };
        acc.set(k, linha);
      }
      linha.unidadesTotais += item.quantidade;
      if (!linha.lotes.includes(numeroLote)) linha.lotes.push(numeroLote);
    }
  }

  const linhas = [...acc.values()];
  for (const l of linhas) {
    l.lotes.sort((a, b) => a - b);
    // A classe de valor domina, porque preço unitário varia três ordens de grandeza e
    // quantidade só uma. Quantidade entra com retorno decrescente: 100 unidades de copo
    // descartável não superam um martelete.
    const magnitude = Math.pow(4, classeValor(l.descricao));
    const volume = Math.pow(l.unidadesTotais, 0.55);
    const alcance = Math.sqrt(l.lotes.length);
    const base = magnitude * volume * especificidade(l.descricao) * alcance;
    // Faixa C não move teto nenhum; fica no fim da lista sem sair dela.
    l.impacto = l.faixa === 'C' ? base * 0.001 : base;
  }

  // Ordem estável: impacto, depois chave, para reabrir o arquivo e continuar de onde parou.
  return linhas.sort((a, b) => b.impacto - a.impacto || a.chave.localeCompare(b.chave));
}

/** Converte a lista priorizada num arquivo de preços com tudo `null`. */
export function esqueletoPriorizado(linhas: LinhaPrioritaria[]): ArquivoPrecos {
  const tabela: TabelaPrecos = {};
  for (const l of linhas) {
    tabela[l.chave] = {
      preco: null,
      faixa: l.faixa,
      nota: `${l.descricao} · ${l.unidadesTotais} un · lotes ${l.lotes.join(',')}`,
    };
  }
  return {
    fonte:
      'ordenado por impacto (unidades × especificidade × nº de lotes). Preencha "preco" com o ' +
      'valor online por unidade, de cima para baixo — as primeiras linhas são as que mais ' +
      'movem o teto. Deixe null o que não souber.',
    itens: tabela,
  };
}

/** Quantos itens (e quanto do volume) ainda estão sem preço. */
export function cobertura(itens: ItemAvaliado[]): {
  precificados: number;
  pendentes: number;
  unidadesSemPreco: number;
} {
  const relevantes = itens.filter((i) => i.faixa !== 'C');
  const semPreco = relevantes.filter((i) => i.precoOnline == null);
  return {
    precificados: relevantes.length - semPreco.length,
    pendentes: semPreco.length,
    unidadesSemPreco: semPreco.reduce((s, i) => s + i.quantidade, 0),
  };
}
