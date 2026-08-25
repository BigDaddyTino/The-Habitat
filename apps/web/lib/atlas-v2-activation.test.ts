import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2ActivationTarget, atlasV2ArtifactHashes, verifyAtlasV2ArtifactHash } from "../scripts/lib/atlas-v2-activation";
import { resolveAtlasProjectionVersion } from "./atlas-v2-feature";

const root = path.resolve(process.cwd(), "..", "..");

test("activation accepts only locked artifacts and rejects drift", async () => {
  const bytes = await readFile(path.join(root, "Docs", "atlas-migration-rehearsal", "atlas-v2-topology-manifest.json"));
  assert.equal(verifyAtlasV2ArtifactHash("topologyManifest", bytes), atlasV2ArtifactHashes.topologyManifest);
  assert.throws(() => verifyAtlasV2ArtifactHash("topologyManifest", Buffer.concat([bytes, Buffer.from("drift")])), /hash mismatch.*Activation refused/);
});

test("activation target guard separates disposable rehearsal from active development and refuses production", () => {
  const source = "postgresql://user:secret@localhost:5432/habitat";
  assert.equal(assertAtlasV2ActivationTarget(source, "postgresql://user:secret@localhost:5432/habitat_atlas_p7_activation_test", {}).mode, "ISOLATED_REHEARSAL");
  assert.throws(() => assertAtlasV2ActivationTarget(source, source, { AUTH_URL: "https://habitat.martinobear.com", ATLAS_V2_ACTIVATION_ENVIRONMENT: "development", ATLAS_V2_ACTIVATION_CONFIRM_DATABASE: "habitat" }), /deployed production service/);
  assert.throws(() => assertAtlasV2ActivationTarget(source, source, { AUTH_URL: "http://localhost:3000" }), /requires ATLAS_V2_ACTIVATION_ENVIRONMENT/);
  assert.equal(assertAtlasV2ActivationTarget(source, source, { AUTH_URL: "http://localhost:3000", ATLAS_V2_ACTIVATION_ENVIRONMENT: "development", ATLAS_V2_ACTIVATION_CONFIRM_DATABASE: "habitat" }).mode, "ACTIVE_DEVELOPMENT");
});

test("persistent development requires an explicit local identity and cannot masquerade as production", () => {
  const source = "postgresql://user:secret@localhost:5432/habitat";
  const development = "postgresql://user:secret@localhost:5432/habitat_atlas_dev";
  const environment = { HABITAT_ENVIRONMENT: "development", ATLAS_V2_ACTIVATION_ENVIRONMENT: "development", ATLAS_V2_ACTIVATION_CONFIRM_DATABASE: "habitat_atlas_dev" };
  assert.equal(assertAtlasPersistentDevelopmentTarget(development, environment).database, "habitat_atlas_dev");
  assert.equal(assertAtlasV2ActivationTarget(source, development, environment).mode, "PERSISTENT_DEVELOPMENT");
  assert.throws(() => assertAtlasPersistentDevelopmentTarget(source, environment), /requires database habitat_atlas_dev/);
  assert.equal(assertAtlasPersistentDevelopmentTarget(development, { ATLAS_V2_ACTIVATION_ENVIRONMENT: "development" }).database, "habitat_atlas_dev");
  assert.throws(() => assertAtlasV2ActivationTarget(development, development, environment), /distinct from the target/);
});

test("V2 is server-controlled, administrator-only, and V1 remains the fallback", () => {
  const enabled = { HABITAT_ATLAS_V2_INTERNAL_ENABLED: "true" };
  assert.equal(resolveAtlasProjectionVersion({ requested: "v2", role: "ADMIN", environment: enabled }), "V2");
  assert.equal(resolveAtlasProjectionVersion({ requested: "v2", role: "USER", environment: enabled }), "V1");
  assert.equal(resolveAtlasProjectionVersion({ requested: "v2", role: "ADMIN", environment: {} }), "V1");
  assert.equal(resolveAtlasProjectionVersion({ requested: null, role: "ADMIN", environment: enabled }), "V1");
});

test("activation remains explicit, serializable, idempotent, audited, and seed-guarded", async () => {
  const activation = await readFile(path.join(root, "apps", "web", "scripts", "lib", "atlas-v2-activation.ts"), "utf8");
  const command = await readFile(path.join(root, "apps", "web", "scripts", "activate-atlas-v2.ts"), "utf8");
  const seed = await readFile(path.join(root, "apps", "web", "scripts", "seed-story-atlas.ts"), "utf8");
  assert.match(command, /ATLAS_V2_ACTIVATION_DATABASE_URL/);
  assert.match(command, /--prove-rollback/);
  assert.match(activation, /isolationLevel: "Serializable"/);
  assert.match(activation, /ALREADY_ACTIVATED/);
  assert.match(activation, /counts conflict/);
  for (const entity of ["TOPO_NODE", "BOUNDARY", "AREA_RING", "WORLD_CONN"]) assert.match(activation, new RegExp(`entityType: "${entity}"`));
  assert.match(seed, /Refusing destructive Atlas seed reconciliation while activated V2 data exists/);
  assert.match(seed, /--allow-activated-v2/);
});
