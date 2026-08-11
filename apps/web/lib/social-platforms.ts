export const socialPlatforms = ["TWITCH", "STEAM", "DISCORD", "YOUTUBE", "XBOX", "PLAYSTATION", "EPIC_GAMES", "BATTLE_NET", "RIOT_GAMES", "GITHUB"] as const;

export type SocialPlatform = (typeof socialPlatforms)[number];

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  TWITCH: "Twitch",
  STEAM: "Steam",
  DISCORD: "Discord",
  YOUTUBE: "YouTube",
  XBOX: "Xbox",
  PLAYSTATION: "PlayStation",
  EPIC_GAMES: "Epic Games",
  BATTLE_NET: "Battle.net",
  RIOT_GAMES: "Riot Games",
  GITHUB: "GitHub",
};

export function profileUrlForPlatform(platform: SocialPlatform, handle: string) {
  const encoded = encodeURIComponent(handle.trim());
  switch (platform) {
    case "TWITCH": return `https://www.twitch.tv/${encoded}`;
    case "STEAM": return `https://steamcommunity.com/id/${encoded}`;
    case "YOUTUBE": return `https://www.youtube.com/@${encoded}`;
    case "XBOX": return `https://www.xbox.com/en-US/play/user/${encoded}`;
    case "PLAYSTATION": return `https://psnprofiles.com/${encoded}`;
    case "GITHUB": return `https://github.com/${encoded}`;
    default: return null;
  }
}
