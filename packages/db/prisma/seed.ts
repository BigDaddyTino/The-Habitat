import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "../src/client";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const prisma = createPrismaClient();
const crossGameConsumersEnabled = process.env.HABITAT_CROSS_GAME_CONSUMERS_ENABLED === "true";

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
  { slug: "door-knows-you", name: "The Door Knows You", description: "Make 75 verified visits. The hinges now greet you by name.", rarity: "RARE", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 75 }, points: 160 },
  { slug: "porch-light-never-off", name: "The Porch Light Never Turns Off", description: "Make 100 verified visits. We have stopped pretending this is a coincidence.", rarity: "EPIC", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 100 }, points: 225 },
  { slug: "chronicle-menace", name: "Chronicle Menace", description: "Make 250 verified visits. The historians have asked you to slow down. You did not.", rarity: "LEGENDARY", category: "Endurance", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 250 }, points: 400 },
  { slug: "border-hopper", name: "Border Hopper", description: "Join verified worlds in two different games.", rarity: "UNCOMMON", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 2 }, points: 25 },
  { slug: "habitat-tourist", name: "Habitat Tourist", description: "Join verified worlds in three different games.", rarity: "RARE", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 3 }, points: 45 },
  { slug: "cartographer-of-chaos", name: "Cartographer of Chaos", description: "Join verified worlds in four different games.", rarity: "EPIC", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 4 }, points: 85 },
  { slug: "passport-of-chaos", name: "Passport of Chaos", description: "Visit five different verified Habitat games. The luggage is mostly crafting materials.", rarity: "LEGENDARY", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 5 }, points: 145 },
  { slug: "six-pack-of-worlds", name: "Six Pack of Worlds", description: "Set foot in every verified Habitat game. Hydrate occasionally.", rarity: "LEGENDARY", category: "Exploration", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 6 }, points: 180 },
  { slug: "bossbreaker", name: "Bossbreaker", description: "Help bring down a boss recorded by verified Habitat game telemetry.", rarity: "LEGENDARY", category: "Combat", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "BOSS_KILLED", threshold: 1, minimumConfidence: 100 }, points: 180 },
  { slug: "before-we-kept-receipts", name: "Before We Kept Receipts", description: "Verified legacy server evidence proves you were here before the Chronicle started keeping score.", rarity: "RARE", category: "Legacy", ruleType: "LEGACY_EVIDENCE_COUNT", ruleConfig: { threshold: 1 }, points: 30 },
  { slug: "old-maps-new-scars", name: "Old Maps, New Scars", description: "Recover three separate verified records from the pre-Chronicle era.", rarity: "EPIC", category: "Legacy", ruleType: "LEGACY_EVIDENCE_COUNT", ruleConfig: { threshold: 3 }, points: 90 },
  { slug: "boots-on-the-ground", name: "Boots on the Ground", description: "Reach Habitat Level 5. The firewood stack now recognizes you.", rarity: "COMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 5 }, points: 10 },
  { slug: "fresh-spawn-no-more", name: "Fresh Spawn No More", description: "Reach Habitat Level 10. You now know which chest everyone ignores.", rarity: "COMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 10 }, points: 20 },
  { slug: "fireplace-is-yours", name: "The Fireplace Is Yours", description: "Reach Habitat Level 15. You have a preferred chair and strong opinions about it.", rarity: "UNCOMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 15 }, points: 35 },
  { slug: "quarter-century-crisis", name: "Quarter-Century Crisis", description: "Reach Habitat Level 25. Buy the impractical armor. You earned it.", rarity: "UNCOMMON", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 25 }, points: 50 },
  { slug: "certified-time-thief", name: "Certified Time Thief", description: "Reach Habitat Level 35. You did not steal time; time simply failed to secure itself.", rarity: "RARE", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 35 }, points: 85 },
  { slug: "halfway-to-questionable", name: "Halfway to Questionable", description: "Reach Habitat Level 50. The sun is a rumor and your backlog is immortal.", rarity: "EPIC", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 50 }, points: 125 },
  { slug: "weekend-was-a-myth", name: "The Weekend Was a Myth", description: "Reach Habitat Level 60. Calendar claims are now considered unreliable.", rarity: "EPIC", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 60 }, points: 170 },
  { slug: "touch-grass-legend", name: "Touch Grass Legend", description: "Reach Habitat Level 75. The grass has filed a missing-person report.", rarity: "LEGENDARY", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 75 }, points: 250 },
  { slug: "almost-unreasonable", name: "Almost Unreasonable", description: "Reach Habitat Level 90. Concerned friends have formed a committee.", rarity: "LEGENDARY", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 90 }, points: 350 },
  { slug: "the-longest-game", name: "The Longest Game", description: "Reach Habitat Level 100. Years of verified chaos, permanently entered into lodge history.", rarity: "QUESTIONABLE_LIFE_CHOICE", category: "Progression", ruleType: "LEVEL_REACHED", ruleConfig: { level: 100 }, points: 500 },
  { slug: "tutorial-took-it-personally", name: "The Tutorial Took It Personally", description: "Reach Habitat Level 20. Whatever was supposed to teach moderation has clearly failed.", secretDescription: "A classified milestone somewhere beyond the tutorial.", icon: "COMPASS", rarity: "RARE", category: "Secret", ruleType: "LEVEL_REACHED", ruleConfig: { level: 20 }, isSecret: true, points: 55 },
  { slug: "inventory-full-life-complicated", name: "Inventory Full, Life Complicated", description: "Reach Habitat Level 40. Every pocket contains something essential and at least one rock.", secretDescription: "A secret for someone carrying far too much.", icon: "PACK", rarity: "EPIC", category: "Secret", ruleType: "LEVEL_REACHED", ruleConfig: { level: 40 }, isSecret: true, points: 110 },
  { slug: "concerned-committee", name: "The Concerned Committee", description: "Reach Habitat Level 80. Friends have reviewed the hours and scheduled a tasteful intervention.", secretDescription: "Several people are quietly comparing notes.", icon: "EYE", rarity: "LEGENDARY", category: "Secret", ruleType: "LEVEL_REACHED", ruleConfig: { level: 80 }, isSecret: true, points: 290 },
  { slug: "chair-has-a-groove", name: "The Chair Has a Groove", description: "Make 150 verified visits. The furniture now contains a historically significant impression.", secretDescription: "The lodge furniture is beginning to remember you.", icon: "CHAIR", rarity: "EPIC", category: "Secret", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 150 }, isSecret: true, points: 300 },
  { slug: "permanent-resident-allegedly", name: "Permanent Resident, Allegedly", description: "Make 500 verified visits. The deed is disputed, but the key works and nobody is asking questions.", secretDescription: "A deeply unreasonable number of arrivals remains classified.", icon: "KEY", rarity: "QUESTIONABLE_LIFE_CHOICE", category: "Secret", ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 500 }, isSecret: true, points: 650 },
  { slug: "museum-of-bad-decisions", name: "Museum of Bad Decisions", description: "Recover ten verified legacy records. The archive has been upgraded from folder to exhibit.", secretDescription: "Old evidence is accumulating behind a locked cabinet.", icon: "ARCHIVE", rarity: "LEGENDARY", category: "Secret", ruleType: "LEGACY_EVIDENCE_COUNT", ruleConfig: { threshold: 10 }, isSecret: true, points: 210 },
  { slug: "osha-left-the-longhouse", name: "OSHA Left the Longhouse", description: "Make 15 verified visits to Valheim. The safety meeting has been postponed indefinitely.", secretDescription: "A Valheim regular is making the inspectors nervous.", icon: "RUNE", gameType: "VALHEIM", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "VALHEIM", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "management-denies-everything", name: "Management Denies Everything", description: "Make 15 verified visits to Palworld. The preserve remains completely normal and legally unremarkable.", secretDescription: "The Palworld management report has been heavily redacted.", icon: "PAW", gameType: "PALWORLD", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "PALWORLD", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "seven-days-no-calendar", name: "Seven Days, No Calendar", description: "Make 15 verified visits to 7 Days to Die. Every day is apparently Tuesday with more screaming.", secretDescription: "The blood moon calendar contains an unexplained appointment.", icon: "MOON", gameType: "SEVEN_DAYS_TO_DIE", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "SEVEN_DAYS_TO_DIE", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "this-is-how-you-logged-in", name: "This Is How You Logged In", description: "Make 15 verified visits to Project Zomboid. Survival remains pending; attendance is impeccable.", secretDescription: "Knox Country has noticed a familiar login.", icon: "SKULL", gameType: "PROJECT_ZOMBOID", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "PROJECT_ZOMBOID", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "respiratory-optional", name: "Respiratory Optional", description: "Make 15 verified visits to Enshrouded. Clean air continues to be treated as premium content.", secretDescription: "Something persistent is moving through the Shroud.", icon: "FLAME", gameType: "ENSHROUDED", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "ENSHROUDED", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "dragon-under-control", name: "Dragon? Under Control.", description: "Make 15 verified visits to Dragonwilds. The question mark is part of the official safety statement.", secretDescription: "The Wild Country incident report ends with a question mark.", icon: "SHIELD", gameType: "DRAGONWILDS", rarity: "EPIC", category: "World Mastery", ruleType: "GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", gameType: "DRAGONWILDS", threshold: 15 }, isSecret: true, points: 105 },
  { slug: "do-not-tap-the-glass", name: "Do Not Tap the Glass", description: "Click the bear during a live Great Hall encounter. It objected loudly.", secretDescription: "The Great Hall window occasionally looks back.", icon: "BEAR", rarity: "EPIC", category: "Secret", ruleType: "WEB_INTERACTION", ruleConfig: { interaction: "HALL_BEAR_CLICK" }, isSecret: true, points: 125 },
  { slug: "rivals-first-win", name: "First Rival Down", description: "Win a verified Marvel Rivals match after linking your profile.", gameKey: "MARVEL_RIVALS", rarity: "COMMON", category: "Marvel Rivals", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "MATCH_WON", threshold: 1, minimumConfidence: 90 }, points: 15, enabled: crossGameConsumersEnabled },
  { slug: "menace-to-the-multiverse", name: "Menace to the Multiverse", description: "Record 10,000 verified eliminations across supported games.", rarity: "LEGENDARY", category: "Combat", ruleType: "ACTIVITY_VALUE_SUM", ruleConfig: { version: 1, activityType: "KILLS_RECORDED", threshold: 10_000, minimumConfidence: 90 }, points: 300, enabled: crossGameConsumersEnabled },
  { slug: "ride-or-die", name: "Ride or Die", description: "Play 500 verified matches with another linked Habitat member.", gameKey: "MARVEL_RIVALS", rarity: "LEGENDARY", category: "Social", ruleType: "SHARED_ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "SHARED_MATCH_PLAYED", threshold: 500, minimumConfidence: 90 }, points: 300, enabled: crossGameConsumersEnabled },
  { slug: "main-character-energy", name: "Main Character Energy", description: "Earn MVP in 100 verified Marvel Rivals matches.", gameKey: "MARVEL_RIVALS", rarity: "EPIC", category: "Marvel Rivals", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "MVP_EARNED", threshold: 100, minimumConfidence: 90 }, points: 175, enabled: crossGameConsumersEnabled },
  { slug: "professional-victim", name: "Professional Victim", description: "Record 5,000 verified deaths across supported games. Persistence counts.", rarity: "EPIC", category: "Endurance", ruleType: "ACTIVITY_VALUE_SUM", ruleConfig: { version: 1, activityType: "DEATHS_RECORDED", threshold: 5_000, minimumConfidence: 90 }, points: 160, enabled: crossGameConsumersEnabled },
  { slug: "on-a-heater", name: "On a Heater", description: "Win 10 verified Marvel Rivals matches in a row without a loss or draw.", gameKey: "MARVEL_RIVALS", rarity: "EPIC", category: "Marvel Rivals", ruleType: "ORDERED_ACTIVITY_STREAK", ruleConfig: { version: 1, successActivityType: "MATCH_WON", breakActivityTypes: ["MATCH_LOST", "MATCH_DRAWN"], threshold: 10, minimumConfidence: 90 }, points: 190, enabled: crossGameConsumersEnabled },
] as const;

