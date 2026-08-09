import { describe, expect, it } from 'vitest';
import { chave, priorizar } from '../src/analise/valor.ts';
import { exportar, importar, numeroBR, INSTRUCOES } from '../src/precos/troca.ts';
import type { ItemManifesto } from '../src/analise/faixa.ts';

/**
 * Arquivo que sai daqui, passa por um chat e volta **não volta igual**. Estes testes são a
 * lista de coisas que um modelo de verdade faz com o arquivo, cada uma travada.
 *
 * O risco que justificam: uma importação que diz "sucesso" tendo casado zero linhas deixaria o
 * operador convencido de que precificou 400 itens, entrar no pregão confiando num teto que não
 * existe, e descobrir no lance. Por isso a importação devolve relatório, não um booleano.
 */

const itens = (...pares: [string, number][]): ItemManifesto[] =>
  pares.map(([descricao, quantidade]) => ({ descricao, quantidade, ref: 'SB1' }));

const MANIFESTO = itens(
  ['AIR FRYER BRITANIA 5,5 LITROS', 2],
  ['Martelete Rompedor Bosch Gbh 2-24d', 1],
  ['TAÇA DE SOBREMESA VIDRO', 5],
  ['JOGO DE PANELA TRAMONTINA INOX', 3],
);
const linhas = priorizar(new Map([[12, MANIFESTO]]));
const conhecidas = new Set(MANIFESTO.map((i) => chave(i.descricao)));

const arquivo = exportar(linhas, { evento: 790754, escopo: 'lote 12' });

/** Devolve o arquivo como um chat devolveria, com as avarias pedidas. */
function respostaDoChat(
  precos: Record<string, unknown>,
  opcoes: { cerca?: boolean; prosa?: boolean; soArray?: boolean; inverter?: boolean } = {},
): string {
  const lista = arquivo.itens.map((i) => ({ ...i, preco: precos[i.chave] ?? i.preco }));
  if (opcoes.inverter) lista.reverse();
  const corpo = opcoes.soArray ? lista : { ...arquivo, itens: lista };
  let t = JSON.stringify(corpo, null, 2);
  if (opcoes.cerca) t = '```json\n' + t + '\n```';
  if (opcoes.prosa) t = 'Claro! Aqui está:\n\n' + t + '\n\nEspero ter ajudado!';
  return t;
}

describe('exportar — o arquivo que vai para o chat', () => {
  it('leva o prompt dentro dele', () => {
    // Se o prompt vivesse só na documentação, seria a parte que se perde entre um leilão e o
    // próximo. Dentro do arquivo, ele viaja junto.
    expect(arquivo.instrucoes).toBe(INSTRUCOES);
    expect(arquivo.instrucoes).toContain('NÃO altere o campo "chave"');
    expect(arquivo.instrucoes).toContain('Deixe null');
  });

  it('manda tudo com preco null e a chave de casamento', () => {
    for (const i of arquivo.itens) {
      expect(i.preco).toBeNull();
      expect(conhecidas.has(i.chave)).toBe(true);
    }
  });

  it('ordem de impacto: o martelete vem antes da taça', () => {
    // O modelo acerta melhor as primeiras linhas, e é onde está o valor do lote.
    const pos = (t: string) => arquivo.itens.findIndex((i) => i.item.toLowerCase().includes(t));
    expect(pos('martelete')).toBeLessThan(pos('taça'));
  });

  it('reaproveita preço que já está na tabela, para não repesquisar', () => {
    const a = exportar(linhas, {
      evento: 1,
      escopo: 'x',
      precoAtual: (k) => (k.includes('bosch') ? 1200 : null),
    });
    expect(a.itens.find((i) => i.chave.includes('bosch'))!.preco).toBe(1200);
  });
});

describe('numeroBR — o que os chats escrevem no lugar de um número', () => {
  const casos: [unknown, number | null][] = [
    [1299.9, 1299.9],
    ['1299.90', 1299.9],
    ['R$ 1.299,90', 1299.9],
    ['1.299,90', 1299.9],
    ['89,90', 89.9],
    ['R$89,90', 89.9],
    // "1.299" sem casas decimais: em pt-BR é milhar, não 1 vírgula 299.
    ['1.299', 1299],
    ['  250  ', 250],
    ['0', 0],
    ['null', null],
    ['n/a', null],
    ['—', null],
    ['mais ou menos cem reais', null],
    ['', null],
    [-5, null],
    [Infinity, null],
    [null, null],
  ];
  for (const [entrada, esperado] of casos) {
    it(`${JSON.stringify(entrada)} → ${esperado}`, () => {
      expect(numeroBR(entrada)).toBe(esperado);
    });
  }
});

