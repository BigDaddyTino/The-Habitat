import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cog, Lock, MapPin, Settings2, TriangleAlert } from "lucide-react";
import { hasRole, requireRole } from "@/lib/authorization";
import { isStoryFlowEditable, storyLockNotice } from "@habitat/shared";
import { getCanonNavigator, getStoryBoard, getStoryRipples, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryFlow } from "@/components/story-flow";
import { CanonNavigator } from "@/components/canon-navigator";
import { RipplePanel } from "@/components/story-ripples";
import { ArcFields } from "@/components/story-arc-form";
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
  const [arcRefs, regions, characters, factions, allSystems, nav, web] = await Promise.all([
    listStoryArcRefs(),
    listStoryEntries({ kind: "REGION" }),
    listStoryEntries({ kind: "CHARACTER" }),
    listStoryEntries({ kind: "FACTION" }),
    listStoryEntries({ kind: "SYSTEM" }),
    getCanonNavigator(),
    getStoryRipples(),
  ]);
  // The other end of the release gate: each system's sheet names the arc that
  // unlocks it, and the arc page answers "what does finishing this hand the
  // player" without anyone opening nineteen dossiers to find out.
  const unlockedSystems = allSystems.filter((system) => {
    const meta = system.meta;
    return typeof meta === "object" && meta !== null && !Array.isArray(meta) && (meta as Record<string, unknown>).unlockArc === slug;
  });
  const nodeTitles = new Map(board.nodes.map((node) => [node.id, node.title]));
  // One freeze for the whole flow: arc settings included, admins included.
  const canEditArc = isStoryFlowEditable(board.arc.locked !== null);

  return (
    // The board keeps its own full-height shell; the ripples panel sits below
    // it as a sibling so a short screen scrolls to reach it rather than
    // squeezing the flow canvas to make room.
    <>
    <section className="codex-board-shell">
      <header className="codex-board-head">
        <div>
          <Link className="codex-back" href="/codex/stories/canon"><ArrowLeft aria-hidden="true" size={13} /> Story navigator</Link>
          <h1>{board.arc.title}</h1>
          {board.arc.summary || board.arc.region || board.arc.hook ? (
            <details className="codex-board-brief">
              <summary>Story brief</summary>
              {board.arc.summary ? <p>{board.arc.summary}</p> : null}
              {board.arc.region || board.arc.hook ? (
                <p className="codex-arc-pickup">
                  <MapPin aria-hidden="true" size={12} />
                  {board.arc.region ? <Link href={`/codex/bible/${board.arc.region.slug}`}>{board.arc.region.title}</Link> : "No pickup place yet"}
                  {board.arc.hook ? <span> — {board.arc.hook}</span> : null}
                </p>
              ) : null}
            </details>
          ) : null}
          {unlockedSystems.length > 0 ? (
            <p className="codex-arc-unlocks">
              <Cog aria-hidden="true" size={12} />
              <span>Completing this unlocks</span>
              {unlockedSystems.map((system) => <Link href={`/codex/bible/${system.slug}`} key={system.id}>{system.title}</Link>)}
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
          <summary><Settings2 aria-hidden="true" size={14} /> Arc settings — what kind of story it is, where it is picked up, and how</summary>
          <form action={updateArc} className="story-form">
            <input name="arcId" type="hidden" value={board.arc.id} />
            <ArcFields
              canReview={canReview}
              characters={characters.map((character) => ({ id: character.id, title: character.title }))}
              defaults={{
                title: board.arc.title,
                summary: board.arc.summary ?? "",
                hook: board.arc.hook ?? "",
                regionEntryId: board.arc.region?.id ?? "",
                companionEntryId: board.arc.companion?.id ?? "",
                factionEntryId: board.arc.faction?.id ?? "",
                category: board.arc.category,
              }}
              factions={factions.map((faction) => ({ id: faction.id, title: faction.title }))}
              regions={regions.map((region) => ({ id: region.id, title: region.title }))}
              submitLabel="Save it"
            />
            <p className="story-inspector-hint">The export slug <code>{board.arc.slug}</code> never changes — it is the identity the game matches this story&apos;s assets on.</p>
          </form>
        </details>
      ) : null}

      {board.problems.length > 0 ? (
        <details className="codex-problems">
          <summary><TriangleAlert aria-hidden="true" size={14} /> {board.problems.length} loose end{board.problems.length === 1 ? "" : "s"} on this arc</summary>
          <ul>{board.problems.map((problem, index) => <li key={`${problem.kind}-${problem.nodeKey}-${index}`}>{problem.detail}</li>)}</ul>
        </details>
      ) : null}

      <div className="canon-workspace">
        <CanonNavigator currentArcSlug={slug} nav={nav} />
        <div className="canon-workspace-main">
          <StoryFlow
            arcRefs={arcRefs}
            assistantAvailable={isStoryAssistantAvailable()}
            board={board}
            canReview={canReview}
            initialNodeId={initialNodeId ?? null}
            viewerUserId={user.id}
          />
        </div>
      </div>

    </section>
    <RipplePanel arcSlug={slug} arcTitle={board.arc.title} web={web} />
    </>
  );
}
