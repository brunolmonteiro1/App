# Registro de Decisões (ADR leve) — Norton Impact

Formato: cada decisão tem status (✅ decidida / ⏳ aberta), contexto e consequência.
Novas decisões entram no topo da seção correspondente.

## Decisões tomadas

### D-001 — Mobile com Flutter ✅ (04/07/2026)
**Contexto:** docs permitiam Flutter ou React Native.
**Decisão:** Flutter (escolha do fundador, recomendação da análise).
**Consequência:** APK compilável via Gradle direto no Claude Code; pacote `health`
cobre HealthKit + Health Connect; UI única para as duas plataformas.

### D-002 — Backend do MVP com Supabase ✅ (04/07/2026)
**Contexto:** RFQ sugeria Node/NestJS, FastAPI ou Supabase.
**Decisão:** Supabase (Postgres gerenciado + auth + storage + edge functions) na
Fase 1; migração para serviço dedicado só quando a Fase 2 exigir.
**Consequência:** menos backend custom, mesmo schema relacional dos docs, sem
lock-in real (Postgres puro).

### D-003 — Android-first no piloto ✅ (04/07/2026)
**Contexto:** iOS exige conta Apple Developer (US$99/ano), macOS para build e
TestFlight; Android permite APK direto + closed testing.
**Decisão:** piloto roda em Android; iOS entra na Fase 1b.
**Consequência:** reduz ~40% do esforço da Fase 1a; risco: empresas com muitos
iPhones — mitigar escolhendo piloto com perfil Android ou aceitando lacuna.

### D-004 — Sem Strava no core ✅ (herdada dos docs)
Restrições da API Strava inviabilizam leaderboard/dashboard com dados de terceiros.
Conector opcional em fase futura, após revisão legal.

### D-005 — ActivityRecord interno source-agnostic ✅ (herdada dos docs)
Toda atividade é normalizada em tabela própria com fonte, dedup por
`raw_source_id` e workflow de status. Nenhuma lógica de ranking/impacto depende de
fornecedor externo.

### D-006 — Pontos nunca sacáveis ✅ (herdada dos docs)
Pontos de Impacto destravam doação institucional e benefícios; jamais viram
dinheiro para o usuário. Mitiga enquadramento de loteria/sorteio.

### D-007 — Verba fechada + repasse direto empresa→ONG ✅ (herdada dos docs)
Plataforma fatura somente fee tecnológico; doação nunca transita pela conta da
empresa operadora.

## Decisões em aberto (o fundador precisa bater o martelo)

### A-001 — Nome comercial ⏳
Norton × Quilômetro Solidário × outro. **Atenção:** "Norton" colide com marca
global de antivírus (NortonLifeLock) — recomendo checagem INPI + disponibilidade
de domínio/lojas antes de investir em identidade visual.

### A-002 — Empresa e ONG do piloto ⏳
Qual empresa, qual causa, qual teto de verba. Pré-requisito da Fase 1a.

### A-003 — Doação real ou demonstrativa no piloto ⏳
Demonstrativa simplifica juridicamente o primeiro ciclo; real gera case mais forte.

### A-004 — Métrica do piloto ⏳
Passos, km, treinos, streaks — ou combinação. Recomendação: passos + km validados,
convertidos em pontos (inclusivo e simples de explicar).

### A-005 — Piloto aberto ou por convite ⏳
Recomendação: fechado por código de liga (menos moderação, menos risco).

### A-006 — Codegang: contratar, renegociar ou construir internamente ⏳
Ver análise crítica §3.2. Recomendação: construir com Claude Code; se contratar,
salvaguardas obrigatórias (repo próprio, milestone verificável, CI).
