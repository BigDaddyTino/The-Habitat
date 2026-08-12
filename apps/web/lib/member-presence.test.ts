import assert from "node:assert/strict";
import test from "node:test";
import { describeUserAgent, isPresenceActive } from "./member-presence";

test("describes common member devices without claiming more than the user agent provides", () => {
  assert.deepEqual(
    describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"),
    { deviceType: "Mobile", platform: "iOS", browser: "Safari" },
  );
  assert.deepEqual(
    describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36 Edg/128.0"),
    { deviceType: "Desktop", platform: "Windows", browser: "Edge" },
  );
});

test("presence is active only inside the freshness window", () => {
  const now = new Date("2026-08-12T18:00:00.000Z");
  assert.equal(isPresenceActive(new Date("2026-08-12T17:58:00.000Z"), now), true);
  assert.equal(isPresenceActive(new Date("2026-08-12T17:56:00.000Z"), now), false);
});
