/**
 * Brings the live `professions` dossier up to the nine trades and the
 * owner's progression ruling of 2026-08-31 (use, gated by a licence).
 *
 * The entry is two pieces: a seeded base written before the character bible
 * existed, and the bible's nine-trade design layer appended below a marker.
 * The base is the stale half — it still says "smithing" and "infuser-tech",
 * neither of which is a trade — so this rewrites the base and leaves the
 * appended layer byte-identical, which it verifies before writing.
 *
 * Dry run by default; pass --apply to write.
 */

import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { storySystemsSeed } from "../lib/story-systems-seed";
import { layers } from "./lib/character-bible";

const db = getPrismaClient();

const DESIGN_MARKER = "## Designed";
const apply = process.argv.includes("--apply");

async function main() {
  const seed = storySystemsSeed.find((entry) => entry.slug === "professions");
  if (!seed) throw new Error("no professions seed — the corrected text is missing");
  const bibleLayer = layers.find((entry) => entry.slug === "professions");
  if (!bibleLayer) throw new Error("no professions layer in the character bible source");

  const entry = await db.storyEntry.findUnique({
    where: { slug: "professions" },
    select: { id: true, body: true, summary: true, meta: true, version: true },
  });
  if (!entry) throw new Error("no professions entry in the codex");

  const body = entry.body ?? "";
  const at = body.indexOf(DESIGN_MARKER);
  const oldLayer = at >= 0 ? body.slice(at) : "";
  if (at < 0) console.warn("! no design layer found — writing base + fresh layer");

  // Both halves rebuild from source: the seed base, and the bible's design
  // layer — the latter carries the owner's four-rung ruling now, so the
  // stored copy is replaced rather than preserved. A word-level loss report
  // (the integrate script's own discipline) shows what the replacement drops.
  const layer = bibleLayer.append.trimStart();
  const nextBody = `${seed.body.trimEnd()}\n\n${layer}`;

  const words = (value: string) => new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3));
  const now = words(nextBody);
  const lost = [...words(body)].filter((word) => !now.has(word));
  if (lost.length) console.warn(`! words not carried: ${lost.join(", ")}`);

  const currentMeta = (entry.meta as Record<string, unknown>) ?? {};
  const seedMeta = seed.meta as Record<string, unknown>;
  const nextMeta = {
    ...currentMeta,
    pillars: seedMeta.pillars,
    openQuestions: seedMeta.openQuestions,
  };

  const changedBody = entry.body !== nextBody;
  const changedSummary = entry.summary !== seed.summary;
  const changedMeta = JSON.stringify(currentMeta) !== JSON.stringify(nextMeta);

  console.log("professions dossier");
  console.log(`  body     ${changedBody ? `${body.length} -> ${nextBody.length} chars` : "unchanged"}`);
  console.log(`  summary  ${changedSummary ? "rewritten from the seed" : "unchanged"}`);
  console.log(`  meta     ${changedMeta ? "pillars + open questions updated" : "unchanged"}`);
  console.log(`  layer    ${oldLayer.length} -> ${layer.length} chars, rebuilt from the bible source`);

  if (!changedBody && !changedSummary && !changedMeta) return console.log("\nnothing to do.");
  if (!apply) return console.log("\ndry run — pass --apply to write.");

  await db.storyEntry.update({
    where: { id: entry.id },
    data: { body: nextBody, summary: seed.summary, meta: nextMeta as never, version: { increment: 1 } },
  });
  console.log("\nwritten.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
