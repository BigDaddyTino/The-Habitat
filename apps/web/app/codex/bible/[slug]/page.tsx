import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { canonicalBloomfallReachSlug, canonicalStoryEntryRouteSlug, persistedStoryEntrySlug, storyEntryKindLabels, storyEntrySlugAliases, type StoryCanonPacket } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryEntry, listEntryContributions, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryEntryEditor } from "@/components/story-entry-editor";
import { CharacterSheet, CompanionMissionSheet, CreatureSheet, EventSheet, FactionSheet, ItemSheet, MetaView, RegionSheet, SystemSheet, ThreadSheet } from "@/components/story-entry-sheets";
import { StoryEntityProfile } from "@/components/story-entity-profile";
import { ContributorCards } from "@/components/contributor-card";
import { StoryArchiveEntryButton } from "@/components/story-archive-entry-button";
import { StoryWarden } from "@/components/story-warden";
import { CanonPacketPanel } from "@/components/canon-packet-panel";
import { addComment, resolveComment, setStoryStatus } from "@/app/codex/actions";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { buildContainedPlaceProjection, collectionForKind, defaultChildPlaceKind } from "@/lib/story-library";
import { canonPacketSchema } from "@/lib/story-meta-schemas";
import { getStoryAtlasLocationsForEntry } from "@/lib/story-atlas";

