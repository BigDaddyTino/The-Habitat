import Link from "next/link";
import { SpellbookBrowser } from "@/components/spellbook-browser";
import { requireRole } from "@/lib/authorization";
import { listCodexArt } from "@/lib/codex-art";
import { codexArtSized } from "@/lib/codex-art-derivative";
import { pillars, spells } from "@/lib/spellbook";
import { unlockIndexForClient } from "@/lib/spell-unlocks";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "../play.css";
import "./spells.css";

export const metadata = { title: "Spellbook | Story Codex" };

/**
 * The 108 licensed spells as a spellbook: six pillars, twenty-seven licence
 * classes, four spells each, every one an ability card with numbers. The
 * canon lives on the six pillar dossiers; this page is the gamer-facing
 * layout of the same registry, plus the derived map of which talent nodes
 * open which spell.
 */
export default async function SpellbookPage() {
  await requireRole(storyReadRole);
  const icons = Object.fromEntries([...listCodexArt("spells")].map(([slug, url]) => [slug, codexArtSized(url, 96)]));
  return (
    <section className="page-shell codex-shell play-shell spells-shell">
      <header className="play-hero">
        <p className="eyebrow">The Six Pillars</p>
        <h1>Spellbook</h1>
        <p><b>6 pillars → 27 licence classes → 108 spells.</b> Each class holds four: two at Licensed, one at Certified, and a Master signature. You can hold three classes from at most two pillars and master exactly one; no respec exists anywhere. Born and gifted casters pay from a pool, the infused pay charges through a rig, and every spell can be pushed — <b>overcharge</b> doubles the cost and, on a bad day, fails the pillar&apos;s own way.</p>
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Pillar = school. Licence class = sub-school. Licensed = two basic spells, Certified = the advanced one, Master = the ultimate. Cost by tier: <b>2 · 4 · 8</b> pool (born/gifted) or <b>1 · 2 · 4</b> charges (infused). Your pool is 8 + level + 2 × Conductivity; a rig holds Conductivity + 2 charges and a dose loads 5. Filter by class to see which spells your tree can reach; every card links to the node that opens it.</span>
      </div>

      <div className="play-jump">
        {pillars.map((pillar) => <a href={`#${pillar.slug}`} key={pillar.slug}>{pillar.name}</a>)}
        <Link href="/codex/bible/the-six-pillars">The registry (canon)</Link>
        <Link href="/codex/bible/magic">Magic</Link>
        <Link href="/codex/talents">Talent calculator</Link>
      </div>

      <SpellbookBrowser
        classes={talentClasses.map((entry) => ({ slug: entry.slug, name: entry.name }))}
        icons={icons}
        pillars={pillars}
        spells={spells}
        unlocks={unlockIndexForClient()}
      />

      <p className="play-artslot">spell icons — Sol · <code>private/codex-art/spells/&lt;spell-id&gt;.png</code> · picked up on reload</p>
    </section>
  );
}
