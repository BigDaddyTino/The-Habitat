import { KeyRound, MessagesSquare, Trash2 } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { ExportTokenIssuer } from "@/components/export-token-issuer";
import { getAssistantAudit } from "@/lib/story-assistant-service";
import { revokeExportToken } from "./actions";

const db = getPrismaClient();

export const metadata = { title: "Story export" };

export default async function AdminStoryPage() {
  await requireRole("ADMIN");
  const [tokens, audit] = await Promise.all([
    db.storyExportToken.findMany({
      include: { creator: { select: { displayName: true, name: true } } },
      orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
    }),
    getAssistantAudit(50),
  ]);

  return (
    <section className="page-shell codex-shell">
      <div className="page-intro">
        <p className="eyebrow">Martino — story export</p>
        <h1>Reading the codex from the game</h1>
        <p>The Unreal project pulls canon from <code>/api/story/export</code> with one of these tokens. Nothing below canon is ever included, and the endpoint is read-only — it exposes story content and nothing else about the Habitat.</p>
      </div>

      <div className="codex-lower">
        <ExportTokenIssuer />

        <div className="codex-activity">
          <div className="panel-heading"><h2>Issued tokens</h2></div>
          {tokens.length === 0 ? (
            <p className="story-inspector-hint">No token has been issued yet. The export endpoint refuses every request until one exists.</p>
          ) : (
            <ul className="codex-token-list">
              {tokens.map((token) => (
                <li className={token.revokedAt ? "is-revoked" : ""} key={token.id}>
                  <div>
                    <strong><KeyRound aria-hidden="true" size={13} /> {token.label}</strong>
                    <span>
                      {token.revokedAt ? `Revoked ${token.revokedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : token.lastUsedAt ? `Last read ${token.lastUsedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : "Never used"}
                      {" · "}by {token.creator.displayName ?? token.creator.name ?? "an administrator"}
                    </span>
                  </div>
                  {token.revokedAt ? null : (
                    <form action={revokeExportToken}>
                      <input name="tokenId" type="hidden" value={token.id} />
                      <button className="icon-action reject" title={`Revoke ${token.label}`} type="submit"><Trash2 aria-hidden="true" size={14} /></button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="codex-section">
        <div className="section-heading"><h2>The Warden&apos;s transcript</h2></div>
        <p className="story-inspector-hint">
          Every exchange with the codex assistant, whatever the outcome — including questions that were rate limited or refused before they ever reached Gemini.
          {" "}{audit.requestsToday} request{audit.requestsToday === 1 ? "" : "s"} spent today.
          {Object.entries(audit.countsByOutcome).length > 0 ? ` All time: ${Object.entries(audit.countsByOutcome).map(([outcome, count]) => `${count} ${outcome.toLowerCase().replace(/_/g, " ")}`).join(", ")}.` : ""}
        </p>

        {audit.rows.length === 0 ? (
          <div className="empty-data"><MessagesSquare aria-hidden="true" size={24} /><div><h2>Nothing asked yet.</h2><p>The transcript fills as the crew uses the assistant on a board.</p></div></div>
        ) : (
          <ul className="warden-audit">
            {audit.rows.map((row) => (
              <li key={row.id}>
                <header>
                  <strong>{row.asker}</strong>
                  <span className={`warden-outcome outcome-${row.outcome.toLowerCase()}`}>{row.outcome.toLowerCase().replace(/_/g, " ")}</span>
                  <span>{row.arc ? row.arc.title : "no arc"}</span>
                  <span>{row.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </header>
                <p className="warden-audit-question">{row.question}</p>
                {row.answer ? <p className="warden-audit-answer">{row.answer}</p> : null}
                {row.failureReason ? <p className="warden-audit-failure">{row.failureReason}</p> : null}
                <footer>
                  <span>{row.model}</span>
                  <span>{row.contextSummary}</span>
                  {row.promptTokens !== null ? <span>{row.promptTokens} in / {row.responseTokens ?? 0} out{row.thinkingTokens ? ` / ${row.thinkingTokens} thinking` : ""}</span> : null}
                  {row.latencyMs !== null ? <span>{row.latencyMs} ms</span> : null}
                </footer>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
