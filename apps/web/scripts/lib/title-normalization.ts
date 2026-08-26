import { createHash } from "node:crypto";
import type { Prisma } from "@habitat/db/client";

export const titleNormalizationContract = "MARTINO_CANONICAL_TITLE_NORMALIZATION_V1" as const;

/**
 * Owner-approved article normalization (2026-08-26): drop a leading "The"
 * where it was display drift, keep it where it is part of the authored name.
 *
 * The decision rule is data-driven: where the slug itself never carried
 * `the-`, the article in the title was drift and is dropped; geographic map
 * labels drop it as well because Atlas labels, breadcrumbs, and dossier
 * headers compose better bare. Authored lore names (creatures, events,
 * rules, systems, missions, and the six `the-` factions) keep their article.
 *
 * Slugs are frozen identifiers and are NEVER changed by this contract —
 * every wiki link, meta.parent reference, URL, art binding, and derived
 * UUID keys on the slug and is untouched by design.
 */
export const titleNormalizationManifest = [
  // ARTICLE_DRIFT — title gained "The" over a The-less slug.
  { id: "6b0354e8-e6f7-4c36-b561-44c11d29d7df", slug: "abomination-containment-authority", beforeTitle: "The Abomination Containment Authority", finalTitle: "Abomination Containment Authority", category: "ARTICLE_DRIFT" },
  { id: "0b2c4729-2544-4bf7-b74a-5d3fc42a5538", slug: "aegis-extraction-consortium", beforeTitle: "The Aegis Extraction Consortium", finalTitle: "Aegis Extraction Consortium", category: "ARTICLE_DRIFT" },
  { id: "15f82547-201e-4750-85a2-fa1118bdac4c", slug: "black-tithe-syndicate", beforeTitle: "The Black Tithe Syndicate", finalTitle: "Black Tithe Syndicate", category: "ARTICLE_DRIFT" },
  { id: "b079566a-d30d-4c51-91db-bc2956c5fee4", slug: "bone-market-families", beforeTitle: "The Bone Market Families", finalTitle: "Bone Market Families", category: "ARTICLE_DRIFT" },
  { id: "e1d9fd14-3bb2-46a4-867a-e45b6e479883", slug: "church-of-the-first-gift", beforeTitle: "The Church of the First Gift", finalTitle: "Church of the First Gift", category: "ARTICLE_DRIFT" },
  { id: "a6f356e0-4843-49aa-acb5-e193e01d2aa7", slug: "concordance-of-natural-casters", beforeTitle: "The Concordance of Natural Casters", finalTitle: "Concordance of Natural Casters", category: "ARTICLE_DRIFT" },
  { id: "c7890e90-2c9b-4b60-9e3d-664e74fdbfc4", slug: "crimson-choir", beforeTitle: "The Crimson Choir", finalTitle: "Crimson Choir", category: "ARTICLE_DRIFT" },
  { id: "c7d6a871-7cc3-4576-9f00-afac6a0f0a80", slug: "cybernetic-ascendancy", beforeTitle: "The Cybernetic Ascendancy", finalTitle: "Cybernetic Ascendancy", category: "ARTICLE_DRIFT" },
  { id: "802de990-85a2-426d-a2a5-e81d825f1342", slug: "desert-nomad-compact", beforeTitle: "The Desert Nomad Compact", finalTitle: "Desert Nomad Compact", category: "ARTICLE_DRIFT" },
  { id: "68a41513-37cb-4e80-be7b-0f52f55f1b2b", slug: "drifter-renegade-camps", beforeTitle: "The Drifter Renegade Camps", finalTitle: "Drifter Renegade Camps", category: "ARTICLE_DRIFT" },
  { id: "9bb14782-1156-4d5c-8b0b-a8062a1097f8", slug: "drone-surveillance-bureau", beforeTitle: "The Drone Surveillance Bureau", finalTitle: "Drone Surveillance Bureau", category: "ARTICLE_DRIFT" },
  { id: "50b457e2-7dab-400a-9c6f-3f86a268f66d", slug: "east-side", beforeTitle: "The East side", finalTitle: "East Side", category: "ARTICLE_DRIFT" },
  { id: "df5381f0-a219-4d7e-933d-20e0f4ee9c08", slug: "floating-city-council", beforeTitle: "The Floating City Council", finalTitle: "Floating City Council", category: "ARTICLE_DRIFT" },
  { id: "7594abbb-452f-4028-a95f-81b28a599ade", slug: "foundry-workers-union", beforeTitle: "The Foundry Workers Union", finalTitle: "Foundry Workers Union", category: "ARTICLE_DRIFT" },
  { id: "5e77aca1-80c6-4cb6-8282-0cf629eddbc8", slug: "free-islander-league", beforeTitle: "The Free Islander League", finalTitle: "Free Islander League", category: "ARTICLE_DRIFT" },
  { id: "57657dc2-59ba-433a-a4af-15f0d315f13e", slug: "grand-lake", beforeTitle: "The Grand Lake", finalTitle: "Grand Lake", category: "ARTICLE_DRIFT" },
  { id: "09ee1dc8-8f3e-462a-9741-ccb6aeecf0ac", slug: "grand-rift", beforeTitle: "The Grand Rift", finalTitle: "Grand Rift", category: "ARTICLE_DRIFT" },
  { id: "ec50dc96-805d-480c-a177-ee6cd6bd7fa3", slug: "high-cliffs", beforeTitle: "The High Cliffs", finalTitle: "High Cliffs", category: "ARTICLE_DRIFT" },
  { id: "3d4e4807-fb54-4886-9bb7-be1d2a2a7ebf", slug: "iron-saints-pmc", beforeTitle: "The Iron Saints PMC", finalTitle: "Iron Saints PMC", category: "ARTICLE_DRIFT" },
  { id: "12bb20d7-cee0-4581-ac89-c529431401e1", slug: "liberation-of-the-gifted", beforeTitle: "The Liberation of the Gifted", finalTitle: "Liberation of the Gifted", category: "ARTICLE_DRIFT" },
  { id: "087f6d60-db59-482e-a892-04334444bd02", slug: "magic-torn-wasteland", beforeTitle: "The Magic-Torn Wasteland", finalTitle: "Magic-Torn Wasteland", category: "ARTICLE_DRIFT" },
  { id: "cf37a786-50ef-413a-9dae-d1a7e12a576b", slug: "meridian-arcane-institute", beforeTitle: "The Meridian Arcane Institute", finalTitle: "Meridian Arcane Institute", category: "ARTICLE_DRIFT" },
  { id: "f7b1d332-596a-48d5-8c95-aafef7dbb74d", slug: "mountain-holdfasts", beforeTitle: "The Mountain Holdfasts", finalTitle: "Mountain Holdfasts", category: "ARTICLE_DRIFT" },
  { id: "f5d34220-cacc-42ec-9ff1-eae775cba506", slug: "national-defense-directorate", beforeTitle: "The National Defense Directorate", finalTitle: "National Defense Directorate", category: "ARTICLE_DRIFT" },
  { id: "93651e4c-b75d-4473-8691-da98a8d12930", slug: "ossuary-covenant", beforeTitle: "The Ossuary Covenant", finalTitle: "Ossuary Covenant", category: "ARTICLE_DRIFT" },
  { id: "6af8ac57-bde1-4da3-9ec1-271508b50a9f", slug: "peninsula-coast-guard-authority", beforeTitle: "The Peninsula Coast Guard Authority", finalTitle: "Peninsula Coast Guard Authority", category: "ARTICLE_DRIFT" },
  { id: "9d283cfd-587e-4687-821f-a331f1d262bf", slug: "peninsula-expeditionary-army", beforeTitle: "The Peninsula Expeditionary Army", finalTitle: "Peninsula Expeditionary Army", category: "ARTICLE_DRIFT" },
  { id: "28aab80b-c611-4934-b937-9f39679ec52b", slug: "riftwood-interior", beforeTitle: "The Riftwood Interior", finalTitle: "Riftwood Interior", category: "ARTICLE_DRIFT" },
  { id: "ef4b0861-94e3-4cc1-bcfd-42bd1ce318a5", slug: "riverlands", beforeTitle: "The Riverlands", finalTitle: "Riverlands", category: "ARTICLE_DRIFT" },
  { id: "a14d028a-db54-4b1f-85e3-4ae9be553a37", slug: "sanctuary-of-living-beasts", beforeTitle: "The Sanctuary of Living Beasts", finalTitle: "Sanctuary of Living Beasts", category: "ARTICLE_DRIFT" },
  { id: "f6d8b3fc-fdcb-4138-bbef-bd818c04e69f", slug: "skybridge-transit-authority", beforeTitle: "The Skybridge Transit Authority", finalTitle: "Skybridge Transit Authority", category: "ARTICLE_DRIFT" },
  { id: "8285b0c0-5b84-51da-9117-af6c9bb604f4", slug: "southreach-complex", beforeTitle: "The Southreach Complex", finalTitle: "Southreach Complex", category: "ARTICLE_DRIFT" },
  { id: "3c1949c4-b1f9-429e-992e-385d140e944e", slug: "stormglass-cartel", beforeTitle: "The Stormglass Cartel", finalTitle: "Stormglass Cartel", category: "ARTICLE_DRIFT" },
  { id: "9e4e43bb-ff34-4173-beb0-897258c6018f", slug: "stormglass-quarry", beforeTitle: "The Stormglass Quarry and Essence Relay", finalTitle: "Stormglass Quarry and Essence Relay", category: "ARTICLE_DRIFT" },
  { id: "43595b9d-77e8-41ee-811a-6bb093752620", slug: "tropic-pearl-trade-house", beforeTitle: "The Tropic Pearl Trade House", finalTitle: "Tropic Pearl Trade House", category: "ARTICLE_DRIFT" },
  { id: "2e7610b4-27b4-486e-8be0-1e1b33a85bc8", slug: "verdant-marsh-clans", beforeTitle: "The Verdant Marsh Clans", finalTitle: "Verdant Marsh Clans", category: "ARTICLE_DRIFT" },
  { id: "ed9e2b4c-426f-4750-8013-67785ab8cc31", slug: "wardens-monster-hunter-guild", beforeTitle: "The Wardens' Monster Hunter Guild", finalTitle: "Wardens' Monster Hunter Guild", category: "ARTICLE_DRIFT" },
  // GEOGRAPHIC_LABEL — the- slugged places; map labels and breadcrumbs read bare.
  { id: "e97f3dfa-23cb-43df-9d71-b186f08b45e3", slug: "the-desert", beforeTitle: "The Desert", finalTitle: "Desert", category: "GEOGRAPHIC_LABEL" },
  { id: "29f88fad-1aab-4eb7-bbf1-1656dd7422b1", slug: "the-docks", beforeTitle: "The Docks", finalTitle: "Docks", category: "GEOGRAPHIC_LABEL" },
  { id: "249bbad9-c402-4d6a-8b06-392ba780d96e", slug: "the-floating-city", beforeTitle: "The Floating City", finalTitle: "Floating City", category: "GEOGRAPHIC_LABEL" },
  { id: "0f458d48-4804-532b-b10c-add18b2a313c", slug: "the-living-marsh", beforeTitle: "The Living Marsh", finalTitle: "Living Marsh", category: "GEOGRAPHIC_LABEL" },
  { id: "c0aa388a-53ec-51bd-aeeb-58d3773a85ab", slug: "the-mutation-belt", beforeTitle: "The Mutation Belt", finalTitle: "Mutation Belt", category: "GEOGRAPHIC_LABEL" },
  { id: "507c8c4e-69cf-4f19-9d7e-cb0e0379d67b", slug: "the-northside", beforeTitle: "The Northside", finalTitle: "Northside", category: "GEOGRAPHIC_LABEL" },
  { id: "308ba1cb-1ae9-477c-9e46-307e6dc66940", slug: "the-ocean", beforeTitle: "The Ocean", finalTitle: "Ocean", category: "GEOGRAPHIC_LABEL" },
  { id: "1e0e0f19-dca2-461b-be89-8ee5f04ed080", slug: "the-peninsula", beforeTitle: "The Peninsula", finalTitle: "Peninsula", category: "GEOGRAPHIC_LABEL" },
  { id: "8908a33a-0cd4-4a56-8610-5521cafade8c", slug: "the-red-forest", beforeTitle: "The Red Forest", finalTitle: "Red Forest", category: "GEOGRAPHIC_LABEL" },
  { id: "e0e1c899-65af-5d68-a757-010e04e6a7f1", slug: "the-shattercore", beforeTitle: "The Shattercore", finalTitle: "Shattercore", category: "GEOGRAPHIC_LABEL" },
  { id: "3c31fd9b-a85d-4473-b3e7-e20dd98d9a47", slug: "the-southside", beforeTitle: "The southside", finalTitle: "Southside", category: "GEOGRAPHIC_LABEL" },
  // CASING_SPELLING — same-pass title-quality bugs, no article involved.
  { id: "91131379-d860-4ac9-ba3b-0ee53a0424d1", slug: "waterfront-district", beforeTitle: "Waterfront district", finalTitle: "Waterfront District", category: "CASING_SPELLING" },
  { id: "ac72ae28-f0df-4284-ac75-b25143db3339", slug: "arcadian-soverign-guard", beforeTitle: "Arcadian Soverign Guard", finalTitle: "Arcadian Sovereign Guard", category: "CASING_SPELLING" },
] as const;

