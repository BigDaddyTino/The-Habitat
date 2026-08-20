"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { refusalMessage } from "@/lib/writer-refusal";

/**
 * The landing pad for every surface outside the codex.
 *
 * The codex had one of these; nothing else did, so a refused save anywhere
 * from a member's profile to the season builder fell through to the
 * framework's own crash page — no explanation, no way back that kept the
 * member's place. Most of those refusals were written in plain language at the
 * point they were thrown ("that name is already taken", "the season has not
 * started"), and nobody ever read one.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const refused = refusalMessage(error.digest);

  return (
    <section className="page-shell">
      <div className="page-intro" style={{ margin: "48px auto", maxWidth: 620 }}>
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TriangleAlert aria-hidden="true" size={14} /> {refused ? "That did not go through" : "Something went wrong"}
        </p>
        {refused ? (
          <>
            <h1 style={{ fontSize: 22, lineHeight: 1.35 }}>{refused}</h1>
            <p>Go back, fix that, and try again. Nothing you had already saved has been lost.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, lineHeight: 1.35 }}>That did not work, and the reason was not one we expected.</h1>
            <p>Nothing you had already saved has been lost. A reload usually clears it; if this keeps happening, the details are in the server log{error.digest ? <> under <code>{error.digest}</code></> : null}.</p>
          </>
        )}
        <button
          className="save-server"
          onClick={() => { router.refresh(); reset(); }}
          style={{ marginTop: 16 }}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} /> Try again
        </button>
      </div>
    </section>
  );
}
