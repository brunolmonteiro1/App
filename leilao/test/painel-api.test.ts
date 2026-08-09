import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONFIG_PADRAO } from '../src/config.ts';
import { parsearEvento } from '../src/superbid/api.ts';
import { lerManifesto } from '../src/superbid/manifesto.ts';
import type { Snapshot } from '../src/estudo/snapshot.ts';
import { gravarSnapshot } from '../src/estudo/snapshot.ts';
import { gerarPaginaPrecificar } from '../src/estudo/precificar.ts';

/**
 * A tela de precificação é a primeira parte do projeto que **grava**. Estes testes cobrem o
 * que uma tela de escrita não pode errar:
 *
 * - **mesclar, nunca substituir** — a tela manda só o lote aberto; substituir o arquivo
 *   apagaria os preços de todos os outros lotes, que é o trabalho acumulado do operador;
 * - **o teto da tela é o teto do estudo** — os dois passam pelo mesmo `avaliar()`, e o teste
 *   confere que a API devolve o mesmo número que o estudo calcula;
 * - **o portão de cobertura vale na tela também** — preço em 3 itens não pode fazer aparecer
 *   um teto na tela que o estudo se recusa a mostrar.
 */
let base: string;
let dir: string;
let arquivoPrecos: string;
let fechar: () => void;
let numeroLote: number;

const FIXTURE = new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url).pathname;
const PDF_LOTE3 = new URL('../recon/fixtures/manifesto-lote3-SB0032812.pdf', import.meta.url).pathname;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'painel-'));
  await mkdir(join(dir, 'saida'), { recursive: true });
  const saida = join(dir, 'saida');
  arquivoPrecos = join(dir, 'precos.json');

  const evento = parsearEvento(JSON.parse(await readFile(FIXTURE, 'utf8')), 'UTC');
  const manifesto = await lerManifesto(PDF_LOTE3);
  numeroLote = 3;

  const snap: Snapshot = {
    versao: 1,
    geradoEm: '2026-08-08T15:21:00Z',
    frete: 150,
    refresh: 15,
    arquivoEstudo: 'estudo.html',
    evento,
    manifestos: { [String(numeroLote)]: manifesto },
  };
  await gravarSnapshot(join(saida, 'estado.json'), snap);
  await writeFile(join(saida, 'estudo.html'), '<h1>estudo antigo</h1>');
  await writeFile(join(saida, 'precificar.html'), gerarPaginaPrecificar(evento.auctionId));
  await writeFile(arquivoPrecos, JSON.stringify({ itens: { 'chave que nao existe': { preco: 9 } } }));

  process.env.DIR_SAIDA = saida;
  process.env.ARQUIVO_PRECOS = arquivoPrecos;
  process.env.PORT = '0';
  process.env.HOST = '127.0.0.1';
  delete process.env.SENHA;

  await import('../src/servir.ts?painel=' + Date.now());
  await new Promise((r) => setTimeout(r, 400));

  const handles = (process as unknown as { _getActiveHandles(): { address?: () => unknown }[] })
    ._getActiveHandles();
  const escutando = handles.find(
    (h) => typeof h.address === 'function' && (h.address() as { port?: number })?.port,
  );
  const addr = escutando!.address!() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
  fechar = () => (escutando as unknown as { close(): void }).close();
});

afterAll(() => fechar?.());

const get = (r: string) => fetch(base + r).then((x) => x.json());
const post = (r: string, corpo: unknown) =>
  fetch(base + r, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  }).then((x) => x.json());

describe('GET /api/lotes — a lista da esquerda', () => {
  it('devolve os 61 lotes do evento', async () => {
    const j = await get('/api/lotes');
    expect(j.auctionId).toBe(790754);
    expect(j.lotes).toHaveLength(61);
  });

  it('ordena pelo R$/item declarado, deixando ignorado e sem teto no fim', async () => {
    const j = await get('/api/lotes');
    type L = { semaforo: string; custoPorItemTitulo: number | null; encerrado: boolean };
    const lotes: L[] = j.lotes;

    // Ignorado, encerrado e sem-teto afundam. Sem isto, ordenar por R$/item punha um lote de
    // cosméticos no topo — categoria que o operador não trabalha, aparecendo como a melhor
    // oportunidade do evento.
    const fora = (l: L) => l.encerrado || l.semaforo === 'ignorado' || l.semaforo === 'sem-teto';
    const primeiroFora = lotes.findIndex(fora);
    if (primeiroFora > -1) {
      expect(lotes.slice(primeiroFora).every(fora)).toBe(true);
    }

    // E entre os que decidem, ordem crescente de R$/item — a régua do operador.
    const decidem = lotes.filter((l) => !fora(l) && l.custoPorItemTitulo !== null);
    for (let i = 1; i < decidem.length; i++) {
      expect(decidem[i]!.custoPorItemTitulo!).toBeGreaterThanOrEqual(decidem[i - 1]!.custoPorItemTitulo!);
    }
  });

  it('conta as descrições já precificadas', async () => {
    const j = await get('/api/lotes');
    expect(j.precificados).toBe(1);
  });
});

