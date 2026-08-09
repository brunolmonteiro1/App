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

describe('cobertura — o teto não pode mentir quando quase nada tem preço', () => {
  it('3% de cobertura NÃO exibe teto: devolve sem-cobertura, não vermelho', () => {
    // Foi o bug real: 71 preços em 2.347 itens fizeram o lote 3 aparecer "teto R$ 26 · PARE",
    // que lê como "lote horrível" quando significa "precificamos 3 de 59 itens".
    const av = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    expect(av.cobertura).toBeCloseTo(0.03, 2);
    expect(av.semaforo).toBe('sem-cobertura');
    expect(av.lanceSugerido).toBeNull();
    expect(av.margem).toBeNull();
  });

  it('acima do mínimo, o teto volta a ser oferecido', () => {
    const av = avaliar(ent([item(70, 100), item(30, null)]), cfg);
    expect(av.cobertura).toBeCloseTo(0.7, 2);
    expect(av.semaforo).not.toBe('sem-cobertura');
    expect(av.tetoSeguro).toBeGreaterThan(0);
  });

  it('sem-cobertura é distinto de vermelho — são informações opostas', () => {
    // Vermelho = "lote caro, para". Sem-cobertura = "não sei ainda".
    const semDados = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    const caro = avaliar({ ...ent([item(100, 100)]), lanceAtual: 999_999 }, cfg);
    expect(semDados.semaforo).toBe('sem-cobertura');
    expect(caro.semaforo).toBe('vermelho');
    expect(semDados.semaforo).not.toBe(caro.semaforo);
  });

  it('cobertura em unidades é contada por peso, não por número de linhas', () => {
    // Um item de 96 unidades precificado cobre muito mais unidade que 96 itens de 1.
    const umGrande = avaliar(ent([item(96, 50), ...Array.from({ length: 4 }, () => item(1, null))]), cfg);
    expect(umGrande.cobertura).toBeCloseTo(96 / 100, 2);

    // Mas cobrir unidade NÃO basta por si: 1 de 5 linhas precificadas continua reprovando,
    // porque o item caro pode ser justamente um dos 4 sem preço. Ver o caso do lote 202
    // no describe abaixo.
    expect(umGrande.coberturaLinhas).toBeCloseTo(0.2, 2);
    expect(umGrande.semaforo).toBe('sem-cobertura');
  });

  it('reporta quantas unidades faltam precificar', () => {
    const av = avaliar(ent([item(30, 100), item(70, null)]), cfg);
    expect(av.unidadesSemPreco).toBe(70);
  });

  it('a página não imprime teto de lote sem cobertura', () => {
    const evento = parsearEvento(
      JSON.parse(readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8')),
      'UTC',
    );
    const av = avaliar(ent([item(3, 100), item(97, null)]), cfg);
    const html = gerarPagina(
      evento,
      [{ lote: evento.lotes[0]!, av, alertas: [], unidadesDeclaradas: 200, fonteUnidades: 'manifesto', topItens: [] }],
      cfg,
      null,
    );
    expect(html).toContain('PRECIFIQUE');
    expect(html).not.toContain('PARE');
    expect(html).toContain('Falta precificar');
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
    expect(av.semaforo).toBe('sem-cobertura');
    expect(av.lanceSugerido).toBeNull();
  });

  it('as duas coberturas precisam passar, não uma', () => {
    // Muitas linhas precificadas mas poucas unidades: também não basta.
    const poucasUnidades = avaliar(ent([item(1, 50), item(1, 50), item(1, 50), item(97, null)]), cfg);
    expect(poucasUnidades.coberturaLinhas).toBeGreaterThan(cfg.coberturaMinimaLinhas);
    expect(poucasUnidades.cobertura).toBeLessThan(cfg.coberturaMinima);
    expect(poucasUnidades.semaforo).toBe('sem-cobertura');

    const ambas = avaliar(ent([item(40, 50), item(40, 50), item(20, null)]), cfg);
    expect(ambas.semaforo).not.toBe('sem-cobertura');
  });

  it('nunca exibe teto R$ 0 como se fosse decisão', () => {
    // Teto zero é resultado válido do cálculo, mas não é resposta que o operador possa usar.
    const av = avaliar(ent([item(48, 59, 'B'), item(1, null), item(1, null), item(1, null), item(1, null), item(1, null)]), cfg);
    expect(av.semaforo).toBe('sem-cobertura');
  });
});
