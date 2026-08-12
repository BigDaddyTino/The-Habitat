import { MarvelRivalsApiError, isValidMarvelRivalsQuery, type MarvelRivalsHeroStat, type MarvelRivalsMatchData, type MarvelRivalsMatchHistoryPage, type MarvelRivalsProfileData } from "./marvel-rivals";

/**
 * Community fallback provider backed by rivalsmeta.com's public site API.
 * Used when the official marvelrivalsapi.com key cannot be provisioned. The
 * payloads mirror the game's own career data, so responses are normalized into
 * the exact same shapes the marvelrivalsapi.com provider produces.
 */

export const RIVALSMETA_SOURCE = "rivalsmeta.com";
const RIVALSMETA_BASE = "https://rivalsmeta.com/api";
const RIVALSMETA_PAGE_SIZE = 20;

/** Hero ids come from the game itself; rivalsmeta ships this mapping in its frontend bundle. */
const RIVALSMETA_HERO_NAMES: Record<string, string> = {
  "1011": "Hulk", "1014": "The Punisher", "1015": "Storm", "1016": "Loki", "1017": "Human Torch",
  "1018": "Doctor Strange", "1020": "Mantis", "1021": "Hawkeye", "1022": "Captain America",
  "1023": "Rocket Raccoon", "1024": "Hela", "1025": "Cloak & Dagger", "1026": "Black Panther",
  "1027": "Groot", "1028": "Ultron", "1029": "Magik", "1030": "Moon Knight", "1031": "Luna Snow",
  "1032": "Squirrel Girl", "1033": "Black Widow", "1034": "Iron Man", "1035": "Venom",
  "1036": "Spider-Man", "1037": "Magneto", "1038": "Scarlet Witch", "1039": "Thor",
  "1040": "Mister Fantastic", "1041": "Winter Soldier", "1042": "Peni Parker", "1043": "Star-Lord",
  "1044": "Blade", "1045": "Namor", "1046": "Adam Warlock", "1047": "Jeff The Land Shark",
  "1048": "Psylocke", "1049": "Wolverine", "1050": "Invisible Woman", "1051": "The Thing",
  "1052": "Iron Fist", "1053": "Emma Frost", "1054": "Phoenix", "1055": "Daredevil",
  "1056": "Angela", "1058": "Gambit", "1059": "Elsa Bloodstone", "1060": "White Fox",
  "1061": "Black Cat", "1062": "Devil Dinosaur", "1063": "Cyclops", "1064": "Jubilee",
  "1065": "Rogue", "1066": "The Hood", "10571": "Deadpool (Vanguard)", "10572": "Deadpool (Duelist)",
  "10573": "Deadpool (Strategist)",
};

export function rivalsmetaHeroName(heroId: string | number): string {
  return RIVALSMETA_HERO_NAMES[String(heroId)] ?? `Hero ${String(heroId)}`;
}

