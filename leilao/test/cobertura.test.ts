import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import { avaliar } from '../src/analise/teto.ts';
import { gerarPagina } from '../src/estudo/pagina.ts';
import { parsearEvento } from '../src/superbid/api.ts';
import type { ItemAvaliado } from '../src/analise/faixa.ts';

const cfg: Config = { ...CONFIG_PADRAO, freteporLote: 0, freteInformado: true };

const item = (q: number, preco: number | null, faixa: 'A' | 'B' | 'C' = 'A'): ItemAvaliado => ({
  descricao: `item ${q}-${preco}-${faixa}`,
  quantidade: q,
  ref: 'SB1',
  faixa,
  precoOnline: preco,
  fontePreco: 'manual',
});

const ent = (itens: ItemAvaliado[]) => ({
  itens,
  categoria: 'utensilios' as const,
  lanceAtual: 100,
  incremento: 200,
  temLances: true,
  encerrado: false,
  unidadesDeclaradas: 200,
});

/**
 * O portão de cobertura mudou de MECANISMO, não de força, e é isso que estes testes travam.
 *
 * Antes o único caminho de teto era o valor de revenda, então cobertura baixa produzia
 * `sem-cobertura` e nenhuma decisão — 33 dos 61 lotes deste evento. Agora existe o teto pela
 * regra de R$/item do operador, que não depende de preço.
 *
 * A invariante que importa continua exatamente a mesma, dita de forma mais específica:
 * **abaixo do portão, o teto por VALOR não é oferecido.** `baseDoTeto` nunca diz `valor` nem
 * `ambos`, e o `tetoOperante` é o da regra — nunca o `tetoSeguro` calculado sobre 3% dos itens.
 */
