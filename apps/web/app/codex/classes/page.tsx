import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { classDossiers } from "@/lib/class-dossiers";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "./classes.css";

export const metadata = { title: "Classes | Story Codex" };

/**
 * The Classes shelf: the Eight Trees as people. One plate per class by the
 * drop-in convention (private/codex-art/classes/<slug>.png); until a plate
 * lands, the class's own constellation chart stands in and the slot prints
 * its path. Click a class for its dossier.
 */
export default async function ClassesPage() {
  await requireRole(storyReadRole);
  return (
    <section className="page-shell codex-shell cls-shell">
      <header className="cls-hero">
        <p className="eyebrow">The Eight Trees</p>
        <h1>Classes</h1>
        <p>Eight ways to be dangerous. Each class is a talent tree with a core, five branches, a fork that locks forever, ceilings only a teacher can open, and a corrupted branch that costs nothing because the ladder already charged you. <b>Pick the one whose weapon you would reach for first.</b></p>
      </header>

      <div className="cls-grid">
        {talentClasses.map((entry) => {
          const dossier = classDossiers[entry.slug];
          const keyArt = findCodexArt("classes", entry.slug);
          const constellation = findCodexArt("talents", entry.slug);
          const art = keyArt ?? constellation;
          return (
            <Link className={`cls-card${keyArt ? "" : " is-constellation"}`} href={`/codex/classes/${entry.slug}`} key={entry.slug}>
              {art ? <img alt={`${entry.name} — ${keyArt ? "key art" : entry.constellation}`} src={art} /> : null}
              {keyArt ? null : <span className="cls-card-slot">key art slot — Sol · <code>private/codex-art/classes/{entry.slug}.png</code></span>}
              <div className="cls-card-copy">
                <i>{entry.archetype}</i>
                <h2>{entry.name}</h2>
                <p>{dossier?.hook}</p>
                <span>{entry.growth}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
