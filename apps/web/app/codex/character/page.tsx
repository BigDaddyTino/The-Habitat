import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { attributeNames, attributes, backgrounds, ledgers, levelLaw, origins, reservedBackgrounds, reservedSpecies, species } from "@/lib/character-sheet";
import { classDossiers } from "@/lib/class-dossiers";
import { findCodexArt } from "@/lib/codex-art";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "../play.css";
import "./character.css";

export const metadata = { title: "Your Character | Story Codex" };

const abbreviations: Record<string, string> = { Conditioning: "Cond", Coordination: "Coor", Resilience: "Res", Acuity: "Acu", Composure: "Comp", Conductivity: "Cndv" };

/**
 * The character hub: what a player picks at the desk and what grows after,
 * in the order they meet it. Each block is the gamer-shaped summary of a
 * canon dossier and links back to it; nothing here is new design.
 */
export default async function CharacterPage() {
  await requireRole(storyReadRole);
  return (
    <section className="page-shell codex-shell play-shell char-shell">
      <header className="play-hero">
        <p className="eyebrow">Character progression</p>
        <h1>Your Character</h1>
        <p>Four choices at the enlistment desk — <b>species, background, origin, class</b> — then everything else is earned in play. No menus in the world: a clerk asks the questions and a service file remembers the answers. This page is the handbook version; every block links to the canon it summarises.</p>
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Pick a <b>Species</b> (stat caps + a perk + a drawback), a <b>Background</b> (kit + a skill head start + a passive + a contact + a quest hook), an <b>Origin</b> (are you a caster, and what do you cast from), and a <b>Class</b> (your talent tree). Then: attributes rise by use, skills rank up by use, talents come 1 a level, licences come from institutions, trades from workshops, and corruption from every dose.</span>
      </div>

      <div className="play-jump">
        <a href="#species">1 · Species</a><a href="#background">2 · Background</a><a href="#origin">3 · Origin</a><a href="#class">4 · Class</a><a href="#attributes">Attributes</a><a href="#ledgers">What death takes</a>
        <Link href="/codex/bible/enlistment">Enlistment (canon)</Link>
      </div>

      {/* ---------------------------------------------------------- species */}
      <section className="play-law" id="species">
        <h2>1 · Species <Link className="char-canon" href="/codex/library/species">canon shelf →</Link></h2>
        <p className="play-lede">Six playable peoples. Species sets your <b>attribute caps</b> out of 9, gives one perk and one drawback, and changes how the Soul Forge treats you. <b>Permanent: death never takes it.</b></p>
        <div className="char-species">
          {species.map((entry) => (
            <article className="char-card" key={entry.slug}>
              <h3><Link href={`/codex/bible/${entry.slug}`}>{entry.name}</Link></h3>
              <p className="char-tag">{entry.tagline}</p>
              <ul className="char-perks">
                {entry.perks.map((perk) => <li className="is-perk" key={perk}>{perk}</li>)}
                {entry.drawbacks.map((drawback) => <li className="is-drawback" key={drawback}>{drawback}</li>)}
              </ul>
              <div className="char-caps">
                {attributeNames.map((name) => {
                  const cap = entry.caps[name];
                  return (
                    <div key={name}>
                      <i>{abbreviations[name]}</i>
                      <b className={cap === 9 ? "is-hi" : cap !== null && cap < 8 ? "is-lo" : undefined}>{cap ?? "—"}</b>
                    </div>
                  );
                })}
              </div>
              <p className="char-forge"><b>Forge:</b> {entry.forge}</p>
            </article>
          ))}
        </div>
        <p className="char-reserved"><b>Reserved slots</b> for regions not yet written: {reservedSpecies.join(", ")}. The codex is growing; these get written when their homes do.</p>
      </section>

      {/* ------------------------------------------------------- background */}
      <section className="play-law" id="background">
        <h2>2 · Background <Link className="char-canon" href="/codex/bible/character-classes">canon →</Link></h2>
        <p className="play-lede">The door you came in through. A background grants exactly four things — a <b>kit</b>, a <b>skill at Reliable</b>, a passive <b>read</b>, a <b>contact</b> — plus one thing the character does not discuss. <b>It never locks a skill: a head start, not a wall.</b></p>
        <div className="char-backgrounds">
          {backgrounds.map((entry) => (
            <article className="char-card" key={entry.slug}>
              <h3>{entry.name}</h3>
              <p className="char-tag">{entry.role}</p>
              <dl className="char-fields">
                <dt>Skill</dt><dd><b>{entry.skill}</b></dd>
                <dt>Kit</dt><dd>{entry.kit}</dd>
                <dt>Passive</dt><dd><b>{entry.passive.name}</b> — {entry.passive.effect}</dd>
                <dt>Contact</dt><dd>{entry.contact}</dd>
                <dt>Hook</dt><dd>{entry.hook}</dd>
              </dl>
            </article>
          ))}
        </div>
        <p className="char-reserved"><b>Eleven doors reserved</b> for factions with no home written yet: {reservedBackgrounds.join(", ")}.</p>
      </section>

      {/* ----------------------------------------------------------- origin */}
      <section className="play-law" id="origin">
        <h2>3 · Origin <Link className="char-canon" href="/codex/bible/magic">canon →</Link></h2>
        <p className="play-lede">The fourth question at the desk: <b>are you a caster, and what do you cast from?</b> Separate from class — any class can cast. Three of the four answers are one-way doors.</p>
        <div className="char-origins">
          {origins.map((entry) => (
            <article className="char-card" key={entry.name}>
              <h3>{entry.name}</h3>
              <p className="char-tag">{entry.line}</p>
              <dl className="char-fields">
                <dt>Resource</dt><dd>{entry.resource}</dd>
                <dt>Starts</dt><dd>{entry.starts}</dd>
                <dt>Watched by</dt><dd>{entry.watched}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ class */}
      <section className="play-law" id="class">
        <h2>4 · Class <Link className="char-canon" href="/codex/classes">the shelf →</Link></h2>
        <p className="play-lede">Your talent tree: a core pillar, five branches, choice nodes, capstones a teacher must open, and a corrupted branch that lights for free. {levelLaw.talentPoints}</p>
        <div className="char-classes">
          {talentClasses.map((entry) => {
            const art = findCodexArt("classes", entry.slug) ?? findCodexArt("talents", entry.slug);
            return (
              <Link className="char-class" href={`/codex/classes/${entry.slug}`} key={entry.slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {art ? <img alt="" src={art} /> : null}
                <span>
                  <i>{entry.archetype}</i>
                  <b>{entry.name}</b>
                  <small>{classDossiers[entry.slug]?.hook}</small>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- attributes */}
      <section className="play-law" id="attributes">
        <h2>Attributes <Link className="char-canon" href="/codex/bible/attributes">canon →</Link></h2>
        <p className="play-lede">Six rungs from 0 to 9. <b>{levelLaw.attributes}</b> {levelLaw.creation} In the field no number is shown — the world reports a rung by behaving differently around you.</p>
        <div className="char-attributes">
          {attributes.map((entry) => (
            <article className="char-card" key={entry.name}>
              <h3>{entry.name} <small>{entry.short}</small></h3>
              <dl className="char-fields">
                <dt>Governs</dt><dd>{entry.governs}</dd>
                <dt>Raised by</dt><dd>{entry.raisedBy}</dd>
                <dt>Corruption</dt><dd>{entry.corruption}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- ledgers */}
      <section className="play-law" id="ledgers">
        <h2>What grows, and what death takes <Link className="char-canon" href="/codex/bible/character-progression">canon →</Link></h2>
        <p className="play-lede">A character is ten things. Death rebuilds one, takes one, and leaves eight untouched — it costs Essence, time and your bag. It never costs identity.</p>
        <div className="char-ledgers">
          {ledgers.map((entry) => (
            <div className={`char-ledger is-${entry.death}`} key={entry.name}>
              <i>{entry.tier}</i>
              <b>{entry.slug ? <Link href={`/codex/bible/${entry.slug}`}>{entry.name}</Link> : entry.name}</b>
              <em>{entry.death}</em>
              <span>{entry.line}</span>
            </div>
          ))}
        </div>
        <div className="char-next">
          <Link href="/codex/talents">Talents</Link>
          <Link href="/codex/skills">Skills</Link>
          <Link href="/codex/spells">Spells</Link>
          <Link href="/codex/professions">Trades</Link>
          <Link href="/codex/bible/the-corruption-system">Corruption</Link>
          <Link href="/codex/bible/kit">Kit</Link>
          <Link href="/codex/bible/cybernetics">Cybernetics</Link>
          <Link href="/codex/bible/the-wound-model">The wound model</Link>
        </div>
      </section>
    </section>
  );
}
