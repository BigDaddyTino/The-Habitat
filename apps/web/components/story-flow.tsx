"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useMemo, useRef, useState, useTransition, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { CornerDownRight, Flag, GitBranch, PenLine, RotateCcw, Settings2, Sparkles, Undo2, X } from "lucide-react";
import { canonicalStoryEntryRouteSlug, persistedStoryEntrySlug, storyEndingKindLabels, storyNodeKinds, storyNodeKindLabels, type StoryNodeKind } from "@habitat/shared";
import { addBranch, createEdge, createNode } from "@/app/codex/actions";
import { EdgeEditor, NodeEditor, type StoryArcRef } from "@/components/story-workbench";
import { StoryFlowLock } from "@/components/story-flow-lock";
import { StoryWarden } from "@/components/story-warden";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryProse, type ProseResolver } from "@/components/story-prose";
import type { StoryBoard, StoryBoardEdge, StoryBoardNode } from "@/lib/story-codex";

/**
 * THE arc page: one top-down story tree that is read, walked, and edited in
 * the same place. The old two-view split (a drag-anywhere whiteboard plus a
 * separate reader) confused everyone including the owner, so it is gone —
 * layout is computed, never dragged, and every click does something visible:
 * green cards advance the walk, any other card opens in the panel.
 */
type FlowStep = { nodeId: string; via: string | null };

type FlowNodeState = "current" | "offered" | "walked" | "peek" | "dim";

type FlowNodeData = {
  node: StoryBoardNode;
  state: FlowNodeState;
  /** 1-based step number when this card is on the walked path. */
  walkIndex: number | null;
  /** Every card on a locked flow wears the frost. */
  frozen: boolean;
};
type FlowNode = Node<FlowNodeData, "flow">;

function FlowNodeCard({ data }: NodeProps<FlowNode>) {
  const { node, state, walkIndex, frozen } = data;
  return (
    <article className={`flow-card is-${state} kind-${node.kind.toLowerCase()}${node.kind === "ENDING" && node.endingKind ? ` ending-${node.endingKind.toLowerCase()}` : ""}${frozen ? " is-frozen" : ""}`}>
      <Handle position={Position.Top} type="target" />
      {walkIndex !== null ? <span className="flow-step-badge">{walkIndex}</span> : null}
      <span className="flow-card-kind">{storyNodeKindLabels[node.kind]}{node.status !== "CANON" ? ` · ${node.status.toLowerCase()}` : ""}</span>
      <h3>{node.title}</h3>
      {node.kind === "ENDING" && node.endingKind ? <span className={`flow-ending-tag is-${node.endingKind.toLowerCase()}`}>{storyEndingKindLabels[node.endingKind]}</span> : null}
      <Handle position={Position.Bottom} type="source" />
    </article>
  );
}

const nodeTypes = { flow: FlowNodeCard };

/**
 * What each kind of card is worth at a glance: gold opens a quest, cool grey
 * is somebody talking, green is a decision, violet is the story checking
 * something, crimson is an ending that went badly.
 *
 * The same values live as CSS custom properties on `.flow-card`. They are
 * duplicated here rather than read back out of the stylesheet because the
 * minimap paints to a canvas and has no element to read a computed style
 * from — the legend below renders from this map, so a colour that drifts
 * shows up in the legend immediately.
 */
const kindColors: Record<string, string> = {
  QUEST_START: "#c6974c",
  QUEST_STEP: "#b0985c",
  SCENE: "#9aa79b",
  BEAT: "#77837a",
  DIALOGUE: "#8fa3b5",
  CHOICE: "#8fbf8a",
  CONDITION: "#a58fd0",
  ENDING: "#c6974c",
};

const endingColors: Record<string, string> = { SUCCESS: "#8fbf8a", FAILURE: "#c05b5b", NEUTRAL: "#c6974c" };

function flowKindColor(node: StoryBoardNode) {
  if (node.kind === "ENDING" && node.endingKind) return endingColors[node.endingKind] ?? kindColors.ENDING;
  return kindColors[node.kind] ?? "#4b554a";
}

const ROW_GAP = 185;
const CARD_GAP = 272;

