/**
 * Os parâmetros do operador, gravados em disco: a regra de R$/item e a venda média por categoria.
 *
 * Ficam fora do `config.ts` porque **são dele, não do código**. O `config.ts` traz o ponto de
 * partida; este arquivo guarda o que ele ajustou na tela, e sobrevive a `git pull`.
 *
 * A venda média por categoria é o atalho que torna a estimativa de lucro viável. Preço por item
 * são ~1.900 pesquisas; venda média por categoria são **8 números** que ele já sabe de cabeça,
 * porque opera o bazar há anos. Enquanto estiverem nulos, o estudo não mostra lucro nenhum — o
 * lugar mais fácil de inventar número neste projeto é justamente aqui, e lucro inventado vira
 * lance real.
 */

import { rename, stat, writeFile, readFile } from 'node:fs/promises';
import { CONFIG_PADRAO, type Categoria, type Config } from '../config.ts';

export interface ArquivoRegra {
  regra?: Partial<Config['regra']>;
  vendaMediaPorItemUtil?: Partial<Record<Categoria, number | null>>;
  /** Perda por categoria — hoje placeholder meu, esperando o histórico dele. */
  perdaPorCategoria?: Partial<Record<Categoria, number>>;
  atualizadoEm?: string;
}

export const NOME_REGRA = 'regra.json';

export async function lerRegra(caminho: string): Promise<ArquivoRegra> {
  const st = await stat(caminho).catch(() => null);
  // Ausente é o estado inicial legítimo: vale o que está no config.ts.
  if (!st || st.isDirectory()) return {};
  const bruto = await readFile(caminho, 'utf8');
  try {
    const d = JSON.parse(bruto) as ArquivoRegra;
    return d && typeof d === 'object' ? d : {};
  } catch (e) {
    throw new Error(`${caminho}: JSON inválido (${(e as Error).message})`);
  }
}

export async function gravarRegra(caminho: string, a: ArquivoRegra): Promise<void> {
  const tmp = `${caminho}.tmp`;
  await writeFile(tmp, JSON.stringify({ ...a, atualizadoEm: new Date().toISOString() }, null, 2) + '\n', 'utf8');
  await rename(tmp, caminho);
}

const BASES = new Set(['titulo', 'nomeados', 'uteis']);

/** Número positivo, ou `null`. Rejeita em vez de coagir: `NaN` viraria teto zero em silêncio. */
function numeroOuNulo(v: unknown, max: number): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/\s|R\$/gi, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
}

/**
 * Aplica o arquivo sobre a config base.
 *
 * Só sobrescreve o que veio válido — assim um `regra.json` editado à mão com um campo errado
 * degrada para o padrão em vez de zerar o teto do evento inteiro.
 */
export function aplicarRegra(a: ArquivoRegra, base: Config = CONFIG_PADRAO): Config {
  const cfg: Config = {
    ...base,
    regra: { ...base.regra },
    vendaMediaPorItemUtil: { ...base.vendaMediaPorItemUtil },
    categorias: { ...base.categorias },
  };

  const maximo = numeroOuNulo(a.regra?.custoPorItemMaximo, 100_000);
  if (maximo !== null) cfg.regra.custoPorItemMaximo = maximo;
  const alvo = numeroOuNulo(a.regra?.custoPorItemAlvo, 100_000);
  if (alvo !== null) cfg.regra.custoPorItemAlvo = alvo;
  // O alvo não pode passar o máximo: verde acima de vermelho seria semáforo mentiroso.
  if (cfg.regra.custoPorItemAlvo > cfg.regra.custoPorItemMaximo) {
    cfg.regra.custoPorItemAlvo = cfg.regra.custoPorItemMaximo;
  }
  if (a.regra?.base && BASES.has(a.regra.base)) cfg.regra.base = a.regra.base;
  const fracao = numeroOuNulo(a.regra?.fracaoEmCaixaGrave, 1);
  if (fracao !== null) cfg.regra.fracaoEmCaixaGrave = fracao;

  for (const [cat, v] of Object.entries(a.vendaMediaPorItemUtil ?? {})) {
    if (!(cat in cfg.vendaMediaPorItemUtil)) continue;
    // Aqui `null` é significativo: apaga o valor e some com o lucro estimado da categoria.
    cfg.vendaMediaPorItemUtil[cat as Categoria] = v === null ? null : numeroOuNulo(v, 100_000);
  }

  for (const [cat, v] of Object.entries(a.perdaPorCategoria ?? {})) {
    if (!(cat in cfg.categorias)) continue;
    const p = numeroOuNulo(v, 1);
    if (p !== null) cfg.categorias[cat as Categoria] = { ...cfg.categorias[cat as Categoria]!, perda: p };
  }

  return cfg;
}
