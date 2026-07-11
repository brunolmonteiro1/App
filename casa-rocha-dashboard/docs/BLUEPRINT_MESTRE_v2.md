# BLUEPRINT MESTRE CANÔNICO — CASA ROCHA DASHBOARD

## Dashboard de Saúde Teológica, Formação Pastoral e Diagnóstico Interno

**Projeto:** `casa-rocha-dashboard`  
**Versão do blueprint:** 2.0  
**Status:** especificação canônica para implementação  
**Finalidade:** consolidar o blueprint original, a camada NLP, os ajustes metodológicos e operacionais, a auditoria de respostas da IA, a revisão da regra de reparo e o novo `Master Diagnostic View` em um único documento sem regras duplicadas ou contraditórias.

---

# 0. AUTORIDADE DESTE DOCUMENTO E REGRA DE PRECEDÊNCIA

Este documento passa a ser a referência principal para desenvolvimento, revisão de código, migrations, testes, documentação e validação funcional do sistema.

Quando uma regra anterior entrar em conflito com este blueprint, prevalece a regra mais restritiva e metodologicamente segura definida aqui.

## 0.1. Regra anterior expressamente revogada

Fica revogada a seguinte lógica de reparo automático:

> “Quando um score 4 ou 5 não tiver evidência, a IA pode reduzir o score para 3 ou menos, revalidar e salvar automaticamente.”

Essa lógica não poderá permanecer em prompt, service, action, endpoint, worker, fila, validação, teste ou interface.

## 0.2. Regra canônica de reparo

A regra válida passa a ser:

> A IA pode localizar e completar evidências literais ausentes. A IA pode sugerir uma alteração de score. A IA não pode alterar score para passar na validação e salvar automaticamente.

Consequências obrigatórias:

1. O reparo automático pode preservar scores e acrescentar evidência literal válida.
2. Uma tentativa que exija mudança de score não pode ser convertida automaticamente em codificação válida.
3. Toda mudança de score sugerida pela IA deve ser armazenada como sugestão não aplicada.
4. A aplicação da sugestão exige ação humana explícita.
5. O sistema deve registrar usuário, data, score anterior, score aplicado, justificativa e origem da sugestão.
6. A ausência de evidência para score alto permanece registrada como falha metodológica, e não como simples erro técnico corrigido silenciosamente.

---

# 1. CONTEXTO GERAL DO PROJETO

O `casa-rocha-dashboard` é uma aplicação para análise bíblica, teológica, homilética, pastoral e formativa das pregações da igreja A Casa da Rocha, com ênfase inicial nas mensagens do Pr. José Bruno entre 2020 e 2026.

A base principal é composta por:

- transcrições de pregações;
- títulos e metadados;
- séries;
- datas e anos;
- links do YouTube;
- conteúdo exportado do NotebookLM;
- CSV complementar de metadados;
- resultados lexicais e estatísticos;
- codificações contextuais geradas por IA;
- auditorias automáticas;
- revisões humanas;
- relatórios agregados.

O produto deve funcionar como um exame de sangue pastoral: organizar indicadores, mostrar padrões, explicitar denominadores, permitir auditoria até a fonte e apoiar discernimento humano sem transformar o sistema em juiz espiritual automático.

## 1.1. Pergunta central

> Que dieta bíblica, teológica, espiritual, comunitária e prática a igreja recebeu ao longo do período analisado, e quais forças, desequilíbrios, tensões e oportunidades formativas aparecem nos dados?

## 1.2. Perguntas derivadas

O sistema deve permitir investigar, com dados e evidências:

- o que foi ensinado com maior frequência;
- o que recebeu maior centralidade formativa;
- quais temas aparecem apenas como menção;
- quais doutrinas predominam por ano e por série;
- quais práticas cristãs são ensinadas de modo concreto;
- como se relacionam ortodoxia e ortopraxia;
- como se relacionam desconstrução, reconstrução e ativação;
- como se relacionam acolhimento dos feridos e envio dos curados;
- se o serviço é apresentado como identidade orgânica, ação concreta ou estrutura institucional;
- se a crítica religiosa é biblicamente fundamentada e acompanhada de reconstrução;
- quais temas de vida cotidiana aparecem com baixa presença ou baixa centralidade;
- quais resultados são lexicais, contextuais, auditados ou revisados por humano;
- quais pregações precisam de revisão humana antes de alimentar conclusões pastorais.

---

# 2. OBJETIVOS E NÃO OBJETIVOS

## 2.1. Objetivos do produto

A aplicação deve permitir:

1. importar e reconciliar fontes do NotebookLM e metadados em CSV;
2. armazenar transcrições integrais e metadados auditáveis;
3. executar análise lexical e NLP preliminar;
4. codificar cada pregação individualmente com prompt neutro;
5. validar scores e evidências por regras determinísticas;
6. registrar todas as tentativas de IA, inclusive falhas;
7. revisar manualmente scores, categorias e evidências;
8. calcular métricas agregadas por período, ano, série e tema;
9. permitir drill-down de qualquer gráfico até a pregação e o snippet literal;
10. gerar relatórios públicos/presbiteriais com linguagem sóbria;
11. gerar diagnósticos internos/master com linguagem direta e controlada;
12. exportar dados com proveniência e status de revisão;
13. manter trilha de auditoria de mudanças e acessos sensíveis.

## 2.2. Não objetivos

O sistema não deve:

- avaliar caráter, intenção, motivação ou espiritualidade privada do pregador;
- presumir efeitos espirituais invisíveis;
- transformar frequência lexical em conclusão pastoral;
- chamar ausência em uma pregação de ausência absoluta no ministério;
- emitir acusação institucional automática;
- misturar dados preliminares e revisados sem identificação;
- esconder falhas da IA;
- corrigir metodologicamente uma análise mediante redução silenciosa de scores;
- permitir que o relatório master contamine a codificação individual;
- substituir decisão pastoral humana.

---

# 3. ARQUITETURA METODOLÓGICA: CAMADAS RIGOROSAMENTE SEPARADAS

## 3.1. Camada A — Fonte e processamento básico

Contém:

- transcrição;
- título;
- série;
- data;
- pregador;
- URL;
- origem;
- referências bíblicas detectadas;
- contagens de palavras;
- dados de qualidade da transcrição.

Essa camada não interpreta significado pastoral.

## 3.2. Camada B — Sinais lexicais e NLP

Contém:

- dicionários;
- regex;
- frequência por 10.000 palavras;
- n-grams;
- TF-IDF;
- entidades;
- embeddings;
- similaridade semântica;
- clustering;
- snippets candidatos.

A saída desta camada deve ser rotulada como `LEXICAL_PRELIMINARY` ou `NLP_PRELIMINARY`.

O antigo “Índice de Saturação Crítica” deve ser renomeado para:

> **Sinalizador lexical de crítica religiosa**

Aviso obrigatório:

> Este é um sinalizador lexical preliminar. Ele identifica vocabulário associado à crítica religiosa, mas não mede intenção, tom, fundamentação bíblica, efeito pastoral ou maturidade da argumentação. Deve ser usado apenas como ponto de partida para investigação.

## 3.3. Camada C — Codificação contextual neutra por pregação

A IA analisa uma pregação por vez e deve:

- usar apenas a transcrição e seus metadados;
- seguir o codebook;
- não receber conclusões agregadas anteriores;
- não receber teses como “a igreja é forte em ortodoxia” ou “fraca em prática”;
- não fazer diagnóstico global;
- atribuir scores, classificações, confiança e evidências;
- responder em JSON estritamente validável.

## 3.4. Camada D — Auditoria metodológica

Uma segunda etapa verifica:

- validade estrutural do JSON;
- aderência ao schema;
- evidência obrigatória para scores altos;
- correspondência exata entre campo e evidência;
- presença literal do snippet na transcrição;
- confusão entre menção, densidade e centralidade;
- inferências indevidas;
- inconsistências entre score, comentário e evidência;
- riscos sensíveis sem sustentação textual.

## 3.5. Camada E — Revisão humana

A revisão humana é a camada decisiva para:

- alterar scores;
- aprovar evidências;
- rejeitar inferências;
- resolver sugestões de reparo;
- marcar codificação como revisada;
- autorizar uso em relatórios finais;
- registrar observações pastorais.

## 3.6. Camada F — Dashboard agregado

O dashboard calcula padrões somente depois da codificação individual. Ele pode agregar:

- médias;
- medianas;
- distribuição;
- presença;
- centralidade;
- densidade;
- gaps;
- evolução temporal;
- comparações por série;
- quadrantes;
- contagens e denominadores.

## 3.7. Camada G — Relatório público/presbiterial

Usa linguagem:

- pastoral;
- sóbria;
- institucional;
- verificável;
- orientada a discernimento e trilhas formativas.

Deve priorizar dados revisados por humano.

## 3.8. Camada H — Diagnóstico interno/master

Usa dados agregados já codificados, preferencialmente revisados, para explicitar:

- tensões;
- lacunas;
- contradições;
- riscos pastorais;
- hipóteses fortes;
- possíveis efeitos discursivos;
- recomendações internas.

A linguagem pode ser mais direta, mas a exigência de evidência não é reduzida.

## 3.9. Frase operacional do sistema

> A IA codifica pregações individuais. O dashboard calcula padrões. O diagnóstico interpreta os padrões. A liderança decide pastoralmente.

---

# 4. PROVENIÊNCIA E NÍVEIS DE CONFIANÇA

Toda métrica, evidência, gráfico, card, tabela e relatório deve indicar origem.

## 4.1. Selos canônicos

- `LEXICAL_PRELIMINARY` — sinal lexical preliminar;
- `BIBLICAL_ENGINE` — motor de referências bíblicas;
- `NLP_PRELIMINARY` — resultado estatístico/semântico preliminar;
- `AI_CONTEXTUAL` — codificação contextual por IA ainda não revisada;
- `AI_AUDITED` — codificação aprovada por auditoria automática, mas não humana;
- `HUMAN_REVIEWED` — dado validado por revisor humano;
- `HUMAN_OVERRIDDEN` — dado alterado por humano em relação à IA;
- `MIXED_DATASET` — agregação contendo dados de mais de uma proveniência.

## 4.2. Regras de apresentação

1. Métricas lexicais nunca podem aparecer como diagnóstico final.
2. Dados apenas de IA devem mostrar aviso `Preliminar`.
3. Relatórios públicos devem priorizar `HUMAN_REVIEWED`.
4. Quando houver mistura, o sistema deve mostrar quantos registros são revisados e quantos são preliminares.
5. Toda métrica agregada deve mostrar denominador, por exemplo:
   - `N de 263 pregações importadas`;
   - `N codificadas`;
   - `N revisadas por humano`;
   - `N preliminares`;
   - `N excluídas por qualidade`.
6. Nenhum percentual pode ser apresentado sem explicar o universo de cálculo.

---

# 5. FONTES DE DADOS E INGESTÃO

## 5.1. Backup JSON do NotebookLM

Arquivo de referência:

`A Casa da Rocha-backup-2026-07-10.json`

Campos esperados:

```text
version
exportedAt
notebook.title
sources[].id
sources[].title
sources[].url
sources[].sourceType
sources[].content
```

## 5.2. CSV complementar de metadados

Arquivo de referência:

`casadarocha_ze_bruno_preliminar.csv`

Campos esperados:

```text
data_transmissao
titulo_transmissao
pregador_identificado
link_youtube
duracao
serie_tema
```

## 5.3. Regras de reconciliação

1. Extrair `youtube_id` de toda URL compatível.
2. Priorizar correspondência por `youtube_id`.
3. Usar URL normalizada como segunda chave.
4. Usar título normalizado e similaridade apenas como fallback.
5. Não fazer merge automático quando houver mais de uma correspondência plausível.
6. Criar conflito para revisão quando JSON e CSV divergirem em data, título, pregador ou série.
7. Preservar valores originais e valores normalizados separadamente.
8. Impedir duplicidade por `notebook_source_id`, `youtube_id` ou hash da transcrição, conforme disponibilidade.
9. Permitir reprocessamento sem criar duplicata.
10. Registrar lote, data e versão do importador.

