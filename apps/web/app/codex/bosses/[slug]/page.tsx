import Link from "next/link";
import { notFound } from "next/navigation";
import { bloomfallAbilitySentence, type BloomfallAbility } from "@/lib/bloomfall-creature-field-guide";
import { mythicFieldGuide } from "@/lib/mythic-field-guide";
import { requireRole } from "@/lib/authorization";
import { codexArtSlot, findCodexArt } from "@/lib/codex-art";
import { CodexProse } from "@/components/codex-prose";
import { mythicAbilitySlug, mythicDossiers, mythicSlugs } from "@/lib/mythic-dossier";
import { storyReadRole } from "@/lib/story-codex";
import "../../play.css";
import "../bosses.css";

export const dynamic = "force-dynamic";

/**
 * A named fight read as one page: both phases side by side, every ability as a
 * tile, the regional hazard it runs inside, the arena, and who posted the bounty.
 *
 * The fight data comes from `mythicFieldGuide` and the page data
 * from `mythicDossiers` — the page never restates what the dossier body says,
 * because two copies of a boss's kit is two boss kits. Art drops into
 * private/codex-art/bosses/<slug>.png and is picked up on reload; an empty
 * slot prints its own path rather than leaving a hole.
 */

export function generateStaticParams() {
  return mythicSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = mythicFieldGuide[slug];
  const dossier = mythicDossiers[slug];
  if (!guide || !dossier) return { title: "Mythic | Story Codex" };
  const title = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return { title: `${title} | Story Codex` };
}

function Art({ slug, className, glyph }: { slug: string; className: string; glyph: string }) {
  const url = findCodexArt("bosses", slug);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <figure className={`${className} has-art`}><img alt="" src={url} /></figure>;
  }
  return (
    <figure className={className}>
      <span aria-hidden="true" className="mb-glyph">{glyph}</span>
      <figcaption className="play-artslot">art slot — Sol · <code>{codexArtSlot("bosses", slug)}</code></figcaption>
    </figure>
  );
}

function AbilityTile({ ability }: { ability: BloomfallAbility }) {
  const url = findCodexArt("bosses", mythicAbilitySlug(ability.name));
  return (
    <li className="mb-ability">
      <span className="mb-ability-icon" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img alt="" src={url} /> : <span className="mb-ability-glyph">◆</span>}
      </span>
      <span className="mb-ability-body">
        <strong>{ability.name}</strong>
        <span><CodexProse text={bloomfallAbilitySentence(ability)} /></span>
      </span>
    </li>
  );
}

