-- CreateEnum
CREATE TYPE "RecordHall" AS ENUM ('LEGENDS', 'SHAME');

-- CreateEnum
CREATE TYPE "RecordRuleType" AS ENUM ('PLAYER_EVENT_COUNT', 'DISTINCT_GAME_EVENT_COUNT', 'ACHIEVEMENT_COUNT');

-- CreateTable
CREATE TABLE "RecordDefinition" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hall" "RecordHall" NOT NULL,
    "gameType" "GameType",
    "category" TEXT NOT NULL,
    "valueLabel" TEXT NOT NULL,
    "ruleType" "RecordRuleType" NOT NULL,
    "ruleConfig" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordHolder" (
    "id" UUID NOT NULL,
    "recordDefinitionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "playerIdentityId" UUID NOT NULL,
    "holderName" TEXT NOT NULL,
    "valueNumber" INTEGER NOT NULL,
    "sourceEventId" UUID NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordHistory" (
    "id" UUID NOT NULL,
    "recordDefinitionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "playerIdentityId" UUID NOT NULL,
    "holderName" TEXT NOT NULL,
    "valueNumber" INTEGER NOT NULL,
    "priorValue" INTEGER,
    "priorHolderName" TEXT,
    "sourceEventId" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dedupeKey" TEXT NOT NULL,

    CONSTRAINT "RecordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecordDefinition_slug_key" ON "RecordDefinition"("slug");

-- CreateIndex
CREATE INDEX "RecordDefinition_hall_enabled_idx" ON "RecordDefinition"("hall", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RecordHolder_recordDefinitionId_key" ON "RecordHolder"("recordDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordHistory_dedupeKey_key" ON "RecordHistory"("dedupeKey");

-- CreateIndex
CREATE INDEX "RecordHistory_recordDefinitionId_occurredAt_idx" ON "RecordHistory"("recordDefinitionId", "occurredAt");

-- CreateIndex
CREATE INDEX "RecordHistory_userId_occurredAt_idx" ON "RecordHistory"("userId", "occurredAt");

-- AddForeignKey
ALTER TABLE "RecordHolder" ADD CONSTRAINT "RecordHolder_recordDefinitionId_fkey" FOREIGN KEY ("recordDefinitionId") REFERENCES "RecordDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordHolder" ADD CONSTRAINT "RecordHolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordHolder" ADD CONSTRAINT "RecordHolder_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordHistory" ADD CONSTRAINT "RecordHistory_recordDefinitionId_fkey" FOREIGN KEY ("recordDefinitionId") REFERENCES "RecordDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordHistory" ADD CONSTRAINT "RecordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordHistory" ADD CONSTRAINT "RecordHistory_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
