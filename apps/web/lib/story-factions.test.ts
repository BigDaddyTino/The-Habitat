import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isValidStoryKey, storyArcCategories, storyArcCategoryLabels } from "@habitat/shared";
import { bodyPatches, compactSeed, factionAssignments, factionMapRewrite, independentPowers, legionBodyPatch, majorPowers } from "./story-factions-seed";
import { factionMetaSchema } from "./story-meta-schemas";
import { brandedFactionSlugs } from "./faction-branding";

/**
 * The faction shelf has a spine: ten banners, the wings that fly beneath them,
 * and four powers that answer to nobody. These pin the shape of that filing —
 * not the taste of it. Which power a wing answers to is a canon judgment the
 * room makes and re-makes; that every wing answers to a real major, that no
 * wing is itself a banner, that every power is accounted for exactly once, and
 * that every filing carries the sentence it was read from are structural.
 */

const majors = new Set(majorPowers.map((row) => row.faction));
const independents = new Set(independentPowers.map((row) => row.faction));
const wings = new Set(factionAssignments.map((row) => row.faction));

test("every wing answers to a power that is actually a major", () => {
  for (const row of factionAssignments) {
    assert.ok(majors.has(row.parent), `${row.faction} answers to ${row.parent}, which is not in the majors list`);
    assert.notEqual(row.faction, row.parent, `${row.faction} cannot answer to itself`);
  }
});

test("the shelf is one rung deep, so a wing is never somebody else's banner", () => {
  // The library renders majors with their wings behind them and nothing
  // further. A wing filed under a wing would build a third rung that no
  // surface draws, and the navigator would roll it somewhere surprising.
  for (const row of factionAssignments) {
    assert.equal(wings.has(row.parent), false, `${row.parent} is a wing, so nothing may answer to it`);
  }
});

test("a power belongs to exactly one of the three classes", () => {
  for (const slug of wings) {
    assert.equal(majors.has(slug), false, `${slug} is listed as a wing and as a major`);
    assert.equal(independents.has(slug), false, `${slug} is listed as a wing and as answering to nobody`);
  }
  for (const slug of majors) {
    assert.equal(independents.has(slug), false, `${slug} is listed as a major and as answering to nobody`);
  }
});

test("every faction on the shelf is accounted for, one way or the other", () => {
  // A faction that is neither filed, nor flying its own banner, nor
  // deliberately left standing alone is one somebody forgot — which is the
  // state the whole shelf was in before this table.
  const all = [...wings, ...majors, ...independents];
  assert.equal(all.length, 35, `the shelf holds 35 powers; the table accounts for ${all.length}`);
  assert.equal(new Set(all).size, 35, "a slug appears twice in the table");
  assert.equal(wings.size, 21, "twenty-one wings");
  assert.equal(majors.size, 10, "ten banners");
  assert.equal(independents.size, 4, "four that answer to nobody");
  for (const slug of all) assert.ok(isValidStoryKey(slug), `${slug} is not a well-formed slug`);
});

test("no banner towers over the shelf on its own", () => {
  // Not a balance requirement — a sanity one. If a single major collected most
  // of the shelf, the library would be one enormous card and nine small ones,
  // which is the problem this restructuring exists to solve.
  const perMajor = new Map<string, number>();
  for (const row of factionAssignments) perMajor.set(row.parent, (perMajor.get(row.parent) ?? 0) + 1);
  const biggest = Math.max(...perMajor.values());
  assert.ok(biggest <= wings.size / 3, `one banner carries ${biggest} of ${wings.size} wings`);
});

test("every filing carries the sentence it was read from, and says how strongly", () => {
  for (const row of factionAssignments) {
    assert.ok(["CANON", "ALIGNED", "OWNER-CALL"].includes(row.tier), `${row.faction} has no valid tier`);
    assert.ok(row.because.length > 40, `${row.faction} needs the sentence it was read from, not an assertion`);
  }
  for (const row of [...majorPowers, ...independentPowers]) {
    assert.ok(row.because.length > 30, `${row.faction} needs a reason it stands where it does, so nobody re-litigates it blind`);
  }
});

test("every power in the table has art to show", () => {
  // Branding is keyed on slug and exhaustive over the shelf. A filing that
  // renamed or invented a power would silently lose its accent, key art, and
  // logo — no error, just an unbranded card beside thirty-four branded ones.
  const branded = new Set<string>(brandedFactionSlugs);
  for (const slug of [...wings, ...majors, ...independents]) assert.ok(branded.has(slug), `${slug} has no faction branding`);
});

