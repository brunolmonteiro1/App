#!/usr/bin/env node
/**
 * CLI do estudo de lotes.
 *
 *   npm run cli -- estudo --url <url do evento> [--saida arquivo.html] [--refresh 15]
 *   npm run cli -- estudo --fixture            # roda offline, contra o evento capturado
 *   npm run cli -- custo --lance 3460          # confere a conta de encargos
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { CONFIG_PADRAO, type Config } from './config.ts';
import { auctionIdDaUrl, buscarEvento, parsearEvento, type Evento, type Lote } from './superbid/api.ts';
import { detectar } from './analise/categoria.ts';
import { calcularCusto, degrauProximo } from './analise/custo.ts';
import {
  aplicar,
  carregarPrecos,
  cobertura,
  esqueleto,
  esqueletoPriorizado,
  priorizar,
  type ArquivoPrecos,
} from './analise/valor.ts';
import type { ItemManifesto } from './analise/faixa.ts';
import { reconciliar, refDoTitulo } from './analise/quantidade.ts';
import { avaliar } from './analise/teto.ts';
import { conferir, lerManifesto, type Manifesto } from './superbid/manifesto.ts';
import { baixarManifestos, indexarCache } from './superbid/baixar.ts';
import { gerarPagina, type LinhaEstudo } from './estudo/pagina.ts';

const FIXTURE = new URL('../recon/fixtures/evento-790754-offers.json', import.meta.url).pathname;
/** Onde os 57 manifestos ficam. Está no .gitignore: material do vendedor não vai pro repo. */
const CACHE_ANEXOS = new URL('../cache/anexos', import.meta.url).pathname;
const MANIFESTO_LOTE3 = new URL(
  '../recon/fixtures/manifesto-lote3-SB0032812.pdf',
  import.meta.url,
).pathname;

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const temFlag = (nome: string) => process.argv.includes(`--${nome}`);

/** Monta a linha do estudo de um lote. `manifesto` é opcional: sem ele, não há teto. */
function montarLinha(
  lote: Lote,
  manifesto: Manifesto | null,
  cfg: Config,
  precos: ArquivoPrecos | null,
): LinhaEstudo {
  const itens = manifesto ? aplicar(manifesto.itens, precos?.itens ?? {}) : [];
  const unidades = reconciliar(lote.titulo, manifesto?.somaQuantidades ?? null);
  const declaradas = reconciliar(lote.titulo, null).valor;

  const av = avaliar(
    {
      itens,
      categoria: detectar(lote.titulo),
      lanceAtual: lote.lance,
      incremento: lote.incremento,
      temLances: lote.temLances,
      encerrado: lote.encerrado,
      unidadesDeclaradas: declaradas,
    },
    cfg,
  );

  const alertas = manifesto ? conferir(manifesto, refDoTitulo(lote.titulo), declaradas) : [];
  if (!manifesto && lote.anexos.length === 0) alertas.push('lote sem PDF de anexo');
  if (!manifesto && lote.anexos.length > 0) alertas.push('manifesto ainda não processado');
  if (manifesto) {
    const cob = cobertura(itens);
    if (cob.pendentes > 0) {
      alertas.push(
        `${cob.pendentes} item(ns) sem preço (${cob.unidadesSemPreco} un) — teto sai baixo até precificar`,
      );
    }
  }

  const topItens = itens
    .filter((i) => i.faixa !== 'C')
    .map((i) => ({
      descricao: i.descricao,
      quantidade: i.quantidade,
      valor: i.quantidade * (i.precoOnline ?? 0),
    }))
    .sort((a, b) => b.valor - a.valor || b.quantidade - a.quantidade)
    .slice(0, 5);

  // Avisa só quando o próximo lance de fato atravessa a fronteira da faixa — parar no topo
  // da faixa de baixo pode valer mais que cobrir.
  const proximoLance = lote.temLances ? lote.lance + lote.incremento : lote.lance;
  const d = degrauProximo(lote.lance, cfg.encargos);
  const degrau = d && proximoLance > d.limite ? d : null;

  return {
    lote,
    av,
    alertas,
    unidadesDeclaradas: unidades.valor,
    fonteUnidades: unidades.fonte,
    topItens,
    degrau,
  };
}

