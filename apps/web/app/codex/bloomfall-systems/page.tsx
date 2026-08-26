import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { storyReviewRole } from "@/lib/story-codex";
import { StoryProse } from "@/components/story-prose";
import { BloomfallSystemPanel } from "@/components/bloomfall-system-panel";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallIntegrationRecords,
  bloomfallSystemPages,
} from "@/lib/bloomfall-codex-integration";

export const metadata = { title: "Bloomfall Codex systems review" };

/**
 * The owner review surface for the Bloomfall Codex systems package.
 *
 * The seven dossiers live in the Codex proper and read best there. This page
 * exists so the whole package can be judged in one pass: every system, its
 * stored prose, and its comparative panel, in the order a reader meets them.
 */
export default async function BloomfallSystemsReviewPage() {
  if (process.env.HABITAT_ENVIRONMENT !== "development") notFound();
  await requireRole(storyReviewRole);

  const created = bloomfallSystemPages.filter((page) => page.authoring === "NEW").length;

  return <section className="page-shell codex-shell adaptive-review-page">
    <div className="page-intro">
      <Link className="codex-back" href="/codex/review"><ArrowLeft aria-hidden="true" size={13} /> Codex review</Link>
      <p className="eyebrow">Development only · owner review gate</p>
      <h1>Bloomfall Codex systems</h1>
      <p>
        Seven interconnected dossiers, {created} of them created by this pass and the rest upgraded in place, plus {bloomfallAllCrossLinkBlocks.length} cross-link
        blocks that connect the regions, places, creatures, resources, characters, and regional stories back to the systems that govern them.
        Everything below is canon world behaviour; the mechanics it describes are future gameplay design, and no runtime simulation of any of it exists in the game build.
      </p>
      <dl className="adaptive-review-totals">
        <div><dt>System dossiers</dt><dd>{bloomfallIntegrationRecords.length}</dd></div>
        <div><dt>Created</dt><dd>{created}</dd></div>
        <div><dt>Upgraded</dt><dd>{bloomfallIntegrationRecords.length - created}</dd></div>
        <div><dt>Cross-link blocks</dt><dd>{bloomfallAllCrossLinkBlocks.length}</dd></div>
      </dl>
    </div>

    <section className="adaptive-review-section">
      <header>
        <p className="eyebrow">The network</p>
        <h2>How the Reach hangs together</h2>
        <p>The same diagram the Bloomfall Reach dossier carries. Follow one arrow and the region stops being a set of separate pages.</p>
      </header>
      <BloomfallSystemPanel entrySlug="bloomfall-reach" />
    </section>

    {bloomfallIntegrationRecords.map((record) => <section className="adaptive-review-section" key={record.slug}>
      <header>
        <p className="eyebrow">{record.authoring === "NEW" ? "Created by this pass" : "Upgraded in place"}</p>
        <h2>{record.title}</h2>
        <p>{record.summary}</p>
        <p><Link className="adaptive-full-link" href={`/codex/bible/${record.slug}`}>Open the dossier <ArrowRight aria-hidden="true" size={12} /></Link></p>
      </header>
      <article className="entity-profile-narrative">
        <StoryProse body={record.body} resolve={(slug) => ({ title: slug.replaceAll("-", " "), href: `/codex/bible/${slug}` })} />
      </article>
      <BloomfallSystemPanel entrySlug={record.slug} />
    </section>)}
  </section>;
}