/** Competitive ladder levels, matching rivalsmeta's own display formula. */
export function rivalsmetaRankName(level: number | null): string | null {
  if (level === null || !Number.isFinite(level) || level < 1) return null;
  if (level >= 23) return "One Above All";
  if (level === 22) return "Eternity";
  const tier = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Grandmaster", "Celestial"][Math.floor((level - 1) / 3)];
  const division = ["III", "II", "I"][(level - 1) % 3];
  return `${tier} ${division}`;
}

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const asString = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : null;
const asNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const asRoundedInteger = (value: unknown): number | null => {
  const parsed = asNumber(value);
  return parsed !== null ? Math.round(parsed) : null;
};
const asNonnegativeRounded = (value: unknown): number | null => {
  const parsed = asRoundedInteger(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
};
const epochTime = (value: unknown): string | null => {
  const seconds = asNumber(value);
  if (!seconds || seconds <= 0) return null;
  const result = new Date(Math.trunc(seconds) * 1_000);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
};
const sum = (values: Array<number | null>) => values.reduce<number>((total, value) => total + (value ?? 0), 0);
const ratio = (numerator: number, denominator: number) => denominator > 0 ? Number((numerator / denominator).toFixed(2)) : numerator > 0 ? numerator : null;

type SeasonRank = { level: number | null; rankScore: number | null; maxLevel: number | null; updateTime: number };

function parseSeasonRanks(rankGameSeason: unknown): SeasonRank[] {
  return Object.values(asRecord(rankGameSeason)).map((entry): SeasonRank | null => {
    let parsed: unknown = entry;
    if (typeof entry === "string") {
      try { parsed = JSON.parse(entry); } catch { return null; }
    }
    const record = asRecord(parsed);
    const updateTime = asNumber(record.update_time);
    if (updateTime === null) return null;
    return { level: asNumber(record.level), rankScore: asNumber(record.rank_score), maxLevel: asNumber(record.max_level), updateTime };
  }).filter((entry): entry is SeasonRank => entry !== null);
}

/** rivalsmeta only includes career_settings when the player restricts visibility in-game. */
function isRivalsmetaProfilePrivate(root: JsonRecord): boolean {
  if (root.career_settings === null || root.career_settings === undefined) return false;
  const settings = asRecord(root.career_settings);
  return [settings.CareerOverviewIsVisibleToOther, settings.BattleHistoryIsVisibleToOther, settings.CareerHeroDataIsVisibleToOther]
    .some((flag) => asNumber(flag) === 0);
}

export function parseRivalsmetaProfile(payload: unknown): MarvelRivalsProfileData {
  const root = asRecord(payload);
  const player = asRecord(root.player);
  const info = asRecord(player.info);
  const uid = asString(info.aid) ?? asString(player._id);
  const displayName = asString(info.name);
  if (!uid || !displayName) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned an incomplete player profile.");

  const stats = asRecord(root.stats);
  const ranked = asRecord(stats.ranked);
  const unranked = asRecord(stats.unranked);
  const kills = sum([asNumber(ranked.total_kills), asNumber(unranked.total_kills)]);
  const deaths = sum([asNumber(ranked.total_deaths), asNumber(unranked.total_deaths)]);
  const assists = sum([asNumber(ranked.total_assists), asNumber(unranked.total_assists)]);

  const seasons = parseSeasonRanks(info.rank_game_season);
  const current = [...seasons].sort((left, right) => right.updateTime - left.updateTime)[0];
  const peakLevel = seasons.reduce<number | null>((peak, season) => {
    const candidate = season.maxLevel ?? season.level;
    return candidate !== null && (peak === null || candidate > peak) ? candidate : peak;
  }, null);

  const heroTotals = new Map<string, MarvelRivalsHeroStat>();
  for (const group of [root.heroes_ranked, root.heroes_unranked]) {
    for (const [heroId, value] of Object.entries(asRecord(group))) {
      const row = asRecord(value);
      const existing = heroTotals.get(heroId) ?? { name: rivalsmetaHeroName(heroId), matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      existing.matches += asNumber(row.matches) ?? 0;
      existing.wins += asNumber(row.win) ?? 0;
      existing.kills += asNumber(row.kills) ?? 0;
      existing.deaths += asNumber(row.deaths) ?? 0;
      existing.assists += asNumber(row.assists) ?? 0;
      heroTotals.set(heroId, existing);
    }
  }

  return {
    uid,
    displayName,
    isPrivate: isRivalsmetaProfilePrivate(root),
    playerLevel: asNumber(info.level),
    rankName: rivalsmetaRankName(current?.level ?? null),
    peakRankName: rivalsmetaRankName(peakLevel),
    rankScore: current ? asRoundedInteger(current.rankScore) : null,
    totalMatches: asNumber(stats.total_matches),
    totalWins: asNumber(stats.total_wins),
    overallKd: ratio(kills, deaths),
    overallKda: ratio(kills + assists, deaths),
    topHeroes: [...heroTotals.values()].sort((left, right) => right.matches - left.matches).slice(0, 3),
    providerUpdatedAt: epochTime(player.last_history_update) ?? epochTime(player.info_update_time),
  };
}

export function parseRivalsmetaMatchHistory(payload: unknown, expectedPlayerUid: string, page = 1): MarvelRivalsMatchHistoryPage {
  if (!Array.isArray(payload)) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned an invalid match-history response.");
  const matches = payload.map((entry): MarvelRivalsMatchData => {
    const match = asRecord(entry);
    const participant = asRecord(match.match_player);
    const providerMatchId = asString(match.match_uid);
    const providerPlayerUid = asString(participant.player_uid);
    const occurredAt = epochTime(match.match_time_stamp);
    if (!providerMatchId || !providerPlayerUid || !occurredAt || providerPlayerUid !== expectedPlayerUid) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned incomplete or mismatched match evidence.");
    const dynamicFields = asRecord(participant.dynamic_fields);
    const hero = asRecord(participant.player_hero);
    const providerHeroId = asString(hero.hero_id);
    const isWin = asNumber(participant.is_win);
    const heroes = providerHeroId ? [{
      providerHeroId,
      heroName: rivalsmetaHeroName(providerHeroId),
      playtimeSeconds: asNonnegativeRounded(hero.play_time),
      kills: asNonnegativeRounded(hero.k),
      deaths: asNonnegativeRounded(hero.d),
      assists: asNonnegativeRounded(hero.a),
      damage: asNonnegativeRounded(hero.total_hero_damage),
      healing: asNonnegativeRounded(hero.total_hero_heal),
      damageTaken: asNonnegativeRounded(hero.total_damage_taken),
    }] : [];
    return {
      providerMatchId,
      occurredAt,
      durationSeconds: asNonnegativeRounded(match.match_play_duration),
      seasonKey: asString(match.match_season),
      mapId: asString(match.match_map_id),
      modeId: asString(match.game_mode_id),
      playModeId: asString(match.play_mode_id),
      participant: {
        providerPlayerUid,
        result: isWin === 1 ? "WIN" : isWin === 0 ? "LOSS" : "UNKNOWN",
        kills: asNonnegativeRounded(participant.k),
        deaths: asNonnegativeRounded(participant.d),
        assists: asNonnegativeRounded(participant.a),
        damage: asNonnegativeRounded(hero.total_hero_damage),
        healing: asNonnegativeRounded(hero.total_hero_heal),
        damageTaken: asNonnegativeRounded(hero.total_damage_taken),
        score: asRoundedInteger(dynamicFields.new_score),
        scoreChange: asRoundedInteger(dynamicFields.add_score),
        mvp: asString(match.mvp_uid) === providerPlayerUid,
        svp: asString(match.svp_uid) === providerPlayerUid,
        disconnected: typeof participant.has_escaped === "boolean" ? participant.has_escaped : null,
        heroes,
      },
    };
  });
  return { matches, page, totalPages: null, hasMore: matches.length >= RIVALSMETA_PAGE_SIZE };
}

export type RivalsmetaFetch = (input: string, init: { method?: string; headers: Record<string, string>; body?: string; signal?: unknown }) => Promise<{ status: number; ok: boolean; headers?: { get(name: string): string | null }; json(): Promise<unknown> }>;

async function requestRivalsmetaJson(path: string, fetcher?: RivalsmetaFetch, body?: unknown): Promise<unknown> {
  let response: Awaited<ReturnType<RivalsmetaFetch>>;
  try {
    const runtime = globalThis as unknown as { fetch: RivalsmetaFetch; AbortSignal?: { timeout(milliseconds: number): unknown } };
    response = await (fetcher ?? runtime.fetch)(`${RIVALSMETA_BASE}${path}`, {
      ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      signal: runtime.AbortSignal?.timeout(10_000),
    });
  } catch {
    throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service did not respond. Try again shortly.");
  }
  if (response.status === 404) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name or UID.");
  if (response.status === 429) {
    const retryAfter = Number(response.headers?.get("retry-after"));
    throw new MarvelRivalsApiError("RATE_LIMITED", "The Rivals profile service is busy. Try again in a few minutes.", Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.ceil(retryAfter) : null);
  }
  if (!response.ok) throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service is temporarily unavailable.");
  return response.json();
}

export async function findRivalsmetaPlayerUid(name: string, fetcher?: RivalsmetaFetch): Promise<string> {
  const results = await requestRivalsmetaJson("/find-player", fetcher, { name });
  const candidates = (Array.isArray(results) ? results : []).map(asRecord)
    .map((candidate) => ({ aid: asString(candidate.aid), name: asString(candidate.name) }))
    .filter((candidate): candidate is { aid: string; name: string } => Boolean(candidate.aid && candidate.name));
  const exact = candidates.find((candidate) => candidate.name.toLowerCase() === name.trim().toLowerCase());
  const chosen = exact ?? candidates[0];
  if (!chosen) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name.");
  return chosen.aid;
}

export async function fetchRivalsmetaProfile(query: string, fetcher?: RivalsmetaFetch): Promise<MarvelRivalsProfileData> {
  const normalized = query.trim();
  if (!isValidMarvelRivalsQuery(normalized)) throw new MarvelRivalsApiError("NOT_FOUND", "Enter a valid Rivals name or UID.");
  const uid = /^\d+$/.test(normalized) ? normalized : await findRivalsmetaPlayerUid(normalized, fetcher);
  const profile = parseRivalsmetaProfile(await requestRivalsmetaJson(`/player/${encodeURIComponent(uid)}`, fetcher));
  if (profile.isPrivate) throw new MarvelRivalsApiError("PRIVATE", "That Rivals profile is private. Make it public, link it, then restore your preference.");
  return profile;
}

export async function fetchRivalsmetaMatchHistory(uid: string, page = 1, fetcher?: RivalsmetaFetch): Promise<MarvelRivalsMatchHistoryPage> {
  if (!/^\d{2,32}$/.test(uid)) throw new MarvelRivalsApiError("NOT_FOUND", "The linked Rivals UID is invalid.");
  if (!Number.isSafeInteger(page) || page < 1) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals match-history page request was invalid.");
  const skip = (page - 1) * RIVALSMETA_PAGE_SIZE;
  const payload = await requestRivalsmetaJson(`/player-match-history/${encodeURIComponent(uid)}?skip=${skip}&game_mode_id=0&hero_id=0`, fetcher);
  return parseRivalsmetaMatchHistory(payload, uid, page);
}

/**
 * Asks rivalsmeta to re-pull the player's data from the game backend (the same
 * request its own "Update" button issues). Fresh data lands asynchronously on
 * their side, so callers should simply pick it up on the next scheduled pass.
 * Best-effort: failures are swallowed because cached data remains usable.
 */
export async function requestRivalsmetaProfileUpdate(uid: string, fetcher?: RivalsmetaFetch): Promise<boolean> {
  if (!/^\d{2,32}$/.test(uid)) return false;
  try {
    const result = asRecord(await requestRivalsmetaJson(`/update-player/${encodeURIComponent(uid)}`, fetcher));
    return asString(result.status) === "success";
  } catch {
    return false;
  }
}
