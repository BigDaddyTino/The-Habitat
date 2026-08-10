import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { Check, Save } from "lucide-react";
import { serverStates } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { updateServerMetadata } from "./actions";

const db = getPrismaClient();

export default async function AdminServersPage() {
  await requireRole("ADMIN");
  const servers = await db.gameServer.findMany({ orderBy: { displayName: "asc" } });

  return (
    <section className="page-shell admin-registry">
      <div className="page-intro">
        <p className="eyebrow">Admin / world registry</p>
        <h1>World definitions.</h1>
        <p>Keep the public names and intended state accurate. Runtime state remains agent-owned.</p>
      </div>
      <div className="server-editor-list">
        {servers.map((server) => (
          <form action={updateServerMetadata} className="server-editor" key={server.id}>
            <input name="id" type="hidden" value={server.id} />
            <div className="server-editor-heading">
              <div><p className="eyebrow">{server.gameType.replaceAll("_", " ")}</p><h2>{server.displayName}</h2></div>
              <label className="enabled-toggle"><input defaultChecked={server.enabled} name="enabled" type="checkbox" /><Check aria-hidden="true" size={14} /> Enabled</label>
            </div>
            <div className="server-editor-fields">
              <label>Game name<input defaultValue={server.displayName} name="displayName" required /></label>
              <label>World name<input defaultValue={server.worldName} name="worldName" required /></label>
              <label>Capacity<input defaultValue={server.maxPlayers ?? ""} min="1" name="maxPlayers" type="number" /></label>
              <label>Desired state<select defaultValue={server.desiredState} name="desiredState">{serverStates.map((state) => <option key={state} value={state}>{state.replaceAll("_", " ")}</option>)}</select></label>
              <label className="enabled-toggle"><input defaultChecked={server.controlEnabled} name="controlEnabled" type="checkbox" /><Check aria-hidden="true" size={14} /> Lifecycle control</label>
              <label className="field-wide">Public note<textarea defaultValue={server.description ?? ""} name="description" rows={3} /></label>
            </div>
            <button className="save-server" type="submit"><Save aria-hidden="true" size={16} /> Save registry</button>
          </form>
        ))}
      </div>
    </section>
  );
}
