import { TalentCalculator } from "@/components/talent-calculator";
import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "./talents.css";

export const metadata = { title: "Talent Calculator | Story Codex" };

/**
 * The Eight Trees, interactive. Design source: the approved spec artifact
 * plus `lib/talent-trees.ts`; nothing here writes to the database — a build
 * lives in the URL fragment, so sharing a link shares the build.
 */
export default async function TalentCalculatorPage() {
  await requireRole(storyReadRole);
  // Constellation art by the drop-in convention: a file named for the class
  // at private/codex-art/talents/<slug>.png appears on the next reload.
  const constellationArt = Object.fromEntries(talentClasses.map((entry) => [entry.slug, findCodexArt("talents", entry.slug)]));
  return (
    <section className="page-shell codex-shell talent-shell">
      <header className="talent-hero">
        <p className="eyebrow">The Eight Trees</p>
        <h1>Talent Calculator</h1>
        <p>One tree per class — a core pillar, five branches, weaves that bridge them, forks that lock forever, ceilings only a trainer can open, and a corrupted branch that costs nothing because the ladder already charged you. ~144 points by level 100; never enough for everything.</p>
      </header>
      <TalentCalculator constellationArt={constellationArt} />
    </section>
  );
}
