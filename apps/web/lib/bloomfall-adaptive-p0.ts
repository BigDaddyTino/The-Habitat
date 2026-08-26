import { bloomfallCreatureEnhancements } from "@/lib/bloomfall-creature-enhancements";

export const bloomfallAdaptiveP0Package = "bloomfall-adaptive-p0" as const;
export const bloomfallAdaptiveP0Version = "p0-owner-review-1" as const;

export const bloomfallAdaptiveP0Statuses = ["APPROVED_CANDIDATE", "REVISE", "REJECTED", "REUSED_V3"] as const;
export type BloomfallAdaptiveP0Status = (typeof bloomfallAdaptiveP0Statuses)[number];

export type BloomfallAdaptiveP0Scores = {
  aaa: number;
  anatomy: number;
  realism: number;
  materials: number;
  continuity: number;
  artifact: number;
  canon: number;
  matureImpact: number;
};

export type BloomfallAdaptiveP0Asset = {
  id: string;
  entitySlug: "blackbloom-hart" | "latchhound" | "the-last-shift" | "the-bellwether" | "the-mutation-belt" | "the-shattercore" | "reactor-cycles";
  entity: string;
  state: string;
  purpose: "STATE_REFERENCE" | "HERO" | "CONTINUITY_REFERENCE" | "COMPARISON_REFERENCE" | "ENVIRONMENT_REFERENCE";
  filename: string;
  width: number;
  height: number;
  sha256: string;
  generationIteration: number | null;
  status: BloomfallAdaptiveP0Status;
  existingV3Reused: boolean;
  codexDevelopmentBinding: string | null;
  physicalChanges: string;
  functionalChanges: string;
  continuityMarkers: readonly string[];
  alt: string;
  scores: BloomfallAdaptiveP0Scores;
  reviewNote?: string;
};

const score = (aaa: number, anatomy: number, realism: number, materials: number, continuity: number, artifact: number, canon: number, matureImpact: number): BloomfallAdaptiveP0Scores => ({ aaa, anatomy, realism, materials, continuity, artifact, canon, matureImpact });

/**
 * Authoritative Prompt C review manifest. APPROVED_CANDIDATE files live in the
 * immutable review package; REVISE attempts remain as evidence and are never
 * resolved by the Codex. REUSED_V3 entries point to the separately locked V3
 * package and are recorded here only to make the review lineage explicit.
 */
