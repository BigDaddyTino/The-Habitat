import "../../lib/environment";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getPrismaClient } from "@habitat/db/client";
import { analyzeStoryGraph, storyInvolvementKinds, type StoryGraphEdge, type StoryGraphNode } from "@habitat/shared";
import { bloomfallV3Assets, bloomfallV3CodexAssets, bloomfallV3Published } from "../../lib/bloomfall-v3-art";
import { getCharacterKeyart } from "../../lib/character-keyart";
import { codexArtFileForUrl, codexArtKinds, codexArtSlot } from "../../lib/codex-art";
import { getCreatureKeyart, illustratedCreatureSlugs } from "../../lib/creature-keyart";
import { brandedFactionSlugs, getFactionBranding } from "../../lib/faction-branding";
import { getDossierArt } from "../../lib/dossier-art";
import { getRegionKeyart } from "../../lib/region-branding";
import { metaSchemasByKind, serverOwnedMetaKeys } from "../../lib/story-meta-schemas";
import { illustratedCharacterSlugs } from "../../lib/character-keyart";
import { resolveStoryAtlasArt } from "../../lib/story-atlas-art";
import { buildAtlasIntegrityAudit, createFilesystemAtlasArtworkInspector } from "./atlas-integrity";
import { loadAtlasAuditSource } from "./atlas-integrity-db";
import { auditGeographicHierarchy, type GeographicEntry } from "./geographic-hierarchy";

/**
 * The one audit a release has to pass.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-release.ts [--json]
 *
 * Six checks, each standing for a failure that actually happened rather than
 * one somebody imagined:
 *
 *  1. METADATA      — a sheet save used to strip the publication marker off
 *                     thirteen approved dossiers and their art went dark.
 *  2. NAMESPACES    — six involvement rows pointed at EVENT entries through a
 *                     field named `arc`, invisible because the scanner
 *                     validated against entries and arcs merged into one pool.
 *  3. ART PRIVACY   — the whole codex art set sat under `public/`, served to
 *                     anonymous callers by a site that gates its own pages.
 *  4. IMAGES        — art a dossier references but that is not on disk, and
 *                     declared dimensions that do not match the file.
 *  5. GEOGRAPHY     — a place filed under a parent that does not exist, or
 *                     under itself, or in a cycle.
 *  6. GRAPH         — a board with no way in, a scene nothing reaches, or
 *                     choices that all land in the same place and record
 *                     nothing.
 *
 * STRICTLY READ-ONLY. It opens the database with findMany and touches the
 * filesystem with existsSync/readFileSync and nothing else, because
 * deploy-web.ps1 runs it against production before it builds.
 *
 * "Link now, fill later" is canon law, so a reference to something nobody has
 * written yet is REPORTED and never fails. What fails is a reference that
 * resolves in the wrong namespace — that is not a plan, it is a mistake.
 */
const db = getPrismaClient();
const webRoot = process.cwd();

type Check = { name: string; failures: string[]; notes: string[]; waived: string[] };


/**
 * Defects the owner has accepted for now, each with the reason it is not a
 * blocker. A waiver is loud on every run — the point is that it stays visible
 * rather than being quietly dropped from the checks.
 */
const waivers: Record<string, string> = {
  // Empty, and worth keeping that way. The only entry this map ever held was
  // Port Arcadia's artwork mismatch, which was recalibrated on 2026-08-28 —
  // see scripts/recalibrate-port-arcadia.ts. A waiver is a defect somebody
  // agreed to live with, and under the release-canon rules a waiver does not
  // travel: a deploy honours this map, a release cut does not.
};

/**
 * The atlas findings this gate treats as release-blocking. The rest of that
 * audit's output — reciprocal-connection candidates, classification ambiguity,
 * inventory drift against an old review baseline — is human review work, not a
 * reason to refuse a deploy.
 */
const artworkFindingCodes = new Set(["ARTWORK_MISSING", "ARTWORK_FORMAT", "ARTWORK_ALLOWLIST", "ARTWORK_DIMENSION_MISMATCH"]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const slug = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
const rows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => asRecord(row) !== null) : [];

