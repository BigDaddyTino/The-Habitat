"use server";

import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrismaClient } from "@habitat/db/client";
import { canonicalStoryEntryRouteSlug, storyIdeaFacets, storyIdeaStageLabels, storyThreadStatuses, type StoryIdeaSection } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { resolveIdeaAttachmentFile } from "@/lib/idea-attachments";
import { threadMetaSchema } from "@/lib/story-meta-schemas";
import { storyReadRole, storyMemberName } from "@/lib/story-codex";
import { refusal } from "@/lib/writer-refusal";

/**
 * The Idea Center's text-only writes. Files go through the multipart route in
 * app/api/codex/ideas; everything here is a form field or a button.
 *
 * Every write reads the stored meta, changes one thing, validates the result
 * against the thread sheet's own schema, and writes the MERGED object — so a
 * key this code has never heard of (a publication marker, a later field) is
 * carried through untouched instead of stripped.
 */
const db = getPrismaClient();
const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {});

function refreshIdea(slug: string) {
  revalidatePath("/codex/ideas");
  revalidatePath(`/codex/ideas/${canonicalStoryEntryRouteSlug(slug)}`);
  revalidatePath(`/codex/bible/${slug}`);
  revalidatePath("/codex/stories");
  revalidatePath("/codex/stories/map");
}

async function loadIdea(entryId: string) {
  const entry = await db.storyEntry.findFirst({ where: { id: entryId, kind: "THREAD", status: { in: [...workingStatuses] } }, select: { id: true, slug: true, title: true, meta: true, createdByUserId: true } });
  if (!entry) throw refusal("That idea no longer exists.");
  return entry;
}

/** Validate the whole sheet, then write the merged raw object so unknown keys survive. */
async function writeMeta(entryId: string, merged: Record<string, unknown>, actorUserId: string, summary: string) {
  const parsed = threadMetaSchema.safeParse(merged);
  if (!parsed.success) throw refusal("That change would leave the idea's sheet in a shape the codex cannot store. Nothing was saved.");
  await db.$transaction([
    db.storyEntry.update({ where: { id: entryId }, data: { meta: merged as never, updatedByUserId: actorUserId, version: { increment: 1 } } }),
    db.storyRevision.create({ data: { entityType: "ENTRY", entityId: entryId, action: "UPDATED", actorUserId, summary } }),
  ]);
}

const sectionSchema = z.object({ entryId: z.string().uuid(), facet: z.enum(storyIdeaFacets), body: z.string().trim().min(1).max(6000) });

/** Anybody adds detail under one facet; it carries their name and never replaces the proposer's overview. */
export async function addIdeaSection(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = sectionSchema.safeParse({ entryId: formData.get("entryId"), facet: formData.get("facet"), body: formData.get("body") });
  if (!parsed.success) throw refusal("Write something under the tab — up to 6,000 characters.");
  const entry = await loadIdea(parsed.data.entryId);
  const meta = asRecord(entry.meta);
  const author = await db.user.findUnique({ where: { id: user.id }, select: { displayName: true, name: true, username: true } });
  const section: StoryIdeaSection = { id: randomUUID(), facet: parsed.data.facet, body: parsed.data.body, authorUserId: user.id, authorName: storyMemberName(author), at: new Date().toISOString() };
  const facets = new Set(Array.isArray(meta.facets) ? (meta.facets as unknown[]) : []);
  facets.add(parsed.data.facet);
  await writeMeta(entry.id, { ...meta, facets: storyIdeaFacets.filter((facet) => facets.has(facet)), sections: [...(Array.isArray(meta.sections) ? (meta.sections as unknown[]) : []), section] }, user.id, `Added ${parsed.data.facet} detail to "${entry.title}"`);
  refreshIdea(entry.slug);
}

/** The section's author, the idea's proposer, or an admin can take a section down. */
export async function removeIdeaSection(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ entryId: z.string().uuid(), sectionId: z.string().uuid() }).safeParse({ entryId: formData.get("entryId"), sectionId: formData.get("sectionId") });
  if (!parsed.success) throw refusal("That section could not be found.");
  const entry = await loadIdea(parsed.data.entryId);
  const meta = asRecord(entry.meta);
  const sections = Array.isArray(meta.sections) ? (meta.sections as Array<Record<string, unknown>>) : [];
  const section = sections.find((row) => row.id === parsed.data.sectionId);
  if (!section) throw refusal("That section is already gone.");
  const allowed = section.authorUserId === user.id || entry.createdByUserId === user.id || (await hasRole("ADMIN"));
  if (!allowed) throw refusal("Only the person who wrote that, the idea's proposer, or the owner can remove it.");
  await writeMeta(entry.id, { ...meta, sections: sections.filter((row) => row.id !== parsed.data.sectionId) }, user.id, `Removed a ${String(section.facet)} section from "${entry.title}"`);
  refreshIdea(entry.slug);
}

