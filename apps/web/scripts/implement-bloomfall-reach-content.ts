import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { validateAtlasWorldConnection } from "@habitat/shared";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import {
  bloomfallArcs,
  bloomfallMainRegion,
  bloomfallNewEntries,
  bloomfallRegionId,
  bloomfallScene,
} from "../lib/bloomfall-reach-content";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const confirmation = "--confirm=BLOOMFALL_CANONICAL_CONTENT_DEVELOPMENT_ONLY";
type Database = ReturnType<typeof createPrismaClient>;
type Transaction = Prisma.TransactionClient;

function inputJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
function jsonEqual(left: unknown, right: unknown) { return stableAtlasJson(left, false) === stableAtlasJson(right, false); }
function withoutPlaceConnections(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete rest.visualArt;
  return { ...rest, connections: [] };
}
function withoutVisualArt(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete rest.visualArt;
  return rest;
}
function stableUuid(key: string) {
  const source = createHash("sha256").update(`martino:bloomfall-reach:prompt-3:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "5";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const extensionBlocks: Record<string, { block: string; regionNote?: string }> = {
  "essence": { block: `**Bloomfall Reach — regional canon.** [[southreach-complex]] held a finite strategic Essence reserve. The Bloomfall dispersed and destabilized that stock; surviving caches remain dangerous industrial inheritance, never a renewable source. [[essence-saturation]], [[reserve-vault-twelve]], and [[blackbloom-exposure]] describe its regional consequences.` },
  "stormglass": { block: `**Bloomfall Reach — regional canon.** Venting around [[crown-break]] can produce dangerous Stormglass deposits. Formation depends on catastrophic pressure and consumes a finite hazardous event; it is not a clean or renewable resource loop. Recovery is governed by [[bloomfall-environmental-hazards]] and [[harvesting-consequences]].` },
  "magic": { block: `**Bloomfall Reach — regional canon.** [[blackbloom-overcharge]] extends Magic in saturated environments with power, instability, and environmental consequence. It does not merge ambient Blackbloom exposure into [[the-seven-phases-of-corruption]].`, regionNote: "Blackbloom saturation can overcharge or destabilize spells. This is canonical lore and future gameplay design, not a shipped runtime simulation." },
  "environment": { block: `**Bloomfall Reach — regional canon.** [[blackbloom-exposure]], [[reactor-cycles]], [[marsh-absorption]], and [[bloomfall-environmental-hazards]] make the Reach an environment that continues changing without player presence.`, regionNote: "Industrial reactor states, mature adaptive ecology, and coordinated marsh absorption continue without player presence." },
  "weather": { block: `**Bloomfall Reach — regional canon.** Saturation surges and Crown Break venting can create Bloomstorms. Their visual language follows industrial and ecological evidence, not uniform purple magic weather.`, regionNote: "Bloomstorms and vent-driven weather follow saturation and reactor conditions; their runtime simulation remains conceptual." },
  "persistent-damage": { block: `**Bloomfall Reach — regional canon.** Two decades of unrepaired rupture, sacrificed marsh beds, altered routes, and abandoned infrastructure make regional damage readable history. Nobody Came outcomes persist.`, regionNote: "Reactor damage, sacrificed filtration ground, lost camps, and altered routes remain as world-state evidence." },
  "lasting-wounds": { block: `**Bloomfall Reach — regional canon.** Exposure injury, industrial trauma, and biological integration may leave permanent bodily consequences, but wounds remain distinct from Blackbloom adaptation and Seven-Phase Corruption.`, regionNote: "Industrial injury and Blackbloom exposure may leave lasting marks without sharing the Corruption ledger." },
  "gathering-and-harvest": { block: `**Bloomfall Reach — regional canon.** [[harvesting-consequences]] binds rare materials to the industrial or living functions that produced them. Extraction can weaken containment, reroute charge, or alter migration.`, regionNote: "Reserve salvage is finite; biological harvest can weaken containment ecology. No renewable infinite Essence." },
  "national-defense-directorate": { block: `**Bloomfall Reach — direct involvement.** NDD secured the state-owned Southreach reserve, protected classified inventory, held emergency authority, and commands the modern containment zone. Its records contain discrepancies, but this does not establish NDD as the cause of [[the-bloomfall]]. [[selene-ward]] represents its present security duty.` },
  "aegis-extraction-consortium": { block: `**Bloomfall Reach — direct involvement.** Aegis operated Southreach Essence intake, industrial refining, storage, heavy plant, and logistics, and now supports licensed salvage through factors such as [[jaro-fen]]. Operational responsibility does not establish responsibility for [[the-bloomfall]].` },
  "meridian-arcane-institute": { block: `**Bloomfall Reach — direct involvement.** Meridian handled containment certification, Essence assay, technical research, and safety oversight at Southreach. Its modern teams at [[glassroot-observatory]] study [[blackbloom-exposure]] and [[marsh-absorption]]. Evidence may expose failure without making Meridian automatically villainous.` },
  "wardens-monster-hunter-guild": { block: `**Bloomfall Reach — direct involvement.** Wardens track changing trails, extract survivors, and manage exceptional creature threats under the [[aberrant-escalation]] designation. [[mara-quill]] treats hunting as ecological intervention, not trophy work.` },
  "abomination-containment-authority": { block: `**Bloomfall Reach — secondary involvement.** ACA supports emergencies where Blackbloom incidents interact with Seven-Phase Corruption or Abomination threats. It does not regulate ordinary [[blackbloom-exposure]] as though environmental adaptation were soul corruption.` },
  "peninsula-expeditionary-army": { block: `**Bloomfall Reach — secondary involvement.** The Army supplies perimeter logistics and emergency capacity when the containment zone exceeds civil expedition resources. It does not own the Reach or replace NDD site authority.` },
  "stormglass-cartel": { block: `**Bloomfall Reach — secondary involvement.** The Cartel seeks [[stormglass]], reserve salvage, and the dangerous Drowned Intake sea approach. Presence is illicit and opportunistic, not universal control.` },
  "verdant-marsh-clans": { block: `**Bloomfall Reach — secondary involvement.** Knowledge crosses into the Living Marsh through individuals such as [[nalia-reed]]. That guidance does not transfer ownership of [[the-living-marsh]] or establish a Clan territorial claim.` },
  "helix-arcanobiotics": { block: `**Bloomfall Reach — potential only.** Helix involvement in Southreach records is UNCONFIRMED. Suspicious evidence may be authored later, but no culpability, ownership, or operational role is canonical.` },
};

const routes = [
  {
    id: stableUuid("connection:bloomfall-reach:riverlands:road"), to: "riverlands", type: "ROAD" as const,
    originalWording: "Historical Southreach freight/access road now functioning as a controlled and gated expedition corridor.",
    editorialNotes: "Owner-approved semantic connection. Historical road and current hazardous access remain distinct. No route path until approved Bloomfall art/local Atlas review.",
    metadata: { canonSource: "Bloomfall Reach Prompt 3", historicalFunction: "Southreach freight and access road", currentUse: "controlled gated expedition corridor", geometryStatus: "DEFERRED_PENDING_APPROVED_LOCAL_ART" },
  },
  {
    id: stableUuid("connection:bloomfall-reach:the-ocean:sea-route"), to: "the-ocean", type: "SEA_ROUTE" as const,
    originalWording: "Historical Drowned Intake marine/logistics access now usable only through hazardous shallow-draft approaches.",
    editorialNotes: "Owner-approved semantic connection. This is not a safe commercial harbor. No route path until approved Bloomfall art/local Atlas review.",
    metadata: { canonSource: "Bloomfall Reach Prompt 3", historicalFunction: "Drowned Intake marine and logistics access", currentUse: "hazardous shallow-draft approach", safeCommercialHarbor: false, geometryStatus: "DEFERRED_PENDING_APPROVED_LOCAL_ART" },
  },
] as const;

async function revision(tx: Transaction, input: { entityType: string; entityId: string; arcId?: string; action: "CREATED" | "UPDATED" | "LINKED"; actorUserId: string; summary: string; before?: unknown; after?: unknown }) {
  await tx.storyRevision.create({ data: { entityType: input.entityType, entityId: input.entityId, arcId: input.arcId, action: input.action, actorUserId: input.actorUserId, summary: input.summary.slice(0, 300), before: input.before === undefined ? undefined : inputJson(input.before), after: input.after === undefined ? undefined : inputJson(input.after) } });
}

function validateManifest() {
  const slugs = new Set<string>();
  for (const entry of bloomfallNewEntries) {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate Bloomfall manifest slug: ${entry.slug}`);
    slugs.add(entry.slug);
    const schema = metaSchemasByKind[entry.kind];
    if (schema) {
      const parsed = schema.safeParse(entry.meta);
      if (!parsed.success) throw new Error(`Invalid ${entry.kind} metadata for ${entry.slug}: ${parsed.error.message}`);
    }
  }
  const region = metaSchemasByKind.REGION!.safeParse(bloomfallMainRegion.meta);
  if (!region.success) throw new Error(`Invalid Bloomfall Reach metadata: ${region.error.message}`);
}

