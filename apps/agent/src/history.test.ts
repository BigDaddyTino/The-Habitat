import assert from "node:assert/strict";
import test from "node:test";
import { parseLegacyHistory } from "./history.js";

test("Valheim legacy parser credits only paired Steam sessions", () => {
  const items = parseLegacyHistory("VALHEIM_LOG", [
    "08/10/2026 20:00:00: Got connection SteamID 76561198000000000",
    "08/10/2026 20:45:00: Closing socket 76561198000000000",
    "08/10/2026 21:00:00: Got connection SteamID 76561198000000001",
  ].join("\n"));
  assert.equal(items.length, 2);
  assert.equal(items[0]?.kind, "SESSION");
  assert.equal(items[0]?.durationSeconds, 2_700);
  assert.equal(items[1]?.kind, "PARTICIPATION");
  assert.equal(items[1]?.durationSeconds, null);
});

test("generic Steam log evidence requires an explicit player activity marker", () => {
  const items = parseLegacyHistory("STEAM_PLATFORM_LOG", [
    "[2026.08.10-15.21.38:902] Build owner Steam_76561198000000000",
    "[2026.08.10-15.22.38:902] Player ID Steam_76561198000000001 authenticated",
  ].join("\n"));
  assert.equal(items.length, 1);
  assert.equal(items[0]?.externalAccountId, "76561198000000001");
  assert.equal(items[0]?.kind, "PARTICIPATION");
});

test("canonical JSONL accepts complete sessions and rejects invalid identities", () => {
  const items = parseLegacyHistory("HABITAT_SESSION_JSONL", [
    JSON.stringify({ externalProvider: "STEAM", externalAccountId: "76561198000000000", displayName: "Old Guard", occurredAt: "2026-08-10T20:00:00.000Z", endedAt: "2026-08-10T21:00:00.000Z" }),
    JSON.stringify({ externalProvider: "STEAM", externalAccountId: "not-steam", occurredAt: "2026-08-10T20:00:00.000Z" }),
  ].join("\n"));
  assert.equal(items.length, 1);
  assert.equal(items[0]?.durationSeconds, 3_600);
  assert.equal(items[0]?.displayName, "Old Guard");
});
