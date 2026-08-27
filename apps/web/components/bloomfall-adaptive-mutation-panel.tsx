/* eslint-disable @next/next/no-img-element */
import {
  bloomfallAdaptiveP0AssetUrl,
  getBloomfallAdaptiveP0Presentation,
  type BloomfallAdaptiveP0Asset,
} from "@/lib/bloomfall-adaptive-p0";
import {
  bloomfallAdaptiveP1P2AssetUrl,
  getBloomfallAdaptiveP1P2Presentation,
  type BloomfallAdaptiveP1P2Asset,
} from "@/lib/bloomfall-adaptive-p1p2";
import {
  bloomfallCreatureGuide,
  bloomfallMutationCards,
  type BloomfallMutationCard,
} from "@/lib/bloomfall-creature-enhancements";
import { bloomfallAbilitySentence } from "@/lib/bloomfall-creature-field-guide";
import { bloomfallLadderSummary } from "@/lib/bloomfall-adaptive-ladder";

type AdaptiveAsset = BloomfallAdaptiveP0Asset | BloomfallAdaptiveP1P2Asset;

function assetUrl(asset: AdaptiveAsset) {
  return "reusedAsset" in asset ? bloomfallAdaptiveP1P2AssetUrl(asset) : bloomfallAdaptiveP0AssetUrl(asset);
}

/**
 * One rung of the ladder: its picture where the art package has one, and
 * underneath it the only three things a player needs — which rung this is,
 * what the stats do, and what it can suddenly do to them.
 *
 * The art packages predate the ladder and hold a different number of plates
 * per species, so a rung without a plate keeps its slot and says so rather
 * than borrowing the picture next to it.
 */
function RungCard({ card, asset }: { card: BloomfallMutationCard; asset: AdaptiveAsset | undefined }) {
  const url = asset ? assetUrl(asset) : null;
  return <article className={`adaptive-state-card rung-${card.rung.toLowerCase()}`}>
    {url && asset
      ? <a className="adaptive-state-image" href={url} target="_blank" rel="noreferrer">
          <img alt={asset.alt} src={url} />
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
      <p className="adaptive-state-drop"><strong>Drops.</strong> {card.drop}</p>
    </div>
  </article>;
}

/** The Adaptive Mutation gallery. The resolver returns null outside DEVELOPMENT. */
export function BloomfallAdaptiveMutationPanel({ entrySlug }: { entrySlug: string }) {
  const presentation = getBloomfallAdaptiveP1P2Presentation(entrySlug) ?? getBloomfallAdaptiveP0Presentation(entrySlug);
  if (!presentation) return null;
  const guide = bloomfallCreatureGuide(presentation.enhancement);

  if (guide.kind !== "ADAPTIVE") {
    const stateAssets = presentation.assets.filter((asset) => asset.purpose !== "STATE_REFERENCE");
    return <section className="adaptive-mutation-panel adaptive-mutation-none" aria-labelledby="adaptive-mutation-title">
      <div className="adaptive-mutation-heading">
        <div><p className="eyebrow">Bloomfall ecology</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
        <span>{guide.kind === "BOSS" ? "EXCEPTIONAL ABERRANT" : "NONE"}</span>
      </div>
      <h3>{guide.kind === "BOSS" ? "Already an Aberrant." : "No adaptive progression."}</h3>
      <p>{guide.kind === "BOSS" ? guide.spawn : guide.whyFixed}</p>
      {(guide.kind === "BOSS" ? presentation.assets : stateAssets).length ? <div className="adaptive-support-art">
        <p className="eyebrow">{guide.kind === "BOSS" ? "Current form" : "Canonical fixed form"}</p>
        {(guide.kind === "BOSS" ? presentation.assets : stateAssets).map((asset) => <figure className="adaptive-support-plate" key={asset.id}>
          <a href={assetUrl(asset)} target="_blank" rel="noreferrer"><img alt={asset.alt} src={assetUrl(asset)} /></a>
        </figure>)}
      </div> : null}
      <ul className="adaptive-state-abilities is-standalone">
        {guide.abilities.map((item) => <li key={item.name}><strong>{item.name}.</strong> {bloomfallAbilitySentence(item)}</li>)}
      </ul>
      <p className="adaptive-mutation-note"><strong>Drops.</strong> {guide.drops}</p>
    </section>;
  }

  const cards = bloomfallMutationCards(guide);
  // The plates were shot against the old per-species state lists, so they are
  // attached in order and simply run out on species whose package is shorter
  // than the ladder. Nothing borrows a neighbour's picture.
  const plates = presentation.assets.filter((asset) => asset.purpose === "STATE_REFERENCE");

  return <section className="adaptive-mutation-panel" aria-labelledby="adaptive-mutation-title">
    <div className="adaptive-mutation-heading">
      <div><p className="eyebrow">Wound it · let it escape · meet it again</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
      <span>4 RUNGS + ABERRANT</span>
    </div>
    <p className="adaptive-mutation-intro">{guide.hook} {bloomfallLadderSummary}</p>
    <div className="adaptive-state-track" aria-label={`${presentation.enhancement.title} mutation ladder`}>
      {cards.map((card, index) => <RungCard asset={plates[index]} card={card} key={card.rung} />)}
    </div>
    <p className="adaptive-mutation-note">Development-only · Bloomfall Adaptive Mutation visual review · no runtime mutation logic is active.</p>
  </section>;
}