/** Carrega o evento do fixture (offline) ou da API ao vivo. */
async function carregarEvento(): Promise<Evento> {
  if (temFlag('fixture')) {
    // O fixture foi capturado com timeZoneId=UTC; o ao vivo pede America/Sao_Paulo.
    const ev = parsearEvento(JSON.parse(await readFile(FIXTURE, 'utf8')), 'UTC');
    console.log(`[fixture] evento ${ev.auctionId} · ${ev.lotes.length} lotes`);
    return ev;
  }
  const url = arg('url');
  if (!url) {
    console.error('faltou --url <url do evento> (ou use --fixture)');
    process.exit(2);
  }
  const id = auctionIdDaUrl(url);
  console.log(`buscando evento ${id}…`);
  const ev = await buscarEvento(id);
  console.log(`recebidos ${ev.lotes.length} de ${ev.total} lotes`);
  return ev;
}

/** Lê do cache os manifestos de todos os lotes que têm PDF baixado. */
async function lerManifestosDoCache(
  evento: Evento,
): Promise<{ porLote: Map<number, Manifesto>; falhas: number[] }> {
  const indice = await indexarCache(CACHE_ANEXOS);
  const porLote = new Map<number, Manifesto>();
  const falhas: number[] = [];
  for (const lote of evento.lotes) {
    const caminho = indice.get(lote.numero);
    if (!caminho) continue;
    try {
      porLote.set(lote.numero, await lerManifesto(caminho));
    } catch (e) {
      falhas.push(lote.numero);
      console.warn(`  lote ${lote.numero}: manifesto ilegível (${(e as Error).message})`);
    }
  }
  return { porLote, falhas };
}

async function comandoBaixar(): Promise<void> {
  const evento = await carregarEvento();
  console.log(`baixando manifestos para ${CACHE_ANEXOS}`);
  const r = await baixarManifestos(evento.lotes, CACHE_ANEXOS, (m) => console.log(`  ${m}`));
  console.log(`\nbaixados ${r.baixados} · já em cache ${r.emCache} · sem anexo ${r.semAnexo.length}`);
  if (r.semAnexo.length) {
    console.log(`  lotes sem anexo (nunca terão teto por manifesto): ${r.semAnexo.join(', ')}`);
  }
  for (const f of r.falhas) console.log(`  FALHA lote ${f.lote}: ${f.motivo}`);
}

async function comandoEstudo(): Promise<void> {
  const cfg = { ...CONFIG_PADRAO };
  const frete = arg('frete');
  if (frete !== undefined) {
    cfg.freteporLote = Number(frete);
    cfg.freteInformado = true;
  }

  const evento = await carregarEvento();

  const caminhoPrecos = arg('precos');
  const precos = caminhoPrecos ? await carregarPrecos(caminhoPrecos) : null;
  if (precos) {
    const n = Object.values(precos.itens).filter((i) => i.preco != null).length;
    console.log(`tabela de preços: ${n} item(ns) precificados${precos.exemplo ? ' [EXEMPLO]' : ''}`);
  }

  const limite = arg('limite') ? Number(arg('limite')) : undefined;
  const lotes = limite ? evento.lotes.slice(0, limite) : evento.lotes;

  // Manifestos vêm do cache preenchido por `baixar`. Sem manifesto o lote entra no estudo
  // com teto vazio e alerta, nunca com número inventado.
  const { porLote } = await lerManifestosDoCache(evento);
  console.log(`manifestos em cache: ${porLote.size}`);

  const linhas: LinhaEstudo[] = [];
  for (const lote of lotes) {
    linhas.push(montarLinha(lote, porLote.get(lote.numero) ?? null, cfg, precos));
  }

  const refresh = arg('refresh');
  const html = gerarPagina(evento, linhas, cfg, refresh ? Number(refresh) : null, precos?.exemplo ?? false);
  const saida = resolve(arg('saida') ?? `saida/estudo-${evento.auctionId}.html`);
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, html, 'utf8');

  // Contar pelo SEMÁFORO, não por `tetoSeguro > 0`: um lote pode ter teto calculado
  // internamente e ainda assim não oferecê-lo por falta de cobertura.
  const conta = (s: string) => linhas.filter((l) => l.av.semaforo === s).length;
  const utilizavel = conta('verde') + conta('amarelo') + conta('vermelho');
  console.log(`\nestudo gerado: ${saida}`);
  console.log(`  ${linhas.length} lotes · ${utilizavel} com teto utilizável`);
  console.log(`  ${conta('sem-cobertura')} com cobertura abaixo de ${(cfg.coberturaMinima * 100).toFixed(0)}% (teto omitido de propósito) · ${conta('sem-teto')} sem preço nenhum`);
  if (utilizavel === 0) {
    console.log('\n  nenhum teto utilizável ainda. Rode `shortlist` e precifique UM lote inteiro:');
    console.log('    npm run cli -- shortlist --fixture --frete 150');
    console.log('    npm run cli -- precos --lote 4 --fixture');
  }
  if (!cfg.freteInformado) console.log('  custo marcado INCOMPLETO: passe --frete <valor> para fechar');
  if (refresh) console.log(`  refresh ligado: a página busca lances a cada ${refresh}s`);
}

