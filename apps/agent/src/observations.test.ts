import assert from "node:assert/strict";
import test from "node:test";
import { observeProcess, parseDragonwildsLog, parsePalworldKnownPlayers, parsePalworldPlayers } from "./observations.js";

test("Windows process observation sees the agent's Node runtime", { skip: process.platform !== "win32" }, async () => {
  const observation = await observeProcess("node");
  assert.equal(observation.running, true);
  assert.ok(observation.processCount > 0);
  assert.ok(observation.memoryBytes !== null && observation.memoryBytes > 0);
});

test("command-line matching prevents a shared runtime from matching every process", { skip: process.platform !== "win32" }, async () => {
  const observation = await observeProcess("node", "habitat-impossible-command-line-match");
  assert.equal(observation.running, false);
});

test("Dragonwilds log parsing keeps only verified lifecycle markers", () => {
  const log = [
    "[2026.08.10-15.21.38:902][107]LogPersistence: [DedicatedServer] PostLoadWorldState() : World load SUCCEEDED",
    "[2026.08.10-15.26.38:578][931]LogPersistence: [DedicatedServer] SaveGame() : Starting save",
    "[2026.08.10-15.31.40:155][923]LogPersistence: [DedicatedServer] SaveGame() : Starting save",
  ].join("\n");
  assert.deepEqual(parseDragonwildsLog(log), { lastWorldLoadAt: "2026.08.10-15.21.38:902", lastSaveAt: "2026.08.10-15.31.40:155" });
});

test("Palworld player parsing retains only a stable ID and display name", () => {
  assert.deepEqual(parsePalworldPlayers([{ name: "HabitatTino", raw: { playerId: "AFAFD830000000000000000000000000", ip: "192.168.86.10" } }]), [{ providerKey: "AFAFD830000000000000000000000000", displayName: "HabitatTino" }]);
  assert.deepEqual(parsePalworldPlayers([{ name: "SteamTino", raw: { playerId: "AFAFD830000000000000000000000001", userId: "76561198000000000" } }]), [{ providerKey: "AFAFD830000000000000000000000001", displayName: "SteamTino", externalProvider: "STEAM", externalAccountId: "76561198000000000" }]);
  assert.deepEqual(parsePalworldPlayers([{ name: "SteamPrefix", raw: { playerId: "AFAFD830000000000000000000000002", userId: "steam_76561198000000001" } }]), [{ providerKey: "AFAFD830000000000000000000000002", displayName: "SteamPrefix", externalProvider: "STEAM", externalAccountId: "76561198000000001" }]);
  assert.equal(parsePalworldPlayers([{ name: "Missing ID", raw: {} }]), null);
});

test("Palworld game-data parsing retains offline player actors without non-player world actors", () => {
  assert.deepEqual(parsePalworldKnownPlayers({ ActorData: [
    { UnitType: "Player", InstanceID: "AFAFD830000000000000000000000000", NickName: "Old Pal", userid: "steam_76561198000000000", IsActive: "false" },
    { UnitType: "WildPal", InstanceID: "wild", NickName: "Lamball" },
  ] }), [{ providerKey: "AFAFD830000000000000000000000000", displayName: "Old Pal", externalProvider: "STEAM", externalAccountId: "76561198000000000" }]);
});
