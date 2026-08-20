import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { captivityArcSeed } from "../lib/story-captivity-seed";

/** Creates the missing protected board and confirms Amanda as a character. */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } }));

  const existingArc = await db.storyArc.findUnique({ where: { slug: captivityArcSeed.slug }, select: { id: true, title: true } });
  if (existingArc) console.log(`ok          ${existingArc.title} — existing writer-owned board untouched`);
  else {
    console.log(`${apply ? "writing" : "would write"} ${captivityArcSeed.title} — protected mainline scaffold`);
    if (apply) await db.$transaction(async (tx) => {
      const last = await tx.storyArc.aggregate({ where: { category: "MAINLINE" }, _max: { position: true } });
      const arc = await tx.storyArc.create({ data: {
        slug: captivityArcSeed.slug, title: captivityArcSeed.title, summary: captivityArcSeed.summary, hook: captivityArcSeed.hook,
        category: "MAINLINE", isMainline: true, status: "PROPOSED", position: (last._max.position ?? -1) + 1, createdByUserId: author.id,
      }, select: { id: true } });
      await tx.storyRevision.create({ data: { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Opened "${captivityArcSeed.title}" as an owner-gated mainline scaffold` } });

      const referenceSlugs = [...new Set(captivityArcSeed.nodes.flatMap((node) => [...node.references]))];
      const references = await tx.storyEntry.findMany({ where: { slug: { in: referenceSlugs } }, select: { id: true, slug: true, title: true } });
      const referenceBySlug = new Map(references.map((entry) => [entry.slug, entry]));
      for (const slug of referenceSlugs) if (!referenceBySlug.has(slug)) throw new Error(`Missing captivity reference ${slug}`);

      const nodeIds = new Map<string, string>();
      for (const node of captivityArcSeed.nodes) {
        const created = await tx.storyNode.create({ data: {
          arcId: arc.id, key: node.key, kind: node.kind, title: node.title, summary: node.summary, body: node.body,
          completion: node.kind === "QUEST_STEP" ? node.completion : null, endingKind: node.kind === "ENDING" ? "NEUTRAL" : null,
          status: "PROPOSED", canvasX: node.canvasX, canvasY: node.canvasY, createdByUserId: author.id,
        }, select: { id: true } });
        nodeIds.set(node.key, created.id);
        await tx.storyRevision.create({ data: { entityType: "NODE", entityId: created.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Scaffolded "${node.title}" without settling protected canon` } });
        for (const slug of node.references) {
          const reference = referenceBySlug.get(slug) as { id: string; title: string };
          const link = await tx.storyEntryLink.create({ data: { nodeId: created.id, entryId: reference.id }, select: { id: true } });
          await tx.storyRevision.create({ data: { entityType: "LINK", entityId: link.id, arcId: arc.id, action: "LINKED", actorUserId: author.id, summary: `Linked "${reference.title}" into "${node.title}"` } });
        }
      }
      for (const [position, edge] of captivityArcSeed.edges.entries()) {
        const created = await tx.storyEdge.create({ data: {
          arcId: arc.id, key: edge.key, fromNodeId: nodeIds.get(edge.from) as string, toNodeId: nodeIds.get(edge.to) as string,
          label: edge.label, condition: edge.condition, position, status: "PROPOSED", createdByUserId: author.id,
        }, select: { id: true } });
        await tx.storyRevision.create({ data: { entityType: "EDGE", entityId: created.id, arcId: arc.id, action: "CREATED", actorUserId: author.id, summary: `Connected the captivity scaffold through "${edge.key}"` } });
      }
    }, { timeout: 60_000, maxWait: 15_000 });
  }

  const amanda = await db.storyEntry.findUnique({ where: { slug: "amanda" }, select: { id: true, kind: true, status: true } });
  if (!amanda || amanda.kind !== "CHARACTER") throw new Error("Amanda's character dossier does not exist");
  if (amanda.status === "CANON") console.log("ok          Amanda — character already canon");
  else if (amanda.status !== "PROPOSED") console.log(`skip        Amanda — ${amanda.status} is not overridden`);
  else {
    console.log(`${apply ? "confirming" : "would confirm"} Amanda as canon; The Empty Cribs remains brainstorming`);
    if (apply) await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: amanda.id }, data: { status: "CANON", version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: amanda.id, action: "STATUS_CHANGED", actorUserId: author.id,
        summary: "Confirmed Amanda as a canon character; her Empty Cribs storyline remains explicitly brainstorming",
        before: { status: "PROPOSED" }, after: { status: "CANON", storyline: "brainstorming" },
      } });
    });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());

