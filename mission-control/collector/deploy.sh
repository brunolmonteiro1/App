#!/usr/bin/env bash
# ============================================================================
# Deploy do Coletor TAG/Vilesoft no VPS (Ubuntu 22.04/24.04).
# Cole no terminal do VPS:  sudo bash deploy.sh
#
# Instala Node 22, o coletor, Playwright + Chromium, cria o .env template e
# agenda o cron às 07:45 (antes do n8n das 08:00). NÃO grava credenciais —
# você preenche o .env no final.
# ============================================================================
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo "Rode como root (sudo)."; exit 1; fi

DIR=/opt/mission-control/collector
REPO="https://github.com/brunolmonteiro1/app"
BRANCH="claude/ai-mission-control-arch-inabaj"

echo "==> [1/6] Node 22"
if ! node --version 2>/dev/null | grep -q 'v2[2-9]'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> [2/6] Dependências do Chromium (headless)"
apt-get update -qq
apt-get install -y -qq git ca-certificates \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
  libasound2 libatspi2.0-0 fonts-liberation 2>/dev/null || true

echo "==> [3/6] Baixar o coletor (sparse checkout só da pasta collector)"
mkdir -p /opt/mission-control && cd /opt/mission-control
if [ ! -d repo ]; then
  git clone --no-checkout --depth 1 -b "$BRANCH" "$REPO" repo
  cd repo && git sparse-checkout init --cone && git sparse-checkout set mission-control/collector && git checkout
else
  cd repo && git pull origin "$BRANCH"
fi
rm -rf "$DIR" && mkdir -p /opt/mission-control && cp -r /opt/mission-control/repo/mission-control/collector "$DIR"

echo "==> [4/6] npm install + Chromium do Playwright"
cd "$DIR"
npm install --omit=dev --no-audit --no-fund
npx playwright install chromium   # baixa o Chromium na versão certa (sem proxy no VPS)
npm run build || npx tsc

echo "==> [5/6] .env template (preencher credenciais)"
if [ ! -f "$DIR/.env" ]; then
  cp "$DIR/.env.example" "$DIR/.env"
  chmod 600 "$DIR/.env"
fi

echo "==> [6/6] Cron às 07:45 (America/Sao_Paulo)"
cat > /etc/cron.d/mc-collector <<EOF
# Coletor TAG -> planilha, antes do n8n das 08:00
45 7 * * * root cd $DIR && /usr/bin/env DRY_RUN=false node dist/collect.js >> $DIR/collector.log 2>&1
EOF

echo
echo "============================================================"
echo " PRONTO. Falta você fazer 2 coisas:"
echo " 1. Editar $DIR/.env e preencher STCOP_USERNAME e STCOP_PASSWORD"
echo "    (chmod 600 já aplicado; nunca versione este arquivo)."
echo " 2. Colocar a chave da Service Account do Google em $DIR/sa-key.json"
echo "    e compartilhar a planilha com o e-mail da Service Account."
echo ""
echo " TESTE (sempre dry-run primeiro, sem gravar nada):"
echo "   cd $DIR"
echo "   DRY_RUN=true SO_INADIMPLENCIA=true node dist/collect.js"
echo "   # confira os screenshots em ./audit/<run>/ e o safety-log.json"
echo ""
echo " Só depois do dry-run OK, rode com DRY_RUN=false para gravar na planilha."
echo "============================================================"
