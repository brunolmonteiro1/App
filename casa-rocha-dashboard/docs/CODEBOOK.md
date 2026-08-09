# CODEBOOK — Régua de avaliação, categorias e dicionários

Régua oficial de codificação. Toda análise (IA ou humana) segue este documento. O codebook é versionado (`CodebookCategory.version`): mudar definições exige nova versão e marca análises antigas como desatualizadas.

> **Rubrica executável:** as definições operacionais por categoria (o que distingue 1–2 / 3 / 4–5 em cada campo) vivem em `lib/coding/rubric.ts` e são embutidas em todo prompt de codificação, junto com o glossário (`lib/coding/glossary.ts`) e o padrão confessional (`docs/THEOLOGY_BASELINE.md`, lido em runtime). Este doc é a referência conceitual; o código é a fonte executável — alterar a rubrica implica bump de `analysisVersion`.

> **Famílias de score (Rodada H):** a escala única 0–5 abaixo aplica-se à família **presence**. O pipeline multi-etapas (`coding-v3-multistage`) classifica cada campo em uma família com semântica própria (`lib/coding/score-fields.ts`, `FAMILY_SEMANTICS`):
> - **presence** — 0 ausente · 1–5 presença→centralidade; score ≥4 exige citação direta; agrega por média dos presentes.
> - **quality** — **não existe 0** (usar `null` = não aplicável/impossível avaliar); 1 muito frágil → 5 exemplar; agrega por média dos não-null. Campos: exposição, leitura cristocêntrica, aplicação bíblica, fundamentação da crítica, e os derivados da Etapa B (fidelidade hermenêutica, coerência argumentativa, unidade dinâmica, progressão, transições, fechamento).
> - **applicability** — 0 ausente · 1 princípio abstrato → 5 método estruturado; score ≥ limiar exige citação que mostre a prática.
> - **risk** — 0 sem risco · 1–5 intensidade; ≥3 exige múltiplas evidências/análise de cobertura, nunca frase isolada; **fica fora de todas as médias de eixo**.
> - **aggregate** — os 5 sínteses de eixo: nunca têm evidência própria (sempre descartada); exibidos junto ao **painel derivado** (`derived-scores.ts`): média dos presentes × top-3 × amplitude, para não confundir ausência temática com baixa qualidade. O dashboard **nunca** trata `null` como zero.

> **Tipos de evidência (`evidenceBasis`):** direct_quote · multiple_quotes · structural_analysis · derived_gap · whole_sermon_absence · paired_evidence · aggregate_derived · human_judgment. Alegações de ausência usam análise de cobertura do sermão inteiro, nunca "citação da ausência".

## 1. Escala 0–5 (todas as categorias)

| Score | Definição |
|---|---|
| **0** | Ausente ou não identificável na transcrição |
| **1** | Menção muito fraca (citação de passagem, sem desenvolvimento) |
| **2** | Presença baixa (aparece, mas periférico) |
| **3** | Presença moderada (desenvolvido em parte da pregação) |
| **4** | Presença forte (eixo importante da pregação) — **exige evidência textual** |
| **5** | Tema central da pregação — **exige evidência textual** |

Regras:

- **Não confundir menção com centralidade** — uma palavra citada uma vez não é tema central.
- Score **0 em tema importante** = "não identificado nesta pregação", nunca acusação.
- Transcrição ruim/incompleta → marcar **confiança baixa**.
- Campo incerto → confiança baixa, nunca chute.

## 2. Métricas distintas (nunca misturar)

- **Presença**: o tema aparece? (ex.: família aparece em N de 263 pregações)
- **Centralidade**: o tema é eixo principal/forte (score ≥ 4)? (ex.: família é central em N de 263)
- **Densidade**: espaço lexical ocupado (ex.: termos de cruz aparecem X vezes por 10.000 palavras)

Nenhum percentual é exibido sem declarar qual das três métricas representa.

## 3. Tipos de pregação (campo `sermonType`)

`expositiva_sequencial` · `expositiva_isolada` · `tematica_biblica` · `doutrinaria` · `pastoral_devocional` · `profetica_confrontativa` · `evangelistica` · `institucional_eclesiologica` · `testemunhal` · `motivacional_terapeutica` · `hibrida`

## 4. Categorias por eixo (campos de score)

### Eixo 1 — Saúde bíblica e homilética
`biblicalHealthScore`, `homileticExpositionScore` (o texto é explicado no contexto ou usado como ilustração?), `christocentricReadingScore`, `biblicalApplicationScore`. Campos descritivos: texto bíblico principal, livros citados, testamento predominante, tipo de pregação.

