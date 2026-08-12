import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { AgentLegacyHistory, AgentLegacyPlayerEvent, AgentLegacyPlayerEvidence } from "@habitat/shared";
import { evaluateAchievementsForEvent, evaluateAchievementsForLegacyEvidence } from "./achievements.js";
import { autoLinkVerifiedSteamIdentity } from "./monitoring.js";
import { evaluateRecordsForEvent } from "./records.js";
import { processProgressionForEvent } from "./progression.js";
import { reconcileSteamIdentityNames } from "./steam-personas.js";

export type LegacyHistoryReader = { readLegacyHistories(): Promise<AgentLegacyHistory[]> };
export type LegacyImportResult = { servers: number; evidenceImported: number; eventsImported: number; sessionsImported: number; namesReconciled: number; ignored: number };

export async function importLegacyHistory(reader: LegacyHistoryReader): Promise<LegacyImportResult> {
  const db = getPrismaClient();
  const histories = await reader.readLegacyHistories();
  const result: LegacyImportResult = { servers: 0, evidenceImported: 0, eventsImported: 0, sessionsImported: 0, namesReconciled: 0, ignored: 0 };
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
      for (const item of source.events) {
        const imported = await db.$transaction((transaction) => importHistoricalEvent(transaction, server, source.kind, source.label, item));
        if (imported) result.eventsImported += 1;
      }
    }
  }
  result.namesReconciled = await reconcileSteamIdentityNames();
  return result;
}

async function importEvidence(
  transaction: Prisma.TransactionClient,
  server: { id: string; gameType: Prisma.LegacyPlayerEvidenceCreateInput["gameType"] },
  sourceKind: string,
  sourceLabel: string,
  item: AgentLegacyPlayerEvidence,
) {
  const identity = await ensureIdentity(transaction, server, item);

  const dedupeKey = `legacy:${server.id}:${sourceKind}:${item.sourceRecordHash}`;
  const existing = await transaction.legacyPlayerEvidence.findUnique({ where: { dedupeKey }, select: { id: true, playerIdentityId: true } });
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
  if (existing && existing.playerIdentityId !== identity.id) {
    await transaction.legacyPlayerEvidence.update({ where: { id: existing.id }, data: { playerIdentityId: identity.id } });
    await removeEmptyUnclaimedIdentity(transaction, existing.playerIdentityId);
  }

  if (item.kind === "SESSION" && item.endedAt && item.durationSeconds !== null) {
    // The same physical join can be recorded by two sources: the game's own log
    // (this SESSION) and the HabitatCore chronicle. Once identity correlation has
    // attached both to one identity, keep the chronicle join instead of doubling it.
    const existingJoin = await transaction.serverEvent.findUnique({ where: { dedupeKey: `legacy-join:${server.id}:${item.sourceRecordHash}` }, select: { id: true } });
    const chronicleJoin = existingJoin ? null : await findCrossSourceJoin(transaction, server.id, identity.id, new Date(item.occurredAt), "HABITAT_NATIVE_HISTORY");
    const joinEvent = chronicleJoin ?? await transaction.serverEvent.upsert({
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
      update: { playerIdentityId: identity.id, actorText: item.displayName },
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
      update: { playerIdentityId: identity.id, actorText: item.displayName, valueNumber: item.durationSeconds },
    });
    await evaluateAchievementsForEvent(transaction, joinEvent.id);
    await evaluateRecordsForEvent(transaction, joinEvent.id);
    const leaveEvent = await transaction.serverEvent.findUniqueOrThrow({ where: { dedupeKey: `legacy-left:${server.id}:${item.sourceRecordHash}` }, select: { id: true } });
    await processProgressionForEvent(transaction, leaveEvent.id);
  }
  await evaluateAchievementsForLegacyEvidence(transaction, evidence.id);
  return { created: !existing };
}

