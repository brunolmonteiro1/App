/**
 * O teto de lance — o produto final da ferramenta.
 *
 * Sai de trás para frente: do retorno exigido, não do valor do lote para frente.
 *
 *   valor_realizado = valor_online × fator_bazar × (1 − perda)
 *   teto_custo      = valor_realizado / multiplo
 *   teto_martelo    = (teto_custo − taxa_fixa − frete) / (1 + percentual)
 */

import { CONFIG_PADRAO, type Categoria, type Config } from '../config.ts';
import { calcularCusto, martelaDoTeto, ultimoLanceValido, type Custo } from './custo.ts';
import type { ItemAvaliado } from './faixa.ts';
import type { Composicao } from './embalagem.ts';
import { ancoras } from './valor.ts';

/**
 * A cor da decisão.
 *
 * **`sem-cobertura` foi retirado**, e a história importa. Ele existia porque o único caminho de
 * teto era o valor de revenda: com 3% dos itens precificados, o lote 3 aparecia como
 * "teto R$ 26 · PARE", que lê como "lote horrível" quando significa "precificamos 3 de 59 itens".
 * O estado azul separava "não sei" de "lote caro", que são informações opostas.
 *
 * A proteção continua inteira, só mudou de mecanismo: abaixo do portão de cobertura o teto por
 * VALOR não é oferecido (`baseDoTeto` nunca diz `valor` nem `ambos`), e o que aparece é o teto
 * pela regra de R$/item do operador — que não depende de preço e vem rotulado como tal. Manter
 * um estado inalcançável no tipo só produziria ramo morto na renderização.
 */
export type Semaforo = 'verde' | 'amarelo' | 'vermelho' | 'sem-teto' | 'ignorado' | 'encerrado';

/** De onde veio o teto que está governando a decisão. */
export type BaseDoTeto =
  /** Da regra de R$/item do operador. Funciona sem precificar nada. */
  | 'regra'
  /** Do valor de revenda dos itens. Exige cobertura de preço. */
  | 'valor'
  /** Os dois existem, e vale o menor. */
  | 'ambos'
  | 'nenhum';

export interface Avaliacao {
  categoria: Categoria;
  multiplo: number;
  perda: number;

  // ── Camada 0: custo real, sem depender de preço ──────────────────────────────

  /** Peças com nome/marca/modelo; kit conta 1. */
  itensNomeados: number;
  /** Peças que vêm dentro de caixa de diversos, sem nome. */
  volumeEmCaixa: number;
  /** Fração do lote que é caixa fechada. Alto = risco de natureza diferente. */
  fracaoEmCaixa: number;
  /** Custo total ÷ itens declarados no título. **É a conta que o operador faz de cabeça.** */
  custoPorItemTitulo: number | null;
  /** Custo total ÷ itens nomeados. A base honesta, para contraste. */
  custoPorItemNomeado: number | null;
  /** Maior lance em que o custo por item ainda cabe na regra. Não precisa de preço. */
  tetoPorRegra: number;
  /** Divisor efetivamente usado no `tetoPorRegra`, para a tela poder explicar. */
  divisorDaRegra: number;

  // ── Camada 1: lucro estimado, um número por categoria ───────────────────────

  /** Faturamento dos itens NOMEADOS: `unidadesEfetivas × venda média da categoria`. */
  faturamentoNomeados: number | null;
  /** Faturamento do VOLUME: faixa C + conteúdo das caixas de diversos. */
  faturamentoVolume: number | null;
  /** Soma dos dois. `null` enquanto faltar um dos dois parâmetros — ver `faltaVendaVolume`. */
  faturamentoEstimado: number | null;
  lucroEstimado: number | null;
  margemEstimada: number | null;
  /**
   * true quando o lote TEM volume mas falta o preço de venda dele.
   *
   * O lucro fica `null` neste caso, de propósito. Mostrar só a parte dos nomeados daria número
   * negativo em quase todo lote — o mesmo erro do teto sem cobertura, na direção oposta.
   */
  faltaVendaVolume: boolean;

  /** Os itens de valor agregado alto, detectados sem preço. */
  ancoras: { descricao: string; quantidade: number; classe: number }[];