### Eixo 2 — Ortodoxia (crença correta)
`theologyProperScore` (Deus/teontologia), `trinityScore`, `christologyScore`, `crucicentrismScore`, `soteriologyScore`, `pneumatologyScore`, `bibliologyScore`, `ecclesiologyScore`, `hamartiologyScore`, `anthropologyScore`, `kingdomTheologyScore`, `eschatologyScore`, `sanctificationScore` + agregado `orthodoxyScore`.

### Eixo 3 — Ortopraxia (ação correta)
`serviceDiaconiaScore`, `generosityScore`, `missionEvangelismScore`, `discipleshipScore`, `communityMutualityScore`, `hospitalityScore`, `careForPoorScore`, `forgivenessReconciliationScore`, `vocationWorkScore`, `familyRelationshipsScore`, `financeStewardshipScore` + agregado `orthopraxyScore`.

Atenção: ortopraxia mede **prática estruturada/metódica** (chamado concreto, passo aplicável), não apenas exortação genérica a "viver o evangelho".

### Eixo 4 — Espiritualidade e vida devocional
`prayerScore`, `scriptureDevotionScore`, `fastingScore`, `worshipScore`, `repentanceScore`, `discernmentScore`, `spiritualDisciplinesScore` + agregado `spiritualityScore`. Distinguir **exortação devocional** ("orem mais") de **método devocional** ("como orar").

### Eixo 5 — Comunidade e eclesiologia prática
Imagens de igreja (corpo, família, mesa, hospital, escola, missão, auditório), povo sacerdotal, liderança servidora, pequenos grupos, cuidado mútuo, dons para edificação. Codificadas via `communityMutualityScore`, `ecclesiologyScore` e campo descritivo de imagem predominante.

### Eixo 6 — Missão e presença pública
Missio Dei, missão local/global, evangelismo pessoal, testemunho cotidiano, apologética, justiça e misericórdia, presença pública, política e Reino. Separar missão **orgânica** / **programática** / **institucional** / **transcultural** (campo descritivo). Score: `missionEvangelismScore`.

### Eixo 7 — Vida cotidiana
Casamento, filhos, solteiros, sexualidade, finanças, dívidas, consumo, trabalho, vocação, ética profissional, conflitos, perdão prático, saúde emocional, corpo. Scores: `familyRelationshipsScore`, `vocationWorkScore`, `financeStewardshipScore`, `forgivenessReconciliationScore`.

### Eixo 8 — Saúde pastoral: cura, desconstrução e envio
`healingWoundedScore` (acolhimento dos feridos), `religiousDeconstructionScore` (crítica a legalismo, culpa, medo, barganha, mercado gospel, liderança autoritária), `discipleshipReconstructionScore`, `practicalActivationScore`, `sendingHealedScore`, `coresponsibilityScore`, `passivityRiskScore`, `cynicismElitismRiskScore` + agregado `pastoralHealthScore`.

- `cynicismElitismRiskScore` — risco de a mensagem alimentar cinismo ou **elitismo teológico** (o paradoxo do fariseu de Lc 18:11: "graças a Deus não sou como os outros evangélicos"). Score alto = ironia/superioridade sobre "o sistema" sem chamado afirmativo correspondente. É um **risco a monitorar**, não uma acusação; exige evidência textual como qualquer 4–5.

**Funil de maturidade.** Os scores do Eixo 8 compõem uma leitura de funil — acolhimento → cura/desconstrução → discipulado/reconstrução → envio → corresponsabilidade. A hipótese pastoral central do projeto (ver `BLUEPRINT.md`) é que os primeiros estágios podem estar fortes e os finais fracos; o funil só é afirmável sobre dados `reviewed`.

## 4b. Eixo transversal — Ontológico (ser) × Pragmático (fazer)

Mede o **modo** de ensino, não o tema — por isso é transversal a todos os eixos. Uma pregação pode ter `serviceDiaconiaScore` alto e ainda assim ensinar serviço só como identidade ("somos servos"), sem método ("sirva em X nesta semana"). Este é o achado mais recorrente da análise pastoral e a lente mais direta para a hipótese central.

- `ontologicalVsPragmatic` (categórico, sobre o tema aplicado dominante): `ontologico` (ensina quem o cristão é/deve ser) · `equilibrado` · `pragmatico` (dá passo/método concreto) · `nao_identificavel`.
- `practicalMethodScore` (0–5): há caminho prático aplicável? 0 = nenhum; 5 = passos claros e acionáveis.

