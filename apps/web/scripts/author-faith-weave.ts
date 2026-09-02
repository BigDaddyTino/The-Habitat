import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { characterMetaSchema, factionMetaSchema, systemMetaSchema } from "../lib/story-meta-schemas";
import { FACTION_MARKER, FACTION_SECTIONS, FAITH_MARKER, FAITH_SECTIONS, LANE_MARKER, LANE_SECTION, NEW_CHARACTERS, NEW_FACTION, REGION_MARKER, REGION_SECTIONS, STANCES } from "./lib/faith-weave-content";

/**
 * The faith weave — religion integrated into the world (owner order,
 * 2026-09-02). Six steps, every one idempotent and every one marker-append
 * or field-fill, so no prior word is touched and a rerun is zero changes:
 *
 *   1. New entries: FACTION the-congregation-of-the-bound (Institution · Faith),
 *      CHARACTERs the Sexton of Heartland, the Wellkeeper of Honest Well, the
 *      Grand Advocate (reserved). Created only if absent.
 *   2. The faith field on every faction: filled where null; a differing
 *      hand-set value is reported and left alone.
 *   3. "## Faith" appended to faction dossiers (own marker, replace-from-marker).
 *   4. "## Keepers, ground and teachers" appended to the five faith entries,
 *      and their regionNotes set to the planned rows.
 *   5. "## Who keeps what" appended to the-faith-lane.
 *   6. "## What is kept here" appended to the places where a faith is practised.
 *
 * Every [[link]] in every section is checked against the database (plus the
 * entries this script creates) before anything is written. Balance law: no
 * parent-tree edits, no new Great Power, no points.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-faith-weave.ts [--apply]
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

function appendUnder(body: string, marker: string, section: string) {
  const at = body.indexOf(marker);
  const preserved = at === -1 ? body : body.slice(0, at).trimEnd();
  const next = `${preserved}\n\n${section}`;
  if (!next.startsWith(preserved)) throw new Error("append invariant violated");
  return { next, changed: next !== body, refreshed: at !== -1 };
}

const stableJson = (value: unknown): string => JSON.stringify(value, (_key, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort()) : v));

async function main() {
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const plan: string[] = [];
  const problems: string[] = [];

  // ── Link check across everything the pass writes ─────────────────────────
  const planned = new Set([NEW_FACTION.slug, ...NEW_CHARACTERS.map((c) => c.slug)]);
  const texts: Array<[string, string]> = [
    ...Object.entries(FACTION_SECTIONS),
    ...Object.entries(FAITH_SECTIONS).map(([slug, f]) => [slug, f.section] as [string, string]),
    ["the-faith-lane", LANE_SECTION],
    ...Object.entries(REGION_SECTIONS),
    [NEW_FACTION.slug, NEW_FACTION.body],
    ...NEW_CHARACTERS.map((c) => [c.slug, c.body] as [string, string]),
  ];
  const wanted = new Set<string>();
  for (const [, text] of texts) for (const match of text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) wanted.add(match[1]!);
  for (const f of Object.values(FAITH_SECTIONS)) for (const row of f.regionNotes) wanted.add(row.region);
  for (const value of Object.values(STANCES)) if (value && /^[a-z0-9-]+$/.test(value)) wanted.add(value);
  const existing = new Set((await db.storyEntry.findMany({ where: { slug: { in: [...wanted] } }, select: { slug: true } })).map((e) => e.slug));
  for (const slug of wanted) if (!existing.has(slug) && !planned.has(slug)) problems.push(`dead link or slug: ${slug}`);
  for (const [owner, text] of texts) {
    for (const match of text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) if (!existing.has(match[1]!) && !planned.has(match[1]!)) problems.push(`${owner}: [[${match[1]}]]`);
  }
  // Every faction that gets a stance or a section must exist.
  const factionSlugs = new Set((await db.storyEntry.findMany({ where: { kind: "FACTION" }, select: { slug: true } })).map((e) => e.slug));
  for (const slug of [...Object.keys(STANCES), ...Object.keys(FACTION_SECTIONS)]) if (!factionSlugs.has(slug) && !planned.has(slug)) problems.push(`no such faction: ${slug}`);
  const unfiled = [...factionSlugs].filter((slug) => !(slug in STANCES));
  if (unfiled.length) problems.push(`factions with no stance ruled: ${unfiled.join(", ")}`);

  // Schema checks on the new metas.
  const factionParsed = factionMetaSchema.safeParse(NEW_FACTION.meta);
  if (!factionParsed.success) problems.push(`${NEW_FACTION.slug} meta: ${factionParsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  for (const character of NEW_CHARACTERS) {
    const parsed = characterMetaSchema.safeParse(character.meta);
    if (!parsed.success) problems.push(`${character.slug} meta: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  const revise = async (entityId: string, action: "CREATED" | "UPDATED", summary: string) => {
    await db.storyRevision.create({ data: { entityType: "ENTRY", entityId, action, actorUserId: actor.id, summary } });
  };

  // ── 1. New entries ───────────────────────────────────────────────────────
  const seeds = [
    { kind: "FACTION" as const, ...NEW_FACTION },
    ...NEW_CHARACTERS.map((c) => ({ kind: "CHARACTER" as const, ...c })),
  ];
  for (const seed of seeds) {
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    if (current) continue;
    plan.push(`create ${seed.kind} ${seed.slug}`);
    if (!apply) continue;
    const created = await db.storyEntry.create({ data: {
      kind: seed.kind, slug: seed.slug, title: seed.title, summary: seed.summary, body: seed.body,
      meta: seed.meta as Prisma.InputJsonValue, status: seed.status, createdByUserId: actor.id,
    } });
    await revise(created.id, "CREATED", "Faith weave: created (religion integrated into the world, 2026-09-02).");
  }

  // ── 2. Stances ───────────────────────────────────────────────────────────
  for (const [slug, faith] of Object.entries(STANCES)) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, meta: true } });
    if (!entry) { if (!apply) plan.push(`(stance for ${slug} lands after create)`); continue; }
    const meta = entry.meta as Record<string, unknown>;
    const current = typeof meta.faith === "string" ? meta.faith : null;
    if (current === faith) continue;
    if (current !== null) { plan.push(`KEEP hand-set faith on ${slug}: "${current}" (ruling was "${faith}")`); continue; }
    if (faith === null) continue;
    plan.push(`faith on ${slug} -> ${faith}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { meta: { ...meta, faith } as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
    await revise(entry.id, "UPDATED", `Faith weave: faith -> ${faith}.`);
  }

  // ── 3–6. Appended sections ───────────────────────────────────────────────
  const sectionJobs: Array<{ slug: string; marker: string; section: string; label: string }> = [
    ...Object.entries(FACTION_SECTIONS).map(([slug, section]) => ({ slug, marker: FACTION_MARKER, section, label: "faith section" })),
    ...Object.entries(FAITH_SECTIONS).map(([slug, f]) => ({ slug, marker: FAITH_MARKER, section: f.section, label: "keepers section" })),
    { slug: "the-faith-lane", marker: LANE_MARKER, section: LANE_SECTION, label: "who-keeps-what section" },
    ...Object.entries(REGION_SECTIONS).map(([slug, section]) => ({ slug, marker: REGION_MARKER, section, label: "what-is-kept-here section" })),
  ];
  for (const job of sectionJobs) {
    const entry = await db.storyEntry.findUnique({ where: { slug: job.slug }, select: { id: true, body: true } });
    if (!entry) { if (!apply) plan.push(`(${job.label} on ${job.slug} lands after create)`); else plan.push(`MISSING ${job.slug}`); continue; }
    const { next, changed, refreshed } = appendUnder(entry.body ?? "", job.marker, job.section);
    if (!changed) continue;
    plan.push(`${refreshed ? "refresh" : "append"} ${job.label} on ${job.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: actor.id } });
    await revise(entry.id, "UPDATED", `Faith weave: ${refreshed ? "refreshed" : "appended"} the ${job.label} (own marker; no prior words changed).`);
  }

  // ── 4b. regionNotes on the faith entries ─────────────────────────────────
  for (const [slug, f] of Object.entries(FAITH_SECTIONS)) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, meta: true } });
    if (!entry) continue;
    const meta = entry.meta as Record<string, unknown>;
    if (stableJson(meta.regionNotes ?? []) === stableJson(f.regionNotes)) continue;
    const nextMeta = { ...meta, regionNotes: f.regionNotes };
    const parsed = systemMetaSchema.safeParse(nextMeta);
    if (!parsed.success) { plan.push(`INVALID regionNotes on ${slug}: ${parsed.error.issues.map((i) => i.message).join("; ")}`); continue; }
    plan.push(`regionNotes on ${slug}: ${f.regionNotes.length} rows`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { meta: nextMeta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
    await revise(entry.id, "UPDATED", "Faith weave: regionNotes set to the places where the faith is kept.");
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
