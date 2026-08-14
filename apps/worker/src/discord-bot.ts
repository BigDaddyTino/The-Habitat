import { ActivityType, ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder, type Activity, type Presence, type VoiceState } from "discord.js";
import { getPrismaClient } from "@habitat/db/client";
import { queueDiscordNotification } from "./discord-notifications.js";

const db = getPrismaClient();

/** Schema limits for the member-authored text Discord reports. */
const STREAM_URL_LIMIT = 300;
const ACTIVITY_NAME_LIMIT = 120;
const ACTIVITY_DETAIL_LIMIT = 200;
const CHANNEL_NAME_LIMIT = 120;
const DISCORD_SNOWFLAKE = /^\d{1,20}$/;

const commands = [
  new SlashCommandBuilder().setName("habitat").setDescription("Show the Habitat's current world status."),
  new SlashCommandBuilder().setName("server").setDescription("Show one Habitat world.").addStringOption((option) => option.setName("world").setDescription("World slug, such as valheim or palworld").setRequired(true)),
  new SlashCommandBuilder().setName("who").setDescription("Show verified live population by world."),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Show the current Hall of Legends."),
  new SlashCommandBuilder().setName("shame").setDescription("Show the current Hall of Shame."),
  new SlashCommandBuilder().setName("chronicle").setDescription("Show recent verified Chronicle entries."),
  new SlashCommandBuilder().setName("wake").setDescription("Request a sleeping Habitat world for game night.").addStringOption((option) => option.setName("world").setDescription("World slug, such as valheim or palworld").setRequired(true)),
  new SlashCommandBuilder().setName("poll").setDescription("Show the active Habitat game-night poll."),
].map((command) => command.toJSON());

/** What Habitat Pulse needs to describe the gateway without reaching into discord.js. */
export type DiscordBotStatus = { ready: boolean; presenceEnabled: boolean; guilds: number };

export type DiscordBotHandle = { stop(): void; status(): DiscordBotStatus };

export async function startDiscordBot(environment = process.env): Promise<DiscordBotHandle | null> {
  const token = environment.DISCORD_BOT_TOKEN?.trim();
  const applicationId = environment.DISCORD_APPLICATION_ID?.trim();
  // GuildPresences is a privileged intent that must be enabled in the Discord
  // Developer Portal, so streaming detection is off unless it is asked for.
  const presenceEnabled = environment.HABITAT_DISCORD_PRESENCE?.trim().toLowerCase() === "on";
  console.info(`[discord-bot] Discord streaming detection is ${presenceEnabled ? "ON; privileged presence, member and voice intents will be requested" : "OFF; set HABITAT_DISCORD_PRESENCE=on to enable it"}.`);
  // Presence and voice events only fire on change, so a row left behind by a
  // dead process would claim a member is streaming forever. Every startup begins
  // from "nobody is streaming" and re-derives the truth from Discord below.
  // With detection off Habitat genuinely has no knowledge, and no knowledge must
  // never render as live.
  await clearStreamSignals("startup");

  if (!token || !applicationId) return null;

  const configurations = await db.discordGuildConfig.findMany({ where: { commandsEnabled: true }, select: { guildId: true } });
  if (configurations.length === 0) return null;

  const rest = new REST({ version: "10" }).setToken(token);
  for (const configuration of configurations) {
    try {
      await rest.put(Routes.applicationGuildCommands(applicationId, configuration.guildId), { body: commands });
    } catch (error) {
      console.error(`[discord-bot] slash command registration failed for guild ${configuration.guildId}:`, error instanceof Error ? error.message : String(error));
    }
  }

  const connection = await connectDiscordClient(token, presenceEnabled);
  const client = connection.client;
  return {
    status: () => ({ ready: client.isReady(), presenceEnabled: connection.presenceActive, guilds: client.guilds.cache.size }),
    stop: () => {
      // Best effort: the next startup clears the signals again anyway.
      void clearStreamSignals("shutdown");
      client.destroy();
    },
  };
}

