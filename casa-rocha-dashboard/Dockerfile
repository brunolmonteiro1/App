# Dashboard de Saúde Teológica — A Casa da Rocha
# Imagem única e simples: build + runtime no mesmo estágio (prioriza simplicidade
# de instalação/manutenção para VPS; ver INSTALL.md).

FROM node:22-alpine

WORKDIR /app

# Dependências (camada cacheável)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Prisma client
COPY prisma ./prisma
ENV DATABASE_URL="file:../data/db/app.db"
RUN npx prisma generate

# Código e dados (o backup em data/raw/ entra na imagem; o banco fica em volume)
COPY . .

# Build de produção
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000

RUN chmod +x docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]
