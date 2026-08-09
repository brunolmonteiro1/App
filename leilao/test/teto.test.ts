import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import { avaliar } from '../src/analise/teto.ts';
import { calcularCusto } from '../src/analise/custo.ts';
import { aplicar } from '../src/analise/valor.ts';
import { montarUrl, parsearEvento } from '../src/superbid/api.ts';
import { gerarPagina } from '../src/estudo/pagina.ts';
import { detectar } from '../src/analise/categoria.ts';
import type { ItemAvaliado } from '../src/analise/faixa.ts';

const cfg: Config = { ...CONFIG_PADRAO, freteporLote: 0, freteInformado: true };

function item(descricao: string, quantidade: number, preco: number | null, faixa: 'A' | 'B' | 'C'): ItemAvaliado {
  return { descricao, quantidade, ref: 'SB1', faixa, precoOnline: preco, fontePreco: 'manual' };
}

const entrada = (itens: ItemAvaliado[], over: Partial<Parameters<typeof avaliar>[0]> = {}) => ({
  itens,
  categoria: 'utensilios' as const,
  lanceAtual: 1000,
  incremento: 200,
  temLances: true,
  encerrado: false,
  unidadesDeclaradas: 100,
  ...over,
});

describe('teto — item da faixa C não pode mover o resultado', () => {
  it('mudar a quantidade de um item irrisório não altera o teto', () => {
    const base = [item('air fryer', 1, 350, 'A'), item('mascara de gatinho', 60, null, 'C')];
    const inflado = [item('air fryer', 1, 350, 'A'), item('mascara de gatinho', 600, null, 'C')];

    const a = avaliar(entrada(base), cfg);
    const b = avaliar(entrada(inflado), cfg);

    expect(b.tetoSeguro).toBe(a.tetoSeguro);
    expect(b.tetoMaximo).toBe(a.tetoMaximo);
    // Mas o volume de bazar cresce: é upside registrado, não pago.
    expect(b.volumeBazar).toBe(600);
    expect(b.unidadesEfetivas).toBe(1);
  });

  it('item da faixa C com preço continua valendo zero — decisão do operador', () => {
    const comPreco = aplicar([{ descricao: 'MASCARA DE GATINHO', quantidade: 60, ref: 'SB1' }], {
      'mascara de gatinho': { preco: 5, faixa: 'C' },
    });
    expect(comPreco[0]!.precoOnline).toBeNull();
    expect(avaliar(entrada(comPreco), cfg).valorOnline).toBe(0);
  });
});

describe('teto — a cadeia inteira do cálculo', () => {
  it('lote pequeno TEM teto — a faixa barata da tabela é R$ 50, não R$ 250', () => {
    const av = avaliar(entrada([item('x', 10, 100, 'A')]), cfg);
    // 1000 × (1 − 0,15) = 850 ; × 0,40 = 340 ; ÷ 2,0 = 170 de teto de custo
    expect(av.valorOnline).toBe(1000);
    expect(av.valorRealizadoMin).toBeCloseTo(340, 2);

    // Com R$ 250 aplicado a tudo, (170 − 250) dava negativo e o lote saía SEM TETO —
    // rejeitado por engano. Um lance de R$ 109 cai na faixa de R$ 50:
    //   (170 − 50) / 1,10 = 109,09  →  custo 120 + 50 = 170 ✓
    expect(av.tetoSeguro).toBeCloseTo(109.09, 2);
  });

  it('lote grande: cruzar para a faixa de R$ 500 derruba o teto', () => {
    const av = avaliar(entrada([item('x', 100, 400, 'A')]), cfg);
    // 40.000 × 0,85 = 34.000 ; × 0,40 = 13.600 ; ÷ 2,0 = 6.800 de teto de custo
    //
    // Na faixa de 250 o candidato seria (6.800 − 250)/1,10 = 5.954,55 — mas isso passa de
    // 4.999,99, então já não é a faixa dele. Na faixa de 500:
    //   (6.800 − 500) / 1,10 = 5.727,27  →  custo 6.300 + 500 = 6.800 ✓
    expect(av.tetoSeguro).toBeCloseTo(5727.27, 2);
    expect(av.tetoSeguro).not.toBeCloseTo(5954.55, 2); // o valor da taxa fixa, errado
    expect(av.tetoMaximo).toBeCloseTo(8818.18, 2);
  });

  it('sem preço nenhum não inventa teto POR VALOR', () => {
    const av = avaliar(entrada([item('x', 10, null, 'A')]), cfg);
    expect(av.valorOnline).toBe(0);
    expect(av.tetoSeguro).toBe(0);
    // O teto que aparece é o da regra de R$/item, e a tela diz isso.
    expect(av.baseDoTeto).toBe('regra');
    expect(av.tetoOperante).toBe(av.tetoPorRegra);
  });

  it('sem preço E sem contagem de itens, aí sim não há de onde tirar teto', () => {
    // É o único `sem-teto` que sobra: nada no título e nada precificado.
    const av = avaliar(entrada([item('x', 10, null, 'A')], { unidadesDeclaradas: null }), cfg);
    expect(av.semaforo).toBe('sem-teto');
    expect(av.baseDoTeto).toBe('nenhum');
    expect(av.tetoOperante).toBe(0);
    expect(av.lanceSugerido).toBeNull();
  });

  it('lote encerrado não sugere lance', () => {
    const av = avaliar(entrada([item('x', 100, 400, 'A')], { encerrado: true }), cfg);
    expect(av.semaforo).toBe('encerrado');
    expect(av.lanceSugerido).toBeNull();
  });
});

