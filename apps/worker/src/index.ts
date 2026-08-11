import { HabitatAgentClient } from "./agent-client.js";
import { loadWorkerConfiguration } from "./config.js";
import { createPostgresMonitoringRepository, runMonitoringCycle } from "./monitoring.js";
import { getPrismaClient } from "@habitat/db/client";
import { startDiscordBot } from "./discord-bot.js";
import { dispatchPendingDiscordNotifications } from "./discord-notifications.js";
import { createPostgresServerCommandRepository, dispatchAuthorizedServerCommands } from "./server-commands.js";
import { importLegacyHistory } from "./legacy-history.js";
import { reconcileProgression } from "./progression.js";
import { reconcileAchievementCatalog } from "./achievements.js";
import { reconcilePendingIdentityRewards } from "./identity-reconciliation.js";

export { checkAgentHealth } from "./agent-health.js";
export { runMonitoringCycle } from "./monitoring.js";

export const workerPhase = "live-monitoring-ready";

async function main(): Promise<void> {
  const configuration = loadWorkerConfiguration();
  const repository = createPostgresMonitoringRepository();
  const agent = new HabitatAgentClient(configuration.agentUrl, configuration.agentToken);
  const runOnce = process.argv.includes("--once");
  let discordBot: Awaited<ReturnType<typeof startDiscordBot>> = null;
  let nextHistoryScanAt = 0;
  if (!runOnce) {
    try {
      discordBot = await startDiscordBot();
    } catch {
      console.warn("Habitat Discord bot was not started. Monitoring remains available.");
    }
  }

  const run = async () => {
    const result = await runMonitoringCycle(repository, agent);
    const commands = await dispatchAuthorizedServerCommands(createPostgresServerCommandRepository(), agent);
    const identityRewards = await reconcilePendingIdentityRewards();
    let notifications: Awaited<ReturnType<typeof dispatchPendingDiscordNotifications>> | null = null;
    try {
      notifications = await dispatchPendingDiscordNotifications();
    } catch {
      console.warn("Habitat Discord delivery failed. Monitoring remains available.");
    }
    console.info(`Habitat worker cycle: ${result.observed} observed, ${result.unknown} unknown, ${result.ignored} ignored, agent ${result.agentAvailable ? "available" : "unavailable"}.`);
    if (notifications?.enabled && (notifications.sent > 0 || notifications.failed > 0)) console.info(`Habitat Discord delivery: ${notifications.sent} sent, ${notifications.failed} failed.`);
    if (commands.dispatched > 0) console.info(`Habitat server commands: ${commands.succeeded} succeeded, ${commands.failed} failed.`);
    if (identityRewards > 0) console.info(`Habitat identity rewards: ${identityRewards} claimed identity histories reconciled.`);
    if (Date.now() >= nextHistoryScanAt) {
      try {
        const history = await importLegacyHistory(agent);
        console.info(`Habitat legacy history: ${history.evidenceImported} evidence records, ${history.eventsImported} native events, and ${history.sessionsImported} timed sessions imported from ${history.servers} servers.`);
      } catch {
        console.warn("Habitat legacy history scan failed. Live monitoring remains available.");
      }
      try {
        const users = await reconcileProgression();
        console.info(`Habitat progression: weekly rotation ready and ${users} member XP records reconciled.`);
      } catch {
        console.warn("Habitat progression reconciliation failed. Live monitoring remains available.");
      }
      try {
        const users = await reconcileAchievementCatalog();
        console.info(`Habitat achievements: ${users} member catalogues reconciled.`);
      } catch {
        console.warn("Habitat achievement reconciliation failed. Live monitoring remains available.");
      }
      nextHistoryScanAt = Date.now() + configuration.historyScanIntervalMs;
    }
  };

  if (runOnce) {
    try {
      await run();
    } finally {
      await getPrismaClient().$disconnect();
    }
    return;
  }

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await run();
    } catch {
      console.error("Habitat worker cycle failed without changing server state.");
    } finally {
      running = false;
    }
  };
  await tick();
  const interval = setInterval(() => { void tick(); }, configuration.pollIntervalMs);
  const shutdown = () => {
    clearInterval(interval);
    discordBot?.stop();
    void getPrismaClient().$disconnect().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void main().catch(() => {
  console.error("Habitat worker could not start. Check local worker configuration without logging secrets.");
  process.exitCode = 1;
});
