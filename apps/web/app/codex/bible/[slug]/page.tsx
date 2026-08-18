import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { storyEntryKindLabels } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryEntry, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryEntryEditor } from "@/components/story-entry-editor";
import { CharacterSheet, FactionSheet, MetaView, RegionSheet } from "@/components/story-entry-sheets";
import { StoryEntityProfile } from "@/components/story-entity-profile";
import { StoryArchiveEntryButton } from "@/components/story-archive-entry-button";
import { StoryWarden } from "@/components/story-warden";
import { addComment, resolveComment, setStoryStatus } from "@/app/codex/actions";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { collectionForKind } from "@/lib/story-library";

export default async function StoryEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const { slug } = await params;
  const entry = await getStoryEntry(slug);
  if (!entry) notFound();

  const needsPickers = entry.kind === "CHARACTER" || entry.kind === "FACTION" || entry.kind === "REGION";
  const [factions, regions, characters, arcs] = needsPickers
    ? await Promise.all([
        listStoryEntries({ kind: "FACTION" }),
        listStoryEntries({ kind: "REGION" }),
        listStoryEntries({ kind: "CHARACTER" }),
        listStoryArcRefs(),
      ])
    : [[], [], [], []];
  const collection = collectionForKind(entry.kind);

  return (
    <section className="page-shell codex-shell codex-entry-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <Link className="codex-back entity-profile-back" href={collection ? `/codex/library/${collection}` : "/codex/bible"}><ArrowLeft aria-hidden="true" size={13} /> Back to {collection ?? "the bible"}</Link>
      <StoryEntityProfile entry={entry} />

      <div className="codex-entry-grid codex-entry-workspace-grid">
        <div className="codex-entry-main">
          <details className="entry-edit-workspace" open={entry.meta === null && needsPickers}>
            <summary><Pencil aria-hidden="true" size={15} /><span><strong>Edit {storyEntryKindLabels[entry.kind].toLowerCase()}</strong><small>Writing reference, game identity, model, and connections</small></span></summary>
            <div className="entry-edit-workspace-body">
              <StoryEntryEditor canReview={canReview} entry={entry} viewerUserId={user.id} />

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
