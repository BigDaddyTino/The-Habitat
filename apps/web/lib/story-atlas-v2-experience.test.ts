import assert from "node:assert/strict";
import test from "node:test";
import { atlasV2Breadcrumbs, atlasV2DisplayLevel, atlasV2Hash, parseAtlasV2Hash } from "./story-atlas-v2-experience";
test("Atlas V2 display tiers and URL state are stable", () => { assert.equal(atlasV2DisplayLevel(0), "WORLD"); assert.equal(atlasV2DisplayLevel(1.4), "REGION"); assert.equal(atlasV2DisplayLevel(2.4), "LOCAL"); assert.equal(atlasV2DisplayLevel(3.4), "POI"); assert.equal(parseAtlasV2Hash(atlasV2Hash("death-canyon")), "death-canyon"); });
test("Atlas V2 breadcrumb preserves Grand Rift context for Death Canyon", () => { const regions = [{ slug: "grand-rift", parentSlug: null }, { slug: "death-canyon", parentSlug: "grand-rift" }] as never; assert.deepEqual(atlasV2Breadcrumbs(regions, "death-canyon").map((item) => item.slug), ["grand-rift", "death-canyon"]); });
