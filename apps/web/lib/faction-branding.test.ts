import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { brandedFactionCount, brandedFactionSlugs, getFactionBranding } from "./faction-branding";

test("every branded faction has its paired optimized key art and transparent logo", () => {
  assert.equal(brandedFactionCount, 34);

  for (const slug of brandedFactionSlugs) {
    const brand = getFactionBranding(slug);
    assert.ok(brand, `${slug} has a branding record`);
    assert.ok(existsSync(join(process.cwd(), "public", brand.keyart)), `${slug} key art exists`);
    assert.ok(existsSync(join(process.cwd(), "public", brand.logo)), `${slug} logo exists`);
  }
});
