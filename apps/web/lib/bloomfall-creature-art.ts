import type { BloomfallMutationRung } from "./bloomfall-adaptive-ladder";

export const bloomfallCreatureArtPackage = "bloomfall-creatures-v4" as const;

export type BloomfallCreatureArtAsset = {
  /** The Codex dossier this plate belongs to. */
  entrySlug: string;
  /** Which rung of the ladder it shows, or null for a species with no ladder. */
  rung: BloomfallMutationRung | null;
  filename: string;
  width: number;
  height: number;
  sha256: string;
};

/**
 * The owner-approved creature plates, generated 2026-08-27.
 *
 * One image per rung for the five adaptive species, plus a single plate for
 * each species and named entity that has no ladder. Served copies are capped
 * at 2048px and encoded as WebP; the 4K masters they came from are archived
 * outside the repository and are not needed at runtime.
 *
 * The package now covers every Bloomfall creature dossier plus Mender, the
 * deliberately character-classified maintenance entity. Human-derived subjects
 * retain their CREATURE taxonomy while wearing their own approved plates.
 */
export const bloomfallCreatureArtAssets: readonly BloomfallCreatureArtAsset[] = [
  { entrySlug: "blackbloom-hart", rung: "NONE", filename: "blackbloom-hart-none.webp", width: 1365, height: 2048, sha256: "e1bec3a30e75dd70c014c4e6f3691147e217325b9b2384d57d445c504a7898ab" },
  { entrySlug: "blackbloom-hart", rung: "MINOR", filename: "blackbloom-hart-minor.webp", width: 1363, height: 2048, sha256: "d32e3b61f968984e6b226b050f46bed18a788517825ea07eb293634f09ba0fc5" },
  { entrySlug: "blackbloom-hart", rung: "FUNCTIONAL", filename: "blackbloom-hart-functional.webp", width: 2048, height: 1365, sha256: "43443b340206cd777b909bb95531a71749ccaf1a5a751898ae0c2f09ee21ba2c" },
  { entrySlug: "blackbloom-hart", rung: "ADVANCED", filename: "blackbloom-hart-advanced.webp", width: 2048, height: 1365, sha256: "712e02004175602deba47fd5c06d6022022ffc79a76bcc5d60e24a3948a686f6" },
  { entrySlug: "blackbloom-hart", rung: "ABERRANT", filename: "blackbloom-hart-aberrant.webp", width: 2048, height: 1365, sha256: "41fe2cab75812bfd82f61f51ff4ab5ea12c8dbb344bef68b942de791bde220e0" },
  { entrySlug: "rootback-grazer", rung: "NONE", filename: "rootback-grazer-none.webp", width: 1642, height: 2048, sha256: "efbd3ee6a5e4aafe468e3b697b158fc0acf5c40144fa89d978a14c63962354b0" },
  { entrySlug: "rootback-grazer", rung: "MINOR", filename: "rootback-grazer-minor.webp", width: 1365, height: 2048, sha256: "7fd228c2faef3818c2a8e9918cbc285ff35a561931c29ab92fedb6f9c2700f11" },
  { entrySlug: "rootback-grazer", rung: "FUNCTIONAL", filename: "rootback-grazer-functional.webp", width: 1365, height: 2048, sha256: "caedb64a958ff79c397a16c750cb688f71f8073e7af7328de183788ab4ffa2e7" },
  { entrySlug: "rootback-grazer", rung: "ADVANCED", filename: "rootback-grazer-advanced.webp", width: 1642, height: 2048, sha256: "4596f942ab972a31ddba201103db74393aa240974324d35ee8babde57ff239ad" },
  { entrySlug: "rootback-grazer", rung: "ABERRANT", filename: "rootback-grazer-aberrant.webp", width: 1639, height: 2048, sha256: "0c2f652056eeb4acd3dc39df125bd1d0c6bc09876f690036e6de1d056fc26655" },
  { entrySlug: "mirejaw", rung: "NONE", filename: "mirejaw-none.webp", width: 1365, height: 2048, sha256: "2f5d28ebe164d2502248a779df0045bacc152b829bf32878cd810bb1144ed029" },
  { entrySlug: "mirejaw", rung: "MINOR", filename: "mirejaw-minor.webp", width: 1379, height: 2048, sha256: "f910b0179b315f146a83bfd431944fe020ca8a2521aaf66fdc90e16e923eb0e8" },
  { entrySlug: "mirejaw", rung: "FUNCTIONAL", filename: "mirejaw-functional.webp", width: 1365, height: 2048, sha256: "b407d62420a9c1efce59b28a8a2cbd4a1427e2eb836a55741b6bdb38fdb4d885" },
  { entrySlug: "mirejaw", rung: "ADVANCED", filename: "mirejaw-advanced.webp", width: 1639, height: 2048, sha256: "bf6421d4987e815e578186dc815c814b6efce6254fbb4e2f566a6c94109ef135" },
  { entrySlug: "mirejaw", rung: "ABERRANT", filename: "mirejaw-aberrant.webp", width: 1642, height: 2048, sha256: "de8bdbfce700f2e94b33e6a99179da4a2ae13ddd6cbc52a5a286f17ad22dc51e" },
  { entrySlug: "sump-eel", rung: "NONE", filename: "sump-eel-none.webp", width: 1365, height: 2048, sha256: "de46839409ffffba68b9cd666da7e6a76ac8b1af174d7ef4c7599c31d049fd1f" },
  { entrySlug: "sump-eel", rung: "MINOR", filename: "sump-eel-minor.webp", width: 1639, height: 2048, sha256: "9a67d2cf4861d451f487b6633110a73b52aada9ae338c479e7dd3ebef9ac7b1a" },
  { entrySlug: "sump-eel", rung: "FUNCTIONAL", filename: "sump-eel-functional.webp", width: 1365, height: 2048, sha256: "8e74e4dfd5d80e6118594b53cff300d7f053ff4046bde74159a8e5816d0f421f" },
  { entrySlug: "sump-eel", rung: "ADVANCED", filename: "sump-eel-advanced.webp", width: 1365, height: 2048, sha256: "11bcd822f7305a4d8ddfb3839dbd3220552305ffde19951b10c38f9fa0c4d0af" },
  { entrySlug: "sump-eel", rung: "ABERRANT", filename: "sump-eel-aberrant.webp", width: 1639, height: 2048, sha256: "a8078dc5813d0fec325ce019c3bfd6b07b040259a0d482329876b1f7edb27db3" },
  { entrySlug: "latchhound", rung: "NONE", filename: "latchhound-none.webp", width: 1365, height: 2048, sha256: "dd2cc7fd80a1f3bc74277c42b5552ba317744d006a0b83ac028d732c5e88da75" },
  { entrySlug: "latchhound", rung: "MINOR", filename: "latchhound-minor.webp", width: 1363, height: 2048, sha256: "e81caa4d5b960830bc69e50635333de5f76550f00d5c15cb57badfa1fb995024" },
  { entrySlug: "latchhound", rung: "FUNCTIONAL", filename: "latchhound-functional.webp", width: 1365, height: 2048, sha256: "9b528fb454093ee51079be04df9edc31d131609e5f8d852f1f56a6e145cc9db9" },
  { entrySlug: "latchhound", rung: "ADVANCED", filename: "latchhound-advanced.webp", width: 1365, height: 2048, sha256: "b71280fd52ae96cf9ecf81fd8f2604ae4fdfbc94788fba1a526047a31c19b80b" },
  { entrySlug: "latchhound", rung: "ABERRANT", filename: "latchhound-aberrant.webp", width: 1365, height: 2048, sha256: "d99899b505b76ce9e7dc8441ec89f0fe953a571e8fe031230ab50476684457ca" },
  { entrySlug: "glasswing-kite", rung: null, filename: "glasswing-kite.webp", width: 1365, height: 2048, sha256: "5c734ff8521b8afc88b07abf81731cbf72a79ab34ee1aeb3279fae4ff22e0241" },
  { entrySlug: "spore-lantern-colony", rung: null, filename: "spore-lantern-colony.webp", width: 1639, height: 2048, sha256: "5d3353d34f7ad8a0bb4d9e581ee625c41a67c64012d30cacfcea3ffd80bba263" },
  { entrySlug: "maintenance-unit-m-17", rung: null, filename: "maintenance-unit-m-17.webp", width: 1639, height: 2048, sha256: "22291b342e4103356216ebe1f0429ac9b946322b7e60dfc345cd6eb9a4fc53bc" },
  { entrySlug: "bloommarked-remnant", rung: null, filename: "bloommarked-remnant.webp", width: 1639, height: 2048, sha256: "6e1fe1f597ed04680fb504e078626fe056fa48b13764caabcdb27ab9bfe6ee69" },
  { entrySlug: "switchmother", rung: null, filename: "switchmother.webp", width: 1365, height: 2048, sha256: "4ed7e48a30dd9d78eb4db74fff1dfa3751d2500ee7e6c1af15c21fba02129b25" },
  { entrySlug: "the-last-shift", rung: null, filename: "the-last-shift.webp", width: 1230, height: 2048, sha256: "7b7d18a32c1f4459c64a2832f9eaebd1a032389633901ae15369a010124a0c9b" },
] as const;

