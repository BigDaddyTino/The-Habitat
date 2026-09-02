import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalStoryEntryRouteSlug, LEGACY_NATION_MANAGEMENT_GAME_TAG_PREFIX, NATION_MANAGEMENT_GAME_TAG_PREFIX, NATION_MANAGEMENT_PERSISTED_SLUG, NATION_MANAGEMENT_ROUTE_SLUG, persistedStoryEntrySlug, storyEntrySlugAliases } from "@habitat/shared";
import { courtDay, courtSeats, crownRanks, faiths, groundVerbs, nationLevels, provings, realmPoints, realmTrees, riverlandsPlots, siegeLaw, standingLaws } from "./nation";
import { legacyNationTerminologySearchText, nationTerminologyStorageText, nationTerminologyStorageValue, nationTerminologyText, nationTerminologyValue } from "./nation-terminology";

test("the five Ranks of the Crown are the level system: fifteen levels, three a rank, a proving at every third", () => {
  assert.deepEqual(crownRanks.map((rank) => rank.title), ["Freeholder", "Warden", "Magistrate", "Lord", "Crown"]);
  assert.deepEqual(crownRanks.map((rank) => rank.realm), ["The Freehold", "The Ward", "The Township", "The City", "The Nation"]);
  assert.deepEqual(crownRanks.map((rank) => rank.levels), [[1, 3], [4, 6], [7, 9], [10, 12], [13, 15]]);
  for (const rank of crownRanks) assert.ok(rank.verbs.length >= 3, `${rank.title} adds too few verbs`);
  assert.equal(nationLevels.length, 15);
  assert.deepEqual(nationLevels.map((row) => row.level), Array.from({ length: 15 }, (_, index) => index + 1));
  for (const row of nationLevels) {
    const rank = crownRanks.find((candidate) => candidate.numeral === row.rank)!;
    assert.ok(row.level >= rank.levels[0] && row.level <= rank.levels[1], `level ${row.level} filed under the wrong rank`);
    assert.ok(row.perk.length > 3 && row.grants.length > 20, `level ${row.level} grants nothing readable`);
  }
  assert.equal(new Set(nationLevels.map((row) => row.perk)).size, 15, "every level's perk has its own name");
  assert.deepEqual(provings.map((proving) => proving.afterLevel), [3, 6, 9, 12], "a ceiling at every third level, four provings");
  assert.deepEqual(provings.map((proving) => proving.name), ["The Held Night", "The Second Core", "The Doctrine Crisis", "The Recognition"]);
  for (const [index, proving] of provings.entries()) {
    assert.equal(proving.from, crownRanks[index].title);
    assert.equal(proving.to, crownRanks[index + 1].title);
  }
  assert.equal(courtSeats.length, 6, "six court seats, one per Heartland tutor stop");
});

test("Nation Management keeps its persisted Codex identity behind a canonical public slug", () => {
  assert.equal(canonicalStoryEntryRouteSlug(NATION_MANAGEMENT_PERSISTED_SLUG), NATION_MANAGEMENT_ROUTE_SLUG);
  assert.equal(persistedStoryEntrySlug(NATION_MANAGEMENT_ROUTE_SLUG), NATION_MANAGEMENT_PERSISTED_SLUG);
  assert.deepEqual(new Set(storyEntrySlugAliases(NATION_MANAGEMENT_ROUTE_SLUG)), new Set([NATION_MANAGEMENT_ROUTE_SLUG, NATION_MANAGEMENT_PERSISTED_SLUG]));
});

test("legacy stored prose and structured metadata present only the public Nation terminology", () => {
  const legacyRoot = NATION_MANAGEMENT_PERSISTED_SLUG.split("-")[0]!;
  const titled = `${legacyRoot[0]!.toUpperCase()}${legacyRoot.slice(1)}`;
  const source = `${titled} Management; ${legacyRoot}s; ${legacyRoot}'s; ${legacyRoot}-page; ${NATION_MANAGEMENT_PERSISTED_SLUG}; ${LEGACY_NATION_MANAGEMENT_GAME_TAG_PREFIX} Great Power`;
  assert.equal(
    nationTerminologyText(source),
    `Nation Management; nations; nation's; nation-page; ${NATION_MANAGEMENT_ROUTE_SLUG}; ${NATION_MANAGEMENT_GAME_TAG_PREFIX} Great Power`,
  );
  assert.deepEqual(nationTerminologyValue({ label: source, reference: NATION_MANAGEMENT_PERSISTED_SLUG }), {
    label: `Nation Management; nations; nation's; nation-page; ${NATION_MANAGEMENT_ROUTE_SLUG}; ${NATION_MANAGEMENT_GAME_TAG_PREFIX} Great Power`,
    reference: NATION_MANAGEMENT_ROUTE_SLUG,
  });
  assert.equal(legacyNationTerminologySearchText("Nation Management"), `${titled} Management`);
});

