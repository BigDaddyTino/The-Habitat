import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Writes the hooks on the three mainline arcs that had none.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-mainline-hooks.ts [--apply]
 *
 * The hook is the line the quest log carries and the first thing a reader's
 * eye lands on. The prologue, the Defend branch and the Flee branch — the
 * literal front door of the game — had blank ones, so the three most important
 * boards in the codex introduced themselves with nothing.
 *
 * Each is written from what the arc already is, not from anything new.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  await write.arcFields("the-island-is-already-lost", {
    hook: "Twenty-two minutes from the first muzzle flash to the title card. Hold the line or take the boats — either way Ignit is gone, and so is the man who kept you alive.",
  });

  await write.arcFields("the-last-days-of-kestrel", {
    hook: "You chose to hold. Forward Camp Kestrel has walls, a Soul Forge, and no relief coming — and the thing under the island is running out of patience faster than Tropic Pearl is running out of men.",
  });

  await write.arcFields("the-evacuation", {
    hook: "You chose the boats. There is not enough hull for the wounded, the guns, and what Pearl left behind — and whatever you leave on that dock, the mainland will read back to you off a manifest.",
  });

  write.report(apply ? "Mainline hooks — APPLYING" : "Mainline hooks — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
