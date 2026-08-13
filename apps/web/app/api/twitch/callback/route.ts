import "@/lib/environment";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { resolveTwitchProvider, twitchChannelUrl } from "@habitat/shared";
import { hasRequiredRole } from "@/lib/permissions";
import { publicOrigin, publicUrl } from "@/lib/public-url";
import {
  hasTwitchLinkConflict,
  hashTwitchLinkState,
  isTwitchAuthorizationCode,
  isTwitchLinkState,
  isUsableTwitchLinkNonce,
  isVerifiableTwitchAccount,
  twitchAuthorizationErrorStatus,
  twitchChannelProfileFields,
  twitchRedirectUri,
  type TwitchLinkStatus,
} from "@/lib/twitch-link";

const db = getPrismaClient();

function profileRedirect(request: Request, status: TwitchLinkStatus) {
  const target = publicUrl("/profile", request.url);
  target.searchParams.set("twitch", status);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) return NextResponse.redirect(publicUrl("/sign-in", request.url));
  const provider = resolveTwitchProvider(process.env);
  if (!provider) return profileRedirect(request, "unconfigured");

  const parameters = new URL(request.url).searchParams;
  // A declined authorization arrives here as an error pair, never as a code.
  const reported = twitchAuthorizationErrorStatus(parameters.get("error"));
  if (reported) return profileRedirect(request, reported);
  const state = parameters.get("state");
  const code = parameters.get("code");
  if (!isTwitchLinkState(state) || !isTwitchAuthorizationCode(code)) return profileRedirect(request, "invalid");

  const nonce = await db.twitchLinkNonce.findUnique({ where: { stateHash: hashTwitchLinkState(state) }, select: { id: true, userId: true, expiresAt: true, consumedAt: true } });
  if (!nonce || !isUsableTwitchLinkNonce(nonce, session.user.id, new Date())) return profileRedirect(request, "expired");

  // The exchange must present the exact URI the connect route sent, which is why
  // both routes build it through the same helper.
  const account = await provider.verifyAuthorizationCode(code.trim(), twitchRedirectUri(publicOrigin(request.url))).catch(() => null);
  if (!account || !isVerifiableTwitchAccount(account)) return profileRedirect(request, "invalid");

  // Refuse before writing: a Twitch identity belongs to exactly one member, and
  // both the channel row and the social-account row can already claim it.
  const [claimedChannel, claimedAccount] = await Promise.all([
    db.twitchChannel.findUnique({ where: { twitchUserId: account.twitchUserId }, select: { userId: true } }),
    db.userSocialAccount.findFirst({ where: { platform: "TWITCH", userId: { not: session.user.id }, OR: [{ providerAccountId: account.twitchUserId }, { handle: account.login }] }, select: { userId: true } }),
  ]);
  if (hasTwitchLinkConflict({ userId: session.user.id, channelUserId: claimedChannel?.userId, socialAccountUserId: claimedAccount?.userId })) return profileRedirect(request, "conflict");

  const now = new Date();
  const fields = twitchChannelProfileFields(account);
  const profileUrl = twitchChannelUrl(account.login);
  const linked = await db.$transaction(async (transaction) => {
    // Guarding the update on the unconsumed, unexpired window is what makes the
    // nonce single-use: a replayed callback updates zero rows and aborts here.
    const consumed = await transaction.twitchLinkNonce.updateMany({ where: { id: nonce.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
    if (consumed.count !== 1) throw new Error("Twitch link response was already used.");
    const socialAccount = await transaction.userSocialAccount.upsert({
      where: { userId_platform: { userId: session.user.id, platform: "TWITCH" } },
      create: { userId: session.user.id, platform: "TWITCH", handle: fields.login, profileUrl, providerAccountId: account.twitchUserId, verifiedAt: now },
      update: { handle: fields.login, profileUrl, providerAccountId: account.twitchUserId, verifiedAt: now },
    });
    // `showcaseEnabled` is absent from `update` on purpose: verifying ownership
    // is not consent to be featured, and re-verifying must not silently change a
    // choice the member already made either way.
    const channel = await transaction.twitchChannel.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, socialAccountId: socialAccount.id, twitchUserId: account.twitchUserId, showcaseEnabled: false, connectedAt: now, ...fields },
      update: { socialAccountId: socialAccount.id, twitchUserId: account.twitchUserId, ...fields },
      select: { id: true, showcaseEnabled: true },
    });
    await transaction.auditLog.create({ data: { actorUserId: session.user.id, action: "TWITCH_CHANNEL_VERIFIED", entityType: "TwitchChannel", entityId: channel.id, after: { provider: "TWITCH", twitchUserId: account.twitchUserId, login: fields.login, showcaseEnabled: channel.showcaseEnabled } } });
    return channel.id;
  }).catch(() => null);
  if (linked === null) return profileRedirect(request, "invalid");
  revalidatePath("/profile");
  revalidatePath("/streams");
  return profileRedirect(request, "connected");
}
