# AI Mission Control — Avaliação Técnica

**Data:** Julho 2026 · **Insumos:** Blueprint de desenvolvimento (PDF), SRS v1.0, Pilot Brief 30 dias, deck n8n, e-mail com restrições do cliente (login master, sistemas legados).

---

## 1. Veredito executivo

**A arquitetura proposta faz sentido como destino, mas não como ponto de partida.** Os quatro documentos, na verdade, descrevem dois projetos diferentes:

1. **O piloto de 30 dias** (Pilot Brief + deck n8n): read-only, sem IA na v1, n8n + Google Sheets + Telegram, ~US$ 2.500 de build e ~US$ 15–60/mês de operação.
2. **A plataforma AI Mission Control** (Blueprint + SRS): produto multi-tenant custom, com missões, agentes, aprovações, auditoria e dashboards.

**Recomendação central: execute o piloto primeiro, exatamente como especificado no Pilot Brief, e trate a plataforma como uma decisão condicionada ao ROI do piloto.** O próprio material do cliente já chegou nessa conclusão — e ela está correta. O piloto responde as 6 perguntas de validação (acesso seguro, utilidade, custo, estabilidade, redução de trabalho manual, ROI) por ~5% do custo da plataforma completa.

O erro mais caro possível aqui seria começar pela plataforma multi-tenant, ou começar colocando um agente LLM (OpenClaw/Hermes) com o **login master** dentro dos sistemas legados.

---

## 2. OpenClaw + Hermes vs. n8n — a decisão principal

### 2.1 Para o piloto: n8n, sem agentes LLM. Sem discussão.

O escopo do piloto (ler relatório exportado → agrupar por atraso/vencimento → gerar rascunhos de mensagem → planilha + Telegram) é **100% determinístico**. Não há tarefa nesse escopo que precise de um modelo de linguagem, muito menos de um framework de agente autônomo. Usar OpenClaw/Hermes aqui adicionaria:

- Custo de tokens onde o custo pode ser ~US$ 0;
- Não-determinismo onde o cliente precisa provar estabilidade;
- Superfície de ataque (exec, browser, filesystem) onde a promessa é "read-only, sem tocar nos sistemas";
- Dados de clientes (nomes, placas, contratos) passando por um modelo — complicação LGPD desnecessária na v1.

O deck do n8n acerta em cheio: *"pure logic, no AI model in version 1"*.

### 2.2 Para a plataforma: agentes atrás de um gateway, nunca como pilar

OpenClaw e Hermes são frameworks de agente **pessoais/single-user**, projetos comunitários em movimento rápido. Problemas para uso como componente central de um produto vendido a várias empresas:

| Problema | Consequência |
|---|---|
| Não são multi-tenant | Um agente por cliente = custo e operação lineares por cliente; agente compartilhado = risco de vazamento entre tenants |
| Ferramentas amplas (exec, browser, filesystem) | Superfície de ataque grande; difícil auditar o que o agente *pode* fazer vs. o que *deveria* |
| Projetos jovens, breaking changes frequentes | Custo de manutenção imprevisível; risco de abandono |
| Estado interno próprio (sessões, memória) | Conflita com o requisito de que **a plataforma é dona do estado** (missões, tarefas, eventos) |

**Recomendação (que o próprio blueprint já sugere na instrução final):** abstrair qualquer agente atrás de um **Agent Gateway** com contrato próprio (task in → events/artifacts out, HMAC, allowlist). OpenClaw/Hermes entram como *executores substituíveis* validados na fase de POC — se funcionarem, ótimo; se não, trocam-se por um worker interno (Node/Python + SDK da Anthropic + Playwright) sem reescrever nada do dashboard ou do modelo de dados.

Na prática, para os fluxos descritos nos documentos (extração de PDF, relatórios, coleta em browser, rascunhos de mensagem), **um worker interno com chamadas diretas de LLM + Playwright roteirizado é mais simples, mais barato, mais estável e mais auditável** do que dois frameworks de agente em dois VPS. A previsão honesta: o POC da Fase 3 vai concluir isso.