const titles = [
  { slug: "campfire-regular", name: "Campfire Regular", description: "Knows where the good chairs are." },
  { slug: "trailblazer", name: "Trailblazer", description: "Leaves a path through more than one world." },
  { slug: "lodge-legend", name: "Lodge Legend", description: "The cabin lights itself when they arrive." },
  { slug: "old-guard", name: "Old Guard", description: "Was here before the lodge had paperwork." },
  { slug: "seasoned-survivor", name: "Seasoned Survivor", description: "Level 25 and still looting every drawer." },
  { slug: "grass-is-a-rumor", name: "Grass Is a Rumor", description: "A Level 75 monument to responsible life choices." },
  { slug: "habitat-centurion", name: "Habitat Centurion", description: "Reached the summit of a deliberately unreasonable climb." },
  { slug: "door-gremlin", name: "Door Gremlin", description: "Arrives so often that the entryway has adapted." },
  { slug: "chronicle-menace", name: "Chronicle Menace", description: "A recurring complication for the official record." },
  { slug: "time-thief", name: "Certified Time Thief", description: "Time failed to secure itself." },
  { slug: "almost-unreasonable", name: "Almost Unreasonable", description: "A deeply committed upper-tier resident." },
  { slug: "lodge-owner-on-paper", name: "Lodge Owner on Paper", description: "The deed is dubious. The authority is not." },
  { slug: "bearly-welcome", name: "Bearly Welcome", description: "Tapped the glass and survived the formal complaint." },
] as const;

