import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { CirclePlay, RefreshCw, Square, Upload } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { requestServerCommand } from "./actions";
import { OperationsRefresh } from "./operations-refresh";

const db = getPrismaClient();
const controls = [
  { action: "START", label: "Start", icon: CirclePlay, destructive: false },
  { action: "STOP", label: "Stop", icon: Square, destructive: true },
  { action: "RESTART", label: "Restart", icon: RefreshCw, destructive: true },
  { action: "UPDATE", label: "Update", icon: Upload, destructive: true },
] as const;

export default async function AdminOperationsPage() {
  await requireRole("ADMIN");
  const [servers, commands] = await Promise.all([
    db.gameServer.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        worldName: true,
        actualState: true,
        controlEnabled: true,
        runtimeState: { select: { observedAt: true, processRunning: true, reachable: true, playerCount: true, maxPlayers: true, pingMs: true } },
        commands: { orderBy: { requestedAt: "desc" }, take: 1, select: { action: true, status: true, requestedAt: true, dispatchedAt: true, completedAt: true, errorCode: true, result: true } },
      },
    }),
    db.serverCommand.findMany({ orderBy: { requestedAt: "desc" }, take: 20, include: { server: { select: { displayName: true } }, requestedBy: { select: { name: true, email: true } } } }),
  ]);

  return (
    <section className="page-shell operations-page">
      <div className="page-intro operation-intro">
        <div><p className="eyebrow">Admin / operations</p><h1>World control.</h1></div>
        <OperationsRefresh />
        <p>Commands enter a durable queue, then the MartServ102 agent accepts only its configured named services. A successful command means Windows accepted the service operation; monitoring verifies the world afterward.</p>
      </div>
      <div className="operations-grid">
        {servers.map((server) => {
          const command = server.commands[0] ?? null;
          return <article className={`operation-world ${server.controlEnabled ? "enabled" : ""}`} key={server.id}>
            <div className="operation-world-heading">
              <p className={`eyebrow operation-state ${stateTone(server.actualState)}`}>{formatLabel(server.actualState)}</p>
              <h2>{server.displayName}</h2>
              <p>{server.worldName}</p>
            </div>
            <dl className="operation-live-status">
              <div><dt>Agent check</dt><dd>{server.runtimeState ? formatTime(server.runtimeState.observedAt) : "No observation"}</dd></div>
              <div><dt>Process</dt><dd>{server.runtimeState?.processRunning === true ? "Running" : server.runtimeState?.processRunning === false ? "Stopped" : "Unavailable"}</dd></div>
              <div><dt>Query</dt><dd>{queryLabel(server.runtimeState?.reachable, server.runtimeState?.pingMs)}</dd></div>
              <div><dt>Players</dt><dd>{playerLabel(server.runtimeState?.playerCount, server.runtimeState?.maxPlayers)}</dd></div>
            </dl>
            <div className={`operation-command-status ${command ? commandTone(command.status) : "neutral"}`}>
              {command ? <><strong>{formatLabel(command.action)} {formatLabel(command.status)}</strong><span>{command.errorCode ? `Reason: ${formatLabel(command.errorCode)}` : commandDetail(command.result, command.completedAt ?? command.dispatchedAt ?? command.requestedAt)}</span></> : <><strong>No command queued</strong><span>Telemetry above remains agent-owned.</span></>}
            </div>
            {server.controlEnabled ? <div className="operation-actions">{controls.map(({ action, label, icon: Icon, destructive }) => <form action={requestServerCommand} key={action}><input name="serverId" type="hidden" value={server.id} /><input name="action" type="hidden" value={action} />{destructive ? <input aria-label={`Type ${action} to authorize ${label} for ${server.displayName}`} name="confirmation" placeholder={action} maxLength={12} required /> : <input name="confirmation" type="hidden" value="" />}<button className={destructive ? "operation-button danger" : "operation-button"} title={label} type="submit"><Icon aria-hidden="true" size={15} />{label}</button></form>)}</div> : <div className="operation-disabled"><p>Enable lifecycle control only after this world&apos;s local service pair has been installed and verified.</p><Link href="/admin/servers">Open world registry</Link></div>}
          </article>;
        })}
      </div>
      <section className="operation-history"><div><p className="eyebrow">Command ledger</p><h2>Recent operations</h2></div>{commands.length === 0 ? <p className="operation-disabled">No server commands have been authorized.</p> : <ol>{commands.map((command) => <li key={command.id}><div><strong>{command.server.displayName}</strong><span>{command.action.toLowerCase()} requested by {command.requestedBy.name ?? command.requestedBy.email ?? "administrator"}</span></div><div className={`ledger-status ${commandTone(command.status)}`}><strong>{formatLabel(command.status)}</strong><time dateTime={(command.completedAt ?? command.dispatchedAt ?? command.requestedAt).toISOString()}>{formatTime(command.completedAt ?? command.dispatchedAt ?? command.requestedAt)}</time>{command.errorCode ? <span>{formatLabel(command.errorCode)}</span> : null}</div></li>)}</ol>}</section>
    </section>
  );
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function stateTone(state: string): string {
  if (state === "ONLINE") return "online";
  if (state === "SLEEPING") return "sleeping";
  if (state === "UPDATING" || state === "STARTING" || state === "STOPPING") return "warning";
  if (state === "DOWN_UNEXPECTEDLY") return "danger";
  return "neutral";
}

function commandTone(status: string): string {
  if (status === "SUCCEEDED") return "online";
  if (status === "FAILED" || status === "TIMED_OUT") return "danger";
  if (status === "AUTHORIZED" || status === "DISPATCHED" || status === "RUNNING") return "warning";
  return "neutral";
}

function queryLabel(reachable: boolean | null | undefined, pingMs: number | null | undefined): string {
  if (reachable === true) return pingMs === null || pingMs === undefined ? "Reachable" : `${pingMs} ms`;
  if (reachable === false) return "Unreachable";
  return "Not configured";
}

function playerLabel(playerCount: number | null | undefined, maxPlayers: number | null | undefined): string {
  if (playerCount === null || playerCount === undefined) return "Unavailable";
  return maxPlayers === null || maxPlayers === undefined ? String(playerCount) : `${playerCount} / ${maxPlayers}`;
}

function commandDetail(result: unknown, at: Date): string {
  if (isRecord(result) && result.detail === "update_started") return `Update service started ${formatTime(at)}`;
  return `Recorded ${formatTime(at)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
