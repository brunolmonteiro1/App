# 03 — Deploy em VPS com Docker

## Para abrir agora (resumo de 6 comandos)

Na VPS, em `/opt/leilao/App/leilao`:

```bash
cp .env.exemplo .env
nano .env                       # troque SENHA. Deixe BIND=0.0.0.0 e ajuste EVENTO/FRETE
docker compose build
docker compose run --rm gerar   # baixa os manifestos e gera o estudo (~1 min)
docker compose up -d painel
docker compose logs painel      # deve dizer: painel servindo … em http://0.0.0.0:8080
```

Depois, no navegador de qualquer lugar (login: usuário `leilao`, a senha do `.env`):

| Página | Para quê |
|---|---|
| `http://187.77.63.219:8080/precificar.html` | **onde você põe os preços** — é a tela de trabalho |
| `http://187.77.63.219:8080/estudo.html` | o estudo que você lê ao lado do BidTV |

**Se não abrir, é quase sempre uma destas três:** o `painel` não está de pé
(`docker compose ps`), o `.env` está com `BIND=127.0.0.1`, ou a porta 8080 já é de outro
projeto da máquina (troque `PORTA_HOST` no `.env`).

---

## O que roda na VPS, e o que não roda

| Roda na VPS | Não roda |
|---|---|
| `painel` — serve o estudo e a tela de precificação | nada de lance: **a ferramenta nunca dá lance** |
| `gerar` — baixa manifestos e atualiza os lances, por cron | nada sem senha |

O pregão você acompanha no BidTV, no seu navegador. A VPS mantém o estudo fresco e guarda
os preços.

## ⚠️ Por que existe senha, e por que ela não é opcional

**O estudo contém os seus tetos de lance.** Outro licitante do mesmo leilão que visse aquela
página saberia exatamente até onde te empurrar antes de você parar. E a tela de precificação
**grava** — quem chega nela pode alterar os seus preços.

Por isso o painel tem Basic auth, e **se recusa a subir** se você publicar a porta com `SENHA`
vazia. Não é aviso, é o processo parando com mensagem.

Há também uma armadilha específica de Docker que vale saber: **o Docker escreve regras direto
na cadeia `DOCKER-USER` do iptables, passando por cima do UFW.** Um `ufw deny 8080` daria falsa
segurança. Quem protege aqui é a senha, não o firewall.

Os dois modos:

| `.env` | Acesso |
|---|---|
| `BIND=0.0.0.0` + `SENHA=…` | navegador de qualquer lugar, com login |
| `BIND=127.0.0.1` (padrão) | só por túnel: `ssh -L 8080:127.0.0.1:8080 root@187.77.63.219` |

O `test/deploy.test.ts` falha o CI se alguém tirar a obrigatoriedade da senha ou puser a porta
nua no compose.

---

## Passo a passo completo

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

Se `8080` estiver ocupado, ponha `PORTA_HOST=8090` no `.env`. A porta de dentro do container
continua 8080; muda só a do host, e o endereço passa a ser `…:8090`.

Requisitos são modestos: **1 vCPU, 1 GB de RAM e ~2 GB de disco**.

### 2. Clone — separado, não em cima de outro projeto

```bash
mkdir -p /opt/leilao && cd /opt/leilao
git clone <url-do-repo> App
cd /opt/leilao/App/leilao
cp .env.exemplo .env
nano .env
```

No `.env`, o que importa:

```
SENHA=uma-senha-sua-aqui     # obrigatória
BIND=0.0.0.0                 # abre no navegador; 127.0.0.1 exige túnel SSH
PORTA_HOST=8080              # troque se 8080 estiver ocupada
EVENTO=https://www.superbid.net/evento/logistica-reversa-790754
FRETE=0                      # enquanto for 0, o custo sai marcado INCOMPLETO
```

