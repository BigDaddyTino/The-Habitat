import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchTwitchAppToken,
  fetchTwitchLiveStreams,
  isValidTwitchLogin,
  parseTwitchLiveStreams,
  parseTwitchUsers,
  resolveTwitchProvider,
  TwitchApiError,
  twitchChannelUrl,
  type TwitchFetch,
} from "@habitat/shared";

// Shapes below mirror real Twitch Helix responses.
function liveStreamRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "41375541868",
    user_id: "123456789",
    user_login: "lodgebear",
    user_name: "LodgeBear",
    game_id: "509658",
    game_name: "Valheim",
    type: "live",
    title: "Building the great hall",
    viewer_count: 214,
    started_at: "2026-08-13T00:12:00Z",
    language: "en",
    thumbnail_url: "https://static-cdn.jtvnw.net/previews-ttv/live_user_lodgebear-{width}x{height}.jpg",
    is_mature: false,
    ...overrides,
  };
}

function jsonFetcher(payload: unknown, status = 200): TwitchFetch {
  return async () => ({ status, ok: status >= 200 && status < 300, json: async () => payload });
}

test("live stream rows are normalized and non-live rows are discarded", () => {
  const streams = parseTwitchLiveStreams({ data: [liveStreamRow(), liveStreamRow({ id: "2", type: "rerun", user_login: "rerunner" })] });
  // Twitch reports reruns and premieres through the same endpoint; only "live"
  // means a member is actually broadcasting.
  assert.equal(streams.length, 1);
  assert.equal(streams[0]?.providerStreamId, "41375541868");
  assert.equal(streams[0]?.login, "lodgebear");
  assert.equal(streams[0]?.gameName, "Valheim");
  assert.equal(streams[0]?.viewerCount, 214);
  assert.equal(streams[0]?.startedAt, new Date("2026-08-13T00:12:00Z").toISOString());
  assert.equal(streams[0]?.thumbnailUrlTemplate?.includes("{width}"), true);
});

test("stream rows missing the facts that identify a broadcast are dropped", () => {
  const rows = [
    liveStreamRow({ id: "" }),
    liveStreamRow({ user_id: "not-numeric" }),
    liveStreamRow({ user_login: "x" }),
    liveStreamRow({ started_at: "not a date" }),
  ];
  assert.deepEqual(parseTwitchLiveStreams({ data: rows }), []);
  assert.throws(() => parseTwitchLiveStreams({ data: "nope" }), (error: unknown) => error instanceof TwitchApiError && error.code === "INVALID_RESPONSE");
});

test("a viewer count of zero is preserved as a real observation", () => {
  const streams = parseTwitchLiveStreams({ data: [liveStreamRow({ viewer_count: 0 })] });
  assert.equal(streams[0]?.viewerCount, 0);
  // A missing count is unknown, which is different from zero viewers.
  assert.equal(parseTwitchLiveStreams({ data: [liveStreamRow({ viewer_count: undefined })] })[0]?.viewerCount, null);
});

test("user rows normalize the broadcaster type and reject unusable identities", () => {
  const users = parseTwitchUsers({ data: [
    { id: "123456789", login: "LodgeBear", display_name: "LodgeBear", broadcaster_type: "partner", profile_image_url: "https://cdn/x.png", offline_image_url: "", description: "Hall builder" },
    { id: "987654321", login: "affiliate_user", display_name: "Affiliate", broadcaster_type: "affiliate" },
    { id: "555", login: "plain_user", display_name: "Plain", broadcaster_type: "" },
    { id: "bad", login: "whatever" },
  ] });
  assert.equal(users.length, 3);
  assert.equal(users[0]?.login, "lodgebear", "logins are lowercased for stable comparison");
  assert.equal(users[0]?.broadcasterType, "partner");
  assert.equal(users[1]?.broadcasterType, "affiliate");
  assert.equal(users[2]?.broadcasterType, null, "an empty broadcaster type is not a tier");
  assert.equal(users[0]?.offlineImageUrl, null, "an empty offline image is absent, not a blank URL");
});

test("the app token is cached with an early expiry and minted from client credentials", async () => {
  let calls = 0;
  const fetcher: TwitchFetch = async (url, init) => {
    calls += 1;
    assert.ok(url.startsWith("https://id.twitch.tv/oauth2/token"));
    assert.equal(init.method, "POST");
    assert.ok(init.body?.includes("grant_type=client_credentials"));
    return { status: 200, ok: true, json: async () => ({ access_token: "app-token", expires_in: 3_600, token_type: "bearer" }) };
  };
  const token = await fetchTwitchAppToken("client", "secret", fetcher, 1_000_000);
  assert.equal(token.accessToken, "app-token");
  // Expiry is pulled in by a minute so an in-flight batch cannot use a dying token.
  assert.equal(token.expiresAt, 1_000_000 + (3_600 - 60) * 1_000);
  assert.equal(calls, 1);
  await assert.rejects(() => fetchTwitchAppToken("", "", fetcher), (error: unknown) => error instanceof TwitchApiError && error.code === "UNAUTHORIZED");
});