## 5.4. Pipeline de ingestão

1. validar arquivo de entrada;
2. ler metadados globais;
3. iterar sobre `sources[]`;
4. criar ou atualizar fonte;
5. preservar conteúdo integral;
6. calcular caracteres e palavras;
7. extrair YouTube ID;
8. normalizar título;
9. inferir série e número da mensagem;
10. reconciliar CSV;
11. calcular qualidade preliminar da transcrição;
12. marcar status;
13. gerar log de importação;
14. apresentar conflitos ao usuário.

## 5.5. Normalização de séries

Criar tabela/configuração editável para aliases e séries, incluindo inicialmente:

- Meu Caro Amigo;
- Meu Caro Amigo 2;
- Quem é Jesus?;
- A Videira;
- A Última Semana;
- O Caminho da Cruz;
- Do Princípio ao Fim;
- A Vida em Parábolas;
- O Povo da Cruz;
- Juntos no Natal;
- Deus Conosco;
- Mensagens Especiais.

A normalização deve preservar `series_raw`, `series_normalized` e `series_match_method`.

---

# 6. ARQUITETURA TÉCNICA

## 6.1. Stack principal

- Next.js;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- TanStack Table;
- Recharts ou Nivo;
- Prisma ORM;
- SQLite no ambiente local/MVP existente;
- PostgreSQL ou Supabase na evolução de produção;
- Zod para schemas;
- OpenRouter para modelos de IA;
- Docker e Docker Compose para deploy.

## 6.2. Estrutura de pastas recomendada

```text
casa-rocha-dashboard/
  app/
    dashboard/
    sermons/
    sermons/[id]/
    coding/
    coding/attempts/[id]/
    review/
    evidence/
    reports/
    quality/
    settings/
    admin/
      master-diagnosis/
    api/
      imports/
      sermons/
      coding/
      coding/attempts/
      coding/repair/
      coding/repair-suggestions/
      reviews/
      evidence/
      dashboard/
      reports/
      master-diagnosis/
      openrouter/models/
  components/
    charts/
    tables/
    filters/
    sermon/
    coding/
    review/
    evidence/
    reports/
    diagnostics/
    methodology/
    auth/
  lib/
    auth/
    coding/
      prompt.ts
      schema.ts
      validators.ts
      auditPrompt.ts
      repairPrompt.ts
      repairPolicy.ts
    diagnostics/
      masterPrompt.ts
      aggregation.ts
      tensions.ts
      reportSchema.ts
    evidence/
      locator.ts
      validator.ts
      normalization.ts
    openrouter/
      client.ts
      models.ts
      model-presets.ts
    analytics/
      metrics.ts
      gaps.ts
      denominators.ts
      provenance.ts
    imports/
    db.ts
    codebook.ts
    scoring.ts
    parsing.ts
    text-utils.ts
  prisma/
    schema.prisma
    migrations/
  scripts/
    import-notebooklm-backup.ts
    import-metadata-csv.ts
    reconcile-sources.ts
    normalize-sermons.ts
    run-lexical-analysis.ts
    export-csv.ts
    backfill-new-fields.ts
  docs/
    CLAUDE.md
    CODEBOOK.md
    METHODOLOGY.md
    DASHBOARD_SPEC.md
    INSTALL.md
    ROADMAP.md
    CHANGELOG.md
    SECURITY.md
```

## 6.3. Princípio de domínio

Separar os seguintes domínios em services próprios:

- ingestão;
- análise lexical;
- codificação por IA;
- auditoria;
- reparo;
- revisão humana;
- agregação;
- relatório público;
- diagnóstico master;
- autenticação/autorização;
- auditoria de eventos.

Não concentrar todos os fluxos em uma única server action ou route handler.

---

# 7. AUTENTICAÇÃO, AUTORIZAÇÃO E SEGURANÇA

## 7.1. Roles mínimas

```text
VIEWER
REVIEWER
ADMIN
MASTER_ADMIN
```

## 7.2. Permissões sugeridas

### `VIEWER`

- visualizar dashboard público interno;
- abrir pregações e evidências autorizadas;
- gerar exportações não sensíveis, se permitido.

### `REVIEWER`

- tudo de `VIEWER`;
- revisar codificações;
- editar scores e evidências;
- aplicar ou rejeitar sugestões de reparo;
- registrar notas.

### `ADMIN`

- tudo de `REVIEWER`;
- importar dados;
- configurar modelos;
- iniciar lotes de codificação;
- gerenciar codebook e settings operacionais.

### `MASTER_ADMIN`

- tudo de `ADMIN`;
- acessar o `Master Diagnostic View`;
- visualizar snippets sensíveis quando habilitado;
- gerar, revisar e excluir relatórios master;
- consultar logs de acesso master.

## 7.3. Regra de acesso ao diagnóstico master

A rota deve exigir usuário autenticado e:

```text
role === MASTER_ADMIN
OR authenticatedEmail in MASTER_ADMIN_EMAILS
```

Variável sugerida:

```env
MASTER_ADMIN_EMAILS=email1@dominio.com,email2@dominio.com
```

A allowlist não substitui autenticação. Ela apenas autoriza um usuário já autenticado.

## 7.4. Proteções obrigatórias

- middleware de rota;
- verificação server-side na página;
- verificação em todos os endpoints master;
- ausência no menu público;
- menu admin condicional;
- log de acesso permitido e negado;
- proteção contra acesso direto por URL;
- nenhuma métrica sensível exposta em payload público;
- `Cache-Control: no-store` para respostas master;
- aviso de confidencialidade;
- não registrar transcrições completas em logs técnicos;
- nunca persistir `OPENROUTER_API_KEY` em tabela de tentativas.

## 7.5. Resposta para acesso negado

Pode retornar `403` ou página `404` discreta conforme a política do projeto, mas a negação deve ser registrada internamente.

---

# 8. MODELO DE DADOS CANÔNICO

Os nomes podem ser adaptados à convenção já existente, mas os conceitos e relações precisam ser preservados.

## 8.1. `sermons`

```text
id
notebook_source_id
title
normalized_title
series_raw
series_normalized
series_match_method
sermon_number
preacher
preacher_source
date_estimated
date_confidence
year
youtube_url
youtube_id
source_type
duration_estimated
transcript_text
transcript_hash
transcript_char_count
transcript_word_count
transcript_quality
import_status
analysis_status
created_at
updated_at
```

## 8.2. `sermon_analysis`

```text
id
sermon_id
analysis_version
prompt_version
model
analysis_status
review_status
confidence_global
biblical_main_text
biblical_books_cited_json
testament_predominant
sermon_type
discourse_mode
main_theme
secondary_themes_json
doctrine_main
doctrines_secondary_json
pastoral_tone
formative_focus
individual_vs_community_focus
theological_level
language_complexity_score
application_mode
theme_presence
theme_density
summary_3_lines
main_application
possible_formative_gap
needs_human_review
review_reason
sensitivity_level
created_at
updated_at
```

## 8.3. `sermon_scores`

Manter scores existentes e acrescentar os campos novos. Todos devem ser `0–5`, salvo campos categóricos.

```text
id
sermon_id
analysis_id

biblical_health_score
homiletic_exposition_score
biblical_application_score
christocentric_reading_score

orthodoxy_score
trinity_score
theology_proper_score
christology_score
crucicentrism_score
soteriology_score
pneumatology_score
bibliology_score
ecclesiology_score
eschatology_score
anthropology_score
hamartiology_score
sanctification_score
kingdom_theology_score

orthopraxy_score
service_diaconia_score
organic_diaconia_score
institutional_action_score
generosity_score
mission_evangelism_score
discipleship_score
community_mutuality_score
hospitality_score
care_for_poor_score
forgiveness_reconciliation_score
vocation_work_score
family_relationships_score
finance_stewardship_score

spirituality_score
prayer_score
scripture_devotion_score
fasting_score
worship_score
repentance_score
discernment_score
spiritual_disciplines_score

pastoral_health_score
religious_deconstruction_score
contextual_critique_intensity_score
biblical_grounding_of_critique_score
reconstruction_after_critique_score
activation_after_critique_score
discipleship_reconstruction_score
practical_activation_score
healing_wounded_score
sending_healed_score
coresponsibility_score
passivity_risk_score
cynicism_elitism_risk_score
political_idolatry_critique_score

created_at
updated_at
```

## 8.4. Campos categóricos contextuais

Podem ficar em `sermon_analysis`, tabela relacionada ou JSON tipado, conforme o schema atual:

```text
critique_share_estimate
critic_target
critic_tone
healthy_or_demobilizing_critique
political_critique_target
application_mode
discourse_mode
theme_presence
theme_density
```

## 8.5. `sermon_evidence`

```text
id
sermon_id
analysis_id
category
score_field
score_value
evidence_quote
evidence_start_index
evidence_end_index
source_title_snapshot
source_series_snapshot
source_date_snapshot
source_url_snapshot
analytical_comment
confidence
analysis_method
provenance
validation_status
validation_reason
is_sensitive
created_by_type
created_at
updated_at
```

`analysis_method`:

```text
dictionary
regex
tfidf
embedding
ai_coding
ai_repair
human_review
```

## 8.6. `codebook_categories`

```text
id
field_name
label
axis
description
score_0_definition
score_1_definition
score_2_definition
score_3_definition
score_4_definition
score_5_definition
evidence_required_from_score
examples_positive_json
examples_negative_json
methodological_notes
active
version
created_at
updated_at
```

## 8.7. `coding_attempts`

Cada chamada de IA gera uma tentativa imutável.

```text
id
sermon_id
parent_attempt_id
attempt_type
model
provider
status
raw_response_text
extracted_json
parsed_json
validation_issues_json
business_rule_issues_json
evidence_validation_json
openrouter_metadata_json
prompt_version
schema_version
started_at
completed_at
created_by
created_at
```

`attempt_type`:

```text
INITIAL_CODING
RETRY
EVIDENCE_REPAIR
AUDIT
```

`status`:

```text
SUCCESS
FAILED_JSON
FAILED_SCHEMA
FAILED_VALIDATION
FAILED_EVIDENCE_LOCATION
FAILED_OPENROUTER
REPAIRABLE_EVIDENCE_GAP
HUMAN_REVIEW_REQUIRED
```

## 8.8. `coding_repair_suggestions`

Tabela obrigatória para impedir que sugestões de score sejam aplicadas silenciosamente.

```text
id
sermon_id
coding_attempt_id
analysis_id
score_field
original_score
suggested_score
suggestion_reason
missing_evidence_reason
suggested_by_model
prompt_version
status
reviewed_by
reviewed_at
review_note
applied_analysis_version
created_at
updated_at
```

`status`:

```text
PENDING
APPLIED
REJECTED
SUPERSEDED
```

Regras:

- a criação da sugestão não altera `sermon_scores`;
- somente `REVIEWER`, `ADMIN` ou `MASTER_ADMIN` pode aplicar;
- aplicação cria nova versão de análise ou evento de revisão;
- nunca editar silenciosamente a análise original;
- o log deve preservar antes/depois.

## 8.9. `human_review_events`

```text
id
sermon_id
analysis_id
entity_type
entity_id
action
field_name
old_value_json
new_value_json
reason
performed_by
performed_at
```

## 8.10. `master_diagnostic_reports`

```text
id
generated_at
generated_by
filters_json
input_metrics_hash
input_denominator_json
prompt_version
model
hardness_level
report_json
includes_preliminary_data
reviewed_only
includes_lexical_signals
includes_sensitive_snippets
status
notes
created_at
updated_at
```

`status`:

```text
GENERATED
REVIEWED
ARCHIVED
```

## 8.11. `security_audit_logs`

```text
id
user_id
user_email
action
resource_type
resource_id
route
result
metadata_json
ip_hash
user_agent_summary
created_at
```

Ações relevantes:

