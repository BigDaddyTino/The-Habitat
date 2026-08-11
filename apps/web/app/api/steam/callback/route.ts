import "@/lib/environment";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { hasRequiredRole } from "@/lib/permissions";
import { verifySteamOpenId } from "@/lib/steam-openid";

const db = getPrismaClient();

function profileRedirect(request: Request, status: string) {
  const target = new URL("/profile", request.url);
  target.searchParams.set("steam", status);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) return NextResponse.redirect(new URL("/sign-in", request.url));
  const parameters = new URL(request.url).searchParams;
  const state = parameters.get("state");
  if (!state || !/^[a-f0-9]{64}$/.test(state)) return profileRedirect(request, "invalid");
  const stateHash = createHash("sha256").update(state).digest("hex");
  const nonce = await db.steamLinkNonce.findUnique({ where: { stateHash }, select: { id: true, userId: true, expiresAt: true, consumedAt: true } });
  if (!nonce || nonce.userId !== session.user.id || nonce.consumedAt || nonce.expiresAt <= new Date()) return profileRedirect(request, "expired");

  const expectedReturnTo = new URL("/api/steam/callback", request.url);
  expectedReturnTo.searchParams.set("state", state);
  if (parameters.get("openid.return_to") !== expectedReturnTo.toString()) return profileRedirect(request, "invalid");
  const steamId = await verifySteamOpenId(parameters).catch(() => null);
  if (!steamId) return profileRedirect(request, "invalid");

  const conflict = await db.userSocialAccount.findFirst({ where: { platform: "STEAM", userId: { not: session.user.id }, OR: [{ providerAccountId: steamId }, { handle: steamId }] }, select: { id: true } });
  const claimedByAnotherMember = await db.playerIdentity.findFirst({ where: { externalProvider: "STEAM", externalAccountId: steamId, userId: { not: null }, NOT: { userId: session.user.id } }, select: { id: true } });
  if (conflict || claimedByAnotherMember) return profileRedirect(request, "conflict");

  const now = new Date();
  const linkedCount = await db.$transaction(async (transaction) => {
    const consumed = await transaction.steamLinkNonce.updateMany({ where: { id: nonce.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
    if (consumed.count !== 1) throw new Error("Steam link response was already used.");
    const account = await transaction.userSocialAccount.upsert({
      where: { userId_platform: { userId: session.user.id, platform: "STEAM" } },
      create: { userId: session.user.id, platform: "STEAM", handle: steamId, profileUrl: `https://steamcommunity.com/profiles/${steamId}`, providerAccountId: steamId, verifiedAt: now },
      update: { handle: steamId, profileUrl: `https://steamcommunity.com/profiles/${steamId}`, providerAccountId: steamId, verifiedAt: now },
    });
    const identities = await transaction.playerIdentity.updateMany({ where: { externalProvider: "STEAM", externalAccountId: steamId, userId: null }, data: { userId: session.user.id, verifiedAt: now } });
    await transaction.playerIdentityClaim.updateMany({ where: { userId: session.user.id, status: "PENDING", playerIdentity: { externalProvider: "STEAM", externalAccountId: steamId } }, data: { status: "APPROVED", resolvedAt: now, resolvedByUserId: session.user.id, resolutionNote: "Automatically verified by linked SteamID64." } });
    await transaction.playerIdentityClaim.updateMany({ where: { userId: { not: session.user.id }, status: "PENDING", playerIdentity: { externalProvider: "STEAM", externalAccountId: steamId } }, data: { status: "REJECTED", resolvedAt: now, resolutionNote: "Identity ownership was verified through a linked Steam account." } });
    await transaction.auditLog.create({ data: { actorUserId: session.user.id, action: "STEAM_ACCOUNT_VERIFIED", entityType: "UserSocialAccount", entityId: account.id, after: { provider: "STEAM", identitiesLinked: identities.count } } });
    return identities.count;
  }).catch(() => null);
  if (linkedCount === null) return profileRedirect(request, "invalid");
  revalidatePath("/profile");
  revalidatePath("/profile/identities");
  revalidatePath("/admin/claims");
  return profileRedirect(request, linkedCount > 0 ? `connected-${linkedCount}` : "connected");
}
