# leilao — teto de lance por lote (Superbid / BidTV)

A partir do link de um evento, gera um **estudo com o teto máximo de lance de cada lote** —
a página que o operador mantém aberta ao lado do BidTV para decidir, no último segundo, se
cobre ou não. Com `--refresh`, ela busca os lances sozinha e repinta 🟢/🟡/🔴.

**A ferramenta nunca dá lance.** O clique é sempre do operador, na janela do BidTV.

## Como rodar

```bash
cd leilao && npm install

# Confere a conta de encargos contra os números reais do site
npm run cli -- custo --lance 3010
#   → leiloeiro 150,50 + premium 150,50 + adm 187,50 + fee 62,50
#   → encargos R$ 551,00 · total R$ 3.561,00 · overhead 18,3%

# Baixa os 57 manifestos (throttle 1,5 req/s, cache, idempotente)
npm run cli -- baixar --fixture

# Candidatos a precificar — ranking que NÃO precisa de preço nenhum
npm run cli -- shortlist --fixture --frete 150

# Itens de UM lote, para precificar até o fim (é isso que produz teto)
npm run cli -- precos --lote 4 --fixture

# Estudo dos 61 lotes, offline, a partir do evento capturado
npm run cli -- estudo --fixture --frete 150 --refresh 15 \
  --precos exemplos/precos-lote3-exemplo.json
#   → saida/estudo-790754.html

# Ao vivo, contra o site
npm run cli -- estudo --url https://www.superbid.net/evento/logistica-reversa-790754 --refresh 15

# Esqueleto de preços para preencher (sem números inventados)
npm run cli -- precos --saida precos.json

npm test          # 119 testes
npm run typecheck
```

## Status

| Parte | Estado |
|---|---|
| Coleta da API, validada por zod | ✅ |
| Aviso de degrau da tabela de encargos | ✅ |
| Parser do manifesto (PDF → itens) | ✅ 71 itens / 304 un no lote 3 |
| Quantidade do título (6 formatos + typo) | ✅ 58+/61 |
| Encargos e teto (10% + tabela por faixa) | ✅ ancorado em 2 pontos reais do site |
| Faixas A/B/C e unidades efetivas | ✅ heurística; preço vem de arquivo |
| Estudo HTML com refresh | ✅ |
| Preço automático por LLM | ⬜ fora de escopo por decisão do operador |
| Download dos 57 PDFs de anexo | ✅ 57/57, com cache e throttle |
| Shortlist por custo/un efetiva (sem preço) | ✅ |
| Gate de cobertura: não exibe teto que engana | ✅ |
| Extração do Edital | ❌ ver "tarefa zero" abaixo |

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [`docs/01-reconhecimento.md`](docs/01-reconhecimento.md) | O que foi verificado no site real e as evidências. Leia primeiro. |
| [`docs/02-plano-implementacao.md`](docs/02-plano-implementacao.md) | Arquitetura, modelo de dados, fases e verificação. |

## O que os 57 manifestos revelaram

Todos os 57 parseiam, e as somas batem com os títulos. O par **declarado × efetivo** confirma
exatamente o que o operador descreveu — "dizem que tem 400 itens, mas tem 300, porque 100 é um
negócio muito barato":

| Lote | Declaradas | Efetivas | Volume de bazar | Inflação |
|---|---|---|---|---|
| 9 | 402 | 185 | 217 | **54%** |
| 13 | 453 | 83 | 370 | **82%** |
| 3 | 304 | 146 | 158 | 52% |
| 8 | 34 | 34 | 0 | 0% |

Lote 13 promete 453 unidades e entrega 83 com valor de revenda. Lote 8 não infla nada. **Essa
coluna é o detector de lote inchado**, e só existe porque o manifesto é item a item.

**4 lotes (2, 5, 16 e 26) não têm anexo nenhum** — todos de cosméticos. Aparecem no estudo
marcados como "sem PDF de anexo", nunca com teto zero silencioso.

## Precifique UM lote até o fim, não o evento todo

Erro que já foi cometido aqui e está travado em teste: a lista global de preços, ordenada por
impacto no evento, **é a ferramenta errada para produzir teto**. Ela espalha esforço por 57
lotes; o teto é calculado por lote e item sem preço vale zero. Resultado real: 71 preços
preenchidos deram **3% de cobertura** e **zero teto utilizável**.

O fluxo certo tem três passos:

```bash
npm run cli -- shortlist --fixture --frete 150   # 1. escolhe candidatos (grátis)
npm run cli -- precos --lote 4 --fixture         # 2. precifica UM lote até o fim
npm run cli -- estudo --fixture --precos p.json  # 3. aquele lote ganha teto real
```

O passo 1 usa **custo / unidade efetiva**, que funciona com zero preços e já separa lote
honesto de lote inchado. No evento de referência ele aponta o lote 4 (R$ 13/un efetiva, infla
só 10%, **25 itens** a precificar) e o lote 56 (R$ 14/un, infla 1%, 60 itens).

### O gate de cobertura existe para a tela não mentir

Com cobertura baixa, o teto sai baixo — e um teto baixo **parece "lote caro"** quando na
verdade significa "ainda não sei". Isso faria o operador descartar lote bom. Então abaixo de
60% das unidades **e** 50% das linhas precificadas, o estudo mostra `PRECIFIQUE` em azul e
**omite o teto**, em vez de um vermelho.

Duas armadilhas reais que os testes travam:

- **Falso vermelho por unidade:** o lote 202 tinha 6 linhas e só "48 rodas de patinete" com
  preço. Cobria 68% das unidades e passava, enquanto o climatizador Springer — o valor do
  lote — contava zero, produzindo "teto R$ 0 · PARE". Daí o gate exigir as **duas** coberturas.
