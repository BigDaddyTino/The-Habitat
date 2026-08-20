import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { bodyPatches, compactSeed, factionAssignments, factionMapRewrite, independentPowers, legionBodyPatch, majorPowers } from "../lib/story-factions-seed";
import { factionMetaSchema } from "../lib/story-meta-schemas";

/**
 * Draws the shape of power: ten banners, twenty-one wings, four powers that
 * answer to nobody — and writes what each filing means into the dossiers
 * themselves, in each faction's own voice.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-faction-hierarchy.ts
 *   pnpm --filter @habitat/web exec tsx scripts/seed-faction-hierarchy.ts --apply
 *
 * Dry run by default, and idempotent throughout. A faction already flying the
 * banner the table names is left alone; a faction a writer has filed somewhere
 * else is never overruled; a paragraph already present is never added twice;
 * and every sheet is re-validated through the schema that edits it before
 * anything is written — a seed is not a way around the sheet.
 */
const db = getPrismaClient();

const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

/** A faction sheet with nothing decided — what a null-meta row becomes. */
const emptySheet = {
  scope: null,
  parent: null,
  independent: false,
  power: null,
  seat: null,
  leaders: [],
  relations: [],
  goals: [],
  gameTag: null,
  openQuestions: [],
};

/**
 * Slots a paragraph in before a dossier's closing paragraph.
 *
 * Every faction body in the bible ends on its "Where they stand on the Drain"
 * note — the entry's last word on the collapse — and a filing paragraph
 * belongs before that, not after it. The insertion is positional rather than
 * text-matched because one entry uses "Where *it* stands", and because a
 * writer is free to rephrase that heading without breaking this.
 */