### 2.3 O login master: a restrição que define o design

O cliente só tem um login master que pode alterar/cancelar coisas nos sistemas legados. Disso decorrem três regras:

1. **Nunca dar o login master a um agente LLM de navegação livre.** Agente dirigido por LLM + credencial com poder de escrita + sistema de produção = combinação inaceitável. Um erro de interpretação do agente pode cancelar um contrato ou gerar um boleto.
2. **Fase 1 (piloto): não logar em sistema nenhum.** Trabalhar só com relatórios exportados por humanos (é o que o Pilot Brief já especifica).
3. **Fase 2 (se o piloto passar): automação de browser determinística, não agêntica.** Scripts Playwright codificados por fluxo (ex.: "logar → menu Relatórios → exportar CSV de inadimplência → logout"), com:
   - Credenciais em vault no servidor (variáveis de ambiente/secret manager), **nunca no prompt de um modelo**;
   - Allowlist de URLs e bloqueio por interceptação de rotas de escrita (save/delete/cancel/activate/gerar boleto/submit);
   - Modo dry-run e gravação de sessão (screenshots + trace) para auditoria;
   - Aprovação humana antes de qualquer ação de escrita, quando escrita for eventualmente habilitada.

O LLM entra **depois** do dado extraído: resumir, classificar, redigir mensagens — nunca pilotando o browser com a credencial master.

---

## 3. Avaliação do stack proposto

| Camada | Proposta original | Avaliação | Recomendação |
|---|---|---|---|
| Frontend | Lovable ou Claude Code | Lovable: pular (o blueprint já decidiu, corretamente, para um produto replicável). Claude Code: é acelerador de desenvolvimento, não runtime | **Next.js + TypeScript + Tailwind/shadcn**, código próprio, desenvolvido com Claude Code |
| Banco/Auth/Storage | Supabase | Boa escolha: Postgres + RLS resolve multi-tenancy, Auth resolve login/roles, Storage resolve artefatos, Realtime resolve o dashboard ao vivo | **Manter Supabase** (com disciplina: RLS por `organization_id` em todas as tabelas desde a migração 001) |
| Orquestração | n8n como orquestrador central | n8n é ótimo para **conectores** (Sheets, Telegram, Drive, Gmail, WhatsApp API), ruim como **dona do estado de missões** (versionamento fraco, teste fraco, lógica visual cresce mal) | n8n **só para integrações**; o ciclo de vida de missão/tarefa vive no backend próprio |
| Fila/Workers | (não definido) | Necessário a partir da plataforma, não do piloto | **pg-boss** (fila sobre o próprio Postgres — zero infra extra) no MVP; migrar para BullMQ/Redis ou Temporal só se o volume exigir |
| Agentes | OpenClaw (VPS 1) + Hermes (VPS 2) | Ver seção 2 — não como pilares | **Agent Gateway + worker interno**; OpenClaw/Hermes apenas como POC substituível |
| Browser automation | via Hermes | Não-determinístico com credencial sensível | **Playwright roteirizado** no worker; Browserbase/Stagehand só se anti-bot exigir |
| Infra | 2 VPS separados para agentes | Isolamento por hardware é custo sem benefício nessa escala | **1 VPS com Docker Compose** (containers e redes separados dão o isolamento necessário); separar máquinas só quando houver múltiplos clientes em produção |

### Respostas diretas às 15 perguntas do blueprint (seção 15)

