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

export type MarvelRivalsMatchHeroPerformance = {
  providerHeroId: string;
  heroName: string;
  playtimeSeconds: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  damage: number | null;
  healing: number | null;
  damageTaken: number | null;
};

export type MarvelRivalsMatchData = {
  providerMatchId: string;
  occurredAt: string;
  durationSeconds: number | null;
  seasonKey: string | null;
  mapId: string | null;
  modeId: string | null;
  playModeId: string | null;
  participant: {
    providerPlayerUid: string;
    result: "WIN" | "LOSS" | "DRAW" | "UNKNOWN";
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    damage: number | null;
    healing: number | null;
    damageTaken: number | null;
    score: number | null;
    scoreChange: number | null;
    mvp: boolean;
    svp: boolean;
    disconnected: boolean | null;
    heroes: MarvelRivalsMatchHeroPerformance[];
  };
};

export type MarvelRivalsMatchHistoryPage = {
  matches: MarvelRivalsMatchData[];
  page: number;
  totalPages: number | null;
  hasMore: boolean;
};

export class MarvelRivalsApiError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "PRIVATE" | "RATE_LIMITED" | "UNAUTHORIZED" | "UNAVAILABLE" | "INVALID_RESPONSE", message: string, public readonly retryAfterSeconds: number | null = null) {
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
const asNonnegativeInteger = (value: unknown): number | null => {
  const parsed = asNumber(value);
  return parsed !== null && parsed >= 0 ? Math.trunc(parsed) : null;
};
const asBoolean = (value: unknown): boolean | null => typeof value === "boolean" ? value : null;
const epochTime = (value: unknown): string | null => {
  const seconds = asNonnegativeInteger(value);
  if (!seconds) return null;
  const result = new Date(seconds * 1_000);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
};
const isoTime = (value: unknown): string | null => {
  const candidate = asString(value);
  if (!candidate) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
const durationSeconds = (value: unknown): number | null => {
  const direct = asNonnegativeInteger(value);
  if (direct !== null) return direct;
  const record = asRecord(value);
  const raw = asNonnegativeInteger(record.raw);
  if (raw !== null) return raw;
  const formatted = asString(value) ?? asString(record.formatted);
  if (!formatted) return null;
  const clock = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(formatted);
  if (clock) return Number(clock[1] ?? 0) * 3_600 + Number(clock[2]) * 60 + Number(clock[3]);
  const minutes = /^(\d+)\s*minutes?$/i.exec(formatted);
  return minutes ? Number(minutes[1]) * 60 : null;
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

export function parseMarvelRivalsMatchHistory(payload: unknown, expectedPlayerUid: string): MarvelRivalsMatchHistoryPage {
  const root = asRecord(payload);
  if (!Array.isArray(root.match_history)) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned an invalid match-history response.");
  const matches = root.match_history.map((entry): MarvelRivalsMatchData => {
    const match = asRecord(entry);
    const participant = asRecord(match.match_player ?? match.player_performance);
    const providerMatchId = asString(match.match_uid) ?? asString(match.match_id);
    const providerPlayerUid = asString(participant.player_uid);
    const occurredAt = epochTime(match.match_time_stamp) ?? isoTime(match.date);
    if (!providerMatchId || !providerPlayerUid || !occurredAt || providerPlayerUid !== expectedPlayerUid) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals provider returned incomplete or mismatched match evidence.");
    const winValue = participant.is_win;
    const win = asBoolean(winValue) ?? asBoolean(asRecord(winValue).is_win);
    const result = asString(match.result)?.toUpperCase();
    const normalizedResult: MarvelRivalsMatchData["participant"]["result"] = result === "WIN" || win === true ? "WIN" : result === "LOSS" || win === false ? "LOSS" : result === "DRAW" ? "DRAW" : "UNKNOWN";
    const scoreInfo = asRecord(participant.score_info);
    const hero = asRecord(participant.player_hero);
    const providerHeroId = asString(hero.hero_id) ?? asString(participant.hero_id);
    const heroName = asString(hero.hero_name) ?? asString(participant.hero_name);
    const heroes: MarvelRivalsMatchHeroPerformance[] = providerHeroId && heroName ? [{
      providerHeroId,
      heroName,
      playtimeSeconds: durationSeconds(hero.play_time),
      kills: asNonnegativeInteger(hero.kills),
      deaths: asNonnegativeInteger(hero.deaths),
      assists: asNonnegativeInteger(hero.assists),
      damage: asNonnegativeInteger(hero.total_hero_damage),
      healing: asNonnegativeInteger(hero.total_hero_heal),
      damageTaken: asNonnegativeInteger(hero.total_damage_taken),
    }] : [];
    return {
      providerMatchId,
      occurredAt,
      durationSeconds: durationSeconds(match.match_play_duration ?? match.duration),
      seasonKey: asString(match.match_season) ?? asString(match.season),
      mapId: asString(match.match_map_id) ?? asString(match.map_id),
      modeId: asString(match.game_mode_id),
      playModeId: asString(match.play_mode_id),
      participant: {
        providerPlayerUid,
        result: normalizedResult,
        kills: asNonnegativeInteger(participant.kills),
        deaths: asNonnegativeInteger(participant.deaths),
        assists: asNonnegativeInteger(participant.assists),
        damage: asNonnegativeInteger(participant.total_hero_damage),
        healing: asNonnegativeInteger(participant.total_hero_heal),
        damageTaken: asNonnegativeInteger(participant.total_damage_taken),
        score: asNumber(scoreInfo.score) ?? asNumber(asRecord(winValue).score),
        scoreChange: asIntegerOrNull(scoreInfo.add_score ?? participant.score_change),
        mvp: asString(match.mvp_uid) === providerPlayerUid,
        svp: asString(match.svp_uid) === providerPlayerUid,
        disconnected: asBoolean(participant.disconnected),
        heroes,
      },
    };
  });
  const pagination = asRecord(root.pagination);
  const page = asNonnegativeInteger(pagination.page) ?? 1;
  const totalPages = asNonnegativeInteger(pagination.total_pages);
  const hasMore = asBoolean(pagination.has_more) ?? (totalPages !== null ? page < totalPages : false);
  return { matches, page, totalPages, hasMore };
}

function asIntegerOrNull(value: unknown): number | null {
  const parsed = asNumber(value);
  return parsed !== null && Number.isSafeInteger(parsed) ? parsed : null;
}

export type RivalsFetch = (input: string, init: { headers: Record<string, string>; signal?: unknown }) => Promise<{ status: number; ok: boolean; headers?: { get(name: string): string | null }; json(): Promise<unknown> }>;

async function requestJson(path: string, apiKey: string, fetcher?: RivalsFetch): Promise<unknown> {
  let response: Awaited<ReturnType<RivalsFetch>>;
  try {
    const runtime = globalThis as unknown as { fetch: RivalsFetch; AbortSignal?: { timeout(milliseconds: number): unknown } };
    response = await (fetcher ?? runtime.fetch)(`https://marvelrivalsapi.com${path}`, {
      headers: { Accept: "application/json", "x-api-key": apiKey },
      signal: runtime.AbortSignal?.timeout(8_000),
    });
  } catch {
    throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service did not respond. Try again shortly.");
  }
  if (response.status === 401 || response.status === 403) throw new MarvelRivalsApiError("UNAUTHORIZED", "The Rivals profile service is not configured correctly.");
  if (response.status === 404) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name or UID.");
  if (response.status === 429) {
    const retryAfter = Number(response.headers?.get("retry-after"));
    throw new MarvelRivalsApiError("RATE_LIMITED", "The Rivals profile service is busy. Try again in a few minutes.", Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.ceil(retryAfter) : null);
  }
  if (!response.ok) throw new MarvelRivalsApiError("UNAVAILABLE", "The Rivals profile service is temporarily unavailable.");
  return response.json();
}

export async function fetchMarvelRivalsProfile(query: string, apiKey: string, fetcher?: RivalsFetch): Promise<MarvelRivalsProfileData> {
  const normalized = query.trim();
  if (!isValidMarvelRivalsQuery(normalized)) throw new MarvelRivalsApiError("NOT_FOUND", "Enter a valid Rivals name or UID.");
  if (!apiKey.trim()) throw new MarvelRivalsApiError("UNAUTHORIZED", "The Rivals profile service is not configured.");

  let uid = normalized;
  if (!/^\d+$/.test(normalized)) {
    const search = asRecord(await requestJson(`/api/v1/find-player/${encodeURIComponent(normalized)}`, apiKey, fetcher));
    uid = asString(search.uid) ?? "";
    if (!uid) throw new MarvelRivalsApiError("NOT_FOUND", "No public Marvel Rivals profile matched that name.");
  }
  const profile = parseMarvelRivalsProfile(await requestJson(`/api/v1/player/${encodeURIComponent(uid)}`, apiKey, fetcher));
  if (profile.isPrivate) throw new MarvelRivalsApiError("PRIVATE", "That Rivals profile is private. Make it public, link it, then restore your preference.");
  return profile;
}

export async function fetchMarvelRivalsMatchHistory(uid: string, apiKey: string, page = 1, limit = 20, fetcher?: RivalsFetch): Promise<MarvelRivalsMatchHistoryPage> {
  if (!/^\d{2,32}$/.test(uid)) throw new MarvelRivalsApiError("NOT_FOUND", "The linked Rivals UID is invalid.");
  if (!apiKey.trim()) throw new MarvelRivalsApiError("UNAUTHORIZED", "The Rivals profile service is not configured.");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new MarvelRivalsApiError("INVALID_RESPONSE", "The Rivals match-history page request was invalid.");
  const payload = await requestJson(`/api/v2/player/${encodeURIComponent(uid)}/match-history?page=${page}&limit=${limit}`, apiKey, fetcher);
  return parseMarvelRivalsMatchHistory(payload, uid);
}
