-- Remove only unowned, unreferenced placeholder identities that could never
-- represent a durable game-provider identity. If a placeholder has acquired a
-- user-facing reference, abort below so it can be reviewed instead of guessed.
INSERT INTO "AuditLog" ("id", "action", "entityType", "entityId", "before", "createdAt")
SELECT
  gen_random_uuid(),
  'INVALID_PLAYER_PROVIDER_IDENTITY_REMOVED',
  'PlayerIdentity',
  identity."id"::text,
  jsonb_build_object(
    'gameType', identity."gameType",
    'providerKey', identity."providerKey",
    'displayName', identity."displayName"
  ),
  CURRENT_TIMESTAMP
FROM "PlayerIdentity" identity
WHERE lower(btrim(identity."providerKey")) IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  AND identity."userId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "PlayerIdentityClaim" claim WHERE claim."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "LegacyPlayerEvidence" evidence WHERE evidence."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "IdentityRewardReconciliation" reconciliation WHERE reconciliation."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHolder" holder WHERE holder."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHistory" history WHERE history."playerIdentityId" = identity."id");

DELETE FROM "ServerEvent" event
USING "PlayerIdentity" identity
WHERE event."playerIdentityId" = identity."id"
  AND lower(btrim(identity."providerKey")) IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  AND identity."userId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "PlayerIdentityClaim" claim WHERE claim."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "LegacyPlayerEvidence" evidence WHERE evidence."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "IdentityRewardReconciliation" reconciliation WHERE reconciliation."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHolder" holder WHERE holder."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHistory" history WHERE history."playerIdentityId" = identity."id");

DELETE FROM "PlayerIdentity" identity
WHERE lower(btrim(identity."providerKey")) IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  AND identity."userId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "PlayerIdentityClaim" claim WHERE claim."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "LegacyPlayerEvidence" evidence WHERE evidence."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "IdentityRewardReconciliation" reconciliation WHERE reconciliation."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHolder" holder WHERE holder."playerIdentityId" = identity."id")
  AND NOT EXISTS (SELECT 1 FROM "RecordHistory" history WHERE history."playerIdentityId" = identity."id");

DELETE FROM "ServerPlayerPresence"
WHERE lower(btrim("providerKey")) IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "PlayerIdentity"
    WHERE lower(btrim("providerKey")) IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  ) THEN
    RAISE EXCEPTION 'A referenced placeholder PlayerIdentity requires manual review before this migration can continue.';
  END IF;
END $$;

ALTER TABLE "PlayerIdentity"
  ADD CONSTRAINT "PlayerIdentity_providerKey_stable"
  CHECK (
    char_length(btrim("providerKey")) BETWEEN 1 AND 160
    AND lower(btrim("providerKey")) NOT IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  );

ALTER TABLE "ServerPlayerPresence"
  ADD CONSTRAINT "ServerPlayerPresence_providerKey_stable"
  CHECK (
    char_length(btrim("providerKey")) BETWEEN 1 AND 160
    AND lower(btrim("providerKey")) NOT IN ('none', 'null', 'unknown', 'n/a', 'na', '0', '-')
  );

-- Older automatic Steam attachments predate the reconciliation queue. Queue
-- every verified owned identity that has never been reconciled.
INSERT INTO "IdentityRewardReconciliation" (
  "id", "playerIdentityId", "userId", "queuedAt", "attempts"
)
SELECT gen_random_uuid(), identity."id", identity."userId", CURRENT_TIMESTAMP, 0
FROM "PlayerIdentity" identity
WHERE identity."userId" IS NOT NULL
  AND identity."verifiedAt" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "IdentityRewardReconciliation" reconciliation
    WHERE reconciliation."playerIdentityId" = identity."id"
  );
