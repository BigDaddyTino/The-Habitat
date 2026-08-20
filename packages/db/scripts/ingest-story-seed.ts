/**
 * One-time ingest of the Martino prologue and world bible into the Story
 * Codex, from seed files written in the export's own shape.
 *
 * Run from packages/db:
 *   DOTENV_CONFIG_PATH=../../.env npx tsx scripts/ingest-story-seed.ts <prologue.json> <world-bible.json>
 *
 * Refuses to run unless the codex is completely empty — this is a seed, not a
 * sync, and re-running it against live content would be exactly the kind of
 * half-understood import the export contract exists to prevent. Everything
 * lands CANON (it is lifted verbatim from the production plan, already
 * reviewed), keys and slugs are preserved exactly (they are the identity the
 * Unreal importer matches assets on), and every row gets a real revision so
 * the activity feed and the export cursor tell the truth about when canon
 * arrived.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { getPrismaClient, type Prisma } from "../src/client";

type SeedChoice = { order: number; label: string | null; condition: string | null; toKey: string };
type SeedNode = {
  key: string;
  kind: "BEAT" | "SCENE" | "DIALOGUE" | "CHOICE" | "CONDITION" | "QUEST_START" | "QUEST_STEP" | "ENDING";
  title: string;
  summary: string | null;
  body: string | null;
  completion?: string | null;
  continuesInArc?: string | null;
  choices: SeedChoice[];
  references: Array<{ kind: string; slug: string; title: string }>;
};
type SeedArc = { slug: string; title: string; summary: string | null; hook?: string | null; region?: string | null; isMainline: boolean; entryNodeKeys: string[]; nodes: SeedNode[] };
type SeedEntry = {
  kind: "THEME" | "REGION" | "CREATURE" | "CHARACTER" | "FACTION" | "ITEM" | "EVENT" | "RULE";
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  meta?: unknown;
};
type SeedFile = { contractVersion: number; arcs: SeedArc[]; bible: SeedEntry[] };

/** Ingest decisions supplied alongside the files, not invented here. */
const speakersByNodeKey: Record<string, string> = {
  "tino-drives": "tino",
  "what-hunts-like-that": "the-kestrel-commander",
};
const endingKindsByNodeKey: Record<string, "SUCCESS" | "FAILURE" | "NEUTRAL"> = {
  "hold-the-line": "NEUTRAL",
  "the-boats": "NEUTRAL",
  "the-sea-takes-the-island": "SUCCESS",
  "wake-of-the-island": "SUCCESS",
  "bind-to-arcadia": "SUCCESS",
};

