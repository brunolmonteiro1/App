# Como instalar o Dashboard na sua VPS (passo a passo)

Este guia foi escrito para quem tem **pouca experiência técnica**. Copie e cole os
comandos na ordem, um bloco de cada vez. Tempo total: ~15 minutos.

O que você precisa:
- Uma VPS com Linux (Ubuntu 22.04 ou mais novo funciona bem) e pelo menos 2 GB de RAM;
- O usuário e a senha (ou chave) para acessar a VPS por SSH.

---

## Passo 1 — Entrar na VPS

No seu computador, abra o terminal (no Windows: PowerShell) e conecte:

```bash
ssh root@IP-DA-SUA-VPS
```

(Substitua `IP-DA-SUA-VPS` pelo IP que seu provedor te deu.)

## Passo 2 — Instalar o Docker (só na primeira vez)

Cole este comando único e aguarde terminar:

```bash
curl -fsSL https://get.docker.com | sh
```

Confira que funcionou:

```bash
docker --version
```

Deve aparecer algo como `Docker version 27...`. Se aparecer, siga adiante.

## Passo 3 — Baixar o projeto

```bash
git clone https://github.com/brunolmonteiro1/App.git
cd App/casa-rocha-dashboard
```

> Se o repositório for privado, o GitHub vai pedir usuário e senha (use um
> Personal Access Token como senha — crie um em github.com → Settings →
> Developer settings → Personal access tokens).

## Passo 4 — Definir a senha de acesso (recomendado)

O dashboard contém as transcrições da igreja; num servidor público, proteja com senha:

```bash
echo "APP_PASSWORD=escolha-uma-senha-forte-aqui" > .env.deploy
```

(Se preferir sem senha — por exemplo, testando na sua própria máquina — pule este passo.)

### Senha do Modo Diagnóstico Interno (opcional)

Há um painel interno separado — o **Modo Diagnóstico Interno** (`/admin/master-diagnosis`),
com a leitura estratégica mais direta e confidencial. Ele tem senha própria, distinta da
senha geral. Enquanto `MASTER_PASSWORD` estiver vazia, a rota nem existe (responde 404).
Para habilitar (use pelo menos 6 caracteres):

```bash
echo "MASTER_PASSWORD=outra-senha-forte-so-para-diagnostico" >> .env.deploy
```

Todo acesso a esse modo — inclusive tentativas com senha errada — fica registrado numa
trilha de segurança interna.

## Passo 4b — Ativar a análise por IA (OpenRouter)

A página **Codificação** analisa cada pregação com o modelo de IA que você escolher
(Claude, Gemini, GPT etc.), via [OpenRouter](https://openrouter.ai). Para ativar:

1. Crie uma conta em https://openrouter.ai e adicione créditos (US$ 10 dão folga
   para codificar o acervo inteiro com um modelo intermediário);
2. Gere uma chave em https://openrouter.ai/keys;
3. Adicione ao mesmo `.env.deploy`:

```bash
echo "OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui" >> .env.deploy
```

Sem a chave o sistema funciona normalmente — apenas a análise por IA fica
desabilitada (a página avisa). O modelo é escolhido dentro da própria página, com
preço por 1M de tokens exibido ao lado. Cada pregação consome ~15 mil tokens de
entrada + ~2 mil de saída; multiplique pelo preço do modelo escolhido para estimar
o custo das 263.

## Passo 5 — Ligar o sistema

```bash
docker compose --env-file .env.deploy up -d --build
```

(Sem senha, use apenas: `docker compose up -d --build`)

A primeira vez demora **5 a 15 minutos**: o Docker monta a aplicação e, no primeiro
boot, importa as 266 fontes e roda as análises automáticas. Acompanhe com:

```bash
docker compose logs -f
```

Quando aparecer `→ Iniciando o dashboard na porta 3000…`, está pronto.
(Para sair dos logs: `Ctrl+C` — o sistema continua rodando.)

## Passo 6 — Acessar

Abra no navegador:

```
http://IP-DA-SUA-VPS:3000
```

Se definiu senha: usuário pode ficar **em branco**, senha é a que você escolheu.

---

## Operações do dia a dia

### Atualizar quando houver versão nova

```bash
cd App/casa-rocha-dashboard
git pull
docker compose --env-file .env.deploy up -d --build
```

O banco de dados (com as análises que você fizer) fica na pasta `dados-do-banco/`
e **não é apagado** na atualização.

### Fazer backup

Tudo que importa está em uma pasta. Copie-a para lugar seguro:

```bash
cp -r dados-do-banco/ ~/backup-casa-rocha-$(date +%F)/
```

### Parar / reiniciar

```bash
docker compose stop     # para
docker compose start    # volta
docker compose restart  # reinicia
```

### Ver se está rodando

```bash
docker compose ps
```

### Importar um backup novo do NotebookLM (pregações futuras)

1. Copie o novo `.json` para `data/raw/` (pode usar `scp` ou o painel do seu provedor);
2. Rode o pipeline dentro do container:

```bash
docker compose exec dashboard npx tsx scripts/pipeline.ts
```

A importação é **idempotente**: só adiciona o que é novo, nunca duplica nem apaga
análises existentes.

---

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Página não abre | `docker compose logs --tail 50` e veja a última mensagem de erro |
| Porta 3000 ocupada | Edite `.env.deploy` e acrescente `PORT=8080`, depois `docker compose --env-file .env.deploy up -d`; acesse `:8080` |
| Esqueci a senha | Edite `.env.deploy`, troque `APP_PASSWORD`, rode `docker compose --env-file .env.deploy up -d` |
| VPS ficou sem espaço | `docker system prune -f` remove sobras de builds antigos |
| Quero recomeçar do zero | `docker compose down && rm -rf dados-do-banco && docker compose --env-file .env.deploy up -d` (apaga análises manuais!) |

## (Opcional) Usar um domínio com HTTPS

Se você tem um domínio (ex.: `painel.suaigreja.com.br`), o caminho mais simples é
instalar o [Caddy](https://caddyserver.com/) na VPS — ele emite o certificado
HTTPS sozinho:

```bash
apt install -y caddy
echo "painel.suaigreja.com.br {
  reverse_proxy localhost:3000
}" > /etc/caddy/Caddyfile
systemctl restart caddy
```

Aponte o DNS do domínio para o IP da VPS e pronto: `https://painel.suaigreja.com.br`.
