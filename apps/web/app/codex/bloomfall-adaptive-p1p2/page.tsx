/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { storyReviewRole } from "@/lib/story-codex";
import {
  bloomfallAdaptiveP1P2Assets,
  bloomfallAdaptiveP1P2AssetUrl,
  bloomfallAdaptiveP1P2GenerationSummary,
  bloomfallAdaptiveP1P2ReusedAssets,
  bloomfallAdaptiveP1P2SelectedAssets,
  bloomfallAdaptiveP1P2Version,
  type BloomfallAdaptiveP1P2Asset,
} from "@/lib/bloomfall-adaptive-p1p2";

export const metadata = { title: "Bloomfall Adaptive Mutation P1/P2 review" };

function ReviewCard({ asset }: { asset: BloomfallAdaptiveP1P2Asset }) {
  const url = bloomfallAdaptiveP1P2AssetUrl(asset);
  return <article className={`adaptive-review-card status-${asset.status.toLowerCase()}`}>
    <a className="adaptive-review-image" href={url} target="_blank" rel="noreferrer"><img alt={asset.alt} src={url} /></a>
    <div>
      <p className="eyebrow">{asset.status.replaceAll("_", " ")} · iteration {asset.generationIteration ?? asset.reusedAsset}</p>
      <h3>{asset.state}</h3>
      <p>{asset.functionalChanges}</p>
      <p>{asset.matureTone}</p>
      {asset.reviewNote ? <p className="adaptive-review-note">{asset.reviewNote}</p> : null}
      <a className="adaptive-full-link" href={url} target="_blank" rel="noreferrer">Full resolution <ExternalLink aria-hidden="true" size={12} /></a>
    </div>
  </article>;
}

const sections = [
  { slug: "rootback-grazer", title: "Rootback Grazer", note: "Functional adaptive · defensive filtration and terrain stability, never predation." },
  { slug: "mirejaw", title: "Mirejaw", note: "Functional adaptive · one persistent-promotion-eligible wetland lineage." },
  { slug: "sump-eel", title: "Sump Eel", note: "Minor adaptive · one deliberately bounded charge-storage step." },
  { slug: "glasswing-kite", title: "Glasswing Kite", note: "NONE · one canonical fixed-form warning species hero." },
  { slug: "spore-lantern-colony", title: "Spore Lantern Colony", note: "NONE · fixed animal-fungal-algal ecology, no invented ladder." },
  { slug: "switchmother", title: "Switchmother", note: "Exceptional Aberrant · engineered provenance followed by the locked V3 current hero." },
  { slug: "old-drowner", title: "Old Drowner", note: "Exceptional Aberrant · uncertain probable lineage followed by the singular hydrological form." },
  { slug: "maintenance-unit-m-17", title: "Maintenance Unit M-17 (Mender)", note: "NONE · mechanical-organic repair history is not Adaptive Mutation." },
  { slug: "the-bellwether", title: "The Bellwether", note: "Exceptional Aberrant · P0 Hart comparison plus locked V3 hero; no fifth Hart state." },
] as const;

export default async function BloomfallAdaptiveP1P2ReviewPage() {
  if (process.env.HABITAT_ENVIRONMENT !== "development") notFound();
  await requireRole(storyReviewRole);

  return <section className="page-shell codex-shell adaptive-review-page">
    <div className="page-intro">
      <Link className="codex-back" href="/codex/review"><ArrowLeft aria-hidden="true" size={13} /> Codex review</Link>
      <p className="eyebrow">Development only · owner visual gate</p>
      <h1>Bloomfall Adaptive Mutation P1/P2</h1>
      <p>Package <code>{bloomfallAdaptiveP1P2Version}</code>. Fourteen selected finals complete the required P1/P2 visual matrix. Fixed forms and exceptional history are intentionally separated from ordinary adaptive ladders.</p>
      <dl className="adaptive-review-totals">
        <div><dt>Selected</dt><dd>{bloomfallAdaptiveP1P2SelectedAssets.length}</dd></div>
        <div><dt>Revised</dt><dd>{bloomfallAdaptiveP1P2GenerationSummary.revisedSubjects}</dd></div>
        <div><dt>Rejected</dt><dd>{bloomfallAdaptiveP1P2GenerationSummary.rejectedAttempts}</dd></div>
        <div><dt>Reused</dt><dd>{bloomfallAdaptiveP1P2ReusedAssets.length}</dd></div>
      </dl>
    </div>

    {sections.map((section) => {
      const assets = bloomfallAdaptiveP1P2Assets
        .filter((asset) => asset.entitySlug === section.slug && asset.status !== "REJECTED")
        .sort((left, right) => section.slug === "the-bellwether" ? Number(left.status !== "REUSED_P0") - Number(right.status !== "REUSED_P0") : 0);
      return <section className="adaptive-review-section" data-review-section={section.slug} key={section.slug}>
        <header><p className="eyebrow">P1/P2 visual treatment</p><h2>{section.title}</h2><p>{section.note}</p></header>
        <div className={`adaptive-review-grid entity-${section.slug}`}>{assets.map((asset) => <ReviewCard asset={asset} key={asset.id} />)}</div>
      </section>;
    })}

    <section className="adaptive-review-section" data-review-section="bloommarked-remnant">
      <header><p className="eyebrow">Explicit scope protection</p><h2>Bloommarked Remnant</h2><p>NONE. Human lineage remains protected; Blackbloom Exposure is not Seven-Phase Corruption. Optional P3 art was not generated and this is not missing data.</p></header>
    </section>
  </section>;
}
