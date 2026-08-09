# 02 — Plano de implementação

Pré-requisito: ler [`01-reconhecimento.md`](01-reconhecimento.md). Este documento assume
os achados de lá e não os repete.

## Objetivo

Acionada com um link de evento, a ferramenta produz, para cada lote, um **teto máximo de
lance** — o número que o operador leva para o auditório. O ranking por valor recuperável
sobre custo é a visão de apoio; o teto é o produto. Roda sob demanda e agendada toda
segunda-feira.

## Modelo de negócio (define todo o cálculo)

O destino da mercadoria não é revenda unitária em marketplace, e isso muda o modelo de
valor inteiro:

- **Bazar solidário** permanente, mais **evento "dia de outlet"** para 500+ pessoas num
  domingo.
- **Preço de venda realizado: 40% a 60% do valor online.** Número informado pelo
  operador — é dado de operação, não estimativa da ferramenta. É o parâmetro mais
  importante do cálculo e por isso o teto sai como **faixa**, não como número único.
- **Volume alto é ativo, não passivo.** Um bazar com 500 pessoas precisa de quantidade de
  item barato. As "60x máscara de gatinho" do lote 3 são exatamente o que gira num bazar —
  ao contrário de um revendedor de marketplace, para quem seriam só trabalho.

Decisão do operador: **itens irrisórios entram no cálculo como zero.** Não inflam o teto,
mas o relatório os reporta à parte como *volume de bazar*, porque são **upside não pago** —
a disciplina é não pagar por eles e ainda assim vendê-los.

### Condição declarada: ausente, e isso é o risco central

Verificado no manifesto do lote 3: as colunas `Vencimento`, `Desmontado` e `Incompleto`
existem no template mas estão **vazias em todas as 71 linhas** (uma ocorrência cada, só no
cabeçalho). O que vem por item é:

```
Condição do bem não informado
Itens não testados, podendo apresentar defeitos
Podendo faltar peças e/ou componentes
```

Ou seja: **o vendedor não declara estado de nenhum item.** É logística reversa —
mercadoria devolvida —, então defeito é a expectativa, não a exceção. Consequências para o
código: o parser captura essas colunas *quando presentes* em outros lotes, e a ausência de
declaração alimenta `taxa_perda` alta por padrão. É também o que justifica múltiplo
exigente em eletroportátil e ferramenta, onde "não testado" costuma significar quebrado.

## Premissas adotadas

Escolhidas por default na ausência de decisão; todas baratas de trocar nesta fase.

| Decisão | Default | Se mudar |
|---|---|---|
| Execução | GitHub Actions: cron de segunda + `workflow_dispatch` | n8n ou VPS troca só o gatilho; o worker é o mesmo |
| Persistência | SQLite em arquivo | Postgres/Supabase mexe só em `persistencia/` |
| Entrega | **Dashboard web** (escolha do operador), arquivo único offline | XLSX/PDF entram depois se pedir |
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
      valor.ts              # preco por item (arquivo), faixas, ranking de impacto
      custo.ts              # lance x 1,10 + faixa do Edital + logistica
      ranking.ts            # margem, concentracao de valor, alertas
    superbid/baixar.ts        # download dos 57 manifestos, throttle + cache
    estudo/pagina.ts          # a pagina que o operador le ao lado do BidTV
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
manifesto_item (id, lote_id, descricao, marca, modelo, quantidade, categoria, faixa,
                preco_online_est, vencimento, desmontado, incompleto, condicao_declarada)
avaliacao      (lote_id PK, unidades_reconciliadas, fonte_unidades, categoria_predominante,
                multiplo_aplicado, valor_online, valor_realizado_min, valor_realizado_max,
                teto_seguro, teto_maximo, volume_bazar, valor_top5, concentracao,
                taxa_perda, confianca, modelo_llm, tokens, criado_em)
