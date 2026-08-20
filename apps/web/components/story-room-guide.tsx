"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { ArrowRight, Lightbulb, Lock, Send, X } from "lucide-react";

const DISMISS_KEY = "habitat.codex.stories.guide";

/** A browser with storage blocked still gets the card; it just cannot
 *  remember that it was closed. */
function wasDismissed() {
  try { return window.localStorage.getItem(DISMISS_KEY) === "dismissed"; } catch { return false; }
}

/**
 * Three lines explaining how the room works, shown once and dismissible
 * forever. Deliberately client-side only: this is a reading preference, not a
 * fact about the codex, and putting it on the server would mean a schema, a
 * migration, and a write on a page that otherwise only reads.
 *
 * It renders nothing until the browser has answered, so a dismissed card never
 * flashes back into view on every navigation.
 */
export function StoryRoomGuide() {
  const hydrated = useHydrated();
  const [closedNow, setClosedNow] = useState(false);

  // Nothing renders until the browser has answered, so a card somebody
  // closed last week never flashes back on every navigation.
  if (!hydrated || closedNow || wasDismissed()) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, "dismissed"); } catch { /* nothing to remember it with */ }
    setClosedNow(true);
  };

  return (
    <aside className="stories-room-guide">
      <button aria-label="Hide this" className="icon-action" onClick={dismiss} type="button"><X aria-hidden="true" size={14} /></button>
      <p className="eyebrow">How this room works</p>
      <ol>
        <li><Lightbulb aria-hidden="true" size={13} /><span>Ideas grow in <strong>threads</strong>, where the room argues them out.</span></li>
        <li><Send aria-hidden="true" size={13} /><span>The parts that stop being arguments get <strong>sent to canon</strong> and wait in the inbox.</span></li>
        <li><Lock aria-hidden="true" size={13} /><span>A writer <strong>builds them into a story board</strong> — and locks it when it is finished.</span></li>
      </ol>
      <p className="stories-room-guide-foot">Nothing is settled until somebody turns the padlock. <ArrowRight aria-hidden="true" size={11} /></p>
    </aside>
  );
}
