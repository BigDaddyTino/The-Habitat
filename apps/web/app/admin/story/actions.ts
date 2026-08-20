"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { generateStoryExportToken, hashStoryExportToken } from "@/lib/story-export";
import { refusal } from "@/lib/writer-refusal";

const db = getPrismaClient();

/**
 * Issues a token for a machine that reads the canon export — the Unreal editor
 * on the game box, or a Claude session working in that project.
 *
 * The plaintext is returned once, here, and never stored. There is deliberately
 * no way to read it back: a token that can be recovered from the database is a
 * token a database leak hands over.
 */
export type IssueTokenState = { token?: string; error?: string };

export async function issueExportToken(_previous: IssueTokenState, formData: FormData): Promise<IssueTokenState> {
  const user = await requireRole("ADMIN");
  const label = z.string().trim().min(1).max(80).safeParse(formData.get("label"));
  if (!label.success) return { error: "Give the token a label so you can tell them apart." };

  const token = generateStoryExportToken();
  const created = await db.$transaction(async (tx) => {
    const row = await tx.storyExportToken.create({ data: { label: label.data, tokenHash: hashStoryExportToken(token), createdByUserId: user.id } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "STORY_EXPORT_TOKEN_ISSUED", entityType: "StoryExportToken", entityId: row.id, after: { label: label.data } } });
    return row;
  });

  revalidatePath("/admin/story");
  return { token: created ? token : undefined };
}

export async function revokeExportToken(formData: FormData) {
  const user = await requireRole("ADMIN");
  const tokenId = z.string().uuid().safeParse(formData.get("tokenId"));
  if (!tokenId.success) throw refusal("Invalid token.");

  await db.$transaction(async (tx) => {
    const updated = await tx.storyExportToken.updateMany({ where: { id: tokenId.data, revokedAt: null }, data: { revokedAt: new Date() } });
    if (updated.count === 1) {
      await tx.auditLog.create({ data: { actorUserId: user.id, action: "STORY_EXPORT_TOKEN_REVOKED", entityType: "StoryExportToken", entityId: tokenId.data } });
    }
  });

  revalidatePath("/admin/story");
}
