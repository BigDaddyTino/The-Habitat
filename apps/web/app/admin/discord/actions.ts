"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const snowflake = z.string().trim().regex(/^\d{15,22}$/);
const configurationSchema = z.object({
  id: z.string().uuid().optional(),
  guildId: snowflake,
  announcementChannelId: z.preprocess((value) => value === "" ? null : value, snowflake.nullable()),
  commandsEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
  notifyServerOnline: z.boolean(),
  notifyServerSleeping: z.boolean(),
  notifyServerOutage: z.boolean(),
  notifyRecordBroken: z.boolean(),
  notifyLegendaryAchievement: z.boolean(),
  notifyWakeRequest: z.boolean(),
});

export async function saveDiscordConfiguration(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = configurationSchema.safeParse({
    id: formData.get("id") || undefined,
    guildId: formData.get("guildId"),
    announcementChannelId: formData.get("announcementChannelId"),
    commandsEnabled: formData.get("commandsEnabled") === "on",
    notificationsEnabled: formData.get("notificationsEnabled") === "on",
    notifyServerOnline: formData.get("notifyServerOnline") === "on",
    notifyServerSleeping: formData.get("notifyServerSleeping") === "on",
    notifyServerOutage: formData.get("notifyServerOutage") === "on",
    notifyRecordBroken: formData.get("notifyRecordBroken") === "on",
    notifyLegendaryAchievement: formData.get("notifyLegendaryAchievement") === "on",
    notifyWakeRequest: formData.get("notifyWakeRequest") === "on",
  });
  if (!parsed.success) throw new Error("Discord configuration must use valid Discord server and channel IDs.");
  // The form's record id is only used to validate an existing configuration;
  // guildId is the safe upsert key and Prisma must never receive a client id.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: ignoredId, ...data } = parsed.data;
  const configuration = await db.discordGuildConfig.upsert({ where: { guildId: data.guildId }, create: data, update: data });
  await db.auditLog.create({ data: { actorUserId: admin.id, action: "DISCORD_GUILD_CONFIGURATION_SAVED", entityType: "DiscordGuildConfig", entityId: configuration.id, after: { guildId: configuration.guildId, commandsEnabled: configuration.commandsEnabled, notificationsEnabled: configuration.notificationsEnabled } } });
  revalidatePath("/admin/discord");
}
