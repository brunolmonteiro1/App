# leilao — teto de lance por lote (Superbid / BidTV)

A partir do link de um evento, gera um **estudo com o teto máximo de lance de cada lote** —
a página que o operador mantém aberta ao lado do BidTV para decidir, no último segundo, se
cobre ou não. Com `--refresh`, ela busca os lances sozinha e repinta 🟢/🟡/🔴.

**A ferramenta nunca dá lance.** O clique é sempre do operador, na janela do BidTV.

## Como rodar

```bash
cd leilao && npm install

# Confere a conta de encargos contra o diálogo real do site
npm run cli -- custo --lance 3460
#   → encargos R$ 596,00 · total R$ 4.056,00 · overhead 17,2%

# Estudo dos 61 lotes, offline, a partir do evento capturado
npm run cli -- estudo --fixture --frete 150 --refresh 15 \
  --precos exemplos/precos-lote3-exemplo.json
#   → saida/estudo-790754.html

# Ao vivo, contra o site
npm run cli -- estudo --url https://www.superbid.net/evento/logistica-reversa-790754 --refresh 15

# Esqueleto de preços para preencher (sem números inventados)
npm run cli -- precos --saida precos.json

npm test          # 62 testes
npm run typecheck
```

## Status

| Parte | Estado |
|---|---|
| Coleta da API, validada por zod | ✅ |
| Parser do manifesto (PDF → itens) | ✅ 71 itens / 304 un no lote 3 |
| Quantidade do título (6 formatos + typo) | ✅ 58+/61 |
| Encargos e teto (10% + R$ 250) | ✅ ancorado no diálogo do site |
| Faixas A/B/C e unidades efetivas | ✅ heurística; preço vem de arquivo |
| Estudo HTML com refresh | ✅ |
| Preço automático por LLM | ⬜ Fase 2 — exige `ANTHROPIC_API_KEY` |
| Download dos 57 PDFs de anexo | ⬜ hoje só o lote 3 tem manifesto no repo |
| Extração do Edital | ❌ ver "tarefa zero" abaixo |

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [`docs/01-reconhecimento.md`](docs/01-reconhecimento.md) | O que foi verificado no site real e as evidências. Leia primeiro. |
| [`docs/02-plano-implementacao.md`](docs/02-plano-implementacao.md) | Arquitetura, modelo de dados, fases e verificação. |

## A tarefa zero falhou, e o impacto foi baixo

O plano dependia de `pdfjs-dist` conseguir ler o **Edital**. Não consegue: a fonte tem
subset sem `/ToUnicode` e o texto sai como código de glifo (`! " # $ %`). Está travado em
teste para avisar se um dia mudar.

Impacto baixo porque o Edital servia para descobrir a tabela de encargos — e ela veio de
fonte melhor: **o próprio diálogo de confirmação de lance do BidTV**, que abre a composição
e fecha no centavo. O manifesto, que é o que o produto realmente precisa, `pdfjs-dist` lê
perfeitamente.

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