lance_snapshot (id, lote_id, lance, total_bids, capturado_em)
```

`faixa` (A/B/C) e `preco_online_est` ficam no item, não no lote: é o que permite recalcular
o teto inteiro quando o operador ajusta um preço na mão, sem repassar nada pelo LLM.
`vencimento`, `desmontado`, `incompleto` e `condicao_declarada` são nulos no lote 3 — ficam
no schema porque o template do manifesto os prevê e outros lotes podem preenchê-los.

`fonte_unidades` registra se o número veio do **manifesto** (confiável), do **título**
(declarado) ou de **visão** (estimado). O relatório nunca mistura os três sem rotular.
`hash_conteudo` permite reanalisar só quando o anúncio mudou de fato.

## Cálculo — o teto sai de trás para frente

O teto não deriva do valor do lote para frente; deriva do retorno exigido para trás.

```
valor_online   = Σ (quantidade × preco_online_estimado)     // só itens com saída
valor_realizado = valor_online × fator_bazar × (1 − taxa_perda)
                                  ↑ 0,40 conservador … 0,60 otimista
teto_custo     = valor_realizado / multiplo_da_categoria
teto_martelo   = resolve por faixa:  (teto_custo − faixaEncargo − frete) / 1,10
```

**A última linha concentra três erros possíveis, todos travados em teste:**

1. O percentual **divide**, não subtrai — incide sobre o martelo.
2. É **10%** (leiloeiro 5% + buyer's premium 5%), não os 5% que a API informa.
3. O encargo da faixa **depende do lance**, que é a própria incógnita, então não há fórmula
   fechada: resolve-se por faixa, testando cada candidato contra o orçamento e pegando o maior
   válido. Ver `martelaDoTeto` em `src/analise/custo.ts`.

Como o fator de realização é uma faixa (40–60%), o teto sai como **dois números**:

| Número | Significado |
|---|---|
| **teto seguro** (fator 0,40) | dá lance até aqui sem pensar |
| **teto máximo** (fator 0,60) | entre os dois, só se conhecer bem a categoria |
| acima do teto máximo | prejuízo pela própria conta do operador — para |

Métricas de apoio, exibidas mas que **não definem o teto**:

```
custo_unidade_efetiva = custo_total / unidades_efetivas   // a métrica real; também é o
                                                          // ranking da shortlist, que
                                                          // funciona com ZERO preços
