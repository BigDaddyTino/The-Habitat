import "../lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { stableJson } from "./lib/story-authoring";

/**
 * Triages The Empty Cribs against the owner's rulings of 2026-08-28.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/triage-the-empty-cribs.ts [--apply]
 *
 * The thread carried two locks marked "TBD by design; do not decide without
 * approval". Both are now answered:
 *
 *   THE CHILDREN were taken by [[the-old-hunger]].
 *   TINO is held by [[helix-arcanobiotics]], who were hunting the same
 *   bloodline and have no idea what they actually have.
 *
 * What this script does NOT do is rewrite the thread's prose. That body is the
 * owner's writing and the best thing in the codex; a script has no business
 * paraphrasing it. Instead the rulings land the way the room's own law says
 * settled material travels — as canon packets on the thread, pending, each one
 * naming exactly what it settles and where it has already been used.
 *
 * The thread moves brainstorming -> approved, its two answered questions come
 * off the open list, and the nine Amanda missions stop being uniformly
 * "brainstorming" when three of them are now load-bearing for shipped boards.
 *
 * The third packet settles nothing on purpose. The vision-link mechanism was
 * an open question before today and still is; what that packet does is close
 * the obvious wrong answer — the shared-Kestrel-Forge idea, which
 * `what-the-player-knows-about-tino` forbids outright — so the next person to
 * have it does not spend a week on it. The boards written this session
 * describe the episodes and never explain them, which keeps the question open.
 */
const db = getPrismaClient();

/**
 * Packet ids are derived, so re-running produces the same packets rather than
 * a second copy of each. Revision ids are NOT derived — a revision is one
 * audit-log event per write, and a stable id there collides on the second run.
 */
