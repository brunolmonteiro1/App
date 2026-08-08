# 02 — Plano de implementação

Pré-requisito: ler [`01-reconhecimento.md`](01-reconhecimento.md). Este documento assume
os achados de lá e não os repete.

## Objetivo

Acionada com um link de evento, a ferramenta produz um ranking de lotes por **valor
recuperável sobre custo**, com custo por unidade real ao lado como referência. Roda sob
demanda e agendada toda segunda-feira.

## Premissas adotadas

Escolhidas por default na ausência de decisão; todas baratas de trocar nesta fase.

| Decisão | Default | Se mudar |
|---|---|---|
| Execução | GitHub Actions: cron de segunda + `workflow_dispatch` | n8n ou VPS troca só o gatilho; o worker é o mesmo |
| Persistência | SQLite em arquivo | Postgres/Supabase mexe só em `persistencia/` |
| Entrega | Dashboard HTML + XLSX | WhatsApp/Telegram entram como saída extra |
| Runtime | Node 22 + TypeScript | — |

Node/TS porque `pdfjs-dist` resolve o problema de fonte do Edital, e uma linguagem só
cobre coleta, análise e geração de relatório. **Playwright não entra** — a coleta é HTTP
puro.

## Estrutura

Diretório top-level próprio, seguindo o precedente de subprojetos independentes do repo
(`norton_app/`, `vosz-site/`), sem manifest compartilhado na raiz.

```
leilao/
  package.json  tsconfig.json  .gitignore
  src/
    cli.ts                  # coletar | manifesto | precificar | visao | relatorio | rodar
    superbid/
      api.ts                # slug -> auction.id -> 1 request -> offers[]
      tipos.ts              # zod: valida o payload, falha alto se o site mudar
      pdf.ts                # pdfjs-dist: texto por pagina (lida com fonte subset)
      manifesto.ts          # parseia itens do anexo, valida Ref contra o lote
      edital.ts             # extrai tabela de taxas do Edital do evento
    analise/
      quantidade.ts         # normaliza os 6 formatos + reconcilia com manifesto
      valor.ts              # LLM: precifica itens -> valor de mercado do lote
      visao.ts              # LLM vision: condicao/avaria (so finalistas)
      custo.ts              # lance + 5% + encargos + logistica
      ranking.ts            # margem, concentracao de valor, alertas
    persistencia/db.ts
    relatorio/html.ts  relatorio/xlsx.ts
  recon/                    # evidencias e prova de conceito (ja existe)
  test/fixtures/            # symlink ou copia de recon/fixtures
```

Dependências: `zod`, `@anthropic-ai/sdk`, `pdfjs-dist`, `better-sqlite3`, `exceljs`,
`commander`, `vitest`. `.gitignore` cobre `*.db`, `cache/`, `node_modules/`.
`ANTHROPIC_API_KEY` via env / GitHub Secret — nunca no repo.

## Modelo de dados

Dossiê (estável, analisa uma vez) separado de preço (perecível, muda a cada minuto). Sem
essa separação, reprocessa-se PDF e imagem só para saber o lance atual.

```
leilao         (id, auction_id, slug, nome, leiloeiro, encerra_em, coletado_em,
                edital_url, taxas_json, fonte_taxas)   -- fonte: api|edital|manual
lote           (id, leilao_id, lot_number, offer_id, ref_sb, titulo, descricao,
                unidades_declaradas, formato_qtd_detectado, imagens_json,
                anexos_json, cidade, hash_conteudo)
manifesto_item (id, lote_id, descricao, marca, modelo, quantidade, categoria)
avaliacao      (lote_id PK, unidades_reconciliadas, fonte_unidades, valor_mercado_total,
                valor_top5, concentracao, condicao, taxa_perda, confianca,
                modelo_llm, tokens, criado_em)
lance_snapshot (id, lote_id, lance, total_bids, capturado_em)
```

`fonte_unidades` registra se o número veio do **manifesto** (confiável), do **título**
(declarado) ou de **visão** (estimado). O relatório nunca mistura os três sem rotular.
`hash_conteudo` permite reanalisar só quando o anúncio mudou de fato.

## Cálculo

```
custo_total   = lance + comissao(5%) + encargo_admin(do Edital) + frete + deslocamento_rateado
custo_unidade = custo_total / unidades_reconciliadas      // referencia, NAO criterio
valor_lote    = Σ (quantidade × preco_mercado_estimado)   // do manifesto
margem        = valor_lote / custo_total                  // ← criterio de ordenacao
concentracao  = valor_top5 / valor_lote                   // risco: valor num item so
```

`concentracao` alta é sinal de risco: se o valor está num item só e ele vier avariado, o
lote inteiro vira prejuízo. Alerta explícito no relatório.

## Funil de custo de IA

61 lotes, 57 PDFs, 662 imagens — rodar visão em tudo é desperdício.

