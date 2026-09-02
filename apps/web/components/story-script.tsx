"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, CornerDownRight, GitBranch, Map as MapIcon, PenLine, Plus, ScrollText, Volume2, X } from "lucide-react";
import { canonicalStoryEntryRouteSlug, isStoryFlowEditable, persistedStoryEntrySlug, storyEndingKindLabels, storyNodeKinds, storyNodeKindLabels } from "@habitat/shared";
import { addBranch, createNode } from "@/app/codex/actions";
import { StoryFlow } from "@/components/story-flow";
import { StoryFlowLock } from "@/components/story-flow-lock";
import { StoryLinesEditor } from "@/components/story-lines-editor";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryProse, type ProseResolver } from "@/components/story-prose";
import { StoryWarden } from "@/components/story-warden";
import { EdgeEditor, NodeEditor, type StoryArcRef } from "@/components/story-workbench";
import type { StoryBoard, StoryBoardEdge, StoryBoardNode } from "@/lib/story-codex";

/**
 * The arc page as a script. The story reads top to bottom in the order a
 * player meets it — a numbered list of cards on the left, the chosen card on
 * the right with everything about it in one place: the prose, its spoken
 * lines as fields, the choices leading out of it, and the card's own settings
 * behind one toggle. The graph is still here, one tab over, for the shape of
 * the story; it is no longer the only way in.
 *
 * Reading order is computed from the graph: a breadth-first walk from the
 * entry cards, following each card's choices in the order they are offered,
 * then any card the walk never reaches. That is the order the "Next" button
 * follows too, so a writer can read an arc end to end without a map.
 */

type Step = { node: StoryBoardNode; index: number; reachable: boolean };

function readingOrder(board: StoryBoard): Step[] {
  const byKey = new Map(board.nodes.map((node) => [node.key, node]));
  const byId = new Map(board.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, StoryBoardEdge[]>();
  for (const edge of board.edges) outgoing.set(edge.fromNodeId, [...(outgoing.get(edge.fromNodeId) ?? []), edge]);
  for (const list of outgoing.values()) list.sort((left, right) => left.position - right.position);
  const seen = new Set<string>();
  const order: StoryBoardNode[] = [];
  const queue: StoryBoardNode[] = board.entryNodeKeys.map((key) => byKey.get(key)).filter((node): node is StoryBoardNode => Boolean(node));
  for (const node of queue) seen.add(node.id);
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const edge of outgoing.get(node.id) ?? []) {
      const target = byId.get(edge.toNodeId);
      if (target && !seen.has(target.id)) { seen.add(target.id); queue.push(target); }
    }
  }
  const reachableCount = order.length;
  for (const node of board.nodes) if (!seen.has(node.id)) order.push(node);
  return order.map((node, index) => ({ node, index, reachable: index < reachableCount }));
}

