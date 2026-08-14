import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, Compass, Info, Palette, Pencil, Plus, Target, Trash2, Trophy, Users } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { hoursFromPlaySeconds, seasonContentEditability, seasonGoalProblems, seasonGoalWarnings, seasonRuleCopy, seasonRuleTypes, trophyArtwork, type SeasonRuleType } from "@/lib/season-content";
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

function RuleOptions() {
  return <>{seasonRuleTypes.map((rule) => <option key={rule} value={rule}>{seasonRuleCopy[rule].label} ({seasonRuleCopy[rule].unit})</option>)}</>;
}

function ThresholdHint({ ruleType, threshold }: { ruleType: SeasonRuleType; threshold: number }) {
  return <small>{seasonRuleCopy[ruleType].measures}{ruleType === "PLAY_SECONDS" ? ` Currently ${hoursFromPlaySeconds(threshold).toLocaleString()} hours.` : ""}</small>;
}

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

  const editability = seasonContentEditability(season.status);
  const nextQuestOrder = season.quests.reduce((highest, quest) => Math.max(highest, quest.sortOrder + 1), 0);
  const nextExpeditionOrder = season.expeditions.reduce((highest, expedition) => Math.max(highest, expedition.sortOrder + 1), 0);
  const commemorative = season.trophies.find((trophy) => trophy.kind === "COMMEMORATIVE") ?? null;
  const founding = season.trophies.find((trophy) => trophy.kind === "FOUNDING_MEMBER") ?? null;

  return <section className="page-shell season-build">
    <Link className="season-build-back" href="/admin/seasons"><ChevronLeft aria-hidden="true" size={15} /> All seasons</Link>
    <div className="page-intro">
      <p className="eyebrow">Season {String(season.ordinal).padStart(2, "0")} · {season.theme} · {season.isEnabled ? season.status : "DISABLED"}</p>
      <h1>{season.name}</h1>
      <p>{season.description}</p>
    </div>

    <p className={`season-build-editability ${editability.structural ? "open" : "locked"}`}><Info aria-hidden="true" size={15} /><span>{editability.reason}</span></p>

    <div className="season-build-heading"><div><p className="eyebrow">Personal and team goals</p><h2>Quests</h2></div><span><Target aria-hidden="true" size={14} /> {season.quests.length} configured</span></div>
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
          <label>Rule<select defaultValue={quest.ruleType} disabled={!editability.measurable} name="ruleType"><RuleOptions /></select></label>
          <label>Game<select defaultValue={quest.gameType ?? "ANY"} disabled={!editability.measurable} name="gameType"><option value="ANY">Any Habitat game</option>{games.map((game) => <option key={game.value} value={game.value}>{game.label}</option>)}</select></label>
          <label>Threshold<input defaultValue={quest.threshold} min={1} name="threshold" required type="number" /><ThresholdHint ruleType={quest.ruleType as SeasonRuleType} threshold={quest.threshold} /></label>
          <label>Season XP reward<input defaultValue={quest.xpReward} disabled={!editability.measurable} min={1} name="xpReward" required type="number" /></label>
          <label>Order<input defaultValue={quest.sortOrder} min={0} name="sortOrder" required type="number" /></label>
          <label>Availability<select defaultValue={String(quest.enabled)} name="enabled"><option value="true">Live on the board</option><option value="false">Off — hidden and not reconciled</option></select></label>
          {!editability.measurable ? <>
            <input name="scope" type="hidden" value={quest.scope} />
            <input name="ruleType" type="hidden" value={quest.ruleType} />
            <input name="gameType" type="hidden" value={quest.gameType ?? "ANY"} />
            <input name="xpReward" type="hidden" value={quest.xpReward} />
          </> : null}
          <footer><button className="save-server" type="submit"><Pencil aria-hidden="true" size={14} /> Save quest</button></footer>
        </form>
        {editability.structural ? <form action={removeSeasonQuest} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={quest.id} /><button type="submit"><Trash2 aria-hidden="true" size={13} /> Remove this quest</button></form> : null}
      </details>)}
    </div>}

    {editability.structural ? <form action={createSeasonQuest} className="season-build-create">
      <div className="season-build-create-heading"><div><p className="eyebrow">New goal</p><h3>Add a quest</h3></div><Plus aria-hidden="true" size={17} /></div>
      <input name="seasonId" type="hidden" value={season.id} />
      <label className="field-wide">Name<input maxLength={100} minLength={3} name="name" placeholder="Field Hours" required /></label>
      <label className="field-wide">Description<textarea maxLength={240} minLength={10} name="description" placeholder="Bank ten hours of verified play across the season." required rows={2} /></label>
      <label>Scope<select defaultValue="PERSONAL" name="scope"><option value="PERSONAL">Personal — each member separately</option><option value="TEAM">Team — the whole roster together</option></select></label>
      <label>Rule<select defaultValue="PLAY_SECONDS" name="ruleType"><RuleOptions /></select></label>
      <label>Game<select defaultValue="ANY" name="gameType"><option value="ANY">Any Habitat game</option>{games.map((game) => <option key={game.value} value={game.value}>{game.label}</option>)}</select></label>
      <label>Threshold<input defaultValue={36_000} min={1} name="threshold" required type="number" /><small>Playtime is in seconds: 36,000 is ten hours.</small></label>
      <label>Season XP reward<input defaultValue={300} min={1} name="xpReward" required type="number" /></label>
      <label>Order<input defaultValue={nextQuestOrder} min={0} name="sortOrder" required type="number" /></label>
      <footer><button className="save-server" type="submit"><Plus aria-hidden="true" size={14} /> Add quest</button></footer>
    </form> : null}

    <div className="season-build-heading"><div><p className="eyebrow">Per-game cooperative routes</p><h2>Expeditions</h2></div><span><Compass aria-hidden="true" size={14} /> {season.expeditions.length} configured</span></div>
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
          <label>Game<select defaultValue={expedition.gameType} disabled={!editability.measurable} name="gameType">{games.map((game) => <option key={game.value} value={game.value}>{game.label}</option>)}</select></label>
          <label>Rule<select defaultValue={expedition.ruleType} disabled={!editability.measurable} name="ruleType"><RuleOptions /></select></label>
          <label>Threshold<input defaultValue={expedition.threshold} min={1} name="threshold" required type="number" /><ThresholdHint ruleType={expedition.ruleType as SeasonRuleType} threshold={expedition.threshold} /></label>
          <label>Order<input defaultValue={expedition.sortOrder} min={0} name="sortOrder" required type="number" /></label>
          {!editability.measurable ? <><input name="gameType" type="hidden" value={expedition.gameType} /><input name="ruleType" type="hidden" value={expedition.ruleType} /></> : null}
          <footer><button className="save-server" type="submit"><Pencil aria-hidden="true" size={14} /> Save expedition</button></footer>
        </form>
        {editability.structural ? <form action={removeSeasonExpedition} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={expedition.id} /><button type="submit"><Trash2 aria-hidden="true" size={13} /> Remove this expedition</button></form> : null}
      </details>)}
    </div>}

    {editability.structural ? <form action={createSeasonExpedition} className="season-build-create">
      <div className="season-build-create-heading"><div><p className="eyebrow">New route</p><h3>Add an expedition</h3></div><Plus aria-hidden="true" size={17} /></div>
      <input name="seasonId" type="hidden" value={season.id} />
      <label className="field-wide">Name<input maxLength={100} minLength={3} name="name" placeholder="Navezgane Night Watch" required /></label>
      <label className="field-wide">Description<textarea maxLength={240} minLength={10} name="description" placeholder="Make thirty verified community visits to the blood-moon country." required rows={2} /></label>
      <label>Game<select defaultValue="SEVEN_DAYS_TO_DIE" name="gameType">{games.map((game) => <option key={game.value} value={game.value}>{game.label}</option>)}</select></label>
      <label>Rule<select defaultValue="JOIN_COUNT" name="ruleType"><RuleOptions /></select></label>
      <label>Threshold<input defaultValue={30} min={1} name="threshold" required type="number" /></label>
      <label>Order<input defaultValue={nextExpeditionOrder} min={0} name="sortOrder" required type="number" /></label>
      <footer><button className="save-server" type="submit"><Plus aria-hidden="true" size={14} /> Add expedition</button></footer>
    </form> : null}

    <div className="season-build-heading"><div><p className="eyebrow">Permanent cabinet pieces</p><h2>Trophies</h2></div><span><Trophy aria-hidden="true" size={14} /> {season.trophies.length} of 2</span></div>
    <p className="season-build-empty">A season awards at most one commemorative piece and, in season 1 only, the founding reward. Both go to members who bank {season.trophyXpRequirement.toLocaleString()} season XP.</p>
    <div className="season-build-trophies">
      {([{ kind: "COMMEMORATIVE" as const, trophy: commemorative, title: "Commemorative", note: "Awarded to every qualifying member when the season closes." },
        { kind: "FOUNDING_MEMBER" as const, trophy: founding, title: "Founding reward", note: season.ordinal === 1 ? "Awarded alongside the commemorative in the first season." : "Only ever awarded in season 1, so it cannot be configured here." }])
        .map(({ kind, trophy, title, note }) => {
          const artwork = trophy ? trophyArtwork(trophy.code) : null;
          const configurable = kind === "COMMEMORATIVE" || season.ordinal === 1;
          return <article className={trophy ? `rarity-${trophy.rarity.toLowerCase().replaceAll("_", "-")}` : ""} key={kind}>
            <header><div><p className="eyebrow">{title}</p><h3>{trophy?.name ?? "Not configured"}</h3></div><Trophy aria-hidden="true" size={18} /></header>
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
                <footer><button className="save-server" type="submit"><Trophy aria-hidden="true" size={14} /> Save trophy</button></footer>
              </form>
              {trophy && editability.structural && trophy._count.unlocks === 0 ? <form action={removeSeasonTrophy} className="season-build-remove"><input name="seasonId" type="hidden" value={season.id} /><input name="id" type="hidden" value={trophy.id} /><button type="submit"><Trash2 aria-hidden="true" size={13} /> Remove this trophy</button></form> : null}
            </details> : null}
          </article>;
        })}
    </div>
  </section>;
}
