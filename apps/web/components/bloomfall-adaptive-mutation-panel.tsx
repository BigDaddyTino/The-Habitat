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
import { bloomfallStateGuide } from "@/lib/bloomfall-creature-enhancements";
import { bloomfallAbilitySentence, type BloomfallStateGuide } from "@/lib/bloomfall-creature-field-guide";

type AdaptiveAsset = BloomfallAdaptiveP0Asset | BloomfallAdaptiveP1P2Asset;

function assetUrl(asset: AdaptiveAsset) {
  return "reusedAsset" in asset ? bloomfallAdaptiveP1P2AssetUrl(asset) : bloomfallAdaptiveP0AssetUrl(asset);
}

function StateCard({ asset, guide }: { asset: AdaptiveAsset; guide?: BloomfallStateGuide }) {
  const url = assetUrl(asset);
  return <article className="adaptive-state-card">
    <a className="adaptive-state-image" href={url} target="_blank" rel="noreferrer">
      <img alt={asset.alt} src={url} />
      <span>Open full resolution</span>
    </a>
    <div className="adaptive-state-copy">
      <p className="eyebrow">{asset.purpose.replaceAll("_", " ")}</p>
      <h4>{asset.state}</h4>
      {/* A state with reader copy shows what the mutation grants; the
          support and continuity art keeps its own caption. */}
      {guide ? <>
        <p>{guide.read}</p>
        <ul className="adaptive-state-abilities">{guide.abilities.map((item) => <li key={item.name}><strong>{item.name}.</strong> {bloomfallAbilitySentence(item)}</li>)}</ul>
        <p><strong>Counter.</strong> {guide.counter}</p>
        <p><strong>How it gets there.</strong> {guide.unlock}</p>
      </> : <>
        <p><strong>Physical.</strong> {asset.physicalChanges}</p>
        <p><strong>Function.</strong> {asset.functionalChanges}</p>
      </>}
    </div>
  </article>;
}

/** Prompt C proof surface. The resolver returns null outside DEVELOPMENT. */
export function BloomfallAdaptiveMutationPanel({ entrySlug }: { entrySlug: string }) {
  const presentation = getBloomfallAdaptiveP1P2Presentation(entrySlug) ?? getBloomfallAdaptiveP0Presentation(entrySlug);
  if (!presentation) return null;

  if (presentation.kind === "NONE") {
    return <section className="adaptive-mutation-panel adaptive-mutation-none" aria-labelledby="adaptive-mutation-title">
      <div className="adaptive-mutation-heading">
        <div><p className="eyebrow">Bloomfall ecology</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
        <span>NONE</span>
      </div>
      <h3>No documented adaptive progression.</h3>
      <p>{presentation.enhancement.tierReason}</p>
      {presentation.assets.length ? <div className="adaptive-support-art">
        <p className="eyebrow">Canonical fixed form</p>
        {presentation.assets.map((asset) => <StateCard asset={asset} key={asset.id} />)}
      </div> : null}
      <p className="adaptive-mutation-note">This is an explicit classification, not missing data. Fixed Blackbloom anatomy, mechanical integration, and human-lineage exposure remain distinct from Adaptive Mutation.</p>
    </section>;
  }

  const isExceptional = presentation.kind === "EXCEPTIONAL";
  const stateAssets = presentation.assets.filter((asset) => asset.purpose === "STATE_REFERENCE");
  const supportAssets = presentation.assets.filter((asset) => asset.purpose !== "STATE_REFERENCE");
  const cards = isExceptional ? presentation.assets : stateAssets;

  return <section className={`adaptive-mutation-panel${isExceptional ? " adaptive-mutation-exceptional" : ""}`} aria-labelledby="adaptive-mutation-title">
    <div className="adaptive-mutation-heading">
      <div><p className="eyebrow">Development visual proof · {isExceptional ? "case continuity" : "state progression"}</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
      <span>{isExceptional ? "EXCEPTIONAL ABERRANT" : presentation.enhancement.mutationEligibility}</span>
    </div>
    <p className="adaptive-mutation-intro">{presentation.enhancement.tierReason}</p>
    <div className={`adaptive-state-track${isExceptional ? " is-continuity" : ""}`} aria-label={isExceptional ? `${presentation.enhancement.title} continuity sequence` : `${presentation.enhancement.title} known mutation states`}>
      {cards.map((asset, index) => {
        const state = isExceptional ? undefined : presentation.enhancement.states[index];
        return <StateCard asset={asset} guide={state ? bloomfallStateGuide(presentation.enhancement, state) : undefined} key={asset.id} />;
      })}
    </div>
    {!isExceptional && supportAssets.length ? <div className="adaptive-support-art">
      <p className="eyebrow">Ecology in motion</p>
      {supportAssets.map((asset) => <StateCard asset={asset} key={asset.id} />)}
    </div> : null}
    <p className="adaptive-mutation-note">Development-only · Bloomfall Adaptive Mutation visual review · no runtime mutation logic is active.</p>
  </section>;
}
