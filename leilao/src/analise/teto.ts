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

/**
 * `sem-cobertura` é distinto de `vermelho` de propósito. Vermelho significa "lote caro, para";
 * sem-cobertura significa "não sei ainda". Dar a mesma cor aos dois faria o operador descartar
 * lote bom achando que é lote caro — foi exatamente o que aconteceu quando a cobertura era 3%.
 */
export type Semaforo =
  | 'verde'
  | 'amarelo'
  | 'vermelho'
  | 'sem-teto'
  | 'sem-cobertura'
  | 'ignorado'
  | 'encerrado';

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

  /** Fração das unidades efetivas que tem preço. */
  cobertura: number;
  /**
   * Fração das LINHAS relevantes que tem preço. Precisa ser checada junto com `cobertura`:
   * um lote pode ter 68% das unidades precificadas por causa de uma única linha de item
   * barato e alto volume, enquanto o item caro — que é o valor do lote — fica sem preço.
   * Foi o caso do lote 202: 48 rodas de patinete passavam o gate e o climatizador Springer
   * contava zero, produzindo "teto R$ 0 · PARE" num lote que ninguém avaliou.
   */
  coberturaLinhas: number;
  /** Unidades efetivas ainda sem preço — o que falta precificar neste lote. */
  unidadesSemPreco: number;

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
  /** Lote de categoria que o operador não trabalha. */
  ignorado?: boolean;
}

export function avaliar(e: EntradaAvaliacao, cfg: Config = CONFIG_PADRAO): Avaliacao {
  const cat = cfg.categorias[e.categoria];
  const comPreco = e.itens.filter((i) => i.faixa !== 'C');

  // Faixa B entra com peso menor: "só sai a preço baixo de bazar".
  const peso = (f: string) => (f === 'B' ? cfg.fatorB : 1);
  const valorOnline = comPreco.reduce(
    (s, i) => s + i.quantidade * (i.precoOnline ?? 0) * peso(i.faixa),
    0,
  );
  const unidadesEfetivas = comPreco.reduce((s, i) => s + i.quantidade, 0);

  // Cobertura é medida em UNIDADES, não em linhas: precificar um item de 96 unidades vale
  // muito mais que precificar 96 itens de 1 unidade.
  const unidadesComPreco = comPreco
    .filter((i) => i.precoOnline != null)
    .reduce((s, i) => s + i.quantidade, 0);
  const cobertura = unidadesEfetivas > 0 ? unidadesComPreco / unidadesEfetivas : 0;

  const linhasComPreco = comPreco.filter((i) => i.precoOnline != null).length;
  const coberturaLinhas = comPreco.length > 0 ? linhasComPreco / comPreco.length : 0;

  // AS DUAS têm de passar. Só unidades deixa escapar o lote onde uma linha de item barato e
  // alto volume cobre o gate enquanto o item caro fica sem preço.
  const coberturaOk =
    cobertura >= cfg.coberturaMinima && coberturaLinhas >= cfg.coberturaMinimaLinhas;
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
    .map((i) => i.quantidade * (i.precoOnline ?? 0) * peso(i.faixa))
    .sort((a, b) => b - a);
  const top5 = porItem.slice(0, 5).reduce((s, v) => s + v, 0);

  const custoAtual = calcularCusto(e.lanceAtual, cfg);

  // Sem cobertura suficiente o teto existe internamente mas NÃO é oferecido como decisão.
  const temTeto = valorOnline > 0 && coberturaOk && !e.ignorado;
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
    cobertura,
    coberturaLinhas,
    unidadesSemPreco: unidadesEfetivas - unidadesComPreco,
    custoAtual,
    custoPorUnidadeEfetiva: unidadesEfetivas > 0 ? custoAtual.total / unidadesEfetivas : null,
    custoPorUnidadeDeclarada:
      e.unidadesDeclaradas && e.unidadesDeclaradas > 0
        ? custoAtual.total / e.unidadesDeclaradas
        : null,
    margem: temTeto && custoAtual.total > 0 ? valorRealizadoMin / custoAtual.total : null,
    lanceSugerido,
    semaforo: semaforoDe(e, tetoSeguro, tetoMaximo, valorOnline > 0, coberturaOk),
  };
}

function semaforoDe(
  e: EntradaAvaliacao,
  tetoSeguro: number,
  tetoMaximo: number,
  temValor: boolean,
  coberturaOk: boolean,
): Semaforo {
  if (e.encerrado) return 'encerrado';
  // Categoria que o operador não trabalha: decisão dele, não falta de dado.
  if (e.ignorado) return 'ignorado';
  if (!temValor) return 'sem-teto';
  if (!coberturaOk) return 'sem-cobertura';
  // O que decide é o próximo lance que ele teria de dar, não o lance atual: cobrir
  // significa pagar um degrau acima de quem está na frente.
  const proximo = e.temLances ? e.lanceAtual + e.incremento : e.lanceAtual;
  if (proximo <= tetoSeguro) return 'verde';
  if (proximo <= tetoMaximo) return 'amarelo';
  return 'vermelho';
}
