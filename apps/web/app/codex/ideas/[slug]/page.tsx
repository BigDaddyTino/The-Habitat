import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, FileText, Frame, ImagePlus, Link2, MessageSquareText, Pencil, ScrollText, Trash2, TriangleAlert } from "lucide-react";
import { storyIdeaFacetBlurbs, storyIdeaFacetColors, storyIdeaFacetLabels, storyIdeaFacets, storyIdeaStageLabels, storyThreadStatuses } from "@habitat/shared";
import { addComment, resolveComment } from "@/app/codex/actions";
import { deleteIdeaAttachment, setIdeaAttachmentCaption, setIdeaFacets, setIdeaStage, toggleIdeaBookmark, updateIdeaText } from "@/app/codex/ideas/actions";
import { hasRole, requireRole } from "@/lib/authorization";
import { formatIdeaBytes } from "@/lib/idea-attachments";
import { storyReadRole } from "@/lib/story-codex";
import { getIdea } from "@/lib/story-ideas";
import { FacetBadges, MemberAvatar, StageChip } from "@/components/idea-badges";
import { IdeaDetail } from "@/components/idea-detail";
import { StoryLiveSync } from "@/components/story-live-sync";

type Params = { slug: string };
type Query = { created?: string; attached?: string; error?: string; tab?: string };

/**
 * One idea, with room to read it: the proposer's overview and the facet tabs,
 * the pictures and files, one discussion for the whole idea, the codex entries
 * it names, and the controls that move it along. The full thread sheet — with
 * its canon packets — stays one click away on the bible page.
 */
