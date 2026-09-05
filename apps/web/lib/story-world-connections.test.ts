import assert from "node:assert/strict";
import test from "node:test";
import { auditWorldConnections, systemInstanceFields, type WorldConnectionEntry } from "./story-world-connections";

const entry = (kind: WorldConnectionEntry["kind"], slug: string, meta: Record<string, unknown> = {}, body: string | null = null): WorldConnectionEntry =>
  ({ kind, slug, title: slug.replaceAll("-", " "), meta, body });

const codes = (entries: WorldConnectionEntry[], arcs: Array<{ slug: string }> = []) =>
  auditWorldConnections(entries, arcs).findings.map((finding) => `${finding.severity}:${finding.code}:${finding.slug}->${finding.target}`);

test("a clean world produces no findings", () => {
  const world = [
    entry("REGION", "riverlands", { connections: [{ to: "the-peninsula", by: "river corridor", notes: null }] }),
    entry("REGION", "the-peninsula", { connections: [{ to: "riverlands", by: "river corridor", notes: null }] }),
    entry("REGION", "the-outfall", { parent: "riverlands", veilAnchorTier: "I", control: [{ faction: "meridian", kind: "influences" }] }),
    entry("SYSTEM", "veil-anchors", { regionNotes: [{ region: "the-outfall", note: "The first Anchor." }] }),
    entry("FACTION", "meridian", { seat: "the-outfall", leaders: ["rew"], relations: [{ faction: "saints", stance: "client", notes: null }] }),
    entry("FACTION", "saints", { relations: [{ faction: "meridian", stance: "ally", notes: null }] }),
    entry("CHARACTER", "rew", { home: "the-outfall", factions: [{ faction: "meridian", role: "Director", standing: null }], relationships: [{ character: "aster", who: null, type: "rival" }], involvement: [{ kind: "EVENT", ref: "the-surge", how: null }] }),
    entry("CHARACTER", "aster", { relationships: [{ character: "rew", who: null, type: "rival" }] }),
    entry("EVENT", "the-surge", { where: ["the-outfall"], involved: ["rew", "meridian"] }),
    entry("THREAD", "the-fuse", { bosses: ["rew"], companionMissions: ["rew-1"] }),
    entry("COMPANION_MISSION", "rew-1", { companion: "rew", threads: ["the-fuse"] }),
  ];
  assert.deepEqual(codes(world), []);
});

test("the Outfall bug: a system note on a region with no instance is a defect, and an instance with no note is only a note", () => {
  const world = [
    entry("REGION", "the-starting-island", {}),
    entry("REGION", "riverlands", {}),
    entry("REGION", "the-outfall", { parent: "riverlands", veilAnchorTier: "I" }),
    entry("SYSTEM", "veil-anchors", { regionNotes: [{ region: "the-starting-island", note: "No controlled Anchor is known here." }] }),
  ];
  const result = auditWorldConnections(world);
  assert.deepEqual(result.findings.filter((finding) => finding.severity === "defect").map((finding) => `${finding.code}:${finding.target}`), ["SYSTEM_NOTE_WITHOUT_INSTANCE:the-starting-island"]);
  assert.deepEqual(result.findings.filter((finding) => finding.severity === "note").map((finding) => `${finding.code}:${finding.slug}`), ["INSTANCE_WITHOUT_SYSTEM_NOTE:the-outfall"]);
});

test("a system note on an ancestor region counts when an instance sits somewhere inside it", () => {
  const world = [
    entry("REGION", "riverlands", {}),
    entry("REGION", "heartland", { parent: "riverlands" }),
    entry("REGION", "the-outfall", { parent: "heartland", veilAnchorTier: "I" }),
    entry("SYSTEM", "veil-anchors", { regionNotes: [{ region: "riverlands", note: "Holds the first Anchor." }, { region: "the-outfall", note: "Here." }] }),
  ];
  assert.deepEqual(codes(world), []);
});

test("every instance-bearing field names a system that exists in the audit's vocabulary", () => {
  for (const spec of systemInstanceFields) {
    assert.match(spec.system, /^[a-z0-9-]+$/);
    assert.ok(spec.relation("I").length > 0);
  }
  const world = [entry("REGION", "somewhere", { soulForge: "active" })];
  assert.deepEqual(codes(world), ["defect:SYSTEM_MISSING:somewhere->the-soul-forge"]);
});

