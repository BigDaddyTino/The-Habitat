import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { getWorldBySlug } from "@/lib/world-data";
import { addressConfiguration, playerConnectionDetails, resolvePlayerAddress } from "@/lib/player-connection-address";
import { isPlayerGameSlug, type PlayerConnectionResult } from "@habitat/shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: PlayerConnectionResult, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) {
    return json({ status: "unauthorized", message: "Sign in as a Habitat member to see connection details." }, 403);
  }
  const { slug } = await params;
  if (!isPlayerGameSlug(slug)) return json({ status: "unavailable", message: "This world has no connection guide." }, 404);
  const world = await getWorldBySlug(slug);
  if (!world?.enabled) return json({ status: "unavailable", message: "This world is not accepting connections." }, 404);
  try {
    const configuration = addressConfiguration(process.env);
    if (!configuration) return json({ status: "unconfigured", message: "Connection details are being prepared. Check back shortly." });
    const address = await resolvePlayerAddress(configuration);
    return json({ status: "ready", state: world.state, details: playerConnectionDetails(slug, address, process.env) });
  } catch {
    return json({ status: "unavailable", message: "The current connection address could not be checked. Refresh to try again." }, 503);
  }
}
