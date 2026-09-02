import Link from "next/link";
import { TalentCalculator } from "@/components/talent-calculator";
import { requireRole } from "@/lib/authorization";
import { findCodexArt, listCodexArt } from "@/lib/codex-art";
import { codexArtSized } from "@/lib/codex-art-derivative";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "../play.css";
import "./talents.css";

export const metadata = { title: "Talent Calculator | Story Codex" };

/**
 * The Eight Trees, interactive. Design source: the approved spec artifact
 * plus `lib/talent-trees.ts` (the shape) and `lib/talent-cards` (what each
 * node says); nothing here writes to the database — a build lives in the
 * URL fragment, so sharing a link shares the build.
 */
export default async function TalentCalculatorPage() {
  await requireRole(storyReadRole);
  // Art by the drop-in convention. Constellation charts and backdrops are
  // one file per class; icons are one file per node, listed in a single
  // readdir because there are four hundred of them.
  const constellationArt = Object.fromEntries(talentClasses.map((entry) => [entry.slug, findCodexArt("talents", entry.slug)]));
  // Served through the derivative route: icons at 96px (the tiles are 34px,
  // the hover card 40px), backdrops at 1440 — Sol's masters run to 1254px
  // squares and 1672px plates, which is 90MB of tree if served raw.
  const backdrops = Object.fromEntries(talentClasses.map((entry) => { const url = findCodexArt("talent-backdrops", entry.slug); return [entry.slug, url ? codexArtSized(url, 1440) : null]; }));
  const icons = Object.fromEntries([...listCodexArt("talent-icons")].map(([slug, url]) => [slug, codexArtSized(url, 96)]));
  return (
    <section className="page-shell codex-shell play-shell talent-shell">
      <header className="talent-hero play-hero">
        <p className="eyebrow">The Eight Trees</p>
        <h1>Talent Calculator</h1>
        <p>One tree per class — a core pillar, five branches, weaves that bridge them, choice nodes that lock forever, capstones only a trainer can open, and a corrupted branch that costs nothing because the ladder already charged you. <b>~144 points by level 100; never enough for everything.</b> Hover any node for its card; the same cards are on each class&apos;s page under <Link href="/codex/classes">Classes</Link>.</p>
      </header>
      <TalentCalculator backdrops={backdrops} constellationArt={constellationArt} icons={icons} />
    </section>
  );
}
