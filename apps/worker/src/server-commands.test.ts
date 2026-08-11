import assert from "node:assert/strict";
import test from "node:test";
import { dispatchAuthorizedServerCommands, type ServerCommandRepository } from "./server-commands.js";

test("the worker claims a command before dispatching exactly one fixed action", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "start" }],
    claim: async (id) => { calls.push(`claim:${id}`); return true; },
    succeeded: async (id) => { calls.push(`succeeded:${id}`); },
    failed: async (id) => { calls.push(`failed:${id}`); },
  });
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async (key, action) => ({ key, action, accepted: true, executedAt: new Date().toISOString(), serviceState: "RUNNING", detail: "requested" }) });
  assert.deepEqual(result, { dispatched: 1, succeeded: 1, failed: 0 });
  assert.deepEqual(calls, ["claim:command-1", "succeeded:command-1"]);
});

test("the worker does not retry an action when the agent rejects it", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "update" }],
    succeeded: async () => { calls.push("succeeded"); },
    failed: async (_id, code) => { calls.push(code); },
  });
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async (key, action) => ({ key, action, accepted: false, executedAt: new Date().toISOString(), serviceState: "RUNNING", detail: "server_service_must_be_stopped" }) });
  assert.deepEqual(result, { dispatched: 1, succeeded: 0, failed: 1 });
  assert.deepEqual(calls, ["operation_conflict"]);
});

test("a connection-level dispatch failure defers the command for a later retry", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "restart" }],
    failed: async (_id, code) => { calls.push(`failed:${code}`); },
    deferForRetry: async (id) => { calls.push(`deferred:${id}`); return "deferred"; },
  });
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async () => { throw new TypeError("fetch failed"); } });
  assert.deepEqual(result, { dispatched: 1, succeeded: 0, failed: 0 });
  assert.deepEqual(calls, ["deferred:command-1"]);
});

test("a timeout after the action was sent is terminal with an indeterminate-outcome reason", async () => {
  const calls: string[] = [];
  const repository: ServerCommandRepository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "restart" }],
    failed: async (_id, code) => { calls.push(`failed:${code}`); },
    deferForRetry: async (id) => { calls.push(`deferred:${id}`); return "deferred"; },
  });
  const timeout = new Error("The operation was aborted due to timeout");
  timeout.name = "TimeoutError";
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async () => { throw timeout; } });
  assert.deepEqual(result, { dispatched: 1, succeeded: 0, failed: 1 });
  assert.deepEqual(calls, ["failed:agent_timeout_outcome_unknown"]);
});

function fakeRepository(overrides: Partial<ServerCommandRepository>): ServerCommandRepository {
  return {
    sweepStaleDispatched: async () => 0,
    findAuthorized: async () => [],
    claim: async () => true,
    succeeded: async () => undefined,
    failed: async () => undefined,
    deferForRetry: async () => "deferred",
    ...overrides,
  };
}
