import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { codexArtSlot, findCodexArt } from "@/lib/codex-art";
import { CodexProse } from "@/components/codex-prose";
import { mythicFieldGuide } from "@/lib/mythic-field-guide";
import { mythicDossiers, mythicSlugs } from "@/lib/mythic-dossier";
import { storyReadRole } from "@/lib/story-codex";
import "../play.css";
import "./bosses.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mythics | Story Codex" };

/**
 * The Mythics, one card each.
 *
 * This page did not exist. The navigation's "Mythics" entry pointed straight at
 * the Blackweir Anaconda's page — fine while there was one Mythic, and a dead
 * end the moment there were two. The Pale Mother was live, canonical, and
 * fully wired, and the menu item named for her kind could not reach her.
 *
 * One Mythic per region, the rest reserved: the cards below are the claimed
 * slots, and the count in the eyebrow is meant to grow.
 */
export default async function MythicsIndexPage() {
  await requireRole(storyReadRole);

  const mythics = mythicSlugs
    .map((slug) => ({ slug, dossier: mythicDossiers[slug], guide: mythicFieldGuide[slug] }))
    .filter((row) => row.dossier && row.guide?.kind === "BOSS")
    .sort((a, b) => a.dossier.regionLabel.localeCompare(b.dossier.regionLabel));

  return (
    <main className="play mythic-boss mythic-index">
      <header className="mb-hero mb-index-hero">
        <div className="mb-hero-text">
          <p className="mb-eyebrow">Story Codex — {mythics.length} Mythic{mythics.length === 1 ? "" : "s"} claimed</p>
          <h1>Mythics</h1>
          <p className="mb-tagline">
            The rung above Aberrant. A Mythic is region-defining, unrepeatable, and load-bearing on a regional
            system — killing it changes how the region works, not just who is standing in it. One per region,
            and every unclaimed slot is reserved rather than empty.
          </p>
        </div>
      </header>

      <ul className="mb-index">
        {mythics.map(({ slug, dossier, guide }) => {
          const title = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
          const art = findCodexArt("creatures", slug);
          return (
            <li className="mb-index-card" key={slug}>
              <Link className="mb-index-art-link" href={`/codex/bosses/${slug}`}>
                {art ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <figure className="mb-hero-art has-art"><img alt="" src={art} /></figure>
                ) : (
                  <figure className="mb-hero-art">
                    <span aria-hidden="true" className="mb-glyph">◗</span>
                    <figcaption className="play-artslot">art slot — Sol · <code>{codexArtSlot("creatures", slug)}</code></figcaption>
                  </figure>
                )}
              </Link>
              <div className="mb-index-body">
                <p className="mb-eyebrow">{dossier.regionLabel} — {dossier.eyebrow}</p>
                <h2><Link href={`/codex/bosses/${slug}`}>{title}</Link></h2>
                <p className="mb-tagline">{dossier.tagline}</p>
                <p className="mb-summary"><CodexProse text={guide.kind === "BOSS" ? guide.summary : ""} /></p>
                <p className="mb-links">
                  <Link href={`/codex/bosses/${slug}`}>The fight</Link>
                  <Link href={`/codex/bible/${slug}`}>Creature dossier</Link>
                  {dossier.personSlug ? <Link href={`/codex/bible/${dossier.personSlug}`}>The person</Link> : null}
                  <Link href={`/codex/arc/${dossier.arcSlug}`}>The bounty</Link>
                  <Link href={`/codex/bible/${dossier.region}`}>{dossier.regionLabel.split(" · ")[0]}</Link>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
