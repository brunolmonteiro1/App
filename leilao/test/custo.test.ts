import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import {
  calcularCusto,
  degrauProximo,
  faixaEncargo,
  martelaDoTeto,
  ultimoLanceValido,
} from '../src/analise/custo.ts';

const cfg = CONFIG_PADRAO;
const enc = cfg.encargos;

describe('custo — DOIS âncoras reais do site, em faixas conhecidas', () => {
  // Um ponto só foi o que me fez tratar R$ 250 como taxa fixa. Dois pontos na mesma faixa
  // também não distinguiriam — por isso os testes de fronteira abaixo são obrigatórios.

  it('estimador do site: lance 3.010 → encargos 551,00 → total 3.561,00', () => {
    // Comissão do leiloeiro 150,50 · Buyers Premium 150,50
    // Encargos de Administração 187,50 · Fee Plataforma 62,50
    const c = calcularCusto(3010, cfg);
    expect(c.leiloeiro).toBeCloseTo(150.5, 2);
    expect(c.premium).toBeCloseTo(150.5, 2);
    expect(c.encargosAdm).toBeCloseTo(187.5, 2);
    expect(c.feePlataforma).toBeCloseTo(62.5, 2);
    expect(c.encargos).toBeCloseTo(551, 2);
    expect(c.total).toBeCloseTo(3561, 2);
  });

  it('diálogo de lance: lance 3.460 → encargos 596,00 → total 4.056,00', () => {
    const c = calcularCusto(3460, cfg);
    expect(c.encargos).toBeCloseTo(596, 2);
    expect(c.total).toBeCloseTo(4056, 2);
  });

  it('a divisão interna soma exatamente o valor da faixa', () => {
    for (const lance of [400, 700, 3010, 7000, 20000, 200000]) {
      const c = calcularCusto(lance, cfg);
      expect(c.encargosAdm + c.feePlataforma).toBeCloseTo(c.faixaEncargo, 6);
      expect(c.leiloeiro + c.premium).toBeCloseTo(lance * 0.10, 6);
    }
  });

  it('nunca usa os 5% que a API informa como encargo total', () => {
    expect(enc.percentual).toBe(0.10);
    expect(calcularCusto(3460, cfg).encargos).not.toBeCloseTo(3460 * 0.05, 2);
  });

  it('rejeita lance negativo em vez de devolver número sem sentido', () => {
    expect(() => calcularCusto(-1, cfg)).toThrow(RangeError);
  });
});

describe('faixaEncargo — a tabela do Edital, fronteira por fronteira', () => {
  const casos: [number, number][] = [
    [0.01, 50],
    [499.99, 50],
    [500, 125],
    [999.99, 125],
    [1000, 250],
    [4999.99, 250],
    [5000, 500],
    [9999.99, 500],
    [10000, 750],
    [29999.99, 750],
    [30000, 1250],
    [49999.99, 1250],
    [50000, 1500],
    [74999.99, 1500],
    [75000, 3000],
    [99999.99, 3000],
    [100000, 4000],
    [149999.99, 4000],
    [150000, 6500],
    [250000, 6500],
    [1000000, 6500],
  ];

  for (const [lance, esperado] of casos) {
    it(`lance ${lance} → R$ ${esperado}`, () => {
      expect(faixaEncargo(lance, enc)).toBe(esperado);
    });
  }

  it('a tabela cobre todo o domínio: a última faixa é aberta', () => {
    expect(enc.faixas.at(-1)!.ate).toBe(Infinity);
  });
});

describe('overhead — nem 10%, nem monotônico', () => {
  it('a faixa real nos lances deste evento vai de ~15% a 35%', () => {
    // O card do site diz "+10%" em todos os 61 lotes. Nunca é 10%.
    expect(calcularCusto(500, cfg).total).toBeCloseTo(675, 2);
    expect(calcularCusto(500, cfg).overhead).toBeCloseTo(0.35, 3);

    expect(calcularCusto(4990, cfg).total).toBeCloseTo(5739, 2);
    expect(calcularCusto(4990, cfg).overhead).toBeCloseTo(0.15, 3);

    expect(calcularCusto(6980, cfg).total).toBeCloseTo(8178, 2);
    expect(calcularCusto(6980, cfg).overhead).toBeCloseTo(0.1717, 3);
  });

  it('overhead NÃO cai sempre com o lance — o degrau o faz subir', () => {
    // Refuta "quanto maior o lote, sempre melhor". O ponto ótimo é o topo de uma faixa.
    const antes = calcularCusto(4990, cfg).overhead;
    const depois = calcularCusto(5200, cfg).overhead;
    expect(depois).toBeGreaterThan(antes);
  });

  it('lote barato segue proporcionalmente pior, mas 35% e não 60%', () => {
    // A versão anterior do código dizia 60% porque aplicava R$ 250 num lance de R$ 500.
    expect(calcularCusto(500, cfg).overhead).toBeLessThan(0.4);
    expect(calcularCusto(500, cfg).overhead).toBeGreaterThan(
      calcularCusto(4990, cfg).overhead * 2,
    );
  });
});

