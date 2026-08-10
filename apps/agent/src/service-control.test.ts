import assert from "node:assert/strict";
import test from "node:test";
import { parseServiceState } from "./service-control.js";

test("parses only Windows service states from sc output", () => {
  assert.equal(parseServiceState("STATE              : 4  RUNNING"), "RUNNING");
  assert.equal(parseServiceState("STATE              : 1  STOPPED"), "STOPPED");
  assert.equal(parseServiceState("STATE              : 2  START_PENDING"), "PENDING");
  assert.equal(parseServiceState("anything else"), "UNKNOWN");
});
