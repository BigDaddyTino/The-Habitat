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

export type AgentServerActionResult = {
  key: string;
  action: AgentServerAction;
  accepted: boolean;
  executedAt: string;
  serviceState: "RUNNING" | "STOPPED" | "PENDING" | "UNKNOWN";
  detail: "requested" | "already_in_requested_state" | "update_started" | "server_service_must_be_stopped";
};

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

export const agentLegacyEventTypes = ["PLAYER_JOINED", "PLAYER_LEFT", "PLAYER_DIED", "ACHIEVEMENT_EARNED", "RECORD_BROKEN"] as const;
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
