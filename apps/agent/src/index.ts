import { loadAgentConfiguration } from "./config.js";
import { startAgentServer } from "./server.js";

async function main(): Promise<void> {
  const configuration = await loadAgentConfiguration();
  const server = await startAgentServer(configuration);
  console.info(`Habitat Agent listening on ${configuration.bindHost}:${configuration.port} for ${configuration.allowedIps.length} trusted client(s).`);

  const shutdown = () => server.close(() => process.exit(0));
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to start Habitat Agent.");
  process.exitCode = 1;
});
