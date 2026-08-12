import assert from "node:assert/strict";
import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { AgentLegacyHistorySource } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";
import { correlateValheimSteamIdentities, parseLegacyHistory, parseLegacyHistoryEvents, readLegacyHistory } from "./history.js";

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

test("Valheim character spawns name their paired Steam session without guessing concurrent joins", () => {
  const items = parseLegacyHistory("VALHEIM_LOG", [
    "[Info   : Unity Log] 08/11/2026 17:46:46: Got connection SteamID 76561199202467550",
    "[Info   : Unity Log] 08/11/2026 17:47:06: Got character ZDOID from Meriwether : 2117579024:18",
    "[Info   : Unity Log] 08/11/2026 20:55:11: Closing socket 76561199202467550",
    "[Info   : Unity Log] 08/11/2026 21:00:00: Got connection SteamID 76561198000000001",
    "[Info   : Unity Log] 08/11/2026 21:00:05: Got connection SteamID 76561198000000002",
    "[Info   : Unity Log] 08/11/2026 21:00:40: Got character ZDOID from Ambiguous One : 111:1",
    "[Info   : Unity Log] 08/11/2026 21:00:50: Got character ZDOID from Ambiguous Two : 112:1",
  ].join("\n"));
  const named = items.find((item) => item.externalAccountId === "76561199202467550");
  assert.equal(named?.kind, "SESSION");
  assert.equal(named?.displayName, "Meriwether");
  assert.ok(items.filter((item) => item.externalAccountId !== "76561199202467550").every((item) => item.displayName === null));
});

test("Valheim character names observed in the server log enrich chronicle history directly", () => {
  const steamEvidence = parseLegacyHistory("VALHEIM_LOG", [
    "[Info   : Unity Log] 08/11/2026 17:46:46: Got connection SteamID 76561199202467550",
    "[Info   : Unity Log] 08/11/2026 17:47:06: Got character ZDOID from Meriwether : 2117579024:18",
    "[Info   : Unity Log] 08/11/2026 20:55:11: Closing socket 76561199202467550",
  ].join("\n"));
  const chronicleContents = "2026-08-12T20:48:22.388Z\tDEATH\tMeriwether\tfell in the swamp.";
  const sources: AgentLegacyHistorySource[] = [
    { kind: "VALHEIM_LOG", label: "server", available: true, truncated: false, filesScanned: 1, evidence: steamEvidence, events: [] },
    { kind: "HABITAT_CHRONICLE_LOG", label: "chronicle", available: true, truncated: false, filesScanned: 1, evidence: parseLegacyHistory("HABITAT_CHRONICLE_LOG", chronicleContents), events: parseLegacyHistoryEvents("HABITAT_CHRONICLE_LOG", chronicleContents) },
  ];
  const chronicle = correlateValheimSteamIdentities(sources).find((source) => source.kind === "HABITAT_CHRONICLE_LOG");
  assert.equal(chronicle?.events[0]?.eventType, "PLAYER_DIED");
  assert.equal(chronicle?.events[0]?.externalAccountId, "76561199202467550");
  assert.equal(chronicle?.evidence[0]?.externalAccountId, "76561199202467550");
});

test("Valheim correlates only one-to-one Steam and character join timestamps", () => {
  const steamEvidence = parseLegacyHistory("VALHEIM_LOG", [
    "08/10/2026 20:00:00: Got connection SteamID 76561198000000000",
    "08/10/2026 20:45:00: Closing socket 76561198000000000",
  ].join("\n"));
  const chronicleJoinAt = new Date(new Date(steamEvidence[0]!.occurredAt).getTime() + 5_000).toISOString();
  const chronicleContents = `${chronicleJoinAt}\tPLAYER\tOld Guard\tentered the Habitat records system.`;
  const sources: AgentLegacyHistorySource[] = [
    { kind: "VALHEIM_LOG", label: "server", available: true, truncated: false, filesScanned: 1, evidence: steamEvidence, events: [] },
    { kind: "HABITAT_CHRONICLE_LOG", label: "chronicle", available: true, truncated: false, filesScanned: 1, evidence: parseLegacyHistory("HABITAT_CHRONICLE_LOG", chronicleContents), events: parseLegacyHistoryEvents("HABITAT_CHRONICLE_LOG", chronicleContents) },
  ];
  const correlated = correlateValheimSteamIdentities(sources);
  const chronicle = correlated.find((source) => source.kind === "HABITAT_CHRONICLE_LOG");
  assert.equal(chronicle?.evidence[0]?.externalAccountId, "76561198000000000");
  assert.equal(chronicle?.events[0]?.externalAccountId, "76561198000000000");

  const ambiguous = correlateValheimSteamIdentities([
    { ...sources[0]!, evidence: [...steamEvidence, { ...steamEvidence[0]!, externalAccountId: "76561198000000001", providerKey: "76561198000000001" }] },
    sources[1]!,
  ]).find((source) => source.kind === "HABITAT_CHRONICLE_LOG");
  assert.equal(ambiguous?.events[0]?.externalAccountId, null);
});

