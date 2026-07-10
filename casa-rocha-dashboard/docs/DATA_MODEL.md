# DATA_MODEL — Modelo de dados e rascunho do schema Prisma

Banco: SQLite no MVP (arquivo local via Prisma), PostgreSQL/Supabase na versão deploy. Nomes de tabela em `snake_case` via `@@map`.

## Visão geral

```
sermons 1──1 sermon_analysis
sermons 1──1 sermon_scores
sermons 1──N sermon_evidence
sermons 1──N biblical_references
sermons 1──N lexical_metrics
codebook_categories (referência da régua; versionada)
import_runs (log de importações idempotentes)
```

## Rascunho `prisma/schema.prisma`

```prisma
// ─────────────────────────────────────────────
// Pregações / fontes
// ─────────────────────────────────────────────
model Sermon {
  id                    String   @id @default(cuid())
  notebookSourceId      String   @unique          // sources[].id do backup
  contentHash           String                    // sha256 do content → import idempotente
  title                 String
  normalizedTitle       String
  messageNumber         Int?                      // "#NN" do título
  series                String?                   // normalizada (ver PIPELINE.md)
  seriesRaw             String?                   // como veio do título/TSV
  preacher              String?
  dateEstimated         DateTime?                 // do TSV
  dateConfidence        String?                   // Alta | Média | Baixa (TSV) — datas são estimadas
  year                  Int?
  youtubeUrl            String?
  youtubeId             String?  @unique
  sourceType            String                    // SOURCE_TYPE_YOUTUBE_VIDEO | _TEXT | _PDF
  isSermon              Boolean  @default(true)   // false p/ dossiê, texto colado, TSV
  durationRaw           String?                   // "51:44" (TSV)
  durationSeconds       Int?
  transcriptText        String
  transcriptCharCount   Int
  transcriptWordCount   Int
  transcriptQualityFlag String?                   // ex.: "curta_para_duracao"
  metadataConflict      String?                   // divergência JSON × TSV, para revisão
  importStatus          String   @default("imported")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  analysis   SermonAnalysis?
  scores     SermonScores?
  evidence   SermonEvidence[]
  references BiblicalReference[]
  lexical    LexicalMetric[]

  @@map("sermons")
}

// ─────────────────────────────────────────────
// Análise estruturada (1 por pregação, versionada)
// ─────────────────────────────────────────────
model SermonAnalysis {
  id                        String   @id @default(cuid())
  sermonId                  String   @unique
  analysisStatus            String   @default("pending") // pending | ai_coded | reviewed
  analysisVersion           Int      @default(1)         // versão do codebook usada
  reviewStatus              String?                       // approved | adjusted | rejected
  reviewedBy                String?
  reviewedAt                DateTime?
  confidenceGlobal          String?                       // alta | media | baixa

  biblicalMainText          String?
  biblicalBooksCited        String?  // JSON array
  testamentPredominant      String?  // AT | NT | misto
  sermonType                String?  // ver CODEBOOK.md §3
  mainTheme                 String?
  secondaryThemes           String?  // JSON array
  doctrineMain              String?
  doctrinesSecondary        String?  // JSON array
  pastoralTone              String?
  formativeFocus            String?
  individualVsCommunityFocus String?
  theologicalLevel          String?
  languageComplexityScore   Int?
  summary3Lines             String?
  mainApplication           String?
  possibleFormativeGap      String?  // sempre redigida como hipótese
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  sermon Sermon @relation(fields: [sermonId], references: [id])
  @@map("sermon_analysis")
}

// ─────────────────────────────────────────────
// Scores 0–5 (1 linha por pregação; colunas por categoria)
// ─────────────────────────────────────────────
model SermonScores {
  id       String @id @default(cuid())
  sermonId String @unique

  // Eixo 1 — saúde bíblica e homilética
  biblicalHealthScore        Int?
  homileticExpositionScore   Int?
  christocentricReadingScore Int?
  biblicalApplicationScore   Int?

  // Eixo 2 — ortodoxia
  orthodoxyScore        Int?
  trinityScore          Int?
  theologyProperScore   Int?
  christologyScore      Int?
  crucicentrismScore    Int?
  soteriologyScore      Int?
  pneumatologyScore     Int?
  bibliologyScore       Int?
  ecclesiologyScore     Int?
  eschatologyScore      Int?
  anthropologyScore     Int?
  hamartiologyScore     Int?
  sanctificationScore   Int?
  kingdomTheologyScore  Int?

  // Eixo 3 — ortopraxia
  orthopraxyScore               Int?
  serviceDiaconiaScore          Int?
  generosityScore               Int?
  missionEvangelismScore        Int?
  discipleshipScore             Int?
  communityMutualityScore       Int?
  hospitalityScore              Int?
  careForPoorScore              Int?
  forgivenessReconciliationScore Int?
  vocationWorkScore             Int?
  familyRelationshipsScore      Int?
  financeStewardshipScore       Int?

  // Eixo 4 — espiritualidade
  spiritualityScore         Int?
  prayerScore               Int?
  scriptureDevotionScore    Int?
  fastingScore              Int?
  worshipScore              Int?
  repentanceScore           Int?
  discernmentScore          Int?
  spiritualDisciplinesScore Int?

  // Eixo 8 — saúde pastoral
  pastoralHealthScore              Int?
  religiousDeconstructionScore     Int?
  discipleshipReconstructionScore  Int?
  practicalActivationScore         Int?
  healingWoundedScore              Int?
  sendingHealedScore               Int?
  coresponsibilityScore            Int?
  passivityRiskScore               Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sermon Sermon @relation(fields: [sermonId], references: [id])
  @@map("sermon_scores")
}

// ─────────────────────────────────────────────
// Evidências/snippets (N por pregação) — base do drill-down
// ─────────────────────────────────────────────
model SermonEvidence {
  id                 String   @id @default(cuid())
  sermonId           String
  category           String   // ex.: "desconstrucao_religiosa"
  scoreField         String   // ex.: "religiousDeconstructionScore"
  scoreValue         Int?
  evidenceQuote      String   // trecho curto da transcrição
  evidenceStartIndex Int?     // posição no transcriptText → destaque na UI
  evidenceEndIndex   Int?
  keywordMatched     String?
  analyticalComment  String?
  analysisMethod     String   // dictionary | regex | tfidf | embedding | ai_coding | human_review
  confidence         String?  // alta | media | baixa
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  sermon Sermon @relation(fields: [sermonId], references: [id])
  @@index([sermonId])
  @@index([category])
  @@index([scoreField])
  @@map("sermon_evidence")
}

// ─────────────────────────────────────────────
// Motor bíblico — referências detectadas por regex (camada determinística)
// ─────────────────────────────────────────────
model BiblicalReference {
  id           String  @id @default(cuid())
  sermonId     String
  book         String  // nome canônico ("Gênesis", "João"…)
  bookSlug     String  // "genesis", "joao" — junta variantes
  testament    String  // AT | NT
  chapter      Int?
  verseStart   Int?
  verseEnd     Int?
  rawMatch     String  // texto exatamente como apareceu
  startIndex   Int
  endIndex     Int
  isMainText   Boolean @default(false) // marcado na codificação/revisão
  createdAt    DateTime @default(now())

  sermon Sermon @relation(fields: [sermonId], references: [id])
  @@index([sermonId])
  @@index([bookSlug])
  @@map("biblical_references")
}

// ─────────────────────────────────────────────
// Métricas lexicais (camada 1) — densidade por tema/termo
// ─────────────────────────────────────────────
model LexicalMetric {
  id            String @id @default(cuid())
  sermonId      String
  theme         String  // bloco/tema do dicionário (ex.: "cruz_soteriologia")
  term          String? // termo específico, ou null p/ agregado do tema
  rawCount      Int
  densityPer10k Float   // ocorrências por 10.000 palavras
  createdAt     DateTime @default(now())

  sermon Sermon @relation(fields: [sermonId], references: [id])
  @@unique([sermonId, theme, term])
  @@map("lexical_metrics")
}

// ─────────────────────────────────────────────
// Codebook (régua oficial, versionada)
// ─────────────────────────────────────────────
model CodebookCategory {
  id               String  @id @default(cuid())
  fieldName        String  // ex.: "religiousDeconstructionScore"
  label            String
  axis             String  // eixo 1–8
  description      String
  score0Definition String
  score1Definition String
  score2Definition String
  score3Definition String
  score4Definition String
  score5Definition String
  examplesPositive String?
  examplesNegative String?
  keywords         String? // JSON array — dicionário lexical da categoria
  version          Int     @default(1)
  active           Boolean @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([fieldName, version])
  @@map("codebook_categories")
}

// ─────────────────────────────────────────────
// Log de importações (idempotência e auditoria)
// ─────────────────────────────────────────────
model ImportRun {
  id             String   @id @default(cuid())
  fileName       String
  exportedAt     DateTime?  // do JSON
  sourcesTotal   Int
  sourcesNew     Int
  sourcesUpdated Int
  sourcesSkipped Int
  conflicts      String?    // JSON array de conflitos detectados
  createdAt      DateTime @default(now())

  @@map("import_runs")
}
```

