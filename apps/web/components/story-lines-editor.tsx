"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Scissors, Trash2, Volume2, VolumeX } from "lucide-react";
import { dialogueDefaultLocale, dialogueEmotionTags, dialogueIntensityDefault, dialogueSpeakerRoles, dialogueTextProblem, isDialogueRole } from "@habitat/shared";
import { proposeNodeLines, saveNodeLines, type LineRowInput } from "@/app/codex/actions";
import type { StoryBoardLine } from "@/lib/story-codex";

/**
 * The Lines section under a card's body (export contract v5, A1–A3): an
 * ordered list of spoken lines, each a row of fields — speaker, listener,
 * the exact words, a performance direction, intensity, emotion tags, locale,
 * voiced — that a writer fills in instead of the exporter guessing them from
 * prose. Rows reorder and insert freely; the number a row was exported with
 * never changes, so deleting one retires its number rather than reusing it.
 *
 * Everything here is draft state until "Save lines"; the server re-validates
 * every row and refuses the whole list with the reasons, which are shown
 * beside the button rather than lost to a generic error page.
 */

type Character = { id: string; slug: string; title: string };

type DraftRow = {
  id: string | null;
  number: number | null;
  /** "c:<entryId>" for a character, "r:<role>" for a role. */
  speaker: string;
  listener: string;
  text: string;
  performance: string;
  intensity: number;
  emotion: string[];
  locale: string;
  voiced: boolean;
  /** True on a proposed row the writer has not looked at yet. */
  proposed?: boolean;
  /** The prose name a proposal came from, when it did not resolve. */
  spokenAs?: string;
};

const roleKey = (role: string) => `r:${role}`;
const characterKey = (id: string) => `c:${id}`;

function fromStored(line: StoryBoardLine): DraftRow {
  return {
    id: line.id,
    number: line.number,
    speaker: line.speaker ? characterKey(line.speaker.id) : roleKey(line.speakerRole ?? "unattributed"),
    listener: line.listener ? characterKey(line.listener.id) : line.listenerRole ? roleKey(line.listenerRole) : "",
    text: line.text,
    performance: line.performance,
    intensity: line.intensity,
    emotion: line.emotion,
    locale: line.locale,
    voiced: line.voiced,
  };
}

function blankRow(): DraftRow {
  return { id: null, number: null, speaker: "", listener: "", text: "", performance: "", intensity: dialogueIntensityDefault, emotion: [], locale: dialogueDefaultLocale, voiced: true };
}

function toInput(row: DraftRow): LineRowInput {
  const speakerEntryId = row.speaker.startsWith("c:") ? row.speaker.slice(2) : null;
  const speakerRole = row.speaker.startsWith("r:") ? row.speaker.slice(2) : null;
  const listenerEntryId = row.listener.startsWith("c:") ? row.listener.slice(2) : null;
  const listenerRole = row.listener.startsWith("r:") ? row.listener.slice(2) : null;
  return { id: row.id, speakerEntryId, speakerRole, listenerEntryId, listenerRole, text: row.text, performance: row.performance, intensity: row.intensity, emotion: row.emotion as LineRowInput["emotion"], locale: row.locale, voiced: row.voiced };
}

/** What is wrong with a row, before the server is asked. */
function rowProblem(row: DraftRow): string | null {
  if (!row.speaker) return "needs a speaker";
  if (row.speaker.startsWith("r:") && !isDialogueRole(row.speaker.slice(2))) return "role must be lower-case words joined by hyphens";
  const text = dialogueTextProblem(row.text.trim());
  if (text) return `text ${text}`;
  return null;
}

