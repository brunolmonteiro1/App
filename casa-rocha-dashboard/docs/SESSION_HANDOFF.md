# SESSION HANDOFF — Rodada H (pipeline multi-etapas + fila durável)

Branch: `claude/casa-rocha-dashboard-design-pbnjvx` · HEAD `35d2d9a` (tudo commitado e no ar).

## Objetivo atual do sistema
Codificar teológica/pastoralmente as 263 pregações da Casa da Rocha com IA, produzindo
análise **auditável** (score → evidência literal → posição na transcrição → fonte) e
revisável por humano. A Rodada H trocou a codificação monolítica (1 chamada) por um
**pipeline v3 de 5 etapas** e uma **fila durável** que roda o corpus sem navegador aberto.

## O que está funcionando
- Base auditável completa (Fases 1–6): import, banco, telas, dashboards, relatórios, revisão.
- Pipeline v3 (`coding-v3-multistage`) ponta-a-ponta: A estrutura → B interpretação →
  C formação/scores → D evidências → E auditoria. Validado por smokes (mock OpenRouter).
- Correções da Fase 1 no fluxo v1 e no reparo (evidência pós-localização, `[...]`,
  aplicabilidade condicional, enums, limiares).
- Fila durável: worker interno roda pregações sozinho, sobrevive a fechar o navegador e a
  restart do processo (smoke: 2 pregações → `done,done`; `resumeOrphans` ok).
- 95 testes vitest passando; `npm run build` limpo (última execução nesta sessão).

## O que foi implementado nesta sessão (Rodada H, 15 commits — `016eea3`..`35d2d9a`)
1. **Commit 1** — correções de evidência/validação (processa todas as evidências;
   validação pós-localização; `detectCompositeQuote`; `applyConditionalApplicability`
   errors/warnings/reviewTriggers; normalização de enums registrada; reparo com limiares).
2. **Commit 2** — `AnalysisRun` (entidade-raiz, histórico, `isCurrent`), tabelas por etapa
   (`analysisRunId @unique`), `EvidenceCandidate`, `run-status.ts` (`derivePipelineStatus`).
3. **Commits 3–7** — Etapas A–E (prompts + schemas Zod tolerantes + orquestrador
   `pipeline.ts`). Famílias de score (presence/quality/applicability/risk/aggregate),
   agregados derivados (`derived-scores.ts`), `locate-anchors.ts`.
4. **Commit 8** — abas na página da pregação (`SermonPipelineTabs`) + `/api/coding/pipeline`.
5. **Calibração antiviés** (`aaf44d6`) — "disperso ≠ ausente" nos prompts v1 e formativo.
6. **Background + polling** (`72039e6`) — `launchRunInBackground` + `getRunSnapshot`; a
   execução não segura mais a conexão HTTP (resolveu o "fica estático / timeout 280s").
7. **Fila durável** (`35d2d9a`) — `CodingJob`, `worker.ts`, `instrumentation.ts`,
   `/api/coding/queue`, UI "Enviar para a fila" + painel ao vivo; conserto do 500 em
   `/coding/attempts/[id]` (formatos JSON novos).

## Arquivos principais alterados/criados
- `lib/coding/pipeline.ts` — orquestrador das 5 etapas + background/snapshot/advance/resume.
- `lib/coding/worker.ts` — fila: enqueue/claimNext/processJob/runWorkerLoop/resumeOrphans.
- `lib/coding/{structure,interpretation,formative,evidence,auditStage}Prompt.ts` — prompts/schemas.
- `lib/coding/{score-fields,derived-scores,locate-anchors,run-status,versions,schema}.ts`.
- `lib/coding/{analyze,repair,prompt,locate-evidence}.ts` — correções Fase 1 + calibração.
- `instrumentation.ts` — auto-start do worker no boot.
- `app/api/coding/{pipeline,queue}/route.ts`; `app/coding/page.tsx`; `app/sermons/[id]/page.tsx`;
  `components/sermon/SermonPipelineTabs.tsx`; `app/coding/attempts/[id]/page.tsx`.
- `prisma/schema.prisma` (+ migrações `analysis_runs_multistage`, `interpretation_quality_scores`,
  `coding_jobs_queue`).

## Testes existentes e último resultado
`tests/`: schema, locate-evidence, run-status, structure, interpretation, formative,
evidence-stage, audit-stage, master, tensions. **Último run: 95 passando.** Build limpo.
Smokes (em `scratchpad/`, NÃO versionados): `smoke-fase1`, `smoke-etapa-a/b/d`, `smoke-full`,
`smoke-step`, `smoke-bg`, `smoke-worker` — todos verdes, mas dependem de mock OpenRouter local.

## Bugs / bloqueios conhecidos
- **Nenhuma pregação foi codificada em v3 com IA real ainda** — só validação por mock. A
  QUALIDADE do v3 é a grande incógnita (ver "próxima tarefa").
- Fila exige **processo Node de vida longa** (`next start`/Docker). Em serverless o background
  morre ao retornar a resposta — NÃO usar serverless para o worker.
- Concorrência da fila é **1** (SQLite escritor único). Não aumentar sem lock por token.
- Dashboards agregados v3 e adaptação do Master (Commits 9/10 do plano original) **pendentes** —
  só fazem sentido após haver corpus codificado em v3.
- Deploy do usuário exige **rebuild após pull** (`next start` não recarrega código sozinho).

## Decisões metodológicas que NÃO podem ser revertidas
1. Nenhum score é alterado automaticamente — falha/incoerência só rejeita ou manda p/ revisão.
2. Evidência só conta se **localizada literalmente** na transcrição; citação composta (`[...]`)
   é rejeitada; agregados NUNCA têm evidência própria.
3. Famílias de score: **quality usa null (não 0)**; risco fica fora das médias; agregados
   nunca por média simples (painel derivado: presentes × top-3 × amplitude × holístico).
4. Estrutura fluida: sem impor "3 pontos"; "estrutura declarada" só com fala explícita do
   pregador (nunca inferir preparação mental — `explicitly_declared_structure` vs inferida).
5. Todo run é imutável e versionado; recodificar cria run novo (`isCurrent` alterna, o
   anterior vira `superseded`) — histórico nunca é apagado.

## Próxima tarefa recomendada
**Rodar a pregação #03 ("Os dois Jardins") pela fila v3 com IA real** e comparar o resultado
(estrutura, evidências, famílias de score, lacuna) com a crítica externa registrada no chat —
verificar se a Etapa A capta o bloco espontâneo do Pedro e se a calibração antiviés corrigiu
pneumatologia/eclesiologia/método. Só depois: dashboards agregados v3.

## Arquivos que a próxima sessão deve ler primeiro
1. `docs/SESSION_HANDOFF.md` (este) e `docs/PIPELINE.md` §0 (as 5 etapas).
2. `lib/coding/pipeline.ts` (orquestrador) e `lib/coding/worker.ts` (fila).
3. `lib/coding/score-fields.ts` (famílias + `FAMILY_SEMANTICS`) e `derived-scores.ts`.
4. `app/coding/page.tsx` (fila/UI) e `app/sermons/[id]/page.tsx` + `SermonPipelineTabs.tsx`.
5. Plano completo: `/root/.claude/plans/root-claude-uploads-af0a7556-9d70-5652-tranquil-unicorn.md`.
6. `CHANGELOG.md` (topo — Rodada H) para o resumo cronológico.
