"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { profileUrlForPlatform, socialPlatforms } from "@/lib/social-platforms";
import { refusal } from "@/lib/writer-refusal";

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
  if (!parsed.success) throw refusal("Invalid title selection.");
  const title = await db.userTitle.findFirst({ where: { id: parsed.data.userTitleId, userId: user.id }, select: { id: true, titleDefinitionId: true } });
  if (!title) throw refusal("This title is not available to equip.");
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
  if (!parsed.success) throw refusal(parsed.error.issues[0]?.message ?? "Invalid profile details.");
  const conflict = await db.user.findFirst({ where: { username: parsed.data.username, id: { not: user.id } }, select: { id: true } });
  if (conflict) throw refusal("That callsign is already claimed.");
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
  if (!parsed.success) throw refusal(parsed.error.issues[0]?.message ?? "Invalid account link.");
  if (parsed.data.platform === "STEAM") throw refusal("Steam accounts must be verified through Steam sign-in.");
  const existingHandle = await db.userSocialAccount.findFirst({ where: { platform: parsed.data.platform, handle: parsed.data.handle, userId: { not: user.id } }, select: { id: true } });
  if (existingHandle) throw refusal("That public handle is already linked to another Habitat profile.");
  await db.$transaction(async (transaction) => {
    const account = await transaction.userSocialAccount.upsert({
      where: { userId_platform: { userId: user.id, platform: parsed.data.platform } },
      create: { userId: user.id, platform: parsed.data.platform, handle: parsed.data.handle, profileUrl: profileUrlForPlatform(parsed.data.platform, parsed.data.handle) },
      update: { handle: parsed.data.handle, profileUrl: profileUrlForPlatform(parsed.data.platform, parsed.data.handle) },
    });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_SOCIAL_ACCOUNT_SAVED", entityType: "UserSocialAccount", entityId: account.id, after: { platform: account.platform } } });
  });
  revalidatePath("/profile");
}

export async function removeSocialAccount(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = z.object({ accountId: z.string().uuid() }).safeParse({ accountId: formData.get("accountId") });
  if (!parsed.success) throw refusal("Invalid account link.");
  const account = await db.userSocialAccount.findFirst({ where: { id: parsed.data.accountId, userId: user.id }, select: { id: true, platform: true, verifiedAt: true } });
  if (!account) throw refusal("That account link is unavailable.");
  if (account.platform === "STEAM" && account.verifiedAt) throw refusal("Use Disconnect Steam for a verified Steam account.");
  await db.$transaction([
    db.userSocialAccount.delete({ where: { id: account.id } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_SOCIAL_ACCOUNT_REMOVED", entityType: "UserSocialAccount", entityId: account.id, before: { platform: account.platform } } }),
  ]);
  revalidatePath("/profile");
}

export async function disconnectSteam(formData: FormData) {
  const user = await requireRole("USER");
  // Disconnecting leaves already-attached identities in place, so the member is
  // shown that consequence and has to acknowledge it before the proof is removed.
  if (formData.get("acknowledged") !== "on") throw refusal("Acknowledge the disconnect consequences before removing Steam verification.");
  const account = await db.userSocialAccount.findFirst({
    where: { userId: user.id, platform: "STEAM", verifiedAt: { not: null } },
    select: { id: true, steamProfile: { select: { id: true, _count: { select: { libraryGames: true, userAchievements: true } } } } },
  });
  if (!account) return;
  await db.$transaction([
    db.userSocialAccount.delete({ where: { id: account.id } }),
    db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "STEAM_ACCOUNT_DISCONNECTED",
        entityType: "UserSocialAccount",
        entityId: account.id,
        before: {
          provider: "STEAM",
          enrichmentDeleted: Boolean(account.steamProfile),
          cachedLibraryGamesDeleted: account.steamProfile?._count.libraryGames ?? 0,
          cachedAchievementRowsDeleted: account.steamProfile?._count.userAchievements ?? 0,
        },
      },
    }),
  ]);
  revalidatePath("/profile");
}

