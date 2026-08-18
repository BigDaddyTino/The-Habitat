import Link from "next/link";
import { BookMarked, BookOpen, Castle, GitBranch, Map, Shield, UsersRound } from "lucide-react";

const destinations = [
  { href: "/codex", label: "Overview", icon: BookMarked },
  { href: "/codex#stories", label: "Stories", icon: GitBranch },
  { href: "/codex/library/characters", label: "Characters", icon: UsersRound },
  { href: "/codex/library/factions", label: "Factions", icon: Shield },
  { href: "/codex/library/regions", label: "Regions", icon: Map },
  { href: "/codex/library/creatures", label: "Creatures", icon: Castle },
  { href: "/codex/bible", label: "All lore", icon: BookOpen },
];

export function CodexNavigation() {
  return (
    <nav aria-label="Story Codex" className="codex-navigation">
      <div className="codex-navigation-inner">
        <span className="codex-navigation-mark">M</span>
        {destinations.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={15} /><span>{label}</span></Link>)}
      </div>
    </nav>
  );
}
