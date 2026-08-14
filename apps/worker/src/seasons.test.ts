import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { isThreeMonthSeason, seasonEndFor, verifiedPlaytimeXp } from "@habitat/shared";
import { closeSeason, processSeasonProgressionForEvent } from "./seasons.js";

const season = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  ordinal: 1,
  name: "First Light",
  startsAt: new Date("2026-09-01T00:00:00.000Z"),
  endsAt: new Date("2026-12-01T00:00:00.000Z"),
  trophyXpRequirement: 5_000,
};
const eventId = "dddddddd-0000-0000-0000-000000000001";
const memberId = "bbbbbbbb-0000-0000-0000-000000000001";
const secondMemberId = "bbbbbbbb-0000-0000-0000-000000000002";
const personalQuest = { id: "cccccccc-0000-0000-0000-000000000001", name: "Field Hours", ruleType: "PLAY_SECONDS", gameType: null, threshold: 3_600, xpReward: 300, sortOrder: 0 };
const teamQuest = { id: "cccccccc-0000-0000-0000-000000000002", name: "Open House", ruleType: "JOIN_COUNT", gameType: null, threshold: 2, xpReward: 450, sortOrder: 1 };
const expeditionId = "eeeeeeee-0000-0000-0000-000000000001";
const playSeconds = 7_200;
const joinCount = 5;

type XpEntry = { userId: string; source: string; amount: number };
type Progress = { progress: number; completedAt: Date | null };

function seasonTransaction(source = "PALWORLD_REST") {
  const roster = [memberId, secondMemberId];
  const xpEntries = new Map<string, XpEntry>();
  const questProgress = new Map<string, Progress>();
  const teamProgress = new Map<string, Progress>();
  const expeditions = new Map<string, Progress>();
  const membershipQueries: Array<Record<string, unknown>> = [];

  const transaction = {
    serverEvent: {
      findUnique: async () => ({ id: eventId, occurredAt: new Date("2026-10-01T12:00:00.000Z"), source, playerIdentity: { userId: memberId, verifiedAt: new Date("2026-08-01T00:00:00.000Z") } }),
      aggregate: async () => ({ _sum: { valueNumber: playSeconds } }),
      count: async () => joinCount,
      findMany: async () => [{ gameType: "PALWORLD" }],
    },
    seasonMembership: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        membershipQueries.push(where);
        return where.seasonId ? roster.map((userId) => ({ userId })) : [{ userId: memberId, season }];
      },
    },
    seasonXpEntry: {
      aggregate: async ({ where }: { where: { userId: string; source: string } }) => {
        const amount = [...xpEntries.values()].filter((entry) => entry.userId === where.userId && entry.source === where.source).reduce((sum, entry) => sum + entry.amount, 0);
        return { _sum: { amount: amount || null } };
      },
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: XpEntry }) => {
        if (!xpEntries.has(where.dedupeKey)) xpEntries.set(where.dedupeKey, create);
        return xpEntries.get(where.dedupeKey);
      },
      findMany: async ({ where }: { where: { dedupeKey: { in: string[] } } }) => where.dedupeKey.in.filter((key) => xpEntries.has(key)).map((dedupeKey) => ({ dedupeKey })),
      createMany: async ({ data }: { data: Array<XpEntry & { dedupeKey: string }> }) => {
        let count = 0;
        for (const entry of data) if (!xpEntries.has(entry.dedupeKey)) { xpEntries.set(entry.dedupeKey, entry); count += 1; }
        return { count };
      },
    },
    seasonQuestDefinition: { findMany: async ({ where }: { where: { scope: string } }) => (where.scope === "PERSONAL" ? [personalQuest] : [teamQuest]) },
    userSeasonQuestProgress: {
      findUnique: async ({ where }: { where: { userId_questId: { userId: string; questId: string } } }) => questProgress.get(`${where.userId_questId.userId}:${where.userId_questId.questId}`) ?? null,
      upsert: async ({ where, create }: { where: { userId_questId: { userId: string; questId: string } }; create: Progress }) => {
        questProgress.set(`${where.userId_questId.userId}:${where.userId_questId.questId}`, { progress: create.progress, completedAt: create.completedAt });
        return create;
      },
    },
    seasonTeamQuestProgress: {
      findUnique: async ({ where }: { where: { questId: string } }) => teamProgress.get(where.questId) ?? null,
      upsert: async ({ where, create }: { where: { questId: string }; create: Progress }) => {
        teamProgress.set(where.questId, { progress: create.progress, completedAt: create.completedAt });
        return create;
      },
    },
    seasonExpedition: {
      findMany: async () => [{ id: expeditionId, ruleType: "JOIN_COUNT", gameType: "PALWORLD", threshold: 3, completedAt: expeditions.get(expeditionId)?.completedAt ?? null }],
      update: async ({ data }: { data: Progress }) => {
        expeditions.set(expeditionId, data);
        return data;
      },
    },
  } as unknown as Prisma.TransactionClient;

  return { transaction, xpEntries, questProgress, teamProgress, expeditions, membershipQueries };
}