margem        = valor_realizado / custo_total          // ordena o ranking
concentracao  = valor_top5 / valor_realizado           // risco
volume_bazar  = Σ unidades da faixa C                  // upside não pago
```

`concentracao` alta é risco: se o valor está em um item só e ele vier avariado — e "não
testado" é o padrão declarado — o lote inteiro vira prejuízo. Alerta explícito.

### Faixas de item

Cada linha do manifesto cai numa faixa, e só A e B entram no teto:

| Faixa | Critério | Entra no teto |
|---|---|---|
| **A** | vale vender com preço próprio no bazar | sim, integral |
| **B** | só sai em lote / preço de bazar baixo | sim, × `fatorB` (0,6) |
| **C** | irrisório **ou de categoria fora do escopo** | **zero** — só conta em `volume_bazar` |

Faixa C também recebe os itens de **cosmético, limpeza e bebida**, categorias com que o
operador não trabalha, e essa marca **ganha de preço posto à mão** — do contrário um lote misto
contaria shampoo no valor e autorizaria pagar por mercadoria não revendível.

### Múltiplo por categoria (proposta inicial, ajustável)

O operador pediu múltiplo por categoria. Estes são os valores de partida, gravados em
config editável — não hard-coded — porque a calibragem real vem dos primeiros eventos:

| Categoria | Múltiplo | Razão |
|---|---|---|
| Vestuário, calçados, cama/mesa/banho | 2,0x | giro certo no bazar, público exato, risco baixo |
| Utensílios de cozinha, papelaria, brinquedos | 2,0x | mesmo caso, alto volume |
| Cosméticos e limpeza | 2,5x | giram rápido, mas vencimento pode zerar o lote |
| Eletroportáteis | 3,5x | valor alto por peça e "não testado" = defeito provável |
| Ferramentas, informática | 3,5x | idem, e faltar peça é comum |
| Móveis e itens grandes | 4,0x | frete e armazenagem comem margem, giro lento |
| Peças automotivas | 4,5x | público de bazar não compra; só com canal específico |
| Bebidas alcoólicas | revisar | verificar licença para venda em bazar/evento antes de dar lance |

Categoria por lote vem do título e é refinada pelo manifesto; lote misto recebe o múltiplo
ponderado pelo valor de cada categoria dentro dele.

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
3. **Visão e entrega.** `visao.ts` nos finalistas e o dashboard.

   O operador escolheu dashboard web, mas deu lance **ao vivo em auditório** — onde sinal
   de celular falha. Então o dashboard é gerado como **arquivo HTML único, sem chamada de
   rede em runtime**: abre no navegador, funciona salvo no celular e sobrevive a sinal
   ruim, sem deixar de ser dashboard. Ordenação padrão por `lot_number` (a ordem de
   chamada, que **não é sequencial** — 202, 211, 250, 323), com o teto seguro em corpo
   grande, busca por número de lote, e os 5 itens que sustentam o valor. Campo para
   registrar o que foi arrematado e por quanto, que fecha o ciclo de calibragem.
4. **Automação.** `.github/workflows/leilao.yml` espelhando o padrão de
   `.github/workflows/build-apk.yml` (path filter `leilao/**`, lint → test), com
   `schedule` de segunda e `workflow_dispatch` recebendo a URL. Job leve de preços.

## Os erros que a implementação cometeu, e o que os trava

Vale registrar porque cada um foi caro de descobrir e é fácil de reintroduzir.

| Erro | Consequência | O que trava agora |
|---|---|---|
| `fixo: 250` como taxa fixa | subestimava custo em lote grande e superestimava em pequeno | tabela do Edital + 21 testes de fronteira |
| Ranking de preço global | 71 preços → 3% de cobertura → zero teto utilizável | `shortlist` + `precos --lote N` |
| Teto exibido sob cobertura baixa | lote 3 mostrava "teto R$ 26 · PARE", lido como lote caro | semáforo `sem-cobertura`, azul |
| Cobertura só por unidade | lote 202 passava com 48 rodas e o climatizador sem preço | exige unidades **e** linhas |
| Faixa B igual a A | 74 itens reclassificados não mudavam nada | `fatorB`, com teste |
| Categoria pelo 1º termo | "copos para whisky" → lote 22 virava bebida e sumia | detecção por contagem |
| Ranking por quantidade | copo descartável acima de martelete Bosch | `classeValor` dominante |
| `workerSrc = ''` no pdfjs | quebrava em runtime passando o typecheck | comentário explícito no código |
| Fixture em UTC exibido cru | 18:30 onde o site diz 15:30, 3 h a mais | `fuso` explícito + teste |

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
- **`custo.ts` — dois âncoras reais do site, não um.** `3.010 → 551,00 → 3.561,00` e
  `3.460 → 596,00 → 4.056,00`. Um ponto só foi o que fez tratar R$ 250 como taxa fixa; dois
  pontos na mesma faixa também não distinguiriam, então as 21 fronteiras da tabela entram
  como casos separados.
- **`teto.ts` — o teste que mais importa.** `teto_custo = 2000` → teto no martelo
  **1.590,91**, e o teste asserta que **não** é 1.666,67 (quem usou os 5% da API), nem
  1.575,00 (quem subtraiu em vez de dividir), nem 1.818,18 (quem esqueceu a faixa).
  Também: `teto_seguro ≤ teto_maximo` sempre, e itens faixa C **não podem** mover o teto.
- **Cobertura:** com 3% dos itens precificados, **nenhum** lote pode exibir teto — todos em
  `sem-cobertura`. E o caso do lote 202: uma linha de 48 unidades baratas passando o gate de
  unidades enquanto o item caro fica sem preço tem de reprovar pelo gate de linhas.
- **Categoria por contagem:** "COPOS PARA WHISKY" tem de dar `utensilios`, não `bebidas`.
- `faixa`: itens do lote 3 conhecidamente irrisórios (máscara de gatinho, roupas diversas,
  livros diversos) devem cair em C e aparecer só em `volume_bazar`.
- Condição ausente: no lote 3, `vencimento`/`desmontado`/`incompleto` têm de sair **nulos**
  nas 71 linhas e `condicao_declarada = "não informado"` — se algum vier preenchido, o
  parser está pegando cabeçalho como dado.
- Dashboard: abrir o HTML gerado **com a rede desligada** e confirmar que renderiza inteiro
  e que a busca por número de lote funciona.
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
