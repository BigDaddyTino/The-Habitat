import assert from "node:assert/strict";
import test from "node:test";
import { codexArtFileForUrl } from "./codex-art";
import { brandedFactionCount, brandedFactionSlugs, getFactionBranding } from "./faction-branding";

test("every branded faction has its paired optimized key art and logo", () => {
  assert.equal(brandedFactionCount, 36);

  for (const slug of brandedFactionSlugs) {
    const brand = getFactionBranding(slug);
    assert.ok(brand, `${slug} has a branding record`);
    assert.match(brand.keyart, /^\/codex-art\/factions\//, `${slug} key art is served through the authenticated route`);
    assert.match(brand.logo, /^\/codex-art\/faction-logos\//, `${slug} logo is served through the authenticated route`);
    assert.ok(codexArtFileForUrl(brand.keyart), `${slug} key art exists`);
    assert.ok(codexArtFileForUrl(brand.logo), `${slug} logo exists`);
  }
});
