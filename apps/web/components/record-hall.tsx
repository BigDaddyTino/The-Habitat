import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Award, Compass, Crown, Gamepad2, Ghost, Globe, Handshake, HeartCrack, Medal, ShieldAlert, Skull, Swords, Users } from "lucide-react";
import { chronicleGameLabels } from "@/lib/world-data";
import { getRecordHallData, type RecordHall } from "@/lib/record-data";
import { groupRecordsByCategory, resolveHallCategoryArt, type HallCategoryIcon } from "@/lib/hall-categories";

const categoryIcons: Record<HallCategoryIcon, typeof Crown> = {
  visits: Users,
  exploration: Compass,
  combat: Swords,
  achievement: Medal,
  arena: Gamepad2,
  deaths: Skull,
  spread: Globe,
  defeat: HeartCrack,
  "runner-up": Award,
  support: Handshake,
};

export async function RecordHall({ hall }: { hall: RecordHall }) {
  const { definitions, activeRecords } = await getRecordHallData(hall);
  const categories = groupRecordsByCategory(hall, definitions);
  const isShame = hall === "SHAME";
  const HallIcon = isShame ? ShieldAlert : Crown;
  const title = isShame ? "Hall of Shame" : "Hall of Legends";
  const oppositeHref = isShame ? "/hall-of-legends" : "/hall-of-shame";
  const oppositeLabel = isShame ? "Cross to the Hall of Legends" : "Cross to the Hall of Shame";
  const heldRecords = definitions.filter((record) => record.currentHolder).length;
  const heroImage = isShame ? "/images/halls/hall-shame-cinematic.png" : "/images/halls/hall-legends-cinematic.png";
  const heroAlt = isShame ? "The ember-lit gallery where verified gaming disasters are preserved" : "The gilded trophy chamber where verified Habitat records are honored";

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
          <span><b>{categories.length}</b> categories</span>
          <span><b>{activeRecords}</b> active records</span>
          <span><b>{heldRecords}</b> names engraved</span>
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

      {categories.length === 0 ? <div className="record-hall-empty">
        <span className="record-hall-empty-icon"><Ghost aria-hidden="true" /></span>
        <div><p className="eyebrow">Nothing behind this velvet rope</p><h2>The ledger is quiet.</h2><p>{isShame ? "No shame category is active yet. Habitat has not connected a trusted source for this wing." : "No verified record definition is active yet."}</p></div>
      </div> : <div className="record-category-stack">{categories.map(({ category, records }, categoryIndex) => {
        const CategoryIcon = categoryIcons[category.icon];
        const categoryArt = resolveHallCategoryArt(hall, category, heroImage);
        const categoryHolders = records.filter((record) => record.currentHolder).length;
        const liveRecords = records.filter((record) => record.enabled).length;
        const dormant = liveRecords === 0;
        return <section className={`record-category${dormant ? " dormant" : ""}`} key={category.slug} aria-labelledby={`category-${category.slug}`}>
          <div className="record-category-banner">
            <Image alt="" fill sizes="(max-width: 900px) 100vw, 1200px" src={categoryArt} />
            <span className="record-category-veil" aria-hidden="true" />
            <span className="record-category-index" aria-hidden="true">{String(categoryIndex + 1).padStart(2, "0")}</span>
            <span className="record-category-mark" aria-hidden="true"><CategoryIcon /></span>
            <div className="record-category-copy">
              <p className="eyebrow">{category.category}</p>
              <h2 id={`category-${category.slug}`}>{category.headline}</h2>
              <p>{category.blurb}</p>
              {dormant ? <span className="record-category-dormant">Source not connected · nothing is counted here yet</span> : null}
            </div>
            <dl className="record-category-tally">
              <div><dt>Records</dt><dd>{liveRecords}</dd></div>
              <div><dt>Engraved</dt><dd>{categoryHolders}</dd></div>
            </dl>
          </div>
          <div className="record-showcase-grid">{records.map((record, index) => {
            const holder = record.currentHolder;
            const history = record.history[0];
            const recentlyBroken = Boolean(holder && isRecentlyBroken(holder.establishedAt));
            const sourceHref = holder?.sourceActivityId && isPubliclyViewable(holder.sourceActivity) ? `/chronicle/activity/${holder.sourceActivityId}` : holder?.sourceEventId ? `/chronicle/${holder.sourceEventId}` : null;
            const recordWorld = record.gameType ? chronicleGameLabels[record.gameType] : record.gameKey === "MARVEL_RIVALS" ? "Marvel Rivals" : "All supported worlds";
            return <article className={`record-showcase-card ${isShame ? "shame" : "legends"}${recentlyBroken ? " recently-broken" : ""}${records.length === 1 ? " solo" : ""}${record.enabled ? "" : " pending-source"}`} key={record.id}>
              <div className="record-showcase-copy">
                <div className="record-showcase-kicker"><CategoryIcon aria-hidden="true" /><p className="eyebrow">{recordWorld}</p><span className="record-showcase-number">{String(index + 1).padStart(2, "0")}</span></div>
                <h3>{record.title}</h3>
                <p>{record.description}</p>
                {!record.enabled ? <div className="record-showcase-awaiting">
                  <span>Awaiting a trusted source</span>
                  <p>This record is defined and ready, but Habitat is not yet ingesting the evidence it needs. Nothing is counted, ranked, or estimated until that source is connected.</p>
                </div> : holder ? <>
                  <div className="record-holder-marquee">
                    <span>{isShame ? "Current owner of this masterpiece" : "Current record holder"}</span>
                    <strong>{holder.holderName}</strong>
                  </div>
                  <div className="record-showcase-value"><strong>{holder.valueNumber.toLocaleString()}</strong><span>{record.valueLabel}</span></div>
                  <div className="record-showcase-meta"><span>Engraved {holder.establishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span>{history?.priorValue === null || !history ? "First verified holder" : `Took it from ${history.priorHolderName ?? "the previous holder"} at ${history.priorValue.toLocaleString()}`}</span></div>
                  {sourceHref ? <Link className="record-source-link" href={sourceHref}>Inspect the receipt <ArrowUpRight aria-hidden="true" /></Link> : null}
                </> : <>
                  <div className="record-holder-marquee awaiting"><span>Plinth reserved</span><strong>Awaiting a verified holder</strong></div>
                  <div className="record-showcase-awaiting"><span>{isShame ? "The first qualifying disaster gets the plaque." : "The first qualifying feat gets the plaque."}</span><p>No placeholder name or score is invented while trusted evidence is still pending.</p></div>
                </>}
              </div>
            </article>;
          })}</div>
        </section>;
      })}</div>}
    </div>
  </section>;
}

/**
 * Mirrors the activity receipt route's own visibility rule. Hosted evidence is always
 * viewable; Club Game evidence is only viewable while the member keeps that profile public.
 */
function isPubliclyViewable(activity: { sourceServerEventId: string | null; sourceClubMatchParticipant: { clubGameProfile: { displayPublic: boolean } } | null } | null) {
  if (!activity) return false;
  return Boolean(activity.sourceServerEventId) || Boolean(activity.sourceClubMatchParticipant?.clubGameProfile.displayPublic);
}

/** A record established within the last 48 hours still carries the fresh-break flash. */
function isRecentlyBroken(establishedAt: Date) {
  return Date.now() - establishedAt.getTime() < 48 * 60 * 60 * 1_000;
}
