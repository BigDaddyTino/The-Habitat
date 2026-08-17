"use client";

import Link from "next/link";
import { Activity, Award, CalendarRange, ClipboardCheck, Flame, LayoutDashboard, Map, MessageCircle, NotebookPen, RadioTower, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const groups = [
  { label: "Command", items: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/claims", label: "Claims", icon: ClipboardCheck },
  ] },
  { label: "Worlds", items: [
    { href: "/admin/servers", label: "Registry", icon: Map },
    { href: "/admin/operations", label: "Operations", icon: RadioTower },
    { href: "/admin/pulse", label: "Pulse", icon: Activity },
  ] },
  { label: "Clubhouse", items: [
    { href: "/admin/community", label: "Community", icon: Flame },
    { href: "/admin/titles", label: "Titles", icon: Award },
    { href: "/admin/seasons", label: "Seasons", icon: CalendarRange },
    { href: "/admin/discord", label: "Discord", icon: MessageCircle },
    { href: "/admin/story", label: "Story export", icon: NotebookPen },
  ] },
];

export function AdminSuiteNav() {
  const pathname = usePathname();
  return <nav className="admin-suite-nav" aria-label="Admin Suite navigation"><div className="content-shell">{groups.map((group) => <div className="admin-nav-group" key={group.label}><span>{group.label}</span><div>{group.items.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
    return <Link aria-current={active ? "page" : undefined} className={active ? "active" : ""} href={href} key={href}><Icon aria-hidden="true" size={15} />{label}</Link>;
  })}</div></div>)}</div></nav>;
}
