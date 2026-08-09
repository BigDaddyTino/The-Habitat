import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/authorization";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  return (
    <section className="page-shell">
      <div className="admin-placeholder">
        <ShieldCheck aria-hidden="true" size={28} />
        <p className="eyebrow">Authorized administrator</p>
        <h1>Operations center reserved.</h1>
        <p>{user.name ?? "Admin"}, the admin center opens as server telemetry and audited operations come online.</p>
      </div>
    </section>
  );
}
