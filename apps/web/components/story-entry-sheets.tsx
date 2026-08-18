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
import { storyMagicOrigins, storyControlKinds, storyRegionTypes, storySettlementTiers, type StoryCharacterMeta, type StoryRegionMeta } from "@habitat/shared";
import { updateEntryMeta } from "@/app/codex/actions";
import gallery from "@/lib/model-gallery.json";

type SlugOption = { slug: string; title: string };

const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
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

export function CharacterSheet({ entryId, version, meta, factions, regions, characters, arcs }: {
  entryId: string;
  version: number;
  meta: Record<string, unknown> | null;
  factions: SlugOption[];
  regions: SlugOption[];
  characters: SlugOption[];
  arcs: SlugOption[];
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
    openQuestions: splitLines(openQuestions),
  };

  return (
    <form action={updateEntryMeta} className="story-form entry-sheet">
      <p className="eyebrow">Character sheet — every field optional; blank means &quot;not yet decided&quot; and shows on the needs-work list</p>
      <input name="entryId" type="hidden" value={entryId} />
      <input name="version" type="hidden" value={version} />
      <input name="metaJson" type="hidden" value={JSON.stringify(composed)} />

      <div className="sheet-grid">
        <label>Full name<input maxLength={160} onChange={(event) => setFullName(event.target.value)} value={fullName} /></label>
        <label>Pronouns<input maxLength={40} onChange={(event) => setPronouns(event.target.value)} placeholder="null = writers use they/them" value={pronouns} /></label>
        <label>Sex<input maxLength={40} onChange={(event) => setSex(event.target.value)} value={sex} /></label>
        <label>Species<input maxLength={80} onChange={(event) => setSpecies(event.target.value)} placeholder="human (a new people needs owner sign-off)" value={species} /></label>
        <label>Age<input maxLength={80} onChange={(event) => setAge(event.target.value)} placeholder="late twenties" value={age} /></label>
        <label>Home<select onChange={(event) => setHome(event.target.value)} value={home}><option value="">Not decided</option>{regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}</select></label>
      </div>

      <label>Aliases — one per line<textarea onChange={(event) => setAliases(event.target.value)} rows={2} value={aliases} /></label>
      <label>Appearance<textarea maxLength={2000} onChange={(event) => setAppearance(event.target.value)} rows={2} value={appearance} /></label>
      <label>Voice — what their dialogue sounds like<textarea maxLength={2000} onChange={(event) => setVoice(event.target.value)} rows={3} value={voice} /></label>
      <label>Story role — why this character exists<textarea maxLength={500} onChange={(event) => setStoryRole(event.target.value)} rows={2} value={storyRole} /></label>

      <div className="sheet-grid">
        <label>Magic origin<select onChange={(event) => setOrigin(event.target.value)} value={origin}><option value="">Not decided</option>{storyMagicOrigins.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Corruption phase (0–7)<select onChange={(event) => setCorruptionPhase(event.target.value)} value={corruptionPhase}><option value="">Not decided</option>{Array.from({ length: 8 }, (_, phase) => <option key={phase} value={phase}>{phase}</option>)}</select></label>
      </div>
      <label>Magic schools — one per line<textarea onChange={(event) => setSchools(event.target.value)} rows={2} value={schools} /></label>
      <label>Magic notes<textarea maxLength={2000} onChange={(event) => setMagicNotes(event.target.value)} rows={2} value={magicNotes} /></label>

      <div className="sheet-rows">
        <p className="eyebrow">Factions <RowButton label="Add a faction" onClick={() => setMemberships((rows) => [...rows, { faction: "", role: "", standing: "" }])} /></p>
        {memberships.map((row, index) => (
          <div className="sheet-row" key={index}>
            <select aria-label="Faction" onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, faction: event.target.value } : other)))} value={row.faction}><option value="">Faction…</option>{factions.map((faction) => <option key={faction.slug} value={faction.slug}>{faction.title}</option>)}</select>
            <input aria-label="Role" maxLength={160} onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, role: event.target.value } : other)))} placeholder="role" value={row.role} />
            <input aria-label="Standing" maxLength={160} onChange={(event) => setMemberships((rows) => rows.map((other, at) => (at === index ? { ...other, standing: event.target.value } : other)))} placeholder="standing" value={row.standing} />
            <RowButton label="Remove this faction" onClick={() => setMemberships((rows) => rows.filter((_, at) => at !== index))} remove />
          </div>
        ))}
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

      <ModelPicker onChange={setModel} value={model} />

      <div className="sheet-grid">
        <label>Game ID — the tag the level actor carries<input maxLength={120} onChange={(event) => setGameId(event.target.value)} placeholder="derived from the slug when blank" value={gameId} /></label>
      </div>
      <label>Open questions — one per line<textarea onChange={(event) => setOpenQuestions(event.target.value)} rows={2} value={openQuestions} /></label>

      <SheetSubmit label="Save character sheet" />
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
        <label>Biome<input maxLength={160} onChange={(event) => setBiome(event.target.value)} placeholder="jungle, tropical coast…" value={biome} /></label>
        <label>Population<input maxLength={160} onChange={(event) => setPopulation(event.target.value)} placeholder="free-text scale" value={population} /></label>
        <label>Status<input maxLength={160} onChange={(event) => setRegionStatus(event.target.value)} placeholder="collapsing, occupied, thriving…" value={regionStatus} /></label>
        <label>Game tag<input maxLength={120} onChange={(event) => setGameTag(event.target.value)} placeholder="Region.*" value={gameTag} /></label>
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
// Generic read view for kinds without a sheet yet
// ---------------------------------------------------------------------------

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
