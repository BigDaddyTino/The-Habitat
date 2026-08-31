import "../lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { carryServerOwnedMeta, characterMetaSchema, systemMetaSchema } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * SEQ-000 Codex handoff.
 *
 * Creates Wendy and makes the two bounded revisions authorized by Tino's
 * 2026-08-31 handoff. The script is deliberately narrower than the ordinary
 * Codex editor: it queries only three target slugs, refuses a stale source
 * fingerprint, writes a target-only preimage, and commits all changed rows and
 * their revisions in one serializable transaction.
 *
 * Preview:
 *   pnpm --filter @habitat/web exec tsx scripts/author-seq-000.ts
 *
 * Apply:
 *   pnpm --filter @habitat/web exec tsx scripts/author-seq-000.ts \
 *     --apply \
 *     --confirm=SEQ-000-LIVE \
 *     --snapshot=20260831T112820920Z-4ce7b0474f87
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const confirmation = process.argv.find((value) => value.startsWith("--confirm="))?.slice("--confirm=".length) ?? "";
const suppliedSnapshot = process.argv.find((value) => value.startsWith("--snapshot="))?.slice("--snapshot=".length) ?? "";

const CONFIRMATION = "SEQ-000-LIVE";
const SOURCE_SNAPSHOT = "20260831T112820920Z-4ce7b0474f87";
const TARGET_SLUGS = ["wendy", "steve", "enlistment"] as const;
const INTRODUCED_LINKS = [
  "attributes",
  "enlistment",
  "forward-camp-kestrel",
  "stormglass-cartel",
  "the-starting-island",
  "the-three-origins-of-magic",
  "tino",
  "wendy",
] as const;
const FORBIDDEN_ISLAND_TYPO = ["Ig", "it"].join("");
const REVISION_SUMMARIES = {
  wendyCreated: "SEQ-000: created Wendy as the proposed Stormglass enlistment clerk",
  steveUpdated: "SEQ-000: added Steve's shared enlistment and resolved his Kestrel grief question by naming Tino",
  enlistmentUpdated: "SEQ-000: proposed v2 intake and injection staging without resolving owner conflicts",
  enlistmentStatus: "SEQ-000: moved Enlistment from canon v1 to proposed v2 for owner review",
} as const;

const EXPECTED_BASE = {
  steve: {
    kind: "CHARACTER",
    status: "CANON",
    version: 9,
    fingerprint: "7da77a508d534498ef9bb7926bfda2c2e5beb129119191ecab8ebad20b62f2e2",
  },
  enlistment: {
    kind: "SYSTEM",
    status: "CANON",
    version: 1,
    fingerprint: "4026f22068cb5f57365502a6f241e82a252caa283eee3879c5d2f4606b2404f9",
  },
} as const;

const OLD_STEVE_QUESTION = "Whether anyone at Kestrel knew him — one line of grief from a named NPC would land hard, and cheap.";
const OLD_ENLISTMENT_QUESTIONS = [
  "Does the clerk have a name, and does she survive the Strike?",
  "Can a player ever see their own service file, or only hear it read to them?",
] as const;
const OLD_ENLISTMENT_STAGE = "Before the first minute — the desk on Ignit Island";

const STEVE_MARKER = "\n\n## SEQ-000 — the same desk";
const STEVE_ADDITION = `${STEVE_MARKER}

Before the rooftops, Steve enlisted through [[wendy]]'s [[enlistment]] desk and shipped to [[the-starting-island]] alongside the player.

At [[forward-camp-kestrel]], [[tino]] is the one who grieves him.`;