function stableUuid(key: string) {
  const source = createHash("sha256").update(`martino:empty-cribs-triage:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "4";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const PUSHED_AT = "2026-08-28";

const packets = [
  {
    key: "the-old-hunger-took-them",
    title: "Owner ruling — the Old Hunger took the children",
    targetKind: "campaign" as const,
    entries: ["the-old-hunger", "amanda", "tino", "lizzarnix"],
    body: `The two children were taken by [[the-old-hunger]]. Owner ruling, 2026-08-28.

Not a faction. Not a transaction. Nothing that ransoms, sells, brokers, or leaves a receipt — which settles, retroactively, the single largest question the thread had about its own plausibility: why nine years of searching found nothing. There was nothing to find. [[amanda]] and [[tino]] spent those years working human channels against something that has never once participated in a market.

A [[lizzarnix]] dies willingly, passes the gift, and returns from the egg in its ashes. The children may carry the first surviving bloodline in ages. What an ancient appetite wants with something that comes back does not need to be stated on the page and should not be.

GLIMPSE DISCIPLINE. The Old Hunger is never named on a board, in a scene, or in a codex body as the answer. It is described only as the shape the missing things leave. This has already been used once, in [[the-captivity-arc]] at "The Shape of the Nothing": a second list in Tino's papers, thirty-one places where nothing was found, spacing too even to be chance, nothing ever resurfacing at any price, and one line at the bottom in his own hand — *not a market.*

That is the whole reveal, and it is not a reveal. It is a man noticing a pattern and being right about it without knowing what he is right about.`,
  },
  {
    key: "helix-holds-tino",
    title: "Owner ruling — Helix Arcanobiotics holds Tino",
    targetKind: "factions" as const,
    targetFaction: "helix-arcanobiotics",
    entries: ["helix-arcanobiotics", "aegis-extraction-consortium", "tino", "essence"],
    body: `[[tino]] is held by [[helix-arcanobiotics]]. Owner ruling, 2026-08-28.

Helix were hunting the same bloodline, through the same brokers and auction lots, with a procurement department and a research budget. Tino crossed their trail repeatedly for years because they were chasing what he was chasing. When the trail finally went warm he believed he had caught up with the people who took his children. He had caught up with a competitor, and nobody corrected him.

This resolves the thread's second lock and it does something better than name a villain: it makes the capture an accident of proximity rather than a plot against him. Helix did not want Tino. Helix wanted a Lizzarnix and could not get one, and he was the nearest available thing — a man with a decade of unrepeatable exposure in his tissue, which is not something their procurement department could ever have bought.

Their programme is what the thread already said it was: build a human who survives multiple incompatible Essence infusions. Hundreds of subjects, each file ending the same way. His does not end. Somebody has written the same query in his margin twice and underlined it the second time — *why does this one not die?*

They do not know. The whole programme is that question, and the answer is a woman none of them have ever heard of.

Canonical placement notes: Helix sits under [[aegis-extraction-consortium]], which means subsidiaries, a legal department, and other sites — the containment site in [[the-captivity-arc]] is deliberately not the important one. The existing Bloomfall line that "Helix involvement in Southreach records is UNCONFIRMED" is untouched by this and stays unconfirmed; this ruling is about the peninsula programme, not about Bloomfall culpability.`,
  },
  {
    key: "vision-link-proposal",
    title: "The vision link — one door closed, and the question left open",
    targetKind: "campaign" as const,
    entries: ["the-soul-forge", "tino", "forward-camp-kestrel", "what-the-player-knows-about-tino"],
    body: `**No mechanism is proposed here. This packet exists to close the obvious wrong answer so nobody spends another week walking into it.**

The thread asks how the player's vision link to [[tino]] squares with canon. The first idea anyone has — and I had it, and drafted it, and it was wrong — is that the two of them were bound to the same Soul Forge at Kestrel, and that the link runs through the drowned machine.

[[what-the-player-knows-about-tino]] forbids it, in terms:

> *The Soul Forge does not close this gap, and must never be written as closing it. A Forge can only speak about Echoes bound to it — Forward Camp Kestrel's Core holds none of Tino's, so it cannot report him alive, cannot report him dead, and cannot be asked.*

Kestrel's Core holds nothing of his. There is no shared binding to route anything through, and any version of this idea ends up writing an instrument that settles his fate, which is the exact thing the rule exists to prevent. **The Forge route is closed. Do not reopen it.**

The second idea is that Tino infused the player, so the channel is the Essence he put in them. That fails too, for a duller reason: the prologue's own scenes let the player be a soldier, a born caster, an infused, a gifted, an engineer, or an assassin, and only one of those was ever dosed. A mechanism that works for one archetype is not a mechanism.

**What canon does support**, and what may be used freely: the party's *inference* that Tino is bound somewhere else. The rule states it outright as the intended reading of his non-reclamation at Kestrel. It explains nothing and confirms nothing, which is why it is safe — and it is quietly available as an answer to Helix's margin query, since a man who is bound somewhere nobody can find is a man who does not finish dying on a table. Nothing in the Reach can verify that. Helix certainly cannot, which is why their whole programme is built on the wrong premise and why they keep increasing the dose.

**Constraints for any future proposal.** It must work for every player archetype. It must not route through a Forge, an operator, or any readout that could be asked about him. And it must leave the gap intact until [[the-captivity-arc]] spends it deliberately.

The boards written this session are compatible with any answer, because they describe the episodes and never explain them — restraint, a surgical light, and a room with two small beds. The question stays open.`,
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true, displayName: true, username: true } });
  if (!actor) throw new Error("Triage requires an active administrator for revision authorship.");
  const pushedBy = actor.displayName ?? actor.username ?? "owner";

  const thread = await db.storyEntry.findUnique({ where: { slug: "the-empty-cribs" }, select: { id: true, meta: true, version: true } });
  if (!thread) throw new Error("The Empty Cribs thread is missing.");
  const meta = (thread.meta ?? {}) as Record<string, unknown>;
  const existing = Array.isArray(meta.canonPackets) ? meta.canonPackets as Array<Record<string, unknown>> : [];

  const changes: string[] = [];
  const byId = new Map(existing.map((packet) => [packet.id as string, packet]));
  for (const spec of packets) {
    const id = stableUuid(spec.key);
    const packet = {
      id, title: spec.title, body: spec.body,
      targetKind: spec.targetKind,
      targetRegion: null,
      targetCompanion: null,
      targetFaction: "targetFaction" in spec ? spec.targetFaction : null,
      entries: spec.entries,
      status: "pending" as const,
      pushedAt: PUSHED_AT, pushedBy,
      wovenAt: null, wovenBy: null, wovenInto: [],
    };
    const prior = byId.get(id);
    // Never re-open a packet somebody has already woven into canon.
    if (prior && prior.status === "woven") { changes.push(`packet ${spec.key}: already woven, left alone`); continue; }
    // Unchanged is not a change. Reporting it as one made the whole triage
    // look like it re-wrote three packets on every dry run.
    if (prior && stableJson(prior) === stableJson(packet)) continue;
    byId.set(id, packet);
    changes.push(`packet ${spec.key}: ${prior ? "rewritten" : "pushed"}`);
  }

  // The two questions the owner answered come off the open list; the rest stay.
  const answered = [
    "Who took the children — TBD by design; do not decide without approval. Big enough to become its own thread.",
    "Which faction or organization holds and experiments on Tino — TBD.",
  ];
  const questions = (Array.isArray(meta.openQuestions) ? meta.openQuestions as string[] : []).filter((question) => !answered.includes(question));
  if (questions.length !== (meta.openQuestions as string[] | undefined)?.length) changes.push(`open questions: ${answered.length} answered and removed`);

  const nextMeta = {
    ...meta,
    threadStatus: "approved",
    canonPackets: [...byId.values()],
    openQuestions: questions,
    // The thread's answers now touch three factions and the deepest theme.
    factions: [...new Set([...(Array.isArray(meta.factions) ? meta.factions as string[] : []), "helix-arcanobiotics", "aegis-extraction-consortium", "the-old-hunger"])],
    arcs: [...new Set([...(Array.isArray(meta.arcs) ? meta.arcs as string[] : []), "the-captivity-arc", "the-hollow-wing"])],
  };
  if (meta.threadStatus !== "approved") changes.push(`thread status: ${meta.threadStatus} -> approved`);

  // Three of Amanda's nine missions now carry weight the boards depend on.
  const missionMoves: Record<string, string> = {
    "the-woman-in-the-peninsula": "planned",
    "the-man-who-left": "planned",
    "he-never-stopped-looking": "planned",
    "the-man-she-never-stopped-loving": "planned",
  };
  const missions = await db.storyEntry.findMany({ where: { kind: "COMPANION_MISSION", slug: { in: Object.keys(missionMoves) } }, select: { id: true, slug: true, title: true, meta: true } });
  const missionUpdates: Array<{ id: string; slug: string; title: string; meta: Record<string, unknown> }> = [];
  for (const mission of missions) {
    const current = (mission.meta ?? {}) as Record<string, unknown>;
    const target = missionMoves[mission.slug]!;
    if (current.missionStatus === target) continue;
    missionUpdates.push({ id: mission.id, slug: mission.slug, title: mission.title, meta: { ...current, missionStatus: target } });
    changes.push(`mission ${mission.slug}: ${current.missionStatus} -> ${target}`);
  }

  for (const change of changes) console.log(`  ${change}`);
  if (changes.length === 0) { console.log("  nothing to do — the triage is already recorded."); }
  console.log(`\n${changes.length} change${changes.length === 1 ? "" : "s"}.`);
  if (!apply) { console.log("Dry run. Re-run with --apply to write it."); return; }
  if (changes.length === 0) return;

  await db.$transaction(async (tx) => {
    const updated = await tx.storyEntry.updateMany({
      where: { id: thread.id, version: thread.version },
      data: { meta: nextMeta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new Error("The Empty Cribs changed while this triage was preparing; nothing was written.");
    await tx.storyRevision.create({
      data: { id: randomUUID(), entityType: "ENTRY", entityId: thread.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Triaged The Empty Cribs: pushed the Old Hunger and Helix rulings as canon packets, moved the thread to approved" },
    });
    for (const mission of missionUpdates) {
      await tx.storyEntry.update({ where: { id: mission.id }, data: { meta: mission.meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await tx.storyRevision.create({
        data: { id: randomUUID(), entityType: "ENTRY", entityId: mission.id, action: "UPDATED", actorUserId: actor.id,
          summary: `Moved "${mission.title}" to planned — the rulings it depends on are settled` },
      });
    }
  }, { isolationLevel: "Serializable", timeout: 30_000 });

  console.log("Applied.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