**Não faça `git pull` em `/opt/vosz/App`.** Aquele clone serve o deploy do `vosz-site`;
compartilhar diretório entre dois deploys transforma qualquer `git checkout` em risco para o
outro serviço.

### 3. Valide a instalação ANTES de apontar para o site

```bash
docker compose build

# --fixture usa o evento capturado no repo; --saida em /tmp porque este teste é descartável
docker compose run --rm gerar sh -c \
  "npx tsx src/cli.ts estudo --fixture --frete 150 --saida /tmp/teste.html && \
   grep -c 'class=\"lote' /tmp/teste.html"
```

Tem de imprimir **61** — os 61 lotes do evento capturado. É a mesma asserção que o CI faz.

Se isto funciona, a instalação está boa — e você descobriu isso sem depender de o leilão estar
aberto.

### 4. Primeira rodada real

```bash
docker compose run --rm gerar
```

Baixa os 57 manifestos com throttle de ~1,5 req/s e gera `saida/estudo.html`, `saida/estado.json`
e `saida/precificar.html`. Demora ~1 minuto. Rodar de novo **não rebaixa nada** — o cache é
idempotente.

**Sem preços ainda, todos os lotes saem em `PRECIFIQUE`. Isso é o comportamento correto, não
uma falha** — teto calculado sobre poucos itens sairia baixo e pareceria "lote caro", quando
significa "ainda não sei".

### 5. Painel

```bash
docker compose up -d painel
docker compose logs painel
```

### 6. Ajuste a sua regra — 2 minutos, e destrava o resto

Abra `http://187.77.63.219:8080/precificar.html` e clique em **Minha regra e venda média**.

1. **Custo por item**: alvo R$ 12 (fronteira do verde) e máximo R$ 15 (onde vira vermelho). Já
   vem assim, do seu histórico de R$ 10–14.
2. **Venda média por peça útil, por categoria** — 8 campos. É o que faz o lucro estimado
   aparecer nos 61 lotes sem pesquisar preço de nada. Em branco = sem lucro exibido, nunca número
   inventado.
3. **Perda por categoria** — os valores atuais são palpite meu (10% a 40%). É a calibragem que
   mais move o teto.

Grava em `dados/regra.json` e o `gerar` do cron passa a respeitar.

### 7. Precificar item por item — opcional, é a segunda visão

Abra `http://187.77.63.219:8080/precificar.html` e faça login.

A tela mostra os lotes ordenados por **onde vale gastar o esforço** (custo por unidade efetiva,
métrica que funciona sem nenhum preço). Escolha um, preencha o **valor online por unidade** dos
itens de cima para baixo, e veja o teto aparecer no rodapé quando a cobertura passar de 60% das
unidades e 50% das linhas.

Depois: **Salvar preços** grava, e **Atualizar estudo** reescreve o `estudo.html`.

Um lote precificado até o fim vale mais que 57 lotes a 3%. Cada preço fica gravado **pela
descrição do item**, então ele volta preenchido em todo lote e todo leilão futuro onde a mesma
descrição aparecer.

**Para não pesquisar item por item**, use o botão **Precificar com IA**: baixe o JSON, entregue a
um chat dizendo *"preencha conforme o campo instrucoes"*, e suba o arquivo que voltar. O prompt
vai dentro do arquivo. A importação aceita o JSON como o chat devolveu — com cercas de markdown,
prosa em volta, preço escrito `"R$ 1.299,90"`, linhas reordenadas — e mostra um relatório do que
casou, do que não casou e do que ficou suspeito. Item que a IA inventou é rejeitado, não gravado.

Comece por um lote (30–60 itens) para conferir a qualidade dos preços antes de mandar o evento
todo.

### 8. Já tem um `precos.json` na mão?

Os preços moram num named volume, não em pasta do host. Para carregar um arquivo existente:

```bash
docker compose cp precos.json painel:/app/dados/precos.json
docker compose restart painel
```

E para tirar cópia de segurança — vale fazer, é o trabalho acumulado:

