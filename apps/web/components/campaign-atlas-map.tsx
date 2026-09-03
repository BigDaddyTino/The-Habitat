"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { ArrowRight, Flag, GitBranch, Lock, MapPin, TriangleAlert, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { storyArcCategoryLabels, storyNodeKindLabels, storyStoryStageLabels, type StoryStoryStage } from "@habitat/shared";
import { ATLAS_COL, ATLAS_ROW, ATLAS_SIDE_GAP, layoutSpine, type AtlasArc, type AtlasCompanion, type AtlasNode, type CampaignAtlas } from "@/lib/campaign-atlas";

/**
 * The campaign, drawn once: every mainline card down one spine, every branch
 * between them, and each side board and companion chain hung off the exact
 * card it reaches.
 *
 * The three join kinds are drawn differently because the difference is the
 * whole point of the map. A **handoff** is a solid gold road — structural, and
 * the only kind the game export carries. A **flag** is a dashed amber thread —
 * real and playable and invisible on the old arc-level map. An **implied** join
 * is drawn as a red dashed gap with a warning on it: two consecutive chapters
 * that nothing actually connects. The map is allowed to be unflattering.
 */

type SpineData = { node: AtlasNode; arc: AtlasArc; index: number };
type SideData = { arc: AtlasArc; why: string };
type CompanionData = { companion: AtlasCompanion };
type LaneData = { arc: AtlasArc; index: number; width: number };
type AtlasFlowNode =
  | Node<SpineData, "card">
  | Node<SideData, "side">
  | Node<CompanionData, "chain">
  | Node<LaneData, "lane">;

const stageLabel = (value: string | null) =>
  value && value in storyStoryStageLabels ? storyStoryStageLabels[value as StoryStoryStage] : value;

function SpineCard({ data }: NodeProps<Node<SpineData, "card">>) {
  const { node, arc, index } = data;
  return (
    <Link className={`atlas-card kind-${node.kind.toLowerCase()}${node.entry ? " is-entry" : ""}${node.kind === "ENDING" ? " is-ending" : ""}`} href={`/codex/arc/${arc.slug}?node=${node.id}`}>
      <Handle className="atlas-handle" position={Position.Top} type="target" />
      <span className="atlas-card-kicker">
        <i>{index + 1}</i>
        {storyNodeKindLabels[node.kind]}
        {node.lines > 0 ? <em>{node.lines} line{node.lines === 1 ? "" : "s"}</em> : null}
      </span>
      <strong>{node.title}</strong>
      <span className="atlas-card-arc">{arc.title}</span>
      <Handle className="atlas-handle" position={Position.Bottom} type="source" />
    </Link>
  );
}

function SideBoard({ data }: NodeProps<Node<SideData, "side">>) {
  const { arc, why } = data;
  return (
    <Link className={`atlas-side category-${arc.category.toLowerCase()}${arc.locked ? " is-locked" : ""}`} href={`/codex/arc/${arc.slug}`}>
      <Handle className="atlas-handle" position={Position.Top} type="target" />
      <span className="atlas-side-kicker">
        {arc.locked ? <Lock aria-hidden="true" size={10} /> : <GitBranch aria-hidden="true" size={10} />}
        {storyArcCategoryLabels[arc.category]}
      </span>
      <strong>{arc.title}</strong>
      {arc.summary ? <small>{arc.summary}</small> : null}
      <span className="atlas-side-foot">
        {arc.region ? <i><MapPin aria-hidden="true" size={9} /> {arc.region.title}</i> : null}
        <em>{arc.nodeCount} card{arc.nodeCount === 1 ? "" : "s"} <ArrowRight aria-hidden="true" size={10} /></em>
      </span>
      <span className="atlas-side-why">{why}</span>
    </Link>
  );
}

function CompanionChain({ data }: NodeProps<Node<CompanionData, "chain">>) {
  const { companion } = data;
  return (
    <div className="atlas-chain">
      <Handle className="atlas-handle" position={Position.Top} type="target" />
      <span className="atlas-chain-kicker"><UsersRound aria-hidden="true" size={10} /> Companion chain</span>
      <Link className="atlas-chain-name" href={`/codex/bible/${companion.slug}`}>{companion.title}</Link>
      <ol>
        {companion.missions.map((mission) => (
          <li key={mission.slug}>
            <Link href={`/codex/bible/${mission.slug}`}>
              <i>{mission.order ?? "·"}</i>
              <span>{mission.title}</span>
              {mission.stage ? <em>{stageLabel(mission.stage)}</em> : null}
            </Link>
          </li>
        ))}
      </ol>
      <span className="atlas-chain-foot">Runs on its own clock. The campaign never waits for it.</span>
    </div>
  );
}

