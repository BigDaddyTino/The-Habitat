import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { stableJson } from "./lib/story-authoring";
import { DESIGN_MARKER, layers, newSystems, ruleEdits } from "./lib/character-bible";
import { kitItems, people, species } from "./lib/character-bible-world";
import { backlinks } from "./lib/character-bible-backlinks";

/**
 * Weaves "The Price of a Person" — the character bible — into the codex.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/integrate-character-bible.ts
 *   pnpm --filter @habitat/web exec tsx scripts/integrate-character-bible.ts --apply
 *
 * Preview by default. Nothing here decides on its own to change production.
 *
 * Three kinds of write, and they are deliberately not the same:
 *
 *  - CREATE, for shelves the codex did not have. A slug that already exists is
 *    reported and left alone, because a slug is a frozen export identity and
 *    the codex owns whatever has happened to it since. `--rewrite` overrides
 *    that, and only ever for the entries this pass authored.
 *  - APPEND, for dossiers somebody already wrote. The owner's prose stays
 *    above the line, verbatim, and a word-level loss check proves it. Every
 *    layer cuts back to its own marker first, so a second run replaces its
 *    own work instead of stacking a second copy under it.
 *  - AMEND, for two locked rules the owner approved by hand. Both are exact
 *    paragraph swaps: if the paragraph is not found verbatim, nothing is
 *    written and the mismatch is reported. A locked rule is not a place to
 *    guess.
 *
 * The tutorial map from II·18 is deliberately absent — teaching order belongs
 * to whoever writes the prologue arc, and it is deferred to that pass.
 */
const db = getPrismaClient();

const apply = process.argv.includes("--apply");
const rewrite = process.argv.includes("--rewrite");

type Report = { action: "create" | "append" | "amend" | "update" | "skip" | "unchanged"; what: string; detail?: string };
const report: Report[] = [];
const say = (action: Report["action"], what: string, detail?: string) => {
  report.push({ action, what, detail });
  const mark = { create: "+", append: "~", amend: "!", update: "~", skip: "·", unchanged: " " }[action];
  console.log(`  ${mark} ${action.padEnd(9)} ${what}${detail ? `   ${detail}` : ""}`);
};

let notCarried = 0;

// --- the loss check -------------------------------------------------------
// Nothing the owner wrote may vanish into an append unnoticed. Same stop-list
// as the Soul Forge pass, so the two report the same way.
const STOP = new Set(
  "the a an and or but of to in on at is are was were be been being it its this that these those for with as by from not no nor so than then there their they them he she his her you your we our if all any each both few more most other some such only own same too very can will just should now do does did done have has had having into over under again further once here when where why how what which who whom".split(" "),
);
const contentWords = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP.has(word)),
  );

const lossCheck = (before: string, after: string, what: string) => {
  const now = contentWords(after);
  const lost = [...contentWords(before)].filter((word) => !now.has(word));
  if (lost.length) {
    notCarried += lost.length;
    console.log(`      NOT CARRIED (${what}): ${lost.join(", ")}`);
  }
};

async function actorId() {
  const owner =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`author: ${owner.username}\nmode:   ${apply ? "APPLY" : "preview"}${rewrite ? " +rewrite" : ""}\n`);
  return owner.id;
}

async function revise(entityId: string, action: "CREATED" | "UPDATED", summary: string, actor: string) {
  if (!apply) return;
  await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId, action, actorUserId: actor, summary } });
}

// --------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------
type CreateSpec = { slug: string; kind: "SYSTEM" | "CREATURE" | "ITEM" | "CHARACTER"; title: string; summary: string; body: string; meta: unknown; status: "CANON" | "PROPOSED" };

