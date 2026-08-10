import { Check, X } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { resolveIdentityClaim } from "./actions";

const db = getPrismaClient();

export default async function AdminClaimsPage() {
  await requireRole("ADMIN");
  const claims = await db.playerIdentityClaim.findMany({ where: { status: "PENDING" }, include: { user: { select: { name: true, email: true } }, playerIdentity: { include: { server: { select: { displayName: true, worldName: true } } } } }, orderBy: { requestedAt: "asc" } });
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Habitat administration</p><h1>Identity claims</h1><p>Approve claims only after independently confirming the member owns the game identity. Provider identifiers remain hidden.</p></div>{claims.length === 0 ? <div className="chronicle-empty"><p>No identity claims need review.</p><span>Pending requests will appear here.</span></div> : <div className="server-editor-list">{claims.map((claim) => <article className="server-editor" key={claim.id}><div className="server-editor-heading"><div><p className="eyebrow">{claim.playerIdentity.server?.displayName ?? claim.playerIdentity.gameType.replaceAll("_", " ")}</p><h2>{claim.playerIdentity.displayName}</h2><p>{claim.playerIdentity.server?.worldName ?? "Habitat identity"} claimed by {claim.user.name ?? claim.user.email ?? "Habitat member"}</p></div><div className="claim-decision"><form action={resolveIdentityClaim}><input name="claimId" type="hidden" value={claim.id} /><input name="decision" type="hidden" value="APPROVED" /><button className="icon-action approve" title="Approve claim" aria-label="Approve claim"><Check aria-hidden="true" size={17} /></button></form><form action={resolveIdentityClaim}><input name="claimId" type="hidden" value={claim.id} /><input name="decision" type="hidden" value="REJECTED" /><button className="icon-action reject" title="Reject claim" aria-label="Reject claim"><X aria-hidden="true" size={17} /></button></form></div></div></article>)}</div>}</section>;
}
