import { createHash } from "node:crypto";
import type { Prisma } from "@habitat/db/client";
import { auditGeographicHierarchy, geographicParent, geographicType, type GeographicEntry } from "./geographic-hierarchy";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";

export const geographicHierarchyRepairContract = "MARTINO_GLOBAL_REGION_HIERARCHY_V1" as const;

export const geographicHierarchyRepairManifest = [
  { id: "a64869df-c623-49ec-9236-dd306a3fd5c7", slug: "bloomfall-reach", title: "Bloomfall Reach", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
  { id: "e97f3dfa-23cb-43df-9d71-b186f08b45e3", slug: "the-desert", title: "The Desert", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
  { id: "09ee1dc8-8f3e-462a-9741-ccb6aeecf0ac", slug: "grand-rift", title: "The Grand Rift", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
  { id: "ec50dc96-805d-480c-a177-ee6cd6bd7fa3", slug: "high-cliffs", title: "The High Cliffs", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
  { id: "087f6d60-db59-482e-a892-04334444bd02", slug: "magic-torn-wasteland", title: "The Magic-Torn Wasteland", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
  { id: "8908a33a-0cd4-4a56-8610-5521cafade8c", slug: "the-red-forest", title: "The Red Forest", beforeParent: "grand-rift", beforeType: "zone", finalParent: null, finalType: "region" },
  { id: "ef4b0861-94e3-4cc1-bcfd-42bd1ce318a5", slug: "riverlands", title: "The Riverlands", beforeParent: "the-peninsula", beforeType: "region", finalParent: null, finalType: "region" },
] as const;

export const verifiedGeographicParentContracts = {
  "the-peninsula": null,
  "port-arcadia": "the-peninsula",
  "grand-lake": "high-cliffs",
  "the-floating-city": "high-cliffs",
  "death-canyon": "grand-rift",
  "the-starting-island": null,
  "the-ocean": null,
  "the-shattercore": "bloomfall-reach",
  "the-mutation-belt": "bloomfall-reach",
  "the-living-marsh": "bloomfall-reach",
} as const;

type RepairEntry = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  status: string;
  version: number;
  meta: unknown;
};

type Database = Prisma.TransactionClient | {
  storyMap: Prisma.TransactionClient["storyMap"];
  storyMapPlacement: Prisma.TransactionClient["storyMapPlacement"];
  storyMapNodePlacement: Prisma.TransactionClient["storyMapNodePlacement"];
  storyMapTopologyNode: Prisma.TransactionClient["storyMapTopologyNode"];
  storyMapBoundary: Prisma.TransactionClient["storyMapBoundary"];
  storyMapAreaRing: Prisma.TransactionClient["storyMapAreaRing"];
  storyMapAreaRingBoundary: Prisma.TransactionClient["storyMapAreaRingBoundary"];
  storyWorldConnection: Prisma.TransactionClient["storyWorldConnection"];
  storyMapConnectionPath: Prisma.TransactionClient["storyMapConnectionPath"];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Geographic hierarchy repair requires object metadata.");
  return value as Record<string, unknown>;
}

export function stableGeographicHierarchyRevisionId(slug: string) {
  const digits = createHash("sha256").update(`${geographicHierarchyRepairContract}:revision:${slug}`).digest("hex").slice(0, 32).split("");
  digits[12] = "5";
  digits[16] = ((Number.parseInt(digits[16]!, 16) & 0x3) | 0x8).toString(16);
  const value = digits.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function assessGeographicHierarchyRepair(entries: readonly RepairEntry[]) {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const records = geographicHierarchyRepairManifest.map((expected) => {
    const actual = bySlug.get(expected.slug);
    if (!actual || actual.id !== expected.id || actual.title !== expected.title || actual.kind !== "REGION" || !["DRAFT", "PROPOSED", "CANON"].includes(actual.status)) {
      return { slug: expected.slug, state: "DRIFT" as const, expected, actual: actual ?? null };
    }
    const parent = geographicParent({ ...actual, placements: [], ownedMap: null });
    const type = geographicType({ ...actual, placements: [], ownedMap: null });
    const state = parent === expected.beforeParent && type === expected.beforeType
      ? "BEFORE"
      : parent === expected.finalParent && type === expected.finalType
        ? "AFTER"
        : "DRIFT";
    return { slug: expected.slug, state, expected, actual, parent, type };
  });
  const states = new Set(records.map((record) => record.state));
  const overall = states.size === 1 && states.has("BEFORE") ? "READY" : states.size === 1 && states.has("AFTER") ? "ALREADY_APPLIED" : "DRIFT";
  return { overall, records };
}

export function repairedGeographicMeta(meta: unknown, slug: string): Prisma.InputJsonValue {
  const expected = geographicHierarchyRepairManifest.find((entry) => entry.slug === slug);
  if (!expected) throw new Error(`No hierarchy repair contract exists for ${slug}.`);
  return { ...object(meta), parent: expected.finalParent, type: expected.finalType } as Prisma.InputJsonValue;
}

export async function captureAtlasPreservationSnapshot(client: Database) {
  const [maps, placements, nodePlacements, topologyNodes, boundaries, areaRings, boundaryReferences, worldConnections, connectionPaths] = await Promise.all([
    client.storyMap.findMany({ orderBy: { id: "asc" } }),
    client.storyMapPlacement.findMany({ orderBy: { id: "asc" } }),
    client.storyMapNodePlacement.findMany({ orderBy: { id: "asc" } }),
    client.storyMapTopologyNode.findMany({ orderBy: { id: "asc" } }),
    client.storyMapBoundary.findMany({ orderBy: { id: "asc" } }),
    client.storyMapAreaRing.findMany({ orderBy: { id: "asc" } }),
    client.storyMapAreaRingBoundary.findMany({ orderBy: [{ ringId: "asc" }, { sequence: "asc" }] }),
    client.storyWorldConnection.findMany({ orderBy: { id: "asc" } }),
    client.storyMapConnectionPath.findMany({ orderBy: { id: "asc" } }),
  ]);
  const value = { maps, placements, nodePlacements, topologyNodes, boundaries, areaRings, boundaryReferences, worldConnections, connectionPaths };
  return {
    counts: Object.fromEntries(Object.entries(value).map(([key, rows]) => [key, rows.length])),
    fingerprint: atlasSha256(stableAtlasJson(value, false)),
  };
}

export function assertRepairedHierarchy(entries: readonly GeographicEntry[], options: { requireBloomfallSubregions?: boolean } = {}) {
  const audit = auditGeographicHierarchy(entries);
  if (audit.missingParents.length || audit.selfParents.length || audit.cycles.length || audit.topLevelNestedUnderTopLevel.length || audit.suspicious.length) {
    throw new Error(`Repaired hierarchy failed integrity checks: ${stableAtlasJson({ missingParents: audit.missingParents, selfParents: audit.selfParents, cycles: audit.cycles, topLevelNestedUnderTopLevel: audit.topLevelNestedUnderTopLevel, suspicious: audit.suspicious }, false)}`);
  }
  const contracts = options.requireBloomfallSubregions === false
    ? Object.entries(verifiedGeographicParentContracts).filter(([slug]) => !["the-shattercore", "the-mutation-belt", "the-living-marsh"].includes(slug))
    : Object.entries(verifiedGeographicParentContracts);
  for (const [slug, expectedParent] of contracts) {
    const entry = audit.matrix.find((candidate) => candidate.slug === slug);
    if (!entry || entry.parent !== expectedParent) throw new Error(`Verified geographic parent contract failed for ${slug}: expected ${expectedParent}, received ${entry?.parent}.`);
  }
  return audit;
}
