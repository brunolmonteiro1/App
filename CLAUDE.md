# CLAUDE.md — brunolmonteiro1/app

Este repositório não tinha `CLAUDE.md` até agora. Ele contém mais de um projeto — leia `README.md` (Norton Impact) e o conteúdo de cada pasta antes de assumir do que se trata; não presuma que é só "o Vosz".

- `norton_app/` — protótipo Flutter do Norton Impact (ver `README.md` na raiz e `docs/`).
- `vosz-site/` — só `Dockerfile` e `docker-compose.yml` (config de deploy); o container rodando na VPS como `vosz-site` corresponde a este deploy, mas o código-fonte do site não está confirmado neste repositório.

## Infraestrutura / VPS (deploy e administração)

Containers deste repositório (ao menos `vosz-site`) já rodam na VPS Hostinger (`187.77.63.219`), junto com outros projetos do mesmo dono (Casa da Rocha, Diagnóstico 360, mission-control) na mesma máquina.

**Antes de tocar na VPS, leia `brunolmonteiro1/infra-vps/CLAUDE.md`** (repositório separado — peça para anexar à sessão se ainda não estiver). Resumo do que você precisa saber sem nem abrir o repo:

- Sessões de Claude Code na nuvem **não conseguem abrir SSH direto** (o proxy de rede da sessão só permite HTTPS, não TCP bruto na porta 22). Não tente `ssh`/`scp` direto daqui — vai falhar.
- Toda administração da VPS passa pelo workflow `admin.yml` do repositório `brunolmonteiro1/infra-vps` (GitHub Actions `workflow_dispatch`), que roda num runner sem essa restrição e conecta via SSH como usuário `claude` (não root).
- **Nunca peça ao usuário senha de root ou chave privada SSH no chat.** Já existe uma chave dedicada guardada como secret do GitHub Actions (`HOSTINGER_SSH_PRIVATE_KEY` no repo `infra-vps`) — não gere uma nova nem peça para reenviar.
- Layout real da VPS: cada projeto fica em `/opt/<nome>` (não `/opt/apps/<nome>`). O usuário `claude` já está nos grupos `sudo` e `docker`, mas ainda não tem escrita nos diretórios dos projetos (donos de `root:root`) nem sudo sem senha — isso está pendente de um ajuste único, feito manualmente pelo usuário via console web da Hostinger.
- Para rodar algo na VPS: descreva a ação, anexe o repo `infra-vps` à sessão e dispare `admin.yml` (`project`, `action`, ou `raw_command` só para diagnóstico read-only).
