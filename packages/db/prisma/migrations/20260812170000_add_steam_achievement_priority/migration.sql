ALTER TABLE "SteamAchievementSync"
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "SteamAchievementSync_priority_nonnegative" CHECK ("priority" >= 0);

DROP INDEX "SteamAchievementSync_status_nextAttemptAt_idx";
CREATE INDEX "SteamAchievementSync_status_nextAttemptAt_priority_idx" ON "SteamAchievementSync"("status", "nextAttemptAt", "priority");
