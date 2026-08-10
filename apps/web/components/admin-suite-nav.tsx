"use client";

import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, Map } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/servers", label: "World registry", icon: Map },
  { href: "/admin/claims", label: "Identity claims", icon: ClipboardCheck },
];

export function AdminSuiteNav() {
  const pathname = usePathname();
  return <nav className="admin-suite-nav" aria-label="Admin Suite navigation"><div className="content-shell">{items.map(({ href, label, icon: Icon }) => <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon aria-hidden="true" size={15} />{label}</Link>)}</div></nav>;
}