describe('GET /api/lote — os itens de um lote', () => {
  it('agrupa por descrição, para não haver dois campos gravando na mesma chave', async () => {
    const j = await get(`/api/lote?n=${numeroLote}`);
    const chaves = j.itens.map((i: { chave: string }) => i.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('soma a quantidade das linhas agrupadas', async () => {
    const j = await get(`/api/lote?n=${numeroLote}`);
    const soma = j.itens.reduce((s: number, i: { quantidade: number }) => s + i.quantidade, 0);
    // O manifesto do lote 3 soma 304 unidades — o mesmo "APROX. 304 UN" do título.
    expect(soma).toBe(304);
  });

  it('traz a categoria, o múltiplo e a perda que entram na conta', async () => {
    const j = await get(`/api/lote?n=${numeroLote}`);
    expect(j.multiplo).toBeGreaterThan(0);
    expect(j.perda).toBeGreaterThanOrEqual(0);
    expect(typeof j.categoria).toBe('string');
  });

  it('lote que não existe dá erro explicado, não 500 mudo', async () => {
    const r = await fetch(base + '/api/lote?n=99999');
    expect(r.status).toBe(400);
    expect((await r.json()).erro).toMatch(/não existe/);
  });
});

describe('POST /api/simular — o teto ao vivo, sem gravar', () => {
  it('preço em poucos itens não produz teto POR VALOR: a tela cai na regra de R$/item', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens.find((i: { faixa: string }) => i.faixa !== 'C')!;
    const j = await post('/api/simular', { lote: numeroLote, itens: { [um.chave]: { preco: 100 } } });
    // É a regressão perigosa: teto por valor calculado sobre 2% dos itens sai baixo e lê como
    // "lote caro" quando significa "ainda não sei". O portão continua, e o que aparece na tela
    // é o teto pela regra do operador, rotulado como tal.
    expect(j.av.baseDoTeto).toBe('regra');
    expect(j.av.tetoOperante).toBe(j.av.tetoPorRegra);
  });

  it('precificando o lote inteiro, aparece teto de verdade', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const itens: Record<string, { preco: number }> = {};
    for (const i of lote.itens) if (i.faixa !== 'C') itens[i.chave] = { preco: 50 };
    const j = await post('/api/simular', { lote: numeroLote, itens });
    expect(['verde', 'amarelo', 'vermelho']).toContain(j.av.semaforo);
    expect(j.av.tetoSeguro).toBeGreaterThan(0);
    expect(j.av.cobertura).toBe(1);
  });

  it('não grava nada em disco', async () => {
    const antes = await readFile(arquivoPrecos, 'utf8');
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens[0];
    await post('/api/simular', { lote: numeroLote, itens: { [um.chave]: { preco: 777 } } });
    expect(await readFile(arquivoPrecos, 'utf8')).toBe(antes);
  });

  it('aceita preço com vírgula, que é como a tela em pt-BR manda', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens.find((i: { faixa: string }) => i.faixa !== 'C')!;
    const j = await post('/api/simular', {
      lote: numeroLote,
      itens: { [um.chave]: { preco: '12,50' } },
    });
    const item = j.itens.find((i: { chave: string }) => i.chave === um.chave);
    expect(item.subtotal).toBeCloseTo(um.quantidade * 12.5 * (item.faixa === 'B' ? CONFIG_PADRAO.fatorB : 1), 5);
  });

  it('faixa C entra valendo zero, mesmo com preço digitado', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const c = lote.itens.find((i: { faixa: string }) => i.faixa === 'C');
    if (!c) return;
    const j = await post('/api/simular', { lote: numeroLote, itens: { [c.chave]: { preco: 5000 } } });
    const item = j.itens.find((i: { chave: string }) => i.chave === c.chave);
    expect(item.subtotal ?? 0).toBe(0);
  });
});

