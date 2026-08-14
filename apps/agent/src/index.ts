import { loadAgentConfiguration } from "./config.js";
import { startAgentTelemetry } from "./telemetry.js";

async function main(): Promise<void> {
  const configuration = await loadAgentConfiguration();
  // Started before the listener so the inbound HTTP instrumentation is in place
  // for the first request rather than the second.
  const telemetry = await startAgentTelemetry();
  const { startAgentServer } = await import("./server.js");
  const server = await startAgentServer(configuration);
  console.info(`Habitat Agent listening on ${configuration.bindHost}:${configuration.port} for ${configuration.allowedIps.length} trusted client(s).`);

  const shutdown = () => server.close(() => {
    void telemetry.stop().finally(() => process.exit(0));
  });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to start Habitat Agent.");
  process.exitCode = 1;
});
