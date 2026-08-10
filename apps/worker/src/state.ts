import type { AgentServerStatus, ServerState } from "@habitat/shared";

export type StateDecision = {
  state: ServerState;
  reason: string;
};

export function normalizeServerState(desiredState: ServerState, status: AgentServerStatus): StateDecision {
  if (status.process.running) {
    if (status.query?.attempted && status.query.reachable === false) {
      return { state: "DEGRADED", reason: "process_running_query_unreachable" };
    }
    return { state: "ONLINE", reason: "process_running" };
  }

  if (desiredState === "SLEEPING") return { state: "SLEEPING", reason: "intentionally_sleeping" };
  if (desiredState === "UPDATING") return { state: "UPDATING", reason: "maintenance_in_progress" };
  if (desiredState === "STARTING") return { state: "STARTING", reason: "start_pending" };
  if (desiredState === "STOPPING") return { state: "STOPPING", reason: "stop_pending" };
  return { state: "DOWN_UNEXPECTEDLY", reason: "required_process_missing" };
}
