"use server";

import "@/lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import {
  isValidStoryKey,
  isStoryContentEditable,
  parseStoryPlaceKind,
  slugifyStoryKey,
  storyControlKinds,
  storyCreatureCategories,
  storyEndingKinds,
  storyEntryKinds,
  storyFactionStances,
  storyLockTtlMs,
  storyMagicOrigins,
  storyNodeKinds,
  storyRegionTypes,
  storySettlementTiers,
  type StoryRegionMeta,
  type StoryStatus,
} from "@habitat/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
 * The clubhouse writes without a gate: everything lands CANON the moment it is
 * saved, for every member alike, and the game reads it on its next pull.
 * Tino's call, 2026-08-18 — the color-coded audit log on the codex landing
 * page replaced approval as the safety mechanism, and REJECTED/ARCHIVED stay
 * available to an administrator for after-the-fact housekeeping.
 */
function creationStatus(): StoryStatus {
  return "CANON";
}

function refreshCodex(arcSlug?: string | null) {
  revalidatePath("/codex");
  revalidatePath("/codex/bible");
  revalidatePath("/codex/review");
  revalidatePath("/codex/library/characters");
  revalidatePath("/codex/library/factions");
  revalidatePath("/codex/library/regions");
  revalidatePath("/codex/library/creatures");
  revalidatePath("/codex/library/items");
  if (arcSlug) revalidatePath(`/codex/arc/${arcSlug}`);
}

/**
 * An optional prose field: blank means "not written", and anything over the
 * column's width is a validation failure rather than a value quietly replaced
 * with null. Swallowing the failure would let an oversized paste erase a scene
 * a writer had already saved, and report the save as successful.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null))
    .nullable();

/**
 * Effects arrive as a textarea, one per line. They are free text the game
 * interprets — the codex only keeps them short enough to stay legible in an
 * import log, and refuses rather than truncates when they are not.
 */
const effectsList = z
  .string()
  .max(8000)
  .transform((value) => value.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0))
  .refine((lines) => lines.length <= 20, { message: "At most 20 effects on one card or branch." })
  .refine((lines) => lines.every((line) => line.length <= 300), { message: "Keep each effect under 300 characters." });

// ---------------------------------------------------------------------------
// Arcs
// ---------------------------------------------------------------------------

const arcSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: optionalText(500),
  hook: optionalText(500),
  regionEntryId: z.string().uuid().nullable(),
  isMainline: z.boolean(),
});

/** The pickup place is a REGION bible entry, never free text. */
async function assertRegionEntry(tx: Transaction, regionEntryId: string | null) {
  if (!regionEntryId) return;
  const region = await tx.storyEntry.findUnique({ where: { id: regionEntryId }, select: { kind: true } });
  if (!region || region.kind !== "REGION") throw new Error("A pickup place has to be a region from the bible.");
}

export async function createArc(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = arcSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    hook: formData.get("hook") ?? "",
    regionEntryId: formData.get("regionEntryId") || null,
    // Only a reviewer decides what counts as the spine of the story.
    isMainline: user.role === "ADMIN" && formData.get("isMainline") === "on",
  });
  if (!parsed.success) throw new Error("Give the arc a title of 120 characters or fewer, with a summary and hook under 500 each.");

  const slug = slugifyStoryKey(parsed.data.title);
  if (!isValidStoryKey(slug)) throw new Error("That title needs at least one letter or number.");

  const existing = await db.storyArc.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("An arc with that name already exists.");

  await db.$transaction(async (tx) => {
    await assertRegionEntry(tx, parsed.data.regionEntryId);
    const arc = await tx.storyArc.create({
      data: { slug, title: parsed.data.title, summary: parsed.data.summary, hook: parsed.data.hook, regionEntryId: parsed.data.regionEntryId, isMainline: parsed.data.isMainline, status: creationStatus(), createdByUserId: user.id },
    });
    await recordRevision(tx, { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "CREATED", actorUserId: user.id, summary: `Opened the arc "${arc.title}"` });
  });

  refreshCodex(slug);
}

/**
 * Retitling never touches the slug — the slug is the identity the Unreal
 * importer matches the arc's assets on, and an arc that changed its slug on a
 * rename would orphan everything built from it.
 */
