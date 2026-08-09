import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import { detectar } from '../src/analise/categoria.ts';
import { aplicar } from '../src/analise/valor.ts';
import { avaliar } from '../src/analise/teto.ts';
import { parsearEvento } from '../src/superbid/api.ts';

const cfg: Config = { ...CONFIG_PADRAO, freteporLote: 150, freteInformado: true };

describe('categoria — contagem de termos, não o primeiro que casa', () => {
  it('"COPOS PARA WHISKY" é utensílio, não bebida', () => {
    // Falso positivo real do lote 22. Com o operador ignorando bebidas, a versão
    // primeiro-que-casa o faria pular um lote de frigideira, cooktop e taças.
    const t =
      'FRIGIDEIRA REDSILVER, FOGÃO COOKTOP PORTÁTIL 1 BOCA, TAÇAS DIAMOND, ' +
      'COPOS PARA WHISKY WOLFF E OUTROS (APROX. 199 UN)';
    expect(detectar(t)).toBe('utensilios');
    expect(detectar(t)).not.toBe('bebidas');
  });

  it('lote que é de bebida de verdade continua bebida', () => {
    expect(detectar('BEBIDAS DIVERSAS: VINHOS, CERVEJAS, LICORES E OUTROS')).toBe('bebidas');
  });

  it('limpeza cai na mesma categoria de cosméticos, que é como o config trata', () => {
    expect(detectar('ITENS DE LIMPEZA: DOWNY, OMO, VANISH, VEJA E OUTROS')).toBe('cosmeticos');
  });

  it('acento não muda a detecção', () => {
    expect(detectar('ITENS DE COSMÉTICOS: NIVEA')).toBe(detectar('ITENS DE COSMETICOS: NIVEA'));
  });
});

describe('categorias ignoradas — decisão do operador, não falta de dado', () => {
  const ent = (ignorado: boolean) => ({
    itens: aplicar([{ descricao: 'AIR FRYER BRITANIA', quantidade: 10, ref: 'SB1' }], {
      'air fryer britania': { preco: 350 },
    }),
    categoria: 'bebidas' as const,
    lanceAtual: 1000,
    incremento: 200,
    temLances: true,
    encerrado: false,
    unidadesDeclaradas: 10,
    ignorado,
  });

  it('lote ignorado não recebe teto nem lance sugerido, mesmo com preço e cobertura', () => {
    const av = avaliar(ent(true), cfg);
    expect(av.semaforo).toBe('ignorado');
    expect(av.lanceSugerido).toBeNull();
    expect(av.margem).toBeNull();
  });

  it('o mesmo lote, sem a marca de ignorado, recebe teto', () => {
    const av = avaliar(ent(false), cfg);
    expect(av.semaforo).not.toBe('ignorado');
    expect(av.tetoSeguro).toBeGreaterThan(0);
  });

  it('ignorado é distinto de sem-cobertura e de vermelho', () => {
    expect(avaliar(ent(true), cfg).semaforo).toBe('ignorado');
    // Não é "não sei" nem "caro" — é "não trabalho com isso".
    expect(avaliar(ent(true), cfg).semaforo).not.toBe('sem-cobertura');
    expect(avaliar(ent(true), cfg).semaforo).not.toBe('vermelho');
  });
});

describe('itens ignorados dentro de lote misto', () => {
  it('shampoo e cerveja em lote misto vão para faixa C e não contam valor', () => {
    const itens = aplicar(
      [
        { descricao: 'AIR FRYER BRITANIA 5,5 LITROS', quantidade: 1, ref: 'SB1' },
        { descricao: 'SHAMPOO ELSEVE 400ML', quantidade: 50, ref: 'SB1' },
        { descricao: 'PACK HEINEKEN 12 LATAS 350 ML', quantidade: 4, ref: 'SB1' },
        { descricao: 'DETERGENTE YPE 500ML', quantidade: 30, ref: 'SB1' },
      ],
      {
        'air fryer britania 5 5 litros': { preco: 350 },
        // Preço E faixa A postos de propósito nos ignorados: o filtro tem de ganhar deles.
        'shampoo elseve 400ml': { preco: 20, faixa: 'A' },
        'pack heineken 12 latas 350 ml': { preco: 60, faixa: 'A' },
        'detergente ype 500ml': { preco: 3, faixa: 'A' },
      },
      cfg.termosIgnorados,
    );

    const porDescricao = new Map(itens.map((i) => [i.descricao, i]));
    expect(porDescricao.get('SHAMPOO ELSEVE 400ML')!.faixa).toBe('C');
    expect(porDescricao.get('PACK HEINEKEN 12 LATAS 350 ML')!.faixa).toBe('C');
    expect(porDescricao.get('DETERGENTE YPE 500ML')!.faixa).toBe('C');
    expect(porDescricao.get('AIR FRYER BRITANIA 5,5 LITROS')!.faixa).toBe('A');

    // Só a air fryer entra no valor: 1 × 350.
    const av = avaliar(
      {
        itens,
        categoria: 'utensilios',
        lanceAtual: 500,
        incremento: 200,
        temLances: true,
        encerrado: false,
        unidadesDeclaradas: 85,
      },
      cfg,
    );
    expect(av.valorOnline).toBe(350);
    expect(av.unidadesEfetivas).toBe(1);
    expect(av.volumeBazar).toBe(84);
  });
});

describe('os 61 lotes reais com o filtro do operador', () => {
  const evento = parsearEvento(
    JSON.parse(readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8')),
    'UTC',
  );

  it('ignora exatamente os lotes de cosmético, limpeza e bebida', () => {
    const ignorados = evento.lotes
      .filter((l) => cfg.categoriasIgnoradas.includes(detectar(l.titulo)))
      .map((l) => l.numero)
      .sort((a, b) => a - b);
    // Sem o lote 22, que voltou a ser utensílios depois da correção da detecção.
    expect(ignorados).toEqual([1, 2, 4, 5, 16, 24, 26]);
  });

  it('nenhum lote com cosmético/limpeza/bebida no título escapa do filtro', () => {
    const rx = /cosm|limpeza|bebida/i;
    for (const l of evento.lotes) {
      if (rx.test(l.titulo)) {
        expect(cfg.categoriasIgnoradas).toContain(detectar(l.titulo));
      }
    }
  });
});
