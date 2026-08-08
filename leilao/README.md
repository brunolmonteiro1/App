# leilao — análise de lotes de leilão (Superbid)

Ferramenta para, a partir de um link de evento de leilão, produzir um **ranking de lotes
por valor recuperável sobre custo**, com custo por unidade real ao lado como referência.

**Status: planejado, não implementado.** O que existe aqui hoje é o reconhecimento
técnico já executado contra o site real, com as evidências capturadas. Nenhuma linha do
produto foi escrita ainda.

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [`docs/01-reconhecimento.md`](docs/01-reconhecimento.md) | O que foi verificado no site real e as evidências. Leia primeiro. |
| [`docs/02-plano-implementacao.md`](docs/02-plano-implementacao.md) | Arquitetura, modelo de dados, fases e verificação. |

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
