import assert from "node:assert/strict";
import test from "node:test";
import { fetchMarvelRivalsMatchHistory, isValidMarvelRivalsQuery, MarvelRivalsApiError, parseMarvelRivalsMatchHistory, parseMarvelRivalsProfile, type RivalsFetch } from "@habitat/shared";

test("normalizes public Marvel Rivals stats without inventing missing fields", () => {
  const profile = parseMarvelRivalsProfile({
    uid: 123456789,
    name: "LodgeBear",
    player: { level: "42", rank: { rank: "Diamond III" }, isPrivate: false },
    updates: { info_update_time: "2026-08-12T14:00:00Z" },
    overall_stats: {
      total_matches: 120,
      total_wins: 67,
      ranked: { total_kills: 320, total_deaths: 100, total_assists: 180 },
      unranked: { total_kills: 80, total_deaths: 50, total_assists: 20 },
    },
    rank_history: [{ match_time_stamp: 20, rank: "Diamond III", points: 4310 }],
    heroes_ranked: [
      { hero_name: "Rocket Raccoon", matches: 30, wins: 18, kills: 80, deaths: 25, assists: 130 },
      { hero_name: "Thor", matches: 12, wins: 7, kills: 91, deaths: 42, assists: 30 },
    ],
  });
  assert.equal(profile.uid, "123456789");
  assert.equal(profile.displayName, "LodgeBear");
  assert.equal(profile.playerLevel, 42);
  assert.equal(profile.rankName, "Diamond III");
  assert.equal(profile.rankScore, 4310);
  assert.equal(profile.overallKd, 2.67);
  assert.equal(profile.overallKda, 4);
  assert.deepEqual(profile.topHeroes.map((hero) => hero.name), ["Rocket Raccoon", "Thor"]);
  assert.equal(profile.peakRankName, null);
});

test("accepts names and UIDs but rejects path-like input", () => {
  assert.equal(isValidMarvelRivalsQuery("Lodge Bear.7"), true);
  assert.equal(isValidMarvelRivalsQuery("123456789"), true);
  assert.equal(isValidMarvelRivalsQuery("../../player"), false);
  assert.equal(isValidMarvelRivalsQuery("x"), false);
});

test("normalizes documented Rivals match history into participant-level evidence", () => {
  const page = parseMarvelRivalsMatchHistory({
    match_history: [{
      match_uid: "match-123",
      match_time_stamp: 1_700_000_000,
      match_play_duration: "15 minutes",
      match_season: "6",
      match_map_id: 12,
      game_mode_id: 2,
      play_mode_id: 1,
      mvp_uid: 123456789,
      match_player: {
        player_uid: 123456789,
        kills: 18,
        deaths: 4,
        assists: 22,
        is_win: { score: 3, is_win: true },
        disconnected: false,
        score_info: { add_score: 24 },
        player_hero: { hero_id: 1011, hero_name: "Magneto", play_time: { raw: 780 }, kills: 16, deaths: 4, assists: 20, total_hero_damage: 12000, total_hero_heal: 0, total_damage_taken: 9000 },
      },
    }],
    pagination: { page: 1, total_pages: 2, has_more: true },
  }, "123456789");
  assert.equal(page.matches[0]?.participant.result, "WIN");
  assert.equal(page.matches[0]?.participant.mvp, true);
  assert.equal(page.matches[0]?.durationSeconds, 900);
  assert.equal(page.matches[0]?.participant.heroes[0]?.heroName, "Magneto");
  assert.equal(page.hasMore, true);
});

test("rejects mismatched match participants and honors provider retry guidance", async () => {
  assert.throws(() => parseMarvelRivalsMatchHistory({ match_history: [{ match_uid: "m", match_time_stamp: 1_700_000_000, match_player: { player_uid: 999 } }] }, "123456789"), MarvelRivalsApiError);
  const limited: RivalsFetch = async () => ({ ok: false, status: 429, headers: { get: (name) => name === "retry-after" ? "45" : null }, json: async () => ({}) });
  await assert.rejects(() => fetchMarvelRivalsMatchHistory("123456789", "private-key", 1, 20, limited), (error: unknown) => error instanceof MarvelRivalsApiError && error.code === "RATE_LIMITED" && error.retryAfterSeconds === 45);
});