test("canonical Nation wiki links resolve and round-trip through the stable storage reference", () => {
  const authored = `Read [[${NATION_MANAGEMENT_ROUTE_SLUG}]] before taking a nation-management decision.`;
  const stored = nationTerminologyStorageText(authored);
  assert.equal(stored, `Read [[${NATION_MANAGEMENT_PERSISTED_SLUG}]] before taking a nation-management decision.`);
  assert.equal(nationTerminologyText(stored), authored);
  assert.equal(persistedStoryEntrySlug(NATION_MANAGEMENT_ROUTE_SLUG), persistedStoryEntrySlug(NATION_MANAGEMENT_PERSISTED_SLUG));
});

test("structured Nation aliases present consistently and return to stable storage", () => {
  const displayed = {
    slug: canonicalStoryEntryRouteSlug(NATION_MANAGEMENT_PERSISTED_SLUG),
    meta: nationTerminologyValue({
      parent: NATION_MANAGEMENT_PERSISTED_SLUG,
      tags: [NATION_MANAGEMENT_PERSISTED_SLUG],
      dependsOn: [NATION_MANAGEMENT_PERSISTED_SLUG],
      canonPackets: [{ entries: [NATION_MANAGEMENT_PERSISTED_SLUG] }],
    }),
  };
  assert.deepEqual(displayed, {
    slug: NATION_MANAGEMENT_ROUTE_SLUG,
    meta: {
      parent: NATION_MANAGEMENT_ROUTE_SLUG,
      tags: [NATION_MANAGEMENT_ROUTE_SLUG],
      dependsOn: [NATION_MANAGEMENT_ROUTE_SLUG],
      canonPackets: [{ entries: [NATION_MANAGEMENT_ROUTE_SLUG] }],
    },
  });
  assert.deepEqual(nationTerminologyStorageValue(displayed.meta), {
    parent: NATION_MANAGEMENT_PERSISTED_SLUG,
    tags: [NATION_MANAGEMENT_ROUTE_SLUG],
    dependsOn: [NATION_MANAGEMENT_PERSISTED_SLUG],
    canonPackets: [{ entries: [NATION_MANAGEMENT_PERSISTED_SLUG] }],
  });
});

