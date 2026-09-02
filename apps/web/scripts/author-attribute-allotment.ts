import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { attributeNames, classAllotments, creationRules, startingRungs } from "../lib/character-sheet";
import { talentClasses } from "../lib/talent-trees";

/**
 * Writes the per-class starting allotment into the `attributes` codex entry.
 *
 * The dossier's "Starting allocation at enlistment" section was integrated on
 * 2026-08-31 with the table left open — "TBD — ask Tino" — and on 2026-09-02
 * the owner delegated the call (Docs/codex/PLAY_RULINGS_2026-09-02.md, §4).
 * This replaces exactly that paragraph and retires the matching open
 * question. The table is generated from lib/character-sheet.ts so the page
 * and the dossier can never disagree.
 *
 * Preview by default; `--write` applies. Idempotent: a second run finds its
 * own marker and rewrites the same block. Refuses to guess — if neither the
 * TBD paragraph nor the marker is found verbatim, nothing is written.
 */
const write = process.argv.includes("--write");
const db = getPrismaClient();

const TBD = "The exact base total and default allotment for each class are TBD — ask Tino. Do not invent that table from later growth bonuses.";
const MARKER_START = "**The allotment (ruled 2026-09-02).**";
const MARKER_END = "_The table is generated from the Play section's character sheet, so the page and this dossier cannot disagree._";
const abbreviation: Record<string, string> = { Conditioning: "Cond", Coordination: "Coor", Resilience: "Res", Acuity: "Acu", Composure: "Comp", Conductivity: "Cndv" };
const OPEN_QUESTION = "Exact per-class base attribute total and default allotment for each Eight Trees class: TBD — ask Tino.";

function block(): string {
  const rows = classAllotments.map((entry) => {
    const tree = talentClasses.find((candidate) => candidate.slug === entry.classSlug);
    const rungs = startingRungs(entry.classSlug)!;
    return `| ${tree?.name ?? entry.classSlug} | ${attributeNames.map((name) => rungs[name]).join(" · ")} | ${entry.primary} 3 · ${entry.secondary} 2 |`;
  });
  return [
    `${MARKER_START} Every class signs the file with **${creationRules.baseTotal} rungs, shaped 3 · 2 · 1 · 1 · 1 · 1**: 3 in the primary — the attribute the class's growth drives first — 2 in the secondary, and 1 in each of the other four, so nobody starts at 0 in anything and no Dying clock starts at nothing. The player's ${creationRules.freePoints} points go anywhere a species ceiling allows, with **nothing above ${creationRules.deskCap} at the desk** unless a species says so (the Chartered's Specification puts one at 5, the top of the recruit band); the single ${creationRules.reassign}-point reassignment moves between class-allotted attributes only. Origin adds its rung on top — None a Composure, Born a Conductivity, Gifted whatever the giver chose, Infused nothing but the Tremor. A recruit signs at level 11 or 12, inside the 7-to-14 band, and quotes at about 165 Essence. The 3/2 split is small on purpose: two points and one move can tilt a class toward its secondary, which is the head-start-not-a-lock law applied to numbers.`,
    "",
    `| Class | ${attributeNames.map((name) => abbreviation[name]).join(" · ")} | Primary · secondary |`,
    "| --- | --- | --- |",
    ...rows,
    MARKER_END,
  ].join("\n");
}

async function main() {
  const entry = await db.storyEntry.findUniqueOrThrow({ where: { slug: "attributes" }, select: { id: true, body: true, meta: true, version: true } });
  const body = entry.body ?? "";
  let next: string;
  if (body.includes(MARKER_START) && body.includes(MARKER_END)) {
    const start = body.indexOf(MARKER_START);
    const end = body.indexOf(MARKER_END) + MARKER_END.length;
    next = body.slice(0, start) + block() + body.slice(end);
  } else if (body.includes(TBD)) {
    next = body.replace(TBD, block());
  } else {
    console.error("Neither the TBD paragraph nor the ruling marker was found verbatim; refusing to guess.");
    process.exit(1);
  }

  const meta = (entry.meta ?? {}) as Record<string, unknown>;
  const openQuestions = Array.isArray(meta.openQuestions) ? (meta.openQuestions as string[]) : [];
  const nextQuestions = openQuestions.filter((question) => question !== OPEN_QUESTION);
  const metaChanged = nextQuestions.length !== openQuestions.length;

  console.log(write ? "WRITING attributes" : "PREVIEW attributes (add --write to apply)");
  console.log(`  body: ${body.length} → ${next.length} chars; open questions: ${openQuestions.length} → ${nextQuestions.length}`);
  console.log("  ---- the block ----");
  console.log(block().split("\n").map((line) => `  ${line}`).join("\n"));
  if (!write) { await db.$disconnect(); return; }

  await db.storyEntry.update({
    where: { id: entry.id },
    data: {
      body: next,
      version: { increment: 1 },
      // Only send meta when it actually changed: a JSON null trips the
      // StoryEntry_meta_is_object check.
      ...(metaChanged ? { meta: { ...meta, openQuestions: nextQuestions } } : {}),
    },
  });
  console.log(`  written; version ${entry.version} → ${entry.version + 1}`);
  await db.$disconnect();
}

main().catch((error) => { console.error(error); process.exit(1); });