export async function updateArc(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = arcSchema.extend({ arcId: z.string().uuid() }).safeParse({
    arcId: formData.get("arcId"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    hook: formData.get("hook") ?? "",
    regionEntryId: formData.get("regionEntryId") || null,
    isMainline: user.role === "ADMIN" && formData.get("isMainline") === "on",
  });
  if (!parsed.success) throw new Error("An arc needs a title of 120 characters or fewer, with a summary and hook under 500 each.");

  const arcSlug = await db.$transaction(async (tx) => {
    const arc = await tx.storyArc.findUnique({ where: { id: parsed.data.arcId } });
    if (!arc) throw new Error("That arc no longer exists.");
    if (!isStoryContentEditable(arc.status, user.role === "ADMIN")) {
      throw new Error("This arc is canon. Leave a note for a reviewer before changing shipped story.");
    }
    await assertRegionEntry(tx, parsed.data.regionEntryId);

    // Mainline stays a reviewer's call; everyone else's edit keeps it as-is.
    const nextIsMainline = user.role === "ADMIN" ? parsed.data.isMainline : arc.isMainline;
    await tx.storyArc.update({
      where: { id: arc.id },
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        hook: parsed.data.hook,
        regionEntryId: parsed.data.regionEntryId,
        isMainline: nextIsMainline,
      },
    });
    await recordRevision(tx, {
      entityType: "ARC",
      entityId: arc.id,
      arcId: arc.id,
      action: "UPDATED",
      actorUserId: user.id,
      summary: `Reworked the arc "${parsed.data.title}"`,
      before: { title: arc.title, summary: arc.summary, hook: arc.hook, regionEntryId: arc.regionEntryId, isMainline: arc.isMainline },
      after: { title: parsed.data.title, summary: parsed.data.summary, hook: parsed.data.hook, regionEntryId: parsed.data.regionEntryId, isMainline: nextIsMainline },
    });
    return arc.slug;
  });

  refreshCodex(arcSlug);
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
/** The DB CHECK bounds canvas coordinates to ±100000; every computed
 *  placement clamps to it so arithmetic near the edge of the board fails
 *  gracefully into the corner instead of rolling the whole save back with a
 *  raw constraint error. */
const clampCanvas = (value: number) => Math.max(-100_000, Math.min(100_000, value));

function nextCanvasSlot(existingNodes: number) {
  const columns = 4;
  return { canvasX: clampCanvas((existingNodes % columns) * 300), canvasY: clampCanvas(Math.floor(existingNodes / columns) * 220) };
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
  if (!parsed.success) throw new Error("A card needs a valid kind, a title of 160 characters or fewer, and a summary under 500.");

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
        status: creationStatus(),
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
  speakerEntryId: z.string().uuid().nullable(),
  endingKind: z.enum(storyEndingKinds).nullable(),
  completion: optionalText(500),
  effects: effectsList,
  rewards: effectsList,
  continuesInArcId: z.string().uuid().nullable(),
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
    speakerEntryId: formData.get("speakerEntryId") || null,
    endingKind: formData.get("endingKind") || null,
    completion: formData.get("completion") ?? "",
    effects: formData.get("effects") ?? "",
    rewards: formData.get("rewards") ?? "",
    continuesInArcId: formData.get("continuesInArcId") || null,
  });
  if (!parsed.success) throw new Error("That edit needs a valid kind, a title of 160 characters or fewer, a summary under 500, and scene text under 20,000.");

  // Ending valence and continuation belong to endings, completion to quest
  // steps. Enforced by clearing rather than refusing: a writer who turns an
  // Ending back into a Scene should not be blocked by what the old kind left.
  const endingKind = parsed.data.kind === "ENDING" ? parsed.data.endingKind : null;
  const completion = parsed.data.kind === "QUEST_STEP" ? parsed.data.completion : null;
  const continuesInArcId = parsed.data.kind === "ENDING" ? parsed.data.continuesInArcId : null;

  const arcSlug = await db.$transaction(async (tx) => {
    const node = await tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, include: { arc: { select: { slug: true } } } });
    if (!node) throw new Error("That node no longer exists.");
    if (!isStoryContentEditable(node.status, user.role === "ADMIN")) {
      throw new Error("This node is canon. Leave a note for a reviewer before changing shipped story.");
    }

    // A speaker is a character from the bible, never free text — the importer
    // resolves the attribution against a real asset, so it must exist here.
    if (parsed.data.speakerEntryId) {
      const speaker = await tx.storyEntry.findUnique({ where: { id: parsed.data.speakerEntryId }, select: { kind: true } });
      if (!speaker || speaker.kind !== "CHARACTER") throw new Error("A speaker has to be a character from the bible.");
    }

    if (continuesInArcId) {
      if (continuesInArcId === node.arcId) throw new Error("An ending cannot continue into its own arc.");
      const nextArc = await tx.storyArc.findUnique({ where: { id: continuesInArcId }, select: { id: true } });
      if (!nextArc) throw new Error("The arc this ending continues into no longer exists.");
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
        speakerEntryId: parsed.data.speakerEntryId,
        endingKind,
        completion,
        effects: parsed.data.effects,
        rewards: parsed.data.rewards,
        continuesInArcId,
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
      before: { title: node.title, kind: node.kind, summary: node.summary, body: node.body, speakerEntryId: node.speakerEntryId, endingKind: node.endingKind, completion: node.completion, effects: node.effects, rewards: node.rewards, continuesInArcId: node.continuesInArcId },
      after: { title: parsed.data.title, kind: parsed.data.kind, summary: parsed.data.summary, body: parsed.data.body, speakerEntryId: parsed.data.speakerEntryId, endingKind, completion, effects: parsed.data.effects, rewards: parsed.data.rewards, continuesInArcId },
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
    // stays addressable by key. Any member can do it — the audit log shows
    // who, in red, and an administrator can restore from the revision trail.
    if (node.status === "CANON") {
      await tx.storyNode.update({ where: { id: node.id }, data: { status: "ARCHIVED", updatedByUserId: user.id } });
      await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: node.arcId, action: "STATUS_CHANGED", actorUserId: user.id, summary: `Archived the canon node "${node.title}"`, before: { status: "CANON" }, after: { status: "ARCHIVED" } });
      return node.arc.slug;
    }

    // Archived is terminal for this action. Without this, a second delete —
    // one stale tab away — fell through to the hard delete below and erased
    // the very node the archive path had just protected.
    if (node.status === "ARCHIVED") throw new Error("That node is already archived. An administrator can restore it from the revision trail.");

    // The node's edges go with it via the DB cascade, and each is a choice
    // asset the Unreal side may have built. Every one gets its own DELETED
    // revision with the key in `before` — the same contract deleteEdge keeps —
    // so the importer can match the report to the asset it loses.
    const attachedEdges = await tx.storyEdge.findMany({
      where: { OR: [{ fromNodeId: node.id }, { toNodeId: node.id }] },
      select: { id: true, key: true, label: true, condition: true },
    });
    for (const edge of attachedEdges) {
      await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: node.arcId, action: "DELETED", actorUserId: user.id, summary: `Removed a branch with "${node.title}"`, before: { key: edge.key, label: edge.label, condition: edge.condition } });
    }

    await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: node.arcId, action: "DELETED", actorUserId: user.id, summary: `Removed "${node.title}"`, before: { key: node.key, title: node.title, kind: node.kind, body: node.body } });
    await tx.storyNode.delete({ where: { id: node.id } });
    return node.arc.slug;
  });

  refreshCodex(arcSlug);
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/**
 * Choice keys are what the Unreal importer names a synthesised choice asset
 * by, so they are minted once at creation and never re-derived — a key built
 * from the label, the target, or the order would orphan the asset the moment
 * a writer relabelled, retargeted, or reordered the branch.
 */
