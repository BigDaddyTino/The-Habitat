import { ShieldCheck } from "lucide-react";
import { AdminSuiteNav } from "@/components/admin-suite-nav";
import { requireRole } from "@/lib/authorization";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("ADMIN");
  return <><section className="admin-suite-banner"><div className="content-shell"><ShieldCheck aria-hidden="true" size={18} /><div><p className="eyebrow">Authorized administrator</p><strong>Habitat Admin Suite</strong></div></div></section><AdminSuiteNav />{children}</>;
}
