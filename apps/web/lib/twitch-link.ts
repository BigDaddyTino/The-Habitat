import { createHash, randomBytes } from "node:crypto";
import { isValidTwitchLogin, isValidTwitchUserId, type TwitchUserData } from "@habitat/shared";

/**
 * Pure helpers behind Twitch account verification. The routes stay thin so the
 * parts worth testing — state hashing, single-use nonce windows, the redirect
 * URI both routes must agree on, conflict rules, and the member-facing status
 * copy — can be exercised without a database or a network round trip.
 */

/** Both routes must produce byte-identical redirect URIs, and it must equal the URI registered with Twitch. */
export const twitchCallbackPath = "/api/twitch/callback";
export const twitchLinkNonceTtlMs = 10 * 60 * 1_000;

export const twitchLinkStatuses = ["connected", "invalid", "expired", "conflict", "denied", "unconfigured"] as const;
export type TwitchLinkStatus = (typeof twitchLinkStatuses)[number];

/**
 * Twitch matches the redirect URI as an exact string against the one registered
 * in the developer console, so it never carries the state or any other query.
 */
export function twitchRedirectUri(origin: URL): string {
  return new URL(twitchCallbackPath, origin).toString();
}

/** Only the SHA-256 hash is stored, so a leaked nonce row cannot be replayed as a state value. */
export function hashTwitchLinkState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export function isTwitchLinkState(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function createTwitchLinkState(): { state: string; stateHash: string } {
  const state = randomBytes(32).toString("hex");
  return { state, stateHash: hashTwitchLinkState(state) };
}

export function twitchLinkNonceExpiry(now: Date): Date {
  return new Date(now.getTime() + twitchLinkNonceTtlMs);
}

/**
 * A stored nonce is usable exactly once, for its own owner, inside its window.
 * The callback re-checks the same conditions inside its transaction with an
 * `updateMany` guard, which is what actually makes consumption single-use; this
 * predicate only lets the route fail fast before the code exchange.
 */
export function isUsableTwitchLinkNonce(
  nonce: { userId: string; consumedAt: Date | null; expiresAt: Date } | null,
  userId: string,
  now: Date,
): boolean {
  return Boolean(nonce && nonce.userId === userId && !nonce.consumedAt && nonce.expiresAt > now);
}

/**
 * Twitch reports a denial as `error=access_denied` on the callback rather than
 * as a failed code exchange. Anything else it reports is unexpected and is
 * surfaced as a generic failure instead of blaming the member.
 */
export function twitchAuthorizationErrorStatus(error: string | null | undefined): TwitchLinkStatus | null {
  const reported = error?.trim().toLowerCase() ?? "";
  if (!reported) return null;
  return reported === "access_denied" || reported === "user_denied" ? "denied" : "invalid";
}

/** Authorization codes are opaque; only shape is checked before spending a network call on them. */
export function isTwitchAuthorizationCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._~-]{8,512}$/.test(value.trim());
}

export type TwitchLinkConflict = "CHANNEL_CLAIMED" | "SOCIAL_ACCOUNT_CLAIMED";

/**
 * A verified Twitch account belongs to one member. Both the channel row and the
 * social-account row are checked because either can already point at the Twitch
 * identity, and both carry unique constraints that would otherwise fail the
 * write with a raw database error.
 */
export function twitchLinkConflict(input: {
  userId: string;
  channelUserId?: string | null;
  socialAccountUserId?: string | null;
}): TwitchLinkConflict | null {
  if (input.channelUserId && input.channelUserId !== input.userId) return "CHANNEL_CLAIMED";
  if (input.socialAccountUserId && input.socialAccountUserId !== input.userId) return "SOCIAL_ACCOUNT_CLAIMED";
  return null;
}

export function hasTwitchLinkConflict(input: { userId: string; channelUserId?: string | null; socialAccountUserId?: string | null }): boolean {
  return twitchLinkConflict(input) !== null;
}

function truncated(value: string | null | undefined, length: number): string | null {
  const text = value?.trim();
  return text ? text.slice(0, length) : null;
}

/**
 * The columns verification is allowed to write. Live state (`isLive`, the
 * `current*` columns, `liveSince`) is owned by the worker and guarded by a
 * database CHECK constraint, so it is deliberately absent here.
 */
export function twitchChannelProfileFields(account: TwitchUserData) {
  const login = account.login.trim().toLowerCase();
  return {
    login: login.slice(0, 40),
    displayName: truncated(account.displayName, 80) ?? login,
    profileImageUrl: truncated(account.profileImageUrl, 500),
    offlineImageUrl: truncated(account.offlineImageUrl, 500),
    broadcasterType: truncated(account.broadcasterType, 20),
    channelDescription: truncated(account.description, 500),
  };
}

/** Rejects anything Helix would not have produced before it reaches a unique column. */
export function isVerifiableTwitchAccount(account: TwitchUserData): boolean {
  return isValidTwitchUserId(account.twitchUserId) && isValidTwitchLogin(account.login);
}

export type TwitchLinkNotice = { tone: "success" | "error"; heading: string; detail: string };

/**
 * Redirect-status copy. Success says plainly that verification alone does not
 * publish the channel, because the showcase is a separate opt-in.
 */
export function twitchLinkNotice(status: string | string[] | null | undefined): TwitchLinkNotice | null {
  const value = Array.isArray(status) ? status[0] : status;
  switch (value) {
    case "connected":
      return { tone: "success", heading: "Twitch channel verified.", detail: "Channel ownership is confirmed. Your channel stays out of the public showcase until you turn the showcase on below." };
    case "denied":
      return { tone: "error", heading: "Twitch verification was cancelled.", detail: "Authorization was declined at Twitch, so nothing was linked." };
    case "expired":
      return { tone: "error", heading: "Twitch verification was not completed.", detail: "The verification request expired or was already used. Start the connection again." };
    case "conflict":
      return { tone: "error", heading: "Twitch verification was not completed.", detail: "That Twitch channel is already verified by another Habitat member." };
    case "unconfigured":
      return { tone: "error", heading: "Twitch verification is not available.", detail: "The Twitch integration is not configured yet. An administrator must add Twitch credentials." };
    case "invalid":
      return { tone: "error", heading: "Twitch verification was not completed.", detail: "Twitch returned a response that could not be verified. Start the connection again." };
    default:
      return null;
  }
}
