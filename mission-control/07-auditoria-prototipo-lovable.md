# Auditoria do protótipo Lovable — `operational-cockpit-ai`

**Repo:** github.com/brunolmonteiro1/operational-cockpit-ai · commit `8bcc14d` · auditado em 05/07/2026.
**Método:** leitura integral das 6 migrações SQL, varredura de segredos, inspeção do código de aplicação (~10.850 linhas, metade shadcn/ui e types gerados) e build de produção executado localmente.

---

## Veredito: **(b) com ressalvas — serve como fundação do cockpit da Fase C**

Qualidade acima da média para código gerado. Não é o cenário "jogar fora e aproveitar só o schema": as migrações estão corretas, o build passa limpo e o lock-in com o Lovable é baixo. Mas é um **protótipo mockado e single-user** — a distância até "fundação de produto" está listada na seção 4.

## 1. O que está genuinamente bom

| Item | Evidência |
|---|---|
| **RLS em todas as 18 tabelas** | Policy `user_id = auth.uid()` com USING + WITH CHECK em todas; GRANTs explícitos por role |
| **Storage isolado por usuário** | 5 buckets privados; policies exigem pasta `<userId>/...` em SELECT/INSERT/UPDATE/DELETE |
| **Roles no padrão recomendado** | `user_roles` separada de `profiles` + `has_role()` SECURITY DEFINER com `search_path` fixado — evita escalada de privilégio e recursão de policy |
| **Hardening real aplicado** | RLS em `realtime.messages` com tópicos por usuário; REVOKE EXECUTE nas funções; triggers `updated_at` |
| **Sem segredos vazados** | `service_role` só via `process.env` no servidor (`client.server.ts`); nada de chave privada no repo ou no bundle |
| **Auth server-side** | Middleware valida Bearer token no servidor antes de qualquer server function |
| **Build limpo** | `vite build` passa em ~6s, TypeScript estrito, saída para Cloudflare Workers (nitro/wrangler) |
| **Modelo de dados fiel ao blueprint** | missions/tasks/events/artifacts/approvals + boas adições: `routing_decisions`, `prompt_compilations`, `dispatch_queue`, `webhook_events` com flag `verified` |

## 2. O que é simulado (confirmando o briefing do Lovable)

- **"Maestro" não é IA** — é heurística de palavras-chave client-side (`src/lib/maestro.ts`, comentado honestamente: "sem LLM, sem chamadas externas"). O intake conversacional é um roteiro de perguntas por tipo de missão.
- **Nenhuma integração real** — agentes são linhas na tabela `agents` com status fake; `dispatch_queue` não tem consumidor; `webhook_events` não tem endpoint que a alimente; dados de demo via `demo-seed.ts`.
- **Aviso:** o README e o CI que o Lovable disse ter criado **não estão no commit clonado** — o sync pode não ter subido ainda; conferir no GitHub.

## 3. Problemas encontrados

1. **`.env` commitado** — contém só chaves publishable (públicas por design, sem risco real), mas é má prática: adicionar `.env` ao `.gitignore` e commitar um `.env.example`.
2. **FKs ausentes nas tabelas da 3ª migração** — `session_id`, `mission_brief_id`, `integration_id`, `target_agent_id` etc. sem `REFERENCES`: integridade referencial incompleta (órfãos possíveis).
3. **Zero testes** — nenhum teste em todo o repo.
4. **Single-user, não multi-tenant** — o "tenant" é o `user_id`. Não existe `organizations`/`memberships`; dois usuários da mesma empresa não veem os mesmos dados.
5. **`agents.webhook_url` e `integrations.secret_reference` acessíveis ao browser** — hoje inofensivo (mock), mas no produto real endpoints/segredos de agente não devem ser legíveis pelo cliente; mover para tabela restrita a service_role.

## 4. Distância até "fundação da Fase C" (roteiro de hardening)

| # | Trabalho | Estimativa |
|---|---|---|
| 1 | **Retrofit multi-tenant**: criar `organizations` + `memberships`, adicionar `org_id` nas 18 tabelas, reescrever as policies (de `user_id = auth.uid()` para membership), paths de storage por org, migração de dados | 1–2 semanas |
| 2 | FKs faltantes + testes de isolamento automatizados (usuário A ≠ usuário B; org A ≠ org B) | 2–4 dias |
| 3 | **Worker real** consumindo `dispatch_queue` (processo Node no VPS — Cloudflare Worker não serve para jobs longos), retries, timeouts | 1 semana |
| 4 | **Webhooks reais** `/api/public/*` com HMAC + timestamp + nonce (o contrato já está no doc 02) | 3–5 dias |
| 5 | Maestro com LLM de verdade (server function chamando a API da Anthropic; nunca do browser) | 3–5 dias |
| 6 | CI (lint + build + testes) e ejeção formal do Lovable Cloud para Supabase próprio se desejado (baixo custo: é Supabase padrão; os pacotes `@lovable.dev/*` são wrappers substituíveis de auth/error-reporting) | 2–4 dias |

**Total do hardening: ~4–6 semanas** — consistente com (e substitui parte de) as subfases C1/C2 do doc 03. Ou seja: o protótipo **adianta a Fase C em algumas semanas e alguns milhares de dólares**, além de já servir como demo de vendas hoje.

## 5. Recomendações imediatas (independentes de decisão)

1. Tirar `.env` do repositório (`git rm --cached .env` + `.gitignore`) e conferir se o sync do README/CI subiu;
2. Congelar o protótipo como está para **demo** (Transdesk/matriz) — não adicionar features novas nele até o piloto n8n rodar;
3. Manter a regra estratégica: **o caminho crítico continua sendo o piloto no VPS** — o cockpit só recebe investimento de hardening depois do gate de ROI da Fase A.
