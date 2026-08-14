import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The tunnel probe target.
 *
 * Habitat Pulse proves the Cloudflare tunnel is carrying traffic by fetching
 * this from the worker, which leaves the network and comes back in. It is
 * deliberately unauthenticated — an authenticated probe would only prove the
 * sign-in path — and just as deliberately says nothing beyond "this is the
 * Habitat web app, and it is answering": no version, no build, no uptime, and
 * nothing that would help fingerprint the installation.
 */
export function GET() {
  return NextResponse.json(
    { service: "habitat-web", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
