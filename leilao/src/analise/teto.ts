/**
 * O teto de lance — o produto final da ferramenta.
 *
 * Sai de trás para frente: do retorno exigido, não do valor do lote para frente.
 *
 *   valor_realizado = valor_online × fator_bazar × (1 − perda)
 *   teto_custo      = valor_realizado / multiplo
 *   teto_martelo    = (teto_custo − taxa_fixa − frete) / (1 + percentual)
 */

import { CONFIG_PADRAO, type Categoria, type Config } from '../config.ts';
import { calcularCusto, martelaDoTeto, ultimoLanceValido, type Custo } from './custo.ts';
import type { ItemAvaliado } from './faixa.ts';

export type Semaforo = 'verde' | 'amarelo' | 'vermelho' | 'sem-teto' | 'encerrado';

export interface Avaliacao {
  categoria: Categoria;
  multiplo: number;
  perda: number;

  /** Σ (qtd × preço) das faixas A e B. C não entra. */
  valorOnline: number;
  valorRealizadoMin: number;
  valorRealizadoMax: number;

  /** Teto conservador (fator 0,40): dá lance até aqui sem pensar. */
  tetoSeguro: number;
  /** Teto otimista (fator 0,60): entre os dois, só conhecendo a categoria. */
  tetoMaximo: number;

  /** Unidades que têm preço de verdade (faixas A + B). */
  unidadesEfetivas: number;
  /** Unidades da faixa C: giram no bazar, mas não pagamos por elas. */
  volumeBazar: number;

  /** Concentração de valor nos 5 maiores itens. Alta = risco. */
  concentracao: number;

  custoAtual: Custo;
  custoPorUnidadeEfetiva: number | null;
  custoPorUnidadeDeclarada: number | null;
  /** Margem do lance atual contra o valor realizado conservador. */
  margem: number | null;

  /** O número de ação: maior lance válido que ainda cabe no teto seguro. */
  lanceSugerido: number | null;
  semaforo: Semaforo;
}

export interface EntradaAvaliacao {
  itens: ItemAvaliado[];
  categoria: Categoria;
  lanceAtual: number;
  incremento: number;
  temLances: boolean;
  encerrado: boolean;
  unidadesDeclaradas: number | null;
}

export function avaliar(e: EntradaAvaliacao, cfg: Config = CONFIG_PADRAO): Avaliacao {
  const cat = cfg.categorias[e.categoria];
  const comPreco = e.itens.filter((i) => i.faixa !== 'C');

  const valorOnline = comPreco.reduce((s, i) => s + i.quantidade * (i.precoOnline ?? 0), 0);
  const unidadesEfetivas = comPreco.reduce((s, i) => s + i.quantidade, 0);
  const volumeBazar = e.itens
    .filter((i) => i.faixa === 'C')
    .reduce((s, i) => s + i.quantidade, 0);

  const base = valorOnline * (1 - cat.perda);
  const valorRealizadoMin = base * cfg.fatorBazar.conservador;
  const valorRealizadoMax = base * cfg.fatorBazar.otimista;

  const tetoSeguro = martelaDoTeto(
    valorRealizadoMin / cat.multiplo,
    cfg.encargos,
    cfg.freteporLote,
  );
  const tetoMaximo = martelaDoTeto(
    valorRealizadoMax / cat.multiplo,
    cfg.encargos,
    cfg.freteporLote,
  );

  // Concentração: quanto do valor está nos 5 maiores itens.
  const porItem = comPreco
    .map((i) => i.quantidade * (i.precoOnline ?? 0))
    .sort((a, b) => b - a);
  const top5 = porItem.slice(0, 5).reduce((s, v) => s + v, 0);

  const custoAtual = calcularCusto(e.lanceAtual, cfg);

  const temTeto = valorOnline > 0;
  const lanceSugerido = temTeto && !e.encerrado
    ? ultimoLanceValido(e.lanceAtual, e.incremento, tetoSeguro, e.temLances)
    : null;

  return {
    categoria: e.categoria,
    multiplo: cat.multiplo,
    perda: cat.perda,
    valorOnline,
    valorRealizadoMin,
    valorRealizadoMax,
    tetoSeguro,
    tetoMaximo,
    unidadesEfetivas,
    volumeBazar,
    concentracao: valorOnline > 0 ? top5 / valorOnline : 0,
    custoAtual,
    custoPorUnidadeEfetiva: unidadesEfetivas > 0 ? custoAtual.total / unidadesEfetivas : null,
    custoPorUnidadeDeclarada:
      e.unidadesDeclaradas && e.unidadesDeclaradas > 0
        ? custoAtual.total / e.unidadesDeclaradas
        : null,
    margem: temTeto && custoAtual.total > 0 ? valorRealizadoMin / custoAtual.total : null,
    lanceSugerido,
    semaforo: semaforoDe(e, tetoSeguro, tetoMaximo, temTeto),
  };
}

function semaforoDe(
  e: EntradaAvaliacao,
  tetoSeguro: number,
  tetoMaximo: number,
  temTeto: boolean,
): Semaforo {
  if (e.encerrado) return 'encerrado';
  if (!temTeto) return 'sem-teto';
  // O que decide é o próximo lance que ele teria de dar, não o lance atual: cobrir
  // significa pagar um degrau acima de quem está na frente.
  const proximo = e.temLances ? e.lanceAtual + e.incremento : e.lanceAtual;
  if (proximo <= tetoSeguro) return 'verde';
  if (proximo <= tetoMaximo) return 'amarelo';
  return 'vermelho';
}
