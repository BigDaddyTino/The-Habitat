import "@/lib/environment";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { resolveTwitchProvider, twitchAuthorizeUrl } from "@habitat/shared";
import { hasRequiredRole } from "@/lib/permissions";
import { publicOrigin, publicUrl } from "@/lib/public-url";
import { createTwitchLinkState, twitchLinkNonceExpiry, twitchRedirectUri } from "@/lib/twitch-link";

const db = getPrismaClient();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) return NextResponse.redirect(publicUrl("/sign-in", request.url));
  // A missing or disabled integration is a configuration state, not an error the
  // member can act on, so it returns them to the profile with an explanation.
  const provider = resolveTwitchProvider(process.env);
  if (!provider) {
    const unconfigured = publicUrl("/profile", request.url);
    unconfigured.searchParams.set("twitch", "unconfigured");
    return NextResponse.redirect(unconfigured, 303);
  }

  const { state, stateHash } = createTwitchLinkState();
  const now = new Date();
  await db.$transaction([
    db.twitchLinkNonce.deleteMany({ where: { userId: session.user.id, expiresAt: { lt: now } } }),
    db.twitchLinkNonce.create({ data: { userId: session.user.id, stateHash, expiresAt: twitchLinkNonceExpiry(now) } }),
  ]);

  // The redirect URI carries no query of its own: Twitch compares it verbatim
  // against the registered value, and the state travels in `state` instead.
  return NextResponse.redirect(twitchAuthorizeUrl({ clientId: provider.clientId, redirectUri: twitchRedirectUri(publicOrigin(request.url)), state }));
}
