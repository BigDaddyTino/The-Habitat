"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { canonicalStoryEntryRouteSlug, storyEntryKindLabels, storyEntryKinds, storyHeartbeatMs, type StoryEntryKind } from "@habitat/shared";
import { claimEntryLock, releaseEntryLock, updateEntry } from "@/app/codex/actions";

export function StoryEntryEditor({ entry, viewerUserId }: {
  entry: {
    id: string;
    kind: StoryEntryKind;
    slug: string;
    title: string;
    summary: string | null;
    body: string | null;
    version: number;
    lockedBy: { userId: string; name: string } | null;
  };
  viewerUserId: string;
}) {
  const [claimFailed, setClaimFailed] = useState(false);
  const [lockHeld, setLockHeld] = useState(false);
  const claimed = useRef(false);
  const claimPending = useRef(false);

  const claim = useCallback(() => {
    if (claimed.current || claimPending.current) return;
    claimPending.current = true;
    void claimEntryLock({ entryId: entry.id })
      .then((result) => {
        claimed.current = result.held;
        setLockHeld(result.held);
        setClaimFailed(!result.held);
      })
      .catch(() => setClaimFailed(true))
      .finally(() => { claimPending.current = false; });
  }, [entry.id]);

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

  return <div className="story-entry-editor">
    {heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />{heldByOther.name} is writing here. A version check protects both drafts if you overlap.</p> : null}
    {claimFailed && !heldByOther ? <p className="story-lock-warning"><Lock aria-hidden="true" size={12} />Another writer claimed this entry. Click back into a field to retry.</p> : null}
    <form action={updateEntry} className="story-form" onFocus={claim} onSubmit={() => { claimed.current = false; setLockHeld(false); }}>
      <input name="entryId" type="hidden" value={entry.id} /><input name="version" type="hidden" value={entry.version} />
      <label>Kind<select defaultValue={entry.kind} key={`kind-${entry.version}`} name="kind">{storyEntryKinds.map((option) => <option key={option} value={option}>{storyEntryKindLabels[option]}</option>)}</select></label>
      <label>Title<input defaultValue={entry.title} key={`title-${entry.version}`} maxLength={120} name="title" required type="text" /></label>
      {/* The public key is stable even when storage needs a compatibility alias.
          Writers author the public form; the server normalizes storage on save. */}
      <p className="story-inspector-hint">Public key / route <code>{canonicalStoryEntryRouteSlug(entry.slug)}</code> — set when this was written, and a rename leaves the public address here. Reserved compatibility aliases cannot be reused.</p>
      <label>Summary<textarea defaultValue={entry.summary ?? ""} key={`summary-${entry.version}`} maxLength={500} name="summary" rows={2} /></label>
      <label>Detail<textarea defaultValue={entry.body ?? ""} key={`body-${entry.version}`} maxLength={20000} name="body" rows={16} /></label>
      <button className="save-server" type="submit">Save entry</button>
    </form>
  </div>;
}
