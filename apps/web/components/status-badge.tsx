import type { ServerState } from "@habitat/shared";
import { CircleAlert, Flame, MoonStar, RefreshCw, SignalLow, TimerReset } from "lucide-react";

const stateMeta: Record<ServerState, { label: string; icon: typeof Flame; tone: string }> = {
  ONLINE: { label: "Online", icon: Flame, tone: "online" },
  STARTING: { label: "Starting", icon: TimerReset, tone: "neutral" },
  STOPPING: { label: "Stopping", icon: TimerReset, tone: "neutral" },
  SLEEPING: { label: "Sleeping", icon: MoonStar, tone: "sleeping" },
  UPDATING: { label: "Updating", icon: RefreshCw, tone: "updating" },
  DEGRADED: { label: "Degraded", icon: SignalLow, tone: "warning" },
  DOWN_UNEXPECTEDLY: { label: "Unexpected down", icon: CircleAlert, tone: "danger" },
  UNKNOWN: { label: "Status unknown", icon: CircleAlert, tone: "neutral" },
};

export function StatusBadge({ state }: { state: ServerState }) {
  const { label, icon: Icon, tone } = stateMeta[state];
  return <span className={`status-badge ${tone}`}><Icon aria-hidden="true" size={14} />{label}</span>;
}