Exemplos:
- "se os dois morrerem para si mesmos, o casamento dá certo" → `ontologico`, `practicalMethodScore` baixo.
- "procure alguém para discipular esta semana; comece por…" → `pragmatico`, `practicalMethodScore` alto.

Nota metodológica: score pragmático **baixo não é defeito** — pode ser opção homilética legítima. O dado serve para o presbitério decidir onde criar trilhas complementares (grupos, cursos), nunca para cobrar que o púlpito vire manual de passos.

## 5. Dicionários temáticos iniciais (camada lexical)

Usados pela camada 1 do pipeline para contagem, densidade e snippets. São ponto de partida — a codificação interpretativa (camadas 2–3) decide o score final, porque **palavra-chave sozinha não entende contexto** (ex.: "dinheiro" pode ser crítica a Mamon, ensino de generosidade, ilustração ou tema central de mordomia).

### Cruz / Soteriologia
cruz · sacrifício · sangue · expiação · graça · perdão · salvação · novo nascimento · morrer para si · velho homem · ressurreição · justificação · redenção · reconciliação

### Cristologia / Trindade
Cristo · Jesus · Logos · Verbo · Filho · Pai · Espírito Santo · Trindade · encarnação · divindade · humanidade de Cristo · Senhorio de Cristo

### Desconstrução religiosa
sistema religioso · religião · legalismo · barganha · culpa · medo · mercado gospel · evangelho de Judas · Mamon · pastor como guru · líder totalitário · abuso espiritual · manipulação · ritual vazio · fariseu · clericalismo

Expansão para o Módulo de Saturação Crítica (ver `CRITICAL_SATURATION.md`):
- **diretos**: mercado da fé · gurus · instituição · CNPJ · caça-níqueis · dízimo · campanhas
- **irônicos**: alquimias da religião · fórmulas mágicas · gênio da lâmpada · bater continência para pastor · ungido · mandingas evangélicas · fábrica de crentes · recebe a vitória · toma posse · tá amarrado
- **ideologias de poder**: idolatria política · gado · esquerdas e direitas na igreja

Atenção redobrada a falsos positivos neste campo ("dízimo", "campanhas", "ungido" têm usos neutros/bíblicos) — a camada lexical gera candidatos; o sentido é validado nas camadas 2–3.

### Santificação e maturidade
fruto do Espírito · morte do ego · arrependimento · humildade · domínio próprio · santidade · dependência de Deus · carne · nova criatura · transformação

### Serviço / Diaconia / Eclesiologia
servir · servo · diaconia · bacia e toalha · lavar os pés · corpo · dons · mutualidade · uns aos outros · comunidade · mesa · igreja como corpo · cuidado mútuo · comunidade dos arrependidos

### Ortopraxia prática
voluntariado · participar · servir na igreja · grupo · pequeno grupo · discipulado · mentoria · cuidar de alguém · evangelizar · oração diária · ler a Bíblia · jejum · finanças · dívida · casamento · filhos · família · trabalho · vocação · conflito · perdão prático

### Missão e presença pública
missão · enviar · enviados · evangelho para · testemunho · próximo · cidade · pobres · justiça · misericórdia · alcançar

Cada termo entra em `CodebookCategory.keywords`; a lista é editável pela interface e versionada. Considerar variações morfológicas (servir/serve/servindo) via stemming leve ou lista expandida.

## 6. Exemplos de codificação (positivos e negativos)

- **Positivo (score 5 em `crucicentrismScore`)**: pregação inteira estrutura-se em torno da cruz; evidência: trecho onde a cruz é apresentada como eixo da mensagem.
- **Negativo (não pontuar)**: a palavra "cruz" aparece 1 vez em ilustração passageira → presença lexical registrada na camada 1, mas score de centralidade baixo (1–2).
- **Positivo (score 4 em `practicalActivationScore`)**: chamado concreto ("procure alguém para discipular esta semana", "sirva em X").
- **Negativo**: exortação genérica ("vivam o evangelho") sem passo concreto → score ≤ 2.

## 7. Regra de evidência

- Todo score **4 ou 5** grava pelo menos 1 linha em `sermon_evidence` com citação curta, posição no texto (`startIndex`/`endIndex`), comentário analítico e confiança.
- Todo score **0 em tema importante** recebe nota metodológica ("não identificado nesta transcrição").
- Evidência sem posição localizável na transcrição é rejeitada na validação.
