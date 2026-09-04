import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { mythicDossiers, mythicSlugs } from "./mythic-dossier";
import { mythicFieldGuide } from "./mythic-field-guide";

/**
 * Every Mythic is reachable from the menu item named for its kind.
 *
 * The navigation's "Mythics" entry was a hardcoded link to the Blackweir
 * Anaconda's page. With one Mythic that was indistinguishable from an index.
 * With two, it meant the Pale Mother — live, canonical, fully wired, twenty-two
 * plates delivered — could not be reached from navigation at all, and the owner
 * reported twice that he could not find her.
 */

const webRoot = process.cwd();
const nav = readFileSync(path.join(webRoot, "components", "codex-navigation.tsx"), "utf8");

test("the Mythics menu item points at the index, never at one boss", () => {
  const line = nav.split("\n").find((row) => row.includes('label: "Mythics"'));
  assert.ok(line, "the Mythics menu item is gone");
  assert.match(line, /href: "\/codex\/bosses"/, "the Mythics link names a single boss page; the day a second Mythic exists it becomes unreachable from the menu");
  for (const slug of mythicSlugs) {
    assert.ok(!line.includes(`/codex/bosses/${slug}`), `the Mythics link is hardcoded to ${slug}`);
  }
});

test("the Mythics index route exists", () => {
  assert.ok(existsSync(path.join(webRoot, "app", "codex", "bosses", "page.tsx")), "/codex/bosses has no page — the menu would 404");
});

test("every registered Mythic has both halves the index and the boss page need", () => {
  assert.ok(mythicSlugs.length >= 2, "fewer than two Mythics registered — the Pale Mother is missing from mythicDossiers");
  for (const slug of mythicSlugs) {
    assert.ok(mythicDossiers[slug], `${slug} has no dossier`);
    const guide = mythicFieldGuide[slug];
    assert.ok(guide, `${slug} has no field-guide record — its boss page 404s`);
    assert.equal(guide.kind, "BOSS", `${slug}'s field-guide record is not a BOSS`);
  }
  assert.ok(mythicSlugs.includes("the-pale-mother"));
  assert.ok(mythicSlugs.includes("the-blackweir-anaconda"));
});