function createDiscordClient(presenceEnabled: boolean): Client {
  const client = new Client({
    intents: presenceEnabled
      ? [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates]
      : [GatewayIntentBits.Guilds],
  });
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isChatInputCommand()) void handleCommand(interaction).catch((error: unknown) => {
      console.error("[discord-bot] command handler rejected unexpectedly:", error instanceof Error ? error.message : String(error));
    });
  });
  if (!presenceEnabled) return client;
  client.once(Events.ClientReady, (ready) => {
    void reconcileCachedStreamSignals(ready).catch((error: unknown) => {
      console.error("[discord-bot] cached streaming signals could not be reconciled:", error instanceof Error ? error.message : String(error));
    });
  });
  client.on(Events.PresenceUpdate, (previous, presence) => {
    // Presence fires for every status and game change in the guild. Only a
    // stream starting, a stream stopping, or an uncached previous state can
    // change a signal, so nothing else reaches the database.
    if (previous && !streamingActivity(previous.activities) && !streamingActivity(presence.activities)) return;
    void recordPresenceSignal(presence).catch((error: unknown) => {
      console.error("[discord-bot] presence signal could not be recorded:", error instanceof Error ? error.message : String(error));
    });
  });
  client.on(Events.VoiceStateUpdate, (previous, state) => {
    // Mutes, joins and leaves by members who were not screen sharing cannot
    // change a Go Live signal.
    if (previous.streaming !== true && state.streaming !== true) return;
    void recordVoiceSignal(state).catch((error: unknown) => {
      console.error("[discord-bot] voice streaming signal could not be recorded:", error instanceof Error ? error.message : String(error));
    });
  });
  return client;
}

/**
 * Logs in, and survives a portal where the privileged intents were never
 * enabled: Discord refuses the connection outright, so Habitat reconnects
 * without them rather than losing slash commands and monitoring.
 */
async function connectDiscordClient(token: string, presenceEnabled: boolean): Promise<{ client: Client; presenceActive: boolean }> {
  const client = createDiscordClient(presenceEnabled);
  try {
    await client.login(token);
    return { client, presenceActive: presenceEnabled };
  } catch (error) {
    client.destroy();
    if (!presenceEnabled || !isDisallowedIntentsError(error)) throw error;
    console.warn("[discord-bot] Discord rejected the privileged intents, so streaming detection is disabled for this run. Enable Presence Intent and Server Members Intent in the Discord Developer Portal, then restart the worker.");
    const fallback = createDiscordClient(false);
    await fallback.login(token);
    // Reported as inactive so Pulse shows what is really running, not what was asked for.
    return { client: fallback, presenceActive: false };
  }
}

function isDisallowedIntentsError(error: unknown): boolean {
  const code = error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : undefined;
  const description = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return code === "DisallowedIntents" || code === 4014 || /disallowed intent|privileged intent/i.test(description);
}

type StreamSignalKind = "PRESENCE_ACTIVITY" | "VOICE_GO_LIVE";
type StreamSignalFields = {
  streamUrl: string | null;
  activityName: string | null;
  activityDetail: string | null;
  guildId: string | null;
  channelId: string | null;
  channelName: string | null;
  startedAt: Date | null;
};

function clampSignalText(value: string | null | undefined, maximumLength: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maximumLength) : null;
}

function streamingActivity(activities: readonly Activity[]): Activity | null {
  return activities.find((activity) => activity.type === ActivityType.Streaming) ?? null;
}

/**
 * Resolves the Habitat member behind a Discord user through the Auth.js account
 * link. A Discord user without a Habitat account is ignored; signals never
 * create members.
 */
async function habitatUserId(discordUserId: string): Promise<string | null> {
  if (!DISCORD_SNOWFLAKE.test(discordUserId)) return null;
  const account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider: "discord", providerAccountId: discordUserId } },
    select: { userId: true, user: { select: { isActive: true } } },
  });
  return account?.user.isActive ? account.userId : null;
}

