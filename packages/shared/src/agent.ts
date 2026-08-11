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
