# Changelog — Dashboard de Saúde Teológica · A Casa da Rocha

Registro das mudanças relevantes. Datas no formato AAAA-MM-DD.

## [Não lançado]

### Rodada H — fila durável de codificação (worker interno, 2026-07-13)

Motivação: rodar as 263 pregações no pipeline v3 (~22h) exigia manter o
navegador aberto conduzindo a fila. Uma etapa longa (estrutura na transcrição
inteira) pode levar minutos e estourava timeouts quando o navegador segurava a
requisição.

- `CodingJob` (nova tabela): fila durável com status queued/running/done/
  needs_review/failed, lock (`lockedAt`), retry com backoff (`nextAttemptAt`,
  `attempts`) e `analysisRunId` para retomar em vez de recriar.
- `lib/coding/worker.ts`: worker interno singleton (concorrência 1, SQLite) —
  `claimNext` (claim atômico via transação), `processJob` (dirige o pipeline v3
  reutilizando `startRun`/`advanceRun`; classifica falha transitória × meto‑
  dológica), `runWorkerLoop`, `resumeOrphans`. **Não duplica lógica analítica**:
  prompts, validação, evidências e persistência seguem em `pipeline.ts`.
- `instrumentation.ts`: no boot do servidor, retoma jobs órfãos e reinicia o
  worker — sobrevive a restart do processo.
- `/api/coding/queue`: enfileirar (POST) e snapshot ao vivo (GET).
- `/coding`: ação primária **"Enviar N para a fila"** (pode fechar o navegador;
  processa no servidor) + painel de fila ao vivo (na fila / processando N/5 /
  concluídas / p/ revisão / falharam + custo). "testar agora (aba aberta)"
  mantido para validação pontual.

### Rodada H — refatoração metodológica multi-etapas (2026-07-12)

**Commit 1 — correções de evidência e validação (Fase 1 do blueprint de refatoração)**
- `analyze.ts` processa **todas** as evidências antes de decidir (uma evidência inválida
  não apaga as válidas): classificação `located` / `unlocated` / `ignored_aggregate` /
  `composite_rejected` gravada em `evidenceValidationJson`.
- `validateBusinessRules` agora roda **após** a localização: só evidência realmente
  localizada na transcrição satisfaz a regra do limiar — citação fabricada não conta.
  Agregados deixam de se auto-sustentar: exigem componente específico do mesmo eixo
  com evidência **localizada**.
- `detectCompositeQuote`: citações costuradas com `[...]`/`[…]`/"[trecho omitido]" são
  rejeitadas com razão explícita; reticências naturais de fala não invalidam.
- `applyConditionalApplicability` (§6.1): incoerência semântica (ex.: crítica contextual
  ≤2 com reconstrução ≥4) vira **gatilho de revisão humana**, não falha técnica —
  fluxo errors/warnings/reviewTriggers; nenhum score é alterado.
- Normalização de enums explícita e registrada (`normalizeEnums`): aliases conhecidos,
  valor original preservado, fallback auditável — fim do `.catch()` silencioso. Novos
  alvos canônicos de crítica: `hipocrisia_religiosa`, `triunfalismo`,
  `performatividade_religiosa`, `sectarismo`, `espiritualizacao_abusiva`.
- Reparo (`repair.ts`): usa os limiares corretos (`RISK_EVIDENCE_THRESHOLDS`, incl.
  limiar 3), roda checagem de coerência ANTES de buscar evidência (campo incoerente →
  sugestão pendente para decisão humana, sem caça de citação) e nunca reaproveita nem
  salva evidência de agregado.
- Prompt (`codebook-v1.1`): regras de citação obrigatórias — trecho contínuo, nunca
  `[...]`, nunca combinar passagens, sem correção de gramática, 12–80 palavras,
  múltiplas evidências por campo permitidas.
- Testes: 49 vitest (20 novos), incluindo os dois casos reais observados com
  Sonnet 4.5 (evidência fabricada de agregado; reconstrução 4 com crítica baixa).

**Commits 2–8 — pipeline `coding-v3-multistage`**
- `AnalysisRun` (entidade-raiz de cada execução; histórico preservado, `isCurrent`)
  + tabelas por etapa (`SermonStructureAnalysis`, `SermonInterpretationAnalysis`,
  `SermonFormativeAnalysis`, `EvidenceCandidate`) com `analysisRunId @unique`;
  `derivePipelineStatus` como fonte única de status; versionamento por etapa.
- Etapa A — reconstrução estrutural fluida (sem imposição de 3 pontos; digressão
  integrada ≠ falha; sem inferência de preparação mental); anchors localizados
  deterministicamente (exact/normalized/ambiguous/not_found).
- Etapa B — hermenêutica, argumentação e homilética; scores de qualidade 1–5\|null
  (0 → null com registro).
- Etapa C — formação (crer/ser/amar/fazer/como/com quem/enviado), famílias de score
  (presence/quality/applicability/risk/aggregate), lacuna formativa revisada
  (não-desenvolvido ≠ falha), agregados derivados (`derived-scores.ts`).
- Etapa D — extração direcionada em lotes (agregados nunca entram); todas as
  candidatas em `EvidenceCandidate`, só as validadas em `SermonEvidence`;
  `scoreMetadata` por campo (§12); troca de `isCurrent`.
- Etapa E — auditoria semântica (entrada sem transcrição integral); só relata,
  nunca altera scores; finaliza o run.
- UI: `/api/coding/pipeline`; abas na página da pregação (Estrutura · Fios ·
  Argumentação · Hermenêutica · Homilética · Teologia · Formação · Evidências ·
  Auditoria · Histórico) com destaque de trechos na transcrição; fallback v1.
- Custo estimado ≈ US$0,40–0,50/pregação (Sonnet 4.5). 95 testes vitest.

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