1. **A arquitetura faz sentido para produto multi-empresa?** Sim, com as correções acima (gateway em vez de agentes acoplados; n8n rebaixado a conector).
2. **Next.js só ou backend separado?** Next.js (App Router + route handlers) **mais um processo worker separado** no mesmo monorepo. NestJS/FastAPI separados são desnecessários no MVP.
3. **Supabase ou Postgres self-hosted?** Supabase no MVP (velocidade). O lock-in é baixo — é Postgres padrão, migrável depois.
4. **n8n como orquestrador?** Não. Só para integrações selecionadas.
5. **Fila/worker desde a v1?** Da plataforma, sim (pg-boss). Do piloto, não (n8n schedule resolve).
6. **OpenClaw/Hermes ficam?** Atrás de gateway, substituíveis. Expectativa: serão substituídos por worker interno.
7. **Integração mais segura com agentes em VPS?** HMAC + bearer token + IP allowlist + payloads tenant-escopados + endpoints de callback assinados. Agente nunca acessa o banco diretamente.
8. **Multi-tenancy?** Banco compartilhado + RLS por `organization_id` + prefixos de storage por tenant + checagem dupla na aplicação. Deploy separado só para enterprise, depois.
9. **MVP vs. adiado?** Ver doc 03 (fases). Resumo: adiar WhatsApp real, Gmail real, envio automático, login em legado, autonomia.
10. **POC mínimo que prova o produto?** O piloto de 30 dias do Pilot Brief. É exatamente isso.
11. **Principais riscos de segurança?** Credencial master exposta a agente; vazamento entre tenants (RLS mal feita); webhook não assinado; artefatos com dados pessoais sem controle de acesso; prompt injection em conteúdo lido pelo agente.
12. **Drivers de custo?** Horas de engenharia (dominante), depois tokens de LLM, minutos de browser automation, VPS/storage. No piloto: ~US$ 15–60/mês total.
13. **Como usar Claude Code?** Spec-driven: specs escritas antes, Claude Code implementa contra critérios de aceite e testes. Ver doc 02.
14. **O que simplificar na primeira build?** Tudo da seção 2 e 3 deste doc: sem 2 VPS, sem 2 frameworks de agente, sem n8n como núcleo, sem multi-tenant completo antes do segundo cliente pagante.
15. **Cotação por fase?** Ver doc 03.

---

## 4. Riscos principais e mitigações

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| 1 | Agente LLM com login master causa alteração indevida no sistema legado | Alta se feito | Crítico | Piloto sem login algum; depois Playwright determinístico read-only; escrita só com aprovação humana; nunca credencial em prompt |
| 2 | OpenClaw/Hermes instáveis/abandonados como dependência central | Média | Alto | Agent Gateway com contrato próprio; agentes substituíveis por design |
| 3 | Vazamento de dados entre tenants | Baixa com RLS bem feita | Crítico | RLS desde a migração 001 + testes automatizados de isolamento (usuário A não lê dados de B) como critério de aceite |
| 4 | Relatórios exportados mudam de formato e quebram o parsing | Alta | Médio | Etapa de mapeamento de colunas configurável + validação de schema na entrada + alerta no Telegram quando o arquivo não bate |
| 5 | Overbuild: plataforma completa antes de validar ROI | Alta sem disciplina | Alto | Gates de decisão entre fases (doc 03); nada da Fase C começa antes do relatório de ROI do piloto |
| 6 | LGPD: dados de clientes finais em modelo de IA / planilhas | Média | Alto | v1 sem modelo (dados não saem do Google Workspace do cliente); quando LLM entrar, avaliar mascaramento de PII e DPA do provedor |
| 7 | WhatsApp em massa via automação não-oficial → bloqueio de número | Alta se usar lib não-oficial | Alto | Envio manual no piloto; na Fase B usar **WhatsApp Business API oficial** (Meta Cloud API), nunca web-scraping do WhatsApp |

---

## 5. Conclusão

- **Viabilidade técnica: alta.** Não há nada tecnicamente arriscado no piloto, e a plataforma é engenharia convencional bem compreendida (SaaS multi-tenant + fila + gateway).
- **A sequência importa mais que o stack.** Piloto (semanas, ~US$ 2,5–4 mil) → ações controladas → plataforma (meses, ~US$ 35–60 mil). Cada fase só começa se a anterior provar valor.
- **OpenClaw/Hermes: coadjuvantes substituíveis, não fundação.** A fundação é o modelo de dados (missões/tarefas/eventos/artefatos/aprovações) + gateway + RLS.
- **Claude Code: acelerador de desenvolvimento com specs escritas antes** — o doc 02 é exatamente o blueprint para isso.
