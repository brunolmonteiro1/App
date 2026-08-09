/**
 * Monta a linha do estudo de um lote — o passo que junta manifesto, preço, custo e teto.
 *
 * Estava dentro do `cli.ts`. Saiu de lá porque agora tem **dois** consumidores: o `gerar`,
 * que produz o HTML, e o painel, que recalcula o teto a cada preço digitado na tela de
 * precificação. Duplicar esta função nos dois seria garantir que a tela e o estudo
 * divergissem em silêncio — e divergência num número que autoriza lance real é o erro que
 * não se paga.
 */

import type { Config } from '../config.ts';
import type { Lote } from '../superbid/api.ts';
import { detectar } from '../analise/categoria.ts';
import { degrauProximo } from '../analise/custo.ts';
import { aplicar, cobertura, type ArquivoPrecos } from '../analise/valor.ts';
import { reconciliar, refDoTitulo } from '../analise/quantidade.ts';
import { avaliar } from '../analise/teto.ts';
import { conferir, type Manifesto } from '../superbid/manifesto.ts';
import { manifestoDo, type Snapshot } from './snapshot.ts';
import type { LinhaEstudo } from './pagina.ts';

/** Monta a linha do estudo de um lote. `manifesto` é opcional: sem ele, não há teto. */
export function montarLinha(
  lote: Lote,
  manifesto: Manifesto | null,
  cfg: Config,
  precos: ArquivoPrecos | null,
): LinhaEstudo {
  const itens = manifesto ? aplicar(manifesto.itens, precos?.itens ?? {}, cfg.termosIgnorados, cfg.excecoesIgnorados) : [];
  const unidades = reconciliar(lote.titulo, manifesto?.somaQuantidades ?? null);
  const declaradas = reconciliar(lote.titulo, null).valor;

  const categoria = detectar(lote.titulo);
  const ignorado = cfg.categoriasIgnoradas.includes(categoria);
  const av = avaliar(
    {
      itens,
      ignorado,
      categoria,
      lanceAtual: lote.lance,
      incremento: lote.incremento,
      temLances: lote.temLances,
      encerrado: lote.encerrado,
      unidadesDeclaradas: declaradas,
    },
    cfg,
  );

  const alertas = ignorado
    ? [`categoria "${cfg.categorias[categoria].rotulo}" — você não trabalha com isso`]
    : manifesto
      ? conferir(manifesto, refDoTitulo(lote.titulo), declaradas)
      : [];
  if (!ignorado && !manifesto && lote.anexos.length === 0) alertas.push('lote sem PDF de anexo');
  if (!ignorado && !manifesto && lote.anexos.length > 0) alertas.push('manifesto ainda não processado');
  if (manifesto && !ignorado) {
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

/** Config do snapshot: a mesma do `gerar`, com o frete daquela execução. */
export function configDoSnapshot(s: Snapshot, base: Config): Config {
  if (s.frete === null) return { ...base };
  return { ...base, freteporLote: s.frete, freteInformado: true };
}

/** Todas as linhas do estudo a partir do snapshot — sem tocar em PDF nem na rede. */
export function montarLinhas(s: Snapshot, cfg: Config, precos: ArquivoPrecos | null): LinhaEstudo[] {
  return s.evento.lotes.map((lote) => montarLinha(lote, manifestoDo(s, lote.numero), cfg, precos));
}