async function create(spec: CreateSpec, actor: string) {
  const existing = await db.storyEntry.findUnique({ where: { slug: spec.slug }, select: { id: true, kind: true, body: true, title: true, summary: true, meta: true } });
  if (existing && existing.kind !== spec.kind) {
    say("skip", `${spec.kind} ${spec.slug}`, `ALREADY EXISTS as ${existing.kind} — a frozen slug is never reused`);
    return;
  }
  if (existing) {
    const same = existing.body === spec.body && existing.title === spec.title && existing.summary === spec.summary && stableJson(existing.meta) === stableJson(spec.meta);
    if (same) return say("unchanged", `${spec.kind} ${spec.slug}`);
    if (!rewrite) return say("skip", `${spec.kind} ${spec.slug}`, "exists and differs — pass --rewrite to update it");
    say("update", `${spec.kind} ${spec.slug}`, `${existing.body?.length ?? 0} -> ${spec.body.length} chars`);
    if (apply) {
      await db.storyEntry.update({
        where: { id: existing.id },
        data: { title: spec.title, summary: spec.summary, body: spec.body, meta: spec.meta as Prisma.InputJsonValue, updatedByUserId: actor, version: { increment: 1 } },
      });
      await revise(existing.id, "UPDATED", `Rewrote "${spec.title}" from the character bible`, actor);
    }
    return;
  }
  say("create", `${spec.kind} ${spec.slug}`, `${spec.title} · ${spec.status} · ${spec.body.length} chars`);
  if (!apply) return;
  const created = await db.storyEntry.create({
    data: {
      id: randomUUID(), kind: spec.kind, slug: spec.slug, title: spec.title, summary: spec.summary, body: spec.body,
      status: spec.status, meta: spec.meta as Prisma.InputJsonValue, createdByUserId: actor,
    },
  });
  await revise(created.id, "CREATED", `Wrote "${spec.title}" from the character bible`, actor);
}

// --------------------------------------------------------------------------
// APPEND
// --------------------------------------------------------------------------
async function appendLayer(slug: string, note: string, append: string, marker: string, metaPatch: Record<string, unknown> | undefined, actor: string) {
  const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, title: true, body: true, meta: true } });
  if (!entry) return say("skip", `layer ${slug}`, "no such entry");

  // Cut this layer's own previous run off before reapplying it, and never cut
  // at somebody else's marker — `reclamation` already carries a `## Designed`
  // section from the Soul Forge pass, which this must land underneath.
  let base = (entry.body ?? "").trimEnd();
  const at = base.indexOf(marker);
  if (at >= 0) base = base.slice(0, at).trimEnd();
  const body = `${base}${append}`;
  const meta = metaPatch ? { ...((entry.meta as Record<string, unknown>) ?? {}), ...metaPatch } : entry.meta;

  if (entry.body === body && stableJson(entry.meta) === stableJson(meta)) return say("unchanged", `layer ${slug}`);
  say("append", `layer ${slug}`, `${entry.body?.length ?? 0} -> ${body.length} chars — ${note}`);
  lossCheck(entry.body ?? "", body, slug);
  if (!apply) return;
  await db.storyEntry.update({ where: { id: entry.id }, data: { body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor, version: { increment: 1 } } });
  await revise(entry.id, "UPDATED", `Designed: ${note}`, actor);
}

// --------------------------------------------------------------------------
// AMEND — locked rules, exact paragraph swaps
// --------------------------------------------------------------------------
async function amendRule(slug: string, note: string, from: string, to: string, actor: string) {
  const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, body: true } });
  if (!entry?.body) return say("skip", `rule ${slug}`, "no such rule");
  if (entry.body.includes(to)) return say("unchanged", `rule ${slug}`, "amendment already applied");
  if (!entry.body.includes(from)) {
    say("skip", `rule ${slug}`, "THE PARAGRAPH TO REPLACE WAS NOT FOUND VERBATIM — refusing to guess");
    return;
  }
  const body = entry.body.replace(from, to);
  say("amend", `rule ${slug}`, `${entry.body.length} -> ${body.length} chars — ${note}`);
  lossCheck(entry.body, body, slug);
  if (!apply) return;
  await db.storyEntry.update({ where: { id: entry.id }, data: { body, updatedByUserId: actor, version: { increment: 1 } } });
  await revise(entry.id, "UPDATED", `Amended a locked rule: ${note}`, actor);
}

// --------------------------------------------------------------------------
// Meta and title fixes
// --------------------------------------------------------------------------
async function patchMeta(slug: string, patch: Record<string, unknown>, note: string, actor: string) {
  const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, meta: true } });
  if (!entry) return say("skip", `meta ${slug}`, "no such entry");
  const current = (entry.meta as Record<string, unknown>) ?? {};
  const meta = { ...current, ...patch };
  if (stableJson(current) === stableJson(meta)) return say("unchanged", `meta ${slug}`);
  say("update", `meta ${slug}`, note);
  if (!apply) return;
  await db.storyEntry.update({ where: { id: entry.id }, data: { meta: meta as Prisma.InputJsonValue, updatedByUserId: actor, version: { increment: 1 } } });
  await revise(entry.id, "UPDATED", note, actor);
}