describe('POST /api/precos — gravação', () => {
  it('MESCLA: não apaga preço de item que não veio no corpo', async () => {
    const antes = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    const preservar = Object.keys(antes.itens)[0]!;
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens.find((i: { faixa: string }) => i.faixa !== 'C')!;

    const j = await post('/api/precos', { itens: { [um.chave]: { preco: 33 } } });
    expect(j.gravados).toBe(1);

    const depois = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    expect(depois.itens[preservar]).toBeDefined();
    expect(depois.itens[um.chave].preco).toBe(33);
  });

  it('preço vazio volta a null — é como o operador desfaz um erro de digitação', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens.find((i: { faixa: string }) => i.faixa !== 'C')!;
    await post('/api/precos', { itens: { [um.chave]: { preco: 40 } } });
    await post('/api/precos', { itens: { [um.chave]: { preco: '' } } });
    const d = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    expect(d.itens[um.chave].preco).toBeNull();
  });

  it('preço inválido é rejeitado com motivo, e não corrompe o arquivo', async () => {
    const j = await post('/api/precos', { itens: { 'chave x': { preco: 'abc' } } });
    expect(j.gravados).toBe(0);
    expect(j.rejeitados[0]).toMatch(/inválido/);
    // O arquivo continua sendo JSON válido depois de uma rejeição.
    JSON.parse(await readFile(arquivoPrecos, 'utf8'));
  });

  it('preço negativo é rejeitado', async () => {
    const j = await post('/api/precos', { itens: { 'chave y': { preco: -5 } } });
    expect(j.gravados).toBe(0);
  });

  it('a faixa escolhida na tela é gravada', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const um = lote.itens.find((i: { faixa: string }) => i.faixa === 'A')!;
    await post('/api/precos', { itens: { [um.chave]: { preco: 10, faixa: 'B' } } });
    const d = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    expect(d.itens[um.chave].faixa).toBe('B');
  });
});

describe('POST /api/estudo — fecha o ciclo', () => {
  it('reescreve o estudo com os preços atuais', async () => {
    const lote = await get(`/api/lote?n=${numeroLote}`);
    const itens: Record<string, { preco: number }> = {};
    for (const i of lote.itens) if (i.faixa !== 'C') itens[i.chave] = { preco: 60 };
    await post('/api/precos', { itens });

    const j = await post('/api/estudo', {});
    expect(j.comTeto).toBeGreaterThanOrEqual(1);

    const html = await readFile(join(dir, 'saida', 'estudo.html'), 'utf8');
    expect(html).not.toContain('estudo antigo');
    expect(html).toContain('Lote 3');
  });

  it('o teto do estudo é o MESMO que a tela mostrou', async () => {
    // Se divergirem, a tela autoriza um lance que o estudo não autoriza. Os dois passam pelo
    // mesmo `avaliar()` justamente para isto não poder acontecer.
    const daTela = await get(`/api/lote?n=${numeroLote}`);
    const html = await readFile(join(dir, 'saida', 'estudo.html'), 'utf8');
    // Ancorado no offerId DESTE lote: pegar o primeiro `data-teto-seguro` da página pegaria
    // outro lote, e o teste passaria comparando números de lotes diferentes.
    const snap = JSON.parse(await readFile(join(dir, 'saida', 'estado.json'), 'utf8'));
    const offerId = snap.evento.lotes.find((l: { numero: number }) => l.numero === numeroLote).offerId;
    const bloco = new RegExp(`data-offer="${offerId}"[\\s\\S]{0,400}?data-teto-seguro="([\\d.]+)"`);
    const m = bloco.exec(html);
    expect(m).not.toBeNull();
    // O atributo carrega o teto OPERANTE — o limite duro contra o qual o refresh repinta.
    expect(Number(m![1])).toBeCloseTo(daTela.av.tetoOperante, 2);
  });
});

describe('a página em si', () => {
  it('é servida e não faz nenhuma chamada a host externo', async () => {
    const r = await fetch(base + '/precificar.html');
    expect(r.status).toBe(200);
    const html = await r.text();
    // Tudo que ela busca é do próprio painel: nada de CDN, nada de fonte remota.
    expect(html).not.toMatch(/https?:\/\/(?!127\.0\.0\.1)/);
    expect(html).toContain('api/lotes');
  });

  it('diz o que fazer quando o painel não responde', async () => {
    // O erro clássico é abrir o arquivo com duplo clique, sem servidor. A página avisa.
    const html = await (await fetch(base + '/precificar.html')).text();
    expect(html).toContain('precisa do servidor');
  });
});

