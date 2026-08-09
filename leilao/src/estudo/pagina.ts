/**
 * O estudo: uma página que o operador mantém aberta ao lado do BidTV.
 *
 * Desenho a serviço de um uso só — bater o olho dezenas de vezes ao longo de duas ou três
 * horas de pregão e decidir cobrir ou não. Por isso o número de ação (`lanceSugerido`) é o
 * maior elemento de cada linha, e a cor carrega a decisão.
 *
 * Com `--refresh`, a própria página busca os lances no navegador. A API responde
 * `access-control-allow-origin: *` (verificado), então não precisa de servidor nem proxy:
 * é um arquivo, duplo clique, e ele se atualiza.
 *
 * A página NUNCA dá lance. O clique é sempre do operador, na janela do BidTV.
 */

import type { Evento, FusoPayload, Lote } from '../superbid/api.ts';
import type { Config } from '../config.ts';
import type { Avaliacao } from '../analise/teto.ts';
import { montarUrl } from '../superbid/api.ts';

export interface LinhaEstudo {
  lote: Lote;
  av: Avaliacao;
  alertas: string[];
  /** Reconciliada: soma do manifesto quando existe, senão a do título. */
  unidadesDeclaradas: number | null;
  /**
   * A contagem do TÍTULO, sem reconciliar. É a base da regra de R$/item do operador, então o
   * cartão precisa dela separada — rotular a soma do manifesto como "no título" fazia o número
   * contradizer o R$/item declarado exibido ao lado (28 contra 283, no lote 11).
   */
  unidadesTitulo: number | null;
  fonteUnidades: string;
  topItens: { descricao: string; quantidade: number; valor: number }[];
  /** Preenchido só quando o próximo lance atravessa uma fronteira da tabela de encargos. */
  degrau?: { limite: number; salto: number } | null;
}

