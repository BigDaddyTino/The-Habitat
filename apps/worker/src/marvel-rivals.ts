import { createHash } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import { fetchMarvelRivalsMatchHistory, fetchMarvelRivalsProfile, MarvelRivalsApiError, type MarvelRivalsMatchData, type MarvelRivalsProfileData } from "@habitat/shared";
import { parseRequestBudget, reserveProviderRequests } from "./provider-budget.js";

const db = getPrismaClient();
const SUCCESS_INTERVAL_MS = 6 * 60 * 60 * 1_000;
const PRIVATE_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;
class MarvelBudgetExhaustedError extends Error {}

function dateOrNull(value: string | null) {
  if (!value) return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function profileFields(profile: MarvelRivalsProfileData, now: Date) {
  return {
    displayName: profile.displayName,
    lastAttemptedAt: now,
    lastSyncedAt: now,
    nextAttemptAt: new Date(now.getTime() + SUCCESS_INTERVAL_MS),
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
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return { enabled: false, checked: 0, updated: 0, failed: 0 };
  const dailyBudget = parseRequestBudget(process.env.MARVEL_RIVALS_DAILY_REQUEST_BUDGET, 2_500);
  const now = new Date();
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    orderBy: [{ nextAttemptAt: { sort: "asc", nulls: "first" } }, { connectedAt: "asc" }],
    take: 10,
    select: { id: true, providerUid: true, consecutiveFailures: true },
  });
  let updated = 0;
  let failed = 0;
  for (const current of profiles) {
    if (!await reserveProviderRequests("MARVEL_RIVALS", 1, dailyBudget)) break;
    await db.clubGameProfile.update({ where: { id: current.id }, data: { lastAttemptedAt: now } });
    try {
      const result = await fetchMarvelRivalsProfile(current.providerUid, apiKey);
      await db.$transaction([
        db.clubGameProfile.update({ where: { id: current.id }, data: profileFields(result, now) }),
        db.clubGameStatSnapshot.upsert({
          where: { sampleKey: snapshotKey(current.id, result) },
          create: { profileId: current.id, sampleKey: snapshotKey(current.id, result), sampledAt: now, source: "marvelrivalsapi.com", rankName: result.rankName, rankScore: result.rankScore, totalMatches: result.totalMatches, totalWins: result.totalWins, overallKd: result.overallKd, overallKda: result.overallKda, topHeroes: result.topHeroes },
          update: {},
        }),
      ]);
      updated += 1;
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

async function persistMatch(profileId: string, match: MarvelRivalsMatchData) {
  const occurredAt = new Date(match.occurredAt);
  await db.$transaction(async (transaction) => {
    const storedMatch = await transaction.clubGameMatch.upsert({
      where: { gameType_providerMatchId: { gameType: "MARVEL_RIVALS", providerMatchId: match.providerMatchId } },
      create: { gameType: "MARVEL_RIVALS", providerMatchId: match.providerMatchId, occurredAt, durationSeconds: match.durationSeconds, modeId: match.modeId, mapId: match.mapId, seasonKey: match.seasonKey, source: "marvelrivalsapi.com", metadata: { playModeId: match.playModeId } },
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
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return { enabled: false, checked: 0, matchesSeen: 0, failed: 0 };
  const dailyBudget = parseRequestBudget(process.env.MARVEL_RIVALS_DAILY_REQUEST_BUDGET, 2_500);
  const now = new Date();
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", OR: [{ matchNextAttemptAt: null }, { matchNextAttemptAt: { lte: now } }] },
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
        if (!await reserveProviderRequests("MARVEL_RIVALS", 1, dailyBudget)) throw new MarvelBudgetExhaustedError("The Marvel Rivals daily request budget is exhausted.");
        const page = await fetchMarvelRivalsMatchHistory(profile.providerUid, apiKey, pageNumber, 20);
        collected.push(...page.matches);
        foundWatermark = Boolean(profile.matchCursorOccurredAt && page.matches.some((match) => {
          const occurredAt = new Date(match.occurredAt);
          return occurredAt.getTime() === profile.matchCursorOccurredAt!.getTime() && match.providerMatchId === profile.matchCursorProviderId;
        }));
        if (!page.hasMore) break;
        pageNumber += 1;
      }
      for (const match of collected) await persistMatch(profile.id, match);
      matchesSeen += collected.length;
      const coverageGapDetected = Boolean(profile.matchCursorOccurredAt && !foundWatermark);
      const newest = [...collected].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime() || right.providerMatchId.localeCompare(left.providerMatchId))[0];
      await db.clubGameProfile.update({ where: { id: profile.id }, data: {
        matchStatus: "READY",
        matchLastAttemptedAt: now,
        matchLastSuccessfulAt: now,
        matchNextAttemptAt: new Date(now.getTime() + SUCCESS_INTERVAL_MS),
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
