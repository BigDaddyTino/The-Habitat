import { getPrismaClient } from "@habitat/db/client";
import { fetchSteamOwnedGames, fetchSteamPlayerSummaries, steamAchievementPriority, SteamWebApiError, type SteamOwnedGame } from "@habitat/shared";
import { parseRequestBudget, reserveProviderRequests } from "./provider-budget.js";

const db = getPrismaClient();
const PROFILE_SUCCESS_INTERVAL_MS = 6 * 60 * 60 * 1_000;
const LIBRARY_SUCCESS_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const PRIVATE_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

type FailureInput = { consecutiveFailures: number; error: unknown; now: Date };

export function providerFailureState({ consecutiveFailures, error, now }: FailureInput) {
  const failures = consecutiveFailures + 1;
  const retryAfterMs = error instanceof SteamWebApiError && error.retryAfterSeconds !== null ? error.retryAfterSeconds * 1_000 : 0;
  const exponentialMs = Math.min(6 * 60 * 60 * 1_000, 5 * 60 * 1_000 * (2 ** Math.min(failures - 1, 7)));
  const jitterMs = Math.floor(exponentialMs * 0.1 * Math.random());
  const delayMs = Math.max(retryAfterMs, exponentialMs + jitterMs);
  const message = error instanceof SteamWebApiError ? error.message : "Steam enrichment failed without replacing cached data.";
  return { failures, nextAttemptAt: new Date(now.getTime() + delayMs), message: message.slice(0, 180) };
}

function dateOrNull(value: string | null) {
  return value ? new Date(value) : null;
}

async function failProfile(profile: { id: string; profileConsecutiveFailures: number }, error: unknown, now: Date) {
  const failure = providerFailureState({ consecutiveFailures: profile.profileConsecutiveFailures, error, now });
  await db.steamProfile.update({ where: { id: profile.id }, data: {
    profileStatus: "ERROR",
    profileLastAttemptedAt: now,
    profileNextAttemptAt: failure.nextAttemptAt,
    profileConsecutiveFailures: failure.failures,
    profileSyncError: failure.message,
  } });
}

async function failLibrary(profile: { id: string; libraryConsecutiveFailures: number }, error: unknown, now: Date) {
  const failure = providerFailureState({ consecutiveFailures: profile.libraryConsecutiveFailures, error, now });
  await db.steamProfile.update({ where: { id: profile.id }, data: {
    libraryStatus: "ERROR",
    libraryLastAttemptedAt: now,
    libraryNextAttemptAt: failure.nextAttemptAt,
    libraryConsecutiveFailures: failure.failures,
    librarySyncError: failure.message,
  } });
}

async function persistLibrary(profileId: string, games: SteamOwnedGame[], now: Date) {
  await db.$transaction(async (transaction) => {
    for (const game of games) {
      await transaction.steamApp.upsert({
        where: { appId: game.appId },
        create: { appId: game.appId, name: game.name, iconHash: game.iconHash, metadataSeenAt: now },
        update: { name: game.name, iconHash: game.iconHash, metadataSeenAt: now },
      });
      await transaction.steamLibraryGame.upsert({
        where: { steamProfileId_steamAppId: { steamProfileId: profileId, steamAppId: game.appId } },
        create: {
          steamProfileId: profileId,
          steamAppId: game.appId,
          playtimeMinutes: game.playtimeMinutes,
          playtimeTwoWeeksMinutes: game.playtimeTwoWeeksMinutes,
          lastPlayedAt: dateOrNull(game.lastPlayedAt),
          lastSeenAt: now,
        },
        update: {
          playtimeMinutes: game.playtimeMinutes,
          playtimeTwoWeeksMinutes: game.playtimeTwoWeeksMinutes,
          lastPlayedAt: dateOrNull(game.lastPlayedAt),
          lastSeenAt: now,
          isCurrent: true,
        },
      });
      await transaction.steamAchievementSync.upsert({
        where: { steamProfileId_steamAppId: { steamProfileId: profileId, steamAppId: game.appId } },
        create: { steamProfileId: profileId, steamAppId: game.appId, nextAttemptAt: now, priority: steamAchievementPriority(game) },
        update: { priority: steamAchievementPriority(game) },
      });
    }
    await transaction.steamLibraryGame.updateMany({
      where: { steamProfileId: profileId, isCurrent: true, steamAppId: { notIn: games.map((game) => game.appId) } },
      data: { isCurrent: false },
    });
    await transaction.steamProfile.update({ where: { id: profileId }, data: {
      libraryStatus: "READY",
      libraryLastAttemptedAt: now,
      libraryLastSuccessfulAt: now,
      libraryNextAttemptAt: new Date(now.getTime() + LIBRARY_SUCCESS_INTERVAL_MS),
      libraryConsecutiveFailures: 0,
      librarySyncError: null,
    } });
  });
}

