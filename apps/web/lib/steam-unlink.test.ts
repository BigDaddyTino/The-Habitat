import assert from "node:assert/strict";
import test from "node:test";
import { describeSteamUnlink } from "./steam-unlink";

test("Steam disconnect consequences disclose cascade deletion of cached enrichment", () => {
  const lines = describeSteamUnlink({
    attachedIdentityNames: ["Schlotzsky"],
    otherIdentityCount: 1,
    enrichmentEnabled: true,
    cachedLibraryGames: 42,
    cachedAchievements: 300,
    clubProfileCount: 1,
  });

  assert.ok(lines.some((line) => line.includes("also deletes 42 cached library games and 300 cached achievement rows")));
  assert.ok(lines.some((line) => line.includes("Schlotzsky") && /stays? attached/.test(line)));
  assert.ok(lines.some((line) => line.includes("playtime, XP, level, achievements, and titles are unchanged")));
});
