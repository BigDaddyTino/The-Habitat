import assert from "node:assert/strict";
import test from "node:test";
import { bloomfallReachCanon, canonicalBloomfallReachSlug } from "@habitat/shared";

test("Bloomfall Reach owns the approved vocabulary", () => {
  assert.deepEqual(bloomfallReachCanon, {
    title: "Bloomfall Reach",
    slug: "bloomfall-reach",
    commonName: "The Living Ruin",
    historicalName: "Southreach Energy Reserve",
    historicalShorthand: "Southreach",
    facility: { formalName: "Southreach Strategic Essence Reserve, Refinery, and Gridworks", commonName: "Southreach Complex" },
    catastrophe: "The Bloomfall",
    catastropheAge: "roughly two decades before the present day",
    corruption: "The Blackbloom",
    officialCause: "A cascading industrial control and containment failure during strategic load balancing drove multiple Essence storage banks into uncontrolled resonance. Isolation systems failed faster than the facility could segment the reserve, causing a catastrophic regional release.",
    deepMysteryTruth: "DEFERRED",
    subregions: { north: "Shattercore", central: "Mutation Belt", south: "Living Marsh" },
    formerDevelopmentPlaceholder: { title: "Unknown Southeast", slug: "unknown-southeast", inWorldCanon: false },
  });
});

test("only the retired development slug canonicalizes to Bloomfall Reach", () => {
  assert.equal(canonicalBloomfallReachSlug("unknown-southeast"), "bloomfall-reach");
  assert.equal(canonicalBloomfallReachSlug("bloomfall-reach"), "bloomfall-reach");
  assert.equal(canonicalBloomfallReachSlug("riverlands"), "riverlands");
});
