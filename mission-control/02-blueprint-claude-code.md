# AI Mission Control — Blueprint de Desenvolvimento com Claude Code

Este documento é o material de trabalho para desenvolver o sistema **usando Claude Code como acelerador**, em desenvolvimento orientado a especificação (spec-driven). Claude Code não é o runtime de produção; é o assistente de engenharia que implementa contra estas specs.

---

## 1. Método: spec-driven com Claude Code

Regra de ouro: **Claude Code implementa o que a spec define; a spec nunca é implícita.** O fluxo por incremento:

1. Escrever/atualizar a spec do incremento (neste repo, pasta `specs/`);
2. Pedir ao Claude Code o plano de implementação (plan mode) e revisar;
3. Implementar com testes junto (o critério de aceite vira teste);
4. Rodar os testes de isolamento de tenant e o lint de segurança a cada PR;
5. Revisão humana do diff antes de merge — sempre, em código que toca auth, RLS, gateway ou credenciais.

### CLAUDE.md sugerido para o repositório do produto

```markdown
# AI Mission Control

## Regras invioláveis
- Toda tabela nova tem `organization_id` + política RLS na MESMA migração.
- Nenhum secret no frontend ou em prompt de LLM. Secrets só via env/vault no backend.
- Todo endpoint chamado por agente externo valida assinatura HMAC e escopo de tenant.
- Toda ação sensível (enviar mensagem, alterar dado externo, deletar arquivo,
  acessar sistema autenticado) passa pelo Approval Center antes de executar.
- Estado de missão/tarefa muda SÓ pela máquina de estados em `src/core/mission-fsm.ts`.
- Feature sem teste de aceite não é feature.

## Comandos
- `pnpm dev` / `pnpm test` / `pnpm test:tenant-isolation` / `pnpm lint`
- Migrações: `pnpm db:migrate` (Supabase CLI)

## Estrutura
- `apps/web` — Next.js (dashboard)
- `apps/worker` — processo worker (pg-boss) + Agent Gateway client
- `packages/core` — domínio: entidades, máquina de estados, contratos
- `specs/` — fonte da verdade; implementar SEMPRE contra a spec
```

---

## 2. Estrutura do monorepo

```
ai-mission-control/
├── CLAUDE.md
├── specs/
│   ├── 00-product.md            # visão, personas, jobs
│   ├── 01-architecture.md       # este blueprint destilado
│   ├── 02-data-model.md         # DDL + RLS (seção 4 abaixo)
│   ├── 03-api-contract.md       # rotas + payloads (seção 5)
│   ├── 04-mission-fsm.md        # máquina de estados (seção 6)
│   ├── 05-agent-gateway.md      # contrato agente ↔ plataforma (seção 7)
│   ├── 06-security.md           # regras da seção 8
│   └── 07-acceptance/           # critérios de aceite por incremento
├── apps/
│   ├── web/                     # Next.js App Router + shadcn/ui
│   └── worker/                  # Node + pg-boss; executa tasks, chama gateway
├── packages/
│   └── core/                    # tipos, FSM, validação zod, contratos compartilhados
├── supabase/
│   └── migrations/              # SQL versionado, RLS junto de cada tabela
└── infra/
    └── docker-compose.yml       # web + worker + n8n (opcional) num VPS
```

---

## 3. Arquitetura alvo (corrigida pela avaliação técnica)

```
Usuário/Operador
   │
   ▼
Next.js (dashboard: missões, tarefas, artefatos, aprovações, logs, relatórios)
   │            ▲ Realtime (Supabase) para status ao vivo
   ▼
Supabase ─ Postgres (RLS por organization_id) · Auth · Storage · Realtime
   │
   ▼
Worker (pg-boss) ── ciclo de vida da missão, retries, timeouts
   │
   ├──► Agent Gateway ──► executor interno (LLM Anthropic + Playwright)   [padrão]
   │                └──► OpenClaw / Hermes via adapter                    [POC, substituível]
   └──► n8n ──► conectores: Sheets, Telegram, Drive, Gmail, WhatsApp Cloud API
```

Decisões estruturais (justificadas no doc 01):