describe('degrauProximo — cruzar a faixa custa caro por um centavo', () => {
  it('de 4.999,99 para 5.000,00 o custo salta R$ 250', () => {
    const d = degrauProximo(4990, enc);
    expect(d).toEqual({ limite: 4999.99, salto: 250 });
    const salto = calcularCusto(5000, cfg).total - calcularCusto(4999.99, cfg).total;
    expect(salto).toBeCloseTo(250.01, 2);
  });

  it('de 999,99 para 1.000 salta R$ 125', () => {
    expect(degrauProximo(800, enc)).toEqual({ limite: 999.99, salto: 125 });
  });

  it('de 29.999,99 para 30.000 salta R$ 500', () => {
    expect(degrauProximo(20000, enc)).toEqual({ limite: 29999.99, salto: 500 });
  });

  it('na última faixa não há degrau acima', () => {
    expect(degrauProximo(500000, enc)).toBeNull();
  });
});

describe('martelaDoTeto — inversão sobre uma função em degraus', () => {
  it('divide pelo percentual e desconta a faixa certa', () => {
    // Teto de custo 2.000 cai na faixa de 250: (2000 − 250) / 1,10 = 1.590,91
    const teto = martelaDoTeto(2000, enc, 0);
    expect(teto).toBeCloseTo(1590.91, 2);

    expect(teto).not.toBeCloseTo(1666.67, 2); // usou os 5% da API
    expect(teto).not.toBeCloseTo(1575.0, 2); // subtraiu 10% em vez de dividir
    expect(teto).not.toBeCloseTo(1818.18, 2); // esqueceu o encargo da faixa
  });

  it('escolhe a faixa certa quando o orçamento fica em cima de uma fronteira', () => {
    // Orçamento 6.000: na faixa de 500 daria (6000−500)/1,1 = 5.000, que é válido ali.
    // Na faixa de 250 daria (6000−250)/1,1 = 5.227, que NÃO é válido (passa de 4.999,99),
    // então limita a 4.999,99 — e 5.000 é maior, logo ganha.
    const teto = martelaDoTeto(6000, enc, 0);
    expect(teto).toBeCloseTo(5000, 2);
    expect(calcularCusto(teto, cfg).total).toBeLessThanOrEqual(6000 + 0.01);
  });

  it('orçamento apertado usa a faixa barata em vez de devolver zero', () => {
    // 600 de orçamento: (600 − 50)/1,1 = 500, mas 500 já está na faixa de 125.
    // Limitado a 499,99, cujo custo é 499,99×1,1 + 50 = 599,99 ✓
    const teto = martelaDoTeto(600, enc, 0);
    expect(teto).toBeCloseTo(499.99, 2);
    expect(calcularCusto(teto, cfg).total).toBeLessThanOrEqual(600.01);
  });

  it('devolve 0 quando nem a menor faixa cabe', () => {
    expect(martelaDoTeto(40, enc, 0)).toBe(0);
    expect(martelaDoTeto(0, enc, 0)).toBe(0);
  });

  it('ida e volta: o teto no martelo nunca estoura o teto de custo', () => {
    // A propriedade que garante que o teto não autoriza lance impagável — vale em toda
    // faixa da tabela, não só na de R$ 250.
    for (const t of [300, 600, 1000, 2000, 3561, 4056, 6000, 12000, 40000, 120000, 400000]) {
      const martelo = martelaDoTeto(t, enc, 0);
      if (martelo > 0) {
        expect(calcularCusto(martelo, cfg).total).toBeLessThanOrEqual(t + 0.01);
      }
    }
  });

  it('mais orçamento nunca dá teto menor', () => {
    let anterior = 0;
    for (const t of [600, 1000, 2000, 6000, 12000, 40000, 200000]) {
      const teto = martelaDoTeto(t, enc, 0);
      expect(teto).toBeGreaterThanOrEqual(anterior);
      anterior = teto;
    }
  });
});

describe('ultimoLanceValido — o incremento é grosso, o teto não é linha contínua', () => {
  it('lance 2.130, incremento 200, teto 2.666 → 2.530', () => {
    expect(ultimoLanceValido(2130, 200, 2666, true)).toBe(2530);
  });

  it('quando o próximo lance já estoura, responde "não cobre" e não um número', () => {
    expect(ultimoLanceValido(2130, 200, 2300, true)).toBeNull();
  });

  it('lote sem lances: o próprio valor inicial é lance válido', () => {
    expect(ultimoLanceValido(1530, 200, 1600, false)).toBe(1530);
    expect(ultimoLanceValido(1530, 200, 1400, false)).toBeNull();
  });

  it('o resultado é sempre múltiplo do incremento a partir do lance', () => {
    const r = ultimoLanceValido(2130, 200, 5000, true);
    expect(r).not.toBeNull();
    expect((r! - 2130) % 200).toBe(0);
    expect(r!).toBeLessThanOrEqual(5000);
  });

  it('rejeita incremento inválido', () => {
    expect(() => ultimoLanceValido(1000, 0, 2000, true)).toThrow(RangeError);
  });
});

describe('frete entra no teto e marca o custo como incompleto', () => {
  it('sem frete informado o custo se declara incompleto', () => {
    expect(calcularCusto(1000, cfg).completo).toBe(false);
  });

  it('com frete informado o teto cai e o custo fica completo', () => {
    const comFrete: Config = { ...cfg, freteporLote: 150, freteInformado: true };
    const c = calcularCusto(1000, comFrete);
    expect(c.completo).toBe(true);
    expect(c.total).toBeCloseTo(1500, 2); // 1000 + 100 + 250 + 150
    expect(martelaDoTeto(2000, enc, 150)).toBeLessThan(martelaDoTeto(2000, enc, 0));
  });
});
