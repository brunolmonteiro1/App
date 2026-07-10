#!/bin/sh
# Primeiro boot: aplica migrações e, se o banco estiver vazio, roda o pipeline
# determinístico (importação do backup + referências bíblicas + análise lexical).
set -e

mkdir -p data/db

echo "→ Aplicando migrações do banco…"
npx prisma migrate deploy

SERMON_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.sermon.count().then((c) => { console.log(c); process.exit(0); }).catch(() => { console.log(0); process.exit(0); });
")

if [ "$SERMON_COUNT" = "0" ]; then
  echo "→ Banco vazio: rodando pipeline inicial (importação + análises). Isso leva alguns minutos…"
  npx tsx scripts/pipeline.ts
else
  echo "→ Banco já populado ($SERMON_COUNT fontes) — pulando pipeline."
fi

echo "→ Iniciando o dashboard na porta ${PORT:-3000}…"
exec npx next start -p "${PORT:-3000}"
