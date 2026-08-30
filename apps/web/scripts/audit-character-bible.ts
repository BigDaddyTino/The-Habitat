import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { metaSchemasByKind } from "../lib/story-meta-schemas";

/**
 * The audit that has to pass after the character bible was woven in.
 *
 * Four questions, asked of the database rather than of the scripts that wrote
 * it — an integration that checks its own intentions checks nothing:
 *
 *  1. Does every entry the pass created or touched exist, with a valid sheet?
 *  2. Does every world connection resolve — every [[wikilink]] in a new body,
 *     and every slug-typed meta field pointing out of one?
 *  3. Is anything an orphan: written, but with nothing in the world pointing
 *     back at it? A one-way edge is the shape of bug that let the races shelf
 *     exist with nothing linking into it.
 *  4. Which of them has no key art, and where does the file go?
 *
 * Question four writes `Docs/MARTINO_CHARACTER_BIBLE_ART.md` — the art
 * manifest — so an empty slot is a recorded, addressed placeholder rather than
 * a blank space somebody notices later.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-character-bible.ts
 *   pnpm --filter @habitat/web exec tsx scripts/audit-character-bible.ts --write-art-manifest
 */
const db = getPrismaClient();
const writeManifest = process.argv.includes("--write-art-manifest");

/** Everything this pass created, in the order it was written. */
const created = {
  SYSTEM: ["enlistment", "attributes", "skills", "the-six-pillars", "thermodynamics", "kinetics", "structure", "biologics", "cognition", "resonance", "kit", "cybernetics", "suspicion", "the-wound-model"],
  CREATURE: ["returnees", "carriers", "chartered", "the-unregistered", "the-latent"],
  ITEM: ["shattermarket-plate", "tempest-shell-case", "the-southside-rifle", "ansels-sample-case", "choir-ledger-page", "the-single-name"],
  CHARACTER: ["the-kestrel-medic", "the-kestrel-mechanic", "the-kestrel-quartermaster", "the-kestrel-scout", "the-tempest-battery-officer", "the-range-instructor", "the-drill-master", "the-blast-foreman", "the-bureau-analyst", "the-captured-rider", "the-ashline-fixer", "the-infuser-tech", "the-clinic-surgeon", "the-asis-officer", "the-paper-hand", "the-foundry-master"],
} as const;

/** Everything this pass appended to or amended, which must still be intact. */
const touched = [
  "character-progression", "character-classes", "magic", "professions", "the-corruption-system",
  "survival", "companions", "environment", "combat", "battle-management", "reclamation", "lasting-wounds",
  "the-three-origins-of-magic", "the-taxonomy-of-monsters", "port-arcadia", "humanoid", "hippogriff", "the-docks",
];

/** Where key art goes, per kind, using the same convention the app resolves. */
const artSlot = (kind: string, slug: string) => {
  const directory = kind === "SYSTEM" ? "systems" : kind === "CREATURE" ? "races" : kind === "ITEM" ? "items" : "characters";
  return `apps/web/private/codex-art/${directory}/${slug}.png`;
};
const hasArt = (kind: string, slug: string) => {
  const directory = kind === "SYSTEM" ? "systems" : kind === "CREATURE" ? "races" : kind === "ITEM" ? "items" : "characters";
  return ["png", "jpg", "jpeg", "webp"].some((extension) => existsSync(join(process.cwd(), "private", "codex-art", directory, `${slug}.${extension}`)));
};

type Fail = { check: string; detail: string };
const failures: Fail[] = [];
const fail = (check: string, detail: string) => failures.push({ check, detail });