/** Sets `magic.corruptionPhase` without disturbing the rest of the magic block. */
async function setPhase(slug: string, phase: number | null, why: string, actor: string) {
  const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, meta: true } });
  if (!entry) return say("skip", `phase ${slug}`, "no such character");
  const current = (entry.meta as Record<string, unknown>) ?? {};
  const magic = { ...((current.magic as Record<string, unknown>) ?? { origin: null, schools: [], corruptionPhase: null, notes: null }) };
  if (magic.corruptionPhase === phase) return say("unchanged", `phase ${slug}`);
  magic.corruptionPhase = phase;
  const meta = { ...current, magic };
  say("update", `phase ${slug}`, `${phase === null ? "null" : phase} — ${why}`);
  if (!apply) return;
  await db.storyEntry.update({ where: { id: entry.id }, data: { meta: meta as Prisma.InputJsonValue, updatedByUserId: actor, version: { increment: 1 } } });
  await revise(entry.id, "UPDATED", `Set corruption phase: ${why}`, actor);
}

async function retitle(slug: string, title: string, why: string, actor: string) {
  const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!entry) return say("skip", `title ${slug}`, "no such entry");
  if (entry.title === title) return say("unchanged", `title ${slug}`);
  say("update", `title ${slug}`, `"${entry.title}" -> "${title}" — ${why}`);
  if (!apply) return;
  await db.storyEntry.update({ where: { id: entry.id }, data: { title, updatedByUserId: actor, version: { increment: 1 } } });
  await revise(entry.id, "UPDATED", `Retitled: ${why}`, actor);
}

// ===========================================================================

const PORT_ARCADIA_MARKER = "\n\n### Design note — what the city does to the ledgers";
const portArcadiaNote = `

### Design note — what the city does to the ledgers

Connections only — the districts are written and their interiors are not this pass's to lay out. What the city adds to a character is three things.

**Dead zones.** Arcadia is the first place a player meets ground where instruments stop working, and the city knows exactly where those places are, which is why they are worth what they are worth. A dead zone is where [[suspicion]] stops accruing and a conversation can happen — and everybody who matters knows the same map.

**The gradient.** Suspicion is not one score across a city. It runs highest at the gates and in [[upper-westside]], and lowest where the light is poor on purpose. A character learns Arcadia by learning which streets stop being polite.

**The Forge has a landlord.** [[the-soul-forge]] here is *active*, and whoever holds it sets the access policy — open, garrison only, paid, or refused. That single field is the city's whole politics from a character's point of view: it decides who is allowed to be permanent. The seat after Tino is earned at that Core, by somebody who binds in the same scene as the party ([[companions]]).`;

const HUMANOID_RESERVED = [
  "The Benthic, for the ocean: built for pressure and cold water, amphibious, slow above the tide line — and they know what keeps pace beneath the Flee branch.",
  "The Aerials, for the floating metropolis: thin-air lungs and light bones, whose Transit Authority ticket is also a birth certificate. The Council calls them citizens; the Authority calls them freight.",
  "The Quiet, for the interior desert: a people who came out of one of the quiet places, or never left. Something in them was gifted so long ago it stopped being magic and became anatomy.",
  "A returned giver: whether a Lizzarnix can ever be a player's people is canon's to reveal. The slot is kept without a body.",
];

