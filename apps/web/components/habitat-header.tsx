import Link from "next/link";
import { Award, CalendarRange, ChevronDown, Crown, Landmark, LogIn, Menu, NotebookPen, Radio, ScrollText, Settings, Swords, Target, Trophy, UserRound, Users } from "lucide-react";
import { auth } from "@/auth";
import { NavDisclosure } from "@/components/nav-disclosure";
import { getLiveStreamSummary } from "@/lib/stream-showcase";

const navigation = [
  { href: "/", label: "Great Hall", icon: Landmark },
  { href: "/games", label: "Games", icon: Swords },
  { href: "/chronicle", label: "Chronicle", icon: ScrollText },
];

const communityNavigation = [
  { href: "/members", label: "Members", icon: Users },
];

const progressNavigation = [
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/quests", label: "Quests", icon: Target },
  { href: "/seasons", label: "Seasons", icon: CalendarRange },
  { href: "/halls", label: "Halls", icon: Crown },
];

export async function HabitatHeader() {
  const [session, liveStreams] = await Promise.all([auth(), getLiveStreamSummary()]);
  const canOpenCodex = Boolean(session?.user?.isActive && session.user.role !== "VIEWER");
  const streamLabel = liveStreams.liveCount > 0 ? `${liveStreams.liveCount} Live` : "Streams";

  const streamLink = (
    <Link href="/streams" aria-label={liveStreams.liveCount > 0 ? `Streams, ${liveStreams.liveCount} live` : "Streams"}>
      {liveStreams.liveCount > 0
        ? <span className="nav-live-flag"><i aria-hidden="true" /><span>{streamLabel}</span></span>
        : <><Radio aria-hidden="true" size={16} strokeWidth={1.8} /><span>Streams</span></>}
    </Link>
  );

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
          <Link href={href} key={href} aria-label={label}>
            <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
            <span className="nav-label">{label}</span>
          </Link>
        ))}
        {streamLink}
        <NavDisclosure className="nav-cluster">
          <summary aria-label="More destinations"><Menu aria-hidden="true" size={16} strokeWidth={1.8} /><span className="nav-label">Explore</span><ChevronDown aria-hidden="true" className="nav-cluster-caret" size={13} /></summary>
          <div className="nav-cluster-panel">
            <p>Clubhouse</p>
            {communityNavigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={16} /><span>{label}</span></Link>)}
            {/* Unreleased plot for a game that has not shipped, so it is only
                advertised to members who can actually open it. */}
            {canOpenCodex ? <Link href="/codex"><NotebookPen aria-hidden="true" size={16} /><span>Codex</span></Link> : null}
            <p>Progress</p>
            {progressNavigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={16} /><span>{label}</span></Link>)}
          </div>
        </NavDisclosure>
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
      <NavDisclosure className="mobile-navigation">
        <summary><Menu aria-hidden="true" size={19} /><span>Menu</span><ChevronDown aria-hidden="true" size={14} /></summary>
        <div className="mobile-navigation-panel">
          <p>Clubhouse</p>
          <nav aria-label="Mobile primary navigation">
            {navigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={18} /><span>{label}</span></Link>)}
            {communityNavigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={18} /><span>{label}</span></Link>)}
            {streamLink}
            {canOpenCodex ? <Link href="/codex"><NotebookPen aria-hidden="true" size={18} /><span>Codex</span></Link> : null}
          </nav>
          <p>Progress</p>
          <nav aria-label="Mobile progress navigation">
            {progressNavigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon aria-hidden="true" size={18} /><span>{label}</span></Link>)}
          </nav>
          <p>Account</p>
          <nav aria-label="Mobile account navigation">
            {session?.user?.isActive ? (
              <>
                {session.user.role === "ADMIN" ? <Link href="/admin"><Settings aria-hidden="true" size={18} /><span>Admin</span></Link> : null}
                <Link href="/profile"><UserRound aria-hidden="true" size={18} /><span>Profile</span></Link>
              </>
            ) : <Link href="/sign-in"><LogIn aria-hidden="true" size={18} /><span>Sign in</span></Link>}
          </nav>
        </div>
      </NavDisclosure>
    </header>
  );
}
