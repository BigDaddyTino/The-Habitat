import { z } from "zod";
import {
  storyControlKinds,
  storyCreatureCategories,
  storyEntryKinds,
  storyFactionStances,
  storyMagicOrigins,
  storyRegionTypes,
  storySettlementTiers,
  storySystemCategories,
  storySystemStatuses,
  storySoulForgeStates,
  storyVeilAnchorTiers,
} from "@habitat/shared";

/**
 * The per-kind sheet schemas from Codex_Module_Schema.md, kept pure so both
 * the server action that enforces them and the tests that audit stored rows
 * against them import the same objects. Living inside the "use server"
 * module they could only ever be checked by hand.
 *
 * Two properties worth knowing before editing one: every field is
 * required-but-nullable, so a sheet that omits a key is REJECTED whole; and
 * zod strips keys it does not know, so a key that exists in the database but
 * not here is silently dropped on the next save. scripts/audit-story-meta.ts
 * reports both against real rows.
 */
export const metaText = (max: number) => z.string().trim().min(1).max(max).nullable();
export const metaLines = (max: number, each: number) => z.array(z.string().trim().min(1).max(each)).max(max);
/** Slug-typed meta fields reference other entries — link now, fill later, so
 *  only the shape is checked; an unresolved slug is a todo, not an error.
 *  The shape IS checked though: every real slug is kebab-case, so anything
 *  else ("The Northern Vale") could never resolve, never match a picker, and
 *  would sit in the sheet as a link that structurally cannot come true. */
export const metaSlug = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "not a slug").max(64);

export const characterMetaSchema = z.object({
  fullName: metaText(160),
  aliases: metaLines(20, 120),
  pronouns: metaText(40),
  sex: metaText(40),
  species: metaText(80),
  age: metaText(80),
  appearance: metaText(2000),
  voice: metaText(2000),
  magic: z.object({
    origin: z.enum(storyMagicOrigins).nullable(),
    schools: metaLines(12, 80),
    corruptionPhase: z.number().int().min(0).max(7).nullable(),
    notes: metaText(2000),
  }),
  factions: z.array(z.object({ faction: metaSlug, role: metaText(160), standing: metaText(160) })).max(12),
  home: metaText(64),
  status: z.object({ known: metaText(500), actual: metaText(500) }),
  relationships: z.array(z.object({ character: metaSlug.nullable(), who: metaText(160), type: metaText(300) })).max(30),
  storyRole: metaText(500),
  involvement: z.array(z.object({ arc: metaSlug, how: metaText(300) })).max(20),
  gameId: metaText(120),
  model: metaText(200),
  openQuestions: metaLines(30, 300),
});

// Enums come from the shared constants the sheets themselves render — never
// duplicated literals. The duplicated version rotted the moment the shared
// list grew: "destination" was added to storyRegionTypes and the region sheet
// offered it, while the copy here still rejected it, so saving any
// destination's sheet failed validation and stored nothing.
export const regionMetaSchema = z.object({
  type: z.enum(storyRegionTypes).nullable(),
  settlementTier: z.enum(storySettlementTiers).nullable(),
  parent: metaText(64),
  biome: metaText(160),
  control: z.array(z.object({ faction: metaSlug, kind: z.enum(storyControlKinds).nullable() })).max(12),
  population: metaText(160),
  connections: z.array(z.object({ to: metaSlug, by: metaText(80), notes: metaText(300) })).max(30),
  status: metaText(160),
  // Set only on places that ARE a Veil Anchor; null everywhere else.
  veilAnchorTier: z.enum(storyVeilAnchorTiers).nullable(),
  // Set only on places that hold a Soul Forge; null everywhere else.
  soulForge: z.enum(storySoulForgeStates).nullable(),
  gameTag: metaText(120),
  openQuestions: metaLines(30, 300),
});

export const factionMetaSchema = z.object({
  scope: metaText(80),
  seat: metaText(64),
  leaders: metaLines(20, 64),
  relations: z.array(z.object({
    faction: metaSlug,
    stance: z.enum(storyFactionStances).nullable(),
    notes: metaText(500),
  })).max(30),
  goals: metaLines(20, 500),
  gameTag: metaText(120),
  openQuestions: metaLines(30, 300),
});

export const creatureMetaSchema = z.object({
  category: z.enum(storyCreatureCategories).nullable(),
  biomes: metaLines(20, 160),
  threat: metaText(500),
  harvest: metaText(500),
  gameId: metaText(120),
  openQuestions: metaLines(30, 300),
});

export const itemMetaSchema = z.object({
  category: metaText(80),
  rarity: metaText(80),
  origin: metaText(160),
  gameId: metaText(120),
  openQuestions: metaLines(30, 300),
});

/**
 * The systems sheet (Codex_Module_Schema.md §3.8). The release fields are the
 * point: `unlockArc` names the quest arc that switches the system on for the
 * player, which is how "you are not managing a kingdom on day one" stays a
 * fact the codex enforces rather than a note everybody has to remember.
 */
export const systemMetaSchema = z.object({
  category: z.enum(storySystemCategories).nullable(),
  buildStatus: z.enum(storySystemStatuses).nullable(),
  parent: metaSlug.nullable(),
  unlockArc: metaSlug.nullable(),
  unlockStage: metaText(160),
  dependsOn: z.array(metaSlug).max(12),
  pillars: metaLines(12, 300),
  regionNotes: z.array(z.object({ region: metaSlug, note: metaText(300) })).max(20),
  gameTag: metaText(120),
  openQuestions: metaLines(30, 300),
});

export const eventMetaSchema = z.object({
  when: metaText(160),
  // The timeline's sortable anchor: years before the present. Fractions order
  // same-era events; null = deliberately unplaced (an unknown age can be
  // canon). Bounded well past the First Hunt so nobody fat-fingers infinity.
  timelineYearsAgo: z.number().min(0).max(1_000_000).nullable(),
  where: metaLines(20, 64),
  involved: metaLines(30, 64),
  outcome: metaText(2000),
  openQuestions: metaLines(30, 300),
});

export const metaSchemasByKind: Partial<Record<(typeof storyEntryKinds)[number], z.ZodTypeAny>> = {
  CHARACTER: characterMetaSchema,
  FACTION: factionMetaSchema,
  REGION: regionMetaSchema,
  CREATURE: creatureMetaSchema,
  ITEM: itemMetaSchema,
  EVENT: eventMetaSchema,
  SYSTEM: systemMetaSchema,
};


