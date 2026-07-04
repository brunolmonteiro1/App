# AI Mission Control — Escopo, Cronograma e Preço por Fase

Premissas de precificação: equipe enxuta (1 dev sênior full-stack + apoio pontual), taxa blended de **US$ 40–70/h** (freelance sênior LATAM/Leste Europeu). Agência americana/europeia multiplica por 2–4×. Todos os valores são estimativas para negociação, não proposta fechada. Cada fase termina num **gate de decisão** — a fase seguinte só começa se o gate passar.

---

## Visão geral

```
FASE A (agora)          FASE B (se ROI provado)      FASE C (se B provado)
Piloto 30 dias   ──►    Ações controladas     ──►    Plataforma AI Mission Control
n8n read-only           envio com aprovação          multi-tenant, produto vendável
US$ 2,5–4 mil           US$ 4–8 mil                  US$ 33–55 mil
2–3 sem + 30 dias       3–5 semanas                  4,5–6,5 meses
```

Custo total até plataforma completa: **~US$ 40–67 mil em 7–9 meses** — mas com dois pontos de saída baratos antes de comprometer o valor grande.

---

## Fase 0 — Revisão técnica (este trabalho)

| Item | Valor |
|---|---|
| Escopo | Avaliação de arquitetura, recomendação de stack, desenho do POC, plano e estimativa por fase (docs 01–03) |
| Prazo | 1 semana |
| Preço | **US$ 500–1.500** fixo (frequentemente absorvido na Fase A se o projeto seguir) |

---

## Fase A — Piloto 30 dias (Pilot Brief, read-only, sem IA)

**Escopo:** workflow n8n único: resumo diário de inadimplência (faixas 1-30/31-60/61-90/90+), renovações 30/60/90 dias, rascunhos de WhatsApp em fila `pending` (nada enviado), resumo no Telegram às 08:00. Entradas = relatórios exportados manualmente. Inclui mapeamento de colunas dos relatórios reais, templates de mensagem, handover e ajustes durante os 30 dias de rodagem.

| Item | Estimativa |
|---|---|
| Build + setup + handover | **US$ 2.500–4.000** (o Pilot Brief pede US$ 2.500 — está dentro da faixa justa) |
| Prazo de build | 2–3 semanas |
| Rodagem assistida | 30 dias (suporte leve incluído na faixa) |
| Custo recorrente | **US$ 15–60/mês** (VPS ou n8n Cloud; US$ 0 de tokens) |

**Gate A → B:** relatório de ROI com números reais: R$ recuperados de inadimplência, renovações salvas, horas/semana economizadas vs. custo mensal. Se ROI não fechar, o projeto para aqui tendo custado < US$ 5 mil.

---

## Fase B — Ações controladas (send-on-approval + mais relatórios)

**Escopo:**
1. Envio de WhatsApp **após aprovação humana**, via WhatsApp Business Cloud API oficial (inclui setup de conta Meta Business e templates aprovados);
2. Automação da exportação dos relatórios com **Playwright determinístico** (login master usado só por script, read-only, allowlist, bloqueio de rotas de escrita, gravação de sessão, dry-run) — elimina o passo manual de exportar;
3. +2 relatórios (ex.: cotações sem follow-up, ativações/vistorias pendentes);
4. Painel simples de aprovação (pode ser a própria planilha com botão, ou mini-app de 2 telas);
5. Primeiro uso opcional de LLM: redação/personalização de mensagens (custo de tokens estimado: < US$ 20/mês nesse volume).

| Item | Estimativa |
|---|---|
| Preço | **US$ 4.000–8.000** |
| Prazo | 3–5 semanas |
| Recorrente | US$ 30–100/mês (VPS + WhatsApp API + tokens) |

**Gate B → C:** existe demanda real de mais empresas/mais processos que justifique produto multi-tenant? Se o valor é só desta operação, **parar na Fase B é o resultado correto** — e barato de manter.

---

## Fase C — Plataforma AI Mission Control (produto multi-tenant)

Corresponde às Fases 1–6 do blueprint PDF, com as simplificações da avaliação técnica (1 VPS, pg-boss, gateway, n8n só conectores).

| Subfase | Escopo | Prazo | Preço |
|---|---|---|---|
| **C1 — Fundação MVP** | Monorepo, auth, orgs/roles, missões, tasks, artefatos, timeline de eventos, Approval Center, dashboard básico (incrementos 1–4 e 6 do doc 02) | 6–8 semanas | **US$ 12.000–18.000** |
| **C2 — Orquestração** | Worker pg-boss, FSM, retries/timeouts, Agent Gateway, webhooks HMAC, executor interno (LLM + Playwright), ingestão de eventos/artefatos | 3–4 semanas | **US$ 6.000–9.000** |
| **C3 — POC de agentes** | Adapters OpenClaw + Hermes atrás do gateway, bateria de testes comparativa, relatório ficar/substituir (Gates 4–6 do blueprint) | 2–3 semanas | **US$ 3.000–5.000** |
| **C4 — Templates de workflow** | Templates reusáveis: extração de PDF, resumo de relatório, coleta em browser, análise de leads, follow-up | 2–3 semanas | **US$ 4.000–6.000** |
| **C5 — Hardening multi-tenant** | Testes de isolamento por tabela/bucket, RBAC completo, usage limits, audit review, revisão de segurança | 3–4 semanas | **US$ 5.000–8.000** |
| **C6 — Produção + piloto pagante** | Deploy, monitoramento, backups testados, documentação, onboarding do 1º cliente, suporte de estabilização | 2–3 semanas | **US$ 3.000–5.000** |
| **Total Fase C** | | **18–25 semanas** | **US$ 33.000–51.000** |

Recorrente da plataforma em produção (1–5 tenants): **US$ 150–400/mês** (Supabase Pro, VPS, Vercel, monitoramento, tokens conforme uso — tokens são repassáveis por tenant via `usage_limits`).

**Manutenção pós-lançamento:** reservar 10–15% do valor de build/ano, ou retainer de US$ 500–1.500/mês.

---

## O que fica explicitamente FORA (até que um gate justifique)

- Envio automático sem aprovação humana; autonomia plena de agentes;
- Gmail com contas reais de clientes; pagamentos/billing self-service;
- Scraping de sites protegidos com anti-bot; login agêntico (LLM pilotando browser) em sistemas legados — **nunca** com o login master;
- BI avançado antes do motor de missões estar estável;
- 2 VPS dedicados por agente; Temporal/Redis antes de o volume exigir.

---

## Resumo da recomendação

1. **Feche a Fase A já** — é o Pilot Brief como está, preço justo, risco mínimo, e responde a única pergunta que importa (ROI) em ~45 dias.
2. **Negocie o contrato por fase com gates**, nunca o pacote fechado de US$ 50 mil+ de uma vez — o próprio blueprint do cliente pede isso (seção 16).
3. **Trave as decisões de arquitetura da avaliação** (doc 01) no contrato da Fase C: gateway de agentes substituíveis, RLS desde a migração 001, n8n só como conector, credencial master jamais em agente LLM.
