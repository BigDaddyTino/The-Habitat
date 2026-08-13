import assert from "node:assert/strict";
import test from "node:test";
import { TwitchApiError, type TwitchLiveStreamData } from "@habitat/shared";
import { mergePeakViewerCount, planTwitchTransitions, sanitizeBroadcastText, streamAnnouncementContent, twitchFailureState } from "./twitch.js";

function liveStream(overrides: Partial<TwitchLiveStreamData> & { twitchUserId: string; providerStreamId: string }): TwitchLiveStreamData {
  return {
    login: "habitatmember",
    displayName: "HabitatMember",
    title: "Valheim night",
    gameName: "Valheim",
    viewerCount: 12,
    startedAt: "2026-08-13T18:00:00.000Z",
    thumbnailUrlTemplate: "https://static-cdn.jtvnw.net/previews/live_user-{width}x{height}.jpg",
    language: "en",
    isMature: false,
    ...overrides,
  };
}

test("a channel appearing in the live batch for the first time announces exactly once", () => {
  const channel = { twitchUserId: "100", isLive: false, currentStreamId: null };
  const stream = liveStream({ twitchUserId: "100", providerStreamId: "stream-1" });

  const [wentLive] = planTwitchTransitions([channel], [stream]);
  assert.equal(wentLive.transition, "STARTED");
  assert.equal(wentLive.isLive, true);
  assert.equal(wentLive.announce, true);

  // The next poll sees the same broadcast on a channel already recorded live.
  const [stillLive] = planTwitchTransitions([{ twitchUserId: "100", isLive: true, currentStreamId: "stream-1" }], [stream]);
  assert.equal(stillLive.transition, "CONTINUED");
  assert.equal(stillLive.isLive, true);
  assert.equal(stillLive.announce, false);
});

test("a new provider stream id on an already-live channel is a new broadcast", () => {
  const [plan] = planTwitchTransitions(
    [{ twitchUserId: "100", isLive: true, currentStreamId: "stream-1" }],
    [liveStream({ twitchUserId: "100", providerStreamId: "stream-2" })],
  );
  assert.equal(plan.transition, "STARTED");
  assert.equal(plan.announce, true);
  assert.equal(plan.stream?.providerStreamId, "stream-2");
});

test("absence from the live batch is offline, never unknown", () => {
  const plans = planTwitchTransitions(
    [
      { twitchUserId: "100", isLive: true, currentStreamId: "stream-1" },
      { twitchUserId: "200", isLive: false, currentStreamId: null },
      { twitchUserId: "300", isLive: false, currentStreamId: null },
    ],
    [liveStream({ twitchUserId: "300", providerStreamId: "stream-9" })],
  );
  assert.deepEqual(plans.map((plan) => plan.transition), ["ENDED", "STILL_OFFLINE", "STARTED"]);
  assert.deepEqual(plans.map((plan) => plan.isLive), [false, false, true]);
  assert.deepEqual(plans.map((plan) => plan.announce), [false, false, true]);
  assert.equal(plans[0].stream, null);
});

test("an empty live batch takes every polled channel offline", () => {
  const plans = planTwitchTransitions([{ twitchUserId: "100", isLive: true, currentStreamId: "stream-1" }], []);
  assert.equal(plans[0].transition, "ENDED");
  assert.equal(plans[0].isLive, false);
});

test("a null viewer count never overwrites a recorded peak", () => {
  assert.equal(mergePeakViewerCount(42, null), 42);
  assert.equal(mergePeakViewerCount(42, 11), 42);
  assert.equal(mergePeakViewerCount(42, 43), 43);
  assert.equal(mergePeakViewerCount(null, 7), 7);
  assert.equal(mergePeakViewerCount(null, null), null);
  assert.equal(mergePeakViewerCount(0, null), 0);
});

test("the go-live announcement names the member, the game, the title and the channel link", () => {
  const content = streamAnnouncementContent({ memberName: "Tino", displayName: "HabitatMember", login: "habitatmember", title: "Valheim night", gameName: "Valheim" });
  assert.equal(content, "**Tino** is live on Twitch playing **Valheim**.\nValheim night\nhttps://www.twitch.tv/habitatmember");

  const withoutMetadata = streamAnnouncementContent({ memberName: null, displayName: "HabitatMember", login: "habitatmember", title: null, gameName: null });
  assert.equal(withoutMetadata, "**HabitatMember** is live on Twitch.\nhttps://www.twitch.tv/habitatmember");
});

test("member-authored stream text cannot ping the guild or break the announcement layout", () => {
  const content = streamAnnouncementContent({ memberName: null, displayName: "HabitatMember", login: "habitatmember", title: "hey @everyone\nfree keys", gameName: "Valheim" });
  assert.ok(!content.includes("@everyone"), "a raw @everyone must never reach Discord");
  assert.equal(content.split("\n").length, 3);
  assert.equal(sanitizeBroadcastText("   ", 20), null);
  assert.equal(sanitizeBroadcastText(null, 20), null);
  assert.equal(sanitizeBroadcastText("abcdefghij", 4), "abcd");
});

test("a failed poll backs off exponentially, honours Retry-After and truncates the stored reason", () => {
  const now = new Date("2026-08-13T18:00:00.000Z");
  const first = twitchFailureState(0, new TwitchApiError("UNAVAILABLE", "Twitch is temporarily unavailable."), now);
  const fourth = twitchFailureState(3, new TwitchApiError("UNAVAILABLE", "Twitch is temporarily unavailable."), now);
  assert.equal(first.failures, 1);
  assert.ok(fourth.nextAttemptAt.getTime() > first.nextAttemptAt.getTime());
  assert.ok(fourth.nextAttemptAt.getTime() - now.getTime() <= 60 * 60 * 1_000 * 1.1);

  const rateLimited = twitchFailureState(0, new TwitchApiError("RATE_LIMITED", "Twitch is rate limiting Habitat.", 900), now);
  assert.equal(rateLimited.nextAttemptAt.getTime() - now.getTime(), 900 * 1_000);

  const unknown = twitchFailureState(0, new Error("x".repeat(400)), now);
  assert.ok(unknown.message.length <= 180);
  assert.match(unknown.message, /cached live state was kept/);
});
