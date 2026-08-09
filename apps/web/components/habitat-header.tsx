import Link from "next/link";
import { Landmark, LogIn, Map, ScrollText, Settings, Trophy, UserRound } from "lucide-react";
import { auth } from "@/auth";

const navigation = [
  { href: "/", label: "Great Hall", icon: Landmark },
  { href: "/worlds", label: "Worlds", icon: Map },
  { href: "/departure-board", label: "Departure Board", icon: Trophy },
  { href: "/chronicle", label: "Chronicle", icon: ScrollText },
];

export async function HabitatHeader() {
  const session = await auth();
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
      <div className="header-actions">
        <div className="header-status"><span /> Registry online</div>
        {session?.user?.isActive ? (
          <>
            {session.user.role === "ADMIN" ? <Link className="profile-link" href="/admin/servers"><Settings aria-hidden="true" size={15} /> Admin</Link> : null}
            <Link className="profile-link" href="/profile"><UserRound aria-hidden="true" size={15} /> Profile</Link>
          </>
        ) : (
          <Link className="profile-link" href="/sign-in"><LogIn aria-hidden="true" size={15} /> Sign in</Link>
        )}
      </div>
    </header>
  );
}
