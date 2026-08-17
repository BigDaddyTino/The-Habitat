"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, GitBranch, Link2, Lock, ShieldCheck, Trash2, Unlink, X } from "lucide-react";
import {
  isStoryContentEditable,
  storyHeartbeatMs,
  storyNodeKinds,
  storyNodeKindLabels,
  storyStatusLabels,
  type StoryEntryKind,
  type StoryGraphProblem,
  type StoryStatus,
} from "@habitat/shared";
import {
  addComment,
  claimNodeLock,
  createNode,
  deleteEdge,
  deleteNode,
  linkEntryToNode,
  releaseNodeLock,
  resolveComment,
  setStoryStatus,
  unlinkEntryFromNode,
  updateEdge,
  updateNode,
} from "@/app/codex/actions";
import type { StoryBoardEdge, StoryBoardNode } from "@/lib/story-codex";

type LibraryEntry = { id: string; slug: string; title: string; kind: StoryEntryKind; status: StoryStatus };

function StorySubmit({ children, pendingLabel, className = "save-server", disabled = false }: { children: ReactNode; pendingLabel: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={disabled || pending} type="submit">{pending ? pendingLabel : children}</button>;
}

function NewNodeForm({ arcId }: { arcId: string }) {
  return <form action={createNode} className="story-form">
    <p className="eyebrow">Add to this arc</p>
    <input name="arcId" type="hidden" value={arcId} />
    <label>Kind<select defaultValue="SCENE" name="kind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
    <label>Title<input maxLength={160} name="title" placeholder="The gate refuses him" required type="text" /></label>
    <label>Summary<textarea maxLength={500} name="summary" placeholder="One line on what happens here." rows={3} /></label>
    <StorySubmit pendingLabel="Adding…">Add card</StorySubmit>
  </form>;
}

function NodeEditor({ node, canReview, viewerUserId, libraryEntries }: { node: StoryBoardNode; canReview: boolean; viewerUserId: string; libraryEntries: LibraryEntry[] }) {
  const [claimFailed, setClaimFailed] = useState(false);
  const [lockHeld, setLockHeld] = useState(false);
  const claimed = useRef(false);
  const claimPending = useRef(false);
  const canEdit = isStoryContentEditable(node.status, canReview);

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

  return <>
    {heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />{heldByOther.name} is writing here. A version check protects both drafts if you overlap.</p> : null}
    {claimFailed && !heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />Another writer claimed this card. Click back into a field to retry.</p> : null}
    {!canEdit ? <p className="story-canon-notice"><ShieldCheck aria-hidden="true" size={14} /><span><strong>Canon is locked for contributors.</strong> Leave a note with the change you want; a reviewer can revise it without bypassing approval.</span></p> : null}

    {canEdit ? <form action={updateNode} className="story-form" onFocus={claim} onSubmit={() => { claimed.current = false; setLockHeld(false); }}>
      <input name="nodeId" type="hidden" value={node.id} /><input name="version" type="hidden" value={node.version} />
      <label>Kind<select defaultValue={node.kind} key={`kind-${node.id}-${node.version}`} name="kind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
      <label>Title<input defaultValue={node.title} key={`title-${node.id}-${node.version}`} maxLength={160} name="title" required type="text" /></label>
      <label>Summary<textarea defaultValue={node.summary ?? ""} key={`summary-${node.id}-${node.version}`} maxLength={500} name="summary" rows={3} /></label>
      <label>Scene text<textarea defaultValue={node.body ?? ""} key={`body-${node.id}-${node.version}`} maxLength={20000} name="body" placeholder="Narration, dialogue, direction — whatever the game needs from this beat." rows={12} /></label>
      <StorySubmit pendingLabel="Saving…">Save card</StorySubmit>
    </form> : <div className="story-readonly-copy">{node.summary ? <p>{node.summary}</p> : null}<div>{node.body || "No scene text has been written yet."}</div></div>}

    <div className="story-inspector-meta">
      <p><span>Export key</span><code>{node.key}</code></p><p><span>Status</span><strong>{storyStatusLabels[node.status]}</strong></p><p><span>Opened by</span><strong>{node.author}</strong></p>
    </div>

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

function EdgeEditor({ edge, fromTitle, toTitle, canReview }: { edge: StoryBoardEdge; fromTitle: string; toTitle: string; canReview: boolean }) {
  const canEdit = isStoryContentEditable(edge.status, canReview);
  return <>
    <div className="story-edge-route"><span>{fromTitle}</span><GitBranch aria-hidden="true" size={16} /><span>{toTitle}</span></div>
    {!canEdit ? <p className="story-canon-notice"><ShieldCheck aria-hidden="true" size={14} /><span><strong>This branch is canon.</strong> Only a reviewer can alter the exported choice.</span></p> : <form action={updateEdge} className="story-form">
      <input name="edgeId" type="hidden" value={edge.id} />
      <label>Choice label<textarea defaultValue={edge.label ?? ""} maxLength={200} name="label" placeholder="What the player chooses. Leave blank for a simple continuation." rows={2} /></label>
      <label>Condition<textarea defaultValue={edge.condition ?? ""} maxLength={300} name="condition" placeholder="Optional requirement, flag, or designer note." rows={3} /></label>
      <StorySubmit pendingLabel="Saving…">Save branch</StorySubmit>
    </form>}
    <div className="story-inspector-meta"><p><span>Status</span><strong>{storyStatusLabels[edge.status]}</strong></p><p><span>Order</span><strong>{edge.position + 1}</strong></p></div>
    <div className="story-inspector-actions">
      {canReview && edge.status === "PROPOSED" ? <>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="EDGE" /><input name="entityId" type="hidden" value={edge.id} /><input name="status" type="hidden" value="CANON" /><StorySubmit pendingLabel="Approving…">Make canon</StorySubmit></form>
        <form action={setStoryStatus}><input name="entityType" type="hidden" value="EDGE" /><input name="entityId" type="hidden" value={edge.id} /><input name="status" type="hidden" value="REJECTED" /><StorySubmit pendingLabel="Rejecting…">Reject</StorySubmit></form>
      </> : null}
      {(edge.status !== "CANON" || canReview) ? <form action={deleteEdge} onSubmit={(event) => { if (!window.confirm("Cut this branch? The two cards will remain on the board.")) event.preventDefault(); }}><input name="edgeId" type="hidden" value={edge.id} /><StorySubmit className="icon-action reject" pendingLabel="…"><Trash2 aria-hidden="true" size={14} /><span className="sr-only">Cut this branch</span></StorySubmit></form> : null}
    </div>
  </>;
}

export function StoryWorkbench({ arcId, node, edge, fromTitle, toTitle, problems, canReview, viewerUserId, libraryEntries, onClose }: {
  arcId: string;
  node: StoryBoardNode | null;
  edge: StoryBoardEdge | null;
  fromTitle?: string;
  toTitle?: string;
  problems: StoryGraphProblem[];
  canReview: boolean;
  viewerUserId: string;
  libraryEntries: LibraryEntry[];
  onClose: () => void;
}) {
  return <aside aria-label="Story inspector" className="story-inspector">
    {node ? <>
      <header className="story-inspector-head"><div><p className="eyebrow">{storyNodeKindLabels[node.kind]}</p><h2>{node.title}</h2></div><button aria-label="Close the inspector" className="icon-action" onClick={onClose} type="button"><X aria-hidden="true" size={15} /></button></header>
      {problems.length > 0 ? <ul className="story-problem-list">{problems.map((problem, index) => <li key={`${problem.kind}-${problem.nodeKey}-${index}`}>{problem.detail}</li>)}</ul> : null}
      <NodeEditor canReview={canReview} key={node.id} libraryEntries={libraryEntries} node={node} viewerUserId={viewerUserId} />
    </> : edge ? <>
      <header className="story-inspector-head"><div><p className="eyebrow">Story branch</p><h2>{edge.label || "Continuation"}</h2></div><button aria-label="Close the inspector" className="icon-action" onClick={onClose} type="button"><X aria-hidden="true" size={15} /></button></header>
      <EdgeEditor canReview={canReview} edge={edge} fromTitle={fromTitle ?? "Unknown card"} toTitle={toTitle ?? "Unknown card"} />
    </> : <>
      <header className="story-inspector-head"><div><p className="eyebrow">Board tools</p><h2>Build the next beat</h2></div></header>
      <p className="story-inspector-hint">Select a card to write it, or select a branch to label the player&apos;s choice. Drag from the right handle of one card to the left handle of another to connect them.</p>
      <NewNodeForm arcId={arcId} />
    </>}
  </aside>;
}
