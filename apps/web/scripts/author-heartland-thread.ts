import "../lib/environment";
import { createHash } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { threadMetaSchema } from "../lib/story-meta-schemas";

/**
 * Quick wins from the Riverlands gap audit of 2026-09-01.
 *
 * 1. THE FUSE AT HEARTLAND — the campaign-arc design Tino ruled on lives only
 *    in the plan artifact; the codex's own pattern for settled-but-unwritten
 *    story is a THREAD carrying canon packets (the-empty-cribs precedent).
 *    This files the design where canon lives. The arc itself stays unwritten
 *    until the Peninsula is done — that gate is the owner's, and the thread
 *    says so in its own body.
 *
 * 2. veil-anchors still asks "Which mainland region hides the first Tier I
 *    Anchor the party can reach — and which power got there first?" The
 *    Outfall answered both. The dossier gains an APPENDED paragraph (no owner
 *    words touched) and the answered question comes off its open list.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-heartland-thread.ts [--apply]
 */

const db = getPrismaClient();

/** Packet ids are derived so re-runs reconcile instead of duplicating. */
function stableUuid(key: string) {
  const source = createHash("sha256").update(`martino:heartland-fuse:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "4";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const PUSHED_AT = "2026-09-01";

/** Postgres jsonb does not preserve key order; compare with sorted keys. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const packetSpecs = [
  {
    key: "the-statue",
    title: "Owner ruling — the Statue: how the Commander dies",
    targetKind: "campaign" as const,
    targetRegion: null,
    entries: ["heartland"],
    body: `Commander Alder Wade dies at the unveiling of his own pact-anniversary statue. Owner ruling, 2026-09-01.

The five gate factions jointly commissioned the statue for the Standstill's anniversary, splitting the cost five ways — and each quietly shaved its share. The bargain-bid crane sling snaps at the unveiling, and Old Wade is killed by his own monument in front of the whole city.

The design law of the death, and it is absolute: **it was an accident.** No faction did it. Nobody did it. It is comedic, strange, and makes no sense as a murder precisely because it is not one — but every rope, scale, and invoice in Heartland belongs to one of the five factions, so every clue points somewhere. Five shaved invoices, five plausible sabotages, zero murderers. The pact's cheapness kills the peace.

And he does not come back. The city's own Forge holds his Echo and will not build him, because he told it not to years ago — the refusal is its own ruling below, and no staging of the death may quietly assume a reconstruction that never comes.

Write the death as the fuse finding its spark: the city has been counting down for a generation, and the one event that finally lights it is the one event nobody chose. Do not seed a real culprit, do not leave a deliberate loose end that implies one, and do not let any later writer "solve" it into an assassination — the accident IS the answer, and the investigation's clue trail is literally the paperwork of the pact being cheap.`,
  },
  {
    key: "the-refusal",
    title: "Owner ruling — the DNR: why the Forge does not bring the Commander back",
    targetKind: "campaign" as const,
    targetRegion: null,
    entries: ["alder-wade", "brother-aster", "heartland", "the-soul-forge", "reclamation", "true-death"],
    body: `Somebody asks it out loud, and the answer is a document. Owner ruling, 2026-09-02.

[[heartland]] keeps a public [[the-soul-forge]], the Commander was bound to it, and the city has spent a generation being told that death here is a line item between dredging and lamp oil. So the question comes fast, and from somebody ordinary — a Watch corporal, a wharf clerk, a child on the quay — and the arc must let it be asked plainly and early, on the page: *why hasn't the Forge brought him back?*

**Because he told it not to.** Alder Wade filed a **do-not-reconstruct** at the Heartland Forge years before the statue was ever commissioned — in person, in his own hand, witnessed by [[brother-aster]] — and pulled his own rebuild schematic out of the Core himself. The machine still holds his Echo and has nothing to build it to. It will say so, completely and only about itself, to anybody who asks, forever ([[reclamation]]). He had been coming back a long time. He had had enough of life, and he wrote that down, and nobody read it until it was already the answer to something else.

**Design laws, absolute:**

- **It is not foreknowledge.** The file is old and its date is nothing — an ordinary morning years back. It predates the statue, the commission and the anniversary, and no later writer may turn it into a man who saw it coming. It is a sixth false lead in an arc built out of false leads, and the cruelest one, because it is the only one that points at the victim.
- **It is not a clue.** It solves nothing, implicates nobody, and cannot be made to. The accident stays an accident.
- **Nobody overturns it.** Not the Judge, not the five factions with the whole reserve of the Riverlands between them, not the player at the height of their authority. There is no scene in which that works, and a faction that tries anyway has told the audience exactly what it is.
- **The city takes it as a betrayal, and it is not one.** That is the beat. Heartland believed the Standstill was Wade; Wade had quietly decided he was a man and not a monument. The letter asking the factions not to build the statue sits in the same folder — the clerk files by name, not by date — and the two documents together are the arc's whole grief in two pieces of paper.

**Placement.** The answer belongs at the Forge stop of the investigation tour, with Aster, where the lesson is already "the Forge is the settlement" — the player learns what a settlement is by learning what its Forge will not do. Anywhere earlier is fine for the *question*; the document is Aster's to produce.`,
  },
  {
    key: "the-tour",
    title: "Owner ruling — the detective appointment, and the tour as tutorial",
    targetKind: "campaign" as const,
    targetRegion: null,
    entries: ["heartland", "clearinghouse", "outpost-and-city-management", "the-soul-forge"],
    body: `The Judge appoints the player detective, and the investigation IS the management tutorial. Owner ruling, 2026-09-01.

The player is the one person in Heartland with no wharf and no flag, which is the Judge's whole reasoning and should be said on the page. The murder tour walks every faction and every management verb, one stop at a time — buying a storefront is not a side activity, it is how evidence gets obtained:

- **The freight wharf (Aegis)** — trade and economy; the player buys their first storefront to open its books.
- **The lift-yard (Holdfasts)** — defenses: walls, emplacements, chokepoints.
- **The night quay (Bone Market)** — the gray economy: tariffs, smuggling, what untaxed trade costs a crown.
- **The caravanserai (Nomads)** — diplomacy and supply lines: contracts, blocs, the Free Peoples angle.
- **The survey office (Meridian)** — intel and assay: reading the power balance before bending it.
- **The muster hall (the Watch)** — raising armies: units, wages, patrol routes.
- **The Forge (Brother Aster)** — what a settlement IS: "the Forge is the settlement", taught by a man who lives in one.

Each stop teaches exactly one verb and implicates exactly one faction, so learning the systems and reading the suspects are the same act. The stops are design anchors, not final level design — the verb-per-stop law is the ruling; the furniture may move.`,
  },
  {
    key: "the-ruling",
    title: "Owner ruling — the courthouse ruling, and the choice that ends the Standstill",
    targetKind: "campaign" as const,
    targetRegion: null,
    entries: ["heartland", "kingdom-management", "faction-membership", "the-power-balance"],
    body: `The arc ends at the courthouse, where the player passes ruling on the Commander's death — and the ruling is the first act of rulership. Owner ruling, 2026-09-01.

The truth — *it was an accident* — is the one verdict nobody in the city will believe. A faction verdict is a lie that starts the war on the player's terms. Deciding what the truth is for is the design's whole thesis, and both roads must be real: the honest ruling and the useful lie each light the fuse, differently.

Then the choice: **join one of the five factions, or start your own — with the Heartland Watch as your first units.** Either way the Standstill is over and the player did it. [[faction-membership]] and [[the-power-balance]] go live off this beat, and this arc is the answer to [[kingdom-management]]'s open question — it is the arc that grants the charter. Update that sheet's unlockArc, and retire its "which arc grants the charter" question, WHEN THE ARC EXISTS — not before.

Gating, owner's ruling: the campaign quest that brings the player to Heartland is not pushed yet, because the Peninsula is still being written. The fuse is built and waiting; nothing lights it until the road from the Peninsula reaches the city.`,
  },
  {
    key: "the-charters-ladder",
    title: "Owner ruling — the Three Charters unlock as the building ladder",
    targetKind: "region" as const,
    targetRegion: "riverlands",
    entries: ["first-charter", "second-charter", "third-charter", "outpost-and-city-management", "the-waterworks"],
    body: `The three escrowed charters are the only ground in the Riverlands a player can buy and build on, and they unlock in campaign order as the building ladder. Owner ruling, 2026-09-01.

- **[[first-charter]]** — the bankside floodplain plot: the custom-building tutorial. Draining the parcel before building is the first lever of [[the-waterworks]] a landholder ever pulls.
- **[[second-charter]]** — the confluence island with wharf rights: economy at scale — docks, storefronts, income — and a sixth wharf in a five-wharf city, which the Standstill's arithmetic will notice.
- **[[third-charter]]** — the ruined watch-fort on Riftgate: defense and garrison, [[outpost-and-city-management]] in full, with the Bone Market as the politest possible pressure. The fort's old name is deliberately unrecorded; the player names it.

The Judge's office holds the deeds and has never released one. Each release is a campaign beat, not a purchase menu — whoever finally changes that has done something the Standstill's whole generation never managed, and the factions should react like it.`,
  },
];

