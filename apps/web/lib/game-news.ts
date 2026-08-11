export type GameDispatch = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  url: string;
  kind: "Patch notes" | "News";
};

const steamAppIds: Record<string, number> = {
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

/** Pulls a small, server-cached, game-specific announcement set. No client-side tracking or feed key is used. */
export async function getGameDispatches(serverSlug: string): Promise<GameDispatch[]> {
  const appId = steamAppIds[serverSlug];
  if (!appId) return [];
  try {
    const response = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=16&maxlength=240&format=json`, {
      next: { revalidate: 3_600 },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const data = await response.json() as SteamNewsResponse;
    const items = data.appnews?.newsitems ?? [];
    return items
      .filter((item) => item.gid && item.title && item.url && item.date && item.feedname === "steam_community_announcements")
      .sort((left, right) => Number(right.tags?.includes("patchnotes")) - Number(left.tags?.includes("patchnotes")) || (right.date ?? 0) - (left.date ?? 0))
      .slice(0, 3)
      .map((item) => ({
        id: item.gid!,
        title: item.title!,
        summary: plainText(item.contents ?? ""),
        publishedAt: new Date(item.date! * 1_000),
        url: item.url!,
        kind: item.tags?.includes("patchnotes") ? "Patch notes" : "News",
      }));
  } catch {
    return [];
  }
}
