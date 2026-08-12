import assert from "node:assert/strict";
import test from "node:test";
import { fetchRivalsmetaMatchHistory, fetchRivalsmetaProfile, MarvelRivalsApiError, parseRivalsmetaMatchHistory, parseRivalsmetaProfile, resolveMarvelRivalsProvider, rivalsmetaHeroName, rivalsmetaRankName, type RivalsmetaFetch } from "@habitat/shared";

// Field names and shapes below mirror real rivalsmeta.com API captures.
function profilePayload(overrides: Record<string, unknown> = {}) {
  return {
    rank_history: [],
    stats: {
      total_matches: 12,
      total_wins: 10,
      ranked: { total_kills: 231, total_assists: 156, total_deaths: 43, total_time_played: 9_000 },
      unranked: { total_kills: 0, total_assists: 0, total_deaths: 0, total_time_played: 0 },
    },
    player: {
      _id: 670067075,
      info_update_time: 1_734_877_968,
      last_history_update: 1_786_248_769,
      info: {
        aid: "670067075",
        name: "LodgeBear",
        level: "38",
        rank_game_season: {
          "1001018": JSON.stringify({ rank_game_id: 18, level: 20, rank_score: 4_205.4, max_level: 21, max_rank_score: 4_400.1, update_time: 1_754_500_000, win_count: 80 }),
          "1001019": JSON.stringify({ rank_game_id: 19, level: 16, rank_score: 5_332.22, max_level: 17, max_rank_score: 5_400.9, update_time: 1_786_155_970, win_count: 213 }),
        },
      },
    },
    heroes_ranked: {
      "1023": { matches: 30, win: 18, kills: 80, deaths: 25, assists: 130, damage: 100_000, heal: 200_000, mvp: 2, svp: 1, damage_taken: 90_000, play_time: 20_000 },
      "1039": { matches: 12, win: 7, kills: 91, deaths: 42, assists: 30, damage: 150_000, heal: 0, mvp: 1, svp: 0, damage_taken: 130_000, play_time: 9_000 },
    },
    heroes_unranked: {
      "1023": { matches: 4, win: 2, kills: 9, deaths: 3, assists: 15, damage: 12_000, heal: 22_000, mvp: 0, svp: 0, damage_taken: 8_000, play_time: 2_500 },
    },
    match_history: [],
    ...overrides,
  };
}

const matchPayload = [{
  match_map_id: 1288,
  match_play_duration: 814.017765045166,
  match_season: "19",
  match_uid: "5513279_1786154846_1288047_11001_12",
  match_winner_side: 0,
  mvp_uid: 670067075,
  svp_uid: 22798234,
  dynamic_fields: { score_info: { "0": 2, "1": 1 } },
  match_time_stamp: 1_786_155_970,
  play_mode_id: 0,
  game_mode_id: 2,
  match_player: {
    a: 31, k: 20, d: 3, is_win: 1, has_escaped: false, player_uid: 670067075, camp: 0,
    dynamic_fields: { add_score: 17.64558965899596, level: 23, new_level: 23, new_score: 5_332.2234740216645 },
    player_hero: { hero_id: 1058, k: 20, d: 3, a: 31, play_time: 813.9457575120032, total_hero_damage: 13_547.29, total_damage_taken: 11_757.45, total_hero_heal: 36_087.92 },
  },
}];

