import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { storyEntryKindLabels, storyPlaceDescendants, type StoryPlaceLink } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryEntry, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryEntryEditor } from "@/components/story-entry-editor";
import { CharacterSheet, CreatureSheet, EventSheet, FactionSheet, ItemSheet, MetaView, RegionSheet, SystemSheet } from "@/components/story-entry-sheets";
import { StoryEntityProfile } from "@/components/story-entity-profile";
import { StoryArchiveEntryButton } from "@/components/story-archive-entry-button";
import { StoryWarden } from "@/components/story-warden";
import { addComment, resolveComment, setStoryStatus } from "@/app/codex/actions";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { collectionForKind, defaultChildPlaceKind, placeKindLabel, placeTypeOrder } from "@/lib/story-library";

export default async function StoryEntryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [{ slug }, { created }] = await Promise.all([params, searchParams]);
  const entry = await getStoryEntry(slug);
  if (!entry) notFound();

  const sheetKinds = ["CHARACTER", "FACTION", "REGION", "CREATURE", "ITEM", "EVENT", "SYSTEM"] as const;
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
  const collection = collectionForKind(entry.kind);

  // A region dossier IS the "what's in here" page: every place whose sheet
  // names this region as its parent, ordered settlements-first, each carrying
  // whatever sits inside it in turn — the region > place > destination rungs.
  const order = (meta: Record<string, unknown> | null) => placeTypeOrder[String(meta?.type)] ?? 9;
  const byTitle = (a: { order: number; title: string }, b: { order: number; title: string }) => a.order - b.order || a.title.localeCompare(b.title);
  // Descendants per place, computed once from the shared place graph.
  const placeLinks: StoryPlaceLink[] = regions.map((region) => ({ slug: region.slug, parent: typeof region.meta?.parent === "string" && region.meta.parent.trim() ? region.meta.parent.trim() : null }));
  const placeDescendants = new Map(regions.map((region) => [region.slug, new Set(storyPlaceDescendants(region.slug, placeLinks))]));
  const containedPlaces = entry.kind === "REGION"
    ? regions
        .filter((region) => (region.meta?.parent ?? null) === entry.slug)
        .map((place) => ({
          slug: place.slug,
          title: place.title,
          summary: place.summary,
          label: placeKindLabel(place.meta ?? {}),
          order: order(place.meta),
          // Everything beneath this place at any depth, not just its direct
          // children. A destination filed under a zone under a settlement sat
          // three rungs down and appeared on no region page at all — the
          // library atlas already flattens the same way, and a place that
          // exists but is listed nowhere is how POIs go missing.
          inside: regions
            .filter((candidate) => placeDescendants.get(place.slug)?.has(candidate.slug))
            .map((candidate) => ({ slug: candidate.slug, title: candidate.title, label: placeKindLabel(candidate.meta ?? {}), order: order(candidate.meta) }))
            .sort(byTitle)
            .map(({ slug, title, label }) => ({ slug, title, label })),
        }))
        .sort(byTitle)
    : [];

  return (
    <section className="page-shell codex-shell codex-entry-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <Link className="codex-back entity-profile-back" href={collection ? `/codex/library/${collection}` : "/codex/bible"}><ArrowLeft aria-hidden="true" size={13} /> Back to {collection ?? "the bible"}</Link>
      <StoryEntityProfile
        addChildKind={defaultChildPlaceKind(entry.meta?.type)}
        arcsHere={entry.arcsHere}
        containedPlaces={containedPlaces}
        entry={entry}
        slugTitles={Object.fromEntries([...regions, ...allEntries, ...systemEntries].map((option) => [option.slug, option.title]))}
        systemFamily={systemFamily}
        systemsHere={systemsHere}
        existingArcSlugs={arcs.map((arc) => arc.slug)}
        factionOptions={factions.map((faction) => ({ slug: faction.slug, title: faction.title }))}
        placeAncestry={entry.placeAncestry}
      />

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
                  factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
                  key={`sheet-${entry.version}`}
                  meta={entry.meta}
                  regions={regions.map((option) => ({ slug: option.slug, title: option.title }))}
                  version={entry.version}
                />
              ) : entry.kind === "FACTION" ? (
                <FactionSheet
                  characters={characters.map((option) => ({ slug: option.slug, title: option.title }))}
                  entryId={entry.id}
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
              ) : entry.meta ? <MetaView meta={entry.meta} /> : null}
            </div>
          </details>

          {canReview && entry.status === "PROPOSED" ? (
            <div className="story-inspector-actions">
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="CANON" /><button className="save-server" type="submit">Make canon</button></form>
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="REJECTED" /><button className="save-server" type="submit">Reject</button></form>
            </div>
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
