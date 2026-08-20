/**
 * Adds the first shared mainland campaign board and wires the opening arcs into
 * one structural branch-and-merge. Idempotent and deliberately conservative:
 * existing writer-authored boards are never overwritten, and a continuation
 * already pointing somewhere else aborts instead of silently changing canon.
 *
 * Run from the repository root:
 *   pnpm --filter @habitat/db exec tsx scripts/sync-opening-campaign.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { getPrismaClient } from "../src/client";

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
type SeedArc = {
  slug: string;
  title: string;
  summary: string | null;
  hook?: string | null;
  region?: string | null;
  isMainline: boolean;
  nodes: SeedNode[];
};
type SeedFile = { arcs: SeedArc[] };

const targetSlug = "binding-in-arcadia";
const db = getPrismaClient();
const seed = JSON.parse(readFileSync(new URL("../prisma/story-seed/prologue.json", import.meta.url), "utf8")) as SeedFile;
const target = seed.arcs.find((arc) => arc.slug === targetSlug);
if (!target) throw new Error(`The prologue seed does not contain ${targetSlug}.`);
const targetArc: SeedArc = target;

const desiredContinuations = seed.arcs.flatMap((arc) => arc.nodes.flatMap((node) =>
  node.continuesInArc ? [{ fromArc: arc.slug, fromNode: node.key, toArc: node.continuesInArc }] : [],
));

async function main() {
  const author = await db.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, name: true, username: true },
  });
  if (!author) throw new Error("No active ADMIN exists to own the campaign sync.");

  const result = await db.$transaction(async (tx) => {
    let createdArc = false;
    let arc = await tx.storyArc.findUnique({ where: { slug: targetArc.slug }, select: { id: true } });
    if (!arc) {
      const region = targetArc.region
        ? await tx.storyEntry.findFirst({ where: { slug: targetArc.region, kind: "REGION", status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { id: true } })
        : null;
      if (targetArc.region && !region) throw new Error(`Pickup region ${targetArc.region} does not exist.`);

      const position = seed.arcs.findIndex((candidate) => candidate.slug === targetArc.slug);
      arc = await tx.storyArc.create({
        data: {
          slug: targetArc.slug,
          title: targetArc.title,
          summary: targetArc.summary,
          hook: targetArc.hook ?? null,
          regionEntryId: region?.id ?? null,
          isMainline: true,
          category: "MAINLINE",
          status: "CANON",
          position,
          createdByUserId: author.id,
        },
        select: { id: true },
      });
      await tx.storyRevision.create({
        data: { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Opened the campaign chapter "${targetArc.title}"` },
      });

      const referenceSlugs = [...new Set(targetArc.nodes.flatMap((node) => node.references.map((reference) => reference.slug)))];
      const referenceRows = await tx.storyEntry.findMany({ where: { slug: { in: referenceSlugs } }, select: { id: true, slug: true } });
      const referenceId = new Map(referenceRows.map((row) => [row.slug, row.id]));
      for (const slug of referenceSlugs) if (!referenceId.has(slug)) throw new Error(`Campaign reference ${slug} does not exist.`);

      const nodeId = new Map<string, string>();
      for (const [index, node] of targetArc.nodes.entries()) {
        const row = await tx.storyNode.create({
          data: {
            arcId: arc.id,
            kind: node.kind,
            key: node.key,
            title: node.title,
            summary: node.summary,
            body: node.body,
            completion: node.kind === "QUEST_STEP" ? (node.completion ?? null) : null,
            endingKind: node.kind === "ENDING" ? "SUCCESS" : null,
            status: "CANON",
            canvasX: (index % 2) * 320,
            canvasY: Math.floor(index / 2) * 230,
            createdByUserId: author.id,
          },
          select: { id: true },
        });
        nodeId.set(node.key, row.id);
        await tx.storyRevision.create({
          data: { entityType: "NODE", entityId: row.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Wrote "${node.title}" into ${targetArc.title}` },
        });
        for (const reference of node.references) {
          const link = await tx.storyEntryLink.create({ data: { nodeId: row.id, entryId: referenceId.get(reference.slug) as string }, select: { id: true } });
          await tx.storyRevision.create({
            data: { entityType: "LINK", entityId: link.id, arcId: arc.id, action: "LINKED", actorUserId: author.id, summary: `Linked "${reference.title}" into "${node.title}"` },
          });
        }
      }

      const takenKeys = new Set<string>();
      for (const node of targetArc.nodes) {
        for (const choice of [...node.choices].sort((left, right) => left.order - right.order)) {
          const baseKey = `${node.key.slice(0, 66).replace(/-+$/, "")}-choice`;
          let key = baseKey;
          for (let suffix = 2; takenKeys.has(key); suffix += 1) key = `${baseKey}-${suffix}`;
          takenKeys.add(key);
          const edge = await tx.storyEdge.create({
            data: {
              arcId: arc.id,
              key,
              fromNodeId: nodeId.get(node.key) as string,
              toNodeId: nodeId.get(choice.toKey) as string,
              label: choice.label,
              condition: choice.condition,
              position: choice.order,
              status: "CANON",
              createdByUserId: author.id,
            },
            select: { id: true },
          });
          await tx.storyRevision.create({
            data: { entityType: "EDGE", entityId: edge.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Connected "${node.title}" to "${choice.toKey}"` },
          });
        }
      }
      createdArc = true;
    }

    const slugs = [...new Set(desiredContinuations.flatMap((link) => [link.fromArc, link.toArc]))];
    const arcRows = await tx.storyArc.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    const arcId = new Map(arcRows.map((row) => [row.slug, row.id]));
    let linked = 0;
    for (const desired of desiredContinuations) {
      const fromArcId = arcId.get(desired.fromArc);
      const toArcId = arcId.get(desired.toArc);
      if (!fromArcId || !toArcId) throw new Error(`Cannot wire ${desired.fromArc}/${desired.fromNode} to missing arc ${desired.toArc}.`);
      const node = await tx.storyNode.findUnique({ where: { arcId_key: { arcId: fromArcId, key: desired.fromNode } }, select: { id: true, title: true, continuesInArcId: true } });
      if (!node) throw new Error(`Cannot wire missing ending ${desired.fromArc}/${desired.fromNode}.`);
      if (node.continuesInArcId && node.continuesInArcId !== toArcId) throw new Error(`${desired.fromArc}/${desired.fromNode} already continues into a different arc.`);
      if (node.continuesInArcId === toArcId) continue;
      await tx.storyNode.update({ where: { id: node.id }, data: { continuesInArcId: toArcId, updatedByUserId: author.id, version: { increment: 1 } } });
      await tx.storyRevision.create({
        data: { entityType: "NODE", entityId: node.id, arcId: fromArcId, action: "UPDATED", actorUserId: author.id, summary: `Linked "${node.title}" into ${desired.toArc}`, after: { continuesInArcId: toArcId } },
      });
      linked += 1;
    }
    return { createdArc, linked };
  }, { timeout: 60_000, maxWait: 15_000 });

  const campaign = await db.storyArc.findMany({
    where: { category: "MAINLINE", status: { in: ["DRAFT", "PROPOSED", "CANON"] } },
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: {
      slug: true,
      nodes: {
        where: { kind: "ENDING", continuesInArcId: { not: null } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { key: true, continuesIn: { select: { slug: true } } },
      },
    },
  });
  console.log(JSON.stringify({ ok: true, actor: author.displayName ?? author.name ?? author.username, ...result, campaign }));
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
