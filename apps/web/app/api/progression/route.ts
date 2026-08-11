import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp } from "@habitat/shared";

const db = getPrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [total, entries, achievements] = await Promise.all([
    db.userXpEntry.aggregate({ where: { userId: session.user.id }, _sum: { amount: true } }),
    db.userXpEntry.findMany({ where: { userId: session.user.id }, orderBy: [{ earnedAt: "desc" }, { id: "desc" }], take: 12, select: { id: true, amount: true, source: true, description: true, earnedAt: true } }),
    db.playerAchievement.findMany({ where: { userId: session.user.id, achievement: { rarity: { in: ["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"] } } }, orderBy: [{ awardedAt: "desc" }, { id: "desc" }], take: 8, select: { id: true, awardedAt: true, achievement: { select: { name: true, rarity: true, description: true } } } }),
  ]);
  return NextResponse.json({ ...progressionForXp(total._sum.amount ?? 0), entries, achievements }, { headers: { "Cache-Control": "no-store" } });
}
