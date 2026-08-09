/**
 * Classificação de item em faixa e preço estimado.
 *
 * A regra que define o projeto: **item irrisório vale zero no teto.** Ele gira no bazar
 * (500 pessoas num domingo compram bugiganga barata), então é upside — mas não se paga
 * por ele. Contar 60 máscaras de gatinho a preço de varejo infla o teto e faz o operador
 * pagar caro por volume morto.
 *
 * A classificação automática por LLM é a Fase 2. Este módulo entrega a heurística que
 * roda sem IA e sem chave de API, para o pipeline funcionar de ponta a ponta desde já —
 * e é sempre sobrescrevível na mão, porque `faixa` e `precoOnline` vivem no item.
 */

import type { Faixa } from '../config.ts';

export interface ItemManifesto {
  descricao: string;
  quantidade: number;
  ref: string;
}

export interface ItemAvaliado extends ItemManifesto {
  faixa: Faixa;
  /** Preço online estimado por unidade. null = ainda não precificado. */
  precoOnline: number | null;
  fontePreco: 'heuristica' | 'llm' | 'manual';
}

/**
 * Descrições que denunciam item sem valor de revenda individual. Vieram do manifesto
 * real do lote 3, onde ~170 das 304 unidades são deste tipo.
 */
const MARCADORES_C = [
  'mascara de gatinho',
  'roupas diversas',
  'livros diversos',
  'diversos',
  'brinde',
  'amostra',
  'sucata',
  'retalho',
];

/** Termos genéricos: têm algum valor, mas só saem a preço de bazar. */
const MARCADORES_B = [
  'ultensilios',
  'utensilios',
  'potes diversos',
  'papelaria',
  'meia',
  'chinelo',
  'bijuteria',
  'caneta',
];

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Heurística de faixa. Deliberadamente conservadora: na dúvida joga em C, porque
 * superestimar valor infla o teto e faz pagar caro — o erro caro. Subestimar só faz
 * perder um lote, o erro barato.
 */
export function classificar(item: ItemManifesto, termosIgnorados: string[] = []): Faixa {
  const d = normalizar(item.descricao);
  if (!d || d.length < 3) return 'C';
  // Categoria com que o operador não trabalha: vale zero no teto, mesmo com preço.
  if (termosIgnorados.some((t) => d.includes(t))) return 'C';
  if (MARCADORES_C.some((m) => d.includes(m))) return 'C';
  if (MARCADORES_B.some((m) => d.includes(m))) return 'B';
  // Quantidade alta com descrição curta e sem marca é sinal de volume barato.
  if (item.quantidade >= 20 && d.split(' ').length <= 3) return 'C';
  return 'A';
}

/** Aplica a heurística sem precificar. Preço vem da Fase 2 ou da mão do operador. */
export function avaliarItens(itens: ItemManifesto[]): ItemAvaliado[] {
  return itens.map((i) => ({
    ...i,
    faixa: classificar(i),
    precoOnline: null,
    fontePreco: 'heuristica' as const,
  }));
}
