"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { isStoryContentEditable, storyEntryKindLabels, storyEntryKinds, storyHeartbeatMs, type StoryEntryKind, type StoryStatus } from "@habitat/shared";
import { claimEntryLock, releaseEntryLock, updateEntry } from "@/app/codex/actions";

export function StoryEntryEditor({ entry, canReview, viewerUserId }: {
  entry: {
    id: string;
    kind: StoryEntryKind;
    slug: string;
    title: string;
    summary: string | null;
    body: string | null;
    status: StoryStatus;
    version: number;
    lockedBy: { userId: string; name: string } | null;
  };
  canReview: boolean;
  viewerUserId: string;
}) {
  const [claimFailed, setClaimFailed] = useState(false);
  const [lockHeld, setLockHeld] = useState(false);
  const claimed = useRef(false);
  const claimPending = useRef(false);
  const canEdit = isStoryContentEditable(entry.status, canReview);

  const claim = useCallback(() => {
    if (!canEdit || claimed.current || claimPending.current) return;
    claimPending.current = true;
    void claimEntryLock({ entryId: entry.id })
      .then((result) => {
        claimed.current = result.held;
        setLockHeld(result.held);
        setClaimFailed(!result.held);
      })
      .catch(() => setClaimFailed(true))
      .finally(() => { claimPending.current = false; });
  }, [canEdit, entry.id]);

  useEffect(() => {
    if (!lockHeld) return;
    const interval = window.setInterval(() => {
      void claimEntryLock({ entryId: entry.id }).then((result) => {
        claimed.current = result.held;
        setLockHeld(result.held);
        setClaimFailed(!result.held);
      }).catch(() => undefined);
    }, storyHeartbeatMs * 4);
    return () => window.clearInterval(interval);
  }, [entry.id, lockHeld]);

  useEffect(() => () => {
    if (claimed.current) void releaseEntryLock({ entryId: entry.id }).catch(() => undefined);
  }, [entry.id]);

  const heldByOther = entry.lockedBy && entry.lockedBy.userId !== viewerUserId ? entry.lockedBy : null;

  if (!canEdit) {
    return <article className="story-entry-reading">
      <p className="story-canon-notice"><ShieldCheck aria-hidden="true" size={14} /><span><strong>This entry is canon.</strong> Contributors can leave a note; a reviewer can revise the exported text.</span></p>
      {entry.body ? <div className="story-prose">{entry.body}</div> : <p className="story-inspector-hint">No detail has been written yet.</p>}
    </article>;
  }

  return <div className="story-entry-editor">
    {heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />{heldByOther.name} is writing here. A version check protects both drafts if you overlap.</p> : null}
    {claimFailed && !heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />Another writer claimed this entry. Click back into a field to retry.</p> : null}
    <form action={updateEntry} className="story-form" onFocus={claim} onSubmit={() => { claimed.current = false; setLockHeld(false); }}>
      <input name="entryId" type="hidden" value={entry.id} /><input name="version" type="hidden" value={entry.version} />
      <label>Kind<select defaultValue={entry.kind} key={`kind-${entry.version}`} name="kind">{storyEntryKinds.map((option) => <option key={option} value={option}>{storyEntryKindLabels[option]}</option>)}</select></label>
      <label>Title<input defaultValue={entry.title} key={`title-${entry.version}`} maxLength={120} name="title" required type="text" /></label>
      {/* The key is set when the entry is written and never moves again — the
          game reads canon by it. Renaming without knowing that leaves the entry
          squatting its old key, and the old name then cannot be reused. */}
      <p className="story-inspector-hint">Key <code>{entry.slug}</code> — set when this was written, and a rename leaves it here. Nothing else can be created under the name it was born with.</p>
      <label>Summary<textarea defaultValue={entry.summary ?? ""} key={`summary-${entry.version}`} maxLength={500} name="summary" rows={2} /></label>
      <label>Detail<textarea defaultValue={entry.body ?? ""} key={`body-${entry.version}`} maxLength={20000} name="body" rows={16} /></label>
      <button className="save-server" type="submit">Save entry</button>
    </form>
  </div>;
}