  /**
   * **Limite duro**: acima daqui é PARE. É o menor entre o teto máximo por valor (60%) e o teto
   * pela regra de R$/item — os dois "não passe disto", e vale o que aperta primeiro.
   */
  tetoOperante: number;
  /**
   * **Patamar confortável**: até aqui é verde. Menor entre o teto seguro por valor (40%) e o
   * alvo de R$/item (onde ele costuma comprar, R$ 10–14 no histórico).
   *
   * Existe separado do limite duro para preservar a faixa amarela. Colapsar os dois num número
   * só apagaria a zona "só com conhecimento da categoria", que é decisão dele, não do programa.
   */
  tetoConfortavel: number;
  baseDoTeto: BaseDoTeto;

  /** Σ (qtd × preço) das faixas A e B. C não entra. */
  valorOnline: number;
  valorRealizadoMin: number;
  valorRealizadoMax: number;

  /** Teto conservador (fator 0,40): dá lance até aqui sem pensar. */
  tetoSeguro: number;
  /** Teto otimista (fator 0,60): entre os dois, só conhecendo a categoria. */
  tetoMaximo: number;

  /** Unidades que têm preço de verdade (faixas A + B). */
  unidadesEfetivas: number;
  /** Unidades da faixa C: giram no bazar, mas não pagamos por elas. */
  volumeBazar: number;

  /** Concentração de valor nos 5 maiores itens. Alta = risco. */
  concentracao: number;

  /** Fração das unidades efetivas que tem preço. */
  cobertura: number;
  /**
   * Fração das LINHAS relevantes que tem preço. Precisa ser checada junto com `cobertura`:
   * um lote pode ter 68% das unidades precificadas por causa de uma única linha de item
   * barato e alto volume, enquanto o item caro — que é o valor do lote — fica sem preço.
   * Foi o caso do lote 202: 48 rodas de patinete passavam o gate e o climatizador Springer
   * contava zero, produzindo "teto R$ 0 · PARE" num lote que ninguém avaliou.
   */
  coberturaLinhas: number;
  /** Unidades efetivas ainda sem preço — o que falta precificar neste lote. */
  unidadesSemPreco: number;

  custoAtual: Custo;
  custoPorUnidadeEfetiva: number | null;
  custoPorUnidadeDeclarada: number | null;
  /** Margem do lance atual contra o valor realizado conservador. */
  margem: number | null;

  /** O número de ação: maior lance válido que ainda cabe no patamar confortável. */
  lanceSugerido: number | null;
  /** Maior lance válido que ainda cabe no limite duro. Acima do sugerido, e não substitui ele. */
  lanceMaximo: number | null;
  semaforo: Semaforo;
}

export interface EntradaAvaliacao {
  itens: ItemAvaliado[];
  categoria: Categoria;
  lanceAtual: number;
  incremento: number;
  temLances: boolean;
  encerrado: boolean;
  /** Contagem do TÍTULO — a base da regra do operador. */
  unidadesDeclaradas: number | null;
  /** Composição do manifesto. Sem ela, a camada 0 não existe e o lote fica só no caminho do valor. */
  composicao?: Composicao | null;
  /** Lote de categoria que o operador não trabalha. */
  ignorado?: boolean;
}