test("the sheet carries a banner and a placeholder strength, and refuses a row without them", () => {
  const sheet = { scope: null, parent: null, power: null, seat: null, leaders: [], relations: [], goals: [], gameTag: null, openQuestions: [] };
  assert.equal(factionMetaSchema.safeParse(sheet).success, true);
  assert.equal(factionMetaSchema.safeParse({ ...sheet, parent: "national-defense-directorate", power: 40 }).success, true);
  assert.equal(factionMetaSchema.safeParse({ ...sheet, power: -1 }).success, false, "strength is never negative");
  assert.equal(factionMetaSchema.safeParse({ ...sheet, parent: "The Directorate" }).success, false, "a banner is a slug, never a name");

  // The meta law: every key the schema knows is required with no default, so a
  // stored row missing one is refused whole rather than saved without it.
  for (const missing of ["parent", "power"] as const) {
    const partial: Record<string, unknown> = { ...sheet };
    delete partial[missing];
    assert.equal(factionMetaSchema.safeParse(partial).success, false, `omitting ${missing} must be refused, never silently defaulted`);
  }
});

test("the Compact is written the way every other faction is written", () => {
  // The one power this restructuring invents has to arrive in the house
  // format, or the shelf gains an entry that reads as a seed instead of canon.
  assert.equal(compactSeed.slug, "the-free-peoples-compact");
  assert.ok(isValidStoryKey(compactSeed.slug));
  assert.ok(compactSeed.summary.length < 500, "the summary column is 500 characters wide");
  const paragraphs = compactSeed.body.split("\n\n");
  assert.equal(paragraphs.length, 4, "four paragraphs, like every other faction dossier");
  assert.match(paragraphs[2], /^Characters to write here: /, "the third paragraph is the casting note");
  assert.match(paragraphs[3], /^Where they stand on the Drain: /, "and the last word is on the Drain");
  assert.equal(factionMetaSchema.safeParse(compactSeed.meta).success, true, "its sheet must validate through the schema that edits it");
  assert.equal(compactSeed.meta.parent, null, "the Compact is a banner, not a wing");

  // The five peoples are filed to it, and the body names all five.
  const peoples = factionAssignments.filter((row) => row.parent === compactSeed.slug).map((row) => row.faction);
  assert.equal(peoples.length, 5, "five peoples signed");
  assert.ok(peoples.includes("drifter-renegade-camps"), "the camps that signed are the fifth people");
  for (const slug of peoples) assert.ok(compactSeed.body.includes(`[[${slug}]]`), `the Compact's own prose never names ${slug}`);
});

test("each faction's own dossier records what the filing means, in its own voice", () => {
  for (const patch of bodyPatches) {
    assert.ok(isValidStoryKey(patch.slug), `${patch.slug} is not a well-formed slug`);
    assert.ok(
      wings.has(patch.slug) || majors.has(patch.slug) || independents.has(patch.slug),
      `${patch.slug} is patched but is not a power on the shelf`,
    );
    // The guard is what makes re-running the seed a no-op. If it is not a
    // substring of the paragraph it guards, the patch lands every single time.
    assert.ok(patch.paragraph.includes(patch.guard), `${patch.slug}'s guard does not appear in its own paragraph`);
    assert.ok(patch.guard.length > 20, `${patch.slug}'s guard is too short to be distinctive`);
    assert.ok(patch.note.length > 5, `${patch.slug}'s patch needs a note for the dry run to print`);
    assert.doesNotMatch(patch.paragraph, /\n\n/, `${patch.slug}'s patch must be one paragraph, not several`);
    assert.doesNotMatch(patch.paragraph, /^Where (they|it) stand/, `${patch.slug}'s patch would read as a second closing paragraph`);
  }
  assert.equal(new Set(bodyPatches.map((patch) => patch.slug)).size, bodyPatches.length, "a faction is patched twice");

  // Every wing whose banner is a judgment call has to say so somewhere in its
  // own prose; a breadcrumb with no explanation beneath it is the failure mode.
  for (const row of factionAssignments) {
    if (row.tier === "CANON") continue;
    assert.ok(bodyPatches.some((patch) => patch.slug === row.faction), `${row.faction} is filed on a judgment call with nothing written into its dossier`);
  }
});

test("a link supplies its own article, so no paragraph says \"the The Directorate\"", () => {
  // A [[link]] renders as the target's title, and almost every power on this
  // shelf is titled "The …". Writing "the [[national-defense-directorate]]"
  // therefore reads as "the The National Defense Directorate" on the page —
  // which is how forty-nine sites in the older prose already read. None of
  // the prose this table writes may add to that count.
  const written = [
    ...bodyPatches.map((patch) => [patch.slug, patch.paragraph] as const),
    [compactSeed.slug, compactSeed.body] as const,
    [factionMapRewrite.slug, `${factionMapRewrite.summary}\n${factionMapRewrite.body}`] as const,
  ];
  for (const [slug, prose] of written) {
    const doubled = [...prose.matchAll(/\b[Tt]he (\[\[[a-z0-9-]+\]\])/g)].map((match) => match[0]);
    assert.deepEqual(doubled, [], `${slug} puts an article in front of a link that carries its own`);
  }
});

