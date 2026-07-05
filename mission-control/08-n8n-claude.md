# Conectar o n8n ao Claude (API da Anthropic)

Onde a IA entra no plano: **não na v1 do piloto** (que é 100% determinística, ~US$ 0 de tokens). Entra quando você quer que o robô **redija/personalize a mensagem de cobrança ou renovação**, **classifique** um caso, ou **resuma** um relatório em linguagem natural. Aí o nó de IA do n8n chama a API do Claude.

## 1. Obter a chave de API

1. Crie conta em `console.anthropic.com` → **API Keys** → gere uma chave (`sk-ant-...`);
2. Adicione crédito (a cobrança é por uso, ver custos abaixo).

A chave vive **na credential store do n8n (criptografada no VPS)** — nunca no JSON do workflow, nunca no chat.

## 2. Duas formas de conectar (escolha uma)

### Forma A — Nó nativo "Anthropic" (mais fácil)
O n8n já tem suporte nativo: nó **Anthropic Chat Model** (dentro dos nós de IA/AI Agent) + uma **credential do tipo Anthropic**. Cole a chave na credential, escolha o modelo, escreva o prompt. Bom para uso conversacional/agent. Requer versão recente do n8n.

### Forma B — Nó HTTP Request (mais controle, funciona em qualquer versão) — recomendada para o piloto
Chama a API direto. Determinístico, fácil de versionar e depurar. Configuração:

- **Method:** `POST`
- **URL:** `https://api.anthropic.com/v1/messages`
- **Authentication:** *Generic Credential Type → Header Auth* → crie uma credential Header Auth com **Name** = `x-api-key` e **Value** = a chave `sk-ant-...` (assim a chave fica na store criptografada, não no nó);
- **Headers adicionais:**
  - `anthropic-version: 2023-06-01`
  - `content-type: application/json`
- **Body (JSON):**

```json
{
  "model": "claude-haiku-4-5",
  "max_tokens": 512,
  "system": "Você redige mensagens curtas, cordiais e profissionais de uma empresa de proteção veicular, em português do Brasil. Nunca ameace. Nunca invente valores ou datas: use apenas os dados fornecidos.",
  "messages": [
    {
      "role": "user",
      "content": "Cliente: {{$json.Cliente}}. Contrato {{$json.Contrato}}, placa {{$json.Placa}}. Situação: parcela em aberto desde {{$json.Vencimento}}, valor R$ {{$json.Valor}}. Escreva UMA mensagem de WhatsApp (máx. 3 linhas) pedindo a regularização de forma gentil."
    }
  ]
}
```

- **Ler a resposta** nos nós seguintes: o texto está em `{{$json.content[0].text}}`.

## 3. Qual modelo usar

| Modelo | Model ID | Preço (US$ / 1M tokens in / out) | Quando usar |
|---|---|---|---|
| **Claude Haiku 4.5** | `claude-haiku-4-5` | 1 / 5 | **Padrão para o piloto** — redigir/personalizar mensagens, classificar. Rápido e barato |
| Claude Sonnet 5 | `claude-sonnet-5` | 3 / 15 | Se quiser nuance melhor em PT-BR ou resumos mais elaborados |
| Claude Opus 4.8 | `claude-opus-4-8` | 5 / 25 | Raciocínio pesado (análise de vistoria complexa, decisões) — normalmente desnecessário aqui |

Para o job de rascunho de mensagem, **Haiku 4.5 é a escolha certa**. Ordem de grandeza de custo: cada mensagem gasta ~500 tokens de entrada + ~150 de saída. Mesmo com 300 mensagens/dia isso fica em **centavos de dólar por dia** — o que preserva a tese "custo de token desprezível".

## 4. Encaixe no fluxo do piloto

O nó de IA entra **entre** "Montar Fila" e "Gravar Message Queue" (ver `pilot/workflow-pilot.json`): em vez do template fixo, o Claude gera a mensagem a partir dos dados da linha. Tudo o mais continua igual — a mensagem ainda entra como `Status = pending` e **nada é enviado sem aprovação humana**.

## 5. Segurança e LGPD (importante)

- **Chave** só na credential store; ative "Retry on fail" no nó para robustez;
- **Dados pessoais:** ao usar IA, nomes/placas/contratos passam pela API do Claude. Para minimizar exposição, envie ao modelo **só os campos necessários** para redigir (primeiro nome, contrato, placa, vencimento) — não mande CPF, telefone completo ou documentos se a tarefa não exigir;
- A Anthropic não treina modelos com dados de API por padrão; ainda assim, trate isso como transferência a operador terceiro e registre no mapeamento LGPD do cliente;
- **Rate limit / erro:** a API pode retornar 429 (limite) ou 529 (sobrecarga) — configure o nó HTTP com retry e backoff; em caso de falha, o workflow deve cair no template fixo como fallback (a mensagem determinística garante que nunca falta rascunho).

## 6. Teste rápido (curl, para validar a chave antes de montar no n8n)

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-haiku-4-5",
    "max_tokens": 256,
    "messages": [{"role":"user","content":"Escreva uma saudação de teste em uma linha."}]
  }'
```

Se responder com um bloco `content[0].text`, a chave e a rede do VPS estão OK e é só replicar no nó HTTP Request.
