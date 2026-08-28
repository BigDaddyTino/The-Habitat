/* eslint-disable @next/next/no-img-element */
import {
  bloomfallCreatureEnhancementBySlug,
  bloomfallMutationCards,
  type BloomfallMutationCard,
} from "@/lib/bloomfall-creature-enhancements";
import { bloomfallAbilitySentence, bloomfallCreatureFieldGuide } from "@/lib/bloomfall-creature-field-guide";
import { bloomfallLadderSummary } from "@/lib/bloomfall-adaptive-ladder";
import { plainStoryProse } from "@/lib/story-prose";
import {
  bloomfallCreatureArtUrl,
  getBloomfallCreatureHeroArt,
  getBloomfallCreatureRungArt,
} from "@/lib/bloomfall-creature-art";

/**
 * One rung of the ladder: its picture where the art package has one, and
 * underneath it the only three things a player needs — which rung this is,
 * what the stats do, and what it can suddenly do to them.
 *
 * A rung whose plate has not been drawn yet keeps its slot and says so, rather
 * than borrowing the picture next to it.
 */
function RungCard({ card, entrySlug }: { card: BloomfallMutationCard; entrySlug: string }) {
  const plate = getBloomfallCreatureRungArt(entrySlug, card.rung);
  const url = plate ? bloomfallCreatureArtUrl(plate) : null;
  return <article className={`adaptive-state-card rung-${card.rung.toLowerCase()}`}>
    {url
      ? <a className="adaptive-state-image" href={url} target="_blank" rel="noreferrer">
          <img alt={`${card.form} — ${card.label} rung`} src={url} />
          <span>Open full resolution</span>
        </a>
      : <div className="adaptive-state-image is-empty"><span>Art pending</span></div>}
    <div className="adaptive-state-copy">
      <p className="eyebrow">{card.label}</p>
      <h4>{card.form}</h4>
      <p><strong>Stats.</strong> {card.stats}</p>
      <p><strong>Temperament.</strong> {card.temperament}</p>
      {card.notes.map((note) => <p key={note.label}><strong>{note.label}.</strong> {note.text}</p>)}
      <p className="adaptive-ability-heading"><strong>{card.abilityHeading}.</strong></p>
      <ul className="adaptive-state-abilities">
        {card.abilities.map((item) => <li key={item.name}><strong>{item.name}.</strong> {bloomfallAbilitySentence(item)}</li>)}
      </ul>
      <p className="adaptive-state-drop"><strong>Drops.</strong> {plainStoryProse(card.drop)}</p>
    </div>
  </article>;
}

/** The Adaptive Mutation gallery. Renders for any dossier the creature manifest covers. */
export function BloomfallAdaptiveMutationPanel({ entrySlug }: { entrySlug: string }) {
  // Keyed on the field guide, not the enhancement manifest: the three named
  // Aberrants that a surviving Advanced can seed have a dossier and a boss card
  // without being a species with its own design spec.
  const guide = bloomfallCreatureFieldGuide[entrySlug];
  if (!guide) return null;
  const title = bloomfallCreatureEnhancementBySlug.get(entrySlug)?.title ?? entrySlug.replaceAll("-", " ");

  if (guide.kind !== "ADAPTIVE") {
    const plate = getBloomfallCreatureHeroArt(entrySlug);
    return <section className="adaptive-mutation-panel adaptive-mutation-none" aria-labelledby="adaptive-mutation-title">
      <div className="adaptive-mutation-heading">
        <div><p className="eyebrow">Bloomfall ecology</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
        <span>{guide.kind === "BOSS" ? "EXCEPTIONAL ABERRANT" : "NONE"}</span>
      </div>
      <h3>{guide.kind === "BOSS" ? "Already an Aberrant." : "No adaptive progression."}</h3>
      <p>{guide.kind === "BOSS" ? guide.spawn : guide.whyFixed}</p>
      {plate ? <div className="adaptive-support-art">
        <p className="eyebrow">{guide.kind === "BOSS" ? "Current form" : "Canonical fixed form"}</p>
        <figure className="adaptive-support-plate">
          <a href={bloomfallCreatureArtUrl(plate)} target="_blank" rel="noreferrer">
            <img alt={`${title} key art`} src={bloomfallCreatureArtUrl(plate)} />
          </a>
        </figure>
      </div> : null}
      <ul className="adaptive-state-abilities is-standalone">
        {guide.abilities.map((item) => <li key={item.name}><strong>{item.name}.</strong> {bloomfallAbilitySentence(item)}</li>)}
      </ul>
      <p className="adaptive-mutation-note"><strong>Drops.</strong> {plainStoryProse(guide.drops)}</p>
    </section>;
  }

  const cards = bloomfallMutationCards(guide);

  return <section className="adaptive-mutation-panel" aria-labelledby="adaptive-mutation-title">
    <div className="adaptive-mutation-heading">
      <div><p className="eyebrow">Wound it · let it escape · meet it again</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
      <span>4 RUNGS + ABERRANT</span>
    </div>
    <p className="adaptive-mutation-intro">{guide.hook} {bloomfallLadderSummary}</p>
    <div className="adaptive-state-track" aria-label={`${title} mutation ladder`}>
      {cards.map((card) => <RungCard card={card} entrySlug={entrySlug} key={card.rung} />)}
    </div>
    <p className="adaptive-mutation-note">Development-only · Bloomfall Adaptive Mutation visual review · no runtime mutation logic is active.</p>
  </section>;
}
