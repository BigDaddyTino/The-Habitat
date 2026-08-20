"use client";

import { useState } from "react";
import { storyArcCategories, storyArcCategoryHints, storyArcCategoryLabels, type StoryArcCategory } from "@habitat/shared";
import { useHydrated } from "@/lib/use-hydrated";

type Option = { id: string; title: string };

/**
 * The one place a story's settings are asked for — the "open a new story" form
 * on the hub and the settings panel on an arc page both render this, so the
 * two can never drift into asking different questions.
 *
 * The shape is deliberately a guided one rather than a wall of fields. The
 * first question is the only one everybody has to answer — what kind of story
 * is this? — and picking an answer reveals the one or two fields that answer
 * actually needs. A contract asks where the bounty is posted; a companion
 * quest asks whose story it is; nothing else asks either.
 *
 * With JavaScript off, every field renders and every field is explained: the
 * hiding only starts once the component has hydrated, so the no-JS path is the
 * full form rather than a form missing the field it needs. The server
 * validates the combination either way — this is ergonomics, not enforcement.
 */
export function ArcFields({ regions, characters, factions = [], canReview, threads = [], defaults, submitLabel }: {
  regions: Option[];
  characters: Option[];
  /** The powers a quest can fly under — majors and their wings alike. */
  factions?: Option[];
  /** Only an admin opens a mainline chapter, so only an admin is offered one. */
  canReview: boolean;
  /** Threads this story can be recorded as having grown out of; create only. */
  threads?: Array<{ id: string; title: string }>;
  defaults?: {
    title?: string;
    summary?: string;
    hook?: string;
    regionEntryId?: string;
    companionEntryId?: string;
    factionEntryId?: string;
    category?: StoryArcCategory;
  };
  submitLabel: string;
}) {
  const [category, setCategory] = useState<StoryArcCategory>(defaults?.category ?? "SIDE_QUEST");
  // Nothing is hidden until the browser has actually taken over. Before that,
  // the server-rendered markup is the whole form.
  const guided = useHydrated();

  const offered = storyArcCategories.filter((option) => option !== "MAINLINE" || canReview);
  const needsRegion = category === "CONTRACT";
  const needsCompanion = category === "COMPANION_QUEST";
  const needsFaction = category === "FACTION_QUEST";
  const hide = (applies: boolean) => guided && !applies;

  return (
    <>
      <fieldset className="arc-kind-picker">
        <legend>What kind of story is this?</legend>
        {offered.map((option) => (
          <label className={category === option ? "is-picked" : ""} key={option}>
            <input
              checked={category === option}
              name="category"
              onChange={() => setCategory(option)}
              type="radio"
              value={option}
            />
            <span>
              <strong>{storyArcCategoryLabels[option]}</strong>
              <small>{storyArcCategoryHints[option]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <label>What is it called?<input defaultValue={defaults?.title ?? ""} maxLength={120} name="title" placeholder="The drowned chapel" required type="text" /></label>
      <label>What is it about?<textarea defaultValue={defaults?.summary ?? ""} maxLength={500} name="summary" placeholder="One or two lines. The room can argue about the rest later." rows={3} /></label>

      <label hidden={hide(!needsCompanion)}>
        {needsRegion ? "Where is the bounty posted?" : "Where does the party pick this up?"}
        <select defaultValue={defaults?.regionEntryId ?? ""} name="regionEntryId">
          <option value="">Nowhere in particular yet</option>
          {regions.map((region) => <option key={region.id} value={region.id}>{region.title}</option>)}
        </select>
        <small className="sheet-hint">{needsRegion
          ? "A contract is posted somewhere — a notice board, a harbour master, a wall in a tavern. Pick that place."
          : "Optional. Picking a place files this story on that place's page too."}</small>
      </label>

      <label hidden={hide(needsCompanion)}>
        Whose story is this?
        <select defaultValue={defaults?.companionEntryId ?? ""} name="companionEntryId">
          <option value="">Nobody in particular</option>
          {characters.map((character) => <option key={character.id} value={character.id}>{character.title}</option>)}
        </select>
        <small className="sheet-hint">A companion quest belongs to one companion. It files itself into their chain.</small>
      </label>

      <label hidden={hide(needsFaction)}>
        Whose banner does it fly?
        <select defaultValue={defaults?.factionEntryId ?? ""} name="factionEntryId">
          <option value="">No faction in particular yet</option>
          {factions.map((faction) => <option key={faction.id} value={faction.id}>{faction.title}</option>)}
        </select>
        <small className="sheet-hint">A faction quest belongs to one power. Pick a wing and it still files under the power that wing answers to.</small>
      </label>

      <label>How does the party find it?<textarea defaultValue={defaults?.hook ?? ""} maxLength={500} name="hook" placeholder="A notice board. A dying stranger. A rumor nobody should repeat." rows={2} /></label>

      {threads.length > 0 ? (
        <label>Did this grow out of a story thread?
          <select defaultValue="" name="fromThreadId">
            <option value="">No — it starts here</option>
            {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.title}</option>)}
          </select>
          <small className="sheet-hint">Picking one records on that thread that it became this story, so the idea keeps its trail.</small>
        </label>
      ) : null}

      <button className="save-server" type="submit">{submitLabel}</button>
    </>
  );
}