const ENLISTMENT_MARKER = "\n\n---\n\n## Proposed v2 — SEQ-000 staging";
const ENLISTMENT_ADDITION = `${ENLISTMENT_MARKER}

This section is proposed. The v1 design above is retained verbatim as the prior canonical baseline; this row is now proposed v2 while its conflicts await owner rulings.

**Intake before the form.** Before [[wendy]] opens the service file, the recruit passes through an intake step for grooming, uniform issue, and the place where appearance is set. That sentence does not decide whether an intake pod exists, where any intake equipment is sited, or whether appearance is handled with sliders. Those are owner decisions.

**The desk.** Wendy is the [[stormglass-cartel]] clerk already described above. She asks the same four questions already on the form. She does not replace the later Kestrel question, and this proposal does not move the desk to Kestrel. V1's unlock-stage metadata says, "Before the first minute — the desk on Ignit Island," while the proposed sequence requires Wendy's desk before the recruit reaches the island and the body never chooses mainland, ship, or Blackreef. This proposal preserves that metadata and exposes the conflict; it does not settle the desk's site.

**The handoff.** At the end of the form, an injection puts the recruit under. The sequence hands to the opening cinematic, "It Just Kept Going"; that cinematic ends in first person, and gameplay takes control mid-gauntlet. The cinematic does not yet have a Codex slug, so this text does not invent one.

**The conflict stays open.** V1 says: "Never write a creation moment that hands the player a slider, and never let a character state a number about themselves out loud." The proposed intake needs a place for appearance to be set, but it does not overrule that law. Slider or no slider remains Tino's decision.

V1 also says: "this design adds no numbers anywhere. So the interface is a set of objects and people in the world, and this is the complete list of them. If a system needs a readout that is not on this list, the system is wrong." Nothing in this proposal adds a numeric readout or changes how [[attributes]] are reported. Whether anything numeric appears remains Tino's decision.`;

const WENDY_BODY = `Wendy is the woman behind the desk in [[enlistment]]: the [[stormglass-cartel]] clerk who processes the recruit before they ever reach [[the-starting-island]]. The desk's exact location is not settled. She has done this hundreds of times this month, the Cartel is losing an island, and the queue behind the recruit is always present in the scene even when nobody in it speaks.

She asks the four questions already defined by the system, in order: "People?"; "Previous service?"; "Any of it yours?"; and, where the answer calls for it, "Certified in what?" The third question points to [[the-three-origins-of-magic]]: nothing is a valid non-magical answer, not a fourth origin.

Her proposed background is Materiel. She runs a desk and a ledger, hands out doses, and does not take them. Nothing here settles her age, home, appearance, pronouns, technical model, game identifier, or life outside the queue.

## Voice

Economy first. Short declaratives. She never asks for something already visible on the form and never explains the world to an audience. Contempt is her default register, but it is throughput rather than cruelty: she cannot afford to be picky and the line cannot stop. Profanity is situational and sparing.

WENDY: "People?"

The answer lands. Her pen moves.

WENDY: "Previous service?"

Somebody behind the recruit shifts their weight. Wendy does not look past you. She does not need to.

WENDY: "Any of it yours?"

If the answer calls for the fourth question: "Certified in what?"

If the recruit answers all four without making her repeat herself, she looks up once.

WENDY: "Good. You listen."

That is the one surprise. Then her eyes return to the ledger.

WENDY: "Next."`;

const WENDY_META = characterMetaSchema.parse({
  age: null,
  sex: "female",
  home: null,
  magic: {
    notes: "She hands out Cartel doses during enlistment; she does not take them.",
    origin: "none",
    schools: [],
    corruptionPhase: 0,
  },
  model: null,
  voice: "Economical short declaratives. Contempt is her throughput register, not cruelty. She never asks what the form already tells her, never explains the world to the audience, watches the queue constantly, and uses profanity only when the situation earns it. Exactly one earned beat softens: ‘Good. You listen.’",
  gameId: null,
  skills: [],
  status: {
    known: "Alive and working the Stormglass enlistment desk during SEQ-000.",
    actual: null,
  },
  aliases: [],
  species: "human",
  factions: [{ role: "Enlistment clerk", faction: "stormglass-cartel", standing: "enlisted staff" }],
  fullName: "Wendy",
  pronouns: null,
  companion: { status: null, capable: false, availability: null },
  storyRole: "The named Stormglass clerk behind the four enlistment questions in SEQ-000; she turns character creation into pressure from a person, a form, and a queue.",
  appearance: null,
  background: "Materiel",
  cybernetics: [],
  involvement: [],
  professions: ["Enlistment clerk"],
  openQuestions: [
    "Does Wendy survive the Strike?",
    "The intake pod — is it canon, and where is it sited?",
    "The Brains Test — cut it, or keep it as flavour with no mechanical effect?",
    "Wendy's age, home, appearance, pronouns, game ID, model, skills, cybernetics, relationships, companion availability/status, and actual status: TBD — ask Tino.",
    "The exact Story Codex arc or node reference for SEQ-000: TBD — ask Tino.",
  ],
  relationships: [],
});