/**
 * Lays the arc out as a top-down story tree — openings at the top, endings at
 * the bottom, the way a story reads. Longest-path layering with cycle
 * back-edges removed, then one barycenter pass so branches stay under their
 * parents. Hand-dragged canvas positions are deliberately ignored.
 */
function layoutFlow(nodes: StoryBoardNode[], edges: StoryBoardEdge[]) {
  const ids = new Set(nodes.map((node) => node.id));
  const outgoing = new Map<string, string[]>();
  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    if (!ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId)) continue;
    const list = outgoing.get(edge.fromNodeId);
    if (list) list.push(edge.toNodeId);
    else outgoing.set(edge.fromNodeId, [edge.toNodeId]);
    hasIncoming.add(edge.toNodeId);
  }

  const roots = nodes.filter((node) => !hasIncoming.has(node.id)).map((node) => node.id);
  const color = new Map<string, 1 | 2>();
  const forward = new Map<string, string[]>();
  const visit = (root: string) => {
    const stack: Array<{ id: string; next: number }> = [{ id: root, next: 0 }];
    color.set(root, 1);
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const children = outgoing.get(frame.id) ?? [];
      if (frame.next >= children.length) {
        color.set(frame.id, 2);
        stack.pop();
        continue;
      }
      const child = children[frame.next++];
      if (color.get(child) === 1) continue; // back edge — a loop cannot layer forever
      const list = forward.get(frame.id);
      if (list) list.push(child);
      else forward.set(frame.id, [child]);
      if (!color.has(child)) {
        color.set(child, 1);
        stack.push({ id: child, next: 0 });
      }
    }
  };
  for (const root of roots) visit(root);
  for (const node of nodes) if (!color.has(node.id)) visit(node.id);

  const indegree = new Map<string, number>();
  for (const [, children] of forward) for (const child of children) indegree.set(child, (indegree.get(child) ?? 0) + 1);
  const depth = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const child of forward.get(id) ?? []) {
      depth.set(child, Math.max(depth.get(child) ?? 0, (depth.get(id) ?? 0) + 1));
      const remaining = (indegree.get(child) ?? 0) - 1;
      indegree.set(child, remaining);
      if (remaining === 0) queue.push(child);
    }
  }

  const parents = new Map<string, string[]>();
  for (const [from, children] of forward) {
    for (const child of children) {
      const list = parents.get(child);
      if (list) list.push(from);
      else parents.set(child, [from]);
    }
  }

  const rows = new Map<number, string[]>();
  for (const node of nodes) {
    const row = depth.get(node.id) ?? 0;
    const list = rows.get(row);
    if (list) list.push(node.id);
    else rows.set(row, [node.id]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const column = new Map<string, number>();
  for (const row of [...rows.keys()].sort((a, b) => a - b)) {
    const members = rows.get(row) as string[];
    const keyed = members.map((id, index) => {
      const above = (parents.get(id) ?? []).map((parent) => column.get(parent) ?? 0);
      return { id, sort: above.length > 0 ? above.reduce((sum, value) => sum + value, 0) / above.length : index };
    });
    keyed.sort((a, b) => a.sort - b.sort);
    keyed.forEach((entry, index) => {
      column.set(entry.id, index);
      positions.set(entry.id, { x: (index - (keyed.length - 1) / 2) * CARD_GAP, y: row * ROW_GAP });
    });
  }
  return positions;
}

export function StoryFlow({ board, canReview, viewerUserId, arcRefs, assistantAvailable, initialNodeId = null }: {
  board: StoryBoard;
  canReview: boolean;
  viewerUserId: string;
  arcRefs: StoryArcRef[];
  assistantAvailable: boolean;
  initialNodeId?: string | null;
}) {
  // The whole canvas reads the freeze from one place. A locked flow still
  // reads and walks exactly as before — what it loses is every way to change
  // anything, so a locked story stays as browsable as an open one.
  const locked = board.arc.locked;
  // Scene text cites the bible constantly; resolve those to real links.
  const resolveProse: ProseResolver = (slug) => {
    const entry = board.libraryEntries.find((candidate) => persistedStoryEntrySlug(candidate.slug) === persistedStoryEntrySlug(slug));
    if (entry) return { title: entry.title, href: `/codex/bible/${canonicalStoryEntryRouteSlug(slug)}` };
    const arc = arcRefs.find((candidate) => candidate.slug === slug);
    return arc ? { title: arc.title, href: `/codex/arc/${slug}` } : null;
  };
  const flowRef = useRef<ReactFlowInstance<FlowNode, Edge> | null>(null);
  const [, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const nodesById = useMemo(() => new Map(board.nodes.map((node) => [node.id, node])), [board.nodes]);
  const nodesByKey = useMemo(() => new Map(board.nodes.map((node) => [node.key, node])), [board.nodes]);
  const positions = useMemo(() => layoutFlow(board.nodes, board.edges), [board.nodes, board.edges]);

  const entryNodes = useMemo(
    () => board.entryNodeKeys.map((key) => nodesByKey.get(key)).filter((node): node is StoryBoardNode => Boolean(node)),
    [board.entryNodeKeys, nodesByKey],
  );

  // The walk starts at the single opening on its own; several openings make
  // "where do we begin" the first choice.
  const [path, setPath] = useState<FlowStep[]>(() =>
    entryNodes.length === 1 ? [{ nodeId: entryNodes[0].id, via: null }] : [],
  );
  // Selection is for reading and editing; the walk is for following the
  // story. Clicking any card selects it — nothing on the tree is inert.
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNodeId && board.nodes.some((node) => node.id === initialNodeId) ? initialNodeId : null,
  );

  // A ?node= deep link must land even when the arc page is already mounted —
  // the threads ledger links "set at" and "answered at" into the same arc, and
  // search-param navigation preserves client state, so the lazy initializer
  // above only covers the cold mount. Adjust-during-render, per house rule.
  const [lastDeepLink, setLastDeepLink] = useState(initialNodeId);
  if (initialNodeId !== lastDeepLink) {
    setLastDeepLink(initialNodeId);
    if (initialNodeId && board.nodes.some((node) => node.id === initialNodeId)) setSelectedId(initialNodeId);
  }

  // Writing tools fold away per card; reset during render when the panel
  // moves to a different card so an open editor never carries over.
  const [editingCard, setEditingCard] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [toolsIdentity, setToolsIdentity] = useState<string>("");

  const current = path.length > 0 ? nodesById.get(path[path.length - 1].nodeId) ?? null : null;
  const shown = (selectedId ? nodesById.get(selectedId) : null) ?? current;
  const peeking = shown !== null && shown.id !== current?.id;

  if ((shown?.id ?? "") !== toolsIdentity) {
    setToolsIdentity(shown?.id ?? "");
    setEditingCard(false);
    setAddingBranch(false);
    setEditingEdgeId(null);
  }

  const offeredEdges = useMemo(
    () => (current ? board.edges.filter((edge) => edge.fromNodeId === current.id).sort((a, b) => a.position - b.position) : []),
    [board.edges, current],
  );
  const shownEdges = useMemo(
    () => (shown ? board.edges.filter((edge) => edge.fromNodeId === shown.id).sort((a, b) => a.position - b.position) : []),
    [board.edges, shown],
  );

  const walkIndexByNode = useMemo(() => {
    const map = new Map<string, number>();
    path.forEach((step, index) => {
      if (!map.has(step.nodeId)) map.set(step.nodeId, index + 1);
    });
    return map;
  }, [path]);
  const walkedEdgeIds = useMemo(() => new Set(path.map((step) => step.via).filter((via): via is string => Boolean(via))), [path]);
  const latestEdgeId = path.length > 0 ? path[path.length - 1].via : null;
  const offeredNodeIds = useMemo(() => {
    if (!current) return new Set(entryNodes.map((node) => node.id));
    return new Set(offeredEdges.map((edge) => edge.toNodeId));
  }, [current, entryNodes, offeredEdges]);

  const advance = useCallback((edge: StoryBoardEdge) => {
    setPath((previous) => [...previous, { nodeId: edge.toNodeId, via: edge.id }]);
    setSelectedId(null);
  }, []);
  const readFrom = useCallback((nodeId: string) => {
    setPath([{ nodeId, via: null }]);
    setSelectedId(null);
  }, []);
  // Rewinds take the step's index, not its node id: loops are legal, so one
  // node can appear twice in a walk, and a findIndex by id always truncated
  // at the FIRST visit — discarding more of the walk than the writer chose.
  const rewindTo = useCallback((stepIndex: number) => {
    setPath((previous) => (stepIndex >= 0 && stepIndex < previous.length ? previous.slice(0, stepIndex + 1) : previous));
    setSelectedId(null);
  }, []);
  // From a peeked card the writer means "back to when I was HERE last" — the
  // most recent visit, which on a looped walk is not the first one.
  const rewindToNode = useCallback((nodeId: string) => {
    setPath((previous) => {
      for (let index = previous.length - 1; index >= 0; index -= 1) {
        if (previous[index].nodeId === nodeId) return previous.slice(0, index + 1);
      }
      return previous;
    });
    setSelectedId(null);
  }, []);
  const reset = useCallback(() => {
    setPath(entryNodes.length === 1 ? [{ nodeId: entryNodes[0].id, via: null }] : []);
    setSelectedId(null);
  }, [entryNodes]);

  // The camera follows whatever the panel is showing.
  const centerOn = useCallback((nodeId: string | null) => {
    if (!nodeId) return;
    const position = positions.get(nodeId);
    if (!position) return;
    flowRef.current?.setCenter(position.x + 120, position.y + 46, { zoom: 0.95, duration: 500 });
  }, [positions]);
  useEffect(() => centerOn(shown?.id ?? null), [shown, centerOn]);

  const flowNodes: FlowNode[] = useMemo(
    () =>
      board.nodes.map((node) => {
        const state: FlowNodeState = current?.id === node.id
          ? "current"
          : peeking && shown?.id === node.id
            ? "peek"
            : offeredNodeIds.has(node.id)
              ? "offered"
              : walkIndexByNode.has(node.id)
                ? "walked"
                : "dim";
        return {
          id: node.id,
          type: "flow" as const,
          position: positions.get(node.id) ?? { x: 0, y: 0 },
          data: { node, state, walkIndex: walkIndexByNode.get(node.id) ?? null, frozen: locked !== null },
          draggable: false,
        };
      }),
    [board.nodes, current, shown, peeking, offeredNodeIds, walkIndexByNode, positions, locked],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      board.edges.map((edge) => {
        const walked = walkedEdgeIds.has(edge.id);
        const offered = current !== null && edge.fromNodeId === current.id;
        return {
          id: edge.id,
          source: edge.fromNodeId,
          target: edge.toNodeId,
          label: edge.label ?? undefined,
          className: `flow-edge${walked ? " is-walked" : ""}${edge.id === latestEdgeId ? " is-latest" : ""}${offered ? " is-offered" : ""}${!walked && !offered ? " is-dim" : ""}`,
          markerEnd: { type: MarkerType.ArrowClosed },
        };
      }),
    [board.edges, walkedEdgeIds, latestEdgeId, current],
  );

  const onNodeClick = useCallback(
    (_event: unknown, flowNode: FlowNode) => {
      const node = nodesById.get(flowNode.id);
      if (!node) return;
      // A green card is the story asking a question — clicking it answers.
      if (path.length === 0 && offeredNodeIds.has(node.id)) {
        readFrom(node.id);
        return;
      }
      if (current && offeredNodeIds.has(node.id) && !walkIndexByNode.has(node.id)) {
        const routes = offeredEdges.filter((edge) => edge.toNodeId === node.id);
        if (routes.length === 1) {
          advance(routes[0]);
          return;
        }
      }
      // Everything else opens in the panel. Clicking where you already are
      // just clears any peek.
      setSelectedId(node.id === current?.id ? null : node.id);
    },
    [nodesById, path.length, current, offeredNodeIds, walkIndexByNode, offeredEdges, readFrom, advance],
  );

  // Dragging from the bottom handle of one card to the top of another still
  // draws a branch — the tree re-lays itself around the new connection.
  const onConnect = useCallback((connection: Connection) => {
    if (locked || !connection.source || !connection.target) return;
    setActionError(null);
    startTransition(() => {
      void createEdge({ fromNodeId: connection.source as string, toNodeId: connection.target as string }).catch((cause: unknown) => {
        setActionError(cause instanceof Error ? cause.message : "That branch could not be drawn.");
      });
    });
  }, [locked]);

  const isEnded = current !== null && (current.kind === "ENDING" || offeredEdges.length === 0);
  const nodeRefs = board.nodes.map((node) => ({ id: node.id, title: node.title }));

  return (
    <div className="story-flow">
      <StoryLiveSync arcId={board.arc.id} nodeId={shown?.id ?? null} />
      <div className="flow-canvas">
        {actionError ? <p className="story-canvas-error" role="alert">{actionError}</p> : null}
        <ReactFlow
          deleteKeyCode={null}
          edges={flowEdges}
          fitView
          fitViewOptions={{ maxZoom: 0.9, padding: 0.15 }}
          minZoom={0.12}
          nodesConnectable={!locked}
          nodesDraggable={false}
          nodeTypes={nodeTypes}
          nodes={flowNodes}
          onConnect={onConnect}
          onInit={(instance) => {
            flowRef.current = instance;
            // A ?node= deep link selects before the canvas exists; the mount
            // effect ran against a null ref, so the first centering happens
            // here or not at all.
            centerOn(shown?.id ?? null);
          }}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedId(null)}
          proOptions={{ hideAttribution: false }}
        >
          <Background color="#3a4239" gap={22} />
          {board.nodes.length >= 6 ? <MiniMap className="story-minimap" maskColor="rgba(10, 14, 11, .72)" nodeColor={(node) => {
            const data = node.data as FlowNodeData;
            // The minimap ices over with the board, or a locked flow would
            // still read as brass and green in the corner.
            if (data.frozen) return data.state === "dim" ? "#2b3a45" : "#7ec4f0";
            if (data.state === "walked" || data.state === "current") return "#c6974c";
            if (data.state === "offered") return "#8fbf8a";
            // Everything the walk has no opinion about is tinted by what kind
            // of card it is, so the minimap reads as the shape of the story
            // rather than as one grey mass with a brass thread through it.
            return flowKindColor(data.node);
          }} pannable zoomable /> : null}
        </ReactFlow>
        <div className="flow-guide">
          <span className="is-current">You are here</span>
          <span className="is-choice">Green — your next choices</span>
          <span>Click any card to read or edit it</span>
          <span className="flow-kind-legend">
            {(Object.keys(kindColors) as StoryNodeKind[]).map((kind) => (
              <i key={kind} style={{ "--kind-swatch": kindColors[kind] } as CSSProperties}>{storyNodeKindLabels[kind]}</i>
            ))}
          </span>
        </div>
        <StoryFlowLock arcId={board.arc.id} canReview={canReview} locked={locked} />
        <StoryWarden arcId={board.arc.id} available={assistantAvailable} nodeId={shown?.id ?? null} />
      </div>

      <aside aria-label="Story reader" className="flow-panel">
        {board.nodes.length === 0 ? (
          <>
            <p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> A blank page</p>
            <h2>{board.arc.title}</h2>
            {board.arc.summary ? <p className="flow-panel-summary">{board.arc.summary}</p> : null}
            {locked ? <p className="story-inspector-hint">This flow is locked and has no cards yet. An admin can unlock it from the badge on the canvas.</p> : <form action={createNode} className="story-form">
              <p className="eyebrow">The first card</p>
              <input name="arcId" type="hidden" value={board.arc.id} />
              <label>Kind<select defaultValue="SCENE" name="kind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
              <label>Title<input maxLength={160} name="title" placeholder="Where does it begin?" required type="text" /></label>
              <label>Summary<textarea maxLength={500} name="summary" placeholder="One line on what happens here." rows={3} /></label>
              <button className="save-server" type="submit">Add the first card</button>
            </form>}
          </>
        ) : shown === null ? (
          <>
            <p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> Follow the story</p>
            <h2>{board.arc.title}</h2>
            {board.arc.summary ? <p className="flow-panel-summary">{board.arc.summary}</p> : null}
            {entryNodes.length === 0 ? <p className="story-inspector-hint">This arc has no opening yet — nothing leads in. Click any card to read it.</p> : (
              <div className="flow-choices">
                <p className="eyebrow">Where it begins</p>
                {entryNodes.map((node) => (
                  <button className="flow-choice" key={node.id} onClick={() => readFrom(node.id)} type="button">
                    <CornerDownRight aria-hidden="true" size={13} />
                    <span><strong>{node.title}</strong><small>{storyNodeKindLabels[node.kind]}</small></span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flow-panel-head">
              <p className="eyebrow">
                {peeking ? "Elsewhere on the tree" : `Step ${path.length}`} · {storyNodeKindLabels[shown.kind]}{shown.speaker ? ` · ${shown.speaker.title}` : ""}
              </p>
              <button className="icon-action" onClick={reset} title="Start the walk over" type="button"><RotateCcw aria-hidden="true" size={14} /><span className="sr-only">Start the walk over</span></button>
            </div>
            <h2>{shown.title}</h2>
            {shown.summary ? <p className="flow-panel-summary">{shown.summary}</p> : null}

            {peeking ? (
              <div className="flow-peek-actions">
                {walkIndexByNode.has(shown.id) ? (
                  <button className="flow-tool" onClick={() => rewindToNode(shown.id)} type="button"><Undo2 aria-hidden="true" size={12} /> Rewind the walk to here</button>
                ) : (
                  <button className="flow-tool" onClick={() => readFrom(shown.id)} type="button"><CornerDownRight aria-hidden="true" size={12} /> Read the story from here</button>
                )}
                <button className="flow-tool" onClick={() => setSelectedId(null)} type="button"><X aria-hidden="true" size={12} /> Back to where you were</button>
              </div>
            ) : null}

            {locked ? null : <div className="flow-tools">
              <button className={`flow-tool${editingCard ? " is-open" : ""}`} onClick={() => { setEditingCard((open) => !open); setAddingBranch(false); setEditingEdgeId(null); }} type="button"><PenLine aria-hidden="true" size={12} /> {editingCard ? "Close editor" : "Edit this card"}</button>
              <button className={`flow-tool${addingBranch ? " is-open" : ""}`} onClick={() => { setAddingBranch((open) => !open); setEditingCard(false); setEditingEdgeId(null); }} type="button"><GitBranch aria-hidden="true" size={12} /> Add a branch</button>
            </div>}

            {editingCard ? (
              <div className="flow-editor">
                <NodeEditor arcId={board.arc.id} arcRefs={arcRefs} canReview={canReview} key={shown.id} libraryEntries={board.libraryEntries} locked={locked} node={shown} viewerUserId={viewerUserId} />
              </div>
            ) : null}

            {addingBranch ? (
              <form action={addBranch} className="story-form flow-editor">
                <p className="eyebrow">New branch from this card</p>
                <input name="fromNodeId" type="hidden" value={shown.id} />
                <label>Choice label<input maxLength={200} name="label" placeholder="What the player chooses. Leave blank for a continuation." type="text" /></label>
                <label>Leads to<select defaultValue="" name="targetNodeId">
                  <option value="">— a new card, named below —</option>
                  {board.nodes.filter((node) => node.id !== shown.id).map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                </select></label>
                <label>New card title<input maxLength={160} name="newTitle" placeholder="Only used when the branch leads to a new card." type="text" /></label>
                <label>New card kind<select defaultValue="SCENE" name="newKind">{storyNodeKinds.map((kind) => <option key={kind} value={kind}>{storyNodeKindLabels[kind]}</option>)}</select></label>
                <button className="save-server" type="submit">Draw the branch</button>
              </form>
            ) : null}

            {!editingCard ? <>
              {shown.body ? <div className="flow-panel-body story-prose"><StoryProse body={shown.body} resolve={resolveProse} /></div> : <p className="story-inspector-hint">No scene text yet — this card is still being written.</p>}
              {shown.effects.length > 0 ? <div className="flow-panel-effects"><p className="eyebrow">Effects</p><ul>{shown.effects.map((effect, index) => <li key={index}>{effect}</li>)}</ul></div> : null}
              {shown.rewards.length > 0 ? <div className="flow-panel-effects"><p className="eyebrow">Rewards</p><ul>{shown.rewards.map((reward, index) => <li key={index}>{reward}</li>)}</ul></div> : null}
            </> : null}

            {peeking ? (
              shownEdges.length > 0 ? (
                <div className="flow-choices">
                  <p className="eyebrow">From here the story can go to</p>
                  {shownEdges.map((edge) => {
                    const target = nodesById.get(edge.toNodeId);
                    return (
                      <div className="flow-choice-row" key={edge.id}>
                        <button className="flow-choice" onClick={() => setSelectedId(edge.toNodeId)} type="button">
                          <CornerDownRight aria-hidden="true" size={13} />
                          <span><strong>{edge.label ?? "Continue"}</strong><small>{target ? `→ ${target.title}` : ""}</small></span>
                        </button>
                        {locked ? null : <button aria-label={editingEdgeId === edge.id ? "Close the branch editor" : `Edit the branch "${edge.label ?? "Continue"}"`} className="icon-action flow-choice-edit" onClick={() => { setEditingEdgeId((open) => (open === edge.id ? null : edge.id)); setEditingCard(false); setAddingBranch(false); }} type="button">
                          {editingEdgeId === edge.id ? <X aria-hidden="true" size={13} /> : <Settings2 aria-hidden="true" size={13} />}
                        </button>}
                        {editingEdgeId === edge.id ? (
                          <div className="flow-editor flow-edge-editor">
                            <EdgeEditor canReview={canReview} edge={edge} flags={board.libraryEntries} fromTitle={shown.title} locked={locked} nodes={nodeRefs} toTitle={target?.title ?? "Unknown card"} />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null
            ) : isEnded ? (
              <div className={`flow-ending${current?.endingKind ? ` is-${current.endingKind.toLowerCase()}` : ""}`}>
                <p><Flag aria-hidden="true" size={14} /> {current?.kind === "ENDING" ? `The end of this road${current.endingKind ? ` — ${storyEndingKindLabels[current.endingKind].toLowerCase()}` : ""}.` : "This branch continues nowhere yet."}</p>
                <div>
                  {current?.continuesIn ? <Link className="save-server flow-continue" href={`/codex/arc/${current.continuesIn.slug}`}>Continue into {current.continuesIn.title}</Link> : null}
                  <button className="save-server" onClick={reset} type="button">Walk it again</button>
                  <Link className="flow-ending-link" href="/codex">All arcs</Link>
                </div>
              </div>
            ) : (
              <div className="flow-choices">
                <p className="eyebrow">{offeredEdges.length === 1 && !offeredEdges[0].label ? "The story continues" : "The choice is yours"}</p>
                {offeredEdges.map((edge) => {
                  const target = nodesById.get(edge.toNodeId);
                  return (
                    <div className="flow-choice-row" key={edge.id}>
                      <button className="flow-choice" onClick={() => advance(edge)} type="button">
                        <CornerDownRight aria-hidden="true" size={13} />
                        <span>
                          <strong>{edge.label ?? "Continue"}</strong>
                          <small>{target ? `→ ${target.title}` : ""}{edge.condition ? ` · if: ${edge.condition}` : ""}</small>
                        </span>
                      </button>
                      {locked ? null : <button aria-label={editingEdgeId === edge.id ? "Close the branch editor" : `Edit the branch "${edge.label ?? "Continue"}"`} className="icon-action flow-choice-edit" onClick={() => { setEditingEdgeId((open) => (open === edge.id ? null : edge.id)); setEditingCard(false); setAddingBranch(false); }} type="button">
                        {editingEdgeId === edge.id ? <X aria-hidden="true" size={13} /> : <Settings2 aria-hidden="true" size={13} />}
                      </button>}
                      {editingEdgeId === edge.id ? (
                        <div className="flow-editor flow-edge-editor">
                          <EdgeEditor canReview={canReview} edge={edge} flags={board.libraryEntries} fromTitle={shown.title} locked={locked} nodes={nodeRefs} toTitle={target?.title ?? "Unknown card"} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {!peeking && path.length > 1 ? (
              <div className="flow-trail">
                <p className="eyebrow">The road so far</p>
                <ol>
                  {path.map((step, index) => {
                    const node = nodesById.get(step.nodeId);
                    if (!node) return null;
                    return <li key={`${step.nodeId}-${index}`}><button onClick={() => rewindTo(index)} type="button">{node.title}</button></li>;
                  })}
                </ol>
              </div>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}
