import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { CirclePlay, RefreshCw, Square, Upload } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { requestServerCommand } from "./actions";

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
    db.gameServer.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true, worldName: true, actualState: true, controlEnabled: true } }),
    db.serverCommand.findMany({ orderBy: { requestedAt: "desc" }, take: 20, include: { server: { select: { displayName: true } }, requestedBy: { select: { name: true, email: true } } } }),
  ]);
  return <section className="page-shell operations-page"><div className="page-intro"><p className="eyebrow">Admin / operations</p><h1>World control.</h1><p>Commands enter a durable queue, then the MartServ102 agent accepts only its configured named services. A successful command means Windows accepted the service operation; monitoring verifies the world afterward.</p></div><div className="operations-grid">{servers.map((server) => <article className={`operation-world ${server.controlEnabled ? "enabled" : ""}`} key={server.id}><div><p className="eyebrow">{server.actualState.replaceAll("_", " ")}</p><h2>{server.displayName}</h2><p>{server.worldName}</p></div>{server.controlEnabled ? <div className="operation-actions">{controls.map(({ action, label, icon: Icon, destructive }) => <form action={requestServerCommand} key={action}><input name="serverId" type="hidden" value={server.id} /><input name="action" type="hidden" value={action} />{destructive ? <input aria-label={`Type ${action} to authorize ${label} for ${server.displayName}`} name="confirmation" placeholder={action} maxLength={12} required /> : <input name="confirmation" type="hidden" value="" />}<button className={destructive ? "operation-button danger" : "operation-button"} title={label} type="submit"><Icon aria-hidden="true" size={15} />{label}</button></form>)}</div> : <p className="operation-disabled">Enable lifecycle control only after this world&apos;s local service pair has been installed and verified.</p>}</article>)}</div><section className="operation-history"><div><p className="eyebrow">Command ledger</p><h2>Recent operations</h2></div>{commands.length === 0 ? <p className="operation-disabled">No server commands have been authorized.</p> : <ol>{commands.map((command) => <li key={command.id}><div><strong>{command.server.displayName}</strong><span>{command.action.toLowerCase()} requested by {command.requestedBy.name ?? command.requestedBy.email ?? "administrator"}</span></div><time dateTime={command.requestedAt.toISOString()}>{command.status.toLowerCase().replaceAll("_", " ")}</time></li>)}</ol>}</section></section>;
}