test("normalizes a rivalsmeta profile into the shared Rivals shape", () => {
  const profile = parseRivalsmetaProfile(profilePayload());
  assert.equal(profile.uid, "670067075");
  assert.equal(profile.displayName, "LodgeBear");
  assert.equal(profile.isPrivate, false);
  assert.equal(profile.playerLevel, 38);
  assert.equal(profile.rankName, "Grandmaster III");
  assert.equal(profile.peakRankName, "Celestial I");
  assert.equal(profile.rankScore, 5_332);
  assert.equal(profile.totalMatches, 12);
  assert.equal(profile.totalWins, 10);
  assert.equal(profile.overallKd, 5.37);
  assert.equal(profile.overallKda, 9);
  assert.deepEqual(profile.topHeroes[0], { name: "Rocket Raccoon", matches: 34, wins: 20, kills: 89, deaths: 28, assists: 145 });
  assert.equal(profile.topHeroes[1]?.name, "Thor");
  assert.equal(profile.providerUpdatedAt, new Date(1_786_248_769 * 1_000).toISOString());
  assert.equal(profile.hasCareerData, true);
  assert.equal(profile.rankedWins, 293);
  assert.equal(profile.rankedSeasons, 2);
  assert.equal(profile.peakRankScore, 5_401);
});

test("treats restricted career settings as a private profile", async () => {
  const payload = profilePayload({ career_settings: { BattleHistoryIsVisibleToOther: "0", CareerHeroDataIsVisibleToOther: "1", CareerOverviewIsVisibleToOther: "1" } });
  assert.equal(parseRivalsmetaProfile(payload).isPrivate, true);
  const fetcher: RivalsmetaFetch = async () => ({ status: 200, ok: true, json: async () => payload });
  await assert.rejects(() => fetchRivalsmetaProfile("670067075", fetcher), (error: unknown) => error instanceof MarvelRivalsApiError && error.code === "PRIVATE");
});

test("detects the per-scope career visibility flags the provider actually sends", () => {
  // Real payloads suffix these flags per data scope and use 2 for friends-only,
  // so an unsuffixed, zero-only check silently passed restricted profiles.
  const friendsOnly = profilePayload({ career_settings: { BattleHistoryIsVisibleToOther: 2, CareerOverviewIsVisibleToOther_1: 2, CareerHeroDataIsVisibleToOther_2: 2 } });
  assert.equal(parseRivalsmetaProfile(friendsOnly).isPrivate, true);
  const partiallyHidden = profilePayload({ career_settings: { TimelineIsVisibleToOther: 1, BattleHistoryIsVisibleToOther: 1, CareerOverviewIsVisibleToOther_1: 1, CareerHeroDataIsVisibleToOther_4: 0 } });
  assert.equal(parseRivalsmetaProfile(partiallyHidden).isPrivate, true);
  const fullyPublic = profilePayload({ career_settings: { TimelineIsVisibleToOther: 1, BattleHistoryIsVisibleToOther: 1, CareerOverviewIsVisibleToOther_1: 1, CareerHeroDataIsVisibleToOther_1: 1 } });
  assert.equal(parseRivalsmetaProfile(fullyPublic).isPrivate, false);
});

test("keeps an unpulled career null instead of reporting it as zeroes", () => {
  // The provider answers 200 with every aggregate at 0 and empty hero maps for
  // players whose career it has never pulled. That absence must not read as a
  // genuine record of zero matches, while season records stay usable.
  const payload = profilePayload({
    stats: { total_matches: 0, total_wins: 0, ranked: { total_kills: 0, total_assists: 0, total_deaths: 0 }, unranked: { total_kills: 0, total_assists: 0, total_deaths: 0 } },
    heroes_ranked: {},
    heroes_unranked: {},
  });
  const profile = parseRivalsmetaProfile(payload);
  assert.equal(profile.hasCareerData, false);
  assert.equal(profile.totalMatches, null);
  assert.equal(profile.totalWins, null);
  assert.deepEqual(profile.topHeroes, []);
  assert.equal(profile.rankedWins, 293);
  assert.equal(profile.rankName, "Grandmaster III");
});

