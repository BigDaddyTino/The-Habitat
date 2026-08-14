"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

export async function joinSeason(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const seasonId = String(formData.get("seasonId") ?? "");
  const season = await db.season.findFirst({ where: { id: seasonId, isEnabled: true, status: { in: ["UPCOMING", "ACTIVE"] }, endsAt: { gt: new Date() } }, select: { id: true, slug: true } });
  if (!season) redirect("/seasons?notice=season-unavailable");
  await db.$transaction(async (transaction) => {
    const existing = await transaction.seasonMembership.findUnique({ where: { seasonId_userId: { seasonId: season.id, userId: session.user.id } }, select: { id: true } });
    if (existing) return;
    const membership = await transaction.seasonMembership.create({ data: { seasonId: season.id, userId: session.user.id } });
    await transaction.auditLog.create({ data: { actorUserId: session.user.id, action: "SEASON_JOINED", entityType: "SeasonMembership", entityId: membership.id, after: { seasonId: season.id } } });
  });
  revalidatePath("/seasons");
  revalidatePath("/leaderboards/season");
  redirect("/seasons?notice=joined");
}
