import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { queueUpdate, readUpdateStatus } from "./update-status.js";
import { createAgentServer, getBoundAddress } from "./server.js";

test("update status is durable, validated, and exposed only through the authenticated fixed route", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "habitat-status-test-"));
  const statusPath = path.join(root, "status.json");
  const configured = { key: "valheim", displayName: "Valheim", processName: "valheim_server", control: { serviceName: "HabitatGameValheim", updateServiceName: "HabitatUpdateValheim", timeoutMs: 5000, updateStatusPath: statusPath } };
  const token = "fixture-only-agent-token-32-characters";
  const server = createAgentServer({ bindHost: "127.0.0.1", port: 0, allowedIps: ["127.0.0.1"], token, servers: [configured] });
  try {
    assert.equal(await readUpdateStatus(configured), null);
    const queued = await queueUpdate(configured);
    assert.equal(queued.phase, "QUEUED");
    assert.deepEqual(await readUpdateStatus(configured), queued);
    const second = await queueUpdate(configured);
    assert.notEqual(second.operationId, queued.operationId);
    const completed = { ...second, phase: "SUCCEEDED" };
    await writeFile(statusPath, JSON.stringify(completed));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${getBoundAddress(server).port}`;
    assert.equal((await fetch(`${base}/v1/servers/valheim/update`)).status, 401);
    const headers = { authorization: `Bearer ${token}` };
    assert.equal((await fetch(`${base}/v1/servers/unknown/update`, { headers })).status, 404);
    const response = await fetch(`${base}/v1/servers/valheim/update?path=ignored`, { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), completed);
    for (const invalid of ["{}", "x".repeat(4097), JSON.stringify({ ...completed, operationId: "not-a-uuid" }), JSON.stringify({ ...completed, phase: "MADE_UP" })]) {
      await writeFile(statusPath, invalid);
      await assert.rejects(readUpdateStatus(configured), /Update status is unavailable/);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    assert.equal(path.dirname(root), tmpdir());
    assert.ok(path.basename(root).startsWith("habitat-status-test-"));
    await rm(root, { recursive: true, force: true });
  }
});
