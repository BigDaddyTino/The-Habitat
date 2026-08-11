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
  { slug: "first-rounds-on-you", name: "First Round's on You", description: "Make three verified visits to the Habitat. The cabin remembers.", rarity: "COMMON", category: "Social", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 3 }, points: 15 },
  { slug: "cabin-fever", name: "Cabin Fever", description: "Make five verified visits. Fresh air was never the plan.", rarity: "UNCOMMON", category: "Social", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 5 }, points: 25 },
  { slug: "one-more-run", name: "One More Run", description: "Make ten verified visits. Sleep is a future-you problem.", rarity: "UNCOMMON", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 10 }, points: 35 },
  { slug: "frequent-flyer", name: "Frequent Flyer", description: "Make 25 verified visits across the Habitat.", rarity: "RARE", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 25 }, points: 65 },
  { slug: "the-long-haul", name: "The Long Haul", description: "Make 50 verified visits. At this point, the lodge has a drawer for you.", rarity: "EPIC", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 50 }, points: 120 },
  { slug: "border-hopper", name: "Border Hopper", description: "Join verified worlds in two different games.", rarity: "UNCOMMON", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 2 }, points: 25 },
  { slug: "habitat-tourist", name: "Habitat Tourist", description: "Join verified worlds in three different games.", rarity: "RARE", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 3 }, points: 45 },
  { slug: "cartographer-of-chaos", name: "Cartographer of Chaos", description: "Join verified worlds in four different games.", rarity: "EPIC", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 4 }, points: 85 },
  { slug: "six-pack-of-worlds", name: "Six Pack of Worlds", description: "Set foot in every verified Habitat game. Hydrate occasionally.", rarity: "LEGENDARY", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 6 }, points: 180 },
] as const;

const titles = [
  { slug: "campfire-regular", name: "Campfire Regular", description: "Knows where the good chairs are." },
  { slug: "trailblazer", name: "Trailblazer", description: "Leaves a path through more than one world." },
  { slug: "lodge-legend", name: "Lodge Legend", description: "The cabin lights itself when they arrive." },
] as const;

const achievementRewards = [
  { achievementSlug: "first-rounds-on-you", kind: "BADGE", code: "first-round", name: "First Round Badge", description: "A brass welcome badge for the regulars." },
  { achievementSlug: "cabin-fever", kind: "TITLE", code: "campfire-regular", name: "Campfire Regular", description: "Selectable title", titleSlug: "campfire-regular" },
  { achievementSlug: "one-more-run", kind: "AVATAR_BORDER", code: "ember-ring", name: "Ember Ring", description: "An animated ember avatar border." },
  { achievementSlug: "frequent-flyer", kind: "BADGE", code: "frequent-flyer", name: "Frequent Flyer", description: "For those who keep returning to the wild." },
  { achievementSlug: "habitat-tourist", kind: "TITLE", code: "trailblazer", name: "Trailblazer", description: "Selectable title", titleSlug: "trailblazer" },
  { achievementSlug: "cartographer-of-chaos", kind: "PROFILE_LAYOUT", code: "trophy-case", name: "Trophy Case", description: "Unlocks a trophy-forward profile layout." },
  { achievementSlug: "six-pack-of-worlds", kind: "TITLE", code: "lodge-legend", name: "Lodge Legend", description: "Selectable title", titleSlug: "lodge-legend" },
  { achievementSlug: "six-pack-of-worlds", kind: "AVATAR_BORDER", code: "aurora-ring", name: "Aurora Ring", description: "A legendary aurora avatar border." },
  { achievementSlug: "six-pack-of-worlds", kind: "BADGE", code: "all-worlds", name: "All Worlds", description: "The Habitat's full-world badge." },
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
  for (const title of titles) {
    await prisma.titleDefinition.upsert({ where: { slug: title.slug }, create: title, update: { name: title.name, description: title.description, enabled: true } });
  }
  for (const reward of achievementRewards) {
    const achievement = await prisma.achievementDefinition.findUniqueOrThrow({ where: { slug: reward.achievementSlug }, select: { id: true } });
    const title = "titleSlug" in reward ? await prisma.titleDefinition.findUniqueOrThrow({ where: { slug: reward.titleSlug }, select: { id: true } }) : null;
    await prisma.achievementReward.upsert({
      where: { achievementDefinitionId_kind_code: { achievementDefinitionId: achievement.id, kind: reward.kind, code: reward.code } },
      create: { achievementDefinitionId: achievement.id, kind: reward.kind, code: reward.code, name: reward.name, description: reward.description, titleDefinitionId: title?.id },
      update: { name: reward.name, description: reward.description, titleDefinitionId: title?.id },
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