test("reads season records wrapped in the rank_game envelope", () => {
  const payload = profilePayload({
    player: {
      _id: 670067075,
      info_update_time: 1_734_877_968,
      info: {
        aid: "670067075",
        name: "LodgeBear",
        level: 29,
        rank_game_season: { "1001002": { rank_game: { level: 5, rank_score: 3_428.01, max_level: 5, max_rank_score: 3_440.89, update_time: 1_736_731_050, win_count: 29 } } },
      },
    },
  });
  const profile = parseRivalsmetaProfile(payload);
  assert.equal(profile.rankedWins, 29);
  assert.equal(profile.rankedSeasons, 1);
  assert.equal(profile.peakRankScore, 3_441);
  assert.equal(profile.rankName, "Silver II");
});

test("maps the competitive ladder levels the way rivalsmeta renders them", () => {
  assert.equal(rivalsmetaRankName(1), "Bronze III");
  assert.equal(rivalsmetaRankName(12), "Platinum I");
  assert.equal(rivalsmetaRankName(21), "Celestial I");
  assert.equal(rivalsmetaRankName(22), "Eternity");
  assert.equal(rivalsmetaRankName(23), "One Above All");
  assert.equal(rivalsmetaRankName(0), null);
  assert.equal(rivalsmetaRankName(null), null);
});

test("normalizes rivalsmeta match history rows", () => {
  const page = parseRivalsmetaMatchHistory(matchPayload, "670067075", 1);
  assert.equal(page.hasMore, false);
  const [match] = page.matches;
  assert.equal(match.providerMatchId, "5513279_1786154846_1288047_11001_12");
  assert.equal(match.occurredAt, new Date(1_786_155_970 * 1_000).toISOString());
  assert.equal(match.durationSeconds, 814);
  assert.equal(match.seasonKey, "19");
  assert.equal(match.mapId, "1288");
  assert.equal(match.modeId, "2");
  assert.equal(match.participant.result, "WIN");
  assert.equal(match.participant.kills, 20);
  assert.equal(match.participant.deaths, 3);
  assert.equal(match.participant.assists, 31);
  assert.equal(match.participant.mvp, true);
  assert.equal(match.participant.svp, false);
  assert.equal(match.participant.score, 5_332);
  assert.equal(match.participant.scoreChange, 18);
  assert.equal(match.participant.disconnected, false);
  assert.deepEqual(match.participant.heroes[0]?.heroName, "Gambit");
  assert.equal(match.participant.heroes[0]?.damage, 13_547);
});

test("rejects mismatched match evidence and invalid pages", async () => {
  assert.throws(() => parseRivalsmetaMatchHistory(matchPayload, "999"), MarvelRivalsApiError);
  await assert.rejects(() => fetchRivalsmetaMatchHistory("not-a-uid"), (error: unknown) => error instanceof MarvelRivalsApiError && error.code === "NOT_FOUND");
});

test("falls back to a stable label for unknown hero ids", () => {
  assert.equal(rivalsmetaHeroName(1031), "Luna Snow");
  assert.equal(rivalsmetaHeroName("99999"), "Hero 99999");
});

test("resolves the provider by key presence and explicit override", () => {
  assert.equal(resolveMarvelRivalsProvider({})?.kind, "rivalsmeta");
  assert.equal(resolveMarvelRivalsProvider({ MARVEL_RIVALS_API_KEY: "key" })?.kind, "marvelrivalsapi");
  assert.equal(resolveMarvelRivalsProvider({ MARVEL_RIVALS_API_KEY: "key", MARVEL_RIVALS_PROVIDER: "rivalsmeta" })?.kind, "rivalsmeta");
  assert.equal(resolveMarvelRivalsProvider({ MARVEL_RIVALS_PROVIDER: "off" }), null);
  assert.equal(resolveMarvelRivalsProvider({ MARVEL_RIVALS_PROVIDER: "marvelrivalsapi" }), null);
  assert.equal(resolveMarvelRivalsProvider({})?.profileRefreshIntervalMs, 60 * 60 * 1_000);
  assert.equal(resolveMarvelRivalsProvider({ MARVEL_RIVALS_REFRESH_MINUTES: "120" })?.profileRefreshIntervalMs, 120 * 60 * 1_000);
});
