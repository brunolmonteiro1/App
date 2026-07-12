-- AlterTable
ALTER TABLE "sermon_scores" ADD COLUMN "activationAfterCritiqueScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "biblicalGroundingOfCritiqueScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "contextualCritiqueIntensityScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "institutionalActionScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "organicDiaconiaScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "politicalIdolatryCritiqueScore" INTEGER;
ALTER TABLE "sermon_scores" ADD COLUMN "reconstructionAfterCritiqueScore" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sermon_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sermonId" TEXT NOT NULL,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "analysisVersion" INTEGER NOT NULL DEFAULT 1,
    "aiModel" TEXT,
    "aiCodedAt" DATETIME,
    "aiError" TEXT,
    "aiScoresJson" TEXT,
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
    "applicationMode" TEXT,
    "discourseMode" TEXT,
    "critiqueShareEstimate" TEXT,
    "criticTarget" TEXT,
    "criticTone" TEXT,
    "healthyOrDemobilizingCritique" TEXT,
    "politicalCritiqueTarget" TEXT,
    "needsHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "sensitivityLevel" TEXT,
    "summary3Lines" TEXT,
    "mainApplication" TEXT,
    "possibleFormativeGap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sermon_analysis_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "sermons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sermon_analysis" ("aiCodedAt", "aiError", "aiModel", "aiScoresJson", "analysisStatus", "analysisVersion", "biblicalBooksCited", "biblicalMainText", "confidenceGlobal", "createdAt", "doctrineMain", "doctrinesSecondary", "formativeFocus", "id", "individualVsCommunityFocus", "languageComplexityScore", "mainApplication", "mainTheme", "ontologicalVsPragmatic", "pastoralTone", "possibleFormativeGap", "reviewStatus", "reviewedAt", "reviewedBy", "secondaryThemes", "sermonId", "sermonType", "summary3Lines", "testamentPredominant", "theologicalLevel", "updatedAt") SELECT "aiCodedAt", "aiError", "aiModel", "aiScoresJson", "analysisStatus", "analysisVersion", "biblicalBooksCited", "biblicalMainText", "confidenceGlobal", "createdAt", "doctrineMain", "doctrinesSecondary", "formativeFocus", "id", "individualVsCommunityFocus", "languageComplexityScore", "mainApplication", "mainTheme", "ontologicalVsPragmatic", "pastoralTone", "possibleFormativeGap", "reviewStatus", "reviewedAt", "reviewedBy", "secondaryThemes", "sermonId", "sermonType", "summary3Lines", "testamentPredominant", "theologicalLevel", "updatedAt" FROM "sermon_analysis";
DROP TABLE "sermon_analysis";
ALTER TABLE "new_sermon_analysis" RENAME TO "sermon_analysis";
CREATE UNIQUE INDEX "sermon_analysis_sermonId_key" ON "sermon_analysis"("sermonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
