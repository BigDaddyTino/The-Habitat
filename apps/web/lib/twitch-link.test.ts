import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { TwitchUserData } from "@habitat/shared";
import {
  createTwitchLinkState,
  hasTwitchLinkConflict,
  hashTwitchLinkState,
  isTwitchAuthorizationCode,
  isTwitchLinkState,
  isUsableTwitchLinkNonce,
  isVerifiableTwitchAccount,
  twitchAuthorizationErrorStatus,
  twitchCallbackPath,
  twitchChannelProfileFields,
  twitchLinkConflict,
  twitchLinkNonceExpiry,
  twitchLinkNonceTtlMs,
  twitchLinkNotice,
  twitchRedirectUri,
} from "./twitch-link";

const account = (overrides: Partial<TwitchUserData> = {}): TwitchUserData => ({
  twitchUserId: "123456789",
  login: "habitat_streamer",
  displayName: "Habitat_Streamer",
  profileImageUrl: "https://static-cdn.jtvnw.net/profile.png",
  offlineImageUrl: null,
  broadcasterType: "affiliate",
  description: "Lodge broadcasts.",
  ...overrides,
});

test("only the state hash is ever stored, and generated states are single-use secrets", () => {
  const first = createTwitchLinkState();
  const second = createTwitchLinkState();
  assert.notEqual(first.state, second.state);
  assert.match(first.state, /^[a-f0-9]{64}$/);
  assert.equal(first.stateHash, createHash("sha256").update(first.state).digest("hex"));
  assert.notEqual(first.stateHash, first.state);
  assert.equal(hashTwitchLinkState(first.state), first.stateHash);
  // The column is VarChar(64) and the callback looks the hash up by unique key.
  assert.equal(first.stateHash.length, 64);
});

test("state validation accepts only 32 lowercase hex bytes", () => {
  assert.equal(isTwitchLinkState("a".repeat(64)), true);
  assert.equal(isTwitchLinkState("A".repeat(64)), false);
  assert.equal(isTwitchLinkState("a".repeat(63)), false);
  assert.equal(isTwitchLinkState("a".repeat(65)), false);
  assert.equal(isTwitchLinkState("g".repeat(64)), false);
  assert.equal(isTwitchLinkState(null), false);
  assert.equal(isTwitchLinkState(undefined), false);
});

test("the redirect URI is identical for both routes and carries no query", () => {
  const origin = new URL("https://habitat.example");
  assert.equal(twitchRedirectUri(origin), "https://habitat.example/api/twitch/callback");
  assert.equal(twitchRedirectUri(new URL("http://localhost:3000")), "http://localhost:3000/api/twitch/callback");
  assert.equal(new URL(twitchRedirectUri(origin)).search, "");
  assert.equal(new URL(twitchRedirectUri(origin)).pathname, twitchCallbackPath);
});

test("nonces expire ten minutes out and are usable once, by their owner, in window", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  assert.equal(twitchLinkNonceTtlMs, 600_000);
  assert.equal(twitchLinkNonceExpiry(now).toISOString(), "2026-08-13T12:10:00.000Z");

  const fresh = { userId: "member-1", consumedAt: null, expiresAt: twitchLinkNonceExpiry(now) };
  assert.equal(isUsableTwitchLinkNonce(fresh, "member-1", now), true);
  assert.equal(isUsableTwitchLinkNonce(fresh, "member-2", now), false, "another member may not spend this nonce");
  assert.equal(isUsableTwitchLinkNonce(fresh, "member-1", new Date(now.getTime() + twitchLinkNonceTtlMs)), false, "expiry is exclusive");
  assert.equal(isUsableTwitchLinkNonce({ ...fresh, consumedAt: now }, "member-1", now), false, "a consumed nonce is never reusable");
  assert.equal(isUsableTwitchLinkNonce(null, "member-1", now), false);
});

test("a declined authorization is reported as denied, any other Twitch error as invalid", () => {
  assert.equal(twitchAuthorizationErrorStatus("access_denied"), "denied");
  assert.equal(twitchAuthorizationErrorStatus("  ACCESS_DENIED "), "denied");
  assert.equal(twitchAuthorizationErrorStatus("user_denied"), "denied");
  assert.equal(twitchAuthorizationErrorStatus("server_error"), "invalid");
  assert.equal(twitchAuthorizationErrorStatus("redirect_mismatch"), "invalid");
  assert.equal(twitchAuthorizationErrorStatus(""), null);
  assert.equal(twitchAuthorizationErrorStatus(null), null);
});

