/**
 * Next.js process bootstrap.
 *
 * `register` runs once per server process, before any request is handled, which
 * makes it the only correct place for both OpenTelemetry and the web app's own
 * Habitat Pulse heartbeat.
 *
 * Everything is guarded on the Node.js runtime: the Edge runtime has neither a
 * Prisma client nor the OpenTelemetry Node SDK, and importing them there would
 * break the build rather than the request.
 *
 * `@/lib/environment` is loaded first and deliberately. It is the module that
 * reads .env, and every other entry point picks it up incidentally by importing
 * a page or a route — but `register` runs before any of those exist. Without
 * this line the SDK reads an empty environment and reports itself permanently
 * off, while the heartbeat fails on a missing DATABASE_URL until some later
 * request happens to load the environment for it.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./lib/environment");
  const { startWebTelemetry } = await import("./lib/telemetry");
  const { startWebHeartbeat } = await import("./lib/heartbeat");
  const telemetry = await startWebTelemetry();
  startWebHeartbeat(telemetry.enabled);
}
