"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  isValidStoryKey,
  isStoryContentEditable,
  slugifyStoryKey,
  storyEntryKinds,
  storyLockTtlMs,
  storyNodeKinds,
  type StoryStatus,
} from "@habitat/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { storyReadRole, storyReviewRole } from "@/lib/story-codex";
import { askStoryAssistant } from "@/lib/story-assistant-service";

const db = getPrismaClient();

type Transaction = Parameters<Parameters<typeof db.$transaction>[0]>[0];

type RevisionInput = {
  entityType: "ARC" | "NODE" | "EDGE" | "ENTRY" | "LINK";
  entityId: string;
  arcId?: string | null;
  action: "CREATED" | "UPDATED" | "MOVED" | "STATUS_CHANGED" | "DELETED" | "LINKED" | "UNLINKED";
  actorUserId: string;
  summary: string;
  before?: unknown;
  after?: unknown;
};

/**
 * Every mutation lands one of these. They are the review trail, the activity
 * feed, and — because the live-sync stream watches the newest row — the signal
 * that tells other writers' boards to refresh. A mutation that skips this is
 * invisible to everyone else until they reload.
 */
async function recordRevision(tx: Transaction, input: RevisionInput) {
  await tx.storyRevision.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      arcId: input.arcId ?? null,
      action: input.action,
      actorUserId: input.actorUserId,
      summary: input.summary.slice(0, 300),
      before: input.before === undefined ? undefined : JSON.parse(JSON.stringify(input.before)),
      after: input.after === undefined ? undefined : JSON.parse(JSON.stringify(input.after)),
    },
  });
}

/**
 * Contributions land at PROPOSED so a reviewer sees them before the game does.
 * An administrator is that reviewer, so requiring them to approve their own
 * writing would be ceremony rather than a safeguard — their work is canon on
 * save, and everyone else's waits.
 */
function creationStatus(role: string | undefined): StoryStatus {
  return role === "ADMIN" ? "CANON" : "PROPOSED";
}

function refreshCodex(arcSlug?: string | null) {
  revalidatePath("/codex");
  revalidatePath("/codex/bible");
  revalidatePath("/codex/review");
  if (arcSlug) revalidatePath(`/codex/arc/${arcSlug}`);
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .catch(null);

// ---------------------------------------------------------------------------
// Arcs
// ---------------------------------------------------------------------------

const arcSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: optionalText(500),
  isMainline: z.boolean(),
});

export async function createArc(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = arcSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    // Only a reviewer decides what counts as the spine of the story.
    isMainline: user.role === "ADMIN" && formData.get("isMainline") === "on",
  });
  if (!parsed.success) throw new Error("Give the arc a title of 120 characters or fewer.");

  const slug = slugifyStoryKey(parsed.data.title);
  if (!isValidStoryKey(slug)) throw new Error("That title needs at least one letter or number.");

  const existing = await db.storyArc.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("An arc with that name already exists.");

  await db.$transaction(async (tx) => {
    const arc = await tx.storyArc.create({
      data: { slug, title: parsed.data.title, summary: parsed.data.summary, isMainline: parsed.data.isMainline, status: creationStatus(user.role), createdByUserId: user.id },
    });
    await recordRevision(tx, { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "CREATED", actorUserId: user.id, summary: `Opened the arc "${arc.title}"` });
  });

  refreshCodex(slug);
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

const createNodeSchema = z.object({
  arcId: z.string().uuid(),
  kind: z.enum(storyNodeKinds),
  title: z.string().trim().min(1).max(160),
  summary: optionalText(500),
  canvasX: z.coerce.number().int().min(-100000).max(100000).nullable().catch(null),
  canvasY: z.coerce.number().int().min(-100000).max(100000).nullable().catch(null),
});

/**
 * Where a new card lands when the caller did not choose. Cards are laid out on
 * a grid rather than at a random offset so two people adding a node at the same
 * moment do not drop them on top of each other.
 */
function nextCanvasSlot(existingNodes: number) {
  const columns = 4;
  return { canvasX: (existingNodes % columns) * 300, canvasY: Math.floor(existingNodes / columns) * 220 };
}