test("the map carries the law, the whole tree, and fits the summary column", () => {
  assert.equal(factionMapRewrite.slug, "the-faction-map");
  assert.ok(factionMapRewrite.summary.length < 500, "the summary column is 500 characters wide");
  assert.match(factionMapRewrite.summary, /thirty-six powers/, "thirty-five named, plus the seat left open");
  assert.match(factionMapRewrite.body, /\*\*Major does not mean important\.\*\*/, "the law leads the map");
  assert.match(factionMapRewrite.body, /political ecosystem, not a chain of command/, "and says what the tree is not");
  assert.match(factionMapRewrite.body, /\[\[the-long-game\]\]/, "the open seat cites where it is unlocked");

  // Every power on the shelf is reachable from the map, majors included — the
  // map is the entry the connection web hangs the whole faction shelf from.
  for (const slug of [...wings, ...majors, ...independents]) {
    assert.ok(factionMapRewrite.body.includes(`[[${slug}]]`), `the map never links ${slug}`);
  }
  // And the guard is what the OLD body carries, not the new one — otherwise the
  // rewrite would refuse to run, or run forever.
  assert.equal(factionMapRewrite.body.includes(factionMapRewrite.guard), false, "the rewrite's guard must not survive into the rewritten body");
});

test("the Legion's open question is answered, in its own voice", () => {
  assert.notEqual(legionBodyPatch.from, legionBodyPatch.to);
  assert.match(legionBodyPatch.from, /unwritten/, "the sentence being replaced is the one that left it open");
  assert.doesNotMatch(legionBodyPatch.to, /unwritten/, "the replacement must not still call it unwritten");
  assert.match(legionBodyPatch.to, /instrument/, "the decision was that the Legion is the Court's instrument");
  assert.equal(factionAssignments.find((row) => row.faction === legionBodyPatch.slug)?.parent, "the-ashen-court", "and the filing has to agree with the prose");
});

test("a faction quest is a category filed to a faction, everywhere an arc is written", () => {
  assert.ok(storyArcCategories.includes("FACTION_QUEST"));
  assert.equal(storyArcCategoryLabels.FACTION_QUEST, "Faction quest");

  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  assert.match(actions, /if \(arc\.category === "FACTION_QUEST" && !arc\.factionEntryId\)/, "a faction quest with no faction must be refused");
  assert.match(actions, /async function assertFactionEntry/, "and the faction must resolve to a real bible entry");
  assert.match(actions, /faction\.kind !== "FACTION"/, "of the right kind");
  for (const action of ["createArc", "updateArc"]) {
    const body = actions.slice(actions.indexOf(`export async function ${action}(`), actions.indexOf(`export async function ${action}(`) + 3000);
    assert.match(body, /await assertFactionEntry\(tx, parsed\.data\.factionEntryId\)/, `${action} must check the banner inside its transaction`);
  }
});

test("canon material aimed at a banner is readable from the banner's end too", () => {
  // A packet destination is a slug-typed field, so it owes the same three
  // duties every other one does: the dossier shows it, the link walker
  // follows it, and the needs-work pass reports it when it points nowhere.
  // targetFaction shipped writing-only, and the connections audit caught it.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  assert.ok(codex.includes("referencesSlug(row.targetCompanion) || referencesSlug(row.targetFaction)"), "the banner's dossier must show the packet aimed at it");
  assert.ok(codex.includes("[row.targetRegion, row.targetCompanion, row.targetFaction]"), "and the link walker must follow it");
  assert.ok(codex.includes('check("canon packet banner", row.targetFaction)'), "and a packet aimed at nothing must be reported");
});

test("a wing's quest rolls up to the power above it, named by the wing", () => {
  // The room tracks majors, so a major's page and the sidebar have to show
  // what is flying beneath it — labelled, never absorbed.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  assert.match(codex, /answers to this power/, "a wing must read on its banner's dossier");
  assert.match(codex, /const bannerOver = \(slug: string\) => \{/, "the navigator climbs to the top-most banner");
  assert.match(codex, /while \(current && !seen\.has\(current\.slug\)\)/, "and the climb carries a seen-set, because the field is writer-editable");
  assert.match(codex, /via: \(arc\.factionEntryId && bannerIds\.get\(arc\.factionEntryId\)\) \|\| null/, "a rolled-up quest keeps the wing it came through");
});