export async function enableSteamEnrichment(formData: FormData) {
  const user = await requireRole("USER");
  if (formData.get("consent") !== "on") throw refusal("Consent is required before Steam enrichment can be enabled.");
  const account = await db.userSocialAccount.findFirst({ where: { userId: user.id, platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } }, select: { id: true } });
  if (!account) throw refusal("Verify a Steam account before enabling enrichment.");
  const now = new Date();
  await db.$transaction(async (transaction) => {
    const profile = await transaction.steamProfile.upsert({
      where: { socialAccountId: account.id },
      create: { socialAccountId: account.id, enrichmentEnabledAt: now, profileNextAttemptAt: now, libraryNextAttemptAt: now },
      update: { enrichmentEnabledAt: now, profileNextAttemptAt: now, libraryNextAttemptAt: now },
    });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "STEAM_ENRICHMENT_ENABLED", entityType: "SteamProfile", entityId: profile.id, after: { consentedAt: now.toISOString(), displayPublic: profile.displayPublic } } });
  });
  revalidatePath("/profile");
}

export async function disableSteamEnrichment() {
  const user = await requireRole("USER");
  const profile = await db.steamProfile.findFirst({ where: { socialAccount: { is: { userId: user.id, platform: "STEAM" } } }, select: { id: true, _count: { select: { libraryGames: true } } } });
  if (!profile) return;
  await db.$transaction([
    db.steamProfile.delete({ where: { id: profile.id } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "STEAM_ENRICHMENT_DISABLED_AND_DELETED", entityType: "SteamProfile", entityId: profile.id, before: { cachedLibraryGames: profile._count.libraryGames } } }),
  ]);
  revalidatePath("/profile");
}

export async function updateSteamEnrichmentVisibility(formData: FormData) {
  const user = await requireRole("USER");
  const displayPublic = formData.get("displayPublic") === "on";
  const profile = await db.steamProfile.findFirst({ where: { socialAccount: { is: { userId: user.id, platform: "STEAM" } } }, select: { id: true } });
  if (!profile) throw refusal("Steam enrichment is not enabled.");
  await db.$transaction([
    db.steamProfile.update({ where: { id: profile.id }, data: { displayPublic } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "STEAM_ENRICHMENT_VISIBILITY_UPDATED", entityType: "SteamProfile", entityId: profile.id, after: { displayPublic } } }),
  ]);
  revalidatePath("/profile");
  const member = await db.user.findUnique({ where: { id: user.id }, select: { username: true } });
  if (member?.username) revalidatePath(`/members/${member.username}`);
}

export async function equipCosmetic(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = cosmeticSchema.safeParse({ kind: formData.get("kind"), code: formData.get("code") });
  if (!parsed.success) throw refusal("Invalid cosmetic selection.");
  const field = parsed.data.kind === "AVATAR_BORDER" ? "avatarBorder" : "profileLayout";
  if (parsed.data.code === "default") {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { [field]: null } }),
      db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_COSMETIC_EQUIPPED", entityType: "User", entityId: user.id, after: { kind: parsed.data.kind, code: parsed.data.code } } }),
    ]);
  } else {
    const reward = await db.userAchievementReward.findFirst({ where: { userId: user.id, reward: { kind: parsed.data.kind, code: parsed.data.code } }, select: { id: true } });
    if (!reward) throw refusal("That cosmetic has not been unlocked.");
    await db.$transaction([
      db.userAchievementReward.updateMany({ where: { userId: user.id, reward: { kind: parsed.data.kind } }, data: { equipped: false } }),
      db.userAchievementReward.update({ where: { id: reward.id }, data: { equipped: true } }),
      db.user.update({ where: { id: user.id }, data: { [field]: parsed.data.code } }),
      db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_COSMETIC_EQUIPPED", entityType: "User", entityId: user.id, after: { kind: parsed.data.kind, code: parsed.data.code } } }),
    ]);
  }
  revalidatePath("/profile");
}

export async function selectAvatarPreset(formData: FormData) {
  const user = await requireRole("USER");
  const image = formData.get("image");
  if (typeof image !== "string" || !avatarPresets.includes(image as (typeof avatarPresets)[number])) throw refusal("Invalid avatar preset.");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { image } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PROFILE_AVATAR_PRESET_SELECTED", entityType: "User", entityId: user.id, after: { image } } }),
  ]);
  revalidatePath("/profile");
}
