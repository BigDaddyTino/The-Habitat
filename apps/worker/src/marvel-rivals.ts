import { getPrismaClient } from "@habitat/db/client";
import { fetchMarvelRivalsProfile, MarvelRivalsApiError, type MarvelRivalsProfileData } from "@habitat/shared";

const db = getPrismaClient();

function profileFields(profile: MarvelRivalsProfileData) {
  return {
    displayName: profile.displayName,
    lastSyncedAt: new Date(),
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
  };
}

/** Refreshes only stale, explicitly linked profiles, sequentially and in a bounded batch. */
export async function syncMarvelRivalsProfiles(): Promise<{ enabled: boolean; checked: number; updated: number; failed: number }> {
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return { enabled: false, checked: 0, updated: 0, failed: 0 };
  const staleBefore = new Date(Date.now() - 6 * 60 * 60 * 1_000);
  const profiles = await db.clubGameProfile.findMany({
    where: { gameType: "MARVEL_RIVALS", OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }] },
    orderBy: [{ lastSyncedAt: { sort: "asc", nulls: "first" } }, { connectedAt: "asc" }],
    take: 10,
    select: { id: true, providerUid: true },
  });
  let updated = 0;
  let failed = 0;
  for (const current of profiles) {
    try {
      const result = await fetchMarvelRivalsProfile(current.providerUid, apiKey);
      await db.$transaction([
        db.clubGameProfile.update({ where: { id: current.id }, data: profileFields(result) }),
        db.clubGameStatSnapshot.create({ data: { profileId: current.id, sampleKey: `${current.id}:${Date.now()}`, sampledAt: new Date(), source: "marvelrivalsapi.com", rankName: result.rankName, rankScore: result.rankScore, totalMatches: result.totalMatches, totalWins: result.totalWins, overallKd: result.overallKd, overallKda: result.overallKda, topHeroes: result.topHeroes } }),
      ]);
      updated += 1;
    } catch (error) {
      const status = error instanceof MarvelRivalsApiError && error.code === "PRIVATE" ? "PRIVATE" : "ERROR";
      const message = error instanceof Error ? error.message : "Rivals profile refresh failed.";
      await db.clubGameProfile.update({ where: { id: current.id }, data: { syncStatus: status, syncError: message.slice(0, 180) } });
      failed += 1;
      if (error instanceof MarvelRivalsApiError && error.code === "RATE_LIMITED") break;
    }
  }
  return { enabled: true, checked: profiles.length, updated, failed };
}
