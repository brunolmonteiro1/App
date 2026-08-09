-- CreateTable
CREATE TABLE "coding_repair_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "codingAttemptId" TEXT,
    "scoreField" TEXT NOT NULL,
    "originalScore" INTEGER,
    "suggestedScore" INTEGER,
    "suggestionReason" TEXT,
    "missingEvidenceReason" TEXT,
    "suggestedByModel" TEXT,
    "promptVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coding_repair_suggestions_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "human_review_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "reason" TEXT,
    "performedBy" TEXT,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "human_review_events_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "coding_repair_suggestions_sermonId_idx" ON "coding_repair_suggestions"("sermonId");

-- CreateIndex
CREATE INDEX "coding_repair_suggestions_status_idx" ON "coding_repair_suggestions"("status");

-- CreateIndex
CREATE INDEX "human_review_events_sermonId_idx" ON "human_review_events"("sermonId");
