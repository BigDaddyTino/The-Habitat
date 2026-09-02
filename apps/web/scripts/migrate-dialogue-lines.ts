import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { speakerResolverFor, splitBodyIntoLines } from "../lib/dialogue-split";

/**
 * The one-time migration pass over the current story (export v5, F): every
 * node whose prose carries quoted speech and which has no lines yet gets its
 * lines proposed by the same splitter the website's "Split body into lines"
 * button uses, and written as rows. Body prose is untouched. Rows the
 * splitter could not attribute land as the "unattributed" role, voiced off,
 * and are listed here for a writer to name in the Lines editor.
 *
 * Idempotent: a node with any line (live or retired) is skipped, so a rerun
 * never doubles a card and never touches rows a writer has since edited.
 * Preview by default; `--apply` writes. `--arc <slug>` limits the pass.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/migrate-dialogue-lines.ts [--apply] [--arc the-island-is-already-lost]
 */
const apply = process.argv.includes("--apply");
const arcFlag = process.argv.indexOf("--arc");
const onlyArc = arcFlag === -1 ? null : process.argv[arcFlag + 1] ?? null;
const db = getPrismaClient();

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const characters = await db.storyEntry.findMany({ where: { kind: "CHARACTER" }, select: { id: true, slug: true, title: true, meta: true } });
  const roster = characters.map((character) => {
    const meta = typeof character.meta === "object" && character.meta !== null && !Array.isArray(character.meta) ? character.meta as Record<string, unknown> : {};
    return { slug: character.slug, title: character.title, fullName: typeof meta.fullName === "string" ? meta.fullName : null, aliases: Array.isArray(meta.aliases) ? meta.aliases.filter((alias): alias is string => typeof alias === "string") : [] };
  });
  const idBySlug = new Map(characters.map((character) => [character.slug, character.id]));

  const arcs = await db.storyArc.findMany({ where: onlyArc ? { slug: onlyArc } : {}, orderBy: { slug: "asc" }, select: { id: true, slug: true } });
  const report: string[] = [];
  let totalLines = 0;
  let totalNodes = 0;
  let totalUnattributed = 0;
  const unattributed: string[] = [];
  for (const arc of arcs) {
    const nodes = await db.storyNode.findMany({ where: { arcId: arc.id }, orderBy: [{ canvasY: "asc" }, { canvasX: "asc" }, { key: "asc" }], select: { id: true, key: true, kind: true, body: true, speaker: { select: { slug: true, title: true } }, _count: { select: { lines: true } } } });
    let arcLines = 0;
    let arcNodes = 0;
    let arcUnattributed = 0;
    let arcSkipped = 0;
    for (const node of nodes) {
      if (node._count.lines > 0) { arcSkipped += 1; continue; }
      const proposed = splitBodyIntoLines(node.body ?? "", speakerResolverFor(roster, node.speaker));
      if (!proposed.length) continue;
      arcNodes += 1;
      arcLines += proposed.length;
      for (const [index, line] of proposed.entries()) {
        if (line.unattributed) { arcUnattributed += 1; unattributed.push(`${arc.slug}/${node.key}/${String(index + 1).padStart(2, "0")}  "${line.text.slice(0, 60)}"`); }
        if (!apply) continue;
        await db.storyLine.create({ data: {
          nodeId: node.id,
          number: index + 1,
          order: index,
          speakerEntryId: line.speakerSlug ? idBySlug.get(line.speakerSlug) ?? null : null,
          speakerRole: line.speakerSlug && idBySlug.has(line.speakerSlug) ? null : (line.speakerRole ?? "unattributed"),
          text: line.text,
          performance: line.performance,
          voiced: line.voiced,
          createdByUserId: actor.id,
        } });
      }
      if (apply) {
        await db.storyRevision.create({ data: { entityType: "NODE", entityId: node.id, arcId: arc.id, action: "UPDATED", actorUserId: actor.id, summary: `Lines proposed from the scene text (${proposed.length}); export v5 migration.`, after: { lines: proposed.map((line) => line.text) } } });
      }
    }
    if (arcNodes || arcSkipped) report.push(`${arc.slug.padEnd(40)} ${String(arcNodes).padStart(3)} nodes  ${String(arcLines).padStart(4)} lines  ${String(arcUnattributed).padStart(3)} unattributed${arcSkipped ? `  (${arcSkipped} already had lines)` : ""}`);
    totalLines += arcLines;
    totalNodes += arcNodes;
    totalUnattributed += arcUnattributed;
  }
  console.log(`${apply ? "APPLIED" : "PREVIEW"} — dialogue line migration${onlyArc ? ` (arc ${onlyArc})` : ""}`);
  for (const row of report) console.log(`  ${row}`);
  console.log(`  ${"TOTAL".padEnd(40)} ${String(totalNodes).padStart(3)} nodes  ${String(totalLines).padStart(4)} lines  ${String(totalUnattributed).padStart(3)} unattributed`);
  if (unattributed.length) {
    console.log("\nUnattributed (role \"unattributed\", not voiced — name the speaker in the Lines editor):");
    for (const row of unattributed) console.log(`  ${row}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
