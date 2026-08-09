/**
 * A tela de precificação — a interface que faltava.
 *
 * O problema que ela resolve: até aqui, precificar era editar um JSON de 2.347 linhas e
 * mandar por `scp`. O teto de todos os 61 lotes depende desse arquivo, e o atrito de
 * preencher JSON à mão era o que mantinha a cobertura em 3% e **nenhum teto utilizável**.
 * A ferramenta inteira estava travada num editor de texto.
 *
 * Três coisas que esta tela faz e o arquivo não fazia:
 *
 * 1. **Mostra o teto mudando enquanto ele digita.** Cada preço vai ao servidor, que roda o
 *    `avaliar()` de verdade e devolve teto, cobertura e semáforo. Zero conta duplicada no
 *    navegador — o número da tela é o número do estudo, pela mesma função.
 * 2. **Mostra o preço que já existe na tabela.** Item precificado num lote aparece
 *    preenchido em todos os outros onde a mesma descrição ocorre. É o que responde
 *    "preciso precificar sempre?" com um fato na tela, em vez de uma explicação.
 * 3. **Ordena os lotes por onde vale gastar o esforço**, com a métrica de custo por unidade
 *    efetiva — que não precisa de preço nenhum para funcionar.
 *
 * A página é servida pelo painel, no loopback, atrás do túnel SSH: ela **grava** em
 * `precos.json`, então não é candidata a ficar exposta em nenhuma hipótese.
 */

