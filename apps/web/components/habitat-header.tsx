import Link from "next/link";
import { Landmark, Map, ScrollText, Trophy } from "lucide-react";

const navigation = [
  { href: "/", label: "Great Hall", icon: Landmark },
  { href: "/worlds", label: "Worlds", icon: Map },
  { href: "/departure-board", label: "Departure Board", icon: Trophy },
  { href: "/chronicle", label: "Chronicle", icon: ScrollText },
];

export function HabitatHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="The Habitat home">
        <span className="brand-mark" aria-hidden="true">H</span>
        <span>
          <span className="brand-name">The Habitat</span>
          <span className="brand-subtitle">God&apos;s Country</span>
        </span>
      </Link>
      <nav aria-label="Primary navigation">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-status"><span /> Seeded preview</div>
    </header>
  );
}
