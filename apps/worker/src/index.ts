import { HabitatAgentClient } from "./agent-client.js";
import { loadWorkerConfiguration } from "./config.js";
import { initialCycleLogState, nextCycleLog } from "./cycle-log.js";
import { createPostgresMonitoringRepository, runMonitoringCycle } from "./monitoring.js";
import { getPrismaClient } from "@habitat/db/client";
import { startDiscordBot } from "./discord-bot.js";
import { dispatchPendingDiscordNotifications } from "./discord-notifications.js";
import { createPostgresServerCommandRepository, dispatchAuthorizedServerCommands } from "./server-commands.js";
import { importLegacyHistory } from "./legacy-history.js";
import { reconcileProgression } from "./progression.js";
import { reconcileAchievementCatalog } from "./achievements.js";
import { reconcilePendingIdentityRewards } from "./identity-reconciliation.js";
import { syncMarvelRivalsMatches, syncMarvelRivalsPresence, syncMarvelRivalsProfiles } from "./marvel-rivals.js";
import { syncSteamEnrichment } from "./steam-enrichment.js";
import { syncTwitchChannelMetadata, syncTwitchLiveStatus } from "./twitch.js";
import { syncSteamAchievements } from "./steam-achievements.js";
import { projectGameActivities } from "./game-activities.js";
import { recordServiceHeartbeat } from "./heartbeat.js";
import { runPulseCycle } from "./pulse.js";
import { startWorkerTelemetry } from "./telemetry.js";
import { workerVersion } from "./version.js";
import { reconcileActivityRecordCatalog } from "./records.js";

export { checkAgentHealth } from "./agent-health.js";
export { runMonitoringCycle } from "./monitoring.js";
export { workerVersion } from "./version.js";

export const workerPhase = "live-monitoring-ready";