/** Every slug-typed field on every sheet, so a reference cannot hide in one. */
function slugRefs(kind: string, meta: Record<string, unknown>): string[] {
  const out: string[] = [];
  const push = (value: unknown) => { if (typeof value === "string" && value.trim()) out.push(value.trim()); };
  const list = (value: unknown) => { if (Array.isArray(value)) value.forEach(push); };
  if (kind === "SYSTEM") { push(meta.parent); list(meta.dependsOn); (Array.isArray(meta.regionNotes) ? meta.regionNotes : []).forEach((row) => push((row as Record<string, unknown>).region)); }
  if (kind === "CREATURE") { push(meta.parent); list(meta.biomes); }
  if (kind === "ITEM") push(meta.origin);
  if (kind === "REGION") { push(meta.parent); (Array.isArray(meta.connections) ? meta.connections : []).forEach((row) => push((row as Record<string, unknown>).to)); (Array.isArray(meta.control) ? meta.control : []).forEach((row) => push((row as Record<string, unknown>).faction)); }
  if (kind === "CHARACTER") {
    push(meta.home); push(meta.species);
    (Array.isArray(meta.factions) ? meta.factions : []).forEach((row) => push((row as Record<string, unknown>).faction));
    (Array.isArray(meta.relationships) ? meta.relationships : []).forEach((row) => push((row as Record<string, unknown>).character));
  }
  return out;
}

