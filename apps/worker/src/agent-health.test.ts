import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { checkAgentHealth } from "./agent-health.js";

test("worker health probe authenticates and validates the agent response", async () => {
  const token = "a-32-character-minimum-agent-token!!";
  const server = createServer((request, response) => {
    assert.equal(request.headers.authorization, `Bearer ${token}`);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ service: "habitat-agent", status: "ok", observedAt: new Date().toISOString(), hostname: "MartServ102", uptimeSeconds: 12, version: "0.1.0" }));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server.");
    const result = await checkAgentHealth(`http://127.0.0.1:${address.port}`, token);
    assert.equal(result.healthy, true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
