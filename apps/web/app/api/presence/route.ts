import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { describeUserAgent } from "@/lib/member-presence";

const db = getPrismaClient();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const device = describeUserAgent(request.headers.get("user-agent") ?? "");
  await db.memberPresence.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, authProvider: "Discord", ...device },
    update: { authProvider: "Discord", ...device, lastSeenAt: new Date() },
  });
  return NextResponse.json({ active: true });
}