test("HTTP failures map onto actionable provider errors", async () => {
  for (const [status, code] of [[401, "UNAUTHORIZED"], [403, "UNAUTHORIZED"], [404, "NOT_FOUND"], [429, "RATE_LIMITED"], [500, "UNAVAILABLE"]] as const) {
    await assert.rejects(
      () => fetchTwitchLiveStreams("client", "token", ["123456789"], jsonFetcher({}, status)),
      (error: unknown) => error instanceof TwitchApiError && error.code === code,
      `status ${status} should map to ${code}`,
    );
  }
});

test("live queries batch ids and skip work when there is nothing to ask about", async () => {
  const requested: string[] = [];
  const fetcher: TwitchFetch = async (url) => {
    requested.push(url);
    return { status: 200, ok: true, json: async () => ({ data: [liveStreamRow()] }) };
  };
  // 150 ids must split into two requests, because Helix caps a query at 100.
  const ids = Array.from({ length: 150 }, (_, index) => String(100_000_000 + index));
  await fetchTwitchLiveStreams("client", "token", ids, fetcher);
  assert.equal(requested.length, 2);
  assert.equal((requested[0]?.match(/user_id=/g) ?? []).length, 100);
  assert.equal((requested[1]?.match(/user_id=/g) ?? []).length, 50);

  requested.length = 0;
  assert.deepEqual(await fetchTwitchLiveStreams("client", "token", [], fetcher), []);
  assert.equal(requested.length, 0, "an empty roster must not spend a request");
});

test("the provider resolves only with credentials and honors the off switch", () => {
  assert.equal(resolveTwitchProvider({}), null);
  assert.equal(resolveTwitchProvider({ TWITCH_CLIENT_ID: "id" }), null, "a client id alone cannot authenticate");
  assert.equal(resolveTwitchProvider({ TWITCH_CLIENT_ID: "id", TWITCH_CLIENT_SECRET: "secret", TWITCH_INTEGRATION: "off" }), null);
  const provider = resolveTwitchProvider({ TWITCH_CLIENT_ID: "id", TWITCH_CLIENT_SECRET: "secret" });
  assert.equal(provider?.clientId, "id");
  assert.equal(provider?.livePollIntervalMs, 2 * 60 * 1_000);
  assert.equal(resolveTwitchProvider({ TWITCH_CLIENT_ID: "id", TWITCH_CLIENT_SECRET: "secret", TWITCH_LIVE_POLL_MINUTES: "5" })?.livePollIntervalMs, 5 * 60 * 1_000);
  // Out-of-range cadences fall back rather than hammering or stalling the API.
  assert.equal(resolveTwitchProvider({ TWITCH_CLIENT_ID: "id", TWITCH_CLIENT_SECRET: "secret", TWITCH_LIVE_POLL_MINUTES: "0" })?.livePollIntervalMs, 2 * 60 * 1_000);
});

test("the resolved provider reuses one app token across calls", async () => {
  let tokenMints = 0;
  const fetcher: TwitchFetch = async (url) => {
    if (url.includes("/oauth2/token")) {
      tokenMints += 1;
      return { status: 200, ok: true, json: async () => ({ access_token: `token-${tokenMints}`, expires_in: 3_600 }) };
    }
    return { status: 200, ok: true, json: async () => ({ data: [liveStreamRow()] }) };
  };
  const provider = resolveTwitchProvider({ TWITCH_CLIENT_ID: "id", TWITCH_CLIENT_SECRET: "secret" }, fetcher);
  await provider?.fetchLiveStreams(["123456789"]);
  await provider?.fetchLiveStreams(["123456789"]);
  assert.equal(tokenMints, 1, "a cached token must serve later polls");
});

test("logins and channel URLs are validated before use", () => {
  assert.equal(isValidTwitchLogin("lodgebear"), true);
  assert.equal(isValidTwitchLogin("bad login"), false);
  assert.equal(isValidTwitchLogin("abc"), false, "Twitch logins are at least four characters");
  assert.equal(twitchChannelUrl("LodgeBear"), "https://www.twitch.tv/lodgebear");
  assert.equal(twitchChannelUrl("../evil"), null);
});
