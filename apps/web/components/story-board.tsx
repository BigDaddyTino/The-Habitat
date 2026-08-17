"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type OnNodeDrag,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { GitBranch, Lock, MessageSquare, MousePointer2, TriangleAlert } from "lucide-react";
import { storyNodeKindLabels, type StoryGraphProblem } from "@habitat/shared";
import { createEdge, moveNode } from "@/app/codex/actions";
import type { StoryBoard, StoryBoardNode } from "@/lib/story-codex";
import { StoryWorkbench } from "@/components/story-workbench";
import { StoryWarden } from "@/components/story-warden";
import { StoryLiveSync } from "@/components/story-live-sync";

type StoryNodeData = { node: StoryBoardNode; hasProblem: boolean };
type StoryFlowNode = Node<StoryNodeData, "story">;

function StoryNodeCard({ data, selected }: NodeProps<StoryFlowNode>) {
  const { node, hasProblem } = data;
  return (
    <article className={`story-card status-${node.status.toLowerCase()}${selected ? " is-selected" : ""}`}>
      <Handle position={Position.Left} type="target" />
      <header>
        <span className="story-card-kind">{storyNodeKindLabels[node.kind]}</span>
        {node.status !== "CANON" ? <span className={`story-pill status-${node.status.toLowerCase()}`}>{node.status === "PROPOSED" ? "Proposed" : "Draft"}</span> : null}
      </header>
      <h3>{node.title}</h3>
      {node.summary ? <p>{node.summary}</p> : null}
      <footer>
        {node.lockedBy ? <span className="story-card-lock" title={`${node.lockedBy.name} is writing here`}><Lock aria-hidden="true" size={11} />{node.lockedBy.name}</span> : null}
        {node.commentCount > 0 ? <span title={`${node.commentCount} open note${node.commentCount === 1 ? "" : "s"}`}><MessageSquare aria-hidden="true" size={11} />{node.commentCount}</span> : null}
        {hasProblem ? <span className="story-card-problem" title="This node has a loose end"><TriangleAlert aria-hidden="true" size={11} /></span> : null}
        {node.references.length > 0 ? <span className="story-card-refs">{node.references.length} ref{node.references.length === 1 ? "" : "s"}</span> : null}
      </footer>
      <Handle position={Position.Right} type="source" />
    </article>
  );
}

const nodeTypes = { story: StoryNodeCard };

function toFlowNodes(board: StoryBoard, problems: StoryGraphProblem[]): StoryFlowNode[] {
  const problemKeys = new Set(problems.map((problem) => problem.nodeKey).filter((key): key is string => Boolean(key)));
  return board.nodes.map((node) => ({
    id: node.id,
    type: "story" as const,
    position: { x: node.canvasX, y: node.canvasY },
    data: { node, hasProblem: problemKeys.has(node.key) },
  }));
}

function toFlowEdges(board: StoryBoard): Edge[] {
  return board.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNodeId,
    target: edge.toNodeId,
    label: edge.label ?? undefined,
    className: `story-edge status-${edge.status.toLowerCase()}`,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
}

/**
 * A signature of everything the canvas renders from. Server-pushed refreshes
 * arrive constantly on a busy board, and rebuilding React Flow's state on each
 * one would fight whatever the writer is doing with their pointer — so the
 * canvas only resets when the underlying story actually differs.
 */
function boardSignature(board: StoryBoard) {
  return JSON.stringify([
    board.nodes.map((node) => [node.id, node.title, node.summary, node.kind, node.status, node.canvasX, node.canvasY, node.commentCount, node.references.length, node.lockedBy?.userId ?? null]),
    board.edges.map((edge) => [edge.id, edge.fromNodeId, edge.toNodeId, edge.label, edge.status]),
  ]);
}

