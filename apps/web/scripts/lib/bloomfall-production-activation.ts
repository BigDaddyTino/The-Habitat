import { stat } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { bloomfallReachCanon } from "@habitat/shared";
import { bloomfallV3Assets } from "../../lib/bloomfall-v3-art";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";
import { geographicHierarchyRepairManifest } from "./geographic-hierarchy-repair";

type Database = ReturnType<typeof createPrismaClient>;

export const bloomfallProductionDatabase = "habitat" as const;
export const bloomfallProductionOwnerAuthorization = "I_AUTHORIZE_BLOOMFALL_V3_PRODUCTION_ACTIVATION" as const;
export const bloomfallRehearsalAuthorization = "I_AUTHORIZE_DISPOSABLE_BLOOMFALL_V3_REHEARSAL" as const;
export const bloomfallActivationUrlVariable = "BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL" as const;

export type BloomfallActivationMode = "PRODUCTION" | "ISOLATED_REHEARSAL";

export function bloomfallDatabaseIdentity(value: string) {
  const url = new URL(value);
  return { hostname: url.hostname.toLowerCase(), port: url.port || "5432", database: url.pathname.slice(1) };
}

function sameServer(left: ReturnType<typeof bloomfallDatabaseIdentity>, right: ReturnType<typeof bloomfallDatabaseIdentity>) {
  return left.hostname === right.hostname && left.port === right.port;
}

export function assertBloomfallProductionActivationTarget(sourceUrl: string, targetUrl: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const source = bloomfallDatabaseIdentity(sourceUrl);
  const target = bloomfallDatabaseIdentity(targetUrl);
  if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname)) throw new Error("Bloomfall activation is restricted to a loopback PostgreSQL target.");
  if (!sameServer(source, target) || source.database !== bloomfallProductionDatabase) throw new Error("Bloomfall activation requires the canonical habitat database as its source identity on the same server.");

  if (/^habitat_bloomfall_v3_rehearsal_[a-z0-9_]+$/.test(target.database)) {
    if (environment.HABITAT_ENVIRONMENT !== "development" || environment.BLOOMFALL_PRODUCTION_ACTIVATION_MODE !== "rehearsal") throw new Error("Disposable rehearsal requires development environment and explicit rehearsal mode.");
    if (environment.BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM !== bloomfallRehearsalAuthorization) throw new Error("Disposable rehearsal requires the exact rehearsal authorization token.");
    return { mode: "ISOLATED_REHEARSAL" as const, source, target };
  }

  if (target.database !== bloomfallProductionDatabase || stableAtlasJson(source, false) !== stableAtlasJson(target, false)) throw new Error("Production mode requires the explicit canonical habitat database URL; development databases and aliases are refused.");
  if (environment.HABITAT_ENVIRONMENT !== "production" || environment.BLOOMFALL_PRODUCTION_ACTIVATION_MODE !== "production") throw new Error("Production Bloomfall activation requires HABITAT_ENVIRONMENT=production and explicit production mode.");
  if (environment.BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM_DATABASE !== bloomfallProductionDatabase) throw new Error("Production Bloomfall activation requires exact canonical database confirmation.");
  if (environment.BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM !== bloomfallProductionOwnerAuthorization) throw new Error("Production Bloomfall activation requires the exact owner-authorization token.");
  return { mode: "PRODUCTION" as const, source, target };
}

/** Which release a set of evidence variables belongs to. Each promotion reads
 *  its own names so a stale token cannot authorise a later cutover. */
export type BloomfallReleasePrefix = "BLOOMFALL_V3" | "BLOOMFALL_CODEX" | "BLOOMFALL_ATLAS";

export type BloomfallReleaseEvidence = {
  actualHead: string;
  actualBuildId: string;
  backupPath: string;
  backupBytes: number;
  backupMtimeMs: number;
};

/**
 * Every Bloomfall production release proves the same four things before it is
 * allowed to write: the exact source commit, the exact build it produced, a
 * fresh custom-format backup at a named absolute path, and that the backup was
 * actually readable. The prefix selects which release is being gated, so a
 * stale token from an earlier cutover cannot authorise a later one.
 */
