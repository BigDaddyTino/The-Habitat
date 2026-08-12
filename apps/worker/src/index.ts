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
import { syncMarvelRivalsMatches, syncMarvelRivalsProfiles } from "./marvel-rivals.js";
import { syncSteamEnrichment } from "./steam-enrichment.js";
import { syncSteamAchievements } from "./steam-achievements.js";
import { projectGameActivities } from "./game-activities.js";

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
  let shuttingDown = false;
  let nextHistoryScanAt = 0;
  let nextProviderScanAt = 0;

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
    if (Date.now() >= nextProviderScanAt) {
      try {
        const steam = await syncSteamEnrichment();
        if (steam.enabled && (steam.profilesChecked > 0 || steam.librariesChecked > 0)) console.info(`Habitat Steam: ${steam.profilesUpdated}/${steam.profilesChecked} profiles and ${steam.librariesUpdated}/${steam.librariesChecked} libraries refreshed; ${steam.failed} deferred.`);
        const achievements = await syncSteamAchievements();
        if (achievements.enabled && achievements.checked > 0) console.info(`Habitat Steam achievements: ${achievements.updated}/${achievements.checked} app scans refreshed, ${achievements.unsupported} unsupported, ${achievements.privateProfiles} private, ${achievements.failed} failed${achievements.budgetExhausted ? ", daily budget exhausted" : ""}.`);
      } catch (error) {
        console.warn("Habitat Steam enrichment failed. Hosted monitoring remains available.");
        console.error("[worker] Steam enrichment failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const profiles = await syncMarvelRivalsProfiles();
        const matches = await syncMarvelRivalsMatches();
        if (profiles.enabled && (profiles.checked > 0 || matches.checked > 0)) console.info(`Habitat Marvel Rivals: ${profiles.updated}/${profiles.checked} profiles refreshed and ${matches.matchesSeen} match rows observed across ${matches.checked} profiles; ${profiles.failed + matches.failed} deferred.`);
      } catch (error) {
        console.warn("Habitat Marvel Rivals refresh failed. Hosted monitoring remains available.");
        console.error("[worker] Marvel Rivals refresh failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const projected = await projectGameActivities();
        if (projected.serverSources > 0 || projected.clubSources > 0) console.info(`Habitat activity projection: ${projected.activities} activities from ${projected.serverSources} hosted and ${projected.clubSources} Club Game sources.`);
      } catch (error) {
        console.warn("Habitat activity projection failed. Source evidence remains intact for replay.");
        console.error("[worker] activity projection failed:", error instanceof Error ? error.message : String(error));
      }
      nextProviderScanAt = Date.now() + configuration.providerScanIntervalMs;
    }
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
  // Discord is an optional companion surface. Its gateway connection must never
  // delay the private agent's live monitoring and roster persistence.
  void startDiscordBot().then((bot) => {
    if (shuttingDown) bot?.stop();
    else discordBot = bot;
  }).catch((error: unknown) => {
    console.warn("Habitat Discord bot was not started. Monitoring remains available.");
    console.error("[worker] Discord bot startup failed:", error instanceof Error ? error.message : String(error));
  });
  const interval = setInterval(() => { void tick(); }, configuration.pollIntervalMs);
  const dispatchInterval = setInterval(() => { void dispatchTick(); }, configuration.pollIntervalMs);
  const shutdown = () => {
    shuttingDown = true;
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
