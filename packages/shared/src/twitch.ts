/**
 * Twitch Helix client for the Habitat streaming showcase.
 *
 * Live state is read from Helix and nothing else: `/helix/streams` returns a row
 * only while a channel is actually broadcasting, so absence from the response is
 * the authoritative signal that a channel is offline. Every network entry point
 * takes an injectable fetcher so the parsers are testable without a live API.
 */

export const TWITCH_ID_BASE = "https://id.twitch.tv";
export const TWITCH_HELIX_BASE = "https://api.twitch.tv/helix";
/** Helix accepts up to 100 ids per streams/users query. */
export const TWITCH_QUERY_BATCH_SIZE = 100;

export type TwitchErrorCode = "UNAUTHORIZED" | "RATE_LIMITED" | "NOT_FOUND" | "UNAVAILABLE" | "INVALID_RESPONSE";

export class TwitchApiError extends Error {
  constructor(readonly code: TwitchErrorCode, message: string, readonly retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "TwitchApiError";
  }
}

export type TwitchUserData = {
  twitchUserId: string;
  login: string;
  displayName: string;
  profileImageUrl: string | null;
  offlineImageUrl: string | null;
  /** "", "affiliate", or "partner" as reported by Twitch. */
  broadcasterType: string | null;
  description: string | null;
};

export type TwitchLiveStreamData = {
  providerStreamId: string;
  twitchUserId: string;
  login: string;
  displayName: string;
  title: string | null;
  gameName: string | null;
  viewerCount: number | null;
  startedAt: string;
  /** Templated URL containing {width} and {height} placeholders. */
  thumbnailUrlTemplate: string | null;
  language: string | null;
  isMature: boolean;
};

export type TwitchAppToken = { accessToken: string; expiresAt: number };

export type TwitchFetch = (input: string, init: {
  method?: string;
  headers: Record<string, string>;
  body?: string;
  signal?: unknown;
}) => Promise<{ status: number; ok: boolean; headers?: { get(name: string): string | null }; json(): Promise<unknown> }>;

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const asTrimmedString = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const asNonnegativeInteger = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
};
const asIsoTime = (value: unknown): string | null => {
  const text = asTrimmedString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/**
 * This package stays free of DOM and Node globals, so URLs are assembled by hand
 * rather than through URL/URLSearchParams.
 */
function encodeFields(fields: Array<readonly [string, string]>): string {
  return fields.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

/** Twitch logins are 4-25 characters of ASCII word characters. */
export function isValidTwitchLogin(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_]{4,25}$/.test(value.trim());
}

export function isValidTwitchUserId(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,20}$/.test(value.trim());
}

/**
 * Fills Twitch's templated thumbnail URL. Twitch returns a literal
 * "{width}x{height}" placeholder that renders as a broken image if passed
 * through untouched.
 */
