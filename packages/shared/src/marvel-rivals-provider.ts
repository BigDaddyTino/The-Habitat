import { fetchMarvelRivalsMatchHistory, fetchMarvelRivalsProfile, type MarvelRivalsMatchHistoryPage, type MarvelRivalsProfileData } from "./marvel-rivals";
import { fetchRivalsmetaMatchHistory, fetchRivalsmetaProfile, requestRivalsmetaProfileUpdate, RIVALSMETA_SOURCE } from "./rivalsmeta";

export type MarvelRivalsProviderKind = "marvelrivalsapi" | "rivalsmeta";

export type MarvelRivalsProvider = {
  kind: MarvelRivalsProviderKind;
  /** Recorded on snapshots and match rows so members can see where cached data came from. */
  source: string;
  /** Bounded refresh cadence appropriate for the provider. */
  profileRefreshIntervalMs: number;
  fetchProfile(query: string): Promise<MarvelRivalsProfileData>;
  fetchMatchHistory(uid: string, page: number): Promise<MarvelRivalsMatchHistoryPage>;
  /** Nudges the provider to re-pull upstream data; a no-op where unsupported. */
  requestUpstreamRefresh(uid: string): Promise<boolean>;
};

export type MarvelRivalsProviderEnv = {
  MARVEL_RIVALS_API_KEY?: string;
  MARVEL_RIVALS_PROVIDER?: string;
  MARVEL_RIVALS_REFRESH_MINUTES?: string;
  [key: string]: string | undefined;
};

function refreshIntervalMs(env: MarvelRivalsProviderEnv, defaultMinutes: number): number {
  const minutes = Number(env.MARVEL_RIVALS_REFRESH_MINUTES);
  return (Number.isSafeInteger(minutes) && minutes >= 15 && minutes <= 24 * 60 ? minutes : defaultMinutes) * 60 * 1_000;
}

/**
 * Chooses the Marvel Rivals stats provider. An explicit MARVEL_RIVALS_PROVIDER
 * wins ("marvelrivalsapi", "rivalsmeta", or "off"); otherwise the official API
 * is used when its key is configured, falling back to the rivalsmeta.com
 * community provider so member stats keep flowing while the key is unavailable.
 */
export function resolveMarvelRivalsProvider(env: MarvelRivalsProviderEnv): MarvelRivalsProvider | null {
  const apiKey = env.MARVEL_RIVALS_API_KEY?.trim() ?? "";
  const requested = env.MARVEL_RIVALS_PROVIDER?.trim().toLowerCase() ?? "";
  if (requested === "off" || requested === "disabled" || requested === "none") return null;
  if (requested === "marvelrivalsapi" && !apiKey) return null;
  const useOfficial = requested === "marvelrivalsapi" || (requested !== "rivalsmeta" && Boolean(apiKey));
  if (useOfficial) {
    return {
      kind: "marvelrivalsapi",
      source: "marvelrivalsapi.com",
      profileRefreshIntervalMs: refreshIntervalMs(env, 360),
      fetchProfile: (query) => fetchMarvelRivalsProfile(query, apiKey),
      fetchMatchHistory: (uid, page) => fetchMarvelRivalsMatchHistory(uid, apiKey, page, 20),
      requestUpstreamRefresh: () => Promise.resolve(false),
    };
  }
  return {
    kind: "rivalsmeta",
    source: RIVALSMETA_SOURCE,
    profileRefreshIntervalMs: refreshIntervalMs(env, 60),
    fetchProfile: (query) => fetchRivalsmetaProfile(query),
    fetchMatchHistory: (uid, page) => fetchRivalsmetaMatchHistory(uid, page),
    requestUpstreamRefresh: (uid) => requestRivalsmetaProfileUpdate(uid),
  };
}