```text
MASTER_VIEW_ACCESS
MASTER_VIEW_ACCESS_DENIED
MASTER_REPORT_GENERATED
MASTER_REPORT_OPENED
MASTER_SENSITIVE_SNIPPETS_ENABLED
REPAIR_SUGGESTION_APPLIED
SCORE_MANUALLY_CHANGED
```

---

# 9. ESTADOS DO CICLO DE VIDA

## 9.1. Status da pregação

```text
IMPORTED
METADATA_CONFLICT
READY_FOR_CODING
CODING_IN_PROGRESS
CODED_BY_AI
AUDIT_PENDING
AUDIT_APPROVED
AUDIT_REJECTED
HUMAN_REVIEW_PENDING
HUMAN_REVIEWED
EXCLUDED
ERROR
```

## 9.2. Status da análise

```text
DRAFT
AI_PRELIMINARY
AI_AUDITED
FAILED_METHODOLOGY
HUMAN_REVIEW_PENDING
HUMAN_REVIEWED
SUPERSEDED
```

## 9.3. Regra para agregação

Por padrão, o dashboard presbiterial deve usar:

```text
HUMAN_REVIEWED
```

Quando não houver cobertura suficiente, poderá usar `AI_AUDITED` ou `AI_PRELIMINARY`, mas deve:

- informar a proporção;
- marcar os dados como preliminares;
- permitir desligar dados preliminares;
- não misturar visualmente sem legenda.

---

# 10. RÉGUA DE SCORE, PRESENÇA, CENTRALIDADE E DENSIDADE

## 10.1. Escala canônica

```text
0 = ausente ou não identificável
1 = menção muito fraca
2 = presença baixa
3 = presença moderada
4 = presença forte
5 = tema central da pregação
```

## 10.2. Regras gerais

- Não confundir menção com centralidade.
- Uma palavra citada uma vez não sustenta score alto.
- Score 0 significa “não identificado nesta pregação”, não “o pregador nunca ensina isso”.
- Transcrição incompleta ou ruim reduz confiança.
- Score 4 ou 5 exige evidência literal vinculada ao mesmo campo.
- Scores de risco com limiar definido também exigem evidência.
- O comentário analítico não substitui citação literal.

## 10.3. Presença

```ts
themePresence: "absent" | "mentioned" | "developed" | "central";
```

Responde: o tema aparece e em que nível de desenvolvimento?

## 10.4. Densidade

```ts
themeDensity: "none" | "low" | "moderate" | "high";
```

Responde: quanto espaço discursivo aproximado ou densidade textual o tema ocupa?

## 10.5. Centralidade

É representada principalmente pelo score `0–5` e pela relação do tema com a linha argumentativa principal.

## 10.6. Regra de percentuais

Nunca apresentar “X% das pregações falam sobre o tema” sem especificar se o percentual representa:

- presença;
- desenvolvimento;
- centralidade;
- densidade lexical;
- score acima de determinado limiar.

---

# 11. EIXOS E CATEGORIAS DE ANÁLISE

## 11.1. Saúde bíblica e homilética

Perguntas:

- Como a Bíblia está sendo pregada?
- O texto é explicado em contexto?
- O texto funciona como base ou ilustração?
- Há leitura cristocêntrica consistente?
- Há aplicação relacionada ao texto?

Categorias e campos:

- texto bíblico principal;
- livros citados;
- testamento predominante;
- tipo de pregação;
- exposição bíblica;
- leitura cristocêntrica;
- aplicação bíblica.

Tipos de pregação:

```text
expositiva_sequencial
expositiva_isolada
tematica_biblica
doutrinaria
pastoral_devocional
profetica_confrontativa
evangelistica
institucional_eclesiologica
testemunhal
motivacional_terapeutica
hibrida
```

## 11.2. Ortodoxia — crença correta

Categorias:

- Teontologia;
- Trindade;
- Cristologia;
- Crucicentrismo;
- Soteriologia;
- Pneumatologia;
- Bibliologia;
- Eclesiologia;
- Hamartiologia;
- Antropologia teológica;
- Reino de Deus;
- Escatologia;
- Santificação.

## 11.3. Ortopraxia — ação correta

Categorias:

- serviço e diaconia;
- generosidade;
- missão;
- evangelismo;
- discipulado;
- comunhão;
- perdão e reconciliação;
- hospitalidade;
- cuidado dos pobres;
- uso dos dons;
- mordomia;
- vocação e trabalho;
- família e relacionamentos;
- finanças e administração.

## 11.4. Espiritualidade e vida devocional

Categorias:

- oração;
- leitura bíblica pessoal;
- meditação;
- jejum;
- adoração;
- confissão;
- arrependimento;
- dependência de Deus;
- batalha espiritual;
- discernimento;
- disciplinas espirituais.

## 11.5. Comunidade e eclesiologia prática

Categorias:

- igreja como corpo;
- igreja como família;
- igreja como mesa;
- igreja como hospital;
- igreja como escola;
- igreja como missão;
- igreja como auditório;
- povo sacerdotal;
- comunidade de servos;
- liderança servidora;
- pequenos grupos;
- cuidado mútuo;
- dons para edificação.

## 11.6. Missão, evangelismo e presença pública

Categorias:

- Missio Dei;
- missão local;
- missão global;
- evangelismo pessoal;
- testemunho cotidiano;
- apologética;
- justiça e misericórdia;
- presença pública;
- política e Reino;
- hospitalidade missionária.

Separar:

```text
missao_organica
missao_programatica
missao_institucional
missao_transcultural
```

## 11.7. Vida cotidiana

Categorias:

- casamento;
- filhos e criação de filhos;
- solteiros;
- sexualidade;
- finanças familiares;
- dívidas;
- consumo;
- trabalho;
- vocação;
- ética profissional;
- conflitos;
- perdão;
- saúde emocional;
- corpo e mordomia física.

## 11.8. Saúde pastoral: cura, reconstrução, envio e maturidade

Categorias:

- acolhimento dos feridos;
- desconstrução da religião abusiva;
- crítica ao legalismo;
- crítica à culpa e ao medo;
- crítica à barganha;
- crítica ao mercado gospel;
- crítica à liderança autoritária;
- reconstrução discipular;
- ativação prática;
- envio dos curados;
- corresponsabilidade;
- risco de passividade;
- risco de cinismo/elitismo.

---

# 12. CAMPOS CONTEXTUAIS NOVOS E DEFINIÇÕES

## 12.1. Crítica religiosa contextual

```ts
contextualCritiqueIntensityScore: number; // 0–5
critiqueShareEstimate: "none" | "low" | "moderate" | "high" | "dominant";
criticTarget: CriticTarget;
criticTone: CriticTone;
biblicalGroundingOfCritiqueScore: number; // 0–5
reconstructionAfterCritiqueScore: number; // 0–5
activationAfterCritiqueScore: number; // 0–5
healthyOrDemobilizingCritique:
  | "healthy"
  | "potentially_demobilizing"
  | "mixed"
  | "not_identifiable";
```

`contextualCritiqueIntensityScore` mede a presença real da crítica na linha argumentativa inteira, considerando alvo, tom, proporção discursiva, fundamentação, reconstrução e ativação.

### Crítica saudável

Denuncia abuso, legalismo, moralismo, mercantilização da fé, idolatria política ou distorções religiosas, mas reconduz à cruz, graça, comunidade, humildade, serviço, maturidade e missão.

### Crítica potencialmente desmobilizadora

Permanece na denúncia, generaliza igreja/liderança/instituição ou pode produzir suspeita permanente, passividade, cinismo, elitismo teológico ou desengajamento comunitário.

A classificação indica risco discursivo possível; não é acusação de intenção.

## 12.2. Alvo da crítica

```text
abuso_religioso
legalismo
moralismo
mercado_gospel
barganha_financeira
lideranca_abusiva
institucionalismo
clericalismo
ativismo_religioso
politica_religiosa
idolatria_politica
outro
nao_identificavel
```

## 12.3. Tom da crítica

```text
pastoral
profetico
terapeutico
ironico
combativo
academico
desmobilizador
misto
nao_identificavel
```

## 12.4. Idolatria política

```ts
politicalIdolatryCritiqueScore: number; // 0–5
politicalCritiqueTarget:
  | "partidarismo_religioso"
  | "messianismo_politico"
  | "nacionalismo_religioso"
  | "teologia_do_poder"
  | "confusao_igreja_estado"
  | "idolatria_de_lider_politico"
  | "uso_eleitoral_da_fe"
  | "outro"
  | "nao_identificavel";
```

Não classificar a pregação como direita, esquerda ou centro. Medir apenas o fenômeno definido no codebook.

## 12.5. Diaconia orgânica versus ação institucional

```ts
organicDiaconiaScore: number; // 0–5
institutionalActionScore: number; // 0–5
```

`organicDiaconiaScore` mede serviço cotidiano, mutualidade, amor ao próximo, bacia e toalha, repartir pão e vida cristã como serviço.

`institutionalActionScore` mede projetos, ministérios, equipes, escalas, grupos, trilhas, voluntariado estruturado, processos de engajamento e mecanismos práticos de participação.

Não atribuir score institucional alto apenas porque a mensagem fala em servir.

Métrica derivada:

```ts
diaconalGap = organicDiaconiaScore - institutionalActionScore;
```

## 12.6. Ser, fazer e método

```ts
applicationMode:
  | "identity_being"
  | "generic_exhortation"
  | "concrete_practice"
  | "structured_method"
  | "balanced"
  | "not_identifiable";
```

- `identity_being`: identidade em Cristo sem prática concreta;
- `generic_exhortation`: chamado amplo sem caminho aplicável;
- `concrete_practice`: ação reconhecível;
- `structured_method`: passos, trilha, grupo, equipe, formação ou mecanismo;
- `balanced`: identidade e prática integradas.

## 12.7. Modo discursivo

```ts
discourseMode:
  | "expository"
  | "doctrinal"
  | "pastoral"
  | "therapeutic"
  | "prophetic"
  | "apologetic"
  | "systemic_critique"
  | "reconstructive_formative"
  | "devotional"
  | "mixed";
```

`sermonType` e `discourseMode` são campos distintos.

---

# 13. MOTOR DE ANÁLISE EM CAMADAS

## 13.1. Dicionários e regras

Criar dicionários versionados por tema. Exemplos iniciais:

### Cruz e soteriologia

```text
cruz, sacrifício, sangue, expiação, graça, perdão, salvação,
novo nascimento, morrer para si, velho homem, ressurreição,
justificação, redenção, reconciliação
```

### Cristologia e Trindade

```text
Cristo, Jesus, Logos, Verbo, Filho, Pai, Espírito Santo,
Trindade, encarnação, divindade, humanidade de Cristo,
Senhorio de Cristo
```

### Desconstrução religiosa

```text
sistema religioso, religião, legalismo, barganha, culpa, medo,
mercado gospel, evangelho de Judas, Mamon, pastor como guru,
líder totalitário, abuso espiritual, manipulação, ritual vazio,
fariseu, clericalismo
```

### Serviço, diaconia e eclesiologia

```text
servir, servo, diaconia, bacia e toalha, lavar os pés, corpo,
dons, mutualidade, uns aos outros, comunidade, mesa,
igreja como corpo, cuidado mútuo
```

### Ortopraxia estruturada

```text
voluntariado, participar, servir na igreja, grupo, pequeno grupo,
discipulado, mentoria, cuidar de alguém, evangelizar, oração diária,
ler a Bíblia, jejum, finanças, dívida, casamento, filhos, família,
trabalho, vocação, conflito, perdão prático
```

## 13.2. NLP estatístico

Permitir progressivamente:

- frequência por 10.000 palavras;
- TF-IDF;
- n-grams;
- entidades;
- similaridade semântica;
- embeddings;
- clustering;
- comparação por período e série.

## 13.3. Limites do NLP

- O NLP encontra sinais, não centralidade teológica definitiva.
- Similaridade semântica não substitui revisão textual.
- Snippet candidato não é automaticamente evidência aprovada.
- O resultado deve manter `analysis_method` e versão do dicionário/modelo.

---
# 14. PROMPT PRINCIPAL DE CODIFICAÇÃO NEUTRA

