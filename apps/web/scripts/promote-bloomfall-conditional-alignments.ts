import "../lib/environment";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { createAtlasPersistenceService } from "../lib/atlas-persistence-service";
import { bloomfallPersistedRoutes, bloomfallRouteSceneSlug, bloomfallUnpersistedRouteCandidates } from "./lib/bloomfall-routes";
import {
  assertBloomfallProductionActivationTarget,
  captureBloomfallActivationSnapshot,
  loadBloomfallReleaseEvidence,
} from "./lib/bloomfall-production-activation";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";

/**
 * Promotes the Bloomfall conditional base alignments that Prompt D authored in
 * development into the production Atlas.
 *
 * It promotes geometry and its editorial condition metadata, and nothing else.
 * Opening and closing a conditional route stays future gameplay design: this
 * tool writes no state machine, no timers, and no alternate geometry per world
 * condition. The two alignments that production already draws are read, hashed,
 * and compared, never rewritten.
 *
 * The Atlas persistence service opens a transaction per validated write, so a
 * failure part-way through is repaired by deleting exactly what this run
 * created rather than leaving a half-promoted route behind.
 */

const promotionAuthorization = "I_AUTHORIZE_BLOOMFALL_CONDITIONAL_ATLAS_PROMOTION" as const;
const root = path.resolve(process.cwd(), "..", "..");

const promotable = bloomfallPersistedRoutes.filter((route) => route.authoringDecision === "AUTHOR_NOW");
const preserved = bloomfallPersistedRoutes.filter((route) => route.authoringDecision === "PRESERVE");

function geometrySha(geometry: unknown) {
  return atlasSha256(stableAtlasJson(geometry, false));
}

/** The logical identity of a promoted alignment: what it connects, where it
 *  runs, and the class it was authored under. Development and production must
 *  produce the same value or the promotion did not carry the same route. */
