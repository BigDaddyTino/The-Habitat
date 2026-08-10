import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "../src/client";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const prisma = createPrismaClient();

const servers = [
  { slug: "7-days-to-die", displayName: "7 Days to Die", gameType: "SEVEN_DAYS_TO_DIE", worldName: "Navezgane After Hours", maxPlayers: 12, adapterType: "gamedig", description: "The blood moon has been rescheduled for maintenance.", capabilities: { status: true, playerCount: true, playerNames: false, version: true, ping: true, deaths: false, kills: false, chat: false, adminControl: false } },
  { slug: "project-zomboid", displayName: "Project Zomboid", gameType: "PROJECT_ZOMBOID", worldName: "Knox Country", maxPlayers: 16, adapterType: "gamedig", description: "The neighborhood watch has become a little too hands-on.", capabilities: { status: true, playerCount: true, playerNames: false, version: true, ping: true, deaths: false, kills: false, chat: false, adminControl: false } },
  { slug: "dragonwilds", displayName: "RuneScape: Dragonwilds", gameType: "DRAGONWILDS", worldName: "The Wild Country", maxPlayers: 6, adapterType: "dragonwilds", description: "Surveying dangerous wildlife with almost no paperwork.", capabilities: { status: true, playerCount: false, playerNames: false, version: true, ping: false, deaths: false, kills: false, chat: false, adminControl: false } },
  { slug: "enshrouded", displayName: "Enshrouded", gameType: "ENSHROUDED", worldName: "The Embervale", maxPlayers: 16, adapterType: "gamedig", description: "A little smoke in the air never hurt anyone. Probably.", capabilities: { status: true, playerCount: true, playerNames: false, version: true, ping: true, deaths: false, kills: false, chat: false, adminControl: false } },
  { slug: "palworld", displayName: "Palworld", gameType: "PALWORLD", worldName: "Habitat Preserve", maxPlayers: 32, adapterType: "palworld-rest", description: "The pals are resting. Management is pretending this is humane.", capabilities: { status: true, playerCount: true, playerNames: true, version: true, ping: false, deaths: false, kills: false, chat: false, adminControl: false } },
  { slug: "valheim", displayName: "Valheim", gameType: "VALHEIM", worldName: "Habitat Valhalla", maxPlayers: 10, adapterType: "gamedig", description: "A quiet coast, an unreasonable number of portals, and one tree with a grudge.", capabilities: { status: true, playerCount: true, playerNames: false, version: true, ping: true, deaths: false, kills: false, chat: false, adminControl: false } },
] as const;

const achievements = [
  { slug: "welcome-to-gods-country", name: "Welcome to God's Country", description: "Join any Habitat world after your identity is verified.", rarity: "COMMON", category: "Social", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 1 }, points: 10 },
  { slug: "habitat-tourist", name: "Habitat Tourist", description: "Join verified worlds in three different games.", rarity: "UNCOMMON", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 3 }, points: 25 },
] as const;

const records = [
  { slug: "most-verified-visits", title: "Most Verified Visits", description: "The most recorded, verified player joins across all Habitat worlds.", hall: "LEGENDS", category: "Community", valueLabel: "verified visits", ruleType: "PLAYER_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED" } },
  { slug: "most-worlds-touched", title: "Most Worlds Touched", description: "The most distinct Habitat games joined with a verified identity.", hall: "LEGENDS", category: "Exploration", valueLabel: "games explored", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED" } },
  { slug: "most-achievements", title: "Most Achievements", description: "The highest verified achievement count in the Habitat.", hall: "LEGENDS", category: "Achievement", valueLabel: "achievements earned", ruleType: "ACHIEVEMENT_COUNT", ruleConfig: {} },
] as const;

async function main() {
  for (const server of servers) {
    await prisma.gameServer.upsert({
      where: { slug: server.slug },
      create: server,
      update: {
        displayName: server.displayName,
        worldName: server.worldName,
        description: server.description,
        maxPlayers: server.maxPlayers,
        adapterType: server.adapterType,
        capabilities: server.capabilities,
      },
    });
  }
  for (const achievement of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: {
        name: achievement.name,
        description: achievement.description,
        rarity: achievement.rarity,
        category: achievement.category,
        ruleType: achievement.ruleType,
        ruleConfig: achievement.ruleConfig,
        points: achievement.points,
        enabled: true,
      },
    });
  }
  for (const record of records) {
    await prisma.recordDefinition.upsert({
      where: { slug: record.slug },
      create: record,
      update: {
        title: record.title,
        description: record.description,
        hall: record.hall,
        category: record.category,
        valueLabel: record.valueLabel,
        ruleType: record.ruleType,
        ruleConfig: record.ruleConfig,
        enabled: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