test("entry authoring reserves both aliases and revalidates the canonical route", () => {
  const actions = readFileSync(new URL("../app/codex/actions.ts", import.meta.url), "utf8");
  const editor = readFileSync(new URL("../components/story-entry-editor.tsx", import.meta.url), "utf8");
  const storyCodex = readFileSync(new URL("./story-codex.ts", import.meta.url), "utf8");
  const storyExport = readFileSync(new URL("./story-export.ts", import.meta.url), "utf8");
  const storyAssistant = readFileSync(new URL("./story-assistant-service.ts", import.meta.url), "utf8");
  const dossierPage = readFileSync(new URL("../app/codex/bible/[slug]/page.tsx", import.meta.url), "utf8");
  const authorHeartland = readFileSync(new URL("../scripts/author-heartland-thread.ts", import.meta.url), "utf8");
  assert.match(actions, /const slugAliases = storyEntrySlugAliases\(publicSlug\)/);
  assert.match(actions, /slug: \{ in: slugAliases \}/);
  assert.match(actions, /const slug = persistedStoryEntrySlug\(publicSlug\)/);
  assert.match(actions, /parent: systemParent\?\.success \? persistedStoryEntrySlug\(systemParent\.data\) : null/);
  assert.match(actions, /titleAliases\.length > 1 && !titleAliases\.includes\(entry\.slug\)/);
  assert.match(actions, /const body = parsed\.data\.body \? nationTerminologyStorageText\(parsed\.data\.body\) : null/);
  assert.match(actions, /revalidateStoryEntry\(slug\)/);
  assert.match(editor, /Public key \/ route/);
  assert.match(editor, /canonicalStoryEntryRouteSlug\(entry\.slug\)/);
  assert.match(storyCodex, /const lookupAliases = storyEntrySlugAliases\(slug\)/);
  assert.match(storyCodex, /where: \{ slug: \{ in: lookupAliases \} \}/);
  assert.match(storyCodex, /persistedStoryEntrySlug\(value\) === storageSlug/);
  assert.match(storyCodex, /slug: canonicalStoryEntryRouteSlug\(entry\.slug\)/);
  assert.match(storyCodex, /openQuestions: openQuestions\.map\(\(item\) => \(\{ \.\.\.item, slug: canonicalStoryEntryRouteSlug\(item\.slug\)/);
  assert.match(storyExport, /slug: entry\.slug,[\s\S]*title: nationTerminologyStorageText\(entry\.title\)/);
  assert.match(storyExport, /meta: entry\.meta \? nationTerminologyStorageValue\(entry\.meta\)/);
  assert.match(storyAssistant, /slug: canonicalStoryEntryRouteSlug\(entry\.slug\)/);
  assert.match(storyAssistant, /meta: entry\.meta \? nationTerminologyValue\(entry\.meta\)/);
  assert.match(dossierPage, /permanentRedirect\(`\/codex\/bible\/\$\{canonicalSlug\}`\)/);
  assert.match(dossierPage, /storyEntrySlugAliases\(option\.slug\)/);
  assert.match(authorHeartland, /tags: \["riverlands", "heartland", NATION_MANAGEMENT_ROUTE_SLUG/);
});

test("plots are plots, not ranks: the Riverlands holds three Charters and no rank is bought with one", () => {
  assert.equal(riverlandsPlots.length, 3, "the Riverlands holds three plots: the Charters");
  assert.deepEqual(riverlandsPlots.map((plot) => plot.slug), ["first-charter", "second-charter", "third-charter"]);
  for (const rank of crownRanks) assert.doesNotMatch(rank.how, /charter/i, "charters are plots, not ranks of the crown");
});

test("four ways to get ground, six realm trees of seven nodes with a Crown-only capstone, five faiths and the secular crown", () => {
  assert.deepEqual(groundVerbs.map((verb) => verb.name), ["Buy", "Seize", "Earn", "Found"]);
  assert.deepEqual(realmTrees.map((tree) => tree.name), ["Might", "Coffers", "Works", "Arcana", "Roots", "Faith"]);
  const ids = new Set<string>();
  let onOffer = 0;
  for (const tree of realmTrees) {
    assert.equal(tree.nodes.length, 7, `${tree.name} holds seven nodes`);
    const capstone = tree.nodes.at(-1)!;
    assert.ok(capstone.capstone && capstone.rank === "V", `${tree.name}'s last node is its Crown-only capstone`);
    assert.equal(tree.nodes.filter((node) => node.capstone).length, 1);
    for (const node of tree.nodes) {
      assert.ok(node.cost >= 1 && node.cost <= 3, `${node.name}: nodes cost one to three points`);
      assert.ok(!ids.has(node.id), `${node.id} is reused across trees`);
      ids.add(node.id);
      onOffer += node.cost;
    }
  }
  assert.equal(onOffer, realmPoints.onOffer, "the page's points-on-offer figure matches the trees");
  assert.equal(realmPoints.total, 15 * realmPoints.perLevel + 4 * realmPoints.perProving);
  assert.ok(realmPoints.total < onOffer, "nobody owns everything");
  assert.equal(faiths.length, 6);
  assert.equal(faiths.filter((faith) => faith.secular).length, 1);
  for (const faith of faiths) {
    assert.ok(faith.perk.length > 20 && faith.price.length > 20, `${faith.name}: every faith buys something real and costs something real`);
  }
});

test("the siege has two postures and Court Day four priced options, ordered as the sims measured", () => {
  assert.deepEqual(siegeLaw.postures.map((posture) => posture.name), ["Storm", "Wait"]);
  const values = courtDay.options.map((option) => Number(option.value.match(/^(\d+)/)?.[1]));
  assert.deepEqual(values, [771, 542, 313, 192]);
  assert.ok(standingLaws.length >= 5);
});