describe('cobertura — o teto por VALOR não pode mentir quando quase nada tem preço', () => {
  it('3% de cobertura não oferece teto por valor: cai na regra de R$/item', () => {
    // Foi o bug real: 71 preços em 2.347 itens fizeram o lote 3 aparecer "teto R$ 26 · PARE",
    // que lê como "lote horrível" quando significa "precificamos 3 de 59 itens".
    const av = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    expect(av.cobertura).toBeCloseTo(0.03, 2);
    expect(av.baseDoTeto).toBe('regra');
    // O R$ 26 do bug era o tetoSeguro. Ele continua calculado, mas NÃO governa nada.
    expect(av.tetoOperante).toBe(av.tetoPorRegra);
    expect(av.tetoOperante).not.toBeCloseTo(av.tetoSeguro, 2);
    expect(av.tetoOperante).not.toBeCloseTo(av.tetoMaximo, 2);
    // Margem é conceito de valor de revenda: sem cobertura, não existe.
    expect(av.margem).toBeNull();
  });

  it('acima do mínimo, o teto por valor entra e o menor dos dois governa', () => {
    const av = avaliar(ent([item(70, 100), item(30, null)]), cfg);
    expect(av.cobertura).toBeCloseTo(0.7, 2);
    expect(av.baseDoTeto).toBe('ambos');
    // Dois níveis: limite duro contra limite duro, confortável contra confortável.
    expect(av.tetoOperante).toBe(Math.min(av.tetoMaximo, av.tetoPorRegra));
    expect(av.tetoConfortavel).toBeLessThanOrEqual(av.tetoOperante);
    expect(av.tetoSeguro).toBeGreaterThan(0);
  });

  it('teto por regra e teto por valor são coisas distintas, e a tela sabe qual está valendo', () => {
    const semDados = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    const comDados = avaliar(ent([item(100, 100)]), cfg);
    expect(semDados.baseDoTeto).toBe('regra');
    expect(comDados.baseDoTeto).toBe('ambos');
  });

  it('lote caro pela regra ainda é vermelho — a regra decide sozinha', () => {
    // A proteção não pode virar permissividade: sem preço nenhum, um lance absurdo continua PARE.
    const caro = avaliar({ ...ent([item(100, null)]), lanceAtual: 999_999 }, cfg);
    expect(caro.baseDoTeto).toBe('regra');
    expect(caro.semaforo).toBe('vermelho');
    expect(caro.lanceSugerido).toBeNull();
  });

  it('cobertura em unidades é contada por peso, não por número de linhas', () => {
    // Um item de 96 unidades precificado cobre muito mais unidade que 96 itens de 1.
    const umGrande = avaliar(ent([item(96, 50), ...Array.from({ length: 4 }, () => item(1, null))]), cfg);
    expect(umGrande.cobertura).toBeCloseTo(96 / 100, 2);

    // Mas cobrir unidade NÃO basta por si: 1 de 5 linhas precificadas continua reprovando,
    // porque o item caro pode ser justamente um dos 4 sem preço. Ver o caso do lote 202
    // no describe abaixo.
    expect(umGrande.coberturaLinhas).toBeCloseTo(0.2, 2);
    expect(umGrande.baseDoTeto).toBe('regra');
  });

  it('reporta quantas unidades faltam precificar', () => {
    const av = avaliar(ent([item(30, 100), item(70, null)]), cfg);
    expect(av.unidadesSemPreco).toBe(70);
  });

  it('a página não imprime o teto por valor de lote sem cobertura', () => {
    const evento = parsearEvento(
      JSON.parse(readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8')),
      'UTC',
    );
    const av = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    const html = gerarPagina(
      evento,
      [{ lote: evento.lotes[0]!, av, alertas: [], unidadesDeclaradas: 200, unidadesTitulo: 200, fonteUnidades: 'manifesto', topItens: [] }],
      cfg,
      null,
    );
    // O atributo que o auto-refresh usa para repintar tem de carregar o teto OPERANTE. Se
    // carregasse o tetoSeguro calculado sobre 3% dos itens, a página repintaria contra o número
    // do bug original a cada 15 segundos.
    const attr = /data-teto-seguro="([\d.]+)"/.exec(html);
    expect(attr).not.toBeNull();
    expect(Number(attr![1])).toBeCloseTo(av.tetoOperante, 2);
    expect(Number(attr![1])).not.toBeCloseTo(av.tetoSeguro, 2);
    // E a tela diz de onde veio o teto que ela mostra.
    expect(html).toContain('pela sua regra');
    expect(html).toContain('R$/item declarado');
  });
});

describe('fatorB — faixa B não pode valer o mesmo que A', () => {
  it('mover um item de A para B derruba o valor e o teto', () => {
    const comoA = avaliar(ent([item(100, 100, 'A')]), cfg);
    const comoB = avaliar(ent([item(100, 100, 'B')]), cfg);

    expect(comoB.valorOnline).toBeCloseTo(comoA.valorOnline * cfg.fatorB, 2);
    expect(comoB.tetoSeguro).toBeLessThan(comoA.tetoSeguro);
    // Mas as unidades efetivas são as mesmas: B ainda é mercadoria que sai.
    expect(comoB.unidadesEfetivas).toBe(comoA.unidadesEfetivas);
  });

  it('faixa C continua valendo zero, não fatorB', () => {
    const comoC = avaliar(ent([item(100, 100, 'C')]), cfg);
    expect(comoC.valorOnline).toBe(0);
    expect(comoC.volumeBazar).toBe(100);
  });
});

describe('cobertura por linhas — o falso vermelho do lote 202', () => {
  it('uma linha barata de alto volume não pode destravar o teto sozinha', () => {
    // Caso real: lote 202 tinha 6 linhas relevantes e só as "48 rodas de patinete" com preço.
    // Isso cobria 68% das UNIDADES e passava o gate, enquanto o climatizador Springer — o
    // valor do lote — contava zero. Resultado: "teto R$ 0 · PARE" num lote não avaliado.
    const av = avaliar(
      ent([
        item(48, 59, 'B'), // rodas de patinete, precificadas
        item(1, null), // climatizador, SEM preço
        item(1, null),
        item(1, null),
        item(1, null),
        item(1, null),
      ]),
      cfg,
    );
    expect(av.cobertura).toBeGreaterThan(cfg.coberturaMinima); // unidades passam
    expect(av.coberturaLinhas).toBeLessThan(cfg.coberturaMinimaLinhas); // linhas não
    // As duas precisam passar para o valor entrar. Só uma → o teto continua sendo o da regra.
    expect(av.baseDoTeto).toBe('regra');
    expect(av.tetoOperante).toBe(av.tetoPorRegra);
  });

  it('as duas coberturas precisam passar, não uma', () => {
    // Muitas linhas precificadas mas poucas unidades: também não basta.
    const poucasUnidades = avaliar(ent([item(1, 50), item(1, 50), item(1, 50), item(97, null)]), cfg);
    expect(poucasUnidades.coberturaLinhas).toBeGreaterThan(cfg.coberturaMinimaLinhas);
    expect(poucasUnidades.cobertura).toBeLessThan(cfg.coberturaMinima);
    expect(poucasUnidades.baseDoTeto).toBe('regra');

    const ambas = avaliar(ent([item(40, 50), item(40, 50), item(20, null)]), cfg);
    expect(ambas.baseDoTeto).toBe('ambos');
  });

  it('nunca exibe teto R$ 0 como se fosse decisão', () => {
    // Teto zero é resultado válido do cálculo, mas não é resposta que o operador possa usar.
    const av = avaliar(ent([item(48, 59, 'B'), item(1, null), item(1, null), item(1, null), item(1, null), item(1, null)]), cfg);
    expect(av.baseDoTeto).toBe('regra');
    expect(av.tetoOperante).toBeGreaterThan(0);
  });
});
