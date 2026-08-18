/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Boxes, Plus, Search, Sparkles, UserRoundSearch } from "lucide-react";
import { createEntry } from "@/app/codex/actions";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { getFactionBranding } from "@/lib/faction-branding";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { listStoryEntries } from "@/lib/story-codex";
import { modelGalleryImages, modelPreview, storyCollections, type StoryCollectionSlug } from "@/lib/story-library";

const asRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};

export async function StoryEntityDirectory({ collectionSlug, search }: { collectionSlug: StoryCollectionSlug; search?: string }) {
  const collection = storyCollections[collectionSlug];
  const entries = await listStoryEntries({ kind: collection.kind, search });
  const castingImages = modelGalleryImages.filter((image) => image.pack === "Warriors_Pack" || image.pack === "CitySampleCrowd").slice(0, 6);

  return (
    <section className={`page-shell codex-shell entity-directory directory-${collectionSlug}`}>
      <StoryLiveSync />
      <header className="entity-directory-hero" style={{ "--directory-art": `url('${collection.hero}')` } as React.CSSProperties}>
        <div>
          <p className="eyebrow">{collection.eyebrow}</p>
          <h1>{collection.title}</h1>
          <p>{collection.description}</p>
          <div className="entity-directory-actions">
            <a className="primary-link" href="#new-entry"><Plus aria-hidden="true" size={14} /> Add {collection.singular}</a>
            <span>{entries.length} in the Codex</span>
          </div>
        </div>
        {collection.kind === "CHARACTER" ? <div className="casting-strip" aria-label="Available in-game model previews">{castingImages.map((image) => <img alt="" key={image.ref} src={`/model-gallery/${image.image}`} />)}<span>{modelGalleryImages.length} models ready to cast</span></div> : null}
      </header>

      <div className="entity-directory-toolbar">
        <form method="get"><Search aria-hidden="true" size={15} /><input aria-label={`Search ${collection.label}`} defaultValue={search ?? ""} name="q" placeholder={`Search ${collection.label.toLowerCase()}…`} type="search" /><button type="submit">Search</button></form>
        <Link href="/codex/bible">Browse every lore type <ArrowRight aria-hidden="true" size={13} /></Link>
      </div>

      {entries.length > 0 ? <div className="entity-card-grid">
        {entries.map((entry) => {
          const meta = asRecord(entry.meta);
          const preview = modelPreview(meta.model);
          const factionBrand = entry.kind === "FACTION" ? getFactionBranding(entry.slug) : null;
          const detail = entry.kind === "CHARACTER"
            ? [meta.species, asRecord(meta.magic).origin].filter(Boolean).join(" · ")
            : entry.kind === "FACTION"
              ? [meta.scope, meta.seat].filter(Boolean).join(" · ")
              : entry.kind === "REGION"
                ? [meta.type, meta.biome].filter(Boolean).join(" · ")
                : "";
          return <Link
            className={`entity-card${factionBrand ? " entity-card-faction" : ""}`}
            href={`/codex/bible/${entry.slug}`}
            key={entry.id}
            style={factionBrand ? { "--entity-accent": factionBrand.accent } as React.CSSProperties : undefined}
          >
            <div className="entity-card-visual">
              {factionBrand ? <>
                <img alt={`${entry.title} faction key art`} className="entity-card-keyart" src={factionBrand.keyart} />
                <span className="entity-card-logo"><img alt="" src={factionBrand.logo} /></span>
              </> : preview ? <img alt={`${entry.title} selected game model`} src={`/model-gallery/${preview.image}`} /> : <div><UserRoundSearch aria-hidden="true" size={30} /><span>{entry.title.slice(0, 1)}</span></div>}
              <i>{entry.status === "CANON" ? "Canon" : entry.status}</i>
            </div>
            <div className="entity-card-copy">
              <p className="eyebrow">{detail || collection.singular}</p>
              <h2>{entry.title}</h2>
              <p>{entry.summary || `Open this ${collection.singular} and give the next writer something to build on.`}</p>
              <footer><span>{entry.appearanceCount} story connection{entry.appearanceCount === 1 ? "" : "s"}</span><strong>Open dossier <ArrowRight aria-hidden="true" size={12} /></strong></footer>
            </div>
          </Link>;
        })}
      </div> : <div className="entity-empty"><Boxes aria-hidden="true" size={25} /><div><h2>No {collection.label.toLowerCase()} found.</h2><p>{search ? "Try a different search, or create the missing entry below." : `Create the first ${collection.singular} and start connecting the world.`}</p></div></div>}

      <details className="entity-create-panel" id="new-entry" open={entries.length === 0 && !search}>
        <summary><Plus aria-hidden="true" size={15} /><span><strong>Add a new {collection.singular}</strong><small>Start with the pitch. The full visual sheet opens next.</small></span></summary>
        <form action={createEntry} className="story-form">
          <input name="kind" type="hidden" value={collection.kind} />
          <label>Name<input maxLength={120} name="title" placeholder={collection.placeholder} required type="text" /></label>
          <label>One-line pitch<textarea maxLength={500} name="summary" placeholder={collection.summaryPlaceholder} rows={2} /></label>
          <label>What writers need to know<textarea maxLength={20000} name="body" placeholder="Write naturally. You can refine this later from the dossier." rows={6} /></label>
          <button className="save-server" type="submit"><Sparkles aria-hidden="true" size={14} /> Create and open dossier</button>
        </form>
      </details>

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
