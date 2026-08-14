import assert from "node:assert/strict";
import test from "node:test";
import { describeImpact } from "./impact";
import { findOverlaps, hasBlockingConflict, requiresTypedConfirmation, type ClaimConflict } from "./conflicts";
import { currentIdentityScope, scopeWithIdentity, scopeWithoutIdentity } from "./scope";
import { ownershipSensitiveRuleTypes } from "./eligibility";
import type { Prisma } from "@habitat/db/client";

const emptyDelta = {
  trackedSeconds: 0, trackedHours: 0, verifiedSessionSeconds: 0, legacyEvidenceSeconds: 0, legacyImportSessionSeconds: 0,
  sessionCount: 0, joinCount: 0, distinctGameTypes: 0, totalXp: 0, levels: 0,
  achievementCount: 0, achievementPoints: 0,
};

test("a grant headline reads as the sentence an administrator has to act on", () => {
  const headline = describeImpact("GRANT", { ...emptyDelta, trackedHours: 428, levels: 14 }, 19, 0);
  assert.equal(headline, "This claim will add 428 hours, 19 achievements and 14 levels.");
});

test("headline omits clauses that would read as zero and keeps singulars singular", () => {
  assert.equal(describeImpact("GRANT", { ...emptyDelta, trackedHours: 1, levels: 0 }, 1, 0), "This claim will add 1 hour and 1 achievement.");
  assert.equal(describeImpact("GRANT", { ...emptyDelta, levels: 3 }, 0, 0), "This claim will add 3 levels.");
});

test("a claim carrying XP but no whole hour still states what changes", () => {
  const headline = describeImpact("GRANT", { ...emptyDelta, totalXp: 240 }, 0, 0);
  assert.equal(headline, "This claim will add 240 XP without changing hours, achievements, or level.");
});

test("an empty identity is described as granting nothing rather than silently", () => {
  const headline = describeImpact("GRANT", emptyDelta, 0, 0);
  assert.match(headline, /not change hours, XP, achievements, or level/);
});

test("a revocation counts the achievements it takes away, not the ones it adds", () => {
  const headline = describeImpact("REVOKE", { ...emptyDelta, trackedHours: -428, levels: -14 }, 0, 19);
  assert.equal(headline, "Unlinking this identity will remove 428 hours, 19 achievements and 14 levels.");
});

test("sessions that overlap are found in both directions and totalled", () => {
  const candidate = [
    { start: new Date("2026-08-01T10:00:00Z"), end: new Date("2026-08-01T12:00:00Z"), label: "the claimed identity" },
    { start: new Date("2026-08-02T10:00:00Z"), end: new Date("2026-08-02T11:00:00Z"), label: "the claimed identity" },
  ];
  const existing = [
    { start: new Date("2026-08-01T11:00:00Z"), end: new Date("2026-08-01T13:00:00Z"), label: "Schlotzsky" },
    { start: new Date("2026-08-05T10:00:00Z"), end: new Date("2026-08-05T11:00:00Z"), label: "Schlotzsky" },
  ];
  const overlaps = findOverlaps(candidate, existing);
  assert.equal(overlaps.count, 1);
  assert.equal(overlaps.seconds, 3_600);
  assert.equal(overlaps.examples[0]?.label, "Schlotzsky");
});

test("sessions that merely touch at the boundary are not an overlap", () => {
  const overlaps = findOverlaps(
    [{ start: new Date("2026-08-01T10:00:00Z"), end: new Date("2026-08-01T11:00:00Z"), label: "candidate" }],
    [{ start: new Date("2026-08-01T11:00:00Z"), end: new Date("2026-08-01T12:00:00Z"), label: "existing" }],
  );
  assert.equal(overlaps.count, 0);
});

test("one long existing session overlapping several candidate sessions is not missed by the sweep", () => {
  const candidate = [
    { start: new Date("2026-08-01T10:00:00Z"), end: new Date("2026-08-01T11:00:00Z"), label: "candidate" },
    { start: new Date("2026-08-01T12:00:00Z"), end: new Date("2026-08-01T13:00:00Z"), label: "candidate" },
    { start: new Date("2026-08-01T14:00:00Z"), end: new Date("2026-08-01T15:00:00Z"), label: "candidate" },
  ];
  const existing = [{ start: new Date("2026-08-01T09:00:00Z"), end: new Date("2026-08-01T20:00:00Z"), label: "existing" }];
  const overlaps = findOverlaps(candidate, existing);
  assert.equal(overlaps.count, 3);
  assert.equal(overlaps.seconds, 10_800);
});

test("blocking and severe conflicts gate approval differently from advisory ones", () => {
  const advisory: ClaimConflict[] = [{ code: "NO_EVIDENCE", severity: "INFO", title: "", detail: "" }, { code: "PRIOR_REVOCATION", severity: "WARNING", title: "", detail: "" }];
  assert.equal(hasBlockingConflict(advisory), false);
  assert.equal(requiresTypedConfirmation(advisory), false);

  const severe: ClaimConflict[] = [...advisory, { code: "OVERLAPPING_SESSIONS", severity: "SEVERE", title: "", detail: "" }];
  assert.equal(hasBlockingConflict(severe), false);
  assert.equal(requiresTypedConfirmation(severe), true);

  const blocked: ClaimConflict[] = [...severe, { code: "IDENTITY_ALREADY_OWNED", severity: "BLOCKING", title: "", detail: "" }];
  assert.equal(hasBlockingConflict(blocked), true);
});

test("a scope separates owned identities from the verified subset that can earn XP", async () => {
  const transaction = {
    playerIdentity: {
      findMany: async () => [
        { id: "identity-verified", verifiedAt: new Date("2026-08-01T00:00:00Z") },
        { id: "identity-unverified", verifiedAt: null },
      ],
    },
  } as unknown as Prisma.TransactionClient;

  const scope = await currentIdentityScope(transaction, "member");
  assert.deepEqual(scope.identityIds, ["identity-verified", "identity-unverified"]);
  assert.deepEqual(scope.verifiedIdentityIds, ["identity-verified"]);

  const granted = scopeWithIdentity(scope, "identity-new");
  assert.ok(granted.identityIds.includes("identity-new"));
  assert.ok(granted.verifiedIdentityIds.includes("identity-new"), "a granted identity is verified at the moment of grant");

  const revoked = scopeWithoutIdentity(granted, "identity-new");
  assert.deepEqual(revoked.identityIds, scope.identityIds);
  assert.deepEqual(revoked.verifiedIdentityIds, scope.verifiedIdentityIds);
});

test("granting an identity the member already owns leaves the scope untouched", () => {
  const scope = { userId: "member", identityIds: ["a"], verifiedIdentityIds: ["a"] };
  assert.equal(scopeWithIdentity(scope, "a"), scope);
});

test("rollback only reevaluates rules ownership can actually change", () => {
  assert.ok(ownershipSensitiveRuleTypes.includes("EVENT_COUNT"));
  assert.ok(ownershipSensitiveRuleTypes.includes("LEVEL_REACHED"));
  assert.equal((ownershipSensitiveRuleTypes as readonly string[]).includes("WEB_INTERACTION"), false);
  assert.equal((ownershipSensitiveRuleTypes as readonly string[]).includes("ACTIVITY_COUNT"), false);
});
