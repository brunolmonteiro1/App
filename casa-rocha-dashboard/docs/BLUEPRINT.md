# BLUEPRINT — Dashboard de Saúde Teológica e Formação Pastoral — A Casa da Rocha

## 1. Contexto

O projeto analisa 6 anos de pregações (2020–2026) da igreja A Casa da Rocha, principalmente as mensagens do Pr. José Bruno (Zé Bruno). A base é um backup exportado do NotebookLM (`data/raw/A Casa da Rocha-backup-2026-07-10.json`) com 266 fontes: 263 vídeos do YouTube com transcrição completa, mais materiais auxiliares — incluindo o CSV de metadados embutido como fonte de texto (ver `DATA_AUDIT.md`).

O projeto nasce como **produto de dados**, não como análise em texto: uma aplicação web interativa onde o presbitério consegue ver, com dados e evidências, a "dieta formativa" recebida pela igreja ao longo do tempo.

## 2. Pergunta central

«A Casa da Rocha está formando uma igreja saudável em ortodoxia, ortopraxia, espiritualidade, comunhão, missão, maturidade e corresponsabilidade?»

O dashboard deve permitir responder, com dados:

- o que foi mais e menos ensinado;
- quais temas aparecem por ano e por série;
- quais textos bíblicos foram usados;
- quais doutrinas aparecem com maior força e quais práticas com menor força;
- se há equilíbrio entre crença correta e prática correta;
- se a igreja está sendo formada apenas para ser curada de abusos religiosos ou também enviada para serviço, missão e maturidade;
- quais lacunas formativas precisam ser tratadas por pequenos grupos, aconselhamento, cursos, Caminho das Letras ou outras estruturas pastorais.

## 3. Hipótese pastoral inicial (não é conclusão)

O projeto parte de uma **hipótese a validar**, nunca de um resultado:

> «A Casa da Rocha apresenta uma dieta formativa muito forte em Ortodoxia: cruz, graça, cristologia, soteriologia, crítica ao abuso religioso e desconstrução da religião baseada em culpa, medo e barganha. Ao mesmo tempo, pode existir uma **hipótese de baixa centralidade em Ortopraxia estruturada**: vida devocional prática, família, finanças, discipulado, voluntariado, pequenos grupos, evangelismo e engajamento institucional.»

Essa hipótese só poderá ser confirmada, ajustada ou negada **após a codificação completa** das pregações. O dashboard não afirma previamente "há lacuna", "o púlpito não ensina" ou "a igreja é fraca em prática" — usa "hipótese a validar", "padrão preliminar", "presença baixa nos dados codificados", "evidência textual insuficiente".

## 4. Metáfora do produto

O dashboard funciona como um **"exame de sangue" da igreja**:

- não acusa; não julga intenção; não substitui discernimento pastoral;
- mostra indicadores; aponta desequilíbrios; permite ver evidências;
- ajuda o presbitério a decidir trilhas formativas.

Frase de produto: *«Um raio-x interativo da dieta bíblica, teológica, espiritual, comunitária e prática recebida pela igreja nos últimos seis anos.»*

## 5. Os 8 grandes eixos de análise

Cada pregação é analisada em 8 painéis de saúde formativa (categorias e scores detalhados em `CODEBOOK.md`):

1. **Saúde bíblica e homilética** — como a Bíblia está sendo pregada: texto principal, livros citados, testamento predominante, tipo de pregação, explicação no contexto, leitura cristocêntrica, aplicação.
2. **Ortodoxia (crença correta)** — o que a igreja aprende a crer: teontologia, Trindade, cristologia, crucicentrismo, soteriologia, pneumatologia, bibliologia, eclesiologia, hamartiologia, antropologia teológica, Reino de Deus, escatologia, santificação.
3. **Ortopraxia (ação correta)** — o que a igreja aprende a praticar: serviço/diaconia, generosidade, missão, evangelismo, discipulado, comunhão, perdão, hospitalidade, cuidado dos pobres, dons, mordomia, vocação/trabalho, família, finanças.
4. **Espiritualidade e vida devocional** — andar com Deus fora do domingo: oração, leitura bíblica pessoal, meditação, jejum, adoração, confissão, arrependimento, dependência de Deus, batalha espiritual, discernimento, disciplinas espirituais. Distinguir **exortação devocional** de **método devocional**.
5. **Comunidade e eclesiologia prática** — que tipo de igreja está sendo formada: corpo, família, mesa, hospital, escola, missão vs auditório; povo sacerdotal, liderança servidora, pequenos grupos, cuidado mútuo, dons para edificação.
6. **Missão, evangelismo e presença pública** — a igreja enviada para fora de si: Missio Dei, missão local/global, evangelismo pessoal, testemunho cotidiano, apologética, justiça e misericórdia, presença pública, política e Reino. Separar missão **orgânica**, **programática**, **institucional** e **transcultural**.
7. **Vida cotidiana** — evangelho na casa, no trabalho e nas relações: casamento, filhos, solteiros, sexualidade, finanças familiares, dívidas, consumo, trabalho, vocação, ética profissional, conflitos, perdão, saúde emocional, corpo e mordomia física.
8. **Saúde pastoral: cura, desconstrução e envio** — a igreja está apenas curando feridos ou também enviando curados? Acolhimento, desconstrução da religião abusiva (legalismo, culpa, medo, barganha, mercado gospel, liderança autoritária), reconstrução discipular, ativação prática, envio, corresponsabilidade, risco de passividade.

## 6. Blocos temáticos para classificação (visão do adendo NLP)

Complementar aos 8 eixos, o motor de análise classifica cada pregação em 6 blocos (dicionários em `CODEBOOK.md`):

1. Ortodoxia e Teologia Central;
2. Desconstrução Religiosa;
3. Santificação e Maturidade;
4. Eclesiologia e Comunidade;
5. Ortopraxia e Estrutura Prática;
6. Missão e Presença Pública.

## 7. Produto final desejado

O usuário consegue:

1. Importar o backup JSON do NotebookLM.
2. Ver todas as pregações em tabela; pesquisar por título, série, ano, texto bíblico, tema ou palavra-chave.
3. Abrir cada pregação com transcrição completa, metadados, scores e evidências textuais.
4. Filtrar por ano, série, tema, doutrina, score e nível de confiança.
5. Clicar em **qualquer** gráfico e abrir as pregações que compõem aquele dado (drill-down obrigatório).
6. Codificar pregações (manual e por IA em lotes) e revisar humanamente.
7. Exportar CSV/Excel e gerar relatórios executivos para o presbitério.

## 8. Resultado esperado para o presbitério

O produto deve permitir uma conversa madura como:

> «Nos últimos 6 anos, nossa igreja recebeu uma dieta muito forte em cristologia, cruz, graça e desconstrução da religião abusiva. A análise também mostra oportunidades de reforço em vida devocional prática, família, discipulado cotidiano, generosidade saudável, missão estruturada e comunidade fora do auditório. O caminho não é cobrar que o púlpito vire manual de autoajuda, mas criar trilhas complementares de formação pastoral.»

(Enunciado apenas como exemplo do *tom* esperado — o conteúdo real virá dos dados codificados.)

## 9. Nome do produto

Nome recomendado: **«Dashboard de Saúde Teológica e Formação Pastoral»**.

Alternativas consideradas: Raio-X Formativo — Casa da Rocha; Mapa da Dieta Formativa; Painel de Formação Pastoral; Observatório Homilético — Casa da Rocha.
