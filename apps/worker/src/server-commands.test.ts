import assert from "node:assert/strict";
import test from "node:test";
import { dispatchAuthorizedServerCommands, type ServerCommandRepository } from "./server-commands.js";

test("the worker claims a command before dispatching exactly one fixed action", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = {
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "start" }],
    claim: async (id) => { calls.push(`claim:${id}`); return true; },
    succeeded: async (id) => { calls.push(`succeeded:${id}`); },
    failed: async (id) => { calls.push(`failed:${id}`); },
  };
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async (key, action) => ({ key, action, accepted: true, executedAt: new Date().toISOString(), serviceState: "RUNNING", detail: "requested" }) });
  assert.deepEqual(result, { dispatched: 1, succeeded: 1, failed: 0 });
  assert.deepEqual(calls, ["claim:command-1", "succeeded:command-1"]);
});

test("the worker does not retry an action when the agent rejects it", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = {
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "update" }],
    claim: async () => true,
    succeeded: async () => { calls.push("succeeded"); },
    failed: async (_id, code) => { calls.push(code); },
  };
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async (key, action) => ({ key, action, accepted: false, executedAt: new Date().toISOString(), serviceState: "RUNNING", detail: "server_service_must_be_stopped" }) });
  assert.deepEqual(result, { dispatched: 1, succeeded: 0, failed: 1 });
  assert.deepEqual(calls, ["operation_conflict"]);
});
