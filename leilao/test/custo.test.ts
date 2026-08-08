import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import { calcularCusto, martelaDoTeto, ultimoLanceValido } from '../src/analise/custo.ts';

const cfg = CONFIG_PADRAO;

describe('custo — ancorado no diálogo real do BidTV', () => {
  it('lance 3.460 dá encargos 596,00 e total 4.056,00', () => {
    // Print do diálogo "Confirmar lance", lote 5 (SB0032795):
    //   Valor do lance                     R$ 3.460,00
    //   Subtotal dos encargos e comissões  R$   596,00
    //   Valor total previsto               R$ 4.056,00
    const c = calcularCusto(3460, cfg);
    expect(c.encargos).toBeCloseTo(596, 2);
    expect(c.total).toBeCloseTo(4056, 2);
  });

  it('a taxa fixa de R$ 250 devora lote barato — overhead real vai de 13,6% a 60%', () => {
    // A etiqueta do card diz "+10%" em todos os 61 lotes. É enganosa.
    expect(calcularCusto(500, cfg).total).toBeCloseTo(800, 2);
    expect(calcularCusto(500, cfg).overhead).toBeCloseTo(0.60, 3);

    expect(calcularCusto(6980, cfg).total).toBeCloseTo(7928, 2);
    expect(calcularCusto(6980, cfg).overhead).toBeCloseTo(0.1358, 3);

    // O lote de R$ 500 custa proporcionalmente 4x mais que o de R$ 6.980.
    expect(calcularCusto(500, cfg).overhead).toBeGreaterThan(
      calcularCusto(6980, cfg).overhead * 4,
    );
  });

  it('nunca usa os 5% que a API informa', () => {
    // groupOffer.commissionPercent = 5 subestima o encargo em mais da metade.
    expect(cfg.encargos.percentual).toBe(0.10);
    expect(calcularCusto(3460, cfg).encargos).not.toBeCloseTo(3460 * 0.05, 2);
  });

  it('rejeita lance negativo em vez de devolver número sem sentido', () => {
    expect(() => calcularCusto(-1, cfg)).toThrow(RangeError);
  });
});

describe('martelaDoTeto — os três erros possíveis, os três travados', () => {
  it('divide pelo percentual e subtrai a taxa fixa antes', () => {
    const teto = martelaDoTeto(2000, cfg.encargos, 0);
    expect(teto).toBeCloseTo(1590.91, 2); // (2000 − 250) / 1,10

    expect(teto).not.toBeCloseTo(1666.67, 2); // usou os 5% da API
    expect(teto).not.toBeCloseTo(1575.0, 2); // subtraiu 10% em vez de dividir
    expect(teto).not.toBeCloseTo(1818.18, 2); // esqueceu o R$ 250
  });

  it('devolve 0 quando a taxa fixa já consome o teto inteiro', () => {
    expect(martelaDoTeto(200, cfg.encargos, 0)).toBe(0);
    expect(martelaDoTeto(0, cfg.encargos, 0)).toBe(0);
  });

  it('ida e volta: o teto no martelo, custado de novo, não passa do teto de custo', () => {
    for (const tetoCusto of [500, 1000, 2236.5, 4056, 10000]) {
      const martelo = martelaDoTeto(tetoCusto, cfg.encargos, 0);
      if (martelo > 0) {
        expect(calcularCusto(martelo, cfg).total).toBeLessThanOrEqual(tetoCusto + 0.01);
      }
    }
  });
});

describe('ultimoLanceValido — o incremento é grosso, o teto não é linha contínua', () => {
  it('lance 2.130, incremento 200, teto 2.666 → 2.530', () => {
    // Válidos: 2.330 e 2.530. O 2.730 estoura.
    expect(ultimoLanceValido(2130, 200, 2666, true)).toBe(2530);
  });

  it('quando o próximo lance já estoura, responde "não cobre" e não um número', () => {
    // Lance 2.130 + 200 = 2.330 > 2.300.
    expect(ultimoLanceValido(2130, 200, 2300, true)).toBeNull();
  });

  it('lote sem lances: o próprio valor inicial é lance válido', () => {
    // Não se soma incremento a um lote que ninguém pediu ainda.
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
    expect(calcularCusto(1000, comFrete).completo).toBe(true);
    expect(calcularCusto(1000, comFrete).total).toBeCloseTo(1500, 2); // 1000 + 350 + 150
    expect(martelaDoTeto(2000, cfg.encargos, 150)).toBeLessThan(
      martelaDoTeto(2000, cfg.encargos, 0),
    );
  });
});