/** Authored names that keep their article on purpose; recorded so the
 * decision is auditable and the question does not silently reopen. */
export const retainedArticleTitles = [
  "the-ashen-court", "the-choir-below", "the-free-peoples-compact", "the-old-hunger", "the-pale-embassy", "the-riftbound-legion",
  "the-bellwether", "the-bellwether-event", "the-bloomfall", "the-last-shift", "the-risen", "the-unnamed", "the-war-correspondent",
] as const;

export type TitleNormalizationRow = {
  id: string;
  slug: string;
  title: string;
  version: number;
};

export function stableTitleNormalizationRevisionId(slug: string) {
  const digits = createHash("sha256").update(`${titleNormalizationContract}:revision:${slug}`).digest("hex").slice(0, 32).split("");
  digits[12] = "5";
  digits[16] = ((Number.parseInt(digits[16]!, 16) & 0x3) | 0x8).toString(16);
  const value = digits.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function assessTitleNormalization(rows: readonly TitleNormalizationRow[]) {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const records = titleNormalizationManifest.map((expected) => {
    const actual = bySlug.get(expected.slug);
    if (!actual || actual.id !== expected.id) return { slug: expected.slug, state: "DRIFT" as const, expected, actual: actual ?? null };
    const state = actual.title === expected.beforeTitle ? ("BEFORE" as const) : actual.title === expected.finalTitle ? ("AFTER" as const) : ("DRIFT" as const);
    return { slug: expected.slug, state, expected, actual };
  });
  const states = new Set(records.map((record) => record.state));
  const overall = states.size === 1 && states.has("BEFORE") ? "READY" : states.size === 1 && states.has("AFTER") ? "ALREADY_APPLIED" : "DRIFT";
  return { overall, records };
}

export function titleNormalizationRevisionData(entryId: string, slug: string, actorUserId: string, versionBefore: number): Prisma.StoryRevisionUncheckedCreateInput {
  const expected = titleNormalizationManifest.find((entry) => entry.slug === slug);
  if (!expected) throw new Error(`No title normalization contract exists for ${slug}.`);
  return {
    id: stableTitleNormalizationRevisionId(slug),
    entityType: "ENTRY",
    entityId: entryId,
    action: "UPDATED",
    actorUserId,
    summary: `Normalized ${expected.beforeTitle} display title to ${expected.finalTitle}`,
    before: { contract: titleNormalizationContract, title: expected.beforeTitle, version: versionBefore },
    after: { contract: titleNormalizationContract, title: expected.finalTitle, version: versionBefore + 1 },
  };
}
