import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import { buildAtlasCanonicalDerivedGeometry, buildAtlasCanonicalReviewHtml, buildAtlasCanonicalReviewSvg } from "./lib/atlas-canonical-topology";
import {
  buildAtlasRehearsalPlan,
  type AtlasConnectionCandidate,
  type AtlasTopologyTrace,
  type AtlasV1ConnectionManifest,
  type AtlasV1GeometryManifest,
} from "./lib/atlas-migration-rehearsal";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
const sourceDirectory = path.join(repositoryRoot, "Docs", "atlas-migration-manifests");
const outputDirectory = path.join(repositoryRoot, "Docs", "atlas-migration-rehearsal");
const write = process.argv.includes("--write");
const check = process.argv.includes("--check");
if (write && check) throw new Error("Choose --write or --check, not both.");

const connectionManifest = JSON.parse(readFileSync(path.join(sourceDirectory, "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
const geometryManifest = JSON.parse(readFileSync(path.join(sourceDirectory, "atlas-v1-geometry.json"), "utf8")) as AtlasV1GeometryManifest;
const plan = buildAtlasRehearsalPlan(connectionManifest, geometryManifest);

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function connectionReviewMarkdown(candidates: readonly AtlasConnectionCandidate[]) {
  const ambiguous = candidates.filter((candidate) => candidate.reviewStatus === "REVIEW_REQUIRED");
  const ambiguousRows = ambiguous.map((candidate) => `### ${candidate.provenanceKey}\n\n- Source: \`${candidate.sourceSlug}\`\n- Target: \`${candidate.targetSlug}\`\n- Original wording: \`${candidate.originalWording}\`\n- Candidate: \`${candidate.type}\` (low confidence)\n- Fingerprint: \`${candidate.sourceFingerprint}\`\n- Recommendation: retain \`OTHER\`; decide whether the authored shelves describe a travel route at all and, if so, which controlled type fits.\n- Why review: ${candidate.classificationRationale}`).join("\n\n");
  const reciprocalRows = plan.reciprocalGroups.map((group, index) => `### Group ${index + 1}\n\n- A: \`${group.connectionA.source} → ${group.connectionA.target}\` — \`${group.connectionA.wording}\` — \`${group.connectionA.locator}\`\n- B: \`${group.connectionB.source} → ${group.connectionB.target}\` — \`${group.connectionB.wording}\` — \`${group.connectionB.locator}\`\n- Candidate interpretation: \`${group.candidateInterpretation}\`\n- Recommendation: ${group.recommendation}`).join("\n\n");
  return `# Atlas 2.0 Owner Review Packet

This packet contains only unresolved owner/editorial calls. No item here was merged, promoted, or written to the active database.

## Ambiguous connection classifications

${ambiguousRows}

## Reciprocal connection candidates

${reciprocalRows}

## World topology

Prompt 6 resolves the world-master geography. All eight top-level land regions, Grand Lake, and nested Death Canyon are approved for migration in the deterministic topology manifest. No world-master boundary remains owner-review-required.

## Starting Island

No canonical base-geography topology was stored. Named polygons are mostly settlements, forts, sites, landings, or markers. \`riftwood-interior\` is the sole broad geography candidate, but its lore and artwork do not define a precise perimeter. Owner decision: decide whether Riftwood is a base-geography area, a narrative/biome overlay, or a point/label-only place before tracing.

## Port Arcadia

Decoded artwork is **1599×984** while the declared contract remains **1536×1024**. No topology was created. Recalibrate the coordinate/artwork relationship first, then review the seven intended district areas against the undistorted image: exclusion-area, upper-westside, lower-westside, the-northside, the-southside, waterfront-district, and east-side.
`;
}

function topologyLine(trace: AtlasTopologyTrace, boundaryId: string) {
  const map = trace.maps[0];
  const boundary = map.dataset.boundaries.find((candidate) => candidate.id === boundaryId)!;
  const nodes = new Map(map.dataset.nodes.map((node) => [node.id, node.position]));
  return [nodes.get(boundary.startNodeId)!, ...boundary.interiorVertices, nodes.get(boundary.endNodeId)!];
}

function svgPath(points: readonly (readonly [number, number])[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`).join(" ");
}

/** @deprecated Forensic Prompt 4 review only; canonical artifacts use buildAtlasCanonicalReviewHtml. */
export function buildAtlasLegacyPrompt4ReviewHtml() {
  const traceMap = plan.topologyTrace.maps[0];
  const v1ByMap = new Map<string, AtlasV1GeometryManifest["records"]>();
  for (const record of geometryManifest.records) v1ByMap.set(record.mapSlug, [...(v1ByMap.get(record.mapSlug) ?? []), record]);
  const mapConfig = [
    { slug: "martino-world", title: "World", art: "martino-world-map-v1.png", width: 100_000, height: 66_667 },
    { slug: "martino-starting-island", title: "Starting Island", art: "martino-starting-island-map-v1.png", width: 100_000, height: 66_667 },
    { slug: "martino-port-arcadia", title: "Port Arcadia — recalibration only", art: "martino-port-arcadia-map-v2.png", width: 100_000, height: 66_667 },
  ];
  const panels = mapConfig.map((map) => {
    const v1 = (v1ByMap.get(map.slug) ?? []).flatMap((record) => {
      const geometry = record.geometry as { type?: string; coordinates?: unknown };
      if (geometry.type !== "POLYGON" || !Array.isArray(geometry.coordinates)) return [];
      return (geometry.coordinates as Array<Array<[number, number]>>).map((ring) => `<path class="v1" d="${svgPath(ring)} Z"><title>V1 ${escapeHtml(record.entrySlug)}</title></path>`);
    }).join("\n");
    const v2 = map.slug === traceMap.mapSlug ? traceMap.dataset.boundaries.map((boundary) => {
      const points = topologyLine(plan.topologyTrace, boundary.id);
      const midpoint = points[Math.floor(points.length / 2)]!;
      const locator = traceMap.boundaryLocators[boundary.id];
      const review = traceMap.reviews.find((candidate) => locator.startsWith(candidate.locator));
      const state = review?.confidence ?? (locator.startsWith("grand-lake.shore") ? "HIGH" : "MEDIUM");
      return `<path class="v2 boundary ${state}" d="${svgPath(points)}"><title>${escapeHtml(locator)} — ${state}</title></path><text class="v2 boundary-label ${state}" x="${midpoint[0]}" y="${midpoint[1]}">${escapeHtml(locator.replace("high-cliffs.", "hc.").replace("grand-lake.", "lake."))}</text>`;
    }).join("\n") + traceMap.dataset.nodes.map((node) => `<circle class="v2 node" cx="${node.position[0]}" cy="${node.position[1]}" r="310"><title>${escapeHtml(traceMap.nodeLocators[node.id])}</title></circle>`).join("\n") : "";
    const notice = map.slug === "martino-port-arcadia" ? `<div class="notice">No V2 topology: decoded 1599×984, declared 1536×1024. Recalibration required.</div>` : map.slug === "martino-starting-island" ? `<div class="notice">No base topology candidate: Riftwood ownership/type requires review; other placements remain markers/sites.</div>` : "";
    return `<section><h2>${escapeHtml(map.title)}</h2>${notice}<div class="map"><svg viewBox="0 0 ${map.width} ${map.height}" role="img" aria-label="${escapeHtml(map.title)} migration review"><image href="../../apps/web/private/codex-art/maps/${map.art}" x="0" y="0" width="${map.width}" height="${map.height}" preserveAspectRatio="none"/><g id="v1-${map.slug}">${v1}</g><g id="v2-${map.slug}">${v2}</g></svg></div></section>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atlas 2.0 Prompt 4 Review</title><style>
  :root{color-scheme:dark;background:#10120f;color:#f3ead2;font-family:system-ui,sans-serif}body{max-width:1500px;margin:auto;padding:24px}header{display:flex;gap:24px;align-items:center;flex-wrap:wrap}label{font-weight:700}.map{border:1px solid #796d50;background:#050605;box-shadow:0 18px 50px #0008}.map svg{width:100%;display:block}.v1{fill:#d43b5b25;stroke:#ff5475;stroke-width:190;vector-effect:non-scaling-stroke}.boundary{fill:none;stroke-width:280;vector-effect:non-scaling-stroke}.boundary.HIGH{stroke:#45f0d0}.boundary.MEDIUM{stroke:#ffce59}.boundary.OWNER_REVIEW_REQUIRED{stroke:#ff553f;stroke-dasharray:900 500}.node{fill:#fff;stroke:#111;stroke-width:100;vector-effect:non-scaling-stroke}.boundary-label{font-size:850px;font-weight:800;paint-order:stroke;stroke:#111;stroke-width:180;fill:#fff}.notice{padding:10px 14px;margin:8px 0;background:#5b2f19;border-left:5px solid #ff9d42}section{margin-top:30px}body.hide-v1 .v1{display:none}body.hide-v2 .v2{display:none}.legend span{margin-right:14px}.high{color:#45f0d0}.medium{color:#ffce59}.review{color:#ff6b55}</style></head><body><header><div><h1>Atlas 2.0 Prompt 4 Review</h1><p>Development-only visual comparison. Approved artwork is referenced unchanged; no live data is loaded.</p></div><label><input id="v1" type="checkbox" checked> V1 reference geometry</label><label><input id="v2" type="checkbox" checked> V2 trace candidates</label></header><p class="legend"><span class="high">● High confidence</span><span class="medium">● Medium</span><span class="review">● Owner review required</span></p>${panels}<script>document.querySelector('#v1').addEventListener('change',e=>document.body.classList.toggle('hide-v1',!e.target.checked));document.querySelector('#v2').addEventListener('change',e=>document.body.classList.toggle('hide-v2',!e.target.checked));</script></body></html>`;
}

const derivedGeometry = buildAtlasCanonicalDerivedGeometry(plan.topologyTrace);
const reviewSvg = buildAtlasCanonicalReviewSvg(plan.topologyTrace);

const artifacts = {
  "atlas-v2-connection-candidates.json": stableAtlasJson({ contract: plan.contract, contractVersion: plan.contractVersion, candidates: plan.connectionCandidates, reciprocalGroups: plan.reciprocalGroups, parity: plan.connectionParity }),
  "atlas-v2-topology-trace.json": stableAtlasJson(plan.topologyTrace),
  "atlas-v2-topology-manifest.json": stableAtlasJson(plan.topologyTrace),
  "atlas-v2-derived-geometry.json": stableAtlasJson(derivedGeometry),
  "atlas-v2-topology-review.svg": reviewSvg,
  "atlas-v2-area-inventory.json": stableAtlasJson({ contract: plan.contract, contractVersion: plan.contractVersion, records: plan.areaInventory }),
  "atlas-v2-parity-plan.json": stableAtlasJson({ contract: plan.contract, contractVersion: plan.contractVersion, connections: plan.connectionParity, topology: plan.topologyMetrics, geometryComparisons: plan.geometryComparisons, policies: plan.policies }),
  "ATLAS_2_OWNER_REVIEW.md": connectionReviewMarkdown(plan.connectionCandidates),
  "atlas-v2-review.html": buildAtlasCanonicalReviewHtml(plan.topologyTrace, geometryManifest),
} as const;

async function main() {
  if (write) await mkdir(outputDirectory, { recursive: true });
  for (const [filename, content] of Object.entries(artifacts)) {
    const target = path.join(outputDirectory, filename);
    if (write) await writeFile(target, content, "utf8");
    if (check) {
      const current = await readFile(target, "utf8").catch(() => null);
      if (current !== content) throw new Error(`${filename} is missing or differs from the deterministic canonical Atlas plan.`);
    }
    process.stdout.write(`${filename}: sha256 ${atlasSha256(content)}${write ? " (written)" : check ? " (byte-identical)" : " (read-only plan)"}\n`);
  }
  process.stdout.write(`${stableAtlasJson({ topologyLocked: plan.topologyMetrics.topologyLocked, legacyConnections: plan.connectionParity.legacyRows, candidates: plan.connectionParity.v2Candidates, autoClassified: plan.connectionParity.autoClassified, reviewRequired: plan.connectionParity.typeReviewRequired, reciprocalGroups: plan.reciprocalGroups.length, tracedAreas: plan.topologyMetrics.tracedAreas, sharedBoundaries: plan.topologyMetrics.sharedBoundaries, ownerReviewInventory: plan.areaInventory.filter((row) => row.disposition === "OWNER_REVIEW_REQUIRED").length }, false)}\n`);
}

void main();
