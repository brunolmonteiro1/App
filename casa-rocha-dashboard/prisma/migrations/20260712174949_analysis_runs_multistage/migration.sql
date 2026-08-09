-- AlterTable
ALTER TABLE "coding_attempts" ADD COLUMN "analysisRunId" TEXT;

-- AlterTable
ALTER TABLE "sermon_analysis" ADD COLUMN "pipelineVersion" TEXT;
ALTER TABLE "sermon_analysis" ADD COLUMN "scoreMetadataJson" TEXT;

-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "currentStage" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "requestedBy" TEXT,
    "modelConfigurationJson" TEXT,
    "pipelineVersion" TEXT NOT NULL,
    "structurePromptVersion" TEXT,
    "interpretationPromptVersion" TEXT,
    "formativePromptVersion" TEXT,
    "evidencePromptVersion" TEXT,
    "auditPromptVersion" TEXT,
    "sourceTranscriptHash" TEXT,
    "totalTokens" INTEGER,
    "totalCostUsd" REAL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "failedAt" DATETIME,
    "failReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analysis_runs_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sermon_structure_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisRunId" TEXT NOT NULL,
    "structureJson" TEXT NOT NULL,
    "anchorsLocatedJson" TEXT,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "tokenUsageJson" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sermon_structure_analysis_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sermon_interpretation_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisRunId" TEXT NOT NULL,
    "hermeneuticsJson" TEXT NOT NULL,
    "argumentationJson" TEXT NOT NULL,
    "homileticsJson" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "tokenUsageJson" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sermon_interpretation_analysis_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sermon_formative_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisRunId" TEXT NOT NULL,
    "formationJson" TEXT NOT NULL,
    "categoricalFieldsJson" TEXT NOT NULL,
    "gapAnalysisJson" TEXT,
    "scoreMetadataJson" TEXT,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "tokenUsageJson" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sermon_formative_analysis_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evidence_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisRunId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "reason" TEXT,
    "locationStatus" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "startIndex" INTEGER,
    "endIndex" INTEGER,
    "model" TEXT,
    "promptVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_candidates_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sermon_evidence" (
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
    "analysisRunId" TEXT,
    "promptVersion" TEXT,
    "evidenceBasis" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sermon_evidence_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sermon_evidence" ("analysisMethod", "analyticalComment", "category", "confidence", "createdAt", "evidenceEndIndex", "evidenceQuote", "evidenceStartIndex", "id", "keywordMatched", "scoreField", "scoreValue", "sermonId", "updatedAt") SELECT "analysisMethod", "analyticalComment", "category", "confidence", "createdAt", "evidenceEndIndex", "evidenceQuote", "evidenceStartIndex", "id", "keywordMatched", "scoreField", "scoreValue", "sermonId", "updatedAt" FROM "sermon_evidence";
DROP TABLE "sermon_evidence";
ALTER TABLE "new_sermon_evidence" RENAME TO "sermon_evidence";
CREATE INDEX "sermon_evidence_sermonId_idx" ON "sermon_evidence"("sermonId");
CREATE INDEX "sermon_evidence_category_idx" ON "sermon_evidence"("category");
CREATE INDEX "sermon_evidence_scoreField_idx" ON "sermon_evidence"("scoreField");
CREATE INDEX "sermon_evidence_analysisRunId_idx" ON "sermon_evidence"("analysisRunId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "analysis_runs_sermonId_idx" ON "analysis_runs"("sermonId");

-- CreateIndex
CREATE INDEX "analysis_runs_sermonId_isCurrent_idx" ON "analysis_runs"("sermonId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_structure_analysis_analysisRunId_key" ON "sermon_structure_analysis"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_interpretation_analysis_analysisRunId_key" ON "sermon_interpretation_analysis"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_formative_analysis_analysisRunId_key" ON "sermon_formative_analysis"("analysisRunId");

-- CreateIndex
CREATE INDEX "evidence_candidates_analysisRunId_idx" ON "evidence_candidates"("analysisRunId");

-- CreateIndex
CREATE INDEX "evidence_candidates_field_idx" ON "evidence_candidates"("field");

-- CreateIndex
CREATE INDEX "coding_attempts_analysisRunId_idx" ON "coding_attempts"("analysisRunId");
