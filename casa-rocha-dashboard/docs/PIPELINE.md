# PIPELINE — Importação, motor bíblico, NLP e codificação

Scripts em TypeScript (`scripts/`), executados via `tsx`. Ordem: importar → analisar lexicalmente → codificar em lotes → revisar → só então agregar.

## 1. Importação (`scripts/import-notebooklm-backup.ts`)

### 1.1 Ler o JSON

Ler `version`, `exportedAt`, `notebook.title` e `sources[]` (`id`, `title`, `url`, `sourceType`, `content`) de `data/raw/A Casa da Rocha-backup-2026-07-10.json`.

### 1.2 Extrair o TSV embutido

A fonte `SOURCE_TYPE_TEXT` com título `casadarocha_ze_bruno_preliminar.csv` contém o TSV de metadados (colunas em `DATA_AUDIT.md` §3). Parsear e indexar por **YouTube ID**.

### 1.3 Criar registros `Sermon`

Para cada source:

- extrair YouTube ID da URL (`watch?v=`, `youtu.be/`);
- parse do título `#NN - Título - Zé Bruno - Série` (tolerante a variações de espaço/hífen) → `messageNumber`, `normalizedTitle`, `preacher`, `seriesRaw`;
- cruzar com a linha do TSV pelo YouTube ID → `dateEstimated`, `dateConfidence`, `durationRaw`→`durationSeconds`, série do TSV;
- **conflito título × TSV** (série ou título divergente) → gravar em `metadataConflict`, nunca resolver silenciosamente;
- salvar `transcriptText` completo, `transcriptCharCount`, `transcriptWordCount`;
- flag de qualidade: transcrição curta demais para a duração declarada → `transcriptQualityFlag`;
- fontes não-pregação (PDF, texto colado, o próprio TSV) → `isSermon = false`.

### 1.4 Normalizar séries (`lib/parsing.ts`)

Mapa de normalização (case/acentos/espaços-insensível) para as séries conhecidas: O Caminho da Cruz · A Videira · Do Princípio ao Fim · A Vida em Parábolas · A Última Semana · Meu Caro Amigo · Meu Caro Amigo 2 · Quem é Jesus? · O Povo da Cruz · Juntos no Natal · Deus Conosco · Mensagens Especiais. Título sem série reconhecida → `series = null` + pendência na página de qualidade de dados.

### 1.5 Idempotência

- Chave: `notebookSourceId`; hash: sha256 de `content` em `contentHash`.
- Fonte nova → inserir. Hash igual → pular. Hash diferente → atualizar transcrição, **preservar** análises/scores/evidências e marcar análise como possivelmente desatualizada.
- Nunca deletar por ausência no novo backup.
- Gravar resumo em `ImportRun` (novas/atualizadas/puladas/conflitos).

Resultado: um backup futuro do NotebookLM re-importa com segurança, só acrescentando o que mudou.

## 2. Motor bíblico (`scripts/detect-biblical-references.ts`)

Camada determinística, roda sobre as 263 transcrições:

- Regex de referências em pt-BR: nome do livro (com abreviações e variações: "Gênesis/Genesis/Gn", "1 Coríntios/1Co", "Apocalipse/Ap"…) + capítulo + versículo(s) opcionais ("Gênesis 1:26 a 31", "João 15", "Romanos 8.28-30").
- Tabela estática dos 66 livros com `bookSlug`, testamento e ordem canônica (`lib/bible-books.ts`).
- Cuidado com falsos positivos: "João" pode ser pessoa; só contar como referência quando seguido de capítulo, ou quando padrões contextuais claros ("evangelho de João", "carta de Paulo aos…").
- Gravar cada match em `BiblicalReference` com posição (`startIndex`/`endIndex`).

Saída direta (sem IA): livros mais pregados, AT × NT, mapa de cobertura dos 66 livros, textos recorrentes.

## 3. Análise lexical/NLP (`scripts/run-lexical-analysis.ts`)

Sobre cada transcrição, usando os dicionários do `CODEBOOK.md` §5:

1. Contagem por termo e por tema (com variações morfológicas);
2. Densidade por 10.000 palavras → `LexicalMetric`;
3. Extração de snippets: janela de contexto ao redor de cada match relevante → `SermonEvidence` com `analysisMethod: "dictionary"`;
4. TF-IDF sobre o corpus → termos distintivos por pregação e por série;
5. **Índice de Saturação Crítica (ISC)** — ver `CRITICAL_SATURATION.md`: para cada pregação, `isc = (menções crítica ao sistema / menções Evangelho) × 100`, com densidades absolutas dos dois campos, denominador mínimo configurável (default 5 menções; abaixo disso, `nao_calculavel`), rótulo por limiar configurável (default 30% = `saturacao_alta`) e snippets do campo crítica gravados em `SermonEvidence` (`category: "critica_ao_sistema"`, `analysisMethod: "dictionary"`) → tabela `SaturationMetric`;
6. (Fase avançada) embeddings + clustering: pregações semanticamente próximas, evolução de vocabulário por ano, comparação entre séries.