export default async function MythicBossPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole(storyReadRole);
  const { slug } = await params;
  const guide = mythicFieldGuide[slug];
  const dossier = mythicDossiers[slug];
  if (!guide || guide.kind !== "BOSS" || !dossier) notFound();

  const title = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const heroUrl = findCodexArt("creatures", slug);
  const personUrl = dossier.personSlug ? findCodexArt("characters", dossier.personSlug) : null;
  const phases = guide.phases ?? [];

  return (
    <main className="play mythic-boss">
      <header className="mb-hero">
        <div className="mb-hero-text">
          <p className="mb-eyebrow">{dossier.regionLabel} — {dossier.eyebrow}</p>
          <h1>{title}</h1>
          <p className="mb-tagline">{dossier.tagline}</p>
          <p className="mb-summary"><CodexProse text={guide.summary} /></p>
          <p className="mb-links">
            <Link href="/codex/bosses">All Mythics</Link>
            <Link href={`/codex/bible/${slug}`}>Creature dossier</Link>
            {dossier.personSlug ? <Link href={`/codex/bible/${dossier.personSlug}`}>The person</Link> : null}
            <Link href={`/codex/arc/${dossier.arcSlug}`}>The bounty</Link>
          </p>
        </div>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <figure className="mb-hero-art has-art"><img alt="" src={heroUrl} /></figure>
        ) : (
          <figure className="mb-hero-art">
            <span aria-hidden="true" className="mb-glyph">◗</span>
            <figcaption className="play-artslot">art slot — Sol · <code>{codexArtSlot("creatures", slug)}</code></figcaption>
          </figure>
        )}
      </header>

      <section className="mb-strip" aria-labelledby="mb-spawn">
        <h2 id="mb-spawn">How it exists</h2>
        <div className="mb-strip-grid">
          <p><strong>Spawn.</strong> <CodexProse text={guide.spawn} /></p>
          <p><strong>Stats.</strong> <CodexProse text={guide.stats} /></p>
        </div>
      </section>

      <div className="mb-columns">
        <section className="mb-panel" aria-labelledby="mb-biome">
          <h2 id="mb-biome">Biome integration</h2>
          <dl className="mb-rows">
            {dossier.biome.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-panel" aria-labelledby="mb-cycle">
          <h2 id="mb-cycle">{dossier.hazardTitle}</h2>
          <p className="mb-note">Sector state sets hazard, behaviour and water level. It is not Seven-Phase Corruption and never becomes it.</p>
          <ol className="mb-cycle">
            {dossier.hazard.map((state) => (
              <li key={state.state} data-band={state.band}>
                <span className="mb-cycle-name">{state.state}</span>
                <span className="mb-cycle-band">{state.band}</span>
                <span className="mb-cycle-effect">{state.effect}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-panel" aria-labelledby="mb-arena">
          <h2 id="mb-arena">The arena</h2>
          <Art slug={dossier.arenaArtSlug} className="mb-panel-art" glyph="≋" />
          <ul className="mb-bullets">
            {dossier.arena.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>

      <section className="mb-fight" aria-labelledby="mb-mechanics">
        <h2 id="mb-mechanics">How the fight works</h2>
        <ul className="mb-abilities mb-abilities-wide">
          {guide.abilities.map((ability) => <AbilityTile key={ability.name} ability={ability} />)}
        </ul>
      </section>

      {phases.map((phase, index) => (
        <section className="mb-phase" key={phase.name} aria-label={phase.name}>
          <div className="mb-phase-head">
            <h2>{phase.name}</h2>
            {index === 0 && personUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <figure className="mb-phase-art has-art"><img alt="" src={personUrl} /></figure>
            ) : null}
            {index === 0 && !personUrl && dossier.personSlug ? (
              <figure className="mb-phase-art">
                <span aria-hidden="true" className="mb-glyph">◑</span>
                <figcaption className="play-artslot">art slot — Sol · <code>{codexArtSlot("characters", dossier.personSlug)}</code></figcaption>
              </figure>
            ) : null}
            <p className="mb-phase-what"><CodexProse text={phase.what.replace(/\*([^*]+)\*/g, "$1")} /></p>
          </div>
          <ul className="mb-abilities">
            {phase.abilities.map((ability) => <AbilityTile key={ability.name} ability={ability} />)}
          </ul>

          {index === 0 ? (
            <aside className="mb-transition">
              <h3>{guide.transition?.name ?? "Phase transition"}</h3>
              <Art slug={dossier.transitionArtSlug} className="mb-transition-art" glyph="◉" />
              <p><CodexProse text={guide.transition?.what ?? ""} /></p>
              <ul className="mb-bullets">
                {dossier.transitionBeats.map((beat) => <li key={beat}>{beat}</li>)}
              </ul>
            </aside>
          ) : (
            <aside className="mb-transition">
              <h3>Phase two mechanics</h3>
              <ul className="mb-bullets">
                {dossier.mechanics.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </aside>
          )}
        </section>
      ))}

      <div className="mb-columns">
        <section className="mb-panel" aria-labelledby="mb-bounty">
          <h2 id="mb-bounty">The bounty</h2>
          <p className="mb-note">One posting. Three issuers. Satisfy any of them and you fail the other two.</p>
          <dl className="mb-rows">
            {dossier.bounty.map((row) => (
              <div key={row.issuerSlug}>
                <dt><Link href={`/codex/bible/${row.issuerSlug}`}>{row.issuer}</Link></dt>
                <dd>{row.wants}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-panel" aria-labelledby="mb-rewards">
          <h2 id="mb-rewards">What it is worth</h2>
          <p className="mb-note">Every piece is something the weir is currently using. Harvesting consequences apply to all of it.</p>
          <dl className="mb-rows">
            {dossier.rewards.map((row) => (
              <div key={row.name}>
                <dt>{row.slug ? <Link href={`/codex/bible/${row.slug}`}>{row.name}</Link> : row.name}</dt>
                <dd>{row.what}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-panel" aria-labelledby="mb-catalogue">
          <h2 id="mb-catalogue">{dossier.catalogueTitle}</h2>
          <Art slug={dossier.catalogueArtSlug} className="mb-panel-art" glyph="⌗" />
          <p className="mb-note"><CodexProse text={dossier.catalogueNote} /></p>
        </section>

        {/* Plates that are not one of the three fixed slots. Without this the
            set's best establishing shots have nowhere to render and simply sit
            on disk — which is exactly what happened to two of the Pale
            Mother's the first time this page was built for her. */}
        {dossier.gallery.length > 0 ? (
          <section className="mb-panel" aria-labelledby="mb-gallery">
            <h2 id="mb-gallery">The ground itself</h2>
            <div className="mb-gallery">
              {dossier.gallery.map((plate) => (
                <figure className="mb-gallery-item" key={plate.slug}>
                  <Art slug={plate.slug} className="mb-gallery-art" glyph="◈" />
                  <figcaption>{plate.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
