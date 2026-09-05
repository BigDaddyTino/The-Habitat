import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { auditWorldConnections } from "../lib/story-world-connections";

/**
 * The world-connection pass of 2026-09-05 — the mechanical half of the audit
 * in scripts/audit-world-connections.ts, applied.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-world-connections-pass.ts [--apply]
 *
 * What it fixes, and why each is mechanical rather than authorial:
 *
 * 1. THE VEIL. Owner ruling: there is no Veil Anchor on the Peninsula or on
 *    Ignit Island. The Veil Anchors system carried region notes for both and
 *    none for the Outfall — the first Anchor on the map, Tier I on its own
 *    sheet since the Riverlands landed. The two wrong notes come off; the
 *    Outfall and the Riverlands go on, with the Veil frame, Expeditions and
 *    Incursions each noting the place the Outfall's own dossier already
 *    gives them.
 *
 * 2. ROADS. A region connection is a physical fact with two ends. Every
 *    connection only one region lists gets its reciprocal on the other, same
 *    means of travel, same note — the note describes the route, not a side.
 *    The one directional route (the deployment pod to Ignit Island) says so.
 *
 * 3. STANCES. A faction relation with a symmetric stance — ally, rival, enemy
 *    — is mirrored with that stance and no note. Client, unknown and unstated
 *    stances are NOT mirrored: the other side's stance is a ruling, not a
 *    reflection, and stays in the audit for the owner.
 *
 * 4. LEADERS. A faction's named leader is a member of it. Kane is Arcadia's
 *    Chancellor; his sheet says so now.
 *
 * 5. EVENTS. A character whose ledger says they were at an event is in that
 *    event's cast.
 *
 * 6. ASIS. The Radiant Path's relations named the ASIS building (a place) as
 *    a faction. ASIS is the Nation-State's intelligence arm, and the Path
 *    already holds a stance toward the Nation-State — the ASIS note folds
 *    into that row, every word kept.
 *
 * Character relationships and character involvement ledgers are left alone:
 * both are prose from one character's point of view, and the other side's
 * words are the owner's to write.
 *
 * Idempotent: re-running plans nothing once applied. Meta is validated
 * against the sheet schema before any write and written as the merged raw
 * object, so server-owned keys survive.
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const PASS = "World-connection pass (2026-09-05)";
/** StoryRevision.summary is VarChar(300); a sheet touched by many fixes is trimmed, never rejected. */
const revisionSummary = (reasons: string[]) => {
  const full = `${PASS}: ${reasons.join("; ")}. Sheet fields only — no prose changed.`;
  return full.length <= 300 ? full : `${full.slice(0, 299)}…`;
};

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.filter((row): row is Row => typeof row === "object" && row !== null) : []);
const slug = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

const veilNotes: Array<{ system: string; region: string; note: string }> = [
  { system: "veil-anchors", region: "the-outfall", note: "The first Anchor anyone can reach: Tier I, at the far end of the watershed's ancient works, in wild fen past Heartland's last levee. Meridian's unflagged survey camp got there first. No activation on record." },
  { system: "veil-anchors", region: "riverlands", note: "Holds the first Anchor on the map, at the Outfall — remote by design, a hard wet distance from the wharves, so the region keeps an open door without its safe hub paying for it." },
  { system: "the-veil", region: "riverlands", note: "Where the Veil first enters the campaign: the Outfall's Tier I Anchor is the region's open door, and the tutorial for the Veil's one law — nothing crossed for is yours until it crosses home." },
  { system: "veil-expeditions", region: "the-outfall", note: "Expeditions begin here for the Riverlands. Tier I resolves introductory, low-threat Shards; which Shard the first Crossing opens is future design — the tier only promises the threat band." },
  { system: "veil-incursions", region: "the-outfall", note: "An Incursion through the Outfall arrives in empty fen, a hard wet distance from Heartland's wharves — the placement doctrine in practice, and why the region's safe hub stays safe with the door open." },
];
/** Owner ruling 2026-09-05: no Anchor on the Peninsula or Ignit Island. */
const veilNotesToDrop = [{ system: "veil-anchors", region: "the-starting-island" }, { system: "veil-anchors", region: "the-peninsula" }];
const symmetricStances = new Set(["ally", "rival", "enemy"]);
const leaderRoles: Record<string, string> = { "abraham-islay-kane": "Chancellor" };
/** Routes that genuinely run one way get a reciprocal that says so. */
const directionalNotes: Record<string, string> = {
  "stormglass-recruitment-camp>the-starting-island": "Arrivals only. The pods are disposable, and nothing rides one back.",
};

