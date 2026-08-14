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
  kind: "SERVER_ONLINE" | "SERVER_SLEEPING" | "SERVER_OUTAGE" | "RECORD_BROKEN" | "LEGENDARY_ACHIEVEMENT" | "BOSS_KILLED" | "WORLD_GATHERING" | "WAKE_REQUEST" | "STREAM_WENT_LIVE" | "OPERATIONS_ALERT";
  content: string;
};

/** Returns how many guilds the notice was actually queued for; zero is a normal outcome. */
export async function queueDiscordNotification(transaction: Prisma.TransactionClient, input: DiscordNotificationInput): Promise<number> {
  const evidenceKeys = [input.serverEventId, input.gameActivityId, input.evidenceKey].filter((value): value is string => Boolean(value));
  if (evidenceKeys.length !== 1) throw new Error("A Discord notification requires exactly one evidence source.");
  const evidenceKey = evidenceKeys[0];
  const configurations = await transaction.discordGuildConfig.findMany({ where: { notificationsEnabled: true } });
  let queued = 0;
  for (const configuration of configurations) {
    if (!configurationAllows(configuration, input.kind)) continue;
    // The target is resolved and stored now, so a later configuration change can
    // never redirect a queued operational alert into a community channel.
    const channelId = resolveChannelId(configuration, input.kind);
    if (!channelId) continue;
    await transaction.discordNotification.upsert({
      where: { dedupeKey: `discord:${configuration.id}:${evidenceKey}:${input.kind}` },
      create: {
        configId: configuration.id,
        serverEventId: input.serverEventId,
        gameActivityId: input.gameActivityId,
        kind: input.kind,
        channelId,
        content: clampDiscordContent(input.content),
        dedupeKey: `discord:${configuration.id}:${evidenceKey}:${input.kind}`,
      },
      update: {},
    });
    queued += 1;
  }
  return queued;
}

/**
 * Operational alerts carry infrastructure detail, so they are only ever sent to
 * a guild's explicitly configured operations channel. A guild that has not named
 * one receives no operational alerts at all, rather than having them fall back
 * to the channel the whole clubhouse reads.
 */
function resolveChannelId(configuration: { announcementChannelId: string | null; operationsChannelId: string | null }, kind: DiscordNotificationInput["kind"]): string | null {
  return kind === "OPERATIONS_ALERT" ? configuration.operationsChannelId : configuration.announcementChannelId;
}

export async function dispatchPendingDiscordNotifications(environment = process.env) {
  const token = environment.DISCORD_BOT_TOKEN?.trim();
  if (!token) return { enabled: false, sent: 0, failed: 0 };

  const db = getPrismaClient();
  const pending = await db.discordNotification.findMany({
    where: {
      sentAt: null,
      attempts: { lt: 8 },
      config: { notificationsEnabled: true },
      // Rows queued before delivery targets were stored still follow the guild's
      // announcement channel; newer rows carry their own resolved target.
      OR: [{ channelId: { not: null } }, { config: { announcementChannelId: { not: null } } }],
    },
    include: { config: { select: { announcementChannelId: true } } },
    orderBy: { queuedAt: "asc" },
    take: 20,
  });
  const rest = new REST({ version: "10" }).setToken(token);
  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    const channelId = notification.channelId ?? notification.config.announcementChannelId;
    if (!channelId) continue;
    try {
      await rest.post(Routes.channelMessages(channelId), { body: { content: notification.content } });
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

function configurationAllows(configuration: { notifyServerOnline: boolean; notifyServerSleeping: boolean; notifyServerOutage: boolean; notifyRecordBroken: boolean; notifyLegendaryAchievement: boolean; notifyWakeRequest: boolean; notifyOperationalAlert: boolean }, kind: DiscordNotificationInput["kind"]) {
  if (kind === "SERVER_ONLINE") return configuration.notifyServerOnline;
  if (kind === "SERVER_SLEEPING") return configuration.notifyServerSleeping;
  if (kind === "SERVER_OUTAGE") return configuration.notifyServerOutage;
  if (kind === "RECORD_BROKEN") return configuration.notifyRecordBroken;
  if (kind === "WAKE_REQUEST") return configuration.notifyWakeRequest;
  if (kind === "OPERATIONS_ALERT") return configuration.notifyOperationalAlert;
  // Boss and gathering notices are sparse, verified clubhouse moments. They
  // follow the guild's master outbound-notice switch without adding more
  // configuration columns.
  if (kind === "BOSS_KILLED" || kind === "WORLD_GATHERING") return true;
  // Going live has no per-guild toggle column yet, so it follows the guild's
  // master notificationsEnabled switch, which the query above already applied.
  if (kind === "STREAM_WENT_LIVE") return true;
  return configuration.notifyLegendaryAchievement;
}

function clampDiscordContent(value: string) {
  return value.slice(0, 1_900);
}