- **Teto R$ 0 nunca é resposta.** É resultado aritmético válido, mas não é decisão que se possa
  usar; vira `sem-cobertura`.

## O teto ainda depende de preço

Baixar os PDFs deu contagem real e custo por unidade efetiva nos 57. O **teto** precisa de
preço por item, e há **2.421 descrições distintas** — inviável à mão inteiro.

Daí `precos --todos`, que ordena por impacto:

```
impacto = 4^classeValor × unidadesTotais^0,55 × especificidade × √(nº de lotes)
```

A **classe de valor** domina de propósito: preço unitário varia três ordens de grandeza (R$ 2
num copo descartável, R$ 1.200 num martelete Bosch) e quantidade só uma. A primeira versão
ordenava por quantidade e enchia o topo de copo descartável, papel sulfite e vela — com o
martelete fora das 15 primeiras. Corrigido, o topo é ferramenta elétrica e eletrodoméstico.

O `√(nº de lotes)` entra porque precificar uma linha que aparece em 6 lotes destrava 6 tetos.

## Os encargos são tabelados — e é isso que engana

Do Edital: **leiloeiro 5% + buyer's premium 5%**, mais **Encargos de Administração e Fee
Plataforma tabelados por faixa de lance** (R$ 50 até R$ 499,99; R$ 125 até R$ 999,99;
R$ 250 até R$ 4.999,99; R$ 500 até R$ 9.999,99; e assim por diante até R$ 6.500).

Duas consequências que mudam a estratégia:

1. **O overhead real vai de ~15% a ~35%** nos lances deste evento, e o card do site diz
   "+10%" em todos. O melhor ponto não é "o maior lote possível" — é o **topo de uma faixa**
   (o lote 42, a R$ 4.990, é o mais eficiente do evento com +15,0%).
2. **Cruzar uma faixa custa caro por um centavo:** de R$ 4.999,99 para R$ 5.000,00 o custo
   sobe R$ 250. O estudo avisa quando o próximo lance atravessa um degrau.

Uma versão anterior deste código tratava o R$ 250 como taxa fixa universal, porque os dois
exemplos disponíveis caíam na mesma faixa. Ficou registrado em `config.ts` para não repetir.

## A tarefa zero falhou, e o impacto foi baixo

O plano dependia de `pdfjs-dist` conseguir ler o **Edital**. Não consegue: a fonte tem
subset sem `/ToUnicode` e o texto sai como código de glifo (`! " # $ %`). Está travado em
teste para avisar se um dia mudar.

Impacto baixo, e por dois motivos. O manifesto — que é o que o produto realmente precisa —
`pdfjs-dist` lê perfeitamente. E a tabela de encargos, único dado que o Edital tinha de
entregar, **o operador extraiu à mão e conferimos contra o estimador do site**, o que fecha
no centavo em dois pontos independentes. Automatizar a leitura do Edital seria conveniência,
não requisito: é um documento por evento, revisado uma vez.

## Conclusões que definem o projeto

1. **Não precisa navegador, extensão do Chrome nem login.** A página expõe a API real;
   os 61 lotes do evento de referência vêm em **uma requisição HTTP**, já com lance
   atual, URLs das 662 fotos e URLs dos 57 PDFs de anexo.
2. **O PDF de anexo é o manifesto item a item**, com camada de texto. No lote 3 são 71
   itens cuja soma de quantidades é exatamente as 304 unidades declaradas no título.
   Isso torna a análise de imagem um passo secundário e barato, não o motor.
3. **Custo por unidade, isolado, engana.** No lote 3 dá R$ 7,01/un, mas ~170 das 304
   unidades são itens de valor irrisório (60x máscara de gatinho, 36x roupas diversas).
   Ordenar por R$/unidade premiaria justamente os lotes cheios de tranqueira.
4. **O produto final é um teto de lance, não um relatório.** A mercadoria vai para bazar
   solidário e evento de outlet, com venda realizada a **40–60% do valor online** — então o
   teto sai como faixa (seguro / máximo), calculado de trás para frente a partir do
   múltiplo exigido por categoria. Itens irrisórios entram como **zero**: não pagamos por
   volume, mas ele gira no bazar como upside.

## Reproduzir o reconhecimento

```bash
cd leilao/recon

# Manifesto do lote 3 -> deve imprimir: itens=71 soma=304 refs={'SB0032812'}
python3 extrai_manifesto.py fixtures/manifesto-lote3-SB0032812.pdf

# Listagem completa do evento, direto da API (sem autenticação)
curl -s 'https://offer-query.superbid.net/seo/offers/?locale=pt_BR&portalId=%5B2,15%5D&requestOrigin=marketplace&timeZoneId=UTC&filter=auction.id:790754&orderBy=lotNumber:asc;subLotNumber:asc&pageNumber=1&pageSize=100&urlSeo=https://www.superbid.net' \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print("total:",d["total"],"| recebidos:",len(d["offers"]))'
```

`recon/fixtures/` guarda as evidências para servirem de fixture dos testes:
o JSON dos 61 lotes, o manifesto do lote 3 e o Edital do evento.

> `extrai_manifesto.py` é prova de conceito, não o produto. O extrator caseiro dele
> funciona nos manifestos, mas devolve lixo no Edital, que usa fonte com subset sem
> `/ToUnicode`. O produto vai usar `pdfjs-dist`. Detalhes em `docs/01-reconhecimento.md`.

## Aviso

Os PDFs e o JSON em `recon/fixtures/` são material público do evento
`logistica-reversa-790754`, capturados como evidência técnica. Preço de mercado estimado
por IA é chute informado, não cotação — a decisão de lance é sempre do operador.
