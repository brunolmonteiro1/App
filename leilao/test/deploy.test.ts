import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const compose = ler('docker-compose.yml');
const dockerfile = ler('Dockerfile');
const pkg = JSON.parse(ler('package.json'));

/**
 * O estudo contém os tetos de lance do operador. Estes testes existem porque o erro aqui é
 * silencioso e caro: um mapeamento de porta "8080:8080" publicaria os tetos na internet, e o
 * Docker escreve direto na DOCKER-USER do iptables — um `ufw deny 8080` não salvaria.
 *
 * Não substituem `docker build` (que não roda no CI), mas travam a classe de erro que o build
 * não pegaria de jeito nenhum: um build bem-sucedido com a porta exposta passa liso.
 */
describe('compose — o padrão é loopback, e publicar exige senha', () => {
  const mapeamentos = [...compose.matchAll(/^\s*-\s*"([^"]*:\d+)"/gm)].map((m) => m[1]!);

  it('existe pelo menos um mapeamento, senão o teste não está vendo nada', () => {
    expect(mapeamentos.length).toBeGreaterThan(0);
  });

  for (const m of mapeamentos) {
    it(`"${m}" tem 127.0.0.1 como padrão`, () => {
      // O operador pode abrir na rede (BIND=0.0.0.0), mas tem de ser escolha explícita no
      // .env. Quem não configurar nada fica no loopback.
      expect(m).toMatch(/^\$\{BIND:-127\.0\.0\.1\}:/);
    });
  }

  it('não há mapeamento com 0.0.0.0 fixo nem porta nua', () => {
    // Porta nua tipo "8080:8080" liga em todas as interfaces sem passar pelo .env.
    expect(compose).not.toMatch(/^\s*-\s*"0\.0\.0\.0:/m);
    expect(compose).not.toMatch(/^\s*-\s*"\d+:\d+"/m);
  });

  it('SENHA é obrigatória: o compose falha sem ela', () => {
    // `${SENHA:?mensagem}` faz o `docker compose up` abortar quando a variável está vazia.
    // É o que impede subir o painel publicado e sem autenticação por descuido de .env.
    expect(compose).toMatch(/SENHA:\?/);
  });

  it('o comentário que explica o porquê continua no arquivo', () => {
    // Sem a explicação, alguém "simplifica" o mapeamento sem saber o que perde.
    expect(compose).toContain('TETOS DE LANCE');
    expect(compose).toContain('UFW');
  });
});

describe('volumes — named, não bind mount', () => {
  it('cache, saida e dados são named volumes declarados', () => {
    // A imagem roda como uid 1001. Bind mount sobrepõe o dono da imagem pelo dono da pasta
    // no host: numa VPS operada como root, `./cache` nasce root:root e o container falha ao
    // escrever no primeiro `gerar`. Named volume o Docker inicializa com o dono da imagem.
    expect(compose).toMatch(/^volumes:$/m);
    for (const v of ['cache', 'saida', 'dados']) {
      expect(compose).toMatch(new RegExp(`^\\s+${v}:$`, 'm'));
    }
  });

  it('NENHUM bind mount sobrou no compose', () => {
    // O `./precos.json` era o último, e era duas armadilhas ao mesmo tempo: arquivo ausente
    // no host virava DIRETÓRIO (EISDIR), e arquivo criado por root era ilegível para escrita
    // pelo uid 1001 — quebrando justamente o salvar da tela de precificação.
    const binds = [...compose.matchAll(/-\s*(\.\/[^\s:]+):/g)].map((m) => m[1]!);
    expect(binds).toEqual([]);
  });

  it('o volume de preços é montado read-only no job e gravável no painel', () => {
    // Quem grava preço é a tela; o job só calcula com o que já existe.
    expect(compose).toMatch(/-\s*dados:\/app\/dados:ro/);
    expect(compose).toMatch(/-\s*dados:\/app\/dados$/m);
  });

  it('o diretório de dados existe na imagem com o dono certo', () => {
    // Named volume cujo ponto de montagem não existe na imagem nasce root:root, e aí a tela
    // de precificação não consegue gravar.
    expect(dockerfile).toMatch(/mkdir -p .*dados/);
    expect(dockerfile).toMatch(/chown -R leilao:leilao .*dados/);
  });

  it('o comentário que explica o porquê continua no arquivo', () => {
    expect(compose).toContain('NAMED VOLUMES');
    expect(compose).toContain('uid 1001');
  });
});

describe('.env.exemplo — o operador tem o que precisa para subir', () => {
  const env = ler('.env.exemplo');

  it('traz SENHA, BIND e a porta do host', () => {
    for (const k of ['SENHA=', 'BIND=', 'PORTA_HOST=', 'EVENTO=', 'FRETE=']) {
      expect(env).toContain(k);
    }
  });

  it('a senha de exemplo é obviamente um placeholder', () => {
    // Se parecesse uma senha de verdade, alguém a usaria em produção.
    expect(env).toMatch(/SENHA=troque/);
  });
});

describe('imagem — o CLI tem como rodar', () => {
  it('tsx está em dependencies, não em devDependencies', () => {
    // A imagem instala com --omit=dev. Com tsx em devDeps, o container subiria sem tsx e o
    // CLI (`tsx src/cli.ts`) falharia só em runtime, na VPS.
    expect(Object.keys(pkg.dependencies)).toContain('tsx');
    expect(Object.keys(pkg.devDependencies ?? {})).not.toContain('tsx');
  });

  it('o Dockerfile usa --omit=dev, que é o que essa mudança viabiliza', () => {
    expect(dockerfile).toContain('npm ci --omit=dev');
  });

  it('roda como usuário não-root', () => {
    expect(dockerfile).toMatch(/^USER leilao$/m);
    expect(dockerfile).toMatch(/adduser/);
  });

  it('copia o que o CLI precisa em runtime', () => {
    for (const caminho of ['src', 'recon/fixtures', 'package.json']) {
      expect(dockerfile).toContain(caminho);
    }
  });

  it('Node 22, que é o mínimo do package.json', () => {
    expect(dockerfile).toMatch(/FROM node:22-alpine/);
    expect(pkg.engines.node).toBe('>=22');
  });

  it('fuso do pregão no container', () => {
    expect(dockerfile).toContain('TZ=America/Sao_Paulo');
  });
});

describe('segredos e dados do operador não vazam para a imagem nem para o git', () => {
  it('.dockerignore exclui cache, saida e .env', () => {
    const di = ler('.dockerignore');
    for (const p of ['cache', 'saida', '.env', 'node_modules']) expect(di).toContain(p);
  });

  it('.gitignore cobre .env e o arquivo de preços', () => {
    const gi = ler('.gitignore');
    expect(gi).toContain('.env');
    expect(gi).toContain('precos.json');
  });
});
