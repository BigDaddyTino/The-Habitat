"use client";

import { useFormStatus } from "react-dom";
import { Lock, LockOpen } from "lucide-react";
import { lockArc, unlockArc } from "@/app/codex/actions";

/**
 * The freeze, in the bottom-left corner of every flow.
 *
 * Who sees what, and why:
 *  - An admin always sees it, open or shut, because they are the only one who
 *    can turn it and the control has to be findable before it is needed.
 *  - Everyone else sees it only while the flow is locked. An "unlocked" badge
 *    on every board would be a permanent notice that nothing is happening —
 *    the open state is the default, and defaults do not need announcing.
 */
export function StoryFlowLock({ arcId, canReview, locked }: {
  arcId: string;
  canReview: boolean;
  locked: { at: Date; by: string | null } | null;
}) {
  if (!locked && !canReview) return null;

  const heldBy = locked?.by;
  const since = locked ? locked.at.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
  const title = locked
    ? `${heldBy ? `${heldBy} locked` : "Locked"} this flow${since ? ` on ${since}` : ""}. Nothing here can be changed until it is unlocked.`
    : "Lock this flow. Its cards, branches, and settings freeze until an admin unlocks it.";

  if (!canReview) {
    return <p className="flow-lock is-locked" title={title}>
      <Lock aria-hidden="true" size={12} />
      <span>Locked{heldBy ? ` by ${heldBy}` : ""}</span>
    </p>;
  }

  return <form action={locked ? unlockArc : lockArc} className="flow-lock-form">
    <input name="arcId" type="hidden" value={arcId} />
    <LockButton locked={Boolean(locked)} title={title} />
  </form>;
}

/**
 * Split out so `useFormStatus` reads the state of the form above it — called
 * in the parent it would see no form at all and never report pending.
 */
function LockButton({ locked, title }: { locked: boolean; title: string }) {
  const { pending } = useFormStatus();
  return <button className={`flow-lock${locked ? " is-locked" : ""}`} disabled={pending} title={title} type="submit">
    {locked ? <Lock aria-hidden="true" size={12} /> : <LockOpen aria-hidden="true" size={12} />}
    <span>{pending ? (locked ? "Unlocking…" : "Locking…") : locked ? "Locked — click to unlock" : "Unlocked — click to lock"}</span>
  </button>;
}