test("replaying a season event awards verified playtime, personal and team season XP exactly once", async () => {
  const { transaction, xpEntries, questProgress, teamProgress, expeditions } = seasonTransaction();
  const now = new Date("2026-10-01T13:00:00.000Z");

  await processSeasonProgressionForEvent(transaction, eventId, now);
  await processSeasonProgressionForEvent(transaction, eventId, now);

  const bySource = (value: string) => [...xpEntries.values()].filter((entry) => entry.source === value);
  assert.equal(bySource("VERIFIED_PLAYTIME").length, 1);
  assert.equal(bySource("VERIFIED_PLAYTIME")[0]?.amount, verifiedPlaytimeXp(playSeconds));
  assert.equal(bySource("PERSONAL_QUEST").length, 1);
  assert.deepEqual(bySource("TEAM_QUEST").map((entry) => entry.userId).sort(), [memberId, secondMemberId]);
  assert.equal(questProgress.get(`${memberId}:${personalQuest.id}`)?.completedAt?.toISOString(), now.toISOString());
  assert.ok(teamProgress.get(teamQuest.id)?.completedAt);
  assert.equal(expeditions.get(expeditionId)?.progress, 3);
});

test("a closed season is never reopened by a backfilled event", async () => {
  const { transaction, membershipQueries } = seasonTransaction();
  await processSeasonProgressionForEvent(transaction, eventId, new Date("2026-10-01T13:00:00.000Z"));
  const scope = membershipQueries[0] as { season: { isEnabled: boolean; status: unknown } };
  assert.equal(scope.season.isEnabled, true);
  assert.deepEqual(scope.season.status, { not: "COMPLETED" });
});

test("a legacy history replay records personal season XP but defers cooperative goals", async () => {
  const { transaction, xpEntries, teamProgress, expeditions } = seasonTransaction("LEGACY_HISTORY_IMPORT");

  await processSeasonProgressionForEvent(transaction, eventId, new Date("2026-10-01T13:00:00.000Z"));

  assert.equal([...xpEntries.values()].filter((entry) => entry.source === "VERIFIED_PLAYTIME").length, 1);
  assert.equal([...xpEntries.values()].filter((entry) => entry.source === "TEAM_QUEST").length, 0);
  assert.equal(teamProgress.size, 0);
  assert.equal(expeditions.size, 0);
});

