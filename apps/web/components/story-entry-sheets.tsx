"use client";

/**
 * The module sheets from Codex_Module_Schema.md. Each sheet composes its
 * kind's meta object client-side and ships it as JSON in one hidden field;
 * the server action re-validates everything against the per-kind schema, so
 * nothing here is trusted — this file is ergonomics, not enforcement.
 *
 * Slug-typed fields are pickers over existing entries wherever the target
 * kind is known ("link now" without typos), but the schema deliberately does
 * not require the target to exist — "fill later" is the other half of the law.
 */

import { useMemo, useState } from "react";
import { Images, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { storyCompanionMissionStatuses, storyCompanionMissionStatusLabels, storyCorruptionPhase, storyCorruptionPhaseLabel, storyCorruptionPhases, storyCreatureCategories, storyFactionStances, storyMagicOrigins, storyControlKinds, storyRegionTypes, storySettlementTiers, storySpoilerLevels, storyStoryStages, storyStoryStageLabels, storySystemCategories, storySystemStatuses, storyThreadCategories, storyThreadCategoryLabels, storyThreadPriorities, storyThreadStatuses, storyThreadStatusLabels, storyVeilAnchorTiers, storyVeilAnchorTierLabels, storySoulForgeStates, storySoulForgeStateLabels, type StoryCharacterMeta, type StoryCompanionMissionMeta, type StoryCreatureMeta, type StoryEventMeta, type StoryFactionMeta, type StoryItemMeta, type StoryRegionMeta, type StorySystemMeta, type StoryThreadMeta } from "@habitat/shared";
import { updateEntryMeta } from "@/app/codex/actions";
import { getFactionBranding } from "@/lib/faction-branding";
import gallery from "@/lib/model-gallery.json";

type SlugOption = { slug: string; title: string };

const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
/** The "answers to" value meaning nobody. Not a slug, so it can never collide
 *  with a faction: slugs are lowercase and hyphenated. */
const standsAlone = "__stands-alone__";
const record = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const orNull = (value: string) => (value.trim().length > 0 ? value.trim() : null);

function SheetSubmit({ label }: { label: string }) {
  return <button className="save-server" type="submit">{label}</button>;
}

function RowButton({ onClick, remove = false, label }: { onClick: () => void; remove?: boolean; label: string }) {
  return (
    <button className={`icon-action${remove ? " reject" : ""}`} onClick={onClick} title={label} type="button">
      {remove ? <Trash2 aria-hidden="true" size={13} /> : <Plus aria-hidden="true" size={13} />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Model picker — the visual casting sheet from the game machine
// ---------------------------------------------------------------------------

type GalleryImage = { asset: string; pack: string; packLabel: string; image: string; ref: string };
const galleryImages = (gallery as { images: GalleryImage[] }).images;
const galleryPacks = [...new Set(galleryImages.map((image) => image.packLabel))];

function ModelPicker({ value, onChange }: { value: string; onChange: (ref: string) => void }) {
  const [pack, setPack] = useState<string>("");
  const shown = useMemo(() => (pack ? galleryImages.filter((image) => image.packLabel === pack) : galleryImages), [pack]);
  const selected = galleryImages.find((image) => image.ref === value) ?? null;

  return (
    <div className="model-picker">
      <label>In-game model
        <input onChange={(event) => onChange(event.target.value)} placeholder="/Game/Creatures_Pack/Mesh/SK_Daemon" value={value} />
      </label>
      <details className="model-picker-gallery">
        <summary><Images aria-hidden="true" size={12} /> {selected ? `Cast: ${selected.asset} (${selected.packLabel})` : "Browse the casting sheet"}</summary>
        <div className="model-picker-controls">
          <select aria-label="Filter by pack" onChange={(event) => setPack(event.target.value)} value={pack}>
            <option value="">All packs ({galleryImages.length})</option>
            {galleryPacks.map((label) => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>
        <div className="model-picker-grid">
          {shown.map((image) => (
            <button className={value === image.ref ? "is-cast" : ""} key={image.ref} onClick={() => onChange(image.ref)} title={image.ref} type="button">
              {/* Static thumbnails shipped with the app; next/image adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.asset} loading="lazy" src={`/model-gallery/${image.image}`} />
              <span>{image.asset}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character sheet
// ---------------------------------------------------------------------------

export function CharacterSheet({ entryId, version, meta, factions, regions, characters, arcs, races = [] }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  factions: SlugOption[];
  regions: SlugOption[];
  characters: SlugOption[];
  arcs: SlugOption[];
  /** The races shelf, so a character's people resolve to a real dossier. */
  races?: SlugOption[];
}) {
  const source = record(meta);
  const magic = record(source.magic);
  const status = record(source.status);

  const [fullName, setFullName] = useState(text(source.fullName));
  const [aliases, setAliases] = useState(asArray(source.aliases).map(text).join("\n"));
  const [pronouns, setPronouns] = useState(text(source.pronouns));
  const [sex, setSex] = useState(text(source.sex));
  const [species, setSpecies] = useState(text(source.species));
  const [age, setAge] = useState(text(source.age));
  const [appearance, setAppearance] = useState(text(source.appearance));
  const [voice, setVoice] = useState(text(source.voice));
  const [origin, setOrigin] = useState(text(magic.origin));
  const [schools, setSchools] = useState(asArray(magic.schools).map(text).join("\n"));
  const [corruptionPhase, setCorruptionPhase] = useState(typeof magic.corruptionPhase === "number" ? String(magic.corruptionPhase) : "");
  const [magicNotes, setMagicNotes] = useState(text(magic.notes));
  const [memberships, setMemberships] = useState(asArray(source.factions).map((row) => ({ faction: text(record(row).faction), role: text(record(row).role), standing: text(record(row).standing) })));
  const [home, setHome] = useState(text(source.home));
  const [statusKnown, setStatusKnown] = useState(text(status.known));
  const [statusActual, setStatusActual] = useState(text(status.actual));
  const [relationships, setRelationships] = useState(asArray(source.relationships).map((row) => ({ character: text(record(row).character), who: text(record(row).who), type: text(record(row).type) })));
  const [storyRole, setStoryRole] = useState(text(source.storyRole));
  const [involvement, setInvolvement] = useState(asArray(source.involvement).map((row) => ({ arc: text(record(row).arc), how: text(record(row).how) })));
  const [gameId, setGameId] = useState(text(source.gameId));
  const [model, setModel] = useState(text(source.model));
  const raceListId = `character-race-${entryId}`;
  const companionSource = record(source.companion);
  const [companionCapable, setCompanionCapable] = useState(companionSource.capable === true ? "yes" : companionSource.capable === false ? "no" : "");
  const [companionAvailability, setCompanionAvailability] = useState(text(companionSource.availability));
  const [companionStatus, setCompanionStatus] = useState(text(companionSource.status));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const composed: StoryCharacterMeta = {
    fullName: orNull(fullName),
    aliases: splitLines(aliases),
    pronouns: orNull(pronouns),
    sex: orNull(sex),
    species: orNull(species),
    age: orNull(age),
    appearance: orNull(appearance),
    voice: orNull(voice),
    magic: {
      origin: (storyMagicOrigins as readonly string[]).includes(origin) ? (origin as StoryCharacterMeta["magic"]["origin"]) : null,
      schools: splitLines(schools),
      corruptionPhase: corruptionPhase === "" ? null : Number(corruptionPhase),
      notes: orNull(magicNotes),
    },
    factions: memberships.filter((row) => row.faction.trim()).map((row) => ({ faction: row.faction.trim(), role: orNull(row.role), standing: orNull(row.standing) })),
    home: orNull(home),
    status: { known: orNull(statusKnown), actual: orNull(statusActual) },
    relationships: relationships
      .filter((row) => row.character.trim() || row.who.trim() || row.type.trim())
      .map((row) => ({ character: orNull(row.character), who: orNull(row.who), type: orNull(row.type) })),
    storyRole: orNull(storyRole),
    involvement: involvement.filter((row) => row.arc.trim()).map((row) => ({ arc: row.arc.trim(), how: orNull(row.how) })),
    gameId: orNull(gameId),
    model: orNull(model),
    companion: {
      capable: companionCapable === "yes" ? true : companionCapable === "no" ? false : null,
      availability: orNull(companionAvailability),
      status: orNull(companionStatus),
    },
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Character sheet — every field optional; blank means &quot;not yet decided&quot; and shows on the needs-work list</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Full name<input maxLength={160} onChange={(event) => setFullName(event.target.value)} type="text" value={fullName} /></label>
        <label>Pronouns<input maxLength={40} onChange={(event) => setPronouns(event.target.value)} placeholder="null = writers use they/them" type="text" value={pronouns} /></label>
        <label>Sex<input maxLength={40} onChange={(event) => setSex(event.target.value)} type="text" value={sex} /></label>
        <label>Race — their people<input aria-label="Race" list={raceListId} maxLength={80} onChange={(event) => setSpecies(event.target.value)} placeholder="human (a new people needs owner sign-off)" type="text" value={species} />
        <datalist id={raceListId}>{races.map((race) => <option key={race.slug} value={race.slug}>{race.title}</option>)}</datalist>
        <small className="sheet-hint">Pick one of the races and their dossier lists this character back. Free text still works when the truth is more complicated than a name.</small></label>
        <label>Age<input maxLength={80} onChange={(event) => setAge(event.target.value)} placeholder="late twenties" type="text" value={age} /></label>
        <label>Home<select onChange={(event) => setHome(event.target.value)} value={home}><option value="">Not decided</option>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</select></label>
      </div>

      <ModelPicker onChange={setModel} value={model} />

      <label>Aliases — one per line<textarea onChange={(event) => setAliases(event.target.value)} rows={2} value={aliases} /></label>
      <label>Appearance<textarea maxLength={2000} onChange={(event) => setAppearance(event.target.value)} rows={2} value={appearance} /></label>
      <label>Voice — what their dialogue sounds like<textarea maxLength={2000} onChange={(event) => setVoice(event.target.value)} rows={3} value={voice} /></label>
      <label>Story role — why this character exists<textarea maxLength={500} onChange={(event) => setStoryRole(event.target.value)} rows={2} value={storyRole} /></label>

      <div className="sheet-grid sheet-companion-grid">
        <label>Can become a companion — the COMPANION badge<select onChange={(event) => setCompanionCapable(event.target.value)} value={companionCapable}>
          <option value="">Not decided</option>
          <option value="yes">Yes — can join the party</option>
          <option value="no">No — never a companion</option>
        </select></label>
        <label>Recruitment window<input maxLength={300} onChange={(event) => setCompanionAvailability(event.target.value)} placeholder={'"Peninsula / early game", "late game — after events TBD"'} type="text" value={companionAvailability} /></label>
        <label>Companion status now<input maxLength={300} onChange={(event) => setCompanionStatus(event.target.value)} placeholder={'"Active companion", "Former companion — deceased"'} type="text" value={companionStatus} /></label>
      </div>

      <div className="sheet-grid">
        <label>Magic origin<select onChange={(event) => setOrigin(event.target.value)} value={origin}><option value="">Not decided</option>{storyMagicOrigins.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Corruption phase<select onChange={(event) => setCorruptionPhase(event.target.value)} value={corruptionPhase}>
          <option value="">Not decided</option>
          {storyCorruptionPhases.map((row) => <option key={row.phase} value={row.phase}>{row.phase === 0 ? "0 — Clean, never dosed" : `${row.phase} — ${row.name}`}{row.playable ? "" : " (they are gone)"}</option>)}
        </select></label>
      </div>
      {/* The chosen phase explains itself in place, so nobody has to leave
          the sheet to find out what the number they just picked means. */}
      {storyCorruptionPhase(corruptionPhase === "" ? null : Number(corruptionPhase)) ? <p className="sheet-phase-note">
        <strong>{storyCorruptionPhaseLabel(Number(corruptionPhase))}.</strong> {storyCorruptionPhase(Number(corruptionPhase))?.tell}{" "}
        <em>{storyCorruptionPhase(Number(corruptionPhase))?.hiding}</em>
      </p> : null}
      <label>Magic schools — one per line<textarea onChange={(event) => setSchools(event.target.value)} rows={2} value={schools} /></label>
      <label>Magic notes<textarea maxLength={2000} onChange={(event) => setMagicNotes(event.target.value)} rows={2} value={magicNotes} /></label>

      <div className="sheet-rows">
        <p className="eyebrow">Factions <RowButton label="Add a faction" onClick={() => setMemberships((rows) => [...rows, { faction: "", role: "", standing: "" }])} /></p>
        {memberships.map((row, index) => {
          const option = factions.find((faction) => faction.slug === row.faction);
          const brand = getFactionBranding(row.faction);
          return <div className="sheet-row sheet-row-faction" key={index}>
            <span className={`sheet-faction-logo${brand ? "" : " is-empty"}`} title={option ? `${option.title} logo` : "Choose a faction to preview its logo"}>
              {brand ? <>
                {/* Small static identity marks shipped with the app. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={brand.logo} />
              </> : null}
            </span>
            <select aria-label="Faction" onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, faction: event.target.value } : other)))} value={row.faction}><option value="">Faction…</option>{factions.map((faction) => <option key={faction.slug} value={faction.slug}>{faction.title}</option>)}</select>
            <input aria-label="Role" maxLength={160} onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, role: event.target.value } : other)))} placeholder="role" value={row.role} />
            <input aria-label="Standing" maxLength={160} onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, standing: event.target.value } : other)))} placeholder="standing" value={row.standing} />
            <RowButton label="Remove this faction" onClick={() => setMemberships((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        })}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Relationships <RowButton label="Add a relationship" onClick={() => setRelationships((rows) => [...rows, { character: "", who: "", type: "" }])} /></p>
        {relationships.map((row, index) => (
          <div className="sheet-row" key={index}>
            <select aria-label="Character" onChange={(event) => setRelationships((rows) => rows.map((other, at) => (at === index ? { ...other, character: event.target.value } : other)))} value={row.character}><option value="">Not an entry —</option>{characters.map((character) => <option key={character.slug} value={character.slug}>{character.title}</option>)}</select>
            <input aria-label="Who, when not an entry" maxLength={160} onChange={(event) => setRelationships((rows) => rows.map((other, at) => (at === index ? { ...other, who: event.target.value } : other)))} placeholder="who (e.g. the player)" value={row.who} />
            <input aria-label="Relationship" maxLength={300} onChange={(event) => setRelationships((rows) => rows.map((other, at) => (at === index ? { ...other, type: event.target.value } : other)))} placeholder="war buddy, rival, debtor…" value={row.type} />
            <RowButton label="Remove this relationship" onClick={() => setRelationships((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Involvement — authored intent for arcs not yet written <RowButton label="Add an arc" onClick={() => setInvolvement((rows) => [...rows, { arc: "", how: "" }])} /></p>
        {involvement.map((row, index) => (
          <div className="sheet-row sheet-row-two" key={index}>
            <select aria-label="Arc" onChange={(event) => setInvolvement((rows) => rows.map((other, at) => (at === index ? { ...other, arc: event.target.value } : other)))} value={row.arc}><option value="">Arc…</option>{arcs.map((arc) => <option key={arc.slug} value={arc.slug}>{arc.title}</option>)}</select>
            <input aria-label="How" maxLength={300} onChange={(event) => setInvolvement((rows) => rows.map((other, at) => (at === index ? { ...other, how: event.target.value } : other)))} placeholder="rescue target of the captivity arc" value={row.how} />
            <RowButton label="Remove this arc" onClick={() => setInvolvement((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Status, as the world knows it<textarea maxLength={500} onChange={(event) => setStatusKnown(event.target.value)} placeholder="missing — the player assumes the worst" rows={2} value={statusKnown} /></label>
      <details className="spoiler-gate">
        <summary><ShieldAlert aria-hidden="true" size={13} /> Writers-room truth — spoiler-tier. Story content must not collapse the gap without owner sign-off.</summary>
        <label className="sr-only" htmlFor={`actual-${entryId}`}>Actual status</label>
        <textarea id={`actual-${entryId}`} maxLength={500} onChange={(event) => setStatusActual(event.target.value)} rows={2} value={statusActual} />
      </details>

      <div className="sheet-grid">
        <label>Game ID — the tag the level actor carries<input maxLength={120} onChange={(event) => setGameId(event.target.value)} placeholder="derived from the slug when blank" type="text" value={gameId} /></label>
      </div>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>

      <SheetSubmit label="Save character sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Faction sheet — power, territory, leadership, and conflict
// ---------------------------------------------------------------------------

export function FactionSheet({ entryId, entrySlug, version, meta, factions, regions, characters }: {
  entryId: string;
  /** This faction's own slug, so it can never be offered as its own banner. */
  entrySlug: string;
  version: number;
  meta: Record<string, unknown> | null;
  factions: SlugOption[];
  regions: SlugOption[];
  characters: SlugOption[];
}) {
  const source = record(meta);
  const [scope, setScope] = useState(text(source.scope));
  const [parent, setParent] = useState(source.independent === true ? standsAlone : text(source.parent));
  const [power, setPower] = useState(typeof source.power === "number" ? String(source.power) : "");
  const [seat, setSeat] = useState(text(source.seat));
  const [leaders, setLeaders] = useState(asArray(source.leaders).map(text));
  const [relations, setRelations] = useState(asArray(source.relations).map((row) => ({
    faction: text(record(row).faction),
    stance: text(record(row).stance),
    notes: text(record(row).notes),
  })));
  const [goals, setGoals] = useState(asArray(source.goals).map(text).join("\n"));
  const [gameTag, setGameTag] = useState(text(source.gameTag));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const strength = Number.parseInt(power, 10);
  // One control decides where a power sits, so a writer cannot file it under a
  // banner and call it independent in the same breath. "nobody" is a choice
  // about the world; the empty value is simply a banner with nothing above it.
  const composed: StoryFactionMeta = {
    scope: orNull(scope),
    parent: parent === standsAlone ? null : orNull(parent),
    independent: parent === standsAlone,
    power: Number.isInteger(strength) && strength >= 0 ? strength : null,
    seat: orNull(seat),
    leaders: leaders.filter(Boolean),
    relations: relations
      .filter((row) => row.faction.trim())
      .map((row) => ({
        faction: row.faction.trim(),
        stance: (storyFactionStances as readonly string[]).includes(row.stance) ? row.stance as StoryFactionMeta["relations"][number]["stance"] : null,
        notes: orNull(row.notes),
      })),
    goals: splitLines(goals),
    gameTag: orNull(gameTag),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Faction sheet — define the power, then connect its people, territory, and rivals</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Kind of power<input maxLength={80} onChange={(event) => setScope(event.target.value)} placeholder="state, corporate, criminal, supernatural…" type="text" value={scope} /></label>
        <label>Answers to<select onChange={(event) => setParent(event.target.value)} value={parent}>
          <option value="">No one — this is a major power</option>
          <option value={standsAlone}>Nobody — it stands outside every sphere</option>
          {factions.filter((option) => option.slug !== entrySlug).map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
        </select>
        <small className="sheet-hint">Pick a power and this becomes one of its wings — its quests and waiting material roll up to that banner. The last two are not the same: a major power is a banner that may yet gain wings, while standing outside every sphere is a fact about the world the shelf will never guess on its own.</small></label>
        <label>Strength<input inputMode="numeric" min={0} onChange={(event) => setPower(event.target.value)} placeholder="—" type="number" value={power} />
        <small className="sheet-hint">A placeholder set by hand. Strength is meant to be counted from land, cities, wealth, population, and armies, and that reckoning is not built yet.</small></label>
        <label>Seat of power<select onChange={(event) => setSeat(event.target.value)} value={seat}><option value="">Not decided</option>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</select></label>
        <label>Game tag<input maxLength={120} onChange={(event) => setGameTag(event.target.value)} placeholder="Faction.Stormglass" type="text" value={gameTag} /></label>
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Leadership <RowButton label="Add a leader" onClick={() => setLeaders((rows) => [...rows, ""])} /></p>
        {leaders.map((leader, index) => (
          <div className="sheet-row sheet-row-compact" key={index}>
            <select aria-label="Leader" onChange={(event) => setLeaders((rows) => rows.map((value, at) => at === index ? event.target.value : value))} value={leader}>
              <option value="">Choose a character…</option>
              {characters.map((character) => <option key={character.slug} value={character.slug}>{character.title}</option>)}
            </select>
            <RowButton label="Remove this leader" onClick={() => setLeaders((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Faction relationships <RowButton label="Add a relationship" onClick={() => setRelations((rows) => [...rows, { faction: "", stance: "unknown", notes: "" }])} /></p>
        {relations.map((row, index) => (
          <div className="sheet-row" key={index}>
            <select aria-label="Faction" onChange={(event) => setRelations((rows) => rows.map((other, at) => at === index ? { ...other, faction: event.target.value } : other))} value={row.faction}><option value="">Choose a faction…</option>{factions.map((faction) => <option key={faction.slug} value={faction.slug}>{faction.title}</option>)}</select>
            <select aria-label="Stance" onChange={(event) => setRelations((rows) => rows.map((other, at) => at === index ? { ...other, stance: event.target.value } : other))} value={row.stance}><option value="">Not decided</option>{storyFactionStances.map((stance) => <option key={stance} value={stance}>{stance}</option>)}</select>
            <input aria-label="Relationship notes" maxLength={500} onChange={(event) => setRelations((rows) => rows.map((other, at) => at === index ? { ...other, notes: event.target.value } : other))} placeholder="What binds or divides them?" value={row.notes} />
            <RowButton label="Remove this relationship" onClick={() => setRelations((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Goals — one per line<textarea onChange={(event) => setGoals(event.target.value)} placeholder="What are they trying to change, protect, acquire, or destroy?" rows={4} value={goals} /></label>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={3} value={openQuestions} /></label>
      <SheetSubmit label="Save faction sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Region sheet — connections are the world map
// ---------------------------------------------------------------------------

export function RegionSheet({ entryId, version, meta, factions, regions }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  factions: SlugOption[];
  regions: SlugOption[];
}) {
  const source = record(meta);
  const [type, setType] = useState(text(source.type));
  const [settlementTier, setSettlementTier] = useState(text(source.settlementTier));
  const [parent, setParent] = useState(text(source.parent));
  const [biome, setBiome] = useState(text(source.biome));
  const [population, setPopulation] = useState(text(source.population));
  const [regionStatus, setRegionStatus] = useState(text(source.status));
  const [veilAnchorTier, setVeilAnchorTier] = useState(text(source.veilAnchorTier));
  const [soulForge, setSoulForge] = useState(text(source.soulForge));
  const [gameTag, setGameTag] = useState(text(source.gameTag));
  const [control, setControl] = useState(asArray(source.control).map((row) => ({ faction: text(record(row).faction), kind: text(record(row).kind) })));
  const [connections, setConnections] = useState(asArray(source.connections).map((row) => ({ to: text(record(row).to), by: text(record(row).by), notes: text(record(row).notes) })));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const composed: StoryRegionMeta = {
    type: (storyRegionTypes as readonly string[]).includes(type) ? (type as StoryRegionMeta["type"]) : null,
    settlementTier: type === "settlement" && (storySettlementTiers as readonly string[]).includes(settlementTier) ? (settlementTier as StoryRegionMeta["settlementTier"]) : null,
    parent: orNull(parent),
    biome: orNull(biome),
    control: control.filter((row) => row.faction.trim()).map((row) => ({ faction: row.faction.trim(), kind: (storyControlKinds as readonly string[]).includes(row.kind) ? (row.kind as "holds" | "contests" | "influences") : null })),
    population: orNull(population),
    connections: connections.filter((row) => row.to.trim()).map((row) => ({ to: row.to.trim(), by: orNull(row.by), notes: orNull(row.notes) })),
    status: orNull(regionStatus),
    veilAnchorTier: (storyVeilAnchorTiers as readonly string[]).includes(veilAnchorTier) ? (veilAnchorTier as StoryRegionMeta["veilAnchorTier"]) : null,
    soulForge: (storySoulForgeStates as readonly string[]).includes(soulForge) ? (soulForge as StoryRegionMeta["soulForge"]) : null,
    gameTag: orNull(gameTag),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Region sheet — the connections below are the world map; the app draws it, nobody maintains a map file</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Type<select onChange={(event) => setType(event.target.value)} value={type}><option value="">Not decided</option>{storyRegionTypes.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        {type === "settlement" ? <label>Settlement tier<select onChange={(event) => setSettlementTier(event.target.value)} value={settlementTier}><option value="">Not decided</option>{storySettlementTiers.map((option) => <option key={option} value={option}>{option}</option>)}</select></label> : null}
        <label>Parent region<select onChange={(event) => setParent(event.target.value)} value={parent}><option value="">None — top level</option>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</select></label>
        <label>Biome<input maxLength={160} onChange={(event) => setBiome(event.target.value)} placeholder="jungle, tropical coast…" type="text" value={biome} /></label>
        <label>Population<input maxLength={160} onChange={(event) => setPopulation(event.target.value)} placeholder="free-text scale" type="text" value={population} /></label>
        <label>Status<input maxLength={160} onChange={(event) => setRegionStatus(event.target.value)} placeholder="collapsing, occupied, thriving…" type="text" value={regionStatus} /></label>
        {/* Only places that ARE a Veil Anchor carry a tier; it is what puts the
            Anchor on the atlas and decides how dangerous a Crossing from it is. */}
        <label>Veil Anchor tier<select onChange={(event) => setVeilAnchorTier(event.target.value)} value={veilAnchorTier}>
          <option value="">Not a Veil Anchor</option>
          {storyVeilAnchorTiers.map((option) => <option key={option} value={option}>{storyVeilAnchorTierLabels[option]}</option>)}
        </select></label>
        {/* Where a bound player comes back. A destroyed Forge is map-critical:
            anyone bound to it has nowhere to return to. */}
        <label>Soul Forge<select onChange={(event) => setSoulForge(event.target.value)} value={soulForge}>
          <option value="">No Soul Forge here</option>
          {storySoulForgeStates.map((option) => <option key={option} value={option}>{storySoulForgeStateLabels[option]}</option>)}
        </select></label>
        <label>Game tag<input maxLength={120} onChange={(event) => setGameTag(event.target.value)} placeholder="Region.*" type="text" value={gameTag} /></label>
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Control <RowButton label="Add a faction" onClick={() => setControl((rows) => [...rows, { faction: "", kind: "" }])} /></p>
        {control.map((row, index) => (
          <div className="sheet-row sheet-row-two" key={index}>
            <select aria-label="Faction" onChange={(event) => setControl((rows) => rows.map((other, at) => (at === index ? { ...other, faction: event.target.value } : other)))} value={row.faction}><option value="">Faction…</option>{factions.map((faction) => <option key={faction.slug} value={faction.slug}>{faction.title}</option>)}</select>
            <select aria-label="Kind of control" onChange={(event) => setControl((rows) => rows.map((other, at) => (at === index ? { ...other, kind: event.target.value } : other)))} value={row.kind}><option value="">how…</option>{storyControlKinds.map((option) => <option key={option} value={option}>{option}</option>)}</select>
            <RowButton label="Remove this faction" onClick={() => setControl((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Connections — roads, rivers, sea lanes <RowButton label="Add a connection" onClick={() => setConnections((rows) => [...rows, { to: "", by: "", notes: "" }])} /></p>
        {connections.map((row, index) => (
          <div className="sheet-row" key={index}>
            <select aria-label="Connected region" onChange={(event) => setConnections((rows) => rows.map((other, at) => (at === index ? { ...other, to: event.target.value } : other)))} value={row.to}><option value="">To…</option>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</select>
            <input aria-label="By what route" maxLength={80} onChange={(event) => setConnections((rows) => rows.map((other, at) => (at === index ? { ...other, by: event.target.value } : other)))} placeholder="road / river / sea / trail" value={row.by} />
            <input aria-label="Notes" maxLength={300} onChange={(event) => setConnections((rows) => rows.map((other, at) => (at === index ? { ...other, notes: event.target.value } : other)))} placeholder="notes" value={row.notes} />
            <RowButton label="Remove this connection" onClick={() => setConnections((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save region sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Creature sheet — taxonomy is a picker (the law), habitat links to regions
// ---------------------------------------------------------------------------

export function CreatureSheet({ entryId, version, meta, regions, races }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  regions: SlugOption[];
  /** Every other creature, for the race picker — a race is one with no parent. */
  races: SlugOption[];
}) {
  const source = record(meta);
  const [category, setCategory] = useState(text(source.category));
  const [parent, setParent] = useState(text(source.parent));
  const [biomes, setBiomes] = useState(asArray(source.biomes).map(text));
  const [threat, setThreat] = useState(text(source.threat));
  const [harvest, setHarvest] = useState(text(source.harvest));
  const [gameId, setGameId] = useState(text(source.gameId));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));
  const biomeListId = `creature-biomes-${entryId}`;

  const composed: StoryCreatureMeta = {
    category: (storyCreatureCategories as readonly string[]).includes(category) ? (category as StoryCreatureMeta["category"]) : null,
    parent: orNull(parent),
    biomes: biomes.map((value) => value.trim()).filter(Boolean),
    threat: orNull(threat),
    harvest: orNull(harvest),
    gameId: orNull(gameId),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Race sheet — file it under its race, and pick a region for each habitat so the bestiary stays wired to the map</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <label>Which race this belongs to<select onChange={(event) => setParent(event.target.value)} value={parent}>
        <option value="">Nothing above it — this entry IS a race</option>
        {races.map((race) => <option key={race.slug} value={race.slug}>{race.title}</option>)}
      </select></label>

      <div className="sheet-grid">
        <label>Category — the taxonomy law<select onChange={(event) => setCategory(event.target.value)} value={category}><option value="">Not decided</option>{storyCreatureCategories.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Game ID<input maxLength={120} onChange={(event) => setGameId(event.target.value)} placeholder="DA_* once one exists" type="text" value={gameId} /></label>
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Where it lives — a region from the atlas, or a free-text biome <RowButton label="Add a habitat" onClick={() => setBiomes((rows) => [...rows, ""])} /></p>
        <datalist id={biomeListId}>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</datalist>
        {biomes.map((biome, index) => (
          <div className="sheet-row sheet-row-compact" key={index}>
            <input aria-label="Habitat" list={biomeListId} maxLength={160} onChange={(event) => setBiomes((rows) => rows.map((value, at) => (at === index ? event.target.value : value)))} placeholder="riftwood-interior, or 'tropical coast'" value={biome} />
            <RowButton label="Remove this habitat" onClick={() => setBiomes((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Threat — what makes it dangerous<textarea maxLength={500} onChange={(event) => setThreat(event.target.value)} rows={2} value={threat} /></label>
      <label>Harvest — what the extraction economy wants from it<textarea maxLength={500} onChange={(event) => setHarvest(event.target.value)} rows={2} value={harvest} /></label>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save race sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Item sheet — origin links back to a faction or place where one exists
// ---------------------------------------------------------------------------

export function ItemSheet({ entryId, version, meta, factions, regions }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  factions: SlugOption[];
  regions: SlugOption[];
}) {
  const source = record(meta);
  const [category, setCategory] = useState(text(source.category));
  const [rarity, setRarity] = useState(text(source.rarity));
  const [origin, setOrigin] = useState(text(source.origin));
  const [gameId, setGameId] = useState(text(source.gameId));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));
  const originListId = `item-origin-${entryId}`;

  const composed: StoryItemMeta = {
    category: orNull(category),
    rarity: orNull(rarity),
    origin: orNull(origin),
    gameId: orNull(gameId),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Item sheet — give it an origin so the object stays tied to whoever made it or wherever it came from</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Category<input maxLength={80} onChange={(event) => setCategory(event.target.value)} placeholder="weapon, tool, substance, relic, document…" type="text" value={category} /></label>
        <label>Rarity<input maxLength={80} onChange={(event) => setRarity(event.target.value)} type="text" value={rarity} /></label>
        <label>Origin — a faction or place from the codex, or free text
          <input list={originListId} maxLength={160} onChange={(event) => setOrigin(event.target.value)} placeholder="stormglass-cartel, the-riftwood…" type="text" value={origin} />
        </label>
        <datalist id={originListId}>{[...factions, ...regions].map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}</datalist>
        <label>Game ID — the DA_* asset name; once set it never changes<input maxLength={120} onChange={(event) => setGameId(event.target.value)} type="text" value={gameId} /></label>
      </div>

      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save item sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Event sheet — the timeline module: when, where, and who it dragged in
// ---------------------------------------------------------------------------

export function EventSheet({ entryId, version, meta, regions, entries }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  regions: SlugOption[];
  /** Every working entry — an event can involve anyone and anything. */
  entries: SlugOption[];
}) {
  const source = record(meta);
  const [when, setWhen] = useState(text(source.when));
  const [yearsAgo, setYearsAgo] = useState(typeof source.timelineYearsAgo === "number" ? String(source.timelineYearsAgo) : "");
  const [where, setWhere] = useState(asArray(source.where).map(text));
  const [involved, setInvolved] = useState(asArray(source.involved).map(text));
  const [outcome, setOutcome] = useState(text(source.outcome));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const parsedYears = Number.parseFloat(yearsAgo);
  const composed: StoryEventMeta = {
    when: orNull(when),
    timelineYearsAgo: Number.isFinite(parsedYears) && parsedYears >= 0 ? parsedYears : null,
    where: where.map((value) => value.trim()).filter(Boolean),
    involved: involved.map((value) => value.trim()).filter(Boolean),
    outcome: orNull(outcome),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Event sheet — events with a &quot;when&quot; are the world&apos;s timeline; where and who keep history wired to the map and the cast</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>When — the era, as prose<input maxLength={160} onChange={(event) => setWhen(event.target.value)} placeholder="prologue · ~2,000 years before the present" type="text" value={when} /></label>
        <label>Years before the present — anchors it on the timeline<input min={0} onChange={(event) => setYearsAgo(event.target.value)} placeholder="Blank = the timeline cannot place it (sometimes that IS the canon)" step="any" type="number" value={yearsAgo} /></label>
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Where it happened <RowButton label="Add a place" onClick={() => setWhere((rows) => [...rows, ""])} /></p>
        {where.map((place, index) => (
          <div className="sheet-row sheet-row-compact" key={index}>
            <select aria-label="Place" onChange={(event) => setWhere((rows) => rows.map((value, at) => (at === index ? event.target.value : value)))} value={place}>
              <option value="">Choose a region…</option>
              {regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}
            </select>
            <RowButton label="Remove this place" onClick={() => setWhere((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Who and what it involved <RowButton label="Add a participant" onClick={() => setInvolved((rows) => [...rows, ""])} /></p>
        {involved.map((participant, index) => (
          <div className="sheet-row sheet-row-compact" key={index}>
            <select aria-label="Participant" onChange={(event) => setInvolved((rows) => rows.map((value, at) => (at === index ? event.target.value : value)))} value={participant}>
              <option value="">Choose an entry…</option>
              {entries.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select>
            <RowButton label="Remove this participant" onClick={() => setInvolved((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Outcome — what changed because of it<textarea maxLength={2000} onChange={(event) => setOutcome(event.target.value)} rows={3} value={outcome} /></label>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save event sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Generic read view for kinds without a sheet yet
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// System sheet — the release gate is the point
// ---------------------------------------------------------------------------

export function SystemSheet({ entryId, version, meta, arcs, systems, regions }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  /** Quest arcs, for the unlock picker — the tie between systems and story. */
  arcs: SlugOption[];
  /** Every other system, for the parent picker and depends-on rows. */
  systems: SlugOption[];
  /** Regions, for the per-region expression notes. */
  regions: SlugOption[];
}) {
  const source = record(meta);
  const [category, setCategory] = useState(text(source.category));
  const [buildStatus, setBuildStatus] = useState(text(source.buildStatus));
  const [parent, setParent] = useState(text(source.parent));
  const [unlockArc, setUnlockArc] = useState(text(source.unlockArc));
  const [unlockStage, setUnlockStage] = useState(text(source.unlockStage));
  const [dependsOn, setDependsOn] = useState(asArray(source.dependsOn).map(text));
  const [pillars, setPillars] = useState(asArray(source.pillars).map(text).join("\n"));
  const [regionNotes, setRegionNotes] = useState(asArray(source.regionNotes).map((row) => ({ region: text(record(row).region), note: text(record(row).note) })));
  const [gameTag, setGameTag] = useState(text(source.gameTag));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));
  const systemListId = `system-depends-${entryId}`;
  const regionListId = `system-regions-${entryId}`;

  const composed: StorySystemMeta = {
    category: (storySystemCategories as readonly string[]).includes(category) ? (category as StorySystemMeta["category"]) : null,
    buildStatus: (storySystemStatuses as readonly string[]).includes(buildStatus) ? (buildStatus as StorySystemMeta["buildStatus"]) : null,
    parent: orNull(parent),
    unlockArc: orNull(unlockArc),
    unlockStage: orNull(unlockStage),
    dependsOn: dependsOn.map((value) => value.trim()).filter(Boolean),
    pillars: splitLines(pillars),
    regionNotes: regionNotes.map((row) => ({ region: row.region.trim(), note: row.note.trim() })).filter((row) => row.region && row.note),
    gameTag: orNull(gameTag),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">System sheet — the release fields keep the story and the machine in step</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Category<select onChange={(event) => setCategory(event.target.value)} value={category}><option value="">Not decided</option>{storySystemCategories.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Build status — how real it is on the game side<select onChange={(event) => setBuildStatus(event.target.value)} value={buildStatus}><option value="">Not decided</option>{storySystemStatuses.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      </div>

      <label>Part of which system — Weather lives inside Environment<select onChange={(event) => setParent(event.target.value)} value={parent}>
        <option value="">Nothing — a top-level system</option>
        {systems.map((system) => <option key={system.slug} value={system.slug}>{system.title}</option>)}
      </select></label>

      <div className="sheet-grid">
        <label>Unlocked by which quest arc — the release gate<select onChange={(event) => setUnlockArc(event.target.value)} value={unlockArc}>
          <option value="">No arc — day one, or set a stage note below</option>
          {arcs.map((arc) => <option key={arc.slug} value={arc.slug}>{arc.title}</option>)}
        </select></label>
        <label>Release stage — while no arc exists to link<input maxLength={160} onChange={(event) => setUnlockStage(event.target.value)} placeholder={'"Day one", or "Act II — once the party holds ground"'} type="text" value={unlockStage} /></label>
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">Depends on — systems this one cannot ship without <RowButton label="Add a dependency" onClick={() => setDependsOn((rows) => [...rows, ""])} /></p>
        <datalist id={systemListId}>{systems.map((system) => <option key={system.slug} value={system.slug}>{system.title}</option>)}</datalist>
        {dependsOn.map((dependency, index) => (
          <div className="sheet-row sheet-row-compact" key={index}>
            <input aria-label="Depends on" list={systemListId} maxLength={64} onChange={(event) => setDependsOn((rows) => rows.map((value, at) => (at === index ? event.target.value : value)))} placeholder="trade-and-economy" value={dependency} />
            <RowButton label="Remove this dependency" onClick={() => setDependsOn((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <div className="sheet-rows">
        <p className="eyebrow">By region — how this system expresses where the story happens <RowButton label="Add a region note" onClick={() => setRegionNotes((rows) => [...rows, { region: "", note: "" }])} /></p>
        <datalist id={regionListId}>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</datalist>
        {regionNotes.map((row, index) => (
          <div className="sheet-row" key={index}>
            <input aria-label="Region" list={regionListId} maxLength={64} onChange={(event) => setRegionNotes((rows) => rows.map((value, at) => (at === index ? { ...value, region: event.target.value } : value)))} placeholder="the-starting-island" value={row.region} />
            <input aria-label="How it behaves there" maxLength={300} onChange={(event) => setRegionNotes((rows) => rows.map((value, at) => (at === index ? { ...value, note: event.target.value } : value)))} placeholder="Cooler in winter, but it never snows." value={row.note} />
            <RowButton label="Remove this region note" onClick={() => setRegionNotes((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
      </div>

      <label>Pillars — what the loop promises the player, one per line<textarea onChange={(event) => setPillars(event.target.value)} placeholder={"Power always has a price\nNothing gathered is worthless"} rows={3} value={pillars} /></label>
      <label>Game tag<input maxLength={120} onChange={(event) => setGameTag(event.target.value)} placeholder="SYS_* once one exists" type="text" value={gameTag} /></label>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save system sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Slug-list rows — the shared shape of every related-* field on the
// narrative-development sheets: pick from what exists, type what doesn't yet.
// ---------------------------------------------------------------------------

function SlugRows({ label, values, onChange, options, listId, placeholder }: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  options: SlugOption[];
  listId: string;
  placeholder: string;
}) {
  return (
    <div className="sheet-rows">
      <p className="eyebrow">{label} <RowButton label={`Add to ${label}`} onClick={() => onChange([...values, ""])} /></p>
      <datalist id={listId}>{options.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}</datalist>
      {values.map((value, index) => (
        <div className="sheet-row sheet-row-compact" key={index}>
          <input aria-label={label} list={listId} maxLength={64} onChange={(event) => onChange(values.map((current, at) => (at === index ? event.target.value : current)))} placeholder={placeholder} value={value} />
          <RowButton label={`Remove from ${label}`} onClick={() => onChange(values.filter((_, at) => at !== index))} remove />
        </div>
      ))}
    </div>
  );
}

const cleanSlugs = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// Story thread sheet
// ---------------------------------------------------------------------------

export function ThreadSheet({ entryId, version, meta, characters, factions, regions, arcs, threads, missions, everything }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  characters: SlugOption[];
  factions: SlugOption[];
  regions: SlugOption[];
  /** Quest arcs, for the related-missions rows. */
  arcs: SlugOption[];
  /** Every other thread, for the parent picker. */
  threads: SlugOption[];
  /** Companion missions, for the related rows. */
  missions: SlugOption[];
  /** Every entry — a boss can be a character or a creature. */
  everything: SlugOption[];
}) {
  const source = record(meta);
  const [threadStatus, setThreadStatus] = useState(text(source.threadStatus));
  const [categories, setCategories] = useState(asArray(source.categories).map(text));
  const [stages, setStages] = useState(asArray(source.stages).map(text));
  const [priority, setPriority] = useState(text(source.priority));
  const [spoilerLevel, setSpoilerLevel] = useState(text(source.spoilerLevel));
  const [parent, setParent] = useState(text(source.parent));
  const [cast, setCast] = useState(asArray(source.characters).map(text));
  const [companions, setCompanions] = useState(asArray(source.companions).map(text));
  const [factionList, setFactionList] = useState(asArray(source.factions).map(text));
  const [locations, setLocations] = useState(asArray(source.locations).map(text));
  const [arcList, setArcList] = useState(asArray(source.arcs).map(text));
  const [missionList, setMissionList] = useState(asArray(source.companionMissions).map(text));
  const [bosses, setBosses] = useState(asArray(source.bosses).map(text));
  const [tags, setTags] = useState(asArray(source.tags).map(text).join("\n"));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const toggle = (values: string[], set: (next: string[]) => void, value: string) =>
    set(values.includes(value) ? values.filter((current) => current !== value) : [...values, value]);

  const composed: StoryThreadMeta = {
    threadStatus: (storyThreadStatuses as readonly string[]).includes(threadStatus) ? (threadStatus as StoryThreadMeta["threadStatus"]) : null,
    categories: categories.filter((value): value is StoryThreadMeta["categories"][number] => (storyThreadCategories as readonly string[]).includes(value)),
    stages: stages.filter((value): value is StoryThreadMeta["stages"][number] => (storyStoryStages as readonly string[]).includes(value)),
    priority: (storyThreadPriorities as readonly string[]).includes(priority) ? (priority as StoryThreadMeta["priority"]) : null,
    spoilerLevel: (storySpoilerLevels as readonly string[]).includes(spoilerLevel) ? (spoilerLevel as StoryThreadMeta["spoilerLevel"]) : null,
    parent: orNull(parent),
    characters: cleanSlugs(cast),
    companions: cleanSlugs(companions),
    factions: cleanSlugs(factionList),
    locations: cleanSlugs(locations),
    arcs: cleanSlugs(arcList),
    companionMissions: cleanSlugs(missionList),
    bosses: cleanSlugs(bosses),
    // Carried through untouched. The sheet serializes the WHOLE meta object
    // and zod strips what it does not see, so dropping this line would delete
    // every canon packet the thread holds on the next save. Packets are
    // written by the push/weave/withdraw actions, never edited here.
    canonPackets: asArray(source.canonPackets) as StoryThreadMeta["canonPackets"],
    tags: splitLines(tags),
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Thread sheet — status, placement, and every relationship this concept touches</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Status — where the room stands on this<select onChange={(event) => setThreadStatus(event.target.value)} value={threadStatus}>
          <option value="">No status yet</option>
          {storyThreadStatuses.map((option) => <option key={option} value={option}>{storyThreadStatusLabels[option]}</option>)}
        </select></label>
        <label>Priority<select onChange={(event) => setPriority(event.target.value)} value={priority}><option value="">Not decided</option>{storyThreadPriorities.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Spoiler level<select onChange={(event) => setSpoilerLevel(event.target.value)} value={spoilerLevel}><option value="">Not decided</option>{storySpoilerLevels.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      </div>

      <div className="thread-create-taxonomy">
        <fieldset><legend>Categories</legend>{storyThreadCategories.map((option) => <label key={option}><input checked={categories.includes(option)} onChange={() => toggle(categories, setCategories, option)} type="checkbox" /> {storyThreadCategoryLabels[option]}</label>)}</fieldset>
        <fieldset><legend>Story stages it touches</legend>{storyStoryStages.map((option) => <label key={option}><input checked={stages.includes(option)} onChange={() => toggle(stages, setStages, option)} type="checkbox" /> {storyStoryStageLabels[option]}</label>)}</fieldset>
      </div>

      <label>Grew out of which thread<select onChange={(event) => setParent(event.target.value)} value={parent}>
        <option value="">Nothing — a top-level thread</option>
        {threads.map((thread) => <option key={thread.slug} value={thread.slug}>{thread.title}</option>)}
      </select></label>

      <SlugRows label="Related characters" listId={`thread-cast-${entryId}`} onChange={setCast} options={characters} placeholder="amanda" values={cast} />
      <SlugRows label="Related companions" listId={`thread-companions-${entryId}`} onChange={setCompanions} options={characters} placeholder="amanda" values={companions} />
      <SlugRows label="Related factions" listId={`thread-factions-${entryId}`} onChange={setFactionList} options={factions} placeholder="stormglass-cartel" values={factionList} />
      <SlugRows label="Related locations" listId={`thread-locations-${entryId}`} onChange={setLocations} options={regions} placeholder="port-arcadia" values={locations} />
      <SlugRows label="Related missions (quest arcs)" listId={`thread-arcs-${entryId}`} onChange={setArcList} options={arcs} placeholder="the-captivity-arc" values={arcList} />
      <SlugRows label="Related companion missions" listId={`thread-missions-${entryId}`} onChange={setMissionList} options={missions} placeholder="two-empty-cribs" values={missionList} />
      <SlugRows label="Related bosses" listId={`thread-bosses-${entryId}`} onChange={setBosses} options={everything} placeholder="tino" values={bosses} />

      <label>Tags — one per line<textarea onChange={(event) => setTags(event.target.value)} placeholder={"amanda\nmissing-children"} rows={2} value={tags} /></label>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save thread sheet" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Companion mission sheet
// ---------------------------------------------------------------------------

export function CompanionMissionSheet({ entryId, version, meta, characters, factions, regions, threads, arcs = [] }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  characters: SlugOption[];
  factions: SlugOption[];
  regions: SlugOption[];
  threads: SlugOption[];
  /** Quest boards, so a mission can say which one it actually became. */
  arcs?: SlugOption[];
}) {
  const source = record(meta);
  const [companion, setCompanion] = useState(text(source.companion));
  const [arc, setArc] = useState(text(source.arc));
  const [order, setOrder] = useState(typeof source.order === "number" ? String(source.order) : "");
  const [missionStatus, setMissionStatus] = useState(text(source.missionStatus));
  const [stage, setStage] = useState(text(source.stage));
  const [unlockConditions, setUnlockConditions] = useState(text(source.unlockConditions));
  const [rewards, setRewards] = useState(asArray(source.rewards).map(text).join("\n"));
  const [relationshipEffects, setRelationshipEffects] = useState(text(source.relationshipEffects));
  const [consequences, setConsequences] = useState(text(source.consequences));
  const [cast, setCast] = useState(asArray(source.characters).map(text));
  const [locations, setLocations] = useState(asArray(source.locations).map(text));
  const [factionList, setFactionList] = useState(asArray(source.factions).map(text));
  const [threadList, setThreadList] = useState(asArray(source.threads).map(text));
  const [openQuestions, setOpenQuestions] = useState(asArray(source.openQuestions).map(text).join("\n"));

  const orderNumber = Number.parseInt(order, 10);
  const composed: StoryCompanionMissionMeta = {
    companion: orNull(companion),
    arc: orNull(arc),
    order: Number.isInteger(orderNumber) && orderNumber >= 1 && orderNumber <= 99 ? orderNumber : null,
    missionStatus: (storyCompanionMissionStatuses as readonly string[]).includes(missionStatus) ? (missionStatus as StoryCompanionMissionMeta["missionStatus"]) : null,
    stage: (storyStoryStages as readonly string[]).includes(stage) ? (stage as StoryCompanionMissionMeta["stage"]) : null,
    unlockConditions: orNull(unlockConditions),
    rewards: splitLines(rewards),
    relationshipEffects: orNull(relationshipEffects),
    consequences: orNull(consequences),
    characters: cleanSlugs(cast),
    locations: cleanSlugs(locations),
    factions: cleanSlugs(factionList),
    threads: cleanSlugs(threadList),
    openQuestions: splitLines(openQuestions),
  };

  const companionListId = `mission-companion-${entryId}`;

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Companion mission sheet — whose arc, where in the chain, and what it costs</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Whose companion arc<input aria-label="Companion" list={companionListId} maxLength={64} onChange={(event) => setCompanion(event.target.value)} placeholder="amanda" value={companion} /></label>
        <datalist id={companionListId}>{characters.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}</datalist>
        <label>Order in their chain<input inputMode="numeric" max={99} min={1} onChange={(event) => setOrder(event.target.value)} placeholder="1" type="number" value={order} /></label>
        <label>Status<select onChange={(event) => setMissionStatus(event.target.value)} value={missionStatus}><option value="">No status yet</option>{storyCompanionMissionStatuses.map((option) => <option key={option} value={option}>{storyCompanionMissionStatusLabels[option]}</option>)}</select></label>
        <label>Story stage<select onChange={(event) => setStage(event.target.value)} value={stage}><option value="">Not decided</option>{storyStoryStages.map((option) => <option key={option} value={option}>{storyStoryStageLabels[option]}</option>)}</select></label>
      </div>

      <label>Has this been built yet?<select onChange={(event) => setArc(event.target.value)} value={arc}>
        <option value="">Not built yet — still just written down</option>
        {arcs.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
      </select>
      <small className="sheet-hint">Pick the quest board this mission became. Until you do, it shows in {companion ? companion.replaceAll("-", " ") : "the companion"}&apos;s chain as planned.</small></label>

      <label>Unlock conditions — what has to be true before this opens<textarea maxLength={1000} onChange={(event) => setUnlockConditions(event.target.value)} placeholder="Amanda recruited; the party has heard Tino's name spoken twice." rows={2} value={unlockConditions} /></label>
      <label>Rewards — one per line<textarea onChange={(event) => setRewards(event.target.value)} placeholder={"Amanda's trust deepens\nA keepsake from the old tavern"} rows={2} value={rewards} /></label>
      <label>Relationship effects<textarea maxLength={1000} onChange={(event) => setRelationshipEffects(event.target.value)} rows={2} value={relationshipEffects} /></label>
      <label>Consequences — what it changes in the world or the story<textarea maxLength={1000} onChange={(event) => setConsequences(event.target.value)} rows={2} value={consequences} /></label>

      <SlugRows label="Related characters" listId={`mission-cast-${entryId}`} onChange={setCast} options={characters} placeholder="tino" values={cast} />
      <SlugRows label="Related locations" listId={`mission-locations-${entryId}`} onChange={setLocations} options={regions} placeholder="the-peninsula" values={locations} />
      <SlugRows label="Related factions" listId={`mission-factions-${entryId}`} onChange={setFactionList} options={factions} placeholder="stormglass-cartel" values={factionList} />
      <SlugRows label="Advances which story threads" listId={`mission-threads-${entryId}`} onChange={setThreadList} options={threads} placeholder="the-empty-cribs" values={threadList} />

      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>
      <SheetSubmit label="Save mission sheet" />
    </form>
  );
}

function MetaValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <em>not yet decided</em>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <em>none yet</em>;
    return <ul>{value.map((item, index) => <li key={index}><MetaValue value={item} /></li>)}</ul>;
  }
  if (typeof value === "object") {
    return <dl>{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key}><dt>{key}</dt><dd><MetaValue value={item} /></dd></div>)}</dl>;
  }
  return <span>{String(value)}</span>;
}

/** Read-only module data for kinds whose structured editor is not built yet. */
export function MetaView({ meta }: { meta: Record<string, unknown> }) {
  return (
    <div className="entry-meta-view">
      <p className="eyebrow">Module data</p>
      <MetaValue value={meta} />
    </div>
  );
}
