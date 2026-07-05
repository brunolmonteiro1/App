# Planilha do piloto — abas e colunas

Uma única planilha Google ("**Piloto Mission Control**") com 4 abas. Os nomes das abas e das colunas precisam bater exatamente (o workflow mapeia por cabeçalho). Quando tivermos os relatórios reais, ajustamos o mapeamento no workflow — não é preciso mudar o processo da equipe.

## Aba 1 — `Relatorio_Inadimplencia` (entrada, colada pela equipe)

| Cliente | Telefone | Placa | Contrato | Valor | Vencimento |
|---|---|---|---|---|---|
| Ana Souza | 5562999990001 | JKL0M12 | CT-2004 | 289.90 | 05/03/2026 |
| Bruno Lima | 5562999990002 | ABC1D23 | CT-1877 | 319.00 | 20/05/2026 |
| Carla Nunes | 5562999990003 | DEF4G56 | CT-1990 | 289.90 | 10/06/2026 |
| Diego Alves | 5562999990004 | GHI7J89 | CT-2051 | 349.90 | 25/06/2026 |
| Elisa Prado | 5562999990005 | MNO2P34 | CT-1803 | 289.90 | 07/03/2026 |

- `Valor`: número com ponto ou vírgula decimal — ambos aceitos.
- `Vencimento`: data da parcela vencida, `dd/mm/aaaa` ou `aaaa-mm-dd`.

## Aba 2 — `Relatorio_Renovacoes` (entrada, colada pela equipe)

| Cliente | Telefone | Placa | Contrato | FimVigencia |
|---|---|---|---|---|
| Fabio Reis | 5562999990006 | QRS5T67 | CT-2100 | 28/07/2026 |
| Gina Melo | 5562999990007 | UVW8X90 | CT-2088 | 15/08/2026 |
| Hugo Dias | 5562999990008 | YZA1B23 | CT-2115 | 20/09/2026 |

## Aba 3 — `Daily Summary` (saída, escrita pelo robô — criar só o cabeçalho)

| Data | InadimplentesTotal | ValorTotal | Faixa1a30 | Faixa31a60 | Faixa61a90 | Faixa90mais | MaisAntigoDias | RenovacoesTotal | Renov30 | Renov60 | Renov90 |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Aba 4 — `Message Queue` (saída, escrita pelo robô — criar só o cabeçalho)

| Data | Tipo | Cliente | Telefone | Contrato | Placa | Detalhe | Mensagem | Status | AprovadoPor | Enviado |
|---|---|---|---|---|---|---|---|---|---|---|

- O robô grava `Status = pending`. O humano revisa, envia manualmente e marca `sent` (ou `rejected`) + `AprovadoPor` + data em `Enviado`.

## Templates de mensagem (v1 — ajustar com o time)

- **Inadimplência:** `Olá {Cliente}, tudo bem? Identificamos uma parcela do contrato {Contrato} (placa {Placa}) em aberto desde {Vencimento}, no valor de R$ {Valor}. Podemos te ajudar a regularizar? Qualquer dúvida estamos à disposição.`
- **Renovação:** `Olá {Cliente}! Seu contrato {Contrato} (placa {Placa}) vence em {DiasParaVencer} dias, em {FimVigencia}. Vamos garantir a renovação e manter seu veículo protegido?`
