"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authorization";
import { refusal } from "@/lib/writer-refusal";

const db = getPrismaClient();

/**
 * Showcase controls for a member's own verified channel. Appearing in the public
 * showcase is a revocable choice kept separate from verifying the account, so it
 * is only ever changed from here, by the channel's owner.
 */
export async function updateTwitchShowcaseVisibility(formData: FormData): Promise<void> {
  const user = await requireRole("USER");
  const showcaseEnabled = formData.get("showcaseEnabled") === "on";
  const channel = await db.twitchChannel.findUnique({ where: { userId: user.id }, select: { id: true, showcaseEnabled: true } });
  if (!channel) throw refusal("Verify a Twitch channel before choosing showcase visibility.");
  if (channel.showcaseEnabled === showcaseEnabled) return;
  await db.$transaction([
    db.twitchChannel.update({ where: { id: channel.id }, data: { showcaseEnabled } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "TWITCH_SHOWCASE_VISIBILITY_UPDATED", entityType: "TwitchChannel", entityId: channel.id, before: { showcaseEnabled: channel.showcaseEnabled }, after: { showcaseEnabled } } }),
  ]);
  revalidatePath("/profile");
  revalidatePath("/streams");
}

/**
 * Removes the verification and everything observed under it: the channel row,
 * its recorded broadcasts (cascaded from the channel), and the verified Twitch
 * social account. Disconnecting must leave nothing behind that would keep the
 * member on the showcase or in the worker's polling set.
 */
export async function disconnectTwitchChannel(): Promise<void> {
  const user = await requireRole("USER");
  const channel = await db.twitchChannel.findUnique({
    where: { userId: user.id },
    select: { id: true, socialAccountId: true, login: true, showcaseEnabled: true, _count: { select: { sessions: true } } },
  });
  if (!channel) return;
  await db.$transaction(async (transaction) => {
    // StreamSession rows cascade from the channel; the social account is removed
    // explicitly so no verified TWITCH link survives the disconnect.
    await transaction.twitchChannel.delete({ where: { id: channel.id } });
    await transaction.userSocialAccount.deleteMany({ where: { id: channel.socialAccountId, userId: user.id, platform: "TWITCH" } });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "TWITCH_CHANNEL_DISCONNECTED_AND_SESSIONS_DELETED", entityType: "TwitchChannel", entityId: channel.id, before: { provider: "TWITCH", login: channel.login, showcaseEnabled: channel.showcaseEnabled, deletedStreamSessions: channel._count.sessions } } });
  });
  revalidatePath("/profile");
  revalidatePath("/streams");
}
