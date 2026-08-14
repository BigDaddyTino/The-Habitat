"use server";

import "@/lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { seasonEndFor } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { effectiveSeasonStatus } from "@/lib/season-content";
import { seasonAvailabilityProblems, seasonLaunchReadiness, seasonScheduleProblems } from "@/lib/season-launch";

const db = getPrismaClient();
const launchSchema = z.object({ seasonId: z.string().uuid() });
const scheduleSchema = launchSchema.extend({ startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const settingsSchema = launchSchema.extend({
  name: z.string().trim().min(3).max(100),
  theme: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(400),
  communityXpGoal: z.coerce.number().int().min(1).max(10_000_000),
  trophyXpRequirement: z.coerce.number().int().min(0).max(10_000_000),
  isEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function seasonPaths() {
  revalidatePath("/admin/seasons");
  revalidatePath("/seasons");
  revalidatePath("/leaderboards/season");
}

/// A season is only launchable when closing it could actually reward someone and
/// when it will not collide with a season already running. Both are re-checked
/// inside the transaction that moves the window, so a stale page or a double
/// submit cannot open two overlapping seasons.
async function assertLaunchable(transaction: Prisma.TransactionClient, seasonId: string, now: Date) {
  const season = await transaction.season.findUnique({
    where: { id: seasonId },
    select: { id: true, name: true, status: true, isEnabled: true, startsAt: true, endsAt: true, _count: { select: { trophies: true, quests: true, expeditions: true, xpEntries: true } } },
  });
  if (!season) throw new Error("That season no longer exists.");
  const readiness = seasonLaunchReadiness({ status: effectiveSeasonStatus(season, now), trophyCount: season._count.trophies, questCount: season._count.quests, expeditionCount: season._count.expeditions, xpEntryCount: season._count.xpEntries });
  if (!readiness.launchable) throw new Error(readiness.blockers[0]);
  return season;
}

async function assertNoRunningSeason(transaction: Prisma.TransactionClient, seasonId: string, startsAt: Date, endsAt: Date) {
  const clash = await transaction.season.findFirst({
    where: { id: { not: seasonId }, status: { not: "COMPLETED" }, OR: [{ isEnabled: true }, { status: "ACTIVE" }], startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { name: true, startsAt: true, endsAt: true },
  });
  if (clash) throw new Error(`${clash.name} already occupies that window. Only one season runs at a time.`);
}

export async function launchSeason(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = launchSchema.safeParse({ seasonId: formData.get("seasonId") });
  if (!parsed.success) throw new Error("Invalid season.");
  const now = new Date();
  const endsAt = seasonEndFor(now);
  await db.$transaction(async (transaction) => {
    const season = await assertLaunchable(transaction, parsed.data.seasonId, now);
    await assertNoRunningSeason(transaction, season.id, now, endsAt);
    // The window opens at the launch instant rather than at midnight, so no
    // activity recorded before an administrator pressed the button is credited.
    await transaction.season.update({ where: { id: season.id }, data: { startsAt: now, endsAt, status: "ACTIVE", isEnabled: true } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_LAUNCHED", entityType: "Season", entityId: season.id, before: { status: season.status, startsAt: season.startsAt, endsAt: season.endsAt }, after: { status: "ACTIVE", startsAt: now, endsAt } } });
  });
  seasonPaths();
}

export async function scheduleSeason(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = scheduleSchema.safeParse({ seasonId: formData.get("seasonId"), startsOn: formData.get("startsOn") });
  if (!parsed.success) throw new Error("Invalid season start date.");
  const startsAt = new Date(`${parsed.data.startsOn}T00:00:00.000Z`);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid season start date.");
  const now = new Date();
  const scheduleProblems = seasonScheduleProblems(startsAt, now);
  if (scheduleProblems.length) throw new Error(scheduleProblems[0]);
  // seasonEndFor mirrors the Postgres `startsAt + INTERVAL '3 months'` CHECK, so
  // a month-end start date lands on a date the database will actually accept.
  const endsAt = seasonEndFor(startsAt);
  await db.$transaction(async (transaction) => {
    const season = await assertLaunchable(transaction, parsed.data.seasonId, now);
    await assertNoRunningSeason(transaction, season.id, startsAt, endsAt);
    await transaction.season.update({ where: { id: season.id }, data: { startsAt, endsAt, status: "UPCOMING", isEnabled: true } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_SCHEDULED", entityType: "Season", entityId: season.id, before: { startsAt: season.startsAt, endsAt: season.endsAt, isEnabled: season.isEnabled }, after: { startsAt, endsAt, status: "UPCOMING", isEnabled: true } } });
  });
  seasonPaths();
}

export async function updateSeasonSettings(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = settingsSchema.safeParse({
    seasonId: formData.get("seasonId"), name: formData.get("name"), theme: formData.get("theme"), description: formData.get("description"),
    communityXpGoal: formData.get("communityXpGoal"), trophyXpRequirement: formData.get("trophyXpRequirement"), isEnabled: formData.get("isEnabled"),
  });
  if (!parsed.success) throw new Error("Invalid season settings.");
  const { seasonId, ...settings } = parsed.data;
  await db.$transaction(async (transaction) => {
    const existing = await transaction.season.findUnique({ where: { id: seasonId }, select: { id: true, name: true, theme: true, description: true, communityXpGoal: true, trophyXpRequirement: true, isEnabled: true, status: true, startsAt: true, endsAt: true } });
    if (!existing) throw new Error("That season no longer exists.");
    // A completed season is a published record: its Chronicle already states the
    // bar it was judged against, so its goals stay frozen.
    const now = new Date();
    const effectiveStatus = effectiveSeasonStatus(existing, now);
    if (effectiveStatus === "COMPLETED") throw new Error("A completed season is a published record and cannot be edited.");
    const availabilityProblems = seasonAvailabilityProblems(effectiveStatus, settings.isEnabled, { wasEnabled: existing.isEnabled, startsAt: existing.startsAt, now });
    if (availabilityProblems.length) throw new Error(availabilityProblems[0]);
    await transaction.season.update({ where: { id: existing.id }, data: settings });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_SETTINGS_UPDATED", entityType: "Season", entityId: existing.id, before: existing, after: { ...settings } } });
  });
  seasonPaths();
}
