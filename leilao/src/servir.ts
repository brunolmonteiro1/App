#!/usr/bin/env node
/**
 * Servidor estático mínimo para o estudo, com `node:http` — zero dependência nova.
 *
 * **Liga em 127.0.0.1 por padrão, de propósito.** O estudo contém os tetos de lance do
 * operador: outro licitante do mesmo leilão que visse esta página saberia exatamente até onde
 * empurrá-lo antes de ele parar. O acesso previsto é túnel SSH (`ssh -L 8080:127.0.0.1:8080`),
 * não exposição na internet.
 *
 * Isto é defesa em profundidade: mesmo que alguém erre o mapeamento de porta no compose, o
 * processo não escuta fora do loopback a menos que `HOST` seja trocado explicitamente.
 *
 * A página não precisa de CORS deste servidor — ela busca a API do Superbid, e é o Superbid
 * que responde `Access-Control-Allow-Origin: *`.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const RAIZ = resolve(process.env.DIR_SAIDA ?? 'saida');
const PORTA = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '127.0.0.1';

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

const servidor = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
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

servidor.listen(PORTA, HOST, () => {
  console.log(`painel servindo ${RAIZ} em http://${HOST}:${PORTA}`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.warn(
      `ATENÇÃO: HOST=${HOST} — o estudo contém seus tetos de lance. Só faça isso atrás de ` +
        'autenticação; o padrão previsto é túnel SSH.',
    );
  }
});
