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
  { slug: "before-we-kept-receipts", name: "Before We Kept Receipts", description: "Verified legacy server evidence proves you were here before the Chronicle started keeping score.", rarity: "RARE", category: "Legacy", ruleType: "LEGACY_EVIDENCE_COUNT", ruleConfig: { threshold: 1 }, points: 30 },
  { slug: "fresh-spawn-no-more", name: "Fresh Spawn No More", description: "Reach Habitat Level 10. You now know which chest everyone ignores.", rarity: "COMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 10 }, points: 20 },
  { slug: "quarter-century-crisis", name: "Quarter-Century Crisis", description: "Reach Habitat Level 25. Buy the impractical armor. You earned it.", rarity: "UNCOMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 25 }, points: 50 },
  { slug: "halfway-to-questionable", name: "Halfway to Questionable", description: "Reach Habitat Level 50. The sun is a rumor and your backlog is immortal.", rarity: "EPIC", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 50 }, points: 125 },
  { slug: "touch-grass-legend", name: "Touch Grass Legend", description: "Reach Habitat Level 75. The grass has filed a missing-person report.", rarity: "LEGENDARY", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 75 }, points: 250 },
  { slug: "the-longest-game", name: "The Longest Game", description: "Reach Habitat Level 100. Years of verified chaos, permanently entered into lodge history.", rarity: "QUESTIONABLE_LIFE_CHOICE", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 100 }, points: 500 },
] as const;

const titles = [
  { slug: "campfire-regular", name: "Campfire Regular", description: "Knows where the good chairs are." },
  { slug: "trailblazer", name: "Trailblazer", description: "Leaves a path through more than one world." },
  { slug: "lodge-legend", name: "Lodge Legend", description: "The cabin lights itself when they arrive." },
  { slug: "old-guard", name: "Old Guard", description: "Was here before the lodge had paperwork." },
  { slug: "seasoned-survivor", name: "Seasoned Survivor", description: "Level 25 and still looting every drawer." },
  { slug: "grass-is-a-rumor", name: "Grass Is a Rumor", description: "A Level 75 monument to responsible life choices." },
  { slug: "habitat-centurion", name: "Habitat Centurion", description: "Reached the summit of a deliberately unreasonable climb." },
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
  { achievementSlug: "before-we-kept-receipts", kind: "TITLE", code: "old-guard", name: "Old Guard", description: "Selectable legacy title", titleSlug: "old-guard" },
  { achievementSlug: "before-we-kept-receipts", kind: "BADGE", code: "old-save-file", name: "Old Save File", description: "Recovered from the era before the Chronicle." },
  { achievementSlug: "fresh-spawn-no-more", kind: "BADGE", code: "level-10", name: "Level 10 Patch", description: "Proof that the tutorial did not win." },
  { achievementSlug: "quarter-century-crisis", kind: "TITLE", code: "seasoned-survivor", name: "Seasoned Survivor", description: "Selectable Level 25 title", titleSlug: "seasoned-survivor" },
  { achievementSlug: "quarter-century-crisis", kind: "AVATAR_BORDER", code: "ironwood-ring", name: "Ironwood Ring", description: "A rugged animated Level 25 avatar border." },
  { achievementSlug: "halfway-to-questionable", kind: "PROFILE_LAYOUT", code: "veteran-vault", name: "Veteran Vault", description: "A Level 50 profile layout for serious trophy hoarding." },
  { achievementSlug: "halfway-to-questionable", kind: "BADGE", code: "level-50", name: "The Halfway Mark", description: "Halfway in level count. Absolutely not halfway in XP." },
  { achievementSlug: "touch-grass-legend", kind: "TITLE", code: "grass-is-a-rumor", name: "Grass Is a Rumor", description: "Selectable Level 75 title", titleSlug: "grass-is-a-rumor" },
  { achievementSlug: "touch-grass-legend", kind: "AVATAR_BORDER", code: "mythic-flame-ring", name: "Mythic Flame Ring", description: "A legendary Level 75 animated avatar border." },
  { achievementSlug: "the-longest-game", kind: "TITLE", code: "habitat-centurion", name: "Habitat Centurion", description: "The Level 100 title", titleSlug: "habitat-centurion" },
  { achievementSlug: "the-longest-game", kind: "AVATAR_BORDER", code: "centurion-ring", name: "Centurion Singularity", description: "The Level 100 animated avatar border." },
  { achievementSlug: "the-longest-game", kind: "PROFILE_LAYOUT", code: "centurion-hall", name: "Centurion Hall", description: "The final legendary profile presentation." },
  { achievementSlug: "the-longest-game", kind: "BADGE", code: "level-100", name: "Level 100", description: "The deliberately unreasonable summit." },
] as const;

const weeklyQuests = [
  { slug: "two-hour-tour", name: "The Two-Hour Tour", description: "Bank two hours of verified Habitat playtime this week.", ruleType: "PLAY_SECONDS", threshold: 7_200, xpReward: 350, icon: "CLOCK" },
  { slug: "five-hour-energy", name: "Five-Hour Energy", description: "Bank five hours of verified playtime. Beverage not included.", ruleType: "PLAY_SECONDS", threshold: 18_000, xpReward: 750, icon: "FLAME" },
  { slug: "weekend-disappeared", name: "Where Did Saturday Go?", description: "Bank ten verified hours in Habitat worlds this week.", ruleType: "PLAY_SECONDS", threshold: 36_000, xpReward: 1_400, icon: "MOON" },
  { slug: "full-time-hobby", name: "Definitely Just a Hobby", description: "Bank fifteen verified hours this week. Stretch occasionally.", ruleType: "PLAY_SECONDS", threshold: 54_000, xpReward: 2_200, icon: "SKULL" },
  { slug: "three-drop-ins", name: "Door Revolves Both Ways", description: "Make three verified visits this week.", ruleType: "JOIN_COUNT", threshold: 3, xpReward: 400, icon: "DOOR" },
  { slug: "five-more-minutes", name: "Five More Minutes", description: "Make five verified visits this week.", ruleType: "JOIN_COUNT", threshold: 5, xpReward: 700, icon: "FOOTPRINTS" },
  { slug: "serial-respawner", name: "Serial Respawner", description: "Make ten verified visits this week. No judgment. Some judgment.", ruleType: "JOIN_COUNT", threshold: 10, xpReward: 1_200, icon: "REPEAT" },
  { slug: "double-feature", name: "Double Feature", description: "Visit two different Habitat games this week.", ruleType: "DISTINCT_GAME_COUNT", threshold: 2, xpReward: 600, icon: "MAP" },
  { slug: "genre-confusion", name: "Genre Confusion", description: "Visit three different Habitat games this week.", ruleType: "DISTINCT_GAME_COUNT", threshold: 3, xpReward: 1_000, icon: "COMPASS" },
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
  for (const quest of weeklyQuests) {
    await prisma.weeklyQuestDefinition.upsert({ where: { slug: quest.slug }, create: quest, update: { name: quest.name, description: quest.description, ruleType: quest.ruleType, threshold: quest.threshold, xpReward: quest.xpReward, icon: quest.icon, enabled: true } });
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