export function avaliar(e: EntradaAvaliacao, cfg: Config = CONFIG_PADRAO): Avaliacao {
  const cat = cfg.categorias[e.categoria];
  const comPreco = e.itens.filter((i) => i.faixa !== 'C');

  // Faixa B entra com peso menor: "só sai a preço baixo de bazar".
  const peso = (f: string) => (f === 'B' ? cfg.fatorB : 1);
  const valorOnline = comPreco.reduce(
    (s, i) => s + i.quantidade * (i.precoOnline ?? 0) * peso(i.faixa),
    0,
  );
  const unidadesEfetivas = comPreco.reduce((s, i) => s + i.quantidade, 0);

  // Cobertura é medida em UNIDADES, não em linhas: precificar um item de 96 unidades vale
  // muito mais que precificar 96 itens de 1 unidade.
  const unidadesComPreco = comPreco
    .filter((i) => i.precoOnline != null)
    .reduce((s, i) => s + i.quantidade, 0);
  const cobertura = unidadesEfetivas > 0 ? unidadesComPreco / unidadesEfetivas : 0;

  const linhasComPreco = comPreco.filter((i) => i.precoOnline != null).length;
  const coberturaLinhas = comPreco.length > 0 ? linhasComPreco / comPreco.length : 0;

  // AS DUAS têm de passar. Só unidades deixa escapar o lote onde uma linha de item barato e
  // alto volume cobre o gate enquanto o item caro fica sem preço.
  const coberturaOk =
    cobertura >= cfg.coberturaMinima && coberturaLinhas >= cfg.coberturaMinimaLinhas;
  const volumeBazar = e.itens
    .filter((i) => i.faixa === 'C')
    .reduce((s, i) => s + i.quantidade, 0);

  const base = valorOnline * (1 - cat.perda);
  const valorRealizadoMin = base * cfg.fatorBazar.conservador;
  const valorRealizadoMax = base * cfg.fatorBazar.otimista;

  const tetoSeguro = martelaDoTeto(
    valorRealizadoMin / cat.multiplo,
    cfg.encargos,
    cfg.freteporLote,
  );
  const tetoMaximo = martelaDoTeto(
    valorRealizadoMax / cat.multiplo,
    cfg.encargos,
    cfg.freteporLote,
  );

  // Concentração: quanto do valor está nos 5 maiores itens.
  const porItem = comPreco
    .map((i) => i.quantidade * (i.precoOnline ?? 0) * peso(i.faixa))
    .sort((a, b) => b - a);
  const top5 = porItem.slice(0, 5).reduce((s, v) => s + v, 0);

  const custoAtual = calcularCusto(e.lanceAtual, cfg);

  // ── Camada 0: a regra de R$/item. Não depende de preço nenhum. ─────────────────
  const comp = e.composicao ?? null;
  const doTitulo = e.unidadesDeclaradas ?? null;
  const nomeados = comp?.itensNomeados ?? null;

  // O divisor segue a base configurada, com queda para o que existir. Ordem importa: a base do
  // título é a única em que os R$ 10–14 do histórico dele estão calibrados.
  const divisorDaRegra =
    (cfg.regra.base === 'titulo' ? doTitulo : cfg.regra.base === 'nomeados' ? nomeados : unidadesEfetivas || null) ??
    doTitulo ??
    nomeados ??
    0;

  const tetoPorRegra =
    divisorDaRegra > 0 && !e.ignorado
      ? martelaDoTeto(cfg.regra.custoPorItemMaximo * divisorDaRegra, cfg.encargos, cfg.freteporLote)
      : 0;

  // ── Camada 1: lucro por venda média. Dois números, não mil. ───────────────────
  //
  // O volume entra no faturamento e NÃO entra no teto, e essa assimetria é deliberada: ele não
  // paga por bugiganga, mas vende bugiganga. Ignorar isso no faturamento pintava prejuízo em
  // quase todo lote do evento.
  const vendaMedia = cfg.vendaMediaPorItemUtil[e.categoria];
  const vendaVolume = cfg.vendaMediaPorItemVolume;
  const unidadesDeVolume = volumeBazar + (comp?.volumeEmCaixa ?? 0);

  const faturamentoNomeados =
    vendaMedia != null && unidadesEfetivas > 0 ? unidadesEfetivas * vendaMedia * (1 - cat.perda) : null;
  const faturamentoVolume =
    vendaVolume != null && unidadesDeVolume > 0 ? unidadesDeVolume * vendaVolume * (1 - cat.perda) : null;

  const faltaVendaVolume = unidadesDeVolume > 0 && vendaVolume == null;
  const faturamentoEstimado =
    faturamentoNomeados === null || faltaVendaVolume
      ? null
      : faturamentoNomeados + (faturamentoVolume ?? 0);
  const lucroEstimado = faturamentoEstimado != null ? faturamentoEstimado - custoAtual.total : null;

  // Sem cobertura suficiente o teto por VALOR existe internamente mas não decide nada.
  const temTetoPorValor = valorOnline > 0 && coberturaOk && !e.ignorado;
  const temTetoPorRegra = tetoPorRegra > 0;

  // Os dois tetos respondem perguntas diferentes — "quanto isso vale revendido?" e "quanto eu
  // aceito pagar por item?" — então quando os dois existem vale a restrição que aperta primeiro.
  const baseDoTeto: BaseDoTeto =
    temTetoPorValor && temTetoPorRegra ? 'ambos' : temTetoPorValor ? 'valor' : temTetoPorRegra ? 'regra' : 'nenhum';

  // O alvo de R$/item: onde ele costuma comprar, e não onde ele para.
  const tetoAlvoRegra = temTetoPorRegra
    ? martelaDoTeto(cfg.regra.custoPorItemAlvo * divisorDaRegra, cfg.encargos, cfg.freteporLote)
    : 0;

  // Dois níveis, e por isso o `min` é aplicado nível por nível: o limite duro de um caminho não
  // pode virar o patamar confortável do outro.
  const INFINITO = Number.POSITIVE_INFINITY;
  const duroValor = temTetoPorValor ? tetoMaximo : INFINITO;
  const duroRegra = temTetoPorRegra ? tetoPorRegra : INFINITO;
  const confValor = temTetoPorValor ? tetoSeguro : INFINITO;
  const confRegra = temTetoPorRegra ? tetoAlvoRegra : INFINITO;

  const tetoOperante = baseDoTeto === 'nenhum' ? 0 : Math.min(duroValor, duroRegra);
  const tetoConfortavel = baseDoTeto === 'nenhum' ? 0 : Math.min(confValor, confRegra);

  const lanceSugerido =
    tetoConfortavel > 0 && !e.encerrado
      ? ultimoLanceValido(e.lanceAtual, e.incremento, tetoConfortavel, e.temLances)
      : null;
  const lanceMaximo =
    tetoOperante > 0 && !e.encerrado
      ? ultimoLanceValido(e.lanceAtual, e.incremento, tetoOperante, e.temLances)
      : null;

  return {
    categoria: e.categoria,
    multiplo: cat.multiplo,
    perda: cat.perda,
    itensNomeados: nomeados ?? 0,
    volumeEmCaixa: comp?.volumeEmCaixa ?? 0,
    fracaoEmCaixa: comp?.fracaoEmCaixa ?? 0,
    custoPorItemTitulo: doTitulo && doTitulo > 0 ? custoAtual.total / doTitulo : null,
    custoPorItemNomeado: nomeados && nomeados > 0 ? custoAtual.total / nomeados : null,
    tetoPorRegra,
    divisorDaRegra,
    faturamentoNomeados,
    faturamentoVolume,
    faltaVendaVolume,
    faturamentoEstimado,
    lucroEstimado,
    margemEstimada:
      faturamentoEstimado != null && custoAtual.total > 0 ? faturamentoEstimado / custoAtual.total : null,
    ancoras: ancoras(e.itens).map(({ descricao, quantidade, classe }) => ({ descricao, quantidade, classe })),
    tetoOperante,
    tetoConfortavel,
    baseDoTeto,
    valorOnline,
    valorRealizadoMin,
    valorRealizadoMax,
    tetoSeguro,
    tetoMaximo,
    unidadesEfetivas,
    volumeBazar,
    concentracao: valorOnline > 0 ? top5 / valorOnline : 0,
    cobertura,
    coberturaLinhas,
    unidadesSemPreco: unidadesEfetivas - unidadesComPreco,
    custoAtual,
    custoPorUnidadeEfetiva: unidadesEfetivas > 0 ? custoAtual.total / unidadesEfetivas : null,
    custoPorUnidadeDeclarada:
      e.unidadesDeclaradas && e.unidadesDeclaradas > 0
        ? custoAtual.total / e.unidadesDeclaradas
        : null,
    margem: temTetoPorValor && custoAtual.total > 0 ? valorRealizadoMin / custoAtual.total : null,
    lanceSugerido,
    lanceMaximo,
    semaforo: semaforoDe(e, { tetoOperante, tetoConfortavel, baseDoTeto }),
  };
}

/**
 * A cor da decisão.
 *
 * Mudou de fundamento: antes só existia o caminho do valor de revenda, então lote sem preço caía
 * em `sem-cobertura` e não oferecia decisão nenhuma — 33 dos 61 lotes deste evento. Agora a regra
 * de R$/item dá um teto que existe desde o primeiro segundo, e `sem-cobertura` sobra apenas para
 * o lote que não tem nem manifesto nem preço.
 */
function semaforoDe(
  e: EntradaAvaliacao,
  x: { tetoOperante: number; tetoConfortavel: number; baseDoTeto: BaseDoTeto },
): Semaforo {
  if (e.encerrado) return 'encerrado';
  // Categoria que o operador não trabalha: decisão dele, não falta de dado.
  if (e.ignorado) return 'ignorado';
  if (x.baseDoTeto === 'nenhum') return 'sem-teto';

  // O que decide é o próximo lance que ele teria de dar, não o lance atual: cobrir significa
  // pagar um degrau acima de quem está na frente.
  const proximo = e.temLances ? e.lanceAtual + e.incremento : e.lanceAtual;
  if (proximo > x.tetoOperante) return 'vermelho';
  return proximo <= x.tetoConfortavel ? 'verde' : 'amarelo';
}
