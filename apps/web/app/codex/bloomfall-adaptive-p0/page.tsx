/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { storyReviewRole } from "@/lib/story-codex";
import {
  bloomfallAdaptiveP0Assets,
  bloomfallAdaptiveP0Package,
  bloomfallAdaptiveP0RevisionAssets,
  bloomfallAdaptiveP0ReusedAssets,
  bloomfallAdaptiveP0SelectedAssets,
  bloomfallAdaptiveP0Version,
  type BloomfallAdaptiveP0Asset,
} from "@/lib/bloomfall-adaptive-p0";

export const metadata = { title: "SUPERSEDED — Bloomfall Adaptive Mutation P0 history" };

function reviewUrl(asset: BloomfallAdaptiveP0Asset) {
  if (asset.existingV3Reused) return `/codex-art/bloomfall-v3/${asset.filename}`;
  const kind = asset.status === "REVISE" ? "bloomfall-adaptive-p0-source" : bloomfallAdaptiveP0Package;
  return `/codex-art/${kind}/${asset.filename}`;
}

function ReviewCard({ asset }: { asset: BloomfallAdaptiveP0Asset }) {
  const url = reviewUrl(asset);
  return <article className={`adaptive-review-card status-${asset.status.toLowerCase()}`}>
    <a className="adaptive-review-image" href={url} target="_blank" rel="noreferrer"><img alt={asset.alt} src={url} /></a>
    <div>
      <p className="eyebrow">UNAPPROVED HISTORICAL · {asset.status.replaceAll("_", " ")} · iteration {asset.generationIteration ?? "V3"}</p>
      <h3>{asset.state}</h3>
      <p>{asset.functionalChanges}</p>
      {asset.reviewNote ? <p className="adaptive-review-note">{asset.reviewNote}</p> : null}
      <a className="adaptive-full-link" href={url} target="_blank" rel="noreferrer">Full resolution <ExternalLink aria-hidden="true" size={12} /></a>
    </div>
  </article>;
}

export default async function BloomfallAdaptiveP0ReviewPage() {
  if (process.env.HABITAT_ENVIRONMENT !== "development") notFound();
  await requireRole(storyReviewRole);
  const sections = [
    { slug: "blackbloom-hart", title: "Blackbloom Hart", note: "Advanced natural adaptation · state order is anatomical evidence, not a power ladder." },
    { slug: "latchhound", title: "Latchhound", note: "Aggressive circuit survival · the same predator under escalating infrastructure pressure." },
    { slug: "the-last-shift", title: "The Last Shift", note: "Exceptional human-lineage continuity · before/current evidence, never generic adaptive stages." },
  ] as const;

  return <section className="page-shell codex-shell adaptive-review-page">
    <div className="page-intro">
      <Link className="codex-back" href="/codex/review"><ArrowLeft aria-hidden="true" size={13} /> Codex review</Link>
      <p className="eyebrow">Superseded · unapproved historical evidence</p>
      <h1>Bloomfall Adaptive Mutation P0 — Historical package</h1>
      <p>Package <code>{bloomfallAdaptiveP0Version}</code> is retired and was never owner-approved. It remains available only as iteration evidence; its internal selected, final, and reused labels do not make it canon or a continuity source. Only art returned by the current live Codex resolver is authoritative.</p>
      <dl className="adaptive-review-totals">
        <div><dt>Historical picks</dt><dd>{bloomfallAdaptiveP0SelectedAssets.length}</dd></div>
        <div><dt>Revision records</dt><dd>{bloomfallAdaptiveP0RevisionAssets.length}</dd></div>
        <div><dt>Rejected records</dt><dd>{bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "REJECTED").length}</dd></div>
        <div><dt>Referenced live context</dt><dd>{bloomfallAdaptiveP0ReusedAssets.length}</dd></div>
      </dl>
    </div>

    {sections.map((section) => <section className="adaptive-review-section" data-review-section={section.slug} key={section.slug}>
      <header><p className="eyebrow">Superseded P0 sequence</p><h2>{section.title}</h2><p>{section.note}</p></header>
      <div className={`adaptive-review-grid entity-${section.slug}`}>
        {bloomfallAdaptiveP0Assets.filter((asset) => asset.entitySlug === section.slug && asset.status !== "REVISE").map((asset) => <ReviewCard asset={asset} key={asset.id} />)}
      </div>
      {bloomfallAdaptiveP0RevisionAssets.some((asset) => asset.entitySlug === section.slug) ? <details className="adaptive-revision-drawer">
        <summary>Revision evidence ({bloomfallAdaptiveP0RevisionAssets.filter((asset) => asset.entitySlug === section.slug).length})</summary>
        <div className="adaptive-review-grid is-revision">{bloomfallAdaptiveP0RevisionAssets.filter((asset) => asset.entitySlug === section.slug).map((asset) => <ReviewCard asset={asset} key={asset.id} />)}</div>
      </details> : null}
    </section>)}

    <section className="adaptive-review-section" data-review-section="v3-references">
      <header><p className="eyebrow">Live-resolved context · package use superseded</p><h2>Independent live references</h2><p>These files remain authoritative only where the current live resolver serves them. Their appearance in this historical package does not approve the package.</p></header>
      <div className="adaptive-review-grid is-reference">{bloomfallAdaptiveP0ReusedAssets.map((asset) => <ReviewCard asset={asset} key={asset.id} />)}</div>
    </section>
  </section>;
}
