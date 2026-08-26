export const bloomfallV3Package = "bloomfall-v3" as const;
export const bloomfallV3Version = "v3" as const;

type BloomfallV3AtlasAsset = {
  id: string;
  purpose: string;
  kind: "atlas";
  mapSlug: string;
  filename: string;
  width: number;
  height: number;
  sha256: string;
};

type BloomfallV3CodexAsset = {
  id: string;
  purpose: string;
  kind: "codex";
  entrySlug: string;
  filename: string;
  width: number;
  height: number;
  sha256: string;
};

export type BloomfallV3Asset = BloomfallV3AtlasAsset | BloomfallV3CodexAsset;

/**
 * The owner-approved release set. This is the one authoritative mapping from
 * the fifteen reviewed V3 files to their Atlas scenes or Codex dossiers.
 * Source candidates remain local review evidence and are deliberately not
 * referenced at runtime.
 */
export const bloomfallV3Assets: readonly BloomfallV3Asset[] = [
  { id: "world-atlas", purpose: "Corrected world Atlas", kind: "atlas", mapSlug: "martino-world", filename: "martino-world-map-v3.png", width: 1536, height: 1024, sha256: "9670a94dc80a69272648bd7cdb51795e933dc099b03d95bf05c47047ea85b62a" },
  { id: "local-atlas", purpose: "Bloomfall local Atlas", kind: "atlas", mapSlug: "martino-bloomfall-reach", filename: "martino-bloomfall-reach-map-v3.png", width: 1536, height: 1024, sha256: "3a9f5517e972217a5513428544567267d29ea219ea11dcf69dd12f0aa67e6569" },
  { id: "bloomfall-reach", purpose: "Bloomfall Reach hero", kind: "codex", entrySlug: "bloomfall-reach", filename: "bloomfall-reach.png", width: 1672, height: 941, sha256: "8750634e8c515ae2dc71bb87d3ff372e2dfc2247f844b41fa9de5c06497a8eae" },
  { id: "the-shattercore", purpose: "Shattercore environment", kind: "codex", entrySlug: "the-shattercore", filename: "the-shattercore.png", width: 1672, height: 941, sha256: "6a63118ea898f69d2ed8043d67a2564b801773a0677a4163b0fc99a1e87d4b72" },
  { id: "southreach-complex-exterior", purpose: "Southreach Complex exterior", kind: "codex", entrySlug: "southreach-complex", filename: "southreach-complex-exterior.png", width: 1672, height: 941, sha256: "37919540f6d74d50de9476bc86dc6b20888051aa43173142aa92ca03569de422" },
  { id: "southreach-complex-interior", purpose: "Southreach Complex interior", kind: "codex", entrySlug: "reactor-cycles", filename: "southreach-complex-interior.png", width: 1672, height: 941, sha256: "2627d93017f2c27571f5b1393ddb25a0e1f12f8b954165679309d6411d325f71" },
  { id: "the-mutation-belt", purpose: "Mutation Belt environment", kind: "codex", entrySlug: "the-mutation-belt", filename: "the-mutation-belt.png", width: 1672, height: 941, sha256: "f30f9f049f13e48ea7b312ada29a271e5f100db5eb1fb46dd5c36ccff59523a1" },
  { id: "the-living-marsh-day", purpose: "Living Marsh day", kind: "codex", entrySlug: "the-living-marsh", filename: "the-living-marsh-day.png", width: 1672, height: 941, sha256: "96d664e7ae59ef6964a409afb871e7b9e9d0bbc5fe41c9d2ec2dcd7b95f2565a" },
  { id: "the-living-marsh-night", purpose: "Living Marsh night", kind: "codex", entrySlug: "lantern-pools", filename: "the-living-marsh-night.png", width: 1672, height: 941, sha256: "b8e7ede36195162c812e3bc0f6322ca0b17b73a1368e724c5d8655841621b4b1" },
  { id: "the-bellwether", purpose: "Bellwether", kind: "codex", entrySlug: "the-bellwether", filename: "the-bellwether.png", width: 1672, height: 941, sha256: "d68bc35a655fbcc2f9e66092b403710cf822838ee50e01b5c482ef70b6e11784" },
  { id: "switchmother", purpose: "Switchmother", kind: "codex", entrySlug: "switchmother", filename: "switchmother.png", width: 1672, height: 941, sha256: "53fc717810276550b2e43459134b7a104879ba019f85865357242bad22806ae1" },
  { id: "marsh-coordination", purpose: "Marsh coordination", kind: "codex", entrySlug: "heartfen", filename: "marsh-coordination.png", width: 1672, height: 941, sha256: "6f86fa6c4c5031561de792a74db06636e3a2f63b9c51adc778ca4efa4e56b81d" },
  { id: "flora-resources", purpose: "Flora and resource contamination", kind: "codex", entrySlug: "harvesting-consequences", filename: "flora-resources.png", width: 1672, height: 941, sha256: "8d162eb2eb4350e3a32065b0607bea90c88258e5d0cd9e7e40420eb701b73133" },
  { id: "bloomstorm", purpose: "Bloomstorm", kind: "codex", entrySlug: "blackbloom-overcharge", filename: "bloomstorm.png", width: 1672, height: 941, sha256: "aa710396e9d7764977b00c03894ee10eb170fb967de7aa68d402981375014f6a" },
  { id: "expedition-ensemble", purpose: "Expedition and survivor ensemble", kind: "codex", entrySlug: "cairnwood-camp", filename: "expedition-ensemble.png", width: 1672, height: 941, sha256: "6a8834258638b53dab8c3b6e7dc7226810762a9fb04a702e01ae72286ec7067c" },
] as const;

