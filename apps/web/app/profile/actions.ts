"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const equipSchema = z.object({ userTitleId: z.string().uuid() });

export async function equipTitle(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = equipSchema.safeParse({ userTitleId: formData.get("userTitleId") });
  if (!parsed.success) throw new Error("Invalid title selection.");
  const title = await db.userTitle.findFirst({ where: { id: parsed.data.userTitleId, userId: user.id }, select: { id: true, titleDefinitionId: true } });
  if (!title) throw new Error("This title is not available to equip.");
  await db.$transaction([
    db.userTitle.updateMany({ where: { userId: user.id, equipped: true }, data: { equipped: false } }),
    db.userTitle.update({ where: { id: title.id }, data: { equipped: true } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "USER_TITLE_EQUIPPED", entityType: "UserTitle", entityId: title.id, after: { titleDefinitionId: title.titleDefinitionId } } }),
  ]);
  revalidatePath("/profile");
}
