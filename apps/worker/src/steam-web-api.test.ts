import assert from "node:assert/strict";
import test from "node:test";
import { fetchSteamOwnedGames, fetchSteamPlayerSummaries, parseSteamAchievementSchema, parseSteamOwnedGames, parseSteamPlayerAchievements, parseSteamPlayerSummaries, steamAchievementPriority, SteamWebApiError, type SteamFetch } from "@habitat/shared";

test("normalizes Steam profile summaries without inventing unavailable fields", () => {
  const summaries = parseSteamPlayerSummaries({ response: { players: [{
    steamid: "76561198000000000",
    personaname: "Lodge Bear",
    profileurl: "https://steamcommunity.com/profiles/76561198000000000/",
    avatar: "https://cdn.example/avatar.jpg",
    communityvisibilitystate: 3,
    profilestate: 1,
    timecreated: 1_700_000_000,
    lastlogoff: 0,
    gameid: "252950",
    gameextrainfo: "Rocket League",
  }] } });
  assert.equal(summaries[0]?.personaName, "Lodge Bear");
  assert.equal(summaries[0]?.communityVisibilityState, 3);
  assert.equal(summaries[0]?.lastLogoffAt, null);
  assert.equal(summaries[0]?.currentGameAppId, 252950);
});

test("normalizes a visible Steam library and treats an absent list as ambiguous", () => {
  const visible = parseSteamOwnedGames({ response: { game_count: 1, games: [{ appid: 892970, name: "Valheim", playtime_forever: 1200, playtime_2weeks: 60, rtime_last_played: 1_700_000_000, img_icon_url: "hash" }] } });
  assert.equal(visible.visibility, "VISIBLE");
  assert.equal(visible.games[0]?.playtimeMinutes, 1200);
  assert.equal(visible.games[0]?.lastPlayedAt, "2023-11-14T22:13:20.000Z");
  assert.deepEqual(parseSteamOwnedGames({ response: {} }), { games: [], reportedGameCount: null, visibility: "EMPTY_OR_PRIVATE" });
});

test("Steam API requests keep the key server-side and map provider failures", async () => {
  const seen: string[] = [];
  const ok: SteamFetch = async (input) => {
    seen.push(input);
    return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ response: { players: [{ steamid: "76561198000000000", personaname: "Bear" }] } }) };
  };
  const summaries = await fetchSteamPlayerSummaries(["76561198000000000"], "private-key", ok);
  assert.equal(summaries.length, 1);
  assert.match(seen[0] ?? "", /key=private-key/);

  const limited: SteamFetch = async () => ({ ok: false, status: 429, headers: { get: (name) => name === "retry-after" ? "90" : null }, json: async () => ({}) });
  await assert.rejects(() => fetchSteamOwnedGames("76561198000000000", "private-key", limited), (error: unknown) => error instanceof SteamWebApiError && error.code === "RATE_LIMITED" && error.retryAfterSeconds === 90);
});

test("rejects malformed Steam library entries rather than fabricating app data", () => {
  assert.throws(() => parseSteamOwnedGames({ response: { games: [{ appid: 10, playtime_forever: 5 }] } }), SteamWebApiError);
});

test("normalizes Steam achievement definitions and player progress", () => {
  const schema = parseSteamAchievementSchema({ game: { gameName: "Valheim", availableGameStats: { achievements: [{ name: "DEFEAT_EIKTHYR", displayName: "Eikthyr", description: "Defeat the first Forsaken.", hidden: 0, icon: "https://cdn.example/earned.jpg", icongray: "https://cdn.example/locked.jpg" }] } } });
  assert.equal(schema.status, "READY");
  assert.equal(schema.definitions[0]?.apiName, "DEFEAT_EIKTHYR");
  const progress = parseSteamPlayerAchievements({ playerstats: { success: true, achievements: [{ apiname: "DEFEAT_EIKTHYR", achieved: 1, unlocktime: 1_700_000_000 }, { apiname: "DEFEAT_BONEMASS", achieved: 0, unlocktime: 0 }] } });
  assert.equal(progress.status, "READY");
  assert.equal(progress.achievements[0]?.unlockedAt, "2023-11-14T22:13:20.000Z");
  assert.equal(progress.achievements[1]?.unlockedAt, null);
});

test("treats unsupported and private Steam achievement responses as terminal provider states", () => {
  assert.equal(parseSteamAchievementSchema({ game: { availableGameStats: {} } }).status, "UNSUPPORTED");
  assert.equal(parseSteamPlayerAchievements({ playerstats: { success: false, error: "Requested app has no stats" } }).status, "UNSUPPORTED");
  assert.equal(parseSteamPlayerAchievements({ playerstats: { success: false, error: "Profile is not public" } }).status, "PRIVATE");
});

test("maps achievement-only HTTP authorization denial to an account access restriction", async () => {
  const forbidden: SteamFetch = async () => ({ ok: false, status: 403, headers: { get: () => null }, json: async () => ({}) });
  const result = await import("@habitat/shared").then(({ fetchSteamPlayerAchievements }) => fetchSteamPlayerAchievements("76561198000000000", 10, "profile-valid-key", forbidden));
  assert.equal(result.status, "ACCESS_RESTRICTED");
});

test("Steam achievement work prioritizes recently played games", () => {
  const older = { appId: 1, name: "Old", iconHash: null, playtimeMinutes: 50_000, playtimeTwoWeeksMinutes: null, lastPlayedAt: "2025-01-01T00:00:00.000Z" };
  const recent = { appId: 2, name: "Recent", iconHash: null, playtimeMinutes: 10, playtimeTwoWeeksMinutes: 10, lastPlayedAt: "2026-08-12T00:00:00.000Z" };
  assert.ok(steamAchievementPriority(recent) > steamAchievementPriority(older));
});
