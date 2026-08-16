import assert from "node:assert/strict";
import test from "node:test";
import { buildRecapCopy, chapterHighlights, chronicleKindColor, chronicleReplayKinds, groupChronicleEvents, isViewerMoment, viewerChronicleEvents, type ChronicleReplayEvent, type ChronicleReplayViewer } from "./chronicle-replay";

const event = (id: string, occurredAt: string, overrides: Partial<ChronicleReplayEvent> = {}): ChronicleReplayEvent => ({
  id,
  occurredAt,
  world: "Valheim",
  worldSlug: "valheim",
  text: `Verified moment ${id}.`,
  sourceHref: "/worlds/valheim",
  permalinkHref: `/chronicle/${id}`,
  kind: "world",
  ...overrides,
});

test("groups replay moments into Eastern-time daily chapters and plays each day forward", () => {
  const chapters = groupChronicleEvents([
    event("late", "2026-08-16T03:30:00.000Z"),
    event("next-day", "2026-08-16T05:10:00.000Z"),
    event("early", "2026-08-15T13:00:00.000Z"),
  ]);
  assert.equal(chapters.length, 2);
  assert.deepEqual(chapters[0]!.events.map((item) => item.id), ["next-day"]);
  assert.deepEqual(chapters[1]!.events.map((item) => item.id), ["early", "late"]);
});

test("derives only real worlds, actors, and spotlight moments from a chapter", () => {
  const [chapter] = groupChronicleEvents([
    event("record", "2026-08-15T15:00:00.000Z", { kind: "record", actor: "Tino", actorHref: "/members/tino" }),
    event("arrival", "2026-08-15T14:00:00.000Z", { kind: "arrival", actor: "Tino" }),
    event("boss", "2026-08-15T13:00:00.000Z", { kind: "achievement", world: "Enshrouded" }),
  ]);
  assert.deepEqual(chapter!.worlds, ["Valheim", "Enshrouded"]);
  assert.deepEqual(chapter!.actors, [{ name: "Tino", href: "/members/tino" }]);
  assert.equal(chapter!.spotlightCount, 2);
  assert.match(buildRecapCopy(chapter!), /3 verified moments across 2 Habitat worlds/);
});

test("headlines a chapter with its newest three moments, newest first", () => {
  const [chapter] = groupChronicleEvents(["10:00", "11:00", "12:00", "13:00"].map((time, index) => event(`e${index}`, `2026-08-15T${time}:00.000Z`)));
  assert.deepEqual(chapterHighlights(chapter!).map((item) => item.id), ["e3", "e2", "e1"]);
});

test("gives every moment kind an exported colour", () => {
  const colors = chronicleReplayKinds.map((kind) => chronicleKindColor(kind));
  assert.equal(colors.filter((color) => /^#[0-9a-f]{6}$/.test(color)).length, chronicleReplayKinds.length);
  assert.equal(new Set(colors).size, chronicleReplayKinds.length, "each kind must stay visually distinguishable");
});

test("builds a Director's Cut strictly from owned provenance links", () => {
  const viewer: ChronicleReplayViewer = {
    displayName: "Tino",
    avatar: "/images/avatars/campfire.svg",
    avatarBorderClass: "avatar-border-default",
    actorHrefs: ["/members/tino", "/chronicle/identity/owned"],
  };
  const ownedMemberMoment = event("member", "2026-08-15T15:00:00.000Z", { actor: "Tino", actorHref: "/members/tino" });
  const ownedIdentityMoment = event("identity", "2026-08-15T14:00:00.000Z", { actor: "Viking", actorHref: "/chronicle/identity/owned" });
  const namesakeOnly = event("namesake", "2026-08-15T13:00:00.000Z", { actor: "Tino" });
  assert.equal(isViewerMoment(ownedMemberMoment, viewer), true);
  assert.deepEqual(viewerChronicleEvents([ownedMemberMoment, ownedIdentityMoment, namesakeOnly], viewer).map((item) => item.id), ["member", "identity"]);
  assert.match(buildRecapCopy(groupChronicleEvents([ownedMemberMoment])[0]!, viewer.displayName), /Tino’s Chronicle — Director’s Cut/);
});