export async function syncSteamEnrichment(): Promise<{ enabled: boolean; profilesChecked: number; profilesUpdated: number; librariesChecked: number; librariesUpdated: number; failed: number }> {
  const apiKey = process.env.STEAM_WEB_API_KEY?.trim();
  if (!apiKey) return { enabled: false, profilesChecked: 0, profilesUpdated: 0, librariesChecked: 0, librariesUpdated: 0, failed: 0 };
  if (!process.env.STEAM_DATA_STORAGE_COUNTRY?.trim()) throw new Error("STEAM_DATA_STORAGE_COUNTRY must be configured before Steam enrichment can run.");
  const dailyBudget = parseRequestBudget(process.env.STEAM_WEB_API_DAILY_REQUEST_BUDGET, 5_000);
  const now = new Date();
  const dueProfiles = await db.steamProfile.findMany({
    where: {
      OR: [{ profileNextAttemptAt: null }, { profileNextAttemptAt: { lte: now } }],
      socialAccount: { is: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } } },
    },
    orderBy: [{ profileNextAttemptAt: { sort: "asc", nulls: "first" } }, { enrichmentEnabledAt: "asc" }],
    take: 100,
    select: { id: true, profileConsecutiveFailures: true, socialAccount: { select: { providerAccountId: true } } },
  });
  let profilesUpdated = 0;
  let failed = 0;
  if (dueProfiles.length > 0) {
    if (!await reserveProviderRequests("STEAM", 1, dailyBudget)) return { enabled: true, profilesChecked: 0, profilesUpdated: 0, librariesChecked: 0, librariesUpdated: 0, failed: 0 };
    await db.steamProfile.updateMany({ where: { id: { in: dueProfiles.map((profile) => profile.id) } }, data: { profileLastAttemptedAt: now } });
    try {
      const summaries = await fetchSteamPlayerSummaries(dueProfiles.flatMap((profile) => profile.socialAccount.providerAccountId ? [profile.socialAccount.providerAccountId] : []), apiKey);
      const bySteamId = new Map(summaries.map((summary) => [summary.steamId, summary]));
      for (const profile of dueProfiles) {
        const steamId = profile.socialAccount.providerAccountId;
        const summary = steamId ? bySteamId.get(steamId) : undefined;
        if (!summary) {
          await failProfile(profile, new SteamWebApiError("INVALID_RESPONSE", "Steam did not return the verified account in its player summary."), now);
          failed += 1;
          continue;
        }
        await db.steamProfile.update({ where: { id: profile.id }, data: {
          personaName: summary.personaName,
          profileUrl: summary.profileUrl,
          avatarUrl: summary.avatarUrl,
          avatarMediumUrl: summary.avatarMediumUrl,
          avatarFullUrl: summary.avatarFullUrl,
          communityVisibilityState: summary.communityVisibilityState,
          profileState: summary.profileState,
          steamCreatedAt: dateOrNull(summary.steamCreatedAt),
          lastLogoffAt: dateOrNull(summary.lastLogoffAt),
          currentGameAppId: summary.currentGameAppId,
          currentGameName: summary.currentGameName,
          profileStatus: "READY",
          profileLastAttemptedAt: now,
          profileLastSuccessfulAt: now,
          profileNextAttemptAt: new Date(now.getTime() + PROFILE_SUCCESS_INTERVAL_MS),
          profileConsecutiveFailures: 0,
          profileSyncError: null,
        } });
        profilesUpdated += 1;
      }
    } catch (error) {
      for (const profile of dueProfiles) await failProfile(profile, error, now);
      failed += dueProfiles.length;
    }
  }

  const dueLibraries = await db.steamProfile.findMany({
    where: {
      OR: [{ libraryNextAttemptAt: null }, { libraryNextAttemptAt: { lte: now } }],
      socialAccount: { is: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } } },
    },
    orderBy: [{ libraryNextAttemptAt: { sort: "asc", nulls: "first" } }, { enrichmentEnabledAt: "asc" }],
    take: 5,
    select: { id: true, libraryConsecutiveFailures: true, socialAccount: { select: { providerAccountId: true } } },
  });
  let librariesUpdated = 0;
  for (const profile of dueLibraries) {
    const steamId = profile.socialAccount.providerAccountId;
    if (!steamId) continue;
    if (!await reserveProviderRequests("STEAM", 1, dailyBudget)) break;
    await db.steamProfile.update({ where: { id: profile.id }, data: { libraryLastAttemptedAt: now } });
    try {
      const library = await fetchSteamOwnedGames(steamId, apiKey);
      if (library.visibility !== "VISIBLE") {
        await db.steamProfile.update({ where: { id: profile.id }, data: {
          libraryStatus: "PRIVATE",
          libraryLastAttemptedAt: now,
          libraryNextAttemptAt: new Date(now.getTime() + PRIVATE_RECHECK_INTERVAL_MS),
          libraryConsecutiveFailures: 0,
          librarySyncError: "Steam did not expose a visible game library. Cached data was retained.",
        } });
        continue;
      }
      await persistLibrary(profile.id, library.games, now);
      librariesUpdated += 1;
    } catch (error) {
      await failLibrary(profile, error, now);
      failed += 1;
      if (error instanceof SteamWebApiError && error.code === "RATE_LIMITED") break;
    }
  }
  return { enabled: true, profilesChecked: dueProfiles.length, profilesUpdated, librariesChecked: dueLibraries.length, librariesUpdated, failed };
}