- **A plataforma é dona do estado.** Agentes e n8n são executores burros que recebem tarefa e devolvem eventos/artefatos.
- **1 VPS com Docker Compose** para worker + n8n; Supabase gerenciado; frontend na Vercel ou no mesmo VPS.
- **n8n não toca no banco.** Entra e sai por webhooks assinados da API.
- **Nenhum agente recebe credencial.** Fluxos autenticados em legado = scripts Playwright no worker, credencial via env/vault.

---

## 4. Modelo de dados (spec `02-data-model.md`)

Núcleo mínimo — toda tabela com `organization_id uuid not null` e RLS na mesma migração:

```sql
organizations   (id, name, slug, settings jsonb, created_at)
memberships     (org_id, user_id, role check in ('admin','operator','viewer'))
missions        (id, org_id, title, objective, instructions, priority,
                 status, expected_output, created_by, created_at, completed_at)
tasks           (id, org_id, mission_id, kind, payload jsonb, status,
                 assigned_to,          -- 'internal-worker' | 'openclaw' | 'hermes' | 'n8n:<flow>'
                 attempt int, max_attempts int, result jsonb, timestamps...)
events          (id, org_id, mission_id, task_id, type, level, message,
                 data jsonb, actor,    -- user:<id> | agent:<name> | system
                 created_at)           -- append-only; é o audit trail
artifacts       (id, org_id, mission_id, task_id, storage_path, filename,
                 mime, size, kind check in ('upload','generated','screenshot','log'))
approvals       (id, org_id, mission_id, task_id, action_description,
                 risk_level check in ('low','medium','high'),
                 status check in ('pending','approved','rejected','expired'),
                 requested_at, decided_by, decided_at, decision_note)
agents          (id, org_id nullable,  -- null = agente compartilhado da plataforma
                 name, kind, endpoint_url, hmac_key_ref, capabilities jsonb,
                 status, last_heartbeat_at)
workflow_templates (id, org_id nullable, name, description, task_graph jsonb)
usage_limits    (org_id, missions_month, tokens_month, storage_mb, browser_minutes)
```

Política RLS padrão (exemplo, replicar em toda tabela):

```sql
alter table missions enable row level security;
create policy tenant_isolation on missions
  using (org_id in (select org_id from memberships where user_id = auth.uid()));
```

**Critério de aceite permanente:** `pnpm test:tenant-isolation` cria 2 orgs + 2 usuários e prova, para cada tabela e cada bucket de storage, que A não lê nem escreve dados de B.

---

## 5. Contrato de API (spec `03-api-contract.md`) — resumo

```
POST   /api/missions                    cria missão (+ upload URLs)
GET    /api/missions/:id                missão + tasks + eventos + artefatos
POST   /api/missions/:id/cancel
POST   /api/approvals/:id/decision      { decision: 'approved'|'rejected', note }
GET    /api/dashboard/summary           KPIs do tenant

# Chamados apenas por agentes/n8n (HMAC obrigatório, nunca pelo browser):
POST   /api/agent/tasks/:id/events      { type, level, message, data }
POST   /api/agent/tasks/:id/artifacts   multipart ou signed-url handshake
POST   /api/agent/tasks/:id/complete    { status: 'completed'|'failed', result }
POST   /api/agent/tasks/:id/request-approval { action_description, risk_level }
```

Toda rota `/api/agent/*`: valida `X-Signature` (HMAC-SHA256 do corpo com a chave do agente), confere que a task pertence ao agente e ao tenant esperados, e rejeita replay (timestamp + nonce).

---

## 6. Máquina de estados da missão (spec `04-mission-fsm.md`)

```
mission: draft → queued → planning → executing → reviewing
                    ↘ awaiting_approval ↔ executing
         → completed | failed | cancelled | paused | blocked

task:    pending → running → completed
                 ↘ failed → retrying (até max_attempts) → failed
                 ↘ waiting_user (aprovação) → running | cancelled
```

Regras: transições só via funções da FSM em `packages/core` (nunca `update status` solto); cada transição grava um `event`; `awaiting_approval` congela a task e dispara notificação (Telegram/e-mail); timeout de aprovação → `expired` → missão `paused`.

---

## 7. Contrato do Agent Gateway (spec `05-agent-gateway.md`)

O que torna OpenClaw/Hermes **substituíveis**: o adapter de cada agente traduz este contrato; o resto da plataforma não sabe qual agente executa.

