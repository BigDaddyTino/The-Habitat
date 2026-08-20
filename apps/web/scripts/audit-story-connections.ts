import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { randomUUID } from "node:crypto";
import { getStoryEntry, getStoryNeedsWork } from "../lib/story-codex";
import { metaSchemasByKind } from "../lib/story-meta-schemas";

/**
 * Every slug-typed field in every module sheet, exercised for real: plant one
 * reference, then ask the thing it points at whether it knows.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-story-connections.ts
 *
 * A field that is written but never read is a one-way edge — the shape of bug
 * that let the races shelf exist with nothing in the world pointing into it,
 * and let a system name a dependency the depended-on system never heard about.
 * Neither throws, neither shows in a screenshot, and neither is visible from
 * the writing side at all. So the check is empirical rather than a source
 * audit: it writes a probe, reads the graph, and deletes the probe.
 *
 * Probes are prefixed `tmpconn-` and removed in a `finally`, including their
 * revisions. It writes nothing else and changes no real row.
 */
const db = getPrismaClient();
const PREFIX = "tmpconn";

const results: Array<{ ok: boolean; what: string }> = [];
const check = (ok: boolean, what: string) => results.push({ ok, what });

/** A complete, schema-valid sheet per kind with every field at its empty value. */
const blank: Record<string, Record<string, unknown>> = {
  CHARACTER: { fullName: null, aliases: [], pronouns: null, sex: null, species: null, age: null, appearance: null, voice: null, magic: { origin: null, schools: [], corruptionPhase: null, notes: null }, factions: [], home: null, status: { known: null, actual: null }, relationships: [], storyRole: null, involvement: [], gameId: null, model: null, companion: { capable: null, availability: null, status: null }, openQuestions: [] },
  REGION: { type: null, settlementTier: null, parent: null, biome: null, control: [], population: null, connections: [], status: null, veilAnchorTier: null, soulForge: null, gameTag: null, openQuestions: [] },
  FACTION: { scope: null, parent: null, power: null, seat: null, leaders: [], relations: [], goals: [], gameTag: null, openQuestions: [] },
  CREATURE: { category: null, parent: null, biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [] },
  ITEM: { category: null, rarity: null, origin: null, gameId: null, openQuestions: [] },
  EVENT: { when: null, timelineYearsAgo: null, where: [], involved: [], outcome: null, openQuestions: [] },
  SYSTEM: { category: null, buildStatus: null, parent: null, unlockArc: null, unlockStage: null, dependsOn: [], pillars: [], regionNotes: [], gameTag: null, openQuestions: [] },
  THREAD: { threadStatus: null, categories: [], stages: [], priority: null, spoilerLevel: null, parent: null, characters: [], companions: [], factions: [], locations: [], arcs: [], companionMissions: [], bosses: [], canonPackets: [], tags: [], openQuestions: [] },
  COMPANION_MISSION: { companion: null, arc: null, order: null, missionStatus: null, stage: null, unlockConditions: null, rewards: [], relationshipEffects: null, consequences: null, characters: [], locations: [], factions: [], threads: [], openQuestions: [] },
};

const packet = (over: Record<string, unknown>) => ({
  id: randomUUID(), title: "probe", body: "probe", targetKind: "campaign", targetRegion: null,
  targetCompanion: null, targetFaction: null, entries: [], status: "pending", pushedAt: new Date().toISOString(),
  pushedBy: "audit", wovenAt: null, wovenBy: null, wovenInto: [], ...over,
});

type Case = { field: string; from: string; to: string; plant: (target: string) => Record<string, unknown> };

