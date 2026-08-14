import type { Prisma } from "@habitat/db/client";

export type ConflictSeverity = "BLOCKING" | "SEVERE" | "WARNING" | "INFO";

export type ClaimConflict = {
  code: string;
  severity: ConflictSeverity;
  title: string;
  detail: string;
};

/** A conflict at this severity or above requires typed confirmation to override. */
export const confirmationRequiredSeverities: ConflictSeverity[] = ["BLOCKING", "SEVERE"];

const intervalSampleLimit = 500;
const overlapExampleLimit = 5;

type Interval = { start: Date; end: Date; label: string };

/**
 * Everything that makes a claim unsafe to approve blindly: ownership races,
 * provider proof that points somewhere else, competing claimants, duplicate
 * identities for the same game, and — the expensive one — sessions that overlap
 * history the member already owns, which is how one person's identity gets
 * merged onto another person's account.
 */
export async function detectClaimConflicts(
  transaction: Prisma.TransactionClient,
  input: { playerIdentityId: string; userId: string },
): Promise<ClaimConflict[]> {
  const conflicts: ClaimConflict[] = [];
  const identity = await transaction.playerIdentity.findUnique({
    where: { id: input.playerIdentityId },
    select: { id: true, userId: true, gameType: true, displayName: true, externalProvider: true, externalAccountId: true, verifiedAt: true },
  });
  if (!identity) return [{ code: "IDENTITY_MISSING", severity: "BLOCKING", title: "Identity no longer exists", detail: "The identity was removed after this claim was filed." }];

  const claimant = await transaction.user.findUnique({ where: { id: input.userId }, select: { id: true, isActive: true, name: true, email: true } });
  if (!claimant) return [{ code: "CLAIMANT_MISSING", severity: "BLOCKING", title: "Claimant no longer exists", detail: "The member who filed this claim has been removed." }];
  if (!claimant.isActive) {
    conflicts.push({ code: "CLAIMANT_INACTIVE", severity: "BLOCKING", title: "Claimant is suspended", detail: "Reactivate the member before granting ownership; a suspended account cannot hold verified history." });
  }

  if (identity.userId && identity.userId !== input.userId) {
    const owner = await transaction.user.findUnique({ where: { id: identity.userId }, select: { name: true, email: true } });
    conflicts.push({ code: "IDENTITY_ALREADY_OWNED", severity: "BLOCKING", title: "Already owned by another member", detail: `${describeMember(owner)} already holds this identity. Roll their ownership back first if this claim is correct.` });
  } else if (identity.userId === input.userId) {
    conflicts.push({ code: "IDENTITY_ALREADY_GRANTED", severity: "BLOCKING", title: "Already owned by this member", detail: "This member already owns the identity, so approving would change nothing." });
  }

  conflicts.push(...await detectProviderConflicts(transaction, identity, input.userId));
  conflicts.push(...await detectCompetingClaims(transaction, identity.id, input.userId));
  conflicts.push(...await detectDuplicateIdentity(transaction, identity, input.userId));
  conflicts.push(...await detectPriorRevocation(transaction, identity.id, input.userId));
  conflicts.push(...await detectSessionOverlap(transaction, identity.id, input.userId));
  conflicts.push(...await detectEvidenceGap(transaction, identity.id));
  return conflicts;
}

async function detectProviderConflicts(
  transaction: Prisma.TransactionClient,
  identity: { externalProvider: string | null; externalAccountId: string | null },
  userId: string,
): Promise<ClaimConflict[]> {
  if (identity.externalProvider !== "STEAM" || !identity.externalAccountId) {
    return [{ code: "UNVERIFIABLE_BY_PROVIDER", severity: "INFO", title: "No provider proof available", detail: "This identity carries no SteamID64, so ownership cannot be proved automatically. Confirm it out of band before approving." }];
  }

  const conflicts: ClaimConflict[] = [];
  const holder = await transaction.userSocialAccount.findFirst({
    where: { platform: "STEAM", providerAccountId: identity.externalAccountId, verifiedAt: { not: null } },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });

  if (holder && holder.userId !== userId) {
    conflicts.push({ code: "STEAM_ACCOUNT_OWNED_BY_OTHER_MEMBER", severity: "BLOCKING", title: "Steam account belongs to another member", detail: `The SteamID64 on this identity is verified on ${describeMember(holder.user)}'s account. Approving would attach proven history to the wrong member.` });
    return conflicts;
  }

  const claimantSteam = await transaction.userSocialAccount.findFirst({
    where: { userId, platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } },
    select: { providerAccountId: true },
  });
  if (!claimantSteam) {
    conflicts.push({ code: "CLAIMANT_HAS_NO_STEAM_PROOF", severity: "WARNING", title: "Claimant has not verified Steam", detail: "This identity carries a SteamID64 but the member has never completed Steam verification. Asking them to connect Steam would prove this claim automatically." });
  } else if (claimantSteam.providerAccountId !== identity.externalAccountId) {
    conflicts.push({ code: "STEAM_ACCOUNT_MISMATCH", severity: "SEVERE", title: "Steam account does not match", detail: "The member's verified SteamID64 is not the one recorded on this identity. Provider proof contradicts this claim." });
  }
  return conflicts;
}

