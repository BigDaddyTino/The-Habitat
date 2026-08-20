"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { refusalMessage } from "@/lib/writer-refusal";

/**
 * The codex's own landing pad for a failed save.
 *
 * Server actions here throw curated errors — "somebody saved this while you
 * were writing", "that entry is canon" — but production Next.js redacts
 * thrown messages down to a digest, and without a boundary the writer fell
 * through to the framework's generic crash page with no way back that did
 * not lose their place. This keeps them in the codex, names the likely
 * causes in writers' terms, and offers the recovery that actually works
 * (reload the page and reopen the card, which also picks up whatever the
 * other writer saved).
 */
export default function CodexError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // When the codex refused the write on purpose, it said why in the room's own
  // words. Show that instead of guessing at causes — a writer whose only
  // problem is an unpicked dropdown should not have to read three theories.
  const refused = refusalMessage(error.digest);

  return (
    <section className="page-shell codex-shell codex-error">
      <div className="codex-problems" style={{ margin: "48px auto", maxWidth: 620, padding: "8px 0" }}>
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 0" }}>
          <TriangleAlert aria-hidden="true" size={14} /> That did not save
        </p>
        <div style={{ padding: "10px 16px 16px", fontSize: 13, lineHeight: 1.65 }}>
          {refused ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, margin: "0 0 10px" }}>{refused}</p>
              <p>Go back, fix that, and save again. Nothing already saved has been lost — if you had unsaved text, copy it before leaving this page.</p>
            </>
          ) : (
            <>
              <p>The most common reasons, in order:</p>
              <ul style={{ margin: "8px 0 14px", paddingLeft: 20 }}>
                <li>Somebody else saved the same card or entry while you were writing — reopen it to see their version before saving yours.</li>
                <li>This tab predates a codex update — a hard refresh (Ctrl+Shift+R) fixes that.</li>
                <li>Something you typed was longer than a field allows.</li>
              </ul>
              <p>Nothing already saved has been lost. If you had unsaved text, copy it before leaving this page.</p>
            </>
          )}
          <button
            className="save-server"
            onClick={() => { router.refresh(); reset(); }}
            style={{ marginTop: 14 }}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={13} /> Back to the codex
          </button>
        </div>
      </div>
    </section>
  );
}
