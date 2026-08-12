export type ClubGame = {
  slug: string;
  name: string;
  roomName: string;
  tagline: string;
  description: string;
  accent: "rivals";
  features: readonly string[];
  squadSize: number;
};

const clubGames = [
  {
    slug: "marvel-rivals",
    name: "Marvel Rivals",
    roomName: "The Assembly Room",
    tagline: "Six seats. One bad plan.",
    description: "The Habitat room for squads, mains, ranks, and match-night bragging rights.",
    accent: "rivals",
    features: ["Squad board", "Member standings", "Hero mains"],
    squadSize: 6,
  },
] as const satisfies readonly ClubGame[];

export function getClubGames(): readonly ClubGame[] {
  return clubGames;
}

export function getClubGameBySlug(slug: string): ClubGame | null {
  return clubGames.find((game) => game.slug === slug) ?? null;
}
