import { createHash } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import { fetchSteamPlayerSummaries, MarvelRivalsApiError, resolveMarvelRivalsProvider, type MarvelRivalsMatchData, type MarvelRivalsProfileData, type MarvelRivalsProvider } from "@habitat/shared";
import { parseRequestBudget, reserveProviderRequests } from "./provider-budget.js";

const db = getPrismaClient();
const PRIVATE_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;
/** Members whose Steam presence never shows the game still get a slow safety refresh. */
const IDLE_FALLBACK_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const MARVEL_RIVALS_STEAM_APP_ID = 2_767_030;
class MarvelBudgetExhaustedError extends Error {}

/**
 * Stats only change while a member is in game, so refreshes follow Steam
 * presence: sync while the game was seen running recently, keep going for a
 * full extra refresh interval after they stop (provider-side data lags live
 * play), and fall back to a daily pass for members without Steam evidence.
 */
function presenceEligibilityFilter(now: Date, refreshIntervalMs: number, lastSuccessField: "lastSyncedAt" | "matchLastSuccessfulAt") {
  const presenceCutoff = new Date(now.getTime() - (refreshIntervalMs + 60 * 60 * 1_000));
  const idleCutoff = new Date(now.getTime() - IDLE_FALLBACK_INTERVAL_MS);
  return { OR: [
    { steamLastPlayingAt: { gte: presenceCutoff } },
    { [lastSuccessField]: null },
    { [lastSuccessField]: { lte: idleCutoff } },
  ] };
}

/**
 * Samples verified Steam accounts of linked Rivals members (one batched Steam
 * request) and records when Marvel Rivals was last seen running.
 */
export async function syncMarvelRivalsPresence(): Promise<{ enabled: boolean; checked: number; playing: number }> {
  const steamKey = process.env.STEAM_WEB_API_KEY?.trim();
  if (!steamKey) return { enabled: false, checked: 0, playing: 0 };
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", user: { socialAccounts: { some: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } } } } },
    take: 100,
    select: { id: true, user: { select: { socialAccounts: { where: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } }, select: { providerAccountId: true }, take: 1 } } } },
  });
  const steamIdByProfile = new Map(profiles.flatMap((profile) => {
    const steamId = profile.user.socialAccounts[0]?.providerAccountId;
    return steamId ? [[profile.id, steamId] as const] : [];
  }));
  if (steamIdByProfile.size === 0) return { enabled: true, checked: 0, playing: 0 };
  const steamBudget = parseRequestBudget(process.env.STEAM_WEB_API_DAILY_REQUEST_BUDGET, 5_000);
  if (!await reserveProviderRequests("STEAM", 1, steamBudget)) return { enabled: true, checked: 0, playing: 0 };
  const now = new Date();
  const summaries = await fetchSteamPlayerSummaries([...new Set(steamIdByProfile.values())], steamKey);
  const playingSteamIds = new Set(summaries.filter((summary) => summary.currentGameAppId === MARVEL_RIVALS_STEAM_APP_ID).map((summary) => summary.steamId));
  const playingProfileIds = [...steamIdByProfile.entries()].filter(([, steamId]) => playingSteamIds.has(steamId)).map(([profileId]) => profileId);
  await db.clubGameProfile.updateMany({ where: { id: { in: [...steamIdByProfile.keys()] } }, data: { steamPresenceCheckedAt: now } });
  if (playingProfileIds.length > 0) await db.clubGameProfile.updateMany({ where: { id: { in: playingProfileIds } }, data: { steamLastPlayingAt: now } });
  return { enabled: true, checked: steamIdByProfile.size, playing: playingProfileIds.length };
}

function providerBudget(provider: MarvelRivalsProvider): { name: string; dailyLimit: number } {
  return provider.kind === "rivalsmeta"
    ? { name: "RIVALSMETA", dailyLimit: parseRequestBudget(process.env.MARVEL_RIVALS_DAILY_REQUEST_BUDGET, 1_000) }
    : { name: "MARVEL_RIVALS", dailyLimit: parseRequestBudget(process.env.MARVEL_RIVALS_DAILY_REQUEST_BUDGET, 2_500) };
}

