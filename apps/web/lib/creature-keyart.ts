const creatureKeyart = {
  abominations: "/codex-art/races/abominations.png",
  "arcadian-devil": "/codex-art/races/arcadian-devil.png",
  beasts: "/codex-art/races/beasts.png",
  hippogriff: "/codex-art/races/hippogriff.png",
  human: "/codex-art/races/human.png",
  humanoid: "/codex-art/races/humanoid.png",
  lizzarnix: "/codex-art/creatures/lizzarnix.jpg",
  monstrosities: "/codex-art/races/monstrosities.png",
  mythical: "/codex-art/races/mythical.png",
  supernaturals: "/codex-art/races/supernaturals.png",
  "the-risen": "/codex-art/races/the-risen.png",
  "true-demons": "/codex-art/races/true-demons.png",
} as const satisfies Record<string, string>;

export function getCreatureKeyart(slug: string): string | null {
  return creatureKeyart[slug as keyof typeof creatureKeyart] ?? null;
}

export const illustratedCreatureSlugs = Object.freeze(Object.keys(creatureKeyart));
