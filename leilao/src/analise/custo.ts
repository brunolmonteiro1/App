/**
 * Custo real de arrematar, e o teto de lance derivado dele.
 *
 * Fórmula verificada contra o diálogo "Confirmar lance" do BidTV (lote 5):
 *
 *     lance 3.460,00  →  encargos 596,00  →  total 4.056,00
 *     10% × 3.460 = 346   e   596 − 346 = 250
 *
 *     custo = lance × 1,10 + 250
 */

import type { Config, Encargos } from '../config.ts';

export interface Custo {
  lance: number;
  /** Percentual + taxa fixa. */
  encargos: number;
  frete: number;
  total: number;
  /** Sobrepreço efetivo sobre o martelo. A etiqueta do site diz "+10%" e mente. */
  overhead: number;
  /** false enquanto o frete não foi informado pelo operador. */
  completo: boolean;
}

export function calcularCusto(lance: number, cfg: Config): Custo {
  if (lance < 0) throw new RangeError(`lance negativo: ${lance}`);
  const encargos = lance * cfg.encargos.percentual + cfg.encargos.fixo;
  const frete = cfg.freteporLote;
  const total = lance + encargos + frete;
  return {
    lance,
    encargos,
    frete,
    total,
    // Com lance zero não existe sobrepreço proporcional a informar.
    overhead: lance > 0 ? total / lance - 1 : 0,
    completo: cfg.freteInformado,
  };
}

/**
 * Inverte o custo: dado quanto se pode gastar no total, qual o maior lance possível.
 *
 * A taxa fixa e o frete saem **antes** da divisão; o percentual **divide**, porque
 * incide sobre o martelo. Subtrair o percentual em vez de dividir autoriza lance acima
 * do que se pode pagar — é o erro clássico e está travado em teste.
 */
export function martelaDoTeto(tetoCusto: number, enc: Encargos, frete: number): number {
  const liquido = tetoCusto - enc.fixo - frete;
  if (liquido <= 0) return 0;
  return liquido / (1 + enc.percentual);
}

/**
 * O incremento é grosso (R$ 200 neste evento), então o teto não é uma linha contínua:
 * só existem lances de 200 em 200 a partir do lance atual. Esta função devolve o
 * **último lance válido que ainda cabe no teto**, ou null quando o próximo lance
 * possível já estoura.
 *
 * Exemplo do plano: lance 2.130, incremento 200, teto 2.666 → 2.530
 * (2.330 e 2.530 cabem; 2.730 estoura).
 */
export function ultimoLanceValido(
  lanceAtual: number,
  incremento: number,
  teto: number,
  temLances: boolean,
): number | null {
  if (incremento <= 0) throw new RangeError(`incremento inválido: ${incremento}`);

  // Sem lance nenhum, o próprio valor inicial é um lance válido — não se soma
  // incremento a um lote que ninguém pediu ainda.
  const primeiro = temLances ? lanceAtual + incremento : lanceAtual;
  if (primeiro > teto) return null;

  const passos = Math.floor((teto - primeiro) / incremento);
  return primeiro + passos * incremento;
}