```bash
docker compose cp painel:/app/dados/precos.json ./precos-backup-$(date +%F).json
```

### 9. Cron do host

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

## Verificação

```bash
# a porta está publicada como você quis?
ss -tlnp | grep 8080

# sem senha tem de dar 401, nunca 200
curl -s -o /dev/null -w '%{http_code}\n' http://187.77.63.219:8080/estudo.html      # 401
curl -s -o /dev/null -w '%{http_code}\n' -u leilao:SUA_SENHA \
  http://187.77.63.219:8080/estudo.html                                            # 200

# container não roda como root
docker compose exec painel id          # não pode dizer uid=0

# path traversal barrado
curl -s -o /dev/null -w '%{http_code}\n' --path-as-is -u leilao:SUA_SENHA \
  'http://187.77.63.219:8080/..%2f..%2fpackage.json'     # espera 403

# cache persiste: a segunda execução não baixa PDF nenhum
docker compose run --rm gerar | tail -3              # "baixados 0 · já em cache 57"

# sobrevive a reboot
reboot && sleep 60 && docker compose ps               # painel de pé por restart: unless-stopped
```

## O que não foi verificado aqui

**O `docker build` não foi executado no ambiente de desenvolvimento** — ele tem Docker instalado
mas sem acesso ao daemon. Você já rodou o build na VPS e ele passou (`✔ Image leilao:local
Built`), o que cobre justamente essa lacuna.

O que **foi** verificado de fato: os 276 testes, o servidor estático (traversal
percent-encoded incluído), toda a API da tela de precificação contra o manifesto real do lote 3,
os três modos de acesso (loopback, senha certa, senha errada), e a própria tela em navegador
real — 61 lotes na lista, 59 itens na tabela, preço digitado e teto recalculado.

## Onde ficam os arquivos

`cache`, `saida` e `dados` são **named volumes**, não pastas no host — de propósito. A imagem
roda como uid 1001 e bind mount sobrepõe o dono da imagem pelo dono da pasta no host: operando
como root, `./cache` nasceria `root:root` e o container falharia ao escrever. Com o
`precos.json` era pior ainda: arquivo ausente no host virava **diretório**, e arquivo criado por
root era legível mas não gravável — a tela de precificação salvaria com "permission denied".

```bash
docker compose cp painel:/app/saida/estudo.html .          # tirar o estudo
docker compose cp painel:/app/dados/precos.json .          # tirar os preços
docker compose run --rm gerar ls -la cache/anexos | head    # inspecionar o cache
```

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| "não aparece nada" no navegador | o `painel` não subiu (`docker compose ps`), ou `BIND=127.0.0.1` no `.env`, ou a porta do host está ocupada |
| `docker compose up` reclama de `SENHA` | é o comportamento correto: defina `SENHA` no `.env` |
| painel pede senha e nada funciona | usuário é `leilao` (ou o que estiver em `USUARIO`), senha é a do `.env` |
| tela de precificação diz "não consegui falar com o painel" | você abriu o HTML direto, sem servidor. Ela precisa das rotas `/api/` |
| tela diz "estado.json não existe" | rode `docker compose run --rm gerar` uma vez |
| Estudo todo em `PRECIFIQUE` | falta preço, ou cobertura abaixo de 60% das unidades e 50% das linhas — comportamento correto |
| `tsx: not found` no container | `tsx` saiu de `dependencies`; o teste de deploy pega isso |
| `permission denied` gravando preço | alguém trocou `dados` por bind mount — ver o comentário no compose |
| Página abre mas os lances não mudam | sem `--refresh` no comando, ou o **seu** navegador sem internet — a VPS não intermedia |
| `zod` estourando erro de schema | o Superbid mudou o payload. É o alarme funcionando; o conserto fica em `src/superbid/` |
| Cron não roda | `docker compose` precisa de caminho absoluto no cron, e o `cd` tem de vir antes |
