ALTER TYPE "AchievementRuleType" ADD VALUE 'LEGACY_EVIDENCE_COUNT';

CREATE TYPE "LegacyEvidenceKind" AS ENUM ('PARTICIPATION', 'SESSION');

CREATE TABLE "LegacyPlayerEvidence" (
  "id" UUID NOT NULL,
  "serverId" UUID NOT NULL,
  "playerIdentityId" UUID NOT NULL,
  "gameType" "GameType" NOT NULL,
  "kind" "LegacyEvidenceKind" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  "sourceKind" VARCHAR(40) NOT NULL,
  "sourceLabel" VARCHAR(80) NOT NULL,
  "sourceRecordHash" VARCHAR(64) NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dedupeKey" VARCHAR(220) NOT NULL,
  CONSTRAINT "LegacyPlayerEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegacyPlayerEvidence_dedupeKey_key" ON "LegacyPlayerEvidence"("dedupeKey");
CREATE INDEX "LegacyPlayerEvidence_serverId_occurredAt_idx" ON "LegacyPlayerEvidence"("serverId", "occurredAt");
CREATE INDEX "LegacyPlayerEvidence_playerIdentityId_occurredAt_idx" ON "LegacyPlayerEvidence"("playerIdentityId", "occurredAt");
CREATE INDEX "LegacyPlayerEvidence_kind_occurredAt_idx" ON "LegacyPlayerEvidence"("kind", "occurredAt");

ALTER TABLE "LegacyPlayerEvidence" ADD CONSTRAINT "LegacyPlayerEvidence_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegacyPlayerEvidence" ADD CONSTRAINT "LegacyPlayerEvidence_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
