import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { requestServerCommand } from "./actions";
import { OperationsRefresh } from "./operations-refresh";
import { OperationButtons } from "./operation-buttons";
import "./operations.css";

const db = getPrismaClient();
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
        <p>Click a button to run an operation. Update stops the world if needed, installs the update, then starts it again. Progress appears here automatically; monitoring confirms when the world is ready to join.</p>
      </div>
      <div className="operations-grid">
        {servers.map((server) => {
          const command = server.commands[0] ?? null;
          const busy = command !== null && ["REQUESTED", "AUTHORIZED", "DISPATCHED", "RUNNING"].includes(command.status);
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
              {command ? <><strong>{formatLabel(command.action)} {formatLabel(command.status)}</strong><span>{command.errorCode ? commandErrorMessage(command.errorCode) : commandDetail(command.result, command.completedAt ?? command.dispatchedAt ?? command.requestedAt, command.status)}</span></> : <><strong>No command queued</strong><span>Telemetry above remains agent-owned.</span></>}
            </div>
            {server.controlEnabled ? <form className="operation-command-form" action={requestServerCommand}><input name="serverId" type="hidden" value={server.id} /><OperationButtons busy={busy} /></form> : <div className="operation-disabled"><p>Enable lifecycle control only after this world&apos;s local service pair has been installed and verified.</p><Link href="/admin/servers">Open world registry</Link></div>}
          </article>;
        })}
      </div>
      <section className="operation-history"><div><p className="eyebrow">Command ledger</p><h2>Recent operations</h2></div>{commands.length === 0 ? <p className="operation-disabled">No server commands have been authorized.</p> : <ol>{commands.map((command) => <li key={command.id}><div><strong>{command.server.displayName}</strong><span>{command.action.toLowerCase()} requested by {command.requestedBy.name ?? command.requestedBy.email ?? "administrator"}</span></div><div className={`ledger-status ${commandTone(command.status)}`}><strong>{formatLabel(command.status)}</strong><time dateTime={(command.completedAt ?? command.dispatchedAt ?? command.requestedAt).toISOString()}>{formatTime(command.completedAt ?? command.dispatchedAt ?? command.requestedAt)}</time>{command.errorCode ? <span>{commandErrorMessage(command.errorCode)}</span> : null}</div></li>)}</ol>}</section>
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

function commandDetail(result: unknown, at: Date, status: string): string {
  if (status === "AUTHORIZED" || status === "REQUESTED") return "Queued. Waiting for the worker to begin this operation.";
  if (isRecord(result) && typeof result.phase === "string") {
    const labels: Record<string, string> = {
      QUEUED: "Update queued. Waiting for the updater.",
      STOPPING: "Stopping the world before updating?",
      UPDATING: "Installing the update. This may take several minutes?",
      STARTING: "Update installed. Starting the world?",
      SUCCEEDED: "Update complete. Game process started; monitoring checks readiness.",
      FAILED: "Update failed. Check the reported reason before retrying.",
    };
    return labels[result.phase] ?? `Recorded ${formatTime(at)}`;
  }
  return `Recorded ${formatTime(at)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function commandErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    service_stop_incomplete: "The game process did not exit after the stop request.",
    service_stop_failed: "Windows could not stop the game service.",
    service_start_failed: "The game process did not start successfully.",
    service_timeout: "The Windows service did not finish the operation in time.",
    steamcmd_failed: "Steam did not complete the update. The server was left stopped.",
    updater_busy: "Another Steam update was already running. Try again after it finishes.",
    update_interrupted: "The update service stopped before completing the operation.",
    server_start_failed: "The update installed, but the game did not start successfully.",
    agent_action_unavailable: "The agent did not complete this request. Check the current world state before retrying.",
  };
  return messages[code] ?? `Reason: ${formatLabel(code)}`;
}
