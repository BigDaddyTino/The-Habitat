"use client";

import "@xyflow/react/dist/style.css";
import { Background, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { ArrowRight, GitMerge, Lock } from "lucide-react";
import { useMemo } from "react";
import type { CampaignFlowArc, CampaignFlowGraph } from "@/lib/story-codex";

type CampaignNodeData = {
  arc: CampaignFlowArc;
  chapterLabel: string;
  incoming: number;
  outgoing: number;
};
type CampaignNode = Node<CampaignNodeData, "campaign">;

function CampaignArcCard({ data }: NodeProps<CampaignNode>) {
  const { arc, chapterLabel, incoming, outgoing } = data;
  return (
    <Link className={`campaign-flow-card status-${arc.status.toLowerCase()}${arc.locked ? " is-locked" : ""}`} href={`/codex/arc/${arc.slug}`}>
      <Handle className="campaign-flow-handle" position={Position.Top} type="target" />
      <span className="campaign-flow-kicker">
        {incoming > 1 ? <GitMerge aria-hidden="true" size={11} /> : null}
        {arc.locked ? <Lock aria-hidden="true" size={10} /> : null}
        {chapterLabel}
      </span>
      <strong>{arc.title}</strong>
      {arc.summary ? <small>{arc.summary}</small> : null}
      <span className="campaign-flow-open">{arc.nodeCount} scene{arc.nodeCount === 1 ? "" : "s"} <ArrowRight aria-hidden="true" size={12} /></span>
      {outgoing > 1 ? <em>Player choice splits the campaign here</em> : null}
      {incoming > 1 ? <em>Both roads rejoin here</em> : null}
      <Handle className="campaign-flow-handle" position={Position.Bottom} type="source" />
    </Link>
  );
}

const nodeTypes = { campaign: CampaignArcCard };
const X_GAP = 360;
const Y_GAP = 260;

function layoutCampaign(graph: CampaignFlowGraph): { nodes: CampaignNode[]; edges: Edge[] } {
  const known = new Set(graph.arcs.map((arc) => arc.slug));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const handoff of graph.handoffs) {
    if (!known.has(handoff.fromArcSlug) || !known.has(handoff.toArcSlug)) continue;
    outgoing.set(handoff.fromArcSlug, [...(outgoing.get(handoff.fromArcSlug) ?? []), handoff.toArcSlug]);
    incoming.set(handoff.toArcSlug, [...(incoming.get(handoff.toArcSlug) ?? []), handoff.fromArcSlug]);
  }

  // Longest-path rows make a merge sit below both of its incoming branches.
  // Kahn's queue also gives a cycle a safe failure mode: anything left over
  // simply stays on the opening row rather than sending layout into a loop.
  const indegree = new Map(graph.arcs.map((arc) => [arc.slug, incoming.get(arc.slug)?.length ?? 0]));
  const depth = new Map(graph.arcs.map((arc) => [arc.slug, 0]));
  const queue = graph.arcs.filter((arc) => (indegree.get(arc.slug) ?? 0) === 0).map((arc) => arc.slug);
  while (queue.length > 0) {
    const slug = queue.shift() as string;
    for (const child of outgoing.get(slug) ?? []) {
      depth.set(child, Math.max(depth.get(child) ?? 0, (depth.get(slug) ?? 0) + 1));
      const left = (indegree.get(child) ?? 0) - 1;
      indegree.set(child, left);
      if (left === 0) queue.push(child);
    }
  }

  const rows = new Map<number, CampaignFlowArc[]>();
  for (const arc of graph.arcs) {
    const row = depth.get(arc.slug) ?? 0;
    rows.set(row, [...(rows.get(row) ?? []), arc]);
  }
  for (const arcs of rows.values()) arcs.sort((left, right) => left.position - right.position || left.title.localeCompare(right.title));

  const positioned = new Map<string, { x: number; y: number }>();
  for (const [row, arcs] of [...rows].sort(([left], [right]) => left - right)) {
    arcs.forEach((arc, index) => positioned.set(arc.slug, { x: (index - (arcs.length - 1) / 2) * X_GAP, y: row * Y_GAP }));
  }

  const nodes: CampaignNode[] = graph.arcs.map((arc) => {
    const incomingCount = incoming.get(arc.slug)?.length ?? 0;
    const outgoingCount = outgoing.get(arc.slug)?.length ?? 0;
    const row = depth.get(arc.slug) ?? 0;
    const chapterLabel = row === 0
      ? "Prologue"
      : incomingCount > 1
        ? "Act I · the roads rejoin"
        : outgoingCount === 0
          ? "Campaign chapter"
          : "The chosen road";
    return {
      id: arc.slug,
      type: "campaign",
      position: positioned.get(arc.slug) ?? { x: 0, y: 0 },
      data: { arc, chapterLabel, incoming: incomingCount, outgoing: outgoingCount },
      draggable: false,
      selectable: false,
    };
  });
  const edges: Edge[] = graph.handoffs.map((handoff, index) => ({
    id: `${handoff.fromArcSlug}-${handoff.toArcSlug}-${index}`,
    source: handoff.fromArcSlug,
    target: handoff.toArcSlug,
    label: handoff.fromEndingTitle,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#c6974c" },
    style: { stroke: "#8d713e", strokeWidth: 2 },
    labelStyle: { fill: "#cbb98d", fontSize: 9, fontWeight: 700 },
    labelBgStyle: { fill: "#12170f", fillOpacity: 0.94 },
    labelBgPadding: [6, 4],
  }));
  return { nodes, edges };
}

export function CampaignFlow({ graph }: { graph: CampaignFlowGraph }) {
  const flow = useMemo(() => layoutCampaign(graph), [graph]);
  return (
    <div className="campaign-flow-canvas">
      <ReactFlow
        edges={flow.edges}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        maxZoom={1.15}
        minZoom={0.48}
        nodes={flow.nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        panOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#394138" gap={28} size={1} />
      </ReactFlow>
    </div>
  );
}
