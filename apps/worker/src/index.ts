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
  const commandRepository = createPostgresServerCommandRepository();
  const agent = new HabitatAgentClient(configuration.agentUrl, configuration.agentToken);
  const runOnce = process.argv.includes("--once");
  let discordBot: Awaited<ReturnType<typeof startDiscordBot>> = null;
  let nextHistoryScanAt = 0;
  if (!runOnce) {
    try {
      discordBot = await startDiscordBot();
    } catch (error) {
      console.warn("Habitat Discord bot was not started. Monitoring remains available.");
      console.error("[worker] Discord bot startup failed:", error instanceof Error ? error.message : String(error));
    }
  }

  const dispatchCommands = async () => {
    const commands = await dispatchAuthorizedServerCommands(commandRepository, agent);
    if (commands.dispatched > 0) console.info(`Habitat server commands: ${commands.succeeded} succeeded, ${commands.failed} failed.`);
  };

  const run = async () => {
    const result = await runMonitoringCycle(repository, agent);
    const identityRewards = await reconcilePendingIdentityRewards();
    let notifications: Awaited<ReturnType<typeof dispatchPendingDiscordNotifications>> | null = null;
    try {
      notifications = await dispatchPendingDiscordNotifications();
    } catch (error) {
      console.warn("Habitat Discord delivery failed. Monitoring remains available.");
      console.error("[worker] Discord delivery failed:", error instanceof Error ? error.message : String(error));
    }
    console.info(`Habitat worker cycle: ${result.observed} observed, ${result.unknown} unknown, ${result.ignored} ignored, agent ${result.agentAvailable ? "available" : "unavailable"}.`);
    if (notifications?.enabled && (notifications.sent > 0 || notifications.failed > 0)) console.info(`Habitat Discord delivery: ${notifications.sent} sent, ${notifications.failed} failed.`);
    if (identityRewards > 0) console.info(`Habitat identity rewards: ${identityRewards} claimed identity histories reconciled.`);
    if (Date.now() >= nextHistoryScanAt) {
      try {
        const history = await importLegacyHistory(agent);
        console.info(`Habitat legacy history: ${history.evidenceImported} evidence records, ${history.eventsImported} native events, ${history.sessionsImported} timed sessions, and ${history.namesReconciled} Steam persona names reconciled across ${history.servers} servers.`);
      } catch (error) {
        console.warn("Habitat legacy history scan failed. Live monitoring remains available.");
        console.error("[worker] legacy history scan failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const users = await reconcileProgression();
        console.info(`Habitat progression: weekly rotation ready and ${users} member XP records reconciled.`);
      } catch (error) {
        console.warn("Habitat progression reconciliation failed. Live monitoring remains available.");
        console.error("[worker] progression reconciliation failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const users = await reconcileAchievementCatalog();
        console.info(`Habitat achievements: ${users} member catalogues reconciled.`);
      } catch (error) {
        console.warn("Habitat achievement reconciliation failed. Live monitoring remains available.");
        console.error("[worker] achievement reconciliation failed:", error instanceof Error ? error.message : String(error));
      }
      nextHistoryScanAt = Date.now() + configuration.historyScanIntervalMs;
    }
  };

  if (runOnce) {
    try {
      await run();
      await dispatchCommands();
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
    } catch (error) {
      console.error("Habitat worker cycle failed without changing server state.");
      console.error("[worker] monitoring cycle failed:", error instanceof Error ? error.message : String(error));
    } finally {
      running = false;
    }
  };
  let dispatching = false;
  const dispatchTick = async () => {
    if (dispatching) return;
    dispatching = true;
    try {
      await dispatchCommands();
    } catch (error) {
      console.error("[worker] command dispatch cycle failed:", error instanceof Error ? error.message : String(error));
    } finally {
      dispatching = false;
    }
  };
  await tick();
  await dispatchTick();
  const interval = setInterval(() => { void tick(); }, configuration.pollIntervalMs);
  const dispatchInterval = setInterval(() => { void dispatchTick(); }, configuration.pollIntervalMs);
  const shutdown = () => {
    clearInterval(interval);
    clearInterval(dispatchInterval);
    discordBot?.stop();
    void getPrismaClient().$disconnect().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void main().catch((error: unknown) => {
  console.error("Habitat worker could not start. Check local worker configuration without logging secrets.");
  console.error("[worker] startup failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
