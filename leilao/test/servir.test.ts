import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * O painel é um servidor, mesmo sendo interno. Estes testes cobrem as duas coisas que um
 * servidor não pode errar: não sair do diretório servido, e não escutar fora do loopback
 * por acidente — o estudo contém os tetos de lance do operador.
 */
let base: string;
let dir: string;
let fechar: () => Promise<void>;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'servir-'));
  await writeFile(join(dir, 'estudo.html'), '<h1>estudo</h1>');
  process.env.DIR_SAIDA = dir;
  process.env.PORT = '0'; // porta livre escolhida pelo SO
  process.env.HOST = '127.0.0.1';

  const mod = await import('../src/servir.ts?t=' + Date.now());
  // O módulo sobe o servidor ao ser importado; espera o listen resolver.
  await new Promise((r) => setTimeout(r, 300));
  const srv = (mod as unknown as { default?: unknown });
  void srv;
  // Descobre a porta pelo handle ativo do processo.
  const handles = (process as unknown as { _getActiveHandles(): { address?: () => unknown }[] })
    ._getActiveHandles();
  const escutando = handles.find(
    (h) => typeof h.address === 'function' && (h.address() as { port?: number })?.port,
  );
  const addr = escutando!.address!() as { port: number; address: string };
  base = `http://127.0.0.1:${addr.port}`;
  expect(addr.address).toBe('127.0.0.1');
  fechar = async () => {
    (escutando as unknown as { close(): void }).close();
  };
});

afterAll(async () => {
  await fechar?.();
});

describe('painel — serve o estudo', () => {
  it('devolve o arquivo pedido', async () => {
    const r = await fetch(`${base}/estudo.html`);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/html');
    // Sem cache: o job regenera o estudo e o operador não pode ver versão velha.
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.text()).toContain('estudo');
  });

  it('404 em arquivo inexistente', async () => {
    expect((await fetch(`${base}/naoexiste.html`)).status).toBe(404);
  });

  it('405 em método que não é GET/HEAD', async () => {
    expect((await fetch(`${base}/estudo.html`, { method: 'POST' })).status).toBe(405);
  });
});

describe('painel — não sai do diretório servido', () => {
  it('barra traversal PERCENT-ENCODED, que sobrevive à normalização de URL', async () => {
    // `..%2f` é o caso que importa: `/../x` o próprio parser de URL já colapsa, mas o
    // codificado chega inteiro no handler e precisa ser barrado por resolução de caminho.
    const r = await fetch(`${base}/..%2f..%2fpackage.json`);
    expect(r.status).toBe(403);
  });

  it('barra traversal com múltiplos níveis codificados', async () => {
    const r = await fetch(`${base}/..%2f..%2f..%2f..%2fetc%2fpasswd`);
    expect([403, 404]).toContain(r.status);
    expect(await r.text()).not.toContain('root:');
  });

  it('não vaza arquivo de pasta vizinha com nome prefixo', async () => {
    // `/saida-secreta` não pode passar por ser prefixo textual de `/saida`.
    const r = await fetch(`${base}/..%2f${dir.split('/').pop()}-secreta%2fx`);
    expect([403, 404]).toContain(r.status);
  });

  it('percent-encoding inválido não derruba o servidor', async () => {
    const r = await fetch(`${base}/%ZZ`);
    expect([403, 404]).toContain(r.status);
    // e continua respondendo depois
    expect((await fetch(`${base}/estudo.html`)).status).toBe(200);
  });
});
