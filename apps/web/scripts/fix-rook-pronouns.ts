import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

/**
 * Rook's own dossier says it plainly: "Pronouns, face, age, background —
 * deliberately open for the writers' room." Most of the codex honours that and
 * writes them as they/them. Three places had quietly settled the question as
 * she/her — Rook's own sheet, the soul-binding dossier, and a region note —
 * which closes an open question by accident rather than by anybody deciding.
 *
 * This is not a style pass. An open question is a piece of canon, and a
 * pronoun that leaks into the prose is the writers' room losing a decision it
 * meant to keep.
 *
 * Preview by default; --apply writes.
 */

const db = getPrismaClient();

type Fix = { find: string; replace: string };

const entryFixes: Record<string, Fix[]> = {
  "soul-binding": [
    { find: "gets no answer she can use", replace: "gets no answer they can use" },
    { find: "her first question is not about the battle", replace: "their first question is not about the battle" },
    { find: "The answers characterise them and she reads each one", replace: "The answers characterise them and they read each one" },
    {
      find: "Then she walks them to the camp's Forge and binds them herself, on the reasoning that anyone who might stay and hold this island is no use to her unbound.",
      replace: "Then they walk the party to the camp's Forge and bind them personally, on the reasoning that anyone who might stay and hold this island is no use to them unbound.",
    },
    { find: "Only then does she take them to the operations table.", replace: "Only then do they take the party to the operations table." },
  ],
  "the-kestrel-commander": [
    { find: "Before anything else at [[forward-camp-kestrel]] she asks the party", replace: "Before anything else at [[forward-camp-kestrel]] they ask the party" },
    {
      find: "Then she walks them to the camp's Soul Forge and binds them herself, on the reasoning that anyone who might stay and hold this island is no use to her unbound.",
      replace: "Then they walk the party to the camp's Soul Forge and bind them personally, on the reasoning that anyone who might stay and hold this island is no use to them unbound.",
    },
    { find: "they ask the party **where they are bound** — and reads the answer", replace: "they ask the party **where they are bound** — and read the answer" },
    { find: "because to her that is a person walking a front line", replace: "because to them that is a person walking a front line" },
    { find: "an inference she will neither confirm nor take away from them", replace: "an inference they will neither confirm nor take away from them" },
  ],
};

/** meta is jsonb, so the region note is repaired through its serialised form. */
const metaFixes: Record<string, Fix[]> = {
  "soul-binding": [
    { find: "Rook performs it herself after asking where the party is bound.", replace: "Rook performs it personally after asking where the party is bound." },
  ],
};

const nodeFixes: Record<string, Fix[]> = {
  // Written by this session's own step-7 pass, and wrong the same way.
  "tutorial-complete": [{ find: "She does not start with the map.", replace: "They do not start with the map." }],
};

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  let applied = 0;
  let missing = 0;

  for (const [slug, fixes] of Object.entries(entryFixes)) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, body: true, meta: true } });
    if (!entry) throw new Error(`No entry "${slug}".`);
    let body = entry.body ?? "";
    let changed = 0;
    for (const fix of fixes) {
      if (!body.includes(fix.find)) {
        if (!body.includes(fix.replace)) { console.log(`  MISSING  ${slug}: ${fix.find.slice(0, 60)}…`); missing += 1; }
        continue;
      }
      body = body.split(fix.find).join(fix.replace);
      changed += 1;
    }
    let meta = entry.meta;
    let metaChanged = 0;
    for (const fix of metaFixes[slug] ?? []) {
      const serialised = JSON.stringify(meta ?? {});
      if (!serialised.includes(fix.find)) {
        if (!serialised.includes(fix.replace)) { console.log(`  MISSING  ${slug} meta: ${fix.find.slice(0, 60)}…`); missing += 1; }
        continue;
      }
      meta = JSON.parse(serialised.split(fix.find).join(fix.replace)) as Prisma.JsonValue;
      metaChanged += 1;
    }
    if (!changed && !metaChanged) { console.log(`  ${slug.padEnd(24)} already they/them`); continue; }
    applied += changed + metaChanged;
    console.log(`  ${slug.padEnd(24)} ${changed} in the body, ${metaChanged} in the sheet`);
    if (apply) {
      await db.storyEntry.update({ where: { id: entry.id }, data: { body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: "Rook's pronouns are an open question; the prose had quietly settled it" } });
    }
  }

  for (const [key, fixes] of Object.entries(nodeFixes)) {
    const node = await db.storyNode.findFirst({ where: { key }, select: { id: true, body: true } });
    if (!node) throw new Error(`No node "${key}".`);
    let body = node.body ?? "";
    let changed = 0;
    for (const fix of fixes) {
      if (!body.includes(fix.find)) {
        if (!body.includes(fix.replace)) { console.log(`  MISSING  node ${key}: ${fix.find.slice(0, 60)}…`); missing += 1; }
        continue;
      }
      body = body.split(fix.find).join(fix.replace);
      changed += 1;
    }
    if (!changed) { console.log(`  node ${key.padEnd(19)} already they/them`); continue; }
    applied += changed;
    console.log(`  node ${key.padEnd(19)} ${changed} in the body`);
    if (apply) {
      await db.storyNode.update({ where: { id: node.id }, data: { body, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "NODE", entityId: node.id, action: "UPDATED", actorUserId: actor.id, summary: "Rook's pronouns are an open question; the prose had quietly settled it" } });
    }
  }

  console.log(`\n${applied} replacement${applied === 1 ? "" : "s"}${missing ? `, ${missing} anchor(s) NOT FOUND — check before trusting this run` : ""}.`);
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
