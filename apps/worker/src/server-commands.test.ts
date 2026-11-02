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
  const result = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }); } });
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
    findRunningUpdates: async () => [],
    updateStarted: async () => undefined,
    updateProgress: async () => undefined,
    claim: async () => true,
    succeeded: async () => undefined,
    failed: async () => undefined,
    deferForRetry: async () => "deferred",
    ...overrides,
  };
}

const operationId = "89f7138a-10ad-48fd-9d76-55729ba00123";
const stamp = new Date().toISOString();

test("an accepted updater remains running rather than immediately succeeding", async () => {
  const calls: string[] = [];
  const repository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "update" }],
    updateStarted: async (_id, result) => { calls.push(`started:${result.operationId}`); },
    succeeded: async () => { assert.fail("Update is still running"); },
  });
  const counts = await dispatchAuthorizedServerCommands(repository, { requestServerAction: async (key, action) => ({ key, action, accepted: true, executedAt: stamp, serviceState: "PENDING", detail: "update_started", operationId }) });
  assert.deepEqual(counts, { dispatched: 1, succeeded: 0, failed: 0 });
  assert.deepEqual(calls, [`started:${operationId}`]);
});

for (const phase of ["STOPPING", "UPDATING", "STARTING", "SUCCEEDED", "FAILED"] as const) {
  test(`an existing update records ${phase} without re-sending the operation`, async () => {
    const status = { operationId, phase, startedAt: stamp, updatedAt: stamp, errorCode: phase === "FAILED" ? "server_start_failed" : null };
    let recorded = false;
    const repository = fakeRepository({
      findRunningUpdates: async () => [{ id: "command-1", serverKey: "valheim", action: "update", operationId }],
      updateProgress: async (_id, progress) => { assert.deepEqual(progress, status); recorded = true; },
    });
    const counts = await dispatchAuthorizedServerCommands(repository, {
      requestServerAction: async () => { assert.fail("Do not resend updates"); },
      readUpdateStatus: async () => status,
    });
    assert.equal(recorded, true);
    assert.deepEqual(counts, { dispatched: 0, succeeded: phase === "SUCCEEDED" ? 1 : 0, failed: phase === "FAILED" ? 1 : 0 });
  });
}

test("status fetch failure preserves a running update for the next poll", async () => {
  const repository = fakeRepository({
    findRunningUpdates: async () => [{ id: "command-1", serverKey: "valheim", action: "update", operationId }],
    updateProgress: async () => { assert.fail("No status available"); },
    failed: async () => { assert.fail("Do not fail a running update on a transient status error"); },
  });
  const counts = await dispatchAuthorizedServerCommands(repository, {
    requestServerAction: async () => { assert.fail("Do not resend updates"); },
    readUpdateStatus: async () => { throw new Error("Connection unavailable"); },
  });
  assert.deepEqual(counts, { dispatched: 0, succeeded: 0, failed: 0 });
});

test("a different operation's success cannot complete the queued update", async () => {
  const codes: string[] = [];
  const repository = fakeRepository({
    findRunningUpdates: async () => [{ id: "command-1", serverKey: "valheim", action: "update", operationId }],
    failed: async (_id, code) => { codes.push(code); },
    updateProgress: async () => { assert.fail("Wrong operation ID"); },
  });
  await dispatchAuthorizedServerCommands(repository, {
    requestServerAction: async () => { assert.fail("Do not resend updates"); },
    readUpdateStatus: async () => ({ operationId: "old-operation", phase: "SUCCEEDED", startedAt: stamp, updatedAt: stamp, errorCode: null }),
  });
  assert.deepEqual(codes, ["update_operation_mismatch"]);
});

test("a generic connection reset is not safe to retry after sending an operation", async () => {
  let failures = 0;
  const repository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "valheim", action: "restart" }],
    deferForRetry: async () => { assert.fail("The mutation may have reached the agent"); },
    failed: async () => { failures += 1; },
  });
  await dispatchAuthorizedServerCommands(repository, { requestServerAction: async () => { throw new TypeError("fetch failed"); } });
  assert.equal(failures, 1);
});

test("a precise agent stop failure is recorded without automatic retry", async () => {
  const { AgentActionError } = await import("./agent-client.js");
  const codes: string[] = [];
  const repository = fakeRepository({
    findAuthorized: async () => [{ id: "command-1", serverKey: "dragonwilds", action: "stop" }],
    failed: async (_id, code) => { codes.push(code); },
    deferForRetry: async () => { assert.fail("Do not retry a service that failed to stop"); },
  });
  await dispatchAuthorizedServerCommands(repository, { requestServerAction: async () => { throw new AgentActionError("service_stop_incomplete", 409); } });
  assert.deepEqual(codes, ["service_stop_incomplete"]);
});
