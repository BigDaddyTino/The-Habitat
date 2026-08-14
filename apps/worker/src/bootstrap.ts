import { startWorkerTelemetry } from "./telemetry.js";

/**
 * Load OpenTelemetry before the worker's database and HTTP dependencies.
 * Auto-instrumentation can only patch modules that have not already loaded.
 */
async function bootstrap(): Promise<void> {
  // Configuration is the worker's explicit root .env loader and has no HTTP or
  // database dependencies of its own. It must run before the SDK resolves its
  // endpoint and before Prisma resolves DATABASE_URL.
  await import("./config.js");
  await startWorkerTelemetry();
  await import("./index.js");
}

void bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to start Habitat Worker.");
  process.exitCode = 1;
});