export function gerarPaginaPrecificar(auctionId: number): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Precificar — leilão ${auctionId}</title>
<style>
  :root {
    --fundo: #12141a; --caixa: #1b1e26; --linha: #2b303c; --texto: #e6e8ee;
    --fraco: #9aa0b0; --verde: #37a86b; --amarelo: #c9a227; --vermelho: #cf4a4a;
    --azul: #3b7dd8; --cinza: #565d6d;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fundo); color: var(--texto);
    font: 15px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  a { color: var(--azul); }
  header { padding: 14px 18px; border-bottom: 1px solid var(--linha);
    display: flex; flex-wrap: wrap; gap: 14px; align-items: baseline; }
  header h1 { font-size: 17px; margin: 0; }
  header .meta { color: var(--fraco); font-size: 13px; }
  .layout { display: grid; grid-template-columns: 290px 1fr; gap: 0; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
  #lista { border-right: 1px solid var(--linha); max-height: calc(100vh - 60px);
    overflow-y: auto; }
  .lote { padding: 9px 14px; border-bottom: 1px solid var(--linha); cursor: pointer;
    display: grid; grid-template-columns: 10px 1fr; gap: 9px; }
  .lote:hover { background: #22262f; }
  .lote.sel { background: #262c38; }
  .lote .num { font-weight: 600; }
  .lote .sub { color: var(--fraco); font-size: 12px; }
  .bola { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
  .verde { background: var(--verde); } .amarelo { background: var(--amarelo); }
  .vermelho { background: var(--vermelho); } .azul { background: var(--azul); }
  .cinza { background: var(--cinza); }
  main { padding: 16px 18px 60px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--linha);
    vertical-align: middle; }
  th { color: var(--fraco); font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .04em; position: sticky; top: 0; background: var(--fundo); }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  input[type=text] { width: 96px; padding: 5px 7px; background: #0f1116; color: var(--texto);
    border: 1px solid var(--linha); border-radius: 5px; text-align: right;
    font-variant-numeric: tabular-nums; }
  input[type=text]:focus { outline: 2px solid var(--azul); border-color: var(--azul); }
  input.herdado { border-color: #35507a; }
  select { padding: 4px 6px; background: #0f1116; color: var(--texto);
    border: 1px solid var(--linha); border-radius: 5px; }
  tr.c td { opacity: .5; }
  .tag { font-size: 11px; color: var(--fraco); border: 1px solid var(--linha);
    border-radius: 4px; padding: 1px 5px; margin-left: 6px; white-space: nowrap; }
  #painel { position: sticky; bottom: 0; background: var(--caixa);
    border-top: 1px solid var(--linha); padding: 11px 18px; display: flex;
    flex-wrap: wrap; gap: 18px; align-items: center; }
  #painel .campo { display: flex; flex-direction: column; gap: 1px; }
  #painel .rot { font-size: 11px; color: var(--fraco); text-transform: uppercase;
    letter-spacing: .04em; }
  #painel .val { font-size: 18px; font-variant-numeric: tabular-nums; }
  button { padding: 8px 14px; border-radius: 6px; border: 1px solid var(--linha);
    background: #232833; color: var(--texto); font-size: 14px; cursor: pointer; }
  button.primario { background: var(--azul); border-color: var(--azul); color: #fff; }
  button:disabled { opacity: .5; cursor: default; }
  #recado { margin-left: auto; font-size: 13px; color: var(--fraco); }
  .aviso { background: #2a2113; border: 1px solid #5c4a1c; border-radius: 6px;
    padding: 9px 12px; margin-bottom: 14px; font-size: 13px; }
  .ajuda { color: var(--fraco); font-size: 13px; margin: 0 0 14px; max-width: 78ch; }
</style>
</head>
<body>
<header>
  <h1>Precificar</h1>
  <span class="meta" id="meta">carregando…</span>
  <span class="meta"><a href="estudo.html">← estudo</a></span>
</header>

<div class="layout">
  <div id="lista"></div>
  <main>
    <div id="avisos"></div>
    <p class="ajuda">
      Preço é <strong>o valor online por unidade</strong> — o que o item custa na internet, não
      o que você vende no bazar. A conta do bazar (40% a 60%), a perda da categoria, o múltiplo
      e os encargos o programa aplica em cima disso.
      Cada preço é gravado <strong>pela descrição do item</strong>: uma vez preenchido, ele
      aparece sozinho em todos os outros lotes e nos próximos leilões onde a mesma descrição
      voltar. Campo com borda azul é preço que já veio da sua tabela.
    </p>
    <div id="tabela"></div>
  </main>
</div>

<div id="painel">
  <div class="campo"><span class="rot">valor online</span><span class="val" id="vOnline">—</span></div>
  <div class="campo"><span class="rot">cobertura</span><span class="val" id="vCob">—</span></div>
  <div class="campo"><span class="rot">teto seguro</span><span class="val" id="vSeguro">—</span></div>
  <div class="campo"><span class="rot">teto máximo</span><span class="val" id="vMax">—</span></div>
  <div class="campo"><span class="rot">lance sugerido</span><span class="val" id="vLance">—</span></div>
  <button class="primario" id="salvar" disabled>Salvar preços</button>
  <button id="regerar">Atualizar estudo</button>
  <span id="recado"></span>
</div>

<script>
'use strict';
var brl = function (v) {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};
var pct = function (v) { return v === null || v === undefined ? '—' : Math.round(v * 100) + '%'; };
var CORES = { verde: 'verde', amarelo: 'amarelo', vermelho: 'vermelho',
  'sem-cobertura': 'azul', 'sem-teto': 'cinza', ignorado: 'cinza', encerrado: 'cinza' };
var ROTULOS = { verde: 'PODE', amarelo: 'ATENÇÃO', vermelho: 'PARE',
  'sem-cobertura': 'PRECIFIQUE', 'sem-teto': 'sem preço', ignorado: 'ignorado',
  encerrado: 'encerrado' };

var lotes = [];
var atual = null;      // { numero, itens: [...], av: {...} }
var pendente = {};     // chave -> { preco, faixa } ainda não salvo
var simulando = null;

function el(tag, attrs, txt) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (txt !== undefined) e.textContent = txt;
  return e;
}

function pedir(url, corpo) {
  var opc = corpo
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) }
    : {};
  return fetch(url, opc).then(function (r) {
    return r.json().then(function (j) {
      if (!r.ok) throw new Error(j && j.erro ? j.erro : 'HTTP ' + r.status);
      return j;
    });
  });
}

function recado(txt, erro) {
  var e = document.getElementById('recado');
  e.textContent = txt || '';
  e.style.color = erro ? 'var(--vermelho)' : 'var(--fraco)';
}

/* ---------- lista de lotes ---------- */

function pintarLista() {
  var box = document.getElementById('lista');
  box.textContent = '';
  lotes.forEach(function (l) {
    var div = el('div', { class: 'lote' + (atual && atual.numero === l.numero ? ' sel' : '') });
    div.appendChild(el('div', { class: 'bola ' + (CORES[l.semaforo] || 'cinza') }));
    var col = el('div');
    col.appendChild(el('div', { class: 'num' }, 'Lote ' + l.numero + ' · ' + ROTULOS[l.semaforo]));
    var sub = l.itens + ' itens';
    if (l.pendentes > 0) sub += ' · faltam ' + l.pendentes;
    if (l.custoPorUnidadeEfetiva) sub += ' · ' + brl(l.custoPorUnidadeEfetiva) + '/un';
    col.appendChild(el('div', { class: 'sub' }, sub));
    col.appendChild(el('div', { class: 'sub' }, l.titulo.slice(0, 52)));
    div.appendChild(col);
    div.onclick = function () { abrir(l.numero); };
    box.appendChild(div);
  });
}

/* ---------- um lote ---------- */

function abrir(numero) {
  if (Object.keys(pendente).length && !confirm('Há preços não salvos neste lote. Descartar?')) return;
  pendente = {};
  document.getElementById('salvar').disabled = true;
  recado('carregando lote ' + numero + '…');
  pedir('api/lote?n=' + numero).then(function (j) {
    atual = j;
    recado('');
    pintarLista();
    pintarTabela();
    pintarPainel(j.av);
  }).catch(function (e) { recado(e.message, true); });
}

function pintarTabela() {
  var box = document.getElementById('tabela');
  box.textContent = '';
  document.getElementById('avisos').textContent = '';

  if (!atual) {
    box.appendChild(el('p', { class: 'ajuda' }, 'Escolha um lote na lista à esquerda.'));
    return;
  }
  if (atual.ignorado) {
    var a = el('div', { class: 'aviso' },
      'Lote da categoria "' + atual.categoria + '", que está na sua lista de ignoradas. ' +
      'Não vale precificar.');
    document.getElementById('avisos').appendChild(a);
  }

  var h = el('h2');
  h.style.fontSize = '15px';
  h.textContent = 'Lote ' + atual.numero + ' — ' + atual.titulo;
  box.appendChild(h);
  var sub = el('p', { class: 'ajuda' },
    'lance atual ' + brl(atual.lance) + ' · incremento ' + brl(atual.incremento) +
    ' · categoria ' + atual.categoria + ' (múltiplo ' + atual.multiplo + 'x, perda ' +
    pct(atual.perda) + ')');
  box.appendChild(sub);

  var tab = el('table');
  var thead = el('thead');
  var tr = el('tr');
  ['Item', 'Qtd', 'Faixa', 'Preço online un.', 'Subtotal'].forEach(function (t, i) {
    tr.appendChild(el('th', i >= 1 ? { class: 'n' } : null, t));
  });
  thead.appendChild(tr);
  tab.appendChild(thead);

  var tb = el('tbody');
  atual.itens.forEach(function (it) {
    var linha = el('tr', it.faixa === 'C' ? { class: 'c' } : null);
    var tdItem = el('td');
    tdItem.appendChild(document.createTextNode(it.descricao));
    if (it.ignorado) tdItem.appendChild(el('span', { class: 'tag' }, 'termo ignorado'));
    else if (it.faixa === 'C') tdItem.appendChild(el('span', { class: 'tag' }, 'irrisório · vale zero'));
    if (it.lotes > 1) tdItem.appendChild(el('span', { class: 'tag' }, 'em ' + it.lotes + ' lotes'));
    linha.appendChild(tdItem);
    linha.appendChild(el('td', { class: 'n' }, String(it.quantidade)));

    var tdF = el('td', { class: 'n' });
    var sel = el('select');
    ['A', 'B', 'C'].forEach(function (f) {
      var o = el('option', { value: f }, f);
      if (f === it.faixa) o.setAttribute('selected', 'selected');
      sel.appendChild(o);
    });
    sel.disabled = !!it.ignorado;
    sel.onchange = function () { marcar(it.chave, null, sel.value); };
    tdF.appendChild(sel);
    linha.appendChild(tdF);

    var tdP = el('td', { class: 'n' });
    var inp = el('input', { type: 'text', inputmode: 'decimal', placeholder: '—' });
    if (it.preco !== null && it.preco !== undefined) inp.value = String(it.preco).replace('.', ',');
    if (it.herdado) inp.className = 'herdado';
    inp.disabled = !!it.ignorado;
    inp.oninput = function () { marcar(it.chave, inp.value, null); };
    tdP.appendChild(inp);
    linha.appendChild(tdP);

    var sb = it.preco !== null && it.preco !== undefined ? it.quantidade * it.preco : null;
    var tdS = el('td', { class: 'n' }, brl(it.faixa === 'C' ? 0 : sb));
    tdS.id = 'sub-' + it.chave;
    linha.appendChild(tdS);
    tb.appendChild(linha);
  });
  tab.appendChild(tb);
  box.appendChild(tab);
}

function marcar(chave, preco, faixa) {
  var p = pendente[chave] || {};
  if (preco !== null) p.preco = preco;
  if (faixa !== null) p.faixa = faixa;
  pendente[chave] = p;
  document.getElementById('salvar').disabled = false;
  agendarSimulacao();
}

/* ---------- teto ao vivo, calculado no servidor ---------- */

function agendarSimulacao() {
  if (simulando) clearTimeout(simulando);
  simulando = setTimeout(simular, 350);
}

function simular() {
  if (!atual) return;
  recado('recalculando…');
  pedir('api/simular', { lote: atual.numero, itens: pendente }).then(function (j) {
    recado('');
    pintarPainel(j.av);
    (j.itens || []).forEach(function (it) {
      var td = document.getElementById('sub-' + it.chave);
      if (td) td.textContent = brl(it.faixa === 'C' ? 0 : it.subtotal);
    });
  }).catch(function (e) { recado(e.message, true); });
}

function pintarPainel(av) {
  if (!av) return;
  document.getElementById('vOnline').textContent = brl(av.valorOnline);
  document.getElementById('vCob').textContent =
    pct(av.cobertura) + ' un / ' + pct(av.coberturaLinhas) + ' linhas';
  var mostrarTeto = av.semaforo === 'verde' || av.semaforo === 'amarelo' || av.semaforo === 'vermelho';
  document.getElementById('vSeguro').textContent = mostrarTeto ? brl(av.tetoSeguro) : '—';
  document.getElementById('vMax').textContent = mostrarTeto ? brl(av.tetoMaximo) : '—';
  var vl = document.getElementById('vLance');
  vl.textContent = av.lanceSugerido ? brl(av.lanceSugerido) : ROTULOS[av.semaforo] || '—';
  vl.style.color = 'var(--' + (CORES[av.semaforo] === 'azul' ? 'azul' : CORES[av.semaforo]) + ')';
}

/* ---------- gravar ---------- */

document.getElementById('salvar').onclick = function () {
  var b = this;
  b.disabled = true;
  recado('gravando…');
  pedir('api/precos', { lote: atual ? atual.numero : null, itens: pendente })
    .then(function (j) {
      pendente = {};
      recado(j.gravados + ' preço(s) gravados em precos.json');
      if (j.rejeitados && j.rejeitados.length) recado(j.rejeitados.join(' · '), true);
      return carregarLista().then(function () { if (atual) return abrirSilencioso(atual.numero); });
    })
    .catch(function (e) { b.disabled = false; recado(e.message, true); });
};

function abrirSilencioso(numero) {
  return pedir('api/lote?n=' + numero).then(function (j) {
    atual = j; pintarLista(); pintarTabela(); pintarPainel(j.av);
  });
}

document.getElementById('regerar').onclick = function () {
  var b = this;
  b.disabled = true;
  recado('regerando o estudo…');
  pedir('api/estudo', {})
    .then(function (j) {
      recado('estudo atualizado: ' + j.comTeto + ' lote(s) com teto utilizável');
    })
    .catch(function (e) { recado(e.message, true); })
    .then(function () { b.disabled = false; });
};

/* ---------- partida ---------- */

function carregarLista() {
  return pedir('api/lotes').then(function (j) {
    lotes = j.lotes;
    document.getElementById('meta').textContent =
      'leilão ' + j.auctionId + ' · ' + j.lotes.length + ' lotes · ' +
      j.precificados + ' descrições precificadas · dados de ' + j.geradoEm;
    if (j.avisoPrecos) {
      var d = el('div', { class: 'aviso' }, j.avisoPrecos);
      document.getElementById('avisos').appendChild(d);
    }
    pintarLista();
  });
}

carregarLista().then(pintarTabela).catch(function (e) {
  document.getElementById('tabela').appendChild(
    el('div', { class: 'aviso' }, 'Não consegui falar com o painel: ' + e.message +
      '. Esta tela precisa do servidor (npm run servir), não funciona só abrindo o arquivo.'));
});
</script>
</body>
</html>
`;
}
