-- CreateTable
CREATE TABLE "ServerMetricSample" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "playerCount" INTEGER,
    "maxPlayers" INTEGER,
    "pingMs" INTEGER,
    "processMemoryBytes" BIGINT,
    "cpuSeconds" DOUBLE PRECISION,
    "diskFreeBytes" BIGINT,
    "diskTotalBytes" BIGINT,
    "source" TEXT NOT NULL,

    CONSTRAINT "ServerMetricSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerMetricSample_serverId_observedAt_idx" ON "ServerMetricSample"("serverId", "observedAt");

-- AddForeignKey
ALTER TABLE "ServerMetricSample" ADD CONSTRAINT "ServerMetricSample_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