/**
 * Node keys must be unique inside their arc and are what the Unreal importer
 * addresses an asset by, so a collision is resolved by suffixing rather than by
 * failing the save — a writer naming two scenes "The Gate" is not an error.
 */
async function availableNodeKey(tx: Transaction, arcId: string, title: string) {
  const base = slugifyStoryKey(title, 72) || "scene";
  const siblings = await tx.storyNode.findMany({ where: { arcId, key: { startsWith: base } }, select: { key: true } });
  const taken = new Set(siblings.map((node) => node.key));
  if (!taken.has(base)) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("Too many nodes share that name. Give this one a different title.");
}

export async function createNode(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = createNodeSchema.safeParse({
    arcId: formData.get("arcId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    canvasX: formData.get("canvasX"),
    canvasY: formData.get("canvasY"),
  });
  if (!parsed.success) throw new Error("That node is missing a title or a valid kind.");

  const arc = await db.storyArc.findUnique({ where: { id: parsed.data.arcId }, select: { id: true, slug: true } });
  if (!arc) throw new Error("That arc no longer exists.");

  await db.$transaction(async (tx) => {
    const key = await availableNodeKey(tx, arc.id, parsed.data.title);
    const placement = parsed.data.canvasX !== null && parsed.data.canvasY !== null
      ? { canvasX: parsed.data.canvasX, canvasY: parsed.data.canvasY }
      : nextCanvasSlot(await tx.storyNode.count({ where: { arcId: arc.id } }));
    const node = await tx.storyNode.create({
      data: {
        arcId: arc.id,
        kind: parsed.data.kind,
        key,
        title: parsed.data.title,
        summary: parsed.data.summary,
        canvasX: placement.canvasX,
        canvasY: placement.canvasY,
        status: creationStatus(user.role),
        createdByUserId: user.id,
      },
    });
    await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: arc.id, action: "CREATED", actorUserId: user.id, summary: `Added "${node.title}"`, after: { key, kind: node.kind, title: node.title } });
  });

  refreshCodex(arc.slug);
}

const updateNodeSchema = z.object({
  nodeId: z.string().uuid(),
  version: z.coerce.number().int().min(1),
  kind: z.enum(storyNodeKinds),
  title: z.string().trim().min(1).max(160),
  summary: optionalText(500),
  body: optionalText(20000),
});

export async function updateNode(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = updateNodeSchema.safeParse({
    nodeId: formData.get("nodeId"),
    version: formData.get("version"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) throw new Error("That edit is missing a title or a valid kind.");

  const arcSlug = await db.$transaction(async (tx) => {
    const node = await tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, include: { arc: { select: { slug: true } } } });
    if (!node) throw new Error("That node no longer exists.");
    if (!isStoryContentEditable(node.status, user.role === "ADMIN")) {
      throw new Error("This node is canon. Leave a note for a reviewer before changing shipped story.");
    }

    // Optimistic concurrency, not the courtesy lock, is what actually protects
    // the text: two writers who both had the node open cannot silently
    // overwrite each other, whichever of them holds the lock badge.
    const updated = await tx.storyNode.updateMany({
      where: { id: node.id, version: parsed.data.version },
      data: {
        kind: parsed.data.kind,
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.data.body,
        updatedByUserId: user.id,
        version: { increment: 1 },
        // An edit is an implicit release: the writer is done with this pass.
        lockedByUserId: null,
        lockExpiresAt: null,
      },
    });
    if (updated.count !== 1) {
      throw new Error("Somebody saved this node while you were writing. Reopen it to see their version before saving yours.");
    }

    await recordRevision(tx, {
      entityType: "NODE",
      entityId: node.id,
      arcId: node.arcId,
      action: "UPDATED",
      actorUserId: user.id,
      summary: `Rewrote "${parsed.data.title}"`,
      before: { title: node.title, kind: node.kind, summary: node.summary, body: node.body },
      after: { title: parsed.data.title, kind: parsed.data.kind, summary: parsed.data.summary, body: parsed.data.body },
    });

    return node.arc.slug;
  });

  refreshCodex(arcSlug);
}

