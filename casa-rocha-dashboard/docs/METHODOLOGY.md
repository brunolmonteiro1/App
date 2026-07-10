# METHODOLOGY — Regras metodológicas e proveniência dos dados

## 1. Regras inegociáveis

1. Não inventar percentuais.
2. Não inferir intenção do pregador.
3. Não transformar ausência de tema em acusação.
4. Não usar "sempre", "nunca", "quase nunca" sem contagem.
5. Não usar percentuais preliminares como dados finais.
6. Separar sempre presença, centralidade e densidade.
7. Toda conclusão precisa de base em transcrição.
8. Scores altos (4–5) precisam de evidência textual.
9. Scores baixos em temas importantes precisam de nota metodológica.
10. Toda análise tem campo de confiança.
11. Todo gráfico permite clicar e ver as fontes que geraram o dado.

## 2. Hipótese vs conclusão

O projeto parte de **hipótese pastoral** (ver `BLUEPRINT.md` §3), nunca de conclusão. Até a codificação completa:

- Proibido: "há lacuna", "o púlpito não ensina", "a igreja é fraca em prática", "o vazio pragmático".
- Correto: "hipótese a validar", "padrão preliminar", "a confirmar após codificação completa", "presença baixa nos dados codificados", "baixa centralidade observada", "evidência textual insuficiente", "hipótese de baixa centralidade em Ortopraxia estruturada".

A UI reflete isso: painéis interpretativos exibem o banner *"N de 263 pregações codificadas — dados parciais"* enquanto a codificação não terminar, e o texto dos relatórios usa a linguagem metodológica acima.

**Caso real (por que a regra existe).** A análise anterior do mesmo acervo, feita no NotebookLM, afirmou percentuais como "~80% do foco homilético", "~40% a 50% das mensagens" e "< 5% do ensino" — e, na mesma conversa, **admitiu** que "o arquivo de dados brutos contém apenas os metadados... o número exato exigiria uma tabulação manual prévia de cada vídeo". Ou seja, produziu percentuais que confessou não ter como calcular. Este projeto existe justamente para substituir essa estimativa por contagem auditável: nenhum percentual sem pregações codificadas e denominador visível.

## 2b. Recomendação = trilha complementar (guardrail de enquadramento)

Toda recomendação pastoral gerada pelo sistema é enquadrada como **trilha complementar de formação** (grupos de cuidado, cursos, discipulado, aconselhamento) — **nunca** como "o púlpito deve mudar", "o pregador deveria pregar X" ou juízo sobre a escolha homilética. A opção do púlpito por ênfase ontológica (ver `CODEBOOK.md` §4b) é tratada como legítima; o papel do dashboard é apontar onde o *ecossistema da igreja* (fora do domingo) pode complementar, não corrigir o púlpito.

## 3. Presença × Centralidade × Densidade

| Métrica | Pergunta | Fonte do dado | Exemplo |
|---|---|---|---|
| **Presença** | O tema aparece? | camada lexical + codificação (score ≥ 1) | "família aparece em 30 de 263 pregações" |
| **Centralidade** | É eixo principal/forte? | codificação (score ≥ 4, com evidência) | "família é tema central em 2 de 263" |
| **Densidade** | Quanto espaço textual ocupa? | camada lexical (`densityPer10k`) | "termos de cruz: 48 ocorrências / 10.000 palavras" |

Todo número exibido declara qual métrica representa. Gráficos que misturam as três são proibidos.

## 4. Proveniência em camadas (selo de origem)

Todo dado carrega o método que o gerou (`analysisMethod` / `analysisStatus`):

| Camada | Método | Natureza | Cobertura esperada |
|---|---|---|---|
| **0 — Determinística** | parse de título, cruzamento TSV, YouTube ID, contagem de palavras | objetiva, reprodutível | 263/263 na importação |
| **1 — Lexical/NLP** | `dictionary`, `regex` (refs bíblicas), `tfidf`, `embedding` | objetiva, sem interpretação | 263/263 por script |
| **2 — Codificação IA** | `ai_coding` (lotes de 5–10 com codebook) | interpretativa, pendente de revisão | progressiva |
| **3 — Revisão humana** | `human_review` | interpretativa, validada | progressiva |

Regras de exibição:

- Painéis lexicais (camadas 0–1) podem ser exibidos desde o dia 1, rotulados como **densidade/frequência lexical**, nunca como conclusão teológica.
- Percentuais interpretativos só usam registros `ai_coded` ou `reviewed`, sempre com o denominador visível ("de N codificadas").
- **Percentuais finais e conclusões pastorais só usam registros `reviewed`.**
- Badge de proveniência visível em cada card/gráfico: `lexical` / `ai_coded` / `reviewed`.

## 5. Confiança

Toda análise e toda evidência têm `confidence` (alta/média/baixa). Gatilhos automáticos de confiança baixa:

- transcrição com flag de qualidade (curta demais para a duração declarada);
- data estimada com `dateConfidence` baixa;
- conflito de metadados JSON × TSV não resolvido;
- resposta de IA com campos incompletos.

Filtros do dashboard permitem excluir baixa confiança de qualquer visão.

## 6. Confiabilidade do método (dupla codificação + kappa)

Para dar peso metodológico diante do presbitério:

1. Selecionar amostra aleatória de ~20 pregações (estratificada por série/ano).
2. Recodificar a amostra de forma independente (segunda passada de IA com prompt idêntico, e/ou segundo revisor humano).
3. Calcular concordância por categoria (percentual de concordância exata e adjacente; kappa de Cohen ponderado para as categorias principais).
4. Publicar os índices na página de Relatórios: transforma "a IA disse" em "método com confiabilidade medida".
5. Categorias com concordância baixa voltam ao codebook para redefinição (nova versão).

## 7. Versionamento do codebook

- Cada categoria tem `version`; análises gravam `analysisVersion`.
- Mudou a régua → nova versão → o sistema lista análises desatualizadas e a fila de recodificação.
- Relatórios citam a versão do codebook utilizada.

## 8. Vieses e limitações declaradas

Todo relatório inclui seção fixa de limitações:

- transcrições automáticas do YouTube (sem pontuação, erros de reconhecimento);
- datas parcialmente estimadas por interpolação;
- ausência de timestamps (evidência textual, não temporal);
- a análise mede o **púlpito dominical**, não toda a vida formativa da igreja (grupos, aconselhamento, cursos não estão no corpus);
- codificação por IA revisada por humano — não é juízo pastoral automático;
- **não há dados de engajamento da congregação** (frequência, número de voluntários, participação em ministérios) neste corpus; a hipótese "muitos ouvintes, poucos servindo" descreve uma dor real, mas **não é comprovável só pelas transcrições** — exigiria dados internos da igreja, fora do escopo atual.

## 9. Fora de escopo (decisões de governança)

Itens deliberadamente excluídos deste produto, para preservar o princípio de não julgar a pessoa:

- **Comparação "Imagem Pública vs Púlpito Interno"** — cruzar o "Dossiê público sobre Pr. José Bruno.pdf" (polêmicas, atuação pública) com o ensino interno **não** entra no dashboard de saúde. Desloca o foco do raio-x da dieta formativa para investigação do pregador e colide com a regra 2 (não inferir intenção). O PDF permanece no banco como fonte `isSermon = false`, **não analisada**.
- **Dados de engajamento da igreja** (frequência/voluntários/ministérios) — fora do MVP; ver §8.
- **Diagnóstico psicológico ou de trauma do pregador** — o Módulo de Saturação Crítica (`CRITICAL_SATURATION.md`) mede linguagem, não causa; qualquer leitura de "motivação" é proibida.
