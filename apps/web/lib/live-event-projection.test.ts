import assert from "node:assert/strict";
import test from "node:test";
import { projectVerifiedHabitatLiveEvent, type LiveSourceEvent } from "./live-event-projection";

const source = (eventType: string, overrides: Partial<LiveSourceEvent> = {}): LiveSourceEvent => ({
  id: "11111111-1111-1111-1111-111111111111",
  eventType,
  occurredAt: new Date("2026-08-14T16:00:00.000Z"),
  receivedAt: new Date("2026-08-14T16:00:01.000Z"),
  actorText: null,
  valueNumber: null,
  valueText: null,
  metadata: null,
  source: "HABITAT_AGENT",
  sourceConfidence: 100,
  server: { id: "22222222-2222-2222-2222-222222222222", slug: "valheim", displayName: "Valheim", gameType: "VALHEIM" },
  ...overrides,
});

test("live projection refuses evidence below verified confidence", () => {
  assert.equal(projectVerifiedHabitatLiveEvent(source("SERVER_STARTED", { sourceConfidence: 99 })), null);
});

test("world lifecycle keeps intentional semantics out of crash reactions", () => {
  assert.equal(projectVerifiedHabitatLiveEvent(source("SERVER_STARTED"))?.reaction.kind, "PORTAL_IGNITE");
  assert.equal(projectVerifiedHabitatLiveEvent(source("SERVER_CRASHED"))?.reaction.kind, "PORTAL_SPUTTER");
  assert.equal(projectVerifiedHabitatLiveEvent(source("SERVER_SLEEPING")), null);
});

test("gatherings and boss kills produce their explicit cinematic effects", () => {
  const gathering = projectVerifiedHabitatLiveEvent(source("WORLD_GATHERING", { valueNumber: 7 }));
  assert.equal(gathering?.playerCount, 7);
  assert.equal(gathering?.reaction.kind, "HALL_CROWD");
  const boss = projectVerifiedHabitatLiveEvent(source("BOSS_KILLED", { actorText: "Tino", valueText: "The Elder" }));
  assert.equal(boss?.reaction.kind, "TROPHY_CEREMONY");
  assert.equal(boss?.ceremony.rewards?.[0]?.kind, "TROPHY");
});

test("only top-tier achievements form a constellation", () => {
  const legendary = projectVerifiedHabitatLiveEvent(source("ACHIEVEMENT_EARNED", { actorText: "Tino" }), { name: "Lodge Legend", description: "Legendary.", category: "Progression", rarity: "LEGENDARY", points: 250, rewards: [] });
  const rare = projectVerifiedHabitatLiveEvent(source("ACHIEVEMENT_EARNED"), { name: "Rare", description: "Rare.", category: "Progression", rarity: "RARE", points: 50, rewards: [] });
  assert.equal(legendary?.reaction.kind, "CONSTELLATION");
  assert.equal(rare, null);
});

test("the broadcast marks an event as the viewer's own only for that viewer", () => {
  const owned = source("BOSS_KILLED", { playerIdentity: { userId: "user-1" } });
  assert.equal(projectVerifiedHabitatLiveEvent(owned, undefined, "user-1")?.viewerIsActor, true);
  assert.equal(projectVerifiedHabitatLiveEvent(owned, undefined, "user-2")?.viewerIsActor, false);
  assert.equal(projectVerifiedHabitatLiveEvent(owned, undefined, null)?.viewerIsActor, false);
  assert.equal(projectVerifiedHabitatLiveEvent(owned)?.viewerIsActor, false);
});

test("an unclaimed actor is never mistaken for the viewer", () => {
  const unclaimed = source("BOSS_KILLED", { playerIdentity: { userId: null } });
  assert.equal(projectVerifiedHabitatLiveEvent(unclaimed, undefined, "user-1")?.viewerIsActor, false);
  assert.equal(projectVerifiedHabitatLiveEvent(source("BOSS_KILLED"), undefined, "user-1")?.viewerIsActor, false);
});
