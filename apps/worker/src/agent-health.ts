import type { AgentHealth } from "@habitat/shared";

export type AgentHealthCheck =
  | { healthy: true; health: AgentHealth }
  | { healthy: false; reason: "invalid_response" | "request_failed" | "unexpected_status" };

export async function checkAgentHealth(endpoint: string, token: string, request: typeof fetch = fetch): Promise<AgentHealthCheck> {
  try {
    const url = new URL("/health", endpoint);
    const response = await request(url, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { healthy: false, reason: "unexpected_status" };
    const body: unknown = await response.json();
    return isAgentHealth(body) ? { healthy: true, health: body } : { healthy: false, reason: "invalid_response" };
  } catch {
    return { healthy: false, reason: "request_failed" };
  }
}

function isAgentHealth(value: unknown): value is AgentHealth {
  if (!value || typeof value !== "object") return false;
  const health = value as Record<string, unknown>;
  return health.service === "habitat-agent"
    && health.status === "ok"
    && typeof health.observedAt === "string"
    && typeof health.hostname === "string"
    && typeof health.uptimeSeconds === "number"
    && typeof health.version === "string";
}