async function applyExtension(tx: Transaction, actorUserId: string, slug: string, extension: { block: string; regionNote?: string }) {
  const entry = await tx.storyEntry.findUnique({ where: { slug } });
  if (!entry) throw new Error(`Required cross-link target ${slug} is missing.`);
  const marker = `\n\n${extension.block}`;
  const hasBlock = (entry.body ?? "").includes(extension.block);
  let nextMeta: unknown = entry.meta;
  if (extension.regionNote) {
    const meta = entry.meta && typeof entry.meta === "object" && !Array.isArray(entry.meta) ? { ...(entry.meta as Record<string, unknown>) } : null;
    if (!meta || !Array.isArray(meta.regionNotes)) throw new Error(`${slug} cannot receive the required typed Bloomfall region note.`);
    const notes = meta.regionNotes as Array<{ region?: unknown; note?: unknown }>;
    const existing = notes.find((note) => note.region === "bloomfall-reach");
    if (existing && existing.note !== extension.regionNote) throw new Error(`${slug} already has conflicting Bloomfall region metadata.`);
    if (!existing) meta.regionNotes = [...notes, { region: "bloomfall-reach", note: extension.regionNote }];
    nextMeta = meta;
  }
  if (hasBlock && jsonEqual(nextMeta, entry.meta)) return false;
  const before = { body: entry.body, meta: entry.meta, version: entry.version };
  const updated = await tx.storyEntry.update({ where: { id: entry.id }, data: { body: hasBlock ? entry.body : `${entry.body ?? ""}${marker}`.trim(), meta: nextMeta === null ? undefined : inputJson(nextMeta), version: { increment: 1 }, updatedByUserId: actorUserId } });
  await revision(tx, { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId, summary: `Linked ${entry.title} to canonical Bloomfall Reach content`, before, after: { body: updated.body, meta: updated.meta, version: updated.version } });
  return true;
}

