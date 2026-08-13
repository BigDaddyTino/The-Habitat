import Link from "next/link";
import { Award, ChevronDown, Crown, Landmark, LogIn, Radio, ScrollText, Settings, Swords, Target, Trophy, UserRound, Users } from "lucide-react";
import { auth } from "@/auth";
import { getLiveStreamSummary } from "@/lib/stream-showcase";

const navigation = [
  { href: "/", label: "Great Hall", icon: Landmark },
  { href: "/games", label: "Games", icon: Swords },
  { href: "/chronicle", label: "Chronicle", icon: ScrollText },
  { href: "/members", label: "Members", icon: Users },
];

const progressNavigation = [
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/quests", label: "Quests", icon: Target },
  { href: "/hall-of-legends", label: "Halls", icon: Crown },
];

export async function HabitatHeader() {
  const [session, liveStreams] = await Promise.all([auth(), getLiveStreamSummary()]);
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="The Habitat home">
        <span className="brand-mark" aria-hidden="true">H</span>
        <span>
          <span className="brand-name">The Habitat</span>
          <span className="brand-subtitle">God&apos;s Country</span>
        </span>
      </Link>
      <nav aria-label="Primary navigation" className="primary-nav">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
        <Link href="/streams">
          {liveStreams.liveCount > 0
            ? <span className="nav-live-flag"><i aria-hidden="true" />{liveStreams.liveCount} Live</span>
            : <><Radio aria-hidden="true" size={16} strokeWidth={1.8} /> Streams</>}
        </Link>
        <details className="nav-cluster">
          <summary><Crown aria-hidden="true" size={16} strokeWidth={1.8} /> Progress <ChevronDown aria-hidden="true" className="nav-cluster-caret" size={13} /></summary>
          <div className="nav-cluster-panel">
            {progressNavigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={16} /><span>{label}</span></Link>)}
          </div>
        </details>
      </nav>
      <div className="header-actions">
        <div className="header-status"><span /> Registry online</div>
        {session?.user?.isActive ? (
          <>
            {session.user.role === "ADMIN" ? <Link className="profile-link" href="/admin"><Settings aria-hidden="true" size={15} /> Admin</Link> : null}
            <Link className="profile-link" href="/profile"><UserRound aria-hidden="true" size={15} /> Profile</Link>
          </>
        ) : (
          <Link className="profile-link" href="/sign-in"><LogIn aria-hidden="true" size={15} /> Sign in</Link>
        )}
      </div>
    </header>
  );
}
