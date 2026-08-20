const characterKeyart = {
  amanda: "/images/characters/keyart/amanda.jpg",
  steve: "/images/characters/keyart/steve.png",
  "the-kestrel-commander": "/images/characters/keyart/the-kestrel-commander.png",
  "the-war-correspondent": "/images/characters/keyart/the-war-correspondent.png",
  tino: "/images/characters/keyart/tino.png",
} as const satisfies Record<string, string>;

export function getCharacterKeyart(slug: string): string | null {
  return characterKeyart[slug as keyof typeof characterKeyart] ?? null;
}

export const illustratedCharacterSlugs = Object.freeze(Object.keys(characterKeyart));
