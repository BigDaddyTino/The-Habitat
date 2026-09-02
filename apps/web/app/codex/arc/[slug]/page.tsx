import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Cog, Lock, MapPin, Settings2, TriangleAlert } from "lucide-react";
import { hasRole, requireRole } from "@/lib/authorization";
import { isStoryFlowEditable, storyArcCategoryLabels, storyLockNotice, storyStatusLabels } from "@habitat/shared";
import { getStoryBoard, getStoryRipples, listStoryArcRefs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryScript } from "@/components/story-script";
import { RipplePanel } from "@/components/story-ripples";
import { ArcFields } from "@/components/story-arc-form";
import { archiveArc, canoniseArc, updateArc } from "@/app/codex/actions";

/**
 * The arc page IS the story, read the way a player meets it: a numbered
 * reading order down the left, the chosen card on the right with its prose,
 * its spoken lines as fields, and the choices leading out of it — everything
 * a writer fills in, in one place. The graph is one tab over. The arc's own
 * settings and loose ends sit in a compact strip above, collapsed, so the
 * story is the first thing on the screen rather than the last.
 */
export default async function StoryArcPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ node?: string }> }) {
  const user = await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [{ slug }, { node: initialNodeId }] = await Promise.all([params, searchParams]);
  const board = await getStoryBoard(slug);
  if (!board) notFound();
  const [arcRefs, regions, characters, factions, allSystems, web] = await Promise.all([
    listStoryArcRefs(),
    listStoryEntries({ kind: "REGION" }),
    listStoryEntries({ kind: "CHARACTER" }),
    listStoryEntries({ kind: "FACTION" }),
    listStoryEntries({ kind: "SYSTEM" }),
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
  const lineTotal = board.nodes.reduce((sum, node) => sum + node.lines.length, 0);
  const voicedTotal = board.nodes.reduce((sum, node) => sum + node.lines.filter((line) => line.voiced).length, 0);

  return (
    <>
    <section className="codex-shell arc-shell">
      <header className="arc-head">
        <div className="arc-head-copy">
          <Link className="codex-back" href="/codex/stories"><ArrowLeft aria-hidden="true" size={13} /> Stories</Link>
          <h1>{board.arc.title}</h1>
          <p className="arc-chips">
            <span className={`arc-chip is-${board.arc.status.toLowerCase()}`}>{storyStatusLabels[board.arc.status]}</span>
            <span className="arc-chip">{storyArcCategoryLabels[board.arc.category]}</span>
            {board.arc.region ? <Link className="arc-chip" href={`/codex/bible/${board.arc.region.slug}`}><MapPin aria-hidden="true" size={11} /> {board.arc.region.title}</Link> : null}
            {board.arc.companion ? <Link className="arc-chip" href={`/codex/bible/${board.arc.companion.slug}`}>{board.arc.companion.title}&apos;s story</Link> : null}
            {board.arc.faction ? <Link className="arc-chip" href={`/codex/bible/${board.arc.faction.slug}`}>{board.arc.faction.title}</Link> : null}
            <span className="arc-chip is-muted">{board.nodes.length} cards · {lineTotal} lines{lineTotal ? ` · ${voicedTotal} voiced` : ""}</span>
            <span className="arc-chip is-muted" title="The export slug never changes — it is the identity the game matches this story's assets on.">slug <code>{board.arc.slug}</code></span>
          </p>
          {board.arc.summary ? <p className="arc-summary">{board.arc.summary}</p> : null}
          {board.arc.hook ? <p className="arc-hook"><b>Hook</b> {board.arc.hook}</p> : null}
          {unlockedSystems.length > 0 ? (
            <p className="codex-arc-unlocks">
              <Cog aria-hidden="true" size={12} />
              <span>Completing this unlocks</span>
              {unlockedSystems.map((system) => <Link href={`/codex/bible/${system.slug}`} key={system.id}>{system.title}</Link>)}
            </p>
          ) : null}
        </div>
        <div className="arc-head-aside">
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

      <div className="arc-strip">
      {canEditArc ? (
        <details className="codex-problems codex-arc-settings arc-strip-item">
          <summary><Settings2 aria-hidden="true" size={14} /> Arc settings — title, kind of story, where it is picked up</summary>
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
          {canReview ? (
            <form action={archiveArc} className="codex-arc-archive">
              <input name="arcId" type="hidden" value={board.arc.id} />
              <button className="danger-link" type="submit"><Archive aria-hidden="true" size={13} /> Archive this story</button>
              <small className="story-inspector-hint">Takes it off the stories page, the navigator, and the export. Its scenes, branches, and history are kept — an administrator can bring it back from the revision trail. Use this for a board that should never have been opened.</small>
            </form>
          ) : null}
        </details>
      ) : null}

      {board.problems.length > 0 ? (
        <details className="codex-problems arc-strip-item">
          <summary><TriangleAlert aria-hidden="true" size={14} /> {board.problems.length} loose end{board.problems.length === 1 ? "" : "s"}</summary>
          <ul>{board.problems.map((problem, index) => <li key={`${problem.kind}-${problem.nodeKey}-${index}`}>{problem.detail}</li>)}</ul>
        </details>
      ) : null}
      </div>

      <StoryScript
        arcRefs={arcRefs}
        assistantAvailable={isStoryAssistantAvailable()}
        board={board}
        canReview={canReview}
        initialNodeId={initialNodeId ?? null}
        viewerUserId={user.id}
      />
    </section>
    <RipplePanel arcSlug={slug} arcTitle={board.arc.title} web={web} />
    </>
  );
}
