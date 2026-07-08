#!/usr/bin/env bash
# ============================================================================
# Deploy do Coletor TAG/Vilesoft via DOCKER (mesmo VPS do n8n).
# Cole no terminal do VPS:  curl -fsSL <raw>/deploy-docker.sh | sudo bash
#
# Não instala Node nem Chromium no host: tudo roda dentro da imagem oficial
# do Playwright. Só precisa de Docker (que você já tem por causa do n8n).
# NÃO grava credenciais — você preenche o .env no final.
# ============================================================================
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo "Rode como root (sudo)."; exit 1; fi

DIR=/opt/mission-control/collector
REPO="https://github.com/brunolmonteiro1/app"
BRANCH="claude/ai-mission-control-arch-inabaj"

echo "==> [1/5] Checando Docker + Compose"
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não encontrado. Instale o Docker primeiro (o n8n já usa)."; exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Plugin 'docker compose' não encontrado. Instale docker-compose-plugin."; exit 1
fi

echo "==> [2/5] Baixar o coletor (sparse checkout só da pasta collector)"
mkdir -p /opt/mission-control && cd /opt/mission-control
if [ ! -d repo ]; then
  git clone --no-checkout --depth 1 -b "$BRANCH" "$REPO" repo
  cd repo && git sparse-checkout init --cone && git sparse-checkout set mission-control/collector && git checkout
else
  cd repo && git fetch origin "$BRANCH" && git reset --hard "origin/$BRANCH"
fi
mkdir -p "$DIR"
# Copia o código-fonte (preserva .env/sa-key.json/audit já existentes no destino).
cp -r /opt/mission-control/repo/mission-control/collector/. "$DIR"/

echo "==> [3/5] Preparar .env, sa-key.json (placeholder) e pasta de auditoria"
cd "$DIR"
if [ ! -f .env ]; then cp .env.example .env && chmod 600 .env; fi
# O bind-mount do compose exige que o arquivo exista (senão o Docker cria pasta).
# Placeholder vazio só para o dry-run rodar; substitua pela chave real da SA.
[ -f sa-key.json ] || { touch sa-key.json && chmod 600 sa-key.json; }
mkdir -p audit

echo "==> [4/5] Build da imagem Docker (Playwright + Chromium embutidos)"
docker compose build

echo "==> [5/5] Cron às 07:45 (America/Sao_Paulo) via docker compose run"
cat > /etc/cron.d/mc-collector <<EOF
# Coletor TAG -> planilha, antes do n8n das 08:00
45 7 * * * root cd $DIR && /usr/bin/docker compose run --rm collector >> $DIR/collector.log 2>&1
EOF

echo
echo "============================================================"
echo " PRONTO. Falta você fazer 2 coisas:"
echo " 1. Editar $DIR/.env e preencher STCOP_USERNAME e STCOP_PASSWORD."
echo " 2. Colocar a chave real da Service Account em $DIR/sa-key.json"
echo "    (substitui o placeholder) e compartilhar a planilha com o"
echo "    e-mail da Service Account. Ver GOOGLE-SA.md."
echo ""
echo " TESTE (dry-run, não grava nada — só navega e tira screenshots):"
echo "   cd $DIR"
echo "   docker compose run --rm -e DRY_RUN=true -e SO_INADIMPLENCIA=true collector"
echo "   ls audit/*/          # screenshots de cada passo"
echo "   cat audit/*/safety-log.json"
echo ""
echo " Só depois do dry-run OK, rode sem o -e DRY_RUN (usa o .env) para gravar."
echo "============================================================"
