import assert from "node:assert/strict";
import test from "node:test";
import { bloomfallMainRegion, bloomfallSubregions } from "./bloomfall-reach-content";
import { buildContainedPlaceProjection } from "./story-library";
import { auditGeographicHierarchy, type GeographicEntry } from "../scripts/lib/geographic-hierarchy";
import { assertRepairedHierarchy, assessGeographicHierarchyRepair, geographicHierarchyRepairManifest, stableGeographicHierarchyRevisionId, verifiedGeographicParentContracts } from "../scripts/lib/geographic-hierarchy-repair";

const entry = (slug: string, parent: string | null, type = "region"): GeographicEntry => ({
  id: geographicHierarchyRepairManifest.find((candidate) => candidate.slug === slug)?.id ?? `00000000-0000-5000-8000-${slug.padEnd(12, "0").slice(0, 12)}`,
  slug,
  title: geographicHierarchyRepairManifest.find((candidate) => candidate.slug === slug)?.title ?? slug,
  kind: "REGION",
  status: "CANON",
  meta: { type, parent },
  placements: [],
  ownedMap: null,
});

test("the hierarchy repair manifest is deterministic and contains only the seven verified top-level fixes", () => {
  assert.deepEqual(geographicHierarchyRepairManifest.map((candidate) => candidate.slug), ["bloomfall-reach", "the-desert", "grand-rift", "high-cliffs", "magic-torn-wasteland", "the-red-forest", "riverlands"]);
  assert.equal(geographicHierarchyRepairManifest.every((candidate) => candidate.finalParent === null && candidate.finalType === "region"), true);
  assert.equal(new Set(geographicHierarchyRepairManifest.map((candidate) => stableGeographicHierarchyRevisionId(candidate.slug))).size, geographicHierarchyRepairManifest.length);
  assert.equal(stableGeographicHierarchyRevisionId("bloomfall-reach"), stableGeographicHierarchyRevisionId("bloomfall-reach"));
});

test("Bloomfall is top-level while all three canonical subregions remain inside it", () => {
  assert.equal(bloomfallMainRegion.meta.parent, null);
  assert.deepEqual(bloomfallSubregions.map((candidate) => [candidate.slug, (candidate.meta as { parent: string }).parent]), [
    ["the-shattercore", "bloomfall-reach"],
    ["the-mutation-belt", "bloomfall-reach"],
    ["the-living-marsh", "bloomfall-reach"],
  ]);
});

test("legitimate Peninsula, Grand Rift, High Cliffs, and Ignit containment stays explicit", () => {
  assert.equal(verifiedGeographicParentContracts["port-arcadia"], "the-peninsula");
  assert.equal(verifiedGeographicParentContracts["death-canyon"], "grand-rift");
  assert.equal(verifiedGeographicParentContracts["grand-lake"], "high-cliffs");
  assert.equal(verifiedGeographicParentContracts["the-floating-city"], "high-cliffs");
  assert.equal(verifiedGeographicParentContracts["the-starting-island"], null);
});

test("the audit detects cycles and top-level nesting without UI exclusions", () => {
  const rows = [entry("the-peninsula", "bloomfall-reach"), entry("bloomfall-reach", "the-peninsula")];
  const audit = auditGeographicHierarchy(rows);
  assert.deepEqual(audit.cycles.sort(), ["bloomfall-reach", "the-peninsula"]);
  assert.equal(audit.topLevelNestedUnderTopLevel.length, 2);
  assert.equal(audit.invalidParentCount, 2);
});

test("repair assessment is strict, all-or-none, and idempotent", () => {
  const before = geographicHierarchyRepairManifest.map((candidate) => ({ ...entry(candidate.slug, candidate.beforeParent, candidate.beforeType), version: 1 }));
  const after = geographicHierarchyRepairManifest.map((candidate) => ({ ...entry(candidate.slug, candidate.finalParent, candidate.finalType), version: 2 }));
  assert.equal(assessGeographicHierarchyRepair(before).overall, "READY");
  assert.equal(assessGeographicHierarchyRepair(after).overall, "ALREADY_APPLIED");
  assert.equal(assessGeographicHierarchyRepair([after[0]!, ...before.slice(1)]).overall, "DRIFT");
});

test("the release-order hierarchy stage can precede Bloomfall child creation without weakening final verification", () => {
  const preContent = Object.entries(verifiedGeographicParentContracts)
    .filter(([slug]) => !["the-shattercore", "the-mutation-belt", "the-living-marsh"].includes(slug))
    .map(([slug, parent]) => entry(slug, parent));
  preContent.push(entry("grand-rift", null), entry("high-cliffs", null));
  assert.doesNotThrow(() => assertRepairedHierarchy(preContent, { requireBloomfallSubregions: false }));
  assert.throws(() => assertRepairedHierarchy(preContent), /the-shattercore/);
});

test("the live dossier projection groups descendants beneath direct children", () => {
  const projection = buildContainedPlaceProjection("the-peninsula", [
    { slug: "the-peninsula", title: "Peninsula", summary: null, meta: { type: "region", parent: null } },
    { slug: "port-arcadia", title: "Port Arcadia", summary: null, meta: { type: "settlement", parent: "the-peninsula" } },
    { slug: "waterfront", title: "Waterfront", summary: null, meta: { type: "zone", parent: "port-arcadia" } },
    { slug: "bloomfall-reach", title: "Bloomfall Reach", summary: null, meta: { type: "region", parent: null } },
  ]);
  assert.equal(projection.length, 1);
  assert.equal(projection[0]?.slug, "port-arcadia");
  assert.deepEqual(projection[0]?.meta, { type: "settlement", parent: "the-peninsula" });
  assert.deepEqual(projection[0]?.inside.map((candidate) => candidate.slug), ["waterfront"]);
});