## Decisões de modelagem

1. **`contentHash` + `notebookSourceId`** — re-importar um backup futuro do NotebookLM só adiciona fontes novas ou atualiza conteúdo alterado; nunca duplica nem apaga análises existentes (ver `PIPELINE.md` §1.5).
2. **`isSermon`** — o dossiê PDF, o texto colado e o TSV entram no banco como fontes (auditabilidade), mas ficam fora de todas as agregações homiléticas.
3. **`dateConfidence` obrigatório na UI** — toda visualização temporal distingue data confirmada de data estimada.
4. **Scores em colunas, evidências em linhas** — colunas facilitam agregação (média por série/ano); a tabela `sermon_evidence` carrega a justificativa de cada score com posição no texto, viabilizando o destaque na transcrição e o drill-down.
5. **`analysisMethod` na evidência** — rastreia se o dado veio de dicionário, regex, TF-IDF, embedding, codificação por IA ou revisão humana (selo de proveniência, ver `METHODOLOGY.md`).
6. **`analysisVersion`** — quando o codebook mudar de versão, é trivial listar análises desatualizadas para recodificação.
7. **Busca full-text** — SQLite FTS5 sobre `transcriptText` via tabela virtual criada em migração SQL manual (Prisma não gera FTS5; usar `prisma migrate` com SQL customizado).
8. **Campos JSON como `String`** — SQLite não tem tipo JSON nativo no Prisma; arrays serializados e validados com Zod na aplicação.