async function main(): Promise<void> {
  const configuration = loadWorkerConfiguration();
  const telemetry = await startWorkerTelemetry();
  const repository = createPostgresMonitoringRepository();
  const commandRepository = createPostgresServerCommandRepository();
  const agent = new HabitatAgentClient(configuration.agentUrl, configuration.agentToken);
  const runOnce = process.argv.includes("--once");
  let discordBot: Awaited<ReturnType<typeof startDiscordBot>> = null;
  // The bot is started without blocking monitoring, so Pulse needs to know the
  // difference between "still connecting" and "did not start".
  let discordConnecting = true;
  let shuttingDown = false;
  let nextHistoryScanAt = 0;
  let nextProviderScanAt = 0;
  let cycleLogState = initialCycleLogState;

  const dispatchCommands = async () => {
    const commands = await dispatchAuthorizedServerCommands(commandRepository, agent);
    if (commands.dispatched > 0) console.info(`Habitat server commands: ${commands.succeeded} succeeded, ${commands.failed} failed.`);
  };

  // Habitat Pulse judges worker freshness from this beat, so it is written on
  // every cycle before anything that could throw and skip it.
  const beat = async (result: { observed: number; unknown: number; agentAvailable: boolean } | null) => {
    try {
      await recordServiceHeartbeat("WORKER", configuration.pollIntervalMs, workerVersion, {
        observed: result?.observed ?? null,
        unknown: result?.unknown ?? null,
        agentAvailable: result?.agentAvailable ?? null,
        discordGateway: discordBot ? discordBot.status().ready : null,
        telemetry: telemetry.enabled,
      });
    } catch (error) {
      console.error("[worker] heartbeat could not be recorded:", error instanceof Error ? error.message : String(error));
    }
  };

  const run = async () => {
    const result = await runMonitoringCycle(repository, agent);
    await beat(result);
    const identityRewards = await reconcilePendingIdentityRewards();
    let notifications: Awaited<ReturnType<typeof dispatchPendingDiscordNotifications>> | null = null;
    try {
      notifications = await dispatchPendingDiscordNotifications();
    } catch (error) {
      console.warn("Habitat Discord delivery failed. Monitoring remains available.");
      console.error("[worker] Discord delivery failed:", error instanceof Error ? error.message : String(error));
    }
    // Folded rather than printed every 15 seconds: an unchanged cycle summary
    // otherwise buries the lines that report real events.
    const cycleLog = nextCycleLog(cycleLogState, `Habitat worker cycle: ${result.observed} observed, ${result.unknown} unknown, ${result.ignored} ignored, agent ${result.agentAvailable ? "available" : "unavailable"}.`, Date.now());
    cycleLogState = cycleLog.state;
    if (cycleLog.message) console.info(cycleLog.message);
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
        const presence = await syncMarvelRivalsPresence();
        const profiles = await syncMarvelRivalsProfiles();
        const matches = await syncMarvelRivalsMatches();
        if (presence.enabled && presence.playing > 0) console.info(`Habitat Marvel Rivals presence: ${presence.playing}/${presence.checked} linked members in game on Steam.`);
        if (profiles.enabled && (profiles.checked > 0 || matches.checked > 0)) console.info(`Habitat Marvel Rivals: ${profiles.updated}/${profiles.checked} profiles refreshed and ${matches.matchesSeen} match rows observed across ${matches.checked} profiles; ${profiles.failed + matches.failed} deferred.`);
      } catch (error) {
        console.warn("Habitat Marvel Rivals refresh failed. Hosted monitoring remains available.");
        console.error("[worker] Marvel Rivals refresh failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        // Live status is time-sensitive, so it rides the frequent provider scan.
        // The module still honours its own Twitch poll interval internally.
        const twitch = await syncTwitchLiveStatus();
        if (twitch.enabled && twitch.polled > 0) console.info(`Habitat Twitch: ${twitch.live}/${twitch.polled} showcase channels live, ${twitch.started} broadcast${twitch.started === 1 ? "" : "s"} started, ${twitch.ended} ended, ${twitch.failed} deferred.`);
      } catch (error) {
        console.warn("Habitat Twitch live sync failed. Hosted monitoring remains available.");
        console.error("[worker] Twitch live sync failed:", error instanceof Error ? error.message : String(error));
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
        const channels = await syncTwitchChannelMetadata();
        if (channels.enabled && channels.checked > 0) console.info(`Habitat Twitch channels: ${channels.updated}/${channels.checked} channel profiles refreshed, ${channels.failed} deferred.`);
      } catch (error) {
        console.warn("Habitat Twitch channel refresh failed. Live stream status remains available.");
        console.error("[worker] Twitch channel refresh failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const users = await reconcileAchievementCatalog();
        console.info(`Habitat achievements: ${users} member catalogues reconciled.`);
      } catch (error) {
        console.warn("Habitat achievement reconciliation failed. Live monitoring remains available.");
        console.error("[worker] achievement reconciliation failed:", error instanceof Error ? error.message : String(error));
      }
      try {
        const records = await reconcileActivityRecordCatalog();
        if (records.candidates > 0) console.info(`Habitat records: ${records.candidates} member candidates reconciled across ${records.definitions} activity-backed definitions.`);
      } catch (error) {
        console.warn("Habitat record reconciliation failed. Existing record holders remain available.");
        console.error("[worker] record reconciliation failed:", error instanceof Error ? error.message : String(error));
      }
      nextHistoryScanAt = Date.now() + configuration.historyScanIntervalMs;
    }
  };

  const pulse = async () => {
    const result = await runPulseCycle({
      agentUrl: configuration.agentUrl,
      agentToken: configuration.agentToken,
      historyScanIntervalMs: configuration.historyScanIntervalMs,
      discordStatus: discordBot ? discordBot.status() : null,
      discordConnecting,
    });
    if (result.changed > 0 || result.alerts > 0 || result.overall !== "OK") {
      console.info(`Habitat Pulse: overall ${result.overall.toLowerCase()} across ${result.evaluated} signals, ${result.changed} changed, ${result.alerts} alert(s) queued.`);
    }
  };

  if (runOnce) {
    try {
      await run();
      await dispatchCommands();
      // A single pass never starts the gateway, so there is nothing to wait for.
      discordConnecting = false;
      await pulse();
    } finally {
      await telemetry.stop();
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
  }).finally(() => {
    discordConnecting = false;
  });
  let pulsing = false;
  const pulseTick = async () => {
    if (pulsing) return;
    pulsing = true;
    try {
      await pulse();
    } catch (error) {
      // Observability failing must never take monitoring down with it.
      console.error("[worker] pulse evaluation failed:", error instanceof Error ? error.message : String(error));
    } finally {
      pulsing = false;
    }
  };
  await pulseTick();
  const interval = setInterval(() => { void tick(); }, configuration.pollIntervalMs);
  const dispatchInterval = setInterval(() => { void dispatchTick(); }, configuration.pollIntervalMs);
  const pulseInterval = setInterval(() => { void pulseTick(); }, configuration.pulseIntervalMs);
  const shutdown = () => {
    shuttingDown = true;
    clearInterval(interval);
    clearInterval(dispatchInterval);
    clearInterval(pulseInterval);
    discordBot?.stop();
    void telemetry.stop().finally(() => getPrismaClient().$disconnect().finally(() => process.exit(0)));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void main().catch((error: unknown) => {
  console.error("Habitat worker could not start. Check local worker configuration without logging secrets.");
  console.error("[worker] startup failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
