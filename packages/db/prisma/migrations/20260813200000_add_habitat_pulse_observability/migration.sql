-- Habitat Pulse. Operational observability for the installation itself: which
-- processes are alive, whether the public tunnel is carrying traffic, whether
-- each world's collectors are still yielding records, and whether the reward
-- pipeline is quietly failing. Everything here is administrator-facing and
-- deliberately stores no infrastructure addresses or secrets.

CREATE TYPE "HabitatService" AS ENUM ('WEB', 'WORKER', 'AGENT');
CREATE TYPE "PulseStatus" AS ENUM ('OK', 'WARN', 'CRITICAL', 'UNKNOWN');
CREATE TYPE "PulseCategory" AS ENUM ('DELIVERY', 'SERVICES', 'COLLECTION', 'DATA', 'PROVIDERS', 'PIPELINE');

ALTER TYPE "DiscordNotificationKind" ADD VALUE 'OPERATIONS_ALERT';

-- Operational alerts carry infrastructure detail, so they are never delivered to
-- the community announcement channel. A guild opts in by naming a separate
-- operations channel; leaving it NULL keeps operational alerting off entirely.
ALTER TABLE "DiscordGuildConfig" ADD COLUMN "operationsChannelId" TEXT;
ALTER TABLE "DiscordGuildConfig" ADD COLUMN "notifyOperationalAlert" BOOLEAN NOT NULL DEFAULT true;

-- Delivery target is captured when the notification is queued, so a later
-- configuration change can never redirect a queued operational alert into a
-- community channel.
ALTER TABLE "DiscordNotification" ADD COLUMN "channelId" VARCHAR(40);

CREATE TABLE "ServiceHeartbeat" (
  "service" "HabitatService" NOT NULL,
  "instanceId" VARCHAR(80) NOT NULL,
  "hostname" VARCHAR(120) NOT NULL,
  "version" VARCHAR(40) NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "intervalMs" INTEGER NOT NULL,
  "detail" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceHeartbeat_pkey" PRIMARY KEY ("service")
);

-- A beat that claims an impossible cadence would make every staleness judgement
-- meaningless, so the write is rejected rather than silently trusted.
ALTER TABLE "ServiceHeartbeat"
  ADD CONSTRAINT "ServiceHeartbeat_interval_is_sane"
  CHECK ("intervalMs" >= 1000 AND "intervalMs" <= 3600000);

CREATE TABLE "PulseSignal" (
  "key" VARCHAR(60) NOT NULL,
  "category" "PulseCategory" NOT NULL,
  "status" "PulseStatus" NOT NULL,
  "summary" VARCHAR(240) NOT NULL,
  "detail" JSONB,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "statusSince" TIMESTAMP(3) NOT NULL,
  "lastOkAt" TIMESTAMP(3),
  "notifiedStatus" "PulseStatus",
  "notifiedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PulseSignal_pkey" PRIMARY KEY ("key")
);

-- A green tile must be able to say when it was last proven green. Without this
-- an OK row with no lastOkAt would render as healthy but undated.
ALTER TABLE "PulseSignal"
  ADD CONSTRAINT "PulseSignal_ok_has_last_ok_at"
  CHECK ("status" <> 'OK' OR "lastOkAt" IS NOT NULL);

CREATE INDEX "PulseSignal_status_observedAt_idx" ON "PulseSignal" ("status", "observedAt");

CREATE TABLE "CollectorSourceState" (
  "serverId" UUID NOT NULL,
  "sourceKind" VARCHAR(60) NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT false,
  "truncated" BOOLEAN NOT NULL DEFAULT false,
  "lastScanAt" TIMESTAMP(3) NOT NULL,
  "lastYieldAt" TIMESTAMP(3),
  "lastRecordAt" TIMESTAMP(3),
  "recordsLastScan" INTEGER NOT NULL DEFAULT 0,
  "importedLastScan" INTEGER NOT NULL DEFAULT 0,
  "lastError" VARCHAR(240),
  CONSTRAINT "CollectorSourceState_pkey" PRIMARY KEY ("serverId", "sourceKind")
);

ALTER TABLE "CollectorSourceState"
  ADD CONSTRAINT "CollectorSourceState_serverId_fkey"
  FOREIGN KEY ("serverId") REFERENCES "GameServer" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Counts are observations, never negative.
ALTER TABLE "CollectorSourceState"
  ADD CONSTRAINT "CollectorSourceState_counts_nonnegative"
  CHECK ("recordsLastScan" >= 0 AND "importedLastScan" >= 0);

-- An unavailable source cannot also be claiming that it yielded records.
ALTER TABLE "CollectorSourceState"
  ADD CONSTRAINT "CollectorSourceState_unavailable_yields_nothing"
  CHECK ("available" OR "recordsLastScan" = 0);

CREATE INDEX "CollectorSourceState_lastScanAt_idx" ON "CollectorSourceState" ("lastScanAt");

CREATE TABLE "EvaluationFailure" (
  "id" UUID NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "scope" VARCHAR(120) NOT NULL,
  "reference" VARCHAR(200),
  "message" VARCHAR(300) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "EvaluationFailure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvaluationFailure_occurredAt_idx" ON "EvaluationFailure" ("occurredAt");
CREATE INDEX "EvaluationFailure_kind_resolvedAt_occurredAt_idx" ON "EvaluationFailure" ("kind", "resolvedAt", "occurredAt");