test("a road only one end knows about is a gap on the end that wrote it", () => {
  const world = [
    entry("REGION", "lamplight", { connections: [{ to: "the-stone-field", by: "a footpath", notes: null }] }),
    entry("REGION", "the-stone-field", { connections: [] }),
  ];
  assert.deepEqual(codes(world), ["gap:ONE_WAY_REGION_CONNECTION:lamplight->the-stone-field"]);
});

test("a field that resolves to the wrong kind is a defect; one that resolves nowhere is only a note", () => {
  const world = [
    entry("REGION", "asis-hq", {}),
    entry("FACTION", "the-path", { relations: [{ faction: "asis-hq", stance: "enemy", notes: null }, { faction: "nobody-yet", stance: null, notes: null }] }),
  ];
  assert.deepEqual(codes(world), ["defect:WRONG_KIND:the-path->asis-hq", "note:UNRESOLVED:the-path->nobody-yet"]);
});

test("a thread may propose a character as a boss — Tino is the legendary fight", () => {
  const world = [entry("CHARACTER", "tino", {}), entry("THREAD", "the-empty-cribs", { bosses: ["tino"] })];
  assert.deepEqual(codes(world), []);
});

test("slug-or-prose fields only count as links when they look like a slug", () => {
  const world = [
    entry("CHARACTER", "amanda", { home: "a fishing village on the coast", species: "Lizzarnix — half lizard, half phoenix" }),
    entry("FACTION", "the-bound", { seat: "wherever a Forge stands; no capital by charter", faith: "its own revealed doctrine" }),
    entry("ITEM", "the-pearl", { origin: "somewhere-unwritten" }),
  ];
  assert.deepEqual(codes(world), ["note:UNRESOLVED:the-pearl->somewhere-unwritten"]);
});

test("seats, leaders, stances, relationships, involvement and missions are read from both ends", () => {
  const world = [
    entry("REGION", "heartland", { control: [] }),
    entry("FACTION", "the-watch", { seat: "heartland", leaders: ["wade"], relations: [{ faction: "the-court", stance: "rival", notes: null }] }),
    entry("FACTION", "the-court", { relations: [] }),
    entry("CHARACTER", "wade", { factions: [], relationships: [{ character: "verne", who: null, type: "regard" }], involvement: [{ kind: "EVENT", ref: "the-unveiling", how: null }] }),
    entry("CHARACTER", "verne", { relationships: [] }),
    entry("EVENT", "the-unveiling", { involved: ["verne"] }),
    entry("THREAD", "the-fuse", { companionMissions: ["m-1"] }),
    entry("COMPANION_MISSION", "m-1", { threads: [] }),
    entry("COMPANION_MISSION", "m-2", { threads: ["the-fuse"] }),
  ];
  assert.deepEqual(codes(world).sort(), [
    "gap:LEADER_NOT_MEMBER:the-watch->wade",
    "gap:ONE_WAY_FACTION_RELATION:the-watch->the-court",
    "gap:ONE_WAY_INVOLVEMENT:the-unveiling->verne",
    "gap:ONE_WAY_INVOLVEMENT:wade->the-unveiling",
    "gap:ONE_WAY_RELATIONSHIP:wade->verne",
    "gap:ONE_WAY_THREAD_MISSION:m-2->the-fuse",
    "gap:ONE_WAY_THREAD_MISSION:the-fuse->m-1",
    "gap:SEAT_NOT_IN_CONTROL:the-watch->heartland",
  ]);
});

test("prose links and arc references resolve against arcs too, and self-references are defects", () => {
  const world = [
    entry("REGION", "heartland", { parent: "heartland" }, "See [[the-fuse-at-heartland]] and [[nowhere-written]]."),
    entry("SYSTEM", "ranks", { unlockArc: "the-fuse-at-heartland" }),
  ];
  assert.deepEqual(codes(world, [{ slug: "the-fuse-at-heartland" }]), ["defect:SELF_REFERENCE:heartland->heartland", "note:UNRESOLVED:heartland->nowhere-written"]);
});

test("counts add up", () => {
  const world = [
    entry("REGION", "a", { connections: [{ to: "b", by: null, notes: null }] }),
    entry("REGION", "b", { connections: [], parent: "b" }),
  ];
  const result = auditWorldConnections(world);
  assert.equal(result.defects + result.gaps + result.notes, result.findings.length);
  assert.equal(result.defects, 1);
  assert.equal(result.gaps, 1);
});