async function main() {
  const actor = await actorId();

  console.log("New systems — shelves the codex did not have");
  for (const system of newSystems) {
    // Write 0's split: the core lands `designed`, the rosters land `concept`.
    // The six pillar children ARE the 108-ability roster, so they are the
    // rosters, and the licensing model above them is the core.
    await create({ slug: system.slug, kind: "SYSTEM", title: system.title, summary: system.summary, body: system.body, meta: system.meta, status: "CANON" }, actor);
  }

  console.log("\nDesign layers — appended below prose the owner already wrote");
  for (const layer of layers) await appendLayer(layer.slug, layer.note, layer.append, layer.marker ?? DESIGN_MARKER, layer.meta as Record<string, unknown> | undefined, actor);

  console.log("\nLocked rules — two amendments, approved by hand");
  for (const edit of ruleEdits) await amendRule(edit.slug, edit.note, edit.from, edit.to, actor);

  console.log("\nThe species shelf");
  for (const people_ of species) {
    await create({ slug: people_.slug, kind: "CREATURE", title: people_.title, summary: people_.summary, body: people_.body, meta: people_.meta, status: "CANON" }, actor);
  }
  await patchMeta("humanoid", { openQuestions: HUMANOID_RESERVED }, "three reserved peoples and a returned giver, held as slots", actor);

  console.log("\nNamed pieces");
  for (const item of kitItems) {
    await create({ slug: item.slug, kind: "ITEM", title: item.title, summary: item.summary, body: item.body, meta: item.meta, status: "CANON" }, actor);
  }

  console.log("\nPeople — twelve teachers and four command staff, all PROPOSED");
  for (const character of people) {
    await create({ slug: character.slug, kind: "CHARACTER", title: character.title, summary: character.summary, body: character.body, meta: character.meta, status: "PROPOSED" }, actor);
  }

  console.log("\nBack-links — the world points back at what was written");
  for (const layer of backlinks) await appendLayer(layer.slug, layer.note, layer.append, layer.marker ?? DESIGN_MARKER, layer.meta as Record<string, unknown> | undefined, actor);

  console.log("\nStructure and meta");
  await retitle("character-classes", "Backgrounds", "near-future vocabulary; the slug stays frozen", actor);
  await patchMeta("professions", { parent: "character-progression" }, "re-parented under character progression, closing the tree gap", actor);
  await appendLayer("port-arcadia", "what the city does to a character's ledgers", portArcadiaNote, PORT_ARCADIA_MARKER, undefined, actor);

  console.log("\nSpecies casing — six characters filed under a slug that does not exist");
  for (const slug of ["jaro-fen", "keira-ansel", "mara-quill", "nalia-reed", "selene-ward", "tomas-vey"]) {
    await patchMeta(slug, { species: "human" }, "\"Human\" -> the slug `human`, so the sheet resolves to the shelf", actor);
  }

  console.log("\nCorruption phases — eleven at zero, two constructs left null");
  const zeros: Array<[string, string]> = [
    ["abraham-islay-kane", "a war veteran whose scars are a face, not a ladder"],
    ["amanda", "born casting never advances a phase, and canon has her hiding almost all of it"],
    ["jaro-fen", "not a caster; his own notes separate Blackbloom exposure from corruption"],
    ["keira-ansel", "not a caster, and she separates exposure from corruption in every report"],
    ["mara-quill", "not a caster — a Warden tracker"],
    ["nalia-reed", "not a caster; works by personal agreement, never by dose"],
    ["selene-ward", "not a caster; containment is her duty, not her body"],
    ["steve", "dead on the rooftops in the first six minutes, and clean"],
    ["the-kestrel-commander", "Rook never dosed, and the commander who reads faces like casualty lists having a clean one is the point of the character"],
    ["the-war-correspondent", "dies on air in minute one; clean"],
    ["tomas-vey", "burn scarring is a wound, not a tell"],
  ];
  for (const [slug, why] of zeros) await setPhase(slug, 0, why, actor);
  say("unchanged", "phase maintenance-unit-m-17", "left null — a chassis has no soul to share, and null is the honest answer");
  say("unchanged", "phase nag", "left null — a wristwatch has no body for the ladder to trade");
  say("unchanged", "phase tino", "left unset, deliberately");

  console.log("\nTidy-ups the owner ruled on");
  await retitle("hippogriff", "Hypogriff", "canon's prose already spells it this way; the slug stays frozen", actor);

  const grand = report.filter((row) => row.action !== "unchanged");
  console.log(`\n${report.filter((r) => r.action === "create").length} created, ${report.filter((r) => r.action === "append").length} appended, ${report.filter((r) => r.action === "amend").length} amended, ${report.filter((r) => r.action === "update").length} updated, ${report.filter((r) => r.action === "skip").length} skipped, ${report.filter((r) => r.action === "unchanged").length} already correct.`);
  console.log(`${notCarried} author word${notCarried === 1 ? "" : "s"} not carried over.`);
  if (!apply) console.log(`\nDry run — ${grand.length} change${grand.length === 1 ? "" : "s"} pending. Re-run with --apply to write it.`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
