import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  atlasBoundaryKinds,
  atlasConnectionDirectionalities,
  atlasConnectionStatuses,
  atlasConnectionVisibilityPolicies,
  atlasWorldConnectionTypes,
  validateAtlasWorldConnection,
} from "@habitat/shared";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
const schemaPath = path.join(repositoryRoot, "packages", "db", "prisma", "schema.prisma");
const migrationPath = path.join(repositoryRoot, "packages", "db", "prisma", "migrations", "20260824230000_add_atlas_topology_connections", "migration.sql");

test("Prisma persistence vocabularies exactly match the shared Atlas contract", async () => {
  const schema = await readFile(schemaPath, "utf8");
  const enumValues = (name: string) => {
    const body = schema.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\}`))?.[1];
    assert.ok(body, `missing ${name}`);
    return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  };
  assert.deepEqual(enumValues("StoryMapBoundaryKind"), [...atlasBoundaryKinds]);
  assert.deepEqual(enumValues("StoryWorldConnectionType"), [...atlasWorldConnectionTypes]);
  assert.deepEqual(enumValues("StoryWorldConnectionDirectionality"), [...atlasConnectionDirectionalities]);
  assert.deepEqual(enumValues("StoryWorldConnectionStatus"), [...atlasConnectionStatuses]);
  assert.deepEqual(enumValues("StoryWorldConnectionVisibility"), [...atlasConnectionVisibilityPolicies]);
  assert.deepEqual(enumValues("StoryMapAreaRingRole"), ["SHELL", "HOLE"]);
  assert.deepEqual(enumValues("StoryMapConnectionPathGeometryKind"), ["LINESTRING", "MULTILINESTRING"]);
});

test("schema encodes deliberate identity, ordering, indexing, and restrictive-delete policy", async () => {
  const schema = await readFile(schemaPath, "utf8");
  for (const model of ["StoryMapTopologyNode", "StoryMapBoundary", "StoryMapAreaRing", "StoryMapAreaRingBoundary", "StoryWorldConnection", "StoryMapConnectionPath"]) assert.match(schema, new RegExp(`model ${model} \\{`));
  assert.match(schema, /@@unique\(\[mapId, x, y\]\)/, "base topology has one canonical node at an exact map coordinate");
  assert.match(schema, /@@unique\(\[placementId, componentIndex, ringIndex\]\)/);
  assert.match(schema, /@@id\(\[ringId, boundaryId\]\)/);
  assert.match(schema, /@@unique\(\[ringId, sequence\]\)/);
  assert.match(schema, /@@unique\(\[connectionId, mapId\]\)/);
  assert.doesNotMatch(schema.match(/model StoryWorldConnection \{[\s\S]*?\n\}/)?.[0] ?? "", /@@unique\(\[fromEntryId/, "multiple connections between the same endpoints remain valid");
  const atlasModels = schema.slice(schema.indexOf("model StoryMapTopologyNode"), schema.indexOf("model StoryEntryLink"));
  assert.doesNotMatch(atlasModels, /onDelete: Cascade/);
  assert.match(atlasModels, /onDelete: Restrict/);
});

test("migration is additive and adds database-checkable invariants without legacy data writes", async () => {
  const migration = await readFile(migrationPath, "utf8");
  assert.doesNotMatch(migration, /\b(?:DROP TABLE|DROP COLUMN|TRUNCATE|INSERT INTO|UPDATE\s+"|DELETE FROM)\b/i);
  assert.match(migration, /StoryMapTopologyNode_coordinate_check/);
  assert.match(migration, /StoryMapBoundary_distinct_nodes_check/);
  assert.match(migration, /StoryMapAreaRing_role_index_check/);
  assert.match(migration, /StoryWorldConnection_distinct_endpoints_check/);
  assert.match(migration, /StoryMapConnectionPath_zoom_check/);
  assert.match(migration, /'TOPO_NODE'.*'BOUNDARY'.*'AREA_RING'.*'WORLD_CONN'.*'CONN_PATH'/s);
  const statements = migration.replace(/^--.*$/gm, "");
  assert.doesNotMatch(statements, /StoryMapPlacement"\s+(?:SET|ALTER)|meta\.connections|REGION\.meta/i);
});

test("same-endpoint routes are refused while multiple separately identified routes remain representable", () => {
  const base = {
    id: "first-route",
    fromEntryId: "alpha",
    toEntryId: "beta",
    type: "ROAD" as const,
    directionality: "FROM_TO" as const,
    status: "OPEN" as const,
    visibility: "DEFAULT" as const,
    originalWording: "coast road",
    editorialNotes: null,
    metadata: {},
    version: 1,
  };
  assert.equal(validateAtlasWorldConnection(base).valid, true);
  assert.equal(validateAtlasWorldConnection({ ...base, id: "second-route" }).valid, true);
  assert.ok(validateAtlasWorldConnection({ ...base, toEntryId: "alpha" }).findings.some((finding) => finding.code === "CONNECTION_SAME_ENDPOINT"));
});

test("server persistence is internal, transactional, version-guarded, and reuses StoryRevision", async () => {
  const service = await readFile(path.join(process.cwd(), "lib", "atlas-persistence-service.ts"), "utf8");
  const binding = await readFile(path.join(process.cwd(), "lib", "atlas-persistence.ts"), "utf8");
  assert.match(binding, /import "server-only"/);
  assert.match(service, /client\.\$transaction/);
  assert.match(service, /isolationLevel: "Serializable"/);
  assert.match(service, /FOR UPDATE/, "whole-placement topology replacement locks its aggregate before comparing ring versions");
  assert.match(service, /updateMany\(\{ where: \{ id: [^}]+version: input\.expectedVersion/);
  assert.match(service, /STALE_VERSION/);
  assert.match(service, /tx\.storyRevision\.create/);
  assert.doesNotMatch(service, /REGION\.meta\.connections|story-atlas\.tsx|getStoryAtlasProjection/);
});
