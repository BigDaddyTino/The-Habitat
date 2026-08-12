import { getPrismaClient } from "@habitat/db/client";
import { fetchSteamAchievementSchema, fetchSteamPlayerAchievements, SteamWebApiError } from "@habitat/shared";
import { parseRequestBudget, reserveProviderRequests } from "./provider-budget.js";
import { providerFailureState } from "./steam-enrichment.js";

const db = getPrismaClient();
const SCHEMA_REFRESH_MS = 30 * 24 * 60 * 60 * 1_000;
const PROGRESS_REFRESH_MS = 7 * 24 * 60 * 60 * 1_000;
const PRIVATE_RECHECK_MS = 24 * 60 * 60 * 1_000;

class BudgetExhaustedError extends Error {}

async function ensureSchema(job: { steamAppId: number; app: { achievementSchemaStatus: string; achievementSchemaNextAttemptAt: Date | null; achievementDefinitions: Array<{ id: string; apiName: string }> } }, apiKey: string, dailyBudget: number, now: Date) {
  if (job.app.achievementSchemaStatus === "UNSUPPORTED") return "UNSUPPORTED" as const;
  const refreshDue = job.app.achievementSchemaStatus !== "READY" || !job.app.achievementSchemaNextAttemptAt || job.app.achievementSchemaNextAttemptAt <= now;
  if (!refreshDue && job.app.achievementDefinitions.length > 0) return "READY" as const;
  if (!await reserveProviderRequests("STEAM", 1, dailyBudget)) throw new BudgetExhaustedError("The Steam daily request budget is exhausted.");
  await db.steamApp.update({ where: { appId: job.steamAppId }, data: { achievementSchemaLastAttemptedAt: now } });
  try {
    const schema = await fetchSteamAchievementSchema(job.steamAppId, apiKey);
    if (schema.status === "UNSUPPORTED") {
      await db.steamApp.update({ where: { appId: job.steamAppId }, data: { achievementSchemaStatus: "UNSUPPORTED", achievementSchemaLastAttemptedAt: now, achievementSchemaSyncError: null, achievementSchemaNextAttemptAt: null } });
      return "UNSUPPORTED" as const;
    }
    await db.$transaction(async (transaction) => {
      for (const definition of schema.definitions) {
        await transaction.steamAchievementDefinition.upsert({
          where: { steamAppId_apiName: { steamAppId: job.steamAppId, apiName: definition.apiName } },
          create: { steamAppId: job.steamAppId, apiName: definition.apiName, displayName: definition.displayName, description: definition.description, hidden: definition.hidden, iconUrl: definition.iconUrl, iconGrayUrl: definition.iconGrayUrl, lastSeenAt: now },
          update: { displayName: definition.displayName, description: definition.description, hidden: definition.hidden, iconUrl: definition.iconUrl, iconGrayUrl: definition.iconGrayUrl, lastSeenAt: now, isCurrent: true },
        });
      }
      await transaction.steamAchievementDefinition.updateMany({ where: { steamAppId: job.steamAppId, isCurrent: true, apiName: { notIn: schema.definitions.map((definition) => definition.apiName) } }, data: { isCurrent: false } });
      await transaction.steamApp.update({ where: { appId: job.steamAppId }, data: { achievementSchemaStatus: "READY", achievementSchemaLastAttemptedAt: now, achievementSchemaLastSuccessfulAt: now, achievementSchemaNextAttemptAt: new Date(now.getTime() + SCHEMA_REFRESH_MS), achievementSchemaSyncError: null } });
    });
    return "READY" as const;
  } catch (error) {
    await db.steamApp.update({ where: { appId: job.steamAppId }, data: { achievementSchemaStatus: "ERROR", achievementSchemaSyncError: (error instanceof Error ? error.message : "Steam achievement schema refresh failed.").slice(0, 180), achievementSchemaNextAttemptAt: new Date(now.getTime() + 6 * 60 * 60 * 1_000) } });
    if (job.app.achievementDefinitions.length > 0) return "READY" as const;
    throw error;
  }
}