1. **Coleta + manifesto (grátis).** 1 request HTTP + 57 PDFs baixados e parseados por
   regex. Zero LLM. Já produz unidades reconciliadas e lista de itens.
2. **Precificação (barata, só texto, todos os lotes).** Manifesto vai ao LLM em lote, que
   devolve faixa de preço por item distinto via *tool schema* (JSON estruturado, não texto
   livre). Cache por descrição normalizada — item repetido entre lotes não é pago 2x.
3. **Visão (cara, só os ~15 finalistas por margem).** Fotos para confirmar estado de
   conservação, avaria visível e presença dos itens de valor. Produz `taxa_perda`.

Teto de gasto por rodada, que aborta com relatório parcial em vez de estourar.

## Dois jobs

- `rodar --completo` — segunda, na abertura: coleta + manifesto + precificação + visão.
- `rodar --precos` — a cada N horas até fechar: só `lance_snapshot` novo e recálculo de
  margem contra a avaliação existente. **Zero custo de IA.**

## Fases

0. **Tarefa zero (30 min, elimina o único risco técnico restante).** Instalar
   `pdfjs-dist` e conferir que extrai texto legível **do Edital** (o PDF de fonte subset,
   em `recon/fixtures/edital-evento-790754.pdf`). Se sim, `pdf.ts` serve aos dois tipos de
   PDF. Se não, `edital.ts` passa a rasterizar + visão, e só isso muda.
1. **Base sem IA.** Scaffold, `api.ts` + zod, `quantidade.ts`, `pdf.ts`, `manifesto.ts`,
   SQLite, `custo.ts`, XLSX. Entrega: planilha dos 61 lotes com unidades reconciliadas do
   manifesto e custo/unidade real. `edital.ts` entra junto se a tarefa zero passar.
2. **Valor.** `valor.ts` com precificação por item e cache; `ranking.ts` com margem e
   concentração. Aqui a ferramenta passa a responder "vale a pena?".
3. **Visão e entrega.** `visao.ts` nos finalistas, dashboard HTML.
4. **Automação.** `.github/workflows/leilao.yml` espelhando o padrão de
   `.github/workflows/build-apk.yml` (path filter `leilao/**`, lint → test), com
   `schedule` de segunda e `workflow_dispatch` recebendo a URL. Job leve de preços.

## Verificação

Há **ground truth capturado** em `recon/fixtures/`, o que é raro neste tipo de projeto.

- `manifesto.ts` contra o manifesto real do lote 3: deve extrair **71 itens** com soma
  **exatamente 304** e casar `ref_sb = SB0032812` com o título. Divergência de soma vira
  **alerta no relatório**, não exceção silenciosa. Esse teste também trava desempenho: com
  split-antes-do-regex roda em milissegundos; se alguém reintroduzir o regex global, o
  teste estoura por timeout.
- Descrição limpa: nenhum item pode conter `"na descrição fazem parte do lote"` nem
  `"Itens não testados"`.
- `quantidade.ts` contra os 61 títulos reais: tabela cobrindo `APROX. 142 UN`,
  `APROX.: 431 PÇS`, `APROX. 81 PC`, `(19 UN)`, `(45 PÇS)`, `Qtde Aprox. 74`, `Qtde. 74`,
  `(Qtde. 265)`, o typo `AROX. 44 UN`, e os 3 lotes sem quantidade → devem devolver `null`
  e cair para o manifesto, **nunca chutar**.
- `edital.ts`: o texto extraído deve conter `"Condições de Venda"` legível — detector de
  regressão de encoding. Se voltar lixo tipo `E+ndiPces`, falha.
- Anexo órfão: o Edital **não pertence a lote nenhum** (verificado, 0 hits entre os 57
  anexos). Documento de evento e anexo de lote são caminhos separados; o código não pode
  tentar casar o Edital com um lote.
- `custo.ts`: unitários por faixa, divisão por zero, `taxa_perda` extrema. Conferir o lote
  3 (2130 + 5% = 2236,50) contra o widget "Estimar comissões" do site — é a validação da
  tabela de encargos.
- `api.ts` contra `fixtures/evento-790754-offers.json`, **não contra a rede** — teste que
  depende do site quebra sozinho. Um teste separado marcado `@rede` faz o request real e
  só valida que o schema zod ainda passa, como detector de mudança.
- End-to-end: `npm run cli -- rodar --url <evento> --limite 5`, conferindo os 5 lotes
  contra a página no navegador.
- Rodar `--precos` duas vezes: dois `lance_snapshot` e contador de tokens em 0.

## Cuidados

- Throttle de 1–2 req/s nos downloads de PDF e imagem; a listagem é 1 request só.
  Respeitar os termos de uso. Scraper agressivo é a forma mais rápida de tomar bloqueio
  justamente na segunda em que o leilão abre.
- Preço estimado por LLM é chute informado, não cotação: mostrar faixa e confiança, e
  deixar a decisão de lance com o operador.
