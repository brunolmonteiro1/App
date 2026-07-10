-- CreateTable
CREATE TABLE "sermons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookSourceId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "messageNumber" INTEGER,
    "series" TEXT,
    "seriesRaw" TEXT,
    "preacher" TEXT,
    "dateEstimated" DATETIME,
    "dateConfidence" TEXT,
    "year" INTEGER,
    "youtubeUrl" TEXT,
    "youtubeId" TEXT,
    "sourceType" TEXT NOT NULL,
    "isSermon" BOOLEAN NOT NULL DEFAULT true,
    "durationRaw" TEXT,
    "durationSeconds" INTEGER,
    "transcriptText" TEXT NOT NULL,
    "transcriptCharCount" INTEGER NOT NULL,
    "transcriptWordCount" INTEGER NOT NULL,
    "transcriptQualityFlag" TEXT,
    "metadataConflict" TEXT,
    "importStatus" TEXT NOT NULL DEFAULT 'imported',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sermon_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "analysisVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "confidenceGlobal" TEXT,
    "biblicalMainText" TEXT,
    "biblicalBooksCited" TEXT,
    "testamentPredominant" TEXT,
    "sermonType" TEXT,
    "mainTheme" TEXT,
    "secondaryThemes" TEXT,
    "doctrineMain" TEXT,
    "doctrinesSecondary" TEXT,
    "pastoralTone" TEXT,
    "formativeFocus" TEXT,
    "individualVsCommunityFocus" TEXT,
    "theologicalLevel" TEXT,
    "languageComplexityScore" INTEGER,
    "ontologicalVsPragmatic" TEXT,
    "summary3Lines" TEXT,
    "mainApplication" TEXT,
    "possibleFormativeGap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sermon_analysis_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sermon_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "biblicalHealthScore" INTEGER,
    "homileticExpositionScore" INTEGER,
    "christocentricReadingScore" INTEGER,
    "biblicalApplicationScore" INTEGER,
    "orthodoxyScore" INTEGER,
    "trinityScore" INTEGER,
    "theologyProperScore" INTEGER,
    "christologyScore" INTEGER,
    "crucicentrismScore" INTEGER,
    "soteriologyScore" INTEGER,
    "pneumatologyScore" INTEGER,
    "bibliologyScore" INTEGER,
    "ecclesiologyScore" INTEGER,
    "eschatologyScore" INTEGER,
    "anthropologyScore" INTEGER,
    "hamartiologyScore" INTEGER,
    "sanctificationScore" INTEGER,
    "kingdomTheologyScore" INTEGER,
    "orthopraxyScore" INTEGER,
    "serviceDiaconiaScore" INTEGER,
    "generosityScore" INTEGER,
    "missionEvangelismScore" INTEGER,
    "discipleshipScore" INTEGER,
    "communityMutualityScore" INTEGER,
    "hospitalityScore" INTEGER,
    "careForPoorScore" INTEGER,
    "forgivenessReconciliationScore" INTEGER,
    "vocationWorkScore" INTEGER,
    "familyRelationshipsScore" INTEGER,
    "financeStewardshipScore" INTEGER,
    "spiritualityScore" INTEGER,
    "prayerScore" INTEGER,
    "scriptureDevotionScore" INTEGER,
    "fastingScore" INTEGER,
    "worshipScore" INTEGER,
    "repentanceScore" INTEGER,
    "discernmentScore" INTEGER,
    "spiritualDisciplinesScore" INTEGER,
    "pastoralHealthScore" INTEGER,
    "religiousDeconstructionScore" INTEGER,
    "discipleshipReconstructionScore" INTEGER,
    "practicalActivationScore" INTEGER,
    "healingWoundedScore" INTEGER,
    "sendingHealedScore" INTEGER,
    "coresponsibilityScore" INTEGER,
    "passivityRiskScore" INTEGER,
    "cynicismElitismRiskScore" INTEGER,
    "practicalMethodScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sermon_scores_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sermon_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scoreField" TEXT NOT NULL,
    "scoreValue" INTEGER,
    "evidenceQuote" TEXT NOT NULL,
    "evidenceStartIndex" INTEGER,
    "evidenceEndIndex" INTEGER,
    "keywordMatched" TEXT,
    "analyticalComment" TEXT,
    "analysisMethod" TEXT NOT NULL,
    "confidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sermon_evidence_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biblical_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "bookSlug" TEXT NOT NULL,
    "testament" TEXT NOT NULL,
    "chapter" INTEGER,
    "verseStart" INTEGER,
    "verseEnd" INTEGER,
    "rawMatch" TEXT NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "isMainText" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "biblical_references_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lexical_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "term" TEXT,
    "rawCount" INTEGER NOT NULL,
    "densityPer10k" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lexical_metrics_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saturation_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "iscRatio" REAL,
    "criticDensityPer10k" REAL NOT NULL,
    "gospelDensityPer10k" REAL NOT NULL,
    "criticRawCount" INTEGER NOT NULL,
    "gospelRawCount" INTEGER NOT NULL,
    "saturationLabel" TEXT,
    "thresholdUsed" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "saturation_metrics_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "codebook_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fieldName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score0Definition" TEXT NOT NULL,
    "score1Definition" TEXT NOT NULL,
    "score2Definition" TEXT NOT NULL,
    "score3Definition" TEXT NOT NULL,
    "score4Definition" TEXT NOT NULL,
    "score5Definition" TEXT NOT NULL,
    "examplesPositive" TEXT,
    "examplesNegative" TEXT,
    "keywords" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "benchmark_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic" TEXT NOT NULL,
    "baseTexts" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "exportedAt" DATETIME,
    "sourcesTotal" INTEGER NOT NULL,
    "sourcesNew" INTEGER NOT NULL,
    "sourcesUpdated" INTEGER NOT NULL,
    "sourcesSkipped" INTEGER NOT NULL,
    "conflicts" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "sermons_notebookSourceId_key" ON "sermons"("notebookSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "sermons_youtubeId_key" ON "sermons"("youtubeId");

-- CreateIndex
CREATE INDEX "sermons_year_idx" ON "sermons"("year");

-- CreateIndex
CREATE INDEX "sermons_series_idx" ON "sermons"("series");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_analysis_sermonId_key" ON "sermon_analysis"("sermonId");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_scores_sermonId_key" ON "sermon_scores"("sermonId");

-- CreateIndex
CREATE INDEX "sermon_evidence_sermonId_idx" ON "sermon_evidence"("sermonId");

-- CreateIndex
CREATE INDEX "sermon_evidence_category_idx" ON "sermon_evidence"("category");

-- CreateIndex
CREATE INDEX "sermon_evidence_scoreField_idx" ON "sermon_evidence"("scoreField");

-- CreateIndex
CREATE INDEX "biblical_references_sermonId_idx" ON "biblical_references"("sermonId");

-- CreateIndex
CREATE INDEX "biblical_references_bookSlug_idx" ON "biblical_references"("bookSlug");

-- CreateIndex
CREATE INDEX "lexical_metrics_theme_idx" ON "lexical_metrics"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "lexical_metrics_sermonId_theme_term_key" ON "lexical_metrics"("sermonId", "theme", "term");

-- CreateIndex
CREATE UNIQUE INDEX "saturation_metrics_sermonId_key" ON "saturation_metrics"("sermonId");

-- CreateIndex
CREATE UNIQUE INDEX "codebook_categories_fieldName_version_key" ON "codebook_categories"("fieldName", "version");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_topics_topic_key" ON "benchmark_topics"("topic");