async function detectCompetingClaims(transaction: Prisma.TransactionClient, identityId: string, userId: string): Promise<ClaimConflict[]> {
  const competing = await transaction.playerIdentityClaim.findMany({
    where: { playerIdentityId: identityId, status: "PENDING", userId: { not: userId } },
    select: { user: { select: { name: true, email: true } } },
  });
  if (competing.length === 0) return [];
  const names = competing.map((claim) => describeMember(claim.user)).join(", ");
  return [{ code: "COMPETING_CLAIMS", severity: "SEVERE", title: `${competing.length} other member${competing.length === 1 ? "" : "s"} claim this identity`, detail: `Approving this claim automatically rejects the competing request${competing.length === 1 ? "" : "s"} from ${names}.` }];
}

async function detectDuplicateIdentity(
  transaction: Prisma.TransactionClient,
  identity: { id: string; gameType: string; displayName: string },
  userId: string,
): Promise<ClaimConflict[]> {
  const existing = await transaction.playerIdentity.findMany({
    where: { userId, gameType: identity.gameType as never, id: { not: identity.id } },
    select: { displayName: true },
  });
  if (existing.length === 0) return [];
  const normalized = identity.displayName.trim().toLowerCase();
  const sameName = existing.filter((other) => other.displayName.trim().toLowerCase() === normalized);
  if (sameName.length > 0) {
    return [{ code: "DUPLICATE_IDENTITY_NAME", severity: "SEVERE", title: "Member already owns this character name", detail: `${describeGame(identity.gameType)}: the member already owns an identity named "${identity.displayName}". These are almost certainly the same character observed from two sources, and approving will double-count its history.` }];
  }
  return [{ code: "DUPLICATE_IDENTITY_GAME", severity: "WARNING", title: "Member already owns an identity in this world", detail: `${describeGame(identity.gameType)}: the member already owns ${existing.map((other) => other.displayName).join(", ")}. Confirm this is a separate character rather than the same one seen twice.` }];
}

async function detectPriorRevocation(transaction: Prisma.TransactionClient, identityId: string, userId: string): Promise<ClaimConflict[]> {
  const revocation = await transaction.identityOwnershipTransaction.findFirst({
    where: { playerIdentityId: identityId, action: "REVOKE" },
    orderBy: { createdAt: "desc" },
    select: { fromUserId: true, reason: true, createdAt: true },
  });
  if (!revocation) return [];
  const sameMember = revocation.fromUserId === userId;
  return [{
    code: "PRIOR_REVOCATION",
    severity: "WARNING",
    title: sameMember ? "Previously revoked from this member" : "Previously revoked from another member",
    detail: `Ownership of this identity was rolled back on ${revocation.createdAt.toISOString().slice(0, 10)}${revocation.reason ? `: ${revocation.reason}` : "."} Re-granting it will replay the same history again.`,
  }];
}

async function detectEvidenceGap(transaction: Prisma.TransactionClient, identityId: string): Promise<ClaimConflict[]> {
  const [events, evidence] = await Promise.all([
    transaction.serverEvent.count({ where: { playerIdentityId: identityId } }),
    transaction.legacyPlayerEvidence.count({ where: { playerIdentityId: identityId } }),
  ]);
  if (events + evidence > 0) return [];
  return [{ code: "NO_EVIDENCE", severity: "INFO", title: "No observed history", detail: "Nothing has been recorded against this identity yet, so approving grants ownership without granting any history." }];
}

/**
 * Two identities whose sessions overlap in time cannot both be the same person
 * playing. Overlap is therefore the strongest available signal that a claim is
 * merging one member's history onto another member's account.
 */
