import "../lib/environment";
import { createHash } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import type { MartinoStoryExport } from "@habitat/shared";

/**
 * What changed between two releases.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/diff-story-releases.ts \
 *     [--from martino-2026.08.1] [--to martino-2026.08.2] [--json]
 *
 * With no arguments it compares the two newest. With only `--from`, it
 * compares that release to the newest — which is the question an importer
 * actually asks: *I am holding this one; what has moved since?*
 *
 * The point of the release boundary is that this question has an answer at
 * all. Against live canon the honest answer was always "everything might
 * have, go and re-read it."
 */
const db = getPrismaClient();

function argument(flag: string) {
  const at = process.argv.indexOf(flag);
  return at === -1 ? null : process.argv[at + 1] ?? null;
}

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

type Side = { name: string; payload: MartinoStoryExport };

/** Keyed by the identity the export freezes: slugs for entries, slugs for arcs. */
function index(payload: MartinoStoryExport) {
  return {
    bible: new Map(payload.bible.map((entry) => [entry.slug, entry])),
    arcs: new Map(payload.arcs.map((arc) => [arc.slug, arc])),
  };
}

function compare(from: Side, to: Side) {
  const left = index(from.payload);
  const right = index(to.payload);

  const bibleAdded = [...right.bible.keys()].filter((slug) => !left.bible.has(slug));
  const bibleRemoved = [...left.bible.keys()].filter((slug) => !right.bible.has(slug));
  const bibleChanged = [...right.bible.keys()]
    .filter((slug) => left.bible.has(slug) && digest(left.bible.get(slug)) !== digest(right.bible.get(slug)))
    .map((slug) => {
      const before = left.bible.get(slug)!;
      const after = right.bible.get(slug)!;
      const fields = (["title", "summary", "body", "meta"] as const).filter((field) => digest(before[field]) !== digest(after[field]));
      return { slug, kind: after.kind, fields };
    });

  const arcsAdded = [...right.arcs.keys()].filter((slug) => !left.arcs.has(slug));
  const arcsRemoved = [...left.arcs.keys()].filter((slug) => !right.arcs.has(slug));
  const arcsChanged = [...right.arcs.keys()]
    .filter((slug) => left.arcs.has(slug) && digest(left.arcs.get(slug)) !== digest(right.arcs.get(slug)))
    .map((slug) => {
      const before = left.arcs.get(slug)!;
      const after = right.arcs.get(slug)!;
      const beforeNodes = new Map(before.nodes.map((node) => [node.key, node]));
      const afterNodes = new Map(after.nodes.map((node) => [node.key, node]));
      return {
        slug,
        scenesAdded: [...afterNodes.keys()].filter((key) => !beforeNodes.has(key)),
        scenesRemoved: [...beforeNodes.keys()].filter((key) => !afterNodes.has(key)),
        scenesChanged: [...afterNodes.keys()].filter((key) => beforeNodes.has(key) && digest(beforeNodes.get(key)) !== digest(afterNodes.get(key))),
        branchesBefore: before.nodes.reduce((total, node) => total + node.choices.length, 0),
        branchesAfter: after.nodes.reduce((total, node) => total + node.choices.length, 0),
      };
    });

  return { bibleAdded, bibleRemoved, bibleChanged, arcsAdded, arcsRemoved, arcsChanged };
}

async function main() {
  const releases = await db.storyRelease.findMany({ orderBy: { cutAt: "desc" }, select: { name: true, sha256: true, cutAt: true } });
  if (releases.length === 0) throw new Error("No releases have been cut yet.");

  const toName = argument("--to") ?? releases[0]!.name;
  const fromName = argument("--from") ?? releases.find((release) => release.name !== toName)?.name ?? null;
  if (!fromName) throw new Error(`Only one release exists (${toName}). There is nothing to compare it to.`);

  const [from, to] = await Promise.all([
    db.storyRelease.findUnique({ where: { name: fromName }, select: { name: true, sha256: true, cutAt: true, payload: true } }),
    db.storyRelease.findUnique({ where: { name: toName }, select: { name: true, sha256: true, cutAt: true, payload: true } }),
  ]);
  if (!from) throw new Error(`No release named "${fromName}".`);
  if (!to) throw new Error(`No release named "${toName}".`);

  const result = compare(
    { name: from.name, payload: from.payload as unknown as MartinoStoryExport },
    { name: to.name, payload: to.payload as unknown as MartinoStoryExport },
  );

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ contract: "habitat-release-diff", contractVersion: 1, from: from.name, to: to.name, ...result }, null, 2));
    return;
  }

  console.log(`${from.name}  (${from.sha256.slice(0, 12)}…, cut ${from.cutAt.toISOString()})`);
  console.log(`${to.name}  (${to.sha256.slice(0, 12)}…, cut ${to.cutAt.toISOString()})\n`);

  const section = (label: string, rows: string[]) => {
    console.log(`${label}: ${rows.length}`);
    for (const row of rows) console.log(`  ${row}`);
  };

  section("BIBLE ADDED", result.bibleAdded);
  section("BIBLE REMOVED", result.bibleRemoved);
  section("BIBLE CHANGED", result.bibleChanged.map((entry) => `${entry.kind} ${entry.slug} — ${entry.fields.join(", ")}`));
  section("ARCS ADDED", result.arcsAdded);
  section("ARCS REMOVED", result.arcsRemoved);
  section("ARCS CHANGED", result.arcsChanged.map((arc) => {
    const parts = [
      arc.scenesAdded.length ? `+${arc.scenesAdded.length} scenes (${arc.scenesAdded.join(", ")})` : null,
      arc.scenesRemoved.length ? `-${arc.scenesRemoved.length} scenes (${arc.scenesRemoved.join(", ")})` : null,
      arc.scenesChanged.length ? `${arc.scenesChanged.length} rewritten (${arc.scenesChanged.join(", ")})` : null,
      arc.branchesBefore === arc.branchesAfter ? null : `branches ${arc.branchesBefore} -> ${arc.branchesAfter}`,
    ].filter(Boolean);
    return `${arc.slug} — ${parts.join("; ") || "metadata only"}`;
  }));

  const total = result.bibleAdded.length + result.bibleRemoved.length + result.bibleChanged.length
    + result.arcsAdded.length + result.arcsRemoved.length + result.arcsChanged.length;
  console.log(`\n${total} change${total === 1 ? "" : "s"} between the two releases.`);
}

main().then(() => db.$disconnect(), (error) => { console.error(`\n${(error as Error).message}`); return db.$disconnect().then(() => process.exit(1)); });