export default async function StoryEntryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [{ slug }, { created }] = await Promise.all([params, searchParams]);
  const canonicalSlug = canonicalStoryEntryRouteSlug(canonicalBloomfallReachSlug(slug));
  if (canonicalSlug !== slug) permanentRedirect(`/codex/bible/${canonicalSlug}`);
  const entry = await getStoryEntry(persistedStoryEntrySlug(canonicalSlug));
  if (!entry) notFound();
  const atlasLocations = entry.kind === "REGION" ? await getStoryAtlasLocationsForEntry(entry.id) : [];
  // Contributor originals, kept whole under their own name at the foot of the
  // page. Website only — the outbound bundle's entry mapper is an allowlist of
  // StoryEntry columns and structurally cannot reach this table.
  const contributions = await listEntryContributions(entry.slug);

  const sheetKinds = ["CHARACTER", "FACTION", "REGION", "CREATURE", "ITEM", "EVENT", "SYSTEM", "THREAD", "COMPANION_MISSION"] as const;
  const needsPickers = (sheetKinds as readonly string[]).includes(entry.kind);
  const [factions, regions, characters, arcs] = needsPickers
    ? await Promise.all([
        listStoryEntries({ kind: "FACTION" }),
        listStoryEntries({ kind: "REGION" }),
        listStoryEntries({ kind: "CHARACTER" }),
        listStoryArcRefs(),
      ])
    : [[], [], [], []];
  // An event can involve anyone and anything, so its picker spans every kind.
  const allEntries = entry.kind === "EVENT" ? await listStoryEntries({}) : [];
  // A character can be involved in a world event that has no quest board, so
  // the involvement rows need the timeline shelf beside the arc list.
  const eventEntries = entry.kind === "CHARACTER" ? await listStoryEntries({ kind: "EVENT" }) : [];
  // Systems form a tree (Weather inside Environment) and express per region
  // (the tropical island cools in winter but never sees snow), so both the
  // system and region dossiers need the systems shelf in hand.
  const systemEntries = entry.kind === "SYSTEM" || entry.kind === "REGION" ? await listStoryEntries({ kind: "SYSTEM" }) : [];
  const systemMetaOf = (candidate: { meta: Record<string, unknown> | null }) => candidate.meta ?? {};
  const systemParentOf = (candidate: { meta: Record<string, unknown> | null }) => {
    const value = systemMetaOf(candidate).parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const systemFamily = entry.kind === "SYSTEM"
    ? {
        // The chain of parents up to the top, nearest last — rendered as the
        // same breadcrumb trail places use. A broken link ends the climb.
        ancestry: (() => {
          const trail: Array<{ slug: string; title: string }> = [];
          let cursor = typeof entry.meta?.parent === "string" ? (entry.meta.parent as string) : null;
          while (cursor && trail.length < 6) {
            const parent = systemEntries.find((candidate) => candidate.slug === cursor);
            if (!parent) break;
            trail.unshift({ slug: parent.slug, title: parent.title });
            cursor = systemParentOf(parent);
          }
          return trail;
        })(),
        children: systemEntries
          .filter((candidate) => systemParentOf(candidate) === entry.slug)
          .map((child) => ({ slug: child.slug, title: child.title, summary: child.summary }))
          .sort((a, b) => a.title.localeCompare(b.title)),
        regionNotes: (Array.isArray(entry.meta?.regionNotes) ? (entry.meta.regionNotes as Array<Record<string, unknown>>) : [])
          .filter((row) => typeof row === "object" && row !== null && typeof row.region === "string" && typeof row.note === "string")
          .map((row) => ({
            slug: row.region as string,
            title: regions.find((region) => region.slug === row.region)?.title ?? null,
            note: row.note as string,
          })),
      }
    : null;
  // The reverse direction: a region dossier lists every system that says it
  // behaves differently here, note and all.
  const systemsHere = entry.kind === "REGION"
    ? systemEntries.flatMap((system) => {
        const notes = Array.isArray(systemMetaOf(system).regionNotes) ? (systemMetaOf(system).regionNotes as Array<Record<string, unknown>>) : [];
        const match = notes.find((row) => typeof row === "object" && row !== null && row.region === entry.slug && typeof row.note === "string");
        return match ? [{ slug: system.slug, title: system.title, note: match.note as string }] : [];
      }).sort((a, b) => a.title.localeCompare(b.title))
    : [];
  // Prose cites anything: a body can link a faction, a flag, an arc, a system.
  // One title map over everything beats a map of whatever the pickers needed.
  const [everyEntry, allArcs] = await Promise.all([listStoryEntries({}), listStoryArcRefs()]);
  const collection = collectionForKind(entry.kind);

  // The narrative development room. Threads nest (children are derived from
  // their parent field, never stored twice), and a companion's missions read
  // as one ordered chain — on the companion's own dossier and on every
  // mission in it alike.
  // The races tree: a creature with nothing above it IS a race, and its
  // members are derived from their own parent rather than stored twice.
  const creatureEntries = entry.kind === "CREATURE" || entry.kind === "CHARACTER" ? everyEntry.filter((candidate) => candidate.kind === "CREATURE") : [];
  const creatureParentOf = (candidate: { meta: Record<string, unknown> | null }) => {
    const value = candidate.meta?.parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const raceFamily = entry.kind === "CREATURE"
    ? (() => {
        const parentSlug = creatureParentOf(entry);
        const race = parentSlug ? creatureEntries.find((candidate) => candidate.slug === parentSlug) ?? null : null;
        return {
          // Null when this entry is itself a race, or when its race names a
          // slug nobody has written — the breadcrumb stays quiet either way.
          race: race ? { slug: race.slug, title: race.title } : null,
          members: creatureEntries
            .filter((candidate) => candidate.slug !== entry.slug && creatureParentOf(candidate) === entry.slug)
            .map((member) => ({
              slug: member.slug,
              title: member.title,
              summary: member.summary,
              meta: member.meta,
              category: typeof member.meta?.category === "string" ? (member.meta.category as string) : null,
            }))
            .sort((a, b) => a.title.localeCompare(b.title)),
        };
      })()
    : null;

  // Read straight off the stored sheet, and forgivingly: a packet whose shape
  // does not validate is skipped rather than taking the whole dossier down.
  const threadPackets = entry.kind === "THREAD"
    ? (Array.isArray(entry.meta?.canonPackets) ? entry.meta.canonPackets : []).flatMap((row) => {
        const parsed = canonPacketSchema.safeParse(row);
        return parsed.success ? [parsed.data as StoryCanonPacket] : [];
      })
    : [];

  // The faction tree, read the same way the races tree is: a major is a
  // faction with nothing above it, and its wings are derived from their own
  // sheets rather than stored twice.
  const factionEntries = entry.kind === "FACTION" ? everyEntry.filter((candidate) => candidate.kind === "FACTION") : [];
  const answersToOf = (candidate: { meta: Record<string, unknown> | null }) => {
    const value = candidate.meta?.parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const powerOf = (candidate: { meta: Record<string, unknown> | null }) => (typeof candidate.meta?.power === "number" ? (candidate.meta.power as number) : null);
  const factionFamily = entry.kind === "FACTION"
    ? (() => {
        const bannerSlug = answersToOf(entry);
        const banner = bannerSlug ? factionEntries.find((candidate) => candidate.slug === bannerSlug) ?? null : null;
        const wings = factionEntries
          .filter((candidate) => candidate.slug !== entry.slug && answersToOf(candidate) === entry.slug)
          .map((wing) => ({
            slug: wing.slug,
            title: wing.title,
            summary: wing.summary,
            scope: typeof wing.meta?.scope === "string" ? (wing.meta.scope as string) : null,
            power: powerOf(wing),
          }))
          .sort((a, b) => a.title.localeCompare(b.title));
        const own = powerOf(entry);
        const fromWings = wings.some((wing) => wing.power !== null)
          ? wings.reduce((total, wing) => total + (wing.power ?? 0), 0)
          : null;
        return {
          // Null when this entry is itself a major, or when its banner names
          // a faction nobody has written — the breadcrumb stays quiet either way.
          banner: banner ? { slug: banner.slug, title: banner.title } : null,
          wings,
          power: { own, fromWings },
        };
      })()
    : null;

  const threadEntries = everyEntry.filter((candidate) => candidate.kind === "THREAD");
  const missionEntries = everyEntry.filter((candidate) => candidate.kind === "COMPANION_MISSION");
  const metaText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const threadChildren = entry.kind === "THREAD"
    // The self-guard matters: a thread whose parent field somehow names
    // itself must not list itself as its own child.
    ? threadEntries.filter((candidate) => candidate.slug !== entry.slug && metaText(candidate.meta?.parent) === entry.slug).map((child) => ({ slug: child.slug, title: child.title, summary: child.summary }))
    : [];
  const chainCompanionSlug = entry.kind === "CHARACTER" ? entry.slug : entry.kind === "COMPANION_MISSION" ? metaText(entry.meta?.companion) : null;
  const chainMissions = chainCompanionSlug
    ? missionEntries
        .filter((candidate) => metaText(candidate.meta?.companion) === chainCompanionSlug)
        .map((mission) => ({
          slug: mission.slug,
          title: mission.title,
          summary: mission.summary,
          order: typeof mission.meta?.order === "number" ? (mission.meta.order as number) : null,
          missionStatus: metaText(mission.meta?.missionStatus),
          stage: metaText(mission.meta?.stage),
        }))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title))
    : [];
  const companionChain = chainMissions.length
    ? {
        companion: chainCompanionSlug
          ? { slug: chainCompanionSlug, title: everyEntry.find((candidate) => candidate.slug === chainCompanionSlug)?.title ?? chainCompanionSlug.replaceAll("-", " ") }
          : null,
        missions: chainMissions,
      }
    : null;

  // A region dossier IS the "what's in here" page: every place whose sheet
  // names this region as its parent, ordered settlements-first, each carrying
  // whatever sits inside it in turn — the region > place > destination rungs.
  const containedPlaces = entry.kind === "REGION" ? buildContainedPlaceProjection(entry.slug, regions) : [];

  return (
    <section className="page-shell codex-shell codex-entry-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <Link className="codex-back entity-profile-back" href={entry.kind === "THREAD" ? "/codex/threads" : collection ? `/codex/library/${collection}` : "/codex/bible"}><ArrowLeft aria-hidden="true" size={13} /> Back to {entry.kind === "THREAD" ? "story threads" : collection ?? "the bible"}</Link>
      <StoryEntityProfile
        addChildKind={defaultChildPlaceKind(entry.meta?.type)}
        arcsHere={entry.arcsHere}
        companionArcs={entry.companionArcs}
        factionArcs={entry.factionArcs}
        factionFamily={factionFamily}
        containedPlaces={containedPlaces}
        entry={entry}
        arcTitles={Object.fromEntries(allArcs.map((option) => [option.slug, option.title]))}
        slugTitles={Object.fromEntries(everyEntry.flatMap((option) => storyEntrySlugAliases(option.slug).map((alias) => [alias, option.title])))}
        systemFamily={systemFamily}
        systemsHere={systemsHere}
        threadChildren={threadChildren}
        companionChain={companionChain}
        raceFamily={raceFamily}
        existingArcSlugs={arcs.map((arc) => arc.slug)}
        factionOptions={factions.map((faction) => ({ slug: faction.slug, title: faction.title }))}
        placeAncestry={entry.placeAncestry}
      />
      {atlasLocations.length ? <nav className="place-trail" aria-label="Atlas locations">{atlasLocations.map((location) => {
        const query = location.sceneSlug === "martino-world" ? "?atlas=v2" : `?atlas=v2&scene=${encodeURIComponent(location.sceneSlug)}`;
        const hash = location.selectedSlug ? `#atlas-v2=${encodeURIComponent(location.selectedSlug)}` : "";
        const copy = location.kind === "OWNED_SCENE" ? "Explore region" : location.sceneSlug === "martino-world" ? "View in world" : "View in Atlas";
        return <span key={`${location.kind}:${location.sceneSlug}`}><Link href={`/codex/map${query}${hash}`}>{copy}</Link></span>;
      })}</nav> : null}

      <ContributorCards contributions={contributions} />


      <div className="codex-entry-grid codex-entry-workspace-grid">
        <div className="codex-entry-main">
          <details className="entry-edit-workspace" open={Boolean(created) || (entry.meta === null && needsPickers)}>
            <summary><Pencil aria-hidden="true" size={15} /><span><strong>Edit {storyEntryKindLabels[entry.kind].toLowerCase()}</strong><small>Writing reference, structured facts, and story connections</small></span></summary>
            <div className="entry-edit-workspace-body">
              <StoryEntryEditor entry={entry} viewerUserId={user.id} />

              {entry.kind === "CHARACTER" ? (
                <CharacterSheet
                  arcs={arcs.map((arc) => ({ slug: arc.slug, title: arc.title }))}
                  characters={characters.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
                  events={eventEntries.map((option) => ({ slug: option.slug, title: option.title }))}
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  // The whole shelf, races and their peoples alike: Tino is a
                  // Human, which is a people inside Humanoid — filing him under
                  // the umbrella would lose the distinction the shelf exists
                  // to make. Each option says which race it sits in.
                  races={creatureEntries.map((option) => {
                    const race = creatureParentOf(option);
                    const raceTitle = race ? creatureEntries.find((candidate) => candidate.slug === race)?.title ?? race : null;
                    return { slug: option.slug, title: raceTitle ? `${option.title} — one of the ${raceTitle}` : option.title };
                  })}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "FACTION" ? (
                <FactionSheet
                  characters={characters.map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
                  entrySlug={entry.slug}
                  factions={factions.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "REGION" ? (
                <RegionSheet
                  entryId={entry.id}
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "CREATURE" ? (
                <CreatureSheet
                  entryId={entry.id}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  // Only actual races can be picked as a parent, and never
                  // this entry itself — either would build a rung the
                  // library does not render.
                  races={creatureEntries
                    .filter((option) => option.slug !== entry.slug && !creatureParentOf(option))
                    .map((option) => ({ slug: option.slug, title: option.title }))}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "ITEM" ? (
                <ItemSheet
                  entryId={entry.id}
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "SYSTEM" ? (
                <SystemSheet
                  arcs={arcs.map((arc) => ({ slug: arc.slug, title: arc.title }))}
                  entryId={entry.id}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  systems={systemEntries.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "EVENT" ? (
                <EventSheet
                  entries={allEntries.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "THREAD" ? (
                <ThreadSheet
                  arcs={arcs.map((arc) => ({ slug: arc.slug, title: arc.title }))}
                  characters={characters.map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
                  everything={everyEntry.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  missions={missionEntries.map((option) => ({ slug: option.slug, title: option.title }))}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  threads={threadEntries.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "COMPANION_MISSION" ? (
                <CompanionMissionSheet
                  arcs={arcs.map((arc) => ({ slug: arc.slug, title: arc.title }))}
                  characters={characters.map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  threads={threadEntries.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.meta ? <MetaView meta={entry.meta} /> : null}
            </div>
          </details>

          {canReview && entry.status === "PROPOSED" ? (
            <div className="story-inspector-actions">
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="CANON" /><button className="save-server" type="submit">Make canon</button></form>
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="REJECTED" /><button className="save-server" type="submit">Reject</button></form>
            </div>
          ) : null}

          {entry.kind === "THREAD" ? (
            <CanonPacketPanel
              companions={characters.map((option) => ({ slug: option.slug, title: option.title }))}
              factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
              entries={everyEntry.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
              entryId={entry.id}
              key={`packets-${entry.version}`}
              packets={threadPackets}
              regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
              threadTitle={entry.title}
              version={entry.version}
            />
          ) : null}

          <div className="entry-danger-zone"><div><p className="eyebrow">Remove from the working Codex</p><p>Archive keeps its history and relationships recoverable, but removes this entry from the game export.</p></div><StoryArchiveEntryButton entryId={entry.id} title={entry.title} /></div>
        </div>

        <aside className="codex-entry-aside">
          <div className="story-inspector-notes">
            <p className="eyebrow">Writer notes</p>
            {entry.comments.filter((comment) => !comment.resolvedAt).map((comment) => (
              <article key={comment.id}><p>{comment.body}</p><footer><span>{comment.author}</span><form action={resolveComment}><input name="commentId" type="hidden" value={comment.id} /><button className="icon-action approve" title="Resolve this note" type="submit"><Check aria-hidden="true" size={14} /></button></form></footer></article>
            ))}
            {entry.comments.every((comment) => comment.resolvedAt) ? <p className="story-inspector-hint">No open notes. The room is clear.</p> : null}
            <form action={addComment} className="story-note-form"><input name="entryId" type="hidden" value={entry.id} /><textarea maxLength={2000} name="body" placeholder="Ask a question or flag a contradiction." required rows={3} /><button className="save-server" type="submit">Post note</button></form>
          </div>
        </aside>
      </div>
      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