export const bloomfallAdaptiveP0Assets: readonly BloomfallAdaptiveP0Asset[] = [
  {
    id: "hart-gradient-sensing", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Gradient-Sensing Hart", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-gradient-sensing.png", width: 1122, height: 1402, sha256: "d4c83effeef16abcda0971121db23fd784fcfbe7041e46c8aecd04b7fbf7c0d7", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "blackbloom-hart:known-states:0",
    physicalChanges: "Lean adult hart with folded conductive antler membranes and restrained neck/forequarter charge nodules.", functionalChanges: "Reads mineral, root, and saturation gradients and bleeds small charges into ground.", continuityMarkers: ["same adult", "same antler branch map", "left ear notch", "flank scar", "four ordinary hooved limbs"], alt: "Blackbloom Hart baseline with folded conductive antler membranes on Mutation Belt ground.", scores: score(9.4, 9.7, 9.4, 9.3, 9.7, 9.5, 9.7, 9.1),
  },
  {
    id: "hart-charge-raised", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Charge-Raised", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-charge-raised.png", width: 1122, height: 1402, sha256: "3611be98f685941d59e0222a470fef41927a5c6245db0343ea1b29629e759b04", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "blackbloom-hart:known-states:1",
    physicalChanges: "The same membranes engorge and rise; vessels darken and spinal coat lifts under acute charge.", functionalChanges: "Improves short-range pressure sensing and prepares rapid grounding.", continuityMarkers: ["same adult", "same antler branches", "left ear notch", "flank scar", "unchanged limb count"], alt: "Charge-Raised Blackbloom Hart with lifted antler membranes and visible vascular charge.", scores: score(9.3, 9.6, 9.3, 9.4, 9.6, 9.4, 9.6, 9.2),
  },
  {
    id: "hart-grounded-crown", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Grounded Crown", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-grounded-crown.png", width: 1122, height: 1402, sha256: "1c5aff1d006aca90d04e9e9b24d63574fcfc4de251fdf894f9bff6fa21c21e2b", generationIteration: 2, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "blackbloom-hart:known-states:2",
    physicalChanges: "Mineralized antler tips, insulating neck bands, and broadened split hoof edges follow contact paths.", functionalChanges: "Routes dangerous charge from the heart and stabilizes movement across conductive terrain.", continuityMarkers: ["same adult", "same skull", "same antler branches", "left ear notch", "flank scar", "four grounded hooves"], alt: "Grounded Crown Blackbloom Hart with mineral antler tips, neck insulation, and widened hooves.", scores: score(9.5, 9.7, 9.4, 9.6, 9.7, 9.5, 9.8, 9.3),
  },
  {
    id: "hart-storm-tuned-relay", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Storm-Tuned Relay", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-storm-tuned-relay.png", width: 1122, height: 1402, sha256: "e324ed221f22406e8930ef0518587c5a50f0d5ab43644ff08862b793a6d7d01c", generationIteration: 2, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "blackbloom-hart:known-states:3",
    physicalChanges: "Broadened original antler membranes, exactly two shoulder charge sacs, and a continuous neck-to-foreleg insulation route.", functionalChanges: "Relays saturation direction through a herd and stores one mass-withdrawal grounding event.", continuityMarkers: ["same adult", "same antler branch map", "left ear notch", "flank scar", "two shoulder sacs only", "four limbs"], alt: "Storm-Tuned Relay Blackbloom Hart with broad membranes and paired shoulder charge sacs.", scores: score(9.6, 9.8, 9.4, 9.6, 9.8, 9.5, 9.8, 9.5),
  },
  {
    id: "hart-long-graze-hero", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Long Graze Herd", purpose: "HERO", filename: "blackbloom-hart-long-graze-hero.png", width: 1672, height: 941, sha256: "87dfb3f7723daa98cf66c6512229ba7b3d822bd9297ed91545050fc49eebabd8", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "blackbloom-hart:hero-support",
    physicalChanges: "A Storm-Tuned Relay leads recognizable baseline and intermediate harts through Long Graze.", functionalChanges: "Shows herd warning, grounding, spacing, and guided withdrawal in habitat.", continuityMarkers: ["matched state anatomy", "four-limbed herd", "Long Graze scale", "Bellwether remains distinct"], alt: "Blackbloom Hart herd crossing Long Graze behind a Storm-Tuned Relay.", scores: score(9.6, 9.6, 9.5, 9.5, 9.6, 9.6, 9.8, 9.4),
  },
  {
    id: "latchhound-corridor-latcher", entitySlug: "latchhound", entity: "Latchhound", state: "Corridor Latcher", purpose: "STATE_REFERENCE", filename: "latchhound-corridor-latcher.png", width: 1122, height: 1402, sha256: "72d60174dc856d47196131c1490b10fbf7d3b44e33a06f0eac85964f7e7214bd", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "latchhound:known-states:0",
    physicalChanges: "Lean canine quadruped with one integrated jaw plate, cablelike tendon paths, gripping claws, and restrained charge tissue.", functionalChanges: "Reads powered machinery and shares vibration/current through a pack.", continuityMarkers: ["same canine skull", "left jaw plate", "four limbs", "same tendon paths", "same coat and flank mark"], alt: "Baseline Corridor Latcher with a single jaw plate and cablelike tendons beside machinery.", scores: score(9.5, 9.8, 9.5, 9.6, 9.8, 9.6, 9.8, 9.3),
  },
  {
    id: "latchhound-live-latched", entitySlug: "latchhound", entity: "Latchhound", state: "Live-Latched", purpose: "STATE_REFERENCE", filename: "latchhound-live-latched.png", width: 1122, height: 1402, sha256: "1834248f6ac24958cfc8a0ba26e2f4003940e6aa14b39502dfa5dba878ae740e", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "latchhound:known-states:1",
    physicalChanges: "Jaw seams open for heat shedding, original tendons pull taut, sensory tissue swells, and contact pads darken.", functionalChanges: "Maps a changing live circuit while dumping unsafe heat and charge.", continuityMarkers: ["same canine skull", "same jaw plate", "four limbs", "same coat and flank mark", "original tendon map"], alt: "Live-Latched hound with open jaw vents, taut tendons, and darkened contact pads.", scores: score(9.4, 9.7, 9.4, 9.6, 9.7, 9.5, 9.7, 9.4),
  },
  {
    id: "latchhound-circuit-stalker", entitySlug: "latchhound", entity: "Latchhound", state: "Circuit Stalker", purpose: "STATE_REFERENCE", filename: "latchhound-circuit-stalker.png", width: 1122, height: 1402, sha256: "5167905a8dfccd2c979aec6b9c7d7f7b106eb3313a479455dc04ffd5d65bc44b", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "latchhound:known-states:2",
    physicalChanges: "Broader insulating pads, split cable-tray claws, deeper jaw resonance chambers, and braced shoulder tendons.", functionalChanges: "Traverses powered vertical terrain and directs discharge through a selected circuit path.", continuityMarkers: ["same canine skull", "same jaw plate", "four limbs", "same coat and flank mark", "load-path anatomy"], alt: "Circuit Stalker Latchhound with insulated pads and split claws on a cable gantry.", scores: score(9.6, 9.8, 9.5, 9.6, 9.8, 9.6, 9.8, 9.5),
  },
  {
    id: "latchhound-pack-relay", entitySlug: "latchhound", entity: "Latchhound", state: "Pack Relay", purpose: "STATE_REFERENCE", filename: "latchhound-pack-relay.png", width: 1122, height: 1402, sha256: "1c7c789e930004c993488ad82601aa2686e2e5a3b3acec1dd619e823cd46d257", generationIteration: 2, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "latchhound:known-states:3",
    physicalChanges: "Paired low shoulder sensory cable-combs, deeper rib capacitors, and a broader jaw plate remain within the canine load plan.", functionalChanges: "Coordinates a pack across connected machines and stores one shared-route discharge.", continuityMarkers: ["same canine skull", "same jaw plate lineage", "four limbs", "same coat and flank mark", "sensory arrays are not wings"], alt: "Pack Relay Latchhound with paired shoulder sensory combs and deeper rib capacitors.", scores: score(9.6, 9.8, 9.5, 9.7, 9.8, 9.6, 9.8, 9.6),
  },
  {
    id: "latchhound-splicefield-hero", entitySlug: "latchhound", entity: "Latchhound", state: "Splicefield Pack", purpose: "HERO", filename: "latchhound-splicefield-pack-hero.png", width: 1672, height: 941, sha256: "1b67f9f79c53baf0857c732db6ced46f9e3b07a47ab212f9b1bb2513e82b91ae", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "latchhound:hero-support",
    physicalChanges: "A Pack Relay and lower states hunt as one recognizable pack in a connected switchyard.", functionalChanges: "Demonstrates machinery-bound triangulation and coordinated route pressure.", continuityMarkers: ["matched state anatomy", "four limbs per animal", "connected industrial habitat", "Switchmother remains distinct"], alt: "Latchhound pack triangulating through the connected machinery of Splicefield.", scores: score(9.6, 9.6, 9.6, 9.7, 9.7, 9.6, 9.8, 9.5),
  },
  {
    id: "last-shift-pre-bloomfall", entitySlug: "the-last-shift", entity: "The Last Shift", state: "Pre-Bloomfall Shift Context", purpose: "CONTINUITY_REFERENCE", filename: "the-last-shift-pre-bloomfall-context.png", width: 1122, height: 1402, sha256: "53b8c77f815a47bf108faca2406f297587f53b123628500d1a664a67dbce92db", generationIteration: 2, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "the-last-shift:continuity:before",
    physicalChanges: "Three unaltered Southreach workers shown with distinct faces, PPE, uniforms, and tools at their operating bay.", functionalChanges: "Establishes the real maintenance task, interfaces, and people required to judge the later collective.", continuityMarkers: ["forewoman with striped white hard hat and torque wrench", "older moustached tester with green patch", "younger face-shielded worker with red forearm wrap and valve key", "same valves, hoist, cabinet, and pump bay"], alt: "Three Southreach workers maintaining valves and controls in the bay before Bloomfall.", scores: score(9.6, 9.8, 9.7, 9.7, 9.8, 9.7, 9.8, 9.2),
  },
  {
    id: "last-shift-current-collective", entitySlug: "the-last-shift", entity: "The Last Shift", state: "Current Collective", purpose: "HERO", filename: "the-last-shift-current-collective.png", width: 1672, height: 941, sha256: "06934a4921151ebfd2c0b6134df7883aa96c894951c775465f6cdf5263e3a107", generationIteration: 1, status: "APPROVED_CANDIDATE", existingV3Reused: false, codexDevelopmentBinding: "the-last-shift:continuity:current",
    physicalChanges: "The same workers, workwear, tools, and bay are severely fused into physically routed organic-industrial service structures.", functionalChanges: "Hands and tools continue a recognizable emergency procedure without proving whether any individual remains conscious.", continuityMarkers: ["same three worker identities", "same PPE color/marks", "same three tools", "same bay equipment", "no leader or consciousness core", "cables visibly terminate"], alt: "The Last Shift collective using familiar tools within the same ruined Southreach maintenance bay.", scores: score(9.7, 9.5, 9.6, 9.8, 9.8, 9.6, 9.9, 9.9),
  },

  { id: "revise-hart-grounded-crown-1", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Grounded Crown", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-grounded-crown-iteration-1-revise.png", width: 1122, height: 1402, sha256: "a589b4d02984324945ff345e42ceedc064e6033068c89d6682a2a147748228ec", generationIteration: 1, status: "REVISE", existingV3Reused: false, codexDevelopmentBinding: null, physicalChanges: "Early Grounded Crown treatment.", functionalChanges: "Grounding adaptation did not read clearly enough at hoof contact.", continuityMarkers: ["lineage retained", "hoof function too soft"], alt: "Revised-out Grounded Crown concept with insufficiently clear hoof grounding anatomy.", scores: score(8.7, 9.2, 9.1, 9.0, 9.3, 9.2, 8.6, 8.8), reviewNote: "Revise: strengthen neck insulation and hoof-contact function." },
  { id: "revise-hart-storm-relay-1", entitySlug: "blackbloom-hart", entity: "Blackbloom Hart", state: "Storm-Tuned Relay", purpose: "STATE_REFERENCE", filename: "blackbloom-hart-storm-tuned-relay-iteration-1-revise.png", width: 1122, height: 1402, sha256: "bd91c49f9c3bd9a5f55add2990ca5e8a714a489062d067de6e9f8b19d88a45c9", generationIteration: 1, status: "REVISE", existingV3Reused: false, codexDevelopmentBinding: null, physicalChanges: "Early relay treatment added an unapproved hindquarter glow mass.", functionalChanges: "Shoulder storage route became anatomically ambiguous.", continuityMarkers: ["lineage retained", "extra hind tissue removed in final"], alt: "Revised-out Storm-Tuned Relay with an unapproved hindquarter charge mass.", scores: score(8.1, 8.5, 8.8, 9.0, 8.9, 9.1, 8.2, 8.8), reviewNote: "Revise: exactly two shoulder sacs; remove unrelated hind glow." },
  { id: "revise-latchhound-pack-relay-1", entitySlug: "latchhound", entity: "Latchhound", state: "Pack Relay", purpose: "STATE_REFERENCE", filename: "latchhound-pack-relay-iteration-1-revise.png", width: 1122, height: 1402, sha256: "e8e7f48b79e0fde8d217f463b4770f6d35bb00c33ae428b2d0b5792b1e38649f", generationIteration: 1, status: "REVISE", existingV3Reused: false, codexDevelopmentBinding: null, physicalChanges: "Early dorsal sensory arrays read as bat wings.", functionalChanges: "Relay anatomy was visually generic and the background over-signaled lightning.", continuityMarkers: ["four limbs retained", "wing-like array removed in final"], alt: "Revised-out Pack Relay with sensory arrays that read too much like wings.", scores: score(7.9, 8.8, 8.5, 8.8, 8.4, 8.9, 7.8, 8.7), reviewNote: "Revise: replace wing read with low cable-comb sensory continuations." },
  { id: "revise-last-shift-before-1", entitySlug: "the-last-shift", entity: "The Last Shift", state: "Pre-Bloomfall Shift Context", purpose: "CONTINUITY_REFERENCE", filename: "the-last-shift-pre-bloomfall-context-iteration-1.png", width: 1003, height: 1568, sha256: "a6502d18965f91f1fa2d3095520ac6a6f3845a1339ab76ec6590f398c2d9e051", generationIteration: 1, status: "REVISE", existingV3Reused: false, codexDevelopmentBinding: null, physicalChanges: "Strong worker and bay continuity reference in a non-matching narrow frame.", functionalChanges: "Maintenance action remained legible, but comparison format missed the required 4:5 target.", continuityMarkers: ["same three workers", "same tools", "wrong aspect"], alt: "Revised-out pre-Bloomfall worker reference in an overly narrow frame.", scores: score(8.8, 9.6, 9.5, 9.5, 9.7, 9.5, 9.5, 8.5), reviewNote: "Revise: preserve content while correcting to the 4:5 reference format." },

  { id: "reuse-bellwether", entitySlug: "the-bellwether", entity: "The Bellwether", state: "Final Exceptional Aberrant", purpose: "COMPARISON_REFERENCE", filename: "the-bellwether.png", width: 1672, height: 941, sha256: "d68bc35a655fbcc2f9e66092b403710cf822838ee50e01b5c482ef70b6e11784", generationIteration: null, status: "REUSED_V3", existingV3Reused: true, codexDevelopmentBinding: "blackbloom-hart:lineage-comparison", physicalChanges: "Locked owner-approved Hart-lineage exceptional anatomy.", functionalChanges: "Comparison only; never presented as a fifth Hart state.", continuityMarkers: ["locked V3", "exceptional lineage remains separate"], alt: "Owner-approved Bellwether hero used only for Hart-lineage comparison.", scores: score(9.5, 9.5, 9.5, 9.5, 9.4, 9.6, 9.9, 9.6) },
  { id: "reuse-mutation-belt", entitySlug: "the-mutation-belt", entity: "The Mutation Belt", state: "Environment", purpose: "ENVIRONMENT_REFERENCE", filename: "the-mutation-belt.png", width: 1672, height: 941, sha256: "f30f9f049f13e48ea7b312ada29a271e5f100db5eb1fb46dd5c36ccff59523a1", generationIteration: null, status: "REUSED_V3", existingV3Reused: true, codexDevelopmentBinding: "blackbloom-hart:environment-reference", physicalChanges: "Locked owner-approved Belt environment.", functionalChanges: "Grounds Hart palette, scale, and regional materials.", continuityMarkers: ["locked V3", "restrained cyan/amber", "rugged Belt ecology"], alt: "Owner-approved Mutation Belt environment reference.", scores: score(9.5, 9.5, 9.6, 9.6, 9.5, 9.6, 9.9, 9.4) },
  { id: "reuse-shattercore", entitySlug: "the-shattercore", entity: "The Shattercore", state: "Environment", purpose: "ENVIRONMENT_REFERENCE", filename: "the-shattercore.png", width: 1672, height: 941, sha256: "6a63118ea898f69d2ed8043d67a2564b801773a0677a4163b0fc99a1e87d4b72", generationIteration: null, status: "REUSED_V3", existingV3Reused: true, codexDevelopmentBinding: "latchhound:environment-reference", physicalChanges: "Locked owner-approved Shattercore environment.", functionalChanges: "Grounds Latchhound electrical habitat and industrial material language.", continuityMarkers: ["locked V3", "connected infrastructure", "restrained emission"], alt: "Owner-approved Shattercore environment reference.", scores: score(9.5, 9.4, 9.6, 9.7, 9.5, 9.6, 9.9, 9.5) },
  { id: "reuse-southreach-interior", entitySlug: "reactor-cycles", entity: "Southreach Complex Interior", state: "Environment", purpose: "ENVIRONMENT_REFERENCE", filename: "southreach-complex-interior.png", width: 1672, height: 941, sha256: "2627d93017f2c27571f5b1393ddb25a0e1f12f8b954165679309d6411d325f71", generationIteration: null, status: "REUSED_V3", existingV3Reused: true, codexDevelopmentBinding: "the-last-shift:environment-reference", physicalChanges: "Locked owner-approved Southreach interior.", functionalChanges: "Grounds bay materials and industrial infrastructure continuity.", continuityMarkers: ["locked V3", "real service routing", "Southreach material language"], alt: "Owner-approved Southreach Complex interior reference.", scores: score(9.5, 9.4, 9.6, 9.7, 9.5, 9.6, 9.9, 9.5) },
] as const;

