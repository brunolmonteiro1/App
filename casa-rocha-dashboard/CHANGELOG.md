# Changelog — Dashboard de Saúde Teológica · A Casa da Rocha

Registro das mudanças relevantes. Datas no formato AAAA-MM-DD.

## [Não lançado]

### Leva 2 do Blueprint Mestre v2 — operação e diagnóstico (2026-07-12)

**Rodada E — UX do seletor de modelos OpenRouter (§21)**
- `ModelSelector`: combobox pesquisável agrupado por provedor, com nome amigável, id,
  preço estimado, janela de contexto, tags e destaque de recomendados; modo avançado
  para digitar qualquer id.
- `lib/coding/model-presets.ts`: lista de fallback curada (provedores + tags).
- `listCatalog()` com cache e fallback automático quando a API do OpenRouter falha;
  `/api/coding/models` devolve `source` (openrouter|fallback).
- Preferência de modelo por função (codificação/reparo/auditoria/relatório/master),
  persistida em `AppSetting` (`lib/coding/model-preference.ts`).

**Rodada F — Modo Diagnóstico Interno (Master Diagnostic View, §29–35)**
- Autenticação por `MASTER_PASSWORD` (separada da `APP_PASSWORD`): cookie assinado
  (HMAC), gate em middleware + página + APIs. Recurso não configurado → 404 discreto.
- `SecurityAuditLog`: trilha de acessos permitidos/negados (sem transcrições nem senhas).
- Detector determinístico de tensões com thresholds versionados (`tensions-v1`).
- Agregador com cards, denominadores, gaps, snippets rastreáveis e hash do input.
- Gerador de relatório determinístico (custo zero) ou por IA sob demanda, com validação
  (Zod + regras); `MasterDiagnosticReport` versionado + fluxo de revisão. Nível de dureza
  altera só a linguagem.

**Rodada G — auditoria por IA, testes e correção metodológica**
- **Correção de evidência para agregados de eixo**: os 5 campos agregados
  (`biblicalHealthScore`, `orthodoxyScore`, `orthopraxyScore`, `spiritualityScore`,
  `pastoralHealthScore`) deixam de exigir citação própria; ficam fundamentados quando
  alguma categoria específica do mesmo eixo tem evidência. Corrige rejeições falsas de
  pregações inteiras (caso observado em teste: #03). Prompt, validação e reparo alinhados.
- Auditoria por IA sob demanda (§17): botão "Auditar com IA" na revisão; 2ª passagem que
  só aponta problemas e **nunca altera scores**; registrada como tentativa `AUDIT` imutável.
- Testes automatizados (vitest, §40): schema/regras de evidência (incl. agregados),
  localização de evidência, detector de tensões, validação do relatório master e token master.

### Leva 1 do Blueprint Mestre v2 — núcleo metodológico (2026-07-12)

- **Rodada A** — tentativas de IA imutáveis e auditáveis (`CodingAttempt`, "Ver resposta da IA").
- **Rodada B** — reparo seguro por evidência + sugestões de score pendentes de aprovação
  humana; a IA nunca altera score automaticamente.
- **Rodada C** — campos contextuais novos (crítica contextual, diaconia orgânica ×
  institucional, `applicationMode`/`discourseMode`, idolatria política) + evidência obrigatória
  por limiar de risco.
- **Rodada D** — proveniência e didática; ISC renomeado para "Sinalizador lexical de crítica
  religiosa" (env `CRITIQUE_LEXICAL_SIGNAL_THRESHOLD`); Home didática; `MethodologyTooltip`.

## Fases 1–6 + Rodada 7 (2026-07-10 a 2026-07-11)

- Importador e banco (266 fontes / 263 pregações), tabela e busca, codebook e codificação
  por IA via OpenRouter, dashboards básico e avançado, relatórios, e base teológica executável
  (rubrica + glossário + padrão confessional lido em runtime). Ver `docs/ROADMAP.md`.
