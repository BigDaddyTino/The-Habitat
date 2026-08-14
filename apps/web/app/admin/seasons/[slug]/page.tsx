import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, Compass, Info, Palette, Pencil, Plus, Target, Trash2, Trophy, Users } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { CollectibleCanvas } from "@/components/collectible-canvas";
import { SeasonBuilderSubmit, SeasonGoalFields } from "@/components/season-builder-controls";
import { effectiveSeasonStatus, seasonContentEditability, seasonGoalProblems, seasonGoalWarnings, seasonRuleCopy, trophyArtwork, type SeasonRuleType } from "@/lib/season-content";
import { createSeasonExpedition, createSeasonQuest, removeSeasonExpedition, removeSeasonQuest, removeSeasonTrophy, updateSeasonExpedition, updateSeasonQuest, upsertSeasonTrophy } from "../content-actions";

export const dynamic = "force-dynamic";

const db = getPrismaClient();
const games = [
  { value: "SEVEN_DAYS_TO_DIE", label: "7 Days to Die" },
  { value: "PROJECT_ZOMBOID", label: "Project Zomboid" },
  { value: "DRAGONWILDS", label: "RuneScape: Dragonwilds" },
  { value: "ENSHROUDED", label: "Enshrouded" },
  { value: "PALWORLD", label: "Palworld" },
  { value: "VALHEIM", label: "Valheim" },
];
const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"];

function GoalNotes({ ruleType, gameType, threshold }: { ruleType: SeasonRuleType; gameType: string | null; threshold: number }) {
  const notes = [...seasonGoalProblems({ ruleType, gameType, threshold }), ...seasonGoalWarnings({ ruleType, gameType, threshold })];
  if (!notes.length) return null;
  return <p className="season-build-note"><AlertTriangle aria-hidden="true" size={13} /><span>{notes.join(" ")}</span></p>;
}

