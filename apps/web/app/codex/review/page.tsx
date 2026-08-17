import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { storyEntryKindLabels, storyNodeKindLabels } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { getStoryReviewQueue, storyReviewRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { setStoryStatus } from "@/app/codex/actions";

export const metadata = { title: "Codex review" };

function Decision({ entityType, entityId }: { entityType: "ARC" | "NODE" | "EDGE" | "ENTRY"; entityId: string }) {
  return (
    <div className="claim-decision">
      <form action={setStoryStatus}><input name="entityType" type="hidden" value={entityType} /><input name="entityId" type="hidden" value={entityId} /><input name="status" type="hidden" value="CANON" /><button className="save-server" type="submit">Make canon</button></form>
      <form action={setStoryStatus}><input name="entityType" type="hidden" value={entityType} /><input name="entityId" type="hidden" value={entityId} /><input name="status" type="hidden" value="REJECTED" /><button className="save-server" type="submit">Reject</button></form>
    </div>
  );
}

export default async function CodexReviewPage() {
  await requireRole(storyReviewRole);
  const queue = await getStoryReviewQueue();

  return (
    <section className="page-shell codex-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> Story codex</Link>
        <p className="eyebrow">Martino — review</p>
        <h1>Waiting on you</h1>
        <p>Nothing below is in the game yet. Approving a node also makes its arc canon so the export can carry it; rejecting keeps it on the board, marked, so the writer can see what happened to it.</p>
      </div>

      {queue.total === 0 ? (
        <div className="empty-data"><Inbox aria-hidden="true" size={24} /><div><h2>The queue is empty.</h2><p>Everything written so far has been reviewed.</p></div></div>
      ) : (
        <div className="codex-review-list">
          {queue.arcs.map((arc) => (
            <article key={arc.id}>
              <div><p className="eyebrow">Arc — {arc.author}</p><h2><Link href={`/codex/arc/${arc.slug}`}>{arc.title}</Link></h2>{arc.summary ? <p>{arc.summary}</p> : null}</div>
              <Decision entityId={arc.id} entityType="ARC" />
            </article>
          ))}
          {queue.nodes.map((node) => (
            <article key={node.id}>
              <div><p className="eyebrow">{storyNodeKindLabels[node.kind]} in <Link href={`/codex/arc/${node.arc.slug}`}>{node.arc.title}</Link> — {node.author}</p><h2>{node.title}</h2>{node.summary ? <p>{node.summary}</p> : null}</div>
              <Decision entityId={node.id} entityType="NODE" />
            </article>
          ))}
          {queue.edges.map((edge) => (
            <article key={edge.id}>
              <div><p className="eyebrow">Branch in <Link href={`/codex/arc/${edge.arc.slug}`}>{edge.arc.title}</Link> — {edge.author}</p><h2>{edge.from} → {edge.to}</h2>{edge.label ? <p>Choice: “{edge.label}”</p> : <p>An unlabelled continuation.</p>}</div>
              <Decision entityId={edge.id} entityType="EDGE" />
            </article>
          ))}
          {queue.entries.map((entry) => (
            <article key={entry.id}>
              <div><p className="eyebrow">{storyEntryKindLabels[entry.kind]} — {entry.author}</p><h2><Link href={`/codex/bible/${entry.slug}`}>{entry.title}</Link></h2>{entry.summary ? <p>{entry.summary}</p> : null}</div>
              <Decision entityId={entry.id} entityType="ENTRY" />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
