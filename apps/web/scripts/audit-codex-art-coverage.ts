/**
 * The art coverage inventory — every picture the codex can wear, worn or
 * empty, resolved by the SAME function the site renders with, so this list
 * and the grey placeholders can never disagree.
 *
 * Prints, per kind: how many entries wear art, and the slug + title +
 * one-line summary of every empty slot. Fixed surfaces (talents, trades,
 * the timeline mural) are checked by their own conventions at the bottom.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-codex-art-coverage.ts
 */

import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { crownRanks, realmTrees } from "../lib/nation";
import { codexArtFileForUrl, findCodexArt } from "../lib/codex-art";
import { dossierArtExpected, getDossierArt } from "../lib/dossier-art";
import { getFactionBranding } from "../lib/faction-branding";
import { professions } from "../lib/professions";
import { talentClasses } from "../lib/talent-trees";

const db = getPrismaClient();

async function main() {
  const entries = await db.storyEntry.findMany({
    select: { slug: true, title: true, kind: true, status: true, summary: true, meta: true },
    orderBy: [{ kind: "asc" }, { slug: "asc" }],
  });

  const byKind = new Map<string, Array<(typeof entries)[number]>>();
  for (const entry of entries) {
    if (!byKind.has(entry.kind)) byKind.set(entry.kind, []);
    byKind.get(entry.kind)!.push(entry);
  }

  let totalMissing = 0;
  for (const [kind, list] of [...byKind.entries()].sort()) {
    // Factions wear branding (keyart + logo) through their own resolver,
    // deliberately outside getDossierArt — count them by that truth.
    const wears = (entry: (typeof entries)[number]) => {
      if (entry.kind !== "FACTION") return Boolean(getDossierArt(entry.kind, entry.slug, entry.meta));
      const brand = getFactionBranding(entry.slug);
      return Boolean(brand && codexArtFileForUrl(brand.keyart) && codexArtFileForUrl(brand.logo));
    };
    const eligible = list.filter((entry) => entry.kind === "FACTION" || dossierArtExpected(entry.kind, entry.slug, entry.meta));
    const missing = eligible.filter((entry) => !wears(entry));
    const worn = eligible.length - missing.length;
    const reserved = list.length - eligible.length;
    console.log(`\n${kind} — ${worn}/${eligible.length} eligible wear art${reserved ? ` · ${reserved} reserved without portrait` : ""}${missing.length ? `, ${missing.length} empty:` : ""}`);
    for (const entry of missing) {
      totalMissing += 1;
      const meta = (entry.meta ?? {}) as Record<string, unknown>;
      const species = typeof meta.species === "string" ? ` · species: ${meta.species}` : "";
      const summary = (entry.summary ?? "").slice(0, 110);
      console.log(`  ${entry.slug}  [${entry.status}${species}]`);
      if (summary) console.log(`      ${summary}`);
    }
  }

  console.log("\nFIXED SURFACES");
  for (const tree of talentClasses) {
    if (!findCodexArt("talents", tree.slug)) { totalMissing += 1; console.log(`  talents/${tree.slug} — EMPTY`); }
  }
  console.log(`  talents: ${talentClasses.filter((t) => findCodexArt("talents", t.slug)).length}/${talentClasses.length} constellation charts present`);
  for (const trade of professions) {
    if (!findCodexArt("trades", trade.slug)) { totalMissing += 1; console.log(`  trades/${trade.slug} — EMPTY`); }
  }
  console.log(`  trades: ${professions.filter((t) => findCodexArt("trades", t.slug)).length}/${professions.length} trade plates present`);
  if (!findCodexArt("timeline", "timeline-archive-mural")) { totalMissing += 1; console.log("  timeline/timeline-archive-mural — EMPTY (the timeline page's own mural)"); }
  // The Crown: the Nation page's hero, one plate per Rank and one sigil per realm tree (Docs/art/SOL56_NATION_ART_PROMPT.txt).
  const nationPlates = ["hero", ...crownRanks.map((rank) => `rank-${rank.numeral.toLowerCase()}-${rank.title.toLowerCase()}`), ...realmTrees.map((tree) => `tree-${tree.slug}`)];
  for (const plate of nationPlates) {
    if (!findCodexArt("nation", plate)) { totalMissing += 1; console.log(`  nation/${plate} — EMPTY`); }
  }
  console.log(`  nation: ${nationPlates.filter((plate) => findCodexArt("nation", plate)).length}/${nationPlates.length} crown plates present`);

  console.log(`\n${"=".repeat(70)}\n${totalMissing} empty slot(s) across the codex.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
