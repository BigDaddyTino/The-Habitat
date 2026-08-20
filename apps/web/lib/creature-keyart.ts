const creatureKeyart = {
  lizzarnix: "/images/creatures/keyart/lizzarnix.jpg",
} as const satisfies Record<string, string>;

export function getCreatureKeyart(slug: string): string | null {
  return creatureKeyart[slug as keyof typeof creatureKeyart] ?? null;
}

export const illustratedCreatureSlugs = Object.freeze(Object.keys(creatureKeyart));
