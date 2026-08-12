import assert from "node:assert/strict";
import test from "node:test";
import { activitySpecsForMatchParticipant, activitySpecsForServerEvent } from "./game-activities.js";

test("hosted events project only allow-listed activity facts", () => {
  assert.deepEqual(activitySpecsForServerEvent("PLAYER_JOINED", null), [{ activityType: "SESSION_STARTED", valueNumber: 1 }]);
  assert.deepEqual(activitySpecsForServerEvent("PLAYER_DIED", null), [{ activityType: "DEATHS_RECORDED", valueNumber: 1 }]);
  assert.deepEqual(activitySpecsForServerEvent("CHAT_MESSAGE", null), []);
});

test("a match participant produces count and value activities without treating ten kills as one", () => {
  const specs = activitySpecsForMatchParticipant({ result: "WIN", kills: 10, deaths: 2, assists: 8, scoreChange: 24, mvp: true, svp: false, sharedMemberCount: 3 });
  assert.equal(specs.find((spec) => spec.activityType === "KILLS_RECORDED")?.valueNumber, 10);
  assert.equal(specs.find((spec) => spec.activityType === "SHARED_MATCH_PLAYED")?.valueNumber, 3);
  assert.ok(specs.some((spec) => spec.activityType === "MATCH_WON"));
  assert.ok(specs.some((spec) => spec.activityType === "MVP_EARNED"));
});
