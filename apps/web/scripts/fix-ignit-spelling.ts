import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

/**
 * Corrects the island's name across stored content.
 *
 * The island was written as "Igit" everywhere, and a name-evidence pass in the
 * cinematics tree concluded from frequency alone that it must therefore be
 * canonical. It was not — the owner's spelling is **Ignit**, and the frequency
 * only ever proved the misspelling was consistent.
 *
 * "Starting Island" is corrected too, but only where it is used as a *name*:
 * it was the placeholder the island carried before it had one. The export
 * slugs `the-starting-island` and `martino-starting-island` are frozen
 * identities and are deliberately left alone — renaming a slug breaks the
 * export contract and every [[link]] pointing at it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/fix-ignit-spelling.ts
 *   pnpm --filter @habitat/web exec tsx scripts/fix-ignit-spelling.ts --apply
 */

/** Ordered: the longer phrase first, so it is not half-rewritten by the second. */
const substitutions: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bStarting Island Tactical Atlas\b/g, "Ignit Island Tactical Atlas"],
  [/\bIgit\b/g, "Ignit"],
];

function corrected(value: string) {
  return substitutions.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

/** Walks a metadata blob, correcting strings and leaving structure untouched. */
function correctedJson(value: unknown): unknown {
  if (typeof value === "string") return corrected(value);
  if (Array.isArray(value)) return value.map(correctedJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, correctedJson(item)]));
  }
  return value;
}

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const changes: string[] = [];

  const entries = await db.storyEntry.findMany({ select: { id: true, slug: true, title: true, summary: true, body: true, meta: true } });
  for (const entry of entries) {
    const title = corrected(entry.title);
    const summary = entry.summary === null ? null : corrected(entry.summary);
    const body = entry.body === null ? null : corrected(entry.body);
    const meta = correctedJson(entry.meta);
    const metaMoved = JSON.stringify(meta) !== JSON.stringify(entry.meta);
    if (title === entry.title && summary === entry.summary && body === entry.body && !metaMoved) continue;
    const fields = [
      title !== entry.title ? "title" : null,
      summary !== entry.summary ? "summary" : null,
      body !== entry.body ? "body" : null,
      metaMoved ? "meta" : null,
    ].filter(Boolean);
    changes.push(`entry ${entry.slug} (${fields.join(", ")})`);
    if (!apply) continue;
    // `meta` is only sent when it actually changed. Passing it unconditionally
    // writes JSON `null` for an entry that has none, which the
    // StoryEntry_meta_is_object check constraint correctly refuses.
    await db.storyEntry.update({
      where: { id: entry.id },
      data: {
        title,
        summary,
        body,
        ...(metaMoved ? { meta: meta as Prisma.InputJsonValue } : {}),
        version: { increment: 1 },
      },
    });
  }

  const arcs = await db.storyArc.findMany({ select: { id: true, slug: true, title: true, hook: true } });
  for (const arc of arcs) {
    const title = corrected(arc.title);
    const hook = arc.hook === null ? null : corrected(arc.hook);
    if (title === arc.title && hook === arc.hook) continue;
    changes.push(`arc ${arc.slug}`);
    if (!apply) continue;
    await db.storyArc.update({ where: { id: arc.id }, data: { title, hook } });
  }

  const maps = await db.storyMap.findMany({ select: { id: true, slug: true, title: true } });
  for (const map of maps) {
    const title = corrected(map.title);
    if (title === map.title) continue;
    changes.push(`map ${map.slug}: "${map.title}" -> "${title}"`);
    if (!apply) continue;
    await db.storyMap.update({ where: { id: map.id }, data: { title } });
  }

  console.log(JSON.stringify({
    database: identity[0]?.database,
    mode: apply ? "APPLY" : "PREVIEW",
    changed: changes.length,
    changes,
  }, null, 2));
}

main().finally(() => db.$disconnect());
