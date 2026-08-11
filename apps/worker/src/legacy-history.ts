import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { AgentLegacyHistory, AgentLegacyPlayerEvidence } from "@habitat/shared";
import { evaluateAchievementsForEvent, evaluateAchievementsForLegacyEvidence } from "./achievements.js";
import { autoLinkVerifiedSteamIdentity } from "./monitoring.js";
import { evaluateRecordsForEvent } from "./records.js";
import { processProgressionForEvent } from "./progression.js";

export type LegacyHistoryReader = { readLegacyHistories(): Promise<AgentLegacyHistory[]> };
export type LegacyImportResult = { servers: number; evidenceImported: number; sessionsImported: number; ignored: number };

export async function importLegacyHistory(reader: LegacyHistoryReader): Promise<LegacyImportResult> {
  const db = getPrismaClient();
  const histories = await reader.readLegacyHistories();
  const result: LegacyImportResult = { servers: 0, evidenceImported: 0, sessionsImported: 0, ignored: 0 };
  for (const history of histories) {
    const server = await db.gameServer.findUnique({ where: { slug: history.key }, select: { id: true, gameType: true } });
    if (!server) { result.ignored += 1; continue; }
    result.servers += 1;
    for (const source of history.sources) {
      if (!source.available) continue;
      for (const item of source.evidence) {
        const imported = await db.$transaction((transaction) => importEvidence(transaction, server, source.kind, source.label, item));
        if (imported.created) result.evidenceImported += 1;
        if (imported.created && item.kind === "SESSION") result.sessionsImported += 1;
      }
    }
  }
  return result;
}

async function importEvidence(
  transaction: Prisma.TransactionClient,
  server: { id: string; gameType: Prisma.LegacyPlayerEvidenceCreateInput["gameType"] },
  sourceKind: string,
  sourceLabel: string,
  item: AgentLegacyPlayerEvidence,
) {
  const observedAt = new Date();
  const matchedIdentity = await transaction.playerIdentity.findFirst({ where: { gameType: server.gameType, externalProvider: "STEAM", externalAccountId: item.externalAccountId }, select: { id: true } });
  const identity = matchedIdentity
    ? await transaction.playerIdentity.update({ where: { id: matchedIdentity.id }, data: { serverId: server.id, ...(item.displayName ? { displayName: item.displayName } : {}) }, select: { id: true, userId: true } })
    : await transaction.playerIdentity.upsert({
      where: { gameType_providerKey: { gameType: server.gameType, providerKey: item.providerKey } },
      create: { gameType: server.gameType, providerKey: item.providerKey, displayName: item.displayName ?? `Steam ${item.externalAccountId.slice(-6)}`, serverId: server.id, externalProvider: "STEAM", externalAccountId: item.externalAccountId },
      update: { serverId: server.id, externalProvider: "STEAM", externalAccountId: item.externalAccountId, ...(item.displayName ? { displayName: item.displayName } : {}) },
      select: { id: true, userId: true },
    });
  if (!identity.userId) await autoLinkVerifiedSteamIdentity(transaction, identity.id, item.externalAccountId, observedAt);

  const dedupeKey = `legacy:${server.id}:${sourceKind}:${item.sourceRecordHash}`;
  const existing = await transaction.legacyPlayerEvidence.findUnique({ where: { dedupeKey }, select: { id: true } });
  const evidence = existing ?? await transaction.legacyPlayerEvidence.create({
    data: {
      serverId: server.id,
      playerIdentityId: identity.id,
      gameType: server.gameType,
      kind: item.kind,
      occurredAt: new Date(item.occurredAt),
      endedAt: item.endedAt ? new Date(item.endedAt) : null,
      durationSeconds: item.durationSeconds,
      sourceKind,
      sourceLabel,
      sourceRecordHash: item.sourceRecordHash,
      dedupeKey,
    },
    select: { id: true },
  });

  if (item.kind === "SESSION" && item.endedAt && item.durationSeconds !== null) {
    const joinEvent = await transaction.serverEvent.upsert({
      where: { dedupeKey: `legacy-join:${server.id}:${item.sourceRecordHash}` },
      create: {
        serverId: server.id,
        gameType: server.gameType,
        eventType: "PLAYER_JOINED",
        occurredAt: new Date(item.occurredAt),
        playerIdentityId: identity.id,
        actorText: item.displayName,
        source: "LEGACY_HISTORY_IMPORT",
        sourceConfidence: 100,
        dedupeKey: `legacy-join:${server.id}:${item.sourceRecordHash}`,
        metadata: { evidenceId: evidence.id, sourceKind, durationSeconds: item.durationSeconds },
      },
      update: {},
    });
    await transaction.serverEvent.upsert({
      where: { dedupeKey: `legacy-left:${server.id}:${item.sourceRecordHash}` },
      create: {
        serverId: server.id,
        gameType: server.gameType,
        eventType: "PLAYER_LEFT",
        occurredAt: new Date(item.endedAt),
        playerIdentityId: identity.id,
        actorText: item.displayName,
        valueNumber: item.durationSeconds,
        source: "LEGACY_HISTORY_IMPORT",
        sourceConfidence: 100,
        dedupeKey: `legacy-left:${server.id}:${item.sourceRecordHash}`,
        metadata: { evidenceId: evidence.id, sourceKind, durationSeconds: item.durationSeconds },
      },
      update: {},
    });
    await evaluateAchievementsForEvent(transaction, joinEvent.id);
    await evaluateRecordsForEvent(transaction, joinEvent.id);
    const leaveEvent = await transaction.serverEvent.findUniqueOrThrow({ where: { dedupeKey: `legacy-left:${server.id}:${item.sourceRecordHash}` }, select: { id: true } });
    await processProgressionForEvent(transaction, leaveEvent.id);
  }
  await evaluateAchievementsForLegacyEvidence(transaction, evidence.id);
  return { created: !existing };
}
