import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { storyProseLinkLabel, unwrittenLinkLabel } from "../lib/story-prose";

/** Verifies every authored article immediately before a Codex link renders once. */
const db = getPrismaClient();
const ARTICLE_LINK = /\b(a|an|the)\s+(?:\*{1,2})?\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/gi;

async function main() {
  const [entries, arcs, nodes] = await Promise.all([
    db.storyEntry.findMany({ select: { slug: true, title: true, summary: true, body: true } }),
    db.storyArc.findMany({ select: { slug: true, title: true, summary: true, hook: true } }),
    db.storyNode.findMany({ select: { key: true, title: true, summary: true, body: true } }),
  ]);
  const titles = new Map([...entries, ...arcs].map((row) => [row.slug, row.title]));
  const sources = [
    ...entries.flatMap((row) => [[`${row.slug}.summary`, row.summary], [`${row.slug}.body`, row.body]] as const),
    ...arcs.flatMap((row) => [[`${row.slug}.summary`, row.summary], [`${row.slug}.hook`, row.hook]] as const),
    ...nodes.flatMap((row) => [[`${row.key}.summary`, row.summary], [`${row.key}.body`, row.body]] as const),
  ];
  const failures: string[] = [];
  let corrected = 0;
  for (const [source, prose] of sources) {
    if (!prose) continue;
    for (const match of prose.matchAll(ARTICLE_LINK)) {
      corrected += 1;
      const article = match[1].toLowerCase();
      const slug = match[2];
      const label = storyProseLinkLabel(titles.get(slug) ?? unwrittenLinkLabel(slug), true);
      if (/^the\s+/i.test(label)) failures.push(`${source}: ${article} + ${label}`);
    }
  }
  if (failures.length) throw new Error(`Doubled articles still render:\n${failures.join("\n")}`);
  console.log(JSON.stringify({ ok: true, articleBeforeLinkInstances: corrected, doubledArticlesRendered: 0 }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());