function insertBeforeClosing(body: string, paragraph: string) {
  const paragraphs = body.trim().split("\n\n");
  if (paragraphs.length < 2) return [...paragraphs, paragraph].join("\n\n");
  paragraphs.splice(paragraphs.length - 1, 0, paragraph);
  return paragraphs.join("\n\n");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));

  let written = 0;
  let already = 0;

  // --- 1. the one new power -------------------------------------------------
  console.log("THE NEW POWER");
  const existingCompact = await db.storyEntry.findUnique({ where: { slug: compactSeed.slug }, select: { id: true, title: true } });
  if (existingCompact) {
    already += 1;
    console.log(`  ok     ${existingCompact.title} — already written`);
  } else {
    const sheet = factionMetaSchema.safeParse(compactSeed.meta);
    if (!sheet.success) throw new Error("The Compact's sheet does not validate — fix the seed before running this.");
    console.log(`  ${apply ? "writing" : "would write"} ${compactSeed.title} — ${compactSeed.summary.slice(0, 96)}…`);
    if (apply) {
      await db.$transaction(async (tx) => {
        const entry = await tx.storyEntry.create({
          data: {
            kind: "FACTION",
            slug: compactSeed.slug,
            title: compactSeed.title,
            summary: compactSeed.summary,
            body: compactSeed.body,
            status: "CANON",
            meta: sheet.data as unknown as Prisma.InputJsonValue,
            createdByUserId: author.id,
          },
        });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY",
            entityId: entry.id,
            action: "CREATED",
            actorUserId: author.id,
            summary: `Founded the power "${compactSeed.title}" — five free peoples, one article`,
            after: { kind: "FACTION", title: compactSeed.title, summary: compactSeed.summary },
          },
        });
      });
    }
    written += 1;
  }

  // --- 2. the filing --------------------------------------------------------
  console.log("\nTHE FILING");
  const factions = new Map(
    (await db.storyEntry.findMany({ where: { kind: "FACTION", status: { in: [...workingStatuses] } }, select: { slug: true, title: true } }))
      .map((row) => [row.slug, row.title]),
  );
  // The Compact is written above; in a dry run it is not in the map yet, but
  // its wings still have to be shown as filable.
  if (!factions.has(compactSeed.slug)) factions.set(compactSeed.slug, compactSeed.title);

  for (const assignment of factionAssignments) {
    const entry = await db.storyEntry.findUnique({ where: { slug: assignment.faction }, select: { id: true, kind: true, title: true, meta: true } });
    if (!entry || entry.kind !== "FACTION") { console.log(`  skip   ${assignment.faction} — no such faction`); continue; }

    // A banner nobody has written is the one thing this must never write: it
    // would read as a link and resolve to nothing.
    if (!factions.has(assignment.parent)) { console.log(`  skip   ${entry.title} — ${assignment.parent} is not a faction in the bible`); continue; }

    // A row that has never had a sheet gets a whole one, the same shape the
    // editor composes. Anything else is validated before it is touched.
    const current = entry.meta === null
      ? factionMetaSchema.safeParse(emptySheet)
      : factionMetaSchema.safeParse(entry.meta);
    if (!current.success) { console.log(`  skip   ${entry.title} — its sheet does not validate; fix it by hand first`); continue; }

    const standing = current.data.parent;
    if (standing === assignment.parent) { already += 1; console.log(`  ok     ${entry.title} — already flies ${factions.get(assignment.parent)}`); continue; }
    if (standing) {
      // A writer has filed this somewhere by hand. The table is a proposal,
      // never an override.
      console.log(`  skip   ${entry.title} — a writer already filed it under ${standing}; leaving it`);
      continue;
    }

    const next = factionMetaSchema.safeParse({ ...current.data, parent: assignment.parent });
    if (!next.success) { console.log(`  skip   ${entry.title} — the result would not validate`); continue; }

    console.log(`  ${apply ? "filing" : "would file"} ${entry.title} under ${factions.get(assignment.parent)}  [${assignment.tier}]`);
    console.log(`         because ${assignment.because}`);
    if (!apply) { written += 1; continue; }

    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({
        where: { id: entry.id },
        data: { meta: next.data as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id },
      });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Filed "${entry.title}" under ${factions.get(assignment.parent)}`.slice(0, 300),
          before: { parent: standing },
          after: { parent: assignment.parent, tier: assignment.tier, because: assignment.because },
        },
      });
    });
    written += 1;
  }

  // --- 3. what the filing means, in each faction's own voice ----------------
  console.log("\nWHAT IT MEANS, WRITTEN DOWN");
  for (const patch of bodyPatches) {
    const entry = await db.storyEntry.findUnique({ where: { slug: patch.slug }, select: { id: true, title: true, body: true } });
    if (!entry) { console.log(`  skip   ${patch.slug} — no such entry`); continue; }
    if (!entry.body) { console.log(`  skip   ${entry.title} — no dossier written yet to add to`); continue; }
    if (entry.body.includes(patch.guard)) { already += 1; console.log(`  ok     ${entry.title} — ${patch.note} already written`); continue; }

    const body = insertBeforeClosing(entry.body, patch.paragraph);
    console.log(`  ${apply ? "writing" : "would write"} ${entry.title} — ${patch.note}`);
    console.log(`         "${patch.paragraph.slice(0, 108)}…"`);
    if (!apply) { written += 1; continue; }

    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: entry.id }, data: { body, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Wrote into "${entry.title}": ${patch.note}`.slice(0, 300),
          before: { body: entry.body },
          after: { body },
        },
      });
    });
    written += 1;
  }

  // --- 4. the sentence the filing settled -----------------------------------
  const legion = await db.storyEntry.findUnique({ where: { slug: legionBodyPatch.slug }, select: { id: true, title: true, body: true } });
  if (!legion) {
    console.log(`\n  skip   ${legionBodyPatch.slug} — no such faction, so nothing to record`);
  } else if (!legion.body?.includes(legionBodyPatch.from)) {
    already += 1;
    console.log(`\n  ok     ${legion.title} — the open question is already answered or rewritten; leaving the prose alone`);
  } else {
    console.log(`\n  ${apply ? "recording" : "would record"} the decision in ${legion.title}'s own prose:`);
    console.log(`         was  ${legionBodyPatch.from}`);
    console.log(`         now  ${legionBodyPatch.to}`);
    if (apply) {
      const body = legion.body.replace(legionBodyPatch.from, legionBodyPatch.to);
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({ where: { id: legion.id }, data: { body, version: { increment: 1 }, updatedByUserId: author.id } });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY",
            entityId: legion.id,
            action: "UPDATED",
            actorUserId: author.id,
            summary: "Settled what the Legion is to the Court: its instrument",
            before: { body: legion.body },
            after: { body },
          },
        });
      });
    }
    written += 1;
  }

  // --- 5. the map, redrawn --------------------------------------------------
  console.log("\nTHE MAP");
  const map = await db.storyEntry.findUnique({ where: { slug: factionMapRewrite.slug }, select: { id: true, title: true, body: true, summary: true } });
  if (!map) {
    console.log(`  skip   ${factionMapRewrite.slug} — no such entry`);
  } else if (!map.body?.includes(factionMapRewrite.guard)) {
    already += 1;
    console.log(`  ok     ${map.title} — already redrawn, or rewritten by hand since`);
  } else {
    console.log(`  ${apply ? "redrawing" : "would redraw"} ${map.title} — the six lists become ten banners, their wings, and four that answer to nobody`);
    console.log(`         the law goes to the top: "Major does not mean important."`);
    if (apply) {
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({
          where: { id: map.id },
          data: { summary: factionMapRewrite.summary, body: factionMapRewrite.body, version: { increment: 1 }, updatedByUserId: author.id },
        });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY",
            entityId: map.id,
            action: "UPDATED",
            actorUserId: author.id,
            summary: "Redrew the faction map around majors, wings, and the four that answer to nobody",
            before: { summary: map.summary, body: map.body },
            after: { summary: factionMapRewrite.summary, body: factionMapRewrite.body },
          },
        });
      });
    }
    written += 1;
  }

  // --- the shape, for the record --------------------------------------------
  console.log(`\nTHE TEN BANNERS`);
  for (const row of majorPowers) console.log(`  ${row.faction} — ${row.because}`);
  console.log(`\nANSWERING TO NOBODY`);
  for (const row of independentPowers) console.log(`  ${row.faction} — ${row.because}`);

  console.log(`\nauthor: ${author.username}`);
  console.log(`${apply ? `wrote ${written} change(s)` : `${written} change(s) would be made`}; ${already} already in place.`);
  if (!apply && written > 0) console.log("Nothing was written. Re-run with --apply.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
