import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { auditWorldConnections, type WorldConnectionFinding } from "../lib/story-world-connections";

/**
 * Every world connection in the codex, read from both ends.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-world-connections.ts [--json] [--all]
 *
 * Read-only. Reports three severities:
 *   defect — the two ends disagree, or a field names the wrong kind of thing
 *   gap    — one end is written and the other is silent
 *   note   — informational (link-now-fill-later markers, instances with no
 *            prose note on their system)
 *
 * Without --all, notes are summarised by count; with it, every note prints.
 * The same checks run inside the release audit (scripts/lib/release-audit.ts),
 * where defects fail the gate and gaps are reported.
 */
const db = getPrismaClient();

async function main() {
  const json = process.argv.includes("--json");
  const all = process.argv.includes("--all");
  const [entries, arcs] = await Promise.all([
    db.storyEntry.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true, kind: true, title: true, meta: true, summary: true, body: true }, orderBy: [{ kind: "asc" }, { slug: "asc" }] }),
    db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } }),
  ]);
  const result = auditWorldConnections(entries, arcs);

  if (json) {
    console.log(JSON.stringify({ contract: "habitat-world-connections-audit", contractVersion: 1, entries: entries.length, ...result }, null, 2));
    return;
  }

  const byCode = new Map<string, WorldConnectionFinding[]>();
  for (const finding of result.findings) {
    const key = `${finding.severity}:${finding.code}`;
    byCode.set(key, [...(byCode.get(key) ?? []), finding]);
  }
  console.log(`World-connection audit — ${entries.length} entries, ${result.defects} defect${result.defects === 1 ? "" : "s"}, ${result.gaps} gap${result.gaps === 1 ? "" : "s"}, ${result.notes} note${result.notes === 1 ? "" : "s"}`);
  console.log("");
  for (const severity of ["defect", "gap", "note"] as const) {
    const groups = [...byCode.entries()].filter(([key]) => key.startsWith(`${severity}:`)).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, findings] of groups) {
      console.log(`${severity.toUpperCase()}  ${key.slice(severity.length + 1)}  ×${findings.length}`);
      if (severity === "note" && !all) continue;
      for (const finding of findings) console.log(`      ${finding.kind.toLowerCase().replaceAll("_", " ")} ${finding.slug} · ${finding.field} → ${finding.target}\n        ${finding.detail}`);
    }
  }
  if (!all && result.notes) console.log("\n(notes summarised — pass --all to list them)");
  if (result.defects) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