const cases: Case[] = [
  { field: "CHARACTER.home", from: "CHARACTER", to: "REGION", plant: (t) => ({ home: t }) },
  { field: "CHARACTER.species (their people)", from: "CHARACTER", to: "CREATURE", plant: (t) => ({ species: t }) },
  { field: "CHARACTER.factions[].faction", from: "CHARACTER", to: "FACTION", plant: (t) => ({ factions: [{ faction: t, role: null, standing: null }] }) },
  { field: "CHARACTER.relationships[].character", from: "CHARACTER", to: "CHARACTER", plant: (t) => ({ relationships: [{ character: t, who: null, type: null }] }) },
  { field: "REGION.parent", from: "REGION", to: "REGION", plant: (t) => ({ parent: t }) },
  { field: "REGION.control[].faction", from: "REGION", to: "FACTION", plant: (t) => ({ control: [{ faction: t, kind: null }] }) },
  { field: "REGION.connections[].to", from: "REGION", to: "REGION", plant: (t) => ({ connections: [{ to: t, by: null, notes: null }] }) },
  { field: "FACTION.seat", from: "FACTION", to: "REGION", plant: (t) => ({ seat: t }) },
  { field: "FACTION.parent (its banner)", from: "FACTION", to: "FACTION", plant: (t) => ({ parent: t }) },
  { field: "FACTION.leaders[]", from: "FACTION", to: "CHARACTER", plant: (t) => ({ leaders: [t] }) },
  { field: "FACTION.relations[].faction", from: "FACTION", to: "FACTION", plant: (t) => ({ relations: [{ faction: t, stance: null, notes: null }] }) },
  { field: "CREATURE.parent (its race)", from: "CREATURE", to: "CREATURE", plant: (t) => ({ parent: t }) },
  { field: "CREATURE.biomes[]", from: "CREATURE", to: "REGION", plant: (t) => ({ biomes: [t] }) },
  { field: "ITEM.origin", from: "ITEM", to: "REGION", plant: (t) => ({ origin: t }) },
  { field: "EVENT.where[]", from: "EVENT", to: "REGION", plant: (t) => ({ where: [t] }) },
  { field: "EVENT.involved[]", from: "EVENT", to: "CHARACTER", plant: (t) => ({ involved: [t] }) },
  { field: "SYSTEM.parent", from: "SYSTEM", to: "SYSTEM", plant: (t) => ({ parent: t }) },
  { field: "SYSTEM.dependsOn[]", from: "SYSTEM", to: "SYSTEM", plant: (t) => ({ dependsOn: [t] }) },
  { field: "THREAD.parent", from: "THREAD", to: "THREAD", plant: (t) => ({ parent: t }) },
  { field: "THREAD.characters[]", from: "THREAD", to: "CHARACTER", plant: (t) => ({ characters: [t] }) },
  { field: "THREAD.companions[]", from: "THREAD", to: "CHARACTER", plant: (t) => ({ companions: [t] }) },
  { field: "THREAD.factions[]", from: "THREAD", to: "FACTION", plant: (t) => ({ factions: [t] }) },
  { field: "THREAD.locations[]", from: "THREAD", to: "REGION", plant: (t) => ({ locations: [t] }) },
  { field: "THREAD.bosses[]", from: "THREAD", to: "CREATURE", plant: (t) => ({ bosses: [t] }) },
  { field: "THREAD.companionMissions[]", from: "THREAD", to: "COMPANION_MISSION", plant: (t) => ({ companionMissions: [t] }) },
  { field: "THREAD.canonPackets[].entries[]", from: "THREAD", to: "CHARACTER", plant: (t) => ({ canonPackets: [packet({ entries: [t] })] }) },
  { field: "THREAD.canonPackets[].targetRegion", from: "THREAD", to: "REGION", plant: (t) => ({ canonPackets: [packet({ targetKind: "region", targetRegion: t })] }) },
  { field: "THREAD.canonPackets[].targetCompanion", from: "THREAD", to: "CHARACTER", plant: (t) => ({ canonPackets: [packet({ targetKind: "companions", targetCompanion: t })] }) },
  { field: "THREAD.canonPackets[].targetFaction", from: "THREAD", to: "FACTION", plant: (t) => ({ canonPackets: [packet({ targetKind: "factions", targetFaction: t })] }) },
  { field: "COMPANION_MISSION.companion", from: "COMPANION_MISSION", to: "CHARACTER", plant: (t) => ({ companion: t }) },
  { field: "COMPANION_MISSION.characters[]", from: "COMPANION_MISSION", to: "CHARACTER", plant: (t) => ({ characters: [t] }) },
  { field: "COMPANION_MISSION.locations[]", from: "COMPANION_MISSION", to: "REGION", plant: (t) => ({ locations: [t] }) },
  { field: "COMPANION_MISSION.factions[]", from: "COMPANION_MISSION", to: "FACTION", plant: (t) => ({ factions: [t] }) },
  { field: "COMPANION_MISSION.threads[]", from: "COMPANION_MISSION", to: "THREAD", plant: (t) => ({ threads: [t] }) },
];

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const made: string[] = [];
  const madeArcs: string[] = [];

  const mint = async (kind: string, label: string, meta: Record<string, unknown>) => {
    const row = await db.storyEntry.create({
      data: { kind: kind as never, slug: `${PREFIX}-${label}`, title: `TMPCONN ${label}`, status: "CANON", createdByUserId: actor.id, meta: meta as Prisma.InputJsonValue },
      select: { id: true, slug: true },
    });
    made.push(row.id);
    return row.slug;
  };

  try {
    for (const [index, testCase] of cases.entries()) {
      const targetSlug = await mint(testCase.to, `target-${index}`, { ...blank[testCase.to] });
      const sourceMeta = { ...blank[testCase.from], ...testCase.plant(targetSlug) };

      // The planted shape must be one the real sheet would accept, or the test
      // proves something the app could never store in the first place.
      const schema = metaSchemasByKind[testCase.from as never] as { safeParse: (v: unknown) => { success: boolean } } | undefined;
      if (!schema?.safeParse(sourceMeta).success) { check(false, `${testCase.field} — the probe shape is not one the sheet accepts`); continue; }

      const sourceSlug = await mint(testCase.from, `source-${index}`, sourceMeta);
      const target = await getStoryEntry(targetSlug);
      const edge = target?.connections.find((c) => c.slug === sourceSlug);
      check(Boolean(edge), `${testCase.field.padEnd(38)} ${edge ? `→ "${edge.relation}"` : "→ NOT SHOWN on the target's dossier"}`);
    }

    // The arc axis: arcs are not entries, so they carry their own edges.
    const place = await mint("REGION", "arc-place", { ...blank.REGION });
    const person = await mint("CHARACTER", "arc-person", { ...blank.CHARACTER });
    const banner = await mint("FACTION", "arc-banner", { ...blank.FACTION });
    const wing = await mint("FACTION", "arc-wing", { ...blank.FACTION, parent: `${PREFIX}-arc-banner` });
    const placeId = (await db.storyEntry.findUniqueOrThrow({ where: { slug: place }, select: { id: true } })).id;
    const personId = (await db.storyEntry.findUniqueOrThrow({ where: { slug: person }, select: { id: true } })).id;
    const wingId = (await db.storyEntry.findUniqueOrThrow({ where: { slug: wing }, select: { id: true } })).id;
    const contract = await db.storyArc.create({ data: { slug: `${PREFIX}-contract`, title: "TMPCONN contract", category: "CONTRACT", isMainline: false, status: "CANON", regionEntryId: placeId, createdByUserId: actor.id } });
    const quest = await db.storyArc.create({ data: { slug: `${PREFIX}-quest`, title: "TMPCONN quest", category: "COMPANION_QUEST", isMainline: false, status: "CANON", companionEntryId: personId, createdByUserId: actor.id } });
    const banners = await db.storyArc.create({ data: { slug: `${PREFIX}-banner-quest`, title: "TMPCONN banner quest", category: "FACTION_QUEST", isMainline: false, status: "CANON", factionEntryId: wingId, createdByUserId: actor.id } });
    madeArcs.push(contract.id, quest.id, banners.id);
    check((await getStoryEntry(place))?.arcsHere.some((a) => a.slug === contract.slug) === true, "StoryArc.regionEntryId".padEnd(38) + " → the place lists the quests posted there");
    check((await getStoryEntry(person))?.companionArcs.some((a) => a.slug === quest.slug) === true, "StoryArc.companionEntryId".padEnd(38) + " → the companion lists their own quests");
    check((await getStoryEntry(wing))?.factionArcs.some((a) => a.slug === banners.slug) === true, "StoryArc.factionEntryId".padEnd(38) + " → the faction lists the quests under its banner");
    // The rollup: a wing's quest reads on the power above it, named by the
    // wing it came through rather than absorbed into the major.
    const rolled = (await getStoryEntry(banner))?.factionArcs.find((a) => a.slug === banners.slug);
    check(rolled?.via?.slug === wing, "StoryArc.factionEntryId (rolled up)".padEnd(38) + ` → the banner shows its wing's quest${rolled?.via ? ` via ${rolled.via.slug}` : " — NOT ROLLED UP"}`);

    // Reachability: nothing genuinely connected may read as an orphan.
    const needs = await getStoryNeedsWork();
    const orphaned = needs.unconnected.filter((row) => row.slug.startsWith(PREFIX)).map((row) => row.slug);
    check(orphaned.length === 0, `no connected probe is reported unconnected${orphaned.length ? ` — ${orphaned.join(", ")}` : ""}`);

    // And a reference to something nobody wrote must surface as a plan.
    const broken = await mint("CHARACTER", "broken", { ...blank.CHARACTER, home: "a-place-nobody-wrote" });
    const after = await getStoryNeedsWork();
    check(after.planned.some((r) => r.slug === broken && r.target === "a-place-nobody-wrote"), "a reference to something nobody wrote is reported as a plan");
  } finally {
    await db.storyArc.deleteMany({ where: { id: { in: madeArcs } } });
    await db.storyEntry.deleteMany({ where: { id: { in: made } } });
    await db.storyRevision.deleteMany({ where: { entityId: { in: [...made, ...madeArcs] } } });
  }

  for (const row of results) console.log(`${row.ok ? "ok  " : "FAIL"}  ${row.what}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${results.length - failed}/${results.length} connections readable from both ends`);
  if (failed > 0) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (e) => { console.error(e); return db.$disconnect().then(() => process.exit(1)); });
