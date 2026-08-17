"use client";

import { useActionState } from "react";
import { KeyRound, TriangleAlert } from "lucide-react";
import { issueExportToken, type IssueTokenState } from "@/app/admin/story/actions";

const initialState: IssueTokenState = {};

/**
 * The token is shown exactly once, right after it is minted. Only its hash is
 * stored, so leaving this page is what makes it unrecoverable — the copy is
 * deliberate, not a convenience.
 */
export function ExportTokenIssuer() {
  const [state, formAction, pending] = useActionState(issueExportToken, initialState);

  return (
    <div className="story-form">
      <form action={formAction} className="story-form" style={{ padding: 0, border: 0, background: "transparent" }}>
        <p className="eyebrow"><KeyRound aria-hidden="true" size={12} /> Issue a read token</p>
        <label>What is it for<input maxLength={80} name="label" placeholder="Martino Unreal editor — 192.168.86.150" required type="text" /></label>
        <button className="save-server" disabled={pending} type="submit">{pending ? "Minting…" : "Issue token"}</button>
      </form>

      {state.error ? <p className="story-lock-warning"><TriangleAlert aria-hidden="true" size={12} />{state.error}</p> : null}
      {state.token ? (
        <div className="story-token-reveal">
          <p className="eyebrow">Copy this now — it is not stored and cannot be shown again</p>
          <code>{state.token}</code>
          <p>Set it on the game machine as <code>MARTINO_STORY_TOKEN</code>, then read the story with<br /><code>curl -H &quot;Authorization: Bearer $MARTINO_STORY_TOKEN&quot; https://habitat.martinobear.com/api/story/export</code></p>
        </div>
      ) : null}
    </div>
  );
}
