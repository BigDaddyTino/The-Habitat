import assert from "node:assert/strict";
import test from "node:test";
import { defaultCycleHeartbeatMs, initialCycleLogState, nextCycleLog, type CycleLogState } from "./cycle-log.js";

const healthy = "Habitat worker cycle: 6 observed, 0 unknown, 0 ignored, agent available.";
const degraded = "Habitat worker cycle: 0 observed, 6 unknown, 0 ignored, agent unavailable.";

/** Feeds a summary repeatedly on a 15s cadence, collecting whatever was logged. */
function drive(state: CycleLogState, summary: string, cycles: number, startAt: number, heartbeatMs = defaultCycleHeartbeatMs) {
  const messages: Array<{ at: number; message: string }> = [];
  let current = state;
  let now = startAt;
  for (let index = 0; index < cycles; index += 1) {
    const result = nextCycleLog(current, summary, now, heartbeatMs);
    current = result.state;
    if (result.message !== null) messages.push({ at: now, message: result.message });
    now += 15_000;
  }
  return { state: current, messages, now };
}

test("the first cycle always logs so a restart is visible", () => {
  const result = nextCycleLog(initialCycleLogState, healthy, 1_000);
  assert.equal(result.message, healthy);
  assert.equal(result.state.suppressed, 0);
  assert.equal(result.state.loggedAt, 1_000);
});

test("an unchanged summary is folded instead of repeated every 15 seconds", () => {
  // 480 identical cycles at 15s each spans 1h59m45s and would be 480 lines
  // unthrottled. It becomes the startup line plus a heartbeat at 30, 60, and 90
  // minutes; the next one would fall just past the end of the window.
  const { messages } = drive(initialCycleLogState, healthy, 480, 0);
  assert.equal(messages.length, 4);
  assert.equal(messages[0]?.message, healthy);
  assert.equal(messages[1]?.at, 30 * 60 * 1_000);
  assert.match(messages[1]!.message, /unchanged across 119 further cycles/);
  // Every later heartbeat reports only the cycles folded since the previous line.
  assert.match(messages[2]!.message, /unchanged across 119 further cycles/);
});

test("a state change logs immediately and reports what it folded", () => {
  const quiet = drive(initialCycleLogState, healthy, 10, 0);
  assert.equal(quiet.messages.length, 1, "only the startup line so far");
  const changed = nextCycleLog(quiet.state, degraded, quiet.now);
  assert.notEqual(changed.message, null);
  assert.match(changed.message!, /agent unavailable/);
  assert.match(changed.message!, /unchanged across 9 further cycles/);
  assert.equal(changed.state.suppressed, 0);
});

test("recovery back to a previous summary is logged rather than treated as unchanged", () => {
  const first = nextCycleLog(initialCycleLogState, healthy, 0);
  const broken = nextCycleLog(first.state, degraded, 15_000);
  const recovered = nextCycleLog(broken.state, healthy, 30_000);
  assert.equal(recovered.message, healthy, "returning to health must not be silent");
});

test("a single folded cycle is reported in the singular", () => {
  const first = nextCycleLog(initialCycleLogState, healthy, 0);
  const folded = nextCycleLog(first.state, healthy, 15_000);
  assert.equal(folded.message, null);
  const changed = nextCycleLog(folded.state, degraded, 30_000);
  assert.match(changed.message!, /unchanged across 1 further cycle\)/);
});

test("the heartbeat fires on its own schedule, not on cycle count", () => {
  const first = nextCycleLog(initialCycleLogState, healthy, 0, 60_000);
  // Still inside the window, so nothing is emitted no matter how many cycles ran.
  assert.equal(nextCycleLog(first.state, healthy, 59_999, 60_000).message, null);
  assert.notEqual(nextCycleLog(first.state, healthy, 60_000, 60_000).message, null);
});

test("a non-positive heartbeat disables folding entirely", () => {
  const { messages } = drive(initialCycleLogState, healthy, 4, 0, 0);
  assert.equal(messages.length, 4, "every cycle logs when folding is switched off");
  assert.equal(messages[3]?.message, healthy, "nothing is folded, so no count is appended");
});
