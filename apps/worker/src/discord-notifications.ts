import { REST, Routes } from "discord.js";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

export type DiscordNotificationInput = {
  serverEventId?: string;
  gameActivityId?: string;
  /**
   * Identifies evidence that is not a ServerEvent or GameActivity row. A Twitch
   * broadcast is evidenced by its own provider stream id, and the key is what
   * makes the announcement fire exactly once per broadcast.
   */
  evidenceKey?: string;
  kind: "SERVER_ONLINE" | "SERVER_SLEEPING" | "SERVER_OUTAGE" | "RECORD_BROKEN" | "LEGENDARY_ACHIEVEMENT" | "WAKE_REQUEST" | "STREAM_WENT_LIVE";
  content: string;
};

export async function queueDiscordNotification(transaction: Prisma.TransactionClient, input: DiscordNotificationInput) {
  const evidenceKeys = [input.serverEventId, input.gameActivityId, input.evidenceKey].filter((value): value is string => Boolean(value));
  if (evidenceKeys.length !== 1) throw new Error("A Discord notification requires exactly one evidence source.");
  const evidenceKey = evidenceKeys[0];
  const configurations = await transaction.discordGuildConfig.findMany({ where: { notificationsEnabled: true, announcementChannelId: { not: null } } });
  for (const configuration of configurations) {
    if (!configurationAllows(configuration, input.kind)) continue;
    await transaction.discordNotification.upsert({
      where: { dedupeKey: `discord:${configuration.id}:${evidenceKey}:${input.kind}` },
      create: {
        configId: configuration.id,
        serverEventId: input.serverEventId,
        gameActivityId: input.gameActivityId,
        kind: input.kind,
        content: clampDiscordContent(input.content),
        dedupeKey: `discord:${configuration.id}:${evidenceKey}:${input.kind}`,
      },
      update: {},
    });
  }
}

export async function dispatchPendingDiscordNotifications(environment = process.env) {
  const token = environment.DISCORD_BOT_TOKEN?.trim();
  if (!token) return { enabled: false, sent: 0, failed: 0 };

  const db = getPrismaClient();
  const pending = await db.discordNotification.findMany({
    where: { sentAt: null, attempts: { lt: 8 }, config: { notificationsEnabled: true, announcementChannelId: { not: null } } },
    include: { config: { select: { announcementChannelId: true } } },
    orderBy: { queuedAt: "asc" },
    take: 20,
  });
  const rest = new REST({ version: "10" }).setToken(token);
  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    try {
      await rest.post(Routes.channelMessages(notification.config.announcementChannelId!), { body: { content: notification.content } });
      await db.discordNotification.update({ where: { id: notification.id }, data: { sentAt: new Date(), attempts: { increment: 1 }, lastError: null } });
      sent += 1;
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error ? ` (status ${String((error as { status?: unknown }).status)})` : "";
      const message = `${error instanceof Error ? error.message : String(error)}${status}`.slice(0, 500);
      console.error(`[discord-notifications] delivery failed for notification ${notification.id}:`, message);
      await db.discordNotification.update({ where: { id: notification.id }, data: { attempts: { increment: 1 }, lastError: message } });
      failed += 1;
    }
  }
  return { enabled: true, sent, failed };
}

function configurationAllows(configuration: { notifyServerOnline: boolean; notifyServerSleeping: boolean; notifyServerOutage: boolean; notifyRecordBroken: boolean; notifyLegendaryAchievement: boolean; notifyWakeRequest: boolean }, kind: DiscordNotificationInput["kind"]) {
  if (kind === "SERVER_ONLINE") return configuration.notifyServerOnline;
  if (kind === "SERVER_SLEEPING") return configuration.notifyServerSleeping;
  if (kind === "SERVER_OUTAGE") return configuration.notifyServerOutage;
  if (kind === "RECORD_BROKEN") return configuration.notifyRecordBroken;
  if (kind === "WAKE_REQUEST") return configuration.notifyWakeRequest;
  // Going live has no per-guild toggle column yet, so it follows the guild's
  // master notificationsEnabled switch, which the query above already applied.
  if (kind === "STREAM_WENT_LIVE") return true;
  return configuration.notifyLegendaryAchievement;
}

function clampDiscordContent(value: string) {
  return value.slice(0, 1_900);
}
