"use server";

import "@/lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { seasonEndFor } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { effectiveSeasonStatus, seasonContentEditability, seasonGoalProblems, seasonSlugFrom } from "@/lib/season-content";

const db = getPrismaClient();

const ruleType = z.enum(["PLAY_SECONDS", "JOIN_COUNT", "DISTINCT_GAME_COUNT", "BOSS_KILL_COUNT"]);
const gameType = z.preprocess((value) => (value === "" || value === "ANY" ? null : value), z.enum(["SEVEN_DAYS_TO_DIE", "PROJECT_ZOMBOID", "DRAGONWILDS", "ENSHROUDED", "PALWORLD", "VALHEIM"]).nullable());
const rarity = z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"]);

const createSeasonSchema = z.object({
  name: z.string().trim().min(3).max(100),
  theme: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(400),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  communityXpGoal: z.coerce.number().int().min(1).max(10_000_000),
  trophyXpRequirement: z.coerce.number().int().min(0).max(10_000_000),
});
const questSchema = z.object({
  seasonId: z.string().uuid(),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(240),
  scope: z.enum(["PERSONAL", "TEAM"]),
  ruleType,
  gameType,
  threshold: z.coerce.number().int().min(1).max(100_000_000),
  xpReward: z.coerce.number().int().min(1).max(1_000_000),
  sortOrder: z.coerce.number().int().min(0).max(999),
});
const expeditionSchema = z.object({
  seasonId: z.string().uuid(),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(240),
  gameType: z.enum(["SEVEN_DAYS_TO_DIE", "PROJECT_ZOMBOID", "DRAGONWILDS", "ENSHROUDED", "PALWORLD", "VALHEIM"]),
  ruleType,
  threshold: z.coerce.number().int().min(1).max(100_000_000),
  sortOrder: z.coerce.number().int().min(0).max(999),
});
const trophySchema = z.object({
  seasonId: z.string().uuid(),
  kind: z.enum(["COMMEMORATIVE", "FOUNDING_MEMBER"]),
  code: z.string().trim().min(3).max(64).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(180),
  rarity,
});
const removeSchema = z.object({ seasonId: z.string().uuid(), id: z.string().uuid() });

function seasonPaths(slug?: string) {
  revalidatePath("/admin/seasons");
  if (slug) revalidatePath(`/admin/seasons/${slug}`);
  revalidatePath("/seasons");
  revalidatePath("/leaderboards/season");
}

/// Content edits are permitted by the season's own state, re-read inside the
/// transaction so a stale form cannot slip past the rules the page rendered.
async function requireEditable(transaction: Prisma.TransactionClient, seasonId: string, level: "structural" | "measurable" | "presentation") {
  const season = await transaction.season.findUnique({ where: { id: seasonId }, select: { id: true, slug: true, ordinal: true, status: true, isEnabled: true, startsAt: true, endsAt: true } });
  if (!season) throw new Error("That season no longer exists.");
  const status = effectiveSeasonStatus(season);
  const editability = seasonContentEditability(status);
  if (!editability[level]) throw new Error(editability.reason);
  return { ...season, status };
}

async function uniqueSlug(transaction: Prisma.TransactionClient, kind: "quest" | "expedition", seasonId: string, name: string) {
  const base = seasonSlugFrom(name);
  if (!base) throw new Error("The name must contain letters or numbers.");
  const taken = kind === "quest"
    ? await transaction.seasonQuestDefinition.findMany({ where: { seasonId, slug: { startsWith: base } }, select: { slug: true } })
    : await transaction.seasonExpedition.findMany({ where: { seasonId, slug: { startsWith: base } }, select: { slug: true } });
  const used = new Set(taken.map((entry) => entry.slug));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base.slice(0, 76)}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Too many goals share that name. Choose a more distinct one.");
}

