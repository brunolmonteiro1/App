# ============================================================================
# Coletor TAG/Vilesoft em Docker.
# Base: imagem OFICIAL do Playwright — já traz Node 22 + Chromium + todas as
# libs do sistema. Por isso NÃO precisa "playwright install" nem apt-get.
# A tag da imagem (v1.49.0) DEVE casar com a versão do playwright no
# package.json, senão o browser embutido não bate com a API.
# ============================================================================

# ---- build: compila o TypeScript ------------------------------------------
FROM mcr.microsoft.com/playwright:v1.49.0-noble AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ---- runtime: só o necessário para rodar ----------------------------------
FROM mcr.microsoft.com/playwright:v1.49.0-noble
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
# Job batch: roda uma vez e sai. .env, sa-key.json e audit vêm por volume.
CMD ["node", "dist/collect.js"]