/** A chapter's banner across the top of its lane, so the map names itself. */
function LaneHeading({ data }: NodeProps<Node<LaneData, "lane">>) {
  const { arc, index, width } = data;
  return (
    <Link className={`atlas-lane${arc.locked ? " is-locked" : ""}`} href={`/codex/arc/${arc.slug}`} style={{ width }}>
      <span className="atlas-lane-kicker">Chapter {index + 1}{arc.locked ? <Lock aria-hidden="true" size={9} /> : null}</span>
      <strong>{arc.title}</strong>
      <span className="atlas-lane-foot">{arc.nodeCount} card{arc.nodeCount === 1 ? "" : "s"} <ArrowRight aria-hidden="true" size={10} /></span>
    </Link>
  );
}

const nodeTypes = { card: SpineCard, side: SideBoard, chain: CompanionChain, lane: LaneHeading };

const joinStyle = {
  handoff: { stroke: "#c6974c", strokeWidth: 3 },
  flag: { stroke: "#7f9bb8", strokeWidth: 2, strokeDasharray: "7 5" },
  implied: { stroke: "#a2494a", strokeWidth: 2, strokeDasharray: "3 7" },
} as const;

function build(atlas: CampaignAtlas): { nodes: AtlasFlowNode[]; edges: Edge[]; width: number } {
  const { placed, lanes, width, rows } = layoutSpine(atlas);
  const arcOf = new Map(atlas.spine.map((arc) => [arc.slug, arc]));
  const nodeById = new Map(atlas.nodes.map((node) => [node.id, node]));
  const orderInArc = new Map<string, number>();
  for (const arc of atlas.spine) {
    atlas.nodes.filter((node) => node.arcSlug === arc.slug).forEach((node, index) => orderInArc.set(node.id, index));
  }

  const laneNodes: AtlasFlowNode[] = lanes.map((lane) => ({
    id: `lane:${lane.arcSlug}`,
    type: "lane" as const,
    // Explicit geometry so the minimap has something to draw before React
    // Flow has measured the DOM — without it the overview renders empty.
    width: lane.width,
    height: 86,
    position: { x: lane.x, y: -ATLAS_ROW * 1.5 },
    data: { arc: arcOf.get(lane.arcSlug)!, index: atlas.spine.findIndex((arc) => arc.slug === lane.arcSlug), width: lane.width },
    draggable: false,
    selectable: false,
  }));

  const nodes: AtlasFlowNode[] = atlas.nodes.map((node) => ({
    id: node.id,
    type: "card" as const,
    width: 236,
    height: 78,
    position: placed.get(node.id) ?? { x: 0, y: 0 },
    data: { node, arc: arcOf.get(node.arcSlug)!, index: orderInArc.get(node.id) ?? 0 },
    draggable: false,
    selectable: false,
  }));

  // Everything hung beside the lanes goes below them rather than to the side:
  // the lanes already run the full width of the canvas, and a column bolted to
  // the right of six chapters would be off screen at any readable zoom.
  const shelfY = rows * ATLAS_ROW + ATLAS_SIDE_GAP;

  // Side boards, filed at the depth of the mainline card that reaches them.
  const edges: Edge[] = [];
  const sideAnchor = new Map<string, string>();
  for (const join of atlas.joins) {
    const fromSpine = arcOf.has(join.fromArc);
    const toSpine = arcOf.has(join.toArc);
    if (fromSpine && !toSpine && join.fromNode) sideAnchor.set(join.toArc, join.fromNode);
    if (toSpine && !fromSpine && join.toNode) sideAnchor.set(join.fromArc, join.toNode);
  }
  // A side board sits on a shelf under the lane it reaches, so the line up to
  // its anchor is short and stays inside the same part of the map.
  atlas.side.forEach((arc, index) => {
    const anchorId = sideAnchor.get(arc.slug);
    const anchor = anchorId ? placed.get(anchorId) : undefined;
    const why = anchorId
      ? `reaches ${arcOf.get(nodeById.get(anchorId)?.arcSlug ?? "")?.title ?? "the campaign"}`
      : "reached through another board";
    nodes.push({
      id: `side:${arc.slug}`,
      type: "side" as const,
      width: 290,
      height: 160,
      position: { x: anchor ? anchor.x - 20 : index * 330, y: shelfY },
      data: { arc, why },
      draggable: false,
      selectable: false,
    });
  });

  // Companion chains go on their own shelf below that one, under the card
  // that first names them.
  atlas.companions.forEach((companion, index) => {
    const anchor = placed.get(companion.atNode);
    nodes.push({
      id: `chain:${companion.slug}`,
      type: "chain" as const,
      width: 300,
      height: 260,
      position: { x: anchor ? anchor.x - 20 : index * 340, y: shelfY + 320 },
      data: { companion },
      draggable: false,
      selectable: false,
    });
    if (anchor) {
      edges.push({
        id: `chain-edge:${companion.slug}`,
        source: companion.atNode,
        target: `chain:${companion.slug}`,
        label: "first named here",
        style: { stroke: "#8f7fae", strokeWidth: 2, strokeDasharray: "5 5" },
        labelStyle: { fill: "#c2b3d8", fontSize: 9, fontWeight: 700 },
        labelBgStyle: { fill: "#12170f", fillOpacity: 0.94 },
        labelBgPadding: [6, 4],
      });
    }
  });

  // Branches inside a chapter.
  for (const edge of atlas.edges) {
    edges.push({
      id: `branch:${edge.id}`,
      source: edge.from,
      target: edge.to,
      label: edge.label ?? undefined,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#5d6a58" },
      style: { stroke: "#4d5849", strokeWidth: 1.4 },
      labelStyle: { fill: "#9aa695", fontSize: 8.5 },
      labelBgStyle: { fill: "#12170f", fillOpacity: 0.9 },
      labelBgPadding: [5, 3],
    });
  }

  // The joins between chapters, and out to what spiders off.
  const entryOf = new Map<string, string>();
  for (const node of atlas.nodes) if (node.entry && !entryOf.has(node.arcSlug)) entryOf.set(node.arcSlug, node.id);
  atlas.joins.forEach((join, index) => {
    const source = join.fromNode ?? entryOf.get(join.fromArc) ?? (arcOf.has(join.fromArc) ? undefined : `side:${join.fromArc}`);
    const target = join.toNode ?? entryOf.get(join.toArc) ?? (arcOf.has(join.toArc) ? undefined : `side:${join.toArc}`);
    if (!source || !target || source === target) return;
    edges.push({
      id: `join:${index}`,
      source,
      target,
      label: join.kind === "implied" ? "no join written yet" : join.label,
      markerEnd: { type: MarkerType.ArrowClosed, color: joinStyle[join.kind].stroke },
      style: joinStyle[join.kind],
      zIndex: 4,
      labelStyle: { fill: join.kind === "implied" ? "#dd9a9a" : join.kind === "flag" ? "#bcd0e2" : "#e8cf95", fontSize: 9, fontWeight: 700 },
      labelBgStyle: { fill: "#12170f", fillOpacity: 0.96 },
      labelBgPadding: [7, 4],
    });
  });

  return { nodes: [...laneNodes, ...nodes], edges, width };
}

