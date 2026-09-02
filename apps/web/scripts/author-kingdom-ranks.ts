import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { KINGDOM_CROWN_LAYER, OLD_CROWN_MARKERS } from "./lib/kingdom-crown-layer";

/**
 * The Ranks of the Crown (owner, 2026-09-02): the five holding names are the
 * realm's level system, not a ladder beside it. Replaces the design layer on
 * the `kingdom-management` dossier from its own marker — the old "rung by
 * rung" marker or the current one — to the end of the body with the shared
 * layer in scripts/lib/kingdom-crown-layer.ts. Every word above the marker
 * is preserved verbatim (append invariant checked). Preview by default;
 * `--write` applies. Idempotent: a second run finds the layer already in
 * place and writes nothing.
 */
const write = process.argv.includes("--write");
const db = getPrismaClient();

async function main() {
  const entry = await db.storyEntry.findUniqueOrThrow({ where: { slug: "kingdom-management" }, select: { id: true, body: true, version: true } });
  const body = entry.body ?? "";
  const markers = [KINGDOM_CROWN_LAYER.marker, ...OLD_CROWN_MARKERS];
  const found = markers.map((marker) => body.indexOf(marker)).filter((at) => at !== -1);
  if (!found.length) { console.error("No design-layer marker found on kingdom-management; refusing to guess where the layer starts."); process.exit(1); }
  const at = Math.min(...found);
  const preserved = body.slice(0, at).trimEnd();
  const next = `${preserved}\n\n${KINGDOM_CROWN_LAYER.body}`;
  if (!next.startsWith(preserved)) throw new Error("append invariant violated");
  if (next === body) { console.log("kingdom-management: the crown layer is already in place; nothing to write."); await db.$disconnect(); return; }
  const before = body.split(/\s+/).length;
  const after = next.split(/\s+/).length;
  console.log(`${write ? "WRITING" : "PREVIEW"} kingdom-management: replace the design layer from "${markers.find((m) => body.indexOf(m) === at)}" (${before} → ${after} words; ${preserved.split(/\s+/).length} words above the marker untouched)`);
  if (write) {
    await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 } } });
    console.log(`  written; version ${entry.version} → ${entry.version + 1}`);
  }
  await db.$disconnect();
}

main().catch((error) => { console.error(error); process.exit(1); });
