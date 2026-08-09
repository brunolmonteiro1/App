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

Escrito para o servidor real em uso: **Ubuntu 24.04 LTS, operado como `root`**, com a convenção
de um clone deste monorepo por finalidade em **`/opt/<nome>/App`** (já existem
`/opt/vosz/App`, `/opt/casa-rocha/App`, `/opt/mission-control/repo`).

### 1. Confira o que já existe — antes de instalar nada

```bash
docker --version && docker compose version   # provavelmente já instalado
ss -tlnp | grep -E ':8080|:3000'             # 8080 está livre?
git -C /opt/vosz/App remote -v               # confirma a convenção de clone
```

Se o `docker compose version` falhar, só então:

```bash
curl -fsSL https://get.docker.com | sh
```

Como root, **não** rode `usermod -aG docker` — é para usuário comum.

Se `8080` estiver ocupado, troque a porta do host no `docker-compose.yml`
(`"127.0.0.1:8090:8080"`) e ajuste o túnel no passo 7. A porta de dentro do container
continua 8080.

Requisitos são modestos: **1 vCPU, 1 GB de RAM e ~2 GB de disco**. O servidor tem 95 GB com
34% usado, então sobra.

### 2. Clone — separado, não em cima de outro projeto

```bash
mkdir -p /opt/leilao && cd /opt/leilao
git clone <url-do-repo> App
cd /opt/leilao/App/leilao
cp .env.exemplo .env
nano .env          # ajuste EVENTO e FRETE
```

**Não faça `git pull` em `/opt/vosz/App`.** Aquele clone serve o deploy do `vosz-site`;
compartilhar diretório entre dois deploys transforma qualquer `git checkout` em risco para o
outro serviço.

### 3. Os preços — é o que faz o teto existir

```bash
# do SEU PC:
scp precos.json root@187.77.63.219:/opt/leilao/App/leilao/precos.json
```

Sem este arquivo o estudo sai com todos os lotes em `PRECIFIQUE`. **Isso é o comportamento
correto, não uma falha** — teto calculado sobre poucos itens sairia baixo e pareceria "lote
caro", quando significa "ainda não sei".

### 4. Valide a instalação ANTES de apontar para o site

```bash
docker compose build

# --fixture usa o evento capturado no repo; --saida em /tmp porque este teste é descartável
docker compose run --rm gerar sh -c \
  "npx tsx src/cli.ts estudo --fixture --frete 150 --saida /tmp/teste.html && \
   grep -c 'class=\"lote' /tmp/teste.html"
```

Tem de imprimir **61** — os 61 lotes do evento capturado. É a mesma asserção que o CI faz.

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
ssh -L 8080:127.0.0.1:8080 root@187.77.63.219
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
0 */3 * * * cd /opt/leilao/App/leilao && docker compose run --rm gerar >> /var/log/leilao.log 2>&1
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
# Se responder, seus tetos estão na internet para qualquer licitante do mesmo leilão.
curl -m 5 http://187.77.63.219:8080/estudo.html
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

## Onde ficam os arquivos

`cache` e `saida` são **named volumes**, não pastas no host — de propósito. A imagem roda como
uid 1001 e bind mount sobrepõe o dono da imagem pelo dono da pasta no host: operando como root,
`./cache` nasceria `root:root` e o container falharia ao escrever.

Para tirar o estudo de dentro do volume:

```bash
docker compose cp painel:/app/saida/estudo.html .
```

Para inspecionar o cache de manifestos:

```bash
docker compose run --rm gerar ls -la cache/anexos | head
```

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `tsx: not found` no container | `tsx` saiu de `dependencies`; o teste de deploy pega isso |
| Estudo todo em `PRECIFIQUE` | falta `precos.json`, ou cobertura abaixo de 60% das unidades e 50% das linhas — comportamento correto |
| `permission denied` em `cache/` | não deve mais ocorrer: `cache` e `saida` são named volumes justamente por isso. Se ocorrer, alguém trocou por bind mount — ver o comentário no compose |
| Página abre mas não atualiza | sem `--refresh` no comando, ou o **seu** navegador sem internet — a VPS não intermedia |
| `zod` estourando erro de schema | o Superbid mudou o payload. É o alarme funcionando; o conserto fica em `src/superbid/` |
| Cron não roda | `docker compose` precisa de caminho absoluto no cron, e o `cd` tem de vir antes |
