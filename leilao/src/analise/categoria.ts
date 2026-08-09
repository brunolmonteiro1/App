/**
 * Detecção de categoria a partir do título do lote.
 *
 * A categoria define o múltiplo exigido e a perda esperada, então errar aqui move o teto.
 * Na dúvida cai em `outros`, que carrega múltiplo intermediário — nunca no mais
 * permissivo, porque múltiplo baixo autoriza lance alto.
 */

import type { Categoria } from '../config.ts';

/** Ordem importa: o primeiro que casar ganha. Mais específico primeiro. */
const REGRAS: { cat: Categoria; termos: string[] }[] = [
  { cat: 'automotivas', termos: ['peças automotivas', 'peca automotiva', 'amortecedor', 'motocicleta', 'disco de freio', 'pastilha de freio', 'escapamento', 'catalisador', 'kombi', 'guidão para moto', 'engate moto'] },
  { cat: 'cosmeticos', termos: ['cosmétic', 'cosmetic', 'shampoo', 'hidratei', 'loreal', 'nivea', 'itens de limpeza', 'vanish', 'downy', 'brilhante'] },
  { cat: 'bebidas', termos: ['bebidas', 'vinhos', 'cervejas', 'licores', 'energéticos', 'whisky'] },
  { cat: 'eletroportateis', termos: ['air fryer', 'fritadeira', 'liquidificador', 'micro-ondas', 'microondas', 'cafeteira', 'ventilador', 'climatizador', 'eletroportáteis', 'eletroportateis', 'secador', 'cooktop', 'bebedouro', 'depurador'] },
  { cat: 'ferramentas', termos: ['ferramenta', 'furadeira', 'roçadeira', 'rocadeira', 'informática', 'informatica', 'monitor', 'martelete', 'grampeador', 'soprador'] },
  { cat: 'moveis', termos: ['móve', 'move', 'cama de solteiro', 'poltrona', 'armário', 'armario', 'sapateira', 'prateleira', 'bancada', 'aparador', 'cadeira gamer', 'mesa de ping pong', 'tenda gazebo', 'churrasqueira'] },
  { cat: 'vestuario', termos: ['vestuário', 'vestuario', 'calçados', 'calcados', 'jogos de cama', 'jogo de cama', 'toalha', 'mochila', 'bolsas', 'tênis', 'tenis'] },
  { cat: 'utensilios', termos: ['utensílios', 'utensilios', 'ultensil', 'cozinha', 'panela', 'taça', 'taca', 'copos', 'pratos', 'caneca', 'xícara', 'xicara', 'papelaria', 'brinquedos', 'potes'] },
];

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Detecção por CONTAGEM de termos, não pelo primeiro que casa.
 *
 * Primeiro-que-casa produzia falso positivo grave: o lote 22 —
 * "FRIGIDEIRA REDSILVER, FOGÃO COOKTOP PORTÁTIL, TAÇAS DIAMOND, COPOS PARA WHISKY WOLFF" —
 * era classificado como *bebidas* por causa de "copos para WHISKY". É o copo, não o whisky.
 * Com o operador ignorando bebidas, isso o faria pular um lote de utensílios.
 *
 * Contando, o mesmo título dá bebidas=1 (whisky) contra utensilios=2 (taça, copos), e
 * utensílios ganha. Empate cai na ordem de REGRAS, que vai do mais específico ao mais geral.
 */
export function detectar(titulo: string): Categoria {
  const t = normalizar(titulo);
  let melhor: Categoria = 'outros';
  let maior = 0;
  for (const { cat, termos } of REGRAS) {
    const n = termos.filter((x) => t.includes(normalizar(x))).length;
    if (n > maior) {
      maior = n;
      melhor = cat;
    }
  }
  return melhor;
}

/**
 * Lote misto é a regra neste evento, não a exceção ("ITENS DIVERSOS: INFORMÁTICA,
 * VESTUÁRIO, UTENSÍLIOS DE COZINHA E OUTROS"). Esta função devolve todas as categorias
 * mencionadas, para o estudo mostrar que a escolha foi de um lote heterogêneo.
 */
export function detectarTodas(titulo: string): Categoria[] {
  const t = normalizar(titulo);
  const achadas = REGRAS.filter((r) => r.termos.some((x) => t.includes(normalizar(x)))).map(
    (r) => r.cat,
  );
  return achadas.length ? [...new Set(achadas)] : ['outros'];
}
