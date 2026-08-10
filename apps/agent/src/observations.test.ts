import assert from "node:assert/strict";
import test from "node:test";
import { observeProcess } from "./observations.js";

test("Windows process observation sees the agent's Node runtime", { skip: process.platform !== "win32" }, async () => {
  const observation = await observeProcess("node");
  assert.equal(observation.running, true);
  assert.ok(observation.processCount > 0);
  assert.ok(observation.memoryBytes !== null && observation.memoryBytes > 0);
});
