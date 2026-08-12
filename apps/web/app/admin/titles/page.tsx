import { Award, ChevronDown, Pencil, Plus, Users } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { createTitleDefinition, grantTitle, updateTitleDefinition } from "./actions";

const db = getPrismaClient();

export default async function AdminTitlesPage() {
  await requireRole("ADMIN");
  const [titles, users] = await Promise.all([
    db.titleDefinition.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { userTitles: true } } } }),
    db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);
  return <section className="page-shell">
    <div className="page-intro"><p className="eyebrow">Habitat administration</p><h1>Titles</h1><p>Create, edit, retire, and award titles from one controlled inventory. Editing a title updates it everywhere it is already earned without changing its stable reward link.</p></div>
    <div className="admin-title-grid">
      <form action={createTitleDefinition} className="server-editor"><div className="server-editor-heading"><div><p className="eyebrow">Definition</p><h2>New title</h2></div><Plus aria-hidden="true" size={18} /></div><div className="server-editor-fields"><label className="field-wide">Title name<input name="name" maxLength={60} required /></label><label className="field-wide">Description<textarea name="description" maxLength={180} rows={3} /></label></div><button className="save-server" type="submit"><Plus aria-hidden="true" size={16} /> Create title</button></form>
      <form action={grantTitle} className="server-editor"><div className="server-editor-heading"><div><p className="eyebrow">Manual grant</p><h2>Award a title</h2></div><Award aria-hidden="true" size={18} /></div><div className="server-editor-fields"><label className="field-wide">Title<select name="titleDefinitionId" required defaultValue=""><option disabled value="">Choose a title</option>{titles.filter((title) => title.enabled).map((title) => <option key={title.id} value={title.id}>{title.name}</option>)}</select></label><label className="field-wide">Habitat member<select name="userId" required defaultValue=""><option disabled value="">Choose a member</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name ?? user.email ?? "Habitat member"}</option>)}</select></label></div><button className="save-server" disabled={titles.length === 0 || users.length === 0} type="submit"><Award aria-hidden="true" size={16} /> Grant title</button></form>
    </div>
    <div className="title-ledger-heading"><div><p className="eyebrow">Title inventory</p><h2>Title ledger</h2></div><span>{titles.length} definitions</span></div>
    {titles.length === 0 ? <div className="chronicle-empty"><p>No title definitions yet.</p><span>Create a title only when there is a real reason to award it.</span></div> : <div className="title-ledger">
      {titles.map((title) => <details className={title.enabled ? "title-ledger-row" : "title-ledger-row retired"} key={title.id}>
        <summary><span className="title-ledger-icon"><Award aria-hidden="true" size={17} /></span><span className="title-ledger-copy"><strong>{title.name}</strong><small>{title.description ?? "No description recorded."}</small></span><span className="title-ledger-holders"><Users aria-hidden="true" size={14} /> {title._count.userTitles} holder{title._count.userTitles === 1 ? "" : "s"}</span><span className={title.enabled ? "title-ledger-state active" : "title-ledger-state"}>{title.enabled ? "Active" : "Retired"}</span><span className="title-ledger-edit"><Pencil aria-hidden="true" size={14} /> Edit <ChevronDown aria-hidden="true" size={15} /></span></summary>
        <form action={updateTitleDefinition} className="title-editor-form"><input name="id" type="hidden" value={title.id} /><div><label>Title name<input name="name" defaultValue={title.name} maxLength={60} required /></label><label>Description<textarea name="description" defaultValue={title.description ?? ""} maxLength={180} rows={3} /></label></div><footer><label>Availability<select name="enabled" defaultValue={String(title.enabled)}><option value="true">Available to award</option><option value="false">Retired — existing holders keep it</option></select></label><button className="save-server" type="submit"><Pencil aria-hidden="true" size={15} /> Save changes</button></footer></form>
      </details>)}
    </div>}
  </section>;
}