async function detectSessionOverlap(transaction: Prisma.TransactionClient, identityId: string, userId: string): Promise<ClaimConflict[]> {
  const existingIdentities = await transaction.playerIdentity.findMany({ where: { userId, id: { not: identityId } }, select: { id: true, displayName: true } });
  if (existingIdentities.length === 0) return [];

  const [candidate, existing] = await Promise.all([
    loadIntervals(transaction, [identityId], new Map([[identityId, "the claimed identity"]])),
    loadIntervals(transaction, existingIdentities.map((identity) => identity.id), new Map(existingIdentities.map((identity) => [identity.id, identity.displayName]))),
  ]);
  if (candidate.length === 0 || existing.length === 0) return [];

  const overlaps = findOverlaps(candidate, existing);
  if (overlaps.count === 0) return [];

  const examples = overlaps.examples.map((overlap) => `${overlap.start.toISOString().slice(0, 16).replace("T", " ")} UTC with ${overlap.label} (${formatDuration(overlap.seconds)})`).join("; ");
  const truncated = candidate.length >= intervalSampleLimit || existing.length >= intervalSampleLimit;
  return [{
    code: "OVERLAPPING_SESSIONS",
    severity: "SEVERE",
    title: `${overlaps.count} overlapping session${overlaps.count === 1 ? "" : "s"}`,
    detail: `This identity was in play at the same time as history the member already owns, totalling ${formatDuration(overlaps.seconds)} of pairwise overlap. One person cannot be in two places at once, so this is either a duplicate import or two different people. Examples: ${examples}.${truncated ? ` The comparison is bounded to the ${intervalSampleLimit} most recent live sessions and ${intervalSampleLimit} most recent legacy sessions per side.` : ""}`,
  }];
}

async function loadIntervals(transaction: Prisma.TransactionClient, identityIds: string[], labels: Map<string, string>): Promise<Interval[]> {
  const [sessions, evidence] = await Promise.all([
    transaction.serverEvent.findMany({
      // Legacy imports also write a `LegacyPlayerEvidence` row for the same
      // interval. Compare that canonical row below and skip its mirror event,
      // otherwise one real overlap is reported as four overlapping pairs.
      where: { playerIdentityId: { in: identityIds }, eventType: "PLAYER_LEFT", source: { not: "LEGACY_HISTORY_IMPORT" }, valueNumber: { gt: 0 }, sourceConfidence: { gte: 100 } },
      orderBy: { occurredAt: "desc" },
      take: intervalSampleLimit,
      select: { playerIdentityId: true, occurredAt: true, valueNumber: true },
    }),
    transaction.legacyPlayerEvidence.findMany({
      where: { playerIdentityId: { in: identityIds }, kind: "SESSION", durationSeconds: { gt: 0 } },
      orderBy: { occurredAt: "desc" },
      take: intervalSampleLimit,
      select: { playerIdentityId: true, occurredAt: true, endedAt: true, durationSeconds: true },
    }),
  ]);

  const intervals: Interval[] = [];
  for (const session of sessions) {
    if (!session.playerIdentityId || !session.valueNumber) continue;
    intervals.push({ start: new Date(session.occurredAt.getTime() - session.valueNumber * 1_000), end: session.occurredAt, label: labels.get(session.playerIdentityId) ?? "another identity" });
  }
  for (const record of evidence) {
    const end = record.endedAt ?? new Date(record.occurredAt.getTime() + (record.durationSeconds ?? 0) * 1_000);
    intervals.push({ start: record.occurredAt, end, label: labels.get(record.playerIdentityId) ?? "another identity" });
  }
  return intervals.sort((left, right) => left.start.getTime() - right.start.getTime());
}

/** Sweep both sorted interval lists once, counting pairs that genuinely overlap. */
export function findOverlaps(candidate: Interval[], existing: Interval[]) {
  const examples: { start: Date; seconds: number; label: string }[] = [];
  let count = 0;
  let seconds = 0;
  let cursor = 0;

  for (const item of candidate) {
    while (cursor < existing.length && existing[cursor]!.end.getTime() <= item.start.getTime()) cursor += 1;
    for (let index = cursor; index < existing.length && existing[index]!.start.getTime() < item.end.getTime(); index += 1) {
      const other = existing[index]!;
      const overlapStart = Math.max(item.start.getTime(), other.start.getTime());
      const overlapEnd = Math.min(item.end.getTime(), other.end.getTime());
      const overlapSeconds = Math.floor((overlapEnd - overlapStart) / 1_000);
      if (overlapSeconds <= 0) continue;
      count += 1;
      seconds += overlapSeconds;
      if (examples.length < overlapExampleLimit) examples.push({ start: new Date(overlapStart), seconds: overlapSeconds, label: other.label });
    }
  }
  return { count, seconds, examples };
}

export function highestSeverity(conflicts: ClaimConflict[]): ConflictSeverity | null {
  const order: ConflictSeverity[] = ["BLOCKING", "SEVERE", "WARNING", "INFO"];
  return order.find((severity) => conflicts.some((conflict) => conflict.severity === severity)) ?? null;
}

export function hasBlockingConflict(conflicts: ClaimConflict[]): boolean {
  return conflicts.some((conflict) => conflict.severity === "BLOCKING");
}

export function requiresTypedConfirmation(conflicts: ClaimConflict[]): boolean {
  return conflicts.some((conflict) => confirmationRequiredSeverities.includes(conflict.severity));
}

function describeMember(user: { name: string | null; email: string | null } | null | undefined): string {
  return user?.name ?? user?.email ?? "another Habitat member";
}

function describeGame(gameType: string): string {
  return gameType.replaceAll("_", " ");
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3_600).toFixed(1)}h`;
}