const threadBody = `Heartland is a lit fuse, and the player is the spark. This thread holds the campaign-arc design the owner ruled on 2026-09-01 — recorded here so canon knows its own shape while the arc waits; the full working plan lives in the region plan, and the rulings travel as this thread's canon packets.

**The shape of the arc.** The mainline brings the player into a city that feels like it is about to explode: neutral for a generation under the Standstill, five factions holding five gate-legs, everyone polite, everyone counting exits. Then Commander Alder Wade dies — comedically, strangely, and by genuine accident — under his own pact-anniversary statue, and does not come back — he pulled his own schematic from the city's Forge years ago and told nobody — and the Judge names the newcomer with no wharf and no flag as detective. The investigation tours every faction and teaches every management verb on the way (one stop, one verb, one suspect), and it ends back at the courthouse with the player passing ruling: the unbelievable truth, or a useful lie. Then the choice that ends the Standstill — join a gate faction, or found something new with the Heartland Watch as first units.

**What this arc is for.** It is the front door of holding ground: [[outpost-and-city-management]] taught in the streets, [[faction-membership]] and [[the-power-balance]] going live at the ruling, and [[kingdom-management]]'s charter granted here — this is the arc that sheet's open question is waiting to link. It is also the region's tutorial in the [[the-waterworks]]' vocabulary: storefronts, defenses, armies, and the three escrowed charters unlocking as the building ladder.

**Gating.** Owner's ruling: not pushed yet. The Peninsula is still being written, and the road that delivers the player to Heartland comes from there. The fuse waits.

**Discipline for writers touching Heartland meanwhile.** Wade is alive in every dossier; the statue is being commissioned, not fallen. Do not spend the fuse early, do not stage the death, and do not write the Standstill breaking — all of that belongs to this arc alone. And the accident stays an accident: no secret culprit, ever. Wade's refusal is filed, old, and his own business — he is alive, the paperwork is years cold, and nobody in the city knows it exists. Write it as paperwork, never as a premonition.`;

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true, displayName: true, username: true } });
  const pushedBy = actor.displayName ?? actor.username ?? "owner";
  const plan: string[] = [];

  // ── 1. The Fuse at Heartland (THREAD) ─────────────────────────────────────
  const packets = packetSpecs.map((spec) => ({
    id: stableUuid(spec.key),
    title: spec.title,
    body: spec.body,
    targetKind: spec.targetKind,
    targetRegion: spec.targetRegion,
    targetCompanion: null,
    targetFaction: null,
    entries: spec.entries,
    status: "pending" as const,
    pushedAt: PUSHED_AT,
    pushedBy,
    wovenAt: null,
    wovenBy: null,
    wovenInto: [] as string[],
  }));

  const threadMeta = {
    threadStatus: "approved",
    categories: ["main-story", "mystery"],
    stages: ["early-game", "mid-game"],
    priority: "high",
    spoilerLevel: "major",
    parent: null,
    characters: ["alder-wade", "the-judge-of-heartland", "the-heartland-watch-captain", "brother-aster"],
    companions: [],
    factions: ["aegis-extraction-consortium", "mountain-holdfasts", "bone-market-families", "desert-nomad-compact", "meridian-arcane-institute"],
    locations: ["heartland", "arcadia-gate", "cliffgate", "riftgate", "sandgate", "stormgate", "first-charter", "second-charter", "third-charter", "first-weir", "the-outfall"],
    arcs: [],
    companionMissions: [],
    bosses: [],
    canonPackets: packets,
    tags: ["riverlands", "heartland", "kingdom-management", "the-standstill"],
    openQuestions: [
      "Which mainline beat actually delivers the player to Heartland? Owned by whoever writes the Peninsula's exit.",
      "The comedic staging of the accident itself — beat by beat — is unwritten; the ruling fixes only the mechanism, the truth, and the five shaved invoices.",
      "Does founding your own power and joining a faction share one arc spine, or fork into two boards?",
      "Did anyone in Heartland besides the Resident know about the refusal before the statue fell — and if so, what has keeping it cost them?",
    ],
  };

  const parsed = threadMetaSchema.safeParse(threadMeta);
  if (!parsed.success) throw new Error(`thread meta invalid: ${parsed.error.message}`);

  const stored = await db.storyEntry.findUnique({ where: { slug: "the-fuse-at-heartland" } });
  const summary = "The Heartland campaign-arc design, ruled and waiting: the Statue, the refusal that keeps the Commander dead, the detective appointment, the tour-as-tutorial, the ruling, and the choice that ends the Standstill.";
  if (!stored) {
    plan.push(`create THREAD the-fuse-at-heartland (${packets.length} pending canon packets)`);
    if (apply) {
      const created = await db.storyEntry.create({ data: {
        kind: "THREAD", slug: "the-fuse-at-heartland", title: "The Fuse at Heartland",
        summary, body: threadBody, meta: threadMeta as unknown as Prisma.InputJsonValue,
        status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: "Riverlands gap fix: filed the Heartland arc design as a development thread with the owner's rulings as pending canon packets.",
      } });
    }
  } else {
    // Reconcile only packets this script minted; never touch woven ones or hand edits.
    const meta = (stored.meta ?? {}) as Record<string, unknown>;
    const existing = Array.isArray(meta.canonPackets) ? (meta.canonPackets as Array<Record<string, unknown>>) : [];
    const byId = new Map(existing.map((p) => [p.id as string, p]));
    let changed = false;
    for (const packet of packets) {
      const prior = byId.get(packet.id);
      if (prior?.status === "woven") continue;
      if (stableJson(prior ?? null) !== stableJson(packet)) { byId.set(packet.id, packet); changed = true; }
    }
    const nextPackets = [...byId.values()];
    const nextMeta = { ...(meta as object), ...threadMeta, canonPackets: nextPackets };
    if (changed || stored.body !== threadBody || stableJson(meta) !== stableJson(nextMeta)) {
      plan.push("reconcile THREAD the-fuse-at-heartland");
      if (apply) {
        await db.storyEntry.update({ where: { id: stored.id }, data: {
          body: threadBody, summary,
          meta: nextMeta as unknown as Prisma.InputJsonValue,
          version: { increment: 1 }, updatedByUserId: actor.id,
        } });
      }
    }
  }

  // ── 2. veil-anchors: append the first-instance paragraph, retire the answered question ──
  const anchors = await db.storyEntry.findUniqueOrThrow({ where: { slug: "veil-anchors" } });
  const marker = "The founding question of this entry has its first answer on the atlas";
  const appendix = `\n\n---\n\n${marker}: [[the-outfall]], in [[riverlands]] — a Tier I Anchor at the far end of the watershed's ancient works, out in wild fen past Heartland's last levee, with [[meridian-arcane-institute]]'s quiet survey camp as the power that got there first (instruments, a research trailer, no activation on record, no flag on any map). It also sets the placement doctrine every later Anchor should follow: remote by design, because Crossings come both ways, and a region's safe hub stays safe by keeping its open door a hard wet distance from the wharves. The Anchor's builders fall under the same silence as the rest of the old works — see [[the-waterworks]] — and canon answers nothing about them.`;

  const anchorsMeta = (anchors.meta ?? {}) as Record<string, unknown>;
  const oldQuestion = "Which mainland region hides the first Tier I Anchor the party can reach — and which power got there first?";
  const questions = Array.isArray(anchorsMeta.openQuestions) ? (anchorsMeta.openQuestions as string[]) : [];
  const needsBody = !(anchors.body ?? "").includes(marker);
  const needsMeta = questions.includes(oldQuestion);
  if (needsBody || needsMeta) {
    plan.push(`update veil-anchors (${[needsBody ? "append first-instance paragraph" : null, needsMeta ? "retire answered question" : null].filter(Boolean).join(" + ")})`);
    if (apply) {
      await db.storyEntry.update({ where: { id: anchors.id }, data: {
        ...(needsBody ? { body: `${anchors.body ?? ""}${appendix}` } : {}),
        ...(needsMeta ? { meta: { ...anchorsMeta, openQuestions: questions.filter((q) => q !== oldQuestion) } as unknown as Prisma.InputJsonValue } : {}),
        version: { increment: 1 }, updatedByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: anchors.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Riverlands gap fix: the Outfall answers the first-Tier-I-Anchor question — appended the first-instance paragraph, retired the answered open question. No prior words changed.",
      } });
    }
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
