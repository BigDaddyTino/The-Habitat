import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { attributes, backgrounds, ledgers, species } from "../lib/character-sheet";
import { skills } from "../lib/skills";
import { pillars, spells } from "../lib/spellbook";
import { spellsForClass, unresolvedSpellNodes } from "../lib/spell-unlocks";
import { cardForNode } from "../lib/talent-cards";
import { trainerSlugs } from "../lib/talent-trainers";
import { talentClasses } from "../lib/talent-trees";

/**
 * The Play section's connection audit: every link the character, classes,
 * talents, spells and skills pages generate must land somewhere real.
 *
 * Read-only. Checks, in order: every codex slug the pages link to exists
 * as a StoryEntry (teachers, pillars, species, the canon dossiers behind
 * each block); every spell-chip node resolves to a spell; every technique's
 * talentNode is a real node with a card; every class reaches at least one
 * spell or says so; and, with --live, that the deployed pages answer 200
 * as a member and print no error boundary.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-play-section.ts [--live]
 */
const live = process.argv.includes("--live");
const db = getPrismaClient();
const problems: string[] = [];
const notes: string[] = [];

async function main() {
  // ---- codex slugs the pages link to ---------------------------------
  const wanted = new Map<string, string>();
  const want = (slug: string | null | undefined, from: string) => { if (slug) wanted.set(slug, from); };
  for (const [text, slug] of Object.entries(trainerSlugs)) want(slug, `talent-trainers: ${text}`);
  for (const skill of skills) for (const technique of skill.techniques) want(technique.teacher?.slug, `skills: ${skill.name} · ${technique.name}`);
  for (const pillar of pillars) want(pillar.slug, `spellbook pillar ${pillar.name}`);
  for (const entry of species) want(entry.slug, `character-sheet species ${entry.name}`);
  for (const entry of ledgers) want(entry.slug, `character-sheet ledger ${entry.name}`);
  for (const slug of ["enlistment", "attributes", "skills", "the-six-pillars", "magic", "character-classes", "character-progression", "kit", "cybernetics", "the-corruption-system", "combat", "the-wound-model", "professions", "suspicion"]) want(slug, "page link");
  const rows = await db.storyEntry.findMany({ where: { slug: { in: [...wanted.keys()] } }, select: { slug: true, kind: true, status: true } });
  const found = new Map(rows.map((row) => [row.slug, row]));
  for (const [slug, from] of wanted) {
    if (!found.has(slug)) problems.push(`missing codex entry "${slug}" (linked from ${from})`);
  }
  const speciesRows = await db.storyEntry.findMany({ where: { kind: "CREATURE", slug: { in: species.map((entry) => entry.slug) } }, select: { slug: true } });
  notes.push(`${speciesRows.length}/${species.length} species link to a CREATURE dossier`);

  // ---- spells and nodes ------------------------------------------------
  if (unresolvedSpellNodes.length) problems.push(`spell nodes with no spell: ${unresolvedSpellNodes.join(", ")}`);
  for (const tree of talentClasses) {
    const chips = tree.branches.flatMap((branch) => branch.nodes.filter((node) => node.spell)).length;
    const reach = spellsForClass(tree.slug).length;
    notes.push(`${tree.name}: ${chips} spell nodes → ${reach} spells`);
    for (const branch of tree.branches) for (const node of branch.nodes) {
      const card = cardForNode(tree.slug, node.id);
      if (!card) { problems.push(`${tree.slug}/${node.id} has no card`); continue; }
      if (node.ceiling && !(node.ceiling in trainerSlugs)) problems.push(`${tree.slug}/${node.id} ceiling "${node.ceiling}" is not in talent-trainers`);
    }
  }
  const spellIds = new Set(spells.map((spell) => spell.id));
  for (const spell of spells) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spell.id)) problems.push(`spell id "${spell.id}" is not a slug (breaks the icon path and the #anchor)`);
  const ids = new Set(talentClasses.flatMap((tree) => tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}/${node.id}`))));
  for (const skill of skills) for (const technique of skill.techniques) {
    if (technique.talentNode && !ids.has(technique.talentNode)) problems.push(`${skill.name} · ${technique.name} links to missing node ${technique.talentNode}`);
  }
  notes.push(`${spellIds.size} spells, ${attributes.length} attributes, ${backgrounds.length} backgrounds`);

  // ---- the live pages ------------------------------------------------
  if (live) {
    const { randomUUID } = await import("node:crypto");
    const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    const token = randomUUID();
    await db.session.create({ data: { sessionToken: token, userId: admin.id, expires: new Date(Date.now() + 600_000) } });
    const site = process.env.AUDIT_SITE ?? "https://habitat.martinobear.com";
    try {
      const paths = ["/codex/character", "/codex/classes", ...talentClasses.map((tree) => `/codex/classes/${tree.slug}`), "/codex/talents", "/codex/spells", "/codex/skills"];
      for (const path of paths) {
        const response = await fetch(`${site}${path}`, { headers: { cookie: `__Secure-authjs.session-token=${token}` }, redirect: "manual" });
        const html = await response.text();
        const bad = response.status !== 200 || /Application error|Something went wrong|error-boundary/i.test(html);
        if (bad) problems.push(`${path} → ${response.status}${bad && response.status === 200 ? " with an error boundary in the body" : ""}`);
        else notes.push(`${path} 200 (${Math.round(html.length / 1024)} KB)`);
      }
    } finally {
      await db.session.delete({ where: { sessionToken: token } }).catch(() => {});
    }
  }

  for (const note of notes) console.log(`  · ${note}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.log(`  ✖ ${problem}`);
    process.exitCode = 1;
  } else {
    console.log(`\nPlay section: every connection resolves${live ? ", and the live pages answer" : ""}.`);
  }
  await db.$disconnect();
}

main().catch((error) => { console.error(error); process.exit(1); });