export function StoryLinesEditor({ nodeId, nodeKind, arcSlug, nodeKey, lines, characters, canEdit, hasBody }: {
  nodeId: string;
  nodeKind: string;
  arcSlug: string;
  nodeKey: string;
  lines: StoryBoardLine[];
  characters: Character[];
  canEdit: boolean;
  hasBody: boolean;
}) {
  const [rows, setRows] = useState<DraftRow[]>(() => lines.map(fromStored));
  const [identity, setIdentity] = useState(() => JSON.stringify(lines.map((line) => [line.id, line.text, line.order])));
  const [dirty, setDirty] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [customRole, setCustomRole] = useState<Record<number, boolean>>({});

  // Another writer's save (via live sync) brings new stored lines; take them
  // unless there is unsaved work here, in which case the draft wins and the
  // server's version check settles it on save.
  const storedIdentity = JSON.stringify(lines.map((line) => [line.id, line.text, line.order]));
  if (storedIdentity !== identity && !dirty) {
    setIdentity(storedIdentity);
    setRows(lines.map(fromStored));
  }

  const update = (index: number, patch: Partial<DraftRow>) => {
    setRows((current) => current.map((row, at) => (at === index ? { ...row, ...patch, proposed: false } : row)));
    setDirty(true);
  };
  const move = (index: number, direction: -1 | 1) => {
    setRows((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
    setDirty(true);
  };
  const insertAfter = (index: number) => {
    setRows((current) => [...current.slice(0, index + 1), blankRow(), ...current.slice(index + 1)]);
    setDirty(true);
  };
  const remove = (index: number) => {
    setRows((current) => current.filter((_row, at) => at !== index));
    setDirty(true);
  };

  const save = () => {
    const local = rows.map((row, index) => { const problem = rowProblem(row); return problem ? `Line ${index + 1}: ${problem}.` : null; }).filter((problem): problem is string => Boolean(problem));
    if (local.length) { setProblems(local); return; }
    setProblems([]);
    setNotice(null);
    startTransition(async () => {
      const result = await saveNodeLines({ nodeId, rows: rows.map(toInput) });
      if (!result.ok) { setProblems(result.problems); return; }
      setDirty(false);
      setNotice(`Saved ${result.count} line${result.count === 1 ? "" : "s"}.`);
    });
  };

  const split = () => {
    setProblems([]);
    startTransition(async () => {
      const { rows: proposed, characters: known } = await proposeNodeLines({ nodeId });
      if (!proposed.length) { setNotice("No quoted speech found in the scene text to split."); return; }
      const bySlug = new Map(known.map((character) => [character.slug, character.id]));
      const drafts: DraftRow[] = proposed.map((line) => ({
        ...blankRow(),
        speaker: line.speakerSlug && bySlug.has(line.speakerSlug) ? characterKey(bySlug.get(line.speakerSlug)!) : roleKey(line.speakerRole ?? "unattributed"),
        text: line.text,
        performance: line.performance,
        voiced: line.voiced,
        proposed: true,
        spokenAs: line.speakerSlug ? undefined : line.spokenAs,
      }));
      setRows((current) => [...current, ...drafts]);
      setDirty(true);
      const unattributed = proposed.filter((line) => line.unattributed).length;
      setNotice(`Proposed ${proposed.length} line${proposed.length === 1 ? "" : "s"} from the scene text${unattributed ? `; ${unattributed} could not be attributed and ${unattributed === 1 ? "is" : "are"} marked unattributed, not voiced` : ""}. Check each row, then save.`);
    });
  };

  const characterOptions = characters.map((character) => <option key={character.id} value={characterKey(character.id)}>{character.title}</option>);
  const knownRoles = new Set<string>(dialogueSpeakerRoles);
  const voicedCount = rows.filter((row) => row.voiced).length;

  return (
    <section className="story-lines">
      <header className="story-lines-head">
        <div>
          <p className="eyebrow">Lines · {rows.length} {rows.length === 1 ? "line" : "lines"}{rows.length ? ` · ${voicedCount} voiced` : ""}</p>
          <p className="story-inspector-hint">
            {nodeKind === "DIALOGUE"
              ? "Every spoken line as fields, one utterance per row — the voice pipeline renders one file per row and the game makes one dialogue node per row."
              : "Spoken lines inside this card, if any. Narration stays in the scene text; only what somebody says goes here."}
            {" "}Export ids read <code>{arcSlug}/{nodeKey}/01</code>, <code>/02</code>… and never renumber.
          </p>
        </div>
        {canEdit ? (
          <div className="story-lines-tools">
            {hasBody ? <button className="script-btn" disabled={pending} onClick={split} title="Propose rows from the quoted speech in the scene text; the text itself is untouched" type="button"><Scissors aria-hidden="true" size={13} /> Split body into lines</button> : null}
            <button className="script-btn" disabled={pending} onClick={() => { setRows((current) => [...current, blankRow()]); setDirty(true); }} type="button"><Plus aria-hidden="true" size={13} /> Add line</button>
          </div>
        ) : null}
      </header>

      {rows.length === 0 ? <p className="story-inspector-hint story-lines-empty">{nodeKind === "DIALOGUE" ? "No lines yet — this dialogue exports as linesStatus NONE until some are written." : "No spoken lines."}</p> : null}

      <ol className="story-lines-list">
        {rows.map((row, index) => {
          const problem = rowProblem(row);
          const isRole = row.speaker.startsWith("r:");
          const role = isRole ? row.speaker.slice(2) : "";
          const roleIsCustom = customRole[index] || (isRole && !knownRoles.has(role));
          return (
            <li className={`story-line${row.proposed ? " is-proposed" : ""}${row.voiced ? "" : " is-silent"}${problem ? " has-problem" : ""}`} key={row.id ?? `new-${index}`}>
              <div className="story-line-rail">
                <span className="story-line-number" title={row.number ? `Export number ${String(row.number).padStart(2, "0")}, frozen` : "New: gets the next free number on save"}>{row.number ? String(row.number).padStart(2, "0") : "new"}</span>
                {canEdit ? <>
                  <button className="icon-action" disabled={index === 0} onClick={() => move(index, -1)} title="Move up" type="button"><ArrowUp aria-hidden="true" size={12} /><span className="sr-only">Move up</span></button>
                  <button className="icon-action" disabled={index === rows.length - 1} onClick={() => move(index, 1)} title="Move down" type="button"><ArrowDown aria-hidden="true" size={12} /><span className="sr-only">Move down</span></button>
                </> : null}
              </div>
              <div className="story-line-body">
                <div className="story-line-row">
                  <label className="story-line-speaker">Speaker
                    <select disabled={!canEdit} onChange={(event) => { const value = event.target.value; if (value === "r:__custom") { setCustomRole((current) => ({ ...current, [index]: true })); update(index, { speaker: "r:" }); } else { setCustomRole((current) => ({ ...current, [index]: false })); update(index, { speaker: value, voiced: value === roleKey("player") ? false : row.voiced }); } }} value={roleIsCustom ? "r:__custom" : row.speaker}>
                      <option value="">Who says it…</option>
                      <optgroup label="Characters">{characterOptions}</optgroup>
                      <optgroup label="Roles">{dialogueSpeakerRoles.map((known) => <option key={known} value={roleKey(known)}>{known}</option>)}<option value="r:__custom">another role…</option></optgroup>
                    </select>
                    {roleIsCustom ? <input aria-label="Role" disabled={!canEdit} onChange={(event) => update(index, { speaker: roleKey(event.target.value.trim().toLowerCase()) })} placeholder="pearl-merc-1" type="text" value={role} /> : null}
                    {row.spokenAs ? <small className="sheet-hint">Prose says “{row.spokenAs}” — not a character in the bible; pick one or keep the role.</small> : null}
                  </label>
                  <label className="story-line-listener">To
                    <select disabled={!canEdit} onChange={(event) => update(index, { listener: event.target.value })} value={row.listener}>
                      <option value="">Nobody in particular</option>
                      <option value={roleKey("player")}>the player</option>
                      <optgroup label="Characters">{characterOptions}</optgroup>
                    </select>
                  </label>
                  <label className="story-line-voiced story-check" title="Off: the line is shown, not rendered by the voice pipeline">
                    <input checked={row.voiced} disabled={!canEdit} onChange={(event) => update(index, { voiced: event.target.checked })} type="checkbox" />
                    {row.voiced ? <Volume2 aria-hidden="true" size={13} /> : <VolumeX aria-hidden="true" size={13} />} Voiced
                  </label>
                </div>
                <label className="story-line-text">Spoken text
                  <input disabled={!canEdit} maxLength={1000} onChange={(event) => update(index, { text: event.target.value })} placeholder="The exact words, one utterance, nothing the actor would not say aloud." type="text" value={row.text} />
                </label>
                <div className="story-line-row">
                  <label className="story-line-performance">Performance
                    <input disabled={!canEdit} maxLength={200} onChange={(event) => update(index, { performance: event.target.value })} placeholder="tactical shout, not narration" type="text" value={row.performance} />
                  </label>
                  <label className="story-line-intensity">Intensity <output>{row.intensity}</output>
                    <input disabled={!canEdit} max={10} min={1} onChange={(event) => update(index, { intensity: Number(event.target.value) })} step={1} type="range" value={row.intensity} />
                  </label>
                  <label className="story-line-locale">Locale
                    <input disabled={!canEdit} maxLength={16} onChange={(event) => update(index, { locale: event.target.value })} type="text" value={row.locale} />
                  </label>
                </div>
                <div className="story-line-emotions" role="group" aria-label="Emotion tags">
                  {dialogueEmotionTags.map((tag) => {
                    const on = row.emotion.includes(tag);
                    return <button className={`story-line-tag${on ? " is-on" : ""}`} disabled={!canEdit} key={tag} onClick={() => update(index, { emotion: on ? row.emotion.filter((held) => held !== tag) : [...row.emotion, tag] })} type="button">{tag}</button>;
                  })}
                </div>
                {problem ? <p className="story-line-problem">{problem}</p> : null}
              </div>
              {canEdit ? (
                <div className="story-line-rail is-end">
                  <button className="icon-action" onClick={() => insertAfter(index)} title="Insert a line after this one" type="button"><Plus aria-hidden="true" size={12} /><span className="sr-only">Insert after</span></button>
                  <button className="icon-action reject" onClick={() => remove(index)} title={row.number ? `Retire line ${String(row.number).padStart(2, "0")} — its number is never reused` : "Remove this line"} type="button"><Trash2 aria-hidden="true" size={12} /><span className="sr-only">Remove</span></button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {problems.length ? <ul className="story-lines-problems">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : null}
      {notice ? <p className="story-inspector-hint story-lines-notice">{notice}</p> : null}
      {canEdit ? (
        <div className="story-lines-save">
          <button className="save-server" disabled={pending || !dirty} onClick={save} type="button">{pending ? "Saving…" : dirty ? "Save lines" : "Lines saved"}</button>
          {dirty ? <span className="story-inspector-hint">Unsaved changes.</span> : null}
        </div>
      ) : null}
    </section>
  );
}