const moveNodeSchema = z.object({
  nodeId: z.string().uuid(),
  canvasX: z.coerce.number().int().min(-100000).max(100000),
  canvasY: z.coerce.number().int().min(-100000).max(100000),
});

/**
 * Position is layout, not content, so a drag deliberately does not touch
 * `version` — moving a card must never invalidate the edit somebody else has
 * open in the inspector.
 */
export async function moveNode(input: { nodeId: string; canvasX: number; canvasY: number }) {
  const user = await requireRole(storyReadRole);
  const parsed = moveNodeSchema.safeParse(input);
  if (!parsed.success) throw new Error("That position is off the board.");

  await db.$transaction(async (tx) => {
    const node = await tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, select: { id: true, arcId: true, title: true, canvasX: true, canvasY: true } });
    if (!node) throw new Error("That node no longer exists.");
    if (node.canvasX === parsed.data.canvasX && node.canvasY === parsed.data.canvasY) return;

    await tx.storyNode.update({ where: { id: node.id }, data: { canvasX: parsed.data.canvasX, canvasY: parsed.data.canvasY } });
    await recordRevision(tx, {
      entityType: "NODE",
      entityId: node.id,
      arcId: node.arcId,
      action: "MOVED",
      actorUserId: user.id,
      summary: `Moved "${node.title}"`,
      before: { canvasX: node.canvasX, canvasY: node.canvasY },
      after: { canvasX: parsed.data.canvasX, canvasY: parsed.data.canvasY },
    });
  });
}

