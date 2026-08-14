import "./leaderboards.css";
import Link from "next/link";

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  return <><div className="page-shell leaderboard-scope-nav"><nav className="leaderboard-tabs" aria-label="Leaderboard scope"><Link href="/leaderboards">Lifetime standings</Link><Link href="/leaderboards/season">Seasonal standings</Link></nav></div>{children}</>;
}