test("bounded directory scans prioritize the newest log tails", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "habitat-history-"));
  try {
    const oldPath = path.join(directory, "old.log");
    const newPath = path.join(directory, "new.log");
    await writeFile(oldPath, `${"x".repeat(2_000)}\n[2026.08.10-15.22.38:902] Player ID Steam_76561198000000000 authenticated\n`);
    await writeFile(newPath, `${"x".repeat(2_000)}\n[2026.08.11-15.22.38:902] Player ID Steam_76561198000000001 authenticated\n`);
    await utimes(oldPath, new Date("2026-08-10T00:00:00Z"), new Date("2026-08-10T00:00:00Z"));
    await utimes(newPath, new Date("2026-08-11T00:00:00Z"), new Date("2026-08-11T00:00:00Z"));
    const server = { key: "test", displayName: "Test", processName: "test", history: [{ kind: "STEAM_PLATFORM_LOG", label: "logs", path: directory, maxBytes: 1_024 }] } as AgentServerConfiguration;
    const history = await readLegacyHistory(server);
    assert.equal(history.sources[0]?.truncated, true);
    assert.equal(history.sources[0]?.filesScanned, 1);
    assert.equal(history.sources[0]?.evidence[0]?.externalAccountId, "76561198000000001");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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

test("Habitat Chronicle recovers native players separately from their game events", () => {
  const contents = [
    "2026-08-09T19:06:23.7269585Z\tPLAYER\tBamor\tentered the Habitat records system.",
    "2026-08-09T21:09:47.9275202Z\tDEATH\tBamor\tdied (death #1; life 2h 3m).",
    "2026-08-09T21:09:47.9275202Z\tRECORD\tBamor\tset a personal longest-life record: 2h 3m.",
    "2026-08-10T20:55:20.3707719Z\tPLAYER\tSchlotzsky\tentered the Habitat records system.",
    "2026-08-10T21:17:33.3836665Z\tACHIEVEMENT\tSchlotzsky\tunlocked LOGGED IN AND IMMEDIATELY DIED.",
    "2026-08-10T21:17:33.3836665Z\tSERVER\t\tHabitat Core started.",
  ].join("\n");
  const evidence = parseLegacyHistory("HABITAT_CHRONICLE_LOG", contents);
  const events = parseLegacyHistoryEvents("HABITAT_CHRONICLE_LOG", contents);
  assert.equal(evidence.length, 2);
  assert.equal(evidence[0]?.externalAccountId, null);
  assert.match(evidence[0]?.providerKey ?? "", /^native:[a-f0-9]{32}$/);
  assert.deepEqual(events.map((event) => event.eventType), ["PLAYER_JOINED", "PLAYER_DIED", "RECORD_BROKEN", "PLAYER_JOINED", "ACHIEVEMENT_EARNED"]);
  assert.equal(events.at(-1)?.valueText, "unlocked LOGGED IN AND IMMEDIATELY DIED.");
});

test("Project Zomboid parser recovers the Steam identity and visible player name", () => {
  const line = '[02-04-26 20:26:04.373] LOG : Network > ConnectionManager: [receive-packet] "client-connect" connection: guid=1 ip=192.168.1.2 steam-id=76561198001429856 access= username="Tino" connection-type="UDPRakNet".';
  const evidence = parseLegacyHistory("PROJECT_ZOMBOID_LOG", line);
  const events = parseLegacyHistoryEvents("PROJECT_ZOMBOID_LOG", line);
  assert.equal(evidence[0]?.displayName, "Tino");
  assert.equal(evidence[0]?.externalAccountId, "76561198001429856");
  assert.equal(events[0]?.eventType, "PLAYER_JOINED");
});

test("Enshrouded parser derives a stable timestamp from the rotated log name and uptime", () => {
  const line = "[I 07:45:37,127] [online] Session accepted with peer (steamid:76561198001429856)";
  const evidence = parseLegacyHistory("ENSHROUDED_LOG", line, "C:\\Enshrouded\\logs\\backup\\enshrouded_server_2026-03-29T03-49-44.log");
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0]?.externalAccountId, "76561198001429856");
  assert.equal(evidence[0]?.occurredAt, new Date(2026, 2, 29, 11, 35, 21, 127).toISOString());
});

test("7 Days to Die persistent roster recovers named Steam identities", () => {
  const xml = '<?xml version="1.0"?><persistentplayerdata><player platform="EOS" userid="00022ea75acf4e35bb4b1149e1f397e7" nativeplatform="Steam" nativeuserid="76561198001429856" playername="Big Daddy Tino" lastlogin="2026-04-26 12:28:02" position="0,0,0" /></persistentplayerdata>';
  const evidence = parseLegacyHistory("SEVEN_DAYS_PLAYERS_XML", xml);
  const events = parseLegacyHistoryEvents("SEVEN_DAYS_PLAYERS_XML", xml);
  assert.equal(evidence[0]?.displayName, "Big Daddy Tino");
  assert.equal(evidence[0]?.externalAccountId, "76561198001429856");
  assert.equal(events[0]?.valueText, "Recovered last login");
});

test("Dragonwilds log parser retains named join and leave signals without inventing Steam ownership", () => {
  const contents = [
    "[2026.08.10-14.18.06:782][0] Player ADDED to session [account-123]-[Meriwether]",
    "[2026.08.10-15.18.06:782][0] Player Removed from session [account-123]-[Meriwether]",
  ].join("\n");
  const evidence = parseLegacyHistory("DRAGONWILDS_LOG", contents);
  const events = parseLegacyHistoryEvents("DRAGONWILDS_LOG", contents);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0]?.externalProvider, null);
  assert.deepEqual(events.map((event) => event.eventType), ["PLAYER_JOINED", "PLAYER_LEFT"]);
});