Tudo nesta camada é rotulado como **frequência/densidade lexical** — nunca vira score teológico sozinho.

## 4. Codificação por IA via OpenRouter (página `/coding`) — implementado

A codificação roda **dentro do sistema**, via API do OpenRouter (modelo escolhido na UI, chave via env `OPENROUTER_API_KEY`). O fluxo manual de copiar/colar foi descontinuado.

### 4.1 Fluxo

1. A página `/coding` lista as pendentes; o usuário escolhe o **modelo** (lista do OpenRouter com preços + campo livre) e a **quantidade** (1/5/10/25/todas);
2. O navegador envia uma pregação por vez a `POST /api/coding/analyze` (progresso, pausa e log por item na tela; o que foi salvo permanece salvo);
3. O servidor monta o prompt por pregação (`lib/coding/prompt.ts` — regras metodológicas + catálogo de scores do `lib/coding/score-fields.ts` + transcrição) e chama o OpenRouter com `temperature: 0` e `response_format: json_object` (1 retry em 429/5xx);
4. **Validação no servidor** (`lib/coding/schema.ts` + `locate-evidence.ts`): JSON bem-formado (Zod), scores inteiros 0–5, todo score ≥4 com evidência do campo, e **cada citação localizada literalmente na transcrição** (busca tolerante a acentos/caixa/pontuação, com índices reais calculados) — citação inexistente rejeita a pregação inteira (anti-alucinação);
5. Sucesso → transação grava `SermonAnalysis` (`ai_coded`, `aiModel`, `aiCodedAt`) + `SermonScores` + `SermonEvidence` (`analysisMethod: "ai_coding"`, com `startIndex`/`endIndex`); falha → `aiError` gravado e exibido com botão de re-tentativa;
6. Pregação `reviewed` nunca é recodificada (exige desfazer a revisão);
7. Recodificar uma `ai_coded` substitui scores e evidências de IA anteriores; evidências `dictionary` (camada lexical) são preservadas.

### 4.2 Prompt padrão (base conceitual; a versão executável está em `lib/coding/prompt.ts`)

```
Você é um pesquisador de homilética empírica, teologia pastoral e análise de conteúdo.

Analise somente as pregações fornecidas neste lote.

Regras:
- não faça julgamento pessoal sobre o pregador;
- não invente dados;
- não use conhecimento externo;
- não pule nenhuma pregação;
- não estime percentuais globais;
- analise apenas evidências textuais;
- quando não houver evidência, marque "não identificável";
- todo score 4 ou 5 deve ter evidência textual curta (citação literal da transcrição);
- todo campo incerto deve ter confiança baixa.

Para cada pregação, retorne JSON com:
id_da_fonte, titulo, serie, ano, texto_biblico_principal, tipo_de_pregacao,
tema_central, temas_secundarios, doutrina_principal,
scores de 0 a 5 (campos conforme codebook anexo),
evidencias (citação literal + campo de score que sustenta + comentário),
comentario_analitico, confianca (alta|media|baixa).

Escala: 0 = ausente · 1 = menção muito fraca · 2 = presença baixa ·
3 = presença moderada · 4 = presença forte · 5 = tema central.

Não faça conclusão geral. Apenas codifique as pregações do lote.
```

O template real anexa as definições 0–5 de cada categoria (do codebook, versão vigente) e as transcrições do lote.

## 5. Revisão humana (página `/coding/review/[id]`) — implementado

- Tela side-by-side: transcrição com evidências destacadas (via índices reais) à esquerda; análise interpretativa, evidências clicáveis (rolam até o trecho) e scores editáveis por eixo à direita;
- Ações: aprovar · salvar ajustes e aprovar (scores editados; evidências passam a `human_review`) · rejeitar (volta a `pending` para recodificação);
- Registra `reviewedBy`/`reviewedAt`; status final `reviewed`; navegação automática para a próxima da fila;
- Dupla codificação da amostra de confiabilidade (ver `METHODOLOGY.md` §6) — fase futura.

## 6. Exportações (`scripts/export-csv.ts`)

- `sermons.csv`, `sermon_analysis.csv`, `sermon_scores.csv`, `evidence.csv`, `biblical_references.csv`, `lexical_metrics.csv` em `data/processed/`;
- disponíveis também pela UI a qualquer momento (a "planilha" é saída, não ferramenta de trabalho).
