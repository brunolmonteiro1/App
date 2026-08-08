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
export function aplicar(itens: ItemManifesto[], tabela: TabelaPrecos = {}): ItemAvaliado[] {
  return itens.map((i) => {
    const reg = tabela[chave(i.descricao)];
    const faixa: Faixa = reg?.faixa ?? classificar(i);
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