export async function deleteNode(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const nodeId = z.string().uuid().safeParse(formData.get("nodeId"));
  if (!nodeId.success) throw new Error("Invalid node.");

  const arcSlug = await db.$transaction(async (tx) => {
    const node = await tx.storyNode.findUnique({ where: { id: nodeId.data }, include: { arc: { select: { slug: true } } } });
    if (!node) throw new Error("That node no longer exists.");

    // Canon is what the game was built from. Removing it outright would tear a
    // hole in an export somebody has already imported, so it is archived and
    // stays addressable by key.
    if (node.status === "CANON") {
      if (user.role !== "ADMIN") throw new Error("This node is canon. Ask an administrator to archive it.");
      await tx.storyNode.update({ where: { id: node.id }, data: { status: "ARCHIVED", updatedByUserId: user.id } });
      await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: node.arcId, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Archived the canon node "${node.title}"`, before: { status: "CANON" }, after: { status: "ARCHIVED" } });
      return node.arc.slug;
    }

    if (node.createdByUserId !== user.id && user.role !== "ADMIN") throw new Error("Only the writer who added this node, or an administrator, can remove it.");

    await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: node.arcId, action: "DELETED", actorUserId: user.id, summary: `Removed "${node.title}"`, before: { key: node.key, title: node.title, kind: node.kind, body: node.body } });
    await tx.storyNode.delete({ where: { id: node.id } });
    return node.arc.slug;
  });

  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

export async function createEdge(input: { fromNodeId: string; toNodeId: string; label?: string | null }) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ fromNodeId: z.string().uuid(), toNodeId: z.string().uuid(), label: optionalText(200).optional() })
    .safeParse(input);
  if (!parsed.success) throw new Error("That transition is not valid.");
  if (parsed.data.fromNodeId === parsed.data.toNodeId) throw new Error("A node cannot continue into itself.");

  const arcSlug = await db.$transaction(async (tx) => {
    const [from, to] = await Promise.all([
      tx.storyNode.findUnique({ where: { id: parsed.data.fromNodeId }, select: { id: true, arcId: true, title: true, arc: { select: { slug: true } } } }),
      tx.storyNode.findUnique({ where: { id: parsed.data.toNodeId }, select: { id: true, arcId: true, title: true } }),
    ]);
    if (!from || !to) throw new Error("One end of that transition no longer exists.");
    // Enforced here rather than by a composite foreign key; see the note on
    // StoryEdge in schema.prisma.
    if (from.arcId !== to.arcId) throw new Error("A transition has to stay inside one arc.");

    const existing = await tx.storyEdge.findFirst({ where: { fromNodeId: from.id, toNodeId: to.id }, select: { id: true } });
    if (existing) throw new Error("Those nodes are already connected.");

    const last = await tx.storyEdge.findFirst({ where: { fromNodeId: from.id }, orderBy: { position: "desc" }, select: { position: true } });
    const edge = await tx.storyEdge.create({
      data: {
        arcId: from.arcId,
        fromNodeId: from.id,
        toNodeId: to.id,
        label: parsed.data.label ?? null,
        position: last ? last.position + 1 : 0,
        status: creationStatus(user.role),
        createdByUserId: user.id,
      },
    });
    await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: from.arcId, action: "CREATED", actorUserId: user.id, summary: `Connected "${from.title}" to "${to.title}"` });
    return from.arc.slug;
  });

  refreshCodex(arcSlug);
}

export async function updateEdge(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ edgeId: z.string().uuid(), label: optionalText(200), condition: optionalText(300) })
    .safeParse({ edgeId: formData.get("edgeId"), label: formData.get("label") ?? "", condition: formData.get("condition") ?? "" });
  if (!parsed.success) throw new Error("That transition is not valid.");

  const arcSlug = await db.$transaction(async (tx) => {
    const edge = await tx.storyEdge.findUnique({ where: { id: parsed.data.edgeId }, include: { arc: { select: { slug: true } }, fromNode: { select: { title: true } }, toNode: { select: { title: true } } } });
    if (!edge) throw new Error("That transition no longer exists.");
    if (!isStoryContentEditable(edge.status, user.role === "ADMIN")) {
      throw new Error("This branch is canon. Only a reviewer can change its choice text or condition.");
    }

    await tx.storyEdge.update({ where: { id: edge.id }, data: { label: parsed.data.label, condition: parsed.data.condition } });
    await recordRevision(tx, {
      entityType: "EDGE",
      entityId: edge.id,
      arcId: edge.arcId,
      action: "UPDATED",
      actorUserId: user.id,
      summary: `Relabelled the branch from "${edge.fromNode.title}" to "${edge.toNode.title}"`,
      before: { label: edge.label, condition: edge.condition },
      after: { label: parsed.data.label, condition: parsed.data.condition },
    });
    return edge.arc.slug;
  });

  refreshCodex(arcSlug);
}

export async function deleteEdge(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const edgeId = z.string().uuid().safeParse(formData.get("edgeId"));
  if (!edgeId.success) throw new Error("Invalid transition.");

  const arcSlug = await db.$transaction(async (tx) => {
    const edge = await tx.storyEdge.findUnique({ where: { id: edgeId.data }, include: { arc: { select: { slug: true } }, fromNode: { select: { title: true } }, toNode: { select: { title: true } } } });
    if (!edge) throw new Error("That transition no longer exists.");
    if (edge.status === "CANON" && user.role !== "ADMIN") throw new Error("That branch is canon. Ask an administrator to remove it.");
    if (edge.status !== "CANON" && edge.createdByUserId !== user.id && user.role !== "ADMIN") throw new Error("Only the writer who drew this branch, or an administrator, can remove it.");

    await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: edge.arcId, action: "DELETED", actorUserId: user.id, summary: `Cut the branch from "${edge.fromNode.title}" to "${edge.toNode.title}"`, before: { label: edge.label, condition: edge.condition } });
    await tx.storyEdge.delete({ where: { id: edge.id } });
    return edge.arc.slug;
  });

  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Bible entries
// ---------------------------------------------------------------------------

const entrySchema = z.object({
  kind: z.enum(storyEntryKinds),
  title: z.string().trim().min(1).max(120),
  summary: optionalText(500),
  body: optionalText(20000),
});

export async function createEntry(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = entrySchema.safeParse({ kind: formData.get("kind"), title: formData.get("title"), summary: formData.get("summary") ?? "", body: formData.get("body") ?? "" });
  if (!parsed.success) throw new Error("A bible entry needs a kind and a title.");

  const slug = slugifyStoryKey(parsed.data.title);
  if (!isValidStoryKey(slug)) throw new Error("That title needs at least one letter or number.");

  const existing = await db.storyEntry.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("The bible already has an entry with that name.");

  await db.$transaction(async (tx) => {
    const entry = await tx.storyEntry.create({
      data: { kind: parsed.data.kind, slug, title: parsed.data.title, summary: parsed.data.summary, body: parsed.data.body, status: creationStatus(user.role), createdByUserId: user.id },
    });
    await recordRevision(tx, { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: user.id, summary: `Wrote the ${entry.kind.toLowerCase()} "${entry.title}"` });
  });

  refreshCodex();
  revalidatePath(`/codex/bible/${slug}`);
}

export async function updateEntry(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = entrySchema.extend({ entryId: z.string().uuid(), version: z.coerce.number().int().min(1) }).safeParse({
    entryId: formData.get("entryId"),
    version: formData.get("version"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) throw new Error("That edit is missing a kind or a title.");

  const slug = await db.$transaction(async (tx) => {
    const entry = await tx.storyEntry.findUnique({ where: { id: parsed.data.entryId } });
    if (!entry) throw new Error("That entry no longer exists.");
    if (!isStoryContentEditable(entry.status, user.role === "ADMIN")) {
      throw new Error("This bible entry is canon. Leave a note for a reviewer before changing it.");
    }

    const updated = await tx.storyEntry.updateMany({
      where: { id: entry.id, version: parsed.data.version },
      data: { kind: parsed.data.kind, title: parsed.data.title, summary: parsed.data.summary, body: parsed.data.body, updatedByUserId: user.id, version: { increment: 1 }, lockedByUserId: null, lockExpiresAt: null },
    });
    if (updated.count !== 1) throw new Error("Somebody saved this entry while you were writing. Reopen it to see their version before saving yours.");

    await recordRevision(tx, {
      entityType: "ENTRY",
      entityId: entry.id,
      action: "UPDATED",
      actorUserId: user.id,
      summary: `Revised "${parsed.data.title}"`,
      before: { kind: entry.kind, title: entry.title, summary: entry.summary, body: entry.body },
      after: { kind: parsed.data.kind, title: parsed.data.title, summary: parsed.data.summary, body: parsed.data.body },
    });
    return entry.slug;
  });

  refreshCodex();
  revalidatePath(`/codex/bible/${slug}`);
}

export async function linkEntryToNode(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ nodeId: z.string().uuid(), entryId: z.string().uuid() }).safeParse({ nodeId: formData.get("nodeId"), entryId: formData.get("entryId") });
  if (!parsed.success) throw new Error("Invalid reference.");

  const arcSlug = await db.$transaction(async (tx) => {
    const [node, entry] = await Promise.all([
      tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, select: { id: true, arcId: true, title: true, status: true, arc: { select: { slug: true } } } }),
      tx.storyEntry.findUnique({ where: { id: parsed.data.entryId }, select: { id: true, title: true } }),
    ]);
    if (!node || !entry) throw new Error("That reference no longer exists.");
    if (!isStoryContentEditable(node.status, user.role === "ADMIN")) {
      throw new Error("References on a canon node can only be changed by a reviewer.");
    }

    const existing = await tx.storyEntryLink.findUnique({ where: { nodeId_entryId: { nodeId: node.id, entryId: entry.id } }, select: { id: true } });
    if (existing) return node.arc.slug;

    const link = await tx.storyEntryLink.create({ data: { nodeId: node.id, entryId: entry.id } });
    await recordRevision(tx, { entityType: "LINK", entityId: link.id, arcId: node.arcId, action: "LINKED", actorUserId: user.id, summary: `Put "${entry.title}" in "${node.title}"` });
    return node.arc.slug;
  });

  refreshCodex(arcSlug);
}

export async function unlinkEntryFromNode(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ nodeId: z.string().uuid(), entryId: z.string().uuid() }).safeParse({ nodeId: formData.get("nodeId"), entryId: formData.get("entryId") });
  if (!parsed.success) throw new Error("Invalid reference.");

  const arcSlug = await db.$transaction(async (tx) => {
    const link = await tx.storyEntryLink.findUnique({
      where: { nodeId_entryId: { nodeId: parsed.data.nodeId, entryId: parsed.data.entryId } },
      include: { node: { select: { arcId: true, title: true, status: true, arc: { select: { slug: true } } } }, entry: { select: { title: true } } },
    });
    if (!link) return null;
    if (!isStoryContentEditable(link.node.status, user.role === "ADMIN")) {
      throw new Error("References on a canon node can only be changed by a reviewer.");
    }

    await tx.storyEntryLink.delete({ where: { id: link.id } });
    await recordRevision(tx, { entityType: "LINK", entityId: link.id, arcId: link.node.arcId, action: "UNLINKED", actorUserId: user.id, summary: `Took "${link.entry.title}" out of "${link.node.title}"` });
    return link.node.arc.slug;
  });

  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  entityType: z.enum(["ARC", "NODE", "EDGE", "ENTRY"]),
  entityId: z.string().uuid(),
  status: z.enum(["CANON", "REJECTED", "ARCHIVED", "PROPOSED"]),
});

export async function setStoryStatus(formData: FormData) {
  const user = await requireRole(storyReviewRole);
  const parsed = reviewSchema.safeParse({ entityType: formData.get("entityType"), entityId: formData.get("entityId"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid review decision.");
  const { entityType, entityId, status } = parsed.data;

  const arcSlug = await db.$transaction(async (tx) => {
    if (entityType === "ARC") {
      const arc = await tx.storyArc.findUnique({ where: { id: entityId } });
      if (!arc) throw new Error("That arc no longer exists.");
      await tx.storyArc.update({ where: { id: arc.id }, data: { status } });
      await recordRevision(tx, { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Marked the arc "${arc.title}" ${status.toLowerCase()}`, before: { status: arc.status }, after: { status } });
      return arc.slug;
    }

    if (entityType === "NODE") {
      const node = await tx.storyNode.findUnique({ where: { id: entityId }, include: { arc: true } });
      if (!node) throw new Error("That node no longer exists.");
      await tx.storyNode.update({ where: { id: node.id }, data: { status } });
      await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: node.arcId, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Marked "${node.title}" ${status.toLowerCase()}`, before: { status: node.status }, after: { status } });

      // A canon node inside a non-canon arc would be dropped by the export
      // without saying why, so approving the node approves the arc holding it.
      if (status === "CANON" && node.arc.status !== "CANON") {
        await tx.storyArc.update({ where: { id: node.arcId }, data: { status: "CANON" } });
        await recordRevision(tx, { entityType: "ARC", entityId: node.arcId, arcId: node.arcId, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Made the arc "${node.arc.title}" canon so its approved node exports`, before: { status: node.arc.status }, after: { status: "CANON" } });
      }
      return node.arc.slug;
    }

    if (entityType === "EDGE") {
      const edge = await tx.storyEdge.findUnique({ where: { id: entityId }, include: { arc: { select: { slug: true } }, fromNode: { select: { title: true } }, toNode: { select: { title: true } } } });
      if (!edge) throw new Error("That transition no longer exists.");
      await tx.storyEdge.update({ where: { id: edge.id }, data: { status } });
      await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: edge.arcId, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Marked the branch "${edge.fromNode.title}" → "${edge.toNode.title}" ${status.toLowerCase()}`, before: { status: edge.status }, after: { status } });
      return edge.arc.slug;
    }

    const entry = await tx.storyEntry.findUnique({ where: { id: entityId } });
    if (!entry) throw new Error("That entry no longer exists.");
    await tx.storyEntry.update({ where: { id: entry.id }, data: { status } });
    await recordRevision(tx, { entityType: "ENTRY", entityId: entry.id, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Marked "${entry.title}" ${status.toLowerCase()}`, before: { status: entry.status }, after: { status } });
    return null;
  });

  refreshCodex(arcSlug);
}