async function createArc(tx: Transaction, actorUserId: string, arcSeed: (typeof bloomfallArcs)[number], entryIdBySlug: Map<string, string>) {
  const existing = await tx.storyArc.findUnique({ where: { slug: arcSeed.slug }, include: { nodes: true, edges: true } });
  if (existing) {
    if (existing.title !== arcSeed.title || existing.category !== arcSeed.category || existing.isMainline || existing.regionEntryId !== bloomfallRegionId || existing.nodes.length !== arcSeed.nodes.length || existing.edges.length !== arcSeed.edges.length) throw new Error(`Existing arc ${arcSeed.slug} conflicts with the approved Bloomfall graph.`);
    return false;
  }
  const factionEntryId = arcSeed.factionSlug ? entryIdBySlug.get(arcSeed.factionSlug) : undefined;
  if (arcSeed.factionSlug && !factionEntryId) throw new Error(`Faction ${arcSeed.factionSlug} is missing for ${arcSeed.slug}.`);
  const arcId = stableUuid(`arc:${arcSeed.slug}`);
  await tx.storyArc.create({ data: { id: arcId, slug: arcSeed.slug, title: arcSeed.title, summary: arcSeed.summary, hook: arcSeed.hook, regionEntryId: bloomfallRegionId, isMainline: false, category: arcSeed.category, factionEntryId, status: "CANON", position: arcSeed.position, createdByUserId: actorUserId } });
  await revision(tx, { entityType: "ARC", entityId: arcId, arcId, action: "CREATED", actorUserId, summary: `Created non-mainline Bloomfall arc ${arcSeed.title}`, after: arcSeed });
  const nodeIdByKey = new Map<string, string>();
  for (const [index, node] of arcSeed.nodes.entries()) {
    const nodeId = stableUuid(`node:${arcSeed.slug}:${node.key}`);
    nodeIdByKey.set(node.key, nodeId);
    await tx.storyNode.create({ data: { id: nodeId, arcId, key: node.key, kind: node.kind, title: node.title, summary: node.summary, body: node.body, status: "CANON", endingKind: node.endingKind, completion: node.completion, effects: [...(node.effects ?? [])], rewards: [...(node.rewards ?? [])], canvasX: index * 360, canvasY: node.key === "nobody-came" ? 280 : 0, version: 1, createdByUserId: actorUserId } });
    await revision(tx, { entityType: "NODE", entityId: nodeId, arcId, action: "CREATED", actorUserId, summary: `Created ${arcSeed.title}: ${node.title}`, after: node });
    for (const slug of node.links) {
      const entryId = entryIdBySlug.get(slug);
      if (!entryId) throw new Error(`Node ${arcSeed.slug}/${node.key} references missing entry ${slug}.`);
      await tx.storyEntryLink.create({ data: { id: stableUuid(`link:${arcSeed.slug}:${node.key}:${slug}`), nodeId, entryId } });
    }
  }
  for (const [position, edge] of arcSeed.edges.entries()) {
    const fromNodeId = nodeIdByKey.get(edge.from);
    const toNodeId = nodeIdByKey.get(edge.to);
    if (!fromNodeId || !toNodeId) throw new Error(`Arc ${arcSeed.slug} has an unresolved edge endpoint.`);
    const edgeId = stableUuid(`edge:${arcSeed.slug}:${edge.key}`);
    await tx.storyEdge.create({ data: { id: edgeId, arcId, key: edge.key, fromNodeId, toNodeId, label: edge.label, effects: [...edge.effects], position, status: "CANON", createdByUserId: actorUserId } });
    await revision(tx, { entityType: "EDGE", entityId: edgeId, arcId, action: "CREATED", actorUserId, summary: `Linked ${arcSeed.title}: ${edge.from} to ${edge.to}`, after: edge });
  }
  return true;
}