Arquivo sugerido:

`lib/coding/prompt.ts`

## 14.1. Princípios obrigatórios do prompt

O prompt deve instruir a IA a:

- analisar apenas a pregação fornecida;
- não usar conhecimento externo;
- não inferir intenção, caráter ou motivação;
- não concluir sobre a igreja como um todo;
- não usar hipóteses agregadas anteriores;
- diferenciar menção, desenvolvimento, densidade e centralidade;
- usar o codebook vigente;
- responder apenas JSON válido;
- atribuir confiança baixa quando a transcrição estiver incompleta ou ambígua;
- fornecer citação literal para todo score que atinja o limiar obrigatório;
- usar exatamente o nome do campo de score no vínculo da evidência.

## 14.2. Regra de evidência no prompt inicial

No processo inicial de codificação, a IA deve ser orientada:

> Se não houver citação literal suficiente para sustentar score 4 ou 5, não atribua score 4 ou 5 na resposta inicial.

Essa regra não entra em conflito com a proibição de redução automática no reparo. Na codificação inicial, a IA ainda está formulando sua análise. No reparo, a análise já falhou e não pode ser alterada silenciosamente para passar.

## 14.3. Texto-base sugerido

```text
Você é um pesquisador de homilética empírica, teologia pastoral e análise de conteúdo.

Analise somente a pregação fornecida.

Regras obrigatórias:
1. Não julgue pessoalmente o pregador.
2. Não infira intenção, caráter, motivação ou estado espiritual.
3. Não use conhecimento externo à transcrição.
4. Não faça conclusão global sobre a igreja.
5. Não confunda menção com centralidade.
6. Use score 0 quando o tema estiver ausente ou não identificável.
7. Use confiança baixa quando a transcrição for insuficiente ou ambígua.
8. Para qualquer score 4 ou 5, crie evidência literal vinculada ao mesmo campo.
9. O valor de evidencias[].campo deve ser exatamente igual ao nome do score.
10. A citação precisa existir literalmente na transcrição.
11. Não transforme sinal lexical em conclusão contextual.
12. Responda somente JSON válido conforme o schema.

Escala:
0 = ausente ou não identificável
1 = menção muito fraca
2 = presença baixa
3 = presença moderada
4 = presença forte
5 = tema central da pregação
```

## 14.4. Conteúdo proibido no prompt de codificação

Não inserir frases como:

- “A igreja é gigante em ortodoxia.”
- “A ortopraxia é quase zero.”
- “O Zé recusa métodos.”
- “O púlpito é traumatizado.”
- “A igreja tem vazio pragmático.”
- “O povo é passivo.”
- “A cura dos feridos é maior que o envio.”

Essas formulações podem ser hipóteses de diagnóstico agregado, nunca premissas de codificação individual.

---

# 15. SCHEMA DE SAÍDA DA CODIFICAÇÃO

O schema exato deve acompanhar o banco existente, mas precisa conter, no mínimo:

```json
{
  "sermonId": "",
  "metadata": {
    "title": "",
    "series": "",
    "year": null,
    "biblicalMainText": "",
    "biblicalBooksCited": [],
    "sermonType": "",
    "discourseMode": ""
  },
  "classification": {
    "mainTheme": "",
    "secondaryThemes": [],
    "mainDoctrine": "",
    "secondaryDoctrines": [],
    "applicationMode": "not_identifiable",
    "themePresence": "absent",
    "themeDensity": "none",
    "criticTarget": "nao_identificavel",
    "criticTone": "nao_identificavel",
    "critiqueShareEstimate": "none",
    "healthyOrDemobilizingCritique": "not_identifiable",
    "politicalCritiqueTarget": "nao_identificavel"
  },
  "scores": {
    "biblicalHealthScore": 0,
    "homileticExpositionScore": 0,
    "orthodoxyScore": 0,
    "orthopraxyScore": 0,
    "spiritualityScore": 0,
    "ecclesiologyScore": 0,
    "missionEvangelismScore": 0,
    "pastoralHealthScore": 0,
    "contextualCritiqueIntensityScore": 0,
    "biblicalGroundingOfCritiqueScore": 0,
    "reconstructionAfterCritiqueScore": 0,
    "activationAfterCritiqueScore": 0,
    "organicDiaconiaScore": 0,
    "institutionalActionScore": 0,
    "politicalIdolatryCritiqueScore": 0,
    "passivityRiskScore": 0,
    "cynicismElitismRiskScore": 0
  },
  "evidencias": [
    {
      "campo": "orthodoxyScore",
      "citacao": "trecho literal da transcrição",
      "comentario": "explicação breve da relação entre o trecho e o score",
      "confidence": "alta"
    }
  ],
  "summary3Lines": "",
  "mainApplication": "",
  "possibleFormativeGap": "",
  "confidenceGlobal": "alta | média | baixa",
  "needsHumanReview": false,
  "reviewReason": null,
  "sensitivityLevel": "baixa | média | alta"
}
```

O schema deve listar todos os scores oficiais. O exemplo acima é reduzido apenas para mostrar a estrutura.

---

# 16. VALIDAÇÃO DE EVIDÊNCIAS

## 16.1. Evidências obrigatórias

Exigir evidência quando:

- qualquer score for `4` ou `5`;
- `contextualCritiqueIntensityScore >= 4`;
- `passivityRiskScore >= 3`;
- `cynicismElitismRiskScore >= 3`;
- `politicalIdolatryCritiqueScore >= 3`;
- `reconstructionAfterCritiqueScore >= 3`;
- `institutionalActionScore >= 3`;
- outros campos sensíveis definidos no codebook atingirem seu limiar.

## 16.2. Correspondência entre campo e evidência

Para cada score sujeito a evidência:

```text
evidencias[].campo === nome exato do score
```

Não aceitar aliases, labels traduzidos ou nomes aproximados.

## 16.3. Literalidade

A evidência deve ser um trecho literal da transcrição.

Validação ideal:

1. tentar correspondência exata no texto bruto;
2. se falhar por diferenças de quebra de linha ou espaços, localizar usando normalização apenas para busca;
3. ao localizar, substituir o valor fornecido pela IA pelo recorte exato de `transcript_text`;
4. salvar `start_index` e `end_index`;
5. rejeitar quando não houver correspondência inequívoca.

A normalização pode ajudar a localizar, mas a evidência persistida deve ser o trecho exato da fonte.

## 16.4. Reuso de evidência

Uma mesma citação pode sustentar mais de um campo, mas deve gerar vínculos separados e comentários específicos. Não usar uma evidência genérica para validar vários scores sem relação explícita.

## 16.5. Evidência insuficiente

A evidência deve ser rejeitada quando:

- não estiver na transcrição;
- estiver truncada de modo a alterar o sentido;
- não sustentar o campo indicado;
- apenas repetir o tema sem demonstrar centralidade;
- for comentário da IA em vez de citação;
- pertencer a outra pregação;
- contiver paráfrase não marcada como tal.

## 16.6. Resultado da validação

Cada evidência deve receber:

```text
ACCEPTED
REJECTED_NOT_FOUND
REJECTED_FIELD_MISMATCH
REJECTED_SEMANTIC_MISMATCH
REJECTED_SOURCE_MISMATCH
NEEDS_HUMAN_REVIEW
```

---

# 17. AUDITORIA AUTOMÁTICA DA CODIFICAÇÃO

Arquivo sugerido:

`lib/coding/auditPrompt.ts`

## 17.1. Entrada

- título;
- série;
- data/ano;
- transcrição;
- JSON de codificação;
- resultado da validação determinística;
- versão do codebook.

## 17.2. Saída

```json
{
  "auditStatus": "approved | needs_adjustment | rejected",
  "issues": [
    {
      "code": "HIGH_SCORE_WITHOUT_EVIDENCE",
      "field": "orthodoxyScore",
      "message": "",
      "severity": "high"
    }
  ],
  "suggestedCorrections": {},
  "needsHumanReview": true,
  "reviewReason": "",
  "confidenceAfterAudit": "alta | média | baixa"
}
```

## 17.3. Verificações

- score 4/5 sem evidência;
- risco sensível sem evidência;
- evidência inexistente;
- campo de evidência divergente;
- menção tratada como centralidade;
- crítica analisada apenas por léxico;
- comentário que julga intenção;
- conclusão global indevida;
- lacuna formativa não sustentada;
- score contraditório com comentário;
- transcrição insuficiente;
- possível necessidade de revisão humana.

## 17.4. Limite da auditoria

A auditoria pode apontar correções, mas não pode modificar diretamente a análise persistida.

---

# 18. REGRA DE REPARO AUTOMÁTICO — VERSÃO DEFINITIVA

Arquivo sugerido:

- `lib/coding/repairPrompt.ts`
- `lib/coding/repairPolicy.ts`
- `app/api/coding/repair/route.ts`

## 18.1. Objetivo do reparo

Recuperar respostas em que a IA produziu uma análise plausível, mas falhou em fornecer ou localizar evidência literal obrigatória.

## 18.2. Ações permitidas à IA

A IA pode:

- reler a transcrição;
- procurar trechos literais que sustentem o score já atribuído;
- corrigir o vínculo `campo` da evidência quando o trecho já sustentava o score;
- retornar offsets ou contexto para localização;
- sugerir alteração de score em estrutura separada e não aplicada.

## 18.3. Ações proibidas à IA

A IA não pode, dentro do fluxo automático:

- reduzir score e salvar;
- aumentar score e salvar;
- alterar classificação sensível e salvar;
- apagar o registro da falha anterior;
- substituir a tentativa original;
- marcar a análise como revisada por humano;
- relaxar regras de validação.

## 18.4. Fluxo A — Evidência localizada

1. Usuário clica em `Reparar evidência com IA` ou fluxo automático autorizado inicia tentativa.
2. Sistema cria `coding_attempt` do tipo `EVIDENCE_REPAIR`.
3. Envia à IA:
   - transcrição;
   - output anterior;
   - campos sem evidência;
   - scores originais;
   - regras de literalidade.
4. A IA retorna apenas evidências candidatas, preservando os scores.
5. O sistema localiza cada trecho na transcrição.
6. O sistema substitui o texto candidato pelo recorte literal exato e registra offsets.
7. O sistema reexecuta toda a validação.
8. Se passar sem mudança de score:
   - cria nova versão da análise ou completa a versão pendente conforme arquitetura existente;
   - marca `repaired_by_ai = true` ou proveniência `AI_REPAIR`;
   - mantém vínculo com a tentativa original;
   - registra data, modelo e prompt version.
9. A interface informa que a falha foi reparada por evidência, não por mudança de score.

## 18.5. Fluxo B — Evidência não localizada

1. A tentativa permanece `FAILED_METHODOLOGY` ou `REPAIRABLE_EVIDENCE_GAP` sem validação final.
2. Nenhum score é alterado.
3. Nenhuma codificação é salva como aprovada.
4. O usuário vê:

> A IA atribuiu score alto, mas não encontrou evidência literal suficiente para sustentá-lo.

5. O sistema oferece:
   - abrir transcrição;
   - revisar score manualmente;
   - criar sugestão de reparo;
   - tentar novamente com outro modelo;
   - rejeitar a análise e recodificar.

## 18.6. Fluxo C — Sugestão de alteração de score

A IA pode retornar, em payload separado:

```json
{
  "scoreSuggestions": [
    {
      "field": "institutionalActionScore",
      "originalScore": 4,
      "suggestedScore": 2,
      "reason": "Não foi encontrada evidência literal de caminho institucional estruturado."
    }
  ]
}
```

Regras:

- armazenar em `coding_repair_suggestions`;
- status inicial `PENDING`;
- mostrar em aba `Sugestões de reparo`;
- não modificar análise atual;
- botão `Aplicar sugestão` exige usuário autorizado;
- botão `Rejeitar sugestão` exige registro de decisão;
- aplicar cria evento de revisão e nova versão da análise;
- registrar `reviewed_by`, `reviewed_at`, `old_value`, `new_value` e nota.

## 18.7. Prompt de reparo sugerido