async function importHistoricalEvent(
  transaction: Prisma.TransactionClient,
  server: { id: string; gameType: Prisma.LegacyPlayerEvidenceCreateInput["gameType"] },
  sourceKind: string,
  sourceLabel: string,
  item: AgentLegacyPlayerEvent,
) {
  const identity = await ensureIdentity(transaction, server, item);
  const dedupeKey = `legacy-event:${server.id}:${sourceKind}:${item.sourceRecordHash}`;
  const existing = await transaction.serverEvent.findUnique({ where: { dedupeKey }, select: { id: true, playerIdentityId: true } });
  if (existing) {
    if (existing.playerIdentityId !== identity.id) {
      await transaction.serverEvent.update({ where: { id: existing.id }, data: { playerIdentityId: identity.id, actorText: item.displayName } });
      if (existing.playerIdentityId) await removeEmptyUnclaimedIdentity(transaction, existing.playerIdentityId);
    }
    return false;
  }
  if (item.eventType === "PLAYER_JOINED" && await findCrossSourceJoin(transaction, server.id, identity.id, new Date(item.occurredAt), "LEGACY_HISTORY_IMPORT")) return false;
  await transaction.serverEvent.create({
    data: {
      serverId: server.id,
      gameType: server.gameType,
      eventType: item.eventType,
      occurredAt: new Date(item.occurredAt),
      playerIdentityId: identity.id,
      actorText: item.displayName,
      valueText: item.valueText,
      source: "HABITAT_NATIVE_HISTORY",
      sourceConfidence: 100,
      dedupeKey,
      metadata: { sourceKind, sourceLabel, recovered: true },
    },
  });
  return true;
}

/** Matches the agent's Valheim chronicle/Steam-log correlation window. */
const crossSourceJoinWindowMs = 30_000;

async function findCrossSourceJoin(transaction: Prisma.TransactionClient, serverId: string, playerIdentityId: string, occurredAt: Date, source: string) {
  return transaction.serverEvent.findFirst({
    where: {
      serverId,
      playerIdentityId,
      eventType: "PLAYER_JOINED",
      source,
      occurredAt: { gte: new Date(occurredAt.getTime() - crossSourceJoinWindowMs), lte: new Date(occurredAt.getTime() + crossSourceJoinWindowMs) },
    },
    select: { id: true },
  });
}

async function removeEmptyUnclaimedIdentity(transaction: Prisma.TransactionClient, identityId: string) {
  const identity = await transaction.playerIdentity.findUnique({
    where: { id: identityId },
    select: {
      userId: true,
      reconciliation: { select: { id: true } },
      _count: { select: { events: true, claims: true, recordHolders: true, recordHistory: true, legacyEvidence: true } },
    },
  });
  if (!identity || identity.userId || identity.reconciliation) return;
  if (Object.values(identity._count).some((count) => count > 0)) return;
  await transaction.playerIdentity.deleteMany({ where: { id: identityId, userId: null } });
}

async function ensureIdentity(
  transaction: Prisma.TransactionClient,
  server: { id: string; gameType: Prisma.LegacyPlayerEvidenceCreateInput["gameType"] },
  item: Pick<AgentLegacyPlayerEvidence, "providerKey" | "displayName" | "externalProvider" | "externalAccountId">,
) {
  const matchedIdentity = item.externalProvider === "STEAM" && item.externalAccountId
    ? await transaction.playerIdentity.findFirst({ where: { gameType: server.gameType, externalProvider: "STEAM", externalAccountId: item.externalAccountId }, select: { id: true } })
    : null;
  const fallbackName = item.externalAccountId ? `Steam ${item.externalAccountId.slice(-6)}` : "Recovered player";
  const identity = matchedIdentity
    ? await transaction.playerIdentity.update({ where: { id: matchedIdentity.id }, data: { serverId: server.id, ...(item.displayName ? { displayName: item.displayName } : {}) }, select: { id: true, userId: true } })
    : await transaction.playerIdentity.upsert({
      where: { gameType_providerKey: { gameType: server.gameType, providerKey: item.providerKey } },
      create: { gameType: server.gameType, providerKey: item.providerKey, displayName: item.displayName ?? fallbackName, serverId: server.id, externalProvider: item.externalProvider, externalAccountId: item.externalAccountId },
      update: { serverId: server.id, externalProvider: item.externalProvider, externalAccountId: item.externalAccountId, ...(item.displayName ? { displayName: item.displayName } : {}) },
      select: { id: true, userId: true },
    });
  if (!identity.userId && item.externalProvider === "STEAM" && item.externalAccountId) {
    await autoLinkVerifiedSteamIdentity(transaction, identity.id, item.externalAccountId, new Date());
  }
  return identity;
}
