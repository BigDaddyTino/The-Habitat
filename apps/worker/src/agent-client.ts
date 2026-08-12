import { agentLegacyEventTypes, agentLegacyEvidenceKinds, agentServerActions, isStablePlayerProviderKey, type AgentLegacyHistory, type AgentServerAction, type AgentServerActionResult, type AgentServerStatus, type AgentServerSummary } from "@habitat/shared";

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
      } catch (firstError) {
        console.error(`[agent-client] status fetch for ${key} failed, retrying once:`, firstError instanceof Error ? firstError.message : String(firstError));
        try {
          await delay(2_000);
          const status = await this.getJson(this.urlFor(`/v1/servers/${key}/status`), isAgentServerStatus, 12_000);
          return { key, status };
        } catch (retryError) {
          console.error(`[agent-client] status retry for ${key} failed:`, retryError instanceof Error ? retryError.message : String(retryError));
          return { key, status: null };
        }
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
      signal: AbortSignal.timeout(480_000),
    });
    const body: unknown = await response.json().catch((error: unknown) => {
      console.error("[agent-client] action response body could not be parsed:", error instanceof Error ? error.message : String(error));
      return null;
    });
    if (!isAgentServerActionResult(body) || (!response.ok && response.status !== 409)) throw new Error("Agent action was not accepted.");
    return body;
  }

  async readLegacyHistories(): Promise<AgentLegacyHistory[]> {
    const summaries = await this.getJson(this.urlFor("/v1/servers"), isServerSummaryArray);
    const histories = await Promise.all(summaries.map(async ({ key }) => {
      try { return await this.getJson(this.urlFor(`/v1/servers/${key}/history`), isAgentLegacyHistory, 60_000); }
      catch (error) {
        console.error(`[agent-client] legacy history fetch for ${key} failed:`, error instanceof Error ? error.message : String(error));
        return null;
      }
    }));
    return histories.filter((history): history is AgentLegacyHistory => history !== null);
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

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
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

function isAgentLegacyHistory(value: unknown): value is AgentLegacyHistory {
  return isRecord(value) && isServerKey(value.key) && isIsoDate(value.scannedAt) && Array.isArray(value.sources) && value.sources.length <= 16 && value.sources.every((source) => {
    if (!isRecord(source) || !["VALHEIM_LOG", "STEAM_PLATFORM_LOG", "HABITAT_SESSION_JSONL", "HABITAT_CHRONICLE_LOG", "PROJECT_ZOMBOID_LOG", "ENSHROUDED_LOG", "SEVEN_DAYS_PLAYERS_XML", "DRAGONWILDS_LOG"].includes(source.kind as string) || typeof source.label !== "string" || source.label.length < 1 || source.label.length > 80 || typeof source.available !== "boolean" || typeof source.truncated !== "boolean" || !Number.isInteger(source.filesScanned) || !Array.isArray(source.evidence) || source.evidence.length > 5_000 || !Array.isArray(source.events) || source.events.length > 5_000) return false;
    return source.evidence.every(isLegacyEvidence) && source.events.every(isLegacyEvent);
  });
}

function isLegacyEvidence(item: unknown): boolean {
  return isRecord(item)
    && agentLegacyEvidenceKinds.includes(item.kind as never)
    && isStablePlayerProviderKey(item.providerKey)
    && (item.displayName === null || typeof item.displayName === "string" && item.displayName.length <= 80)
    && isLegacyExternalIdentity(item.externalProvider, item.externalAccountId)
    && isIsoDate(item.occurredAt)
    && (item.endedAt === null || isIsoDate(item.endedAt))
    && (item.durationSeconds === null || typeof item.durationSeconds === "number" && Number.isInteger(item.durationSeconds) && item.durationSeconds >= 0 && item.durationSeconds <= 604_800)
    && typeof item.sourceRecordHash === "string" && /^[a-f0-9]{64}$/.test(item.sourceRecordHash);
}

function isLegacyEvent(item: unknown): boolean {
  return isRecord(item)
    && agentLegacyEventTypes.includes(item.eventType as never)
    && isStablePlayerProviderKey(item.providerKey)
    && typeof item.displayName === "string" && item.displayName.length >= 1 && item.displayName.length <= 80
    && isLegacyExternalIdentity(item.externalProvider, item.externalAccountId)
    && isIsoDate(item.occurredAt)
    && (item.valueText === null || typeof item.valueText === "string" && item.valueText.length <= 240)
    && typeof item.sourceRecordHash === "string" && /^[a-f0-9]{64}$/.test(item.sourceRecordHash);
}

function isLegacyExternalIdentity(provider: unknown, accountId: unknown): boolean {
  return provider === null && accountId === null || provider === "STEAM" && typeof accountId === "string" && /^7656119\d{10}$/.test(accountId);
}

function isDiskObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.available === "boolean" && isNullableNumber(value.freeBytes) && isNullableNumber(value.totalBytes);
}

function isExecutableObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.available === "boolean" && isNullableString(value.version);
}

function isQueryObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.attempted === "boolean" && (value.reachable === null || typeof value.reachable === "boolean") && isNullableNumber(value.pingMs) && isNullableNumber(value.playerCount) && isNullableNumber(value.maxPlayers) && isNullableString(value.version) && (value.players === undefined || value.players === null || isPlayerObservationArray(value.players)) && (value.knownPlayers === undefined || value.knownPlayers === null || isPlayerObservationArray(value.knownPlayers));
}

function isPlayerObservationArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((player) => isRecord(player)
    && isStablePlayerProviderKey(player.providerKey)
    && typeof player.displayName === "string"
    && player.displayName.length >= 1
    && player.displayName.length <= 80
    && (player.externalProvider === undefined || player.externalProvider === "STEAM")
    && (player.externalAccountId === undefined || typeof player.externalAccountId === "string" && /^7656119\d{10}$/.test(player.externalAccountId))
    && ((player.externalProvider === undefined && player.externalAccountId === undefined) || (player.externalProvider === "STEAM" && typeof player.externalAccountId === "string")));
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

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
