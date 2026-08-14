import type { Prisma } from "@habitat/db/client";

export type EvidenceSource = {
  channel: "LIVE_EVENT" | "LEGACY_IMPORT";
  source: string;
  label: string;
  recordCount: number;
  sessionSeconds: number;
  firstObservedAt: Date | null;
  lastObservedAt: Date | null;
  /** Lowest confidence seen from this source. Anything under 100 cannot earn XP. */
  minimumConfidence: number | null;
  /** One representative source-record hash, so an import can be traced back to its file. */
  sampleRecordHash: string | null;
};

export type IdentityProvenance = {
  identityId: string;
  displayName: string;
  gameType: string;
  providerKey: string;
  /** Whether a provider identifier exists. The identifier itself is never returned. */
  hasProviderProof: boolean;
  providerName: string | null;
  sources: EvidenceSource[];
  totalRecords: number;
  totalSessionSeconds: number;
  firstObservedAt: Date | null;
  lastObservedAt: Date | null;
};

/**
 * Where an identity's history actually came from. An administrator approving a
 * retroactive claim needs to see which collector or import file produced the
 * hours they are about to hand over, and at what confidence.
 *
 * Provider identifiers such as SteamID64 are deliberately not returned; the
 * claim surfaces report only whether proof exists and whether it matches.
 */
export async function summarizeIdentityProvenance(transaction: Prisma.TransactionClient, playerIdentityId: string): Promise<IdentityProvenance | null> {
  const identity = await transaction.playerIdentity.findUnique({
    where: { id: playerIdentityId },
    select: { id: true, displayName: true, gameType: true, providerKey: true, externalProvider: true, externalAccountId: true },
  });
  if (!identity) return null;

  const [eventGroups, evidenceGroups, evidenceSamples] = await Promise.all([
    transaction.serverEvent.groupBy({
      by: ["source", "eventType"],
      where: { playerIdentityId },
      _count: { _all: true },
      _sum: { valueNumber: true },
      _min: { occurredAt: true, sourceConfidence: true },
      _max: { occurredAt: true },
    }),
    transaction.legacyPlayerEvidence.groupBy({
      by: ["sourceKind", "sourceLabel"],
      where: { playerIdentityId },
      _count: { _all: true },
      _sum: { durationSeconds: true },
      _min: { occurredAt: true },
      _max: { occurredAt: true },
    }),
    transaction.legacyPlayerEvidence.findMany({ where: { playerIdentityId }, distinct: ["sourceKind", "sourceLabel"], select: { sourceKind: true, sourceLabel: true, sourceRecordHash: true } }),
  ]);

  const liveSources = new Map<string, EvidenceSource>();
  for (const group of eventGroups) {
    const prior = liveSources.get(group.source);
    liveSources.set(group.source, {
      channel: "LIVE_EVENT",
      source: group.source,
      label: group.source.replaceAll("_", " ").toLowerCase(),
      recordCount: (prior?.recordCount ?? 0) + group._count._all,
      // Other event types may carry scores or counters in `valueNumber`.
      // Only a departure event's value is elapsed session time.
      sessionSeconds: (prior?.sessionSeconds ?? 0) + (group.eventType === "PLAYER_LEFT" ? group._sum.valueNumber ?? 0 : 0),
      firstObservedAt: earliest(prior?.firstObservedAt ?? null, group._min.occurredAt),
      lastObservedAt: latest(prior?.lastObservedAt ?? null, group._max.occurredAt),
      minimumConfidence: minimum(prior?.minimumConfidence ?? null, group._min.sourceConfidence),
      sampleRecordHash: null,
    });
  }

  const hashBySource = new Map(evidenceSamples.map((sample) => [`${sample.sourceKind}:${sample.sourceLabel}`, sample.sourceRecordHash]));
  const sources: EvidenceSource[] = [
    ...liveSources.values(),
    ...evidenceGroups.map((group) => ({
      channel: "LEGACY_IMPORT" as const,
      source: group.sourceKind,
      label: group.sourceLabel,
      recordCount: group._count._all,
      sessionSeconds: group._sum.durationSeconds ?? 0,
      firstObservedAt: group._min.occurredAt,
      lastObservedAt: group._max.occurredAt,
      minimumConfidence: null,
      sampleRecordHash: hashBySource.get(`${group.sourceKind}:${group.sourceLabel}`) ?? null,
    })),
  ].sort((left, right) => right.recordCount - left.recordCount);

  const observed = sources.flatMap((source) => [source.firstObservedAt, source.lastObservedAt]).filter((value): value is Date => value !== null);
  return {
    identityId: identity.id,
    displayName: identity.displayName,
    gameType: identity.gameType,
    providerKey: identity.providerKey,
    hasProviderProof: Boolean(identity.externalProvider && identity.externalAccountId),
    providerName: identity.externalProvider,
    sources,
    totalRecords: sources.reduce((sum, source) => sum + source.recordCount, 0),
    totalSessionSeconds: sources.reduce((sum, source) => sum + source.sessionSeconds, 0),
    firstObservedAt: observed.length > 0 ? new Date(Math.min(...observed.map((value) => value.getTime()))) : null,
    lastObservedAt: observed.length > 0 ? new Date(Math.max(...observed.map((value) => value.getTime()))) : null,
  };
}

function earliest(left: Date | null, right: Date | null): Date | null {
  if (!left) return right;
  if (!right) return left;
  return left < right ? left : right;
}

function latest(left: Date | null, right: Date | null): Date | null {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function minimum(left: number | null, right: number | null): number | null {
  if (left === null) return right;
  if (right === null) return left;
  return Math.min(left, right);
}