export function CampaignAtlasMap({ atlas }: { atlas: CampaignAtlas }) {
  const flow = useMemo(() => build(atlas), [atlas]);
  return (
    <>
      <div className="atlas-canvas">
        <ReactFlow
          edges={flow.edges}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          maxZoom={1.4}
          minZoom={0.05}
          nodes={flow.nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodeTypes={nodeTypes}
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#333b32" gap={ATLAS_COL / 8} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            maskColor="rgba(8,12,9,.78)"
            nodeColor={(node) => (node.type === "side" ? "#5f7f9c" : node.type === "chain" ? "#8f7fae" : node.type === "lane" ? "#8d8d7a" : "#c6974c")}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
      <ul className="atlas-legend">
        <li><span className="swatch is-handoff" /> Structural handoff — an ending that names the next chapter, exported to the game</li>
        <li><span className="swatch is-flag" /> Flag join — set in one board, read in another</li>
        <li><span className="swatch is-implied" /><TriangleAlert aria-hidden="true" size={11} /> No join written yet — consecutive chapters nothing connects</li>
        <li><span className="swatch is-chain" /> Companion chain — first named here, then runs on its own clock</li>
        <li><Flag aria-hidden="true" size={11} /> Click any card to open it on its own board</li>
      </ul>
    </>
  );
}
