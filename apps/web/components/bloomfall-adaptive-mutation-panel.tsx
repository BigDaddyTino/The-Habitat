/* eslint-disable @next/next/no-img-element */
import {
  bloomfallAdaptiveP0AssetUrl,
  getBloomfallAdaptiveP0Presentation,
  type BloomfallAdaptiveP0Asset,
} from "@/lib/bloomfall-adaptive-p0";

function StateCard({ asset, trigger, physical, functional, combat }: { asset: BloomfallAdaptiveP0Asset; trigger?: string; physical?: string; functional?: string; combat?: string }) {
  return <article className="adaptive-state-card">
    <a className="adaptive-state-image" href={bloomfallAdaptiveP0AssetUrl(asset)} target="_blank" rel="noreferrer">
      <img alt={asset.alt} src={bloomfallAdaptiveP0AssetUrl(asset)} />
      <span>Open full resolution</span>
    </a>
    <div className="adaptive-state-copy">
      <p className="eyebrow">{asset.purpose.replaceAll("_", " ")}</p>
      <h4>{asset.state}</h4>
      {trigger ? <p><strong>Trigger.</strong> {trigger}</p> : null}
      <p><strong>Physical.</strong> {physical ?? asset.physicalChanges}</p>
      <p><strong>Function.</strong> {functional ?? asset.functionalChanges}</p>
      {combat ? <p><strong>Behavior / combat.</strong> {combat}</p> : null}
    </div>
  </article>;
}

/** Prompt C proof surface. The resolver returns null outside DEVELOPMENT. */
export function BloomfallAdaptiveMutationPanel({ entrySlug }: { entrySlug: string }) {
  const presentation = getBloomfallAdaptiveP0Presentation(entrySlug);
  if (!presentation) return null;

  if (presentation.kind === "NONE") {
    return <section className="adaptive-mutation-panel adaptive-mutation-none" aria-labelledby="adaptive-mutation-title">
      <div className="adaptive-mutation-heading">
        <div><p className="eyebrow">Bloomfall ecology</p><h2 id="adaptive-mutation-title">Adaptive Mutation</h2></div>
        <span>NONE</span>
      </div>
      <h3>No documented adaptive progression.</h3>
      <p>{presentation.enhancement.tierReason}</p>
      <p className="adaptive-mutation-note">This is an explicit classification, not missing data. The Glasswing Kite&apos;s Blackbloom anatomy is a fixed regional specialization.</p>
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
    <p className="adaptive-mutation-intro">{isExceptional
      ? "Human-lineage case evidence. This is not a Baseline → Exposed → Adapted → Bloom-Evolved ladder; consciousness remains unresolved."
      : presentation.enhancement.tierReason}</p>
    <div className={`adaptive-state-track${isExceptional ? " is-continuity" : ""}`} aria-label={isExceptional ? "The Last Shift continuity sequence" : `${presentation.enhancement.title} known mutation states`}>
      {cards.map((asset, index) => {
        const state = isExceptional ? undefined : presentation.enhancement.states[index];
        return <StateCard asset={asset} combat={state ? `${state.behavior} ${state.combat}` : undefined} functional={state?.function} key={asset.id} physical={state?.physicalChanges} trigger={state?.triggers} />;
      })}
    </div>
    {!isExceptional && supportAssets.length ? <div className="adaptive-support-art">
      <p className="eyebrow">Ecology in motion</p>
      {supportAssets.map((asset) => <StateCard asset={asset} key={asset.id} />)}
    </div> : null}
    <p className="adaptive-mutation-note">Development-only · Bloomfall Adaptive Mutation P0 · no runtime mutation logic is active.</p>
  </section>;
}
