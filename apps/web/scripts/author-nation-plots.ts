import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { NATION_MANAGEMENT_PERSISTED_SLUG } from "@habitat/shared";

/**
 * Untwists the charters in the Nation Management dossier (owner, 2026-09-02):
 * the Three Charters are the Riverlands' three purchasable, buildable plots,
 * not a mechanism every region shares and not rungs of the ladder. Two
 * sentences change, each matched verbatim; if either is missing nothing is
 * written. Preview by default; `--write` applies. Idempotent: on a second
 * run both "to" strings are already present and the script says so.
 */
const write = process.argv.includes("--write");
const db = getPrismaClient();

const edits: Array<{ from: string; to: string }> = [
  {
    from: "- **Homestead** — a parcel and a roof. You get: build, farm, fence, hire hands. For: buying a charter parcel.",
    to: "- **Homestead** — a parcel and a roof. You get: build, farm, fence, hire hands. For: buying a plot — in the Riverlands, the [[first-charter]].",
  },
  {
    from: "- **Buy** — escrowed charter parcels, region by region; rare on purpose, because the world is owned.",
    to: "- **Buy** — one of a region's few pre-defined plots: ground you can buy outright and build your own buildings on. Not every region has one, and the ones that do have a handful — rare on purpose, because the world is owned. The Riverlands holds three in courthouse escrow, the Charters ([[first-charter]], [[second-charter]], [[third-charter]]): a homestead, an economy, a defence — plots, not rungs.",
  },
];

async function main() {
  const entry = await db.storyEntry.findUniqueOrThrow({ where: { slug: NATION_MANAGEMENT_PERSISTED_SLUG }, select: { id: true, body: true, version: true } });
  let body = entry.body ?? "";
  let applied = 0;
  let already = 0;
  for (const edit of edits) {
    if (body.includes(edit.to)) { already += 1; continue; }
    if (!body.includes(edit.from)) { console.error(`Not found verbatim; refusing to guess:\n  ${edit.from}`); process.exit(1); }
    body = body.replace(edit.from, edit.to);
    applied += 1;
  }
  console.log(`${write ? "WRITING" : "PREVIEW"} Nation Management: ${applied} edit(s) to apply, ${already} already applied`);
  for (const edit of edits) console.log(`  → ${edit.to}`);
  if (write && applied) {
    await db.storyEntry.update({ where: { id: entry.id }, data: { body, version: { increment: 1 } } });
    console.log(`  written; version ${entry.version} → ${entry.version + 1}`);
  }
  await db.$disconnect();
}

main().catch((error) => { console.error(error); process.exit(1); });