export default async function IdeaPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Query> }) {
  const user = await requireRole(storyReadRole);
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const idea = await getIdea(slug, user.id);
  if (!idea) notFound();
  const owner = idea.proposer.id === user.id || (await hasRole("ADMIN"));
  const images = idea.attachments.filter((item) => item.isImage);
  const files = idea.attachments.filter((item) => !item.isImage);
  const openNotes = idea.comments.filter((comment) => !comment.resolvedAt);
  const initialTab = (storyIdeaFacets as readonly string[]).includes(query.tab ?? "") ? (query.tab as (typeof storyIdeaFacets)[number]) : "overview";
  const groupLabel: Record<string, string> = { characters: "People", companions: "Companions", factions: "Factions", locations: "Places", arcs: "Quests", bosses: "Bosses" };

  return (
    <section className="page-shell codex-shell codex-ideas-shell codex-idea-page">
      <StoryLiveSync refreshOnHeartbeat />
      <Link className="codex-back" href="/codex/ideas"><ArrowLeft aria-hidden="true" size={13} /> Idea Center</Link>

      {query.created ? <p className="idea-notice"><Check aria-hidden="true" size={14} /> It is in the room, with your name on it. Add pictures below, or leave it exactly as it is.</p> : null}
      {query.attached ? <p className="idea-notice"><Check aria-hidden="true" size={14} /> Added {query.attached} file{query.attached === "1" ? "" : "s"}.</p> : null}
      {query.error ? <p className="idea-error" role="alert"><TriangleAlert aria-hidden="true" size={14} /> {query.error}</p> : null}

      <header className="idea-page-head">
        <p className="idea-page-kicker"><FacetBadges facets={idea.facets} max={5} /> <StageChip status={idea.status} /></p>
        <h1>{idea.title}</h1>
        <div className="idea-page-meta">
          <span className="idea-card-by"><MemberAvatar image={idea.proposer.image} name={idea.proposer.name} size={24} /> Proposed by <strong>{idea.proposer.name}</strong></span>
          <span>{idea.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}{idea.updatedAt.getTime() - idea.createdAt.getTime() > 60_000 ? ` · updated ${idea.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</span>
          <form action={toggleIdeaBookmark} className="idea-inline-form">
            <input name="entryId" type="hidden" value={idea.id} />
            <button aria-pressed={idea.bookmarked} className={`idea-icon-button is-bookmark is-labelled${idea.bookmarked ? " is-on" : ""}`} type="submit">{idea.bookmarked ? <><BookmarkCheck aria-hidden="true" size={14} /> Saved</> : <><Bookmark aria-hidden="true" size={14} /> Save</>}{idea.bookmarkCount > 0 ? <em>{idea.bookmarkCount}</em> : null}</button>
          </form>
          <form action={setIdeaStage} className="idea-inline-form idea-stage-form">
            <input name="entryId" type="hidden" value={idea.id} />
            <label>Stage<select defaultValue={idea.status ?? "brainstorming"} name="status">{storyThreadStatuses.map((status) => <option key={status} value={status}>{storyIdeaStageLabels[status]}</option>)}</select></label>
            <button className="idea-mini-button" type="submit">Move</button>
          </form>
        </div>
      </header>

      <div className="idea-page-grid">
        <div className="idea-page-main">
          <IdeaDetail idea={idea} initialTab={initialTab} interactive viewerId={user.id} />

          {idea.keyArt || idea.artSlots.length ? (
            <section className="idea-art" id="art">
              <h2><Frame aria-hidden="true" size={16} /> Key art &amp; scenes <small>{[idea.keyArt ? 1 : 0, ...idea.artSlots.map((slot) => (slot.url ? 1 : 0))].reduce((a, b) => a + b, 0)} of {idea.artSlots.length + 1} in</small></h2>
              <p className="idea-hint">The codex art slots for this idea. A picture appears here the moment its file is dropped in the folder named on the empty slot — no upload, no save.</p>
              <div className="idea-art-grid">
                <figure className={`idea-art-slot is-key${idea.keyArt ? " is-filled" : ""}`}>
                  {idea.keyArt ? <a href={idea.keyArt} rel="noopener" target="_blank"><img alt={`${idea.title} — key art`} src={idea.keyArt} /></a> : <div className="idea-art-empty" aria-hidden="true"><Frame size={28} /></div>}
                  <figcaption><strong>Key art</strong>{idea.keyArt ? null : <code>private/codex-art/threads/{idea.slug}.png</code>}</figcaption>
                </figure>
                {idea.artSlots.map((slot) => (
                  <figure className={`idea-art-slot${slot.url ? " is-filled" : ""}`} key={slot.key}>
                    {slot.url ? <a href={slot.url} rel="noopener" target="_blank"><img alt={`${idea.title} — ${slot.label}`} loading="lazy" src={slot.url} /></a> : <div className="idea-art-empty" aria-hidden="true"><Frame size={28} /></div>}
                    <figcaption><strong>{slot.label}</strong>{slot.url ? null : <code>{slot.path}</code>}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section className="idea-attachments" id="pictures">
            <h2><ImagePlus aria-hidden="true" size={16} /> Pictures &amp; files <small>{idea.attachments.length}</small></h2>
            {images.length ? (
              <div className="idea-image-grid">
                {images.map((item) => (
                  <figure className="idea-image" key={item.id}>
                    <a href={item.url} rel="noopener" target="_blank"><img alt={item.caption ?? item.fileName} loading="lazy" src={item.url} /></a>
                    <figcaption>
                      <form action={setIdeaAttachmentCaption} className="idea-caption-form">
                        <input name="attachmentId" type="hidden" value={item.id} />
                        <input aria-label="Caption" defaultValue={item.caption ?? ""} maxLength={300} name="caption" placeholder={item.fileName} type="text" />
                        <button className="idea-mini-button" type="submit">Save</button>
                      </form>
                      <span className="idea-file-meta">{item.uploadedBy.name} · {formatIdeaBytes(item.bytes)}</span>
                      {item.uploadedBy.id === user.id || owner ? <form action={deleteIdeaAttachment}><input name="attachmentId" type="hidden" value={item.id} /><button className="idea-icon-button" title="Remove this picture" type="submit"><Trash2 aria-hidden="true" size={13} /></button></form> : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {files.length ? (
              <ul className="idea-file-list">
                {files.map((item) => (
                  <li key={item.id}>
                    <FileText aria-hidden="true" size={14} />
                    <a href={item.url} rel="noopener" target="_blank">{item.fileName}</a>
                    {item.caption ? <span className="idea-file-caption">{item.caption}</span> : null}
                    <span className="idea-file-meta">{item.uploadedBy.name} · {formatIdeaBytes(item.bytes)}</span>
                    {item.uploadedBy.id === user.id || owner ? <form action={deleteIdeaAttachment}><input name="attachmentId" type="hidden" value={item.id} /><button className="idea-icon-button" title="Remove this file" type="submit"><Trash2 aria-hidden="true" size={13} /></button></form> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {idea.attachments.length === 0 ? <p className="idea-empty">No pictures or files yet.</p> : null}
            <form action="/api/codex/ideas" className="idea-upload-form" encType="multipart/form-data" method="post">
              <input name="entryId" type="hidden" value={idea.id} />
              <label>Add pictures or files<input accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,.md,.txt" multiple name="files" required type="file" /></label>
              <label>Caption for this batch <small>optional</small><input maxLength={300} name="caption" type="text" /></label>
              <button className="save-server" type="submit">Add</button>
            </form>
          </section>

          <section className="idea-discussion" id="discussion">
            <h2><MessageSquareText aria-hidden="true" size={16} /> Discussion <small>{openNotes.length} open</small></h2>
            <p className="idea-hint">One conversation for the whole idea. Say what you think, ask what you want to know, or suggest a turn — you do not have to decide which tab it belongs under.</p>
            {idea.comments.length ? (
              <ol className="idea-notes">
                {idea.comments.map((comment) => (
                  <li className={comment.resolvedAt ? "is-resolved" : undefined} key={comment.id}>
                    <header><MemberAvatar image={comment.author.image} name={comment.author.name} size={20} /><strong>{comment.author.name}</strong><time dateTime={comment.createdAt.toISOString()}>{comment.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
                      {!comment.resolvedAt ? <form action={resolveComment}><input name="commentId" type="hidden" value={comment.id} /><button className="idea-icon-button" title="Mark this note answered" type="submit"><Check aria-hidden="true" size={13} /></button></form> : <span className="idea-file-meta">answered</span>}
                    </header>
                    <p>{comment.body}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="idea-empty">Nobody has said anything yet.</p>}
            <form action={addComment} className="story-note-form idea-note-form">
              <input name="entryId" type="hidden" value={idea.id} />
              <textarea maxLength={2000} name="body" placeholder="What do you think?" required rows={3} />
              <button className="save-server" type="submit">Post</button>
            </form>
          </section>
        </div>

        <aside className="idea-page-side">
          <section className="idea-side-card">
            <h2><Link2 aria-hidden="true" size={14} /> In the codex</h2>
            {idea.links.length ? (
              <ul className="idea-links">
                {(["characters", "companions", "bosses", "factions", "locations", "arcs"] as const).map((group) => {
                  const rows = idea.links.filter((link) => link.group === group);
                  return rows.length ? <li key={group}><span>{groupLabel[group]}</span>{rows.map((link) => <Link href={link.kind === "ARC" ? `/codex/arc/${link.slug}` : `/codex/bible/${link.slug}`} key={`${group}:${link.slug}`}>{link.title}</Link>)}</li> : null;
                })}
              </ul>
            ) : <p className="idea-empty">Not tied to anything in the codex yet. The full sheet is where those ties are made.</p>}
            {idea.parent ? <p className="idea-lineage">Grew out of <Link href={`/codex/ideas/${idea.parent.slug}`}>{idea.parent.title}</Link>.</p> : null}
            {idea.children.length ? <p className="idea-lineage">Ideas that grew out of this one: {idea.children.map((child, index) => <span key={child.slug}>{index ? ", " : ""}<Link href={`/codex/ideas/${child.slug}`}>{child.title}</Link></span>)}.</p> : null}
            <Link className="idea-sheet-link" href={`/codex/bible/${idea.slug}`}><ScrollText aria-hidden="true" size={14} /> Full story sheet{idea.canonPacketCount ? ` · ${idea.canonPacketCount} packet${idea.canonPacketCount === 1 ? "" : "s"} toward canon` : ""}</Link>
          </section>

          <section className="idea-side-card">
            <h2>What it is, and how far along</h2>
            <dl className="idea-facts">
              <dt>Kind</dt><dd><FacetBadges facets={idea.facets} max={5} small /></dd>
              <dt>Stage</dt><dd><StageChip status={idea.status} /> <small>New → Exploring → Planned → Approved → Building → In game. Someday parks it.</small></dd>
              <dt>Canon?</dt><dd>{idea.status === "implemented" ? "In the game." : idea.status === "approved" || idea.status === "in-development" ? "Approved by the room; being built or waiting to be." : "Not canon. An idea the room is holding."}</dd>
            </dl>
          </section>

          {owner ? (
            <details className="idea-side-card idea-edit">
              <summary><Pencil aria-hidden="true" size={14} /> Edit the idea</summary>
              <form action={updateIdeaText} className="story-form">
                <input name="entryId" type="hidden" value={idea.id} />
                <label>Name<input defaultValue={idea.title} maxLength={120} name="title" required type="text" /></label>
                <label>One line<input defaultValue={idea.summary ?? ""} maxLength={500} name="summary" type="text" /></label>
                <label>The idea<textarea defaultValue={idea.body ?? ""} maxLength={20000} name="body" rows={10} /></label>
                <button className="save-server" type="submit">Save my words</button>
              </form>
              <form action={setIdeaFacets} className="story-form">
                <input name="entryId" type="hidden" value={idea.id} />
                <fieldset className="idea-facet-picker is-compact"><legend>What it touches</legend>
                  {storyIdeaFacets.map((item) => (
                    <label className="idea-facet-option" data-facet={item} key={item} style={{ ["--facet" as string]: storyIdeaFacetColors[item] }} title={storyIdeaFacetBlurbs[item]}>
                      <input defaultChecked={idea.facets.includes(item)} name="facets" type="checkbox" value={item} /><span><strong>{storyIdeaFacetLabels[item]}</strong></span>
                    </label>
                  ))}
                </fieldset>
                <button className="save-server" type="submit">Save the kinds</button>
              </form>
            </details>
          ) : <p className="idea-hint idea-side-hint">This is {idea.proposer.name}&apos;s idea. Add to it under a tab or in the discussion — your words carry your name and never replace theirs.</p>}
        </aside>
      </div>
    </section>
  );
}
