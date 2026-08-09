# 01 — Reconhecimento técnico (executado)

Alvo: `https://www.superbid.net/evento/logistica-reversa-790754`
Data: 08/08/2026 · Evento com 61 lotes, 662 fotos, 57 PDFs de anexo.

Tudo abaixo foi **verificado contra o site real**, não suposto. As evidências estão em
`../recon/fixtures/`. Este documento derruba as premissas da proposta inicial, que
assumia necessidade de navegador headless, extensão do Chrome e OCR.

---

## 1. A API é pública e devolve o evento inteiro em uma requisição

A página é Next.js com SSR e expõe o endpoint real dentro de `__NEXT_DATA__`
(`props.pageProps.offersList.constructedUrl`). Chamando direto:

```
GET https://offer-query.superbid.net/seo/offers/
      ?locale=pt_BR&portalId=[2,15]&requestOrigin=marketplace&timeZoneId=UTC
      &filter=auction.id:790754
      &orderBy=lotNumber:asc;subLotNumber:asc
      &pageNumber=1&pageSize=100
      &urlSeo=https://www.superbid.net
```

**Resultado: HTTP 200, 742 KB, `total: 61`, todos os 61 lotes.** Sem autenticação, sem
Cloudflare, sem challenge, sem paginação necessária. O `auction.id` sai do sufixo do slug
da URL (`...-790754`).

**Consequência: Playwright, extensão do Chrome e sessão autenticada saem do projeto.**

Cada lote já traz tudo o que a análise precisa:

| Campo | Uso |
|---|---|
| `price` / `priceFormatted` | lance atual (numérico) |
| `offerDetail.initialBidValue`, `currentMinBid` | lance inicial e mínimo |
| `currentBidIncrement.currentBidIncrement` | incremento (R$ 200 no lote 3) |
| `endDate` / `endDateTime` | encerramento |
| `totalBids`, `totalBidders`, `visits` | disputa e interesse |
| `product.shortDesc`, `detailedDescription` | título e descrição |
| **`product.galleryJson[].link`** | **todas as fotos** (662 no evento) |
| **`product.attachments[].link`** | **PDFs de anexo** (57 no evento) |
| `product.location.city` | retirada (Embu das Artes-SP) |
| `groupOffer.commissionPercent` | comissão do leiloeiro (5%) |

Não é preciso visitar página de lote — a listagem já contém as URLs de mídia.

## 2. `quantityInLot` é sempre 1; a quantidade real só existe em texto livre

Nos 61 lotes, `quantityInLot = 1` e `systemMetric = "un"`. É "1 lote", não a contagem de
peças. A quantidade real aparece só no título, em **seis formatos inconsistentes**:

| Formato | Exemplo real |
|---|---|
| `APROX. N UN` | `(APROX. 142 UN)` |
| `APROX.: N PÇS` (com dois-pontos) | `(APROX.: 431 PÇS)` |
| `APROX. N PC` | `(APROX. 81 PC)` |
| sem "aprox" nenhum | `(19 UN)`, `(45 PÇS)`, `(32 UN)` |
| `Qtde` variantes | `Qtde Aprox. 74`, `Qtde. 74`, `(Qtde. 265)` |
| **erro de digitação** | `(AROX. 44 UN)` — falta o P |
| **sem quantidade alguma** | lotes 37, 46, 323 |

Regex ingênua acerta 40/61; uma robusta chega a 45/61. Os 16 restantes exigem tratar as
variantes acima, e 3 lotes não têm quantidade em lugar nenhum do título — nesses, o
número tem de vir do manifesto ou ser marcado como desconhecido, **nunca chutado**.

Detalhe que quebra código ingênuo: **`lotNumber` não é sequencial** — vai a 202, 211,
250, 323. Nunca usar índice do array como número de lote.

## 3. O PDF de anexo é o manifesto item a item, com camada de texto

Achado mais valioso. O anexo do lote 3 (`SB0032812`) tem 18 páginas e uma tabela
`Descrição | Quantidade | Referência | Observações | ... | Marca | Frases Padrões`.

Parseado com `../recon/extrai_manifesto.py`:

```
paginas=18 itens=71 soma=304 refs={'SB0032812'}
```

**A soma das quantidades é exatamente as "APROX. 304 UN" do título.** E a referência do
PDF confere com o `(Ref.: SB0032812)` do lote — dá para **validar que o PDF pertence ao
lote certo** antes de usar os dados.

O manifesto nomeia marca e modelo, o que abre a porta para precificação:
`Martelete Rompedor Bosch Gbh 2-`, `AIR FRYER BRITANIA 5,5 LITROS`, `Faca Spyderco`,
`Grampo Rápido Bessey Ehkxl24`, `JOGO DE PANELA TRAMONTINA INOX`,
`Balança de bioimpedância`, `Alicate Wattímetro Aw-4800`, `SELADORA COM TEMPORIZADOR`.

**Consequência: a IA de visão deixa de ser o motor da análise.** O manifesto já diz o que
tem e quantos. Visão fica com papel estreito e barato — conferir estado de conservação e
achar item de valor que o manifesto descreve mal.

### Duas armadilhas de implementação, já pagas no recon

- **Nunca usar regex lazy global com `DOTALL`** do tipo
  `(.*?)(\d+)\s+(SB\d+)\s+Somente...` sobre o texto inteiro: causa backtracking
  catastrófico e **travou o processo** (matou por timeout de 120 s). O correto é
  **dividir primeiro** pelo delimitador `"Somente os itens citados"` — o boilerplate que
  encerra cada linha — e só então aplicar regex ancorada (`(\d+)\s+(SB\d+)\s*$`) em cada
  pedaço. Assim os 71 itens saem em milissegundos.
