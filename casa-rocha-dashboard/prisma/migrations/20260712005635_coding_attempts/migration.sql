-- CreateTable
CREATE TABLE "coding_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "parentAttemptId" TEXT,
    "attemptType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failStage" TEXT,
    "rawResponseText" TEXT,
    "extractedJson" TEXT,
    "validationIssuesJson" TEXT,
    "businessRuleIssuesJson" TEXT,
    "evidenceValidationJson" TEXT,
    "openrouterMetaJson" TEXT,
    "promptVersion" TEXT,
    "schemaVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coding_attempts_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "coding_attempts_sermonId_idx" ON "coding_attempts"("sermonId");

-- CreateIndex
CREATE INDEX "coding_attempts_status_idx" ON "coding_attempts"("status");
