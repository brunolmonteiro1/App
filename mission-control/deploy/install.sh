#!/usr/bin/env bash
# ============================================================================
# AI Mission Control — Piloto 30 dias
# Provisionamento completo de 1 VPS (Ubuntu 22.04/24.04) em um comando:
#
#   curl -fsSL https://raw.githubusercontent.com/brunolmonteiro1/App/claude/ai-mission-control-arch-inabaj/mission-control/deploy/install.sh | sudo bash
#
# Ou: cole este arquivo no console web do VPS e rode `sudo bash install.sh`.
#
# Instala: Docker + Compose, n8n atrás de Caddy (HTTPS automático via
# Let's Encrypt), firewall UFW, swap, backup diário do n8n.
#
# Antes de rodar, edite as 3 variáveis abaixo (ou exporte no ambiente):
# ============================================================================
set -euo pipefail

N8N_DOMAIN="${N8N_DOMAIN:-n8n.SEUDOMINIO.com.br}"   # aponte um registro A para o IP do VPS antes
TZ_REGION="${TZ_REGION:-America/Sao_Paulo}"
STACK_DIR="/opt/mission-control"

if [ "$(id -u)" -ne 0 ]; then echo "Rode como root (sudo)."; exit 1; fi

echo "==> [1/6] Pacotes base"
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw cron

echo "==> [2/6] Docker"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

echo "==> [3/6] Swap (2G) — evita OOM em VPS pequeno"
if ! swapon --show | grep -q swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [4/6] Firewall: só SSH, HTTP e HTTPS"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

echo "==> [5/6] Stack n8n + Caddy"
mkdir -p "$STACK_DIR"
cd "$STACK_DIR"

# Chave de criptografia das credenciais do n8n — gerada uma vez, NUNCA perder
if [ ! -f .env ]; then
  cat > .env <<EOF
N8N_DOMAIN=${N8N_DOMAIN}
TZ_REGION=${TZ_REGION}
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
  chmod 600 .env
fi

cat > docker-compose.yml <<'EOF'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: unless-stopped
    environment:
      - N8N_HOST=${N8N_DOMAIN}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_DOMAIN}/
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - GENERIC_TIMEZONE=${TZ_REGION}
      - TZ=${TZ_REGION}
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PROXY_HOPS=1
    volumes:
      - n8n_data:/home/node/.n8n
    expose:
      - "5678"

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - N8N_DOMAIN=${N8N_DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  n8n_data:
  caddy_data:
  caddy_config:
EOF

cat > Caddyfile <<'EOF'
{$N8N_DOMAIN} {
    reverse_proxy n8n:5678
}
EOF

docker compose pull -q
docker compose up -d

echo "==> [6/6] Backup diário do n8n (03:00) em /opt/backups, retém 14 dias"
mkdir -p /opt/backups
cat > /etc/cron.d/n8n-backup <<EOF
0 3 * * * root docker run --rm -v mission-control_n8n_data:/data -v /opt/backups:/backup alpine tar czf /backup/n8n-\$(date +\%F).tgz -C /data . && find /opt/backups -name 'n8n-*.tgz' -mtime +14 -delete
EOF

echo
echo "============================================================"
echo " PRONTO. Próximos passos:"
echo " 1. Confirme que o DNS de ${N8N_DOMAIN} aponta para este IP."
echo " 2. Abra https://${N8N_DOMAIN} e crie a conta de admin (owner)."
echo " 3. Em Settings > API, gere uma API key do n8n e envie ao dev —"
echo "    é com ela que os workflows são instalados/atualizados"
echo "    remotamente via HTTPS, sem ninguém precisar de SSH."
echo " 4. Guarde ${STACK_DIR}/.env em local seguro (chave de criptografia)."
echo "============================================================"
