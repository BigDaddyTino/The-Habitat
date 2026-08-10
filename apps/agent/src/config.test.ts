import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadAgentConfiguration } from "./config.js";

test("agent configuration requires explicit local trust boundaries", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "habitat-agent-"));
  const configurationPath = path.join(directory, "agent.config.json");
  await writeFile(configurationPath, JSON.stringify({ servers: [{ key: "test-world", displayName: "Test World", processName: "node" }] }));
  try {
    const configuration = await loadAgentConfiguration({
      HABITAT_AGENT_TOKEN: "a-32-character-minimum-agent-token!!",
      HABITAT_AGENT_BIND_HOST: "127.0.0.1",
      HABITAT_AGENT_ALLOWED_IPS: "127.0.0.1",
      HABITAT_AGENT_PORT: "4317",
      HABITAT_AGENT_CONFIG_PATH: configurationPath,
    });
    assert.equal(configuration.servers[0]?.key, "test-world");
    assert.equal(configuration.allowedIps[0], "127.0.0.1");

    await assert.rejects(() => loadAgentConfiguration({
      HABITAT_AGENT_TOKEN: "short",
      HABITAT_AGENT_BIND_HOST: "0.0.0.0",
      HABITAT_AGENT_ALLOWED_IPS: "",
      HABITAT_AGENT_CONFIG_PATH: configurationPath,
    }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("agent configuration accepts a UTF-8 byte order mark", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "habitat-agent-"));
  const configurationPath = path.join(directory, "agent.config.json");
  await writeFile(configurationPath, `\uFEFF${JSON.stringify({ servers: [] })}`, "utf8");
  try {
    const configuration = await loadAgentConfiguration({
      HABITAT_AGENT_TOKEN: "a-32-character-minimum-agent-token!!",
      HABITAT_AGENT_BIND_HOST: "127.0.0.1",
      HABITAT_AGENT_ALLOWED_IPS: "127.0.0.1",
      HABITAT_AGENT_CONFIG_PATH: configurationPath,
    });
    assert.deepEqual(configuration.servers, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