async function main() {
  const identity = await db.$queryRawUnsafe<Array<{ database: string }>>("select current_database() as database");
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const entries = await db.storyEntry.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { id: true, slug: true, kind: true, title: true, meta: true } });
  const arcs = await db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } });
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const before = auditWorldConnections(entries, arcs);

  // Every change is staged as "this entry's meta becomes X, because Y", then
  // validated and written in one pass, so a single entry touched by several
  // fixes gets one revision naming all of them.
  const staged = new Map<string, { meta: Row; reasons: string[] }>();
  const metaFor = (entrySlug: string): Row => {
    const current = staged.get(entrySlug)?.meta ?? ((bySlug.get(entrySlug)?.meta ?? {}) as Row);
    return { ...current };
  };
  const stage = (entrySlug: string, meta: Row, reason: string) => {
    const existing = staged.get(entrySlug);
    staged.set(entrySlug, { meta, reasons: [...(existing?.reasons ?? []), reason] });
  };

  // 1. The Veil.
  for (const drop of veilNotesToDrop) {
    const meta = metaFor(drop.system);
    const notes = rows(meta.regionNotes);
    if (!notes.some((row) => slug(row.region) === drop.region)) continue;
    stage(drop.system, { ...meta, regionNotes: notes.filter((row) => slug(row.region) !== drop.region) }, `removed the ${drop.region} region note — owner ruling: no Veil Anchor there`);
  }
  for (const add of veilNotes) {
    const meta = metaFor(add.system);
    const notes = rows(meta.regionNotes);
    if (notes.some((row) => slug(row.region) === add.region)) continue;
    stage(add.system, { ...meta, regionNotes: [...notes, { region: add.region, note: add.note }] }, `added the ${add.region} region note`);
  }

  // 2. Roads.
  for (const entry of entries) {
    if (entry.kind !== "REGION") continue;
    for (const row of rows((entry.meta as Row | null)?.connections)) {
      const to = slug(row.to);
      const other = to ? bySlug.get(to) : null;
      if (!other || other.kind !== "REGION") continue;
      const otherMeta = metaFor(other.slug);
      const back = rows(otherMeta.connections);
      if (back.some((candidate) => slug(candidate.to) === entry.slug)) continue;
      const key = `${entry.slug}>${other.slug}`;
      stage(other.slug, { ...otherMeta, connections: [...back, { to: entry.slug, by: slug(row.by), notes: directionalNotes[key] ?? slug(row.notes) }] }, `connects back to ${entry.slug}${slug(row.by) ? ` by ${slug(row.by)}` : ""}`);
    }
  }

  // 3. Stances, and 6. ASIS.
  for (const entry of entries) {
    if (entry.kind !== "FACTION") continue;
    let relations = rows(metaFor(entry.slug).relations);
    const asis = relations.find((row) => slug(row.faction) === "arcadian-special-intelligence-service");
    if (asis && bySlug.get("arcadian-special-intelligence-service")?.kind === "REGION") {
      const state = relations.find((row) => slug(row.faction) === "the-nation-state-of-arcadia");
      const note = slug(asis.notes);
      relations = relations.filter((row) => row !== asis).map((row) => row === state && note ? { ...row, notes: [slug(row.notes), note].filter(Boolean).join(" ") } : row);
      if (!state && note) relations.push({ faction: "the-nation-state-of-arcadia", stance: slug(asis.stance), notes: note });
      stage(entry.slug, { ...metaFor(entry.slug), relations }, "the ASIS relation named a place, not a faction — folded into the Nation-State of Arcadia row, note kept");
    }
    for (const row of relations) {
      const stance = slug(row.stance);
      const other = slug(row.faction) ? bySlug.get(slug(row.faction)!) : null;
      if (!other || other.kind !== "FACTION" || !stance || !symmetricStances.has(stance)) continue;
      const otherMeta = metaFor(other.slug);
      const back = rows(otherMeta.relations);
      if (back.some((candidate) => slug(candidate.faction) === entry.slug)) continue;
      stage(other.slug, { ...otherMeta, relations: [...back, { faction: entry.slug, stance, notes: null }] }, `mirrors ${entry.slug}'s ${stance} stance`);
    }
  }

  // 4. Leaders.
  for (const entry of entries) {
    if (entry.kind !== "FACTION") continue;
    for (const leader of Array.isArray((entry.meta as Row | null)?.leaders) ? ((entry.meta as Row).leaders as unknown[]) : []) {
      const character = slug(leader) ? bySlug.get(slug(leader)!) : null;
      if (!character || character.kind !== "CHARACTER") continue;
      const characterMeta = metaFor(character.slug);
      const memberships = rows(characterMeta.factions);
      if (memberships.some((row) => slug(row.faction) === entry.slug)) continue;
      stage(character.slug, { ...characterMeta, factions: [...memberships, { faction: entry.slug, role: leaderRoles[character.slug] ?? "Leader", standing: null }] }, `is a member of ${entry.slug}, which names them as a leader`);
    }
  }

  // 5. Events.
  for (const entry of entries) {
    if (entry.kind !== "CHARACTER") continue;
    for (const row of rows((entry.meta as Row | null)?.involvement)) {
      if (row.kind !== "EVENT") continue;
      const ref = slug(row.ref) ?? slug(row.arc);
      const event = ref ? bySlug.get(ref) : null;
      if (!event || event.kind !== "EVENT") continue;
      const eventMeta = metaFor(event.slug);
      const involved = Array.isArray(eventMeta.involved) ? (eventMeta.involved as unknown[]).filter((value): value is string => typeof value === "string") : [];
      if (involved.includes(entry.slug)) continue;
      stage(event.slug, { ...eventMeta, involved: [...involved, entry.slug] }, `names ${entry.slug} as involved — their own ledger already said so`);
    }
  }

  // Validate every staged sheet against its schema before touching a row.
  const plan: string[] = [];
  const invalid: string[] = [];
  for (const [entrySlug, change] of staged) {
    const entry = bySlug.get(entrySlug)!;
    const schema = metaSchemasByKind[entry.kind as keyof typeof metaSchemasByKind];
    const parsed = schema ? schema.safeParse(change.meta) : { success: true as const };
    if (!parsed.success) { invalid.push(`${entrySlug}: ${JSON.stringify((parsed as { error: { issues: unknown } }).error.issues)}`); continue; }
    plan.push(`${entry.kind} ${entrySlug}\n    - ${change.reasons.join("\n    - ")}`);
  }
  if (invalid.length) {
    console.error("Refusing to write — these sheets would not validate:\n" + invalid.join("\n"));
    process.exitCode = 2;
    return;
  }

  const after = auditWorldConnections(entries.map((entry) => staged.has(entry.slug) ? { ...entry, meta: staged.get(entry.slug)!.meta } : entry), arcs);
  console.log(`${identity[0]?.database} — ${apply ? "APPLY" : "PREVIEW"} — ${staged.size} entr${staged.size === 1 ? "y" : "ies"} to update`);
  console.log(`audit before: ${before.defects} defects, ${before.gaps} gaps, ${before.notes} notes`);
  console.log(`audit after:  ${after.defects} defects, ${after.gaps} gaps, ${after.notes} notes`);
  console.log(plan.length ? plan.join("\n") : "nothing to do");

  if (!apply) return;
  for (const [entrySlug, change] of staged) {
    const entry = bySlug.get(entrySlug)!;
    await db.$transaction([
      db.storyEntry.update({ where: { id: entry.id }, data: { meta: change.meta as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } }),
      db.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: revisionSummary(change.reasons) } }),
    ]);
  }
  console.log(`applied ${staged.size} update${staged.size === 1 ? "" : "s"}`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
