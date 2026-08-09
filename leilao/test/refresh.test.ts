import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO } from '../src/config.ts';
import { avaliar } from '../src/analise/teto.ts';
import { gerarPagina, type LinhaEstudo } from '../src/estudo/pagina.ts';
import { parsearEvento } from '../src/superbid/api.ts';
import { aplicar } from '../src/analise/valor.ts';

const evento = parsearEvento(
  JSON.parse(readFileSync(new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url), 'utf8')),
  'UTC',
);

const linha = (): LinhaEstudo => {
  const itens = aplicar([{ descricao: 'AIR FRYER BRITANIA', quantidade: 10, ref: 'SB1' }], {
    'air fryer britania': { preco: 350 },
  });
  return {
    lote: evento.lotes[2]!,
    av: avaliar(
      {
        itens,
        categoria: 'utensilios',
        lanceAtual: 2130,
        incremento: 200,
        temLances: true,
        encerrado: false,
        unidadesDeclaradas: 304,
      },
      CONFIG_PADRAO,
    ),
    alertas: [],
    unidadesDeclaradas: 304,
    fonteUnidades: 'manifesto',
    topItens: [],
  };
};

/**
 * O script de refresh e o HTML são gerados por funções diferentes do mesmo módulo, e o
 * script lê atributos que o HTML precisa emitir. Já houve um bug exatamente aqui: o script
 * lia `data-teto-seguro` que `linhaHtml` não emitia, e o refresh repintava contra zero.
 * Estes testes são o contrato entre as duas metades.
 */
describe('refresh — contrato entre o script e o HTML', () => {
  const html = gerarPagina(evento, [linha()], CONFIG_PADRAO, 15);

  it('todo dataset que o script lê é emitido pelo HTML', () => {
    // dataset.tetoSeguro no JS  ⇄  data-teto-seguro no HTML
    const lidos = [...html.matchAll(/dataset\.([a-zA-Z]+)/g)].map((m) => m[1]!);
    expect(lidos.length).toBeGreaterThan(0);
    for (const prop of new Set(lidos)) {
      const attr = 'data-' + prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
      expect(html, `script lê dataset.${prop}, HTML precisa emitir ${attr}`).toContain(attr + '=');
    }
  });

  it('os seletores de classe que o script usa existem no HTML', () => {
    for (const sel of ['lance-atual', 'acao']) {
      expect(html).toContain(`querySelector('.${sel}')`);
      expect(html).toContain(`class="${sel}`);
    }
  });

  it('o script busca a URL da API do próprio evento', () => {
    expect(html).toContain(`filter=auction.id%3A${evento.auctionId}`);
    expect(html).toContain('America%2FSao_Paulo');
  });

  it('sem --refresh a página não faz chamada de rede nenhuma', () => {
    const inerte = gerarPagina(evento, [linha()], CONFIG_PADRAO, null);
    expect(inerte).not.toContain('fetch(');
    expect(inerte).not.toContain('setInterval');
    expect(inerte).toContain('Página inerte');
  });

  it('com --refresh, o intervalo é o que foi pedido, em milissegundos', () => {
    expect(gerarPagina(evento, [linha()], CONFIG_PADRAO, 15)).toContain('setInterval(atualizar, 15000)');
    expect(gerarPagina(evento, [linha()], CONFIG_PADRAO, 30)).toContain('setInterval(atualizar, 30000)');
  });

  it('falha de rede é exibida, não silenciada', () => {
    // Validado em navegador real: com a API inalcançável o cabeçalho mostra "sem conexão";
    // com payload servido, repinta o lance (lote 3 de 2.130 para 9.999).
    expect(html).toContain('sem conexão');
  });
});
