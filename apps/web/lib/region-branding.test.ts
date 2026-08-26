import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { brandedRegionCount, brandedRegionSlugs, getRegionBranding, getRegionKeyart } from "./region-branding";

function jpegDimensions(path: string) {
  const bytes = readFileSync(path);
  assert.equal(bytes.readUInt16BE(0), 0xffd8, `${path} is a JPEG`);

  for (let offset = 2; offset + 9 < bytes.length;) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const length = bytes.readUInt16BE(offset + 2);
    assert.ok(length >= 2, `${path} has valid JPEG segments`);
    offset += 2 + length;
  }

  throw new Error(`${path} has no readable JPEG frame`);
}

test("every illustrated canonical region and POI has optimized cinematic key art", () => {
  assert.equal(brandedRegionCount, 26);
  assert.deepEqual(brandedRegionSlugs, [
    "arcadian-soverign-guard",
    "arcadian-special-intelligence-service",
    "blackreef-harbour",
    "census-office",
    "chancellory-of-arcadia",
    "east-side",
    "embassy-row",
    "exclusion-area",
    "fort-tempest",
    "forward-camp-kestrel",
    "glasswater-village",
    "lower-westside",
    "northwatch-relay",
    "pearl-beachhead",
    "port-arcadia",
    "riftwood-interior",
    "shattermarket",
    "stormglass-landing",
    "stormglass-quarry",
    "the-northside",
    "the-ocean",
    "the-peninsula",
    "the-southside",
    "the-starting-island",
    "upper-westside",
    "waterfront-district",
  ]);

  for (const slug of brandedRegionSlugs) {
    const brand = getRegionBranding(slug);
    assert.ok(brand, `${slug} has a visual identity record`);
    assert.deepEqual(jpegDimensions(join(process.cwd(), "public", brand.keyart)), { height: 900, width: 1600 });
  }
});

test("an existing place image resolves even before the place receives full branding", () => {
  assert.equal(getRegionBranding("the-docks"), null);
  for (const [slug, expected] of [
    ["the-docks", "/images/regions/keyart/the-docks.png"],
    ["death-canyon", "/images/regions/keyart/death-canyon.png"],
    ["grand-lake", "/images/regions/keyart/grand-lake.png"],
    ["the-floating-city", "/images/regions/keyart/the-floating-city.jpg"],
  ] as const) {
    assert.equal(getRegionKeyart(slug), expected);
    assert.ok(readFileSync(join(process.cwd(), "public", expected)).byteLength > 0, `${slug} artwork exists`);
  }
});
