import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, MapPin, Settings2, TriangleAlert } from "lucide-react";
import { hasRole, requireRole } from "@/lib/authorization";
import { isStoryFlowEditable, storyLockNotice } from "@habitat/shared";
import { getStoryBoard, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryFlow } from "@/components/story-flow";
import { canoniseArc, updateArc } from "@/app/codex/actions";

/**
 * The arc page IS the story: one top-down tree, read top to bottom, walked
 * choice by choice, edited in place. The old whiteboard/reader split confused
 * everyone — including the owner — so there is exactly one view now.
 */
export default async function StoryArcPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ node?: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [{ slug }, { node: initialNodeId }] = await Promise.all([params, searchParams]);
  const board = await getStoryBoard(slug);
  if (!board) notFound();
  const [arcRefs, regions] = await Promise.all([listStoryArcRefs(), listStoryEntries({ kind: "REGION" })]);
  const nodeTitles = new Map(board.nodes.map((node) => [node.id, node.title]));
  // One freeze for the whole flow: arc settings included, admins included.
  const canEditArc = isStoryFlowEditable(board.arc.locked !== null);

  return (
    <section className="codex-board-shell">
      <header className="codex-board-head">
        <div>
          <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> All arcs</Link>
          <h1>{board.arc.title}</h1>
          {board.arc.summary ? <p>{board.arc.summary}</p> : null}
          {board.arc.region || board.arc.hook ? (
            <p className="codex-arc-pickup">
              <MapPin aria-hidden="true" size={12} />
              {board.arc.region ? <Link href={`/codex/bible/${board.arc.region.slug}`}>{board.arc.region.title}</Link> : "No pickup place yet"}
              {board.arc.hook ? <span> — {board.arc.hook}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="codex-board-aside">
          {board.present.length > 0 ? (
            <div className="codex-presence">
              <p className="eyebrow">Here now</p>
              <ul>{board.present.map((writer) => {
                const initials = writer.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                const editing = writer.nodeId ? nodeTitles.get(writer.nodeId) : null;
                const label = `${writer.name}${editing ? ` — reading ${editing}` : " — on this arc"}`;
                return <li aria-label={label} className={editing ? "is-editing" : ""} key={writer.userId} title={label}>{initials || "?"}</li>;
              })}</ul>
            </div>
          ) : null}
          {canReview && board.arc.status !== "CANON" && canEditArc ? (
            <form action={canoniseArc}>
              <input name="arcId" type="hidden" value={board.arc.id} />
              <button className="save-server" type="submit">Make this arc canon</button>
            </form>
          ) : null}
        </div>
      </header>

      {!canEditArc ? (
        <p className="codex-problems codex-arc-locked"><Lock aria-hidden="true" size={14} /> {storyLockNotice(board.arc.locked?.by ?? null)}</p>
      ) : null}

      {canEditArc ? (
        <details className="codex-problems codex-arc-settings">
          <summary><Settings2 aria-hidden="true" size={14} /> Arc settings — title, pickup place, hook</summary>
          <form action={updateArc} className="story-form">
            <input name="arcId" type="hidden" value={board.arc.id} />
            <label>Title<input defaultValue={board.arc.title} maxLength={120} name="title" required type="text" /></label>
            <label>Summary<textarea defaultValue={board.arc.summary ?? ""} maxLength={500} name="summary" rows={2} /></label>
            <label>Picked up in<select defaultValue={board.arc.region?.id ?? ""} name="regionEntryId">
              <option value="">No particular place</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.title}</option>)}
            </select></label>
            <label>Hook — how the party finds it<textarea defaultValue={board.arc.hook ?? ""} maxLength={500} name="hook" placeholder="A notice board in the fishing village. A dying stranger on the coast road. A rumor in the tavern." rows={2} /></label>
            {canReview ? <label className="enabled-toggle"><input defaultChecked={board.arc.isMainline} name="isMainline" type="checkbox" /> Part of the mainline</label> : null}
            <p className="story-inspector-hint">The export slug <code>{board.arc.slug}</code> never changes — it is the identity the game matches this arc&apos;s assets on.</p>
            <button className="save-server" type="submit">Save arc</button>
          </form>
        </details>
      ) : null}

      {board.problems.length > 0 ? (
        <details className="codex-problems">
          <summary><TriangleAlert aria-hidden="true" size={14} /> {board.problems.length} loose end{board.problems.length === 1 ? "" : "s"} on this arc</summary>
          <ul>{board.problems.map((problem, index) => <li key={`${problem.kind}-${problem.nodeKey}-${index}`}>{problem.detail}</li>)}</ul>
        </details>
      ) : null}

      <StoryFlow
        arcRefs={arcRefs}
        assistantAvailable={isStoryAssistantAvailable()}
        board={board}
        canReview={canReview}
        initialNodeId={initialNodeId ?? null}
        viewerUserId={user.id}
      />
    </section>
  );
}