const WENDY_SPEC = {
  kind: "CHARACTER" as const,
  slug: "wendy",
  title: "Wendy",
  summary: "The Stormglass enlistment clerk who asks the four questions, keeps the queue moving, and closes SEQ-000 with the recruit's service file complete.",
  body: WENDY_BODY,
  meta: WENDY_META,
  status: "PROPOSED" as const,
};

type Client = ReturnType<typeof getPrismaClient> | Prisma.TransactionClient;
type EntryRow = Awaited<ReturnType<typeof loadTargets>>[number];
type DesiredEntry = {
  kind: "CHARACTER" | "SYSTEM";
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  meta: unknown;
  status: "PROPOSED" | "CANON";
};
type PlannedChange = {
  action: "create" | "update" | "unchanged";
  slug: (typeof TARGET_SLUGS)[number];
  current: EntryRow | null;
  desired: DesiredEntry;
  expectedVersion: number;
};

const targetSelect = {
  id: true,
  kind: true,
  slug: true,
  title: true,
  summary: true,
  body: true,
  meta: true,
  status: true,
  version: true,
  createdByUserId: true,
  updatedByUserId: true,
  lockedByUserId: true,
  lockExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function loadTargets(client: Client) {
  return client.storyEntry.findMany({
    where: { slug: { in: [...TARGET_SLUGS] } },
    select: targetSelect,
    orderBy: { slug: "asc" },
  });
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function semanticFingerprint(row: Pick<EntryRow, "kind" | "slug" | "title" | "summary" | "body" | "meta" | "status">) {
  return hash(stableJson({
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    meta: row.meta,
    status: row.status,
  }));
}

function entrySnapshot(row: Pick<EntryRow, "kind" | "slug" | "title" | "summary" | "body" | "meta" | "status" | "version">) {
  return {
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    meta: row.meta,
    status: row.status,
    version: row.version,
  };
}

function validateContent(spec: DesiredEntry) {
  if (spec.title.trim().length === 0 || spec.title.length > 120) throw new Error(`${spec.slug}: title violates the Codex limit.`);
  if (spec.summary && spec.summary.length > 500) throw new Error(`${spec.slug}: summary violates the Codex limit.`);
  if (spec.body.length === 0 || spec.body.length > 20_000) throw new Error(`${spec.slug}: body violates the Codex limit.`);
  for (const value of [spec.title, spec.summary ?? "", spec.body, stableJson(spec.meta)]) {
    if (value.includes(FORBIDDEN_ISLAND_TYPO)) throw new Error(`${spec.slug}: rejected the closed pre-rename island typo.`);
  }
  if (spec.kind === "CHARACTER") characterMetaSchema.parse(spec.meta);
  else systemMetaSchema.parse(spec.meta);
}

function restoreSteveBase(current: EntryRow) {
  const markerAt = current.body?.indexOf(STEVE_MARKER) ?? -1;
  if (markerAt < 0) return current;
  if (!current.body?.endsWith(STEVE_ADDITION)) throw new Error("steve: the SEQ-000 marker exists but its owned block differs; refusing to guess.");
  const meta = characterMetaSchema.parse(current.meta);
  return {
    ...current,
    body: current.body.slice(0, markerAt),
    meta: carryServerOwnedMeta(current.meta, { ...meta, openQuestions: [OLD_STEVE_QUESTION] }),
    status: EXPECTED_BASE.steve.status,
  };
}

function restoreEnlistmentBase(current: EntryRow) {
  const markerAt = current.body?.indexOf(ENLISTMENT_MARKER) ?? -1;
  if (markerAt < 0) return current;
  if (!current.body?.endsWith(ENLISTMENT_ADDITION)) throw new Error("enlistment: the SEQ-000 marker exists but its owned block differs; refusing to guess.");
  const meta = systemMetaSchema.parse(current.meta);
  return {
    ...current,
    body: current.body.slice(0, markerAt),
    meta: carryServerOwnedMeta(current.meta, {
      ...meta,
      unlockStage: OLD_ENLISTMENT_STAGE,
      openQuestions: [...OLD_ENLISTMENT_QUESTIONS],
    }),
    status: EXPECTED_BASE.enlistment.status,
  };
}

function desiredSteve(base: EntryRow): DesiredEntry {
  const meta = characterMetaSchema.parse(base.meta);
  if (stableJson(meta.openQuestions) !== stableJson([OLD_STEVE_QUESTION])) {
    throw new Error("steve: the source open question no longer matches the handoff baseline.");
  }
  return {
    kind: "CHARACTER",
    slug: "steve",
    title: base.title,
    summary: base.summary,
    body: `${base.body ?? ""}${STEVE_ADDITION}`,
    meta: carryServerOwnedMeta(base.meta, {
      ...meta,
      openQuestions: [
        "Steve's burn scar — real, or dropped?",
        "Is the blue spiral sigil canon? It appears in the CIN-001 Reference Element Bible but nowhere in the Codex.",
      ],
    }),
    status: "CANON",
  };
}

function desiredEnlistment(base: EntryRow): DesiredEntry {
  const meta = systemMetaSchema.parse(base.meta);
  if (stableJson(meta.openQuestions) !== stableJson([...OLD_ENLISTMENT_QUESTIONS])) {
    throw new Error("enlistment: the source open questions no longer match the handoff baseline.");
  }
  if (meta.unlockStage !== OLD_ENLISTMENT_STAGE) throw new Error("enlistment: the source unlock stage no longer matches the handoff baseline.");
  return {
    kind: "SYSTEM",
    slug: "enlistment",
    title: base.title,
    summary: base.summary,
    body: `${base.body ?? ""}${ENLISTMENT_ADDITION}`,
    meta: carryServerOwnedMeta(base.meta, {
      ...meta,
      openQuestions: [
        "Can a player ever see their own service file, or only hear it read to them?",
        "Sliders — overrule v1's ban, or keep appearance diegetic with no sliders?",
        "Numbers — does anything numeric appear, or does the sheet stay entirely on \"the record\"?",
        "Where is the enlistment desk? V1's unlock-stage metadata says \"the desk on Ignit Island,\" while the proposed sequence places Wendy before the recruit reaches the island and the body never chooses a site. Mainland, a ship, or Blackreef?",
      ],
    }),
    status: "PROPOSED",
  };
}

function sameDesired(current: EntryRow, desired: DesiredEntry) {
  return current.kind === desired.kind &&
    current.slug === desired.slug &&
    current.title === desired.title &&
    current.summary === desired.summary &&
    current.body === desired.body &&
    stableJson(current.meta) === stableJson(desired.meta) &&
    current.status === desired.status;
}

function buildPlan(rows: EntryRow[], actorId: string): PlannedChange[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const now = new Date();
  for (const row of rows) {
    if (row.lockedByUserId && row.lockExpiresAt && row.lockExpiresAt > now && row.lockedByUserId !== actorId) {
      throw new Error(`${row.slug}: an active courtesy lock belongs to another writer.`);
    }
  }

  const wendy = bySlug.get("wendy") ?? null;
  const wendyDesired: DesiredEntry = WENDY_SPEC;
  validateContent(wendyDesired);
  let wendyAction: PlannedChange["action"] = "create";
  if (wendy) {
    if (wendy.kind !== "CHARACTER" || wendy.version !== 1 || !sameDesired(wendy, wendyDesired)) {
      throw new Error("wendy: the slug now exists with content outside this handoff; refusing to overwrite or adopt it.");
    }
    wendyAction = "unchanged";
  }

  const steve = bySlug.get("steve");
  if (!steve || steve.kind !== "CHARACTER") throw new Error("steve: required CHARACTER entry is missing or has the wrong kind.");
  const steveBase = restoreSteveBase(steve);
  if (semanticFingerprint(steveBase) !== EXPECTED_BASE.steve.fingerprint) throw new Error("steve: live source no longer matches the named snapshot fingerprint.");
  const steveDesired = desiredSteve(steveBase);
  validateContent(steveDesired);
  const steveAction = sameDesired(steve, steveDesired) ? "unchanged" : "update";
  if (steveAction === "unchanged" && steve.version !== EXPECTED_BASE.steve.version + 1) throw new Error("steve: desired content has an unexpected version.");
  if (steveAction === "update" && steve.version !== EXPECTED_BASE.steve.version) throw new Error("steve: stale or unexpected source version.");

  const enlistment = bySlug.get("enlistment");
  if (!enlistment || enlistment.kind !== "SYSTEM") throw new Error("enlistment: required SYSTEM entry is missing or has the wrong kind.");
  const enlistmentBase = restoreEnlistmentBase(enlistment);
  if (semanticFingerprint(enlistmentBase) !== EXPECTED_BASE.enlistment.fingerprint) throw new Error("enlistment: live source no longer matches the named snapshot fingerprint.");
  const enlistmentDesired = desiredEnlistment(enlistmentBase);
  validateContent(enlistmentDesired);
  const enlistmentAction = sameDesired(enlistment, enlistmentDesired) ? "unchanged" : "update";
  if (enlistmentAction === "unchanged" && enlistment.version !== EXPECTED_BASE.enlistment.version + 1) throw new Error("enlistment: desired content has an unexpected version.");
  if (enlistmentAction === "update" && enlistment.version !== EXPECTED_BASE.enlistment.version) throw new Error("enlistment: stale or unexpected source version.");

  return [
    { action: wendyAction, slug: "wendy", current: wendy, desired: wendyDesired, expectedVersion: 1 },
    { action: steveAction, slug: "steve", current: steve, desired: steveDesired, expectedVersion: EXPECTED_BASE.steve.version + 1 },
    { action: enlistmentAction, slug: "enlistment", current: enlistment, desired: enlistmentDesired, expectedVersion: EXPECTED_BASE.enlistment.version + 1 },
  ];
}

function wikiLinks(value: string) {
  const tokens = [...value.matchAll(/\[\[(.*?)\]\]/g)];
  const openings = value.match(/\[\[/g)?.length ?? 0;
  const closings = value.match(/\]\]/g)?.length ?? 0;
  if (tokens.length !== openings || tokens.length !== closings) throw new Error("Malformed [[link]] syntax in SEQ-000 authored text.");
  return tokens.map((match) => {
    const slug = match[1];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Malformed Codex link target: ${slug}`);
    return slug;
  });
}

async function assertIntroducedLinks(client: Client) {
  const introduced = [...new Set([
    ...wikiLinks(WENDY_BODY),
    ...wikiLinks(STEVE_ADDITION),
    ...wikiLinks(ENLISTMENT_ADDITION),
  ])].sort();
  const authorized = [...INTRODUCED_LINKS].sort();
  if (stableJson(introduced) !== stableJson(authorized)) {
    throw new Error("The handoff's introduced [[links]] escaped its closed allow-list.");
  }
  const wanted = authorized.filter((slug) => slug !== "wendy");
  const found = await client.storyEntry.findMany({ where: { slug: { in: wanted } }, select: { slug: true } });
  const existing = new Set(found.map((row) => row.slug));
  const missing = wanted.filter((slug) => !existing.has(slug));
  if (missing.length) throw new Error(`Refusing unresolved [[links]]: ${missing.join(", ")}`);
}

async function activeTino(client: Client) {
  const actors = await client.user.findMany({
    where: { isActive: true, role: "ADMIN", OR: [{ username: "tino" }, { displayName: "Tino" }, { name: "Tino" }] },
    select: { id: true, username: true },
    take: 2,
  });
  if (actors.length !== 1) throw new Error(`Expected exactly one active ADMIN Tino author; found ${actors.length}.`);
  return actors[0];
}

function assertLiveTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is missing.");
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  if (!new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(host)) throw new Error("SEQ-000 authoring requires the loopback live database target.");
  if (url.pathname.replace(/^\//, "") !== "habitat") throw new Error("SEQ-000 authoring requires the live habitat database, not a development clone.");
  if (process.env.HABITAT_ENVIRONMENT === "development") throw new Error("SEQ-000 authoring refuses the Atlas development environment.");
}

async function writeTargetPreimage(rows: EntryRow[]) {
  const root = process.env.HABITAT_BACKUP_PATH?.trim();
  if (!root || !path.isAbsolute(root)) throw new Error("Apply requires an absolute HABITAT_BACKUP_PATH for the target-only preimage.");
  const directory = path.join(root, "codex-preimages");
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetRows = rows.filter((row) => TARGET_SLUGS.includes(row.slug as (typeof TARGET_SLUGS)[number]));
  const ids = targetRows.map((row) => row.id);
  const revisions = ids.length
    ? await db.storyRevision.findMany({ where: { entityType: "ENTRY", entityId: { in: ids } }, orderBy: { createdAt: "asc" } })
    : [];
  const payload = {
    format: "habitat-seq-000-target-preimage-v1",
    createdAt: new Date().toISOString(),
    sourceSnapshot: SOURCE_SNAPSHOT,
    targetSlugs: [...TARGET_SLUGS],
    missingAtCapture: TARGET_SLUGS.filter((slug) => !targetRows.some((row) => row.slug === slug)),
    entries: targetRows,
    revisions,
  };
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  const file = path.join(directory, `seq-000-${stamp}.json`);
  await writeFile(file, serialized, { encoding: "utf8", flag: "wx" });
  const readBack = await readFile(file, "utf8");
  if (readBack !== serialized) throw new Error("Target preimage byte verification failed.");
  const verified = JSON.parse(readBack) as typeof payload;
  if (stableJson(verified.targetSlugs) !== stableJson([...TARGET_SLUGS])) throw new Error("Target preimage verification failed.");
  if (verified.entries.some((row) => !TARGET_SLUGS.includes(row.slug as (typeof TARGET_SLUGS)[number]))) throw new Error("Target preimage escaped its three-slug allow-list.");
  return { file, bytes: Buffer.byteLength(readBack), sha256: hash(readBack) };
}

async function revision(client: Prisma.TransactionClient, row: EntryRow, action: "CREATED" | "UPDATED" | "STATUS_CHANGED", actorUserId: string, summary: string, before: unknown, after: unknown) {
  await client.storyRevision.create({
    data: {
      id: randomUUID(),
      entityType: "ENTRY",
      entityId: row.id,
      action,
      actorUserId,
      summary,
      before: before as Prisma.InputJsonValue,
      after: after as Prisma.InputJsonValue,
    },
  });
}

function jsonRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function assertHandoffRevisions(client: Client, rows: EntryRow[], actorUserId: string) {
  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const expected = [
    { slug: "wendy", action: "CREATED", summary: REVISION_SUMMARIES.wendyCreated, version: 1, status: "PROPOSED" },
    { slug: "steve", action: "UPDATED", summary: REVISION_SUMMARIES.steveUpdated, version: 10, status: "CANON" },
    { slug: "enlistment", action: "UPDATED", summary: REVISION_SUMMARIES.enlistmentUpdated, version: 2, status: "PROPOSED" },
    { slug: "enlistment", action: "STATUS_CHANGED", summary: REVISION_SUMMARIES.enlistmentStatus, version: 2, status: "PROPOSED" },
  ] as const;
  if (expected.some((item) => !idBySlug.has(item.slug))) throw new Error("SEQ-000 revision verification is missing a target row.");
  const revisions = await client.storyRevision.findMany({
    where: {
      entityType: "ENTRY",
      entityId: { in: [...idBySlug.values()] },
      actorUserId,
      summary: { in: expected.map((item) => item.summary) },
    },
    select: { entityId: true, action: true, summary: true, after: true },
  });
  for (const item of expected) {
    const match = revisions.find((row) => row.entityId === idBySlug.get(item.slug) && row.action === item.action && row.summary === item.summary);
    const after = jsonRecord(match?.after);
    if (!match || after.version !== item.version || after.status !== item.status) {
      throw new Error(`${item.slug}: missing or invalid ${item.action} audit revision for SEQ-000.`);
    }
  }
}

async function applyPlan(actorId: string) {
  return db.$transaction(async (tx) => {
    const currentRows = await loadTargets(tx);
    const plan = buildPlan(currentRows, actorId);
    await assertIntroducedLinks(tx);

    for (const item of plan) {
      if (item.action === "unchanged") continue;
      if (item.action === "create") {
        const created = await tx.storyEntry.create({
          data: {
            id: randomUUID(),
            kind: item.desired.kind,
            slug: item.desired.slug,
            title: item.desired.title,
            summary: item.desired.summary,
            body: item.desired.body,
            meta: item.desired.meta as Prisma.InputJsonValue,
            status: item.desired.status,
            createdByUserId: actorId,
          },
          select: targetSelect,
        });
        await revision(tx, created, "CREATED", actorId, REVISION_SUMMARIES.wendyCreated, {}, entrySnapshot(created));
        continue;
      }

      if (!item.current) throw new Error(`${item.slug}: update lost its preimage.`);
      const before = entrySnapshot(item.current);
      const changed = await tx.storyEntry.updateMany({
        where: { id: item.current.id, version: item.current.version },
        data: {
          title: item.desired.title,
          summary: item.desired.summary,
          body: item.desired.body,
          meta: item.desired.meta as Prisma.InputJsonValue,
          status: item.desired.status,
          updatedByUserId: actorId,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) throw new Error(`${item.slug}: optimistic version guard failed; the transaction was rolled back.`);
      const updated = await tx.storyEntry.findUniqueOrThrow({ where: { id: item.current.id }, select: targetSelect });
      const summary = item.slug === "steve"
        ? REVISION_SUMMARIES.steveUpdated
        : REVISION_SUMMARIES.enlistmentUpdated;
      await revision(tx, updated, "UPDATED", actorId, summary, before, entrySnapshot(updated));
      if (item.slug === "enlistment" && before.status !== updated.status) {
        await revision(
          tx,
          updated,
          "STATUS_CHANGED",
          actorId,
          REVISION_SUMMARIES.enlistmentStatus,
          { status: before.status, version: before.version },
          { status: updated.status, version: updated.version },
        );
      }
    }

    const authoredRows = await loadTargets(tx);
    await assertHandoffRevisions(tx, authoredRows, actorId);
    return plan;
  }, { isolationLevel: "Serializable", timeout: 30_000 });
}

function report(plan: PlannedChange[], label: string) {
  console.log(`\n${label}`);
  for (const item of plan) {
    const mark = item.action === "create" ? "+" : item.action === "update" ? "~" : "=";
    const version = item.action === "unchanged" ? item.current?.version ?? 1 : item.expectedVersion;
    console.log(`  ${mark} ${item.slug} — ${item.action} — ${item.desired.status} v${version}`);
  }
  const changed = plan.filter((item) => item.action !== "unchanged").length;
  console.log(`${changed} change${changed === 1 ? "" : "s"}; ${plan.length - changed} already exact.`);
}

async function main() {
  assertLiveTarget();
  if (apply && confirmation !== CONFIRMATION) throw new Error(`Apply requires --confirm=${CONFIRMATION}.`);
  if (apply && suppliedSnapshot !== SOURCE_SNAPSHOT) throw new Error(`Apply requires --snapshot=${SOURCE_SNAPSHOT}.`);

  const actor = await activeTino(db);
  const rows = await loadTargets(db);
  const plan = buildPlan(rows, actor.id);
  await assertIntroducedLinks(db);
  report(plan, `SEQ-000 ${apply ? "apply preflight" : "preview"} · source ${SOURCE_SNAPSHOT} · author ${actor.username}`);

  const changed = plan.filter((item) => item.action !== "unchanged");
  if (!apply) {
    console.log("Dry run only. No rows or files were written.");
    return;
  }
  if (changed.length === 0) {
    await assertHandoffRevisions(db, rows, actor.id);
    console.log("Already applied. No backup or database write was needed.");
    return;
  }

  const backup = await writeTargetPreimage(rows);
  console.log(`Target-only preimage: ${backup.file} · ${backup.bytes} bytes · sha256 ${backup.sha256}`);
  await applyPlan(actor.id);

  const afterRows = await loadTargets(db);
  const afterPlan = buildPlan(afterRows, actor.id);
  await assertIntroducedLinks(db);
  await assertHandoffRevisions(db, afterRows, actor.id);
  if (afterPlan.some((item) => item.action !== "unchanged")) throw new Error("Post-commit verification found a non-idempotent target state.");
  report(afterPlan, "SEQ-000 post-commit verification");
}

main().then(
  () => db.$disconnect(),
  (error) => {
    console.error(error);
    return db.$disconnect().then(() => process.exit(1));
  },
);
