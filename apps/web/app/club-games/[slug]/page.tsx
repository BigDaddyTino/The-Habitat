import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, BadgeCheck, BarChart3, Crown, Gamepad2, RefreshCw, Shield, Swords, Unlink, UserRound, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { MarvelRivalsLinkForm } from "@/components/marvel-rivals-link-form";
import { getClubGameBySlug } from "@/lib/club-games";
import { getGameDispatches } from "@/lib/game-news";
import { getPrismaClient } from "@habitat/db/client";
import { resolveMarvelRivalsProvider } from "@habitat/shared";
import { disconnectMarvelRivalsProfile, refreshMarvelRivalsProfile, updateMarvelRivalsVisibility } from "./actions";

const db = getPrismaClient();

function when(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

export default async function ClubGameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getClubGameBySlug(slug);
  if (!game || slug !== "marvel-rivals") notFound();

  const session = await auth();
  const memberId = session?.user?.id && session.user.isActive ? session.user.id : null;
  const [profiles, ownProfile, dispatches, recentMatches, matchCoverage, ownSteamAccount] = await Promise.all([
    db.clubGameProfile.findMany({
      where: { gameType: "MARVEL_RIVALS", displayPublic: true },
      orderBy: [{ rankScore: "desc" }, { displayName: "asc" }],
      take: 24,
      select: {
        id: true, displayName: true, platform: true, rankName: true, rankScore: true, totalMatches: true, totalWins: true, lastSyncedAt: true,
        user: { select: { username: true, displayName: true, name: true, socialAccounts: { where: { platform: "STEAM", verifiedAt: { not: null } }, select: { id: true }, take: 1 } } },
      },
    }),
    memberId ? db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: memberId, gameType: "MARVEL_RIVALS" } }, include: { snapshots: { orderBy: { sampledAt: "asc" }, select: { sampledAt: true, rankName: true, rankScore: true } }, matchParticipants: { orderBy: { match: { occurredAt: "desc" } }, take: 10, include: { match: true, heroPerformances: true } } } }) : null,
    getGameDispatches(slug),
    db.clubGameMatch.findMany({ where: { gameType: "MARVEL_RIVALS", participants: { some: { clubGameProfile: { displayPublic: true } } } }, orderBy: { occurredAt: "desc" }, take: 18, include: { participants: { where: { clubGameProfile: { displayPublic: true } }, include: { clubGameProfile: { select: { id: true, displayName: true, user: { select: { username: true, displayName: true, name: true } } } }, heroPerformances: { take: 2 } } } } }),
    db.clubGameMatch.aggregate({ where: { gameType: "MARVEL_RIVALS", participants: { some: { clubGameProfile: { displayPublic: true } } } }, _count: { id: true }, _min: { occurredAt: true }, _max: { occurredAt: true } }),
    memberId ? db.userSocialAccount.findFirst({ where: { userId: memberId, platform: "STEAM", verifiedAt: { not: null } }, select: { id: true } }) : null,
  ]);
  const steamLinked = Boolean(ownSteamAccount);
  const squad = profiles.slice(0, game.squadSize);
  const providerReady = Boolean(resolveMarvelRivalsProvider(process.env));
  const recentWins = ownProfile?.matchParticipants.filter((participant) => participant.result === "WIN").length ?? 0;
  const sharedMatches = recentMatches.filter((match) => match.participants.length > 1);
  const firstRank = ownProfile?.snapshots.find((snapshot) => snapshot.rankScore !== null);
  const latestRank = [...(ownProfile?.snapshots ?? [])].reverse().find((snapshot) => snapshot.rankScore !== null);

  return <section className={`page-shell club-room-page club-${game.accent}`}>
    <Link className="club-room-back" href="/games#club-rooms"><ArrowLeft aria-hidden="true" size={15} /> All games</Link>

    <header className="club-room-hero">
      <div className="club-room-hero-copy">
        <p className="eyebrow"><Swords aria-hidden="true" size={13} /> {game.roomName}</p>
        <h1>{game.name}</h1>
        <p className="club-room-tagline">{game.tagline}</p>
        <p>{game.description}</p>
        <div className="club-room-facts">
          <span><UsersRound aria-hidden="true" size={15} /> {game.squadSize}-player squads</span>
          <span><Shield aria-hidden="true" size={15} /> Club game</span>
          <span><Gamepad2 aria-hidden="true" size={15} /> Member-linked stats</span>
        </div>
      </div>
    </header>

    <div className="club-room-board">
      <section className="squad-board">
        <div className="club-board-heading"><div><p className="eyebrow">The active roster</p><h2>Squad board</h2></div><span>{squad.length} / {game.squadSize}</span></div>
        <div className="squad-seats">
          {Array.from({ length: game.squadSize }, (_, index) => {
            const profile = squad[index];
            if (!profile) return <div className="open" key={`open-${index}`}><UserRound aria-hidden="true" size={18} /><span>Open seat</span></div>;
            const memberName = profile.user.displayName ?? profile.user.name ?? profile.displayName;
            const content = <><strong>{memberName}</strong><span>{profile.displayName} · {profile.rankName ?? "Unranked"}</span>{profile.user.socialAccounts.length ? <small><BadgeCheck aria-hidden="true" size={10} /> Steam member</small> : null}</>;
            return profile.user.username ? <Link className="filled" href={`/members/${profile.user.username}`} key={profile.id}>{content}</Link> : <div className="filled" key={profile.id}>{content}</div>;
          })}
        </div>
        <p className="club-board-empty">The board fills from linked member profiles. It is not a live party or presence list.</p>
      </section>

      <aside className="club-board-side">
        <article className="rivals-standings">
          <Crown aria-hidden="true" size={20} />
          <p className="eyebrow">Member standings</p>
          <h2>{profiles.length ? "Assembly rank" : "No challengers yet"}</h2>
          {profiles.length ? <ol>{profiles.slice(0, 5).map((profile, index) => <li key={profile.id}><b>{index + 1}</b><span><strong>{profile.displayName}</strong><small>{profile.rankName ?? "Unranked"}</small></span><em>{profile.totalWins ?? "—"} W</em></li>)}</ol> : <p>Connect a public Rivals profile to open the board.</p>}
        </article>
        <article>
          <BarChart3 aria-hidden="true" size={20} />
          <p className="eyebrow">Inside this room</p>
          <ul>{game.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </article>
      </aside>
    </div>

    <section className="rivals-match-room">
      <div className="rivals-match-heading"><div><p className="eyebrow"><Activity aria-hidden="true" size={13} /> Provider-tracked activity</p><h2>Recent form</h2></div><span>{matchCoverage._count.id.toLocaleString()} tracked matches{matchCoverage._min.occurredAt ? ` · since ${matchCoverage._min.occurredAt.toLocaleDateString()}` : ""}</span></div>
      {recentMatches.length ? <div className="rivals-match-layout"><div className="rivals-match-feed">{recentMatches.slice(0, 10).map((match) => <article key={match.id}><time dateTime={match.occurredAt.toISOString()}>{when(match.occurredAt)}</time><div>{match.participants.map((participant) => { const memberName = participant.clubGameProfile.user.displayName ?? participant.clubGameProfile.user.name ?? participant.clubGameProfile.displayName; const hero = participant.heroPerformances[0]?.heroName; const content = <><strong>{memberName}</strong><span className={`match-result ${participant.result.toLowerCase()}`}>{participant.result}</span><small>{hero ? `${hero} · ` : ""}{participant.kills ?? "—"}/{participant.deaths ?? "—"}/{participant.assists ?? "—"}{participant.mvp ? " · MVP" : participant.svp ? " · SVP" : ""}</small></>; return participant.clubGameProfile.user.username ? <Link href={`/members/${participant.clubGameProfile.user.username}`} key={participant.id}>{content}</Link> : <div key={participant.id}>{content}</div>; })}</div><footer>{match.durationSeconds ? `${Math.round(match.durationSeconds / 60)} min · ` : ""}{match.seasonKey ? `Season ${match.seasonKey} · ` : ""}{match.providerMatchId}</footer></article>)}</div><aside><p className="eyebrow">Shared Habitat matches</p><strong>{sharedMatches.length}</strong><span>among the newest {recentMatches.length}</span><p>Matching provider match IDs prove co-participation. They do not prove a premade party, and members with private or unsynced profiles are not counted.</p></aside></div> : <div className="chronicle-empty"><p>No provider-tracked matches yet.</p><span>{providerReady ? "The worker will ingest bounded recent history for linked public profiles." : "Match history remains offline until a stats provider is configured and validated."}</span></div>}
    </section>

    <section className="rivals-account-panel">
      <div className="rivals-account-copy">
        <p className="eyebrow">Your seat at the table</p>
        <h2>{ownProfile ? ownProfile.displayName : "Link your Rivals profile"}</h2>
        {ownProfile ? <><p><span className="member-linked-mark"><Shield aria-hidden="true" size={12} /> Member-linked</span> {ownProfile.rankName ?? "Unranked"}{ownProfile.playerLevel ? ` · Level ${ownProfile.playerLevel}` : ""}</p><small>{ownProfile.lastSyncedAt ? `Stats updated ${when(ownProfile.lastSyncedAt)}` : "Awaiting first stat refresh"}{ownProfile.syncStatus !== "READY" ? ` · ${ownProfile.syncStatus.toLowerCase()}` : ""} · matches {ownProfile.matchStatus.toLowerCase()}</small>{ownProfile.matchHistoryGapDetected ? <small className="rivals-coverage-warning">A provider-history gap was detected. Cumulative facts remain labeled as partial; streak awards are paused.</small> : null}{!steamLinked ? <small className="rivals-coverage-warning">No verified Steam account is linked, so stats refresh once a day. <Link href="/profile">Link Steam</Link> and Habitat refreshes hourly while Steam shows you in the game, plus one more pass after you stop.</small> : null}{ownProfile.matchParticipants.length ? <div className="member-recent-form"><span>Last {ownProfile.matchParticipants.length}</span><div>{ownProfile.matchParticipants.map((participant) => <i className={participant.result.toLowerCase()} key={participant.id}>{participant.result === "WIN" ? "W" : participant.result === "LOSS" ? "L" : "—"}</i>)}</div><strong>{recentWins}-{ownProfile.matchParticipants.length - recentWins} tracked form</strong>{firstRank?.rankScore !== null && firstRank?.rankScore !== undefined && latestRank?.rankScore !== null && latestRank?.rankScore !== undefined ? <em>{latestRank.rankScore - firstRank.rankScore >= 0 ? "+" : ""}{latestRank.rankScore - firstRank.rankScore} rating across {ownProfile.snapshots.length} snapshots</em> : null}</div> : null}</> : <p>Steam verifies who you are in Habitat. Rivals uses a separate in-game UID, so this connection is member-linked—not an ownership claim.</p>}
      </div>
      {memberId ? ownProfile ? <div className="rivals-profile-actions"><form action={refreshMarvelRivalsProfile}><button type="submit"><RefreshCw aria-hidden="true" size={14} /> Refresh stats</button></form><form action={updateMarvelRivalsVisibility}><label className="rivals-public-toggle"><input defaultChecked={ownProfile.displayPublic} name="displayPublic" type="checkbox" /> Share provider profile and match evidence</label><button type="submit">Save privacy</button></form><form action={disconnectMarvelRivalsProfile}><button className="quiet" type="submit"><Unlink aria-hidden="true" size={14} /> Disconnect and delete provider data</button></form></div> : <MarvelRivalsLinkForm providerReady={providerReady} steamLinked={steamLinked} /> : <Link className="rivals-sign-in" href="/sign-in">Sign in to link a profile</Link>}
    </section>

    <section className="dispatch-strip club-dispatches">
      <div><p className="eyebrow">Latest dispatches</p><h2>Rivals news</h2></div>
      {dispatches.length ? <ol>{dispatches.map((dispatch) => <li key={dispatch.id}><a href={dispatch.url} rel="noreferrer" target="_blank"><span>{dispatch.kind} · {when(dispatch.publishedAt)}</span><strong>{dispatch.title}</strong>{dispatch.summary ? <small>{dispatch.summary}</small> : null}</a></li>)}</ol> : <p>There are no recent official announcements in the monitored Steam feed.</p>}
    </section>

    <footer className="club-room-status"><span>{providerReady ? "Stats service ready" : "Stats linking awaits provider configuration"}</span><p>News comes from the official Steam announcement feed. Profile data is refreshed only for members who connect it.</p></footer>
  </section>;
}