const brl = (v: number | null) =>
  v === null
    ? '—'
    : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(0)}%`);

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Hora sempre no fuso do pregão (America/Sao_Paulo).
 *
 * Quando o payload veio em UTC, converte — mostrar 18:30 onde o site diz 15:30 daria
 * três horas a mais ao operador, num leilão decidido no último segundo.
 */
function horaPregao(iso: string, fuso: FusoPayload): string {
  if (!iso) return '—';
  if (fuso === 'America/Sao_Paulo') return iso.replace('T', ' ').slice(0, 16);
  const d = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(d).replace(',', '');
}

export function gerarPagina(
  evento: Evento,
  linhas: LinhaEstudo[],
  cfg: Config,
  refreshSegundos: number | null,
  precosDeExemplo = false,
): string {
  const incompleto = !cfg.freteInformado;
  const semTeto = linhas.filter((l) => l.av.semaforo === 'sem-teto').length;
  const soPelaRegra = linhas.filter((l) => l.av.baseDoTeto === 'regra').length;
  const semVolume = linhas.filter((l) => l.av.faltaVendaVolume).length;
  const ignorados = linhas.filter((l) => l.av.semaforo === 'ignorado').length;
  const comTeto = linhas.filter(
    (l) => l.av.semaforo === 'verde' || l.av.semaforo === 'amarelo' || l.av.semaforo === 'vermelho',
  ).length;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Estudo de lotes — leilão ${evento.auctionId}</title>
<style>
  :root{
    --bg:#0f1115; --card:#171a21; --linha:#232833; --txt:#e8ebf0; --fraco:#8b93a3;
    --verde:#1f9d55; --amarelo:#b8860b; --vermelho:#c0392b; --cinza:#4a5160;
    --destaque:#7c5cff;
  }
  @media (prefers-color-scheme: light){
    :root{ --bg:#f6f7f9; --card:#fff; --linha:#e3e6ec; --txt:#1a1d24; --fraco:#5b6270; }
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);
       font:15px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  header{position:sticky;top:0;z-index:5;background:var(--bg);
         border-bottom:1px solid var(--linha);padding:14px 18px}
  h1{margin:0 0 4px;font-size:17px}
  .meta{color:var(--fraco);font-size:13px}
  .aviso{background:#3a2d0a;color:#f0d27a;padding:8px 12px;border-radius:6px;
         margin-top:10px;font-size:13px}
  @media (prefers-color-scheme: light){ .aviso{background:#fff5d6;color:#6b5200} }
  .aviso.grave{background:#4a1210;color:#ffb4ab}
  @media (prefers-color-scheme: light){ .aviso.grave{background:#ffe2de;color:#8c1d18} }
  .busca{margin-top:10px;padding:7px 11px;border-radius:6px;border:1px solid var(--linha);
         background:var(--card);color:var(--txt);width:min(320px,100%);font-size:14px}
  main{padding:14px 18px 60px;display:grid;gap:10px}
  .lote{background:var(--card);border:1px solid var(--linha);border-left-width:5px;
        border-radius:8px;padding:12px 14px;display:grid;
        grid-template-columns:1fr auto;gap:12px;align-items:start}
  .lote[data-cor=verde]{border-left-color:var(--verde)}
  .lote[data-cor=amarelo]{border-left-color:var(--amarelo)}
  .lote[data-cor=vermelho]{border-left-color:var(--vermelho)}
  .lote[data-cor=sem-teto],.lote[data-cor=encerrado]{border-left-color:var(--cinza);opacity:.62}
  /* Ignorado é decisão do operador, não falta de dado: apaga bem e não pede ação. */
  .lote[data-cor=ignorado]{border-left-color:var(--cinza);opacity:.4}
  .ignorado .val{font-size:15px;color:var(--fraco)}
  /* Azul, nunca vermelho: "não sei" e "lote caro" são coisas opostas. */
  .lote[data-cor=sem-cobertura]{border-left-color:#4a7ab8}
  .sem-cobertura .val{font-size:19px;color:#8ab4f8}
  @media (prefers-color-scheme: light){ .sem-cobertura .val{color:#1a4d8f} }
  .num{font-weight:700;font-size:15px}
  .num span{color:var(--fraco);font-weight:400;font-size:13px;margin-left:6px}
  .tit{color:var(--fraco);font-size:13px;margin:3px 0 8px}
  .grade{display:flex;flex-wrap:wrap;gap:14px;font-size:13px}
  .grade b{display:block;color:var(--fraco);font-weight:500;font-size:11px;
           text-transform:uppercase;letter-spacing:.04em}
  .acao{text-align:right;min-width:186px}
  .acao .rot{font-size:11px;color:var(--fraco);text-transform:uppercase;letter-spacing:.04em}
  .acao .val{font-size:30px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
  .verde .val{color:var(--verde)} .amarelo .val{color:var(--amarelo)}
  .vermelho .val{color:var(--vermelho)}
  .acao .sub{font-size:12px;color:var(--fraco);margin-top:3px}
  .itens{margin:8px 0 0;padding:0;list-style:none;font-size:12px;color:var(--fraco)}
  .itens li{display:flex;gap:6px}
  .alerta{margin-top:7px;font-size:12px;color:#e0a030}
  /* R$/item é o número que o operador usa para decidir; a cor é a leitura instantânea. */
  .grade .cpi strong{font-size:16px}
  .grade .cpi.alvo strong{color:var(--verde)}
  .grade .cpi.ok strong{color:var(--amarelo)}
  .grade .cpi.fora strong{color:var(--vermelho)}
  .grade small{display:block;color:var(--fraco);font-size:10px;font-weight:400}
  .rot-itens{margin-top:8px;font-size:10px;color:var(--fraco);text-transform:uppercase;
             letter-spacing:.04em}
  .ordena{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .ordena span{font-size:11px;color:var(--fraco);text-transform:uppercase;letter-spacing:.04em}
  .ordena button{padding:5px 10px;border-radius:6px;border:1px solid var(--linha);
                 background:var(--card);color:var(--txt);font-size:12px;cursor:pointer}
  .ordena button[aria-pressed=true]{border-color:var(--destaque);color:var(--destaque)}
  .anota{margin-top:8px;font-size:12px;color:var(--fraco)}
  .anota input{background:transparent;border:none;border-bottom:1px dashed var(--linha);
               color:var(--txt);width:96px;font-size:12px;padding:2px}
  footer{padding:0 18px 40px;color:var(--fraco);font-size:12px;max-width:70ch}
  .tabela-faixas{border-collapse:collapse;margin:10px 0;font-size:11px}
  .tabela-faixas th,.tabela-faixas td{border:1px solid var(--linha);padding:3px 8px;text-align:left}
  .degrau{margin-top:7px;font-size:12px;color:#8ab4f8}
  @media (prefers-color-scheme: light){ .degrau{color:#1a4d8f} }
  .comp{margin-top:6px;font-size:11px;color:var(--fraco)}
  @media (max-width:640px){ .lote{grid-template-columns:1fr} .acao{text-align:left} }
</style>
</head>
<body>
<header>
  <h1>Estudo de lotes — leilão ${evento.auctionId}</h1>
  <div class="meta">
    ${linhas.length} lotes · encerramento a partir de ${horaPregao(evento.encerraEm, evento.fuso)}
    ${evento.prorrogaAte ? ` · prorrogação até ${horaPregao(evento.prorrogaAte, evento.fuso)}` : ''}
    · <span id="quando">lances de ${evento.agora ? horaPregao(evento.agora, evento.fuso) : 'agora'}</span>
  </div>
  ${
    precosDeExemplo
      ? `<div class="aviso grave"><b>PREÇOS DE EXEMPLO — não dê lance por estes números.</b>
      A tabela de preços carregada está marcada como exemplo. Revise item por item antes de usar.</div>`
      : ''
  }
  ${
    incompleto || semTeto || soPelaRegra || ignorados || semVolume
      ? `<div class="aviso">
      ${incompleto ? '<b>Custo incompleto:</b> frete de retirada não informado, então o teto está mais alto do que deveria. ' : ''}
      ${semTeto ? `<b>${semTeto} lote(s) sem teto:</b> nem contagem no título nem preço, então não há de onde calcular. ` : ''}
      ${semVolume ? `<b>${semVolume} lote(s) sem lucro estimado:</b> falta a venda média da peça de volume (faixa C e conteúdo das caixas de "diversos"). São ~40% das unidades deste evento — sem esse número o lucro sairia negativo em quase tudo, o que seria tão enganoso quanto inflar o teto. ` : ''}
      ${soPelaRegra ? `<b>${soPelaRegra} lote(s) com teto só pela sua regra de R$/item</b> (custo ÷ itens ≤ R$ ${cfg.regra.custoPorItemMaximo}). Isso já decide, e é o que você usa hoje. Precificar um lote acrescenta a segunda visão — valor de revenda — e aí vale o menor dos dois tetos. ` : ''}
      ${ignorados ? `<b>${ignorados} lote(s) ignorado(s)</b> por categoria (${cfg.categoriasIgnoradas.join(', ')}) — ficam na lista para você reconhecê-los quando o leiloeiro chamar, mas sem teto. ` : ''}
      ${comTeto ? `<b>${comTeto} lote(s) com teto utilizável.</b>` : ''}
    </div>`
      : ''
  }
  <input class="busca" id="busca" placeholder="Filtrar por número de lote ou descrição…">
  <div class="ordena">
    <span>ordenar</span>
    <button data-ord="numero" aria-pressed="true">nº do lote (ordem de chamada)</button>
    <button data-ord="cpi" aria-pressed="false">R$/item — mais barato primeiro</button>
    <button data-ord="caixa" aria-pressed="false">mais caixa fechada primeiro</button>
    <button data-ord="lucro" aria-pressed="false">maior lucro estimado</button>
  </div>
</header>
<main id="lista">
${linhas.map((l) => linhaHtml(l, evento.fuso, cfg)).join('\n')}
</main>
<footer>
  <p><b>Como usar:</b> o número grande é o maior lance que ainda cabe no teto. O lance você dá
  no BidTV — esta página não dá lance nenhum.</p>
  <p><b>De onde vem o teto.</b> Há dois caminhos, e cada linha diz qual está valendo:</p>
  <ul>
    <li><b>Pela sua regra</b> — custo total ÷ itens do título ≤
    R$ ${cfg.regra.custoPorItemMaximo}. Não precisa de preço nenhum, então existe desde o primeiro
    segundo. Verde é quando o lance ainda cabe no seu alvo de R$ ${cfg.regra.custoPorItemAlvo}/item;
    amarelo é entre o alvo e o máximo.</li>
    <li><b>Por valor de revenda</b> — Σ(preço × quantidade) × 40–60% ÷ múltiplo da categoria.
    Exige ter precificado o lote. Mais preciso, e mais trabalhoso.</li>
    <li><b>Os dois</b> — vale o <b>menor</b>. Eles respondem perguntas diferentes, e a restrição
    que aperta primeiro é a que manda.</li>
  </ul>
  <p><b>R$/item declarado × R$/item nomeado.</b> A primeira é a sua conta: custo ÷ itens do
  título. A segunda desconta o que vem em <b>caixa de "diversos"</b> sem item nomeado, e conta kit
  fechado (faqueiro de 30 peças, jogo de panelas de 10) como <b>1 produto</b>, que é o que ele é.
  <b>Quando as duas se afastam, é aí que o lote infla.</b> O título não mente — ele conta o
  conteúdo das caixas; o que ele não diz é quanto do lote vem sem nome.</p>
  <p><b>Custo</b> = lance × ${(1 + cfg.encargos.percentual).toFixed(2).replace('.', ',')}
  (leiloeiro 5% + buyer's premium 5%) <b>+ Encargos Adm e Fee Plataforma, que são TABELADOS
  por faixa de lance</b> — do Edital, conferido no estimador do site.</p>
  <p>Por isso o card do site diz "+10%" em todos os lotes e nunca é 10%: o overhead real
  neste evento vai de <b>~15%</b> (lance de R$ 4.990, topo de faixa) a <b>~35%</b> (lance de
  R$ 500). E não cai sempre com o tamanho do lote — <b>cruzar uma faixa salta o encargo</b>:
  de R$ 4.999,99 para R$ 5.000,00 o custo sobe R$ 250 por um centavo de lance. Quando o
  próximo lance atravessa um desses degraus, a linha avisa.</p>
  <table class="tabela-faixas">
    <tr><th>Faixa de lance</th><th>Encargos Adm + Fee</th></tr>
    ${cfg.encargos.faixas
      .map((f, i, todas) => {
        const de = i === 0 ? 0.01 : (todas[i - 1]!.ate + 0.01);
        const ate = f.ate === Infinity ? 'ou mais' : `até ${brl(f.ate)}`;
        return `<tr><td>${brl(de)} ${ate}</td><td>${brl(f.valor)}</td></tr>`;
      })
      .join('')}
  </table>
  <p>Preço estimado é chute informado, não cotação. A decisão de lance é sua.</p>
</footer>
<script>
  // Ordenação local: reordena os cartões no DOM. Sem rede, sem recalcular teto — os números
  // já estão no cartão. O padrão é o número do lote, que é a ordem em que o leiloeiro chama.
  const lista = document.getElementById('lista');
  const botoes = [...document.querySelectorAll('.ordena button')];
  botoes.forEach((b) => b.addEventListener('click', () => {
    botoes.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const chave = b.dataset.ord;
    const cartoes = [...lista.querySelectorAll('.lote')];
    const num = (el, attr) => {
      const v = parseFloat(el.dataset[attr]);
      return Number.isFinite(v) ? v : null;
    };
    cartoes.sort((x, y) => {
      if (chave === 'numero') return num(x, 'numero') - num(y, 'numero');
      // Lote ignorado, encerrado ou sem teto afunda em TODA ordenação. Sem isto, ordenar por
      // R$/item punha um lote de cosméticos no topo — categoria que o operador não trabalha,
      // aparecendo como a melhor oportunidade do evento.
      const fx = num(x, 'fora'), fy = num(y, 'fora');
      if (fx !== fy) return fx - fy;
      // Lote sem o dado vai para o fim, em vez de fingir ser o melhor.
      const a = num(x, chave), b2 = num(y, chave);
      if (a === null && b2 === null) return num(x, 'numero') - num(y, 'numero');
      if (a === null) return 1;
      if (b2 === null) return -1;
      return chave === 'cpi' ? a - b2 : b2 - a;
    });
    cartoes.forEach((c) => lista.appendChild(c));
  }));

  // Filtro local: nada de rede, só esconder linha.
  const busca = document.getElementById('busca');
  busca.addEventListener('input', () => {
    const q = busca.value.toLowerCase().trim();
    for (const el of document.querySelectorAll('.lote')) {
      el.style.display = !q || el.dataset.busca.includes(q) ? '' : 'none';
    }
  });
${refreshSegundos ? scriptRefresh(evento, refreshSegundos) : '  // Página inerte: sem --refresh, nenhuma chamada de rede.'}
</script>
</body>
</html>
`;
}