export const bloomfallAdaptiveP0SelectedAssets = bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "APPROVED_CANDIDATE");
export const bloomfallAdaptiveP0RevisionAssets = bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "REVISE");
export const bloomfallAdaptiveP0ReusedAssets = bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "REUSED_V3");

const selectedByEntity = new Map(
  ["blackbloom-hart", "latchhound", "the-last-shift"].map((slug) => [slug, bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.entitySlug === slug)]),
);

export function getBloomfallAdaptiveP0Presentation(entrySlug: string) {
  const enhancement = bloomfallCreatureEnhancements.find((entry) => entry.slug === entrySlug);
  if (!enhancement) return null;
  if (entrySlug === "glasswing-kite") return { kind: "NONE" as const, enhancement, assets: [] as readonly BloomfallAdaptiveP0Asset[] };
  const assets = selectedByEntity.get(entrySlug);
  if (!assets) return null;
  return { kind: entrySlug === "the-last-shift" ? "EXCEPTIONAL" as const : "ADAPTIVE" as const, enhancement, assets };
}

export function bloomfallAdaptiveP0AssetUrl(asset: BloomfallAdaptiveP0Asset): string {
  const packageName = asset.existingV3Reused ? "bloomfall-v3" : bloomfallAdaptiveP0Package;
  return `/codex-art/${packageName}/${asset.filename}`;
}
