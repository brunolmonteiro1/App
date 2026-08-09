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
import { compor, reconciliarComTitulo } from '../analise/embalagem.ts';
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

  // A composição é a camada 0: separa item nomeado de caixa fechada de diversos, e conta kit
  // como 1 produto. É o que faz o custo por item significar alguma coisa.
  const composicao = manifesto ? compor(manifesto.itens) : null;
  const rec = composicao ? reconciliarComTitulo(composicao, declaradas) : null;

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
      composicao,
    },
    cfg,
  );

  // `conferir` recebe a composição para NÃO alertar sobre a divergência entre o título e a soma
  // da coluna quantidade: em 30 lotes ela existe porque o título conta o conteúdo das caixas de
  // diversos, e o alerta antigo disparava por um motivo que não existia.
  const alertas = ignorado
    ? [`categoria "${cfg.categorias[categoria].rotulo}" — você não trabalha com isso`]
    : manifesto
      ? conferir(manifesto, refDoTitulo(lote.titulo), declaradas, composicao?.total ?? null)
      : [];
  if (!ignorado && !manifesto && lote.anexos.length === 0) alertas.push('lote sem PDF de anexo');
  if (!ignorado && !manifesto && lote.anexos.length > 0) alertas.push('manifesto ainda não processado');

  if (composicao && !ignorado) {
    if (composicao.fracaoEmCaixa >= cfg.regra.fracaoEmCaixaGrave) {
      const q = composicao.caixas.length;
      alertas.push(
        `${(composicao.fracaoEmCaixa * 100).toFixed(0)}% do lote (${composicao.volumeEmCaixa} peças) vem em ` +
          `${q} caixa${q > 1 ? 's' : ''} de "diversos", sem item nomeado — risco diferente, não necessariamente ruim`,
      );
    }
    if (rec?.tipo === 'titulo-conta-pecas') {
      alertas.push(
        `o título conta peças dentro de embalagem: declara ${declaradas} e o manifesto lista ` +
          `${composicao.total} — o custo por item real é ${rec.fator.toFixed(1)}× o da conta pelo título`,
      );
    }
  }

  if (manifesto && !ignorado) {
    const cob = cobertura(itens);
    if (cob.pendentes > 0 && av.baseDoTeto === 'regra') {
      alertas.push(
        `teto pela sua regra de R$/item; ${cob.pendentes} item(ns) sem preço — precificar daria a segunda visão`,
      );
    }
  }

  // Com preço, os 5 que mais somam valor. SEM preço isso saía tudo zero e a lista virava
  // ordem alfabética do azar — então cai nas âncoras, que não precisam de preço nenhum.
  const comValor = itens.filter((i) => i.faixa !== 'C' && i.precoOnline != null);
  const topItens = comValor.length
    ? comValor
        .map((i) => ({
          descricao: i.descricao,
          quantidade: i.quantidade,
          valor: i.quantidade * (i.precoOnline ?? 0),
        }))
        .sort((a, b) => b.valor - a.valor || b.quantidade - a.quantidade)
        .slice(0, 5)
    : av.ancoras.map((a) => ({ descricao: a.descricao, quantidade: a.quantidade, valor: 0 }));

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
    unidadesTitulo: declaradas,
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
