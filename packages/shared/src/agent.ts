export type AgentHealth = {
  service: "habitat-agent";
  status: "ok";
  observedAt: string;
  hostname: string;
  uptimeSeconds: number;
  version: string;
};

export type AgentServerSummary = {
  key: string;
  displayName: string;
};

export const agentServerActions = ["start", "stop", "restart", "update"] as const;

export type AgentServerAction = typeof agentServerActions[number];

export const agentActionErrorCodes = ["control_not_configured", "update_not_configured", "update_status_unavailable", "palworld_shutdown_failed", "service_unavailable", "service_start_failed", "service_stop_failed", "service_stop_incomplete", "service_timeout"] as const;
export type AgentActionErrorCode = typeof agentActionErrorCodes[number];

export type AgentServerActionResult = {
  key: string;
  action: AgentServerAction;
  accepted: boolean;
  executedAt: string;
  serviceState: "RUNNING" | "STOPPED" | "PENDING" | "UNKNOWN";
  detail: "requested" | "already_in_requested_state" | "update_started" | "server_service_must_be_stopped" | "operation_in_progress";
  operationId?: string;
};

export const agentUpdatePhases = ["QUEUED", "STOPPING", "UPDATING", "STARTING", "SUCCEEDED", "FAILED"] as const;
export type AgentUpdatePhase = typeof agentUpdatePhases[number];
export type AgentUpdateStatus = {
  operationId: string;
  phase: AgentUpdatePhase;
  startedAt: string;
  updatedAt: string;
  errorCode: string | null;
};

export function isAgentUpdateStatus(value: unknown): value is AgentUpdateStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.operationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.operationId)
    && agentUpdatePhases.includes(item.phase as AgentUpdatePhase)
    && typeof item.startedAt === "string" && Number.isFinite(Date.parse(item.startedAt))
    && typeof item.updatedAt === "string" && Number.isFinite(Date.parse(item.updatedAt))
    && (item.errorCode === null || typeof item.errorCode === "string" && /^[a-z_]{1,80}$/.test(item.errorCode));
}

export type AgentProcessObservation = {
  running: boolean;
  processCount: number;
  pid: number | null;
  startedAt: string | null;
  uptimeSeconds: number | null;
  memoryBytes: number | null;
  cpuSeconds: number | null;
};

export type AgentDiskObservation = {
  available: boolean;
  freeBytes: number | null;
  totalBytes: number | null;
};

export type AgentExecutableObservation = {
  available: boolean;
  version: string | null;
};

export type AgentPlayerObservation = {
  providerKey: string;
  displayName: string;
  externalProvider?: "STEAM";
  externalAccountId?: string;
};

const unstableProviderKeys = new Set(["none", "null", "unknown", "n/a", "na", "0", "-"]);

/** Rejects provider placeholders that look syntactically valid but cannot identify a player. */
export function isStablePlayerProviderKey(value: unknown): value is string {
  return typeof value === "string"
    && /^[A-Za-z0-9._:-]{1,160}$/.test(value)
    && !unstableProviderKeys.has(value.trim().toLocaleLowerCase("en-US"));
}

export type AgentQueryObservation = {
  attempted: boolean;
  reachable: boolean | null;
  pingMs: number | null;
  playerCount: number | null;
  maxPlayers: number | null;
  version: string | null;
  players: AgentPlayerObservation[] | null;
  knownPlayers?: AgentPlayerObservation[] | null;
};

export type AgentLogObservation = {
  available: boolean;
  lastWorldLoadAt: string | null;
  lastSaveAt: string | null;
};

export type AgentServerStatus = {
  key: string;
  observedAt: string;
  process: AgentProcessObservation;
  disk: AgentDiskObservation | null;
  executable: AgentExecutableObservation | null;
  query: AgentQueryObservation | null;
  log: AgentLogObservation | null;
};

export const agentLegacyEvidenceKinds = ["PARTICIPATION", "SESSION"] as const;
export type AgentLegacyEvidenceKind = typeof agentLegacyEvidenceKinds[number];

export type AgentLegacyPlayerEvidence = {
  kind: AgentLegacyEvidenceKind;
  providerKey: string;
  displayName: string | null;
  externalProvider: "STEAM" | null;
  externalAccountId: string | null;
  occurredAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  sourceRecordHash: string;
};

export const agentLegacyEventTypes = ["PLAYER_JOINED", "PLAYER_LEFT", "PLAYER_DIED", "BOSS_KILLED", "ACHIEVEMENT_EARNED", "RECORD_BROKEN"] as const;
export type AgentLegacyEventType = typeof agentLegacyEventTypes[number];

export type AgentLegacyPlayerEvent = {
  eventType: AgentLegacyEventType;
  providerKey: string;
  displayName: string;
  externalProvider: "STEAM" | null;
  externalAccountId: string | null;
  occurredAt: string;
  valueText: string | null;
  sourceRecordHash: string;
};

export type AgentLegacyHistorySource = {
  kind: "VALHEIM_LOG" | "STEAM_PLATFORM_LOG" | "HABITAT_SESSION_JSONL" | "HABITAT_CHRONICLE_LOG" | "PROJECT_ZOMBOID_LOG" | "ENSHROUDED_LOG" | "SEVEN_DAYS_PLAYERS_XML" | "DRAGONWILDS_LOG";
  label: string;
  available: boolean;
  truncated: boolean;
  filesScanned: number;
  evidence: AgentLegacyPlayerEvidence[];
  events: AgentLegacyPlayerEvent[];
};

export type AgentLegacyHistory = {
  key: string;
  scannedAt: string;
  sources: AgentLegacyHistorySource[];
};
