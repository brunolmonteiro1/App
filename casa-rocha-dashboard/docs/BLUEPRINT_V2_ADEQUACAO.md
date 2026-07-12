# ADEQUAÇÃO DO BLUEPRINT MESTRE v2 AO SISTEMA EXISTENTE

Avaliação crítica do `BLUEPRINT_MESTRE_v2.md` contra o código real (2026-07-11) e plano
de implementação adaptado. **Este documento tem precedência operacional sobre o v2 nos
pontos em que o adapta** — o v2 permanece a referência conceitual.

## 1. Veredito executivo

O v2 é metodologicamente sólido e coerente com o sistema construído. Nenhuma regra é
conceitualmente errada. Os ajustes são de **execução**: (a) ele supõe lógicas que não
existem no código real, (b) superdimensiona infraestrutura para um sistema single-user,
(c) propõe migrações estruturais arriscadas onde uma trilha de auditoria resolve.

## 2. Constatação importante: a "regra revogada" (§0.1) nunca existiu aqui

O v2 manda remover a lógica de "reduzir score automaticamente para passar na validação".
**O sistema atual nunca teve isso**: `lib/coding/analyze.ts` rejeita a pregação inteira
quando falta evidência e jamais altera scores. Não há nada a remover — apenas os fluxos
novos a adicionar (reparo por evidência + sugestões). O sistema atual já é mais
conservador do que o v2 supõe.

## 3. Tabela de decisão

| Item do v2 | Decisão | Adaptação |
|---|---|---|
| §0/§18 Regra canônica de reparo | **Adotar** | Nada a remover; adicionar fluxo A/B/C de reparo |
| §8.7/§19 `coding_attempts` imutáveis + "Ver resposta da IA" | **Adotar** | Tabela nova; `analyze.ts` grava tentativa antes de validar |
| §8.8 `coding_repair_suggestions` | **Adotar** | Tabela nova + UI aba de sugestões + aplicar/rejeitar humano |
| §8.9 `human_review_events` | **Adotar** | Log antes/depois em toda mudança de score/evidência |
| §12 Campos contextuais novos (crítica contextual, diaconia orgânica×institucional, `applicationMode`, `discourseMode`, idolatria política) | **Adotar** | Colunas novas nullable + rubrica + prompt + revisão + exports |
| §16 Evidência para riscos ≥3 e estados de validação | **Adotar** | Estende `schema.ts` + `validation_status` na evidência |
| §3.2 Renomear ISC → "Sinalizador lexical de crítica religiosa" | **Adotar** | Rename na UI/docs/aviso; colunas de banco mantidas (compat.) |
| §4 Selos de proveniência (LEXICAL_PRELIMINARY…HUMAN_OVERRIDDEN) | **Adotar** | Mapeados sobre `analysisMethod`/`analysisStatus` atuais (sem migração destrutiva) |
| §26–27 Home didática + `MethodologyTooltip` | **Adotar** | Componente novo, aplicado gradualmente |
| §21 Combobox de modelos (grupos/tags/fallback/preferência por função) | **Adotar (leva 2)** | Evoluir o seletor atual |
| §29–35 Master Diagnostic View | **Adotar (leva 2)** | Ver decisão de auth abaixo |
| §40 Testes automatizados | **Adotar** | vitest nas regras críticas (reparo, evidência, schema, null≠zero) |
| §7 Roles VIEWER/REVIEWER/ADMIN/MASTER_ADMIN + contas | **Adaptar** | **Senha dupla**: `APP_PASSWORD` (geral) + `MASTER_PASSWORD` (rotas/API master), com `security_audit_logs`. `MASTER_ADMIN_EMAILS` não se aplica sem contas de e-mail; RBAC completo quando houver multiusuário real |
| §17 Auditoria por IA (2ª chamada LLM) | **Adaptar** | Determinística sempre (já cobre §17.3 quase todo, custo zero); IA **opcional sob demanda** (botão "Auditar com IA") — nunca etapa compulsória |
| §8.2/8.3 Scores versionados por `analysis_id` | **Adaptar** | Manter 1:1 sermon↔scores + `aiScoresJson` (snapshot já existente) + `human_review_events` = auditabilidade sem reestruturar o banco |
| §5.2 Import de CSV separado | **Adaptar** | TSV já vem embutido no JSON e é reconciliado por YouTube ID; script standalone é opcional de baixa prioridade |
| Nomes snake_case / rotas do v2 | **Adaptar** | O próprio v2 autoriza (§8): manter convenção camelCase e rotas atuais, preservando conceitos |
| §9 Estados do ciclo de vida (12 status) | **Adaptar** | Mapear sobre os existentes; adicionar apenas `ai_audited` e `failed_methodology` quando os fluxos existirem |

## 4. Decisões do usuário (2026-07-11)

1. **Autenticação:** senha dupla (`APP_PASSWORD` + `MASTER_PASSWORD`), com logs de acesso.
2. **Auditoria por IA:** opcional sob demanda; validação determinística obrigatória.
3. **Escopo da 1ª leva:** núcleo metodológico (Rodadas A–D). Master View e OpenRouter UX na 2ª leva.

## 5. Plano de implementação adaptado

> **Status Leva 1 (2026-07-12): CONCLUÍDA.** Rodadas A–D implementadas, testadas e no branch.
> Nota: a auditoria por IA sob demanda ("Auditar com IA", §17) foi movida para a Leva 2 (junto
> ao Master View), pois é operacional, não metodológica-crítica; a validação determinística
> (§17.3) já roda em toda codificação.

