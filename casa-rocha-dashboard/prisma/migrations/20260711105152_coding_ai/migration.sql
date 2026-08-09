-- AlterTable
ALTER TABLE "sermon_analysis" ADD COLUMN "aiCodedAt" DATETIME;
ALTER TABLE "sermon_analysis" ADD COLUMN "aiError" TEXT;
ALTER TABLE "sermon_analysis" ADD COLUMN "aiModel" TEXT;

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
