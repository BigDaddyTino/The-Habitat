export type MarvelRivalsHeroStat = {
  name: string;
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

export type MarvelRivalsProfileData = {
  uid: string;
  displayName: string;
  isPrivate: boolean;
  playerLevel: number | null;
  rankName: string | null;
  peakRankName: string | null;
  rankScore: number | null;
  totalMatches: number | null;
  totalWins: number | null;
  overallKd: number | null;
  overallKda: number | null;
  topHeroes: MarvelRivalsHeroStat[];
  providerUpdatedAt: string | null;
};

export class MarvelRivalsApiError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "PRIVATE" | "RATE_LIMITED" | "UNAUTHORIZED" | "UNAVAILABLE" | "INVALID_RESPONSE", message: string) {
    super(message);
    this.name = "MarvelRivalsApiError";
  }
}

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asString = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : null;
const asNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const sum = (values: Array<number | null>) => values.reduce<number>((total, value) => total + (value ?? 0), 0);
const ratio = (numerator: number, denominator: number) => denominator > 0 ? Number((numerator / denominator).toFixed(2)) : numerator > 0 ? numerator : null;

export function isValidMarvelRivalsQuery(value: string): boolean {
  return /^(?=.{2,32}$)[\p{L}\p{N}_.\- ]+$/u.test(value.trim());
}

export function parseMarvelRivalsProfile(payload: unknown): MarvelRivalsProfileData {
  const root = asRecord(payload);
  const player = asRecord(root.player);
  const uid = asString(root.uid) ?? asString(player.uid) ?? asString(player.player_id);
  const displayName = asString(root.name) ?? asString(player.name) ?? asString(player.nickname);
  if (!uid || !displayName) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned an incomplete player profile.");

  const overall = asRecord(root.overall_stats);
  const ranked = asRecord(overall.ranked);
  const unranked = asRecord(overall.unranked);
  const kills = sum([asNumber(ranked.total_kills), asNumber(unranked.total_kills)]);
  const deaths = sum([asNumber(ranked.total_deaths), asNumber(unranked.total_deaths)]);
  const assists = sum([asNumber(ranked.total_assists), asNumber(unranked.total_assists)]);
  const rank = asRecord(player.rank);
  const rankHistory = asArray(root.rank_history).map(asRecord);
  const latestRank = rankHistory.sort((left, right) => (asNumber(right.match_time_stamp) ?? 0) - (asNumber(left.match_time_stamp) ?? 0))[0];
  const heroes = [...asArray(root.heroes_ranked), ...asArray(root.heroes_unranked)]
    .map(asRecord)
    .map((hero): MarvelRivalsHeroStat | null => {
      const name = asString(hero.hero_name);
      if (!name) return null;
      return {
        name,
        matches: asNumber(hero.matches) ?? 0,
        wins: asNumber(hero.wins) ?? 0,
        kills: asNumber(hero.kills) ?? 0,
        deaths: asNumber(hero.deaths) ?? 0,
        assists: asNumber(hero.assists) ?? 0,
      };
    })
    .filter((hero): hero is MarvelRivalsHeroStat => Boolean(hero))
    .sort((left, right) => right.matches - left.matches)
    .slice(0, 3);
  const updates = asRecord(root.updates);

  return {
    uid,
    displayName,
    isPrivate: root.isPrivate === true || player.isPrivate === true,
    playerLevel: asNumber(player.level),
    rankName: asString(rank.rank) ?? asString(latestRank?.rank),
    peakRankName: asString(root.peak_rank) ?? null,
    rankScore: asNumber(latestRank?.points) ?? asNumber(latestRank?.score_progression && asRecord(latestRank.score_progression).total_score),
    totalMatches: asNumber(overall.total_matches),
    totalWins: asNumber(overall.total_wins),
    overallKd: ratio(kills, deaths),
    overallKda: ratio(kills + assists, deaths),
    topHeroes: heroes,
    providerUpdatedAt: asString(updates.info_update_time) ?? asString(updates.last_history_update),
  };
}

type RivalsFetch = (input: string, init: { headers: Record<string, string>; signal?: unknown }) => Promise<{ status: number; ok: boolean; json(): Promise<unknown> }>;

async function requestJson(path: string, apiKey: string): Promise<unknown> {
  let response: Awaited<ReturnType<RivalsFetch>>;
  try {
    const runtime = globalThis as unknown as { fetch: RivalsFetch; AbortSignal?: { timeout(milliseconds: number): unknown } };
    response = await runtime.fetch(`https://marvelrivalsapi.com${path}`, {
      headers: { Accept: "application/json", "x-api-key": apiKey },
      signal: runtime.AbortSignal?.timeout(8_000),
    });
  } catch {
    throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service did not respond. Try again shortly.");
  }
  if (response.status === 401 || response.status === 403) throw new MarvelRivalsApiError("UNAUTHORIZED", "The Rivals profile service is not configured correctly.");
  if (response.status === 404) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name or UID.");
  if (response.status === 429) throw new MarvelRivalsApiError("RATE_LIMITED", "The Rivals profile service is busy. Try again in a few minutes.");
  if (!response.ok) throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service is temporarily unavailable.");
  return response.json();
}

export async function fetchMarvelRivalsProfile(query: string, apiKey: string): Promise<MarvelRivalsProfileData> {
  const normalized = query.trim();
  if (!isValidMarvelRivalsQuery(normalized)) throw new MarvelRivalsApiError("NOT_FOUND", "Enter a valid Rivals name or UID.");
  if (!apiKey.trim()) throw new MarvelRivalsApiError("UNAUTHORIZED", "The Rivals profile service is not configured.");

  let uid = normalized;
  if (!/^\d+$/.test(normalized)) {
    const search = asRecord(await requestJson(`/api/v1/find-player/${encodeURIComponent(normalized)}`, apiKey));
    uid = asString(search.uid) ?? "";
    if (!uid) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name.");
  }
  const profile = parseMarvelRivalsProfile(await requestJson(`/api/v1/player/${encodeURIComponent(uid)}`, apiKey));
  if (profile.isPrivate) throw new MarvelRivalsApiError("PRIVATE", "That Rivals profile is private. Make it public, link it, then restore your preference.");
  return profile;
}