/** The stage is the thread status under a plain-language name; any member can move it, and the room sees who did. */
export async function setIdeaStage(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ entryId: z.string().uuid(), status: z.enum(storyThreadStatuses) }).safeParse({ entryId: formData.get("entryId"), status: formData.get("status") });
  if (!parsed.success) throw refusal("Pick a stage from the list.");
  const entry = await loadIdea(parsed.data.entryId);
  const meta = asRecord(entry.meta);
  if (meta.threadStatus === parsed.data.status) return;
  await writeMeta(entry.id, { ...meta, threadStatus: parsed.data.status }, user.id, `Moved "${entry.title}" to ${storyIdeaStageLabels[parsed.data.status]}`);
  refreshIdea(entry.slug);
}

/** Which kinds of thing the idea is. Proposer or admin. */
export async function setIdeaFacets(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) throw refusal("That idea could not be found.");
  const entry = await loadIdea(entryId.data);
  if (entry.createdByUserId !== user.id && !(await hasRole("ADMIN"))) throw refusal("Only the proposer or the owner changes what kind of idea this is. Add a tab's worth of detail instead — that claims the category too.");
  const facets = storyIdeaFacets.filter((facet) => formData.getAll("facets").includes(facet));
  const meta = asRecord(entry.meta);
  await writeMeta(entry.id, { ...meta, facets }, user.id, `Refiled "${entry.title}" as ${facets.join(", ") || "uncategorised"}`);
  refreshIdea(entry.slug);
}

/** The proposer's own words. Only the proposer (or the owner) rewrites them. */
export async function updateIdeaText(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ entryId: z.string().uuid(), title: z.string().trim().min(1).max(120), summary: z.string().trim().max(500), body: z.string().trim().max(20000) })
    .safeParse({ entryId: formData.get("entryId"), title: formData.get("title"), summary: formData.get("summary") ?? "", body: formData.get("body") ?? "" });
  if (!parsed.success) throw refusal("An idea needs a name up to 120 characters, a one-liner under 500, and a write-up under 20,000.");
  const entry = await loadIdea(parsed.data.entryId);
  if (entry.createdByUserId !== user.id && !(await hasRole("ADMIN"))) throw refusal("Only the proposer or the owner edits the idea itself. Add your thoughts under a tab or in the discussion — they carry your name.");
  await db.$transaction([
    db.storyEntry.update({ where: { id: entry.id }, data: { title: parsed.data.title, summary: parsed.data.summary || null, body: parsed.data.body || null, updatedByUserId: user.id, version: { increment: 1 } } }),
    db.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: user.id, summary: `Rewrote the idea "${parsed.data.title}"` } }),
  ]);
  refreshIdea(entry.slug);
}

export async function toggleIdeaBookmark(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) throw refusal("That idea could not be found.");
  const entry = await loadIdea(entryId.data);
  const existing = await db.storyEntryBookmark.findUnique({ where: { userId_entryId: { userId: user.id, entryId: entry.id } } });
  if (existing) await db.storyEntryBookmark.delete({ where: { userId_entryId: { userId: user.id, entryId: entry.id } } });
  else await db.storyEntryBookmark.create({ data: { userId: user.id, entryId: entry.id } });
  refreshIdea(entry.slug);
}

/** The uploader, the proposer, or an admin removes a picture or file — row first, then the bytes. */
export async function deleteIdeaAttachment(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const id = z.string().uuid().safeParse(formData.get("attachmentId"));
  if (!id.success) throw refusal("That file could not be found.");
  const row = await db.storyEntryAttachment.findUnique({ where: { id: id.data }, select: { id: true, storedName: true, fileName: true, uploadedByUserId: true, entry: { select: { id: true, slug: true, title: true, createdByUserId: true } } } });
  if (!row) throw refusal("That file is already gone.");
  const allowed = row.uploadedByUserId === user.id || row.entry.createdByUserId === user.id || (await hasRole("ADMIN"));
  if (!allowed) throw refusal("Only whoever added that file, the idea's proposer, or the owner can remove it.");
  await db.$transaction([
    db.storyEntryAttachment.delete({ where: { id: row.id } }),
    db.storyRevision.create({ data: { entityType: "ENTRY", entityId: row.entry.id, action: "UPDATED", actorUserId: user.id, summary: `Removed the attachment "${row.fileName}" from "${row.entry.title}"` } }),
  ]);
  const target = resolveIdeaAttachmentFile(row.storedName);
  if (target) await unlink(target).catch(() => undefined);
  refreshIdea(row.entry.slug);
}

export async function setIdeaAttachmentCaption(formData: FormData) {
  const user = await requireRole(storyReadRole);
  const parsed = z.object({ attachmentId: z.string().uuid(), caption: z.string().trim().max(300) }).safeParse({ attachmentId: formData.get("attachmentId"), caption: formData.get("caption") ?? "" });
  if (!parsed.success) throw refusal("A caption is up to 300 characters.");
  const row = await db.storyEntryAttachment.findUnique({ where: { id: parsed.data.attachmentId }, select: { id: true, uploadedByUserId: true, entry: { select: { slug: true, createdByUserId: true } } } });
  if (!row) throw refusal("That file is already gone.");
  const allowed = row.uploadedByUserId === user.id || row.entry.createdByUserId === user.id || (await hasRole("ADMIN"));
  if (!allowed) throw refusal("Only whoever added that file, the idea's proposer, or the owner can caption it.");
  await db.storyEntryAttachment.update({ where: { id: row.id }, data: { caption: parsed.data.caption || null } });
  refreshIdea(row.entry.slug);
}
