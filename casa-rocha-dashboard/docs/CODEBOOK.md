# CODEBOOK — Régua de avaliação, categorias e dicionários

Régua oficial de codificação. Toda análise (IA ou humana) segue este documento. O codebook é versionado (`CodebookCategory.version`): mudar definições exige nova versão e marca análises antigas como desatualizadas.

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
`healingWoundedScore` (acolhimento dos feridos), `religiousDeconstructionScore` (crítica a legalismo, culpa, medo, barganha, mercado gospel, liderança autoritária), `discipleshipReconstructionScore`, `practicalActivationScore`, `sendingHealedScore`, `coresponsibilityScore`, `passivityRiskScore` + agregado `pastoralHealthScore`.

## 5. Dicionários temáticos iniciais (camada lexical)

Usados pela camada 1 do pipeline para contagem, densidade e snippets. São ponto de partida — a codificação interpretativa (camadas 2–3) decide o score final, porque **palavra-chave sozinha não entende contexto** (ex.: "dinheiro" pode ser crítica a Mamon, ensino de generosidade, ilustração ou tema central de mordomia).

### Cruz / Soteriologia
cruz · sacrifício · sangue · expiação · graça · perdão · salvação · novo nascimento · morrer para si · velho homem · ressurreição · justificação · redenção · reconciliação

### Cristologia / Trindade
Cristo · Jesus · Logos · Verbo · Filho · Pai · Espírito Santo · Trindade · encarnação · divindade · humanidade de Cristo · Senhorio de Cristo

### Desconstrução religiosa
sistema religioso · religião · legalismo · barganha · culpa · medo · mercado gospel · evangelho de Judas · Mamon · pastor como guru · líder totalitário · abuso espiritual · manipulação · ritual vazio · fariseu · clericalismo

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