function dateOrNull(value: string | null) {
  if (!value) return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function profileFields(profile: MarvelRivalsProfileData, now: Date, refreshIntervalMs: number) {
  return {
    displayName: profile.displayName,
    lastAttemptedAt: now,
    lastSyncedAt: now,
    nextAttemptAt: new Date(now.getTime() + refreshIntervalMs),
    consecutiveFailures: 0,
    syncStatus: "READY" as const,
    syncError: null,
    playerLevel: profile.playerLevel,
    rankName: profile.rankName,
    peakRankName: profile.peakRankName,
    rankScore: profile.rankScore,
    totalMatches: profile.totalMatches,
    totalWins: profile.totalWins,
    overallKd: profile.overallKd,
    overallKda: profile.overallKda,
    topHeroes: profile.topHeroes,
    providerUpdatedAt: dateOrNull(profile.providerUpdatedAt),
  };
}

function snapshotKey(profileId: string, profile: MarvelRivalsProfileData) {
  return createHash("sha256").update(JSON.stringify({ profileId, providerUpdatedAt: profile.providerUpdatedAt, rankName: profile.rankName, rankScore: profile.rankScore, totalMatches: profile.totalMatches, totalWins: profile.totalWins, overallKd: profile.overallKd, overallKda: profile.overallKda, topHeroes: profile.topHeroes })).digest("hex");
}

export function marvelFailureState(consecutiveFailures: number, error: unknown, now: Date) {
  const failures = consecutiveFailures + 1;
  const retryAfterMs = error instanceof MarvelRivalsApiError && error.retryAfterSeconds !== null ? error.retryAfterSeconds * 1_000 : 0;
  const exponentialMs = Math.min(6 * 60 * 60 * 1_000, 5 * 60 * 1_000 * (2 ** Math.min(failures - 1, 7)));
  const jitterMs = Math.floor(exponentialMs * Math.random() * 0.1);
  return {
    failures,
    nextAttemptAt: new Date(now.getTime() + Math.max(retryAfterMs, exponentialMs + jitterMs)),
    message: (error instanceof MarvelRivalsApiError ? error.message : "The Rivals provider failed without replacing cached data.").slice(0, 180),
  };
}

/** Refreshes only due, explicitly linked profiles, sequentially and in a bounded batch. */
export async function syncMarvelRivalsProfiles(): Promise<{ enabled: boolean; checked: number; updated: number; failed: number }> {
  const provider = resolveMarvelRivalsProvider(process.env);
  if (!provider) return { enabled: false, checked: 0, updated: 0, failed: 0 };
  const budget = providerBudget(provider);
  const now = new Date();
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", AND: [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, presenceEligibilityFilter(now, provider.profileRefreshIntervalMs, "lastSyncedAt")] },
    orderBy: [{ nextAttemptAt: { sort: "asc", nulls: "first" } }, { connectedAt: "asc" }],
    take: 10,
    select: { id: true, providerUid: true, consecutiveFailures: true },
  });
  let updated = 0;
  let failed = 0;
  for (const current of profiles) {
    if (!await reserveProviderRequests(budget.name, 1, budget.dailyLimit)) break;
    await db.clubGameProfile.update({ where: { id: current.id }, data: { lastAttemptedAt: now } });
    try {
      const result = await provider.fetchProfile(current.providerUid);
      await db.$transaction([
        db.clubGameProfile.update({ where: { id: current.id }, data: profileFields(result, now, provider.profileRefreshIntervalMs) }),
        db.clubGameStatSnapshot.upsert({
          where: { sampleKey: snapshotKey(current.id, result) },
          create: { profileId: current.id, sampleKey: snapshotKey(current.id, result), sampledAt: now, source: provider.source, rankName: result.rankName, rankScore: result.rankScore, totalMatches: result.totalMatches, totalWins: result.totalWins, overallKd: result.overallKd, overallKda: result.overallKda, topHeroes: result.topHeroes },
          update: {},
        }),
      ]);
      updated += 1;
      // rivalsmeta serves cached career data; nudging its upstream refresh now
      // means the next hourly pass reads freshly pulled numbers.
      const providerDataAgeMs = result.providerUpdatedAt ? now.getTime() - new Date(result.providerUpdatedAt).getTime() : Number.POSITIVE_INFINITY;
      if (providerDataAgeMs > provider.profileRefreshIntervalMs && await reserveProviderRequests(budget.name, 1, budget.dailyLimit)) {
        await provider.requestUpstreamRefresh(current.providerUid);
      }
    } catch (error) {
      if (error instanceof MarvelRivalsApiError && error.code === "PRIVATE") {
        await db.clubGameProfile.update({ where: { id: current.id }, data: { syncStatus: "PRIVATE", syncError: error.message.slice(0, 180), lastAttemptedAt: now, nextAttemptAt: new Date(now.getTime() + PRIVATE_RECHECK_INTERVAL_MS), consecutiveFailures: 0 } });
      } else {
        const failure = marvelFailureState(current.consecutiveFailures, error, now);
        await db.clubGameProfile.update({ where: { id: current.id }, data: { syncStatus: "ERROR", syncError: failure.message, lastAttemptedAt: now, nextAttemptAt: failure.nextAttemptAt, consecutiveFailures: failure.failures } });
      }
      failed += 1;
      if (error instanceof MarvelRivalsApiError && error.code === "RATE_LIMITED") break;
    }
  }
  return { enabled: true, checked: profiles.length, updated, failed };
}

