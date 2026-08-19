"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Flame, Send, X } from "lucide-react";
import { storyAssistantName } from "@habitat/shared";
import { askWarden, type WardenState } from "@/app/codex/actions";

const initialState: WardenState = { turns: [] };

/**
 * The Warden's panel, floating over the board.
 *
 * Everything he says is advisory and stays on screen — nothing here writes to
 * the codex. A suggestion becomes story only when a writer types it into a card
 * themselves, which is what keeps the review ladder meaningful.
 */
export function StoryWarden({ arcId, nodeId, available }: { arcId: string | null; nodeId: string | null; available: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(askWarden, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const turnCount = state.turns.length;

  useEffect(() => {
    if (turnCount === 0) return;
    formRef.current?.reset();
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turnCount]);

  if (!open) {
    return (
      <button className="warden-summon" onClick={() => setOpen(true)} type="button">
        <Flame aria-hidden="true" size={15} />
        Ask {storyAssistantName}
      </button>
    );
  }

  return (
    <aside aria-label={`${storyAssistantName}, the codex assistant`} className="warden-panel">
      <header>
        <div>
          <p className="eyebrow">Codex assistant</p>
          <h2>{storyAssistantName}</h2>
        </div>
        <button aria-label="Close the assistant" className="icon-action" onClick={() => setOpen(false)} type="button"><X aria-hidden="true" size={15} /></button>
      </header>

      <div className="warden-log" ref={logRef}>
        {!available ? (
          // Writers see the Warden, not the plumbing; the setup an admin needs
          // is in .env.example and Docs/STORY_CODEX.md.
          <p className="warden-idle">He is not on duty yet. An administrator has to wake him before he will answer.</p>
        ) : state.turns.length === 0 ? (
          <p className="warden-idle">He has read this arc and the whole bible. Ask what is already true, whether your idea contradicts something, or why a branch on this board is flagged.</p>
        ) : (
          state.turns.map((turn) => (
            <article key={turn.id}>
              <p className="warden-question">{turn.question}</p>
              <div className="warden-answer">{turn.answer.split("\n").filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}</div>
            </article>
          ))
        )}
        {pending ? <p className="warden-thinking">Reading the codex…</p> : null}
      </div>

      {state.error ? <p className="warden-error" role="alert">{state.error}</p> : null}

      <form action={formAction} ref={formRef}>
        <input name="arcId" type="hidden" value={arcId ?? ""} />
        <input name="nodeId" type="hidden" value={nodeId ?? ""} />
        <textarea
          disabled={!available}
          maxLength={2000}
          name="question"
          placeholder={available ? "Does the Ashwarden ever leave the fen?" : "Unavailable until a key is configured."}
          required
          rows={2}
        />
        <button aria-label="Ask" className="save-server" disabled={pending || !available} type="submit">
          <Send aria-hidden="true" size={13} />
          {pending ? "Asking…" : "Ask"}
        </button>
      </form>

      <p className="warden-footnote">He suggests; he never writes. Every exchange is recorded for the crew&apos;s administrators.</p>
    </aside>
  );
}
