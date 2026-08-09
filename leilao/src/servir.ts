#!/usr/bin/env node
/**
 * O painel: serve o estudo E a tela de precificação, com `node:http` — zero dependência nova.
 *
 * ## Acesso
 *
 * O estudo contém os tetos de lance do operador: outro licitante do mesmo leilão que visse a
 * página saberia até onde empurrá-lo antes de ele parar. E a tela de precificação **grava** em
 * `precos.json`. Então há exatamente dois modos de acesso, e nenhum terceiro:
 *
 * | `HOST` | `SENHA` | Resultado |
 * |---|---|---|
 * | `127.0.0.1` (padrão) | — | só pelo túnel SSH |
 * | `0.0.0.0` | definida | aberto na rede, atrás de Basic auth |
 * | `0.0.0.0` | **ausente** | **o processo se recusa a subir** |
 *
 * A última linha é o ponto: publicar sem senha não é uma opção que o programa ofereça, nem
 * por descuido de configuração. Ele para com mensagem explicando, em vez de servir os tetos —
 * e uma tela de escrita — para a internet inteira.
 */

import { createReadStream } from 'node:fs';
import { stat, writeFile, rename } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { CONFIG_PADRAO } from './config.ts';
import { detectar } from './analise/categoria.ts';
import { aplicar, chave as chaveDe, priorizar } from './analise/valor.ts';
import { avaliar } from './analise/teto.ts';
import { gerarPagina } from './estudo/pagina.ts';
import { configDoSnapshot, montarLinha, montarLinhas } from './estudo/montar.ts';
import { lerSnapshot, manifestoDo, NOME_SNAPSHOT, type Snapshot } from './estudo/snapshot.ts';
import { gravarPrecos, lerPrecos, mesclar, type EntradaPreco } from './precos/arquivo.ts';
import { exportar, importar, type ArquivoTroca } from './precos/troca.ts';
import type { ItemManifesto } from './analise/faixa.ts';
import { reconciliar } from './analise/quantidade.ts';

const RAIZ = resolve(process.env.DIR_SAIDA ?? 'saida');
const ARQUIVO_PRECOS = resolve(process.env.ARQUIVO_PRECOS ?? 'precos.json');
const PORTA = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '127.0.0.1';
const USUARIO = process.env.USUARIO ?? 'leilao';
const SENHA = process.env.SENHA ?? '';
const LOOPBACK = HOST === '127.0.0.1' || HOST === 'localhost' || HOST === '::1';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/**
 * Resolve o caminho pedido e confirma que ele continua **dentro** de `RAIZ`.
 *
 * Sem isso, `GET /../../etc/passwd` sairia da pasta. O `sep` no fim do prefixo impede que
 * `/saida-secreta` passe por ser prefixo textual de `/saida`.
 */
function caminhoSeguro(url: string): string | null {
  let pedido: string;
  try {
    pedido = decodeURIComponent(new URL(url, 'http://x').pathname);
  } catch {
    return null; // percent-encoding inválido
  }
  if (pedido.endsWith('/')) pedido += 'index.html';
  const alvo = resolve(join(RAIZ, pedido));
  return alvo === RAIZ || alvo.startsWith(RAIZ + sep) ? alvo : null;
}

/** Comparação em tempo constante, para a senha não vazar pelo tempo de resposta. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function autorizado(req: IncomingMessage): boolean {
  if (!SENHA) return true; // modo loopback: o túnel SSH já é a autenticação
  const h = req.headers.authorization ?? '';
  if (!h.startsWith('Basic ')) return false;
  const [u, ...resto] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  return iguais(u ?? '', USUARIO) && iguais(resto.join(':'), SENHA);
}

function json(res: ServerResponse, status: number, corpo: unknown): void {
  const txt = JSON.stringify(corpo);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(txt),
    'cache-control': 'no-store',
  });
  res.end(txt);
}

/** Corpo JSON do POST, com limite — sem limite, um POST grande derruba o processo. */
async function corpoJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const LIMITE = 4 * 1024 * 1024;
  let total = 0;
  const pedacos: Buffer[] = [];
  for await (const p of req) {
    total += (p as Buffer).length;
    if (total > LIMITE) throw new Error('corpo grande demais');
    pedacos.push(p as Buffer);
  }
  if (total === 0) return {};
  return JSON.parse(Buffer.concat(pedacos).toString('utf8')) as Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado: snapshot em disco (escrito pelo `gerar`) + preços (mutáveis pela tela)