```text
Você recebeu uma análise que falhou porque um ou mais scores altos não têm evidência literal validada.

Sua tarefa principal é localizar na transcrição evidências literais que sustentem os scores originais.

Regras:
1. Não altere scores no objeto de análise.
2. Não invente citações.
3. A citação deve existir literalmente na transcrição.
4. O campo da evidência deve ser exatamente igual ao nome do score.
5. Retorne apenas evidências candidatas para os campos listados.
6. Se não encontrar evidência suficiente, marque evidenceFound=false.
7. Você pode incluir uma sugestão de score em scoreSuggestions, mas ela será apenas uma sugestão humana não aplicada.
8. Não apresente a sugestão como correção salva.
9. Responda somente JSON válido.
```

## 18.8. Critérios de aceite do reparo

- nenhum teste permite alteração automática de score;
- reparo por evidência preserva score original;
- evidência precisa ser literal e validada;
- sugestão aparece sem alterar banco de scores;
- aplicação exige clique humano;
- todo evento é auditável;
- tentativa original permanece disponível.

---

# 19. AUDITORIA E TRANSPARÊNCIA DAS TENTATIVAS DE IA

## 19.1. Regra de persistência

Cada clique em `Analisar`, `Tentar novamente`, `Auditar` ou `Reparar evidência` cria nova tentativa. Nunca sobrescrever tentativas anteriores.

Salvar antes da validação:

- resposta bruta;
- JSON extraído;
- JSON parseado quando possível;
- erro de parsing;
- erros Zod;
- regras de negócio violadas;
- resultado de localização de evidência;
- metadata de uso retornada pelo provedor;
- modelo;
- versão do prompt;
- timestamps.

Nunca salvar chave de API.

## 19.2. Interface `Ver resposta da IA`

Na lista de falhas e no histórico da pregação, criar modal, drawer ou página com abas:

### Resumo da falha

- pregação;
- modelo;
- data/hora;
- attempt type;
- status;
- etapa em que falhou;
- mensagem amigável.

### Output bruto

- texto completo;
- botão copiar;
- indicação de truncamento, se houver.

### JSON extraído

- JSON formatado;
- campos problemáticos destacados;
- opção de copiar.

### Regras violadas

- lista completa;
- código da regra;
- campo;
- score;
- severidade;
- explicação.

### Evidências

- evidências fornecidas;
- encontradas literalmente;
- aceitas;
- rejeitadas;
- motivo da rejeição;
- offsets quando aceitas.

### Sugestões de reparo

- campo;
- score original;
- score sugerido;
- justificativa;
- status;
- botões de decisão humana.

## 19.3. Mensagens amigáveis

### Score alto sem evidência

> A IA atribuiu score alto, mas não forneceu evidência textual obrigatória. O sistema bloqueou a gravação para evitar uma conclusão sem base literal.

### Evidência não localizada

> A IA forneceu uma citação, mas o trecho não foi localizado literalmente na transcrição.

### Falha de JSON

> A IA respondeu, mas o conteúdo não pôde ser interpretado como JSON válido.

### Falha de schema

> O JSON foi lido, mas contém campos ausentes, tipos inválidos ou valores fora da régua permitida.

### Falha metodológica preservada

> A análise permanece registrada como tentativa falha. Nenhum score foi alterado automaticamente.

## 19.4. Ações disponíveis

- `Ver resposta da IA`;
- `Abrir pregação`;
- `Tentar novamente`;
- `Reparar evidência com IA`;
- `Revisar manualmente`;
- `Descartar como codificação válida`;
- `Comparar tentativas`.

---

# 20. REVISÃO HUMANA

## 20.1. Tela de revisão

A tela deve permitir editar:

- metadados inferidos;
- texto bíblico principal;
- tipo de pregação;
- modo discursivo;
- tema central;
- temas secundários;
- doutrina principal;
- scores;
- classificações contextuais;
- evidências;
- confiança;
- lacuna formativa;
- sensibilidade;
- necessidade de revisão adicional.

## 20.2. Regras de mudança

- toda alteração de score deve gerar evento de revisão;
- evidência alterada deve preservar valor anterior no histórico;
- aplicação de sugestão deve ser distinguida de edição manual livre;
- usuário deve informar justificativa para mudança de score sensível;
- marcar quem revisou e quando;
- revisão humana não apaga tentativa da IA;
- revisão pode aprovar, rejeitar ou substituir dados.

## 20.3. Gatilhos de revisão obrigatória

Marcar `needsHumanReview = true` quando:

- `contextualCritiqueIntensityScore >= 4`;
- crítica for classificada como potencialmente desmobilizadora;
- `passivityRiskScore >= 3`;
- `cynicismElitismRiskScore >= 3`;
- `politicalIdolatryCritiqueScore >= 4`;
- confiança global for baixa;
- transcrição tiver qualidade baixa;
- houver evidência insuficiente;
- houver inferência sensível;
- auditoria detectar inconsistência;
- houver sugestão de alteração de score pendente.

---

# 21. SELETOR DE MODELOS OPENROUTER

## 21.1. Problema a resolver

O usuário não deve precisar memorizar IDs técnicos de modelos.

## 21.2. UI

Substituir input simples por combobox pesquisável com:

- nome amigável;
- ID técnico;
- provedor;
- preço estimado de input e output;
- janela de contexto;
- disponibilidade;
- tags;
- indicação de modelo recomendado;
- modo avançado para ID manual.

Agrupar por:

- Anthropic;
- OpenAI;
- Google;
- DeepSeek;
- Meta/Llama;
- Mistral;
- Qwen;
- Outros.

Tags possíveis:

```text
melhor_qualidade
economico
rapido
contexto_longo
experimental
recomendado_para_codificacao
recomendado_para_reparo
recomendado_para_relatorio
```

## 21.3. Endpoint

```http
GET /api/openrouter/models
```

Responsabilidades:

- consultar a API usando `OPENROUTER_API_KEY`;
- normalizar resposta;
- cachear por período configurável;
- ocultar modelos indisponíveis, se configurado;
- usar fallback local quando a API falhar;
- não devolver segredo ao cliente.

## 21.4. Fallback

Arquivo:

`lib/openrouter/model-presets.ts`

Não codificar a lista como verdade permanente. Os presets são fallback e devem informar que disponibilidade e preços podem mudar.

## 21.5. Persistência de preferência

Salvar último modelo por usuário ou por função:

- codificação;
- auditoria;
- reparo;
- relatório público;
- relatório master.

Pode usar `app_settings`, preferências do usuário ou `localStorage` para UX, mas configurações críticas devem ser server-side.

## 21.6. Texto didático

> Modelos mais fortes tendem a interpretar melhor contexto, tom, ironia, fundamentação bíblica e linha argumentativa. Modelos econômicos podem servir para triagem, mas exigem revisão humana mais cuidadosa.

---
# 22. ARQUITETURA DE INFORMAÇÃO DO DASHBOARD

A estrutura pode aproveitar as rotas existentes, mas deve cobrir as seguintes áreas funcionais.

## 22.1. Página — Visão geral

Cards:

- total de pregações;
- total de séries;
- anos cobertos;
- total importado;
- total codificado;
- total auditado;
- total revisado;
- total com falha;
- total pendente;
- confiança média;
- principais temas;
- principais lacunas preliminares.

Gráficos:

- pregações por ano;
- pregações por série;
- status do pipeline;
- distribuição por tipo de pregação;
- cobertura de revisão;
- proveniência dos dados usados.

## 22.2. Página — Acervo e fontes

Tabela:

- título;
- série;
- pregador;
- data/ano;
- URL;
- tipo de fonte;
- qualidade da transcrição;
- status de importação;
- status de análise;
- status de revisão;
- confiança.

Ações:

- busca global;
- filtros;
- abrir pregação;
- abrir YouTube;
- reprocessar fonte;
- resolver conflito de metadados;
- exportar dados selecionados.

## 22.3. Página — Pregação individual

Mostrar:

- título;
- série;
- data;
- link original;
- transcrição completa;
- metadados;
- resumo;
- texto bíblico;
- temas;
- doutrinas;
- scores;
- classificações contextuais;
- evidências;
- comentários;
- confiança;
- proveniência;
- histórico de tentativas;
- histórico de revisão.

A transcrição deve destacar snippets e permitir navegar do score até o trecho.

## 22.4. Página — Bíblia e homilética

Gráficos:

- livros bíblicos mais utilizados;
- Antigo versus Novo Testamento;
- tipos de pregação;
- séries expositivas;
- textos recorrentes;
- exposição bíblica média;
- leitura cristocêntrica;
- aplicação bíblica.

## 22.5. Página — Dieta teológica e ortodoxia

- ranking doutrinário;
- radar doutrinário;
- doutrina por ano;
- doutrina por série;
- heatmap doutrina × ano;
- presença, centralidade e densidade separadas.

## 22.6. Página — Ortopraxia

- serviço;
- generosidade;
- missão;
- discipulado;
- família;
- trabalho;
- dinheiro;
- perdão;
- hospitalidade;
- aplicação prática por ano e série;
- chamados concretos;
- métodos estruturados.

## 22.7. Página — Ortodoxia versus ortopraxia

Scatter plot:

- eixo X: ortodoxia;
- eixo Y: ortopraxia;
- ponto: pregação;
- cor/forma: proveniência ou série, sem criar interpretação acusatória.

Quadrantes:

1. alta ortodoxia / alta ortopraxia;
2. alta ortodoxia / baixa ortopraxia;
3. baixa ortodoxia / alta ortopraxia;
4. baixa ortodoxia / baixa ortopraxia.

Mostrar limiar utilizado e permitir alteração do critério estatístico.

## 22.8. Página — Espiritualidade

- oração;
- leitura bíblica pessoal;
- disciplinas;
- arrependimento;
- dependência de Deus;
- discernimento;
- santidade;
- exortação devocional versus método devocional.

## 22.9. Página — Comunidade e corpo

- igreja como corpo;
- família;
- mesa;
- hospital;
- auditório;
- dons;
- mutualidade;
- liderança servidora;
- cuidado;
- pequenos grupos;
- diaconia orgânica versus ação institucional.

## 22.10. Página — Missão, evangelismo e presença pública

- missão orgânica;
- missão programática;
- missão institucional;
- missão transcultural;
- evangelismo;
- apologética;
- justiça e misericórdia;
- presença pública;
- crítica à idolatria política.

## 22.11. Página — Vida cotidiana

- casamento;
- filhos;
- família;
- sexualidade;
- trabalho;
- vocação;
- finanças;
- dívida;
- consumo;
- conflitos;
- saúde emocional;
- corpo.

## 22.12. Página — Crítica, desconstrução, reconstrução e envio

- sinalizador lexical de crítica religiosa;
- crítica contextual;
- alvo;
- tom;
- fundamentação bíblica;
- reconstrução;
- ativação;
- acolhimento dos feridos;
- envio dos curados;
- corresponsabilidade;
- passividade;
- cinismo/elitismo.

## 22.13. Página — Lacunas formativas

Tabela:

- tema;
- presença;
- centralidade;
- densidade;
- score médio;
- número revisado;
- evidências;
- contraevidências;
- nível de confiança;
- trilha sugerida;
- status de validação pastoral.

Trilhas possíveis:

- grupos de cuidado;
- curso de oração;
- trilha de voluntariado;
- formação de discipuladores;
- aconselhamento financeiro;
- formação para família;
- missão local;
- discipulado básico;
- dons e serviço.

As trilhas são recomendações, não conclusões automáticas.

## 22.14. Página — Evidências

Definida detalhadamente na seção 25.

## 22.15. Página — Codificação

- fila de pregações;
- seleção individual ou em lote;
- modelo;
- custo estimado;
- status;
- início da análise;
- tentativas;
- falhas;
- reparo por evidência;
- revisão.

## 22.16. Página — Qualidade

- transcrições ruins;
- evidências rejeitadas;
- codificações falhas;
- sugestões pendentes;
- análises com baixa confiança;
- cobertura de revisão;
- distribuição de modelos;
- taxa de sucesso por modelo e prompt version.