async function persistMatch(profileId: string, match: MarvelRivalsMatchData, source: string) {
  const occurredAt = new Date(match.occurredAt);
  await db.$transaction(async (transaction) => {
    const storedMatch = await transaction.clubGameMatch.upsert({
      where: { gameType_providerMatchId: { gameType: "MARVEL_RIVALS", providerMatchId: match.providerMatchId } },
      create: { gameType: "MARVEL_RIVALS", providerMatchId: match.providerMatchId, occurredAt, durationSeconds: match.durationSeconds, modeId: match.modeId, mapId: match.mapId, seasonKey: match.seasonKey, source, metadata: { playModeId: match.playModeId } },
      update: { occurredAt, durationSeconds: match.durationSeconds, modeId: match.modeId, mapId: match.mapId, seasonKey: match.seasonKey, metadata: { playModeId: match.playModeId } },
    });
    const participant = await transaction.clubGameMatchParticipant.upsert({
      where: { matchId_clubGameProfileId: { matchId: storedMatch.id, clubGameProfileId: profileId } },
      create: { matchId: storedMatch.id, clubGameProfileId: profileId, providerPlayerUid: match.participant.providerPlayerUid, result: match.participant.result, kills: match.participant.kills, deaths: match.participant.deaths, assists: match.participant.assists, damage: match.participant.damage, healing: match.participant.healing, damageTaken: match.participant.damageTaken, score: match.participant.score, scoreChange: match.participant.scoreChange, mvp: match.participant.mvp, svp: match.participant.svp, disconnected: match.participant.disconnected },
      update: { providerPlayerUid: match.participant.providerPlayerUid, result: match.participant.result, kills: match.participant.kills, deaths: match.participant.deaths, assists: match.participant.assists, damage: match.participant.damage, healing: match.participant.healing, damageTaken: match.participant.damageTaken, score: match.participant.score, scoreChange: match.participant.scoreChange, mvp: match.participant.mvp, svp: match.participant.svp, disconnected: match.participant.disconnected },
    });
    for (const hero of match.participant.heroes) {
      await transaction.clubGameMatchHeroPerformance.upsert({
        where: { participantId_providerHeroId: { participantId: participant.id, providerHeroId: hero.providerHeroId } },
        create: { participantId: participant.id, providerHeroId: hero.providerHeroId, heroName: hero.heroName, playtimeSeconds: hero.playtimeSeconds, kills: hero.kills, deaths: hero.deaths, assists: hero.assists, damage: hero.damage, healing: hero.healing, damageTaken: hero.damageTaken },
        update: { heroName: hero.heroName, playtimeSeconds: hero.playtimeSeconds, kills: hero.kills, deaths: hero.deaths, assists: hero.assists, damage: hero.damage, healing: hero.healing, damageTaken: hero.damageTaken },
      });
    }
  });
}

