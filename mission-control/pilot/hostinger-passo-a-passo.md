# Piloto no seu VPS Hostinger — passo a passo (≈20 min)

## 1. Abrir o terminal do VPS (sem SSH, direto no navegador)

hPanel → **VPS** → selecione o servidor → **Visão geral** → botão **Terminal do navegador** (Browser Terminal). Você entra como root.

> Alternativa: se você usa SSH normalmente (PuTTY/terminal), serve igual.

## 2. Apontar um subdomínio para o VPS

Anote o **IP do VPS** (aparece na visão geral do hPanel).

- **Se seu domínio está na Hostinger:** hPanel → Domínios → DNS → adicionar registro `A`:
  `n8n` → `IP_DO_VPS` (TTL padrão). Propaga em minutos.
- **Se não tem domínio nenhum:** use o truque do sslip.io — o domínio
  `n8n.SEU-IP-COM-TRACOS.sslip.io` (ex.: IP `31.97.10.20` → `n8n.31-97-10-20.sslip.io`)
  resolve automaticamente para o seu IP e o Caddy emite HTTPS normalmente.
  Serve perfeitamente para o piloto.

## 3. Rodar o instalador (1 comando)

No terminal do VPS, cole (ajuste o domínio):

```bash
curl -fsSL https://raw.githubusercontent.com/brunolmonteiro1/App/claude/ai-mission-control-arch-inabaj/mission-control/deploy/install.sh \
  | sudo N8N_DOMAIN=n8n.seudominio.com.br bash
```

O script instala Docker, n8n + Caddy (HTTPS automático), firewall, swap e backup diário. Ao final ele imprime os próximos passos.

> VPS Hostinger com template Ubuntu + Docker já instalado também funciona — o script detecta e pula o que já existe.

## 4. Criar a conta e a API key do n8n (5 min, uma vez)

1. Abra `https://n8n.seudominio.com.br` → crie a conta **owner**;
2. **Settings → n8n API → Create API key** → copie a key;
3. Cole a key na sessão do Claude Code. A partir daí eu instalo/atualizo/depuro
   os workflows daqui via HTTPS — a key não dá shell no servidor e você pode
   revogá-la a qualquer momento.

## 5. Credenciais dos conectores (na UI do n8n, segredos nunca no chat)

| Conector | Como |
|---|---|
| **Google Sheets** | n8n → Credentials → Google Sheets (OAuth2) → login com a conta Google que é dona das planilhas do piloto |
| **Telegram** | Fale com o @BotFather no Telegram → `/newbot` → copie o token → n8n → Credentials → Telegram API. Adicione o bot ao grupo interno da operação e anote o `chat_id` (me peça ajuda que eu descubro o chat_id via API) |

## 6. Planilhas e workflow

1. Crie a planilha Google conforme `planilhas-modelo.md` (abas e colunas);
2. Importe `workflow-pilot.json` (n8n → Workflows → Import from File) — ou me passe a API key que eu mesmo instalo e configuro;
3. Rode uma vez manual (**Execute Workflow**) com os dados de exemplo → confira as abas `Daily Summary` e `Message Queue` e a mensagem no Telegram;
4. Ative o workflow (toggle **Active**) → passa a rodar todo dia às 08:00 (America/Sao_Paulo).

## 7. Rotina diária da operação (o processo humano)

1. De manhã, alguém exporta os 2 relatórios dos sistemas legados e cola o conteúdo nas abas `Relatorio_Inadimplencia` e `Relatorio_Renovacoes` (substituindo o conteúdo anterior);
2. Às 08:00 o robô processa e posta o resumo no Telegram;
3. O aprovador abre a aba `Message Queue`, revisa os rascunhos `pending`, envia manualmente pelo WhatsApp os aprovados e marca `Status = sent` + seu nome em `AprovadoPor`;
4. **Nada é enviado automaticamente. O robô nunca entra nos sistemas legados.**

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| HTTPS não emite / site não abre | DNS ainda não propagou, ou porta 80/443 bloqueada em firewall externo da Hostinger (confira em hPanel → VPS → Firewall) |
| Workflow lê 0 linhas | Nome da aba diferente do configurado, ou cabeçalhos de coluna não batem com o mapeamento (ver `planilhas-modelo.md`) |
| Datas viram erro | Formato de data do relatório diferente — o parser aceita `dd/mm/aaaa` e `aaaa-mm-dd`; outro formato = me avise que ajusto o mapeador |