function linhaHtml(l: LinhaEstudo, fuso: FusoPayload, cfg: Config): string {
  const { lote: t, av } = l;
  const cor = av.semaforo;
  const rotulo =
    cor === 'encerrado'
      ? 'encerrado'
      : cor === 'sem-teto'
        ? 'sem preço ainda'
        : cor === 'ignorado'
        ? 'fora do escopo'
        : av.lanceSugerido === null
          ? 'não cobre'
          : 'pode ir até';

  const valor =
    cor === 'encerrado' || cor === 'sem-teto'
      ? '—'
      : cor === 'ignorado'
        ? 'IGNORADO'
        : av.lanceSugerido === null
          ? 'PARE'
          : brl(av.lanceSugerido);

  const busca = `${t.numero} ${t.titulo}`.toLowerCase();

  // Procedência do teto. O operador precisa saber se aquele número veio da regra de R$/item dele
  // (existe sempre) ou do valor de revenda (exige preço) — são confianças diferentes.
  const PROCEDENCIA: Record<string, string> = {
    regra: `pela sua regra: até ${brl(cfg.regra.custoPorItemMaximo)}/item × ${av.divisorDaRegra} itens`,
    valor: 'por valor de revenda dos itens',
    ambos: 'regra e valor — vale o menor dos dois',
    nenhum: '',
  };

  // O contraste entre as duas bases É o produto: onde elas se afastam, o lote infla.
  const cpi = av.custoPorItemTitulo;
  const cpn = av.custoPorItemNomeado;
  const dentroDaRegra = cpi !== null && cpi <= cfg.regra.custoPorItemMaximo;
  const noAlvo = cpi !== null && cpi <= cfg.regra.custoPorItemAlvo;
  const afastadas = cpi !== null && cpn !== null && cpn > cpi * 1.25;

  // Os tetos vão no DOM porque o refresh repinta contra eles sem recalcular nada:
  // teto não se move durante o pregão, só o lance.
  return `<article class="lote ${cor}" data-cor="${cor}" data-offer="${t.offerId}"
  data-numero="${t.numero}" data-busca="${esc(busca)}"
  data-teto-seguro="${av.tetoOperante.toFixed(2)}" data-teto-maximo="${av.tetoMaximo.toFixed(2)}"
  data-cpi="${cpi ?? 9999}" data-caixa="${av.fracaoEmCaixa.toFixed(3)}"
  data-fora="${cor === 'ignorado' || cor === 'encerrado' || cor === 'sem-teto' ? '1' : '0'}"
  data-lucro="${av.lucroEstimado ?? ''}">
  <div>
    <div class="num">Lote ${t.numero}<span>${esc(av.categoria)} · ${av.multiplo.toFixed(1)}x · perda ${pct(av.perda)}</span></div>
    <div class="tit">${esc(t.titulo)}</div>
    <div class="grade">
      <div><b>Lance ${t.temLances ? 'atual' : 'inicial'}</b>
        <span class="lance-atual">${brl(t.lance)}</span>
        ${t.temLances ? `<small>(${t.totalLances})</small>` : '<small>sem lances</small>'}</div>
      <div><b>Custo se levar</b> ${brl(av.custoAtual.total)}
        <small>+${pct(av.custoAtual.overhead)}</small></div>
      ${
        cpi === null
          ? ''
          : `<div class="cpi ${noAlvo ? 'alvo' : dentroDaRegra ? 'ok' : 'fora'}">
        <b>R$/item declarado</b> <strong>${cpi.toFixed(2)}</strong>
        <small>sua regra: até ${cfg.regra.custoPorItemMaximo}</small></div>`
      }
      ${
        cpn === null
          ? ''
          : `<div class="${afastadas ? 'cpi fora' : ''}"><b>R$/item nomeado</b> ${cpn.toFixed(2)}
        <small>${afastadas ? 'muito acima do declarado' : 'bate com o declarado'}</small></div>`
      }
      ${
        cor === 'ignorado' || cor === 'sem-teto'
          ? ''
          : `<div><b>Teto${av.baseDoTeto === 'ambos' ? ' (o menor)' : ''}</b> ${brl(av.tetoOperante)}
        <small>${PROCEDENCIA[av.baseDoTeto] ?? ''}</small></div>`
      }
      ${
        av.baseDoTeto === 'ambos' || av.baseDoTeto === 'valor'
          ? `<div><b>Teto por valor</b> ${brl(av.tetoSeguro)} – ${brl(av.tetoMaximo)}</div>`
          : ''
      }
      <div><b>Composição</b> ${l.unidadesTitulo ?? l.unidadesDeclaradas ?? '?'} no título
        · <strong>${av.itensNomeados} nomeados</strong>
        ${av.volumeEmCaixa ? ` · ${av.volumeEmCaixa} em caixa fechada (${pct(av.fracaoEmCaixa)})` : ''}</div>
      ${
        av.lucroEstimado !== null
          ? `<div class="cpi ${av.lucroEstimado > 0 ? 'alvo' : 'fora'}"><b>Lucro estimado</b>
        <strong>${brl(av.lucroEstimado)}</strong>
        <small>${brl(av.faturamentoNomeados)} nomeados + ${brl(av.faturamentoVolume)} volume</small></div>`
          : av.faltaVendaVolume
            ? `<div><b>Lucro</b> — <small>falta a venda média da peça de volume</small></div>`
            : ''
      }
      ${av.concentracao > 0.6 ? `<div><b>Concentração</b> ${pct(av.concentracao)} ⚠</div>` : ''}
    </div>
    ${
      l.topItens.length
        ? `<div class="rot-itens">${l.topItens.some((i) => i.valor > 0) ? 'itens de maior valor' : 'âncoras — o que este lote tem de bom'}</div>
           <ul class="itens">${l.topItens
            .map((i) => `<li><span>${i.quantidade}×</span> ${esc(i.descricao)}</li>`)
            .join('')}</ul>`
        : ''
    }
    <div class="comp">encargos ${brl(av.custoAtual.encargos)} =
      leiloeiro ${brl(av.custoAtual.leiloeiro)} + premium ${brl(av.custoAtual.premium)}
      + adm ${brl(av.custoAtual.encargosAdm)} + fee ${brl(av.custoAtual.feePlataforma)}</div>
    ${
      l.degrau
        ? `<div class="degrau">▲ próximo lance cruza o degrau de ${brl(l.degrau.limite)} —
           passar dele soma ${brl(l.degrau.salto)} de encargo</div>`
        : ''
    }
    ${l.alertas.map((a) => `<div class="alerta">⚠ ${esc(a)}</div>`).join('')}
    <div class="anota">Arrematei por <input placeholder="R$" data-anota="${t.numero}"></div>
  </div>
  <div class="acao ${cor}">
    <div class="rot">${rotulo}</div>
    <div class="val">${valor}</div>
    <div class="sub">incremento ${brl(t.incremento)} · fecha ${horaPregao(t.encerraEm, fuso)}</div>
  </div>
</article>`;
}

