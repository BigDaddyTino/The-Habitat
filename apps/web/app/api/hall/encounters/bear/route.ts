import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { isCurrentHallEncounter } from "@/lib/hall-atmosphere";
import { hasRequiredRole } from "@/lib/permissions";
import { isPublicOrigin } from "@/lib/public-url";

const db = getPrismaClient();
const achievementSlug = "do-not-tap-the-glass";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isPublicOrigin(origin, request.url)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasRequiredRole(session.user.role, "USER")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { encounterKey?: unknown } | null;
  const encounterKey = typeof body?.encounterKey === "string" && body.encounterKey.length <= 100 ? body.encounterKey : null;
  if (!encounterKey || !isCurrentHallEncounter("bear", encounterKey)) {
    return NextResponse.json({ error: "The bear has already returned to the treeline." }, { status: 409 });
  }

  const result = await db.$transaction(async (transaction) => {
    const achievement = await transaction.achievementDefinition.findFirst({
      where: { slug: achievementSlug, enabled: true, ruleType: "WEB_INTERACTION" },
      select: {
        id: true, name: true, description: true, rarity: true, category: true, points: true,
        rewards: { select: { id: true, kind: true, code: true, name: true, titleDefinitionId: true } },
      },
    });
    if (!achievement) return null;

    const dedupeKey = `web-interaction:${achievementSlug}:${session.user.id}`;
    const existing = await transaction.playerAchievement.findUnique({ where: { dedupeKey }, select: { id: true } });
    const award = existing ?? await transaction.playerAchievement.create({
      data: { userId: session.user.id, achievementDefinitionId: achievement.id, awardedAt: new Date(), dedupeKey },
      select: { id: true },
    });
    for (const reward of achievement.rewards) {
      await transaction.userAchievementReward.upsert({
        where: { userId_achievementRewardId: { userId: session.user.id, achievementRewardId: reward.id } },
        create: { userId: session.user.id, achievementRewardId: reward.id, playerAchievementId: award.id },
        update: {},
      });
      if (reward.kind === "TITLE" && reward.titleDefinitionId) {
        await transaction.userTitle.upsert({
          where: { userId_titleDefinitionId: { userId: session.user.id, titleDefinitionId: reward.titleDefinitionId } },
          create: { userId: session.user.id, titleDefinitionId: reward.titleDefinitionId, source: "ACHIEVEMENT" },
          update: {},
        });
      }
    }
    if (!existing) {
      await transaction.auditLog.create({
        data: { actorUserId: session.user.id, action: "HALL_BEAR_SECRET_DISCOVERED", entityType: "PlayerAchievement", entityId: award.id, after: { achievementSlug, encounterKey } },
      });
    }
    return {
      awarded: !existing,
      alreadyEarned: Boolean(existing),
      achievement: {
        awardId: award.id,
        name: achievement.name,
        description: achievement.description,
        rarity: achievement.rarity,
        category: achievement.category,
        points: achievement.points,
        rewards: achievement.rewards.map(({ kind, code, name }) => ({ kind, code, name })),
      },
    };
  });

  if (!result) return NextResponse.json({ error: "achievement unavailable" }, { status: 503 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
