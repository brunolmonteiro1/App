-- CreateTable
CREATE TABLE "coding_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "model" TEXT,
    "analysisRunId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "nextAttemptAt" DATETIME,
    "lastError" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coding_jobs_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_jobs_sermonId_key" ON "coding_jobs"("sermonId");

-- CreateIndex
CREATE INDEX "coding_jobs_status_idx" ON "coding_jobs"("status");

-- CreateIndex
CREATE INDEX "coding_jobs_nextAttemptAt_idx" ON "coding_jobs"("nextAttemptAt");
