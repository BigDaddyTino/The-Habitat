/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Boxes, CalendarClock, ChevronRight, CircleHelp, Compass, Crown, Flag, GitBranch, Handshake, History, Lightbulb, ListOrdered, MapPin, Network, Plus, Settings2, Shield, Sparkles, Swords, UserRound } from "lucide-react";
import {
  canonicalStoryEntryRouteSlug,
  isUnconfirmedThreadStatus,
  storyArcCategoryLabels,
  storyCompanionMissionStatusLabels,
  storyBodyWithoutCorruptionLadder,
  storyCorruptionLadderSlugs,
  storyCorruptionPhase,
  storyCorruptionPhaseLabel,
  storyCorruptionPhases,
  storyEntryKindLabels,
  storyStoryStageLabels,
  storyThreadCategoryLabels,
  storyThreadStatusLabels,
  type StoryArcCategory,
  type StoryCompanionMissionStatus,
  type StoryEntryKind,
  type StoryStatus,
  type StoryStoryStage,
  type StoryThreadCategory,
  type StoryThreadStatus,
} from "@habitat/shared";
import { codexArtSized, codexArtSrcSet } from "@/lib/codex-art-derivative";
import { dossierArtSlot, getDossierArt } from "@/lib/dossier-art";
import { timelineEraLabel } from "@/lib/story-timeline";
import { getFactionBranding } from "@/lib/faction-branding";
import { getRegionBranding } from "@/lib/region-branding";
import { getPlaceKeyart } from "@/lib/place-art";
import { modelPreview } from "@/lib/story-library";
import { bloomfallCreatureFieldGuide } from "@/lib/bloomfall-creature-field-guide";
import { StoryProse, StoryProseLine, type ProseResolver } from "@/components/story-prose";
import { BloomfallAdaptiveMutationPanel } from "@/components/bloomfall-adaptive-mutation-panel";
import { BloomfallSystemPanel } from "@/components/bloomfall-system-panel";

/**
 * The dossier hero is the only fluid art box in the codex: the whole width of
 * a phone, a little over a third of a desktop page. Everything else sits in a
 * column the CSS pins, and asks for one width.
 */
const heroArtSizes = "(max-width: 760px) 100vw, 42vw";
const heroArtWidths = [640, 960, 1440, 1920] as const;

type Connection = { slug: string; title: string; kind: StoryEntryKind; relation: string };
/** One mission in a companion's chain, in order, statused. */
type ChainMission = { slug: string; title: string; summary: string | null; order: number | null; missionStatus: string | null; stage: string | null };
/** A place directly inside this one, with whatever sits inside it in turn. */
type ContainedPlace = { slug: string; title: string; summary: string | null; meta: Record<string, unknown> | null; label: string; inside?: Array<{ slug: string; title: string; label: string }> };
type Appearance = { id: string; title: string; via: "referenced" | "speaks"; arc: { slug: string; title: string } };

const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];
const words = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
const label = (value: unknown) => typeof value === "string" && value.trim() ? value : null;

/**
 * The icon each empty key-art slot wears. Every kind that can carry a picture
 * is here, so a dossier with no art still says which shelf it belongs on and
 * prints the path that would fill it.
 */
const artSlotIcons: Partial<Record<StoryEntryKind, React.ReactNode>> = {
  CHARACTER: <UserRound aria-hidden="true" size={30} />,
  COMPANION_MISSION: <Handshake aria-hidden="true" size={30} />,
  CREATURE: <Sparkles aria-hidden="true" size={30} />,
  EVENT: <CalendarClock aria-hidden="true" size={30} />,
  FLAG: <Flag aria-hidden="true" size={30} />,
  ITEM: <Boxes aria-hidden="true" size={30} />,
  REGION: <Compass aria-hidden="true" size={30} />,
  RULE: <BookOpen aria-hidden="true" size={30} />,
  SYSTEM: <Settings2 aria-hidden="true" size={30} />,
  THEME: <Lightbulb aria-hidden="true" size={30} />,
  THREAD: <GitBranch aria-hidden="true" size={30} />,
};

function Fact({ label: name, value }: { label: string; value: unknown }) {
  const shown = label(value);
  return <div><dt>{name}</dt><dd>{shown ?? "Not decided"}</dd></div>;
}

function LoreLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/codex/bible/${canonicalStoryEntryRouteSlug(slug)}`}>{children}<ArrowRight aria-hidden="true" size={11} /></Link>;
}

export function StoryEntityProfile({ entry, existingArcSlugs = [], factionOptions = [], containedPlaces = [], placeAncestry = [], arcsHere = [], companionArcs = [], factionArcs = [], factionFamily = null, addChildKind = "site", systemFamily = null, systemsHere = [], slugTitles = {}, arcTitles = {}, threadChildren = [], companionChain = null, raceFamily = null }: { entry: {
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
}; existingArcSlugs?: string[]; factionOptions?: Array<{ slug: string; title: string }>; containedPlaces?: ContainedPlace[]; placeAncestry?: Array<{ slug: string; title: string }>; arcsHere?: Array<{ slug: string; title: string; isMainline: boolean; category: StoryArcCategory; hook: string | null; where: { slug: string; title: string } | null }>; /** A companion's own quests, derived from the arcs filed to them. */ companionArcs?: Array<{ slug: string; title: string; category: StoryArcCategory; hook: string | null; summary: string | null; locked: boolean }>; /** A faction's own quests plus the ones its wings fly, `via` naming the wing. */ factionArcs?: Array<{ slug: string; title: string; category: StoryArcCategory; hook: string | null; summary: string | null; locked: boolean; via: { slug: string; title: string } | null }>; /** The power above this one and the wings beneath it, derived from their own sheets. */ factionFamily?: { banner: { slug: string; title: string } | null; wings: Array<{ slug: string; title: string; summary: string | null; scope: string | null; power: number | null }>; power: { own: number | null; fromWings: number | null } } | null; addChildKind?: string; systemFamily?: { ancestry: Array<{ slug: string; title: string }>; children: Array<{ slug: string; title: string; summary: string | null }>; regionNotes: Array<{ slug: string; title: string | null; note: string }> } | null; systemsHere?: Array<{ slug: string; title: string; note: string }>; /** slug -> title, so facts read as names rather than keys. */ slugTitles?: Record<string, string>; /** slug -> title for arcs, which bodies cite as often as entries. */ arcTitles?: Record<string, string>; /** Threads that grew out of this one — derived from their parent field. */ threadChildren?: Array<{ slug: string; title: string; summary: string | null }>; /** The companion mission chain this page belongs to: a character's own arc, or the chain around one mission. */ companionChain?: { companion: { slug: string; title: string } | null; missions: ChainMission[] } | null; /** The race this creature sits in, and everything filed under it. */ raceFamily?: { race: { slug: string; title: string } | null; members: Array<{ slug: string; title: string; summary: string | null; meta: Record<string, unknown> | null; category: string | null }> } | null }) {
  // Entries resolve to the bible, arcs to their board, and anything nobody has
  // written yet renders as a visible todo rather than disappearing.
  const resolveProse: ProseResolver = (slug) => {
    const entryTitle = slugTitles[slug];
    if (entryTitle) return { title: entryTitle, href: `/codex/bible/${canonicalStoryEntryRouteSlug(slug)}` };
    const arcTitle = arcTitles[slug];
    if (arcTitle) return { title: arcTitle, href: `/codex/arc/${slug}` };
    return null;
  };
  const meta = record(entry.meta);
  const magic = record(meta.magic);
  const status = record(meta.status);
  const preview = modelPreview(meta.model);
  const isCharacter = entry.kind === "CHARACTER";
  const isCreature = entry.kind === "CREATURE";
  // A race is a creature entry with nothing above it. Members are derived
  // from their own `parent`, never stored twice.
  const isRace = isCreature && !label(meta.parent);
  const isFaction = entry.kind === "FACTION";
  const isRegion = entry.kind === "REGION";
  const isSystem = entry.kind === "SYSTEM";
  const isThread = entry.kind === "THREAD";
  const isMission = entry.kind === "COMPANION_MISSION";
  // Development state for the narrative room's kinds. The room's open-write
  // law lands every entry CANON, so for these two kinds the meta status — not
  // the entry status — is the truth every surface shows.
  const threadStatus = isThread && typeof meta.threadStatus === "string" ? (meta.threadStatus as StoryThreadStatus) : null;
  const missionStatus = isMission && typeof meta.missionStatus === "string" ? (meta.missionStatus as StoryCompanionMissionStatus) : null;
  const threadUnconfirmed = isThread && isUnconfirmedThreadStatus(threadStatus);
  const stageLabel = (value: unknown) => (typeof value === "string" && value in storyStoryStageLabels ? storyStoryStageLabels[value as StoryStoryStage] : null);
  // The COMPANION badge: worn by any character whose sheet says they can join
  // the party, with the recruitment window and their standing now beside it.
  const companion = record(meta.companion);
  const isCompanionCapable = entry.kind === "CHARACTER" && companion.capable === true;
  // Where this character stands on the seven-phase ladder, read back with the
  // tell a scene would actually show. Null when nobody has decided — which is
  // an answer too, and the sheet is where it gets given.
  const corruption = isCharacter ? storyCorruptionPhase(magic.corruptionPhase) : null;
  // The two dossiers that document the ladder render it in full, from the
  // same constant the character sheet's picker offers.
  const showsLadder = (storyCorruptionLadderSlugs as readonly string[]).includes(entry.slug);
  const factionBrand = isFaction ? getFactionBranding(entry.slug) : null;
  const regionBrand = isRegion ? getRegionBranding(entry.slug) : null;
  // Which picture this dossier wears, and — when it wears none — the exact
  // path that would give it one. Both come from lib/dossier-art.ts, which the
  // library directory reads too; the chain used to live here as a nested
  // ternary and again over there, and six kinds' artwork went unrendered in
  // both. Faction branding stays below: its hero is two elements, not one.
  const art = getDossierArt(entry.kind, entry.slug, meta);
  const artSlot = art ? null : dossierArtSlot(entry.kind, entry.slug, meta);
  const artSlotIcon = artSlotIcons[entry.kind] ?? <Sparkles aria-hidden="true" size={30} />;
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
  const asideConnections = entry.connections.filter((connection) =>
    // Whatever the narrative column already lists in full is not repeated in
    // the aside — places when the atlas block runs, subsystems when the
    // system tree does.
    !(containedPlaces.length && connection.relation === "belongs inside this region") &&
    !(systemFamily && connection.relation === "is a subsystem of this") &&
    // The race's own member list already shows these in full.
    !(isRace && connection.relation === "belongs to this species") &&
    // A thread's forward links already name its missions; the missions
    // pointing back is the same fact twice in one list.
    !(isThread && connection.relation === "is advanced by this companion mission" && words(meta.companionMissions).includes(connection.slug)) &&
    // A character's mission chain is rendered in full in the narrative
    // column, so the chain's rows do not repeat in the aside.
    !(companionChain && companionChain.missions.some((mission) => mission.slug === connection.slug) && (connection.relation === "belongs to their companion arc" || connection.relation === "features them in a companion mission")) &&
    // A mission already says which threads it advances; the thread naming it
    // back is the same edge read from the other end.
    !(isMission && connection.relation === "is part of this story thread" && words(meta.threads).includes(connection.slug)));
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
  if (entry.kind === "CREATURE") {
    // The race reads back on the member the same way a parent region reads
    // back on a place: the breadcrumb is navigation, this is the graph, and
    // a member whose aside knows nothing about its race is a one-way edge.
    if (label(meta.parent)) entityLinks.push({ slug: String(meta.parent), detail: "Belongs to this species" });
    for (const habitat of words(meta.biomes)) if (slugShaped(habitat)) entityLinks.push({ slug: habitat, detail: "Habitat" });
  }
  if (entry.kind === "ITEM" && slugShaped(meta.origin)) entityLinks.push({ slug: meta.origin, detail: "Origin" });
  if (entry.kind === "EVENT") {
    for (const place of words(meta.where)) if (slugShaped(place)) entityLinks.push({ slug: place, detail: "Happened here" });
    for (const participant of words(meta.involved)) if (slugShaped(participant)) entityLinks.push({ slug: participant, detail: "Involved" });
  }
  if (isThread) {
    const companionSlugs = new Set(words(meta.companions));
    for (const slug of words(meta.characters)) entityLinks.push({ slug, detail: companionSlugs.has(slug) ? "Character & companion in this thread" : "Character in this thread" });
    for (const slug of words(meta.companions)) if (!words(meta.characters).includes(slug)) entityLinks.push({ slug, detail: "Companion in this thread" });
    for (const slug of words(meta.factions)) entityLinks.push({ slug, detail: "Faction involved" });
    for (const slug of words(meta.locations)) entityLinks.push({ slug, detail: "Where it happens" });
    for (const slug of words(meta.bosses)) entityLinks.push({ slug, detail: "Proposed boss encounter" });
    for (const slug of words(meta.companionMissions)) entityLinks.push({ slug, detail: "Companion mission in this thread" });
    if (label(meta.parent)) entityLinks.push({ slug: String(meta.parent), detail: "Grew out of this thread" });
  }
  if (isMission) {
    if (label(meta.companion)) entityLinks.push({ slug: String(meta.companion), detail: "Whose companion arc this is" });
    for (const slug of words(meta.characters)) if (slug !== meta.companion) entityLinks.push({ slug, detail: "Features in this mission" });
    for (const slug of words(meta.locations)) entityLinks.push({ slug, detail: "Where it happens" });
    for (const slug of words(meta.factions)) entityLinks.push({ slug, detail: "Faction involved" });
    for (const slug of words(meta.threads)) entityLinks.push({ slug, detail: "Advances this story thread" });
  }

  return (
    <>
      <header
        className={`entity-profile-hero entity-profile-${entry.kind.toLowerCase()}${regionBrand ? " entity-profile-region-branded" : ""}${characterAffiliations.length ? " entity-profile-character-affiliated" : ""}`}
        style={activeBrand ? { "--entity-accent": activeBrand.accent } as React.CSSProperties : undefined}
      >
        <div className="entity-profile-art">
          {factionBrand ? <>
            <img alt={`${entry.title} faction key art`} className="entity-profile-keyart" sizes={heroArtSizes} src={codexArtSized(factionBrand.keyart, 960)} srcSet={codexArtSrcSet(factionBrand.keyart, heroArtWidths)} />
            <div className="faction-profile-logo"><img alt={`${entry.title} logo`} src={codexArtSized(factionBrand.logo, 320)} /></div>
          </> : art ? <img alt={`${entry.title} ${art.alt}`} className="entity-profile-keyart" sizes={heroArtSizes} src={codexArtSized(art.src, 960)} srcSet={codexArtSrcSet(art.src, heroArtWidths)} /> : artSlot ? <div className="system-art-slot system-art-slot-hero">{artSlotIcon}<span>Key art slot</span><code>{artSlot}</code><small>Drop an image at that path and this dossier wears it on the next load.</small></div> : preview ? <img alt={`${entry.title} selected in-game model`} src={`/model-gallery/${preview.image}`} /> : <div className="entity-profile-placeholder">{isFaction ? <Shield aria-hidden="true" /> : isRegion ? <Compass aria-hidden="true" /> : <UserRound aria-hidden="true" />}<span>{entry.title.slice(0, 1)}</span></div>}
          {factionBrand ? <span>Faction identity · original key art</span> : art ? <span>{art.caption}</span> : artSlot ? <span>Awaiting key art</span> : preview ? <span>In-game model · {preview.asset}</span> : isCharacter ? <span>No in-game model cast yet</span> : null}
        </div>
        <div className="entity-profile-copy">
          {/* A race and one of its members are the same kind but not the
              same thing, and calling Mythical a "creature dossier" reads as
              a filing mistake. */}
          <p className="eyebrow">{isRace ? "Species" : isFaction && factionFamily ? (factionFamily.banner ? "Wing" : "Major power") : storyEntryKindLabels[entry.kind]} dossier · {isThread
            ? (threadStatus ? storyThreadStatusLabels[threadStatus] : "No status yet")
            : isMission
              ? (missionStatus ? storyCompanionMissionStatusLabels[missionStatus] : "No status yet")
              : entry.status === "CANON" ? "Canon" : entry.status}</p>
          {threadUnconfirmed ? <p className="thread-canon-banner"><Lightbulb aria-hidden="true" size={13} /> <strong>{threadStatus ? storyThreadStatusLabels[threadStatus] : "Unstatused"} — not confirmed canon.</strong> This is a proposal under development. Discuss it, revise it, move its status — nothing in it binds the game until the room decides.</p> : null}
          {isMission && (missionStatus === null || missionStatus === "brainstorming" || missionStatus === "concept") ? <p className="thread-canon-banner"><Lightbulb aria-hidden="true" size={13} /> <strong>{missionStatus ? storyCompanionMissionStatusLabels[missionStatus] : "Unstatused"} — not confirmed canon.</strong> A development record: editable, arguable, and binding on nothing until its status says otherwise.</p> : null}
          {/* A destination three rungs down is meaningless without its address. */}
          {placeAncestry.length ? <nav aria-label="Where this sits" className="place-trail">
            {placeAncestry.map((ancestor) => <span key={ancestor.slug}><Link href={`/codex/bible/${ancestor.slug}`}>{ancestor.title}</Link><ChevronRight aria-hidden="true" size={11} /></span>)}
          </nav> : null}
          {raceFamily?.race ? <nav aria-label="Which species this belongs to" className="place-trail">
            <span><Link href={`/codex/bible/${raceFamily.race.slug}`}>{raceFamily.race.title}</Link><ChevronRight aria-hidden="true" size={11} /></span>
          </nav> : null}
          {factionFamily?.banner ? <nav aria-label="Which power this answers to" className="place-trail">
            <span><Link href={`/codex/bible/${factionFamily.banner.slug}`}>{factionFamily.banner.title}</Link><ChevronRight aria-hidden="true" size={11} /></span>
          </nav> : null}
          {systemFamily?.ancestry.length ? <nav aria-label="Part of which system" className="place-trail">
            {systemFamily.ancestry.map((ancestor) => <span key={ancestor.slug}><Link href={`/codex/bible/${ancestor.slug}`}>{ancestor.title}</Link><ChevronRight aria-hidden="true" size={11} /></span>)}
          </nav> : null}
          <h1>{entry.title}</h1>
          <p className="entity-profile-summary">{entry.summary ? <StoryProseLine resolve={resolveProse} text={entry.summary} /> : "This entry still needs its one-line pitch."}</p>
          {characterAffiliations.length ? <div className="character-profile-affiliations" aria-label="Faction affiliations">
            {characterAffiliations.map(({ brand, role, slug, standing, title }) => <Link href={`/codex/bible/${slug}`} key={slug} style={{ "--affiliation-accent": brand.accent } as React.CSSProperties}>
              <img alt="" src={codexArtSized(brand.logo, 320)} />
              <span><small>Faction affiliation</small><strong>{title}</strong>{role || standing ? <em>{[role, standing].filter(Boolean).join(" · ")}</em> : null}</span>
              <ArrowRight aria-hidden="true" size={12} />
            </Link>)}
          </div> : null}
          {isCompanionCapable ? <div className="companion-badge" title="This character can join the party as an active companion.">
            <Handshake aria-hidden="true" size={15} />
            <span><strong>Companion</strong>{label(companion.availability) ? <em>{String(companion.availability)}</em> : null}{label(companion.status) ? <i>{String(companion.status)}</i> : null}</span>
          </div> : null}
          <p className="entity-profile-byline">{isThread || isMission ? "Submitted by" : "Created by"} {entry.author}{entry.lastEditor && entry.lastEditor !== entry.author ? ` · last shaped by ${entry.lastEditor}` : ""}</p>
        </div>
      </header>

      {(isCharacter || isFaction || isRegion || isSystem || isThread || isMission || entry.kind === "CREATURE" || entry.kind === "ITEM" || entry.kind === "EVENT") ? <dl className="entity-fact-ribbon">
        {isCharacter ? <><Fact label="Full name" value={meta.fullName} /><Fact label="Species" value={meta.species} /><Fact label="Pronouns" value={meta.pronouns} /><Fact label="Magic" value={magic.origin} />{corruption ? <Fact label="Corruption" value={storyCorruptionPhaseLabel(magic.corruptionPhase)} /> : null}<Fact label="Known status" value={status.known} /></> : null}
        {isFaction ? <><Fact label="Power" value={meta.scope} /><Fact label="Seat" value={meta.seat} /><Fact label="Game tag" value={meta.gameTag} /><Fact label="Leaders" value={words(meta.leaders).length ? `${words(meta.leaders).length} named` : null} /></> : null}
        {isRegion ? <><Fact label="Place type" value={meta.type} /><Fact label="Biome" value={meta.biome} /><Fact label="Population" value={meta.population} /><Fact label="World state" value={meta.status} />{label(meta.veilAnchorTier) ? <Fact label="Veil Anchor" value={`Tier ${String(meta.veilAnchorTier)}`} /> : null}{label(meta.soulForge) ? <Fact label="Soul Forge" value={String(meta.soulForge)} /> : null}<Fact label="Game tag" value={meta.gameTag} /></> : null}
        {entry.kind === "CREATURE" ? <><Fact label="Category" value={meta.category} /><Fact label="Habitats" value={words(meta.biomes).length ? words(meta.biomes).join(", ") : null} /><Fact label="Threat" value={meta.threat} /></> : null}
        {entry.kind === "ITEM" ? <><Fact label="Category" value={meta.category} /><Fact label="Rarity" value={meta.rarity} /><Fact label="Origin" value={meta.origin} /></> : null}
        {entry.kind === "EVENT" ? <><Fact label="When" value={meta.when} /><Fact label="On the timeline" value={typeof meta.timelineYearsAgo === "number" ? timelineEraLabel(meta.timelineYearsAgo) : "not placed yet"} /><Fact label="Where" value={words(meta.where).length ? words(meta.where).map((slug) => slugTitles[slug] ?? slug.replaceAll("-", " ")).join(", ") : null} /><Fact label="Involved" value={words(meta.involved).length ? `${words(meta.involved).length} named` : null} /></> : null}
        {isSystem ? <><Fact label="Category" value={meta.category} /><Fact label="Build status" value={meta.buildStatus} /><Fact label="Unlocks" value={label(meta.unlockStage) ?? (label(meta.unlockArc) ? `with ${String(meta.unlockArc).replaceAll("-", " ")}` : systemFamily?.ancestry.length ? "with its parent system" : null)} /><Fact label="Game tag" value={meta.gameTag} /></> : null}
        {isThread ? <>
          <Fact label="Status" value={threadStatus ? storyThreadStatusLabels[threadStatus] : null} />
          <Fact label="Categories" value={words(meta.categories).length ? words(meta.categories).map((category) => storyThreadCategoryLabels[category as StoryThreadCategory] ?? category).join(" · ") : null} />
          <Fact label="Story stages" value={words(meta.stages).length ? words(meta.stages).map((stage) => stageLabel(stage) ?? stage).join(" → ") : null} />
          <Fact label="Priority" value={meta.priority} />
          <Fact label="Spoiler level" value={meta.spoilerLevel} />
        </> : null}
        {isMission ? <>
          <Fact label="Companion" value={label(meta.companion) ? (slugTitles[String(meta.companion)] ?? String(meta.companion).replaceAll("-", " ")) : null} />
          <Fact label="Chain position" value={typeof meta.order === "number" ? `Mission ${meta.order}` : null} />
          <Fact label="Status" value={missionStatus ? storyCompanionMissionStatusLabels[missionStatus] : null} />
          <Fact label="Story stage" value={stageLabel(meta.stage)} />
        </> : null}
      </dl> : null}

      <BloomfallAdaptiveMutationPanel entrySlug={entry.slug} />
      <BloomfallSystemPanel entrySlug={entry.slug} />

      <div className="entity-profile-layout">
        <article className="entity-profile-narrative">
          <p className="eyebrow"><BookOpen aria-hidden="true" size={12} /> Writer briefing</p>
          {/* On the dossiers that render the ladder, the generated prose
              enumeration is cut: it exists so the game export carries the
              phases, and showing it here would print all seven twice. */}
          {entry.body ? <StoryProse body={showsLadder ? storyBodyWithoutCorruptionLadder(entry.body) : entry.body} resolve={resolveProse} /> : <p className="story-inspector-hint">No briefing has been written yet. Open the editing workspace below and give the next writer a foundation.</p>}
          {isCharacter && label(meta.storyRole) ? <blockquote><Sparkles aria-hidden="true" size={16} /><div><strong>Why this character exists</strong><p>{String(meta.storyRole)}</p></div></blockquote> : null}
          {/* A phase is only useful to a writer as the thing a scene shows,
              so the dossier reads it back as its tell rather than a number. */}
          {corruption ? <div className={`corruption-standing phase-${corruption.phase}${corruption.playable ? "" : " is-gone"}`}>
            <p className="eyebrow"><Activity aria-hidden="true" size={12} /> Where they stand on <Link href="/codex/bible/the-seven-phases-of-corruption">the seven phases</Link></p>
            <h3>{storyCorruptionPhaseLabel(magic.corruptionPhase)}</h3>
            <p className="corruption-tell">{corruption.tell}</p>
            <p>{corruption.detail}</p>
            <p className="corruption-hiding"><strong>Hiding it:</strong> {corruption.hiding}</p>
            <p className="story-inspector-hint">A phase is a floor — write them at this level or deeper, never shallower, and never write a cure.</p>
          </div> : null}
          {showsLadder ? <div className="corruption-ladder">
            <p className="eyebrow"><Activity aria-hidden="true" size={12} /> The ladder, phase by phase</p>
            <p className="corruption-ladder-intro">
              Each phase is a floor nobody climbs back above once they reach it, and every one of them can be hidden without being erased.
              Set a character&apos;s phase on their sheet and their dossier reads it back with the tell a scene should show.
            </p>
            <ol>
              {storyCorruptionPhases.map((row) => <li className={`phase-${row.phase}${row.playable ? "" : " is-gone"}`} key={row.phase}>
                <span className="corruption-ladder-number">{row.phase}</span>
                <div>
                  <strong>{row.name}</strong>
                  <p className="corruption-tell">{row.tell}</p>
                  <p>{row.detail}</p>
                  <p className="corruption-hiding"><em>Hiding it:</em> {row.hiding}</p>
                </div>
              </li>)}
            </ol>
          </div> : null}
          {isMission ? <div className="mission-detail-grid">
            {label(meta.unlockConditions) ? <div className="mission-detail"><p className="eyebrow">Unlocks when</p><p>{String(meta.unlockConditions)}</p></div> : null}
            {words(meta.rewards).length ? <div className="mission-detail"><p className="eyebrow">Rewards</p><ul>{words(meta.rewards).map((reward) => <li key={reward}>{reward}</li>)}</ul></div> : null}
            {label(meta.relationshipEffects) ? <div className="mission-detail"><p className="eyebrow">Relationship effects</p><p>{String(meta.relationshipEffects)}</p></div> : null}
            {label(meta.consequences) ? <div className="mission-detail"><p className="eyebrow">Consequences</p><p>{String(meta.consequences)}</p></div> : null}
          </div> : null}
          {companionChain && companionChain.missions.length ? <div className="companion-chain">
            <p className="eyebrow"><ListOrdered aria-hidden="true" size={12} /> {companionChain.companion
              ? <>{isCharacter ? "Their companion mission chain" : <>In <Link href={`/codex/bible/${companionChain.companion.slug}`}>{companionChain.companion.title}</Link>&apos;s companion mission chain</>}</>
              : "Companion mission chain"}</p>
            <ol>
              {companionChain.missions.map((mission) => <li className={mission.slug === entry.slug ? "is-here" : ""} key={mission.slug}>
                <span className="companion-chain-order">{mission.order ?? "·"}</span>
                <div>
                  {mission.slug === entry.slug ? <strong>{mission.title} <em>this one</em></strong> : <Link href={`/codex/bible/${mission.slug}`}><strong>{mission.title}</strong><ArrowRight aria-hidden="true" size={11} /></Link>}
                  {mission.summary ? <p><StoryProseLine resolve={resolveProse} text={mission.summary} /></p> : null}
                  <span className="companion-chain-facts">{[
                    mission.missionStatus ? storyCompanionMissionStatusLabels[mission.missionStatus as StoryCompanionMissionStatus] ?? mission.missionStatus : null,
                    stageLabel(mission.stage),
                  ].filter(Boolean).join(" · ")}</span>
                </div>
              </li>)}
            </ol>
          </div> : null}
          {isThread && words(meta.arcs).length ? <div className="entity-region-notes">
            <p className="eyebrow"><GitBranch aria-hidden="true" size={12} /> Missions &amp; quest arcs this thread touches</p>
            <ul>{words(meta.arcs).map((arcSlug) => <li key={arcSlug}>
              {arcTitles[arcSlug] ? <Link href={`/codex/arc/${arcSlug}`}>{arcTitles[arcSlug]}</Link> : <span className="entity-region-missing" title="This arc has not been opened yet — link now, write later">{arcSlug.replaceAll("-", " ")}</span>}
            </li>)}</ul>
          </div> : null}
          {isThread && threadChildren.length ? <div className="entity-contained-places entity-system-children">
            <p className="eyebrow"><Lightbulb aria-hidden="true" size={12} /> Threads that grew out of this one</p>
            <ul>{threadChildren.map((child) => <li key={child.slug}>
              <div><Link href={`/codex/bible/${child.slug}`}><strong>{child.title}</strong><i>child thread</i><ArrowRight aria-hidden="true" size={11} /></Link>
              {child.summary ? <p><StoryProseLine resolve={resolveProse} text={child.summary} /></p> : null}</div>
            </li>)}</ul>
          </div> : null}
          {isThread && words(meta.tags).length ? <p className="thread-board-tags is-profile">{words(meta.tags).map((tag) => <Link href={`/codex/threads?tag=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</p> : null}
          {isFaction && words(meta.goals).length ? <div className="entity-goals"><p className="eyebrow">What they want</p><ul>{words(meta.goals).map((goal) => <li key={goal}><Swords aria-hidden="true" size={12} />{goal}</li>)}</ul></div> : null}
          {isRegion ? <div className="entity-contained-places">
            <p className="eyebrow"><MapPin aria-hidden="true" size={12} /> Inside {entry.title}</p>
            {containedPlaces.length ? <ul>{containedPlaces.map((place) => {
              const placeArt = getPlaceKeyart(place.slug, place.meta);
              return <li key={place.slug}>
                {/* Registered place art fills the fixed image column. The pin
                    remains only for a genuinely unillustrated new place so its
                    copy cannot collapse into the art column. */}
                {placeArt ? <img alt="" src={codexArtSized(placeArt, 320)} /> : <span className="region-place-fallback"><MapPin aria-hidden="true" size={18} /></span>}
                <div><Link href={`/codex/bible/${place.slug}`}><strong>{place.title}</strong><i>{place.label}</i><ArrowRight aria-hidden="true" size={11} /></Link>
                {place.summary ? <p><StoryProseLine resolve={resolveProse} text={place.summary} /></p> : null}
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
          {entry.kind === "EVENT" ? <p className="entity-map-note is-prose"><History aria-hidden="true" size={13} /> {typeof meta.timelineYearsAgo === "number"
            ? <>Sits on <Link href="/codex/timeline">the timeline</Link>, {timelineEraLabel(meta.timelineYearsAgo)}.</>
            : <>Not on <Link href="/codex/timeline">the timeline</Link> yet — set &ldquo;years before the present&rdquo; on the sheet below, or leave it off if the unknown age is the canon.</>}</p> : null}
          {raceFamily && (isRace || raceFamily.members.length > 0) ? <div className="entity-contained-places entity-race-members">
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> Children of {entry.title}</p>
            {raceFamily.members.length ? <ul>{raceFamily.members.map((member) => {
              // A child thumbnail must read the same resolver as its dossier.
              // The old hand map and Bloomfall-only fallback missed every
              // convention-drop plate (including Shriekers and the Machines).
              const memberArt = getDossierArt("CREATURE", member.slug, member.meta)?.src ?? null;
              const isAberrant = bloomfallCreatureFieldGuide[member.slug]?.kind === "BOSS";
              return <li className={isAberrant ? "is-aberrant" : undefined} key={member.slug}>
                {memberArt ? <img alt="" src={codexArtSized(memberArt, 320)} /> : <span className="region-place-fallback"><Sparkles aria-hidden="true" size={18} /></span>}
                <div><Link href={`/codex/bible/${member.slug}`}><strong>{member.title}</strong><i>{isAberrant ? "Exceptional Aberrant" : member.category ?? "uncategorised"}</i><ArrowRight aria-hidden="true" size={11} /></Link>
                {member.summary ? <p><StoryProseLine resolve={resolveProse} text={member.summary} /></p> : null}</div>
              </li>;
            })}</ul> : <p className="story-inspector-hint">Nothing is filed under this species yet — it is a species waiting for its members.</p>}
            <Link className="entity-add-place" href={`/codex/library/species?parent=${entry.slug}#new-entry`}>
              <Plus aria-hidden="true" size={13} /> Add a child to {entry.title}
            </Link>
          </div> : null}
          {isFaction && factionFamily ? <div className="entity-contained-places entity-race-members">
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> Wings of {entry.title}</p>
            {factionFamily.power.own !== null || factionFamily.power.fromWings !== null ? (
              <p className="entity-map-note is-prose"><Swords aria-hidden="true" size={13} /> Strength <strong>{(factionFamily.power.own ?? 0) + (factionFamily.power.fromWings ?? 0)}</strong>
                {factionFamily.power.fromWings !== null ? <> — {factionFamily.power.fromWings} of it flying under its wings</> : null}
                . A placeholder until strength is counted from land, cities, wealth, and armies.</p>
            ) : null}
            {factionFamily.wings.length ? <ul>{factionFamily.wings.map((wing) => {
              const wingBrand = getFactionBranding(wing.slug);
              return <li key={wing.slug}>
                {wingBrand ? <img alt="" className="entity-card-keyart" src={codexArtSized(wingBrand.keyart, 320)} /> : <span className="region-place-fallback"><Shield aria-hidden="true" size={18} /></span>}
                <div><Link href={`/codex/bible/${wing.slug}`}><strong>{wing.title}</strong><i>{wing.scope ?? "a wing"}</i><ArrowRight aria-hidden="true" size={11} /></Link>
                {wing.summary ? <p><StoryProseLine resolve={resolveProse} text={wing.summary} /></p> : null}</div>
              </li>;
            })}</ul> : <p className="story-inspector-hint">No one answers to this power yet — it stands on its own.</p>}
            <Link className="entity-add-place" href={`/codex/library/factions?parent=${entry.slug}#new-entry`}>
              <Plus aria-hidden="true" size={13} /> Add a wing of {entry.title}
            </Link>
          </div> : null}
          {isSystem && systemFamily ? <div className="entity-contained-places entity-system-children">
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> Inside {entry.title}</p>
            {systemFamily.children.length ? <ul>{systemFamily.children.map((child) => <li key={child.slug}>
              <div><Link href={`/codex/bible/${child.slug}`}><strong>{child.title}</strong><i>subsystem</i><ArrowRight aria-hidden="true" size={11} /></Link>
              {child.summary ? <p><StoryProseLine resolve={resolveProse} text={child.summary} /></p> : null}</div>
            </li>)}</ul> : <p className="story-inspector-hint">No subsystems yet. Weather belongs inside Environment — file children here and they inherit this system’s release unless they set their own.</p>}
            <Link className="entity-add-place" href={`/codex/library/systems?parent=${entry.slug}#new-entry`}>
              <Plus aria-hidden="true" size={13} /> Add a system inside {entry.title}
            </Link>
          </div> : null}
          {isSystem && systemFamily?.regionNotes.length ? <div className="entity-region-notes">
            <p className="eyebrow"><MapPin aria-hidden="true" size={12} /> By region — how {entry.title} expresses on the map</p>
            <ul>{systemFamily.regionNotes.map((row) => <li key={row.slug}>
              {row.title ? <Link href={`/codex/bible/${row.slug}`}>{row.title}</Link> : <span className="entity-region-missing" title="This region does not exist yet">{row.slug.replaceAll("-", " ")}</span>}
              <p>{row.note}</p>
            </li>)}</ul>
          </div> : null}
          {isRegion && label(meta.soulForge) ? <p className="entity-map-note is-prose"><Crown aria-hidden="true" size={13} /> {meta.soulForge === "destroyed"
            ? <>The <Link href="/codex/bible/the-soul-forge">Soul Forge</Link> here is <strong>destroyed</strong> — anyone bound to it has nowhere to return to. Write that consequence, never around it.</>
            : <>A <Link href="/codex/bible/the-soul-forge">Soul Forge</Link> stands here{meta.soulForge === "damaged" ? ", running but not to be relied on" : ""} — the party can <Link href="/codex/bible/soul-binding">bind</Link> to it and reclaim here.</>}</p> : null}
          {isRegion && label(meta.veilAnchorTier) ? <p className="entity-map-note is-prose"><Sparkles aria-hidden="true" size={13} /> A <strong>Tier {String(meta.veilAnchorTier)}</strong> Veil Anchor stands here — see <Link href="/codex/bible/veil-anchors">Veil Anchors</Link> for what that opens onto, and at what risk.</p> : null}
          {isRegion && systemsHere.length ? <div className="entity-region-notes">
            <p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> How the world behaves here</p>
            <ul>{systemsHere.map((system) => <li key={system.slug}>
              <Link href={`/codex/bible/${system.slug}`}>{system.title}</Link>
              <p>{system.note}</p>
            </li>)}</ul>
          </div> : null}
          {isCharacter && companionArcs.length ? <div className="entity-quests-here">
            <p className="eyebrow"><Compass aria-hidden="true" size={12} /> Their quests</p>
            <ul>{companionArcs.map((arc) => <li key={arc.slug}>
              <Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{arc.locked ? "settled" : storyArcCategoryLabels[arc.category].toLowerCase()}</i><ArrowRight aria-hidden="true" size={11} /></Link>
              {arc.hook ?? arc.summary ? <p>{arc.hook ?? arc.summary}</p> : null}
            </li>)}</ul>
          </div> : null}
          {isFaction && factionArcs.length ? <div className="entity-quests-here">
            <p className="eyebrow"><Compass aria-hidden="true" size={12} /> Quests under this banner</p>
            <ul>{factionArcs.map((arc) => <li key={arc.slug}>
              <Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{arc.locked ? "settled" : storyArcCategoryLabels[arc.category].toLowerCase()}</i><ArrowRight aria-hidden="true" size={11} /></Link>
              {arc.hook ?? arc.summary ? <p>{arc.hook ?? arc.summary}</p> : null}
              {arc.via ? <span>flown by <Link href={`/codex/bible/${arc.via.slug}`}>{arc.via.title}</Link></span> : null}
            </li>)}</ul>
          </div> : null}
          {isRegion && arcsHere.length ? <div className="entity-quests-here">
            <p className="eyebrow"><Compass aria-hidden="true" size={12} /> Quests that begin here</p>
            <ul>{arcsHere.map((arc) => <li key={arc.slug}>
              <Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{storyArcCategoryLabels[arc.category].toLowerCase()}</i><ArrowRight aria-hidden="true" size={11} /></Link>
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
              // `arc` is the pre-typed key; an unmigrated row still renders.
              const ref = label(row.ref) ? String(row.ref) : label(row.arc) ? String(row.arc) : null;
              if (!ref) return null;
              const isEvent = row.kind === "EVENT";
              // A planned arc that nobody has opened yet has nowhere to link —
              // that is the point of planning it. Show it as a marker instead
              // of a link to a page that does not exist. An event is checked
              // against the bible instead, because it lives on a dossier.
              const exists = isEvent ? Boolean(slugTitles[ref]) : existingArcSlugs.includes(ref);
              const name = (isEvent ? slugTitles[ref] : arcTitles[ref]) ?? ref.replaceAll("-", " ");
              return <div className="planned-connection" key={`${row.kind ?? "ARC"}:${ref}`}>
                {exists
                  ? <Link href={isEvent ? `/codex/bible/${ref}` : `/codex/arc/${ref}`}>{isEvent ? <CalendarClock aria-hidden="true" size={12} /> : <GitBranch aria-hidden="true" size={12} />} {name}</Link>
                  : <strong className="planned-unwritten">{isEvent ? <CalendarClock aria-hidden="true" size={12} /> : <GitBranch aria-hidden="true" size={12} />} {name}</strong>}
                {label(row.how) ? <p>{String(row.how)}</p> : null}
                <span>{exists ? (isEvent ? "Involvement in a world event" : "Planned involvement") : isEvent ? "Involvement — event not written yet" : "Planned involvement — arc not opened yet"}</span>
              </div>;
            }) : null}
          </section>

          <section>
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> World connections</p>
            {entityLinks.length || asideConnections.length ? <ul>
              {entityLinks.map((connection, index) => {
                // Link now, fill later is canon law, and it applies here too:
                // a sheet field naming something nobody has written renders as
                // the same marked todo the prose links use, not as a link into
                // a 404. Written targets get their real title rather than a
                // de-slugged guess at it.
                const written = slugTitles[connection.slug];
                return <li key={`${connection.slug}-${index}`}>
                  {written
                    ? <LoreLink slug={connection.slug}>{written}</LoreLink>
                    : <strong className="planned-unwritten" title="Nobody has written this yet — link now, fill later">{connection.slug.replaceAll("-", " ")}</strong>}
                  <span>{connection.detail}</span>
                </li>;
              })}
              {asideConnections.map((connection) => <li key={`${connection.slug}-${connection.relation}`}><LoreLink slug={connection.slug}>{connection.title}</LoreLink><span>{connection.relation}</span></li>)}
            </ul> : entry.connections.length > 0
              // Everything that points here is already rendered in full in
              // the narrative column — members, subsystems, contained places.
              // Claiming nothing points here would flatly contradict the list
              // sitting a few inches to the left.
              ? <p className="story-inspector-hint">Everything that points here is listed alongside the briefing.</p>
              : <p className="story-inspector-hint">Nothing else in the world points here yet.</p>}
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