async function startStreamSignal(userId: string, kind: StreamSignalKind, fields: StreamSignalFields) {
  const observedAt = new Date();
  const existing = await db.discordStreamSignal.findUnique({ where: { userId }, select: { streaming: true, kind: true, startedAt: true } });
  // Repeated events for a stream already being reported must not keep resetting
  // when it began.
  const continuing = existing?.streaming === true && existing.kind === kind;
  const startedAt = (continuing ? existing.startedAt : null) ?? fields.startedAt ?? observedAt;
  const data = { kind, streaming: true, ...fields, startedAt, observedAt };
  await db.discordStreamSignal.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

/** Only the kind that reported a stream may retract it: one row per member is shared by both kinds. */
async function stopStreamSignal(userId: string, kind: StreamSignalKind) {
  await db.discordStreamSignal.updateMany({ where: { userId, kind }, data: { streaming: false, observedAt: new Date() } });
}

async function clearStreamSignals(reason: "startup" | "shutdown") {
  try {
    const cleared = await db.discordStreamSignal.updateMany({ where: { streaming: true }, data: { streaming: false, observedAt: new Date() } });
    if (cleared.count > 0) console.info(`[discord-bot] ${cleared.count} Discord streaming signal(s) cleared on ${reason}; Discord streaming state is re-observed, never remembered across restarts.`);
  } catch (error) {
    console.error(`[discord-bot] Discord streaming signals could not be cleared on ${reason}:`, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Discord delivers presences and voice states with the initial guild payload, so
 * a restart can rebuild what is true right now instead of trusting whatever was
 * true when the previous process died.
 */
async function reconcileCachedStreamSignals(client: Client<true>) {
  let recorded = 0;
  for (const guild of client.guilds.cache.values()) {
    for (const presence of guild.presences.cache.values()) {
      if (streamingActivity(presence.activities) && await recordPresenceSignal(presence)) recorded += 1;
    }
    for (const state of guild.voiceStates.cache.values()) {
      if (state.streaming === true && await recordVoiceSignal(state)) recorded += 1;
    }
  }
  console.info(`[discord-bot] Discord streaming detection ready: ${recorded} linked member${recorded === 1 ? "" : "s"} observed streaming right now.`);
}

/** A "Streaming" presence activity carries a self-reported URL Habitat never trusts as proof. */
async function recordPresenceSignal(presence: Presence): Promise<boolean> {
  const userId = await habitatUserId(presence.userId);
  if (!userId) return false;
  const activity = streamingActivity(presence.activities);
  if (!activity) {
    await stopStreamSignal(userId, "PRESENCE_ACTIVITY");
    return false;
  }
  await startStreamSignal(userId, "PRESENCE_ACTIVITY", {
    streamUrl: clampSignalText(activity.url, STREAM_URL_LIMIT),
    activityName: clampSignalText(activity.name, ACTIVITY_NAME_LIMIT),
    activityDetail: clampSignalText(activity.details ?? activity.state, ACTIVITY_DETAIL_LIMIT),
    guildId: clampSignalText(presence.guild?.id, 40),
    channelId: null,
    channelName: null,
    startedAt: activity.timestamps?.start ?? activity.createdAt,
  });
  return true;
}

/** Go Live screen sharing inside a Habitat voice channel. */
async function recordVoiceSignal(state: VoiceState): Promise<boolean> {
  const userId = await habitatUserId(state.id);
  if (!userId) return false;
  if (state.streaming !== true) {
    await stopStreamSignal(userId, "VOICE_GO_LIVE");
    return false;
  }
  await startStreamSignal(userId, "VOICE_GO_LIVE", {
    streamUrl: null,
    activityName: null,
    activityDetail: null,
    guildId: clampSignalText(state.guild?.id, 40),
    channelId: clampSignalText(state.channelId, 40),
    channelName: clampSignalText(state.channel?.name, CHANNEL_NAME_LIMIT),
    startedAt: null,
  });
  return true;
}

async function handleCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({ content: "Habitat commands are available only in the configured Habitat server.", flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const configuration = await db.discordGuildConfig.findUnique({ where: { guildId: interaction.guildId }, select: { commandsEnabled: true } });
    if (!configuration?.commandsEnabled) {
      await interaction.editReply("This Discord server is not configured for Habitat commands.");
      return;
    }
    await interaction.editReply(await commandReply(interaction));
  } catch (error) {
    console.error(`[discord-bot] /${interaction.commandName} command failed:`, error instanceof Error ? error.message : String(error));
    try {
      const content = "Habitat could not read its private registry right now. No server action was taken.";
      if (interaction.deferred || interaction.replied) await interaction.editReply(content);
      else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (replyError) {
      console.error("[discord-bot] error reply could not be delivered:", replyError instanceof Error ? replyError.message : String(replyError));
    }
  }
}

async function commandReply(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === "habitat") return habitatSummary();
  if (interaction.commandName === "server") return serverSummary(interaction.options.getString("world", true));
  if (interaction.commandName === "who") return whoSummary();
  if (interaction.commandName === "leaderboard") return recordSummary("LEGENDS", "Hall of Legends");
  if (interaction.commandName === "shame") return recordSummary("SHAME", "Hall of Shame");
  if (interaction.commandName === "chronicle") return chronicleSummary();
  if (interaction.commandName === "wake") return requestWakeFromDiscord(interaction.user.id, interaction.options.getString("world", true));
  return pollSummary();
}

async function habitatSummary() {
  const worlds = await db.gameServer.findMany({ select: { displayName: true, actualState: true, runtimeState: { select: { playerCount: true } } } });
  const online = worlds.filter((world) => world.actualState === "ONLINE");
  const players = online.reduce((total, world) => total + (world.runtimeState?.playerCount ?? 0), 0);
  return `**The Habitat**\n${online.length} world${online.length === 1 ? "" : "s"} online, ${players} verified player${players === 1 ? "" : "s"} reported across ${worlds.length} registered worlds.`;
}

async function serverSummary(worldSlug: string) {
  const world = await db.gameServer.findUnique({ where: { slug: worldSlug.trim().toLowerCase() }, include: { runtimeState: true } });
  if (!world) return "That Habitat world is not in the private registry.";
  const runtime = world.runtimeState;
  const population = runtime?.playerCount === null || runtime?.playerCount === undefined ? "player count unavailable" : `${runtime.playerCount}/${runtime.maxPlayers ?? "?"} players`;
  const ping = runtime?.pingMs === null || runtime?.pingMs === undefined ? "ping unavailable" : `${runtime.pingMs} ms`;
  return `**${world.displayName}** is **${world.actualState.replaceAll("_", " ")}** - ${population} - ${ping}.`;
}

async function whoSummary() {
  const worlds = await db.gameServer.findMany({ where: { runtimeState: { is: { playerCount: { gt: 0 } } } }, select: { displayName: true, runtimeState: { select: { playerCount: true, maxPlayers: true } } }, orderBy: { displayName: "asc" } });
  if (worlds.length === 0) return "No verified active population is currently reported.";
  return `**Who is around**\n${worlds.map((world) => `- ${world.displayName}: ${world.runtimeState?.playerCount ?? 0}/${world.runtimeState?.maxPlayers ?? "?"} players`).join("\n")}`;
}

async function recordSummary(hall: "LEGENDS" | "SHAME", title: string) {
  const records = await db.recordDefinition.findMany({ where: { hall, enabled: true, currentHolder: { isNot: null } }, include: { currentHolder: true }, orderBy: { title: "asc" }, take: 5 });
  if (records.length === 0) return hall === "SHAME" ? "The Hall of Shame has no trustworthy record source yet." : "The Hall of Legends is waiting for its first verified record.";
  return `**${title}**\n${records.map((record) => `- ${record.title}: ${record.currentHolder?.holderName} (${record.currentHolder?.valueNumber} ${record.valueLabel})`).join("\n")}`;
}

async function chronicleSummary() {
  const events = await db.serverEvent.findMany({ include: { server: { select: { displayName: true } } }, orderBy: { occurredAt: "desc" }, take: 3 });
  if (events.length === 0) return "The Chronicle has no verified entries yet.";
  return `**Recent Chronicle**\n${events.map((event) => `- ${event.server.displayName}: ${eventLabel(event.eventType, event.actorText, event.valueText)}`).join("\n")}`;
}

async function requestWakeFromDiscord(discordUserId: string, worldSlug: string) {
  const account = await db.account.findUnique({ where: { provider_providerAccountId: { provider: "discord", providerAccountId: discordUserId } }, include: { user: { select: { id: true, name: true, role: true, isActive: true } } } });
  if (!account?.user.isActive || (account.user.role !== "USER" && account.user.role !== "ADMIN")) return "Sign in to the Habitat portal with Discord first, then use `/wake` again.";
  return db.$transaction(async (transaction) => {
    const server = await transaction.gameServer.findUnique({ where: { slug: worldSlug.trim().toLowerCase() }, select: { id: true, displayName: true, gameType: true, enabled: true, actualState: true } });
    if (!server?.enabled || server.actualState !== "SLEEPING") return "Only intentionally sleeping Habitat worlds can receive a wake request.";
    let request = await transaction.wakeRequest.findFirst({ where: { serverId: server.id, status: "PENDING" }, select: { id: true } });
    if (!request) {
      request = await transaction.wakeRequest.create({ data: { serverId: server.id, requesterUserId: account.user.id }, select: { id: true } });
      const event = await transaction.serverEvent.create({ data: { serverId: server.id, gameType: server.gameType, eventType: "WAKE_REQUESTED", occurredAt: new Date(), actorText: account.user.name ?? "Habitat member", source: "HABITAT_DISCORD", sourceConfidence: 100, dedupeKey: `wake-request:${request.id}` } });
      await queueDiscordNotification(transaction, { serverEventId: event.id, kind: "WAKE_REQUEST", content: `**${account.user.name ?? "A Habitat member"}** asked to light the fire for **${server.displayName}**.` });
    }
    await transaction.wakeVote.upsert({ where: { wakeRequestId_userId: { wakeRequestId: request.id, userId: account.user.id } }, create: { wakeRequestId: request.id, userId: account.user.id }, update: {} });
    const supporters = await transaction.wakeVote.count({ where: { wakeRequestId: request.id } });
    await transaction.auditLog.create({ data: { actorUserId: account.user.id, action: "DISCORD_WAKE_REQUEST_SUPPORTED", entityType: "WakeRequest", entityId: request.id, after: { serverId: server.id } } });
    return `Wake request recorded for **${server.displayName}**. ${supporters} Habitat member${supporters === 1 ? " supports" : "s support"} it. No server action was taken.`;
  });
}

async function pollSummary() {
  const poll = await db.serverPoll.findFirst({ where: { status: "ACTIVE", closesAt: { gt: new Date() } }, include: { options: { include: { server: { select: { displayName: true } }, _count: { select: { votes: true } } }, orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" } });
  if (!poll) return "No Habitat game-night poll is open.";
  return `**${poll.question}**\n${poll.options.map((option) => `- ${option.server.displayName}: ${option._count.votes}`).join("\n")}`;
}

function eventLabel(type: string, actor: string | null, value: string | null) {
  if (type === "RECORD_BROKEN" && actor && value) return `${actor} set ${value}`;
  if (type === "ACHIEVEMENT_EARNED" && actor && value) return `${actor} earned ${value}`;
  if (type === "PLAYER_JOINED" && actor) return `${actor} joined`;
  if (type === "PLAYER_LEFT" && actor) return `${actor} left`;
  return type.replaceAll("_", " ").toLowerCase();
}
