"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { fetchMarvelRivalsProfile, isValidMarvelRivalsQuery, MarvelRivalsApiError, type MarvelRivalsProfileData } from "@habitat/shared";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authorization";
import { createHash } from "node:crypto";

const db = getPrismaClient();
const roomPath = "/club-games/marvel-rivals";

export type RivalsLinkState = { status: "idle" | "success" | "error"; message: string };

function errorMessage(error: unknown) {
  if (error instanceof MarvelRivalsApiError) return error.message;
  return "The profile could not be linked right now. Nothing was changed.";
}

function profileFields(profile: MarvelRivalsProfileData) {
  const now = new Date();
  const providerUpdatedAt = profile.providerUpdatedAt ? new Date(profile.providerUpdatedAt) : null;
  return {
    providerUid: profile.uid,
    displayName: profile.displayName,
    lastAttemptedAt: now,
    lastSyncedAt: now,
    nextAttemptAt: new Date(now.getTime() + 6 * 60 * 60 * 1_000),
    consecutiveFailures: 0,
    syncStatus: "READY" as const,
    syncError: null,
    playerLevel: profile.playerLevel,
    rankName: profile.rankName,
    peakRankName: profile.peakRankName,
    rankScore: profile.rankScore,
    totalMatches: profile.totalMatches,
    totalWins: profile.totalWins,
    overallKd: profile.overallKd,
    overallKda: profile.overallKda,
    topHeroes: profile.topHeroes,
    providerUpdatedAt: providerUpdatedAt && !Number.isNaN(providerUpdatedAt.getTime()) ? providerUpdatedAt : null,
    matchNextAttemptAt: now,
  };
}

async function saveSnapshot(profileId: string, profile: MarvelRivalsProfileData) {
  const sampleKey = createHash("sha256").update(JSON.stringify({ profileId, providerUpdatedAt: profile.providerUpdatedAt, rankName: profile.rankName, rankScore: profile.rankScore, totalMatches: profile.totalMatches, totalWins: profile.totalWins, overallKd: profile.overallKd, overallKda: profile.overallKda, topHeroes: profile.topHeroes })).digest("hex");
  await db.clubGameStatSnapshot.upsert({
    where: { sampleKey },
    create: {
      profileId,
      sampleKey,
      source: "marvelrivalsapi.com",
      rankName: profile.rankName,
      rankScore: profile.rankScore,
      totalMatches: profile.totalMatches,
      totalWins: profile.totalWins,
      overallKd: profile.overallKd,
      overallKda: profile.overallKda,
      topHeroes: profile.topHeroes,
    },
    update: {},
  });
}

export async function linkMarvelRivalsProfile(_previous: RivalsLinkState, formData: FormData): Promise<RivalsLinkState> {
  const user = await requireRole("USER");
  if (formData.get("providerConsent") !== "on") return { status: "error", message: "Consent is required before Habitat can retrieve and retain Rivals provider data." };
  const query = String(formData.get("query") ?? "").trim();
  const platform = String(formData.get("platform") ?? "PC");
  if (!isValidMarvelRivalsQuery(query)) return { status: "error", message: "Enter a valid Rivals name or UID." };
  if (!new Set(["PC", "PLAYSTATION", "XBOX"]).has(platform)) return { status: "error", message: "Choose a supported platform." };
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return { status: "error", message: "Profile linking is not online yet. An administrator must configure the private provider key." };

  try {
    const result = await fetchMarvelRivalsProfile(query, apiKey);
    const conflict = await db.clubGameProfile.findFirst({ where: { gameType: "MARVEL_RIVALS", providerUid: result.uid, userId: { not: user.id } }, select: { id: true } });
    if (conflict) return { status: "error", message: "That Rivals UID is already linked to another Habitat member." };
    const profile = await db.clubGameProfile.upsert({
      where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } },
      create: { userId: user.id, gameType: "MARVEL_RIVALS", platform, displayPublic: false, ...profileFields(result) },
      update: { platform, ...profileFields(result) },
    });
    await Promise.all([
      saveSnapshot(profile.id, result),
      db.auditLog.create({ data: { actorUserId: user.id, action: "MARVEL_RIVALS_PROFILE_LINKED", entityType: "ClubGameProfile", entityId: profile.id, after: { providerUid: result.uid, displayName: result.displayName, platform, verification: "MEMBER_LINKED" } } }),
    ]);
    revalidatePath(roomPath);
    revalidatePath("/profile");
    return { status: "success", message: `${result.displayName} is now on the Assembly Room board.` };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function updateMarvelRivalsVisibility(formData: FormData): Promise<void> {
  const user = await requireRole("USER");
  const displayPublic = formData.get("displayPublic") === "on";
  const profile = await db.clubGameProfile.update({ where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } }, data: { displayPublic }, select: { id: true } });
  await db.auditLog.create({ data: { actorUserId: user.id, action: "MARVEL_RIVALS_VISIBILITY_UPDATED", entityType: "ClubGameProfile", entityId: profile.id, after: { displayPublic } } });
  revalidatePath(roomPath);
  revalidatePath("/chronicle");
}

export async function refreshMarvelRivalsProfile(): Promise<void> {
  const user = await requireRole("USER");
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return;
  const current = await db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } } });
  if (!current) return;
  if (current.nextAttemptAt && current.nextAttemptAt > new Date()) return;
  try {
    const result = await fetchMarvelRivalsProfile(current.providerUid, apiKey);
    await db.clubGameProfile.update({ where: { id: current.id }, data: profileFields(result) });
    await saveSnapshot(current.id, result);
  } catch (error) {
    const status = error instanceof MarvelRivalsApiError && error.code === "PRIVATE" ? "PRIVATE" : "ERROR";
    await db.clubGameProfile.update({ where: { id: current.id }, data: { syncStatus: status, syncError: errorMessage(error).slice(0, 180), lastAttemptedAt: new Date(), nextAttemptAt: new Date(Date.now() + (status === "PRIVATE" ? 24 : 1) * 60 * 60 * 1_000), consecutiveFailures: { increment: 1 } } });
  }
  revalidatePath(roomPath);
  revalidatePath("/profile");
}

export async function disconnectMarvelRivalsProfile(): Promise<void> {
  const user = await requireRole("USER");
  const current = await db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } }, select: { id: true, providerUid: true } });
  if (!current) return;
  await db.$transaction(async (transaction) => {
    await transaction.clubGameProfile.delete({ where: { id: current.id } });
    await transaction.clubGameMatch.deleteMany({ where: { participants: { none: {} } } });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "MARVEL_RIVALS_PROFILE_DISCONNECTED_AND_PROVIDER_DATA_DELETED", entityType: "ClubGameProfile", entityId: current.id, before: { providerIdentityWasLinked: Boolean(current.providerUid) } } });
  });
  revalidatePath(roomPath);
  revalidatePath("/profile");
}
