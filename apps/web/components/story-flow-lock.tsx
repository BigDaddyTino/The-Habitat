"use client";

import { useFormStatus } from "react-dom";
import { Lock, LockOpen } from "lucide-react";
import { lockArc, unlockArc } from "@/app/codex/actions";

/**
 * The freeze, in the bottom-left corner of every flow.
 *
 * The two directions are not the same act, so they are not offered to the same
 * people. Locking is any writer settling their own work — one click, always
 * available, so finishing a flow and protecting it are the same gesture.
 * Unlocking is reopening something somebody already called finished, which is
 * an admin's call.
 *
 * A writer looking at a locked flow therefore gets a badge, not a button: the
 * point of their own lock is that they cannot quietly take it back either.
 */
export function StoryFlowLock({ arcId, canReview, locked }: {
  arcId: string;
  canReview: boolean;
  locked: { at: Date; by: string | null } | null;
}) {
  const heldBy = locked?.by;
  const since = locked ? locked.at.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

  if (!locked) {
    return <form action={lockArc} className="flow-lock-form">
      <input name="arcId" type="hidden" value={arcId} />
      <LockButton locked={false} title="Lock this flow. Its cards, branches, and settings freeze, and only an admin can reopen it." />
    </form>;
  }

  const held = `${heldBy ? `${heldBy} locked` : "Locked"} this flow${since ? ` on ${since}` : ""}.`;

  if (!canReview) {
    return <p className="flow-lock is-locked" title={`${held} Nothing here can change until an admin unlocks it.`}>
      <Lock aria-hidden="true" size={12} />
      <span>Locked{heldBy ? ` by ${heldBy}` : ""}</span>
    </p>;
  }

  return <form action={unlockArc} className="flow-lock-form">
    <input name="arcId" type="hidden" value={arcId} />
    <LockButton locked title={`${held} Unlocking reopens it for everyone.`} />
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
    <span>{pending ? (locked ? "Unlocking…" : "Locking…") : locked ? "Locked — click to unlock" : "Lock this flow"}</span>
  </button>;
}
