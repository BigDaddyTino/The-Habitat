"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const titleSchema = z.object({ name: z.string().trim().min(3).max(60), description: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(180).nullable()) });
const grantSchema = z.object({ titleDefinitionId: z.string().uuid(), userId: z.string().uuid() });
const editSchema = titleSchema.extend({ id: z.string().uuid(), enabled: z.enum(["true", "false"]).transform((value) => value === "true") });

export async function createTitleDefinition(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = titleSchema.safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) throw new Error("Invalid title definition.");
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("Title name must contain letters or numbers.");
  const title = await db.titleDefinition.create({ data: { slug, name: parsed.data.name, description: parsed.data.description } });
  await db.auditLog.create({ data: { actorUserId: admin.id, action: "TITLE_DEFINITION_CREATED", entityType: "TitleDefinition", entityId: title.id, after: { name: title.name } } });
  revalidatePath("/admin/titles");
}

export async function grantTitle(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = grantSchema.safeParse({ titleDefinitionId: formData.get("titleDefinitionId"), userId: formData.get("userId") });
  if (!parsed.success) throw new Error("Invalid title grant.");
  const [title, recipient] = await Promise.all([
    db.titleDefinition.findUnique({ where: { id: parsed.data.titleDefinitionId }, select: { id: true, enabled: true } }),
    db.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true, isActive: true } }),
  ]);
  if (!title?.enabled || !recipient?.isActive) throw new Error("Title or recipient is unavailable.");
  const existing = await db.userTitle.findUnique({ where: { userId_titleDefinitionId: { userId: recipient.id, titleDefinitionId: title.id } }, select: { id: true } });
  if (existing) return;
  const award = await db.userTitle.create({ data: { userId: recipient.id, titleDefinitionId: title.id, source: "ADMIN", awardedByUserId: admin.id } });
  await db.auditLog.create({ data: { actorUserId: admin.id, action: "USER_TITLE_GRANTED", entityType: "UserTitle", entityId: award.id, after: { titleDefinitionId: title.id, userId: recipient.id } } });
  revalidatePath("/admin/titles");
  revalidatePath("/profile");
}

export async function updateTitleDefinition(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = editSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), description: formData.get("description"), enabled: formData.get("enabled") });
  if (!parsed.success) throw new Error("Invalid title update.");

  const existing = await db.titleDefinition.findUnique({ where: { id: parsed.data.id }, select: { id: true, slug: true, name: true, description: true, enabled: true } });
  if (!existing) throw new Error("Title definition was not found.");

  const title = await db.titleDefinition.update({
    where: { id: existing.id },
    data: { name: parsed.data.name, description: parsed.data.description, enabled: parsed.data.enabled },
  });
  await db.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "TITLE_DEFINITION_UPDATED",
      entityType: "TitleDefinition",
      entityId: title.id,
      before: { slug: existing.slug, name: existing.name, description: existing.description, enabled: existing.enabled },
      after: { slug: title.slug, name: title.name, description: title.description, enabled: title.enabled },
    },
  });
  revalidatePath("/admin/titles");
  revalidatePath("/profile");
  revalidatePath("/members", "layout");
}