/**
 * Approving an arc one card at a time is how a reviewer ends up shipping nodes
 * whose branches are still proposed — a scene that exports with no way out.
 * This promotes an arc and everything currently proposed inside it together.
 */
export async function canoniseArc(formData: FormData) {
  const user = await requireRole(storyReviewRole);
  const arcId = z.string().uuid().safeParse(formData.get("arcId"));
  if (!arcId.success) throw new Error("Invalid arc.");

  const arcSlug = await db.$transaction(async (tx) => {
    const arc = await tx.storyArc.findUnique({ where: { id: arcId.data } });
    if (!arc) throw new Error("That arc no longer exists.");

    const [nodes, edges] = await Promise.all([
      tx.storyNode.updateMany({ where: { arcId: arc.id, status: "PROPOSED" }, data: { status: "CANON" } }),
      tx.storyEdge.updateMany({ where: { arcId: arc.id, status: "PROPOSED" }, data: { status: "CANON" } }),
    ]);
    if (arc.status !== "CANON") await tx.storyArc.update({ where: { id: arc.id }, data: { status: "CANON" } });

    await recordRevision(tx, {
      entityType: "ARC",
      entityId: arc.id,
      arcId: arc.id,
      action: "STATUS_CHANGED",
      actorUserId: user.id,
      summary: `Made "${arc.title}" canon with ${nodes.count} node${nodes.count === 1 ? "" : "s"} and ${edges.count} branch${edges.count === 1 ? "" : "es"}`,
      before: { status: arc.status },
      after: { status: "CANON", nodes: nodes.count, edges: edges.count },
    });
    return arc.slug;
  });

  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Discussion
// ---------------------------------------------------------------------------

export async function addComment(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ nodeId: z.string().uuid().nullable(), entryId: z.string().uuid().nullable(), body: z.string().trim().min(1).max(2000) })
    .safeParse({ nodeId: formData.get("nodeId") || null, entryId: formData.get("entryId") || null, body: formData.get("body") });
  if (!parsed.success) throw new Error("Write something first.");
  if (Boolean(parsed.data.nodeId) === Boolean(parsed.data.entryId)) throw new Error("A note belongs to one node or one entry.");

  await db.$transaction(async (tx) => {
    const comment = await tx.storyComment.create({ data: { nodeId: parsed.data.nodeId, entryId: parsed.data.entryId, authorUserId: user.id, body: parsed.data.body } });
    const arcId = parsed.data.nodeId ? (await tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, select: { arcId: true } }))?.arcId ?? null : null;
    await recordRevision(tx, { entityType: parsed.data.nodeId ? "NODE" : "ENTRY", entityId: parsed.data.nodeId ?? parsed.data.entryId ?? comment.id, arcId, action: "UPDATED", actorUserId: user.id, summary: "Left a note" });
  });

  refreshCodex();
}

