import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Crown, Flame, Ghost, ShieldAlert, Skull, Sparkles } from "lucide-react";
import { chronicleGameLabels, chronicleGameTypes, type ChronicleGameType } from "@/lib/world-data";
import { getRecordHallData, type RecordHall } from "@/lib/record-data";

type RecordHallProps = { hall: RecordHall; action: string; searchParams: { game?: string; player?: string } };

export async function RecordHall({ hall, action, searchParams }: RecordHallProps) {
  const gameType = isChronicleGameType(searchParams.game) ? searchParams.game : undefined;
  const player = searchParams.player?.trim() || undefined;
  const { definitions, players } = await getRecordHallData(hall, { gameType, player });
  const isShame = hall === "SHAME";
  const HallIcon = isShame ? ShieldAlert : Crown;
  const title = isShame ? "Hall of Shame" : "Hall of Legends";
  const oppositeHref = isShame ? "/hall-of-legends" : "/hall-of-shame";
  const oppositeLabel = isShame ? "Cross to the Hall of Legends" : "Cross to the Hall of Shame";
  const heldRecords = definitions.filter((record) => record.currentHolder).length;
  const heroImage = isShame ? "/images/halls/hall-shame-cinematic.png" : "/images/halls/hall-legends-cinematic.png";
  const heroAlt = isShame ? "The ember-lit gallery where verified gaming disasters are preserved" : "The gilded trophy chamber where verified Habitat records are honored";
  const emptyCopy = isShame
    ? "No shame category matches these filters. Clear them to see the clubhouse's verified collection of heroic mistakes."
    : "No legend category matches these filters. Clear them to reopen the complete record chamber.";

  return <section className={`record-hall-page ${isShame ? "record-hall-shame" : "record-hall-legends"}`}>
    <header className="record-hall-hero">
      <Image alt={heroAlt} fill priority sizes="100vw" src={heroImage} />
      <span className="record-hall-hero-shade" aria-hidden="true" />
      <span className="record-hall-hero-grain" aria-hidden="true" />
      <div className="record-hall-hero-copy">
        <Link className="record-hall-back" href="/halls"><ArrowLeft aria-hidden="true" /> Choose a hall</Link>
        <p className="eyebrow">The Habitat records · {isShame ? "regrettable wing" : "honored wing"}</p>
        <h1>{title}</h1>
        <p>{isShame ? "A lovingly maintained monument to bad timing, brave respawns, and choices that seemed excellent five seconds earlier." : "Verified milestones, permanent names, and the clubhouse records everyone else came to break."}</p>
        <div className="record-hall-stats">
          <span><b>{definitions.length}</b> active records</span>
          <span><b>{heldRecords}</b> names engraved</span>
          <span><b>100%</b> verified evidence</span>
        </div>
        <Link className="record-hall-cross" href={oppositeHref}>{oppositeLabel} <ArrowUpRight aria-hidden="true" /></Link>
      </div>
      <div className="record-hall-emblem" aria-hidden="true"><HallIcon /><i /><b>{isShame ? "PROBABLY FINE" : "PERMANENT RECORD"}</b></div>
      <div className="record-hall-embers" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
    </header>

    <div className="record-hall-ledger">
      <div className="record-hall-ledger-heading">
        <div><p className="eyebrow">Live clubhouse ledger</p><h2>{isShame ? "The receipts survived." : "The standard is set."}</h2></div>
        <p>{isShame ? "Funny because it happened. Fair because the same trusted rules judge everyone." : "Every value is calculated from verified identities and supported game evidence."}</p>
      </div>

      <form className="chronicle-filters record-hall-filters" action={action}>
        <label>World<select name="game" defaultValue={gameType ?? ""}><option value="">All applicable worlds</option>{chronicleGameTypes.map((game) => <option key={game} value={game}>{chronicleGameLabels[game]}</option>)}</select></label>
        <label>Record holder<select name="player" defaultValue={player ?? ""}><option value="">All record holders</option>{players.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <button type="submit">Apply filters</button>
      </form>

      {definitions.length === 0 ? <div className="record-hall-empty">
        <span className="record-hall-empty-icon"><Ghost aria-hidden="true" /></span>
        <div><p className="eyebrow">Nothing behind this velvet rope</p><h2>The filtered ledger is quiet.</h2><p>{emptyCopy}</p></div>
        <Link href={action}>Clear filters</Link>
      </div> : <div className="record-showcase-grid">{definitions.map((record, index) => {
        const holder = record.currentHolder;
        const history = record.history[0];
        const recentlyBroken = Boolean(holder && isRecentlyBroken(holder.establishedAt));
        const isDeathRecord = record.slug === "most-verified-deaths";
        const image = isDeathRecord ? "/images/halls/record-most-deaths.png" : heroImage;
        const sourceHref = holder?.sourceActivityId ? `/chronicle/activity/${holder.sourceActivityId}` : holder?.sourceEventId ? `/chronicle/${holder.sourceEventId}` : null;
        const recordWorld = record.gameType ? chronicleGameLabels[record.gameType] : record.gameKey === "MARVEL_RIVALS" ? "Marvel Rivals" : "All supported worlds";
        return <article className={`record-showcase-card ${isShame ? "shame" : "legends"}${recentlyBroken ? " recently-broken" : ""}${isDeathRecord ? " death-record" : ""}${index === 0 ? " featured" : ""}`} key={record.id}>
          <div className="record-showcase-visual">
            <Image alt="" fill sizes="(max-width: 800px) 100vw, 50vw" src={image} />
            <span className="record-showcase-vignette" aria-hidden="true" />
            <span className="record-showcase-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="record-showcase-icon" aria-hidden="true">{isDeathRecord ? <Skull /> : isShame ? <Flame /> : <Sparkles />}</span>
            {holder ? <div className="record-holder-marquee">
              <span>{isShame ? "Current owner of this masterpiece" : "Current record holder"}</span>
              <strong>{holder.holderName}</strong>
            </div> : <div className="record-holder-marquee awaiting"><span>Plinth reserved</span><strong>Awaiting a verified holder</strong></div>}
          </div>
          <div className="record-showcase-copy">
            <div className="record-showcase-kicker"><HallIcon aria-hidden="true" /><p className="eyebrow">{record.category} · {recordWorld}</p></div>
            <h2>{record.title}</h2>
            <p>{record.description}</p>
            {holder ? <>
              <div className="record-showcase-value"><strong>{holder.valueNumber.toLocaleString()}</strong><span>{record.valueLabel}</span></div>
              <div className="record-showcase-meta"><span>Engraved {holder.establishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span>{history?.priorValue === null || !history ? "First verified holder" : `Took it from ${history.priorHolderName ?? "the previous holder"} at ${history.priorValue.toLocaleString()}`}</span></div>
              {sourceHref ? <Link className="record-source-link" href={sourceHref}>Inspect the receipt <ArrowUpRight aria-hidden="true" /></Link> : null}
            </> : <div className="record-showcase-awaiting"><span>{isShame ? "The first qualifying disaster gets the plaque." : "The first qualifying feat gets the plaque."}</span><p>No placeholder name or score is invented while trusted evidence is still pending.</p></div>}
          </div>
        </article>;
      })}</div>}
    </div>
  </section>;
}

function isChronicleGameType(value: string | undefined): value is ChronicleGameType {
  return Boolean(value) && chronicleGameTypes.includes(value as ChronicleGameType);
}

/** A record established within the last 48 hours still carries the fresh-break flash. */
function isRecentlyBroken(establishedAt: Date) {
  return Date.now() - establishedAt.getTime() < 48 * 60 * 60 * 1_000;
}