function comandoCusto(): void {
  const lance = Number(arg('lance') ?? 3460);
  const c = calcularCusto(lance, CONFIG_PADRAO);
  const f = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  console.log(`Valor do lance                     ${f(c.lance)}`);
  console.log(`Comissão do leiloeiro              ${f(c.leiloeiro)}`);
  console.log(`Buyers Premium                     ${f(c.premium)}`);
  console.log(`Encargos de Administração          ${f(c.encargosAdm)}`);
  console.log(`Fee Plataforma                     ${f(c.feePlataforma)}`);
  console.log(`Subtotal dos encargos e comissões  ${f(c.encargos)}`);
  console.log(`Valor total previsto               ${f(c.total)}`);
  console.log(`Overhead efetivo                   ${(c.overhead * 100).toFixed(1)}%  (o card do site diz +10%)`);
  const d = degrauProximo(c.lance, CONFIG_PADRAO.encargos);
  if (d) {
    console.log(`Degrau da tabela                   acima de ${f(d.limite)} o encargo sobe ${f(d.salto)}`);
  }
}

async function comandoEsqueleto(): Promise<void> {
  const numLote = arg('lote');
  if (numLote !== undefined) {
    // Precificar UM lote até o fim é o que produz teto. A lista global espalha esforço por
    // 57 lotes e não fecha nenhum — foi o erro da primeira versão deste fluxo.
    const evento = await carregarEvento();
    const { porLote } = await lerManifestosDoCache(evento);
    const m = porLote.get(Number(numLote));
    if (!m) {
      console.error(`lote ${numLote} sem manifesto em cache — rode \`baixar\` primeiro`);
      process.exit(2);
    }
    const linhas = priorizar(new Map([[Number(numLote), m.itens]]));
    const relevantes = linhas.filter((l) => l.faixa !== 'C');
    const saida = resolve(arg('saida') ?? `precos-lote${numLote}.json`);
    await writeFile(saida, JSON.stringify(esqueletoPriorizado(linhas), null, 2), 'utf8');
    console.log(`esqueleto do lote ${numLote}: ${saida}`);
    console.log(`  ${m.itens.length} itens · ${relevantes.length} a precificar (faixa A/B) · ${linhas.length - relevantes.length} irrisórios`);
    console.log('\n  itens, em ordem de impacto — cole TODOS num prompt de uma vez:');
    for (const l of relevantes) {
      console.log(`    ${JSON.stringify({ chave: l.chave, item: l.descricao, un: l.unidadesTotais, faixa: l.faixa })}`);
    }
    return;
  }

  if (!temFlag('todos')) {
    // Modo antigo: só o lote 3, útil para inspecionar um manifesto isolado.
    const m = await lerManifesto(MANIFESTO_LOTE3);
    const saida = resolve(arg('saida') ?? 'precos-lote3.json');
    await writeFile(saida, JSON.stringify(esqueleto(m.itens), null, 2), 'utf8');
    console.log(`esqueleto de preços: ${saida} · ${m.itens.length} itens`);
    return;
  }

  const evento = await carregarEvento();
  const { porLote } = await lerManifestosDoCache(evento);
  if (porLote.size === 0) {
    console.error('nenhum manifesto em cache — rode `baixar` primeiro');
    process.exit(2);
  }

  const itensPorLote = new Map<number, ItemManifesto[]>(
    [...porLote].map(([n, m]) => [n, m.itens]),
  );
  const linhas = priorizar(itensPorLote);
  const saida = resolve(arg('saida') ?? 'precos.json');
  await writeFile(saida, JSON.stringify(esqueletoPriorizado(linhas), null, 2), 'utf8');

  const totalItens = [...itensPorLote.values()].reduce((s, i) => s + i.length, 0);
  const relevantes = linhas.filter((l) => l.faixa !== 'C');
  console.log(`esqueleto priorizado: ${saida}`);
  console.log(`  ${porLote.size} manifestos · ${totalItens} linhas de item · ${linhas.length} descrições distintas`);
  console.log(`  ${relevantes.length} relevantes (faixa A/B) · ${linhas.length - relevantes.length} irrisórias (C, valem zero)`);
  console.log('\n  as 15 primeiras, por impacto:');
  for (const l of linhas.slice(0, 15)) {
    console.log(
      `    ${String(l.unidadesTotais).padStart(4)} un · ${l.lotes.length} lote(s) · ${l.faixa} · ${l.descricao.slice(0, 58)}`,
    );
  }
  console.log('\n  preencha "preco" de cima para baixo; deixe null o que não souber');
}