export async function syncSteamAchievements(): Promise<{ enabled: boolean; checked: number; updated: number; unsupported: number; privateProfiles: number; failed: number; budgetExhausted: boolean }> {
  const apiKey = process.env.STEAM_WEB_API_KEY?.trim();
  if (!apiKey) return { enabled: false, checked: 0, updated: 0, unsupported: 0, privateProfiles: 0, failed: 0, budgetExhausted: false };
  if (!process.env.STEAM_DATA_STORAGE_COUNTRY?.trim()) throw new Error("STEAM_DATA_STORAGE_COUNTRY must be configured before Steam enrichment can run.");
  const dailyBudget = parseRequestBudget(process.env.STEAM_WEB_API_DAILY_REQUEST_BUDGET, 5_000);
  const now = new Date();
  const jobs = await db.steamAchievementSync.findMany({
    where: { status: { not: "UNSUPPORTED" }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }], steamProfile: { socialAccount: { is: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } } } } },
    orderBy: [{ priority: "desc" }, { nextAttemptAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    take: 5,
    include: { steamProfile: { select: { id: true, socialAccount: { select: { providerAccountId: true } } } }, app: { include: { achievementDefinitions: { where: { isCurrent: true }, select: { id: true, apiName: true } } } } },
  });
  let updated = 0;
  let unsupported = 0;
  let privateProfiles = 0;
  let failed = 0;
  let budgetExhausted = false;
  for (const job of jobs) {
    const steamId = job.steamProfile.socialAccount.providerAccountId;
    if (!steamId) continue;
    try {
      const schemaStatus = await ensureSchema(job, apiKey, dailyBudget, now);
      if (schemaStatus === "UNSUPPORTED") {
        await db.steamAchievementSync.update({ where: { id: job.id }, data: { status: "UNSUPPORTED", lastAttemptedAt: now, nextAttemptAt: null, consecutiveFailures: 0, syncError: null, definitionCount: 0, achievedCount: 0 } });
        unsupported += 1;
        continue;
      }
      if (!await reserveProviderRequests("STEAM", 1, dailyBudget)) throw new BudgetExhaustedError("The Steam daily request budget is exhausted.");
      await db.steamAchievementSync.update({ where: { id: job.id }, data: { lastAttemptedAt: now } });
      const progress = await fetchSteamPlayerAchievements(steamId, job.steamAppId, apiKey);
      if (progress.status === "UNSUPPORTED") {
        await db.steamAchievementSync.update({ where: { id: job.id }, data: { status: "UNSUPPORTED", lastAttemptedAt: now, nextAttemptAt: null, consecutiveFailures: 0, syncError: null, definitionCount: 0, achievedCount: 0 } });
        unsupported += 1;
        continue;
      }
      if (progress.status === "PRIVATE") {
        await db.steamAchievementSync.update({ where: { id: job.id }, data: { status: "PRIVATE", lastAttemptedAt: now, nextAttemptAt: new Date(now.getTime() + PRIVATE_RECHECK_MS), consecutiveFailures: 0, syncError: "Steam did not expose achievements for this account and app. Cached progress was retained." } });
        privateProfiles += 1;
        continue;
      }
      const definitions = await db.steamAchievementDefinition.findMany({ where: { steamAppId: job.steamAppId, isCurrent: true }, select: { id: true, apiName: true } });
      const definitionByName = new Map(definitions.map((definition) => [definition.apiName, definition]));
      if (progress.achievements.some((achievement) => !definitionByName.has(achievement.apiName))) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned achievement progress that did not match the cached app schema.");
      await db.$transaction(async (transaction) => {
        for (const achievement of progress.achievements) {
          const definition = definitionByName.get(achievement.apiName)!;
          await transaction.steamUserAchievement.upsert({
            where: { steamProfileId_achievementDefinitionId: { steamProfileId: job.steamProfileId, achievementDefinitionId: definition.id } },
            create: { steamProfileId: job.steamProfileId, achievementDefinitionId: definition.id, achieved: achievement.achieved, unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null, lastSeenAt: now },
            update: { achieved: achievement.achieved, unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null, lastSeenAt: now },
          });
        }
        await transaction.steamAchievementSync.update({ where: { id: job.id }, data: { status: "READY", lastAttemptedAt: now, lastSuccessfulAt: now, nextAttemptAt: new Date(now.getTime() + PROGRESS_REFRESH_MS), consecutiveFailures: 0, syncError: null, definitionCount: definitions.length, achievedCount: progress.achievements.filter((achievement) => achievement.achieved).length } });
      });
      updated += 1;
    } catch (error) {
      if (error instanceof BudgetExhaustedError) {
        budgetExhausted = true;
        break;
      }
      const failure = providerFailureState({ consecutiveFailures: job.consecutiveFailures, error, now });
      await db.steamAchievementSync.update({ where: { id: job.id }, data: { status: "ERROR", lastAttemptedAt: now, nextAttemptAt: failure.nextAttemptAt, consecutiveFailures: failure.failures, syncError: failure.message } });
      failed += 1;
      if (error instanceof SteamWebApiError && error.code === "RATE_LIMITED") break;
    }
  }
  return { enabled: true, checked: jobs.length, updated, unsupported, privateProfiles, failed, budgetExhausted };
}