export async function createSeason(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = createSeasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid season. Check the name, theme, description, and goals.");
  const startsAt = new Date(`${parsed.data.startsOn}T00:00:00.000Z`);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date.");
  const slug = seasonSlugFrom(parsed.data.name);
  if (!slug) throw new Error("The season name must contain letters or numbers.");
  const season = await db.$transaction(async (transaction) => {
    if (await transaction.season.findUnique({ where: { slug }, select: { id: true } })) throw new Error(`A season already uses the slug "${slug}".`);
    const highest = await transaction.season.aggregate({ _max: { ordinal: true } });
    const created = await transaction.season.create({
      data: {
        slug, ordinal: (highest._max.ordinal ?? 0) + 1, name: parsed.data.name, theme: parsed.data.theme, description: parsed.data.description,
        // seasonEndFor mirrors the Postgres INTERVAL '3 months' CHECK, so a
        // month-end start lands on a date the database accepts.
        startsAt, endsAt: seasonEndFor(startsAt), communityXpGoal: parsed.data.communityXpGoal, trophyXpRequirement: parsed.data.trophyXpRequirement,
        // A new season starts disabled: it has no goals and no trophies yet, so
        // publishing it to the board before it is built would show an empty one.
        isEnabled: false,
      },
    });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_CREATED", entityType: "Season", entityId: created.id, after: { slug, ordinal: created.ordinal, name: created.name } } });
    return created;
  });
  seasonPaths();
  redirect(`/admin/seasons/${season.slug}`);
}

