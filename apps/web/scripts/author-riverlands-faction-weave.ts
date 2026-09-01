import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";

/**
 * The Riverlands living-world pass, part three: the factions learn about
 * their gates.
 *
 * Seven faction dossiers gain an appended "## On the Riverlands" section —
 * strictly below the existing prose, never touching a word of it, replaceable
 * from its own marker heading on re-run (the corruption-ladder pattern). The
 * region-side control rows were wired in the foundation pass; this is the
 * prose side of the same fact.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-riverlands-faction-weave.ts [--apply]
 */

const MARKER = "## On the Riverlands";

const sections: Record<string, string> = {
  "aegis-extraction-consortium": `${MARKER}

The Consortium holds [[arcadia-gate]], the money leg of the central watershed — the deep freight artery between [[heartland]] and [[port-arcadia]], run from the customs fortress at [[clearinghouse]] under Factor [[cassia-verne]], the politest ledger on the river. Aegis wants Heartland the way it wants everything: as the throat of continental trade, entered as a line item. It is the richest of the five gate powers and the least hurried, and its whole position on the Standstill fits in one of Verne's sentences — the pact's ending is priced wrong by everyone else in the city.`,
  "mountain-holdfasts": `${MARKER}

The Holdfasts hold [[cliffgate]], the vertical leg — the only freight route between the watershed and the high country, climbed by lock and lift and run from the winch fortress at [[winchworks]], where Brakemaster [[ottar-kolm]]'s hand is on the lever that decides whether the mountains have a door. Their answer to who owns the water is the Compact's single article said shorter: the water is not for sale. Of the five gate powers they are the least interested in [[heartland]] itself and the most dangerous to besiege it, because the city's food goes up and its ore comes down through their one door — and the door has a doorman.`,
  "bone-market-families": `${MARKER}

The Families hold [[riftgate]], the relic leg — the tannin-dark water down from the [[grand-rift]] country, gated by the fortified lock at [[charnel-lock]] under Widow [[cerise-mora]], whose courtesy is the leg's whole security system. Their claim on [[heartland]] is the oldest kind there is: half the city owes them and the other half is behind on payments, and a war would be terrible for collections — which makes the Families the Standstill's most sincere supporter, and everyone understands that is not the same as a friend. The Third Charter's ruined watch-fort stands on their river, and they have opinions about neighbors.`,
  "desert-nomad-compact": `${MARKER}

The Compact holds [[sandgate]], the oasis corridor — the caravan peoples' one wet border, met at [[standing-camp]], the single camp in their history that never strikes, because a [[the-soul-forge]] cannot walk. [[yusra-of-the-wells]] keeps it, and carries what the fixed point costs a wandering people. The Compact does not want [[heartland]]; it wants the water to stay open — and it has noticed that wanting things to stay as they are is the most expensive position in the Riverlands.`,
  "meridian-arcane-institute": `${MARKER}

The Institute holds [[stormgate]] under a research charter — the engineered leg, a river held unnaturally steady all the way into the [[magic-torn-wasteland]], run from [[regulator-station]] by Director [[casmir-rew]], with [[iron-saints-pmc]] guns on the walls and budgets sealed even from the Station's own researchers. The charter's public purpose is research access to the Wasteland. Its quieter purposes are the Institute's own: [[echo-fence]]'s transcripts travel under seal, and out past Heartland's last levee, at [[the-outfall]], Meridian keeps a survey camp that appears on no map — instruments, a trailer, no activation, and the first claim nobody has made out loud on the first Anchor anybody found.`,
  "iron-saints-pmc": `${MARKER}

On the central watershed the Saints are what they are everywhere: the signature line's people. [[meridian-arcane-institute]] pays them to garrison the held river — the fort at [[regulator-station]], the sandbagged edge at [[breakline]], the listening wire at [[echo-fence]], and the storm-refuge at [[last-mooring]] — and the whole of [[stormgate]] can recite the invoice's renewal dates, because the day Meridian stops paying is a day everyone downstream has plans for. It is quiet, well-paid, strange work, rotated short, and the Saints' one institutional opinion about it is professionally withheld.`,
  "the-free-peoples-compact": `${MARKER}

The Compact's newest test is not an offer — it is geography. Two of its five peoples hold rival gates on the central watershed: the [[mountain-holdfasts]] on [[cliffgate]] and the [[desert-nomad-compact]] on [[sandgate]], each a full gate power under [[heartland]]'s Standstill, each with its own fort, its own arithmetic, and its own answer to what happens when the city's fuse finally burns down. The bloc's single article — our land is not yours — says nothing about what two member peoples owe each other when the pact that holds them both breaks, and the assembly has, so far, declined to find out ahead of the fact.`,
};

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  // Every link in every section must resolve before anything is touched.
  const problems: string[] = [];
  for (const [slug, section] of Object.entries(sections)) {
    for (const match of section.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      const exists = await db.storyEntry.findUnique({ where: { slug: match[1]! }, select: { id: true } });
      if (!exists) problems.push(`${slug}: dead link [[${match[1]}]]`);
    }
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  const plan: string[] = [];
  for (const [slug, section] of Object.entries(sections)) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, body: true } });
    if (!entry) { plan.push(`MISSING faction ${slug}`); continue; }
    const body = entry.body ?? "";
    const markerAt = body.indexOf(MARKER);
    // Append below the owner prose, or replace from our own marker on re-run.
    // Everything above the marker is untouched by construction.
    const preserved = markerAt === -1 ? body : body.slice(0, markerAt).trimEnd();
    const next = `${preserved}\n\n${section}`;
    if (next === body) continue;
    if (!next.startsWith(preserved)) throw new Error(`${slug}: append invariant violated`);
    plan.push(markerAt === -1 ? `append section to ${slug}` : `refresh section on ${slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: {
      entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id,
      summary: "Riverlands living world: appended the 'On the Riverlands' section — gate, fort, voice, and the Standstill. No prior words changed.",
    } });
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", factions: Object.keys(sections).length, plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
