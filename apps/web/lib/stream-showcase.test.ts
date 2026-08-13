import assert from "node:assert/strict";
import test from "node:test";
import { corroborateDiscordStreamUrl, formatSessionDuration, formatUptime, formatViewerCount, selectFeaturedChannel } from "./stream-showcase";
import { twitchEmbedUrl, twitchThumbnailUrl } from "@habitat/shared";

function channel(overrides: Partial<Parameters<typeof selectFeaturedChannel>[0][number]> = {}) {
  return {
    id: "channel-1", login: "lodgebear", displayName: "LodgeBear", channelUrl: "https://www.twitch.tv/lodgebear",
    profileImageUrl: null, offlineImageUrl: null, broadcasterType: null, description: null, followerCount: null,
    isLive: true, liveSince: new Date("2026-08-13T00:00:00.000Z"), title: null, gameName: null, viewerCount: null,
    thumbnailUrl: null, lastLiveAt: null,
    member: { username: "tino", displayName: "Tino", avatarUrl: null },
    discord: null,
    ...overrides,
  } as Parameters<typeof selectFeaturedChannel>[0][number];
}

test("a Discord-reported URL is only trusted when it matches the member's verified channel", () => {
  // Discord hands us whatever the member's own client reported, so this string is
  // untrusted input and must never become a blind outbound link.
  assert.deepEqual(corroborateDiscordStreamUrl("https://www.twitch.tv/lodgebear", "lodgebear"), { corroboratedUrl: "https://www.twitch.tv/lodgebear", hasUnverifiedDestination: false });
  assert.deepEqual(corroborateDiscordStreamUrl("https://twitch.tv/LodgeBear", "lodgebear"), { corroboratedUrl: "https://www.twitch.tv/lodgebear", hasUnverifiedDestination: false });

  // A different channel, a different site, a non-HTTPS scheme, or a member with no
  // verified channel all mean the destination cannot be vouched for.
  for (const [url, login] of [
    ["https://www.twitch.tv/someone-else", "lodgebear"],
    ["https://evil.example/lodgebear", "lodgebear"],
    ["http://www.twitch.tv/lodgebear", "lodgebear"],
    ["javascript:alert(1)", "lodgebear"],
    ["not a url at all", "lodgebear"],
    ["https://www.twitch.tv/lodgebear", null],
  ] as const) {
    const result = corroborateDiscordStreamUrl(url, login);
    assert.equal(result.corroboratedUrl, null, `expected no link for ${url} with login ${String(login)}`);
    assert.equal(result.hasUnverifiedDestination, true);
  }

  // No reported URL at all is simply an absence, not a suspicious destination.
  assert.deepEqual(corroborateDiscordStreamUrl(null, "lodgebear"), { corroboratedUrl: null, hasUnverifiedDestination: false });
  assert.deepEqual(corroborateDiscordStreamUrl("   ", "lodgebear"), { corroboratedUrl: null, hasUnverifiedDestination: false });
});

test("the featured slot prefers the largest audience and falls back to the longest broadcast", () => {
  const quiet = channel({ id: "quiet", viewerCount: null, liveSince: new Date("2026-08-13T01:00:00.000Z") });
  const busy = channel({ id: "busy", viewerCount: 42 });
  const busier = channel({ id: "busier", viewerCount: 310 });
  assert.equal(selectFeaturedChannel([quiet, busy, busier])?.id, "busier");

  const earliest = channel({ id: "earliest", viewerCount: null, liveSince: new Date("2026-08-12T20:00:00.000Z") });
  assert.equal(selectFeaturedChannel([quiet, earliest])?.id, "earliest");
  assert.equal(selectFeaturedChannel([]), null);

  // A reported zero is a real observation and must outrank an unreported count.
  assert.equal(selectFeaturedChannel([quiet, channel({ id: "zero", viewerCount: 0 })])?.id, "zero");
});

test("uptime and viewer figures never invent a value", () => {
  const startedAt = new Date("2026-08-13T00:00:00.000Z");
  assert.equal(formatUptime(startedAt, new Date("2026-08-13T00:41:00.000Z")), "41m");
  assert.equal(formatUptime(startedAt, new Date("2026-08-13T03:12:00.000Z")), "3h 12m");
  assert.equal(formatUptime(startedAt, new Date("2026-08-15T05:00:00.000Z")), "2d 5h");
  // A clock skew that puts the start in the future is not a negative broadcast.
  assert.equal(formatUptime(startedAt, new Date("2026-08-12T23:00:00.000Z")), null);

  assert.equal(formatViewerCount(null), "—");
  assert.equal(formatViewerCount(0), "0");
  assert.equal(formatViewerCount(1_204), "1,204");
  assert.equal(formatViewerCount(24_500), "24.5k");
  assert.equal(formatSessionDuration(null), "—");
  assert.equal(formatSessionDuration(5_400), "1h 30m");
  assert.equal(formatSessionDuration(120), "2m");
});

test("Twitch thumbnail templates and embeds are only built when they are usable", () => {
  assert.equal(twitchThumbnailUrl("https://static-cdn.jtvnw.net/x-{width}x{height}.jpg", 640, 360), "https://static-cdn.jtvnw.net/x-640x360.jpg");
  assert.equal(twitchThumbnailUrl(null, 640, 360), null);
  assert.equal(twitchThumbnailUrl("http://insecure.example/{width}x{height}.jpg", 640, 360), null);

  // Twitch refuses to frame the player unless every embedding host is declared.
  const embed = twitchEmbedUrl("lodgebear", ["habitat.martinobear.com"], { autoplay: false, muted: true });
  assert.ok(embed?.startsWith("https://player.twitch.tv/?"));
  assert.ok(embed?.includes("channel=lodgebear"));
  assert.ok(embed?.includes("parent=habitat.martinobear.com"));
  assert.ok(embed?.includes("autoplay=false"));
  assert.equal(twitchEmbedUrl("lodgebear", []), null, "no parent host means the embed cannot render");
  assert.equal(twitchEmbedUrl("bad login!", ["habitat.martinobear.com"]), null);
});