## 22.17. Página — Relatórios

Separar:

- relatórios públicos/presbiteriais;
- histórico de relatórios;
- filtros e denominadores;
- status de revisão;
- sem acesso ao master para usuário não autorizado.

## 22.18. Página — Master Diagnostic View

Definida detalhadamente nas seções 29 a 35.

---

# 23. FILTROS GLOBAIS

Aplicar, quando pertinente:

- período;
- ano;
- série;
- pregador;
- tipo de pregação;
- modo discursivo;
- eixo;
- tema;
- doutrina;
- score mínimo/máximo;
- confiança;
- status de análise;
- status de revisão;
- proveniência;
- incluir/excluir dados preliminares;
- qualidade mínima de transcrição.

Os filtros devem atualizar denominador e persistir na URL quando possível.

---

# 24. GRÁFICOS, CARDS E MÉTRICAS OBRIGATÓRIAS

## 24.1. Dieta teológica

Preferir:

- barras por score médio;
- matriz presença × centralidade;
- treemap por densidade;
- heatmap por ano/série.

Não usar pie/donut como única representação, pois temas coexistem.

## 24.2. Linha do tempo

Mostrar evolução anual de:

- cruz;
- graça;
- crítica religiosa;
- comunidade;
- serviço;
- missão;
- família;
- oração;
- discipulado;
- finanças;
- trabalho.

Separar contagem lexical e score contextual.

## 24.3. Desconstrução versus reconstrução

Comparar:

- `contextualCritiqueIntensityScore`;
- `reconstructionAfterCritiqueScore`;
- `activationAfterCritiqueScore`.

Regras derivadas sugeridas:

```text
Crítica forte sem reconstrução:
contextualCritiqueIntensityScore >= 4
AND reconstructionAfterCritiqueScore <= 2

Crítica com reconstrução e ativação:
contextualCritiqueIntensityScore >= 3
AND reconstructionAfterCritiqueScore >= 3
AND activationAfterCritiqueScore >= 2
```

Esses rótulos devem ser apresentados como classificação operacional, não julgamento definitivo.

## 24.4. Acolhimento versus envio

Comparar:

- `healingWoundedScore`;
- `sendingHealedScore`;
- `coresponsibilityScore`;
- `passivityRiskScore`.

## 24.5. Diaconia orgânica versus ação institucional

Mostrar:

- médias;
- distribuição;
- gap;
- evolução temporal;
- comparação por série;
- pregações extremas nos dois sentidos.

## 24.6. Ser versus fazer versus método

Distribuição de `applicationMode`:

- identidade/ser;
- exortação genérica;
- prática concreta;
- método estruturado;
- equilíbrio;
- não identificável.

## 24.7. Crítica política

- média anual;
- distribuição de alvos;
- quantidade com score acima do limiar;
- snippets;
- revisão humana.

## 24.8. Fila de revisão

Colunas:

- título;
- série;
- ano;
- motivo;
- sensibilidade;
- scores críticos;
- evidências;
- sugestão pendente;
- status;
- responsável.

---

# 25. DRILL-DOWN E PAINEL DE EVIDÊNCIAS

## 25.1. Regra de ouro

> Nenhum dado pode ficar isolado da fonte.

## 25.2. Drill-down

Ao clicar em card, barra, ponto, célula, linha ou categoria, abrir:

- lista de pregações que compõem o dado;
- título;
- série;
- data;
- link;
- score;
- proveniência;
- status de revisão;
- snippet literal;
- confiança;
- botão para transcrição;
- botão para vídeo.

## 25.3. Página de evidências

Filtros:

- período;
- ano;
- série;
- campo;
- score;
- tema;
- método de análise;
- confiança;
- validação;
- revisado/não revisado;
- sensibilidade;
- precisa de revisão.

Colunas:

```text
Título
Série
Ano/Data
Link/Origem
Campo analisado
Score
Snippet literal
Offsets
Comentário
Método
Proveniência
Confiança
Validação
Revisado?
Precisa revisão?
```

## 25.4. Integridade de fonte

O snippet deve preservar snapshot de título, série, data e URL, mas o sistema deve sempre preferir a relação com o registro atual da pregação.

---

# 26. HOME INTRODUTÓRIA E DIDÁTICA

Adicionar antes dos gráficos um bloco recolhível:

## Sobre este dashboard

> Este dashboard é uma ferramenta de discernimento pastoral e análise teológica criada para examinar a trajetória de ensino da igreja A Casa da Rocha ao longo dos anos.
>
> Ele não substitui o discernimento espiritual da liderança, nem transforma pregações em simples números. Sua função é organizar evidências, revelar padrões e ajudar o presbitério a enxergar a dieta formativa da comunidade: temas recorrentes, ênfases teológicas, presença bíblica, equilíbrio entre doutrina e prática, caminhos de discipulado e possíveis lacunas formativas.
>
> O sistema combina transcrições e metadados, sinais automáticos, análise contextual por IA, auditoria metodológica e revisão humana. A revisão humana deve ser a camada decisiva para conclusões pastorais.
>
> Os dados devem ser lidos como hipóteses verificáveis, não como vereditos automáticos. Cada gráfico deve informar fonte, denominador e nível de validação.

## Como ler este dashboard

- **Lexical preliminar:** encontra vocabulário, não intenção ou contexto.
- **Motor bíblico:** detecta referências e padrões de uso bíblico.
- **NLP preliminar:** encontra padrões estatísticos ou semânticos.
- **IA contextual:** interpreta a pregação inteira segundo rubricas.
- **Auditado por IA:** passou por verificação metodológica automática.
- **Revisado por humano:** foi validado manualmente.

Nota fixa:

> Importante: este dashboard não produz diagnóstico espiritual automático. Ele organiza evidências para apoiar discernimento pastoral responsável.

Requisitos:

- visual sóbrio;
- responsivo;
- recolher/expandir;
- estado persistido no navegador;
- tooltip no título;
- acessibilidade.

---

# 27. TOOLTIPS METODOLÓGICOS

Criar componente reutilizável:

`HelpTooltip` ou `MethodologyTooltip`

Props sugeridas:

```ts
title
question
source
methodology
interpretation
limitations
example
variant
```

Cada tooltip deve explicar:

- o que a métrica mede;
- qual pergunta responde;
- origem dos dados;
- método de cálculo;
- denominador;
- limitações;
- interpretação correta;
- proveniência;
- necessidade ou não de revisão humana.

Aplicar em:

- Home;
- cards;
- gráficos;
- abas;
- tabelas;
- codificação;
- qualidade;
- revisão;
- evidências;
- relatórios;
- master diagnosis.

Acessibilidade:

- `aria-label`;
- foco por teclado;
- abertura por clique/tap;
- fechamento por ESC;
- fechamento por clique externo;
- não depender apenas de hover;
- comportamento adequado em mobile.

---

# 28. RELATÓRIOS PÚBLICOS/PRESBITERIAIS

## 28.1. Tipos

- resumo executivo;
- relatório por série;
- relatório por tema;
- relatório por período;
- relatório de lacunas formativas;
- relatório de evidências.

## 28.2. Estrutura mínima

- filtros aplicados;
- universo total;
- quantidade codificada;
- quantidade revisada;
- quantidade preliminar;
- limitações;
- principais forças;
- padrões;
- oportunidades formativas;
- contraevidências;
- recomendações;
- links ou referências para drill-down.

## 28.3. Linguagem

Preferir:

- ênfase observada;
- presença baixa nos dados revisados;
- baixa centralidade;
- oportunidade de formação complementar;
- hipótese pastoral;
- achado a validar;
- trilha sugerida.

Evitar:

- “o pregador falha”;
- “a igreja é passiva”;
- “o púlpito nunca ensina”;
- “o povo está acomodado”;
- “isso prova intenção”.

## 28.4. Dados preliminares

Quando incluídos:

- marcar no cabeçalho;
- separar resultados;
- informar proporção;
- evitar recomendação definitiva baseada apenas neles.

---

# 29. MASTER DIAGNOSTIC VIEW — OBJETIVO E ESCOPO

Criar área interna protegida com nome de interface:

> Modo Diagnóstico Interno

Nome técnico sugerido:

`Master Diagnostic View`

Rota preferencial:

```text
/admin/master-diagnosis
```

Rota alternativa:

```text
/internal/diagnostico
```

Usar apenas uma rota canônica e redirecionar a outra, se necessário.

## 29.1. Objetivo

Gerar análise agregada mais direta, fria e estratégica sobre dados já codificados, sem contaminar a análise individual.

## 29.2. Princípios

- não alterar prompt neutro;
- não usar relatório master como dado de codificação;
- não inventar fatos;
- não julgar caráter;
- não diagnosticar espiritualidade invisível;
- não tratar léxico como conclusão;
- separar dado, interpretação e hipótese;
- mostrar contraevidência;
- priorizar revisado por humano;
- identificar preliminares;
- registrar acesso e geração.

## 29.3. Aviso visual obrigatório

> Este é um painel interno de diagnóstico. Não é relatório público. Dados preliminares ou não revisados não devem ser usados em decisões pastorais finais sem validação humana.

Quando snippets sensíveis estiverem habilitados, mostrar segundo aviso:

> O conteúdo abaixo pode incluir trechos sensíveis de pregações. O acesso e o uso deste material ficam registrados.

---

# 30. MASTER DIAGNOSTIC VIEW — FILTROS E CONTROLES

## 30.1. Filtros

- período inicial/final;
- ano;
- série;
- pregador, se futuramente houver mais de um;
- tipo de pregação;
- modo discursivo;
- somente revisados;
- incluir auditados por IA;
- incluir preliminares de IA;
- incluir sinais lexicais;
- incluir NLP;
- incluir snippets sensíveis;
- score mínimo de confiança;
- nível de dureza.

## 30.2. Nível de dureza

```text
MODERATE
DIRECT
VERY_DIRECT
```

O nível de dureza pode alterar:

- escolha de vocabulário;
- extensão da explicitação de riscos;
- prioridade de tensões;
- grau de concisão/direção.

Não pode alterar:

- dados de entrada;
- thresholds;
- evidências;
- confiança;
- contraevidências;
- regras de validação;
- classificação de revisado/preliminar.

## 30.3. Separação de conjuntos

Quando `includePreliminary = true`, calcular e disponibilizar:

- métricas revisadas;
- métricas preliminares;
- métricas combinadas;
- diferença entre revisado e combinado.

O relatório deve saber qual conjunto suporta cada achado.

## 30.4. Denominadores

Não permitir gerar relatório quando:

- universo total for zero;
- denominador não puder ser calculado;
- filtros resultarem em conjunto inconsistente.

Mostrar:

- total de pregações no filtro;
- total com codificação válida;
- total revisado;
- total preliminar;
- total excluído;
- total com transcrição insuficiente.

---

# 31. MASTER DIAGNOSTIC VIEW — CARDS E MÉTRICAS

Cards obrigatórios:

- ortodoxia média;
- ortopraxia média;
- espiritualidade média;
- comunidade/corpo;
- missão/evangelismo;
- vida cotidiana;
- saúde pastoral;
- gap ortodoxia versus ortopraxia;
- `organicDiaconiaScore` médio;
- `institutionalActionScore` médio;
- gap orgânico versus institucional;
- `contextualCritiqueIntensityScore` médio;
- `biblicalGroundingOfCritiqueScore` médio;
- `reconstructionAfterCritiqueScore` médio;
- `activationAfterCritiqueScore` médio;
- `healingWoundedScore` médio;
- `sendingHealedScore` médio;
- `passivityRiskScore` médio;
- `cynicismElitismRiskScore` médio;
- quantidade que precisa de revisão humana;
- cobertura humana do conjunto;
- quantidade de sugestões de reparo pendentes.

Cada card deve mostrar:

- valor;
- denominador;
- proveniência;
- variação por período, quando aplicável;
- tooltip;
- clique para evidências.

---

# 32. MASTER DIAGNOSTIC VIEW — ACHADOS DUROS

