-- CreateTable
CREATE TABLE "master_diagnostic_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generatedBy" TEXT,
    "filtersJson" TEXT,
    "inputMetricsHash" TEXT,
    "inputDenominatorJson" TEXT,
    "promptVersion" TEXT,
    "model" TEXT,
    "hardnessLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "datasetJson" TEXT,
    "reportJson" TEXT,
    "rawResponseText" TEXT,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "includesPreliminaryData" BOOLEAN NOT NULL DEFAULT false,
    "reviewedOnly" BOOLEAN NOT NULL DEFAULT true,
    "includesLexicalSignals" BOOLEAN NOT NULL DEFAULT false,
    "includesSensitiveSnippets" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userLabel" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "route" TEXT,
    "result" TEXT NOT NULL,
    "metadataJson" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "master_diagnostic_reports_status_idx" ON "master_diagnostic_reports"("status");

-- CreateIndex
CREATE INDEX "security_audit_logs_action_idx" ON "security_audit_logs"("action");

-- CreateIndex
CREATE INDEX "security_audit_logs_createdAt_idx" ON "security_audit_logs"("createdAt");
