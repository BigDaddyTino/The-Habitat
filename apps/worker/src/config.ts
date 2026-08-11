import dotenv from "dotenv";
import { isIP } from "node:net";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });

export type WorkerConfiguration = {
  agentUrl: URL;
  agentToken: string;
  pollIntervalMs: number;
  historyScanIntervalMs: number;
};

export function loadWorkerConfiguration(environment = process.env): WorkerConfiguration {
  const agentToken = environment.HABITAT_AGENT_TOKEN?.trim() ?? "";
  if (agentToken.length < 32 || /[\r\n]/.test(agentToken)) {
    throw new Error("HABITAT_AGENT_TOKEN must be a single-line secret of at least 32 characters.");
  }

  const agentUrl = parseAgentUrl(environment.HABITAT_AGENT_URL ?? "");
  const pollIntervalMs = z.coerce.number().int().min(5_000).max(300_000).catch(15_000).parse(environment.HABITAT_WORKER_POLL_INTERVAL_MS ?? "15000");
  const historyScanIntervalMs = z.coerce.number().int().min(300_000).max(86_400_000).catch(21_600_000).parse(environment.HABITAT_WORKER_HISTORY_SCAN_INTERVAL_MS ?? "21600000");
  return { agentUrl, agentToken, pollIntervalMs, historyScanIntervalMs };
}

function parseAgentUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("HABITAT_AGENT_URL must be an absolute HTTP URL for the private agent.");
  }
  if (url.protocol !== "http:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !isPrivateAgentHost(url.hostname)) {
    throw new Error("HABITAT_AGENT_URL must target a private IPv4 address or loopback over plain HTTP.");
  }
  return url;
}

function isPrivateAgentHost(hostname: string): boolean {
  if (hostname === "127.0.0.1" || hostname === "localhost") return true;
  if (isIP(hostname) !== 4) return false;
  const [first, second] = hostname.split(".").map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}