Criar painel `Achados Duros`.

Cada achado deve conter:

```text
achado
tipo do achado
evidência quantitativa
denominador
evidência textual
fontes principais
confiança
proveniência
contraevidência
limitação
risco pastoral
leitura interna
recomendação interna
status de revisão
```

## 32.1. Regras de geração

- nenhum achado sem denominador;
- nenhum achado forte baseado apenas em léxico;
- snippets sempre ligados à fonte;
- preliminares explicitamente marcados;
- contraevidência obrigatória quando existir;
- confiança coerente com cobertura e qualidade;
- linguagem não pode transformar hipótese em fato.

## 32.2. Exemplos de linguagem permitida

- “Os dados sugerem um vácuo metodológico.”
- “A igreja parece formar alta consciência teológica, mas baixa prática estruturada.”
- “Há risco de produzir críticos sofisticados do sistema religioso, mas pouco mobilizados institucionalmente.”
- “A cura dos feridos aparece mais forte do que o envio dos curados.”
- “O púlpito parece excelente em reconstruir identidade, mas menos explícito em construir trilhas práticas.”
- “Esse achado não prova intenção do pregador, mas mostra efeito discursivo possível.”

## 32.3. Linguagem proibida

- insultos;
- acusações de má-fé;
- julgamento de caráter;
- psicologização;
- diagnóstico espiritual invisível;
- certeza absoluta baseada em dado preliminar;
- conclusão fundada somente em palavra-chave.

---

# 33. MASTER DIAGNOSTIC VIEW — CONTRADIÇÕES E TENSÕES

Criar detector determinístico e/ou híbrido de tensões. O modelo de linguagem deve receber os resultados calculados, não inventar os números.

## 33.1. Tensões iniciais

### Corpo elevado, estrutura baixa

```text
community/ecclesiology high
AND institutionalActionScore low
```

Leitura possível:

> Alta eclesiologia de corpo, mas baixa explicitação de caminhos institucionais de engajamento.

### Crítica elevada, reconstrução baixa

```text
contextualCritiqueIntensityScore high
AND reconstructionAfterCritiqueScore low
```

### Diaconia orgânica elevada, ação estruturada baixa

```text
organicDiaconiaScore high
AND institutionalActionScore low
```

### Ortodoxia elevada, vida cotidiana baixa

```text
orthodoxyScore high
AND family/work/finance aggregate low
```

### Cura elevada, envio baixo

```text
healingWoundedScore high
AND sendingHealedScore low
```

### Crítica política elevada, ativação pública baixa

```text
politicalIdolatryCritiqueScore high
AND publicPresence/practicalActivation low
```

## 33.2. Thresholds

Não hardcodar interpretações em componentes. Criar configuração versionada com:

- campos usados;
- limiar alto;
- limiar baixo;
- mínimo de registros;
- cobertura revisada mínima;
- texto técnico;
- versão.

## 33.3. Exibição

Cada tensão deve mostrar:

- fórmula;
- valores;
- período;
- denominador;
- evidências a favor;
- contraevidências;
- confiança;
- leitura interna;
- ação sugerida.

---

# 34. MASTER DIAGNOSTIC VIEW — PAINEL DE EVIDÊNCIAS

Tabela filtrável com:

- título;
- série;
- ano/data;
- link/origem;
- campo;
- score;
- snippet literal;
- offsets;
- comentário;
- confiança;
- proveniência;
- revisado ou não;
- sensibilidade;
- relação com achado/tensão.

Controles:

- ocultar/mostrar snippets sensíveis;
- copiar citação;
- abrir transcrição no ponto;
- abrir vídeo;
- adicionar à seleção do relatório;
- marcar contraevidência;
- enviar para revisão humana.

---

# 35. GERADOR DE RELATÓRIO MASTER

## 35.1. Botão

> Gerar diagnóstico interno

## 35.2. Dados de entrada

O backend deve montar payload estruturado com:

- filtros;
- denominadores;
- métricas agregadas;
- distribuição por ano;
- distribuição por série;
- proveniência;
- cobertura de revisão;
- gaps principais;
- tensões calculadas;
- snippets selecionados;
- contraevidências;
- dados revisados versus preliminares;
- limitações;
- versão dos cálculos;
- hash do input.

Não enviar transcrições inteiras sem necessidade. Selecionar snippets rastreáveis e limitar volume.

## 35.3. Arquivo do prompt

`lib/diagnostics/masterPrompt.ts`

## 35.4. Prompt canônico

```text
Você é um auditor teológico-pastoral interno, contratado para produzir um diagnóstico frio, direto e estratégico a partir dos dados codificados das pregações da igreja A Casa da Rocha.

Sua tarefa não é proteger sensibilidades institucionais, nem escrever um relatório pastoral público. Sua tarefa é dizer, com base nos dados fornecidos, quais padrões, tensões, lacunas e riscos aparecem.

Regras:
1. Não invente dados.
2. Não julgue intenção, caráter ou motivação do pregador.
3. Não faça diagnóstico espiritual invisível.
4. Não use linguagem diplomática desnecessária.
5. Seja direto, mas vincule afirmações fortes a métricas e evidências.
6. Separe dado confirmado, interpretação, hipótese e risco.
7. Aponte contraevidências quando existirem.
8. Não transforme sinal lexical em conclusão.
9. Priorize dados revisados por humano.
10. Quando usar dados preliminares, marque-os como preliminares.
11. Todo achado duro deve ter métrica, denominador, evidência, confiança, risco e recomendação.
12. Não altere os dados segundo o nível de dureza; altere somente a linguagem.
13. Não declare causalidade quando os dados mostram apenas associação discursiva.
14. Não trate ausência de tema no corpus como prova de ausência absoluta no ministério.
```

## 35.5. JSON de saída

```json
{
  "executiveDiagnosis": "",
  "datasetSummary": {
    "filters": {},
    "totalDenominator": 0,
    "reviewedCount": 0,
    "preliminaryCount": 0,
    "limitations": []
  },
  "hardFindings": [
    {
      "finding": "",
      "findingType": "confirmed_data | strong_hypothesis | pastoral_risk",
      "dataEvidence": "",
      "denominator": "",
      "textualEvidence": [],
      "sourceIds": [],
      "confidence": "alta | média | baixa",
      "provenance": "",
      "counterEvidence": "",
      "limitations": "",
      "pastoralRisk": "",
      "internalReading": "",
      "recommendedAction": ""
    }
  ],
  "mainTensions": [],
  "blindSpots": [],
  "confirmedData": [],
  "strongHypotheses": [],
  "pastoralRisks": [],
  "counterEvidence": [],
  "whatThePublicDashboardShouldSay": [],
  "whatOnlyInternalLeadershipShouldSee": [],
  "questionsForPresbytery": [],
  "recommendedNextSteps": []
}
```

## 35.6. Validação da saída master

- validar JSON por Zod;
- conferir existência de denominador;
- conferir IDs de fonte;
- impedir referência a snippet inexistente;
- verificar marcação de preliminares;
- rejeitar relatório que cite dado não enviado;
- salvar output bruto e validado, se necessário;
- não publicar automaticamente.

## 35.7. Persistência

Salvar em `master_diagnostic_reports`:

- filtros;
- hash;
- versão do prompt;
- modelo;
- dureza;
- conjunto de dados;
- relatório;
- flags de preliminar, léxico e snippets;
- autor;
- data;
- notas;
- status.

## 35.8. Revisão do relatório master

Antes de uso em decisão final, permitir:

- marcar como revisado;
- adicionar notas;
- contestar achado;
- associar contraevidência;
- arquivar;
- gerar nova versão sem apagar anterior.

---

# 36. API E SERVIÇOS SUGERIDOS

## 36.1. Ingestão

```http
POST /api/imports/notebooklm
POST /api/imports/metadata-csv
POST /api/imports/reconcile
GET  /api/imports/conflicts
PATCH /api/imports/conflicts/:id
```

## 36.2. Pregações

```http
GET   /api/sermons
GET   /api/sermons/:id
PATCH /api/sermons/:id
POST  /api/sermons/:id/reprocess
```

## 36.3. Codificação

```http
POST /api/coding/analyze
POST /api/coding/retry
GET  /api/coding/attempts
GET  /api/coding/attempts/:id
POST /api/coding/attempts/:id/audit
POST /api/coding/attempts/:id/repair-evidence
```

## 36.4. Sugestões de reparo

```http
GET  /api/coding/repair-suggestions
POST /api/coding/repair-suggestions/:id/apply
POST /api/coding/repair-suggestions/:id/reject
```

Endpoints de aplicação/rejeição exigem autenticação e registram auditoria.

## 36.5. Revisão

```http
GET  /api/reviews/queue
POST /api/reviews/:analysisId/approve
POST /api/reviews/:analysisId/change-score
POST /api/reviews/:analysisId/evidence
```

## 36.6. Dashboard

```http
GET /api/dashboard/overview
GET /api/dashboard/axis/:axis
GET /api/dashboard/drilldown
GET /api/evidence
```

Toda resposta deve incluir `denominator` e `provenanceSummary`.

## 36.7. OpenRouter

```http
GET /api/openrouter/models
```

## 36.8. Relatórios públicos

```http
POST /api/reports/generate
GET  /api/reports
GET  /api/reports/:id
```

## 36.9. Master diagnosis

```http
POST /api/master-diagnosis/aggregate
POST /api/master-diagnosis/generate
GET  /api/master-diagnosis/reports
GET  /api/master-diagnosis/reports/:id
POST /api/master-diagnosis/reports/:id/review
POST /api/master-diagnosis/reports/:id/archive
```

Todos exigem `MASTER_ADMIN` ou allowlist autorizada.

---
# 37. EXPORTAÇÕES

Permitir exportar, conforme permissão:

- pregações em CSV;
- análises em CSV/JSON;
- scores em CSV;
- evidências em CSV/JSON;
- sugestões de reparo em CSV;
- resumo executivo em Markdown;
- dashboard em PDF, quando implementado;
- relatório público em Markdown/PDF;
- relatório master em formato interno controlado.

## 37.1. Regras de exportação

Toda exportação analítica deve incluir:

- data de geração;
- filtros;
- denominador;
- status de revisão;
- proveniência;
- versão do prompt/schema, quando aplicável;
- aviso sobre preliminares;
- fonte ou IDs de origem.

## 37.2. Exportação master

A exportação master deve:

- exigir autorização master;
- incluir marca d’água ou cabeçalho `CONFIDENCIAL — USO INTERNO`;
- registrar evento de exportação;
- não ser oferecida no menu público;
- ocultar snippets sensíveis por padrão, salvo escolha explícita.

---

# 38. COMPATIBILIDADE COM DADOS ANTIGOS E MIGRATIONS

## 38.1. Requisitos

- novos campos devem aceitar `null` quando não existirem em registros antigos;
- views e gráficos devem tratar `null` como “não codificado”, não como zero;
- migrations não podem reinterpretar dados antigos sem registro;
- backfill automático somente para campos determinísticos;
- scores contextuais antigos não devem ser inventados;
- dados sem novos campos devem continuar abrindo na interface;
- exportações devem informar versão da análise.

## 38.2. Estratégia de backfill

1. adicionar campos opcionais;
2. migrar schema;
3. atualizar TypeScript e Zod;
4. adaptar queries;
5. criar fallback visual;
6. rodar script de diagnóstico de registros incompletos;
7. oferecer recodificação controlada;
8. somente depois tornar campos obrigatórios para novas análises.

## 38.3. Nulos versus zero

- `null` = campo não analisado, não disponível ou legado;
- `0` = analisado e ausente/não identificável;
- não converter `null` em `0` para calcular médias;
- informar quantos registros contribuíram para cada média.

---

# 39. DEPLOY E CONFIGURAÇÃO

Atualizar `docs/INSTALL.md` com seção específica para VPS.

## 39.1. Terminal correto

Usar o terminal da VPS, não o shell interno do container, salvo quando a instrução disser explicitamente `docker compose exec`.

## 39.2. Caminho do projeto

