import assert from "node:assert/strict";
import test from "node:test";
import { createInviteGrant, inviteCodeWeek, normalizeInviteCode, readInviteGrant, resolveWeeklyInviteCode, weeklyInviteCode } from "./weekly-invite-code";

const secret = "test-secret-that-is-not-used-outside-this-test";
const tino = "54c12ccc-36fe-44fd-8860-29074577130f";
const son = "11111111-1111-4111-8111-111111111111";

test("weekly codes are stable within an Eastern week, unique per member, and rotate Monday", () => {
  const sunday = new Date("2026-08-16T23:00:00-04:00");
  const monday = new Date("2026-08-17T00:01:00-04:00");
  assert.equal(inviteCodeWeek(sunday), "2026-08-10");
  assert.equal(inviteCodeWeek(monday), "2026-08-17");
  assert.notEqual(weeklyInviteCode(tino, secret, sunday), weeklyInviteCode(tino, secret, monday));
  assert.notEqual(weeklyInviteCode(tino, secret, sunday), weeklyInviteCode(son, secret, sunday));
});

test("code lookup accepts friendly formatting but only resolves current active members", () => {
  const now = new Date("2026-08-12T18:00:00Z");
  const code = weeklyInviteCode(tino, secret, now);
  assert.equal(normalizeInviteCode(code.toLowerCase().replaceAll("-", " ")), code);
  assert.deepEqual(resolveWeeklyInviteCode(code, [{ id: tino }, { id: son }], secret, now), { inviterUserId: tino, codeWeek: "2026-08-10" });
  assert.equal(resolveWeeklyInviteCode(code, [{ id: son }], secret, now), null);
});

test("referral grants expire and reject tampering", () => {
  const now = new Date("2026-08-12T18:00:00Z");
  const grant = createInviteGrant(tino, secret, now);
  assert.deepEqual(readInviteGrant(grant, secret, new Date(now.getTime() + 10 * 60_000)), { inviterUserId: tino, codeWeek: "2026-08-10" });
  assert.equal(readInviteGrant(`${grant}x`, secret, now), null);
  assert.equal(readInviteGrant(grant, secret, new Date(now.getTime() + 16 * 60_000)), null);
});
