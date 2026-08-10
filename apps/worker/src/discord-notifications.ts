import { REST, Routes } from "discord.js";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

export type DiscordNotificationInput = {
  serverEventId: string;
  kind: "SERVER_ONLINE" | "SERVER_SLEEPING" | "SERVER_OUTAGE" | "RECORD_BROKEN" | "LEGENDARY_ACHIEVEMENT";
  content: string;
};

export async function queueDiscordNotification(transaction: Prisma.TransactionClient, input: DiscordNotificationInput) {
  const configurations = await transaction.discordGuildConfig.findMany({ where: { notificationsEnabled: true, announcementChannelId: { not: null } } });
  for (const configuration of configurations) {
    if (!configurationAllows(configuration, input.kind)) continue;
    await transaction.discordNotification.upsert({
      where: { dedupeKey: `discord:${configuration.id}:${input.serverEventId}:${input.kind}` },
      create: {
        configId: configuration.id,
        serverEventId: input.serverEventId,
        kind: input.kind,
        content: clampDiscordContent(input.content),
        dedupeKey: `discord:${configuration.id}:${input.serverEventId}:${input.kind}`,
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
    } catch {
      await db.discordNotification.update({ where: { id: notification.id }, data: { attempts: { increment: 1 }, lastError: "Discord delivery failed." } });
      failed += 1;
    }
  }
  return { enabled: true, sent, failed };
}

function configurationAllows(configuration: { notifyServerOnline: boolean; notifyServerSleeping: boolean; notifyServerOutage: boolean; notifyRecordBroken: boolean; notifyLegendaryAchievement: boolean }, kind: DiscordNotificationInput["kind"]) {
  if (kind === "SERVER_ONLINE") return configuration.notifyServerOnline;
  if (kind === "SERVER_SLEEPING") return configuration.notifyServerSleeping;
  if (kind === "SERVER_OUTAGE") return configuration.notifyServerOutage;
  if (kind === "RECORD_BROKEN") return configuration.notifyRecordBroken;
  return configuration.notifyLegendaryAchievement;
}

function clampDiscordContent(value: string) {
  return value.slice(0, 1_900);
}
