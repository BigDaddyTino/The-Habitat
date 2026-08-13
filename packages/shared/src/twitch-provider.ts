import {
  exchangeTwitchAuthorizationCode,
  fetchTwitchAppToken,
  fetchTwitchAuthenticatedUser,
  fetchTwitchFollowerCount,
  fetchTwitchLiveStreams,
  fetchTwitchUsersById,
  revokeTwitchToken,
  type TwitchAppToken,
  type TwitchFetch,
  type TwitchLiveStreamData,
  type TwitchUserData,
} from "./twitch";

export type TwitchProviderEnv = {
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  TWITCH_INTEGRATION?: string;
  TWITCH_LIVE_POLL_MINUTES?: string;
  [key: string]: string | undefined;
};

export type TwitchProvider = {
  clientId: string;
  /** How often live status may be polled, in milliseconds. */
  livePollIntervalMs: number;
  fetchLiveStreams(twitchUserIds: string[]): Promise<TwitchLiveStreamData[]>;
  fetchUsersById(twitchUserIds: string[]): Promise<TwitchUserData[]>;
  fetchFollowerCount(twitchUserId: string): Promise<number | null>;
  /** Completes OAuth verification and returns the account that authorized. */
  verifyAuthorizationCode(code: string, redirectUri: string): Promise<TwitchUserData>;
};

function pollIntervalMs(env: TwitchProviderEnv, defaultMinutes: number): number {
  const minutes = Number(env.TWITCH_LIVE_POLL_MINUTES);
  return (Number.isSafeInteger(minutes) && minutes >= 1 && minutes <= 60 ? minutes : defaultMinutes) * 60 * 1_000;
}

/**
 * Resolves the Twitch integration, or null when it is not configured or has been
 * switched off. A null provider means the showcase reports itself as offline
 * rather than guessing at live state.
 */
export function resolveTwitchProvider(env: TwitchProviderEnv, fetcher?: TwitchFetch): TwitchProvider | null {
  const clientId = env.TWITCH_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.TWITCH_CLIENT_SECRET?.trim() ?? "";
  const requested = env.TWITCH_INTEGRATION?.trim().toLowerCase() ?? "";
  if (requested === "off" || requested === "disabled" || requested === "none") return null;
  if (!clientId || !clientSecret) return null;

  // One cached app token per resolved provider. Helix rejects unauthenticated
  // reads, and minting a token per request would burn the rate limit.
  let cachedToken: TwitchAppToken | null = null;
  const accessToken = async (): Promise<string> => {
    if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.accessToken;
    cachedToken = await fetchTwitchAppToken(clientId, clientSecret, fetcher);
    return cachedToken.accessToken;
  };
  // A token can still be revoked server-side mid-lifetime; retry once with a
  // freshly minted token before surfacing an authorization failure.
  const withToken = async <T>(action: (token: string) => Promise<T>): Promise<T> => {
    try {
      return await action(await accessToken());
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "TwitchApiError" || (error as { code?: string }).code !== "UNAUTHORIZED") throw error;
      cachedToken = null;
      return action(await accessToken());
    }
  };

  return {
    clientId,
    livePollIntervalMs: pollIntervalMs(env, 2),
    fetchLiveStreams: (twitchUserIds) => withToken((token) => fetchTwitchLiveStreams(clientId, token, twitchUserIds, fetcher)),
    fetchUsersById: (twitchUserIds) => withToken((token) => fetchTwitchUsersById(clientId, token, twitchUserIds, fetcher)),
    fetchFollowerCount: (twitchUserId) => withToken((token) => fetchTwitchFollowerCount(clientId, token, twitchUserId, fetcher)),
    async verifyAuthorizationCode(code, redirectUri) {
      const userToken = await exchangeTwitchAuthorizationCode({ clientId, clientSecret, code, redirectUri }, fetcher);
      try {
        return await fetchTwitchAuthenticatedUser(clientId, userToken, fetcher);
      } finally {
        // Habitat never needs the member's token again; the channel is polled
        // with the app token from here on.
        await revokeTwitchToken(clientId, userToken, fetcher);
      }
    },
  };
}