export default async function AdminSeasonBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("ADMIN");
  const { slug } = await params;
  const season = await db.season.findUnique({
    where: { slug },
    include: {
      quests: { orderBy: [{ scope: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { personalProgress: true } }, teamProgress: { select: { progress: true, completedAt: true } } } },
      expeditions: { orderBy: { sortOrder: "asc" } },
      trophies: { orderBy: { kind: "asc" }, include: { _count: { select: { unlocks: true } } } },
      _count: { select: { memberships: true, xpEntries: true } },
    },
  });
  if (!season) notFound();

  const effectiveStatus = effectiveSeasonStatus(season);
  const editability = seasonContentEditability(effectiveStatus);
  const nextQuestOrder = season.quests.reduce((highest, quest) => Math.max(highest, quest.sortOrder + 1), 0);
  const nextExpeditionOrder = season.expeditions.reduce((highest, expedition) => Math.max(highest, expedition.sortOrder + 1), 0);
  const commemorative = season.trophies.find((trophy) => trophy.kind === "COMMEMORATIVE") ?? null;
  const founding = season.trophies.find((trophy) => trophy.kind === "FOUNDING_MEMBER") ?? null;
  const personalQuestCount = season.quests.filter((quest) => quest.scope === "PERSONAL").length;
  const teamQuestCount = season.quests.length - personalQuestCount;
  const expeditionGameCount = new Set(season.expeditions.map((expedition) => expedition.gameType)).size;
  const expectedTrophies = season.ordinal === 1 ? 2 : 1;
  const readySteps = [season.quests.length > 0, season.expeditions.length > 0, Boolean(commemorative), season.ordinal !== 1 || Boolean(founding)];
  const readyCount = readySteps.filter(Boolean).length;

  return <section className="page-shell season-build">
    <Link className="season-build-back" href="/admin/seasons"><ChevronLeft aria-hidden="true" size={15} /> All seasons</Link>
    <div className="season-build-hero">
      <div className="page-intro">
        <p className="eyebrow">Season {String(season.ordinal).padStart(2, "0")} · {season.theme} · {season.isEnabled ? effectiveStatus : "DISABLED"}</p>
        <h1>{season.name}</h1>
        <p>{season.description}</p>
      </div>
      <div aria-label={`${readyCount} of ${readySteps.length} builder checks complete`} className="season-build-readiness">
        <span>Builder readiness</span><strong>{readyCount}<i>/{readySteps.length}</i></strong>
        <div>{readySteps.map((ready, index) => <i className={ready ? "ready" : ""} key={index} />)}</div>
        <small>{readyCount === readySteps.length ? "The full season package is configured." : "Finish the unlit stations before launch."}</small>
      </div>
    </div>

    <p className={`season-build-editability ${editability.structural ? "open" : "locked"}`}><Info aria-hidden="true" size={15} /><span>{editability.reason}</span></p>

    <nav aria-label="Season builder sections" className="season-build-nav">
      <a href="#quests"><Target aria-hidden="true" size={14} /><span>Quests</span><strong>{personalQuestCount} personal · {teamQuestCount} team</strong></a>
      <a href="#expeditions"><Compass aria-hidden="true" size={14} /><span>Expeditions</span><strong>{season.expeditions.length} routes · {expeditionGameCount} games</strong></a>
      <a href="#trophies"><Trophy aria-hidden="true" size={14} /><span>Trophies</span><strong>{season.trophies.length} / {expectedTrophies} configured</strong></a>
    </nav>

    <div className="season-build-heading" id="quests"><div><p className="eyebrow">Personal and team goals</p><h2>Quests</h2></div><span><Target aria-hidden="true" size={14} /> {season.quests.length} configured</span></div>
    {season.quests.length === 0 ? <p className="season-build-empty">No quests yet. A season with no quests scores raw verified playtime only.</p> : <div className="season-build-list">
      {season.quests.map((quest) => <details key={quest.id}>
        <summary>
          <span className={`season-build-chip ${quest.scope.toLowerCase()}`}>{quest.scope}</span>
          <span className="season-build-summary"><strong>{quest.name}</strong><small>{seasonRuleCopy[quest.ruleType as SeasonRuleType].label} · {quest.threshold.toLocaleString()} {seasonRuleCopy[quest.ruleType as SeasonRuleType].unit}{quest.gameType ? ` · ${games.find((game) => game.value === quest.gameType)?.label ?? quest.gameType}` : ""} · {quest.xpReward.toLocaleString()} XP</small></span>
          <span className="season-build-meta">{quest.scope === "TEAM" ? <>{quest.teamProgress?.completedAt ? "Complete" : `${(quest.teamProgress?.progress ?? 0).toLocaleString()} progress`}</> : <><Users aria-hidden="true" size={12} /> {quest._count.personalProgress} tracking</>}</span>
          <span className={quest.enabled ? "season-build-state on" : "season-build-state"}>{quest.enabled ? "Live" : "Off"}</span>
          <Pencil aria-hidden="true" size={13} />
        </summary>
        <GoalNotes gameType={quest.gameType} ruleType={quest.ruleType as SeasonRuleType} threshold={quest.threshold} />
        <form action={updateSeasonQuest} className="season-build-form">
          <input name="seasonId" type="hidden" value={season.id} />
          <input name="id" type="hidden" value={quest.id} />
          <label className="field-wide">Name<input defaultValue={quest.name} maxLength={100} minLength={3} name="name" required /></label>
          <label className="field-wide">Description<textarea defaultValue={quest.description} maxLength={240} minLength={10} name="description" required rows={2} /></label>
          <label>Scope<select defaultValue={quest.scope} disabled={!editability.measurable} name="scope"><option value="PERSONAL">Personal — each member separately</option><option value="TEAM">Team — the whole roster together</option></select></label>
          <SeasonGoalFields defaultGame={quest.gameType} defaultRule={quest.ruleType as SeasonRuleType} defaultThreshold={quest.threshold} games={games} measurementLocked={!editability.measurable} />
          <label>Season XP reward<input defaultValue={quest.xpReward} disabled={!editability.measurable} min={1} name="xpReward" required type="number" /></label>
          <label>Order<input defaultValue={quest.sortOrder} min={0} name="sortOrder" required type="number" /></label>
          <label>Availability<select defaultValue={String(quest.enabled)} name="enabled"><option value="true">Live on the board</option><option value="false">Off — hidden and not reconciled</option></select></label>
          {!editability.measurable ? <>
            <input name="scope" type="hidden" value={quest.scope} />
            <input name="ruleType" type="hidden" value={quest.ruleType} />
            <input name="gameType" type="hidden" value={quest.gameType ?? "ANY"} />
            <input name="xpReward" type="hidden" value={quest.xpReward} />
          </> : null}
          <footer><SeasonBuilderSubmit className="save-server" pendingLabel="Saving quest…"><Pencil aria-hidden="true" size={14} /> Save quest</SeasonBuilderSubmit></footer>
        </form>
        {editability.structural ? <form action={removeSeasonQuest} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={quest.id} /><SeasonBuilderSubmit pendingLabel="Removing quest…"><Trash2 aria-hidden="true" size={13} /> Remove this quest</SeasonBuilderSubmit></form> : null}
      </details>)}
    </div>}

    {editability.structural ? <form action={createSeasonQuest} className="season-build-create">
      <div className="season-build-create-heading"><div><p className="eyebrow">New goal</p><h3>Add a quest</h3></div><Plus aria-hidden="true" size={17} /></div>
      <input name="seasonId" type="hidden" value={season.id} />
      <label className="field-wide">Name<input maxLength={100} minLength={3} name="name" placeholder="Field Hours" required /></label>
      <label className="field-wide">Description<textarea maxLength={240} minLength={10} name="description" placeholder="Bank ten hours of verified play across the season." required rows={2} /></label>
      <label>Scope<select defaultValue="PERSONAL" name="scope"><option value="PERSONAL">Personal — each member separately</option><option value="TEAM">Team — the whole roster together</option></select></label>
      <SeasonGoalFields defaultGame={null} defaultRule="PLAY_SECONDS" defaultThreshold={36_000} games={games} />
      <label>Season XP reward<input defaultValue={300} min={1} name="xpReward" required type="number" /></label>
      <label>Order<input defaultValue={nextQuestOrder} min={0} name="sortOrder" required type="number" /></label>
      <footer><SeasonBuilderSubmit className="save-server" pendingLabel="Adding quest…"><Plus aria-hidden="true" size={14} /> Add quest</SeasonBuilderSubmit></footer>
    </form> : null}

    <div className="season-build-heading" id="expeditions"><div><p className="eyebrow">Per-game cooperative routes</p><h2>Expeditions</h2></div><span><Compass aria-hidden="true" size={14} /> {season.expeditions.length} configured</span></div>
    {season.expeditions.length === 0 ? <p className="season-build-empty">No expeditions yet. Expeditions are whole-roster goals tied to one game.</p> : <div className="season-build-list">
      {season.expeditions.map((expedition) => <details key={expedition.id}>
        <summary>
          <span className="season-build-chip game">{games.find((game) => game.value === expedition.gameType)?.label ?? expedition.gameType}</span>
          <span className="season-build-summary"><strong>{expedition.name}</strong><small>{seasonRuleCopy[expedition.ruleType as SeasonRuleType].label} · {expedition.threshold.toLocaleString()} {seasonRuleCopy[expedition.ruleType as SeasonRuleType].unit}</small></span>
          <span className="season-build-meta">{expedition.progress.toLocaleString()} / {expedition.threshold.toLocaleString()}</span>
          <span className={expedition.completedAt ? "season-build-state on" : "season-build-state"}>{expedition.completedAt ? "Complete" : "Open"}</span>
          <Pencil aria-hidden="true" size={13} />
        </summary>
        <GoalNotes gameType={expedition.gameType} ruleType={expedition.ruleType as SeasonRuleType} threshold={expedition.threshold} />
        <form action={updateSeasonExpedition} className="season-build-form">
          <input name="seasonId" type="hidden" value={season.id} />
          <input name="id" type="hidden" value={expedition.id} />
          <label className="field-wide">Name<input defaultValue={expedition.name} maxLength={100} minLength={3} name="name" required /></label>
          <label className="field-wide">Description<textarea defaultValue={expedition.description} maxLength={240} minLength={10} name="description" required rows={2} /></label>
          <SeasonGoalFields defaultGame={expedition.gameType} defaultRule={expedition.ruleType as SeasonRuleType} defaultThreshold={expedition.threshold} gameRequired games={games} measurementLocked={!editability.measurable} />
          <label>Order<input defaultValue={expedition.sortOrder} min={0} name="sortOrder" required type="number" /></label>
          {!editability.measurable ? <><input name="gameType" type="hidden" value={expedition.gameType} /><input name="ruleType" type="hidden" value={expedition.ruleType} /></> : null}
          <footer><SeasonBuilderSubmit className="save-server" pendingLabel="Saving expedition…"><Pencil aria-hidden="true" size={14} /> Save expedition</SeasonBuilderSubmit></footer>
        </form>
        {editability.structural ? <form action={removeSeasonExpedition} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={expedition.id} /><SeasonBuilderSubmit pendingLabel="Removing expedition…"><Trash2 aria-hidden="true" size={13} /> Remove this expedition</SeasonBuilderSubmit></form> : null}
      </details>)}
    </div>}

    {editability.structural ? <form action={createSeasonExpedition} className="season-build-create">
      <div className="season-build-create-heading"><div><p className="eyebrow">New route</p><h3>Add an expedition</h3></div><Plus aria-hidden="true" size={17} /></div>
      <input name="seasonId" type="hidden" value={season.id} />
      <label className="field-wide">Name<input maxLength={100} minLength={3} name="name" placeholder="Navezgane Night Watch" required /></label>
      <label className="field-wide">Description<textarea maxLength={240} minLength={10} name="description" placeholder="Make thirty verified community visits to the blood-moon country." required rows={2} /></label>
      <SeasonGoalFields defaultGame="SEVEN_DAYS_TO_DIE" defaultRule="JOIN_COUNT" defaultThreshold={30} gameRequired games={games} />
      <label>Order<input defaultValue={nextExpeditionOrder} min={0} name="sortOrder" required type="number" /></label>
      <footer><SeasonBuilderSubmit className="save-server" pendingLabel="Adding expedition…"><Plus aria-hidden="true" size={14} /> Add expedition</SeasonBuilderSubmit></footer>
    </form> : null}

    <div className="season-build-heading" id="trophies"><div><p className="eyebrow">Permanent cabinet pieces</p><h2>Trophies</h2></div><span><Trophy aria-hidden="true" size={14} /> {season.trophies.length} of {expectedTrophies}</span></div>
    <p className="season-build-empty">A season awards at most one commemorative piece and, in season 1 only, the founding reward. Both go to members who bank {season.trophyXpRequirement.toLocaleString()} season XP.</p>
    <div className="season-build-trophies">
      {([{ kind: "COMMEMORATIVE" as const, trophy: commemorative, title: "Commemorative", note: "Awarded to every qualifying member when the season closes." },
        { kind: "FOUNDING_MEMBER" as const, trophy: founding, title: "Founding reward", note: season.ordinal === 1 ? "Awarded alongside the commemorative in the first season." : "Only ever awarded in season 1, so it cannot be configured here." }])
        .map(({ kind, trophy, title, note }) => {
          const artwork = trophy ? trophyArtwork(trophy.code) : null;
          const configurable = kind === "COMMEMORATIVE" || season.ordinal === 1;
          return <article className={trophy ? `rarity-${trophy.rarity.toLowerCase().replaceAll("_", "-")}` : ""} key={kind}>
            <header><div><p className="eyebrow">{title}</p><h3>{trophy?.name ?? "Not configured"}</h3></div><Trophy aria-hidden="true" size={18} /></header>
            {trophy ? <div className="season-build-trophy-preview"><CollectibleCanvas interactive item={{ code: trophy.code, name: trophy.name, kind: "TROPHY", rarity: trophy.rarity, achievementName: `Season ${season.ordinal} · ${season.name}` }} /></div> : <div className="season-build-trophy-missing"><Trophy aria-hidden="true" size={24} /><span>Awaiting a permanent shelf piece</span></div>}
            <p>{trophy?.description ?? note}</p>
            {artwork ? <p className={`season-build-artwork ${artwork.authored ? "authored" : ""}`}><Palette aria-hidden="true" size={13} /><span>{artwork.note}</span></p> : null}
            {trophy ? <p className="season-build-meta-line">{trophy._count.unlocks} member{trophy._count.unlocks === 1 ? "" : "s"} hold this piece · code <code>{trophy.code}</code></p> : null}
            {configurable && editability.presentation ? <details>
              <summary><Pencil aria-hidden="true" size={13} /> {trophy ? "Edit this trophy" : "Configure this trophy"}</summary>
              <form action={upsertSeasonTrophy} className="season-build-form">
                <input name="seasonId" type="hidden" value={season.id} />
                <input name="kind" type="hidden" value={kind} />
                <label className="field-wide">Name<input defaultValue={trophy?.name ?? ""} maxLength={80} minLength={3} name="name" required /></label>
                <label className="field-wide">Description<textarea defaultValue={trophy?.description ?? ""} maxLength={180} minLength={10} name="description" required rows={2} /></label>
                <label className="field-wide">Artwork code<input defaultValue={trophy?.code ?? ""} maxLength={64} minLength={3} name="code" pattern="[a-z0-9-]+" required /><small>Lowercase, numbers, and hyphens. Codes with authored 3D artwork render as their own piece; anything else uses the generic trophy form.</small></label>
                <label>Rarity<select defaultValue={trophy?.rarity ?? "LEGENDARY"} name="rarity">{rarities.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
                <footer><SeasonBuilderSubmit className="save-server" pendingLabel="Saving trophy…"><Trophy aria-hidden="true" size={14} /> Save trophy</SeasonBuilderSubmit></footer>
              </form>
              {trophy && editability.structural && trophy._count.unlocks === 0 ? <form action={removeSeasonTrophy} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={trophy.id} /><SeasonBuilderSubmit pendingLabel="Removing trophy…"><Trash2 aria-hidden="true" size={13} /> Remove this trophy</SeasonBuilderSubmit></form> : null}
            </details> : null}
          </article>;
        })}
    </div>
  </section>;
}