- Depois do split, a descrição vem contaminada com fragmentos do boilerplate
  (`"na descrição fazem parte do lote"`, `"Itens não testados, podendo apresentar..."`).
  Exige **lista explícita de fragmentos a remover**. Sem ela, `JOGO DE FERRAMENTAS SATA
  INCOMPLETO` aparece truncado e o campo fica inútil para precificação.

## 4. O Edital é outro tipo de PDF e exige engine de verdade

O segundo PDF analisado (`90b94901-...`) **não é anexo de nenhum dos 61 lotes** —
verificado, 0 ocorrências entre os 57 anexos. É o Edital/Condições de Venda,
**documento de evento, não de lote**, com 22 páginas.

E se comporta ao contrário do manifesto: fonte com subset e **sem `/ToUnicode`, sem
`/Differences`, sem `/Encoding`** (contagem: 0, 0, 0). Extração ingênua devolve lixo,
porque os códigos de glifo não mapeiam para Unicode:

```
E+ndiPces de dend) e ])*)Oent+     →     Condições de Venda e Pagamento
```

Decodifiquei por substituição inferida apenas para confirmar o conteúdo — e é mesmo o
Edital ("O evento será realizado ... através do Canal Superbid.net", "Para participar do
evento o usuário cadastrado deverá se habilitar", "Condições de Venda e Pagamento").

**Consequência: usar `pdfjs-dist`**, que reconstrói o mapeamento a partir do programa de
fonte embutido, em vez de extrator caseiro de streams. Se ainda assim falhar, o fallback
é rasterizar e passar por visão — 22 páginas, uma vez por evento, custo irrelevante e
cacheável.

## 5. Taxas: os 5% da API estão errados — o encargo real é 10% + tabela

> **Corrigido depois deste recon.** Os dois documentos que o operador forneceu (o Edital e o
> estimador do site) mostraram que o encargo do comprador é **leiloeiro 5% + buyer's premium 5%,
> mais Encargos de Administração e Fee Plataforma TABELADOS por faixa de lance** (R$ 50 até
> R$ 499,99 … R$ 6.500 acima de R$ 150 mil). Conferido em dois pontos reais, no centavo:
> lance 3.010 → 551,00 e lance 3.460 → 596,00.
>
> O overhead real vai de **15% a 35%** e **não é monotônico** — cruzar uma faixa salta o
> encargo. Ver `docs/02-plano-implementacao.md`. A seção abaixo fica como registro do que a
> API sozinha permitia concluir, e é um bom exemplo de por que ela não serve para custo.

- `groupOffer.commissionPercent = 5` — idêntico nos 61 lotes. O evento confirma:
  "as ofertas desse evento estão divididas em 1 grupo(s)".
- `commercialCondition.auctioneerCommissionPercent = null`.
- Existe sistema de taxas estruturado — o i18n da página expõe `FEE_PLATFORM`
  ("Fee Plataforma"), `ITEM_FIXED_VALUE2`, `ITEM_PERCENTAGE1`, `TRANSFER_SERVICES` — mas
  **os valores não vêm no payload SSR**; ficam atrás do widget "Estimar comissões e
  demais valores".

Como o Edital traz as Condições de Venda e Pagamento, a tabela de encargos **não precisa
ser digitada a dedo**: extrai-se do Edital uma vez por evento e grava-se como config
revisável. Enquanto isso não acontecer, o custo deve ser exibido como **incompleto**, não
como final.

## 6. Custo por unidade, isolado, é uma métrica que engana

Conclusão que reformula o objetivo da ferramenta. O lote 3 sai a **R$ 7,01/unidade**
(R$ 2.130 ÷ 304) — parece excelente. O manifesto mostra de onde vêm as 304 unidades:

```
 60x MASCARA DE GATINHO        36x ROUPAS DIVERSAS        30x CARREGADOR HC 11
 20x LIVROS DIVERSOS           12x Travessa Coza Uno      12x Lenços Umedecidos Pampers
```

São ~170 das 304 unidades em itens de valor unitário irrisório, inflando o denominador. O
valor real está concentrado em meia dúzia de linhas: martelete Bosch, air fryer Britânia,
faca Spyderco, duas balanças de bioimpedância, alicate wattímetro, seladora.

**Ranking por R$/unidade puro premiaria justamente os lotes cheios de bugiganga.** O
critério de ordenação tem de ser **valor recuperável sobre custo**, com R$/unidade
exibido ao lado como referência — nunca como critério.

Para dimensionar: os 61 lotes somam **13.434 unidades declaradas**, com lances entre
R$ 500 e R$ 6.980. Sem essa correção, a ferramenta produziria um ranking ativamente
enganoso.

---

## Riscos remanescentes

| Risco | Mitigação |
|---|---|
| `offer-query` não é contrato público, pode mudar sem aviso | schema `zod` falhando alto + teste marcado `@rede` como detector |
| `pdfjs-dist` pode não resolver a fonte do Edital | tarefa de 30 min na Fase 0; fallback é rasterizar + visão |
| Preço de mercado por IA é estimativa, não cotação | relatório mostra faixa e confiança; lance é decisão do operador |
| Scraper agressivo → bloqueio de IP | throttle de 1–2 req/s nos downloads; listagem é 1 request só |
