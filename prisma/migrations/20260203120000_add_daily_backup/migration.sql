-- CreateTable
CREATE TABLE "DailyBackup" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "backupType" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyBackup_dateKey_key" ON "DailyBackup"("dateKey");

-- CreateIndex
CREATE INDEX "DailyBackup_dateKey_idx" ON "DailyBackup"("dateKey");

-- CreateIndex
CREATE INDEX "DailyBackup_createdAt_idx" ON "DailyBackup"("createdAt");
