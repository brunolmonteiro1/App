/**
 * Custo real de arrematar, e o teto de lance derivado dele.
 *
 * Composição verificada contra o Edital e o estimador do site:
 *
 *     Leiloeiro                 5%
 *     SOLD (Buyer's Premium)    5%
 *     Encargos Adm + Fee        tabela por faixa de LANCE (ver config.ts)
 *
 *     custo = lance × 1,10 + faixaEncargo(lance) + frete
 *
 * Dois pontos reais, ambos no centavo:
 *     lance 3.010 → encargos 551,00 → total 3.561,00
 *     lance 3.460 → encargos 596,00 → total 4.056,00
 */

import type { Config, Encargos } from '../config.ts';

export interface Custo {
  lance: number;
  /** Leiloeiro (5%). */
  leiloeiro: number;
  /** SOLD Buyer's Premium (5%). */
  premium: number;
  /** Encargos de Administração (parte da faixa). */
  encargosAdm: number;
  /** Fee Plataforma (resto da faixa). */
  feePlataforma: number;
  /** Valor da faixa: encargosAdm + feePlataforma. */
  faixaEncargo: number;
  /** Subtotal de encargos e comissões, como o site exibe. */
  encargos: number;
  frete: number;
  total: number;
  /**
   * Sobrepreço efetivo sobre o martelo. **Não é 10%** e **não é monotônico** — a tabela
   * faz o overhead cair dentro de uma faixa e saltar ao entrar na próxima.
   */
  overhead: number;
  /** false enquanto o frete não foi informado pelo operador. */
  completo: boolean;
}

/** Valor da faixa de Encargos Adm + Fee Plataforma para um lance. */
export function faixaEncargo(lance: number, enc: Encargos): number {
  for (const f of enc.faixas) {
    if (lance <= f.ate) return f.valor;
  }
  // Só acontece se a última faixa não for Infinity; devolver a maior é o mais seguro.
  return enc.faixas.at(-1)?.valor ?? 0;
}

export function calcularCusto(lance: number, cfg: Config): Custo {
  if (lance < 0) throw new RangeError(`lance negativo: ${lance}`);
  const enc = cfg.encargos;

  // Metade do percentual é comissão do leiloeiro, metade é buyer's premium — é assim que
  // o estimador do site abre, e é o que o operador vê na nota.
  const leiloeiro = lance * (enc.percentual / 2);
  const premium = lance * (enc.percentual / 2);
  const daFaixa = faixaEncargo(lance, enc);
  const encargosAdm = daFaixa * enc.divisao.encargosAdm;
  const feePlataforma = daFaixa * enc.divisao.feePlataforma;

  const encargos = leiloeiro + premium + daFaixa;
  const frete = cfg.freteporLote;
  const total = lance + encargos + frete;

  return {
    lance,
    leiloeiro,
    premium,
    encargosAdm,
    feePlataforma,
    faixaEncargo: daFaixa,
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
 * Duas armadilhas, as duas travadas em teste:
 *
 * 1. O percentual incide sobre o martelo, então **divide**, não subtrai. Subtrair autoriza
 *    lance acima do que se pode pagar.
 * 2. O encargo da faixa depende do lance — que é justamente a incógnita. Por isso não existe
 *    fórmula fechada: resolve-se **por faixa**. Para cada faixa, calcula o candidato com o
 *    valor daquela faixa, limita ao teto da faixa, e aceita se o custo desse candidato
 *    couber no orçamento. O maior candidato válido é a resposta.
 */
export function martelaDoTeto(tetoCusto: number, enc: Encargos, frete: number): number {
  let melhor = 0;
  let piso = 0;

  for (const f of enc.faixas) {
    const candidato = (tetoCusto - f.valor - frete) / (1 + enc.percentual);
    // O candidato só vale dentro da própria faixa; acima do teto dela, o encargo já seria
    // outro, então limita — e aí quem decide é a faixa seguinte.
    const limitado = Math.min(candidato, f.ate);
    if (limitado >= piso && limitado > melhor) {
      // Confere de fato: com a tabela, calcular e voltar é mais confiável que confiar na
      // álgebra em cima de uma função em degraus.
      const custo = limitado * (1 + enc.percentual) + faixaEncargo(limitado, enc) + frete;
      if (custo <= tetoCusto + 1e-9) melhor = limitado;
    }
    piso = f.ate;
  }

  return melhor > 0 ? melhor : 0;
}

/**
 * O degrau da tabela mais próximo acima do lance atual.
 *
 * Cruzar a fronteira de faixa custa caro por um centavo: de R$ 4.999,99 para R$ 5.000,00 o
 * custo salta R$ 250. Parar no topo da faixa de baixo às vezes vale mais que cobrir, e o
 * estudo avisa quando o próximo lance atravessa um desses.
 */
export function degrauProximo(
  lance: number,
  enc: Encargos,
): { limite: number; salto: number } | null {
  for (let i = 0; i < enc.faixas.length - 1; i++) {
    const atual = enc.faixas[i]!;
    const seguinte = enc.faixas[i + 1]!;
    if (lance <= atual.ate) {
      return { limite: atual.ate, salto: seguinte.valor - atual.valor };
    }
  }
  return null;
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
