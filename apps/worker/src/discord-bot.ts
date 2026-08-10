import { ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder } from "discord.js";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

const commands = [
  new SlashCommandBuilder().setName("habitat").setDescription("Show the Habitat's current world status."),
  new SlashCommandBuilder().setName("server").setDescription("Show one Habitat world.").addStringOption((option) => option.setName("world").setDescription("World slug, such as valheim or palworld").setRequired(true)),
  new SlashCommandBuilder().setName("who").setDescription("Show verified live population by world."),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Show the current Hall of Legends."),
  new SlashCommandBuilder().setName("shame").setDescription("Show the current Hall of Shame."),
  new SlashCommandBuilder().setName("chronicle").setDescription("Show recent verified Chronicle entries."),
  new SlashCommandBuilder().setName("wake").setDescription("Explain the current wake-request status."),
].map((command) => command.toJSON());

export type DiscordBotHandle = { stop(): void };

export async function startDiscordBot(environment = process.env): Promise<DiscordBotHandle | null> {
  const token = environment.DISCORD_BOT_TOKEN?.trim();
  const applicationId = environment.DISCORD_APPLICATION_ID?.trim();
  if (!token || !applicationId) return null;

  const configurations = await db.discordGuildConfig.findMany({ where: { commandsEnabled: true }, select: { guildId: true } });
  if (configurations.length === 0) return null;

  const rest = new REST({ version: "10" }).setToken(token);
  for (const configuration of configurations) {
    await rest.put(Routes.applicationGuildCommands(applicationId, configuration.guildId), { body: commands });
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isChatInputCommand()) void handleCommand(interaction);
  });
  await client.login(token);
  return { stop: () => client.destroy() };
}

async function handleCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Habitat commands are available only in the configured Habitat server.", flags: MessageFlags.Ephemeral });
    return;
  }
  const configuration = await db.discordGuildConfig.findUnique({ where: { guildId: interaction.guildId }, select: { commandsEnabled: true } });
  if (!configuration?.commandsEnabled) {
    await interaction.reply({ content: "This Discord server is not configured for Habitat commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await interaction.editReply(await commandReply(interaction));
  } catch {
    await interaction.editReply("Habitat could not read its private registry right now. No server action was taken.");
  }
}

async function commandReply(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === "habitat") return habitatSummary();
  if (interaction.commandName === "server") return serverSummary(interaction.options.getString("world", true));
  if (interaction.commandName === "who") return whoSummary();
  if (interaction.commandName === "leaderboard") return recordSummary("LEGENDS", "Hall of Legends");
  if (interaction.commandName === "shame") return recordSummary("SHAME", "Hall of Shame");
  if (interaction.commandName === "chronicle") return chronicleSummary();
  return "Wake requests are not active yet. No server action was taken.";
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

function eventLabel(type: string, actor: string | null, value: string | null) {
  if (type === "RECORD_BROKEN" && actor && value) return `${actor} set ${value}`;
  if (type === "ACHIEVEMENT_EARNED" && actor && value) return `${actor} earned ${value}`;
  if (type === "PLAYER_JOINED" && actor) return `${actor} joined`;
  if (type === "PLAYER_LEFT" && actor) return `${actor} left`;
  return type.replaceAll("_", " ").toLowerCase();
}
