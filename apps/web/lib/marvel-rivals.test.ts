import assert from "node:assert/strict";
import test from "node:test";
import { isValidMarvelRivalsQuery, parseMarvelRivalsProfile } from "@habitat/shared";

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