export function assertBloomfallReleaseEvidence(evidence: BloomfallReleaseEvidence, environment: Readonly<Record<string, string | undefined>> = process.env, now = Date.now(), prefix: BloomfallReleasePrefix = "BLOOMFALL_V3") {
  const expectedHead = environment[`${prefix}_RELEASE_HEAD`]?.trim().toLowerCase();
  if (!expectedHead || !/^[a-f0-9]{40}$/.test(expectedHead) || expectedHead !== evidence.actualHead.toLowerCase()) throw new Error(`Bloomfall release HEAD mismatch: expected ${expectedHead ?? "missing"}, actual ${evidence.actualHead}.`);
  const expectedBuildId = environment[`${prefix}_EXPECTED_BUILD_ID`]?.trim();
  if (!expectedBuildId || expectedBuildId !== evidence.actualBuildId) throw new Error(`Bloomfall production build identity mismatch: expected ${expectedBuildId ?? "missing"}, actual ${evidence.actualBuildId}.`);
  const expectedBackupPath = environment[`${prefix}_PRODUCTION_BACKUP_PATH`]?.trim();
  if (!expectedBackupPath || !path.isAbsolute(expectedBackupPath) || path.extname(expectedBackupPath).toLowerCase() !== ".dump" || path.resolve(expectedBackupPath) !== path.resolve(evidence.backupPath)) throw new Error("Bloomfall activation requires the exact absolute custom-format backup dump path.");
  if (evidence.backupBytes <= 0) throw new Error("Bloomfall activation backup evidence is empty.");
  if (now - evidence.backupMtimeMs > 2 * 60 * 60 * 1000 || evidence.backupMtimeMs > now + 60_000) throw new Error("Bloomfall activation backup evidence is not fresh.");
  if (environment[`${prefix}_BACKUP_VERIFICATION`] !== "PG_RESTORE_LIST_OK") throw new Error("Bloomfall activation requires successful pg_restore list verification.");
  return { releaseHead: evidence.actualHead.toLowerCase(), buildId: evidence.actualBuildId, backupPath: path.resolve(evidence.backupPath), backupBytes: evidence.backupBytes };
}

export async function loadBloomfallReleaseEvidence(environment: Readonly<Record<string, string | undefined>>, actualHead: string, actualBuildId: string, prefix: BloomfallReleasePrefix = "BLOOMFALL_V3") {
  const backupPath = environment[`${prefix}_PRODUCTION_BACKUP_PATH`]?.trim() ?? "";
  const backup = backupPath ? await stat(backupPath) : null;
  return assertBloomfallReleaseEvidence({ actualHead, actualBuildId, backupPath, backupBytes: backup?.size ?? 0, backupMtimeMs: backup?.mtimeMs ?? 0 }, environment, Date.now(), prefix);
}

export function assertBloomfallV3ArtLock(input: { selected: { v1: number; v2: number; v3: number }; assets: Array<{ id: string; sha256: string }> }) {
  if (input.selected.v1 !== 0 || input.selected.v2 !== 0 || input.selected.v3 !== 15) throw new Error("Bloomfall release selection must be exactly V1=0, V2=0, V3=15.");
  if (input.assets.length !== bloomfallV3Assets.length) throw new Error("Bloomfall V3 art package is incomplete.");
  for (const expected of bloomfallV3Assets) {
    const actual = input.assets.find((asset) => asset.id === expected.id);
    if (!actual || actual.sha256 !== expected.sha256) throw new Error(`Bloomfall V3 locked hash mismatch for ${expected.id}.`);
  }
}

export type BloomfallActivationSnapshot = Awaited<ReturnType<typeof captureBloomfallActivationSnapshot>>;

export async function captureBloomfallActivationSnapshot(database: Database) {
  const [placeholder, hierarchy, maps, storyEntries, storyMaps, placements, nodePlacements, topologyNodes, boundaries, rings, references, worldConnections, connectionPaths, arcs, revisions] = await Promise.all([
    database.storyEntry.findFirst({ where: { OR: [{ id: "a64869df-c623-49ec-9236-dd306a3fd5c7" }, { slug: { in: ["unknown-southeast", "bloomfall-reach"] } }] }, select: { id: true, slug: true, title: true, kind: true, status: true, version: true } }),
    database.storyEntry.findMany({ where: { id: { in: geographicHierarchyRepairManifest.map((entry) => entry.id) } }, orderBy: { id: "asc" }, select: { id: true, slug: true, meta: true } }),
    database.storyMap.findMany({ where: { slug: { in: ["martino-world", "martino-bloomfall-reach"] } }, orderBy: { slug: "asc" }, select: { slug: true, artVersion: true } }),
    database.storyEntry.count(), database.storyMap.count(), database.storyMapPlacement.count(), database.storyMapNodePlacement.count(), database.storyMapTopologyNode.count(), database.storyMapBoundary.count(), database.storyMapAreaRing.count(), database.storyMapAreaRingBoundary.count(), database.storyWorldConnection.count(), database.storyMapConnectionPath.count(), database.storyArc.count(), database.storyRevision.count(),
  ]);
  const hierarchyRows = hierarchy.map((entry) => { const meta = entry.meta as Record<string, unknown> | null; return { id: entry.id, slug: entry.slug, parent: typeof meta?.parent === "string" ? meta.parent : null, type: typeof meta?.type === "string" ? meta.type : null }; });
  const counts = { storyEntries, storyMaps, placements, nodePlacements, topologyNodes, boundaries, rings, references, worldConnections, connectionPaths, arcs };
  const value = { placeholder, hierarchy: hierarchyRows, maps, counts };
  return { ...value, revisions, logicalSha256: atlasSha256(stableAtlasJson(value, false)) };
}

