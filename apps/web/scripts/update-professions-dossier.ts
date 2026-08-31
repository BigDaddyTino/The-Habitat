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

const db = getPrismaClient();

const DESIGN_MARKER = "## Designed";
const apply = process.argv.includes("--apply");

async function main() {
  const seed = storySystemsSeed.find((entry) => entry.slug === "professions");
  if (!seed) throw new Error("no professions seed — the corrected text is missing");

  const entry = await db.storyEntry.findUnique({
    where: { slug: "professions" },
    select: { id: true, body: true, summary: true, meta: true, version: true },
  });
  if (!entry) throw new Error("no professions entry in the codex");

  const body = entry.body ?? "";
  const at = body.indexOf(DESIGN_MARKER);
  const layer = at >= 0 ? body.slice(at) : "";
  if (at < 0) console.warn("! no design layer found — writing the base alone");

  const nextBody = layer ? `${seed.body.trimEnd()}\n\n${layer}` : seed.body;

  // The bible's nine-trade layer is canon and must survive untouched.
  if (layer && !nextBody.endsWith(layer)) throw new Error("the design layer would not survive this rewrite — refusing");

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
  console.log(`  summary  ${changedSummary ? "rewritten to name the nine trades" : "unchanged"}`);
  console.log(`  meta     ${changedMeta ? "pillars + open questions updated (the answered one retired)" : "unchanged"}`);
  console.log(`  layer    ${layer ? `${layer.length} chars preserved verbatim` : "none"}`);

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