async function availableChoiceKey(tx: Transaction, arcId: string, fromKey: string) {
  const base = `${slugifyStoryKey(fromKey, 66) || "scene"}-choice`;
  const siblings = await tx.storyEdge.findMany({ where: { arcId, key: { startsWith: base } }, select: { key: true } });
  const taken = new Set(siblings.map((edge) => edge.key));
  if (!taken.has(base)) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("That card has too many branches to key another one.");
}

export async function createEdge(input: { fromNodeId: string; toNodeId: string; label?: string | null }) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ fromNodeId: z.string().uuid(), toNodeId: z.string().uuid(), label: optionalText(200).optional() })
    .safeParse(input);
  if (!parsed.success) throw new Error("That transition is not valid.");
  if (parsed.data.fromNodeId === parsed.data.toNodeId) throw new Error("A node cannot continue into itself.");

  const arcSlug = await db.$transaction(async (tx) => {
    const [from, to] = await Promise.all([
      tx.storyNode.findUnique({ where: { id: parsed.data.fromNodeId }, select: { id: true, arcId: true, title: true, key: true, arc: { select: { slug: true } } } }),
      tx.storyNode.findUnique({ where: { id: parsed.data.toNodeId }, select: { id: true, arcId: true, title: true } }),
    ]);
    if (!from || !to) throw new Error("One end of that transition no longer exists.");
    // Enforced here rather than by a composite foreign key; see the note on
    // StoryEdge in schema.prisma.
    if (from.arcId !== to.arcId) throw new Error("A transition has to stay inside one arc.");

    // Several branches between the same pair of nodes are legitimate — three
    // differently-labelled choices can all lead to the same scene, with the
    // difference carried in their effects. The accident this used to guard
    // against, a double-dragged duplicate, still surfaces: two unlabelled
    // parallel branches are flagged as an unlabelled split on the board.

    const last = await tx.storyEdge.findFirst({ where: { fromNodeId: from.id }, orderBy: { position: "desc" }, select: { position: true } });
    const edge = await tx.storyEdge.create({
      data: {
        arcId: from.arcId,
        key: await availableChoiceKey(tx, from.arcId, from.key),
        fromNodeId: from.id,
        toNodeId: to.id,
        label: parsed.data.label ?? null,
        position: last ? last.position + 1 : 0,
        status: creationStatus(),
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
    .object({ edgeId: z.string().uuid(), toNodeId: z.string().uuid().nullable(), label: optionalText(200), condition: optionalText(300), effects: effectsList })
    .safeParse({ edgeId: formData.get("edgeId"), toNodeId: formData.get("toNodeId") || null, label: formData.get("label") ?? "", condition: formData.get("condition") ?? "", effects: formData.get("effects") ?? "" });
  if (!parsed.success) throw new Error("That transition is not valid.");

  const arcSlug = await db.$transaction(async (tx) => {
    const edge = await tx.storyEdge.findUnique({ where: { id: parsed.data.edgeId }, include: { arc: { select: { slug: true } }, fromNode: { select: { title: true } }, toNode: { select: { title: true } } } });
    if (!edge) throw new Error("That transition no longer exists.");
    if (!isStoryContentEditable(edge.status, user.role === "ADMIN")) {
      throw new Error("This branch is canon. Only a reviewer can change its choice text or condition.");
    }

    // Retargeting keeps the edge — and above all its key — so pointing a
    // choice somewhere new never orphans the asset the importer already built
    // from it. That is the whole reason choice keys exist.
    const toNodeId = parsed.data.toNodeId ?? edge.toNodeId;
    let targetTitle = edge.toNode.title;
    if (toNodeId !== edge.toNodeId) {
      const target = await tx.storyNode.findUnique({ where: { id: toNodeId }, select: { arcId: true, title: true } });
      if (!target) throw new Error("The card that branch should lead to no longer exists.");
      if (target.arcId !== edge.arcId) throw new Error("A transition has to stay inside one arc.");
      if (toNodeId === edge.fromNodeId) throw new Error("A node cannot continue into itself.");
      targetTitle = target.title;
    }

    await tx.storyEdge.update({ where: { id: edge.id }, data: { toNodeId, label: parsed.data.label, condition: parsed.data.condition, effects: parsed.data.effects } });
    await recordRevision(tx, {
      entityType: "EDGE",
      entityId: edge.id,
      arcId: edge.arcId,
      action: "UPDATED",
      actorUserId: user.id,
      summary: toNodeId !== edge.toNodeId
        ? `Moved the branch from "${edge.fromNode.title}" to lead to "${targetTitle}"`
        : `Relabelled the branch from "${edge.fromNode.title}" to "${edge.toNode.title}"`,
      before: { label: edge.label, condition: edge.condition, effects: edge.effects, toNode: edge.toNode.title },
      after: { label: parsed.data.label, condition: parsed.data.condition, effects: parsed.data.effects, toNode: targetTitle },
    });
    return edge.arc.slug;
  });

  refreshCodex(arcSlug);
}

/**
 * Swaps a branch with its neighbour above or below. Order is what the player
 * sees the choices in, so it is content — but like a drag on the canvas it is
 * recorded as MOVED, which the activity feed keeps out of the way.
 */
export async function reorderEdge(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ edgeId: z.string().uuid(), direction: z.enum(["up", "down"]) })
    .safeParse({ edgeId: formData.get("edgeId"), direction: formData.get("direction") });
  if (!parsed.success) throw new Error("Invalid reorder.");

  const arcSlug = await db.$transaction(async (tx) => {
    const edge = await tx.storyEdge.findUnique({ where: { id: parsed.data.edgeId }, include: { arc: { select: { slug: true } }, fromNode: { select: { title: true } } } });
    if (!edge) throw new Error("That transition no longer exists.");
    if (!isStoryContentEditable(edge.status, user.role === "ADMIN")) {
      throw new Error("This branch is canon. Only a reviewer can reorder the player's choices.");
    }

    const siblings = await tx.storyEdge.findMany({ where: { fromNodeId: edge.fromNodeId }, orderBy: { position: "asc" }, select: { id: true, position: true } });
    const index = siblings.findIndex((sibling) => sibling.id === edge.id);
    const swapWith = parsed.data.direction === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!swapWith) return edge.arc.slug; // already at the end — nothing to do

    // Three steps through a spare slot, because (fromNodeId, position) is
    // unique and the constraint is checked immediately.
    const spare = siblings[siblings.length - 1].position + 1;
    const own = edge.position;
    await tx.storyEdge.update({ where: { id: edge.id }, data: { position: spare } });
    await tx.storyEdge.update({ where: { id: swapWith.id }, data: { position: own } });
    await tx.storyEdge.update({ where: { id: edge.id }, data: { position: swapWith.position } });

    await recordRevision(tx, {
      entityType: "EDGE",
      entityId: edge.id,
      arcId: edge.arcId,
      action: "MOVED",
      actorUserId: user.id,
      summary: `Reordered the choices out of "${edge.fromNode.title}"`,
      before: { position: own },
      after: { position: swapWith.position },
    });
    return edge.arc.slug;
  });

  refreshCodex(arcSlug);
}

/**
 * Draws a new branch from a card in one submit — to an existing card, or to a
 * brand-new one created in the same transaction. This is what lets the story
 * grow from the reader's walk without a trip back to the whiteboard.
 */
export async function addBranch(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({
      fromNodeId: z.string().uuid(),
      targetNodeId: z.string().uuid().nullable(),
      label: optionalText(200),
      newTitle: optionalText(160),
      newKind: z.enum(storyNodeKinds).catch("SCENE"),
    })
    .safeParse({
      fromNodeId: formData.get("fromNodeId"),
      targetNodeId: formData.get("targetNodeId") || null,
      label: formData.get("label") ?? "",
      newTitle: formData.get("newTitle") ?? "",
      newKind: formData.get("newKind") ?? "SCENE",
    });
  if (!parsed.success) throw new Error("That branch is not valid.");
  if (!parsed.data.targetNodeId && !parsed.data.newTitle) throw new Error("Pick a card for the branch to lead to, or give the new card a title.");

  const arcSlug = await db.$transaction(async (tx) => {
    const from = await tx.storyNode.findUnique({ where: { id: parsed.data.fromNodeId }, select: { id: true, arcId: true, key: true, title: true, canvasX: true, canvasY: true, arc: { select: { slug: true } } } });
    if (!from) throw new Error("The card this branch starts from no longer exists.");

    let toNodeId = parsed.data.targetNodeId;
    let toTitle: string;
    if (toNodeId) {
      if (toNodeId === from.id) throw new Error("A node cannot continue into itself.");
      const target = await tx.storyNode.findUnique({ where: { id: toNodeId }, select: { arcId: true, title: true } });
      if (!target) throw new Error("The card that branch should lead to no longer exists.");
      if (target.arcId !== from.arcId) throw new Error("A transition has to stay inside one arc.");
      toTitle = target.title;
    } else {
      const title = parsed.data.newTitle as string;
      const node = await tx.storyNode.create({
        data: {
          arcId: from.arcId,
          kind: parsed.data.newKind,
          key: await availableNodeKey(tx, from.arcId, title),
          title,
          // The new card lands one column to the right of its parent, where
          // the branch visibly goes somewhere instead of onto a distant grid.
          canvasX: clampCanvas(from.canvasX + 300),
          canvasY: clampCanvas(from.canvasY + 40),
          status: creationStatus(),
          createdByUserId: user.id,
        },
        select: { id: true, title: true },
      });
      await recordRevision(tx, { entityType: "NODE", entityId: node.id, arcId: from.arcId, action: "CREATED", actorUserId: user.id, summary: `Added "${node.title}"` });
      toNodeId = node.id;
      toTitle = node.title;
    }

    const last = await tx.storyEdge.findFirst({ where: { fromNodeId: from.id }, orderBy: { position: "desc" }, select: { position: true } });
    const edge = await tx.storyEdge.create({
      data: {
        arcId: from.arcId,
        key: await availableChoiceKey(tx, from.arcId, from.key),
        fromNodeId: from.id,
        toNodeId,
        label: parsed.data.label,
        position: last ? last.position + 1 : 0,
        status: creationStatus(),
        createdByUserId: user.id,
      },
    });
    await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: from.arcId, action: "CREATED", actorUserId: user.id, summary: `Connected "${from.title}" to "${toTitle}"` });
    return from.arc.slug;
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

    // Open writers' room: anyone can cut a branch, and the audit log shows
    // who cut it. The key travels in `before`, so the Unreal side can match
    // the report against the asset it had built.
    await recordRevision(tx, { entityType: "EDGE", entityId: edge.id, arcId: edge.arcId, action: "DELETED", actorUserId: user.id, summary: `Cut the branch from "${edge.fromNode.title}" to "${edge.toNode.title}"`, before: { key: edge.key, label: edge.label, condition: edge.condition } });
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
  if (!parsed.success) throw new Error("A bible entry needs a kind, a title of 120 characters or fewer, a summary under 500, and detail under 20,000.");

  const slug = slugifyStoryKey(parsed.data.title);
  if (!isValidStoryKey(slug)) throw new Error("That title needs at least one letter or number.");

  const existing = await db.storyEntry.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("The bible already has an entry with that name.");

  // A place is born already placed. Creating it loose and adopting it later
  // through the sheet is what left new POIs sitting in "not placed in a region
  // yet" — so where it sits and what kind of place it is are asked here, and
  // written as a real region sheet rather than left null.
  const place = parsed.data.kind === "REGION" ? parseStoryPlaceKind(formData.get("placeKind")) : null;
  const parentSlug = parsed.data.kind === "REGION" ? metaSlug.safeParse(formData.get("parent")) : null;
  const parent = parentSlug?.success ? parentSlug.data : null;
  const placeMeta = place || parent
    ? {
        type: place?.type ?? null,
        settlementTier: place?.settlementTier ?? null,
        parent,
        biome: null,
        control: [],
        population: null,
        connections: [],
        status: null,
        gameTag: null,
        openQuestions: [],
      } satisfies StoryRegionMeta
    : null;

  await db.$transaction(async (tx) => {
    const entry = await tx.storyEntry.create({
      data: {
        kind: parsed.data.kind,
        slug,
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.data.body,
        status: creationStatus(),
        createdByUserId: user.id,
        ...(placeMeta ? { meta: placeMeta as Prisma.InputJsonValue } : {}),
      },
    });
    const placed = placeMeta?.parent ? `, inside ${placeMeta.parent}` : "";
    await recordRevision(tx, { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: user.id, summary: `Wrote the ${entry.kind.toLowerCase()} "${entry.title}"${placed}` });
  });

  refreshCodex();
  revalidatePath(`/codex/bible/${slug}`);
  // `created` opens the editing workspace on arrival, so the writer keeps
  // filling the sheet in instead of landing on a page that looks finished.
  redirect(`/codex/bible/${slug}?created=1`);
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
  if (!parsed.success) throw new Error("That edit needs a kind, a title of 120 characters or fewer, a summary under 500, and detail under 20,000.");

  const slug = await db.$transaction(async (tx) => {
    const entry = await tx.storyEntry.findUnique({ where: { id: parsed.data.entryId } });
    if (!entry) throw new Error("That entry no longer exists.");
    if (!isStoryContentEditable(entry.status, user.role === "ADMIN")) {
      throw new Error("This bible entry is canon. Leave a note for a reviewer before changing it.");
    }

    // A kind change must not orphan structural references that were validated
    // against the old kind at link time: a dialogue speaker has to stay a
    // CHARACTER, and an arc's pickup place has to stay a REGION. Without
    // these, "actually this should be an item" silently broke the exporter's
    // speaker-resolves-to-a-character-asset promise on every node involved.
    if (parsed.data.kind !== entry.kind) {
      if (entry.kind === "CHARACTER") {
        const speaks = await tx.storyNode.count({ where: { speakerEntryId: entry.id, status: { in: ["DRAFT", "PROPOSED", "CANON"] } } });
        if (speaks > 0) throw new Error(`"${entry.title}" speaks in ${speaks} scene${speaks === 1 ? "" : "s"}. Recast those speakers before changing what kind of entry this is.`);
      }
      if (entry.kind === "REGION") {
        const pickups = await tx.storyArc.count({ where: { regionEntryId: entry.id, status: { in: ["DRAFT", "PROPOSED", "CANON"] } } });
        if (pickups > 0) throw new Error(`"${entry.title}" is the pickup place of ${pickups} quest${pickups === 1 ? "" : "s"}. Repoint those arcs before changing what kind of entry this is.`);
      }
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

// --- Module meta (Codex_Module_Schema.md) ----------------------------------

const metaText = (max: number) => z.string().trim().min(1).max(max).nullable();
const metaLines = (max: number, each: number) => z.array(z.string().trim().min(1).max(each)).max(max);
/** Slug-typed meta fields reference other entries — link now, fill later, so
 *  only the shape is checked; an unresolved slug is a todo, not an error.
 *  The shape IS checked though: every real slug is kebab-case, so anything
 *  else ("The Northern Vale") could never resolve, never match a picker, and
 *  would sit in the sheet as a link that structurally cannot come true. */
const metaSlug = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "not a slug").max(64);

const characterMetaSchema = z.object({
  fullName: metaText(160),
  aliases: metaLines(20, 120),
  pronouns: metaText(40),
  sex: metaText(40),
  species: metaText(80),
  age: metaText(80),
  appearance: metaText(2000),
  voice: metaText(2000),
  magic: z.object({
    origin: z.enum(storyMagicOrigins).nullable(),
    schools: metaLines(12, 80),
    corruptionPhase: z.number().int().min(0).max(7).nullable(),
    notes: metaText(2000),
  }),
  factions: z.array(z.object({ faction: metaSlug, role: metaText(160), standing: metaText(160) })).max(12),
  home: metaText(64),
  status: z.object({ known: metaText(500), actual: metaText(500) }),
  relationships: z.array(z.object({ character: metaSlug.nullable(), who: metaText(160), type: metaText(300) })).max(30),
  storyRole: metaText(500),
  involvement: z.array(z.object({ arc: metaSlug, how: metaText(300) })).max(20),
  gameId: metaText(120),
  model: metaText(200),
  openQuestions: metaLines(30, 300),
});

// Enums come from the shared constants the sheets themselves render — never
// duplicated literals. The duplicated version rotted the moment the shared
// list grew: "destination" was added to storyRegionTypes and the region sheet
// offered it, while the copy here still rejected it, so saving any
// destination's sheet failed validation and stored nothing.
const regionMetaSchema = z.object({
  type: z.enum(storyRegionTypes).nullable(),
  settlementTier: z.enum(storySettlementTiers).nullable(),
  parent: metaText(64),
  biome: metaText(160),
  control: z.array(z.object({ faction: metaSlug, kind: z.enum(storyControlKinds).nullable() })).max(12),
  population: metaText(160),
  connections: z.array(z.object({ to: metaSlug, by: metaText(80), notes: metaText(300) })).max(30),
  status: metaText(160),
  gameTag: metaText(120),
  openQuestions: metaLines(30, 300),
});

const factionMetaSchema = z.object({
  scope: metaText(80),
  seat: metaText(64),
  leaders: metaLines(20, 64),
  relations: z.array(z.object({
    faction: metaSlug,
    stance: z.enum(storyFactionStances).nullable(),
    notes: metaText(500),
  })).max(30),
  goals: metaLines(20, 500),
  gameTag: metaText(120),
  openQuestions: metaLines(30, 300),
});

const creatureMetaSchema = z.object({
  category: z.enum(storyCreatureCategories).nullable(),
  biomes: metaLines(20, 160),
  threat: metaText(500),
  harvest: metaText(500),
  gameId: metaText(120),
  openQuestions: metaLines(30, 300),
});

const itemMetaSchema = z.object({
  category: metaText(80),
  rarity: metaText(80),
  origin: metaText(160),
  gameId: metaText(120),
  openQuestions: metaLines(30, 300),
});

const eventMetaSchema = z.object({
  when: metaText(160),
  where: metaLines(20, 64),
  involved: metaLines(30, 64),
  outcome: metaText(2000),
  openQuestions: metaLines(30, 300),
});

const metaSchemasByKind: Partial<Record<(typeof storyEntryKinds)[number], z.ZodTypeAny>> = {
  CHARACTER: characterMetaSchema,
  FACTION: factionMetaSchema,
  REGION: regionMetaSchema,
  CREATURE: creatureMetaSchema,
  ITEM: itemMetaSchema,
  EVENT: eventMetaSchema,
};

/**
 * "Remove" in the writers' room is deliberately recoverable. Archiving keeps
 * the revision history and every relationship intact while immediately taking
 * the entry out of the working library and canon export.
 */
export async function archiveEntry(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) throw new Error("Invalid story entry.");

  const entry = await db.$transaction(async (tx) => {
    const current = await tx.storyEntry.findUnique({ where: { id: entryId.data }, select: { id: true, slug: true, title: true, kind: true, status: true } });
    if (!current) throw new Error("That entry no longer exists.");
    await tx.storyEntry.update({ where: { id: current.id }, data: { status: "ARCHIVED", updatedByUserId: user.id, lockedByUserId: null, lockExpiresAt: null } });
    await recordRevision(tx, {
      entityType: "ENTRY",
      entityId: current.id,
      action: "STATUS_CHANGED",
      actorUserId: user.id,
      summary: `Archived "${current.title}"`,
      before: { status: current.status },
      after: { status: "ARCHIVED" },
    });
    return current;
  });

  refreshCodex();
  const collection = entry.kind === "CHARACTER" ? "characters" : entry.kind === "FACTION" ? "factions" : entry.kind === "REGION" ? "regions" : "all";
  redirect(collection === "all" ? "/codex/bible" : `/codex/library/${collection}`);
}

/**
 * Saves an entry's module sheet. The sheet component composes the object
 * client-side and ships it as JSON; nothing is trusted from that side — the
 * per-kind schema here is the contract, and a kind without a schema has no
 * sheet to save yet (its meta arrives via module files until one exists).
 */
export async function updateEntryMeta(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z
    .object({ entryId: z.string().uuid(), version: z.coerce.number().int().min(1), metaJson: z.string().max(30000) })
    .safeParse({ entryId: formData.get("entryId"), version: formData.get("version"), metaJson: formData.get("metaJson") });
  if (!parsed.success) throw new Error("That sheet could not be read.");

  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.metaJson);
  } catch {
    throw new Error("That sheet could not be read.");
  }

  const slug = await db.$transaction(async (tx) => {
    const entry = await tx.storyEntry.findUnique({ where: { id: parsed.data.entryId }, select: { id: true, kind: true, slug: true, title: true, meta: true, status: true } });
    if (!entry) throw new Error("That entry no longer exists.");
    if (!isStoryContentEditable(entry.status, user.role === "ADMIN")) throw new Error("This entry is canon. Leave a note for a reviewer.");

    const schema = metaSchemasByKind[entry.kind];
    if (!schema) throw new Error(`${entry.kind} entries do not have a sheet yet.`);
    const meta = schema.safeParse(raw);
    if (!meta.success) throw new Error("Some fields on that sheet are too long or the wrong shape. Nothing was saved.");

    const updated = await tx.storyEntry.updateMany({
      where: { id: entry.id, version: parsed.data.version },
      data: { meta: meta.data as Prisma.InputJsonValue, updatedByUserId: user.id, version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new Error("Somebody saved this entry while you were writing. Reopen it to see their version before saving yours.");

    await recordRevision(tx, {
      entityType: "ENTRY",
      entityId: entry.id,
      action: "UPDATED",
      actorUserId: user.id,
      summary: `Filled in the ${entry.kind.toLowerCase()} sheet for "${entry.title}"`,
      before: { meta: entry.meta },
      after: { meta: meta.data },
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

  const target = await db.$transaction(async (tx) => {
    await tx.storyComment.create({ data: { nodeId: parsed.data.nodeId, entryId: parsed.data.entryId, authorUserId: user.id, body: parsed.data.body } });

    if (parsed.data.nodeId) {
      const node = await tx.storyNode.findUnique({ where: { id: parsed.data.nodeId }, select: { arcId: true, arc: { select: { slug: true } } } });
      await recordRevision(tx, { entityType: "NODE", entityId: parsed.data.nodeId, arcId: node?.arcId ?? null, action: "UPDATED", actorUserId: user.id, summary: "Left a note" });
      return { arcSlug: node?.arc.slug ?? null, entrySlug: null };
    }

    const entryId = parsed.data.entryId as string;
    const entry = await tx.storyEntry.findUnique({ where: { id: entryId }, select: { slug: true } });
    await recordRevision(tx, { entityType: "ENTRY", entityId: entryId, action: "UPDATED", actorUserId: user.id, summary: "Left a note" });
    return { arcSlug: null, entrySlug: entry?.slug ?? null };
  });

  // A note has to appear on the surface it was written on, not only in the
  // activity feed: revalidating the index alone left the writer looking at the
  // card or bible entry they had just posted to with nothing new on it.
  refreshCodex(target.arcSlug);
  if (target.entrySlug) revalidatePath(`/codex/bible/${target.entrySlug}`);
}

export async function resolveComment(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const commentId = z.string().uuid().safeParse(formData.get("commentId"));
  if (!commentId.success) throw new Error("Invalid note.");

  const target = await db.$transaction(async (tx) => {
    const comment = await tx.storyComment.findUnique({
      where: { id: commentId.data },
      include: { node: { select: { arcId: true, arc: { select: { slug: true } } } }, entry: { select: { slug: true } } },
    });
    if (!comment) return { arcSlug: null, entrySlug: null };
    const surface = { arcSlug: comment.node?.arc.slug ?? null, entrySlug: comment.entry?.slug ?? null };
    if (comment.resolvedAt) return surface;

    await tx.storyComment.update({ where: { id: comment.id }, data: { resolvedAt: new Date(), resolvedByUserId: user.id } });
    await recordRevision(tx, {
      entityType: comment.nodeId ? "NODE" : "ENTRY",
      entityId: comment.nodeId ?? comment.entryId ?? comment.id,
      arcId: comment.node?.arcId ?? null,
      action: "UPDATED",
      actorUserId: user.id,
      summary: "Resolved a story note",
    });
    return surface;
  });

  refreshCodex(target.arcSlug);
  if (target.entrySlug) revalidatePath(`/codex/bible/${target.entrySlug}`);
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
