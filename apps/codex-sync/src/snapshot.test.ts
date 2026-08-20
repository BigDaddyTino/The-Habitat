import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeCodexJson } from "./snapshot";

test("revision snapshots keep authored data but remove operational user and lock identifiers", () => {
  assert.deepEqual(
    sanitizeCodexJson({
      title: "The road",
      createdByUserId: "private",
      nested: { body: "Keep me", lockedByUserId: "private", values: [1, true, null] },
    }),
    { title: "The road", nested: { body: "Keep me", values: [1, true, null] } },
  );
});