// ─────────────────────────────────────────────────────────────────────────────

let cacheSnapshot: { snapshot: Snapshot; mtime: number } | null = null;

/** Relê o snapshot só quando o arquivo mudou — o `gerar` do cron reescreve por baixo. */
async function snapshot(): Promise<Snapshot> {
  const caminho = join(RAIZ, NOME_SNAPSHOT);
  const st = await stat(caminho).catch(() => null);
  if (!st) {
    throw new Error(
      `${caminho} não existe. Rode o \`gerar\` uma vez: docker compose run --rm gerar`,
    );
  }
  if (!cacheSnapshot || cacheSnapshot.mtime !== st.mtimeMs) {
    cacheSnapshot = { snapshot: await lerSnapshot(caminho), mtime: st.mtimeMs };
  }
  return cacheSnapshot.snapshot;
}

/** Em quantos lotes cada descrição aparece — é o que mostra a reutilização na tela. */
function alcancePorChave(s: Snapshot): Map<string, number> {
  const m = new Map<string, number>();
  for (const [, manifesto] of Object.entries(s.manifestos)) {
    const vistas = new Set(manifesto.itens.map((i) => chaveDe(i.descricao)));
    for (const k of vistas) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

const cfgBase = CONFIG_PADRAO;

/** Resumo de todos os lotes, sem os itens — é o que a lista da esquerda consome. */
async function apiLotes(): Promise<unknown> {
  const s = await snapshot();
  const { arquivo: precos, aviso } = await lerPrecos(ARQUIVO_PRECOS);
  const cfg = configDoSnapshot(s, cfgBase);
  const linhas = montarLinhas(s, cfg, precos);

  const lotes = linhas.map((l) => {
    const m = manifestoDo(s, l.lote.numero);
    return {
      numero: l.lote.numero,
      titulo: l.lote.titulo,
      semaforo: l.av.semaforo,
      itens: m?.itens.length ?? 0,
      pendentes: m ? l.av.unidadesSemPreco : 0,
      cobertura: l.av.cobertura,
      custoPorUnidadeEfetiva: l.av.custoPorUnidadeEfetiva,
      lance: l.lote.lance,
      encerrado: l.lote.encerrado,
    };
  });

  // Ordem recomendada: primeiro onde vale gastar o esforço. Custo por unidade efetiva é a
  // métrica que funciona SEM preço nenhum, então serve justamente quando nada está precificado.
  const peso = (x: (typeof lotes)[number]) =>
    x.encerrado || x.semaforo === 'ignorado' ? 2 : x.itens === 0 ? 1 : 0;
  lotes.sort(
    (a, b) =>
      peso(a) - peso(b) ||
      (a.custoPorUnidadeEfetiva ?? Infinity) - (b.custoPorUnidadeEfetiva ?? Infinity) ||
      a.numero - b.numero,
  );

  const precificados = Object.values(precos.itens).filter((i) => i.preco != null).length;
  return {
    auctionId: s.evento.auctionId,
    geradoEm: s.geradoEm.replace('T', ' ').slice(0, 16),
    precificados,
    avisoPrecos: aviso,
    lotes,
  };
}

/**
 * Um lote com seus itens, **agrupados por descrição**.
 *
 * Agrupar importa: o mesmo item aparece em várias linhas do manifesto, e o preço é gravado
 * por descrição. Mostrar cinco campos que gravam na mesma chave faria o operador digitar
 * cinco vezes e ver quatro sumirem.
 */
async function apiLote(numero: number, pendentes: Record<string, EntradaPreco> = {}): Promise<unknown> {
  const s = await snapshot();
  const lote = s.evento.lotes.find((l) => l.numero === numero);
  if (!lote) throw new Error(`lote ${numero} não existe neste evento`);
  const manifesto = manifestoDo(s, numero);

  const { arquivo: precos } = await lerPrecos(ARQUIVO_PRECOS);
  // Preços ainda não salvos entram por cima, para o teto na tela responder ao que ele digitou.
  const comPendentes = mesclar(precos, pendentes).arquivo;

  const cfg = configDoSnapshot(s, cfgBase);
  const linha = montarLinha(lote, manifesto, cfg, comPendentes);
  const categoria = detectar(lote.titulo);

  const alcance = alcancePorChave(s);
  const avaliados = manifesto ? aplicar(manifesto.itens, comPendentes.itens, cfg.termosIgnorados, cfg.excecoesIgnorados) : [];
  const semTermo = manifesto ? aplicar(manifesto.itens, comPendentes.itens, []) : [];

  // Ordem de impacto: o operador precifica de cima para baixo e para quando quiser.
  const ordem = new Map(
    priorizar(new Map([[numero, manifesto?.itens ?? []]])).map((l, i) => [l.chave, i]),
  );

  const porChave = new Map<
    string,
    { chave: string; descricao: string; quantidade: number; faixa: string; preco: number | null;
      herdado: boolean; ignorado: boolean; lotes: number; subtotal: number | null }
  >();
  // Subtotal é a contribuição REAL ao valor do lote, então já vem com o peso da faixa B
  // aplicado. Mostrar o bruto faria a coluna somar mais que o "valor online" do rodapé, e o
  // operador não teria como saber qual dos dois números é o que entra no teto.
  const peso = (f: string) => (f === 'B' ? cfg.fatorB : 1);
  avaliados.forEach((it, k) => {
    const key = chaveDe(it.descricao);
    if (!key) return;
    const jaTem = porChave.get(key);
    if (jaTem) {
      jaTem.quantidade += it.quantidade;
      jaTem.subtotal =
        it.precoOnline != null ? jaTem.quantidade * it.precoOnline * peso(it.faixa) : null;
      return;
    }
    porChave.set(key, {
      chave: key,
      descricao: it.descricao,
      quantidade: it.quantidade,
      faixa: it.faixa,
      preco: it.precoOnline ?? comPendentes.itens[key]?.preco ?? null,
      herdado: it.precoOnline != null,
      // Termo ignorado é o item que caiu em C por causa da lista de termos, não da heurística:
      // a tela precisa dizer POR QUE o campo está travado.
      ignorado: it.faixa === 'C' && semTermo[k]!.faixa !== 'C',
      lotes: alcance.get(key) ?? 1,
      subtotal: it.precoOnline != null ? it.quantidade * it.precoOnline * peso(it.faixa) : null,
    });
  });

  const itens = [...porChave.values()].sort(
    (a, b) => (ordem.get(a.chave) ?? 1e9) - (ordem.get(b.chave) ?? 1e9),
  );

  return {
    numero,
    titulo: lote.titulo,
    lance: lote.lance,
    incremento: lote.incremento,
    encerrado: lote.encerrado,
    categoria: cfg.categorias[categoria].rotulo,
    multiplo: cfg.categorias[categoria].multiplo,
    perda: cfg.categorias[categoria].perda,
    ignorado: cfg.categoriasIgnoradas.includes(categoria),
    unidadesDeclaradas: reconciliar(lote.titulo, manifesto?.somaQuantidades ?? null).valor,
    itens,
    av: linha.av,
  };
}

/**
 * Itens a precificar, em ordem de impacto, para levar a outro modelo pesquisar.
 *
 * Escopos: um lote (`lote=56`), todos (`lote=todos`), e `top` para cortar a lista. Precificar um
 * lote até o fim rende um teto real; a lista global espalha esforço por 57 lotes e não fecha
 * nenhum — mas com IA preenchendo em bloco o custo de "todos" cai, então os dois existem.
 */
async function apiExportar(escopoLote: string, top: number | null): Promise<{ nome: string; corpo: ArquivoTroca }> {
  const s = await snapshot();
  const { arquivo: precos } = await lerPrecos(ARQUIVO_PRECOS);
  const cfg = configDoSnapshot(s, cfgBase);

  const todos = escopoLote === 'todos' || escopoLote === '';
  const porLote = new Map<number, ItemManifesto[]>();
  if (todos) {
    for (const lote of s.evento.lotes) {
      const m = manifestoDo(s, lote.numero);
      // Categoria que o operador não trabalha fica fora: não faz sentido pagar pesquisa dela.
      if (!m || lote.encerrado || cfg.categoriasIgnoradas.includes(detectar(lote.titulo))) continue;
      porLote.set(lote.numero, m.itens);
    }
  } else {
    const n = Number(escopoLote);
    const m = manifestoDo(s, n);
    if (!m) throw new Error(`lote ${n} não tem manifesto no snapshot — rode o \`gerar\``);
    porLote.set(n, m.itens);
  }

  // Item de termo ignorado (cosmético, limpeza, bebida) sai da lista: vale zero de qualquer jeito.
  const filtrado = new Map<number, ItemManifesto[]>();
  for (const [n, itens] of porLote) {
    const av = aplicar(itens, {}, cfg.termosIgnorados, cfg.excecoesIgnorados);
    filtrado.set(n, itens.filter((_, k) => av[k]!.faixa !== 'C'));
  }

  let linhas = priorizar(filtrado).filter((l) => l.faixa !== 'C');
  if (top && top > 0) linhas = linhas.slice(0, top);

  const corpo = exportar(linhas, {
    evento: s.evento.auctionId,
    escopo: todos ? `todos os lotes${top ? ` · ${top} itens de maior impacto` : ''}` : `lote ${escopoLote}`,
    precoAtual: (k) => precos.itens[k]?.preco ?? null,
  });
  const nome = todos
    ? `precos-evento-${s.evento.auctionId}.json`
    : `precos-lote${escopoLote}-${s.evento.auctionId}.json`;
  return { nome, corpo };
}

/**
 * Recebe o arquivo preenchido pela outra IA e grava o que casar.
 *
 * O relatório é a parte que importa. Um "importado com sucesso" mudo esconderia o caso ruim:
 * o modelo reescreveu as chaves, nada casou, e o operador acha que precificou 400 itens.
 */
async function apiImportar(corpo: Record<string, unknown>): Promise<unknown> {
  const texto = typeof corpo.texto === 'string' ? corpo.texto : JSON.stringify(corpo.arquivo ?? corpo);
  const s = await snapshot();

  // Universo de chaves válidas: tudo que existe em algum manifesto deste evento.
  const conhecidas = new Set<string>();
  for (const m of Object.values(s.manifestos)) {
    for (const i of m.itens) {
      const k = chaveDe(i.descricao);
      if (k) conhecidas.add(k);
    }
  }

  const r = importar(texto, conhecidas);
  const comPreco = Object.values(r.entrada).filter((e) => e.preco != null).length;

  const { arquivo } = await lerPrecos(ARQUIVO_PRECOS);
  const { arquivo: novo, gravados, rejeitados } = mesclar(arquivo, r.entrada);
  await gravarPrecos(ARQUIVO_PRECOS, novo);

  return {
    gravados,
    comPreco,
    semPreco: r.semPreco,
    porChave: r.porChave,
    porDescricao: r.porDescricao,
    desconhecidos: r.desconhecidos.slice(0, 20),
    totalDesconhecidos: r.desconhecidos.length,
    invalidos: r.invalidos.slice(0, 20),
    suspeitos: r.suspeitos.slice(0, 20),
    rejeitados,
  };
}

/** Recalcula o teto com os preços digitados, SEM gravar. */
async function apiSimular(corpo: Record<string, unknown>): Promise<unknown> {
  const numero = Number(corpo.lote);
  const itens = (corpo.itens ?? {}) as Record<string, EntradaPreco>;
  const r = (await apiLote(numero, itens)) as { av: unknown; itens: unknown };
  return { av: r.av, itens: r.itens };
}

async function apiGravarPrecos(corpo: Record<string, unknown>): Promise<unknown> {
  const entrada = (corpo.itens ?? {}) as Record<string, EntradaPreco>;
  const { arquivo } = await lerPrecos(ARQUIVO_PRECOS);
  const { arquivo: novo, gravados, rejeitados } = mesclar(arquivo, entrada);
  await gravarPrecos(ARQUIVO_PRECOS, novo);
  return { gravados, rejeitados, arquivo: ARQUIVO_PRECOS };
}

/**
 * Regenera `estudo.html` a partir do snapshot + preços atuais.
 *
 * Fecha o ciclo: precificar na tela e ver o estudo mudar, sem SSH e sem esperar o cron. Não
 * toca em PDF nem na rede — os lances continuam vindo do `gerar`, e o `--refresh` da própria
 * página busca os atuais no navegador.
 */
async function apiRegerarEstudo(): Promise<unknown> {
  const s = await snapshot();
  const { arquivo: precos } = await lerPrecos(ARQUIVO_PRECOS);
  const cfg = configDoSnapshot(s, cfgBase);
  const linhas = montarLinhas(s, cfg, precos);
  const html = gerarPagina(s.evento, linhas, cfg, s.refresh, precos.exemplo ?? false);

  const alvo = join(RAIZ, s.arquivoEstudo ?? 'estudo.html');
  const tmp = `${alvo}.tmp`;
  await writeFile(tmp, html, 'utf8');
  await rename(tmp, alvo);

  const conta = (x: string) => linhas.filter((l) => l.av.semaforo === x).length;
  return {
    arquivo: alvo,
    comTeto: conta('verde') + conta('amarelo') + conta('vermelho'),
    semCobertura: conta('sem-cobertura'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const servidor = createServer(async (req, res) => {
  if (!autorizado(req)) {
    res
      .writeHead(401, { 'www-authenticate': 'Basic realm="leilao", charset="UTF-8"' })
      .end('autenticação necessária\n');
    return;
  }

  const rota = (req.url ?? '/').split('?')[0] ?? '/';
  const metodo = req.method ?? 'GET';

  if (rota.startsWith('/api/')) {
    try {
      if (metodo === 'GET' && rota === '/api/lotes') return json(res, 200, await apiLotes());
      if (metodo === 'GET' && rota === '/api/lote') {
        const n = Number(new URL(req.url ?? '', 'http://x').searchParams.get('n'));
        return json(res, 200, await apiLote(n));
      }
      if (metodo === 'POST' && rota === '/api/simular') {
        return json(res, 200, await apiSimular(await corpoJson(req)));
      }
      if (metodo === 'POST' && rota === '/api/precos') {
        return json(res, 200, await apiGravarPrecos(await corpoJson(req)));
      }
      if (metodo === 'POST' && rota === '/api/estudo') {
        return json(res, 200, await apiRegerarEstudo());
      }
      if (metodo === 'GET' && rota === '/api/exportar') {
        const q = new URL(req.url ?? '', 'http://x').searchParams;
        const { nome, corpo } = await apiExportar(q.get('lote') ?? 'todos', Number(q.get('top')) || null);
        const txt = JSON.stringify(corpo, null, 2);
        // content-disposition faz o navegador BAIXAR em vez de exibir — é o ponto do botão.
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': `attachment; filename="${nome}"`,
          'content-length': Buffer.byteLength(txt),
          'cache-control': 'no-store',
        });
        return res.end(txt);
      }
      if (metodo === 'POST' && rota === '/api/importar') {
        return json(res, 200, await apiImportar(await corpoJson(req)));
      }
      return json(res, 404, { erro: `rota ${metodo} ${rota} não existe` });
    } catch (e) {
      // Mensagem de verdade para o operador: "rode o gerar" resolve; "500" não diz nada.
      return json(res, 400, { erro: (e as Error).message });
    }
  }

  if (metodo !== 'GET' && metodo !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end('método não permitido\n');
    return;
  }

  const alvo = caminhoSeguro(req.url ?? '/');
  if (!alvo) {
    res.writeHead(403).end('fora do diretório servido\n');
    return;
  }

  try {
    const st = await stat(alvo);
    // Diretório sem index: listar arquivos seria vazar nomes sem ganho nenhum aqui.
    if (st.isDirectory()) {
      res.writeHead(404).end('não encontrado\n');
      return;
    }
    res.writeHead(200, {
      'content-type': TIPOS[extname(alvo).toLowerCase()] ?? 'application/octet-stream',
      'content-length': String(st.size),
      // O estudo é regenerado pelo job; cache do navegador só atrasaria o operador.
      'cache-control': 'no-store',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(alvo).pipe(res);
  } catch {
    res.writeHead(404).end('não encontrado\n');
  }
});

// Publicar sem senha não é opção de configuração: o processo para aqui.
if (!LOOPBACK && !SENHA) {
  console.error(
    `\nRECUSANDO SUBIR: HOST=${HOST} publica o painel na rede, e a variável SENHA está vazia.\n` +
      `O painel mostra seus tetos de lance e GRAVA em precos.json — sem senha, qualquer um do\n` +
      `mesmo leilão poderia ler e editar.\n\n` +
      `  Escolha um dos dois:\n` +
      `    SENHA=umasenhaboa       no .env, e o painel sobe com login (usuário: ${USUARIO})\n` +
      `    HOST=127.0.0.1         e acesse por túnel: ssh -L 8080:127.0.0.1:8080 root@servidor\n`,
  );
  process.exit(1);
}

servidor.listen(PORTA, HOST, () => {
  console.log(`painel servindo ${RAIZ} em http://${HOST}:${PORTA}`);
  console.log(`  estudo:     http://${HOST}:${PORTA}/estudo.html`);
  console.log(`  precificar: http://${HOST}:${PORTA}/precificar.html`);
  console.log(`  preços em:  ${ARQUIVO_PRECOS}`);
  console.log(SENHA ? `  login: usuário "${USUARIO}", senha definida em SENHA` : '  sem senha (loopback)');
});
