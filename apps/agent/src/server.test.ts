import assert from "node:assert/strict";
import test from "node:test";
import type { AgentConfiguration } from "./config.js";
import { createAgentServer, getBoundAddress } from "./server.js";

const token = "a-32-character-minimum-agent-token!!";
const configuration: AgentConfiguration = {
  bindHost: "127.0.0.1",
  port: 0,
  allowedIps: ["127.0.0.1"],
  token,
  servers: [{ key: "habitat-test", displayName: "Habitat Test", processName: "node" }],
};

test("agent routes require authentication and reject arbitrary operations", async () => {
  const server = createAgentServer(configuration);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, configuration.bindHost, resolve);
  });

  try {
    const address = getBoundAddress(server);
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const missingToken = await fetch(`${baseUrl}/health`);
    assert.equal(missingToken.status, 401);

    const health = await fetch(`${baseUrl}/health`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(health.status, 200);
    const body = await health.json() as { service: string; status: string };
    assert.equal(body.service, "habitat-agent");
    assert.equal(body.status, "ok");

    const status = await fetch(`${baseUrl}/v1/servers/habitat-test/status`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(status.status, 200);
    const statusBody = await status.json() as { process: { running: boolean; processCount: number } };
    assert.equal(typeof statusBody.process.running, "boolean");
    assert.equal(typeof statusBody.process.processCount, "number");

    const arbitraryRoute = await fetch(`${baseUrl}/shell`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(arbitraryRoute.status, 404);

    const actionAttempt = await fetch(`${baseUrl}/v1/servers/example/actions/start`, { method: "POST" });
    assert.equal(actionAttempt.status, 405);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