test("only members who bank the season XP bar take the shelf home", async () => {
  const shortfallMemberId = "bbbbbbbb-0000-0000-0000-000000000003";
  const totals = [
    { userId: memberId, _sum: { amount: 5_000 } },
    { userId: secondMemberId, _sum: { amount: 4_999 } },
  ];
  const trophies = [
    { id: "ffffffff-0000-0000-0000-000000000001", kind: "COMMEMORATIVE" },
    { id: "ffffffff-0000-0000-0000-000000000002", kind: "FOUNDING_MEMBER" },
  ];
  const unlocked: Array<{ userId: string; trophyId: string }> = [];
  let snapshot: { qualifiedCount?: number; memberCount?: number; trophyXpRequirement?: number } = {};
  const transaction = {
    // the third member never scored, so the ledger has no row for them at all
    seasonMembership: { findMany: async () => [{ userId: memberId }, { userId: secondMemberId }, { userId: shortfallMemberId }] },
    seasonXpEntry: { groupBy: async () => totals },
    seasonExpedition: { findMany: async () => [] },
    seasonQuestDefinition: { findMany: async () => [] },
    seasonTrophy: { findMany: async () => trophies },
    user: { findMany: async () => [{ id: memberId, displayName: "Tino", name: null, username: "tino" }, { id: secondMemberId, displayName: null, name: null, username: null }] },
    seasonChronicle: { upsert: async ({ create }: { create: { snapshot: typeof snapshot } }) => { snapshot = create.snapshot; return create; } },
    userSeasonTrophy: { createMany: async ({ data }: { data: Array<{ userId: string; trophyId: string }> }) => { unlocked.push(...data); return { count: data.length }; } },
    season: { update: async () => season },
  } as unknown as Prisma.TransactionClient;

  await closeSeason(transaction, season, new Date("2026-12-01T00:00:00.000Z"));

  assert.deepEqual([...new Set(unlocked.map((entry) => entry.userId))], [memberId]);
  assert.equal(unlocked.length, trophies.length);
  assert.equal(snapshot.qualifiedCount, 1);
  assert.equal(snapshot.memberCount, 3);
  assert.equal(snapshot.trophyXpRequirement, 5_000);
});

test("a zero trophy bar includes enrolled members who have no XP ledger row", async () => {
  const quietMemberId = "bbbbbbbb-0000-0000-0000-000000000003";
  const trophyId = "ffffffff-0000-0000-0000-000000000001";
  const unlocked: Array<{ userId: string; trophyId: string }> = [];
  let qualifiedCount = -1;
  const transaction = {
    seasonMembership: { findMany: async () => [{ userId: memberId }, { userId: quietMemberId }] },
    seasonXpEntry: { groupBy: async () => [] },
    seasonExpedition: { findMany: async () => [] },
    seasonQuestDefinition: { findMany: async () => [] },
    seasonTrophy: { findMany: async () => [{ id: trophyId, kind: "COMMEMORATIVE" }] },
    user: { findMany: async () => [] },
    seasonChronicle: { upsert: async ({ create }: { create: { snapshot: { qualifiedCount: number } } }) => { qualifiedCount = create.snapshot.qualifiedCount; return create; } },
    userSeasonTrophy: { createMany: async ({ data }: { data: Array<{ userId: string; trophyId: string }> }) => { unlocked.push(...data); return { count: data.length }; } },
    season: { update: async () => season },
  } as unknown as Prisma.TransactionClient;

  await closeSeason(transaction, { ...season, trophyXpRequirement: 0 }, new Date("2026-12-01T00:00:00.000Z"));

  assert.equal(qualifiedCount, 2);
  assert.deepEqual(unlocked.map(({ userId, trophyId: unlockedTrophyId }) => ({ userId, trophyId: unlockedTrophyId })), [{ userId: memberId, trophyId }, { userId: quietMemberId, trophyId }]);
});

test("a season window follows Postgres month arithmetic rather than JavaScript overflow", () => {
  assert.equal(seasonEndFor(new Date("2026-09-01T00:00:00.000Z")).toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(seasonEndFor(new Date("2026-11-30T00:00:00.000Z")).toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(seasonEndFor(new Date("2026-10-31T00:00:00.000Z")).toISOString(), "2027-01-31T00:00:00.000Z");
  assert.equal(isThreeMonthSeason({ startsAt: new Date("2026-11-30T00:00:00.000Z"), endsAt: new Date("2027-02-28T00:00:00.000Z") }), true);
});