export function twitchThumbnailUrl(template: string | null, width: number, height: number): string | null {
  if (!template || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return null;
  if (!template.startsWith("https://")) return null;
  return template.replaceAll("{width}", String(width)).replaceAll("%{width}%", String(width)).replaceAll("{height}", String(height)).replaceAll("%{height}%", String(height));
}

/**
 * Builds the Twitch player embed URL. Twitch requires every embedding hostname
 * in `parent`, and rejects the frame outright when it is missing or wrong.
 */
export function twitchEmbedUrl(login: string, parentHosts: string[], options: { autoplay?: boolean; muted?: boolean } = {}): string | null {
  if (!isValidTwitchLogin(login)) return null;
  const hosts = [...new Set(parentHosts.map((host) => host.trim().toLowerCase()).filter((host) => /^[a-z0-9.-]{1,253}$/.test(host)))];
  if (hosts.length === 0) return null;
  const fields: Array<readonly [string, string]> = [
    ["channel", login.trim().toLowerCase()],
    ["autoplay", options.autoplay ? "true" : "false"],
    ["muted", options.muted === false ? "false" : "true"],
    ...hosts.map((host) => ["parent", host] as const),
  ];
  return `https://player.twitch.tv/?${encodeFields(fields)}`;
}

export function twitchChannelUrl(login: string): string | null {
  return isValidTwitchLogin(login) ? `https://www.twitch.tv/${login.trim().toLowerCase()}` : null;
}

function throwForStatus(status: number, retryAfterHeader: string | null): never {
  if (status === 401 || status === 403) throw new TwitchApiError("UNAUTHORIZED", "Twitch rejected the Habitat credentials.");
  if (status === 404) throw new TwitchApiError("NOT_FOUND", "Twitch has no such channel.");
  if (status === 429) {
    const retryAfter = Number(retryAfterHeader);
    throw new TwitchApiError("RATE_LIMITED", "Twitch is rate limiting Habitat. Try again shortly.", Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.ceil(retryAfter) : null);
  }
  throw new TwitchApiError("UNAVAILABLE", "Twitch is temporarily unavailable.");
}

async function requestJson(url: string, init: { method?: string; headers: Record<string, string>; body?: string }, fetcher?: TwitchFetch): Promise<unknown> {
  let response: Awaited<ReturnType<TwitchFetch>>;
  try {
    const runtime = globalThis as unknown as { fetch: TwitchFetch; AbortSignal?: { timeout(milliseconds: number): unknown } };
    response = await (fetcher ?? runtime.fetch)(url, { ...init, signal: runtime.AbortSignal?.timeout(10_000) });
  } catch {
    throw new TwitchApiError("UNAVAILABLE", "Twitch did not respond.");
  }
  if (!response.ok) throwForStatus(response.status, response.headers?.get("ratelimit-reset") ?? response.headers?.get("retry-after") ?? null);
  return response.json();
}

/**
 * Client-credentials grant. The resulting app access token identifies Habitat,
 * not a member, which is all that public live-status reads require.
 */
export async function fetchTwitchAppToken(clientId: string, clientSecret: string, fetcher?: TwitchFetch, now = Date.now()): Promise<TwitchAppToken> {
  if (!clientId.trim() || !clientSecret.trim()) throw new TwitchApiError("UNAUTHORIZED", "Twitch credentials are not configured.");
  const payload = asRecord(await requestJson(`${TWITCH_ID_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: encodeFields([["client_id", clientId.trim()], ["client_secret", clientSecret.trim()], ["grant_type", "client_credentials"]]),
  }, fetcher));
  const accessToken = asTrimmedString(payload.access_token);
  const expiresInSeconds = asNonnegativeInteger(payload.expires_in);
  if (!accessToken) throw new TwitchApiError("INVALID_RESPONSE", "Twitch returned no app access token.");
  // Expire a minute early so an in-flight batch never uses a token that dies
  // mid-request.
  const lifetimeMs = Math.max(0, ((expiresInSeconds ?? 3_600) - 60)) * 1_000;
  return { accessToken, expiresAt: now + lifetimeMs };
}

/**
 * Exchanges an OAuth authorization code for a user token. Used once during
 * channel verification to prove the member controls the Twitch account.
 */
export async function exchangeTwitchAuthorizationCode(input: { clientId: string; clientSecret: string; code: string; redirectUri: string }, fetcher?: TwitchFetch): Promise<string> {
  const payload = asRecord(await requestJson(`${TWITCH_ID_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: encodeFields([
      ["client_id", input.clientId.trim()],
      ["client_secret", input.clientSecret.trim()],
      ["code", input.code],
      ["grant_type", "authorization_code"],
      ["redirect_uri", input.redirectUri],
    ]),
  }, fetcher));
  const accessToken = asTrimmedString(payload.access_token);
  if (!accessToken) throw new TwitchApiError("INVALID_RESPONSE", "Twitch returned no user access token.");
  return accessToken;
}

/** Revokes a user token immediately after verification; best effort by design. */
export async function revokeTwitchToken(clientId: string, token: string, fetcher?: TwitchFetch): Promise<boolean> {
  try {
    await requestJson(`${TWITCH_ID_BASE}/oauth2/revoke`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: encodeFields([["client_id", clientId.trim()], ["token", token]]),
    }, fetcher);
    return true;
  } catch {
    return false;
  }
}

export function parseTwitchUsers(payload: unknown): TwitchUserData[] {
  const data = asRecord(payload).data;
  if (!Array.isArray(data)) throw new TwitchApiError("INVALID_RESPONSE", "Twitch returned an invalid user response.");
  return data.flatMap((entry): TwitchUserData[] => {
    const user = asRecord(entry);
    const twitchUserId = asTrimmedString(user.id);
    const login = asTrimmedString(user.login);
    if (!isValidTwitchUserId(twitchUserId) || !isValidTwitchLogin(login)) return [];
    const broadcasterType = typeof user.broadcaster_type === "string" ? user.broadcaster_type.trim() : null;
    return [{
      twitchUserId,
      login: login.toLowerCase(),
      displayName: asTrimmedString(user.display_name)?.slice(0, 80) ?? login,
      profileImageUrl: asTrimmedString(user.profile_image_url),
      offlineImageUrl: asTrimmedString(user.offline_image_url),
      broadcasterType: broadcasterType === "affiliate" || broadcasterType === "partner" ? broadcasterType : null,
      description: asTrimmedString(user.description)?.slice(0, 500) ?? null,
    }];
  });
}

/**
 * Parses live rows. Twitch also reports scheduled reruns and premieres via
 * `type`; only "live" counts as a member actually broadcasting.
 */
