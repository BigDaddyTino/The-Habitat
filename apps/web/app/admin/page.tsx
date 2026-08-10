import { ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/authorization";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  return (
    <section className="page-shell">
      <div className="admin-placeholder">
        <ShieldCheck aria-hidden="true" size={28} />
        <p className="eyebrow">Authorized administrator</p>
        <h1>Operations center reserved.</h1>
        <p>{user.name ?? "Admin"}, registry metadata is ready. Monitoring and audited operations follow as their phases open.</p>
        <div className="admin-links"><Link className="primary-link admin-link" href="/admin/servers">Manage world registry</Link><Link className="primary-link admin-link" href="/admin/claims"><ClipboardCheck aria-hidden="true" size={16} /> Identity claims</Link></div>
      </div>
    </section>
  );
}