/** Width and height straight out of the file header, for the formats in use. */
function imageDimensions(file: string): { width: number; height: number } | null {
  const bytes = readFileSync(file);
  if (bytes.length > 24 && bytes.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length > 4 && bytes.readUInt16BE(0) === 0xffd8) {
    for (let offset = 2; offset + 9 < bytes.length;) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1]!;
      if (marker >= 0xc0 && marker <= 0xc3) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2) return null;
      offset += 2 + length;
    }
  }
  return null;
}

export type ReleaseAuditResult = {
  checks: Check[];
  /** True when no check has a failure. Waivers do not make a check pass; they
   *  move a finding out of `failures` and into `waived`. */
  ok: boolean;
  /** Findings that were let through because `honourWaivers` was set. A cut
   *  refuses while this is non-empty; a deploy tolerates it. */
  waived: string[];
};

/**
 * Runs the six release checks.
 *
 * `honourWaivers` is the whole difference between a deploy and a release cut.
 * A deploy honours the waiver map — somebody agreed to live with those, and
 * the website is not what the game imports. A cut does not: a release is what
 * an importer pins by hash, and a defect somebody agreed to live with is not
 * a defect that should travel into the game.
 */
export async function runReleaseAudit({ honourWaivers = true }: { honourWaivers?: boolean } = {}): Promise<ReleaseAuditResult> {
  const checks: Check[] = [];
  const waivedFindings: string[] = [];
  const check = (name: string): Check => {
    const entry: Check = { name, failures: [], notes: [], waived: [] };
    checks.push(entry);
    return entry;
  };
  const waiverFor = (path: string) => (honourWaivers ? waivers[path] : undefined);
  const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;
  const [entries, arcs, nodes, edges, maps] = await Promise.all([
    db.storyEntry.findMany({ where: { status: { in: [...workingStatuses] } }, select: { id: true, slug: true, kind: true, title: true, status: true, meta: true }, orderBy: [{ kind: "asc" }, { slug: "asc" }] }),
    db.storyArc.findMany({ where: { status: { in: [...workingStatuses] } }, select: { id: true, slug: true, title: true }, orderBy: { slug: "asc" } }),
    db.storyNode.findMany({ select: { arcId: true, key: true, kind: true, title: true } }),
    db.storyEdge.findMany({ select: { arcId: true, label: true, fromNode: { select: { key: true } }, toNode: { select: { key: true } }, effects: true } }),
    db.storyMap.findMany({ select: { slug: true, artVersion: true }, orderBy: { slug: "asc" } }),
  ]);
  const knownEntries = new Set(entries.map((entry) => entry.slug));
  const knownArcs = new Set(arcs.map((arc) => arc.slug));
  const eventSlugs = new Set(entries.filter((entry) => entry.kind === "EVENT").map((entry) => entry.slug));

  // --- 1. metadata preservation ---------------------------------------------

  const metadata = check("METADATA — server-owned keys survive a save");
  for (const entry of entries) {
    const meta = asRecord(entry.meta);
    const schema = metaSchemasByKind[entry.kind];
    if (!meta) continue;
    if (!schema) { metadata.failures.push(`${entry.kind}:${entry.slug} carries meta but has no sheet — the whole object is lost on any edit`); continue; }
    const parsed = schema.safeParse(meta);
    if (!parsed.success) {
      metadata.failures.push(`${entry.kind}:${entry.slug} would fail its own sheet: ${parsed.error.issues.slice(0, 2).map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`).join("; ")}`);
    }
    const kept = new Set(Object.keys((schema as unknown as { shape?: Record<string, unknown> }).shape ?? {}));
    for (const key of Object.keys(meta)) {
      if (kept.has(key)) continue;
      if ((serverOwnedMetaKeys as readonly string[]).includes(key)) continue;
      metadata.failures.push(`${entry.kind}:${entry.slug} .${key} is a key the next save silently discards`);
    }
  }
  // The markers themselves, not just their survival: a release that publishes
  // art nobody approved is the same failure from the other direction.
  const metaBySlug = new Map(entries.map((entry) => [entry.slug, entry.meta]));
  for (const asset of bloomfallV3CodexAssets) {
    if (!bloomfallV3Published(metaBySlug.get(asset.entrySlug), asset)) {
      metadata.failures.push(`${asset.entrySlug} has lost or altered its owner-approved V3 publication marker`);
    }
  }
  metadata.notes.push(`${bloomfallV3CodexAssets.length} publication markers verified across ${entries.length} entries`);

  // --- 2. reference namespaces ----------------------------------------------

  const namespaces = check("NAMESPACES — typed references resolve in their own pool");
  let unresolved = 0;
  const reference = (where: string, target: string | null, pool: Set<string>, poolName: string, otherPools: Array<[string, Set<string>]>) => {
    if (!target) return;
    if (pool.has(target)) return;
    // Wrong namespace is a mistake; nowhere at all is a plan.
    const wrong = otherPools.find(([, candidates]) => candidates.has(target));
    if (wrong) namespaces.failures.push(`${where} -> ${target} is a ${wrong[0]}, not ${poolName}`);
    else unresolved += 1;
  };
  for (const entry of entries) {
    const meta = asRecord(entry.meta);
    if (!meta) continue;
    const at = `${entry.kind}:${entry.slug}`;
    if (entry.kind === "CHARACTER") {
      for (const row of rows(meta.involvement)) {
        const ref = slug(row.ref) ?? slug(row.arc);
        const kind = slug(row.kind);
        if (!kind || !(storyInvolvementKinds as readonly string[]).includes(kind)) {
          namespaces.failures.push(`${at} .involvement -> ${ref ?? "(nothing)"} does not say whether it is an arc or an event`);
          continue;
        }
        if (kind === "EVENT") reference(`${at} .involvement[EVENT]`, ref, eventSlugs, "a world event", [["quest arc", knownArcs], ["non-event entry", knownEntries]]);
        else reference(`${at} .involvement[ARC]`, ref, knownArcs, "a quest arc", [["bible entry", knownEntries]]);
      }
    }
    if (entry.kind === "SYSTEM") reference(`${at} .unlockArc`, slug(meta.unlockArc), knownArcs, "a quest arc", [["bible entry", knownEntries]]);
    for (const [field, value] of [["parent", meta.parent], ["home", meta.home], ["seat", meta.seat]] as const) {
      const target = slug(value);
      // home and seat legally hold prose; only a multi-word slug was ever a link.
      if (!target || (field !== "parent" && !target.includes("-"))) continue;
      reference(`${at} .${field}`, target, knownEntries, "a bible entry", [["quest arc", knownArcs]]);
    }
  }
  namespaces.notes.push(`${unresolved} reference${unresolved === 1 ? "" : "s"} point at something nobody has written yet — link now, fill later, reported not failed`);

  // --- 3. art privacy --------------------------------------------------------

  const privacy = check("ART PRIVACY — no codex art is served without a session");
  const publicImages = path.join(webRoot, "public", "images");
  if (existsSync(publicImages)) {
    for (const item of readdirSync(publicImages, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      if (item.name in codexArtKinds || existsSync(path.join(publicImages, item.name, "keyart"))) {
        privacy.failures.push(`public/images/${item.name} is codex art served statically to anonymous callers`);
      }
    }
  }
  for (const kind of Object.keys(codexArtKinds) as Array<keyof typeof codexArtKinds>) {
    if (!codexArtSlot(kind, "example").startsWith("private/codex-art/")) privacy.failures.push(`the ${kind} art slot still tells writers to use a public directory`);
  }
  for (const file of ["character-keyart.ts", "creature-keyart.ts", "region-branding.ts", "faction-branding.ts"]) {
    const source = readFileSync(path.join(webRoot, "lib", file), "utf8");
    for (const match of source.matchAll(/["`]\/images\/[a-z0-9-]+\//g)) privacy.failures.push(`lib/${file} resolves art to ${match[0].slice(1)}… which bypasses the member gate`);
  }
  privacy.notes.push(`${Object.keys(codexArtKinds).length} art kinds, all behind /codex-art`);

  // --- 4. image eligibility --------------------------------------------------

  const images = check("IMAGES — referenced art exists and matches what it declares");
  let resolved = 0;
  const referenced: Array<[string, string | null]> = [
    ...illustratedCharacterSlugs.map((entry) => [`character ${entry}`, getCharacterKeyart(entry)] as [string, string | null]),
    ...illustratedCreatureSlugs.map((entry) => [`creature ${entry}`, getCreatureKeyart(entry)] as [string, string | null]),
    ...brandedFactionSlugs.flatMap((entry) => {
      const brand = getFactionBranding(entry);
      return brand ? [[`faction ${entry} key art`, brand.keyart], [`faction ${entry} logo`, brand.logo]] as Array<[string, string | null]> : [];
    }),
  ];
  for (const [label, url] of referenced) {
    if (!url) { images.failures.push(`${label} is registered as illustrated but resolves to no URL`); continue; }
    if (!codexArtFileForUrl(url)) { images.failures.push(`${label} points at ${url}, which is not on disk`); continue; }
    resolved += 1;
  }
  // Region art is declared by branding rather than by file, so an entry can
  // legitimately be branded before its plate is drawn; only a branded region
  // whose file is half-present is a defect worth blocking on.
  for (const entry of entries.filter((row) => row.kind === "REGION")) {
    const url = getRegionKeyart(entry.slug);
    if (!url) continue;
    if (codexArtFileForUrl(url)) resolved += 1;
    else images.notes.push(`region ${entry.slug} is branded but has no plate at ${url} yet`);
  }
  for (const asset of bloomfallV3Assets) {
    const file = path.join(webRoot, "private", "codex-art", asset.kind === "atlas" ? "maps" : "bloomfall-v3", asset.filename);
    if (!existsSync(file)) { images.failures.push(`Bloomfall V3 ${asset.id} is missing from disk at ${file}`); continue; }
    const size = imageDimensions(file);
    if (!size) { images.failures.push(`Bloomfall V3 ${asset.id} has an unreadable image header`); continue; }
    if (size.width !== asset.width || size.height !== asset.height) {
      images.failures.push(`Bloomfall V3 ${asset.id} decodes ${size.width}x${size.height} against a declared ${asset.width}x${asset.height}`);
    }
    resolved += 1;
  }
  // Atlas scene artwork, where a declared extent that does not match the file
  // silently moves every pin placed against it. The existing integrity audit
  // already decodes every scene and compares it against the row — reused here
  // rather than reimplemented, so the two can never disagree.
  const atlas = await buildAtlasIntegrityAudit(await loadAtlasAuditSource(), createFilesystemAtlasArtworkInspector(resolveStoryAtlasArt));
  for (const finding of atlas.findings) {
    if (!artworkFindingCodes.has(finding.code)) continue;
    const detail = `${finding.code} ${finding.path} — ${finding.message}`;
    const reason = waiverFor(finding.path);
    if (reason) { images.waived.push(`${detail}
             accepted because: ${reason}`); waivedFindings.push(finding.path); }
    else images.failures.push(detail);
  }
  resolved += maps.length;
  images.notes.push(`${resolved} referenced assets resolved on disk, ${maps.length} atlas scenes decoded`);

  // Coverage, reported and never failed. An entry without a picture is a
  // commission nobody has placed yet, not a defect — but it is the one number
  // that says how much of the codex is still grey, and it belongs where
  // somebody already looks before every deploy. Kinds are listed worst first
  // so the line doubles as the art worklist.
  const artGaps = new Map<string, number>();
  let illustrated = 0;
  for (const entry of entries) {
    const art = entry.kind === "FACTION" ? getFactionBranding(entry.slug)?.keyart ?? null : getDossierArt(entry.kind, entry.slug, entry.meta);
    if (art) { illustrated += 1; continue; }
    artGaps.set(entry.kind, (artGaps.get(entry.kind) ?? 0) + 1);
  }
  const gapSummary = [...artGaps.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  images.notes.push(`${illustrated}/${entries.length} entries wear key art (${entries.length - illustrated} without)`);
  if (gapSummary.length) images.notes.push(`art still wanted: ${gapSummary.map(([kind, count]) => `${count} ${kind.toLowerCase().replaceAll("_", " ")}`).join(", ")}`);

  // --- 5. geography ----------------------------------------------------------

  const geography = check("GEOGRAPHY — the place tree has no impossible parents");
  const placements = await db.storyMapPlacement.findMany({ select: { entryId: true, geometryKind: true, map: { select: { slug: true } } } });
  const ownedMaps = await db.storyMap.findMany({ select: { slug: true, parent: { select: { slug: true } }, owner: { select: { id: true } } } });
  const placementsByEntry = new Map<string, Array<{ mapSlug: string; geometryKind: string }>>();
  for (const placement of placements) {
    const list = placementsByEntry.get(placement.entryId) ?? [];
    list.push({ mapSlug: placement.map.slug, geometryKind: placement.geometryKind });
    placementsByEntry.set(placement.entryId, list);
  }
  const ownedByEntry = new Map(ownedMaps.filter((map) => map.owner).map((map) => [map.owner!.id, { slug: map.slug, parentSlug: map.parent?.slug ?? null }]));
  const geographic: GeographicEntry[] = entries.filter((entry) => entry.kind === "REGION").map((entry) => ({
    id: entry.id, slug: entry.slug, title: entry.title, kind: entry.kind, status: entry.status, meta: entry.meta,
    placements: placementsByEntry.get(entry.id) ?? [],
    ownedMap: ownedByEntry.get(entry.id) ?? null,
  }));
  const hierarchy = auditGeographicHierarchy(geographic);
  for (const item of hierarchy.missingParents) geography.failures.push(`${item} is filed inside a place that does not exist`);
  for (const item of hierarchy.selfParents) geography.failures.push(`${item} is filed inside itself`);
  for (const item of hierarchy.cycles) geography.failures.push(`${item} sits in a parent cycle`);
  for (const item of hierarchy.topLevelNestedUnderTopLevel) geography.failures.push(`${item.slug} is a top-level world region but is filed under ${item.parent}`);
  geography.notes.push(`${geographic.length} places, ${hierarchy.invalidParentCount} invalid parents`);

  // --- 6. graph completeness -------------------------------------------------

  const graph = check("GRAPH — every populated board can be played");
  const nodesByArc = new Map<string, StoryGraphNode[]>();
  for (const node of nodes) {
    const list = nodesByArc.get(node.arcId) ?? [];
    list.push({ key: node.key, kind: node.kind, title: node.title });
    nodesByArc.set(node.arcId, list);
  }
  const edgesByArc = new Map<string, StoryGraphEdge[]>();
  for (const edge of edges) {
    const list = edgesByArc.get(edge.arcId) ?? [];
    list.push({ fromKey: edge.fromNode.key, toKey: edge.toNode.key, label: edge.label, hasConsequence: Array.isArray(edge.effects) ? edge.effects.length > 0 : Boolean(edge.effects) });
    edgesByArc.set(edge.arcId, list);
  }
  let populated = 0;
  for (const arc of arcs) {
    const arcNodes = nodesByArc.get(arc.id) ?? [];
    // An empty board is a quest nobody has written yet, not a broken one.
    if (arcNodes.length === 0) { graph.notes.push(`${arc.slug} has no scenes yet`); continue; }
    populated += 1;
    for (const problem of analyzeStoryGraph(arcNodes, edgesByArc.get(arc.id) ?? [])) {
      graph.failures.push(`${arc.slug} ${problem.kind}${problem.nodeKey ? ` at ${problem.nodeKey}` : ""} — ${problem.detail}`);
    }
  }
  graph.notes.push(`${populated}/${arcs.length} boards populated, ${nodes.length} scenes, ${edges.length} branches`);

  return { checks, ok: checks.every((entry) => entry.failures.length === 0), waived: waivedFindings };
}

export function renderReleaseAudit(result: ReleaseAuditResult, strict: boolean) {
  const lines: string[] = [`Habitat release audit — read-only${strict ? ", strict (no waivers)" : ""}`, ""];
  for (const entry of result.checks) {
    lines.push(`${entry.failures.length === 0 ? "PASS" : "FAIL"}  ${entry.name}`);
    for (const note of entry.notes) lines.push(`      ${note}`);
    for (const item of entry.waived) lines.push(`      WAIVED ${item}`);
    for (const failure of entry.failures) lines.push(`      ✖ ${failure}`);
  }
  const failed = result.checks.filter((entry) => entry.failures.length > 0).length;
  const waived = result.checks.reduce((total, entry) => total + entry.waived.length, 0);
  lines.push("", `${result.ok ? "PASS" : "FAIL"} — ${result.checks.length - failed}/${result.checks.length} checks clear${waived ? `, ${waived} accepted defect${waived === 1 ? "" : "s"}` : ""}.`);
  if (!result.ok) lines.push("This release must not ship until these are fixed.");
  return lines.join("\n");
}
