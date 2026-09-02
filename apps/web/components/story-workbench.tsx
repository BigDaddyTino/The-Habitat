"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, GitBranch, Link2, Lock, ShieldCheck, Trash2, Unlink } from "lucide-react";
import {
  isStoryFlowEditable,
  storyEndingKindLabels,
  storyEndingKinds,
  storyHeartbeatMs,
  storyNodeKinds,
  storyNodeKindLabels,
  storyLockNotice,
  storyStatusLabels,
  type StoryEntryKind,
  type StoryNodeKind,
  type StoryStatus,
} from "@habitat/shared";
import {
  addComment,
  claimNodeLock,
  deleteEdge,
  deleteNode,
  linkEntryToNode,
  releaseNodeLock,
  reorderEdge,
  resolveComment,
  setStoryStatus,
  unlinkEntryFromNode,
  updateEdge,
  updateNode,
} from "@/app/codex/actions";
import type { StoryBoardEdge, StoryBoardNode } from "@/lib/story-codex";

type LibraryEntry = { id: string; slug: string; title: string; kind: StoryEntryKind; status: StoryStatus };
export type StoryArcRef = { id: string; slug: string; title: string; isMainline: boolean };
export type StoryNodeRef = { id: string; title: string };

function StorySubmit({ children, pendingLabel, className = "save-server", disabled = false }: { children: ReactNode; pendingLabel: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={disabled || pending} type="submit">{pending ? pendingLabel : children}</button>;
}

/**
 * The flags that exist, shown where effects are typed — a thread only tracks
 * if the slug is spelled exactly, and nobody should have to remember them.
 */
function FlagHints({ flags }: { flags: LibraryEntry[] }) {
  if (flags.length === 0) return null;
  return (
    <p className="story-flag-hints">
      Flags the story can set or check: {flags.map((flag, index) => <span key={flag.id}>{index > 0 ? " · " : ""}<code>{flag.slug}</code></span>)}
      {" — "}write <code>set flag: the-slug</code> in effects; every use is tracked on the threads page.
    </p>
  );
}


export function NodeEditor({ node, arcId, canReview, viewerUserId, libraryEntries, arcRefs, locked }: { node: StoryBoardNode; arcId: string; canReview: boolean; viewerUserId: string; libraryEntries: LibraryEntry[]; arcRefs: StoryArcRef[]; locked: { by: string | null } | null }) {
  const [claimFailed, setClaimFailed] = useState(false);
  const [lockHeld, setLockHeld] = useState(false);
  // Controlled so the valence and completion fields appear the moment the
  // writer switches a card's kind, not on the render after they save it.
  // Reset during render (not in an effect) whenever a save or a different
  // card brings a new server version in.
  const [kind, setKind] = useState<StoryNodeKind>(node.kind);
  const [kindIdentity, setKindIdentity] = useState(`${node.id}:${node.version}`);
  const identity = `${node.id}:${node.version}`;
  if (kindIdentity !== identity) {
    setKindIdentity(identity);
    setKind(node.kind);
  }
  const claimed = useRef(false);
  const claimPending = useRef(false);
  const canEdit = isStoryFlowEditable(locked !== null);

  const claim = useCallback(() => {
    if (!canEdit || claimed.current || claimPending.current) return;
    claimPending.current = true;
    void claimNodeLock({ nodeId: node.id })
      .then((result) => {
        claimed.current = result.held;
        setLockHeld(result.held);
        setClaimFailed(!result.held);
      })
      .catch(() => setClaimFailed(true))
      .finally(() => { claimPending.current = false; });
  }, [canEdit, node.id]);

  useEffect(() => {
    if (!lockHeld) return;
    const interval = window.setInterval(() => {
      void claimNodeLock({ nodeId: node.id }).then((result) => {
        claimed.current = result.held;
        setLockHeld(result.held);
        setClaimFailed(!result.held);
      }).catch(() => undefined);
    }, storyHeartbeatMs * 4);
    return () => window.clearInterval(interval);
  }, [lockHeld, node.id]);

  useEffect(() => () => {
    if (claimed.current) void releaseNodeLock({ nodeId: node.id }).catch(() => undefined);
  }, [node.id]);

  const heldByOther = node.lockedBy && node.lockedBy.userId !== viewerUserId ? node.lockedBy : null;
  const linkedIds = new Set(node.references.map((reference) => reference.id));
  const availableEntries = libraryEntries.filter((entry) => !linkedIds.has(entry.id));
  // Speakers come from the bible, never from free text — a typo'd speaker
  // would reach the game as an attribution against a character that does not
  // exist there.
  const characterEntries = libraryEntries.filter((entry) => entry.kind === "CHARACTER");

  return <>
    {heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />{heldByOther.name} is writing here. A version check protects both drafts if you overlap.</p> : null}
    {claimFailed && !heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />Another writer claimed this card. Click back into a field to retry.</p> : null}
    {!canEdit ? <p className="story-canon-notice"><ShieldCheck aria-hidden="true" size={14} /><span><strong>This flow is locked.</strong> {storyLockNotice(locked?.by ?? null)} Notes below stay open — locking settles the story, not the conversation about it.</span></p> : null}

    {canEdit ? <form action={updateNode} className="story-form" onFocus={claim} onSubmit={() => { claimed.current = false; setLockHeld(false); }}>
      <input name="nodeId" type="hidden" value={node.id} /><input name="version" type="hidden" value={node.version} />
      <label>Kind<select name="kind" onChange={(event) => setKind(event.target.value as StoryNodeKind)} value={kind}>{storyNodeKinds.map((option) => <option key={option} value={option}>{storyNodeKindLabels[option]}</option>)}</select></label>
      <label>Title<input defaultValue={node.title} key={`title-${node.id}-${node.version}`} maxLength={160} name="title" required type="text" /></label>
      <label>Speaker<select defaultValue={node.speaker?.id ?? ""} key={`speaker-${node.id}-${node.version}`} name="speakerEntryId">
        <option value="">No single speaker — narration</option>
        {characterEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
      </select></label>
      {kind === "ENDING" ? <>
        <label>Ending valence<select defaultValue={node.endingKind ?? ""} key={`ending-${node.id}-${node.version}`} name="endingKind">
          <option value="">Not decided yet</option>
          {storyEndingKinds.map((option) => <option key={option} value={option}>{storyEndingKindLabels[option]}</option>)}
        </select></label>
        <label>Continues in<select defaultValue={node.continuesIn?.id ?? ""} key={`continues-${node.id}-${node.version}`} name="continuesInArcId">
          <option value="">Nowhere — the story ends here</option>
          {arcRefs.filter((arc) => arc.id !== arcId).map((arc) => <option key={arc.id} value={arc.id}>{arc.title}{arc.isMainline ? "" : " · side quest"}</option>)}
        </select></label>
      </> : null}
      {kind === "QUEST_STEP" ? <label>What finishes this step<textarea defaultValue={node.completion ?? ""} key={`completion-${node.id}-${node.version}`} maxLength={500} name="completion" placeholder="Writer intent, in plain words. An Unreal author turns it into a real task — the game never parses it." rows={2} /></label> : null}
      <label>Summary<textarea defaultValue={node.summary ?? ""} key={`summary-${node.id}-${node.version}`} maxLength={500} name="summary" rows={3} /></label>
      <label>Scene text<textarea defaultValue={node.body ?? ""} key={`body-${node.id}-${node.version}`} maxLength={20000} name="body" placeholder="Narration, dialogue, direction — whatever the game needs from this beat." rows={12} /></label>
      <label>Effects<textarea defaultValue={node.effects.join("\n")} key={`effects-${node.id}-${node.version}`} name="effects" placeholder="One per line: give item, set flag, shift reputation. The game interprets these." rows={2} /></label>
      <FlagHints flags={libraryEntries.filter((entry) => entry.kind === "FLAG")} />
      <label>Rewards<textarea defaultValue={node.rewards.join("\n")} key={`rewards-${node.id}-${node.version}`} name="rewards" placeholder="One per line: what finishing this pays. Notable rewards should also be ITEM entries, referenced below." rows={2} /></label>
      <StorySubmit pendingLabel="Saving…">Save card</StorySubmit>
    </form> : <div className="story-readonly-copy">{node.summary ? <p>{node.summary}</p> : null}<div>{node.body || "No scene text has been written yet."}</div></div>}

    <div className="story-inspector-meta">
      <p><span>Export key</span><code>{node.key}</code></p><p><span>Status</span><strong>{storyStatusLabels[node.status]}</strong></p><p><span>Opened by</span><strong>{node.author}</strong></p>
      {node.speaker ? <p><span>Speaker</span><strong>{node.speaker.title}</strong></p> : null}
      {node.endingKind ? <p><span>Ending valence</span><strong>{storyEndingKindLabels[node.endingKind]}</strong></p> : null}
      {node.continuesIn ? <p><span>Continues in</span><strong><Link href={`/codex/arc/${node.continuesIn.slug}`}>{node.continuesIn.title}</Link></strong></p> : null}
      {!canEdit && node.completion ? <p><span>Step completes when</span><strong>{node.completion}</strong></p> : null}
    </div>
    {!canEdit && node.effects.length > 0 ? <div className="story-inspector-refs"><p className="eyebrow">Effects</p><ul>{node.effects.map((effect, index) => <li key={index}><span className="story-effect-line">{effect}</span></li>)}</ul></div> : null}

    <div className="story-inspector-refs">
      <p className="eyebrow">Bible references</p>
      {node.references.length > 0 ? <ul>{node.references.map((reference) => <li key={reference.id}>
        <Link href={`/codex/bible/${reference.slug}`}>{reference.title}</Link><span>{reference.kind.toLowerCase()}</span>
        {canEdit ? <form action={unlinkEntryFromNode}><input name="nodeId" type="hidden" value={node.id} /><input name="entryId" type="hidden" value={reference.id} /><StorySubmit className="story-inline-action" pendingLabel="…"><Unlink aria-hidden="true" size={12} /><span className="sr-only">Remove {reference.title}</span></StorySubmit></form> : null}
      </li>)}</ul> : <p className="story-inspector-hint">Nothing from the bible is tied to this card yet.</p>}
      {canEdit && availableEntries.length > 0 ? <form action={linkEntryToNode} className="story-reference-form">
        <input name="nodeId" type="hidden" value={node.id} />
        <select aria-label="Bible entry to reference" defaultValue="" name="entryId" required><option disabled value="">Choose a bible entry…</option>{availableEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {entry.kind.toLowerCase()}</option>)}</select>
        <StorySubmit pendingLabel="Linking…"><Link2 aria-hidden="true" size={12} /> Link</StorySubmit>
      </form> : null}
    </div>

    <div className="story-inspector-notes">
      <p className="eyebrow">Notes {node.comments.length > 0 ? `· ${node.comments.length}` : ""}</p>
      {node.comments.length === 0 ? <p className="story-inspector-hint">No open notes.</p> : null}
      {node.comments.map((comment) => <article key={comment.id}><p>{comment.body}</p><footer><span>{comment.author}</span><form action={resolveComment}><input name="commentId" type="hidden" value={comment.id} /><StorySubmit className="icon-action approve" pendingLabel="…"><Check aria-hidden="true" size={14} /><span className="sr-only">Resolve this note</span></StorySubmit></form></footer></article>)}
      <form action={addComment} className="story-note-form"><input name="nodeId" type="hidden" value={node.id} /><textarea maxLength={2000} name="body" placeholder="Ask a question or flag a contradiction." required rows={2} /><StorySubmit pendingLabel="Posting…">Post note</StorySubmit></form>
    </div>

    <div className="story-inspector-actions">
      {canReview && node.status === "PROPOSED" ? <>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="NODE" /><input name="entityId" type="hidden" value={node.id} /><input name="status" type="hidden" value="CANON" /><StorySubmit pendingLabel="Approving…">Make canon</StorySubmit></form>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="NODE" /><input name="entityId" type="hidden" value={node.id} /><input name="status" type="hidden" value="REJECTED" /><StorySubmit pendingLabel="Rejecting…">Reject</StorySubmit></form>
      </> : null}
      {(node.status !== "CANON" || canReview) ? <form action={deleteNode} onSubmit={(event) => { if (!window.confirm(node.status === "CANON" ? "Archive this canon card? It will stop exporting to the game." : "Remove this card and every branch connected to it?")) event.preventDefault(); }}><input name="nodeId" type="hidden" value={node.id} /><StorySubmit className="icon-action reject" pendingLabel="…"><Trash2 aria-hidden="true" size={14} /><span className="sr-only">{node.status === "CANON" ? "Archive this canon card" : "Remove this card"}</span></StorySubmit></form> : null}
    </div>
  </>;
}

export function EdgeEditor({ edge, fromTitle, toTitle, canReview, nodes, flags = [], locked }: { edge: StoryBoardEdge; fromTitle: string; toTitle: string; canReview: boolean; nodes: StoryNodeRef[]; flags?: LibraryEntry[]; locked: { by: string | null } | null }) {
  const canEdit = isStoryFlowEditable(locked !== null);
  return <>
    <div className="story-edge-route"><span>{fromTitle}</span><GitBranch aria-hidden="true" size={16} /><span>{toTitle}</span></div>
    {!canEdit ? <p className="story-canon-notice"><ShieldCheck aria-hidden="true" size={14} /><span><strong>This flow is locked.</strong> {storyLockNotice(locked?.by ?? null)}</span></p> : <form action={updateEdge} className="story-form">
      <input name="edgeId" type="hidden" value={edge.id} />
      {/* Edges have no version column, so fields are keyed on the row's
          updatedAt: another writer's save arriving via live sync remounts them
          with the fresh values instead of leaving pre-refresh text staged to
          silently overwrite that save on the next submit. */}
      <label>Choice label<textarea defaultValue={edge.label ?? ""} key={`label-${edge.id}-${edge.updatedAt.getTime()}`} maxLength={200} name="label" placeholder="What the player chooses. Leave blank for a simple continuation." rows={2} /></label>
      {/* Retargeting keeps the branch's export key, so pointing it somewhere
          new never orphans the asset the importer already built from it. */}
      <label>Leads to<select defaultValue={edge.toNodeId} key={`to-${edge.id}-${edge.updatedAt.getTime()}`} name="toNodeId">
        {nodes.filter((node) => node.id !== edge.fromNodeId).map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
      </select></label>
      <label>Condition<textarea defaultValue={edge.condition ?? ""} key={`condition-${edge.id}-${edge.updatedAt.getTime()}`} maxLength={300} name="condition" placeholder="Optional requirement, flag, or designer note." rows={3} /></label>
      <label>Effects<textarea defaultValue={edge.effects.join("\n")} key={`effects-${edge.id}-${edge.updatedAt.getTime()}`} name="effects" placeholder="One per line: what choosing this does. The game interprets these." rows={2} /></label>
      <FlagHints flags={flags.filter((entry) => entry.kind === "FLAG")} />
      {/* A labelled branch out of a CHOICE card is an option the player picks;
          ticking this makes the option text a spoken player line for the voice
          pipeline (export v5). Off by default: most options are read, not said. */}
      <label className="story-check"><input defaultChecked={edge.voiced} key={`voiced-${edge.id}-${edge.updatedAt.getTime()}`} name="voiced" type="checkbox" /> Voiced — the player says this choice aloud</label>
      <StorySubmit pendingLabel="Saving…">Save branch</StorySubmit>
    </form>}
    <div className="story-inspector-meta">
      <p><span>Export key</span><code>{edge.key}</code></p>
      <p><span>Status</span><strong>{storyStatusLabels[edge.status]}</strong></p>
      <p><span>Order</span><strong>{edge.position + 1}</strong></p>
      {canEdit ? <div className="story-reorder">
        <span>Offer this choice</span>
        <form action={reorderEdge}><input name="edgeId" type="hidden" value={edge.id} /><input name="direction" type="hidden" value="up" /><StorySubmit className="icon-action" pendingLabel="…"><ArrowUp aria-hidden="true" size={13} /><span className="sr-only">earlier</span></StorySubmit></form>
        <form action={reorderEdge}><input name="edgeId" type="hidden" value={edge.id} /><input name="direction" type="hidden" value="down" /><StorySubmit className="icon-action" pendingLabel="…"><ArrowDown aria-hidden="true" size={13} /><span className="sr-only">later</span></StorySubmit></form>
      </div> : null}
    </div>
    <div className="story-inspector-actions">
      {canReview && edge.status === "PROPOSED" ? <>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="EDGE" /><input name="entityId" type="hidden" value={edge.id} /><input name="status" type="hidden" value="CANON" /><StorySubmit pendingLabel="Approving…">Make canon</StorySubmit></form>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="EDGE" /><input name="entityId" type="hidden" value={edge.id} /><input name="status" type="hidden" value="REJECTED" /><StorySubmit pendingLabel="Rejecting…">Reject</StorySubmit></form>
      </> : null}
      {(edge.status !== "CANON" || canReview) ? <form action={deleteEdge} onSubmit={(event) => { if (!window.confirm("Cut this branch? The two cards will remain on the board.")) event.preventDefault(); }}><input name="edgeId" type="hidden" value={edge.id} /><StorySubmit className="icon-action reject" pendingLabel="…"><Trash2 aria-hidden="true" size={14} /><span className="sr-only">Cut this branch</span></StorySubmit></form> : null}
    </div>
  </>;
}

// The whiteboard-era StoryWorkbench inspector shell that used to live here was
// dead code — the arc rework left only NodeEditor and EdgeEditor imported —
// and was removed with the stale drag-between-handles copy inside it.
