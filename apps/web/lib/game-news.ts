export type GameDispatch = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  url: string;
  kind: "Patch notes" | "News";
};

const steamAppIds: Record<string, number> = {
  "marvel-rivals": 2767030,
  "7-days-to-die": 251570,
  "project-zomboid": 108600,
  dragonwilds: 3270700,
  enshrouded: 1203620,
  palworld: 1623730,
  valheim: 892970,
};

type SteamNewsItem = { gid?: string; title?: string; url?: string; contents?: string; date?: number; feedname?: string; tags?: string[] };
type SteamNewsResponse = { appnews?: { newsitems?: SteamNewsItem[] } };

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\\[rn]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

function isPatchNote(item: SteamNewsItem) {
  return Boolean(item.tags?.includes("patchnotes") || /patch notes?|balance (?:post|adjustment)|version \d+/i.test(item.title ?? ""));
}

/**
 * Requires HTTPS, which is what rejects the dangerous shapes (`javascript:`,
 * plain HTTP, unparseable strings).
 *
 * Deliberately NOT host-allowlisted. Steam's ISteamNews feed serves community
 * announcements from its CDN — every announcement for every configured app
 * currently arrives as `https://steamstore-a.akamaihd.net/...`, not from
 * steamcommunity.com or steampowered.com. An allowlist of the obvious Steam
 * domains silently drops every dispatch, and Valve can move the CDN host
 * whenever it likes, so the allowlist would keep failing closed and empty. The
 * URL comes from Valve's own HTTPS API for a specific appid and is rendered with
 * rel="noreferrer" on an explicit member click, so the residual risk is far
 * smaller than a feed that quietly shows nothing.
 */
export function isSafeNewsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Pulls a small, server-cached, game-specific announcement set. No client-side tracking or feed key is used. */
export async function getGameDispatches(serverSlug: string): Promise<GameDispatch[]> {
  const appId = steamAppIds[serverSlug];
  if (!appId) return [];
  try {
    const response = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=16&maxlength=240&format=json`, {
      next: { revalidate: 3_600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return [];
    const data = await response.json() as SteamNewsResponse;
    const items = data.appnews?.newsitems ?? [];
    return items
      .filter((item) => item.gid && item.title && isSafeNewsUrl(item.url) && item.date && item.feedname === "steam_community_announcements")
      .sort((left, right) => Number(isPatchNote(right)) - Number(isPatchNote(left)) || (right.date ?? 0) - (left.date ?? 0))
      .slice(0, 3)
      .map((item) => ({
        id: item.gid!,
        title: item.title!,
        summary: plainText(item.contents ?? ""),
        publishedAt: new Date(item.date! * 1_000),
        url: item.url!,
        kind: isPatchNote(item) ? "Patch notes" : "News",
      }));
  } catch {
    return [];
  }
}
