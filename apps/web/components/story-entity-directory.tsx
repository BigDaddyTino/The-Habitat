/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Boxes, Compass, MapPin, Plus, Search, Sparkles, UserRoundSearch } from "lucide-react";
import { createEntry } from "@/app/codex/actions";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { getCharacterKeyart } from "@/lib/character-keyart";
import { getFactionBranding } from "@/lib/faction-branding";
import { getRegionBranding } from "@/lib/region-branding";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { listStoryEntries } from "@/lib/story-codex";
import { storyPlaceDescendants, storyPlaceKinds, storyPlaceRoot, type StoryPlaceLink } from "@habitat/shared";
import { modelGalleryImages, modelPreview, placeKindLabel, placeTypeOrder, storyCollections, type StoryCollectionSlug } from "@/lib/story-library";

const asRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const asRecords = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];


export async function StoryEntityDirectory({ collectionSlug, search, parent, placeKind }: {
  collectionSlug: StoryCollectionSlug;
  search?: string;
  /** Pre-selected parent region, from an "add a place here" link. */
  parent?: string;
  placeKind?: string;
}) {
  const collection = storyCollections[collectionSlug];
  const entries = await listStoryEntries({ kind: collection.kind, search });
  const castingImages = modelGalleryImages.filter((image) => image.pack === "Warriors_Pack" || image.pack === "CitySampleCrowd").slice(0, 6);

  // The regions library reads as an atlas, not a card dump: the world's few
  // top-level regions as large cards, with every other place filed inside the
  // one that contains it (meta.parent — stored once, grouped here). Falls back
  // to the flat grid for search results, and until a top-level region exists.
  const topRegions = collection.kind === "REGION" && !search ? entries.filter((entry) => asRecord(entry.meta).type === "region") : [];
  const atlasActive = topRegions.length > 0;
  const parentSlugOf = (entry: (typeof entries)[number]) => {
    const value = asRecord(entry.meta).parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const placeLinks: StoryPlaceLink[] = entries.map((entry) => ({ slug: entry.slug, parent: parentSlugOf(entry) }));
  const topSlugs = new Set(topRegions.map((region) => region.slug));
  const isTop = (slug: string) => topSlugs.has(slug);
  const isRegionLibrary = collection.kind === "REGION";
  // Everything already in the world can hold a place inside it — a POI can sit
  // in a zone as easily as in a whole region — so the parent list is every
  // region, top-level ones first.
  const placeParents = isRegionLibrary
    ? [...entries].sort((a, b) => Number(asRecord(b.meta).type === "region") - Number(asRecord(a.meta).type === "region") || a.title.localeCompare(b.title))
    : [];
  const addingInside = parent ? entries.find((entry) => entry.slug === parent) ?? null : null;
  /** Places sitting directly in a top-level region, each with its own inside. */
  const contained = new Map<string, Array<{ place: (typeof entries)[number]; inside: typeof entries }>>();
  const unplaced: typeof entries = [];
  if (atlasActive) {
    const rank = (entry: (typeof entries)[number]) => placeTypeOrder[String(asRecord(entry.meta).type)] ?? 9;
    const ordered = [...entries].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
    for (const entry of ordered) {
      if (topSlugs.has(entry.slug)) continue;
      const home = storyPlaceRoot(entry.slug, placeLinks, isTop);
      if (!home) { unplaced.push(entry); continue; }
      // Only the rung directly under the region gets a row; everything deeper
      // — however deep — is listed under that row. Direct children only here
      // would silently drop a place four rungs down: filed under a parent
      // that never gets a row of its own, it appeared nowhere on this page.
      if (parentSlugOf(entry) !== home) continue;
      const beneath = new Set(storyPlaceDescendants(entry.slug, placeLinks));
      const inside = ordered.filter((candidate) => beneath.has(candidate.slug));
      const bucket = contained.get(home);
      if (bucket) bucket.push({ place: entry, inside }); else contained.set(home, [{ place: entry, inside }]);
    }
  }

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

      {atlasActive ? <>
        <div className="region-atlas">
          {topRegions.map((region) => {
            const regionMeta = asRecord(region.meta);
            const places = contained.get(region.slug) ?? [];
            const regionBrand = getRegionBranding(region.slug);
            return <article className="region-atlas-card" key={region.id} style={regionBrand ? { "--region-accent": regionBrand.accent } as React.CSSProperties : undefined}>
              <Link className="region-atlas-head" href={`/codex/bible/${region.slug}`}>
                {regionBrand ? <img alt={`${region.title} environment key art`} src={regionBrand.keyart} /> : null}
                <div className="region-atlas-head-copy">
                  <p className="eyebrow"><Compass aria-hidden="true" size={11} /> {[regionMeta.biome, regionMeta.status].filter(Boolean).join(" · ") || "top-level region"}</p>
                  <h2>{region.title}</h2>
                  <p>{region.summary || "This region still needs its one-line pitch."}</p>
                  <strong>Open the region <ArrowRight aria-hidden="true" size={12} /></strong>
                </div>
              </Link>
              <div className="region-atlas-places">
                <p className="eyebrow">{places.length ? `${places.length} place${places.length === 1 ? "" : "s"} inside` : "Nothing placed here yet"}</p>
                <Link className="region-atlas-add" href={`/codex/library/regions?parent=${region.slug}&placeKind=site#new-entry`}>
                  <Plus aria-hidden="true" size={12} /> Add a place in {region.title}
                </Link>
                {places.length
                  ? <ul>{places.map(({ place, inside }) => {
                      const placeBrand = getRegionBranding(place.slug);
                      return <li key={place.id}>
                        <Link href={`/codex/bible/${place.slug}`}>
                          {placeBrand ? <img alt="" src={placeBrand.keyart} /> : <span className="region-place-fallback"><MapPin aria-hidden="true" size={15} /></span>}
                          <span><strong>{place.title}</strong><i>{placeKindLabel(asRecord(place.meta))}</i></span>
                          <ArrowRight aria-hidden="true" size={11} />
                        </Link>
                        {inside.length ? <ul className="region-atlas-destinations">
                          {inside.map((destination) => <li key={destination.id}>
                            <Link href={`/codex/bible/${destination.slug}`}>{destination.title}<i>{placeKindLabel(asRecord(destination.meta))}</i></Link>
                          </li>)}
                        </ul> : null}
                      </li>;
                    })}</ul>
                  : <p className="story-inspector-hint">Create a place below and pick this as its parent region.</p>}
              </div>
            </article>;
          })}
        </div>
        {unplaced.length ? <section className="region-atlas-unplaced">
          <div><p className="eyebrow"><MapPin aria-hidden="true" size={11} /> Not placed in a region yet</p>
          <p>Open each one and pick its parent region on the region sheet so it files into the atlas above.</p></div>
          <ul>{unplaced.map((place) => <li key={place.id}><Link href={`/codex/bible/${place.slug}`}>{place.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
        </section> : null}
      </> : entries.length > 0 ? <div className="entity-card-grid">
        {entries.map((entry) => {
          const meta = asRecord(entry.meta);
          const preview = modelPreview(meta.model);
          const characterKeyart = entry.kind === "CHARACTER" ? getCharacterKeyart(entry.slug) : null;
          const factionBrand = entry.kind === "FACTION" ? getFactionBranding(entry.slug) : null;
          const regionBrand = entry.kind === "REGION" ? getRegionBranding(entry.slug) : null;
          const characterFactionBrands = entry.kind === "CHARACTER"
            ? asRecords(meta.factions).flatMap((membership) => {
                const slug = typeof membership.faction === "string" ? membership.faction : "";
                const brand = getFactionBranding(slug);
                return brand ? [{ slug, brand }] : [];
              })
            : [];
          const activeBrand = factionBrand ?? regionBrand ?? characterFactionBrands[0]?.brand ?? null;
          const detail = entry.kind === "CHARACTER"
            ? [meta.species, asRecord(meta.magic).origin].filter(Boolean).join(" · ")
            : entry.kind === "FACTION"
              ? [meta.scope, meta.seat].filter(Boolean).join(" · ")
              : entry.kind === "REGION"
                ? [meta.type, meta.biome].filter(Boolean).join(" · ")
                : "";
          return <Link
            className={`entity-card${factionBrand ? " entity-card-faction" : ""}${regionBrand ? " entity-card-region" : ""}${characterFactionBrands.length ? " entity-card-character-affiliated" : ""}`}
            href={`/codex/bible/${entry.slug}`}
            key={entry.id}
            style={activeBrand ? { "--entity-accent": activeBrand.accent } as React.CSSProperties : undefined}
          >
            <div className="entity-card-visual">
              {factionBrand ? <>
                <img alt={`${entry.title} faction key art`} className="entity-card-keyart" src={factionBrand.keyart} />
                <span className="entity-card-logo"><img alt="" src={factionBrand.logo} /></span>
              </> : regionBrand ? <img alt={`${entry.title} environment key art`} className="entity-card-keyart" src={regionBrand.keyart} /> : characterKeyart ? <img alt={`${entry.title} character key art`} className="entity-card-keyart" src={characterKeyart} /> : preview ? <img alt={`${entry.title} selected game model`} src={`/model-gallery/${preview.image}`} /> : <div><UserRoundSearch aria-hidden="true" size={30} /><span>{entry.title.slice(0, 1)}</span></div>}
              {!factionBrand && characterFactionBrands.length ? <span className="character-card-factions" title="Faction affiliations">
                {characterFactionBrands.slice(0, 3).map(({ slug, brand }) => <img alt={`${slug.replaceAll("-", " ")} logo`} key={slug} src={brand.logo} />)}
                {characterFactionBrands.length > 3 ? <b>+{characterFactionBrands.length - 3}</b> : null}
              </span> : null}
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

      <details className="entity-create-panel" id="new-entry" open={(entries.length === 0 && !search) || Boolean(addingInside) || Boolean(placeKind)}>
        <summary><Plus aria-hidden="true" size={15} /><span>
          <strong>{isRegionLibrary ? (addingInside ? `Add a place inside ${addingInside.title}` : "Add a place") : `Add a new ${collection.singular}`}</strong>
          <small>{isRegionLibrary ? "A point of interest, a settlement, a zone, or a whole region — say where it sits and it files itself." : "Start with the pitch. The full visual sheet opens next."}</small>
        </span></summary>
        <form action={createEntry} className="story-form">
          <input name="kind" type="hidden" value={collection.kind} />
          <label>Name<input maxLength={120} name="title" placeholder={isRegionLibrary ? "Blackreef Watchtower" : collection.placeholder} required type="text" /></label>
          {isRegionLibrary ? <div className="sheet-grid">
            <label>What kind of place<select defaultValue={placeKind ?? "site"} name="placeKind">
              {storyPlaceKinds.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></label>
            <label>Inside which region<select defaultValue={addingInside?.slug ?? ""} name="parent">
              <option value="">Nowhere yet — a top-level region</option>
              {placeParents.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select></label>
          </div> : null}
          <label>One-line pitch<textarea maxLength={500} name="summary" placeholder={collection.summaryPlaceholder} rows={2} /></label>
          <label>What writers need to know<textarea maxLength={20000} name="body" placeholder="Write naturally. You can refine this later from the dossier." rows={6} /></label>
          <button className="save-server" type="submit"><Sparkles aria-hidden="true" size={14} /> Create and open dossier</button>
        </form>
      </details>

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
