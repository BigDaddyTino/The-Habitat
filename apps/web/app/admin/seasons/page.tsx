import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Compass, Hammer, Pencil, Plus, Rocket, Target, Trophy, Users } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { seasonEndFor } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { seasonLaunchReadiness } from "@/lib/season-launch";
import { launchSeason, scheduleSeason, updateSeasonSettings } from "./actions";
import { createSeason } from "./content-actions";

export const dynamic = "force-dynamic";

const db = getPrismaClient();
const dateOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } as const;

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function AdminSeasonsPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const seasons = await db.season.findMany({
    orderBy: { ordinal: "asc" },
    include: { _count: { select: { memberships: true, quests: true, expeditions: true, trophies: true, xpEntries: true } } },
  });
  const running = seasons.find((season) => season.isEnabled && season.status === "ACTIVE" && season.endsAt > now) ?? null;

  return <section className="page-shell">
    <div className="page-intro"><p className="eyebrow">Habitat administration</p><h1>Seasons</h1><p>Launch, reschedule, and tune the optional three-month goal layer. Nothing here touches lifetime XP, levels, achievements, titles, records, or any trophy already earned.</p></div>

    {seasons.length === 0 ? <div className="chronicle-empty"><p>No seasons are configured.</p><span>Create one below, then add its quests, expeditions, and trophies in the builder before launching.</span></div> : null}

    <form action={createSeason} className="season-admin-create">
      <div className="season-admin-create-heading"><div><p className="eyebrow">New season</p><h2>Draft a season</h2><p>It is created disabled and unstarted so you can build its goals and trophies first. The close date is always exactly three calendar months after the opening date.</p></div><Plus aria-hidden="true" size={18} /></div>
      <label className="field-wide">Season name<input maxLength={100} minLength={3} name="name" placeholder="Second Light" required /></label>
      <label className="field-wide">Theme<input maxLength={80} minLength={3} name="theme" placeholder="Ironwood Dusk" required /></label>
      <label className="field-wide">Description<textarea maxLength={400} minLength={10} name="description" placeholder="What this season asks of the lodge, and what it does not touch." required rows={3} /></label>
      <label>Opens on (UTC)<input defaultValue={isoDate(seasonEndFor(now))} name="startsOn" required type="date" /></label>
      <label>Community XP goal<input defaultValue={12_000} min={1} name="communityXpGoal" required step={100} type="number" /></label>
      <label>Trophy XP requirement<input defaultValue={1_500} min={0} name="trophyXpRequirement" required step={100} type="number" /></label>
      <footer><button className="save-server" type="submit"><Plus aria-hidden="true" size={15} /> Create season</button></footer>
    </form>

    {running ? <div className="season-admin-running"><CheckCircle2 aria-hidden="true" size={17} /><div><strong>{running.name} is running.</strong><span>Closes {running.endsAt.toLocaleDateString("en-US", dateOptions)}. The worker reconciles verified activity and closes the season on its own; only one season runs at a time.</span></div><Link href="/seasons">View the board</Link></div> : null}

    {seasons.map((season) => {
      const readiness = seasonLaunchReadiness({ status: season.status, trophyCount: season._count.trophies, questCount: season._count.quests, expeditionCount: season._count.expeditions, xpEntryCount: season._count.xpEntries });
      // Only the reasons an administrator can still act on are worth showing; a
      // running or closed season is already labelled by its own state chip.
      const notices = [...readiness.blockers.filter(() => season.status === "UPCOMING"), ...readiness.warnings];
      const projectedEnd = seasonEndFor(now);

      return <article className={`season-admin-card status-${season.status.toLowerCase()}`} key={season.id}>
        <header>
          <div><p className="eyebrow">Season {String(season.ordinal).padStart(2, "0")} · {season.theme}</p><h2><Link href={`/admin/seasons/${season.slug}`}>{season.name}</Link></h2></div>
          <span className={`season-admin-state ${season.status.toLowerCase()}`}>{season.isEnabled ? season.status : "DISABLED"}</span>
        </header>
        <p className="season-admin-window"><CalendarClock aria-hidden="true" size={14} /> {season.startsAt.toLocaleDateString("en-US", dateOptions)} — {season.endsAt.toLocaleDateString("en-US", dateOptions)}{season.completedAt ? <> · closed {season.completedAt.toLocaleDateString("en-US", dateOptions)}</> : null}</p>
        <dl className="season-admin-counts">
          <div><Users aria-hidden="true" size={13} /><dt>Enrolled</dt><dd>{season._count.memberships}</dd></div>
          <div><Target aria-hidden="true" size={13} /><dt>Quests</dt><dd>{season._count.quests}</dd></div>
          <div><Compass aria-hidden="true" size={13} /><dt>Expeditions</dt><dd>{season._count.expeditions}</dd></div>
          <div><Trophy aria-hidden="true" size={13} /><dt>Trophies</dt><dd>{season._count.trophies}</dd></div>
          <div><CheckCircle2 aria-hidden="true" size={13} /><dt>Season XP rows</dt><dd>{season._count.xpEntries}</dd></div>
        </dl>

        {notices.length ? <p className="season-admin-blocker"><AlertTriangle aria-hidden="true" size={14} /><span>{notices.join(" ")} <Link href={`/admin/seasons/${season.slug}`}>Open the builder</Link> to add them.</span></p> : null}

        <Link className="season-admin-build-link" href={`/admin/seasons/${season.slug}`}><Hammer aria-hidden="true" size={14} /> Build quests, expeditions, and trophies</Link>

        {season.status === "UPCOMING" ? <div className="season-admin-actions">
          <form action={launchSeason}>
            <input name="seasonId" type="hidden" value={season.id} />
            <div><strong>Launch now</strong><small>Opens the window at the moment you press this, closing {projectedEnd.toLocaleDateString("en-US", dateOptions)}. Activity recorded before the launch is not credited.</small></div>
            <button className="save-server" disabled={!readiness.launchable || Boolean(running)} type="submit"><Rocket aria-hidden="true" size={15} /> Launch {season.name}</button>
          </form>
          <form action={scheduleSeason}>
            <input name="seasonId" type="hidden" value={season.id} />
            <div><strong>Or schedule a start</strong><small>The close date is always exactly three calendar months later, matching the database constraint.</small></div>
            <label>Opens on (UTC)<input defaultValue={isoDate(season.startsAt)} name="startsOn" required type="date" /></label>
            <button className="save-server" disabled={!readiness.launchable} type="submit"><CalendarClock aria-hidden="true" size={15} /> Reschedule</button>
          </form>
        </div> : null}

        {season.status === "COMPLETED"
          ? <p className="season-admin-frozen"><Trophy aria-hidden="true" size={14} /> Closed and chronicled. A published season keeps the goals it was judged against. <Link href={`/seasons/${season.slug}/chronicle`}>Open the chronicle</Link></p>
          : <details className="season-admin-editor">
              <summary><Pencil aria-hidden="true" size={14} /> Edit goals and presentation</summary>
              <form action={updateSeasonSettings}>
                <input name="seasonId" type="hidden" value={season.id} />
                <label className="field-wide">Season name<input defaultValue={season.name} maxLength={100} minLength={3} name="name" required /></label>
                <label className="field-wide">Theme<input defaultValue={season.theme} maxLength={80} minLength={3} name="theme" required /></label>
                <label className="field-wide">Description<textarea defaultValue={season.description} maxLength={400} minLength={10} name="description" required rows={3} /></label>
                <label>Community XP goal<input defaultValue={season.communityXpGoal} min={1} name="communityXpGoal" required step={100} type="number" /></label>
                <label>Trophy XP requirement<input defaultValue={season.trophyXpRequirement} min={0} name="trophyXpRequirement" required step={100} type="number" /><small>Season XP a member must bank to receive the shelf. Zero awards every enrolled member.</small></label>
                <label>Availability<select defaultValue={String(season.isEnabled)} name="isEnabled"><option value="true">Enabled — visible and reconciled</option><option value="false">Disabled — hidden, and the worker leaves it alone</option></select></label>
                <button className="save-server" type="submit"><Pencil aria-hidden="true" size={15} /> Save season</button>
              </form>
            </details>}
      </article>;
    })}
  </section>;
}