const keyShape = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message: string): never {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

const [prologuePath, worldBiblePath] = process.argv.slice(2);
if (!prologuePath || !worldBiblePath) fail("usage: ingest-story-seed.ts <prologue.json> <world-bible.json>");

const prologue = JSON.parse(readFileSync(prologuePath, "utf8")) as SeedFile;
const worldBible = JSON.parse(readFileSync(worldBiblePath, "utf8")) as SeedFile;
if (prologue.contractVersion !== 1 || worldBible.contractVersion !== 1) fail("seed files must be contract version 1");

// The two files' bible arrays merge on slug and must be disjoint.
const entries: SeedEntry[] = [...prologue.bible, ...worldBible.bible];
const entrySlugs = new Set<string>();
for (const entry of entries) {
  if (!keyShape.test(entry.slug)) fail(`entry slug "${entry.slug}" is not a valid key`);
  if (entrySlugs.has(entry.slug)) fail(`entry slug "${entry.slug}" appears in both files`);
  entrySlugs.add(entry.slug);
}

const arcs = prologue.arcs;
if (worldBible.arcs.length > 0) fail("world-bible.json is expected to carry bible entries only");
const arcSlugs = new Set(arcs.map((arc) => arc.slug));
for (const arc of arcs) {
  if (!keyShape.test(arc.slug)) fail(`arc slug "${arc.slug}" is not a valid key`);
  if (arc.region && !entrySlugs.has(arc.region)) fail(`${arc.slug} names missing pickup region "${arc.region}"`);
  const keys = new Set(arc.nodes.map((node) => node.key));
  if (keys.size !== arc.nodes.length) fail(`duplicate node keys in ${arc.slug}`);
  for (const node of arc.nodes) {
    if (!keyShape.test(node.key)) fail(`node key "${node.key}" is not a valid key`);
    for (const choice of node.choices) {
      if (!keys.has(choice.toKey)) fail(`${arc.slug}/${node.key} points at missing node "${choice.toKey}"`);
      if (choice.label !== null && choice.label.trim().length === 0) fail(`${arc.slug}/${node.key} has a blank choice label`);
    }
    if (node.continuesInArc && node.kind !== "ENDING") fail(`${arc.slug}/${node.key} continues into another arc but is not an ENDING`);
    if (node.continuesInArc && !arcSlugs.has(node.continuesInArc)) fail(`${arc.slug}/${node.key} continues into missing arc "${node.continuesInArc}"`);
    for (const reference of node.references) {
      if (!entrySlugs.has(reference.slug)) fail(`${arc.slug}/${node.key} references missing entry "${reference.slug}"`);
    }
  }
}
for (const [nodeKey, speakerSlug] of Object.entries(speakersByNodeKey)) {
  if (!entrySlugs.has(speakerSlug)) fail(`speaker entry "${speakerSlug}" for node "${nodeKey}" is missing`);
}

const db = getPrismaClient();

async function main() {
  const [arcCount, entryCount] = await Promise.all([db.storyArc.count(), db.storyEntry.count()]);
  if (arcCount > 0 || entryCount > 0) fail(`the codex is not empty (${arcCount} arcs, ${entryCount} entries) — this script only seeds an empty codex`);

  const actor = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true, displayName: true, name: true } });
  if (!actor) fail("no ADMIN user exists to own the seeded canon");

  // Creation timestamps are staggered deliberately: entry-node ordering in the
  // export is oldest-first (entryNodeKeys[0] is the importer's canonical
  // start), and rows born in one transaction otherwise share one timestamp.
  const base = Date.now() - arcs.length * 500_000;
  let tick = 0;
  const stamp = () => new Date(base + tick++ * 1_000);

  const summaryOf = (title: string) => `Seeded "${title}" from the Martino production plan`;

  await db.$transaction(
    async (tx) => {
      const entryIdBySlug = new Map<string, string>();
      for (const entry of entries) {
        const createdAt = stamp();
        const row = await tx.storyEntry.create({
          data: {
            kind: entry.kind,
            slug: entry.slug,
            title: entry.title,
            summary: entry.summary,
            body: entry.body,
            meta: entry.meta === undefined ? undefined : entry.meta as Prisma.InputJsonValue,
            status: "CANON",
            createdByUserId: actor.id,
            createdAt,
          },
          select: { id: true },
        });
        entryIdBySlug.set(entry.slug, row.id);
        await tx.storyRevision.create({
          data: { entityType: "ENTRY", entityId: row.id, action: "CREATED", actorUserId: actor.id, summary: summaryOf(entry.title) },
        });
      }

      // Create every arc before any node so an ENDING can point across boards
      // even when its target appears later in the seed file.
      const arcIdBySlug = new Map<string, string>();
      for (const [arcIndex, arc] of arcs.entries()) {
        const arcRow = await tx.storyArc.create({
          data: {
            slug: arc.slug,
            title: arc.title,
            summary: arc.summary,
            hook: arc.hook ?? null,
            regionEntryId: arc.region ? entryIdBySlug.get(arc.region) : null,
            isMainline: arc.isMainline,
            // Both columns, always together — the CHECK constraint refuses a
            // row where the boolean and the category disagree.
            category: arc.isMainline ? "MAINLINE" : "SIDE_QUEST",
            status: "CANON",
            position: arcIndex,
            createdByUserId: actor.id,
            createdAt: stamp(),
          },
          select: { id: true },
        });
        arcIdBySlug.set(arc.slug, arcRow.id);
        await tx.storyRevision.create({
          data: { entityType: "ARC", entityId: arcRow.id, arcId: arcRow.id, action: "CREATED", actorUserId: actor.id, summary: summaryOf(arc.title) },
        });
      }

      for (const arc of arcs) {
        const arcId = arcIdBySlug.get(arc.slug) as string;
        const nodeIdByKey = new Map<string, string>();
        for (const [nodeIndex, node] of arc.nodes.entries()) {
          const speakerSlug = speakersByNodeKey[node.key];
          const nodeRow = await tx.storyNode.create({
            data: {
              arcId,
              kind: node.kind,
              key: node.key,
              title: node.title,
              summary: node.summary,
              body: node.body,
              completion: node.kind === "QUEST_STEP" ? (node.completion ?? null) : null,
              status: "CANON",
              speakerEntryId: speakerSlug ? entryIdBySlug.get(speakerSlug) : null,
              endingKind: endingKindsByNodeKey[node.key] ?? null,
              continuesInArcId: node.continuesInArc ? arcIdBySlug.get(node.continuesInArc) : null,
              canvasX: (nodeIndex % 4) * 300,
              canvasY: Math.floor(nodeIndex / 4) * 220,
              createdByUserId: actor.id,
              createdAt: stamp(),
            },
            select: { id: true },
          });
          nodeIdByKey.set(node.key, nodeRow.id);
          await tx.storyRevision.create({
            data: { entityType: "NODE", entityId: nodeRow.id, arcId, action: "CREATED", actorUserId: actor.id, summary: summaryOf(node.title) },
          });

          for (const reference of node.references) {
            const link = await tx.storyEntryLink.create({
              data: { nodeId: nodeRow.id, entryId: entryIdBySlug.get(reference.slug) as string },
              select: { id: true },
            });
            await tx.storyRevision.create({
              data: { entityType: "LINK", entityId: link.id, arcId, action: "LINKED", actorUserId: actor.id, summary: `Seeded "${reference.title}" into "${node.title}"` },
            });
          }
        }

        // Choice keys are minted exactly the way the server action mints them,
        // so seeded branches and board-drawn branches share one naming scheme.
        const takenKeys = new Set<string>();
        for (const node of arc.nodes) {
          for (const [choiceIndex, choice] of [...node.choices].sort((a, b) => a.order - b.order).entries()) {
            const baseKey = `${node.key.slice(0, 66).replace(/-+$/, "")}-choice`;
            let key = baseKey;
            for (let suffix = 2; takenKeys.has(key); suffix += 1) key = `${baseKey}-${suffix}`;
            takenKeys.add(key);

            const edge = await tx.storyEdge.create({
              data: {
                arcId,
                key,
                fromNodeId: nodeIdByKey.get(node.key) as string,
                toNodeId: nodeIdByKey.get(choice.toKey) as string,
                label: choice.label,
                condition: choice.condition,
                position: choiceIndex,
                status: "CANON",
                createdByUserId: actor.id,
                createdAt: stamp(),
              },
              select: { id: true },
            });
            await tx.storyRevision.create({
              data: { entityType: "EDGE", entityId: edge.id, arcId, action: "CREATED", actorUserId: actor.id, summary: `Seeded the branch "${node.title}" → "${choice.toKey}"` },
            });
          }
        }
      }
    },
    { timeout: 180_000, maxWait: 15_000 },
  );

  const [finalArcs, finalNodes, finalEdges, finalEntries, newest] = await Promise.all([
    db.storyArc.count({ where: { status: "CANON" } }),
    db.storyNode.count({ where: { status: "CANON" } }),
    db.storyEdge.count({ where: { status: "CANON" } }),
    db.storyEntry.count({ where: { status: "CANON" } }),
    db.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } }),
  ]);
  console.log(JSON.stringify({ ok: true, actor: actor.displayName ?? actor.name, canonArcs: finalArcs, canonNodes: finalNodes, canonEdges: finalEdges, canonEntries: finalEntries, revisionCursor: newest?.id ?? null }));
}

main()
  .catch((cause) => fail(cause instanceof Error ? cause.message : String(cause)))
  .finally(() => db.$disconnect());
