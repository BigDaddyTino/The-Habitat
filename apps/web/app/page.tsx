import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Circle, Flame, MapPinned, ShieldCheck, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { ChronicleFeed } from "@/components/chronicle-feed";
import { WorldCard } from "@/components/world-card";
import { getChronicleEvents, getWorlds } from "@/lib/world-data";
import { getActivePoll } from "@/lib/community-data";
import { ActivePoll } from "@/components/active-poll";
import { HallAtmosphere } from "@/components/hall-atmosphere";
import { getGreatHallAtmosphere } from "@/lib/hall-atmosphere";
import { ClubGameCard } from "@/components/club-game-card";
import { getClubGames } from "@/lib/club-games";
import { getLiveStreamSummary } from "@/lib/stream-showcase";
import { hasRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";

export default async function GreatHallPage() {
  const worlds = await getWorlds();
  const chronicle = await getChronicleEvents({ limit: 4 });
  const activePoll = await getActivePoll();
  const liveWorlds = worlds.filter((world) => world.state === "ONLINE");
  const reportingWorlds = worlds.filter((world) => world.state !== "UNKNOWN");
  const monitorFocus = reportingWorlds[0] ?? null;
  const activePlayers = liveWorlds.reduce((total, world) => total + (world.players ?? 0), 0);
  const atmosphere = getGreatHallAtmosphere();
  const clubGames = getClubGames();
  const liveStreams = await getLiveStreamSummary();
  const canOpenCodex = await hasRole(storyReadRole);
  return (
    <div className="great-hall">
      <section className={`hall-hero sky-${atmosphere.sky}`}>
        <div className={`hero-image hero-image-${atmosphere.sky}`} aria-hidden="true" />
        <HallAtmosphere {...atmosphere} activePlayers={activePlayers} />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content content-shell">
          <p className="eyebrow">Private operations center</p>
          <h1>The Habitat</h1>
          <p className="hero-subtitle">God&apos;s Country</p>
          <p className="hero-copy">{liveWorlds.length > 0 ? "The fires are burning." : "Quiet night in God’s Country."} Six worlds, one clubhouse, and a permanent record of every questionable decision.</p>
          <div className="hero-facts" aria-label="Current world overview">
            <div><Flame aria-hidden="true" /><strong>{liveWorlds.length}</strong><span>fires burning</span></div>
            <div><UsersRound aria-hidden="true" /><strong>{activePlayers}</strong><span>players online</span></div>
            <div><ShieldCheck aria-hidden="true" /><strong>{worlds.length}</strong><span>worlds registered</span></div>
          </div>
          <Link className="primary-link" href="/games">Browse the game rooms <ArrowRight aria-hidden="true" size={17} /></Link>
          {liveStreams.liveCount > 0 ? <div className="hall-live-strip">
            <span className="stream-live-pip"><Circle aria-hidden="true" size={7} /> On air</span>
            <div>
              <strong>{liveStreams.topDisplayName ?? "A member"} is streaming</strong>
              <small>{liveStreams.liveCount === 1 ? "One channel live right now" : `${liveStreams.liveCount} channels live right now`}</small>
            </div>
            <Link href="/streams">Open the broadcast wing <ArrowRight aria-hidden="true" size={14} /></Link>
          </div> : null}
        </div>
      </section>

      <section className="content-shell world-section">
        <div className="section-heading">
          <div><p className="eyebrow">World registry</p><h2>Tonight in the Habitat</h2></div>
        </div>
        <div className="world-grid">
          {worlds.map((world) => <WorldCard world={world} key={world.slug} />)}
        </div>
      </section>

      <section className="content-shell hall-club-section">
        <div className="section-heading">
          <div><p className="eyebrow">The club rooms</p><h2>Not every fight needs our server.</h2></div>
          <Link href="/games#club-rooms">All games <ArrowRight aria-hidden="true" size={15} /></Link>
        </div>
        <div className="club-room-grid">{clubGames.map((game) => <ClubGameCard game={game} key={game.slug} />)}</div>
      </section>

      {canOpenCodex ? <section className="content-shell hall-atlas-section">
        <Link className="hall-atlas-card" href="/codex/map">
          <Image unoptimized fill sizes="(max-width: 1200px) 100vw, 1200px" src="/codex-map/martino-world/v1.png" alt="The locked Martino V2 world atlas showing its macro regions, ocean, peninsula, and cities" />
          <span className="hall-atlas-shade" aria-hidden="true" />
          <span className="hall-atlas-copy"><span className="eyebrow">Martino Codex area</span><strong><MapPinned aria-hidden="true" size={22}/> Enter the World Atlas</strong><small>Explore biomes, cities, POIs, factions, and quest locations on the living Codex map.</small><span className="hall-atlas-action">Open interactive map <ArrowRight aria-hidden="true" size={15}/></span></span>
        </Link>
      </section> : null}

      <section className="content-shell lower-grid">
        <div className="chronicle-panel">
          <div className="panel-heading"><div><p className="eyebrow">The Habitat Chronicle</p><h2>Recent dispatches</h2></div><Link href="/chronicle">All history <ArrowRight size={15} /></Link></div>
          <ChronicleFeed events={chronicle} compact />
        </div>
        <aside className="fire-panel">
          <p className="eyebrow">Monitor report</p>
          <h2>{monitorFocus ? `${monitorFocus.game} is ${monitorFocus.state.replaceAll("_", " ").toLowerCase()}.` : "Waiting on the first report."}</h2>
          <p>{monitorFocus ? `${reportingWorlds.length} world${reportingWorlds.length === 1 ? " is" : "s are"} reporting verified runtime state through the Habitat Agent.` : "The dashboard will remain unknown until the worker records verified agent telemetry."}</p>
          <div className="fire-panel-status"><StatusBadge state={monitorFocus?.state ?? "UNKNOWN"} /><span>{monitorFocus ? `Last fire: ${monitorFocus.lastFire}` : "Waiting on MartServ102 telemetry"}</span></div>
        </aside>
      </section>
      {activePoll ? <section className="content-shell poll-home-section"><ActivePoll poll={activePoll} /></section> : null}
    </div>
  );
}