export async function syncMarvelRivalsMatches(): Promise<{ enabled: boolean; checked: number; matchesSeen: number; failed: number }> {
  const provider = resolveMarvelRivalsProvider(process.env);
  if (!provider) return { enabled: false, checked: 0, matchesSeen: 0, failed: 0 };
  const budget = providerBudget(provider);
  const now = new Date();
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", AND: [{ OR: [{ matchNextAttemptAt: null }, { matchNextAttemptAt: { lte: now } }] }, presenceEligibilityFilter(now, provider.profileRefreshIntervalMs, "matchLastSuccessfulAt")] },
    orderBy: [{ matchNextAttemptAt: { sort: "asc", nulls: "first" } }, { connectedAt: "asc" }],
    take: 5,
    select: { id: true, providerUid: true, matchCursorOccurredAt: true, matchCursorProviderId: true, matchHistoryGapDetected: true, matchConsecutiveFailures: true },
  });
  let matchesSeen = 0;
  let failed = 0;
  for (const profile of profiles) {
    await db.clubGameProfile.update({ where: { id: profile.id }, data: { matchLastAttemptedAt: now } });
    try {
      const collected: MarvelRivalsMatchData[] = [];
      let pageNumber = 1;
      let foundWatermark = false;
      while (pageNumber <= 3 && !foundWatermark) {
        if (!await reserveProviderRequests(budget.name, 1, budget.dailyLimit)) throw new MarvelBudgetExhaustedError("The Marvel Rivals daily request budget is exhausted.");
        const page = await provider.fetchMatchHistory(profile.providerUid, pageNumber);
        collected.push(...page.matches);
        foundWatermark = Boolean(profile.matchCursorOccurredAt && page.matches.some((match) => {
          const occurredAt = new Date(match.occurredAt);
          return occurredAt.getTime() === profile.matchCursorOccurredAt!.getTime() && match.providerMatchId === profile.matchCursorProviderId;
        }));
        if (!page.hasMore) break;
        pageNumber += 1;
      }
      for (const match of collected) await persistMatch(profile.id, match, provider.source);
      matchesSeen += collected.length;
      const coverageGapDetected = Boolean(profile.matchCursorOccurredAt && !foundWatermark);
      const newest = [...collected].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime() || right.providerMatchId.localeCompare(left.providerMatchId))[0];
      await db.clubGameProfile.update({ where: { id: profile.id }, data: {
        matchStatus: "READY",
        matchLastAttemptedAt: now,
        matchLastSuccessfulAt: now,
        matchNextAttemptAt: new Date(now.getTime() + provider.profileRefreshIntervalMs),
        matchConsecutiveFailures: 0,
        matchSyncError: coverageGapDetected ? "A prior match watermark fell outside the bounded provider window. Cumulative rows remain usable, but streak evaluation is paused." : null,
        matchHistoryGapDetected: profile.matchHistoryGapDetected || coverageGapDetected,
        ...(newest ? { matchCursorOccurredAt: new Date(newest.occurredAt), matchCursorProviderId: newest.providerMatchId } : {}),
      } });
    } catch (error) {
      if (error instanceof MarvelBudgetExhaustedError) break;
      if (error instanceof MarvelRivalsApiError && error.code === "PRIVATE") {
        await db.clubGameProfile.update({ where: { id: profile.id }, data: { matchStatus: "PRIVATE", matchSyncError: error.message.slice(0, 180), matchLastAttemptedAt: now, matchNextAttemptAt: new Date(now.getTime() + PRIVATE_RECHECK_INTERVAL_MS), matchConsecutiveFailures: 0 } });
      } else {
        const failure = marvelFailureState(profile.matchConsecutiveFailures, error, now);
        await db.clubGameProfile.update({ where: { id: profile.id }, data: { matchStatus: "ERROR", matchSyncError: failure.message, matchLastAttemptedAt: now, matchNextAttemptAt: failure.nextAttemptAt, matchConsecutiveFailures: failure.failures } });
      }
      failed += 1;
      if (error instanceof MarvelRivalsApiError && error.code === "RATE_LIMITED") break;
    }
  }
  return { enabled: true, checked: profiles.length, matchesSeen, failed };
}
