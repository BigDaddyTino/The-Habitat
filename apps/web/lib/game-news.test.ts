import assert from "node:assert/strict";
import test from "node:test";
import { isSafeNewsUrl } from "./game-news";

test("dispatch links require HTTPS and reject unusable or dangerous URLs", () => {
  assert.equal(isSafeNewsUrl("https://steamcommunity.com/games/892970/announcements/detail/123456789"), true);
  assert.equal(isSafeNewsUrl("https://store.steampowered.com/news/app/1623730/view/987654321"), true);
  assert.equal(isSafeNewsUrl("http://steamcommunity.com/games/1/announcements/detail/2"), false, "plain HTTP is rejected");
  assert.equal(isSafeNewsUrl("javascript:alert(1)"), false);
  assert.equal(isSafeNewsUrl("not a url"), false);
  assert.equal(isSafeNewsUrl(undefined), false);
  assert.equal(isSafeNewsUrl(""), false);
});

test("the Steam CDN host that real announcements actually use is accepted", () => {
  // Verified against the live ISteamNews feed for Marvel Rivals, Valheim, and
  // Palworld: every steam_community_announcements item is served from Valve's
  // CDN, not from steamcommunity.com. A host allowlist built from the obvious
  // Steam domains therefore drops 100% of dispatches, which is why this check is
  // scheme-only. This test exists so that regression is caught immediately.
  assert.equal(isSafeNewsUrl("https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/123456789"), true);
});
