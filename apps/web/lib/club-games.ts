export type ClubGame = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  platformNote: string;
  sourceLabel: string;
  accent: "rivals";
  features: readonly string[];
};

const clubGames = [
  {
    slug: "marvel-rivals",
    name: "Marvel Rivals",
    tagline: "Assemble the six.",
    description: "The Habitat's competitive squad room. Build a lineup, compare hero pools, and make game night feel like an event.",
    platformNote: "Most Habitat members play on Steam. Steam proves membership; an opt-in Rivals profile will supply game stats once the adapter is configured.",
    sourceLabel: "Marvel Rivals API · not connected",
    accent: "rivals",
    features: ["Squad finder", "Rank & hero profile", "Match archive", "Club leaderboards"],
  },
] as const satisfies readonly ClubGame[];

export function getClubGames(): readonly ClubGame[] {
  return clubGames;
}

export function getClubGameBySlug(slug: string): ClubGame | null {
  return clubGames.find((game) => game.slug === slug) ?? null;
}