```jsonc
// Plataforma → agente (POST no endpoint do agente, HMAC)
{
  "task_id": "uuid",
  "kind": "pdf_extract | report_summary | browser_export | draft_messages | ...",
  "instructions": "…",
  "input_artifacts": [{ "url": "signed-url", "filename": "…" }],
  "constraints": {
    "read_only": true,
    "url_allowlist": ["https://sistema-legado.example/relatorios/*"],
    "forbidden_actions": ["save","delete","cancel","activate","generate_boleto","submit"],
    "requires_approval_for": ["send_message","write_external"]
  },
  "callback": { "base_url": "https://app…/api/agent/tasks/<id>", "hmac_key_id": "…" }
}
```

Adapters na Fase 3 (POC): `internal-worker` (padrão — Node + Anthropic SDK + Playwright), `openclaw` (via plugin de webhooks), `hermes` (via webhook adapter HMAC). Gate de decisão: o que falhar em confiabilidade/estrutura de resposta sai da arquitetura sem dor.

---

## 8. Segurança (spec `06-security.md`) — não negociáveis

1. Secrets só no backend (env/vault). Frontend e prompts de LLM nunca veem credenciais.
2. Login master do legado: usado apenas por scripts Playwright determinísticos no worker; sessão gravada (screenshots + trace Playwright) como evidência de auditoria; allowlist de URL e bloqueio de requests de escrita por interceptação de rede; dry-run antes do primeiro run real.
3. Toda ação sensível (lista da seção 11 do PDF do blueprint) → Approval Center antes de executar. Sem exceções na v1.
4. Webhooks: HMAC + timestamp + nonce, dos dois lados.
5. `events` é append-only (sem UPDATE/DELETE — revogar via grant) = trilha de auditoria.
6. WhatsApp: somente Cloud API oficial da Meta quando envio for habilitado; nunca automação do WhatsApp Web.
7. LGPD: enquanto houver dados pessoais de clientes finais, minimizar o que entra em prompt de LLM (mascarar CPF/telefone quando o campo não for necessário à tarefa).

---

## 9. Ordem de implementação com Claude Code (incrementos)

Cada incremento tem spec + critérios de aceite antes do código. Sequência para a fase de plataforma (Fase C do doc 03):

| # | Incremento | Critério de aceite (resumo) |
|---|---|---|
| 1 | Scaffold monorepo, CI, Supabase, migração 001 (orgs, memberships, RLS) | teste de isolamento passa |
| 2 | Auth + roles + shell do dashboard | admin/operator/viewer veem o que devem |
| 3 | Missões + upload de artefatos | criar missão com arquivos, listar, detalhar |
| 4 | Tasks + events + timeline em Realtime | evento inserido aparece no dashboard sem refresh |
| 5 | Worker pg-boss + FSM + retries | task falha 2x e completa na 3ª; eventos registrados |
| 6 | Approval Center | task pausa, notifica, aprova/rejeita/expira |
| 7 | Agent Gateway + internal-worker adapter | missão completa ponta-a-ponta com PDF de teste |
| 8 | Adapters OpenClaw/Hermes (POC) | mesmos testes do #7 rodando nos dois; relatório comparativo |
| 9 | Templates de workflow | missão criada a partir de template em 2 cliques |
| 10 | Hardening multi-tenant + usage limits + audit review | pentest interno básico; limites bloqueiam excesso |
| 11 | Deploy produção + observabilidade | uptime check, alertas, backup restaurável testado |

---

## 10. Piloto de 30 dias (Fase A) — setup mínimo

Sem plataforma, sem agente, conforme Pilot Brief. Infra completa:

- **1 VPS pequeno** (2 vCPU/4 GB, ~US$ 10–20/mês) com Docker: n8n self-hosted — ou n8n Cloud Starter (~US$ 24/mês) para zerar manutenção;
- **Google Sheets** do cliente: aba de entrada (relatório exportado) + abas `Daily Summary` e `Message Queue`;
- **Bot Telegram** para o resumo diário interno;
- 1 workflow n8n: schedule 08:00 → ler arquivo → validar colunas → cálculo de dias (atraso / vencimento 30-60-90) → gravar abas → post no Telegram → log da execução. Retry automático; alerta se o arquivo não bater com o schema.

Claude Code é usado aqui para: gerar as funções de parsing/validação dos nós Code do n8n, os templates de mensagem e o script de mapeamento de colunas. Build estimado: 2–3 semanas incluindo ajuste com relatórios reais (detalhe em doc 03).
