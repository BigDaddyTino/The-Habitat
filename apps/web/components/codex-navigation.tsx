import Link from "next/link";
import { BookMarked, BookOpen, Castle, Cog, GitBranch, History, Lightbulb, Map, MapPinned, Shield, UsersRound } from "lucide-react";

const destinations = [
  { href: "/codex", label: "Overview", icon: BookMarked },
  { href: "/codex/map", label: "Atlas", icon: MapPinned },
  { href: "/codex/stories", label: "Stories", icon: GitBranch },
  { href: "/codex/threads", label: "Threads", icon: Lightbulb },
  { href: "/codex/library/characters", label: "Characters", icon: UsersRound },
  { href: "/codex/library/factions", label: "Factions", icon: Shield },
  { href: "/codex/library/regions", label: "Regions", icon: Map },
  { href: "/codex/library/species", label: "Species", icon: Castle },
  { href: "/codex/library/systems", label: "Systems", icon: Cog },
  { href: "/codex/timeline", label: "Timeline", icon: History },
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
