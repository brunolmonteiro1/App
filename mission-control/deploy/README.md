# Deploy do piloto — como o Claude Code opera o VPS

## O problema

O Claude Code **na web** (este ambiente) roda num container remoto onde a porta 22 de saída é bloqueada — só sai HTTPS. Logo, SSH direto para o VPS não funciona daqui. Isso não impede nada: são duas rotas, e nas duas o Claude instala e opera tudo.

## Rota 1 — Claude Code no seu computador (acesso total)

Instale o Claude Code CLI na sua máquina (`npm i -g @anthropic-ai/claude-code`) e rode numa pasta com a chave SSH do VPS disponível. Nesse cenário o Claude tem SSH real: instala Docker, n8n, HTTPS, firewall, sobe workflows, lê logs, debuga ao vivo. É a rota com menos atrito para a instalação inicial.

Boas práticas de acesso:
- Crie um usuário dedicado (`adduser claude-ops && usermod -aG docker,sudo claude-ops`) com chave SSH própria — não use a senha de root no chat com ninguém, nunca;
- Revogue/rotacione a chave depois da instalação se quiser: a operação do dia a dia não precisa de SSH (ver Rota 2).

## Rota 2 — Da web, via HTTPS (instalação por script + operação pela API do n8n)

1. **Instalação (1 comando, você cola no console do VPS):**

```bash
curl -fsSL https://raw.githubusercontent.com/brunolmonteiro1/App/claude/ai-mission-control-arch-inabaj/mission-control/deploy/install.sh | sudo N8N_DOMAIN=n8n.seudominio.com.br bash
```

   O script instala Docker, n8n + Caddy (HTTPS automático), firewall, swap e backup diário. Único pré-requisito: um registro DNS `A` apontando o domínio para o IP do VPS.

2. **Operação remota sem SSH:** depois que o n8n está no ar em `https://n8n.seudominio...`, o Claude Code (mesmo da web) gerencia tudo pela **API REST do n8n** — que é HTTPS, portanto passa pelo proxy deste ambiente:
   - criar/atualizar/ativar workflows (`POST /api/v1/workflows`);
   - consultar execuções e erros (`GET /api/v1/executions`);
   - importar as credenciais de Google Sheets/Telegram (criadas por você na UI; os segredos ficam criptografados no VPS, nunca no chat).

   Para isso basta você gerar uma **API key** no n8n (Settings → API) e fornecê-la na sessão. Escopo: só o n8n — a key não dá shell no servidor, e pode ser revogada a qualquer momento na UI.

## O que fica com humano (por design)

- Colar o comando de instalação no console do VPS (Rota 2) ou fornecer a chave SSH (Rota 1);
- Criar a conta owner do n8n e as credenciais OAuth do Google/token do bot Telegram na UI;
- Guardar o `.env` (chave de criptografia do n8n) e decidir rotação de acessos.

## Custos de referência

| Item | Valor |
|---|---|
| VPS 2 vCPU / 4 GB (Hostinger/Hetzner/DO) | ~US$ 8–20/mês |
| Domínio/subdomínio | já existente ou ~US$ 10/ano |
| n8n self-hosted, Caddy, UFW | US$ 0 (open source) |
| Alternativa sem VPS: n8n Cloud Starter | ~US$ 24/mês (sem manutenção) |
