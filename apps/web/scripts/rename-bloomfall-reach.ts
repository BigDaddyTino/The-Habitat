import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { bloomfallReachCanon } from "@habitat/shared";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });

const confirmation = "--confirm=BLOOMFALL_REACH_DEVELOPMENT_RENAME";
const canonicalSummary = `${bloomfallReachCanon.commonName}: a southeastern region scarred by ${bloomfallReachCanon.catastrophe}, where ${bloomfallReachCanon.corruption} continues to spread.`;
const supersededSummary = `${bloomfallReachCanon.commonName}: a southeastern region scarred by ${bloomfallReachCanon.catastrophe} and the spreading ${bloomfallReachCanon.corruption}.`;
const expected = {
  id: "a64869df-c623-49ec-9236-dd306a3fd5c7",
  version: 1,
  kind: "REGION",
  status: "CANON",
  title: bloomfallReachCanon.formerDevelopmentPlaceholder.title,
  slug: bloomfallReachCanon.formerDevelopmentPlaceholder.slug,
} as const;

const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Bloomfall rename requires HABITAT_ENVIRONMENT=development.");
process.env.DATABASE_URL = developmentUrl;
const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
assertAtlasAuthoringEnvironment(process.env);
const db = createPrismaClient(developmentUrl);

function inputJson(value: unknown) { return value as Prisma.InputJsonValue; }

