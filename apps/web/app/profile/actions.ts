"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { profileUrlForPlatform, socialPlatforms } from "@/lib/social-platforms";

const db = getPrismaClient();
const equipSchema = z.object({ userTitleId: z.string().uuid() });
const profileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,23}$/, "Use 3–24 lowercase letters, numbers, or hyphens."),
  displayName: z.string().trim().min(2).max(50),
  bio: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(500).nullable()),
});
const socialSchema = z.object({ platform: z.enum(socialPlatforms), handle: z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9._ -]+$/, "That handle contains unsupported characters.") });
const cosmeticSchema = z.object({ kind: z.enum(["AVATAR_BORDER", "PROFILE_LAYOUT"]), code: z.string().trim().max(64) });
const avatarPresets = ["/images/avatars/campfire.svg", "/images/avatars/raven.svg", "/images/avatars/mountain.svg", "/images/avatars/ufo.svg"] as const;

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

export async function updateProfile(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = profileSchema.safeParse({ username: formData.get("username"), displayName: formData.get("displayName"), bio: formData.get("bio") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid profile details.");
  const conflict = await db.user.findFirst({ where: { username: parsed.data.username, id: { not: user.id } }, select: { id: true } });
  if (conflict) throw new Error("That callsign is already claimed.");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: parsed.data }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_UPDATED", entityType: "User", entityId: user.id, after: { username: parsed.data.username, displayName: parsed.data.displayName } } }),
  ]);
  revalidatePath("/profile");
  revalidatePath(`/members/${parsed.data.username}`);
}

export async function addSocialAccount(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = socialSchema.safeParse({ platform: formData.get("platform"), handle: formData.get("handle") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid account link.");
  if (parsed.data.platform === "STEAM") throw new Error("Steam accounts must be verified through Steam sign-in.");
  const existingHandle = await db.userSocialAccount.findFirst({ where: { platform: parsed.data.platform, handle: parsed.data.handle, userId: { not: user.id } }, select: { id: true } });
  if (existingHandle) throw new Error("That public handle is already linked to another Habitat profile.");
  const account = await db.userSocialAccount.upsert({
    where: { userId_platform: { userId: user.id, platform: parsed.data.platform } },
    create: { userId: user.id, platform: parsed.data.platform, handle: parsed.data.handle, profileUrl: profileUrlForPlatform(parsed.data.platform, parsed.data.handle) },
    update: { handle: parsed.data.handle, profileUrl: profileUrlForPlatform(parsed.data.platform, parsed.data.handle) },
  });
  await db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_SOCIAL_ACCOUNT_SAVED", entityType: "UserSocialAccount", entityId: account.id, after: { platform: account.platform } } });
  revalidatePath("/profile");
}

export async function removeSocialAccount(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = z.object({ accountId: z.string().uuid() }).safeParse({ accountId: formData.get("accountId") });
  if (!parsed.success) throw new Error("Invalid account link.");
  const account = await db.userSocialAccount.findFirst({ where: { id: parsed.data.accountId, userId: user.id }, select: { id: true, platform: true, verifiedAt: true } });
  if (!account) throw new Error("That account link is unavailable.");
  if (account.platform === "STEAM" && account.verifiedAt) throw new Error("Use Disconnect Steam for a verified Steam account.");
  await db.$transaction([
    db.userSocialAccount.delete({ where: { id: account.id } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_SOCIAL_ACCOUNT_REMOVED", entityType: "UserSocialAccount", entityId: account.id, before: { platform: account.platform } } }),
  ]);
  revalidatePath("/profile");
}

export async function disconnectSteam() {
  const user = await requireRole("USER");
  const account = await db.userSocialAccount.findFirst({ where: { userId: user.id, platform: "STEAM", verifiedAt: { not: null } }, select: { id: true } });
  if (!account) return;
  await db.$transaction([
    db.userSocialAccount.delete({ where: { id: account.id } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "STEAM_ACCOUNT_DISCONNECTED", entityType: "UserSocialAccount", entityId: account.id, before: { provider: "STEAM" } } }),
  ]);
  revalidatePath("/profile");
}

export async function equipCosmetic(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = cosmeticSchema.safeParse({ kind: formData.get("kind"), code: formData.get("code") });
  if (!parsed.success) throw new Error("Invalid cosmetic selection.");
  const field = parsed.data.kind === "AVATAR_BORDER" ? "avatarBorder" : "profileLayout";
  if (parsed.data.code === "default") {
    await db.user.update({ where: { id: user.id }, data: { [field]: null } });
  } else {
    const reward = await db.userAchievementReward.findFirst({ where: { userId: user.id, reward: { kind: parsed.data.kind, code: parsed.data.code } }, select: { id: true } });
    if (!reward) throw new Error("That cosmetic has not been unlocked.");
    await db.$transaction([
      db.userAchievementReward.updateMany({ where: { userId: user.id, reward: { kind: parsed.data.kind } }, data: { equipped: false } }),
      db.userAchievementReward.update({ where: { id: reward.id }, data: { equipped: true } }),
      db.user.update({ where: { id: user.id }, data: { [field]: parsed.data.code } }),
    ]);
  }
  await db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_COSMETIC_EQUIPPED", entityType: "User", entityId: user.id, after: { kind: parsed.data.kind, code: parsed.data.code } } });
  revalidatePath("/profile");
}

export async function selectAvatarPreset(formData: FormData) {
  const user = await requireRole("USER");
  const image = formData.get("image");
  if (typeof image !== "string" || !avatarPresets.includes(image as (typeof avatarPresets)[number])) throw new Error("Invalid avatar preset.");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { image } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_AVATAR_PRESET_SELECTED", entityType: "User", entityId: user.id, after: { image } } }),
  ]);
  revalidatePath("/profile");
}