export async function applyBloomfallCanonicalContent(db: Database, options: { dryRun?: boolean } = {}) {
  validateManifest();
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const database = identity[0]?.database;
  if (!database) throw new Error("Bloomfall implementation could not verify its database identity.");
  const [region, existingNew, mainlineBefore, geometryBefore, routePathsBefore] = await Promise.all([
    db.storyEntry.findUnique({ where: { id: bloomfallRegionId } }),
    db.storyEntry.findMany({ where: { slug: { in: bloomfallNewEntries.map((entry) => entry.slug) } }, select: { slug: true } }),
    db.storyArc.findMany({ where: { isMainline: true }, orderBy: { id: "asc" }, select: { id: true, slug: true, updatedAt: true } }),
    Promise.all([db.storyMapTopologyNode.count(), db.storyMapBoundary.count(), db.storyMapAreaRing.count(), db.storyMapAreaRingBoundary.count()]),
    db.storyMapConnectionPath.count(),
  ]);
  if (!region || region.slug !== "bloomfall-reach" || region.title !== "Bloomfall Reach" || region.kind !== "REGION" || region.status !== "CANON") throw new Error("Canonical Bloomfall Reach source identity is missing or drifted.");
  const preview = { status: "PREVIEW" as const, database, mutations: 0, region: { id: region.id, version: region.version }, manifest: { newEntries: bloomfallNewEntries.length, arcs: bloomfallArcs.length, semanticConnections: routes.length, scene: bloomfallScene.slug }, existingManifestEntries: existingNew.length };
  if (options.dryRun) return preview;

  let mutations = 0;
  const result = await db.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
    if (!actor) throw new Error("Bloomfall implementation requires an active administrator for audit authorship.");
    const currentRegion = await tx.storyEntry.findUniqueOrThrow({ where: { id: bloomfallRegionId } });
    const regionExact = currentRegion.summary === bloomfallMainRegion.summary && currentRegion.body === bloomfallMainRegion.body && jsonEqual(withoutVisualArt(currentRegion.meta), bloomfallMainRegion.meta);
    if (!regionExact) {
      const initialState = currentRegion.version === 3;
      const connectionNormalization = currentRegion.version === 4 && currentRegion.summary === bloomfallMainRegion.summary && currentRegion.body === bloomfallMainRegion.body && jsonEqual(withoutPlaceConnections(currentRegion.meta), bloomfallMainRegion.meta);
      if (!initialState && !connectionNormalization) throw new Error(`Bloomfall Reach drifted from the approved pre-implementation or Prompt 3 normalization state (found version ${currentRegion.version}).`);
      const updated = await tx.storyEntry.update({ where: { id: bloomfallRegionId }, data: { summary: bloomfallMainRegion.summary, body: bloomfallMainRegion.body, meta: inputJson(bloomfallMainRegion.meta), version: { increment: 1 }, updatedByUserId: actor.id } });
      await revision(tx, { entityType: "ENTRY", entityId: bloomfallRegionId, action: "UPDATED", actorUserId: actor.id, summary: "Expanded Bloomfall Reach into the owner-approved canonical regional dossier", before: { version: currentRegion.version, summary: currentRegion.summary, body: currentRegion.body, meta: currentRegion.meta }, after: { version: updated.version, summary: updated.summary, body: updated.body, meta: updated.meta } });
      mutations += 1;
    }

    for (const seed of bloomfallNewEntries) {
      const existing = await tx.storyEntry.findUnique({ where: { slug: seed.slug } });
      if (existing) {
        const coreExact = existing.kind === seed.kind && existing.title === seed.title && existing.summary === seed.summary && existing.body === seed.body && existing.status === "CANON";
        if (!coreExact) throw new Error(`Existing entry ${seed.slug} conflicts with the approved Bloomfall manifest.`);
        if (!jsonEqual(withoutVisualArt(existing.meta), seed.meta)) {
          const placeConnectionNormalization = seed.kind === "REGION" && jsonEqual(withoutPlaceConnections(existing.meta), seed.meta);
          if (!placeConnectionNormalization) throw new Error(`Existing entry ${seed.slug} metadata conflicts with the approved Bloomfall manifest.`);
          const updated = await tx.storyEntry.update({ where: { id: existing.id }, data: { meta: inputJson(seed.meta), version: { increment: 1 }, updatedByUserId: actor.id } });
          await revision(tx, { entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: `Moved ${seed.title} travel semantics to first-class world connections`, before: { meta: existing.meta, version: existing.version }, after: { meta: updated.meta, version: updated.version } });
          mutations += 1;
        }
        continue;
      }
      const id = stableUuid(`entry:${seed.slug}`);
      await tx.storyEntry.create({ data: { id, kind: seed.kind, slug: seed.slug, title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta === null ? undefined : inputJson(seed.meta), status: "CANON", createdByUserId: actor.id } });
      await revision(tx, { entityType: "ENTRY", entityId: id, action: "CREATED", actorUserId: actor.id, summary: `Created canonical Bloomfall entry ${seed.title}`, after: seed });
      mutations += 1;
    }

    for (const [slug, extension] of Object.entries(extensionBlocks)) if (await applyExtension(tx, actor.id, slug, extension)) mutations += 1;
    const allEntries = await tx.storyEntry.findMany({ select: { id: true, slug: true, kind: true } });
    const entryIdBySlug = new Map(allEntries.map((entry) => [entry.slug, entry.id]));

    const parent = await tx.storyMap.findUniqueOrThrow({ where: { slug: "martino-world" } });
    const scene = await tx.storyMap.findUnique({ where: { slug: bloomfallScene.slug }, include: { placements: true, nodePlacements: true, topologyNodes: true, boundaries: true, connectionPaths: true } });
    if (scene) {
      const exact = scene.id === bloomfallScene.id && scene.parentMapId === parent.id && scene.ownerEntryId === bloomfallRegionId && scene.artVersion === bloomfallScene.artVersion && scene.imageWidth === bloomfallScene.imageWidth && scene.imageHeight === bloomfallScene.imageHeight && scene.coordinateWidth === bloomfallScene.coordinateWidth && scene.coordinateHeight === bloomfallScene.coordinateHeight;
      if (!exact || scene.placements.length || scene.nodePlacements.length || scene.topologyNodes.length || scene.boundaries.length || scene.connectionPaths.length) throw new Error("Existing Bloomfall local scene conflicts with the approved empty foundation.");
    } else {
      await tx.storyMap.create({ data: { ...bloomfallScene, parentMapId: parent.id, ownerEntryId: bloomfallRegionId, initialCenterX: 50000, initialCenterY: 33334, initialZoom: 0, minZoom: 0, maxZoom: 8, createdByUserId: actor.id } });
      await revision(tx, { entityType: "MAP", entityId: bloomfallScene.id, action: "CREATED", actorUserId: actor.id, summary: "Created inactive Bloomfall Reach local Atlas foundation without geometry or art", after: bloomfallScene });
      mutations += 1;
    }

    for (const route of routes) {
      const toEntryId = entryIdBySlug.get(route.to);
      if (!toEntryId) throw new Error(`Approved route endpoint ${route.to} is missing.`);
      const contract = { id: route.id, fromEntryId: bloomfallRegionId, toEntryId, type: route.type, directionality: "BIDIRECTIONAL" as const, status: "OPEN" as const, visibility: "DEFAULT" as const, originalWording: route.originalWording, editorialNotes: route.editorialNotes, metadata: route.metadata, version: 1 };
      const valid = validateAtlasWorldConnection(contract);
      if (!valid.valid) throw new Error(`Invalid route ${route.to}: ${stableAtlasJson(valid.findings, false)}`);
      const semanticCollision = await tx.storyWorldConnection.findFirst({ where: { fromEntryId: bloomfallRegionId, toEntryId, type: route.type } });
      if (semanticCollision && semanticCollision.id !== route.id) throw new Error(`A different semantic ${route.type} connection already joins Bloomfall Reach and ${route.to}.`);
      const existing = await tx.storyWorldConnection.findUnique({ where: { id: route.id }, include: { paths: true } });
      if (existing) {
        if (existing.fromEntryId !== contract.fromEntryId || existing.toEntryId !== contract.toEntryId || existing.type !== contract.type || existing.directionality !== contract.directionality || existing.status !== contract.status || existing.visibility !== contract.visibility || existing.originalWording !== contract.originalWording || existing.editorialNotes !== contract.editorialNotes || !jsonEqual(existing.metadata, contract.metadata) || existing.paths.length) throw new Error(`Approved connection ${route.id} drifted or gained premature path geometry.`);
        continue;
      }
      await tx.storyWorldConnection.create({ data: { id: route.id, fromEntryId: bloomfallRegionId, toEntryId, type: route.type, directionality: "BIDIRECTIONAL", status: "OPEN", visibility: "DEFAULT", originalWording: route.originalWording, editorialNotes: route.editorialNotes, metadata: inputJson(route.metadata), createdByUserId: actor.id } });
      await revision(tx, { entityType: "WORLD_CONN", entityId: route.id, action: "CREATED", actorUserId: actor.id, summary: `Created approved ${route.type} semantic connection from Bloomfall Reach to ${route.to}`, after: contract });
      mutations += 1;
    }

    for (const arc of bloomfallArcs) if (await createArc(tx, actor.id, arc, entryIdBySlug)) { mutations += 1; }
    return { actorUserId: actor.id };
  }, { isolationLevel: "Serializable", timeout: 120_000 });

  const [mainlineAfter, geometryAfter, routePathsAfter, bloomfallPaths] = await Promise.all([
    db.storyArc.findMany({ where: { isMainline: true }, orderBy: { id: "asc" }, select: { id: true, slug: true, updatedAt: true } }),
    Promise.all([db.storyMapTopologyNode.count(), db.storyMapBoundary.count(), db.storyMapAreaRing.count(), db.storyMapAreaRingBoundary.count()]),
    db.storyMapConnectionPath.count(),
    db.storyMapConnectionPath.count({ where: { connection: { OR: [{ fromEntryId: bloomfallRegionId }, { toEntryId: bloomfallRegionId }] } } }),
  ]);
  if (!jsonEqual(mainlineBefore, mainlineAfter)) throw new Error("A mainline arc changed during Bloomfall implementation.");
  if (!jsonEqual(geometryBefore, geometryAfter)) throw new Error("Existing Atlas geometry changed during Bloomfall implementation.");
  if (routePathsBefore !== routePathsAfter || bloomfallPaths !== 0) throw new Error("Route path geometry changed during Bloomfall implementation.");
  return { status: mutations ? "BLOOMFALL_CANONICAL_CONTENT_APPLIED" as const : "ALREADY_APPLIED" as const, database, actorUserId: result.actorUserId, mutations, mainlineArcsModified: 0, atlasGeometryChanged: false, bloomfallRoutePaths: bloomfallPaths };
}

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!developmentUrl) throw new Error("Bloomfall content implementation requires HABITAT_ENVIRONMENT=development.");
  process.env.DATABASE_URL = developmentUrl;
  const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
  assertAtlasAuthoringEnvironment(process.env);
  const db = createPrismaClient(developmentUrl);
  try {
    const apply = process.argv.includes("--apply");
    if (apply && !process.argv.includes(confirmation)) throw new Error(`Development implementation requires ${confirmation}.`);
    const result = await applyBloomfallCanonicalContent(db, { dryRun: !apply });
    process.stdout.write(stableAtlasJson({ ...result, database: target, ...(apply ? { productionWrites: 0 } : { apply: `pnpm --filter @habitat/web bloomfall:implement --apply ${confirmation}` }) }));
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