async function topologyOwnershipSnapshot(client: Prisma.TransactionClient | typeof db, entryId: string) {
  const placements = await client.storyMapPlacement.findMany({
    where: { entryId }, orderBy: { id: "asc" },
    include: {
      map: { select: { id: true, slug: true } },
      areaRings: { orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }], include: { boundaries: { orderBy: { sequence: "asc" }, include: { boundary: { include: { startNode: true, endNode: true } } } } } },
    },
  });
  const [from, to, counts] = await Promise.all([
    client.storyWorldConnection.findMany({ where: { fromEntryId: entryId }, orderBy: { id: "asc" }, include: { paths: { orderBy: { id: "asc" } } } }),
    client.storyWorldConnection.findMany({ where: { toEntryId: entryId }, orderBy: { id: "asc" }, include: { paths: { orderBy: { id: "asc" } } } }),
    Promise.all([client.storyMapTopologyNode.count(), client.storyMapBoundary.count(), client.storyMapAreaRing.count(), client.storyMapAreaRingBoundary.count(), client.storyWorldConnection.count(), client.storyMapConnectionPath.count()]),
  ]);
  return {
    placements: placements.map((placement) => ({ id: placement.id, map: placement.map, geometryKind: placement.geometryKind, geometry: placement.geometry, labelX: placement.labelX, labelY: placement.labelY, minZoom: placement.minZoom, maxZoom: placement.maxZoom, priority: placement.priority, version: placement.version, rings: placement.areaRings })),
    connections: { from, to }, counts,
  };
}

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  if (identity[0]?.database !== "habitat_atlas_dev" || target.database !== "habitat_atlas_dev") throw new Error("Bloomfall rename independently verified the wrong database identity.");

  const current = await db.storyEntry.findFirst({ where: { OR: [{ id: expected.id }, { slug: { in: [expected.slug, bloomfallReachCanon.slug] } }] } });
  if (!current) throw new Error("The audited Bloomfall source record is missing.");
  if (current.id === expected.id && current.slug === bloomfallReachCanon.slug && current.title === bloomfallReachCanon.title) {
    if (current.summary === canonicalSummary) {
      process.stdout.write(stableAtlasJson({ status: "ALREADY_RENAMED", database: target, id: current.id, slug: current.slug, title: current.title, version: current.version }));
      return;
    }
    if (!process.argv.includes("--apply")) {
      process.stdout.write(stableAtlasJson({ status: "PREVIEW_CANONICAL_SUMMARY_NORMALIZATION", database: target, id: current.id, version: current.version, currentSummary: current.summary, canonicalSummary }));
      return;
    }
    if (!process.argv.includes(confirmation)) throw new Error(`Development normalization requires ${confirmation}.`);
    if (current.version !== 2 || current.summary !== supersededSummary) throw new Error("Canonical Bloomfall record content drifted from the independently expected post-rename state.");
    const beforeOwnership = await topologyOwnershipSnapshot(db, current.id);
    const normalized = await db.$transaction(async (tx) => {
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Bloomfall normalization requires an active administrator for audit authorship.");
      const claimed = await tx.storyEntry.updateMany({ where: { id: current.id, version: 2, slug: bloomfallReachCanon.slug, title: bloomfallReachCanon.title, summary: supersededSummary }, data: { summary: canonicalSummary, version: { increment: 1 }, updatedByUserId: actor.id } });
      if (claimed.count !== 1) throw new Error("Bloomfall summary normalization lost its optimistic record/version claim.");
      await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id, summary: "Normalized the Bloomfall Reach canonical summary", before: inputJson({ summary: supersededSummary, version: 2 }), after: inputJson({ summary: canonicalSummary, version: 3 }) } });
      const afterOwnership = await topologyOwnershipSnapshot(tx, current.id);
      if (stableAtlasJson(afterOwnership, false) !== stableAtlasJson(beforeOwnership, false)) throw new Error("Topology ownership changed during Bloomfall summary normalization.");
      return actor.id;
    }, { isolationLevel: "Serializable", timeout: 30_000 });
    process.stdout.write(stableAtlasJson({ status: "CANONICAL_SUMMARY_NORMALIZED", database: target, actorUserId: normalized, id: current.id, version: 3, topologyOwnershipPreserved: true }));
    return;
  }
  if (!process.argv.includes("--apply")) {
    process.stdout.write(stableAtlasJson({ status: "PREVIEW", database: target, expected, actual: { id: current.id, version: current.version, kind: current.kind, status: current.status, slug: current.slug, title: current.title }, apply: `pnpm --filter @habitat/web exec tsx scripts/rename-bloomfall-reach.ts --apply ${confirmation}` }));
    return;
  }
  if (!process.argv.includes(confirmation)) throw new Error(`Development rename requires ${confirmation}.`);
  if (stableAtlasJson({ id: current.id, version: current.version, kind: current.kind, status: current.status, title: current.title, slug: current.slug }, false) !== stableAtlasJson(expected, false)) throw new Error(`Bloomfall source state drifted from the audited record: ${stableAtlasJson({ id: current.id, version: current.version, kind: current.kind, status: current.status, title: current.title, slug: current.slug }, false)}`);
  const collision = await db.storyEntry.findUnique({ where: { slug: bloomfallReachCanon.slug }, select: { id: true } });
  if (collision) throw new Error(`Canonical slug ${bloomfallReachCanon.slug} already belongs to ${collision.id}.`);

  const beforeOwnership = await topologyOwnershipSnapshot(db, current.id);
  const result = await db.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
    if (!actor) throw new Error("Bloomfall rename requires an active administrator for audit authorship.");
    const claimed = await tx.storyEntry.updateMany({
      where: { id: expected.id, version: expected.version, kind: expected.kind, status: expected.status, slug: expected.slug, title: expected.title },
      data: {
        slug: bloomfallReachCanon.slug,
        title: bloomfallReachCanon.title,
        summary: canonicalSummary,
        body: `${bloomfallReachCanon.title}, commonly called ${bloomfallReachCanon.commonName}, is the southeastern region scarred by ${bloomfallReachCanon.catastrophe}. The spreading corruption is ${bloomfallReachCanon.corruption}. Its locked regional vocabulary divides the north into ${bloomfallReachCanon.subregions.north}, the center into ${bloomfallReachCanon.subregions.central}, and the south into ${bloomfallReachCanon.subregions.south}. Their detailed history, settlements, institutions, ecology, and regional stories remain reserved for the canon-lock phase.`,
        meta: inputJson({
          ...(current.meta as Record<string, unknown>),
          biome: "Bloomfall-scarred ruin, mutation belt, and living marsh",
          status: "Canonical region foundation; detailed regional canon pending.",
          openQuestions: ["What was the region called before the Bloomfall?", "What facility caused the Bloomfall?", "What is the precise disaster timeline?"],
        }),
        updatedByUserId: actor.id,
        version: { increment: 1 },
      },
    });
    if (claimed.count !== 1) throw new Error("Bloomfall rename lost its optimistic record/version claim.");
    await tx.storyRevision.create({
      data: {
        entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id,
        summary: `Retired development placeholder and canonically renamed region to "${bloomfallReachCanon.title}"`,
        before: inputJson({ title: expected.title, slug: expected.slug, version: expected.version, developmentPlaceholder: true }),
        after: inputJson({ title: bloomfallReachCanon.title, slug: bloomfallReachCanon.slug, version: expected.version + 1, commonName: bloomfallReachCanon.commonName, catastrophe: bloomfallReachCanon.catastrophe, corruption: bloomfallReachCanon.corruption, subregions: bloomfallReachCanon.subregions }),
      },
    });
    const renamed = await tx.storyEntry.findUniqueOrThrow({ where: { id: current.id } });
    const afterOwnership = await topologyOwnershipSnapshot(tx, current.id);
    if (stableAtlasJson(afterOwnership, false) !== stableAtlasJson(beforeOwnership, false)) throw new Error("Topology ownership, placement, connection, path, or count data changed during the semantic rename.");
    return { actorUserId: actor.id, renamed, ownershipFingerprint: stableAtlasJson(afterOwnership, false) };
  }, { isolationLevel: "Serializable", timeout: 30_000 });

  const oldRecord = await db.storyEntry.findUnique({ where: { slug: expected.slug }, select: { id: true } });
  if (oldRecord) throw new Error("Former placeholder slug remains canonical after the transaction.");
  process.stdout.write(stableAtlasJson({ status: "RENAMED", database: target, actorUserId: result.actorUserId, id: result.renamed.id, title: result.renamed.title, slug: result.renamed.slug, version: result.renamed.version, recordIdPreserved: result.renamed.id === expected.id, topologyOwnershipPreserved: stableAtlasJson(await topologyOwnershipSnapshot(db, result.renamed.id), false) === result.ownershipFingerprint }));
}

void main().finally(() => db.$disconnect());