describe('semáforo pelo caminho do VALOR de revenda', () => {
  const itens = [item('x', 100, 400, 'A')]; // teto seguro 5.727,27 / máximo 8.818,18

  /**
   * `unidadesDeclaradas: 3000` põe o teto da regra de R$/item bem acima do teto por valor, para
   * isolar o caminho do valor. Com as 100 unidades originais a regra é que apertaria primeiro —
   * um lance de R$ 5.000 em 100 itens é R$ 63/item, cinco vezes o limite do operador — e o teste
   * mediria a regra achando que mede o valor.
   */
  const soValor = (lanceAtual: number) =>
    avaliar(entrada(itens, { lanceAtual, unidadesDeclaradas: 3000 }), cfg);

  it('o teto por valor é o que governa quando a regra não aperta', () => {
    const av = soValor(5000);
    expect(av.baseDoTeto).toBe('ambos');
    // Limite duro = teto máximo por valor (60%); confortável = teto seguro (40%).
    expect(av.tetoOperante).toBeCloseTo(av.tetoMaximo, 2);
    expect(av.tetoConfortavel).toBeCloseTo(av.tetoSeguro, 2);
    expect(av.tetoPorRegra).toBeGreaterThan(av.tetoMaximo);
  });

  it('verde quando o próximo lance ainda cabe no teto seguro', () => {
    expect(soValor(5000).semaforo).toBe('verde');
  });

  it('amarelo entre o teto seguro e o máximo', () => {
    expect(soValor(7000).semaforo).toBe('amarelo');
  });

  it('vermelho acima do teto máximo', () => {
    expect(soValor(9500).semaforo).toBe('vermelho');
  });

  it('cobrir custa um degrau acima: lance colado no teto já vira amarelo', () => {
    // 5.900 + 200 = 6.100 > 5.727,27, então cobrir já sai da zona segura.
    expect(soValor(5900).semaforo).toBe('amarelo');
  });
});

/**
 * O caminho que o operador usa de verdade, e o único que funciona no dia do pregão sem trabalho
 * prévio: *"eu divido valor total final pelo total de itens na descrição, não costuma passar de
 * 15 reais por item"*.
 */
describe('semáforo pela REGRA de R$/item — funciona sem preço nenhum', () => {
  const semPreco = [item('x', 100, null, 'A')];
  const pelaRegra = (lanceAtual: number, unidadesDeclaradas = 300) =>
    avaliar(entrada(semPreco, { lanceAtual, unidadesDeclaradas }), cfg);

  it('300 itens × R$ 15 = R$ 4.500 de custo máximo, e o teto sai disso', () => {
    const av = pelaRegra(1000);
    expect(av.baseDoTeto).toBe('regra');
    // Invertendo os encargos: o custo do teto não pode passar do limite.
    const custo = calcularCusto(av.tetoPorRegra, cfg).total;
    expect(custo).toBeLessThanOrEqual(15 * 300 + 0.01);
    expect(av.divisorDaRegra).toBe(300);
  });

  it('verde é o ALVO de R$ 12/item, não o máximo de R$ 15', () => {
    // Verde só quando há folga: o alvo é onde ele costuma comprar (R$ 10–14 no histórico).
    const custoAlvo = calcularCusto(pelaRegra(1000).tetoPorRegra, cfg).total;
    expect(custoAlvo / 300).toBeLessThanOrEqual(15);

    // Um lance que sai a ~R$ 9/item: dentro do alvo → verde.
    expect(pelaRegra(2200).semaforo).toBe('verde');
    // ~R$ 13,5/item: passou do alvo, ainda cabe no máximo → amarelo.
    expect(pelaRegra(3500).semaforo).toBe('amarelo');
    // ~R$ 17/item: acima do limite → vermelho.
    expect(pelaRegra(4500).semaforo).toBe('vermelho');
  });

  it('o custo por item declarado é a conta que o operador faz de cabeça', () => {
    const av = pelaRegra(2200);
    expect(av.custoPorItemTitulo).toBeCloseTo(calcularCusto(2200, cfg).total / 300, 4);
  });

  it('quando os dois tetos existem, vale o MENOR', () => {
    // Valor alto e regra apertada: quem manda é a regra.
    const av = avaliar(entrada([item('x', 100, 400, 'A')], { lanceAtual: 1000, unidadesDeclaradas: 50 }), cfg);
    expect(av.baseDoTeto).toBe('ambos');
    expect(av.tetoPorRegra).toBeLessThan(av.tetoSeguro);
    expect(av.tetoOperante).toBe(av.tetoPorRegra);
  });
});

