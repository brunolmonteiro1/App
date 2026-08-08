import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { daTitulo, reconciliar, refDoTitulo } from '../src/analise/quantidade.ts';

describe('quantidade — os seis formatos dos títulos reais', () => {
  const casos: [string, number | null][] = [
    ['BEBIDAS DIVERSAS: VINHOS, CERVEJAS E OUTROS (APROX. 142 UN)', 142],
    ['SACOS PLÁSTICOS, BICICLETA E OUTROS (APROX.: 431 PÇS)', 431],
    ['AMORTECEDOR, PAR LENTE DIANTEIRA KOMBI E OUTROS (APROX. 81 PC)', 81],
    ['BANCADA MULTIUSO, CAMA DE SOLTEIRO E OUTROS (19 UN)', 19],
    ['ARAME FARPADO, BICICLETA INFANTIL E OUTROS (45 PÇS)', 45],
    ['ACESSÓRIOS E PEÇAS MOTOCICLETA, PEÇAS CARROS, Qtde Aprox. 74', 74],
    ['CLIMATIZADOR PORTATIL FRIO SPRINGER E OUTROS. Qtde. 74', 74],
    ['JOGO DE PANELAS REDSILVER, CALÇADOS E OUTROS (Qtde. 265)', 265],
    // Typo real do evento: falta o P em APROX.
    ['CHURRASQUEIRA PORTÁTIL, TENDA GAZEBO E OUTROS (AROX. 44 UN)', 44],
    ['ITENS DE COSMÉTICOS: HIDRATEI, TRUSS E OUTROS (APROX. 1000 UN)', 1000],
  ];

  for (const [titulo, esperado] of casos) {
    it(`extrai ${esperado} de "${titulo.slice(0, 44)}…"`, () => {
      expect(daTitulo(titulo).valor).toBe(esperado);
    });
  }

  it('sem quantidade no título devolve null — nunca chuta', () => {
    // Três lotes deste evento não têm quantidade em lugar nenhum do título.
    const semQtd = 'MACA MALETA PORTÁTIL, LAVATÓRIO DE SALÃO DE BELEZA E CADEIRA DE SALÃO';
    expect(daTitulo(semQtd).valor).toBeNull();
    expect(daTitulo(semQtd).fonte).toBe('desconhecida');
  });

  it('marca como aproximado quando o vendedor diz "aprox"', () => {
    expect(daTitulo('X (APROX. 142 UN)').aproximado).toBe(true);
    expect(daTitulo('X (19 UN)').aproximado).toBe(false);
  });

  it('não confunde a referência SB com quantidade', () => {
    const t = 'ITENS DIVERSOS: UTENSÍLIOS (APROX. 304 UN) (Ref.: SB0032812)';
    expect(daTitulo(t).valor).toBe(304);
    expect(refDoTitulo(t)).toBe('SB0032812');
  });
});

describe('reconciliação — o manifesto ganha do título', () => {
  it('usa a soma do manifesto quando existe', () => {
    const r = reconciliar('X (APROX. 300 UN)', 304);
    expect(r.valor).toBe(304);
    expect(r.fonte).toBe('manifesto');
    expect(r.aproximado).toBe(false);
  });

  it('cai para o título quando não há manifesto', () => {
    const r = reconciliar('X (APROX. 300 UN)', null);
    expect(r.valor).toBe(300);
    expect(r.fonte).toBe('titulo');
  });

  it('sem manifesto e sem título, admite que não sabe', () => {
    expect(reconciliar('MACA MALETA PORTÁTIL', null).valor).toBeNull();
  });
});

describe('cobertura contra os 61 títulos reais do evento', () => {
  it('extrai quantidade de pelo menos 58 dos 61, e os que falham devolvem null', () => {
    const bruto = JSON.parse(
      readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8'),
    );
    const titulos: string[] = bruto.offers.map((o: any) => o.product.shortDesc as string);
    expect(titulos).toHaveLength(61);

    const comQtd = titulos.filter((t) => daTitulo(t).valor !== null);
    // Regex ingênua acertava 40/61. Com os seis formatos tratados, sobram só os
    // lotes que genuinamente não declaram quantidade.
    expect(comQtd.length).toBeGreaterThanOrEqual(58);

    // Nenhum título pode produzir quantidade absurda por casar com o número errado.
    for (const t of titulos) {
      const v = daTitulo(t).valor;
      if (v !== null) expect(v).toBeLessThan(20000);
    }
  });

  it('lotNumber vai a 323 mas o evento tem 61 lotes — não confundir com contagem', () => {
    const bruto = JSON.parse(
      readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8'),
    );
    const numeros: number[] = bruto.offers.map((o: any) => o.lotNumber);
    expect(numeros).toHaveLength(61);
    expect(Math.max(...numeros)).toBe(323);
    expect(numeros).not.toEqual([...numeros].map((_, i) => i + 1));
    // Ordenado por lotNumber bate com a ordem que o BidTV mostra.
    expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
  });
});
