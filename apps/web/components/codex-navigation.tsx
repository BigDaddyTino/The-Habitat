"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookMarked, BookOpen, Castle, ChevronDown, Cog, Crown, GitBranch, Hammer, History,
  Library, Lightbulb, Map, MapPinned, Shield, Swords, UsersRound, Waypoints,
} from "lucide-react";

/**
 * The codex header, grouped so it stops growing sideways: two flagship
 * links stay on the bar, and everything else files into three dropdowns —
 * the Library (the shelves), Play (the game-system surfaces), and Story
 * (the writing). The active route lights its group even when closed.
 */

type NavLink = { href: string; label: string; icon: typeof BookMarked; exact?: boolean };
type NavGroup = { label: string; icon: typeof BookMarked; links: NavLink[] };
type NavItem = NavLink | NavGroup;

const items: NavItem[] = [
  { href: "/codex", label: "Overview", icon: BookMarked, exact: true },
  { href: "/codex/map", label: "Atlas", icon: MapPinned },
  {
    label: "Library",
    icon: Library,
    links: [
      { href: "/codex/library/characters", label: "Characters", icon: UsersRound },
      { href: "/codex/library/factions", label: "Factions", icon: Shield },
      { href: "/codex/library/regions", label: "Regions", icon: Map },
      { href: "/codex/library/species", label: "Species", icon: Castle },
      { href: "/codex/library/systems", label: "Systems", icon: Cog },
      { href: "/codex/bible", label: "All lore", icon: BookOpen },
    ],
  },
  {
    label: "Play",
    icon: Swords,
    links: [
      { href: "/codex/talents", label: "Talents", icon: Waypoints },
      { href: "/codex/professions", label: "Trades", icon: Hammer },
      { href: "/codex/kingdom", label: "Kingdom", icon: Crown },
    ],
  },
  {
    label: "Story",
    icon: GitBranch,
    links: [
      { href: "/codex/stories", label: "Stories", icon: GitBranch },
      { href: "/codex/threads", label: "Threads", icon: Lightbulb },
      { href: "/codex/timeline", label: "Timeline", icon: History },
    ],
  },
];

const isGroup = (item: NavItem): item is NavGroup => "links" in item;

export function CodexNavigation() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // A click anywhere else, or Escape, closes the open menu.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const linkActive = (link: NavLink) => (link.exact ? pathname === link.href : pathname.startsWith(link.href));

  return (
    <nav aria-label="Story Codex" className="codex-navigation" ref={navRef}>
      <div className="codex-navigation-inner">
        <span className="codex-navigation-mark">M</span>
        {items.map((item) => {
          if (!isGroup(item)) {
            const Icon = item.icon;
            return (
              <Link className={linkActive(item) ? "is-here" : undefined} href={item.href} key={item.href} onClick={() => setOpen(null)}>
                <Icon aria-hidden="true" size={15} /><span>{item.label}</span>
              </Link>
            );
          }
          const Icon = item.icon;
          const groupActive = item.links.some(linkActive);
          const opened = open === item.label;
          return (
            <div className="codex-nav-group" key={item.label}>
              <button
                aria-expanded={opened}
                aria-haspopup="menu"
                className={`${groupActive ? "is-here " : ""}${opened ? "is-open" : ""}`}
                onClick={() => setOpen(opened ? null : item.label)}
                type="button"
              >
                <Icon aria-hidden="true" size={15} /><span>{item.label}</span><ChevronDown aria-hidden="true" size={12} />
              </button>
              {opened ? (
                <div className="codex-nav-menu" role="menu">
                  {item.links.map((link) => {
                    const LinkIcon = link.icon;
                    return (
                      <Link className={linkActive(link) ? "is-here" : undefined} href={link.href} key={link.href} onClick={() => setOpen(null)} role="menuitem">
                        <LinkIcon aria-hidden="true" size={14} /><span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