describe('importar — sobrevive ao que o chat devolve', () => {
  const precos = { [chave('AIR FRYER BRITANIA 5,5 LITROS')]: 389.9 };

  it('aceita o JSON limpo', () => {
    const r = importar(respostaDoChat(precos), conhecidas);
    expect(r.porChave).toBe(4);
    expect(r.entrada[chave('AIR FRYER BRITANIA 5,5 LITROS')]!.preco).toBe(389.9);
  });

  it('aceita cerca de markdown em volta', () => {
    const r = importar(respostaDoChat(precos, { cerca: true }), conhecidas);
    expect(r.porChave).toBe(4);
  });

  it('aceita prosa antes e depois do JSON', () => {
    const r = importar(respostaDoChat(precos, { prosa: true }), conhecidas);
    expect(r.porChave).toBe(4);
  });

  it('aceita cerca E prosa juntas, que é o caso mais comum', () => {
    const r = importar(respostaDoChat(precos, { cerca: true, prosa: true }), conhecidas);
    expect(r.porChave).toBe(4);
  });

  it('aceita só o array, sem o envelope', () => {
    const r = importar(respostaDoChat(precos, { soArray: true }), conhecidas);
    expect(r.porChave).toBe(4);
  });

  it('aceita o formato do próprio precos.json, { itens: { chave: {...} } }', () => {
    const k = chave('Martelete Rompedor Bosch Gbh 2-24d');
    const r = importar(JSON.stringify({ itens: { [k]: { preco: 1200, faixa: 'A' } } }), conhecidas);
    expect(r.entrada[k]!.preco).toBe(1200);
  });

  it('ordem não importa: o casamento é por chave, não por posição', () => {
    const r = importar(respostaDoChat(precos, { inverter: true }), conhecidas);
    expect(r.entrada[chave('AIR FRYER BRITANIA 5,5 LITROS')]!.preco).toBe(389.9);
  });

  it('recupera a linha quando o chat REESCREVEU a chave mas manteve a descrição', () => {
    // O erro mais comum, e o mais silencioso: sem esta rede, a linha seria descartada.
    const lista = [
      { chave: 'Martelete Rompedor Bosch (GBH 2-24D)', item: 'Martelete Rompedor Bosch Gbh 2-24d', preco: 1250 },
    ];
    const r = importar(JSON.stringify(lista), conhecidas);
    expect(r.porDescricao).toBe(1);
    expect(r.entrada[chave('Martelete Rompedor Bosch Gbh 2-24d')]!.preco).toBe(1250);
  });

  it('item inventado é RELATADO e não gravado', () => {
    const lista = [{ chave: 'helicoptero apache', item: 'HELICOPTERO APACHE AH-64', preco: 9500000 }];
    const r = importar(JSON.stringify(lista), conhecidas);
    expect(Object.keys(r.entrada)).toHaveLength(0);
    expect(r.desconhecidos[0]).toContain('HELICOPTERO');
  });

  it('preço ilegível é relatado e a linha é pulada, não gravada como zero', () => {
    // Gravar 0 seria pior que não gravar: 0 conta como preço e passa o portão de cobertura
    // com valor zero, empurrando o teto para baixo sem ninguém perceber.
    const k = chave('TAÇA DE SOBREMESA VIDRO');
    const r = importar(
      JSON.stringify([{ chave: k, item: 'TAÇA DE SOBREMESA VIDRO', preco: 'uns cem reais' }]),
      conhecidas,
    );
    expect(r.entrada[k]).toBeUndefined();
    expect(r.invalidos).toHaveLength(1);
  });

  it('preço null é gravado como null e contado, porque "não sei" é resposta válida', () => {
    const r = importar(respostaDoChat({}), conhecidas);
    expect(r.semPreco).toBe(4);
    for (const v of Object.values(r.entrada)) expect(v.preco).toBeNull();
  });

  it('preço absurdamente alto passa, mas é SINALIZADO para conferência', () => {
    const k = chave('TAÇA DE SOBREMESA VIDRO');
    const r = importar(JSON.stringify([{ chave: k, item: 'TAÇA', preco: 250000 }]), conhecidas);
    expect(r.entrada[k]!.preco).toBe(250000);
    expect(r.suspeitos[0]!.preco).toBe(250000);
  });

  it('faixa inválida é ignorada em vez de gravar lixo', () => {
    const k = chave('TAÇA DE SOBREMESA VIDRO');
    const r = importar(JSON.stringify([{ chave: k, preco: 10, faixa: 'Z' }]), conhecidas);
    expect(r.entrada[k]!.faixa).toBeUndefined();
  });

  it('faixa em minúscula é aceita', () => {
    const k = chave('TAÇA DE SOBREMESA VIDRO');
    const r = importar(JSON.stringify([{ chave: k, preco: 10, faixa: 'b' }]), conhecidas);
    expect(r.entrada[k]!.faixa).toBe('B');
  });

  it('JSON inválido dá erro que diz o que fazer, não stack trace', () => {
    expect(() => importar('desculpe, não consegui gerar o arquivo', conhecidas)).toThrow(
      /apague o texto|não consegui ler/,
    );
  });

  it('estrutura inesperada é recusada com mensagem, não gravada pela metade', () => {
    expect(() => importar('{"resultado":"ok"}', conhecidas)).toThrow(/esperava uma lista/);
  });

  it('nada casou é visível no relatório, não um sucesso mudo', () => {
    const lista = [{ chave: 'xyz', item: 'PRODUTO QUE NAO EXISTE', preco: 10 }];
    const r = importar(JSON.stringify(lista), conhecidas);
    expect(Object.keys(r.entrada)).toHaveLength(0);
    expect(r.porChave + r.porDescricao).toBe(0);
    expect(r.desconhecidos).toHaveLength(1);
  });
});
