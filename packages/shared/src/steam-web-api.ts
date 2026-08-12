export type SteamPlayerSummary = {
  steamId: string;
  personaName: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  avatarMediumUrl: string | null;
  avatarFullUrl: string | null;
  communityVisibilityState: number | null;
  profileState: number | null;
  steamCreatedAt: string | null;
  lastLogoffAt: string | null;
  currentGameAppId: number | null;
  currentGameName: string | null;
};

export type SteamOwnedGame = {
  appId: number;
  name: string;
  iconHash: string | null;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number | null;
  lastPlayedAt: string | null;
};

export function steamAchievementPriority(game: SteamOwnedGame) {
  const recentBonus = (game.playtimeTwoWeeksMinutes ?? 0) > 0 ? 2_000_000 : 0;
  const lastPlayedDay = game.lastPlayedAt ? Math.max(0, Math.floor(new Date(game.lastPlayedAt).getTime() / 86_400_000)) : 0;
  return recentBonus + Math.min(game.playtimeMinutes, 1_000_000) + lastPlayedDay;
}

export type SteamOwnedGamesResult = {
  games: SteamOwnedGame[];
  reportedGameCount: number | null;
  visibility: "VISIBLE" | "EMPTY_OR_PRIVATE";
};

export type SteamAchievementDefinitionData = {
  apiName: string;
  displayName: string;
  description: string | null;
  hidden: boolean;
  iconUrl: string | null;
  iconGrayUrl: string | null;
};

export type SteamAchievementSchemaResult = {
  status: "READY" | "UNSUPPORTED";
  definitions: SteamAchievementDefinitionData[];
};

export type SteamUserAchievementData = {
  apiName: string;
  achieved: boolean;
  unlockedAt: string | null;
};

export type SteamPlayerAchievementsResult = {
  status: "READY" | "PRIVATE" | "UNSUPPORTED" | "ACCESS_RESTRICTED";
  achievements: SteamUserAchievementData[];
};

export class SteamWebApiError extends Error {
  constructor(
    public readonly code: "PRIVATE" | "UNSUPPORTED" | "RATE_LIMITED" | "UNAUTHORIZED" | "UNAVAILABLE" | "INVALID_RESPONSE",
    message: string,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "SteamWebApiError";
  }
}

type JsonRecord = Record<string, unknown>;
type SteamFetchResponse = {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
};
export type SteamFetch = (input: string, init: { headers: Record<string, string>; signal?: unknown }) => Promise<SteamFetchResponse>;

