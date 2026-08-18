/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, CircleHelp, Compass, Crown, GitBranch, MapPin, Network, Plus, Shield, Sparkles, Swords, UserRound } from "lucide-react";
import { storyEntryKindLabels, type StoryEntryKind, type StoryStatus } from "@habitat/shared";
import { getFactionBranding } from "@/lib/faction-branding";
import { getRegionBranding } from "@/lib/region-branding";
import { modelPreview } from "@/lib/story-library";

type Connection = { slug: string; title: string; kind: StoryEntryKind; relation: string };
/** A place directly inside this one, with whatever sits inside it in turn. */
type ContainedPlace = { slug: string; title: string; summary: string | null; label: string; inside?: Array<{ slug: string; title: string; label: string }> };
type Appearance = { id: string; title: string; via: "referenced" | "speaks"; arc: { slug: string; title: string } };

const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];
const words = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
const label = (value: unknown) => typeof value === "string" && value.trim() ? value : null;

function Fact({ label: name, value }: { label: string; value: unknown }) {
  const shown = label(value);
  return <div><dt>{name}</dt><dd>{shown ?? "Not decided"}</dd></div>;
}

function LoreLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/codex/bible/${slug}`}>{children}<ArrowRight aria-hidden="true" size={11} /></Link>;
}

export function StoryEntityProfile({ entry, existingArcSlugs = [], factionOptions = [], containedPlaces = [], placeAncestry = [], arcsHere = [], addChildKind = "site" }: { entry: {
  kind: StoryEntryKind;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  meta: Record<string, unknown> | null;
  status: StoryStatus;
  author: string;
  lastEditor: string | null;
  appearances: Appearance[];
  connections: Connection[];
}; existingArcSlugs?: string[]; factionOptions?: Array<{ slug: string; title: string }>; containedPlaces?: ContainedPlace[]; placeAncestry?: Array<{ slug: string; title: string }>; arcsHere?: Array<{ slug: string; title: string; isMainline: boolean; hook: string | null; where: { slug: string; title: string } | null }>; addChildKind?: string }) {
  const meta = record(entry.meta);
  const magic = record(meta.magic);
  const status = record(meta.status);
  const preview = modelPreview(meta.model);
  const isCharacter = entry.kind === "CHARACTER";
  const isFaction = entry.kind === "FACTION";
  const isRegion = entry.kind === "REGION";
  const factionBrand = isFaction ? getFactionBranding(entry.slug) : null;
  const regionBrand = isRegion ? getRegionBranding(entry.slug) : null;
  const characterAffiliations = isCharacter
    ? rows(meta.factions).flatMap((membership) => {
        const slug = label(membership.faction);
        const brand = slug ? getFactionBranding(slug) : null;
        if (!slug || !brand) return [];
        return [{
          brand,
          role: label(membership.role),
          slug,
          standing: label(membership.standing),
          title: factionOptions.find((option) => option.slug === slug)?.title ?? slug.replaceAll("-", " "),
        }];
      })
    : [];
  const activeBrand = factionBrand ?? regionBrand ?? characterAffiliations[0]?.brand ?? null;
  const questions = words(meta.openQuestions);
  // Children get their own organized section above; repeating each one in the
  // aside as "belongs inside this region" would just be the mess twice.
  const asideConnections = containedPlaces.length ? entry.connections.filter((connection) => connection.relation !== "belongs inside this region") : entry.connections;
  const entityLinks: Array<{ slug: string; detail: string }> = [];

  if (isCharacter) {
    for (const row of rows(meta.factions)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: label(row.role) ?? "Faction membership" });
    for (const row of rows(meta.relationships)) if (label(row.character)) entityLinks.push({ slug: String(row.character), detail: label(row.type) ?? "Character relationship" });
    if (label(meta.home)) entityLinks.push({ slug: String(meta.home), detail: "Home" });
  }
  if (isFaction) {
    for (const leader of words(meta.leaders)) entityLinks.push({ slug: leader, detail: "Leader" });
    for (const row of rows(meta.relations)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: label(row.stance) ?? "Faction relationship" });
    if (label(meta.seat)) entityLinks.push({ slug: String(meta.seat), detail: "Seat of power" });
  }
  if (isRegion) {
    for (const row of rows(meta.control)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: `${label(row.kind) ?? "influences"} this place` });
    for (const row of rows(meta.connections)) if (label(row.to)) entityLinks.push({ slug: String(row.to), detail: label(row.by) ?? "Connected region" });
    if (label(meta.parent)) entityLinks.push({ slug: String(meta.parent), detail: "Parent region" });
  }
  // Free-text values are legal in these fields; only slug-shaped ones can link.
  const slugShaped = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
  if (entry.kind === "CREATURE") for (const habitat of words(meta.biomes)) if (slugShaped(habitat)) entityLinks.push({ slug: habitat, detail: "Habitat" });
  if (entry.kind === "ITEM" && slugShaped(meta.origin)) entityLinks.push({ slug: meta.origin, detail: "Origin" });
  if (entry.kind === "EVENT") {
    for (const place of words(meta.where)) if (slugShaped(place)) entityLinks.push({ slug: place, detail: "Happened here" });
    for (const participant of words(meta.involved)) if (slugShaped(participant)) entityLinks.push({ slug: participant, detail: "Involved" });
  }

  return (
    <>
      <header
        className={`entity-profile-hero entity-profile-${entry.kind.toLowerCase()}${regionBrand ? " entity-profile-region-branded" : ""}${characterAffiliations.length ? " entity-profile-character-affiliated" : ""}`}
        style={activeBrand ? { "--entity-accent": activeBrand.accent } as React.CSSProperties : undefined}
      >
        <div className="entity-profile-art">
          {factionBrand ? <>
            <img alt={`${entry.title} faction key art`} className="entity-profile-keyart" src={factionBrand.keyart} />
            <div className="faction-profile-logo"><img alt={`${entry.title} logo`} src={factionBrand.logo} /></div>
          </> : regionBrand ? <img alt={`${entry.title} environment key art`} className="entity-profile-keyart" src={regionBrand.keyart} /> : preview ? <img alt={`${entry.title} selected in-game model`} src={`/model-gallery/${preview.image}`} /> : <div className="entity-profile-placeholder">{isFaction ? <Shield aria-hidden="true" /> : isRegion ? <Compass aria-hidden="true" /> : <UserRound aria-hidden="true" />}<span>{entry.title.slice(0, 1)}</span></div>}
          {factionBrand ? <span>Faction identity · original key art</span> : regionBrand ? <span>Region identity · original environment key art</span> : preview ? <span>In-game model · {preview.asset}</span> : isCharacter ? <span>No in-game model cast yet</span> : null}
        </div>
        <div className="entity-profile-copy">
          <p className="eyebrow">{storyEntryKindLabels[entry.kind]} dossier · {entry.status === "CANON" ? "Canon" : entry.status}</p>
          {/* A destination three rungs down is meaningless without its address. */}
          {placeAncestry.length ? <nav aria-label="Where this sits" className="place-trail">
            {placeAncestry.map((ancestor) => <span key={ancestor.slug}><Link href={`/codex/bible/${ancestor.slug}`}>{ancestor.title}</Link><ChevronRight aria-hidden="true" size={11} /></span>)}
          </nav> : null}
          <h1>{entry.title}</h1>
          <p className="entity-profile-summary">{entry.summary ?? "This entry still needs its one-line pitch."}</p>
          {characterAffiliations.length ? <div className="character-profile-affiliations" aria-label="Faction affiliations">
            {characterAffiliations.map(({ brand, role, slug, standing, title }) => <Link href={`/codex/bible/${slug}`} key={slug} style={{ "--affiliation-accent": brand.accent } as React.CSSProperties}>
              <img alt="" src={brand.logo} />
              <span><small>Faction affiliation</small><strong>{title}</strong>{role || standing ? <em>{[role, standing].filter(Boolean).join(" · ")}</em> : null}</span>
              <ArrowRight aria-hidden="true" size={12} />
            </Link>)}
          </div> : null}
          <p className="entity-profile-byline">Created by {entry.author}{entry.lastEditor && entry.lastEditor !== entry.author ? ` · last shaped by ${entry.lastEditor}` : ""}</p>
        </div>
      </header>

      {(isCharacter || isFaction || isRegion || entry.kind === "CREATURE" || entry.kind === "ITEM" || entry.kind === "EVENT") ? <dl className="entity-fact-ribbon">
        {isCharacter ? <><Fact label="Full name" value={meta.fullName} /><Fact label="Species" value={meta.species} /><Fact label="Pronouns" value={meta.pronouns} /><Fact label="Magic" value={magic.origin} /><Fact label="Known status" value={status.known} /></> : null}
        {isFaction ? <><Fact label="Power" value={meta.scope} /><Fact label="Seat" value={meta.seat} /><Fact label="Game tag" value={meta.gameTag} /><Fact label="Leaders" value={words(meta.leaders).length ? `${words(meta.leaders).length} named` : null} /></> : null}
        {isRegion ? <><Fact label="Place type" value={meta.type} /><Fact label="Biome" value={meta.biome} /><Fact label="Population" value={meta.population} /><Fact label="World state" value={meta.status} /><Fact label="Game tag" value={meta.gameTag} /></> : null}
        {entry.kind === "CREATURE" ? <><Fact label="Category" value={meta.category} /><Fact label="Habitats" value={words(meta.biomes).length ? words(meta.biomes).join(", ") : null} /><Fact label="Threat" value={meta.threat} /></> : null}
        {entry.kind === "ITEM" ? <><Fact label="Category" value={meta.category} /><Fact label="Rarity" value={meta.rarity} /><Fact label="Origin" value={meta.origin} /></> : null}
        {entry.kind === "EVENT" ? <><Fact label="When" value={meta.when} /><Fact label="Where" value={words(meta.where).length ? words(meta.where).join(", ") : null} /><Fact label="Involved" value={words(meta.involved).length ? `${words(meta.involved).length} named` : null} /></> : null}
      </dl> : null}

      <div className="entity-profile-layout">
        <article className="entity-profile-narrative">
          <p className="eyebrow"><BookOpen aria-hidden="true" size={12} /> Writer briefing</p>
          {entry.body ? entry.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="story-inspector-hint">No briefing has been written yet. Open the editing workspace below and give the next writer a foundation.</p>}
          {isCharacter && label(meta.storyRole) ? <blockquote><Sparkles aria-hidden="true" size={16} /><div><strong>Why this character exists</strong><p>{String(meta.storyRole)}</p></div></blockquote> : null}
          {isFaction && words(meta.goals).length ? <div className="entity-goals"><p className="eyebrow">What they want</p><ul>{words(meta.goals).map((goal) => <li key={goal}><Swords aria-hidden="true" size={12} />{goal}</li>)}</ul></div> : null}
          {isRegion ? <div className="entity-contained-places">
            <p className="eyebrow"><MapPin aria-hidden="true" size={12} /> Inside {entry.title}</p>
            {containedPlaces.length ? <ul>{containedPlaces.map((place) => {
              const placeBrand = getRegionBranding(place.slug);
              return <li key={place.slug}>
                {placeBrand ? <img alt="" src={placeBrand.keyart} /> : null}
                <div><Link href={`/codex/bible/${place.slug}`}><strong>{place.title}</strong><i>{place.label}</i><ArrowRight aria-hidden="true" size={11} /></Link>
                {place.summary ? <p>{place.summary}</p> : null}
                {/* The third rung, shown in place: a POI's own destinations
                    are the rooms a player stands in, and burying them one
                    click deeper is what made them easy to lose. */}
                {place.inside?.length ? <ul className="place-destinations">
                  {place.inside.map((destination) => <li key={destination.slug}>
                    <Link href={`/codex/bible/${destination.slug}`}>{destination.title}<i>{destination.label}</i></Link>
                  </li>)}
                </ul> : null}</div>
              </li>;
            })}</ul> : <p className="story-inspector-hint">Nothing is placed inside this yet.</p>}
            {/* The obvious place to think "add a POI here" is the region
                itself, so the button lives here and carries the parent with it. */}
            <Link className="entity-add-place" href={`/codex/library/regions?parent=${entry.slug}&placeKind=${addChildKind}#new-entry`}>
              <Plus aria-hidden="true" size={13} /> Add a place in {entry.title}
            </Link>
          </div> : null}
          {isRegion && arcsHere.length ? <div className="entity-quests-here">
            <p className="eyebrow"><Compass aria-hidden="true" size={12} /> Quests that begin here</p>
            <ul>{arcsHere.map((arc) => <li key={arc.slug}>
              <Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{arc.isMainline ? "mainline" : "side quest"}</i><ArrowRight aria-hidden="true" size={11} /></Link>
              {arc.hook ? <p>{arc.hook}</p> : null}
              {arc.where ? <span>picked up at <Link href={`/codex/bible/${arc.where.slug}`}>{arc.where.title}</Link>, inside this</span> : null}
            </li>)}</ul>
          </div> : null}
        </article>

        <aside className="entity-connections">
          <section>
            <p className="eyebrow"><GitBranch aria-hidden="true" size={12} /> Story & quest connections</p>
            {entry.appearances.length ? <ul>{entry.appearances.map((node) => <li key={node.id}><Link href={`/codex/arc/${node.arc.slug}`}>{node.title}<ArrowRight aria-hidden="true" size={11} /></Link><span>{node.arc.title}{node.via === "speaks" ? " · dialogue speaker" : " · referenced"}</span></li>)}</ul> : <p className="story-inspector-hint">No written scene touches this yet.</p>}
            {isCharacter ? rows(meta.involvement).map((row) => {
              if (!label(row.arc)) return null;
              const arcSlug = String(row.arc);
              // A planned arc that nobody has opened yet has nowhere to link —
              // that is the point of planning it. Show it as a marker instead
              // of a link to a page that does not exist.
              const exists = existingArcSlugs.includes(arcSlug);
              return <div className="planned-connection" key={arcSlug}>
                {exists
                  ? <Link href={`/codex/arc/${arcSlug}`}><GitBranch aria-hidden="true" size={12} /> {arcSlug.replaceAll("-", " ")}</Link>
                  : <strong className="planned-unwritten"><GitBranch aria-hidden="true" size={12} /> {arcSlug.replaceAll("-", " ")}</strong>}
                {label(row.how) ? <p>{String(row.how)}</p> : null}
                <span>{exists ? "Planned involvement" : "Planned involvement — arc not opened yet"}</span>
              </div>;
            }) : null}
          </section>

          <section>
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> World connections</p>
            {entityLinks.length || asideConnections.length ? <ul>
              {entityLinks.map((connection, index) => <li key={`${connection.slug}-${index}`}><LoreLink slug={connection.slug}>{connection.slug.replaceAll("-", " ")}</LoreLink><span>{connection.detail}</span></li>)}
              {asideConnections.map((connection) => <li key={`${connection.slug}-${connection.relation}`}><LoreLink slug={connection.slug}>{connection.title}</LoreLink><span>{connection.relation}</span></li>)}
            </ul> : <p className="story-inspector-hint">Nothing else in the world points here yet.</p>}
          </section>

          {questions.length ? <section className="entity-open-questions"><p className="eyebrow"><CircleHelp aria-hidden="true" size={12} /> Open writing</p><ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul></section> : null}
          {/* The breadcrumb covers a resolved parent; this is left for the case
              it does not resolve — a parent slug nobody has written yet. */}
          {isRegion && label(meta.parent) && !placeAncestry.length ? <p className="entity-map-note"><MapPin aria-hidden="true" size={13} /> Meant to sit inside <strong>{String(meta.parent).replaceAll("-", " ")}</strong>, which nobody has written yet</p> : null}
          {isFaction && words(meta.leaders).length ? <p className="entity-map-note"><Crown aria-hidden="true" size={13} /> {words(meta.leaders).length} named leader{words(meta.leaders).length === 1 ? "" : "s"}</p> : null}
        </aside>
      </div>
    </>
  );
}
