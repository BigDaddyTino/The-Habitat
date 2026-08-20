import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { storyPlaceAncestry, type StoryPlaceLink } from "@habitat/shared";
import { canonPacketSchema } from "../lib/story-meta-schemas";

/**
 * The broom for what the Stories & Quests reorganization left behind, and for
 * the older leftovers it finally made visible.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/sweep-story-legacy.ts
 *   pnpm --filter @habitat/web exec tsx scripts/sweep-story-legacy.ts --apply
 *
 * Dry run by default, the same way `cleanup-duplicate-joins` works.
 *
 * Most of what it reports it deliberately does NOT fix. Draining the review
 * queue is a human decision about somebody's writing; filing an unfiled quest
 * is a writer saying where it belongs; a dangling slug is usually the
 * link-now-fill-later law working exactly as intended. Making the backlog
 * visible is the whole job — the in-app surfaces show the same lists and
 * disappear when they empty, and this is how somebody checks without clicking
 * through six pages.
 *
 * The one thing `--apply` does touch is the pair of columns a database CHECK
 * already guarantees agree, because if that ever fails it is a corruption
 * nobody can fix from the writers' room.
 */
const db = getPrismaClient();

const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const slugOf = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

async function main() {
  const apply = process.argv.includes("--apply");

  const [arcs, entries, proposedNodes, proposedEdges] = await Promise.all([
    db.storyArc.findMany({
      where: { status: { in: [...workingStatuses] } },
      select: { id: true, slug: true, title: true, status: true, category: true, isMainline: true, regionEntryId: true, companionEntryId: true, factionEntryId: true },
      orderBy: { title: "asc" },
    }),
    db.storyEntry.findMany({
      where: { status: { in: [...workingStatuses] } },
      select: { id: true, slug: true, title: true, kind: true, status: true, meta: true },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
    }),
    db.storyNode.count({ where: { status: "PROPOSED" } }),
    db.storyEdge.count({ where: { status: "PROPOSED" } }),
  ]);

  const knownEntries = new Set(entries.map((entry) => entry.slug));
  const knownArcs = new Set(arcs.map((arc) => arc.slug));

  // --- the approval ladder's leftovers ---------------------------------------
  // The ladder went on 2026-08-18; anything still marked proposed predates it.
  // The review queue exists to drain these and hides itself once empty.
  const proposedArcs = arcs.filter((arc) => arc.status === "PROPOSED");
  const proposedEntries = entries.filter((entry) => entry.status === "PROPOSED");
  const stillProposed = proposedArcs.length + proposedEntries.length + proposedNodes + proposedEdges;

  // --- quests nobody has put anywhere ----------------------------------------
  // Side quests and contracts with no place are the ones the navigator files
  // under "Not filed anywhere yet"; a contract without one is worse, because
  // being posted somewhere is what makes it a contract.
  const unfiled = arcs.filter((arc) => (arc.category === "SIDE_QUEST" || arc.category === "CONTRACT") && !arc.regionEntryId);
  const contractsWithoutPlace = unfiled.filter((arc) => arc.category === "CONTRACT");
  const companionQuestsWithoutCompanion = arcs.filter((arc) => arc.category === "COMPANION_QUEST" && !arc.companionEntryId);
  const factionQuestsWithoutFaction = arcs.filter((arc) => arc.category === "FACTION_QUEST" && !arc.factionEntryId);

  // --- the pair the database already guards ----------------------------------
  const drifted = arcs.filter((arc) => arc.isMainline !== (arc.category === "MAINLINE"));

  // --- references pointing at nothing ----------------------------------------
  const dangling: string[] = [];
  const check = (where: string, target: string | null, pool: Set<string>, what: string) => {
    if (target && !pool.has(target)) dangling.push(`${where} -> ${target} (no such ${what})`);
  };
  for (const entry of entries) {
    const meta = asRecord(entry.meta);
    if (!meta) continue;
    const at = `${entry.kind}:${entry.slug}`;
    if (entry.kind === "REGION") {
      check(`${at} .parent`, slugOf(meta.parent), knownEntries, "place");
      for (const row of Array.isArray(meta.connections) ? meta.connections : []) check(`${at} .connections[].to`, slugOf(asRecord(row)?.to), knownEntries, "place");
    }
    if (entry.kind === "FACTION") {
      check(`${at} .parent`, slugOf(meta.parent), knownEntries, "faction");
    }
    if (entry.kind === "COMPANION_MISSION") {
      check(`${at} .companion`, slugOf(meta.companion), knownEntries, "character");
      check(`${at} .arc`, slugOf(meta.arc), knownArcs, "story board");
    }
    if (entry.kind === "THREAD") {
      for (const list of [["characters", meta.characters], ["locations", meta.locations], ["companions", meta.companions], ["factions", meta.factions], ["bosses", meta.bosses], ["companionMissions", meta.companionMissions]] as const) {
        for (const value of Array.isArray(list[1]) ? list[1] : []) check(`${at} .${list[0]}`, slugOf(value), knownEntries, "entry");
      }
      for (const value of Array.isArray(meta.arcs) ? meta.arcs : []) check(`${at} .arcs`, slugOf(value), knownArcs, "story board");
      for (const [index, row] of (Array.isArray(meta.canonPackets) ? meta.canonPackets : []).entries()) {
        const packet = asRecord(row);
        if (!packet) continue;
        check(`${at} .canonPackets[${index}].targetRegion`, slugOf(packet.targetRegion), knownEntries, "place");
        check(`${at} .canonPackets[${index}].targetCompanion`, slugOf(packet.targetCompanion), knownEntries, "character");
        check(`${at} .canonPackets[${index}].targetFaction`, slugOf(packet.targetFaction), knownEntries, "faction");
        for (const value of Array.isArray(packet.entries) ? packet.entries : []) check(`${at} .canonPackets[${index}].entries`, slugOf(value), knownEntries, "entry");
        for (const value of Array.isArray(packet.wovenInto) ? packet.wovenInto : []) check(`${at} .canonPackets[${index}].wovenInto`, slugOf(value), knownArcs, "story board");
      }
    }
  }

  // --- companion missions nobody filed ---------------------------------------
  // The missions library already shows these under "Not filed"; listed here so
  // one command answers "is anything loose?" for the whole room.
  const orphanMissions = entries.filter((entry) => entry.kind === "COMPANION_MISSION" && !slugOf(asRecord(entry.meta)?.companion));

  // --- packets the inbox cannot read -----------------------------------------
  const unreadablePackets: string[] = [];
  for (const entry of entries.filter((row) => row.kind === "THREAD")) {
    const rows = asRecord(entry.meta)?.canonPackets;
    if (!Array.isArray(rows)) {
      if (asRecord(entry.meta)) unreadablePackets.push(`${entry.slug} — carries no canonPackets key; the next sheet save will be refused`);
      continue;
    }
    for (const [index, row] of rows.entries()) {
      if (!canonPacketSchema.safeParse(row).success) unreadablePackets.push(`${entry.slug} — packet ${index} does not validate; the inbox skips it`);
    }
  }

  // --- places filed into a loop ----------------------------------------------
  // Every walker in the codex carries a seen-set and stops rather than hanging,
  // so a loop is survivable — but a place inside one is unreachable from the
  // map and nobody would ever notice it going quiet.
  const placeLinks: StoryPlaceLink[] = entries
    .filter((entry) => entry.kind === "REGION")
    .map((entry) => ({ slug: entry.slug, parent: slugOf(asRecord(entry.meta)?.parent) }));
  const looped = placeLinks.filter((link) => storyPlaceAncestry(link.slug, placeLinks).includes(link.slug));

  const report = (label: string, rows: string[], note: string) => {
    console.log(`\n${label}: ${rows.length}`);
    for (const row of rows.slice(0, 40)) console.log(`  ${row}`);
    if (rows.length > 40) console.log(`  … and ${rows.length - 40} more`);
    if (rows.length > 0) console.log(`  → ${note}`);
  };

  console.log(`arcs: ${arcs.length}   entries: ${entries.length}`);

  report(
    "STILL PROPOSED — the approval ladder's leftovers",
    stillProposed === 0 ? [] : [
      ...proposedArcs.map((arc) => `arc ${arc.slug} — /codex/arc/${arc.slug}`),
      ...proposedEntries.map((entry) => `${entry.kind.toLowerCase()} ${entry.slug} — /codex/bible/${entry.slug}`),
      ...(proposedNodes > 0 ? [`${proposedNodes} scene(s) on boards`] : []),
      ...(proposedEdges > 0 ? [`${proposedEdges} choice(s) on boards`] : []),
    ],
    "drain them at /codex/review — a human call, never automatic. The queue hides itself once empty.",
  );

  report(
    "NOT FILED — quests with no place on the map",
    unfiled.map((arc) => `${arc.category === "CONTRACT" ? "contract" : "side quest"} ${arc.slug} — /codex/arc/${arc.slug}`),
    "open the story's settings and say where it is picked up. The navigator lists the same set under \"Not filed anywhere yet\".",
  );

  report(
    "CONTRACTS WITH NO PLACE — a bounty posted nowhere",
    contractsWithoutPlace.map((arc) => `${arc.slug} — /codex/arc/${arc.slug}`),
    "being posted somewhere is what makes a contract a contract; new ones are refused without it, so these predate the category.",
  );

  report(
    "COMPANION QUESTS WITH NO COMPANION",
    companionQuestsWithoutCompanion.map((arc) => `${arc.slug} — /codex/arc/${arc.slug}`),
    "the navigator files these under \"Not filed to a companion yet\" until somebody says whose story it is.",
  );

  report(
    "FACTION QUESTS FLYING NO BANNER",
    factionQuestsWithoutFaction.map((arc) => `${arc.slug} — /codex/arc/${arc.slug}`),
    "the navigator files these under \"Flying no banner yet\" until somebody says whose operation it is.",
  );

  report(
    "ORPHAN MISSIONS — a companion mission belonging to nobody",
    orphanMissions.map((entry) => `${entry.slug} — /codex/bible/${entry.slug}`),
    "the missions library already shows these under \"Not filed\"; pick a companion on the mission's sheet.",
  );

  report(
    "PACKETS THE INBOX CANNOT READ",
    unreadablePackets,
    "run scripts/audit-story-meta.ts for the exact validation failure. Settled material is at risk here — this is the one list worth acting on today.",
  );

  report(
    "DANGLING — references pointing at nothing",
    dangling,
    "report only. Link-now-fill-later is canon law: most of these are somebody's plan, and they render as amber unresolved links in the app.",
  );

  report(
    "LOOPED PLACES — a place filed inside itself",
    looped.map((link) => `${link.slug} (parent chain reaches itself)`),
    "every walker stops rather than hanging, but a looped place never appears on the map. Fix the parent on its sheet.",
  );

  report(
    "COLUMN DRIFT — isMainline and the category disagree",
    drifted.map((arc) => `${arc.slug} — isMainline=${arc.isMainline}, category=${arc.category}`),
    apply ? "repairing from the category, which is what the room edits." : "re-run with --apply to repair. A database CHECK should make this impossible; if it appears, something wrote around it.",
  );

  if (apply && drifted.length > 0) {
    for (const arc of drifted) {
      await db.storyArc.update({ where: { id: arc.id }, data: { isMainline: arc.category === "MAINLINE" } });
      console.info(`repaired ${arc.slug}: isMainline := ${arc.category === "MAINLINE"}`);
    }
  }

  const urgent = unreadablePackets.length + drifted.length;
  console.log(`\n${urgent === 0 ? "CLEAN" : "ATTENTION"} — ${urgent} problem(s) worth acting on today; ${stillProposed + unfiled.length + companionQuestsWithoutCompanion.length + factionQuestsWithoutFaction.length + orphanMissions.length + dangling.length + looped.length} item(s) listed for a human to decide about.`);
  if (!apply && drifted.length > 0) console.log("Nothing was written. Re-run with --apply to repair the column drift.");
  if (unreadablePackets.length > 0) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
