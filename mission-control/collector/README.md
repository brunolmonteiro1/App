# Coletor STCOP — Fase B (read-only, determinístico)

Elimina o passo manual "humano exporta o relatório e cola na planilha". Um script Playwright loga no STCOP, navega até os relatórios, extrai os dados e grava direto nas abas do Google Sheets do piloto. Roda no VPS, agendado antes das 08:00, e o workflow n8n já existente segue daí.

## Princípio inegociável: não é agente, é script

Isto **não** é um agente de IA navegando livremente. É um roteiro fixo: sempre os mesmos cliques, sempre o mesmo caminho. O login master (que pode escrever) é usado **só para ler**, com trilhos que tornam a escrita impossível mesmo se algo der errado.

## Trilhos de segurança (já implementados e testados)

Na `src/safety.ts` — a interceptação de rede (`SafetyGuard`) roda em toda requisição:

| Regra | O que faz |
|---|---|
| **Bloqueio de escrita** | Todo POST/PUT/PATCH/DELETE é abortado, exceto o POST de login (allowlist explícita e mínima) |
| **Padrões proibidos** | Qualquer URL com `salvar/excluir/cancelar/ativar/boleto/submit/criar...` é abortada, mesmo em GET |
| **Allowlist de navegação** | Só navega dentro do domínio do STCOP; qualquer outro host é bloqueado (o robô não "passeia") |
| **Dry-run** | 1º modo obrigatório: navega e loga tudo, mas não baixa nem grava nada |
| **Auditoria** | Cada execução salva screenshots + trace do Playwright + `safety-log.json` com toda decisão de bloqueio |

Validação da lógica de bloqueio: 10/10 casos passando (salvar, cancelar, gerar boleto, deletar, ativar e host externo → todos bloqueados; ler relatório e login → permitidos).

## Navegação mapeada (TAG Assistência / Vilesoft)

Os prints do cliente confirmaram: TAG, STCOP e ViaVante são o mesmo sistema **Vilesoft** (v7.378) — o coletor serve para os três trocando só a URL no `.env`. Caminho já roteirizado em `src/collect.ts` (seletores por texto, resilientes a IDs internos):

1. **Login** — `tagassistencia.com.br` → campos "Seu e-mail" / "Senha" → botão **Entrar**;
2. **Menu** (☰) → **Ativações - TAG** → **Relatórios**;
3. **Inadimplência** → o formulário tem **Formato: CSV/PDF** → marca **CSV** → botão **Imprimir** → baixa o CSV;
4. **Contratos a Renovar** → mesmo padrão (CSV → Imprimir).

O relatório exporta CSV nativamente (radio no formulário) — sem raspagem de tela. Unidade default já é **BELO HORIZONTE**, batendo com o piloto.

## Estado atual: pronto para dry-run

O código está completo e com typecheck limpo. Os pontos marcados `AJUSTE` no `collect.ts` (seletor do hamburguer, radio CSV) só serão confirmados no primeiro **dry-run contra o DOM real** — que navega, tira screenshots e audita **sem baixar nem gravar nada**. É assim que validamos os seletores com segurança total.

Ainda preciso de:
- Uma **janela de baixo movimento** (ex.: domingo de manhã) para o primeiro dry-run;
- Um **CSV de exemplo** (pode anonimizar) de cada relatório, para eu confirmar o mapa de colunas em `csv.ts` (hoje ele casa por nome de cabeçalho com tolerância a acento, mas ver o real fecha 100%).

## Setup no VPS (quando a navegação estiver pronta)

```bash
cd collector
npm install
cp .env.example .env      # preencher STCOP_* e caminho da service account
npm run build
DRY_RUN=true npm run collect   # 1º teste: só navega e audita, não grava
# conferir ./audit/<run>/trace.zip e safety-log.json
DRY_RUN=false npm run collect  # produção: grava nas abas do Sheets
```

Credenciais: `STCOP_USERNAME/PASSWORD` só no `.env` do VPS (permissão 600), nunca no código, nunca em log, nunca no prompt de um modelo. A service account do Google recebe acesso à planilha por compartilhamento (e-mail da SA).

## Integração com o piloto

O coletor roda via cron no VPS às ~07:45 (antes do workflow n8n das 08:00). Ele regrava as abas `Relatorio_Inadimplencia` e `Relatorio_Renovacoes`; o n8n às 08:00 lê os dados frescos e segue o fluxo normal (análise → Telegram → fila de rascunhos). Nenhuma mudança no workflow n8n é necessária — o coletor só substitui a origem manual dos dados.
