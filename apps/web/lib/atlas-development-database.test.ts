import assert from "node:assert/strict";
import test from "node:test";
import { atlasDevelopmentDatabaseName, resolveAtlasDevelopmentDatabaseUrl } from "./atlas-development-database";

test("resolves the fixed local Atlas development database only after explicit opt-in", () => {
  assert.equal(
    resolveAtlasDevelopmentDatabaseUrl({
      HABITAT_ENVIRONMENT: "development",
      HABITAT_DEVELOPMENT_DATABASE: atlasDevelopmentDatabaseName,
      DATABASE_URL: "postgresql://habitat_app:password@localhost:5432/habitat?schema=public"
    }),
    "postgresql://habitat_app:password@localhost:5432/habitat_atlas_dev?schema=public"
  );
});

test("does not redirect a normal or production process", () => {
  assert.equal(resolveAtlasDevelopmentDatabaseUrl({ DATABASE_URL: "postgresql://habitat_app:password@localhost:5432/habitat" }), null);
  assert.equal(resolveAtlasDevelopmentDatabaseUrl({ HABITAT_ENVIRONMENT: "production", DATABASE_URL: "postgresql://habitat_app:password@localhost:5432/habitat" }), null);
});

test("refuses an unrecognized development target or non-loopback source", () => {
  assert.throws(
    () => resolveAtlasDevelopmentDatabaseUrl({ HABITAT_ENVIRONMENT: "development", HABITAT_DEVELOPMENT_DATABASE: "habitat", DATABASE_URL: "postgresql://habitat_app:password@localhost:5432/habitat" }),
    /HABITAT_DEVELOPMENT_DATABASE/
  );
  assert.throws(
    () => resolveAtlasDevelopmentDatabaseUrl({ HABITAT_ENVIRONMENT: "development", HABITAT_DEVELOPMENT_DATABASE: atlasDevelopmentDatabaseName, DATABASE_URL: "postgresql://habitat_app:password@db.example.test:5432/habitat" }),
    /loopback/
  );
});
