# Roadmap e Backlog Priorizado — Norton Impact

> Fases alinhadas à "escada de maturidade" dos documentos, com um corte adicional:
> separar **MVP piloto** (o mínimo para rodar 1 campanha real) do **MVP completo**
> (escopo P0 integral dos docs). Vender antes de construir tudo.

## Fase 0 — Validação comercial (AGORA, sem código pesado)

**Objetivo:** fechar a primeira empresa-piloto e a ONG usando material de venda +
protótipo tangível. Sem backend.

| Entrega | Status |
|---|---|
| Blueprint e análise (este repositório) | ✅ |
| Protótipo Flutter navegável com dados mock (APK instalável) | ✅ gerado neste repo |
| Fábrica de builds (GitHub Actions → APK por push) | ✅ configurada |
| Landing page institucional com captura de leads | pendente |
| Pitch/proposta comercial para empresa-piloto | pendente (base: decks existentes) |
| Definição do piloto: empresa, ONG, meta, doação real × demonstrativa | pendente — decisão do fundador |

**Critério de saída:** 1 carta de intenção/contrato de piloto assinado.

## Fase 1a — MVP piloto (4–6 semanas de build)

**Objetivo:** o mínimo que roda uma campanha real com uma empresa. Android-first.

- Backend Supabase: auth (Google/e-mail), schema core (User, Campaign, Cause,
  League, ActivityRecord, ImpactTransaction), ingestão idempotente.
- Integração **Health Connect** real (passos/distância/workouts) no app Flutter.
- 1 campanha + 1 causa + liga por código privado (sem times, sem loja).
- Validação: dedup, capping diário, velocidade plausível, fila de revisão.
- Conversão em pontos + progresso coletivo + marcos de liberação.
- Ranking individual por liga (opt-in nominal).
- Push básico (lembrete diário) + FAQ estático + política de privacidade/termos.
- "Admin" = Supabase Studio + planilhas de export (CSV via SQL). Sem UI própria.
- Distribuição: Play internal/closed testing.

**Critério de saída:** campanha-piloto de 21–30 dias concluída; relatório entregue
ao patrocinador; KPIs coletados.

## Fase 1b — MVP completo (mais 4–6 semanas)

Completa o P0/P1 dos documentos após aprender com o piloto:

- iOS + HealthKit + TestFlight (exige conta Apple Developer).
- GPS workout in-app (caminhada/corrida/bike) com resumo.
- Times com convite por link; desafios parametrizáveis (1/7/21/30 dias).
- Streaks, badges e moedas simbólicas; catálogo manual de cupons (earn & burn).
- Admin web próprio (CRUD campanha/causa/sponsor, revisão de flagged, export
  CSV/PDF com identidade).
- Compartilhamento social pós-treino; deep links.
- Feature flags (loja, moedas, campanhas públicas).

## Fase 2 — Tração e escala

- Creator League (desafios de influenciadores, draft de times).
- Clube de benefícios automatizado (CPA/CPL com marcas).
- Antifraude estatístico (scoring de anomalias), webhooks corporativos.
- Dashboard B2B em tempo real; múltiplas campanhas simultâneas.

## Fase 3 — Plataforma SaaS B2B2C

- Multi-tenant / white-label; SSO corporativo; integrações de RH.
- Relatórios ESG automatizados/certificáveis.
- Marketplace completo com pagamentos.

## KPIs por fase (dos docs, a instrumentar desde a Fase 1a)

| Dimensão | Métrica |
|---|---|
| Adesão/fricção | % onboarding concluído; % permissões de saúde ativadas com sucesso |
| Engajamento B2C | DAU no desafio; km/passos validados por usuário; streak médio |
| Confiabilidade | % atividades flagged; tempo de revisão; divergência entre fontes |
| Impacto B2B | valor mobilizado p/ doação; % da meta; **renovação do patrocinador** |

## Cronograma de referência

```
Fase 0   ████                 (2-4 semanas, dependente de venda, não de código)
Fase 1a      ██████           (4-6 semanas de build + 3-4 semanas de campanha piloto)
Fase 1b            ██████     (4-6 semanas)
Fase 2                   ████████ (contínuo, guiado por contratos)
```

A proposta Codegang (3 meses/US$3k) mapeia aproximadamente para Fase 1a+1b — ver
análise crítica seção 3.2 antes de decidir contratar.