describe('integração com o evento real capturado', () => {
  const evento = parsearEvento(
    JSON.parse(
      readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8'),
    ),
  );

  it('61 lotes, ordenados por número de chamada', () => {
    expect(evento.lotes).toHaveLength(61);
    expect(evento.total).toBe(61);
    expect(evento.lotes[0]!.numero).toBe(1);
    expect(evento.lotes.at(-1)!.numero).toBe(323);
  });

  it('a prorrogação tem limite duro, 1 h após o fim do evento', () => {
    expect(evento.prorrogaAte).toBeTruthy();
    const fim = new Date(evento.encerraEm.replace(' ', 'T') + 'Z').getTime();
    const max = new Date(evento.prorrogaAte!.replace(' ', 'T') + 'Z').getTime();
    expect((max - fim) / 3_600_000).toBeCloseTo(1, 1);
  });

  it('lote sem lances traz o valor inicial, e é rotulado como tal', () => {
    const semLances = evento.lotes.filter((l) => !l.temLances);
    expect(semLances.length).toBeGreaterThan(0);
    for (const l of semLances) expect(l.lance).toBeGreaterThan(0);
  });

  it('todo lote tem incremento utilizável para o cálculo do último lance válido', () => {
    for (const l of evento.lotes) expect(l.incremento).toBeGreaterThan(0);
  });

  it('categoria é detectada para todos, e nenhuma cai fora do config', () => {
    for (const l of evento.lotes) {
      const cat = detectar(l.titulo);
      expect(CONFIG_PADRAO.categorias[cat]).toBeDefined();
    }
  });

  it('o lote 3 é vermelho: o lance atual já passou do teto que os preços de exemplo dão', () => {
    // Demonstração da tese do projeto — R$ 7,01/unidade parecia pechincha.
    const lote3 = evento.lotes.find((l) => l.numero === 3)!;
    expect(lote3.lance).toBe(2130);
    expect(lote3.incremento).toBe(200);
  });
});

describe('fuso — o bug de 3 horas que a primeira tela expôs', () => {
  it('payload em UTC é exibido no horário do pregão', () => {
    const evUtc = parsearEvento(
      JSON.parse(
        readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8'),
      ),
      'UTC',
    );
    // O payload diz 18:30; a tela do evento diz "Encerramento a partir de 15:30 (UTC−3)".
    expect(evUtc.encerraEm).toContain('18:30');
    expect(evUtc.fuso).toBe('UTC');

    const html = gerarPagina(evUtc, [], CONFIG_PADRAO, null);
    expect(html).toContain('15:30');
    // Se 18:30 aparecer no cabeçalho, o operador pensa que tem 3 h a mais.
    expect(html.split('<main')[0]).not.toContain('18:30');
  });

  it('payload já em São Paulo não é convertido de novo', () => {
    const ev = parsearEvento(
      JSON.parse(
        readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8'),
      ),
      'America/Sao_Paulo',
    );
    const html = gerarPagina(ev, [], CONFIG_PADRAO, null);
    // Dupla conversão daria 12:30.
    expect(html).toContain('18:30');
    expect(html).not.toContain('12:30');
  });

  it('o request ao vivo pede o fuso do pregão na origem', () => {
    expect(montarUrl(790754)).toContain('America%2FSao_Paulo');
  });
});