function routeFingerprint(input: { source: string; destination: string; scene: string; type: string; classification: string; geometry: unknown }) {
  return atlasSha256(stableAtlasJson({
    source: input.source, destination: input.destination, scene: input.scene,
    type: input.type, classification: input.classification, geometry: input.geometry,
  }, false));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  if (dryRun === apply) throw new Error("Bloomfall conditional alignment promotion requires exactly one of --dry-run or --apply.");

  const sourceUrl = process.env.BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL;
  const targetUrl = process.env.BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error("Explicit BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL and BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL are required.");
  const identity = assertBloomfallProductionActivationTarget(sourceUrl, targetUrl, process.env);
  if (process.env.BLOOMFALL_ATLAS_PROMOTION_CONFIRM !== promotionAuthorization) throw new Error("Bloomfall conditional alignment promotion requires its own explicit authorization token.");

  // Which routes the operator accepted. Each must be a Prompt D AUTHOR_NOW
  // conditional route; nothing else can be named.
  const accepted = (process.env.BLOOMFALL_ATLAS_ACCEPTED_ROUTES ?? "").split(",").map((key) => key.trim()).filter(Boolean);
  if (accepted.length === 0) throw new Error("BLOOMFALL_ATLAS_ACCEPTED_ROUTES must name at least one accepted route key.");
  for (const key of accepted) {
    const route = promotable.find((candidate) => candidate.key === key);
    if (!route) throw new Error(`${key} is not a Prompt D conditional alignment awaiting promotion.`);
    if (route.classification !== "CONDITIONAL") throw new Error(`${key} is not classified CONDITIONAL; refusing.`);
  }
  const selected = promotable.filter((route) => accepted.includes(route.key));

  const actualHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim().toLowerCase();
  if (execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()) throw new Error("Refusing to release from a dirty worktree.");
  const actualBuildId = (await readFile(path.join(root, "apps", "web", ".next", "BUILD_ID"), "utf8")).trim();
  const release = identity.mode === "PRODUCTION"
    ? await loadBloomfallReleaseEvidence(process.env, actualHead, actualBuildId, "BLOOMFALL_ATLAS")
    : { releaseHead: actualHead, buildId: actualBuildId, backupPath: "(rehearsal)", backupBytes: 0 };

  const database = createPrismaClient(targetUrl);
  const atlas = createAtlasPersistenceService(database);

  try {
    const identityRow = await database.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
    const scene = await database.storyMap.findUnique({ where: { slug: bloomfallRouteSceneSlug }, select: { id: true, slug: true, artVersion: true } });
    if (!scene) throw new Error("The Bloomfall local scene is missing.");
    if (identity.mode === "PRODUCTION" && scene.artVersion !== "v3") throw new Error(`The Bloomfall scene must remain on v3 art; found ${scene.artVersion}.`);

    const before = await captureBloomfallActivationSnapshot(database);
    if (identity.mode === "PRODUCTION") {
      const expected = process.env.BLOOMFALL_ATLAS_EXPECTED_BASELINE_FINGERPRINT?.trim().toLowerCase();
      if (!expected || expected !== before.logicalSha256) throw new Error(`Baseline fingerprint mismatch: expected ${expected ?? "missing"}, actual ${before.logicalSha256}.`);
    }

    const localPathsBefore = await database.storyMapConnectionPath.findMany({ where: { mapId: scene.id }, orderBy: { id: "asc" }, select: { id: true, geometry: true, connectionId: true, minZoom: true, maxZoom: true, priority: true } });
    const preservedBefore = preserved.map((route) => {
      const row = localPathsBefore.find((candidate) => candidate.id === route.pathId);
      if (!row) throw new Error(`Established production path ${route.key} is missing; refusing to promote alongside it.`);
      if (geometrySha(row.geometry) !== geometrySha(route.geometry)) throw new Error(`Established path ${route.key} no longer matches its approved geometry.`);
      return { key: route.key, pathId: row.id, geometrySha256: geometrySha(row.geometry) };
    });

    // Every accepted route must be genuinely absent, and every route this run
    // is not promoting must stay absent.
    const plan: Array<{ key: string; createConnection: boolean; createPath: boolean }> = [];
    for (const route of selected) {
      const connection = await database.storyWorldConnection.findUnique({ where: { id: route.connectionId } });
      const pathRow = await database.storyMapConnectionPath.findUnique({ where: { id: route.pathId } });
      if (pathRow) {
        if (geometrySha(pathRow.geometry) !== geometrySha(route.geometry)) throw new Error(`${route.key} already exists in production with different geometry.`);
        plan.push({ key: route.key, createConnection: false, createPath: false });
        continue;
      }
      if (connection) {
        const metadata = connection.metadata as { routeKey?: string } | null;
        if (metadata?.routeKey !== route.key) throw new Error(`${route.key} connection id is occupied by another route.`);
      }
      plan.push({ key: route.key, createConnection: !connection, createPath: true });
    }
    const notPromoted = promotable.filter((route) => !accepted.includes(route.key));
    for (const route of notPromoted) {
      if (await database.storyMapConnectionPath.findUnique({ where: { id: route.pathId } })) throw new Error(`${route.key} was not accepted but already exists in the target.`);
    }
    // Dynamic and deferred candidates never acquire base geometry.
    for (const candidate of bloomfallUnpersistedRouteCandidates) {
      const leaked = await database.storyWorldConnection.count({ where: { metadata: { path: ["routeKey"], equals: candidate.key } } });
      if (leaked > 0) throw new Error(`${candidate.classification} route ${candidate.key} has acquired a persisted connection.`);
    }

    const mutations = plan.filter((row) => row.createConnection || row.createPath).length;
    const summary = {
      exactTarget: identity.target,
      mode: identity.mode,
      database: identityRow[0]?.database,
      scene: { id: scene.id, slug: scene.slug, artVersion: scene.artVersion },
      baselineFingerprint: before.logicalSha256,
      localPathsBefore: localPathsBefore.length,
      preserved: preservedBefore,
      accepted: selected.map((route) => ({
        key: route.key, source: route.source, destination: route.destination, via: route.via,
        type: route.type, classification: route.classification,
        connectionId: route.connectionId, pathId: route.pathId,
        vertices: (route.geometry as unknown as { coordinates: readonly unknown[] }).coordinates.length,
        geometrySha256: geometrySha(route.geometry),
        routeFingerprint: routeFingerprint({ source: route.source, destination: route.destination, scene: scene.slug, type: route.type, classification: route.classification, geometry: route.geometry }),
        conditionOwner: route.metadata.conditionOwner,
        systemDependencies: route.metadata.systemDependencies,
      })),
      keptDevelopmentOnly: notPromoted.map((route) => route.key),
      plan,
    };

    if (dryRun) {
      process.stdout.write(stableAtlasJson({
        contract: "martino-bloomfall-conditional-alignment-promotion",
        contractVersion: 1, action: "DRY_RUN", writes: 0, identity, release, summary,
        plannedMutations: mutations,
        result: mutations === 0 ? "ALREADY_APPLIED" : "READY",
      }));
      return;
    }

    if (mutations === 0) {
      process.stdout.write(stableAtlasJson({
        contract: "martino-bloomfall-conditional-alignment-promotion",
        contractVersion: 1, action: "PROMOTE", status: "ALREADY_APPLIED", mutations: 0, identity, release, summary,
      }));
      return;
    }

    const actor = await database.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
    if (!actor) throw new Error("Promotion requires an active administrator for audit authorship.");

    const createdConnections: string[] = [];
    const createdPaths: string[] = [];
    try {
      for (const route of selected) {
        const step = plan.find((row) => row.key === route.key)!;
        if (step.createConnection) {
          const entries = await database.storyEntry.findMany({ where: { slug: { in: [route.source, route.destination] } }, select: { id: true, slug: true, kind: true } });
          const from = entries.find((entry) => entry.slug === route.source);
          const to = entries.find((entry) => entry.slug === route.destination);
          if (!from || !to || from.kind !== "REGION" || to.kind !== "REGION") throw new Error(`${route.key} endpoints are not both REGION entries.`);
          await atlas.createWorldConnection({
            id: route.connectionId, fromEntryId: from.id, toEntryId: to.id, type: route.type,
            directionality: "BIDIRECTIONAL", status: "UNSPECIFIED", visibility: "DEFAULT",
            originalWording: route.originalWording, editorialNotes: route.editorialNotes,
            metadata: route.metadata, actorUserId: actor.id,
          });
          createdConnections.push(route.connectionId);
        }
        if (step.createPath) {
          await atlas.createConnectionPath({
            id: route.pathId, connectionId: route.connectionId, mapId: scene.id,
            geometry: route.geometry, minZoom: route.minZoom, maxZoom: route.maxZoom,
            priority: route.priority, actorUserId: actor.id,
          });
          createdPaths.push(route.pathId);
        }
      }
    } catch (error) {
      for (const id of [...createdPaths].reverse()) {
        const row = await database.storyMapConnectionPath.findUnique({ where: { id }, select: { version: true } });
        if (row) await atlas.deleteConnectionPath(id, row.version, actor.id);
      }
      for (const id of [...createdConnections].reverse()) {
        const row = await database.storyWorldConnection.findUnique({ where: { id }, select: { version: true } });
        if (row) await atlas.deleteWorldConnection(id, row.version, actor.id);
      }
      throw new Error(`Promotion failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`);
    }

    const localPathsAfter = await database.storyMapConnectionPath.findMany({ where: { mapId: scene.id }, orderBy: { id: "asc" }, select: { id: true, geometry: true } });
    const preservedAfter = preservedBefore.map((row) => {
      const current = localPathsAfter.find((candidate) => candidate.id === row.pathId);
      if (!current || geometrySha(current.geometry) !== row.geometrySha256) throw new Error(`Established path ${row.key} changed during promotion.`);
      return row;
    });
    const promotedVerified = selected.map((route) => {
      const current = localPathsAfter.find((candidate) => candidate.id === route.pathId);
      if (!current) throw new Error(`${route.key} did not persist.`);
      const sha = geometrySha(current.geometry);
      if (sha !== geometrySha(route.geometry)) throw new Error(`${route.key} persisted with different geometry.`);
      return { key: route.key, pathId: route.pathId, geometrySha256: sha };
    });
    const after = await captureBloomfallActivationSnapshot(database);

    process.stdout.write(stableAtlasJson({
      contract: "martino-bloomfall-conditional-alignment-promotion",
      contractVersion: 1, action: "PROMOTE", status: "APPLIED",
      identity, release, actorUserId: actor.id, summary,
      mutations, createdConnections, createdPaths,
      localPathsBefore: localPathsBefore.length, localPathsAfter: localPathsAfter.length,
      preservedUnchanged: preservedAfter, promotedVerified,
      afterFingerprint: after.logicalSha256,
      connectionPathsAfter: after.counts.connectionPaths,
      runtimeConditionLogic: 0, artChanges: 0, topologyChanges: 0,
    }));
  } finally {
    await database.$disconnect();
  }
}

void main();
