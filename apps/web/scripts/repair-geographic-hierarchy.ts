import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import {
  assessGeographicHierarchyRepair,
  assertRepairedHierarchy,
  captureAtlasPreservationSnapshot,
  geographicHierarchyRepairContract,
  geographicHierarchyRepairManifest,
  repairedGeographicMeta,
  stableGeographicHierarchyRevisionId,
} from "./lib/geographic-hierarchy-repair";
import type { GeographicEntry } from "./lib/geographic-hierarchy";

const confirmation = "--confirm=GLOBAL_REGION_HIERARCHY_DEVELOPMENT_REPAIR";

function inputJson(value: Prisma.InputJsonValue) { return value; }

async function geographicEntries(client: Prisma.TransactionClient | ReturnType<typeof createPrismaClient>) {
  const rows = await client.storyEntry.findMany({
    where: { kind: "REGION", status: { in: ["DRAFT", "PROPOSED", "CANON"] } },
    orderBy: { slug: "asc" },
    include: { mapPlacements: { include: { map: { select: { slug: true } } } }, ownedMap: { include: { parent: { select: { slug: true } } } } },
  });
  return rows.map((row) => ({
    id: row.id, slug: row.slug, title: row.title, kind: row.kind, status: row.status, version: row.version, meta: row.meta,
    placements: row.mapPlacements.map((placement) => ({ mapSlug: placement.map.slug, geometryKind: placement.geometryKind })),
    ownedMap: row.ownedMap ? { slug: row.ownedMap.slug, parentSlug: row.ownedMap.parent?.slug ?? null } : null,
  }));
}

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const url = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!url) throw new Error("Geographic hierarchy repair target URL is unavailable.");
  assertAtlasPersistentDevelopmentTarget(url);
  const identity = new URL(url);
  const database = identity.pathname.slice(1);
  const db = createPrismaClient(url);
  try {
    await assertAtlasV2SchemaPresent(db);
    const current = await geographicEntries(db);
    const assessment = assessGeographicHierarchyRepair(current);
    const proposedDiff = geographicHierarchyRepairManifest.map((entry) => ({ id: entry.id, slug: entry.slug, before: { parent: entry.beforeParent, type: entry.beforeType }, after: { parent: entry.finalParent, type: entry.finalType } }));
    if (assessment.overall === "DRIFT") throw new Error(`Hierarchy repair source drifted from its exact all-before/all-after contract: ${stableAtlasJson(assessment, false)}`);
    if (assessment.overall === "ALREADY_APPLIED") {
      const audit = assertRepairedHierarchy(current as GeographicEntry[]);
      process.stdout.write(stableAtlasJson({ contract: geographicHierarchyRepairContract, status: "ALREADY_APPLIED", database, mutations: 0, revisions: 0, invalidParents: audit.invalidParentCount, peninsulaVisible: audit.peninsulaVisible.map((entry) => entry.slug) }));
      return;
    }
    if (!process.argv.includes("--apply")) {
      process.stdout.write(stableAtlasJson({ contract: geographicHierarchyRepairContract, status: "PREVIEW", database, mutations: proposedDiff.length, proposedDiff, apply: `pnpm --filter @habitat/web geography:repair -- --apply ${confirmation}` }));
      return;
    }
    if (!process.argv.includes(confirmation)) throw new Error(`Development repair requires ${confirmation}.`);

    const result = await db.$transaction(async (tx) => {
      const beforeAtlas = await captureAtlasPreservationSnapshot(tx);
      const beforeRows = await geographicEntries(tx);
      const transactionAssessment = assessGeographicHierarchyRepair(beforeRows);
      if (transactionAssessment.overall !== "READY") throw new Error(`Hierarchy changed before the transaction obtained its repair state: ${stableAtlasJson(transactionAssessment, false)}`);
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Geographic hierarchy repair requires an active administrator for revision authorship.");
      const changed = [];
      for (const expected of geographicHierarchyRepairManifest) {
        const before = beforeRows.find((entry) => entry.slug === expected.slug)!;
        const claimed = await tx.storyEntry.updateMany({
          where: { id: expected.id, slug: expected.slug, version: before.version },
          data: { meta: repairedGeographicMeta(before.meta, expected.slug), version: { increment: 1 }, updatedByUserId: actor.id },
        });
        if (claimed.count !== 1) throw new Error(`Optimistic hierarchy repair claim failed for ${expected.slug}.`);
        const revisionId = stableGeographicHierarchyRevisionId(expected.slug);
        await tx.storyRevision.create({ data: {
          id: revisionId, entityType: "ENTRY", entityId: expected.id, action: "UPDATED", actorUserId: actor.id,
          summary: `Corrected ${expected.title} canonical geographic containment`,
          before: inputJson({ contract: geographicHierarchyRepairContract, parent: expected.beforeParent, type: expected.beforeType, version: before.version }),
          after: inputJson({ contract: geographicHierarchyRepairContract, parent: expected.finalParent, type: expected.finalType, version: before.version + 1 }),
        } });
        changed.push({ id: expected.id, slug: expected.slug, versionBefore: before.version, versionAfter: before.version + 1, revisionId });
      }
      const afterRows = await geographicEntries(tx);
      const afterAssessment = assessGeographicHierarchyRepair(afterRows);
      if (afterAssessment.overall !== "ALREADY_APPLIED") throw new Error(`Hierarchy did not reach its exact final contract: ${stableAtlasJson(afterAssessment, false)}`);
      const audit = assertRepairedHierarchy(afterRows as GeographicEntry[]);
      const afterAtlas = await captureAtlasPreservationSnapshot(tx);
      if (stableAtlasJson(afterAtlas, false) !== stableAtlasJson(beforeAtlas, false)) throw new Error("Atlas maps, placements, topology, connections, paths, or geometry changed during the semantic hierarchy repair.");
      return { actorUserId: actor.id, changed, audit, beforeAtlas, afterAtlas };
    }, { isolationLevel: "Serializable", timeout: 30_000 });

    const receipt = {
      contract: geographicHierarchyRepairContract,
      status: "REPAIRED",
      database,
      actorUserId: result.actorUserId,
      mutations: result.changed.length,
      revisions: result.changed.length,
      changed: result.changed,
      invalidParents: result.audit.invalidParentCount,
      peninsulaVisible: result.audit.peninsulaVisible.map((entry) => entry.slug),
      atlasPreserved: stableAtlasJson(result.beforeAtlas, false) === stableAtlasJson(result.afterAtlas, false),
      atlasSnapshot: result.afterAtlas,
    };
    process.stdout.write(stableAtlasJson({ ...receipt, logicalSha256: atlasSha256(stableAtlasJson(receipt, false)) }));
  } finally {
    await db.$disconnect();
  }
}

void main();