const asRecord = (value: unknown): JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const asString = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const asInteger = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isSafeInteger(parsed) ? parsed : null;
};
const asNonnegativeInteger = (value: unknown): number | null => {
  const parsed = asInteger(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
};
const unixTime = (value: unknown): string | null => {
  const seconds = asNonnegativeInteger(value);
  if (!seconds) return null;
  const date = new Date(seconds * 1_000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const optionalUrl = (value: unknown): string | null => {
  const candidate = asString(value);
  return candidate && candidate.startsWith("https://") && !/[\r\n]/.test(candidate) ? candidate : null;
};

export function parseSteamPlayerSummaries(payload: unknown): SteamPlayerSummary[] {
  const response = asRecord(asRecord(payload).response);
  if (!Array.isArray(response.players)) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an invalid player-summary response.");
  return response.players.map((entry) => {
    const player = asRecord(entry);
    const steamId = asString(player.steamid);
    const personaName = asString(player.personaname);
    if (!steamId || !/^7656119\d{10}$/.test(steamId) || !personaName) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an incomplete player summary.");
    return {
      steamId,
      personaName: personaName.slice(0, 80),
      profileUrl: optionalUrl(player.profileurl),
      avatarUrl: optionalUrl(player.avatar),
      avatarMediumUrl: optionalUrl(player.avatarmedium),
      avatarFullUrl: optionalUrl(player.avatarfull),
      communityVisibilityState: asNonnegativeInteger(player.communityvisibilitystate),
      profileState: asNonnegativeInteger(player.profilestate),
      steamCreatedAt: unixTime(player.timecreated),
      lastLogoffAt: unixTime(player.lastlogoff),
      currentGameAppId: asNonnegativeInteger(player.gameid),
      currentGameName: asString(player.gameextrainfo)?.slice(0, 160) ?? null,
    };
  });
}

export function parseSteamOwnedGames(payload: unknown): SteamOwnedGamesResult {
  const response = asRecord(asRecord(payload).response);
  const reportedGameCount = asNonnegativeInteger(response.game_count);
  if (response.games === undefined || response.games === null) return { games: [], reportedGameCount, visibility: "EMPTY_OR_PRIVATE" };
  if (!Array.isArray(response.games)) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an invalid game-library response.");
  const games = response.games.map((entry) => {
    const game = asRecord(entry);
    const appId = asNonnegativeInteger(game.appid);
    const name = asString(game.name);
    const playtimeMinutes = asNonnegativeInteger(game.playtime_forever);
    if (!appId || !name || playtimeMinutes === null) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an incomplete game-library entry.");
    return {
      appId,
      name: name.slice(0, 200),
      iconHash: asString(game.img_icon_url)?.slice(0, 100) ?? null,
      playtimeMinutes,
      playtimeTwoWeeksMinutes: asNonnegativeInteger(game.playtime_2weeks),
      lastPlayedAt: unixTime(game.rtime_last_played),
    };
  });
  return { games, reportedGameCount, visibility: games.length > 0 ? "VISIBLE" : "EMPTY_OR_PRIVATE" };
}

export function parseSteamAchievementSchema(payload: unknown): SteamAchievementSchemaResult {
  const game = asRecord(asRecord(payload).game);
  if (Object.keys(game).length === 0) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an invalid achievement schema.");
  const availableStats = asRecord(game.availableGameStats);
  if (availableStats.achievements === undefined || availableStats.achievements === null) return { status: "UNSUPPORTED", definitions: [] };
  if (!Array.isArray(availableStats.achievements)) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an invalid achievement definition list.");
  const definitions = availableStats.achievements.map((entry): SteamAchievementDefinitionData => {
    const definition = asRecord(entry);
    const apiName = asString(definition.name);
    const displayName = asString(definition.displayName);
    if (!apiName || !displayName) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an incomplete achievement definition.");
    return {
      apiName: apiName.slice(0, 200),
      displayName: displayName.slice(0, 200),
      description: asString(definition.description)?.slice(0, 500) ?? null,
      hidden: asNonnegativeInteger(definition.hidden) === 1,
      iconUrl: optionalUrl(definition.icon),
      iconGrayUrl: optionalUrl(definition.icongray),
    };
  });
  return { status: definitions.length ? "READY" : "UNSUPPORTED", definitions };
}

export function parseSteamPlayerAchievements(payload: unknown): SteamPlayerAchievementsResult {
  const playerStats = asRecord(asRecord(payload).playerstats);
  const success = playerStats.success;
  if (success === false) {
    const error = asString(playerStats.error)?.toLowerCase() ?? "";
    if (error.includes("no stats") || error.includes("not found")) return { status: "UNSUPPORTED", achievements: [] };
    return { status: "PRIVATE", achievements: [] };
  }
  if (playerStats.achievements === undefined || playerStats.achievements === null) return { status: "UNSUPPORTED", achievements: [] };
  if (!Array.isArray(playerStats.achievements)) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an invalid player-achievement list.");
  const achievements = playerStats.achievements.map((entry): SteamUserAchievementData => {
    const achievement = asRecord(entry);
    const apiName = asString(achievement.apiname);
    const achievedNumber = asNonnegativeInteger(achievement.achieved);
    if (!apiName || (achievedNumber !== 0 && achievedNumber !== 1)) throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned an incomplete player achievement.");
    return { apiName: apiName.slice(0, 200), achieved: achievedNumber === 1, unlockedAt: achievedNumber === 1 ? unixTime(achievement.unlocktime) : null };
  });
  return { status: "READY", achievements };
}

function retryAfter(response: SteamFetchResponse): number | null {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}

async function requestSteamJson(interfaceName: string, method: string, version: number, parameters: Record<string, string>, apiKey: string, fetcher?: SteamFetch): Promise<unknown> {
  if (!apiKey.trim()) throw new SteamWebApiError("UNAUTHORIZED", "Steam enrichment is not configured.");
  const query = Object.entries({ key: apiKey.trim(), ...parameters }).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  const url = `https://api.steampowered.com/${interfaceName}/${method}/v${version}/?${query}`;
  const runtime = globalThis as unknown as { fetch: SteamFetch; AbortSignal?: { timeout(milliseconds: number): unknown } };
  let response: SteamFetchResponse;
  try {
    response = await (fetcher ?? runtime.fetch)(url, {
      headers: { Accept: "application/json" },
      signal: runtime.AbortSignal?.timeout(8_000),
    });
  } catch {
    throw new SteamWebApiError("UNAVAILABLE", "Steam did not respond before the request timed out.");
  }
  if (response.status === 401 || response.status === 403) throw new SteamWebApiError("UNAUTHORIZED", "Steam enrichment credentials were rejected.");
  if (response.status === 429) throw new SteamWebApiError("RATE_LIMITED", "Steam temporarily rate-limited enrichment requests.", retryAfter(response));
  if (!response.ok) throw new SteamWebApiError("UNAVAILABLE", "Steam enrichment is temporarily unavailable.");
  try {
    return await response.json();
  } catch {
    throw new SteamWebApiError("INVALID_RESPONSE", "Steam returned a response that was not valid JSON.");
  }
}

export async function fetchSteamPlayerSummaries(steamIds: string[], apiKey: string, fetcher?: SteamFetch): Promise<SteamPlayerSummary[]> {
  const unique = [...new Set(steamIds)];
  if (unique.length < 1 || unique.length > 100 || unique.some((steamId) => !/^7656119\d{10}$/.test(steamId))) throw new SteamWebApiError("INVALID_RESPONSE", "Steam player-summary IDs were invalid.");
  return parseSteamPlayerSummaries(await requestSteamJson("ISteamUser", "GetPlayerSummaries", 2, { steamids: unique.join(",") }, apiKey, fetcher));
}

export async function fetchSteamOwnedGames(steamId: string, apiKey: string, fetcher?: SteamFetch): Promise<SteamOwnedGamesResult> {
  if (!/^7656119\d{10}$/.test(steamId)) throw new SteamWebApiError("INVALID_RESPONSE", "The verified Steam ID was invalid.");
  return parseSteamOwnedGames(await requestSteamJson("IPlayerService", "GetOwnedGames", 1, {
    steamid: steamId,
    include_appinfo: "true",
    include_played_free_games: "true",
    format: "json",
  }, apiKey, fetcher));
}

export async function fetchSteamAchievementSchema(appId: number, apiKey: string, fetcher?: SteamFetch): Promise<SteamAchievementSchemaResult> {
  if (!Number.isSafeInteger(appId) || appId < 1) throw new SteamWebApiError("INVALID_RESPONSE", "The Steam app ID was invalid.");
  return parseSteamAchievementSchema(await requestSteamJson("ISteamUserStats", "GetSchemaForGame", 2, { appid: String(appId), l: "english", format: "json" }, apiKey, fetcher));
}

export async function fetchSteamPlayerAchievements(steamId: string, appId: number, apiKey: string, fetcher?: SteamFetch): Promise<SteamPlayerAchievementsResult> {
  if (!/^7656119\d{10}$/.test(steamId) || !Number.isSafeInteger(appId) || appId < 1) throw new SteamWebApiError("INVALID_RESPONSE", "The Steam player-achievement request was invalid.");
  try {
    return parseSteamPlayerAchievements(await requestSteamJson("ISteamUserStats", "GetPlayerAchievements", 1, { steamid: steamId, appid: String(appId), l: "english", format: "json" }, apiKey, fetcher));
  } catch (error) {
    // A key that already succeeded for the verified profile/library can still be
    // denied by this separately scoped endpoint. Treat that as retained-data
    // access restriction, not as a bad key or an endlessly retryable app error.
    if (error instanceof SteamWebApiError && error.code === "UNAUTHORIZED") return { status: "ACCESS_RESTRICTED", achievements: [] };
    throw error;
  }
}