const beforeCounts = { storyEntries: 175, storyMaps: 3, placements: 36, nodePlacements: 10, topologyNodes: 19, boundaries: 26, rings: 11, references: 43, worldConnections: 25, connectionPaths: 9, arcs: 7 };
const afterCounts = { storyEntries: 238, storyMaps: 4, placements: 54, nodePlacements: 10, topologyNodes: 27, boundaries: 36, rings: 14, references: 55, worldConnections: 27, connectionPaths: 11, arcs: 13 };
/**
 * The Codex systems integration adds the two dossiers Bloomfall had no page
 * for — Bloomstorms and Bloomfall Travel Conditions — and nothing else that
 * this snapshot counts. It is a later state of the same applied world, so the
 * V3 classifier must recognise it rather than read it as drift.
 */
const codexIntegrationCounts = { ...afterCounts, storyEntries: afterCounts.storyEntries + 2 };
const appliedCountSets = [afterCounts, codexIntegrationCounts];

function hierarchyExpected(snapshot: BloomfallActivationSnapshot, phase: "before" | "after") {
  return geographicHierarchyRepairManifest.every((expected) => {
    const slug = phase === "before" && expected.slug === bloomfallReachCanon.slug ? bloomfallReachCanon.formerDevelopmentPlaceholder.slug : expected.slug;
    const actual = snapshot.hierarchy.find((entry) => entry.id === expected.id);
    return actual?.slug === slug && actual.parent === (phase === "before" ? expected.beforeParent : expected.finalParent) && actual.type === (phase === "before" ? expected.beforeType : expected.finalType);
  });
}

export function classifyBloomfallActivationSnapshot(snapshot: BloomfallActivationSnapshot) {
  const before = snapshot.placeholder?.id === "a64869df-c623-49ec-9236-dd306a3fd5c7" && snapshot.placeholder.slug === "unknown-southeast" && snapshot.placeholder.title === "Unknown Southeast" && snapshot.placeholder.kind === "REGION" && snapshot.placeholder.status === "CANON" && stableAtlasJson(snapshot.counts, false) === stableAtlasJson(beforeCounts, false) && hierarchyExpected(snapshot, "before") && snapshot.maps.length === 1 && snapshot.maps[0]?.slug === "martino-world" && snapshot.maps[0].artVersion === "v1";
  if (before) return "BEFORE" as const;
  const after = snapshot.placeholder?.id === "a64869df-c623-49ec-9236-dd306a3fd5c7" && snapshot.placeholder.slug === "bloomfall-reach" && snapshot.placeholder.title === "Bloomfall Reach" && appliedCountSets.some((counts) => stableAtlasJson(snapshot.counts, false) === stableAtlasJson(counts, false)) && hierarchyExpected(snapshot, "after") && snapshot.maps.length === 2 && snapshot.maps.every((map) => map.artVersion === "v3");
  if (after) return "ALREADY_APPLIED" as const;
  throw new Error(`Bloomfall production baseline differs from both locked before and final states: ${stableAtlasJson(snapshot, false)}`);
}

export function assertBloomfallExpectedBaseline(snapshot: BloomfallActivationSnapshot, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const expected = environment.BLOOMFALL_V3_EXPECTED_BASELINE_FINGERPRINT?.trim().toLowerCase();
  if (!expected || !/^[a-f0-9]{64}$/.test(expected) || expected !== snapshot.logicalSha256) throw new Error(`Bloomfall baseline fingerprint mismatch: expected ${expected ?? "missing"}, actual ${snapshot.logicalSha256}.`);
  return classifyBloomfallActivationSnapshot(snapshot);
}
