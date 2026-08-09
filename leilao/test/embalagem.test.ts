import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, type Config } from '../src/config.ts';
import { classificarLinha, compor, reconciliarComTitulo } from '../src/analise/embalagem.ts';
import { lerManifesto } from '../src/superbid/manifesto.ts';
import { parsearEvento } from '../src/superbid/api.ts';
import { daTitulo } from '../src/analise/quantidade.ts';
import { avaliar } from '../src/analise/teto.ts';
import { calcularCusto } from '../src/analise/custo.ts';
import { aplicar } from '../src/analise/valor.ts';

/**
 * A distinção que faz o "custo por item" significar alguma coisa.
 *
 * Ela nasceu de uma correção do operador. Eu havia lido a divergência entre o título e a soma da
 * coluna quantidade como inflação do anúncio, e publiquei que o lote 11 declarava 283 itens tendo
 * 28 — "o pior lote se passando pelo melhor". Ele apontou o que eu não tinha visto: **uma linha
 * com quantidade 1 e a contagem escrita na descrição.** 27 nomeados + 256 na caixa = 283, exato.
 * O vendedor é preciso; a métrica estava errada.
 */
const cfg: Config = { ...CONFIG_PADRAO, freteporLote: 150, freteInformado: true };

const evento = parsearEvento(
  JSON.parse(readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8')),
  'UTC',
);

describe('classificarLinha — caixa de diversos contra kit comercial', () => {
  it('a linha do lote 11: uma caixa com ~256 suplementos, e a coluna diz 1', () => {
    const d =
      'APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS ALWAYSFIT, MAX HEYLLAIR, VELMO BLACK, SUPER COFFEE, VIT';
    const r = classificarLinha(d, 1);
    expect(r.tipo).toBe('caixa-diversos');
    expect(r.internos).toBe(256);
  });

  it('a quebra de linha do PDF no meio de "APROXIMADAMENTE" não engana', () => {
    // O extrator devolve "APROXIMADAMENT E 264 ITENS" em vários manifestos deste evento.
    const r = classificarLinha('APROXIMADAMENT E 264 ITENS DIVERSOS (PAPELARIA/UTENSÍLIOS DOMESTICOS/LIVROS)', 1);
    expect(r.tipo).toBe('caixa-diversos');
    expect(r.internos).toBe(264);
  });

  const kits: [string, number][] = [
    ['Faqueiro Viena 30 Peças Wolff - Inox', 1],
    ['Jogo de Panelas Brinox Antiaderente Ceramic Life 10 Peças Nevada', 1],
    ['Quebra-Cabeça 1000 peças Mapa Ilustrado Brasília', 1],
    ['MATERIAL DOURADO MADEIRA 2922 - 111 PCS - UN - PAIS E FILHOS', 1],
    ['APARELHO DE JANTAR 20 PÇS ALLEANZA', 1],
    ['KIT MALETA DE FERRAMENTAS 216 PÇS JOGO DE CHAVE CATRACA SOQUETE', 1],
    ['Palito de Madeira Ponta Redonda Natural 11.5cm Theoto (100 unidades)', 1],
  ];
  for (const [d, q] of kits) {
    it(`kit conta 1 produto, não N peças: ${d.slice(0, 44)}`, () => {
      const r = classificarLinha(d, q);
      expect(r.tipo).toBe('kit');
      expect(r.internos).toBe(0);
    });
  }

  it('sem contagem no texto é linha comum', () => {
    expect(classificarLinha('AIR FRYER BRITANIA 5,5 LITROS', 2).tipo).toBe('unitario');
    expect(classificarLinha('Martelete Rompedor Bosch Gbh 2-24d 820w', 1).tipo).toBe('unitario');
  });

  it('kit com quantidade > 1 conta a COLUNA, não a contagem do texto', () => {
    // "3 × JOGO CANECAS BRANCAS 12 UN" são 3 jogos vendáveis, não 36 canecas soltas. O rótulo
    // pode sair `kit` ou `unitario` dependendo do limiar — o que não pode variar é a contagem.
    const r = classificarLinha('JOGO CANECAS BRANCAS 12 UN', 3);
    expect(r.itens).toBe(3);
    expect(r.internos).toBe(0);
  });

  it('contagem grande sem marcador nenhum cai em kit — o lado conservador', () => {
    // Inflar o divisor derruba o R$/item e LEVANTA o teto. Teto alto é o erro que custa dinheiro;
    // subestimar só faz perder um lote.
    const r = classificarLinha('ALGUMA COISA 400 PECAS', 1);
    expect(r.tipo).toBe('kit');
    expect(r.itens).toBe(1);
  });
});

describe('compor — os números reais dos manifestos deste evento', () => {
  // O cache dos 57 PDFs não vai para o repo (material do vendedor); o manifesto versionado como
  // fixture é o do lote 3, e é o que trava os números aqui.
  const manifesto = (_n: number) =>
    lerManifesto(new URL('../recon/fixtures/manifesto-lote3-SB0032812.pdf', import.meta.url).pathname);

  it('lote 3 (o manifesto versionado): 304 unidades, nenhuma caixa de diversos', async () => {
    const m = await manifesto(3);
    const c = compor(m.itens);
    // 71 itens somando 304 — o mesmo "APROX. 304 UN" do título, e sem caixa fechada.
    expect(c.volumeEmCaixa).toBe(0);
    expect(c.itensNomeados).toBe(304);
    expect(c.total).toBe(304);
    expect(c.fracaoEmCaixa).toBe(0);
  });

  it('lote 3 reconcilia com o título', async () => {
    const m = await manifesto(3);
    const r = reconciliarComTitulo(compor(m.itens), daTitulo(evento.lotes.find((l) => l.numero === 3)!.titulo).valor);
    expect(r?.tipo).toBe('confere');
  });
});

describe('compor — sintético, cobrindo os dois casos juntos', () => {
  const it_ = (descricao: string, quantidade: number) => ({ descricao, quantidade, ref: 'SB1' });

  it('separa nomeados de volume em caixa e conta kit como 1', () => {
    const c = compor([
      it_('AIR FRYER BRITANIA 5,5 LITROS', 2),
      it_('Faqueiro Viena 30 Peças Wolff', 1),
      it_('APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS ALWAYSFIT', 1),
    ]);
    expect(c.itensNomeados).toBe(3); // 2 air fryers + 1 faqueiro
    expect(c.volumeEmCaixa).toBe(256);
    expect(c.total).toBe(259);
    expect(c.linhasKit).toBe(1);
    expect(c.caixas).toHaveLength(1);
    expect(c.fracaoEmCaixa).toBeCloseTo(256 / 259, 3);
  });

  it('o kit NÃO infla o total — é o que impede o lote 42 virar 5.556 unidades', () => {
    // Seis caixas de 5.000 grampos: contar as peças daria 30 mil "itens" e um R$/item de ficção.
    const comKits = compor([it_('GRAMPO GALVANIZADO SPIRAL 26/6 - 5000 UN', 6)]);
    expect(comKits.total).toBe(6);
  });

  it('reconciliação: título que conta peças dentro de embalagem é sinalizado', () => {
    // Caso do lote 41: declara 799 e o manifesto lista 291, porque o título conta parafuso por
    // parafuso ("6 × 500 PARAFUSO") e folha por folha ("17 × PAPEL SULFITE 500 FOLHAS").
    const c = compor([it_('PARAFUSO CHIPBOARD CABEÇA CHATA 4,0X40MM', 6)]);
    const r = reconciliarComTitulo(c, 3000);
    expect(r?.tipo).toBe('titulo-conta-pecas');
    expect(r?.fator).toBeCloseTo(500, 0);
  });

  it('sem contagem no título, não há reconciliação a fazer', () => {
    expect(reconciliarComTitulo(compor([it_('X', 1)]), null)).toBeNull();
  });
});

describe('o efeito no teto: a composição muda o divisor, e o divisor muda o teto', () => {
  const entrada = (unidadesDeclaradas: number | null, composicao: ReturnType<typeof compor> | null) => ({
    itens: aplicar([{ descricao: 'AIR FRYER BRITANIA', quantidade: 1, ref: 'SB1' }], {}, [], []),
    categoria: 'utensilios' as const,
    lanceAtual: 1000,
    incremento: 200,
    temLances: true,
    encerrado: false,
    unidadesDeclaradas,
    composicao,
  });

  it('a base do divisor é o TÍTULO por padrão — é a conta que o operador faz', () => {
    const comp = compor([
      { descricao: 'AIR FRYER BRITANIA', quantidade: 27, ref: 'SB1' },
      { descricao: 'APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS', quantidade: 1, ref: 'SB1' },
    ]);
    const av = avaliar(entrada(283, comp), cfg);
    expect(cfg.regra.base).toBe('titulo');
    expect(av.divisorDaRegra).toBe(283);
    expect(av.itensNomeados).toBe(27);
    expect(av.volumeEmCaixa).toBe(256);
    expect(av.fracaoEmCaixa).toBeCloseTo(256 / 283, 2);
  });

  it('as duas leituras de R$/item aparecem, e é o contraste que denuncia o lote', () => {
    const comp = compor([
      { descricao: 'AIR FRYER BRITANIA', quantidade: 27, ref: 'SB1' },
      { descricao: 'APROXIMADAMENTE 256 ITENS SUPLEMENTO DIVERSOS', quantidade: 1, ref: 'SB1' },
    ]);
    const av = avaliar(entrada(283, comp), cfg);
    const custo = calcularCusto(1000, cfg).total;
    expect(av.custoPorItemTitulo).toBeCloseTo(custo / 283, 4);
    expect(av.custoPorItemNomeado).toBeCloseTo(custo / 27, 4);
    // ~10× de diferença: é o número que o operador precisa ver, e o que a regra sozinha esconde.
    expect(av.custoPorItemNomeado! / av.custoPorItemTitulo!).toBeGreaterThan(9);
  });

  it('sem composição, a camada 0 se apoia só no título — e não finge ter mais', () => {
    const av = avaliar(entrada(283, null), cfg);
    expect(av.itensNomeados).toBe(0);
    expect(av.custoPorItemNomeado).toBeNull();
    expect(av.custoPorItemTitulo).not.toBeNull();
    expect(av.tetoPorRegra).toBeGreaterThan(0);
  });
});

describe('o evento inteiro: a inversão do painel', () => {
  it('o teto pela regra existe para praticamente todos os lotes, sem preço nenhum', async () => {
    // A asserção da inversão. Antes desta mudança, `estudo --fixture` sem --precos dava ZERO
    // lotes com teto utilizável e 33 em "PRECIFIQUE"; a ferramenta só servia depois de
    // precificar 1.900 descrições.
    const semManifesto = evento.lotes.filter((l) => l.anexos.length === 0).length;
    expect(semManifesto).toBe(4); // lotes 2, 5, 16 e 26, todos de cosmético/limpeza

    let comTetoPorRegra = 0;
    for (const lote of evento.lotes) {
      const av = avaliar(
        {
          itens: [],
          categoria: 'outros',
          lanceAtual: lote.lance,
          incremento: lote.incremento,
          temLances: lote.temLances,
          encerrado: lote.encerrado,
          unidadesDeclaradas: daTitulo(lote.titulo).valor,
        },
        cfg,
      );
      if (av.tetoPorRegra > 0) comTetoPorRegra++;
    }
    // Só os lotes cujo título não declara quantidade ficam de fora.
    expect(comTetoPorRegra).toBeGreaterThanOrEqual(55);
  });
});
