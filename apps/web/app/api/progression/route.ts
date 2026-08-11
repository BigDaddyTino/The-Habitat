import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp } from "@habitat/shared";

const db = getPrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [total, entries] = await Promise.all([
    db.userXpEntry.aggregate({ where: { userId: session.user.id }, _sum: { amount: true } }),
    db.userXpEntry.findMany({ where: { userId: session.user.id }, orderBy: [{ earnedAt: "desc" }, { id: "desc" }], take: 12, select: { id: true, amount: true, source: true, description: true, earnedAt: true } }),
  ]);
  return NextResponse.json({ ...progressionForXp(total._sum.amount ?? 0), entries }, { headers: { "Cache-Control": "no-store" } });
}
