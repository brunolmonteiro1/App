# 03 — Deploy em VPS com Docker

## O que roda na VPS, e o que não roda

| Roda na VPS | Não roda |
|---|---|
| `gerar` — baixa manifestos e regenera o estudo, por cron | nada de lance: **a ferramenta nunca dá lance** |
| `painel` — serve o estudo em `127.0.0.1:8080` | nada exposto na internet |

O pregão você acompanha no BidTV, no seu navegador. A VPS só mantém o estudo fresco.

## ⚠️ Por que nada é publicado

**O estudo contém os seus tetos de lance.** Outro licitante do mesmo leilão que visse aquela
página saberia exatamente até onde te empurrar antes de você parar. Isso é informação
competitiva, não relatório.

E há uma armadilha específica de Docker: **`ports: "8080:8080"` liga em todas as interfaces, e o
Docker escreve regras direto na cadeia `DOCKER-USER` do iptables — passando por cima do UFW.**
Um `ufw deny 8080` daria falsa segurança, com a porta aberta na internet.

Por isso o mapeamento é `"127.0.0.1:8080:8080"` e o acesso é túnel SSH. O
`test/deploy.test.ts` falha o CI se alguém trocar isso.

---

## Passo a passo

### 1. VPS — Docker oficial

O Docker do `apt` do Ubuntu costuma ser antigo e não traz `docker compose` v2.

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# saia e entre de novo na sessão SSH para o grupo valer
docker compose version
```

Requisitos são modestos: **1 vCPU, 1 GB de RAM e ~2 GB de disco** dão conta. Só `zod`,
`pdfjs-dist` e `tsx` em runtime, e nada compila código nativo.

### 2. Código

```bash
git clone <url-do-repo> App
cd App/leilao
cp .env.exemplo .env
nano .env          # ajuste EVENTO e FRETE
```

### 3. Os preços — é o que faz o teto existir

```bash
# do SEU PC:
scp precos.json usuario@vps:~/App/leilao/precos.json
```

Sem este arquivo o estudo sai com todos os lotes em `PRECIFIQUE`. **Isso é o comportamento
correto, não uma falha** — teto calculado sobre poucos itens sairia baixo e pareceria "lote
caro", quando significa "ainda não sei".

### 4. Valide a instalação ANTES de apontar para o site

```bash
docker compose build
docker compose run --rm gerar sh -c \
  "npx tsx src/cli.ts estudo --fixture --frete 150 --saida saida/teste.html"
ls -la saida/teste.html
```

O modo `--fixture` usa o evento capturado no repo. Se isto funciona, a instalação está boa — e
você descobriu isso sem depender de o leilão estar aberto.

### 5. Primeira rodada real

```bash
docker compose run --rm gerar
```

Baixa os 57 manifestos com throttle de ~1,5 req/s e gera `saida/estudo.html`. Demora ~1 minuto.
Rodar de novo **não rebaixa nada** — o cache é idempotente.

### 6. Painel

```bash
docker compose up -d painel
docker compose logs painel      # deve dizer: servindo ... em http://0.0.0.0:8080
```

### 7. Do seu PC: túnel e abrir

```bash
ssh -L 8080:127.0.0.1:8080 usuario@vps
```

Deixe essa sessão aberta e abra **http://localhost:8080/estudo.html** no navegador.

O `--refresh 15` continua funcionando: a página busca os lances direto do navegador *dele*, na
API do Superbid — não passa pela VPS. Foi validado em navegador real (ver README).

### 8. Cron do host

```bash
crontab -e
```

```cron
# Atualiza os lances a cada 3 horas. Zero custo de IA: só refaz a coleta e o cálculo.
0 */3 * * * cd $HOME/App/leilao && docker compose run --rm gerar >> $HOME/leilao.log 2>&1
```

Na véspera e no dia do pregão, vale trocar para `0 * * * *` (de hora em hora). Não desça abaixo
disso: os manifestos já estão em cache, e o que muda é só o lance — que você lê no BidTV ao vivo
de qualquer forma.

---

## Verificação — as duas que realmente importam

```bash
# Na VPS: tem de aparecer 127.0.0.1:8080, NUNCA 0.0.0.0:8080
ss -tlnp | grep 8080

# Do seu PC, contra o IP público: tem de dar timeout ou connection refused.
# Se responder, seus tetos estão na internet.
curl -m 5 http://IP-DA-VPS:8080/estudo.html
```

Outras:

```bash
# container não roda como root
docker compose exec painel id          # não pode dizer uid=0

# path traversal barrado
curl -s -o /dev/null -w '%{http_code}\n' --path-as-is \
  'http://localhost:8080/..%2f..%2fpackage.json'     # espera 403

# cache persiste: a segunda execução não baixa PDF nenhum
docker compose run --rm gerar | tail -3              # "baixados 0 · já em cache 57"

# sobrevive a reboot
sudo reboot && sleep 60 && docker compose ps          # painel de pé por restart: unless-stopped
```

## O que não foi verificado aqui

**O `docker build` não foi executado** — o ambiente onde este projeto foi desenvolvido tem o
Docker instalado mas sem acesso ao daemon. O `Dockerfile` e o `docker-compose.yml` foram
validados por leitura, por checagem de YAML e pelos testes de `test/deploy.test.ts` (que travam
mapeamento de porta, usuário não-root, `tsx` em `dependencies` e os caminhos do `COPY`), mas o
build em si é o primeiro passo que você roda. Se ele falhar, é provável que seja caminho de
`COPY` — e o erro será explícito.

O que **foi** verificado de fato: o servidor estático (7 testes, incluindo traversal
percent-encoded), o pipeline end-to-end offline, e o refresh em navegador real.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `tsx: not found` no container | `tsx` saiu de `dependencies`; o teste de deploy pega isso |
| Estudo todo em `PRECIFIQUE` | falta `precos.json`, ou cobertura abaixo de 60% das unidades e 50% das linhas — comportamento correto |
| `permission denied` em `cache/` | dono do bind mount; `sudo chown -R 1001:1001 cache saida` |
| Página abre mas não atualiza | sem `--refresh` no comando, ou o **seu** navegador sem internet — a VPS não intermedia |
| `zod` estourando erro de schema | o Superbid mudou o payload. É o alarme funcionando; o conserto fica em `src/superbid/` |
| Cron não roda | `docker compose` precisa de caminho absoluto no cron, e o `cd` tem de vir antes |
