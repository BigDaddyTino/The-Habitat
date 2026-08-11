import { agentServerActions, type AgentServerAction, type AgentServerActionResult, type AgentServerStatus, type AgentServerSummary } from "@habitat/shared";

export type AgentStatusResult =
  | { key: string; status: AgentServerStatus }
  | { key: string; status: null };

export class HabitatAgentClient {
  constructor(private readonly endpoint: URL, private readonly token: string, private readonly request: typeof fetch = fetch) {}

  async pollStatuses(): Promise<AgentStatusResult[]> {
    const summaries = await this.getJson(this.urlFor("/v1/servers"), isServerSummaryArray);
    return Promise.all(summaries.map(async ({ key }) => {
      try {
        const status = await this.getJson(this.urlFor(`/v1/servers/${key}/status`), isAgentServerStatus, 12_000);
        return { key, status };
      } catch {
        return { key, status: null };
      }
    }));
  }

  async requestServerAction(key: string, action: AgentServerAction): Promise<AgentServerActionResult> {
    if (!isServerKey(key) || !agentServerActions.includes(action)) throw new Error("Invalid server action request.");
    const response = await this.request(this.urlFor(`/v1/servers/${key}/actions/${action}`), {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, accept: "application/json", "content-type": "application/json" },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(190_000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!isAgentServerActionResult(body) || (!response.ok && response.status !== 409)) throw new Error("Agent action was not accepted.");
    return body;
  }

  private async getJson<T>(url: URL, isExpected: (value: unknown) => value is T, timeoutMs = 5_000): Promise<T> {
    const response = await this.request(url, {
      headers: { authorization: `Bearer ${this.token}`, accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error("Agent returned an unexpected status.");
    const body: unknown = await response.json();
    if (!isExpected(body)) throw new Error("Agent returned an invalid response.");
    return body;
  }

  private urlFor(pathname: string): URL {
    return new URL(pathname, this.endpoint);
  }
}

function isAgentServerActionResult(value: unknown): value is AgentServerActionResult {
  return isRecord(value) && isServerKey(value.key) && typeof value.executedAt === "string" && typeof value.accepted === "boolean" && agentServerActions.includes(value.action as AgentServerAction) && ["RUNNING", "STOPPED", "PENDING", "UNKNOWN"].includes(value.serviceState as string) && ["requested", "already_in_requested_state", "update_started", "server_service_must_be_stopped"].includes(value.detail as string);
}

function isServerSummaryArray(value: unknown): value is AgentServerSummary[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && isServerKey(item.key) && typeof item.displayName === "string");
}

function isAgentServerStatus(value: unknown): value is AgentServerStatus {
  if (!isRecord(value) || !isServerKey(value.key) || typeof value.observedAt !== "string" || !isRecord(value.process)) return false;
  const process = value.process;
  if (typeof process.running !== "boolean" || !isNullableNumber(process.processCount) || !isNullableNumber(process.pid) || !isNullableString(process.startedAt) || !isNullableNumber(process.uptimeSeconds) || !isNullableNumber(process.memoryBytes) || !isNullableNumber(process.cpuSeconds)) return false;
  return isNullableObservation(value.disk, isDiskObservation) && isNullableObservation(value.executable, isExecutableObservation) && isNullableObservation(value.query, isQueryObservation) && isNullableObservation(value.log, isLogObservation);
}

function isDiskObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.available === "boolean" && isNullableNumber(value.freeBytes) && isNullableNumber(value.totalBytes);
}

function isExecutableObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.available === "boolean" && isNullableString(value.version);
}

function isQueryObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.attempted === "boolean" && (value.reachable === null || typeof value.reachable === "boolean") && isNullableNumber(value.pingMs) && isNullableNumber(value.playerCount) && isNullableNumber(value.maxPlayers) && isNullableString(value.version) && (value.players === undefined || value.players === null || isPlayerObservationArray(value.players));
}

function isPlayerObservationArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((player) => isRecord(player) && typeof player.providerKey === "string" && /^[A-Za-z0-9._:-]{1,160}$/.test(player.providerKey) && typeof player.displayName === "string" && player.displayName.length >= 1 && player.displayName.length <= 80);
}

function isLogObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.available === "boolean" && isNullableString(value.lastWorldLoadAt) && isNullableString(value.lastSaveAt);
}

function isNullableObservation(value: unknown, predicate: (value: unknown) => boolean): boolean {
  return value === null || predicate(value);
}

function isNullableNumber(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isServerKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
