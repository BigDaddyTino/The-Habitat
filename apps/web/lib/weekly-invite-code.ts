import { createHmac, timingSafeEqual } from "node:crypto";

export const INVITE_GRANT_COOKIE = "habitat-invite-grant";
export const INVITE_GRANT_LIFETIME_SECONDS = 15 * 60;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const EASTERN_TIME_ZONE = "America/New_York";

function easternDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function inviteCodeWeek(now = new Date()) {
  const { year, month, day } = easternDateParts(now);
  const easternCalendarDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (easternCalendarDate.getUTCDay() + 6) % 7;
  easternCalendarDate.setUTCDate(easternCalendarDate.getUTCDate() - daysSinceMonday);
  return easternCalendarDate.toISOString().slice(0, 10);
}

export function weeklyInviteCode(userId: string, secret: string, now = new Date()) {
  const digest = createHmac("sha256", secret).update(`habitat-invite:${userId}:${inviteCodeWeek(now)}`).digest();
  const characters = Array.from(digest.subarray(0, 10), (byte) => CODE_ALPHABET[byte & 31]).join("");
  return `HAB-${characters.slice(0, 5)}-${characters.slice(5)}`;
}

export function normalizeInviteCode(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.length === 13 && compact.startsWith("HAB")
    ? `HAB-${compact.slice(3, 8)}-${compact.slice(8)}`
    : null;
}

export function resolveWeeklyInviteCode(
  submittedCode: string,
  activeMembers: Array<{ id: string }>,
  secret: string,
  now = new Date(),
) {
  const normalized = normalizeInviteCode(submittedCode);
  if (!normalized) return null;
  const matches = activeMembers.filter((member) => weeklyInviteCode(member.id, secret, now) === normalized);
  return matches.length === 1 ? { inviterUserId: matches[0].id, codeWeek: inviteCodeWeek(now) } : null;
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createInviteGrant(inviterUserId: string, secret: string, now = new Date()) {
  const expiresAt = Math.floor(now.getTime() / 1000) + INVITE_GRANT_LIFETIME_SECONDS;
  const payload = `${inviterUserId}.${inviteCodeWeek(now)}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function readInviteGrant(token: string | undefined, secret: string, now = new Date()) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [inviterUserId, codeWeek, expiresValue, receivedSignature] = parts;
  const payload = `${inviterUserId}.${codeWeek}.${expiresValue}`;
  const expectedSignature = signature(payload, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  const expiresAt = Number(expiresValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(now.getTime() / 1000)) return null;
  if (codeWeek !== inviteCodeWeek(now)) return null;
  if (!/^[0-9a-f-]{36}$/i.test(inviterUserId)) return null;
  return { inviterUserId, codeWeek };
}