/**
 * Shortlist por custo/unidade efetiva — métrica que **não precisa de preço nenhum**.
 *
 * É o filtro barato que deve vir ANTES de precificar: precificar um lote até o fim rende um
 * teto real, e é melhor escolher quais lotes merecem esse esforço com uma métrica gratuita.
 */
async function comandoShortlist(): Promise<void> {
  const cfg = { ...CONFIG_PADRAO };
  const frete = arg('frete');
  if (frete !== undefined) {
    cfg.freteporLote = Number(frete);
    cfg.freteInformado = true;
  }
  const evento = await carregarEvento();
  const { porLote } = await lerManifestosDoCache(evento);
  const caminhoPrecos = arg('precos');
  const precos = caminhoPrecos ? await carregarPrecos(caminhoPrecos) : null;

  const f = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const rows = [];
  for (const lote of evento.lotes) {
    const m = porLote.get(lote.numero);
    if (!m || lote.encerrado) continue;
    const itens = aplicar(m.itens, precos?.itens ?? {});
    const relevantes = itens.filter((i) => i.faixa !== 'C');
    const efetivas = relevantes.reduce((s, i) => s + i.quantidade, 0);
    if (efetivas === 0) continue;
    const custo = calcularCusto(lote.lance, cfg).total;
    const declaradas = reconciliar(lote.titulo, null).valor ?? 0;
    const cob = cobertura(itens);
    rows.push({
      n: lote.numero,
      cpu: custo / efetivas,
      efetivas,
      declaradas,
      custo,
      aPrecificar: cob.pendentes,
      cat: detectar(lote.titulo),
    });
  }
  rows.sort((a, b) => a.cpu - b.cpu);
  const n = Number(arg('top') ?? 12);

  console.log(`\ncandidatos por custo/unidade efetiva — nenhum preço necessário para este ranking\n`);
  console.log('  lote   custo/un   efetivas/declaradas        custo   a precificar  categoria');
  for (const r of rows.slice(0, n)) {
    const infla = r.declaradas > 0 ? `${((1 - r.efetivas / r.declaradas) * 100).toFixed(0)}%` : '—';
    console.log(
      `  ${String(r.n).padStart(4)}  ${f(r.cpu).padStart(9)}  ${String(r.efetivas).padStart(4)}/${String(r.declaradas).padEnd(4)} (infla ${infla.padStart(3)})  ${f(r.custo).padStart(9)}  ${String(r.aPrecificar).padStart(4)} itens   ${r.cat}`,
    );
  }
  console.log(`\n  para dar teto a um destes: npm run cli -- precos --lote <n> --fixture`);
}

const comando = process.argv[2];
if (comando === 'baixar') await comandoBaixar();
else if (comando === 'shortlist') await comandoShortlist();
else if (comando === 'estudo') await comandoEstudo();
else if (comando === 'precos') await comandoEsqueleto();
else if (comando === 'custo') comandoCusto();
else {
  console.log(`uso:
  npm run cli -- estudo --fixture [--refresh 15] [--frete 150] [--precos p.json]
  npm run cli -- estudo --url https://www.superbid.net/evento/<slug>-<id>
  npm run cli -- baixar --fixture              # baixa os 57 manifestos (throttle + cache)
  npm run cli -- shortlist --fixture --frete 150   # candidatos, sem precisar de preço
  npm run cli -- precos --lote 4 --fixture         # itens de UM lote, para precificar até o fim
  npm run cli -- precos --todos --fixture          # lista global (espalha esforço, ver README)
  npm run cli -- precos                        # só o lote 3
  npm run cli -- custo --lance 3460`);
  process.exit(comando ? 2 : 0);
}