export async function createSeasonQuest(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = questSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid quest. Check the name, description, threshold, and reward.");
  const { seasonId, ...quest } = parsed.data;
  const problems = seasonGoalProblems(quest);
  if (problems.length) throw new Error(problems[0]);
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, seasonId, "structural");
    const questSlug = await uniqueSlug(transaction, "quest", season.id, quest.name);
    const created = await transaction.seasonQuestDefinition.create({ data: { seasonId: season.id, slug: questSlug, ...quest } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_QUEST_CREATED", entityType: "SeasonQuestDefinition", entityId: created.id, after: { seasonId: season.id, slug: questSlug, scope: quest.scope, ruleType: quest.ruleType, threshold: quest.threshold, xpReward: quest.xpReward } } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function updateSeasonQuest(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = questSchema.extend({ id: z.string().uuid(), enabled: z.enum(["true", "false"]).transform((value) => value === "true") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid quest update.");
  const { seasonId, id, ...quest } = parsed.data;
  const problems = seasonGoalProblems(quest);
  if (problems.length) throw new Error(problems[0]);
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, seasonId, "presentation");
    const existing = await transaction.seasonQuestDefinition.findFirst({ where: { id, seasonId: season.id } });
    if (!existing) throw new Error("That quest no longer exists.");
    const editability = seasonContentEditability(season.status);
    // On a running season only wording, difficulty, order, and availability move.
    // Scope, rule, game, and reward stay as members were enrolled against them.
    const data = editability.measurable
      ? quest
      : { name: quest.name, description: quest.description, threshold: quest.threshold, sortOrder: quest.sortOrder, enabled: quest.enabled };
    await transaction.seasonQuestDefinition.update({ where: { id: existing.id }, data });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_QUEST_UPDATED", entityType: "SeasonQuestDefinition", entityId: existing.id, before: { name: existing.name, threshold: existing.threshold, xpReward: existing.xpReward, enabled: existing.enabled }, after: data } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function removeSeasonQuest(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid quest.");
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, parsed.data.seasonId, "structural");
    const quest = await transaction.seasonQuestDefinition.findFirst({ where: { id: parsed.data.id, seasonId: season.id }, select: { id: true, slug: true, name: true } });
    if (!quest) throw new Error("That quest no longer exists.");
    // Season XP entries reference the season, not the quest, so a quest that has
    // ever paid out must never be removed or its ledger rows would be orphaned.
    const awarded = await transaction.seasonXpEntry.count({ where: { seasonId: season.id, dedupeKey: { contains: quest.id } } });
    if (awarded > 0) throw new Error("This quest has already awarded season XP and cannot be removed.");
    await transaction.seasonQuestDefinition.delete({ where: { id: quest.id } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_QUEST_REMOVED", entityType: "SeasonQuestDefinition", entityId: quest.id, before: { seasonId: season.id, slug: quest.slug, name: quest.name } } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function createSeasonExpedition(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = expeditionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid expedition. Check the name, description, game, and threshold.");
  const { seasonId, ...expedition } = parsed.data;
  const problems = seasonGoalProblems({ ruleType: expedition.ruleType, gameType: expedition.gameType, threshold: expedition.threshold });
  if (problems.length) throw new Error(problems[0]);
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, seasonId, "structural");
    const expeditionSlug = await uniqueSlug(transaction, "expedition", season.id, expedition.name);
    const created = await transaction.seasonExpedition.create({ data: { seasonId: season.id, slug: expeditionSlug, ...expedition } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_EXPEDITION_CREATED", entityType: "SeasonExpedition", entityId: created.id, after: { seasonId: season.id, slug: expeditionSlug, gameType: expedition.gameType, ruleType: expedition.ruleType, threshold: expedition.threshold } } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function updateSeasonExpedition(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = expeditionSchema.extend({ id: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid expedition update.");
  const { seasonId, id, ...expedition } = parsed.data;
  const problems = seasonGoalProblems({ ruleType: expedition.ruleType, gameType: expedition.gameType, threshold: expedition.threshold });
  if (problems.length) throw new Error(problems[0]);
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, seasonId, "presentation");
    const existing = await transaction.seasonExpedition.findFirst({ where: { id, seasonId: season.id } });
    if (!existing) throw new Error("That expedition no longer exists.");
    const editability = seasonContentEditability(season.status);
    const data = editability.measurable ? expedition : { name: expedition.name, description: expedition.description, threshold: expedition.threshold, sortOrder: expedition.sortOrder };
    await transaction.seasonExpedition.update({ where: { id: existing.id }, data });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_EXPEDITION_UPDATED", entityType: "SeasonExpedition", entityId: existing.id, before: { name: existing.name, gameType: existing.gameType, threshold: existing.threshold }, after: data } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function removeSeasonExpedition(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid expedition.");
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, parsed.data.seasonId, "structural");
    const expedition = await transaction.seasonExpedition.findFirst({ where: { id: parsed.data.id, seasonId: season.id }, select: { id: true, slug: true, name: true } });
    if (!expedition) throw new Error("That expedition no longer exists.");
    await transaction.seasonExpedition.delete({ where: { id: expedition.id } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_EXPEDITION_REMOVED", entityType: "SeasonExpedition", entityId: expedition.id, before: { seasonId: season.id, slug: expedition.slug, name: expedition.name } } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function upsertSeasonTrophy(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = trophySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid trophy. Codes use lowercase letters, numbers, and hyphens.");
  const { seasonId, kind, ...trophy } = parsed.data;
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, seasonId, "presentation");
    const existing = await transaction.seasonTrophy.findUnique({ where: { seasonId_kind: { seasonId: season.id, kind } }, select: { id: true, code: true, name: true, rarity: true } });
    const editability = seasonContentEditability(season.status);
    if (!existing && !editability.structural) throw new Error(editability.reason);
    // The founding reward only ever awards in the first season, so offering one
    // anywhere else would promise a piece the worker will never hand out.
    if (kind === "FOUNDING_MEMBER" && season.ordinal !== 1) throw new Error("The founding reward is only awarded in season 1 and would never be handed out here.");
    const clash = await transaction.seasonTrophy.findUnique({ where: { seasonId_code: { seasonId: season.id, code: trophy.code } }, select: { id: true } });
    if (clash && clash.id !== existing?.id) throw new Error(`Another trophy in this season already uses the code "${trophy.code}".`);
    const saved = await transaction.seasonTrophy.upsert({ where: { seasonId_kind: { seasonId: season.id, kind } }, create: { seasonId: season.id, kind, ...trophy }, update: trophy });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: existing ? "SEASON_TROPHY_UPDATED" : "SEASON_TROPHY_CREATED", entityType: "SeasonTrophy", entityId: saved.id, before: existing ?? undefined, after: { kind, ...trophy } } });
    return season.slug;
  });
  seasonPaths(slug);
}

export async function removeSeasonTrophy(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid trophy.");
  const slug = await db.$transaction(async (transaction) => {
    const season = await requireEditable(transaction, parsed.data.seasonId, "structural");
    const trophy = await transaction.seasonTrophy.findFirst({ where: { id: parsed.data.id, seasonId: season.id }, select: { id: true, code: true, name: true, _count: { select: { unlocks: true } } } });
    if (!trophy) throw new Error("That trophy no longer exists.");
    // Removing an awarded trophy would take a permanent piece off a member's
    // shelf. The cabinet is append-only from the member's point of view.
    if (trophy._count.unlocks > 0) throw new Error("Members already hold this trophy. A trophy on a member's shelf is never withdrawn.");
    await transaction.seasonTrophy.delete({ where: { id: trophy.id } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SEASON_TROPHY_REMOVED", entityType: "SeasonTrophy", entityId: trophy.id, before: { seasonId: season.id, code: trophy.code, name: trophy.name } } });
    return season.slug;
  });
  seasonPaths(slug);
}