export function parseTwitchLiveStreams(payload: unknown): TwitchLiveStreamData[] {
  const data = asRecord(payload).data;
  if (!Array.isArray(data)) throw new TwitchApiError("INVALID_RESPONSE", "Twitch returned an invalid stream response.");
  return data.flatMap((entry): TwitchLiveStreamData[] => {
    const stream = asRecord(entry);
    if (asTrimmedString(stream.type) !== "live") return [];
    const providerStreamId = asTrimmedString(stream.id);
    const twitchUserId = asTrimmedString(stream.user_id);
    const login = asTrimmedString(stream.user_login);
    const startedAt = asIsoTime(stream.started_at);
    if (!providerStreamId || !isValidTwitchUserId(twitchUserId) || !isValidTwitchLogin(login) || !startedAt) return [];
    return [{
      providerStreamId: providerStreamId.slice(0, 40),
      twitchUserId,
      login: login.toLowerCase(),
      displayName: asTrimmedString(stream.user_name)?.slice(0, 80) ?? login,
      title: asTrimmedString(stream.title)?.slice(0, 200) ?? null,
      gameName: asTrimmedString(stream.game_name)?.slice(0, 120) ?? null,
      viewerCount: asNonnegativeInteger(stream.viewer_count),
      startedAt,
      thumbnailUrlTemplate: asTrimmedString(stream.thumbnail_url),
      language: asTrimmedString(stream.language)?.slice(0, 16) ?? null,
      isMature: stream.is_mature === true,
    }];
  });
}

export function parseTwitchFollowerCount(payload: unknown): number | null {
  return asNonnegativeInteger(asRecord(payload).total);
}

function helixHeaders(clientId: string, accessToken: string) {
  return { "client-id": clientId.trim(), authorization: `Bearer ${accessToken}`, accept: "application/json" };
}

function chunk<T>(values: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += size) batches.push(values.slice(index, index + size));
  return batches;
}

/** Resolves the token's own user, which is how OAuth verification identifies the member. */
export async function fetchTwitchAuthenticatedUser(clientId: string, userAccessToken: string, fetcher?: TwitchFetch): Promise<TwitchUserData> {
  const users = parseTwitchUsers(await requestJson(`${TWITCH_HELIX_BASE}/users`, { headers: helixHeaders(clientId, userAccessToken) }, fetcher));
  const user = users[0];
  if (!user) throw new TwitchApiError("INVALID_RESPONSE", "Twitch did not identify the authorizing account.");
  return user;
}

export async function fetchTwitchUsersById(clientId: string, appAccessToken: string, twitchUserIds: string[], fetcher?: TwitchFetch): Promise<TwitchUserData[]> {
  const ids = [...new Set(twitchUserIds.filter(isValidTwitchUserId))];
  if (ids.length === 0) return [];
  const results: TwitchUserData[] = [];
  for (const batch of chunk(ids, TWITCH_QUERY_BATCH_SIZE)) {
    const query = encodeFields(batch.map((id) => ["id", id] as const));
    results.push(...parseTwitchUsers(await requestJson(`${TWITCH_HELIX_BASE}/users?${query}`, { headers: helixHeaders(clientId, appAccessToken) }, fetcher)));
  }
  return results;
}

/**
 * Returns only the channels Twitch reports as live. Callers must treat any
 * requested id missing from the result as offline rather than unknown.
 */
export async function fetchTwitchLiveStreams(clientId: string, appAccessToken: string, twitchUserIds: string[], fetcher?: TwitchFetch): Promise<TwitchLiveStreamData[]> {
  const ids = [...new Set(twitchUserIds.filter(isValidTwitchUserId))];
  if (ids.length === 0) return [];
  const results: TwitchLiveStreamData[] = [];
  for (const batch of chunk(ids, TWITCH_QUERY_BATCH_SIZE)) {
    const query = encodeFields([
      ["first", String(Math.min(batch.length, TWITCH_QUERY_BATCH_SIZE))],
      ...batch.map((id) => ["user_id", id] as const),
    ]);
    results.push(...parseTwitchLiveStreams(await requestJson(`${TWITCH_HELIX_BASE}/streams?${query}`, { headers: helixHeaders(clientId, appAccessToken) }, fetcher)));
  }
  return results;
}

export async function fetchTwitchFollowerCount(clientId: string, appAccessToken: string, twitchUserId: string, fetcher?: TwitchFetch): Promise<number | null> {
  if (!isValidTwitchUserId(twitchUserId)) return null;
  try {
    return parseTwitchFollowerCount(await requestJson(`${TWITCH_HELIX_BASE}/channels/followers?broadcaster_id=${encodeURIComponent(twitchUserId)}&first=1`, { headers: helixHeaders(clientId, appAccessToken) }, fetcher));
  } catch {
    // Follower totals are decoration; losing them must never fail a live sync.
    return null;
  }
}

export const twitchAuthorizeUrlBase = `${TWITCH_ID_BASE}/oauth2/authorize`;

/**
 * Builds the authorization redirect. No scopes are requested: Habitat only needs
 * to learn which account authorized it, which `/helix/users` reports for any
 * valid user token.
 */
export function twitchAuthorizeUrl(input: { clientId: string; redirectUri: string; state: string }): string {
  return `${twitchAuthorizeUrlBase}?${encodeFields([
    ["client_id", input.clientId.trim()],
    ["redirect_uri", input.redirectUri],
    ["response_type", "code"],
    ["scope", ""],
    ["state", input.state],
    ["force_verify", "true"],
  ])}`;
}