```bash
cd /opt/casa-rocha/App/casa-rocha-dashboard
```

## 39.3. Arquivo de ambiente

Exemplo seguro:

```bash
read -s -p "Cole a chave OpenRouter: " OPENROUTER_KEY
echo

cat > .env.deploy <<EOF_ENV
PORT=3006
APP_PASSWORD=sua-senha
OPENROUTER_API_KEY=$OPENROUTER_KEY
MASTER_ADMIN_EMAILS=admin@dominio.com
ISC_THRESHOLD=30
EOF_ENV

chmod 600 .env.deploy
unset OPENROUTER_KEY
```

O nome `ISC_THRESHOLD` pode ser mantido temporariamente por compatibilidade, mas deve ser renomeado futuramente para algo como:

```env
CRITIQUE_LEXICAL_SIGNAL_THRESHOLD=30
```

## 39.4. Subir aplicação

```bash
docker compose --env-file .env.deploy up -d --build
```

## 39.5. Verificar chave sem exibir valor

```bash
docker compose --env-file .env.deploy exec dashboard sh -c \
  'test -n "$OPENROUTER_API_KEY" && echo "OPENROUTER_OK" || echo "OPENROUTER_VAZIO"'
```

## 39.6. Segurança

- nunca imprimir chave;
- nunca enviar `.env.deploy` ao Git;
- manter permissão `600`;
- revogar chave exposta;
- não salvar chave em logs, tentativas ou banco;
- validar `MASTER_ADMIN_EMAILS` no servidor;
- documentar rotação de segredo.

---

# 40. TESTES AUTOMATIZADOS

## 40.1. Autorização

1. usuário não autenticado não acessa master;
2. usuário autenticado sem role/allowlist não acessa;
3. rota não aparece no menu público;
4. endpoints master negam acesso server-side;
5. acesso permitido gera log;
6. acesso negado gera log sem expor dados.

## 40.2. Codificação e schema

1. JSON válido passa schema;
2. score fora de `0–5` falha;
3. enum inválido falha;
4. campo ausente crítico falha;
5. dados antigos com `null` não quebram;
6. score 4/5 sem evidência falha;
7. score alto com campo de evidência divergente falha.

## 40.3. Evidências

1. snippet literal com offsets corretos passa;
2. citação inexistente falha;
3. citação com espaços normalizados é localizada e substituída pelo recorte exato;
4. evidência de outra pregação falha;
5. comentário sem citação falha;
6. evidência aceita preserva fonte;
7. evidência rejeitada mostra motivo.

## 40.4. Reparo revisado

1. reparo por evidência não altera score;
2. evidência encontrada permite revalidação;
3. evidência não encontrada mantém falha;
4. modelo pode criar sugestão de score;
5. sugestão não altera `sermon_scores`;
6. aplicar sugestão exige usuário autorizado;
7. aplicação registra autor e data;
8. rejeição registra decisão;
9. tentativa original não é apagada;
10. nenhuma função de reparo salva score reduzido automaticamente.

## 40.5. Tentativas da IA

1. resposta bruta é salva antes da validação;
2. erro JSON preserva output;
3. erro OpenRouter é diferenciado;
4. cada retry gera nova tentativa;
5. API key nunca aparece;
6. UI mostra todos os erros, não apenas os primeiros.

## 40.6. Dashboard

1. toda métrica contém denominador;
2. `null` não entra como zero;
3. filtros alteram denominador;
4. drill-down retorna as pregações corretas;
5. proveniência aparece;
6. preliminares são marcados;
7. sinal lexical não aparece como conclusão contextual.

## 40.7. Master report

1. não gera sem denominador;
2. marca dados preliminares;
3. snippets possuem fonte;
4. relatório não cita ID inexistente;
5. nível de dureza não altera dados;
6. output JSON é validado;
7. relatório é salvo com hash e prompt version;
8. geração cria log;
9. dados revisados e preliminares permanecem distinguíveis.

## 40.8. UX e acessibilidade

1. tooltip abre por teclado;
2. fecha com ESC;
3. funciona em mobile;
4. Home é responsiva;
5. modal de tentativa permite copiar output;
6. tabela de evidências é navegável;
7. estados vazios explicam o que falta.

## 40.9. Build

Executar:

```bash
npm run lint
npm run build
```

Executar também suite de testes definida no projeto.

---

# 41. TESTES MANUAIS DE ACEITE

1. importar uma fonte JSON;
2. importar CSV complementar;
3. resolver conflito de metadados;
4. abrir transcrição;
5. codificar uma pregação real;
6. visualizar tentativa bem-sucedida;
7. provocar score alto sem evidência;
8. visualizar output bruto e erros;
9. executar reparo por evidência;
10. confirmar que score não mudou;
11. executar caso sem evidência;
12. visualizar sugestão não aplicada;
13. aplicar sugestão como revisor;
14. confirmar trilha de auditoria;
15. abrir dashboard e conferir denominadores;
16. clicar em gráfico e abrir evidência;
17. testar fallback com dado legado;
18. gerar relatório público;
19. tentar acessar master sem permissão;
20. acessar master com permissão;
21. gerar relatório master somente revisado;
22. gerar relatório master com preliminares;
23. confirmar marcações e diferenças;
24. testar snippets sensíveis;
25. testar exportações;
26. testar desktop e mobile.

---

# 42. ORDEM DE IMPLEMENTAÇÃO

A implementação deve reduzir risco metodológico antes de expandir relatórios.

## Fase 0 — Leitura do código e inventário

- mapear schema atual;
- mapear rotas;
- localizar prompt e validators;
- localizar cálculo do antigo ISC;
- localizar autenticação;
- localizar fluxo OpenRouter;
- listar campos e páginas existentes;
- produzir plano de migrations sem destruir dados.

## Fase 1 — Auditoria de tentativas da IA

- criar `coding_attempts`;
- salvar output bruto e erros;
- implementar histórico;
- criar `Ver resposta da IA`;
- melhorar mensagens.

## Fase 2 — Regra de evidências

- implementar validação literal;
- offsets;
- correspondência de campo;
- thresholds por codebook;
- estados de validação.

## Fase 3 — Reparo seguro

- remover lógica antiga de redução automática;
- implementar reparo apenas por evidência;
- criar `coding_repair_suggestions`;
- criar aba de sugestões;
- implementar aplicação/rejeição humana;
- criar auditoria.

## Fase 4 — Novos campos contextuais

- atualizar types;
- Zod;
- Prisma;
- migrations;
- prompt;
- codebook;
- revisão;
- exportações.

## Fase 5 — Proveniência e didática

- selos;
- denominadores;
- Home;
- tooltips;
- renomear ISC;
- separar lexical/contextual/humano.

## Fase 6 — OpenRouter UX

- endpoint de modelos;
- cache;
- fallback;
- combobox;
- preferências;
- custos e tags.

## Fase 7 — Dashboard analítico

- páginas e gráficos;
- gaps;
- filtros;
- drill-down;
- evidências;
- qualidade.

## Fase 8 — Relatórios públicos

- agregação;
- schema;
- geração;
- histórico;
- exportação.

## Fase 9 — Master Diagnostic View

- role e middleware;
- log de acesso;
- filtros;
- cards;
- tensões;
- evidências;
- prompt master;
- persistência;
- revisão;
- exportação confidencial.

## Fase 10 — Compatibilidade, testes e documentação

- backfill;
- testes;
- lint/build;
- segurança;
- README;
- ROADMAP;
- CHANGELOG;
- METHODOLOGY;
- CODEBOOK;
- INSTALL.

---

# 43. DEFINITION OF DONE

A entrega só estará concluída quando:

1. este blueprint estiver refletido no código e documentação;
2. a regra antiga de redução automática estiver removida;
3. toda tentativa de IA for auditável;
4. score alto exigir evidência literal;
5. reparo automático preservar score;
6. sugestão de score não alterar banco automaticamente;
7. aplicação de sugestão exigir humano e gerar log;
8. novos campos estiverem em prompt, schema, banco, UI, exportação e relatórios;
9. dados antigos continuarem funcionando;
10. `null` e zero estiverem corretamente separados;
11. ISC estiver renomeado e metodologicamente rebaixado;
12. Home explicar o sistema;
13. métricas sensíveis tiverem tooltip;
14. toda agregação mostrar denominador e proveniência;
15. drill-down funcionar até a fonte;
16. OpenRouter possuir seletor pesquisável e fallback;
17. rota master estiver realmente protegida;
18. acessos master forem registrados;
19. relatório master não gerar sem denominador;
20. relatório master marcar preliminares;
21. snippets tiverem fonte;
22. nível de dureza não alterar dados;
23. relatórios master forem persistidos e versionados;
24. testes obrigatórios passarem;
25. `npm run lint` passar;
26. `npm run build` passar;
27. README, ROADMAP, CHANGELOG, METHODOLOGY, CODEBOOK, INSTALL e SECURITY estiverem atualizados.

---

# 44. CRITÉRIOS FINAIS DE ACEITE DO PRODUTO

- Um usuário novo entende o sistema antes de olhar os gráficos.
- Um revisor consegue descobrir exatamente por que uma resposta falhou.
- Nenhuma falha da IA fica escondida.
- Nenhum score alto é salvo sem evidência obrigatória.
- Nenhum score é reduzido automaticamente para passar na validação.
- Uma sugestão da IA só muda o dado após decisão humana.
- Nenhuma conclusão pastoral final depende apenas de léxico.
- Todo gráfico pode ser auditado até a pregação e o trecho.
- Dados preliminares, auditados e revisados são visualmente distintos.
- Usuário sem privilégio não consegue acessar o diagnóstico interno.
- O relatório master pode ser direto sem ser irresponsável.
- O sistema preserva contraevidências, limitações e denominadores.
- O banco mantém histórico de tentativas, reparos, revisões e relatórios.

---

# 45. INSTRUÇÃO DIRETA PARA CLAUDE CODE

Ao executar este blueprint:

1. Leia o repositório completo antes de editar.
2. Não presuma nomes de arquivos, tabelas ou rotas sem confirmar.
3. Preserve compatibilidade com o código existente.
4. Identifique e remova qualquer lógica de reparo que altere score automaticamente.
5. Não faça refactor cosmético antes de corrigir risco metodológico.
6. Implemente migrations reversíveis e documentadas.
7. Não apague dados antigos.
8. Não sobrescreva tentativas de IA.
9. Não misture prompt de codificação com prompt de diagnóstico.
10. Não exponha variáveis secretas ao cliente.
11. Adicione testes para cada regra de negócio crítica.
12. Execute lint e build a cada bloco coerente de mudanças.
13. Atualize documentação junto com o código.
14. Ao encontrar ambiguidade, prefira a regra que preserva evidência, revisão humana e auditabilidade.
15. Apresente no final:
    - arquivos alterados;
    - migrations criadas;
    - regras implementadas;
    - testes executados;
    - limitações restantes;
    - próximos passos.

## 45.1. Sequência obrigatória para o agente

```text
A. Mapear código existente.
B. Identificar conflitos com este blueprint.
C. Corrigir auditoria e reparo.
D. Atualizar schema e migrations.
E. Atualizar prompt e validação.
F. Atualizar UI de falhas e revisão.
G. Atualizar dashboard e proveniência.
H. Implementar Master Diagnostic View.
I. Rodar testes, lint e build.
J. Atualizar documentação.
```

## 45.2. Restrições finais

- Não começar pelo relatório master antes de garantir dados auditáveis.
- Não chamar hipótese de resultado.
- Não inventar percentuais.
- Não usar a rota escondida como mecanismo de segurança.
- Não relaxar validação para aumentar taxa de sucesso.
- Não salvar score sugerido sem ação humana.
- Não excluir a tentativa que falhou.
- Não usar dados preliminares como se fossem revisados.

---

# 46. FRASE FINAL DE ORIENTAÇÃO

> A codificação precisa ser neutra. A evidência precisa ser literal. O reparo não pode maquiar falhas. O diagnóstico interno pode ser direto. A decisão final precisa continuar humana, auditável e pastoralmente responsável.