async function main() {
  const rows = await db.storyEntry.findMany({ select: { slug: true, kind: true, title: true, status: true, body: true, summary: true, meta: true } });
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  // A prose link resolves against the bible first and the quest boards second —
  // the profile page falls through to /codex/arc for exactly this reason — so an
  // arc slug in a body is a resolved link, not a broken one.
  const arcs = await db.storyArc.findMany({ select: { slug: true } });
  const known = new Set([...rows.map((row) => row.slug), ...arcs.map((arc) => arc.slug)]);
  const allCreated = Object.entries(created).flatMap(([kind, slugs]) => slugs.map((slug) => ({ kind, slug })));
  const createdSlugs = new Set<string>(allCreated.map((row) => row.slug));

  // 1 — everything landed, with a valid sheet
  console.log("1 · Every entry landed, with a sheet its own schema accepts");
  for (const { kind, slug } of allCreated) {
    const row = bySlug.get(slug);
    if (!row) { fail("landed", `${kind} ${slug} is missing`); continue; }
    if (row.kind !== kind) fail("landed", `${slug} is a ${row.kind}, not a ${kind}`);
    if (!row.body || row.body.length < 400) fail("landed", `${slug} has a body of ${row.body?.length ?? 0} characters`);
    if (!row.summary) fail("landed", `${slug} has no summary`);
    const schema = metaSchemasByKind[row.kind as keyof typeof metaSchemasByKind];
    if (schema && !(schema as { safeParse: (value: unknown) => { success: boolean } }).safeParse(row.meta).success) fail("sheet", `${slug} has a sheet its schema rejects`);
  }
  for (const slug of touched) {
    const row = bySlug.get(slug);
    if (!row) { fail("touched", `${slug} is missing`); continue; }
    if (!row.body) fail("touched", `${slug} lost its body`);
  }
  console.log(`   ${allCreated.length} created, ${touched.length} touched, ${failures.length} problem${failures.length === 1 ? "" : "s"} so far.`);

  // 2 — every world connection resolves
  console.log("\n2 · Every world connection resolves");
  let links = 0, refs = 0;
  const audited = [...allCreated.map((row) => row.slug), ...touched];
  for (const slug of audited) {
    const row = bySlug.get(slug);
    if (!row) continue;
    for (const match of (row.body ?? "").matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      links += 1;
      if (!known.has(match[1])) fail("wikilink", `${slug} -> [[${match[1]}]] does not exist`);
    }
    if (!createdSlugs.has(slug)) continue;
    for (const target of slugRefs(row.kind, (row.meta as Record<string, unknown>) ?? {})) {
      refs += 1;
      if (!known.has(target)) fail("meta reference", `${slug}.meta -> ${target} does not exist`);
    }
  }
  console.log(`   ${links} wikilinks and ${refs} slug-typed references checked across ${audited.length} entries.`);

  // 3 — nothing written into a corner
  console.log("\n3 · Nothing is an orphan — the world points back at every new entry");
  const inbound = new Map<string, string[]>();
  for (const row of rows) {
    const targets = new Set<string>();
    for (const match of (row.body ?? "").matchAll(/\[\[([a-z0-9-]+)\]\]/g)) targets.add(match[1]);
    for (const target of slugRefs(row.kind, (row.meta as Record<string, unknown>) ?? {})) targets.add(target);
    for (const target of targets) {
      if (target === row.slug) continue;
      inbound.set(target, [...(inbound.get(target) ?? []), row.slug]);
    }
  }
  for (const { kind, slug } of allCreated) {
    const from = inbound.get(slug) ?? [];
    if (from.length === 0) fail("orphan", `${kind} ${slug} — nothing in the codex links to it`);
  }
  const thin = allCreated.filter(({ slug }) => (inbound.get(slug) ?? []).length === 1);
  console.log(`   ${allCreated.length - thin.length} well-connected, ${thin.length} with a single inbound link${thin.length ? `: ${thin.map((row) => row.slug).join(", ")}` : ""}.`);

  // 4 — art placeholders, recorded
  console.log("\n4 · Key art — what exists, and where the missing files go");
  const needsArt = allCreated.filter(({ kind, slug }) => !hasArt(kind, slug));
  console.log(`   ${allCreated.length - needsArt.length} of ${allCreated.length} have key art; ${needsArt.length} slots are empty.`);
  if (writeManifest) {
    const groups = Object.entries(created).map(([kind, slugs]) => {
      const wanted = slugs.filter((slug) => !hasArt(kind, slug));
      const lines = wanted.map((slug) => {
        const row = bySlug.get(slug);
        return `| ${row?.title ?? slug} | \`${slug}\` | \`${artSlot(kind, slug)}\` | ${(row?.summary ?? "").replace(/\|/g, "—")} |`;
      });
      return { kind, wanted, lines };
    });
    const total = groups.reduce((sum, group) => sum + group.wanted.length, 0);
    const manifest = `# Character Bible — art manifest

Every entry the character-bible pass created that has no key art yet, and the
exact file that fills the slot. Key art is found by convention rather than a
map: drop a file named for the slug into the directory below and the card and
dossier wear it on the next reload. Nothing here blocks anything — an entry
without art shows an empty slot that names its own path.

Generated by \`scripts/audit-character-bible.ts --write-art-manifest\`. Re-run it
after dropping files in and the list shortens.

**${total} slots open.** Accepted extensions: \`png\`, \`jpg\`, \`jpeg\`, \`webp\`.
Art direction for all of them is \`the-look-of-the-world\` plus
\`Docs/BLOOMFALL_REACH_VISUAL_BIBLE.md\`: near-future fusion worn casually, no
fantasy register, no UI, no text in frame.

${groups.filter((group) => group.wanted.length).map((group) => `## ${group.kind} — ${group.wanted.length} open\n\n| Entry | Slug | File to drop | What it is |\n| --- | --- | --- | --- |\n${group.lines.join("\n")}`).join("\n\n")}

## Notes for whoever draws these

- **The six pillars** are a set. Whatever visual grammar the first one gets, the other five inherit — they are shelves in one registry, not six separate subjects.
- **The species** join a shelf that already has illustrated members (\`human\`, \`humanoid\`, \`beasts\`, \`mythical\`). Match that set, not the Bloomfall creature plates.
- **The named pieces** are objects with histories. The history is the subject: the hole in the plate, the spent case in a hand, the page torn out of a ledger.
- **The sixteen people** are all PROPOSED and carry placeholder names. Art commits a face to a person nobody has written a scene for yet, so these are the lowest-priority slots on this list, and the Kestrel command staff are the four worth doing first.
`;
    const path = join(process.cwd(), "..", "..", "Docs", "MARTINO_CHARACTER_BIBLE_ART.md");
    writeFileSync(path, manifest, "utf8");
    console.log(`   wrote Docs/MARTINO_CHARACTER_BIBLE_ART.md — ${total} open slots`);
  } else {
    for (const { kind, slug } of needsArt) console.log(`   ${artSlot(kind, slug)}`);
    console.log("\n   (--write-art-manifest records these in Docs/MARTINO_CHARACTER_BIBLE_ART.md)");
  }

  console.log("\n" + "=".repeat(70));
  if (failures.length === 0) {
    console.log("PASS — everything landed, every connection resolves, nothing is orphaned.");
  } else {
    console.log(`${failures.length} problem${failures.length === 1 ? "" : "s"}:`);
    for (const problem of failures) console.log(`  [${problem.check}] ${problem.detail}`);
    process.exitCode = 1;
  }
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
