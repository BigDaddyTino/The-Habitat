import assert from "node:assert/strict";
import test from "node:test";
import { assertAtlasAuthoringEnvironment, atlasAuthoringEnvironmentAvailable } from "./atlas-authoring-environment";

const safe = { HABITAT_ENVIRONMENT: "development", HABITAT_ATLAS_AUTHORING_ENABLED: "true", HABITAT_ATLAS_V2_INTERNAL_ENABLED: "true", DATABASE_URL: "postgresql://user:secret@localhost:5432/habitat_atlas_dev" };

test("Atlas authoring accepts only the explicit persistent development database", () => {
  assert.equal(assertAtlasAuthoringEnvironment(safe).database, "habitat_atlas_dev");
  assert.equal(atlasAuthoringEnvironmentAvailable(safe), true);
  for (const environment of [{ ...safe, HABITAT_ENVIRONMENT: "production" }, { ...safe, DATABASE_URL: "postgresql://user:secret@localhost:5432/habitat" }, { ...safe, DATABASE_URL: "postgresql://user:secret@db.example.test:5432/habitat_atlas_dev" }, { ...safe, HABITAT_ATLAS_AUTHORING_ENABLED: "false" }]) assert.throws(() => assertAtlasAuthoringEnvironment(environment));
  assert.equal(atlasAuthoringEnvironmentAvailable({ ...safe, HABITAT_ENVIRONMENT: "production" }), false);
});
