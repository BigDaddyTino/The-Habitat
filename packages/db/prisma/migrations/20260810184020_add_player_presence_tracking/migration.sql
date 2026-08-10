-- CreateTable
CREATE TABLE "ServerPlayerPresence" (
    "serverId" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "firstObservedAt" TIMESTAMP(3) NOT NULL,
    "lastObservedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerPlayerPresence_pkey" PRIMARY KEY ("serverId","providerKey")
);

-- CreateIndex
CREATE INDEX "ServerPlayerPresence_serverId_present_idx" ON "ServerPlayerPresence"("serverId", "present");

-- AddForeignKey
ALTER TABLE "ServerPlayerPresence" ADD CONSTRAINT "ServerPlayerPresence_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
