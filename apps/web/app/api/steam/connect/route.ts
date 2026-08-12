import "@/lib/environment";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { hasRequiredRole } from "@/lib/permissions";
import { publicOrigin, publicUrl } from "@/lib/public-url";
import { steamOpenIdEndpoint } from "@/lib/steam-openid";

const db = getPrismaClient();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) return NextResponse.redirect(publicUrl("/sign-in", request.url));
  const state = randomBytes(32).toString("hex");
  const stateHash = createHash("sha256").update(state).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.$transaction([
    db.steamLinkNonce.deleteMany({ where: { userId: session.user.id, expiresAt: { lt: new Date() } } }),
    db.steamLinkNonce.create({ data: { userId: session.user.id, stateHash, expiresAt } }),
  ]);

  const returnTo = publicUrl("/api/steam/callback", request.url);
  returnTo.searchParams.set("state", state);
  const realm = publicOrigin(request.url).origin;
  const target = new URL(steamOpenIdEndpoint);
  target.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  target.searchParams.set("openid.mode", "checkid_setup");
  target.searchParams.set("openid.return_to", returnTo.toString());
  target.searchParams.set("openid.realm", `${realm}/`);
  target.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  target.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
  return NextResponse.redirect(target);
}