export function StoryBoardCanvas({ board, viewerUserId, canReview, assistantAvailable }: { board: StoryBoard; viewerUserId: string; canReview: boolean; assistantAvailable: boolean }) {
  const signature = useMemo(() => boardSignature(board), [board]);
  const nodeSetSignature = useMemo(() => board.nodes.map((node) => node.id).sort().join(":"), [board.nodes]);
  const flowRef = useRef<ReactFlowInstance<StoryFlowNode, Edge> | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<StoryFlowNode>(toFlowNodes(board, board.problems));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(board));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setNodes(toFlowNodes(board, board.problems));
    setEdges(toFlowEdges(board));
    // `signature` is the real dependency: `board` is a fresh object on every
    // server render even when nothing about the story changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, setNodes, setEdges]);

  useEffect(() => {
    if (!flowRef.current || board.nodes.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      void flowRef.current?.fitView({ maxZoom: 1.1, padding: 0.22, duration: 260 });
    });
    return () => window.cancelAnimationFrame(frame);
  // Only frame the canvas when cards are added or removed. Text edits, locks,
  // and live presence updates should never steal the writer's viewport.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeSetSignature]);

  useEffect(() => {
    const closeInspector = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    };
    window.addEventListener("keydown", closeInspector);
    return () => window.removeEventListener("keydown", closeInspector);
  }, []);

  const onNodeDragStop = useCallback<OnNodeDrag<StoryFlowNode>>((_event, node) => {
    startTransition(() => {
      void moveNode({ nodeId: node.id, canvasX: Math.round(node.position.x), canvasY: Math.round(node.position.y) }).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "That move could not be saved.");
      });
    });
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setError(null);
    startTransition(() => {
      void createEdge({ fromNodeId: connection.source as string, toNodeId: connection.target as string }).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "That branch could not be drawn.");
      });
    });
  }, []);

  const selectedNode = board.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = board.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedProblems = selectedNode ? board.problems.filter((problem) => problem.nodeKey === selectedNode.key) : [];
  const fromTitle = selectedEdge ? board.nodes.find((node) => node.id === selectedEdge.fromNodeId)?.title : undefined;
  const toTitle = selectedEdge ? board.nodes.find((node) => node.id === selectedEdge.toNodeId)?.title : undefined;

  const clearSelection = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  return (
    <div className="story-board">
      <StoryLiveSync arcId={board.arc.id} nodeId={selectedNodeId} />
      <div className="story-canvas">
        {error ? <p className="story-canvas-error" role="alert">{error}</p> : null}
        <ReactFlow
          edges={edges}
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.22 }}
          minZoom={0.2}
          nodeTypes={nodeTypes}
          nodes={nodes}
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodesChange={onNodesChange}
          onPaneClick={clearSelection}
          onEdgeClick={(_event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
          onNodeClick={(_event, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
          onInit={(instance) => { flowRef.current = instance; }}
          proOptions={{ hideAttribution: false }}
        >
          <Background color="#3a4239" gap={22} />
          <Controls showInteractive={false} />
          {board.nodes.length >= 4 ? <MiniMap className="story-minimap" maskColor="rgba(10, 14, 11, .72)" nodeColor={(node) => (node.data as StoryNodeData).node.status === "CANON" ? "#8fbf8a" : "#7b93b8"} pannable zoomable /> : null}
          <Panel className="story-canvas-guide" position="top-left">
            <span><MousePointer2 aria-hidden="true" size={11} /> Select to write</span>
            <span><GitBranch aria-hidden="true" size={11} /> Drag handles to branch</span>
            <span className="is-canon">Canon</span><span className="is-proposed">Proposed</span>
          </Panel>
        </ReactFlow>
        {board.nodes.length === 0 ? <div className="story-empty-board"><GitBranch aria-hidden="true" size={24} /><strong>This board is waiting for its first beat.</strong><span>Use the workbench to add a card.</span></div> : null}
        <StoryWarden arcId={board.arc.id} available={assistantAvailable} nodeId={selectedNodeId} />
      </div>
      <StoryWorkbench
        arcId={board.arc.id}
        canReview={canReview}
        edge={selectedEdge}
        fromTitle={fromTitle}
        libraryEntries={board.libraryEntries}
        node={selectedNode}
        onClose={clearSelection}
        problems={selectedProblems}
        toTitle={toTitle}
        viewerUserId={viewerUserId}
      />
    </div>
  );
}