const achievementRewards = [
  { achievementSlug: "first-rounds-on-you", kind: "BADGE", code: "first-round", name: "First Round Badge", description: "A brass welcome badge for the regulars." },
  { achievementSlug: "cabin-fever", kind: "TITLE", code: "campfire-regular", name: "Campfire Regular", description: "Selectable title", titleSlug: "campfire-regular" },
  { achievementSlug: "one-more-run", kind: "AVATAR_BORDER", code: "ember-ring", name: "Ember Ring", description: "An animated ember avatar border." },
  { achievementSlug: "frequent-flyer", kind: "BADGE", code: "frequent-flyer", name: "Frequent Flyer", description: "For those who keep returning to the wild." },
  { achievementSlug: "door-knows-you", kind: "TITLE", code: "door-gremlin", name: "Door Gremlin", description: "Selectable high-visit title", titleSlug: "door-gremlin" },
  { achievementSlug: "porch-light-never-off", kind: "AVATAR_BORDER", code: "porchlight-ring", name: "Porchlight Ring", description: "A warm animated border for the habitual returner." },
  { achievementSlug: "chronicle-menace", kind: "TITLE", code: "chronicle-menace", name: "Chronicle Menace", description: "Selectable legendary title", titleSlug: "chronicle-menace" },
  { achievementSlug: "chronicle-menace", kind: "PROFILE_LAYOUT", code: "war-room", name: "War Room", description: "A legendary profile layout for somebody always in the log." },
  { achievementSlug: "habitat-tourist", kind: "TITLE", code: "trailblazer", name: "Trailblazer", description: "Selectable title", titleSlug: "trailblazer" },
  { achievementSlug: "cartographer-of-chaos", kind: "PROFILE_LAYOUT", code: "trophy-case", name: "Trophy Case", description: "Unlocks a trophy-forward profile layout." },
  { achievementSlug: "six-pack-of-worlds", kind: "TITLE", code: "lodge-legend", name: "Lodge Legend", description: "Selectable title", titleSlug: "lodge-legend" },
  { achievementSlug: "six-pack-of-worlds", kind: "AVATAR_BORDER", code: "aurora-ring", name: "Aurora Ring", description: "A legendary aurora avatar border." },
  { achievementSlug: "six-pack-of-worlds", kind: "BADGE", code: "all-worlds", name: "All Worlds", description: "The Habitat's full-world badge." },
  { achievementSlug: "passport-of-chaos", kind: "BADGE", code: "five-world-passport", name: "Five-World Passport", description: "Stamped across almost every Habitat frontier." },
  { achievementSlug: "before-we-kept-receipts", kind: "TITLE", code: "old-guard", name: "Old Guard", description: "Selectable legacy title", titleSlug: "old-guard" },
  { achievementSlug: "before-we-kept-receipts", kind: "BADGE", code: "old-save-file", name: "Old Save File", description: "Recovered from the era before the Chronicle." },
  { achievementSlug: "old-maps-new-scars", kind: "BADGE", code: "scarred-atlas", name: "Scarred Atlas", description: "Three recovered chapters from the old days." },
  { achievementSlug: "boots-on-the-ground", kind: "BADGE", code: "level-5", name: "Level 5 Patch", description: "The first few miles are officially behind you." },
  { achievementSlug: "fresh-spawn-no-more", kind: "BADGE", code: "level-10", name: "Level 10 Patch", description: "Proof that the tutorial did not win." },
  { achievementSlug: "fireplace-is-yours", kind: "AVATAR_BORDER", code: "kindling-ring", name: "Kindling Ring", description: "A warm animated border for a lodge regular." },
  { achievementSlug: "quarter-century-crisis", kind: "TITLE", code: "seasoned-survivor", name: "Seasoned Survivor", description: "Selectable Level 25 title", titleSlug: "seasoned-survivor" },
  { achievementSlug: "quarter-century-crisis", kind: "AVATAR_BORDER", code: "ironwood-ring", name: "Ironwood Ring", description: "A rugged animated Level 25 avatar border." },
  { achievementSlug: "certified-time-thief", kind: "TITLE", code: "time-thief", name: "Certified Time Thief", description: "Selectable Level 35 title", titleSlug: "time-thief" },
  { achievementSlug: "halfway-to-questionable", kind: "PROFILE_LAYOUT", code: "veteran-vault", name: "Veteran Vault", description: "A Level 50 profile layout for serious trophy hoarding." },
  { achievementSlug: "halfway-to-questionable", kind: "BADGE", code: "level-50", name: "The Halfway Mark", description: "Halfway in level count. Absolutely not halfway in XP." },
  { achievementSlug: "weekend-was-a-myth", kind: "PROFILE_LAYOUT", code: "weekend-myth", name: "Weekend Myth", description: "A Level 60 profile layout for calendar skeptics." },
  { achievementSlug: "touch-grass-legend", kind: "TITLE", code: "grass-is-a-rumor", name: "Grass Is a Rumor", description: "Selectable Level 75 title", titleSlug: "grass-is-a-rumor" },
  { achievementSlug: "touch-grass-legend", kind: "AVATAR_BORDER", code: "mythic-flame-ring", name: "Mythic Flame Ring", description: "A legendary Level 75 animated avatar border." },
  { achievementSlug: "almost-unreasonable", kind: "TITLE", code: "almost-unreasonable", name: "Almost Unreasonable", description: "Selectable Level 90 title", titleSlug: "almost-unreasonable" },
  { achievementSlug: "almost-unreasonable", kind: "AVATAR_BORDER", code: "solar-flare-ring", name: "Solar Flare Ring", description: "A legendary animated border for the near summit." },
  { achievementSlug: "the-longest-game", kind: "TITLE", code: "habitat-centurion", name: "Habitat Centurion", description: "The Level 100 title", titleSlug: "habitat-centurion" },
  { achievementSlug: "the-longest-game", kind: "AVATAR_BORDER", code: "centurion-ring", name: "Centurion Singularity", description: "The Level 100 animated avatar border." },
  { achievementSlug: "the-longest-game", kind: "PROFILE_LAYOUT", code: "centurion-hall", name: "Centurion Hall", description: "The final legendary profile presentation." },
  { achievementSlug: "the-longest-game", kind: "BADGE", code: "level-100", name: "Level 100", description: "The deliberately unreasonable summit." },
  { achievementSlug: "the-long-haul", kind: "TROPHY", code: "fifty-visit-antler", name: "The Fifty-Visit Antler", description: "A carved lodge trophy for returning long after good judgment clocked out." },
  { achievementSlug: "passport-of-chaos", kind: "MEDAL", code: "five-world-compass", name: "Five-World Compass", description: "A compass that points toward the next questionable server." },
  { achievementSlug: "six-pack-of-worlds", kind: "TROPHY", code: "six-world-crown", name: "Crown of Six Worlds", description: "The centerpiece for a complete Habitat passport." },
  { achievementSlug: "bossbreaker", kind: "TROPHY", code: "bossbreaker-reliquary", name: "Bossbreaker Reliquary", description: "A server-forged trophy raised after a verified boss kill." },
  { achievementSlug: "old-maps-new-scars", kind: "MEDAL", code: "archive-service-medal", name: "Archive Service Medal", description: "Recovered from logs old enough to have opinions." },
  { achievementSlug: "tutorial-took-it-personally", kind: "BADGE", code: "tutorial-survivor", name: "Tutorial Survivor", description: "The instructions were defeated through stubbornness." },
  { achievementSlug: "inventory-full-life-complicated", kind: "MEDAL", code: "overpacked-medal", name: "Order of the Overpacked", description: "Awarded for carrying everything except restraint." },
  { achievementSlug: "concerned-committee", kind: "TROPHY", code: "committee-concern", name: "Committee's Formal Concern", description: "A tasteful monument to deeply committed attendance." },
  { achievementSlug: "chair-has-a-groove", kind: "TROPHY", code: "grooved-armchair", name: "The Grooved Armchair", description: "A miniature throne shaped by 150 verified arrivals." },
  { achievementSlug: "permanent-resident-allegedly", kind: "TITLE", code: "lodge-owner-on-paper", name: "Lodge Owner on Paper", description: "Selectable title of legally ambiguous residence", titleSlug: "lodge-owner-on-paper" },
  { achievementSlug: "permanent-resident-allegedly", kind: "TROPHY", code: "deed-to-the-lodge", name: "Deed to the Lodge", description: "Signed, framed, and almost certainly enforceable." },
  { achievementSlug: "museum-of-bad-decisions", kind: "TROPHY", code: "dusty-ledger", name: "The Dusty Ledger", description: "Ten authenticated chapters from before the Chronicle." },
  { achievementSlug: "osha-left-the-longhouse", kind: "MEDAL", code: "valheim-iron-rune", name: "Iron Rune of Valheim", description: "World-mastery medal forged beside the longhouse." },
  { achievementSlug: "management-denies-everything", kind: "MEDAL", code: "palworld-management-seal", name: "Preserve Management Seal", description: "Officially issued. Ethically inconclusive." },
  { achievementSlug: "seven-days-no-calendar", kind: "MEDAL", code: "blood-moon-service", name: "Blood Moon Service Medal", description: "Stamped by fifteen returns to Navezgane." },
  { achievementSlug: "this-is-how-you-logged-in", kind: "MEDAL", code: "knox-return-medal", name: "Knox County Return Medal", description: "Attendance confirmed. Survival not guaranteed." },
  { achievementSlug: "respiratory-optional", kind: "MEDAL", code: "embervale-breather", name: "Embervale Breather", description: "A Shroud-darkened medal for repeat expeditions." },
  { achievementSlug: "dragon-under-control", kind: "MEDAL", code: "wild-country-ward", name: "Wild Country Ward", description: "Dragon-tested. Wording approved by nervous counsel." },
  { achievementSlug: "the-longest-game", kind: "TROPHY", code: "centurion-monument", name: "The Centurion Monument", description: "The final centerpiece of the Habitat cabinet." },
  { achievementSlug: "do-not-tap-the-glass", kind: "TITLE", code: "bearly-welcome", name: "Bearly Welcome", description: "A selectable title for somebody who ignored the glass-tapping policy.", titleSlug: "bearly-welcome" },
  { achievementSlug: "do-not-tap-the-glass", kind: "TROPHY", code: "window-bear", name: "The Window Bear", description: "A roaring cabinet piece commemorating one inadvisable tap on the Great Hall glass." },
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

// Product configuration only: this establishes the first optional season and
// its goals. It does not create memberships, progress, XP, or live activity.
const foundingSeason = {
  slug: "first-light",
  ordinal: 1,
  name: "First Light",
  description: "Three months of fresh objectives across every Habitat world, built on top of the permanent record rather than in place of it.",
  theme: "Ironwood Dawn",
  startsAt: new Date("2026-09-01T00:00:00.000Z"),
  endsAt: new Date("2026-12-01T00:00:00.000Z"),
  communityXpGoal: 12_000,
  // Quest completion pays 1,660 across the five First Light quests, so the bar
  // sits just under a member who finished their trail plus roughly sixty hours
  // of verified play. Out of reach for a last-day enrollment, reachable for
  // anyone who actually ran the season.
  trophyXpRequirement: 1_500,
} as const;

const foundingSeasonQuests = [
  { slug: "personal-field-hours", name: "Field Hours", description: "Bank ten hours of verified play across the season.", scope: "PERSONAL", ruleType: "PLAY_SECONDS", threshold: 36_000, xpReward: 300, sortOrder: 0 },
  { slug: "personal-open-door", name: "Keep the Door Moving", description: "Make twenty verified visits during the season.", scope: "PERSONAL", ruleType: "JOIN_COUNT", threshold: 20, xpReward: 240, sortOrder: 1 },
  { slug: "personal-trail-map", name: "Mark Three Trails", description: "Visit three distinct Habitat games before the season closes.", scope: "PERSONAL", ruleType: "DISTINCT_GAME_COUNT", threshold: 3, xpReward: 320, sortOrder: 2 },
  { slug: "team-long-watch", name: "The Long Watch", description: "As a lodge, record one hundred verified play hours.", scope: "TEAM", ruleType: "PLAY_SECONDS", threshold: 360_000, xpReward: 450, sortOrder: 3 },
  { slug: "team-open-house", name: "Open House", description: "As a lodge, make two hundred verified visits across the Habitat.", scope: "TEAM", ruleType: "JOIN_COUNT", threshold: 200, xpReward: 350, sortOrder: 4 },
] as const;

const foundingSeasonExpeditions = [
  { slug: "navezgane-night-watch", gameType: "SEVEN_DAYS_TO_DIE", name: "Navezgane Night Watch", description: "Make thirty verified community visits to the blood-moon country.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 0 },
  { slug: "knox-neighborhood-watch", gameType: "PROJECT_ZOMBOID", name: "Knox Neighborhood Watch", description: "Make thirty verified community visits to Knox Country.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 1 },
  { slug: "wild-country-survey", gameType: "DRAGONWILDS", name: "Wild Country Survey", description: "Make thirty verified community visits to the Wild Country.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 2 },
  { slug: "embervale-lantern-run", gameType: "ENSHROUDED", name: "Embervale Lantern Run", description: "Make thirty verified community visits through the Shroud.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 3 },
  { slug: "preserve-rounds", gameType: "PALWORLD", name: "Preserve Rounds", description: "Make thirty verified community visits to Habitat Preserve.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 4 },
  { slug: "valhalla-voyage", gameType: "VALHEIM", name: "Valhalla Voyage", description: "Make thirty verified community visits to the northern coast.", ruleType: "JOIN_COUNT", threshold: 30, sortOrder: 5 },
] as const;

const records = [
  { slug: "most-verified-visits", title: "Most Verified Visits", description: "The most recorded, verified player joins across all Habitat worlds.", hall: "LEGENDS", category: "Community", valueLabel: "verified visits", ruleType: "PLAYER_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED" } },
  { slug: "most-worlds-touched", title: "Most Worlds Touched", description: "The most distinct Habitat games joined with a verified identity.", hall: "LEGENDS", category: "Exploration", valueLabel: "games explored", ruleType: "DISTINCT_GAME_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED" } },
  { slug: "most-achievements", title: "Most Achievements", description: "The highest verified achievement count in the Habitat.", hall: "LEGENDS", category: "Achievement", valueLabel: "achievements earned", ruleType: "ACHIEVEMENT_COUNT", ruleConfig: {} },
  { slug: "most-rivals-wins", title: "Most Marvel Rivals Wins", description: "The highest verified Marvel Rivals win count among linked Habitat members.", hall: "LEGENDS", gameKey: "MARVEL_RIVALS", category: "Marvel Rivals", valueLabel: "wins", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "MATCH_WON", minimumConfidence: 90 }, comparison: "MAX", minimumSampleSize: 1, enabled: crossGameConsumersEnabled },
  { slug: "most-rivals-eliminations", title: "Most Marvel Rivals Eliminations", description: "The highest verified total eliminations from cached Marvel Rivals match history.", hall: "LEGENDS", gameKey: "MARVEL_RIVALS", category: "Marvel Rivals", valueLabel: "eliminations", ruleType: "ACTIVITY_VALUE_SUM", ruleConfig: { version: 1, activityType: "KILLS_RECORDED", minimumConfidence: 90 }, comparison: "MAX", minimumSampleSize: 1, enabled: crossGameConsumersEnabled },
  { slug: "most-rivals-mvps", title: "Most Marvel Rivals MVPs", description: "The highest verified Marvel Rivals MVP count among linked Habitat members.", hall: "LEGENDS", gameKey: "MARVEL_RIVALS", category: "Marvel Rivals", valueLabel: "MVP awards", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "MVP_EARNED", minimumConfidence: 90 }, comparison: "MAX", minimumSampleSize: 1, enabled: crossGameConsumersEnabled },
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
        secretDescription: "secretDescription" in achievement ? achievement.secretDescription : null,
        icon: "icon" in achievement ? achievement.icon : null,
        gameType: "gameType" in achievement ? achievement.gameType : null,
        gameKey: "gameKey" in achievement ? achievement.gameKey : null,
        rarity: achievement.rarity,
        category: achievement.category,
        ruleType: achievement.ruleType,
        ruleConfig: achievement.ruleConfig,
        isSecret: "isSecret" in achievement ? achievement.isSecret : false,
        points: achievement.points,
        enabled: "enabled" in achievement ? achievement.enabled : true,
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
  const season = await prisma.season.upsert({
    where: { slug: foundingSeason.slug },
    create: foundingSeason,
    update: { name: foundingSeason.name, description: foundingSeason.description, theme: foundingSeason.theme, startsAt: foundingSeason.startsAt, endsAt: foundingSeason.endsAt, communityXpGoal: foundingSeason.communityXpGoal, trophyXpRequirement: foundingSeason.trophyXpRequirement, isEnabled: true },
  });
  for (const quest of foundingSeasonQuests) {
    await prisma.seasonQuestDefinition.upsert({
      where: { seasonId_slug: { seasonId: season.id, slug: quest.slug } },
      create: { seasonId: season.id, ...quest },
      update: { name: quest.name, description: quest.description, scope: quest.scope, ruleType: quest.ruleType, threshold: quest.threshold, xpReward: quest.xpReward, sortOrder: quest.sortOrder, enabled: true },
    });
  }
  for (const expedition of foundingSeasonExpeditions) {
    await prisma.seasonExpedition.upsert({
      where: { seasonId_slug: { seasonId: season.id, slug: expedition.slug } },
      create: { seasonId: season.id, ...expedition },
      update: { gameType: expedition.gameType, name: expedition.name, description: expedition.description, ruleType: expedition.ruleType, threshold: expedition.threshold, sortOrder: expedition.sortOrder },
    });
  }
  for (const trophy of [
    { kind: "COMMEMORATIVE" as const, code: "first-light-standard", name: "First Light Standard", description: "A gilded ironwood standard raised permanently for Habitat's first seasonal expedition.", rarity: "LEGENDARY" as const },
    { kind: "FOUNDING_MEMBER" as const, code: "founders-lantern", name: "Founder's Lantern", description: "A living-flame heirloom reserved forever for the members of Habitat's founding season.", rarity: "LEGENDARY" as const },
  ]) {
    await prisma.seasonTrophy.upsert({
      where: { seasonId_kind: { seasonId: season.id, kind: trophy.kind } },
      create: { seasonId: season.id, ...trophy },
      update: { code: trophy.code, name: trophy.name, description: trophy.description, rarity: trophy.rarity },
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
        gameKey: "gameKey" in record ? record.gameKey : null,
        comparison: "comparison" in record ? record.comparison : "MAX",
        minimumSampleSize: "minimumSampleSize" in record ? record.minimumSampleSize : 1,
        enabled: "enabled" in record ? record.enabled : true,
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
