import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { storyEntryKindLabels } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryEntry, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryEntryEditor } from "@/components/story-entry-editor";
import { CharacterSheet, MetaView, RegionSheet } from "@/components/story-entry-sheets";
import { addComment, resolveComment, setStoryStatus } from "@/app/codex/actions";

export default async function StoryEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const { slug } = await params;
  const entry = await getStoryEntry(slug);
  if (!entry) notFound();

  // Slug pickers for the sheets: link now without typos, fill later freely.
  const needsPickers = entry.kind === "CHARACTER" || entry.kind === "REGION";
  const [factions, regions, characters, arcs] = needsPickers
    ? await Promise.all([
        listStoryEntries({ kind: "FACTION" }),
        listStoryEntries({ kind: "REGION" }),
        listStoryEntries({ kind: "CHARACTER" }),
        listStoryArcRefs(),
      ])
    : [[], [], [], []];

  return (
    <section className="page-shell codex-shell codex-entry-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <div className="detail-hero">
        <Link className="codex-back" href="/codex/bible"><ArrowLeft aria-hidden="true" size={13} /> The bible</Link>
        <p className="eyebrow">{storyEntryKindLabels[entry.kind]} — {entry.status === "CANON" ? "canon" : entry.status.toLowerCase()}</p>
        <h1>{entry.title}</h1>
        {entry.summary ? <p>{entry.summary}</p> : null}
        <p className="codex-entry-byline">Written by {entry.author}{entry.lastEditor && entry.lastEditor !== entry.author ? `, last revised by ${entry.lastEditor}` : ""}.</p>
      </div>

      <div className="codex-entry-grid">
        {/* The editor and the review decision are one column between them: as
            separate grid children the decision would take the aside's place and
            push the aside underneath the editor. */}
        <div className="codex-entry-main">
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
          ) : entry.kind === "REGION" ? (
            <RegionSheet
              entryId={entry.id}
              factions={factions.map((option) => ({ slug: option.slug, title: option.title }))}
              key={`sheet-${entry.version}`}
              meta={entry.meta}
              regions={regions.filter((option) => option.slug !== entry.slug).map((option) => ({ slug: option.slug, title: option.title }))}
              version={entry.version}
            />
          ) : entry.meta ? (
            <MetaView meta={entry.meta} />
          ) : null}

          {/* Kept out of the edit form above: a form inside a form is invalid
              HTML, and the browser drops the inner one. */}
          {canReview && entry.status === "PROPOSED" ? (
            <div className="story-inspector-actions">
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="CANON" /><button className="save-server" type="submit">Make canon</button></form>
              <form action={setStoryStatus}><input name="entityType" type="hidden" value="ENTRY" /><input name="entityId" type="hidden" value={entry.id} /><input name="status" type="hidden" value="REJECTED" /><button className="save-server" type="submit">Reject</button></form>
            </div>
          ) : null}
        </div>

        <aside className="codex-entry-aside">
          <div>
            <p className="eyebrow">Appears in</p>
            {entry.appearances.length === 0 ? <p className="story-inspector-hint">No scene references this yet.</p> : (
              <ul className="codex-appearances">
                {entry.appearances.map((node) => (
                  <li key={node.id}><Link href={`/codex/arc/${node.arc.slug}`}>{node.title}</Link><span>{node.arc.title}{node.via === "speaks" ? " · speaks" : ""}</span></li>
                ))}
              </ul>
            )}
          </div>

          <div className="story-inspector-notes">
            <p className="eyebrow">Notes</p>
            {entry.comments.filter((comment) => !comment.resolvedAt).map((comment) => (
              <article key={comment.id}>
                <p>{comment.body}</p>
                <footer>
                  <span>{comment.author}</span>
                  <form action={resolveComment}><input name="commentId" type="hidden" value={comment.id} /><button className="icon-action approve" title="Resolve this note" type="submit"><Check aria-hidden="true" size={14} /></button></form>
                </footer>
              </article>
            ))}
            <form action={addComment} className="story-note-form">
              <input name="entryId" type="hidden" value={entry.id} />
              <textarea maxLength={2000} name="body" placeholder="Ask a question or flag a contradiction." required rows={2} />
              <button className="save-server" type="submit">Post note</button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}
