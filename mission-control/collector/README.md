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

## Como completar a navegação do STCOP (sem escrever código)

O único pedaço que falta é o caminho específico do STCOP (login → menu → relatório → exportar). A forma mais fácil de capturar isso, sem você descrever nada em texto: **grave seus próprios cliques**.

Na sua máquina (com Node instalado):
```bash
npx playwright codegen "https://URL-DO-STCOP"
```
Isso abre o STCOP + uma janela que **grava cada clique/preenchimento como código**. Faça o caminho completo uma vez: logar → ir ao relatório de inadimplência → exportar → idem renovações. Copie o código gerado e me manda. Eu encaixo nas seções `>>> PREENCHER <<<` do `src/collect.ts` **envolvendo tudo nos trilhos de segurança** — você nunca precisa mexer no código.

> Alternativa sem codegen: me manda um vídeo de tela ou uma sequência de prints do caminho (login → cada clique → tela do relatório → botão de exportar) que eu roteirizo.

## Perguntas que preciso para finalizar (críticas para a arquitetura)

1. **URL do STCOP** e se o login é usuário+senha simples, ou tem **captcha / código por SMS/e-mail (2FA)**. Captcha muda tudo — pode exigir sessão persistente ou um passo humano no primeiro login.
2. O relatório sai como **download de arquivo** (CSV/Excel — ideal) ou só como **tabela na tela** (raspagem — também funciona)?
3. **Janela de baixo movimento** para os primeiros testes (ex.: domingo de manhã), em dry-run, para não atrapalhar a operação.
4. Quais **colunas reais** o relatório do STCOP traz (para eu mapear para `Cliente/Telefone/Placa/Contrato/Valor/Vencimento`).

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