describe('GET /api/exportar — o arquivo para outra IA', () => {
  it('vem com content-disposition, senão o navegador exibe em vez de baixar', async () => {
    const r = await fetch(`${base}/api/exportar?lote=${numeroLote}`);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-disposition')).toMatch(/attachment; filename=".*\.json"/);
  });

  it('traz o prompt dentro do arquivo e os itens com preco null', async () => {
    const j = await get(`/api/exportar?lote=${numeroLote}`);
    expect(j.instrucoes).toContain('NÃO altere o campo "chave"');
    expect(j.itens.length).toBeGreaterThan(10);
    expect(j.escopo).toContain(String(numeroLote));
  });

  it('não pede preço de item irrisório: pesquisa que não move teto é tempo jogado fora', async () => {
    const j = await get(`/api/exportar?lote=${numeroLote}`);
    expect(j.itens.every((i: { faixa: string }) => i.faixa !== 'C')).toBe(true);
  });

  it('escopo "todos" cobre o evento e respeita o corte de --top', async () => {
    const todos = await get('/api/exportar?lote=todos');
    const cortado = await get('/api/exportar?lote=todos&top=5');
    expect(cortado.itens).toHaveLength(5);
    expect(todos.itens.length).toBeGreaterThanOrEqual(cortado.itens.length);
    // O corte é pelo topo da ordem de impacto, não aleatório.
    expect(cortado.itens[0].chave).toBe(todos.itens[0].chave);
  });
});

describe('POST /api/importar — a volta do arquivo', () => {
  it('grava o que casou e RELATA o que não casou', async () => {
    const exp = await get(`/api/exportar?lote=${numeroLote}`);
    const lista = exp.itens.slice(0, 6).map((i: { chave: string }, k: number) => ({
      ...i,
      preco: k === 0 ? 'R$ 1.299,90' : 120 + k,
    }));
    lista.push({ chave: 'nao existe', item: 'PRODUTO INVENTADO PELA IA', preco: 50 });
    // Com cerca de markdown e prosa, como um chat responde de verdade.
    const texto = 'Aqui está!\n\n```json\n' + JSON.stringify({ itens: lista }) + '\n```';

    const j = await post('/api/importar', { texto });
    expect(j.gravados).toBe(6);
    expect(j.porChave).toBe(6);
    expect(j.totalDesconhecidos).toBe(1);
    expect(j.desconhecidos[0]).toContain('INVENTADO');
  });

  it('o preço em formato pt-BR chega no arquivo como número', async () => {
    const d = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    const comMilhar = Object.values(d.itens).filter((v) => (v as { preco: number }).preco === 1299.9);
    expect(comMilhar.length).toBeGreaterThanOrEqual(1);
  });

  it('arquivo que não é JSON dá erro explicado, não 500', async () => {
    const r = await fetch(base + '/api/importar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texto: 'desculpe, não consegui' }),
    });
    expect(r.status).toBe(400);
    expect((await r.json()).erro).toMatch(/JSON/);
  });

  it('importar não apaga os preços digitados à mão em outros lotes', async () => {
    const antes = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    const chaves = Object.keys(antes.itens);
    const exp = await get(`/api/exportar?lote=${numeroLote}`);
    await post('/api/importar', {
      texto: JSON.stringify({ itens: [{ ...exp.itens[0], preco: 7 }] }),
    });
    const depois = JSON.parse(await readFile(arquivoPrecos, 'utf8'));
    for (const k of chaves) expect(depois.itens[k]).toBeDefined();
  });
});

describe('a tela não pode ficar morta', () => {
  it('o modal escondido não intercepta clique', async () => {
    // `#modal` tem display:flex, que ANULA o atributo hidden — a camada invisível cobria a
    // página e nenhum lote da lista era clicável. Pego em navegador real; travado aqui.
    const html = await (await fetch(base + '/precificar.html')).text();
    expect(html).toMatch(/#modal\[hidden\]\s*\{\s*display:\s*none/);
  });

  it('a tela oferece os dois caminhos: baixar e subir', async () => {
    const html = await (await fetch(base + '/precificar.html')).text();
    expect(html).toContain('api/exportar');
    expect(html).toContain('api/importar');
  });
});
