/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Boxes, CalendarClock, Cog, Compass, GitBranch, Handshake, MapPin, Plus, Search, Sparkles, UserRoundSearch } from "lucide-react";
import { storyCompanionMissionStatusLabels, storyStoryStageLabels, type StoryCompanionMissionStatus, type StoryStoryStage } from "@habitat/shared";
import { createEntry } from "@/app/codex/actions";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { getCharacterKeyart } from "@/lib/character-keyart";
import { getCreatureKeyart } from "@/lib/creature-keyart";
import { getFactionBranding } from "@/lib/faction-branding";
import { getRegionBranding } from "@/lib/region-branding";
import { getSystemArt, systemArtSlot } from "@/lib/system-art";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { listStoryArcRefs, listStoryEntries } from "@/lib/story-codex";
import { plainStoryProse } from "@/lib/story-prose";
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
  const isSystemsLibrary = collection.kind === "SYSTEM";
  const isMissionsLibrary = collection.kind === "COMPANION_MISSION";
  const isRacesLibrary = collection.kind === "CREATURE";
  const isFactionsLibrary = collection.kind === "FACTION";

  // The missions library reads as chains, not a card dump: every mission
  // filed under its companion, in chain order, wearing its development
  // status. Falls back to the flat grid for search results.
  const companionsForMissions = isMissionsLibrary ? await listStoryEntries({ kind: "CHARACTER" }) : [];
  // An entry is born connected. Every create panel below asks the one
  // question that files the new entry into the world — where a character
  // calls home, where a faction sits, where an item came from, where an
  // event happened — because an entry created loose is one somebody has to
  // remember to adopt, and nobody does.
  const wantsRegionPicker = ["CHARACTER", "FACTION", "ITEM", "EVENT", "CREATURE"].includes(collection.kind);
  const regionsForPickers = wantsRegionPicker ? await listStoryEntries({ kind: "REGION" }) : [];
  const factionsForPickers = collection.kind === "CHARACTER" ? await listStoryEntries({ kind: "FACTION" }) : [];
  // The whole races shelf, grouped: a character is one of a *people* (Tino is
  // a Human) and the race above it is the umbrella, so the picker offers both
  // rungs with the peoples filed under the race they belong to.
  const shelfForPickers = collection.kind === "CHARACTER" ? await listStoryEntries({ kind: "CREATURE" }) : [];
  const raceOf = (option: (typeof shelfForPickers)[number]) => { const parent = asRecord(option.meta).parent; return typeof parent === "string" && parent.trim() ? parent.trim() : null; };
  const peoplesByRace = shelfForPickers
    .filter((option) => !raceOf(option))
    .map((race) => ({ race, peoples: shelfForPickers.filter((option) => raceOf(option) === race.slug) }));
  const missionChains = new Map<string, typeof entries>();
  const looseMissions: typeof entries = [];
  if (isMissionsLibrary && !search) {
    const orderOf = (mission: (typeof entries)[number]) => (typeof asRecord(mission.meta).order === "number" ? (asRecord(mission.meta).order as number) : 99);
    for (const mission of [...entries].sort((a, b) => orderOf(a) - orderOf(b) || a.title.localeCompare(b.title))) {
      const companion = asRecord(mission.meta).companion;
      if (typeof companion === "string" && companion.trim()) {
        const bucket = missionChains.get(companion.trim());
        if (bucket) bucket.push(mission); else missionChains.set(companion.trim(), [mission]);
      } else looseMissions.push(mission);
    }
  }
  const missionChainsActive = isMissionsLibrary && !search && entries.length > 0;
  const missionStatusLabel = (value: unknown) => (typeof value === "string" && value in storyCompanionMissionStatusLabels ? storyCompanionMissionStatusLabels[value as StoryCompanionMissionStatus] : null);
  const missionStageLabel = (value: unknown) => (typeof value === "string" && value in storyStoryStageLabels ? storyStoryStageLabels[value as StoryStoryStage] : null);

  // The release plan: every system filed under the moment the story hands it
  // to the player. An arc link beats a stage note beats nothing — and nothing
  // is shown as a hole to fill, not quietly dropped, because an unscheduled
  // system is exactly the one writers will accidentally write toward too early.
  const arcRefs = isSystemsLibrary ? await listStoryArcRefs() : [];
  const releaseDayOne: typeof entries = [];
  const releaseByArc = new Map<string, typeof entries>();
  const releaseByStage = new Map<string, typeof entries>();
  const releaseUnscheduled: typeof entries = [];
  if (isSystemsLibrary && !search) {
    for (const entry of entries) {
      const meta = asRecord(entry.meta);
      const unlockArc = typeof meta.unlockArc === "string" && meta.unlockArc.trim() ? meta.unlockArc.trim() : null;
      const unlockStage = typeof meta.unlockStage === "string" && meta.unlockStage.trim() ? meta.unlockStage.trim() : null;
      // A child system ships with its parent; it only appears on the rail when
      // it sets a gate of its own (a Blood Moon scheduled apart from the sky).
      const parent = typeof meta.parent === "string" && meta.parent.trim() ? meta.parent.trim() : null;
      if (parent && !unlockArc && !unlockStage) continue;
      if (unlockArc) {
        const bucket = releaseByArc.get(unlockArc);
        if (bucket) bucket.push(entry); else releaseByArc.set(unlockArc, [entry]);
      } else if (unlockStage && /day one|start/i.test(unlockStage)) releaseDayOne.push(entry);
      else if (unlockStage) {
        const bucket = releaseByStage.get(unlockStage);
        if (bucket) bucket.push(entry); else releaseByStage.set(unlockStage, [entry]);
      } else releaseUnscheduled.push(entry);
    }
  }
  const releaseArcGroups = [
    ...arcRefs.filter((arc) => releaseByArc.has(arc.slug)).map((arc) => ({ slug: arc.slug, title: arc.title, linked: true, systems: releaseByArc.get(arc.slug) as typeof entries })),
    // An unlock arc that no longer resolves still gets a row — a system gated
    // on a renamed or archived quest is a problem to see, not to hide.
    ...[...releaseByArc.keys()].filter((slug) => !arcRefs.some((arc) => arc.slug === slug)).map((slug) => ({ slug, title: slug, linked: false, systems: releaseByArc.get(slug) as typeof entries })),
  ];
  const releasePlanActive = isSystemsLibrary && !search && entries.length > 0;
  // Systems read as a flattened tree. Races keep the landing page to the top
  // rung; opening a parent reveals its children on that race's dossier.
  const systemParentOf = (entry: (typeof entries)[number]) => {
    const value = asRecord(entry.meta).parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  // Real titles, not de-slugged guesses: "the-sun-and-moon" is titled
  // "The Sun & Moon", and the ampersand does not survive a replaceAll.
  const systemTitles = new Map(entries.map((entry) => [entry.slug, entry.title]));
  const orderedEntries = (isRacesLibrary || isFactionsLibrary) && !search
    ? entries.filter((entry) => !systemParentOf(entry))
    : isSystemsLibrary && !search
      ? (() => {
        const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
        const childrenOf = new Map<string, typeof entries>();
        const tops: typeof entries = [];
        for (const entry of entries) {
          const parent = systemParentOf(entry);
          // A child whose parent is missing files as top-level: visible, not lost.
          if (parent && bySlug.has(parent)) {
            const bucket = childrenOf.get(parent);
            if (bucket) bucket.push(entry); else childrenOf.set(parent, [entry]);
          } else tops.push(entry);
        }
        const ordered: typeof entries = [];
        const walk = (entry: (typeof entries)[number]) => {
          ordered.push(entry);
          for (const child of childrenOf.get(entry.slug) ?? []) walk(child);
        };
        for (const top of tops) walk(top);
        return ordered;
        })()
      : entries;
  // The board is derived from the sheets, never from a table shipped beside
  // it: a power written this morning belongs on it this morning. A banner is
  // a faction with nothing above it; standing outside every sphere is its own
  // fact the sheet carries, because no count of wings can tell the two apart.
  const standsOutside = (entry: (typeof entries)[number]) => asRecord(entry.meta).independent === true;
  const factionTopLevel = isFactionsLibrary
    ? entries.filter((entry) => !systemParentOf(entry)).sort((a, b) => a.title.localeCompare(b.title))
    : [];
  const majorFactionEntries = search ? [] : factionTopLevel.filter((entry) => !standsOutside(entry));
  const independentFactionEntries = search ? [] : factionTopLevel.filter(standsOutside);
  const factionWings = new Map<string, typeof entries>();
  if (isFactionsLibrary && !search) for (const entry of entries) {
    const banner = systemParentOf(entry);
    if (!banner) continue;
    const bucket = factionWings.get(banner);
    if (bucket) bucket.push(entry); else factionWings.set(banner, [entry]);
  }
  const factionBoardActive = isFactionsLibrary && !search && majorFactionEntries.length > 0;
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
  const systemParents = isSystemsLibrary ? [...entries].sort((a, b) => a.title.localeCompare(b.title)) : [];
  // Only actual races can be picked as a parent — a race is one with nothing
  // above it, so offering a member here would build a third rung the library
  // does not render.
  const raceParents = isRacesLibrary ? entries.filter((entry) => !systemParentOf(entry)).sort((a, b) => a.title.localeCompare(b.title)) : [];
  /** Only major powers may be a banner — offering a wing would build a rung
   *  the shelf does not render, and a power that answers to nobody is not a
   *  banner to file under. Same law as the races parent picker. Derived from
   *  the full shelf rather than the board, so the picker still works mid-search. */
  const factionBanners = factionTopLevel.filter((entry) => !standsOutside(entry));
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
            <span>{isRacesLibrary && !search ? `${orderedEntries.length} parent races` : isFactionsLibrary && !search ? "Nobody holds this peninsula alone" : `${entries.length} in the Codex`}</span>
          </div>
        </div>
        {collection.kind === "CHARACTER" ? <div className="casting-strip" aria-label="Available in-game model previews">{castingImages.map((image) => <img alt="" key={image.ref} src={`/model-gallery/${image.image}`} />)}<span>{modelGalleryImages.length} models ready to cast</span></div> : null}
      </header>

      <div className="entity-directory-toolbar">
        <form method="get"><Search aria-hidden="true" size={15} /><input aria-label={`Search ${collection.label}`} defaultValue={search ?? ""} name="q" placeholder={`Search ${collection.label.toLowerCase()}…`} type="search" /><button type="submit">Search</button></form>
        {collection.kind === "EVENT" ? <Link href="/codex/timeline">See history as a timeline <ArrowRight aria-hidden="true" size={13} /></Link> : null}
        <Link href="/codex/bible">Browse every lore type <ArrowRight aria-hidden="true" size={13} /></Link>
      </div>

      {releasePlanActive ? <section className="system-release-plan">
        <div className="section-heading"><div><p className="eyebrow"><CalendarClock aria-hidden="true" size={12} /> The release plan</p><h2>When the story hands each system to the player</h2></div><p>Set on each system’s sheet — link the quest arc that unlocks it, or leave a stage note until that arc exists. Kingdom management is not a day-one verb; this page is where that pacing stays honest.</p></div>
        <div className="system-release-rail">
          {releaseDayOne.length > 0 ? <article className="system-release-group is-dayone">
            <p className="eyebrow"><Sparkles aria-hidden="true" size={11} /> From the first session</p>
            <ul>{releaseDayOne.map((system) => <li key={system.id}><Link href={`/codex/bible/${system.slug}`}>{system.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
          </article> : null}
          {releaseArcGroups.map((group) => <article className="system-release-group is-arc" key={group.slug}>
            <p className="eyebrow"><GitBranch aria-hidden="true" size={11} /> Unlocked by {group.linked ? <Link href={`/codex/arc/${group.slug}`}>{group.title}</Link> : <s title="This arc no longer exists — repoint the sheet">{group.title}</s>}</p>
            <ul>{group.systems.map((system) => <li key={system.id}><Link href={`/codex/bible/${system.slug}`}>{system.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
          </article>)}
          {[...releaseByStage.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([stage, systems]) => <article className="system-release-group is-stage" key={stage}>
            <p className="eyebrow"><CalendarClock aria-hidden="true" size={11} /> {stage}</p>
            <ul>{systems.map((system) => <li key={system.id}><Link href={`/codex/bible/${system.slug}`}>{system.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
          </article>)}
          {releaseUnscheduled.length > 0 ? <article className="system-release-group is-unscheduled">
            <p className="eyebrow"><MapPin aria-hidden="true" size={11} /> Not scheduled yet</p>
            <p className="story-inspector-hint">Open each sheet and set the arc or stage that unlocks it, so nobody writes toward it too early.</p>
            <ul>{releaseUnscheduled.map((system) => <li key={system.id}><Link href={`/codex/bible/${system.slug}`}>{system.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
          </article> : null}
        </div>
      </section> : null}

      {missionChainsActive ? <div className="companion-mission-chains">
        {[...missionChains.entries()].map(([companionSlug, missions]) => {
          const companion = companionsForMissions.find((candidate) => candidate.slug === companionSlug) ?? null;
          const companionArt = companion ? getCharacterKeyart(companion.slug) : null;
          return <article className="companion-mission-chain-card" key={companionSlug}>
            <Link className="companion-mission-chain-head" href={`/codex/bible/${companionSlug}`}>
              {companionArt ? <img alt={`${companion?.title ?? companionSlug} key art`} src={companionArt} /> : <span className="companion-chain-fallback"><Handshake aria-hidden="true" size={20} /></span>}
              <span>
                <small><Handshake aria-hidden="true" size={11} /> Companion arc{companion ? "" : " — character not written yet"}</small>
                <strong>{companion?.title ?? companionSlug.replaceAll("-", " ")}</strong>
                <em>{missions.length} mission{missions.length === 1 ? "" : "s"} in the chain</em>
              </span>
              <ArrowRight aria-hidden="true" size={13} />
            </Link>
            <ol>
              {missions.map((mission) => {
                const meta = asRecord(mission.meta);
                const status = missionStatusLabel(meta.missionStatus);
                return <li key={mission.id}>
                  <span className="companion-chain-order">{typeof meta.order === "number" ? String(meta.order) : "·"}</span>
                  <Link href={`/codex/bible/${mission.slug}`}>
                    <strong>{mission.title}</strong>
                    <span>{mission.summary ? plainStoryProse(mission.summary) : "No summary yet."}</span>
                  </Link>
                  <span className="companion-chain-facts">{[status, missionStageLabel(meta.stage)].filter(Boolean).join(" · ") || "unstatused"}</span>
                </li>;
              })}
            </ol>
          </article>;
        })}
        {looseMissions.length ? <section className="region-atlas-unplaced">
          <div><p className="eyebrow"><Handshake aria-hidden="true" size={11} /> Not filed under a companion yet</p>
          <p>Open each one and set whose arc it belongs to on the mission sheet.</p></div>
          <ul>{looseMissions.map((mission) => <li key={mission.id}><Link href={`/codex/bible/${mission.slug}`}>{mission.title}<ArrowRight aria-hidden="true" size={11} /></Link></li>)}</ul>
        </section> : null}
      </div> : atlasActive ? <>
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
                  <p>{region.summary ? plainStoryProse(region.summary) : "This region still needs its one-line pitch."}</p>
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
      </> : factionBoardActive ? <div className="faction-power-board">
        <section className="faction-major-section">
          <div className="section-heading faction-power-heading">
            <div><p className="eyebrow"><GitBranch aria-hidden="true" size={12} /> The balance of power</p><h2>The banners, and everyone beneath them.</h2></div>
            <p><strong>Major does not mean important.</strong> It means a power can move the world’s balance on its own. A wing may be more famous, dangerous, or present in the player’s story; the filing shows political gravity, not a chain of command.</p>
          </div>
          <div className="faction-banner-grid">
            {majorFactionEntries.map((entry) => {
              const meta = asRecord(entry.meta);
              const brand = getFactionBranding(entry.slug);
              const wings = [...(factionWings.get(entry.slug) ?? [])].sort((a, b) => a.title.localeCompare(b.title));
              return <article className="faction-banner-card" key={entry.id} style={brand ? { "--faction-accent": brand.accent } as React.CSSProperties : undefined}>
                <Link className="faction-banner-hero" href={`/codex/bible/${entry.slug}`}>
                  {brand ? <img alt={`${entry.title} faction key art`} src={brand.keyart} /> : null}
                  <span className="faction-banner-shade" />
                  <span className="faction-banner-identity">
                    {brand ? <span className="faction-banner-logo"><img alt="" src={brand.logo} /></span> : null}
                    <span><small>{[meta.scope, meta.seat].filter(Boolean).join(" · ") || "Major power"}</small><strong>{entry.title}</strong><em>{wings.length} wing{wings.length === 1 ? "" : "s"} beneath this banner</em></span>
                  </span>
                </Link>
                <div className="faction-banner-copy">
                  <p>{entry.summary ? plainStoryProse(entry.summary) : "This power still needs its one-line pitch."}</p>
                  <div className="faction-wing-list">
                    <p className="eyebrow">Inside its sphere</p>
                    {wings.length ? <ul>{wings.map((wing) => {
                      const wingBrand = getFactionBranding(wing.slug);
                      return <li key={wing.id}><Link href={`/codex/bible/${wing.slug}`}>{wingBrand ? <img alt="" src={wingBrand.logo} /> : null}<span><strong>{wing.title}</strong><small>{asRecord(wing.meta).scope as string || "Faction wing"}</small></span><ArrowRight aria-hidden="true" size={11} /></Link></li>;
                    })}</ul> : <p className="story-inspector-hint">No wings are filed beneath this power.</p>}
                  </div>
                  <Link className="faction-banner-open" href={`/codex/bible/${entry.slug}`}>Open full dossier <ArrowRight aria-hidden="true" size={12} /></Link>
                </div>
              </article>;
            })}
          </div>
        </section>

        <section className="faction-independent-section">
          <div className="section-heading faction-power-heading">
            <div><p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> Answering to nobody</p><h2>Independent powers</h2></div>
            <p>These sit outside every banner’s political sphere. Independence is a specific world fact here, set on the power’s own sheet — never an unfinished parent field the shelf guessed at.</p>
          </div>
          <div className="faction-independent-grid">
            {independentFactionEntries.map((entry) => {
              const brand = getFactionBranding(entry.slug);
              return <Link className="faction-independent-card" href={`/codex/bible/${entry.slug}`} key={entry.id} style={brand ? { "--faction-accent": brand.accent } as React.CSSProperties : undefined}>
                {brand ? <img className="faction-independent-art" alt={`${entry.title} faction key art`} src={brand.keyart} /> : null}
                <span className="faction-independent-shade" />
                <span className="faction-independent-copy">
                  {brand ? <span className="faction-independent-logo"><img alt="" src={brand.logo} /></span> : null}
                  <span><small>Independent power</small><strong>{entry.title}</strong><em>{entry.summary ? plainStoryProse(entry.summary) : "Open dossier"}</em></span>
                  <ArrowRight aria-hidden="true" size={13} />
                </span>
              </Link>;
            })}
          </div>
        </section>
      </div> : entries.length > 0 ? <div className="entity-card-grid">
        {orderedEntries.map((entry) => {
          const meta = asRecord(entry.meta);
          const preview = modelPreview(meta.model);
          const characterKeyart = entry.kind === "CHARACTER" ? getCharacterKeyart(entry.slug) : null;
          const creatureKeyart = entry.kind === "CREATURE" ? getCreatureKeyart(entry.slug) : null;
          const systemArt = entry.kind === "SYSTEM" ? getSystemArt(entry.slug) : null;
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
                : entry.kind === "SYSTEM"
                  ? [
                      typeof meta.parent === "string" && meta.parent ? `inside ${systemTitles.get(meta.parent) ?? String(meta.parent).replaceAll("-", " ")}` : null,
                      meta.category,
                      typeof meta.unlockStage === "string" && meta.unlockStage ? meta.unlockStage : meta.unlockArc ? "story-gated" : null,
                    ].filter(Boolean).join(" · ")
                  : entry.kind === "CREATURE"
                    ? [
                        typeof meta.parent === "string" && meta.parent ? `one of the ${systemTitles.get(meta.parent) ?? String(meta.parent).replaceAll("-", " ")}` : "a race",
                        meta.category,
                      ].filter(Boolean).join(" · ")
                  : entry.kind === "COMPANION_MISSION"
                    ? [
                        typeof meta.companion === "string" && meta.companion ? `${String(meta.companion).replaceAll("-", " ")}'s arc` : null,
                        typeof meta.order === "number" ? `mission ${meta.order}` : null,
                        missionStageLabel(meta.stage),
                      ].filter(Boolean).join(" · ")
                    : "";
          return <Link
            // A child in a flattened tree needs to look like one, or the
            // grid reads as a flat list that happens to be oddly sorted.
            className={`entity-card${(isRacesLibrary || isSystemsLibrary || isFactionsLibrary) && systemParentOf(entry) ? " entity-card-nested" : ""}${factionBrand ? " entity-card-faction" : ""}${regionBrand ? " entity-card-region" : ""}${characterFactionBrands.length ? " entity-card-character-affiliated" : ""}`}
            href={`/codex/bible/${entry.slug}`}
            key={entry.id}
            style={activeBrand ? { "--entity-accent": activeBrand.accent } as React.CSSProperties : undefined}
          >
            <div className="entity-card-visual">
              {factionBrand ? <>
                <img alt={`${entry.title} faction key art`} className="entity-card-keyart" src={factionBrand.keyart} />
                <span className="entity-card-logo"><img alt="" src={factionBrand.logo} /></span>
              </> : regionBrand ? <img alt={`${entry.title} environment key art`} className="entity-card-keyart" src={regionBrand.keyart} /> : characterKeyart ? <img alt={`${entry.title} character key art`} className="entity-card-keyart" src={characterKeyart} /> : creatureKeyart ? <img alt={`${entry.title} creature key art`} className="entity-card-keyart" src={creatureKeyart} /> : systemArt ? <img alt={`${entry.title} system key art`} className="entity-card-keyart" src={systemArt} /> : entry.kind === "SYSTEM" ? <div className="system-art-slot"><Cog aria-hidden="true" size={24} /><span>Art slot</span><code>{systemArtSlot(entry.slug)}</code></div> : preview ? <img alt={`${entry.title} selected game model`} src={`/model-gallery/${preview.image}`} /> : <div><UserRoundSearch aria-hidden="true" size={30} /><span>{entry.title.slice(0, 1)}</span></div>}
              {!factionBrand && characterFactionBrands.length ? <span className="character-card-factions" title="Faction affiliations">
                {characterFactionBrands.slice(0, 3).map(({ slug, brand }) => <img alt={`${slug.replaceAll("-", " ")} logo`} key={slug} src={brand.logo} />)}
                {characterFactionBrands.length > 3 ? <b>+{characterFactionBrands.length - 3}</b> : null}
              </span> : null}
              {entry.kind === "CHARACTER" && asRecord(meta.companion).capable === true ? <span className="companion-badge is-card" title={[asRecord(meta.companion).availability, asRecord(meta.companion).status].filter((value) => typeof value === "string" && value).join(" · ") || "Can join the party as an active companion"}>
                <Handshake aria-hidden="true" size={12} /> Companion
              </span> : null}
              <i>{entry.kind === "COMPANION_MISSION" ? missionStatusLabel(meta.missionStatus) ?? "Unstatused" : entry.status === "CANON" ? "Canon" : entry.status}</i>
            </div>
            <div className="entity-card-copy">
              <p className="eyebrow">{detail || collection.singular}</p>
              <h2>{entry.title}</h2>
              <p>{entry.summary ? plainStoryProse(entry.summary) : `Open this ${collection.singular} and give the next writer something to build on.`}</p>
              <footer><span>{entry.appearanceCount} story connection{entry.appearanceCount === 1 ? "" : "s"}</span><strong>{isRacesLibrary ? "See its children" : isFactionsLibrary && !systemParentOf(entry) ? "See its wings" : "Open dossier"} <ArrowRight aria-hidden="true" size={12} /></strong></footer>
            </div>
          </Link>;
        })}
      </div> : <div className="entity-empty"><Boxes aria-hidden="true" size={25} /><div><h2>No {collection.label.toLowerCase()} found.</h2><p>{search ? "Try a different search, or create the missing entry below." : `Create the first ${collection.singular} and start connecting the world.`}</p></div></div>}

      <details className="entity-create-panel" id="new-entry" open={(entries.length === 0 && !search) || Boolean(addingInside) || Boolean(placeKind)}>
        <summary><Plus aria-hidden="true" size={15} /><span>
          <strong>{isRegionLibrary ? (addingInside ? `Add a place inside ${addingInside.title}` : "Add a place") : isSystemsLibrary && addingInside ? `Add a system inside ${addingInside.title}` : isRacesLibrary ? (addingInside ? `Add one of the ${addingInside.title}` : "Add a race, or something that belongs to one") : isFactionsLibrary ? (addingInside ? `Add a wing of ${addingInside.title}` : "Add a power, or a wing of one") : `Add a new ${collection.singular}`}</strong>
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
          {isSystemsLibrary ? <label>Part of which system<select defaultValue={addingInside?.slug ?? ""} name="parent">
            <option value="">Nothing — a top-level system</option>
            {systemParents.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          {isFactionsLibrary ? <label>Which power it answers to<select defaultValue={addingInside?.slug ?? ""} name="parent">
            <option value="">No one above it — major or deliberately independent</option>
            {factionBanners.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          {isRacesLibrary ? <label>Which race it belongs to<select defaultValue={addingInside?.slug ?? ""} name="parent">
            <option value="">Nothing above it — this IS a new race</option>
            {raceParents.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          {collection.kind === "CHARACTER" ? <>
            {peoplesByRace.length ? <label>What are their people?<select defaultValue="" name="species">
              <option value="">Not decided yet</option>
              {peoplesByRace.map(({ race, peoples }) => (
                <optgroup key={race.slug} label={race.title}>
                  <option value={race.slug}>{race.title} — the race itself</option>
                  {peoples.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
                </optgroup>
              ))}
            </select>
            <small className="sheet-hint">Their race’s dossier will list them back. You can write something more complicated on the sheet later.</small></label> : null}
            <label>Where do they call home?<select defaultValue="" name="home">
              <option value="">Not decided yet</option>
              {regionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select></label>
            {factionsForPickers.length ? <label>Who do they run with?<select multiple name="factions" size={4}>
              {factionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select>
            <small className="sheet-hint">Hold Ctrl (or ⌘) to pick more than one. Leave it empty if they answer to nobody.</small></label> : null}
          </> : null}
          {collection.kind === "FACTION" ? <label>Where is their seat of power?<select defaultValue="" name="seat">
            <option value="">Not decided yet</option>
            {regionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          {collection.kind === "ITEM" ? <label>Where did it come from?<select defaultValue="" name="origin">
            <option value="">Not decided yet</option>
            {regionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          {collection.kind === "EVENT" ? <label>Where did it happen?<select multiple name="where" size={4}>
            {regionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select>
          <small className="sheet-hint">Hold Ctrl (or ⌘) if it happened in more than one place.</small></label> : null}
          {isRacesLibrary && regionsForPickers.length ? <label>Where does it live?<select multiple name="biomes" size={4}>
            {regionsForPickers.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select>
          <small className="sheet-hint">Hold Ctrl (or ⌘) to pick more than one range.</small></label> : null}
          {isMissionsLibrary ? <div className="sheet-grid">
            <label>Whose companion arc<select defaultValue="" name="companion">
              <option value="">Not decided yet</option>
              {companionsForMissions.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select></label>
            <label>Order in their chain<input max={99} min={1} name="order" placeholder="1" type="number" /></label>
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