const byEntry = new Map<string, BloomfallCreatureArtAsset[]>();
for (const asset of bloomfallCreatureArtAssets) {
  const list = byEntry.get(asset.entrySlug) ?? [];
  list.push(asset);
  byEntry.set(asset.entrySlug, list);
}

export function bloomfallCreatureArtUrl(asset: BloomfallCreatureArtAsset) {
  return `/codex-art/${bloomfallCreatureArtPackage}/${asset.filename}`;
}

/** The plate for one rung of one species, or null when it has not been drawn. */
export function getBloomfallCreatureRungArt(entrySlug: string, rung: BloomfallMutationRung): BloomfallCreatureArtAsset | null {
  return byEntry.get(entrySlug)?.find((asset) => asset.rung === rung) ?? null;
}

/**
 * The plate a dossier wears at the top.
 *
 * An adaptive species leads with its baseline, because that is the animal the
 * reader is meant to recognise before the ladder deforms it. Anything else has
 * one plate and wears that. The two named Aberrants that are a rung of another
 * species — the Bellwether and Old Drowner — borrow that rung's plate, since it
 * is a picture of them.
 */
const aberrantOf: Readonly<Record<string, string>> = {
  "the-bellwether": "blackbloom-hart",
  "old-drowner": "mirejaw",
  "the-slow-hill": "rootback-grazer",
  "the-braid": "sump-eel",
  "the-groundfault": "latchhound",
};

export function getBloomfallCreatureHeroArt(entrySlug: string): BloomfallCreatureArtAsset | null {
  const lineage = aberrantOf[entrySlug];
  if (lineage) return getBloomfallCreatureRungArt(lineage, "ABERRANT");
  const own = byEntry.get(entrySlug);
  if (!own?.length) return null;
  return own.find((asset) => asset.rung === "NONE") ?? own.find((asset) => asset.rung === null) ?? own[0]!;
}

/** Every dossier this package covers, for the audit. */
export const bloomfallCreatureArtEntrySlugs = [...new Set(bloomfallCreatureArtAssets.map((asset) => asset.entrySlug))].sort();
