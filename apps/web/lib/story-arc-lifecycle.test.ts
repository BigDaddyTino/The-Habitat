import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * Opening a quest board and closing one again.
 *
 * Both halves went missing in ways nobody could see. A board could be opened
 * but never taken back out — there was no action for it at all, so a test
 * quest somebody's kid made sat on the stories page permanently. And the three
 * categories that are defined by what they are filed to refused a save with a
 * message written for the room, which production redacts, so the writer saw
 * the generic "that did not save" page and picked a different category rather
 * than learn what was wrong.
 */

const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
const arcForm = readFileSync(join(process.cwd(), "components/story-arc-form.tsx"), "utf8");
const arcPage = readFileSync(join(process.cwd(), "app/codex/arc/[slug]/page.tsx"), "utf8");

test("a quest board can be taken out of the working codex", () => {
  assert.match(actions, /export async function archiveArc\(formData: FormData\)/, "there must be a way to close a board somebody opened by mistake");
  const body = actions.slice(actions.indexOf("export async function archiveArc("), actions.indexOf("export async function lockArc("));

  // Archived, never erased — the same law entries and canon scenes run on. A
  // board carries scenes, branches, revisions, and whatever the game already
  // imported from it; a cleanup must not take those with it.
  assert.doesNotMatch(body, /storyArc\.delete|deleteMany/, "a board is archived, never deleted");
  assert.match(body, /status: "ARCHIVED"/, "archiving is a status change");
  assert.match(body, /recordRevision/, "and it leaves a trail somebody can restore from");

  // The freeze binds here too, or "settled" would mean nothing.
  assert.match(body, /await assertArcUnlocked\(tx, arc\.id\)/, "a locked board must refuse to be archived until it is unlocked");
  assert.match(body, /requireRole\(storyReviewRole\)/, "closing a board is an admin call");
  assert.match(body, /already archived/, "archiving twice from a stale tab must be refused, not silently repeated");
});

test("the archived board leaves the working surfaces rather than lingering", () => {
  // ARCHIVED is outside workingStatuses, which is what actually removes it
  // from the stories page, the navigator, and the export. If that list ever
  // grew ARCHIVED, archiving would become a no-op nobody would notice.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  const working = codex.match(/const workingStatuses: StoryStatus\[\] = \[([^\]]+)\]/);
  assert.ok(working, "workingStatuses must still be the one list the boards read");
  assert.doesNotMatch(working[1], /ARCHIVED/, "an archived board must not count as working");
  assert.doesNotMatch(working[1], /REJECTED/, "nor a rejected one");
});

test("the way to close a board is on the board, behind the settings it belongs with", () => {
  assert.match(arcPage, /action=\{archiveArc\}/, "the arc page must offer it");
  assert.match(arcPage, /\{canReview \?/, "only to somebody who can review");
  assert.match(arcPage, /Archive this story/, "named in plain words");
  // It must sit inside the editable-settings block: a frozen board offers no
  // settings at all, so it must not offer this either.
  const settings = arcPage.slice(arcPage.indexOf("{canEditArc ? ("), arcPage.indexOf("{board.problems.length > 0"));
  assert.match(settings, /archiveArc/, "and only where the board is still editable");
});

test("a category defined by what it is filed to asks for that filing in the browser", () => {
  // The server refuses these three, but a thrown message from a server action
  // is redacted in production — the writer sees a generic failure page. The
  // browser has to ask first, or the refusal is invisible.
  for (const [field, flag] of [["regionEntryId", "needsRegion"], ["companionEntryId", "needsCompanion"], ["factionEntryId", "needsFaction"]] as const) {
    assert.ok(arcForm.includes(`name="${field}" required={${flag}}`), `${field} must be required exactly when its category needs it`);
  }
  // And the empty option says what to do rather than describing an absence.
  assert.match(arcForm, /needsRegion \? "Pick where it is posted"/);
  assert.match(arcForm, /needsCompanion \? "Pick whose story this is"/);
  assert.match(arcForm, /needsFaction \? "Pick whose banner it flies"/);
});

test("no filing field is ever hidden and required at once", () => {
  // A required control inside a hidden label cannot be focused, and the
  // browser refuses to submit the whole form with an error the writer cannot
  // see or clear — worse than the bug this fixes.
  //
  // region:    hidden when the story is a companion quest; required for a contract
  // companion: hidden unless it is a companion quest; required for one
  // faction:   hidden unless it is a faction quest;     required for one
  assert.ok(arcForm.includes("hidden={hide(!needsCompanion)}"), "the region field's visibility rule moved — re-check this pairing");
  assert.ok(arcForm.includes("hidden={hide(needsCompanion)}"), "the companion field's visibility rule moved");
  assert.ok(arcForm.includes("hidden={hide(needsFaction)}"), "the faction field's visibility rule moved");

  // hide(applies) is `guided && !applies`, so a field is hidden when `applies`
  // is false. Walk every category and assert the two never coincide.
  const hide = (applies: boolean) => !applies;
  for (const category of ["MAINLINE", "SIDE_QUEST", "CONTRACT", "COMPANION_QUEST", "FACTION_QUEST", "INCURSION", "WORLD_EVENT"]) {
    const needsRegion = category === "CONTRACT";
    const needsCompanion = category === "COMPANION_QUEST";
    const needsFaction = category === "FACTION_QUEST";
    assert.equal(hide(!needsCompanion) && needsRegion, false, `${category}: region would be hidden and required`);
    assert.equal(hide(needsCompanion) && needsCompanion, false, `${category}: companion would be hidden and required`);
    assert.equal(hide(needsFaction) && needsFaction, false, `${category}: faction would be hidden and required`);
  }
});
