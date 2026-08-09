# syntax=docker/dockerfile:1

# Node 22 porque o projeto exige >=22 (package.json engines). Alpine seguindo o padrão de
# vosz-site/Dockerfile.
FROM node:22-alpine AS base
WORKDIR /app
# O pregão é em América/São Paulo. O payload da API é pedido nesse fuso na origem, mas o
# relógio do container também precisa fazer sentido nos logs e no cron.
ENV TZ=America/Sao_Paulo

FROM base AS deps
COPY package.json package-lock.json ./
# --omit=dev deixa vitest e typescript fora da imagem. Isso só funciona porque `tsx` está em
# `dependencies`: o CLI roda via tsx, então tsx é dependência de runtime, não de teste.
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 leilao \
  && adduser --system --uid 1001 leilao

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=leilao:leilao package.json ./
COPY --chown=leilao:leilao src ./src
# Os fixtures entram na imagem porque `--fixture` é o que permite validar a instalação sem
# depender de o leilão estar aberto. São ~1,9 MB.
COPY --chown=leilao:leilao recon/fixtures ./recon/fixtures

# Montados como volume pelo compose; criados aqui já com o dono certo para o processo
# não-root poder escrever.
#
# `dados` guarda o precos.json, que a TELA DE PRECIFICAÇÃO grava. Ele tem de existir na
# imagem com este dono: named volume cujo ponto de montagem NÃO existe na imagem nasce
# root:root, e aí o processo uid 1001 não consegue gravar preço nenhum.
RUN mkdir -p cache/anexos saida dados && chown -R leilao:leilao cache saida dados

USER leilao

# Só o painel expõe porta. O serviço `gerar` é one-shot e não escuta nada.
EXPOSE 8080

CMD ["npx", "tsx", "src/servir.ts"]
