import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { storyCorruptionLadderMarker, storyCorruptionPhases } from "@habitat/shared";

/**
 * Writes the seven phases of corruption into the codex prose.
 *
 * The ladder is code-owned (packages/shared/src/story.ts) so the character
 * sheet, the character dossier and the rule page can never disagree — but the
 * game export ships an entry's *body*, not the web page, so the enumeration
 * has to exist as prose too or the Unreal side never receives it. Rather than
 * maintain both, this generates the prose block from the same constant and
 * rewrites it in place on every run. Prose and code cannot drift because the
 * prose is a projection of the code.
 *
 * Everything a writer has authored above the marker is preserved untouched;
 * only the generated block is replaced. Deliberately NOT idempotent-by-skip
 * like the other seeds — rerun it whenever the ladder changes.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-corruption-phases.ts
 */
const db = getPrismaClient();

/** The stable anchor the generated block begins at, shared with the page
 *  that hides the block in favour of the rendered ladder. */
const MARKER = storyCorruptionLadderMarker;

function ladderProse(): string {
  const rows = storyCorruptionPhases.map((row) => {
    const heading = row.phase === 0 ? `**Phase 0 — Clean.**` : `**Phase ${row.phase} — ${row.name}.**`;
    return `${heading} *${row.tell}* ${row.detail} **Hiding it:** ${row.hiding}`;
  });
  return [
    MARKER,
    "",
    "Each phase is a floor: once somebody reaches it they never climb back above it, and the small amounts that can be worked off only ever return them to the floor they last touched. Every phase can be hidden and none of them can be erased.",
    "",
    ...rows.flatMap((row) => [row, ""]),
    "The first four phases are the tells canon already named in order — tremor, veining, appetite, sensitivity — and the last three carry that same road to its end in [[abominations]]. Where a character stands is recorded on their sheet, and their dossier reads it back as the tell a scene should show rather than as a number.",
    "",
    "Two places this ladder is worth breaking a writer's heart with. The gap between the phase somebody *is* and the phase they are *believed* to be is the setting's best material — [[tino]] hides a phase-one tremor in a grocery store, and how much further down he actually sits is deliberately unwritten ([[what-the-player-knows-about-tino]]). And a companion advancing a phase mid-campaign should be something the player notices before the game ever says it out loud.",
  ].join("\n");
}

async function main() {
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`author: ${author.username}`);

  const rule = await db.storyEntry.findUnique({ where: { slug: "the-seven-phases-of-corruption" }, select: { id: true, title: true, body: true } });
  if (!rule) throw new Error("the-seven-phases-of-corruption is missing — nothing to write into.");

  // Preserve everything the room has written above the marker.
  const existing = rule.body ?? "";
  const at = existing.indexOf(MARKER);
  const preserved = (at === -1 ? existing : existing.slice(0, at)).trimEnd();
  const next = `${preserved}\n\n${ladderProse()}`;

  if (next === existing) {
    console.log("  rule already carries the current ladder — nothing to write");
  } else {
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: rule.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: rule.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Wrote the seven phases out in full on "${rule.title}"`,
          before: { bodyLength: existing.length },
          after: { bodyLength: next.length, phases: storyCorruptionPhases.map((row) => `${row.phase} ${row.name}`) },
        },
      });
    });
    console.log(`  ${at === -1 ? "added" : "regenerated"} the ladder on the-seven-phases-of-corruption (${storyCorruptionPhases.length} phases)`);
  }

  // The one weave the prose was actually missing: abominations are phase
  // seven by name, so the creature and the ladder agree on where they meet.
  const abomination = await db.storyEntry.findUnique({ where: { slug: "abominations" }, select: { id: true, title: true, body: true } });
  const phaseSeven = "**Phase seven, by name.**";
  if (abomination && abomination.body && !abomination.body.includes(phaseSeven)) {
    const addition = `${phaseSeven} An abomination is the seventh and last phase of [[the-seven-phases-of-corruption]] — the completion, the one phase nobody has ever been recorded returning from. Everything below it is a person who can still be written, argued with, hidden, and helped; this is the floor beneath the last floor. Write the six phases above it as the tragedy, and this one as what the tragedy was always walking toward.`;
    const next = `${abomination.body.trimEnd()}\n\n${addition}`;
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: abomination.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: abomination.id, action: "UPDATED", actorUserId: author.id, summary: `Named abominations as phase seven on "${abomination.title}"` },
      });
    });
    console.log("  wove phase seven into abominations");
  } else {
    console.log("  skip   abominations (already names phase seven)");
  }

  // The system dossier points at the ladder rather than restating it — one
  // enumeration in the export, not two that can disagree.
  const system = await db.storyEntry.findUnique({ where: { slug: "the-corruption-system" }, select: { id: true, title: true, body: true } });
  const pointer = "**Where the phases are written down.**";
  if (system && system.body && !system.body.includes(pointer)) {
    const addition = `${pointer} All seven are enumerated on [[the-seven-phases-of-corruption]] — tremor, veining, appetite, sensitivity, drift, turning, completion — each with the tell a scene should show and how it gets hidden. A character's phase is a field on their sheet, so their dossier can read it back; leaving it unset is an answer too, and means nobody has decided yet.`;
    const next = `${system.body.trimEnd()}\n\n${addition}`;
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: system.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: system.id, action: "UPDATED", actorUserId: author.id, summary: `Pointed "${system.title}" at the enumerated phases` },
      });
    });
    console.log("  pointed the corruption system at the ladder");
  } else {
    console.log("  skip   the-corruption-system (already points at the ladder)");
  }

  console.log("\nNote: Tino's phase stays unset on purpose — how far down he actually sits is owner-gated canon.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
