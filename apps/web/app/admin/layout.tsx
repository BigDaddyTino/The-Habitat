import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminSuiteNav } from "@/components/admin-suite-nav";
import { requireRole } from "@/lib/authorization";
import "./admin-suite.css";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await requireRole("ADMIN");
  return <div className="admin-suite-shell">
    <section className="admin-suite-banner">
      <div className="content-shell">
        <div className="admin-suite-brand"><span><ShieldCheck aria-hidden="true" size={21} /></span><div><p className="eyebrow">The Habitat · restricted wing</p><strong>Clubhouse administration</strong></div></div>
        <div className="admin-actor"><LockKeyhole aria-hidden="true" size={14} /><span>Authorized as</span><strong>{actor.name ?? actor.email ?? "Administrator"}</strong></div>
      </div>
    </section>
    <AdminSuiteNav />
    {children}
  </div>;
}
