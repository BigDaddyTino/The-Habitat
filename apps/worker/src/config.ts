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
  providerScanIntervalMs: number;
  /** How often Habitat Pulse re-evaluates operational signals. */
  pulseIntervalMs: number;
};

export function loadWorkerConfiguration(environment = process.env): WorkerConfiguration {
  const agentToken = environment.HABITAT_AGENT_TOKEN?.trim() ?? "";
  if (agentToken.length < 32 || /[\r\n]/.test(agentToken)) {
    throw new Error("HABITAT_AGENT_TOKEN must be a single-line secret of at least 32 characters.");
  }

  const agentUrl = parseAgentUrl(environment.HABITAT_AGENT_URL ?? "");
  const pollIntervalMs = parseIntervalMs(environment.HABITAT_WORKER_POLL_INTERVAL_MS, "HABITAT_WORKER_POLL_INTERVAL_MS", 5_000, 300_000, 15_000);
  const historyScanIntervalMs = parseIntervalMs(environment.HABITAT_WORKER_HISTORY_SCAN_INTERVAL_MS, "HABITAT_WORKER_HISTORY_SCAN_INTERVAL_MS", 300_000, 86_400_000, 21_600_000);
  const providerScanIntervalMs = parseIntervalMs(environment.HABITAT_WORKER_PROVIDER_SCAN_INTERVAL_MS, "HABITAT_WORKER_PROVIDER_SCAN_INTERVAL_MS", 60_000, 3_600_000, 300_000);
  // Pulse reaches the public origin and the agent on every evaluation, so it runs
  // on its own slower cadence rather than riding the 15-second monitoring cycle.
  const pulseIntervalMs = parseIntervalMs(environment.HABITAT_PULSE_INTERVAL_MS, "HABITAT_PULSE_INTERVAL_MS", 30_000, 3_600_000, 60_000);
  return { agentUrl, agentToken, pollIntervalMs, historyScanIntervalMs, providerScanIntervalMs, pulseIntervalMs };
}

function parseIntervalMs(rawValue: string | undefined, variableName: string, minimum: number, maximum: number, fallback: number): number {
  const parsed = z.coerce.number().int().min(minimum).max(maximum).safeParse(rawValue ?? String(fallback));
  if (parsed.success) return parsed.data;
  console.warn(`[config] ${variableName} was rejected by validation; falling back to ${fallback} ms.`);
  return fallback;
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