export async function resolveComment(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const commentId = z.string().uuid().safeParse(formData.get("commentId"));
  if (!commentId.success) throw new Error("Invalid note.");

  const arcSlug = await db.$transaction(async (tx) => {
    const comment = await tx.storyComment.findUnique({
      where: { id: commentId.data },
      include: { node: { select: { arcId: true, arc: { select: { slug: true } } } } },
    });
    if (!comment || comment.resolvedAt) return comment?.node?.arc.slug ?? null;

    await tx.storyComment.update({ where: { id: comment.id }, data: { resolvedAt: new Date(), resolvedByUserId: user.id } });
    await recordRevision(tx, {
      entityType: comment.nodeId ? "NODE" : "ENTRY",
      entityId: comment.nodeId ?? comment.entryId ?? comment.id,
      arcId: comment.node?.arcId ?? null,
      action: "UPDATED",
      actorUserId: user.id,
      summary: "Resolved a story note",
    });
    return comment.node?.arc.slug ?? null;
  });
  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Presence and courtesy locks
// ---------------------------------------------------------------------------

/**
 * Claims the "somebody is writing here" badge. It is advisory: it never blocks
 * a save, because a lock that could block would strand a node behind whoever
 * walked away from their desk. Version checks do the real protecting.
 */
export async function claimNodeLock(input: { nodeId: string }) {
  const user = await requireRole(storyReadRole);
  const nodeId = z.string().uuid().safeParse(input.nodeId);
  if (!nodeId.success) return { held: false as const };

  const now = new Date();
  const claimed = await db.storyNode.updateMany({
    where: {
      id: nodeId.data,
      OR: [{ lockedByUserId: null }, { lockedByUserId: user.id }, { lockExpiresAt: { lt: now } }],
    },
    data: { lockedByUserId: user.id, lockExpiresAt: new Date(now.getTime() + storyLockTtlMs) },
  });
  return { held: claimed.count === 1 };
}

export async function releaseNodeLock(input: { nodeId: string }) {
  const user = await requireRole(storyReadRole);
  const nodeId = z.string().uuid().safeParse(input.nodeId);
  if (!nodeId.success) return;
  await db.storyNode.updateMany({ where: { id: nodeId.data, lockedByUserId: user.id }, data: { lockedByUserId: null, lockExpiresAt: null } });
}

export async function claimEntryLock(input: { entryId: string }) {
  const user = await requireRole(storyReadRole);
  const entryId = z.string().uuid().safeParse(input.entryId);
  if (!entryId.success) return { held: false as const };

  const now = new Date();
  const claimed = await db.storyEntry.updateMany({
    where: {
      id: entryId.data,
      OR: [{ lockedByUserId: null }, { lockedByUserId: user.id }, { lockExpiresAt: { lt: now } }],
    },
    data: { lockedByUserId: user.id, lockExpiresAt: new Date(now.getTime() + storyLockTtlMs) },
  });
  return { held: claimed.count === 1 };
}

export async function releaseEntryLock(input: { entryId: string }) {
  const user = await requireRole(storyReadRole);
  const entryId = z.string().uuid().safeParse(input.entryId);
  if (!entryId.success) return;
  await db.storyEntry.updateMany({ where: { id: entryId.data, lockedByUserId: user.id }, data: { lockedByUserId: null, lockExpiresAt: null } });
}

// ---------------------------------------------------------------------------
// The Warden
// ---------------------------------------------------------------------------

export type WardenTurn = { id: string; question: string; answer: string };
export type WardenState = { turns: WardenTurn[]; error?: string };

/**
 * Asks the codex assistant.
 *
 * Member-only, like the rest of the codex, and audited whatever the outcome —
 * `askStoryAssistant` writes a `StoryAssistantMessage` on every path including
 * the ones that never reach Gemini. Nothing it answers is written to the codex;
 * a suggestion only becomes story when a human types it into a card.
 */
export async function askWarden(previous: WardenState, formData: FormData): Promise<WardenState> {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ arcId: z.string().uuid().nullable(), nodeId: z.string().uuid().nullable(), question: z.string().trim().min(1).max(2000) })
    .safeParse({
      arcId: formData.get("arcId") || null,
      nodeId: formData.get("nodeId") || null,
      question: formData.get("question"),
    });
  if (!parsed.success) return { ...previous, error: "Ask him something first." };

  const reply = await askStoryAssistant({ userId: user.id, arcId: parsed.data.arcId, nodeId: parsed.data.nodeId, question: parsed.data.question });
  if (!reply.ok) return { ...previous, error: reply.message };

  return {
    turns: [...previous.turns, { id: `${previous.turns.length}-${parsed.data.question.length}`, question: parsed.data.question, answer: reply.answer }],
  };
}

/**
 * Says "still here" for the writer roster on a board.
 *
 * Presence is never deleted on the way out — a browser that crashes never sends
 * a goodbye — so it is written as a timestamp and judged stale on read. The
 * same reasoning the streaming showcase applies to a channel going offline.
 */
export async function touchStoryPresence(input: { arcId: string | null; nodeId: string | null }) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ arcId: z.string().uuid().nullable(), nodeId: z.string().uuid().nullable() }).safeParse(input);
  if (!parsed.success) return;

  const seenAt = new Date();
  await db.storyPresence.upsert({
    where: { userId: user.id },
    create: { userId: user.id, arcId: parsed.data.arcId, nodeId: parsed.data.nodeId, lastSeenAt: seenAt },
    update: { arcId: parsed.data.arcId, nodeId: parsed.data.nodeId, lastSeenAt: seenAt },
  });
}