/**
 * O refresh só troca o lance e repinta. Os tetos vêm do estudo e não se movem — eles
 * saem do manifesto e dos múltiplos, não do pregão.
 */
function scriptRefresh(evento: Evento, segundos: number): string {
  return `
  // --refresh: a API responde Access-Control-Allow-Origin: *, então dá para buscar
  // direto do navegador, sem servidor. Só o lance muda; o teto é fixo.
  const URL_API = ${JSON.stringify(montarUrl(evento.auctionId))};
  async function atualizar() {
    try {
      const r = await fetch(URL_API, { headers: { accept: 'application/json' } });
      if (!r.ok) return marcar('falhou (' + r.status + ')');
      const d = await r.json();
      for (const o of d.offers) {
        const el = document.querySelector('.lote[data-offer="' + o.id + '"]');
        if (!el) continue;
        const det = o.offerDetail || {};
        const lance = det.currentMaxBid ?? det.initialBidValue ?? o.price ?? 0;
        const temLances = o.hasBids || (o.totalBids || 0) > 0;
        const inc = (o.currentBidIncrement && o.currentBidIncrement.currentBidIncrement) || 1;
        const alvo = el.querySelector('.lance-atual');
        if (alvo) alvo.textContent = lance.toLocaleString('pt-BR',
          { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

        const seguro = Number(el.dataset.tetoSeguro || 0);
        const maximo = Number(el.dataset.tetoMaximo || 0);
        const encerrado = (o.offerStatus||{}).closed || (o.offerStatus||{}).closedToBids;
        let cor;
        if (encerrado) cor = 'encerrado';
        else if (!seguro) cor = 'sem-teto';
        else {
          const proximo = temLances ? lance + inc : lance;
          cor = proximo <= seguro ? 'verde' : proximo <= maximo ? 'amarelo' : 'vermelho';
        }
        if (el.dataset.cor !== cor) {
          el.dataset.cor = cor;
          el.className = 'lote ' + cor;
          const acao = el.querySelector('.acao');
          if (acao) acao.className = 'acao ' + cor;
        }
      }
      marcar('lances de ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5));
    } catch (e) {
      // O texto tem de ser uma frase inteira: "lances de sem conexão" não se entende.
      marcar('SEM CONEXÃO — os lances na tela podem estar velhos');
    }
  }
  function marcar(txt) {
    const q = document.getElementById('quando');
    if (q) q.textContent = txt;
  }
  setInterval(atualizar, ${segundos * 1000});
  atualizar();`;
}