test("authorization codes are shape-checked before a network call is spent", () => {
  assert.equal(isTwitchAuthorizationCode("abcdefgh12345678"), true);
  assert.equal(isTwitchAuthorizationCode("short"), false);
  assert.equal(isTwitchAuthorizationCode("has space in it"), false);
  assert.equal(isTwitchAuthorizationCode(`${"a".repeat(513)}`), false);
  assert.equal(isTwitchAuthorizationCode(null), false);
});

test("a Twitch identity already claimed by another member is a conflict, re-verifying is not", () => {
  assert.equal(twitchLinkConflict({ userId: "member-1", channelUserId: "member-2" }), "CHANNEL_CLAIMED");
  assert.equal(twitchLinkConflict({ userId: "member-1", socialAccountUserId: "member-2" }), "SOCIAL_ACCOUNT_CLAIMED");
  assert.equal(twitchLinkConflict({ userId: "member-1", channelUserId: "member-1", socialAccountUserId: "member-1" }), null, "re-verifying your own channel is allowed");
  assert.equal(twitchLinkConflict({ userId: "member-1", channelUserId: null, socialAccountUserId: undefined }), null);
  assert.equal(hasTwitchLinkConflict({ userId: "member-1", channelUserId: "member-2", socialAccountUserId: "member-1" }), true);
  assert.equal(hasTwitchLinkConflict({ userId: "member-1" }), false);
});

test("verification writes channel identity only, never live state, and respects column limits", () => {
  const fields = twitchChannelProfileFields(account({ login: "Habitat_Streamer", description: "x".repeat(900), displayName: "  Stream Lodge  " }));
  assert.equal(fields.login, "habitat_streamer", "logins are stored lowercased for matching");
  assert.equal(fields.displayName, "Stream Lodge");
  assert.equal(fields.channelDescription?.length, 500);
  assert.equal(fields.offlineImageUrl, null);
  assert.equal(fields.broadcasterType, "affiliate");
  // Live columns are worker-owned and guarded by a database CHECK constraint.
  assert.deepEqual(Object.keys(fields).sort(), ["broadcasterType", "channelDescription", "displayName", "login", "offlineImageUrl", "profileImageUrl"]);
  for (const key of ["isLive", "liveSince", "currentStreamId", "currentViewerCount", "showcaseEnabled"]) {
    assert.equal(key in fields, false, `${key} must never be written by verification`);
  }
  assert.equal(twitchChannelProfileFields(account({ displayName: "" })).displayName, "habitat_streamer", "a blank display name falls back to the login");
});

test("only Helix-shaped accounts reach the unique identity columns", () => {
  assert.equal(isVerifiableTwitchAccount(account()), true);
  assert.equal(isVerifiableTwitchAccount(account({ twitchUserId: "not-numeric" })), false);
  assert.equal(isVerifiableTwitchAccount(account({ login: "no" })), false);
  assert.equal(isVerifiableTwitchAccount(account({ login: "bad login" })), false);
});

test("status messages explain each outcome and never imply the showcase is automatic", () => {
  const connected = twitchLinkNotice("connected");
  assert.equal(connected?.tone, "success");
  assert.match(connected?.detail ?? "", /showcase/i);
  assert.match(connected?.detail ?? "", /until you turn the showcase on/i);
  assert.equal(twitchLinkNotice("denied")?.tone, "error");
  assert.match(twitchLinkNotice("conflict")?.detail ?? "", /another Habitat member/);
  assert.match(twitchLinkNotice("expired")?.detail ?? "", /expired or was already used/);
  assert.match(twitchLinkNotice("unconfigured")?.detail ?? "", /not configured/);
  assert.match(twitchLinkNotice("invalid")?.detail ?? "", /could not be verified/);
  // Query parameters arrive as strings or repeated strings, and unknown values render nothing.
  assert.equal(twitchLinkNotice(["conflict", "connected"])?.detail, twitchLinkNotice("conflict")?.detail);
  assert.equal(twitchLinkNotice("something-else"), null);
  assert.equal(twitchLinkNotice(undefined), null);
  assert.equal(twitchLinkNotice(null), null);
});
