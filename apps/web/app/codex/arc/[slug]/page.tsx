import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryBoard, storyReadRole } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryBoardCanvas } from "@/components/story-board";
import { canoniseArc } from "@/app/codex/actions";

export default async function StoryArcPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const { slug } = await params;
  const board = await getStoryBoard(slug);
  if (!board) notFound();
  const nodeTitles = new Map(board.nodes.map((node) => [node.id, node.title]));

  return (
    <section className="codex-board-shell">
      <header className="codex-board-head">
        <div>
          <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> All arcs</Link>
          <h1>{board.arc.title}</h1>
          {board.arc.summary ? <p>{board.arc.summary}</p> : null}
        </div>
        <div className="codex-board-aside">
          {board.present.length > 0 ? (
            <div className="codex-presence">
              <p className="eyebrow">Here now</p>
              <ul>{board.present.map((writer) => {
                const initials = writer.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                const editing = writer.nodeId ? nodeTitles.get(writer.nodeId) : null;
                const label = `${writer.name}${editing ? ` — editing ${editing}` : " — viewing the board"}`;
                return <li aria-label={label} className={editing ? "is-editing" : ""} key={writer.userId} title={label}>{initials || "?"}</li>;
              })}</ul>
            </div>
          ) : null}
          {canReview && board.arc.status !== "CANON" ? (
            <form action={canoniseArc}>
              <input name="arcId" type="hidden" value={board.arc.id} />
              <button className="save-server" type="submit">Make this arc canon</button>
            </form>
          ) : null}
        </div>
      </header>

      {board.problems.length > 0 ? (
        <details className="codex-problems">
          <summary><TriangleAlert aria-hidden="true" size={14} /> {board.problems.length} loose end{board.problems.length === 1 ? "" : "s"} on this board</summary>
          <ul>{board.problems.map((problem, index) => <li key={`${problem.kind}-${problem.nodeKey}-${index}`}>{problem.detail}</li>)}</ul>
        </details>
      ) : null}

      <StoryBoardCanvas assistantAvailable={isStoryAssistantAvailable()} board={board} canReview={canReview} viewerUserId={user.id} />
    </section>
  );
}
