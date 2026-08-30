import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";

/**
 * Gives a sheet to any entry whose kind has one but which was written without.
 *
 * Every kind with a schema is now born carrying its sheet, but entries written
 * before that law arrived can still be sitting with `meta` NULL — and a null
 * sheet is not merely blank, it is invisible: the per-kind reference checks in
 * getStoryNeedsWork read meta, so a null one cannot be reported as needing
 * work no matter how broken its links are.
 *
 * The sheet written here is empty in the codex's own sense — every field "not
 * yet decided". It states nothing about the entry that was not already true.
 * Notably `buildStatus` is left null rather than "concept": that is the right
 * default for a system being created now, but on a system that has been canon
 * for months it would be an invented claim about where the build stands.
 *
 * Idempotent: a row that already has a sheet is never touched, so this can be
 * re-run whenever something turns up sheetless.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/backfill-entry-sheets.ts
 *   pnpm --filter @habitat/web exec tsx scripts/backfill-entry-sheets.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");

/** The empty sheet for each kind that has one — no field claiming anything. */
const emptySheets: Record<string, Record<string, unknown>> = {
  CHARACTER: {
    fullName: null, aliases: [], pronouns: null, sex: null, species: null, age: null,
    appearance: null, voice: null,
    magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
    factions: [], home: null, status: { known: null, actual: null }, relationships: [],
    background: null, professions: [], skills: [], cybernetics: [],
    storyRole: null, involvement: [], gameId: null, model: null,
    companion: { capable: null, availability: null, status: null }, openQuestions: [],
  },
  // `independent` is the one non-nullable field on any sheet: a power either
  // stands outside every sphere or it does not. False is the neutral reading —
  // it says "no such claim has been made", which is what a blank sheet means.
  FACTION: { scope: null, parent: null, independent: false, power: null, seat: null, leaders: [], relations: [], goals: [], gameTag: null, openQuestions: [] },
  REGION: { type: null, settlementTier: null, parent: null, biome: null, control: [], population: null, connections: [], status: null, veilAnchorTier: null, soulForge: null, gameTag: null, openQuestions: [] },
  CREATURE: { category: null, parent: null, biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [] },
  ITEM: { category: null, rarity: null, origin: null, gameId: null, openQuestions: [] },
  EVENT: { when: null, timelineYearsAgo: null, where: [], involved: [], outcome: null, openQuestions: [] },
  SYSTEM: { category: null, buildStatus: null, parent: null, unlockArc: null, unlockStage: null, dependsOn: [], pillars: [], regionNotes: [], gameTag: null, openQuestions: [] },
  THREAD: {
    threadStatus: null, categories: [], stages: [], priority: null, spoilerLevel: null, parent: null,
    characters: [], companions: [], factions: [], locations: [], arcs: [], companionMissions: [], bosses: [],
    // Required with no default on purpose, so it is stated here rather than
    // left for zod to strip into a silent deletion.
    canonPackets: [], tags: [], openQuestions: [],
  },
  COMPANION_MISSION: {
    companion: null, arc: null, order: null, missionStatus: null, stage: null, unlockConditions: null,
    rewards: [], relationshipEffects: null, consequences: null, characters: [], locations: [], factions: [], threads: [], openQuestions: [],
  },
};

async function main() {
  // Every kind with a schema needs an empty sheet defined, or a kind could be
  // skipped here without anybody noticing.
  const missing = Object.keys(metaSchemasByKind).filter((kind) => !emptySheets[kind]);
  if (missing.length) throw new Error(`no empty sheet defined for: ${missing.join(", ")}`);

  // Validate before going near the database: a default that its own schema
  // would refuse is a bug worth failing on rather than writing.
  for (const [kind, sheet] of Object.entries(emptySheets)) {
    const schema = metaSchemasByKind[kind as keyof typeof metaSchemasByKind];
    if (!schema) continue;
    const parsed = schema.safeParse(sheet);
    if (!parsed.success) throw new Error(`the empty ${kind} sheet does not satisfy its own schema: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }

  // Raw SQL, because on a Json column `equals: null` does not mean SQL NULL.
  const sheetedKinds = Object.keys(metaSchemasByKind);
  const rows = await db.$queryRaw<Array<{ id: string; slug: string; kind: string; title: string; version: number }>>`
    SELECT "id", "slug", "kind", "title", "version"
    FROM "StoryEntry"
    WHERE ("meta" IS NULL OR "meta"::text = 'null')
      AND "kind"::text = ANY(${sheetedKinds})
    ORDER BY "kind", "slug"
  `;

  console.log(`entries whose kind has a sheet but which carry none: ${rows.length}`);
  for (const row of rows) console.log(`  ${row.kind.padEnd(18)} ${row.slug.padEnd(24)} v${row.version}  "${row.title}"`);
  if (rows.length === 0) {
    console.log("\nNothing to do — every entry that should have a sheet has one.");
    return;
  }
  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write these sheets.");
    return;
  }

  const author =
    (await db.user.findFirst({ where: { username: "tino", isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`\nauthor: ${author.username}`);

  for (const row of rows) {
    const sheet = emptySheets[row.kind];
    await db.$transaction(async (tx) => {
      // Guarded on the version so a writer saving this entry right now wins
      // rather than being overwritten by a backfill.
      const written = await tx.storyEntry.updateMany({
        where: { id: row.id, version: row.version },
        data: { meta: sheet as Prisma.InputJsonValue, updatedByUserId: author.id, version: { increment: 1 } },
      });
      if (written.count !== 1) {
        console.log(`  SKIPPED ${row.slug} — somebody saved it while this ran`);
        return;
      }
      // The export's ETag and `?since` cursor ride the newest revision, so a
      // meta change with no revision would leave the importer holding a stale
      // story it believes is current.
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: row.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Backfilled the ${row.kind.toLowerCase().replaceAll("_", " ")} sheet for "${row.title}"`.slice(0, 300),
          before: { meta: null },
          after: { meta: sheet as Prisma.InputJsonValue },
        },
      });
      console.log(`  wrote ${row.kind} sheet for ${row.slug} (v${row.version} -> v${row.version + 1})`);
    });
  }
  console.log("\nDone.");
}

main().finally(() => db.$disconnect());
