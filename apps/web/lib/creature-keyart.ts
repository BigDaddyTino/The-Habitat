const creatureKeyart = {
  abominations: "/images/races/keyart/abominations.png",
  beasts: "/images/races/keyart/beasts.png",
  hippogriff: "/images/races/keyart/hippogriff.png",
  human: "/images/races/keyart/human.png",
  humanoid: "/images/races/keyart/humanoid.png",
  lizzarnix: "/images/creatures/keyart/lizzarnix.jpg",
  monstrosities: "/images/races/keyart/monstrosities.png",
  mythical: "/images/races/keyart/mythical.png",
  supernaturals: "/images/races/keyart/supernaturals.png",
  "the-risen": "/images/races/keyart/the-risen.png",
} as const satisfies Record<string, string>;

export function getCreatureKeyart(slug: string): string | null {
  return creatureKeyart[slug as keyof typeof creatureKeyart] ?? null;
}

export const illustratedCreatureSlugs = Object.freeze(Object.keys(creatureKeyart));
