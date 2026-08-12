import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BarChart3, Crown, Gamepad2, RefreshCw, Shield, Swords, Unlink, UserRound, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { MarvelRivalsLinkForm } from "@/components/marvel-rivals-link-form";
import { getClubGameBySlug } from "@/lib/club-games";
import { getGameDispatches } from "@/lib/game-news";
import { getPrismaClient } from "@habitat/db/client";
import { disconnectMarvelRivalsProfile, refreshMarvelRivalsProfile } from "./actions";

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
  const [profiles, ownProfile, dispatches] = await Promise.all([
    db.clubGameProfile.findMany({
      where: { gameType: "MARVEL_RIVALS", displayPublic: true },
      orderBy: [{ rankScore: "desc" }, { displayName: "asc" }],
      take: 24,
      select: {
        id: true, displayName: true, platform: true, rankName: true, rankScore: true, totalMatches: true, totalWins: true, lastSyncedAt: true,
        user: { select: { username: true, displayName: true, name: true, socialAccounts: { where: { platform: "STEAM", verifiedAt: { not: null } }, select: { id: true }, take: 1 } } },
      },
    }),
    memberId ? db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: memberId, gameType: "MARVEL_RIVALS" } } }) : null,
    getGameDispatches(slug),
  ]);
  const squad = profiles.slice(0, game.squadSize);
  const providerReady = Boolean(process.env.MARVEL_RIVALS_API_KEY?.trim());

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

    <section className="rivals-account-panel">
      <div className="rivals-account-copy">
        <p className="eyebrow">Your seat at the table</p>
        <h2>{ownProfile ? ownProfile.displayName : "Link your Rivals profile"}</h2>
        {ownProfile ? <><p><span className="member-linked-mark"><Shield aria-hidden="true" size={12} /> Member-linked</span> {ownProfile.rankName ?? "Unranked"}{ownProfile.playerLevel ? ` · Level ${ownProfile.playerLevel}` : ""}</p><small>{ownProfile.lastSyncedAt ? `Updated ${when(ownProfile.lastSyncedAt)}` : "Awaiting first stat refresh"}{ownProfile.syncStatus !== "READY" ? ` · ${ownProfile.syncStatus.toLowerCase()}` : ""}</small></> : <p>Steam verifies who you are in Habitat. Rivals uses a separate in-game UID, so this connection is member-linked—not an ownership claim.</p>}
      </div>
      {memberId ? ownProfile ? <div className="rivals-profile-actions"><form action={refreshMarvelRivalsProfile}><button type="submit"><RefreshCw aria-hidden="true" size={14} /> Refresh stats</button></form><form action={disconnectMarvelRivalsProfile}><button className="quiet" type="submit"><Unlink aria-hidden="true" size={14} /> Disconnect</button></form></div> : <MarvelRivalsLinkForm providerReady={providerReady} /> : <Link className="rivals-sign-in" href="/sign-in">Sign in to link a profile</Link>}
    </section>

    <section className="dispatch-strip club-dispatches">
      <div><p className="eyebrow">Latest dispatches</p><h2>Rivals news</h2></div>
      {dispatches.length ? <ol>{dispatches.map((dispatch) => <li key={dispatch.id}><a href={dispatch.url} rel="noreferrer" target="_blank"><span>{dispatch.kind} · {when(dispatch.publishedAt)}</span><strong>{dispatch.title}</strong>{dispatch.summary ? <small>{dispatch.summary}</small> : null}</a></li>)}</ol> : <p>There are no recent official announcements in the monitored Steam feed.</p>}
    </section>

    <footer className="club-room-status"><span>{providerReady ? "Stats service ready" : "Stats linking awaits provider configuration"}</span><p>News comes from the official Steam announcement feed. Profile data is refreshed only for members who connect it.</p></footer>
  </section>;
}
