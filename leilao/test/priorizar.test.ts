import { describe, expect, it } from 'vitest';
import { classeValor, especificidade, priorizar } from '../src/analise/valor.ts';
import type { ItemManifesto } from '../src/analise/faixa.ts';

const it_ = (descricao: string, quantidade: number): ItemManifesto => ({
  descricao,
  quantidade,
  ref: 'SB1',
});

describe('classeValor — ordem de magnitude, não preço', () => {
  it('ferramenta elétrica e eletrodoméstico grande ficam no topo', () => {
    expect(classeValor('Martelete Rompedor Bosch Gbh 2-24d 820w')).toBe(5);
    expect(classeValor('MICROONDAS PHILCO 127V BRANCO')).toBe(5);
  });

  it('consumível fica no fundo', () => {
    expect(classeValor('Copo de Plástico Descartável PS Branco 50ml')).toBe(1);
    expect(classeValor('Papel Sulfite A4 Branco 75g 500 Folhas')).toBe(1);
    expect(classeValor('Vela 7 Dias 250 Gramas')).toBe(1);
    expect(classeValor('Lâmina para Estilete Largo 18mm')).toBe(1);
  });

  it('desconhecido cai no meio, não nos extremos', () => {
    expect(classeValor('BUGIGANGA INDEFINIDA XYZ')).toBe(2);
  });
});

describe('especificidade — separa produto de genérico sem saber preço', () => {
  it('marca e modelo sobem o score', () => {
    expect(especificidade('Martelete Rompedor Bosch Gbh 2-24d 820w Com Maleta')).toBeGreaterThan(
      especificidade('FERRAMENTA'),
    );
  });

  it('"DIVERSOS" derruba o score', () => {
    expect(especificidade('ROUPAS DIVERSAS')).toBeLessThan(especificidade('CALÇA ADIDAS'));
  });
});

describe('priorizar — o bug que a primeira versão tinha', () => {
  it('um martelete de 1 unidade vence 100 copos descartáveis', () => {
    // Quantidade dominando o ranking enchia a lista de consumível barato. Preço unitário
    // varia três ordens de grandeza; quantidade, só uma.
    const linhas = priorizar(
      new Map([
        [1, [it_('Copo de Plástico Descartável PS Branco 50ml', 100)]],
        [2, [it_('Martelete Rompedor Bosch Gbh 2-24d 820w Com Maleta', 1)]],
      ]),
    );
    expect(linhas[0]!.descricao).toContain('Martelete');
  });

  it('soma quantidade da mesma descrição entre lotes e registra onde aparece', () => {
    const linhas = priorizar(
      new Map([
        [3, [it_('HAVAIANAS DIVERSAS', 40)]],
        [12, [it_('havaianas diversas', 30)]],
        [40, [it_('HAVAIANAS  DIVERSAS', 40)]],
      ]),
    );
    expect(linhas).toHaveLength(1);
    expect(linhas[0]!.unidadesTotais).toBe(110);
    expect(linhas[0]!.lotes).toEqual([3, 12, 40]);
  });

  it('aparecer em vários lotes sobe o impacto — precificar destrava vários tetos', () => {
    const um = priorizar(new Map([[1, [it_('Travessa Retangular Coza Uno', 12)]]]));
    const varios = priorizar(
      new Map([
        [1, [it_('Travessa Retangular Coza Uno', 4)]],
        [2, [it_('Travessa Retangular Coza Uno', 4)]],
        [3, [it_('Travessa Retangular Coza Uno', 4)]],
      ]),
    );
    // Mesmas 12 unidades no total, mas espalhadas em 3 lotes.
    expect(varios[0]!.unidadesTotais).toBe(um[0]!.unidadesTotais);
    expect(varios[0]!.impacto).toBeGreaterThan(um[0]!.impacto);
  });

  it('faixa C vai para o fim sem sair da lista', () => {
    const linhas = priorizar(
      new Map([
        [1, [it_('MASCARA DE GATINHO', 60), it_('AIR FRYER BRITANIA 5,5 LITROS', 1)]],
      ]),
    );
    expect(linhas[0]!.descricao).toContain('AIR FRYER');
    expect(linhas.at(-1)!.faixa).toBe('C');
    expect(linhas).toHaveLength(2);
  });

  it('ordem é estável, para reabrir o arquivo e continuar de onde parou', () => {
    const entrada = new Map([[1, [it_('A B C', 5), it_('D E F', 5), it_('G H I', 5)]]]);
    const a = priorizar(entrada).map((l) => l.chave);
    const b = priorizar(entrada).map((l) => l.chave);
    expect(a).toEqual(b);
  });
});