export const bloomfallV3AtlasAssets = bloomfallV3Assets.filter((asset): asset is Extract<BloomfallV3Asset, { kind: "atlas" }> => asset.kind === "atlas");
export const bloomfallV3CodexAssets = bloomfallV3Assets.filter((asset): asset is Extract<BloomfallV3Asset, { kind: "codex" }> => asset.kind === "codex");

const sourceFilenames = {
  "world-atlas": "martino-world-map-v3-reset-candidate.png",
  "local-atlas": "local-atlas-v3-reset.png",
  "bloomfall-reach": "bloomfall-hero-v3-reset.png",
  "the-shattercore": "shattercore-v3-reset.png",
  "southreach-complex-exterior": "southreach-exterior-v3-reset.png",
  "southreach-complex-interior": "southreach-interior-v3-reset.png",
  "the-mutation-belt": "mutation-belt-v3-reset.png",
  "the-living-marsh-day": "living-marsh-day-v3-reset.png",
  "the-living-marsh-night": "living-marsh-night-v3-reset.png",
  "the-bellwether": "bellwether-v3-reset.png",
  switchmother: "switchmother-v3-reset.png",
  "marsh-coordination": "marsh-coordination-v3-reset.png",
  "flora-resources": "flora-resources-v3-reset.png",
  bloomstorm: "bloomstorm-v3-reset.png",
  "expedition-ensemble": "expedition-v3-reset.png",
} as const satisfies Record<string, string>;

export function bloomfallV3SourcePath(asset: BloomfallV3Asset): string {
  return `private/codex-art/bloomfall/v3-reset/candidates/${sourceFilenames[asset.id as keyof typeof sourceFilenames]}`;
}

export function bloomfallV3ProductionPath(asset: BloomfallV3Asset): string {
  return asset.kind === "atlas" ? `private/codex-art/maps/${asset.filename}` : `private/codex-art/bloomfall-v3/${asset.filename}`;
}

const codexByEntry = new Map(bloomfallV3CodexAssets.map((asset) => [asset.entrySlug, asset]));

export type BloomfallV3PublicationMarker = {
  package: typeof bloomfallV3Package;
  assetId: string;
  version: typeof bloomfallV3Version;
  sha256: string;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function bloomfallV3PublicationMarker(asset: Extract<BloomfallV3Asset, { kind: "codex" }>): BloomfallV3PublicationMarker {
  return { package: bloomfallV3Package, assetId: asset.id, version: bloomfallV3Version, sha256: asset.sha256 };
}

export function bloomfallV3Published(meta: unknown, asset: Extract<BloomfallV3Asset, { kind: "codex" }>): boolean {
  const marker = record(record(meta).visualArt);
  return marker.package === bloomfallV3Package && marker.assetId === asset.id && marker.version === bloomfallV3Version && marker.sha256 === asset.sha256;
}

/** Development can review the registered set immediately. Production requires
 * the exact per-entry marker written by the explicit activation transaction. */
export function getBloomfallV3CodexArt(entrySlug: string, meta: unknown, environment: Readonly<Record<string, string | undefined>> = process.env): string | null {
  const asset = codexByEntry.get(entrySlug);
  if (!asset) return null;
  if (environment.HABITAT_ENVIRONMENT !== "development" && !bloomfallV3Published(meta, asset)) return null;
  return `/codex-art/${bloomfallV3Package}/${asset.filename}`;
}