### Leva 1 — Núcleo metodológico

**Rodada A — Tentativas auditáveis**
- Migração: tabela `CodingAttempt` (sermonId, attemptType, model, status, rawResponseText,
  extractedJson, validationIssuesJson, evidenceValidationJson, promptVersion, timestamps).
- `analyze.ts`: gravar tentativa ANTES da validação; nunca sobrescrever; nunca gravar API key.
- UI: "Ver resposta da IA" (modal/página `coding/attempts/[id]`) com abas resumo/bruto/JSON/regras/evidências.
- Mensagens amigáveis do §19.3.

**Rodada B — Reparo seguro e sugestões**
- `lib/coding/repairPrompt.ts` + endpoint `POST /api/coding/repair`: IA só retorna evidências
  candidatas para os scores originais (fluxo A); evidência não encontrada mantém falha (fluxo B).
- Migração: `CodingRepairSuggestion` (PENDING/APPLIED/REJECTED/SUPERSEDED) + `HumanReviewEvent`.
- UI: aba "Sugestões de reparo" com aplicar/rejeitar (exige nome do revisor + justificativa);
  aplicação gera evento com antes/depois.
- Testes §40.4 (nenhum caminho altera score automaticamente).

**Rodada C — Campos contextuais novos**
- Migração aditiva (tudo nullable): `contextualCritiqueIntensityScore`,
  `biblicalGroundingOfCritiqueScore`, `reconstructionAfterCritiqueScore`,
  `activationAfterCritiqueScore`, `organicDiaconiaScore`, `institutionalActionScore`,
  `politicalIdolatryCritiqueScore` em `SermonScores`; `critiqueShareEstimate`, `criticTarget`,
  `criticTone`, `healthyOrDemobilizingCritique`, `politicalCritiqueTarget`, `applicationMode`,
  `discourseMode`, `needsHumanReview`, `reviewReason`, `sensitivityLevel` em `SermonAnalysis`.
- Rubrica (§12 vira texto operacional em `rubric.ts`), glossário, prompt, Zod, tela de revisão,
  exports. `applicationMode` substitui a exibição de `ontologicalVsPragmatic` (campo antigo
  mantido no banco; UI mostra o novo; migração de leitura: ontologico→identity_being etc.).
- Gatilhos de `needsHumanReview` (§20.3) e evidência obrigatória para riscos ≥3 (§16.1).
- `diaconalGap` como métrica derivada no dashboard pastoral.
- Regra null≠zero auditada em `lib/aggregates.ts` (média já ignora null — confirmar e testar).

**Rodada D — Proveniência, didática e renomeações**
- ISC → "Sinalizador lexical de crítica religiosa" em toda UI/docs + aviso obrigatório do §3.2;
  env `CRITIQUE_LEXICAL_SIGNAL_THRESHOLD` aceito como alias de `ISC_THRESHOLD`.
- Selos de exibição novos (LEXICAL_PRELIMINARY, AI_CONTEXTUAL, HUMAN_REVIEWED…) em `Badge.tsx`.
- Home "Sobre este dashboard / Como ler" (§26, recolhível, persistida).
- `MethodologyTooltip` (§27) aplicado nos cards principais.
- Auditoria determinística formalizada como passo com status (`AUDIT` em CodingAttempt) +
  botão opcional "Auditar com IA" (`auditPrompt.ts`).

### Leva 2 — Operação e diagnóstico
- **Rodada E ✅ (2026-07-12):** OpenRouter UX (§21): `lib/coding/model-presets.ts` (fallback
  curado + provedores + tags), `listCatalog()` com cache e fallback automático em
  `openrouter.ts`, `ModelSelector` (combobox pesquisável agrupado por provedor, preço/contexto/
  tags/recomendado + modo avançado), preferência de modelo por função em `AppSetting`
  (`lib/coding/model-preference.ts`; reparo/auditoria herdam de codificação). Endpoint
  `/api/coding/models` devolve catálogo com `source` (openrouter|fallback).
- **Rodada F:** Master Diagnostic View (§29–35): `MASTER_PASSWORD` em middleware + APIs,
  `SecurityAuditLog`, agregador determinístico de tensões (§33, thresholds versionados em
  config), cards, prompt master, `MasterDiagnosticReport` persistido/versionado, revisão,
  export confidencial. Nível de dureza altera só linguagem (testado).
- **Rodada G:** testes vitest completos (§40), CHANGELOG.md, SECURITY.md, INSTALL §39,
  varredura da Definition of Done (§43) aplicável.

## 6. Regras de segurança de migração (invariantes de todas as rodadas)

1. Toda mudança de schema é **aditiva e nullable** — nenhuma coluna existente é renomeada ou removida.
2. Dados existentes (263 pregações, 1.510 refs, 9.138 métricas) permanecem intocados.
3. `null` = não analisado; `0` = analisado e ausente; médias nunca convertem null em 0.
4. Tentativas de IA nunca são apagadas ou sobrescritas.
5. Nenhum fluxo automático altera score — mudanças só por ação humana registrada.
6. Build + smoke test + commit ao fim de cada rodada; push só com árvore verificada.
7. Backup do volume (`dados-do-banco/`) antes de aplicar migrações na VPS.
