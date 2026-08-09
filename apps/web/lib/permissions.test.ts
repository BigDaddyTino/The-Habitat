import assert from "node:assert/strict";
import test from "node:test";
import { hasRequiredRole } from "./permissions";

test("VIEWER cannot perform USER actions", () => {
  assert.equal(hasRequiredRole("VIEWER", "USER"), false);
});

test("USER cannot perform ADMIN actions", () => {
  assert.equal(hasRequiredRole("USER", "ADMIN"), false);
});

test("ADMIN can perform every role action", () => {
  assert.equal(hasRequiredRole("ADMIN", "VIEWER"), true);
  assert.equal(hasRequiredRole("ADMIN", "USER"), true);
  assert.equal(hasRequiredRole("ADMIN", "ADMIN"), true);
});
