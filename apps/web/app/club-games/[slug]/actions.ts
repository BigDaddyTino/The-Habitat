"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { fetchMarvelRivalsProfile, isValidMarvelRivalsQuery, MarvelRivalsApiError, type MarvelRivalsProfileData } from "@habitat/shared";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const roomPath = "/club-games/marvel-rivals";

export type RivalsLinkState = { status: "idle" | "success" | "error"; message: string };

function errorMessage(error: unknown) {
  if (error instanceof MarvelRivalsApiError) return error.message;
  return "The profile could not be linked right now. Nothing was changed.";
}

function profileFields(profile: MarvelRivalsProfileData) {
  return {
    providerUid: profile.uid,
    displayName: profile.displayName,
    lastSyncedAt: new Date(),
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
  };
}

async function saveSnapshot(profileId: string, profile: MarvelRivalsProfileData) {
  await db.clubGameStatSnapshot.create({
    data: {
      profileId,
      sampleKey: `${profileId}:${Date.now()}`,
      source: "marvelrivalsapi.com",
      rankName: profile.rankName,
      rankScore: profile.rankScore,
      totalMatches: profile.totalMatches,
      totalWins: profile.totalWins,
      overallKd: profile.overallKd,
      overallKda: profile.overallKda,
      topHeroes: profile.topHeroes,
    },
  });
}

export async function linkMarvelRivalsProfile(_previous: RivalsLinkState, formData: FormData): Promise<RivalsLinkState> {
  const user = await requireRole("USER");
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
      create: { userId: user.id, gameType: "MARVEL_RIVALS", platform, ...profileFields(result) },
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

export async function refreshMarvelRivalsProfile(): Promise<void> {
  const user = await requireRole("USER");
  const apiKey = process.env.MARVEL_RIVALS_API_KEY?.trim();
  if (!apiKey) return;
  const current = await db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } } });
  if (!current) return;
  try {
    const result = await fetchMarvelRivalsProfile(current.providerUid, apiKey);
    await db.clubGameProfile.update({ where: { id: current.id }, data: profileFields(result) });
    await saveSnapshot(current.id, result);
  } catch (error) {
    const status = error instanceof MarvelRivalsApiError && error.code === "PRIVATE" ? "PRIVATE" : "ERROR";
    await db.clubGameProfile.update({ where: { id: current.id }, data: { syncStatus: status, syncError: errorMessage(error).slice(0, 180) } });
  }
  revalidatePath(roomPath);
  revalidatePath("/profile");
}

export async function disconnectMarvelRivalsProfile(): Promise<void> {
  const user = await requireRole("USER");
  const current = await db.clubGameProfile.findUnique({ where: { userId_gameType: { userId: user.id, gameType: "MARVEL_RIVALS" } }, select: { id: true, providerUid: true } });
  if (!current) return;
  await db.$transaction([
    db.clubGameProfile.delete({ where: { id: current.id } }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "MARVEL_RIVALS_PROFILE_DISCONNECTED", entityType: "ClubGameProfile", entityId: current.id, before: { providerUid: current.providerUid } } }),
  ]);
  revalidatePath(roomPath);
  revalidatePath("/profile");
}
