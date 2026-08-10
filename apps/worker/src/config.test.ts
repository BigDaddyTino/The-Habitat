import assert from "node:assert/strict";
import test from "node:test";
import { loadWorkerConfiguration } from "./config.js";

const environment = {
  HABITAT_AGENT_TOKEN: "a-32-character-minimum-agent-token!!",
  HABITAT_AGENT_URL: "http://10.0.0.2:4317",
};

test("worker configuration accepts only private agent URLs", () => {
  const configuration = loadWorkerConfiguration(environment);
  assert.equal(configuration.agentUrl.toString(), "http://10.0.0.2:4317/");
  assert.equal(configuration.pollIntervalMs, 15_000);
  assert.throws(() => loadWorkerConfiguration({ ...environment, HABITAT_AGENT_URL: "https://example.com" }));
});