export function StoryScript({ board, canReview, viewerUserId, arcRefs, assistantAvailable, initialNodeId = null }: {
  board: StoryBoard;
  canReview: boolean;
  viewerUserId: string;
  arcRefs: StoryArcRef[];
  assistantAvailable: boolean;
  initialNodeId?: string | null;
}) {
  const locked = board.arc.locked;
  const canEdit = isStoryFlowEditable(locked !== null);
  const steps = useMemo(() => readingOrder(board), [board]);
  const stepById = useMemo(() => new Map(steps.map((step) => [step.node.id, step])), [steps]);
  const [view, setView] = useState<"script" | "map">("script");
  const [selectedId, setSelectedId] = useState<string | null>(initialNodeId && stepById.has(initialNodeId) ? initialNodeId : steps[0]?.node.id ?? null);
  const [editingCard, setEditingCard] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [addingBranch, setAddingBranch] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Moving to another card closes the editors: an open editor belongs to the
  // card it was opened on, and its unsaved fields must not be mistaken for
  // the next card's.
  const [editorOwner, setEditorOwner] = useState(selectedId);
  if (editorOwner !== selectedId) { setEditorOwner(selectedId); setEditingCard(false); setEditingEdgeId(null); setAddingBranch(false); }

  const current = selectedId ? stepById.get(selectedId) ?? null : null;
  const nodesById = useMemo(() => new Map(board.nodes.map((node) => [node.id, node])), [board.nodes]);
  const outgoing = useMemo(() => {
    const map = new Map<string, StoryBoardEdge[]>();
    for (const edge of board.edges) map.set(edge.fromNodeId, [...(map.get(edge.fromNodeId) ?? []), edge]);
    for (const list of map.values()) list.sort((left, right) => left.position - right.position);
    return map;
  }, [board.edges]);
  const incoming = useMemo(() => {
    const map = new Map<string, StoryBoardEdge[]>();
    for (const edge of board.edges) map.set(edge.toNodeId, [...(map.get(edge.toNodeId) ?? []), edge]);
    return map;
  }, [board.edges]);
  const characters = useMemo(() => board.libraryEntries.filter((entry) => entry.kind === "CHARACTER").map((entry) => ({ id: entry.id, slug: entry.slug, title: entry.title })), [board.libraryEntries]);
  const resolveProse: ProseResolver = (slug) => {
    const entry = board.libraryEntries.find((candidate) => persistedStoryEntrySlug(candidate.slug) === persistedStoryEntrySlug(slug));
    if (entry) return { title: entry.title, href: `/codex/bible/${canonicalStoryEntryRouteSlug(slug)}` };
    const arc = arcRefs.find((candidate) => candidate.slug === slug);
    return arc ? { title: arc.title, href: `/codex/arc/${slug}` } : null;
  };
  const lineTotal = board.nodes.reduce((sum, node) => sum + node.lines.length, 0);
  const problemsByNode = useMemo(() => {
    const map = new Map<string, number>();
    for (const problem of board.problems) {
      const key = problem.nodeKey ?? "";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [board.problems]);

  const go = (nodeId: string) => { setSelectedId(nodeId); setView("script"); };
  const previous = current && current.index > 0 ? steps[current.index - 1] : null;
  const next = current && current.index < steps.length - 1 ? steps[current.index + 1] : null;

  return (
    <div className="script-shell">
      <StoryLiveSync arcId={board.arc.id} nodeId={current?.node.id ?? null} />
      <div className="script-tabs" role="tablist">
        <button aria-selected={view === "script"} className={view === "script" ? "is-active" : ""} onClick={() => setView("script")} role="tab" type="button"><ScrollText aria-hidden="true" size={14} /> Script</button>
        <button aria-selected={view === "map"} className={view === "map" ? "is-active" : ""} onClick={() => setView("map")} role="tab" type="button"><MapIcon aria-hidden="true" size={14} /> Map</button>
        <span className="script-tabs-meta">{board.nodes.length} card{board.nodes.length === 1 ? "" : "s"} · {board.edges.length} branch{board.edges.length === 1 ? "" : "es"} · {lineTotal} line{lineTotal === 1 ? "" : "s"}</span>
        <StoryFlowLock arcId={board.arc.id} canReview={canReview} locked={locked} />
      </div>

      {view === "map" ? (
        <div className="script-map">
          <StoryFlow arcRefs={arcRefs} assistantAvailable={assistantAvailable} board={board} canReview={canReview} initialNodeId={current?.node.id ?? null} viewerUserId={viewerUserId} />
        </div>
      ) : (
        <div className="script-grid">
          <nav aria-label="Reading order" className="script-nav">
            <p className="eyebrow">Reading order</p>
            {steps.length === 0 ? <p className="story-inspector-hint">No cards yet.</p> : null}
            <ol>
              {steps.map((step) => {
                const problems = problemsByNode.get(step.node.key) ?? 0;
                const voiced = step.node.lines.filter((line) => line.voiced).length;
                return (
                  <li className={`script-step kind-${step.node.kind.toLowerCase()}${step.node.id === selectedId ? " is-current" : ""}${step.reachable ? "" : " is-unreached"}`} key={step.node.id}>
                    <button onClick={() => go(step.node.id)} type="button">
                      <span className="script-step-index">{step.reachable ? step.index + 1 : "·"}</span>
                      <span className="script-step-copy">
                        <span className="script-step-kind">{storyNodeKindLabels[step.node.kind]}{step.node.status !== "CANON" ? ` · ${step.node.status.toLowerCase()}` : ""}</span>
                        <span className="script-step-title">{step.node.title}</span>
                        <span className="script-step-tags">
                          {step.node.speaker ? <i>{step.node.speaker.title}</i> : null}
                          {step.node.lines.length ? <i title={`${step.node.lines.length} lines, ${voiced} voiced`}><Volume2 aria-hidden="true" size={10} /> {step.node.lines.length}</i> : null}
                          {(outgoing.get(step.node.id)?.length ?? 0) > 1 ? <i title="Branches"><GitBranch aria-hidden="true" size={10} /> {outgoing.get(step.node.id)!.length}</i> : null}
                          {problems ? <i className="is-problem" title={`${problems} loose end${problems === 1 ? "" : "s"}`}>!</i> : null}
                          {!step.reachable ? <i className="is-problem" title="No path from the start reaches this card">unreached</i> : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {canEdit ? (
              <details className="script-add">
                <summary><Plus aria-hidden="true" size={13} /> Add a card that stands alone</summary>
                <form action={createNode} className="story-form">
                  <input name="arcId" type="hidden" value={board.arc.id} />
                  <label>Kind<select defaultValue="SCENE" name="kind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
                  <label>Title<input maxLength={160} name="title" placeholder={steps.length ? "A card to branch to later" : "Where does it begin?"} required type="text" /></label>
                  <label>Summary<textarea maxLength={500} name="summary" placeholder="One line on what happens here." rows={2} /></label>
                  <button className="save-server" type="submit">{steps.length ? "Add the card" : "Add the first card"}</button>
                </form>
                <p className="story-inspector-hint">Most cards are better added as a branch from the card before them — see the choices on any card.</p>
              </details>
            ) : null}
          </nav>

          <main className="script-main">
            {!current ? (
              <div className="script-empty">
                <h2>{board.arc.title}</h2>
                {board.arc.summary ? <p>{board.arc.summary}</p> : null}
                <p className="story-inspector-hint">{canEdit ? "Add the first card from the list on the left." : "This flow is locked and has no cards yet."}</p>
              </div>
            ) : (
              <article className={`script-card kind-${current.node.kind.toLowerCase()}`} key={current.node.id}>
                <header className="script-card-head">
                  <div className="script-card-title">
                    <span className="script-card-kind">{current.reachable ? `Card ${current.index + 1} of ${steps.length}` : "Unreached card"} · {storyNodeKindLabels[current.node.kind]}{current.node.kind === "ENDING" && current.node.endingKind ? ` · ${storyEndingKindLabels[current.node.endingKind]}` : ""}{current.node.status !== "CANON" ? ` · ${current.node.status.toLowerCase()}` : ""}</span>
                    <h2>{current.node.title}</h2>
                    <p className="script-card-meta">
                      {current.node.speaker ? <span>Spoken by <Link href={`/codex/bible/${current.node.speaker.slug}`}>{current.node.speaker.title}</Link></span> : <span>Narration, or many voices</span>}
                      <span>Key <code>{current.node.key}</code></span>
                      {current.node.commentCount ? <span>{current.node.commentCount} open note{current.node.commentCount === 1 ? "" : "s"}</span> : null}
                    </p>
                  </div>
                  <div className="script-card-nav">
                    <button className="script-btn" disabled={!previous} onClick={() => previous && go(previous.node.id)} type="button"><ArrowLeft aria-hidden="true" size={13} /> Previous</button>
                    <button className="script-btn" disabled={!next} onClick={() => next && go(next.node.id)} type="button">Next <ArrowRight aria-hidden="true" size={13} /></button>
                    {canEdit ? <button className={`script-btn${editingCard ? " is-on" : ""}`} onClick={() => setEditingCard((on) => !on)} type="button">{editingCard ? <><X aria-hidden="true" size={13} /> Close editor</> : <><PenLine aria-hidden="true" size={13} /> Edit card</>}</button> : null}
                  </div>
                </header>

                {(incoming.get(current.node.id)?.length ?? 0) > 0 ? (
                  <p className="script-card-from">
                    <CornerDownRight aria-hidden="true" size={12} /> Reached from{" "}
                    {incoming.get(current.node.id)!.map((edge, index) => {
                      const from = nodesById.get(edge.fromNodeId);
                      return from ? <span key={edge.id}>{index ? ", " : ""}<button className="script-link" onClick={() => go(from.id)} type="button">{from.title}</button>{edge.label ? <> (“{edge.label}”)</> : null}</span> : null;
                    })}
                  </p>
                ) : null}

                {editingCard ? (
                  <section className="script-section script-editor">
                    <NodeEditor arcId={board.arc.id} arcRefs={arcRefs} canReview={canReview} libraryEntries={board.libraryEntries} locked={locked} node={current.node} viewerUserId={viewerUserId} />
                  </section>
                ) : (
                  <section className="script-section script-prose">
                    {current.node.summary ? <p className="script-summary">{current.node.summary}</p> : null}
                    {current.node.body ? <div className="story-prose"><StoryProse body={current.node.body} resolve={resolveProse} /></div> : <p className="story-inspector-hint">No scene text yet{canEdit ? " — open the editor to write it." : "."}</p>}
                    {current.node.completion ? <p className="script-detail"><b>Step completes when</b> {current.node.completion}</p> : null}
                    {current.node.effects.length || current.node.rewards.length || current.node.references.length ? (
                      <button className="script-link script-details-toggle" onClick={() => setShowDetails((on) => !on)} type="button">{showDetails ? <ChevronDown aria-hidden="true" size={12} /> : <ChevronRight aria-hidden="true" size={12} />} Effects, rewards and references</button>
                    ) : null}
                    {showDetails ? (
                      <div className="script-details">
                        {current.node.effects.length ? <p><b>Effects</b> {current.node.effects.join(" · ")}</p> : null}
                        {current.node.rewards.length ? <p><b>Rewards</b> {current.node.rewards.join(" · ")}</p> : null}
                        {current.node.references.length ? <p><b>References</b> {current.node.references.map((reference, index) => <span key={reference.id}>{index ? " · " : ""}<Link href={`/codex/bible/${reference.slug}`}>{reference.title}</Link></span>)}</p> : null}
                      </div>
                    ) : null}
                  </section>
                )}

                <StoryLinesEditor arcSlug={board.arc.slug} canEdit={canEdit} characters={characters} hasBody={Boolean(current.node.body)} key={`lines-${current.node.id}`} lines={current.node.lines} nodeId={current.node.id} nodeKey={current.node.key} nodeKind={current.node.kind} />

                <section className="script-section script-choices">
                  <header className="story-lines-head">
                    <div>
                      <p className="eyebrow">{current.node.kind === "CHOICE" ? "Choices" : "Leads to"} · {outgoing.get(current.node.id)?.length ?? 0}</p>
                      <p className="story-inspector-hint">{current.node.kind === "CHOICE" ? "Each labelled branch is an option the player picks; voiced ones are spoken aloud (exported as opt-<key>)." : "Where the story goes from here. A labelled branch is a choice; an unlabelled one just continues."}</p>
                    </div>
                    {canEdit ? <button className="script-btn" onClick={() => setAddingBranch((on) => !on)} type="button">{addingBranch ? <><X aria-hidden="true" size={13} /> Cancel</> : <><GitBranch aria-hidden="true" size={13} /> Add branch</>}</button> : null}
                  </header>
                  {addingBranch ? (
                    <form action={addBranch} className="story-form script-branch-form">
                      <input name="fromNodeId" type="hidden" value={current.node.id} />
                      <label>Choice label<input maxLength={200} name="label" placeholder="What the player chooses. Leave blank for a continuation." type="text" /></label>
                      <label>Leads to<select defaultValue="" name="targetNodeId">
                        <option value="">— a new card, named below —</option>
                        {board.nodes.filter((node) => node.id !== current.node.id).map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                      </select></label>
                      <label>New card title<input maxLength={160} name="newTitle" placeholder="Only used when the branch leads to a new card." type="text" /></label>
                      <label>New card kind<select defaultValue="SCENE" name="newKind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
                      <button className="save-server" type="submit">Draw the branch</button>
                    </form>
                  ) : null}
                  {(outgoing.get(current.node.id)?.length ?? 0) === 0 && !addingBranch ? <p className="story-inspector-hint">{current.node.kind === "ENDING" ? (current.node.continuesIn ? <>The story continues in <Link href={`/codex/arc/${current.node.continuesIn.slug}`}>{current.node.continuesIn.title}</Link>.</> : "The story ends here.") : "Nothing leads out of this card yet."}</p> : null}
                  <ol className="script-choice-list">
                    {(outgoing.get(current.node.id) ?? []).map((edge, index) => {
                      const target = nodesById.get(edge.toNodeId);
                      const editing = editingEdgeId === edge.id;
                      return (
                        <li className={`script-choice${editing ? " is-editing" : ""}`} key={edge.id}>
                          <div className="script-choice-row">
                            <span className="script-choice-index">{index + 1}</span>
                            <span className="script-choice-label">{edge.label ? <>“{edge.label}”</> : <i>continues</i>}{edge.voiced ? <em title="Spoken aloud by the player"><Volume2 aria-hidden="true" size={11} /> voiced</em> : null}{edge.condition ? <small>if {edge.condition}</small> : null}</span>
                            <span className="script-choice-arrow">→</span>
                            {target ? <button className="script-link script-choice-target" onClick={() => go(target.id)} type="button">{target.title}</button> : <span className="script-choice-target">a card outside this board</span>}
                            {canEdit ? <button className="script-btn" onClick={() => setEditingEdgeId(editing ? null : edge.id)} type="button">{editing ? "Close" : "Edit"}</button> : null}
                          </div>
                          {editing ? (
                            <div className="script-edge-editor">
                              <EdgeEditor canReview={canReview} edge={edge} flags={board.libraryEntries.filter((entry) => entry.kind === "FLAG")} fromTitle={current.node.title} locked={locked} nodes={board.nodes.map((node) => ({ id: node.id, title: node.title }))} toTitle={target?.title ?? "?"} />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              </article>
            )}
            <StoryWarden arcId={board.arc.id} available={assistantAvailable} nodeId={current?.node.id ?? null} />
          </main>
        </div>
      )}
    </div>
  );
}
