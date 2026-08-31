/**
 * The campaign's cast: species, origins, professions, the mechanical weight
 * of individual talent nodes, the archetype builds, and the opposition.
 *
 * Builds are assembled from the REAL tree data, so a build that breaks a
 * prerequisite, takes both sides of a fork, or overspends the level-100
 * budget fails validation instead of quietly simulating something the game
 * would never allow.
 */

import { getTalentClass, talentPointsAtLevel, type TalentNode } from "../../lib/talent-trees";
import type { AttackProfile, AttributeKey, NodeEffect, OriginProfile, ProfessionProfile, SimCharacter, SpeciesProfile } from "./talent-sim";
import { attributesFor, mergeEffects } from "./talent-sim";

const caps = (conditioning: number, coordination: number, resilience: number, acuity: number, composure: number, conductivity: number) =>
  ({ conditioning, coordination, resilience, acuity, composure, conductivity });

export const species: SpeciesProfile[] = [
  { slug: "human", name: "Human", caps: caps(8, 8, 8, 8, 8, 8), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, note: "No strings, no edge." },
  { slug: "returnees", name: "Returnee", caps: caps(7, 8, 7, 9, 9, 7), corruptionPace: 1, mendPace: 0.5, permadeath: false, unreadable: false, note: "Long Memory; slow to mend; reclamation costs ten percent more." },
  { slug: "carriers", name: "Carrier", caps: caps(8, 8, 8, 8, 7, 9), corruptionPace: 2 / 3, mendPace: 1, permadeath: false, unreadable: false, note: "Tolerance � the ladder's only discount, and it is inherited." },
  { slug: "chartered", name: "Chartered", caps: caps(9, 8, 8, 7, 7, 9), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, specification: "conditioning", note: "Built for one thing, on a clock nobody at the table can read." },
  { slug: "the-unregistered", name: "Unregistered", caps: caps(8, 8, 8, 8, 9, 8), corruptionPace: 1, mendPace: 1, permadeath: true, unreadable: true, note: "Every death is true death. Instruments return noise." },
  { slug: "the-latent", name: "Latent", caps: caps(8, 8, 8, 8, 8, 9), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, note: "Surfaced: one ceiling became nine." },
];

export const origins: OriginProfile[] = [
  { slug: "none", name: "None", economy: "none", startingPhase: 0, composureBonus: 1 },
  { slug: "born", name: "Born", economy: "pool", startingPhase: 0, composureBonus: 0 },
  { slug: "gifted", name: "Gifted", economy: "pool", startingPhase: 0, composureBonus: 0 },
  { slug: "infused", name: "Infused", economy: "charges", startingPhase: 1, composureBonus: 0 },
];

export const professions: ProfessionProfile[] = [
  { slug: "medicine", name: "Medicine (master)", effects: { partyRecovery: 2, partyDyingClock: 2 } },
  { slug: "logistics", name: "Logistics (master)", effects: { extraDoses: 2, ammoMultiplier: 1.5 } },
  { slug: "chemistry", name: "Chemistry (master)", effects: { corruptionPace: 0.7, extraDoses: 1 } },
  { slug: "engineering", name: "Engineering (master)", effects: { extraPlates: 1 } },
  { slug: "culinary", name: "Culinary (master)", effects: { composureRestore: 2, partyRecovery: 1 } },
  { slug: "xenobiology", name: "Xenobiology (master)", effects: { partyRecovery: 1, extraPlates: 1 } },
  { slug: "none", name: "No trade", effects: {} },
];

/**
 * What a node does to the arithmetic. Nodes absent from this map are
 * narrative in-sim � real in play, nothing here to test. Keys are
 * `<class>/<node id>`, so a renamed node fails validation loudly.
 */
export const nodeEffects: Record<string, NodeEffect> = {
  // ---------------------------------------------------------------- Bastion
  "bastion/stand-fast": { accuracy: 0.03 },
  "bastion/spit-and-stand": { selfRepair: 0.12 },
  "bastion/dig-in": { incoming: 0.9 },
  "bastion/hold-the-line": { partyMitigation: 0.1 },
  "bastion/written-defeat": { partyMitigation: 0.1, dyingClock: 1 },
  "bastion/stand-over-them": { partyMitigation: 0.08 },
  "bastion/meet-the-wall": { control: 0.1 },
  "bastion/look-at-me": { partyMitigation: 0.15, incoming: 1.12 },
  "bastion/one-more-hit": { extraPlates: 1 },
  "bastion/lend-the-wall": { partyMitigation: 0.08 },
  "bastion/rooted": { incoming: 0.95 },
  "bastion/between": { partyMitigation: 0.12, incoming: 1.05 },
  "bastion/immovable": { incoming: 0.85, toughness: 1 },
  "bastion/point-man": { accuracy: 0.03 },
  "bastion/doorway": { damageBonus: 0.3, initiative: 0.1 },
  "bastion/shaped-charge": { damageBonus: 0.2 },
  "bastion/through-the-gap": { initiative: 0.1 },
  "bastion/rolling-breach": { extraAction: 0.15 },
  "bastion/controlled-collapse": { damageBonus: 0.5 },
  "bastion/unstoppable": { damageBonus: 0.6, initiative: 0.15 },
  "bastion/second-nature": { castCost: 0.85 },
  "bastion/seal-the-breach": { partyMitigation: 0.08 },
  "bastion/muzzle": { control: 0.18, partyMitigation: 0.08 },
  "bastion/first-chrome": { chrome: true, damageBonus: 0.1 },
  "bastion/room-for-more": { damageBonus: 0.1 },
  "bastion/knuckle-plate": { damageBonus: 0.2 },
  "bastion/faraday-bones": { hardenedChrome: true },
  "bastion/past-the-governor": { damageBonus: 0.3 },
  "bastion/come-take-it": {},
  "bastion/walking-armoury": { partyMitigation: 0.12, extraPlates: 1 },
  "bastion/slow-leak": { selfRepair: 0.1 },
  "bastion/field-dressing": { selfRepair: 0.12 },
  "bastion/walk-it-off": { toughness: 1 },
  "bastion/pain-ledger": { damageBonus: 0.2 },
  "bastion/on-your-feet": { partyHeal: 1 },
  "bastion/argue-with-the-clock": { dyingClock: 3 },
  "bastion/refuse-the-ground": { refuseDown: true },
  "bastion/three-seconds": { damageBonus: 0.6, initiative: 0.2 },

  // ---------------------------------------------------------------- Spector
  "spector/nothing-underfoot": { concealment: 0.08 },
  "spector/taped-and-blacked": { concealment: 0.08 },
  "spector/read-the-room": { detection: 0.1 },
  "spector/patience": { accuracy: 0.05 },
  "spector/neck-hairs": { initiative: 0.12 },
  "spector/second-entry": { initiative: 0.1 },
  "spector/one-breath": { accuracy: 0.06 },
  "spector/cold-adrenaline": { accuracy: 0.05 },
  "spector/clean-exit": { refuseDown: true },
  "spector/steady-breath": { accuracy: 0.05 },
  "spector/mil-dot-mind": { accuracy: 0.04 },
  "spector/double-tap": { damageBonus: 0.3 },
  "spector/windage": { accuracy: 0.04 },
  "spector/seam-finder": { damageBonus: 0.4 },
  "spector/cold-barrel": { damageBonus: 0.4, initiative: 0.1 },
  "spector/called-shot": { damageBonus: 0.7, accuracy: 0.06 },
  "spector/signature-shot": { damageBonus: 0.9 },
  "spector/old-floorboards": { concealment: 0.06 },
  "spector/fade-drill": { concealment: 0.1 },
  "spector/blur": { concealment: 0.12 },
  "spector/static": { control: 0.08 },
  "spector/crowd-skin": { concealment: 0.1 },
  "spector/dim": { concealment: 0.1, control: 0.05 },
  "spector/blind-spot": { concealment: 0.15 },
  "spector/never-here": { concealment: 0.22 },
  "spector/pocket-arsenal": { ammo: 0.2 },
  "spector/pocket-thunder": { damageBonus: 0.3 },
  "spector/kill-the-circuit": { control: 0.12 },
  "spector/daisy-chain": { damageBonus: 0.4 },
  "spector/credential": {},
  "spector/clean-water": { selfRepair: 0.06 },
  "spector/search-pattern": { detection: 0.12, initiative: 0.08 },
  "spector/agreement": { initiative: 0.1 },
  "spector/tell": { detection: 0.1 },
  "spector/one-signature": {},

  // ---------------------------------------------------------------- Conduit
  "conduit/envelope": { castCost: 0.95 },
  "conduit/name-the-cast": { detection: 0.12 },
  "conduit/sustain": { accuracy: 0.04 },
  "conduit/tight-seals": { resourceCap: 4 },
  "conduit/controlled-burn": { castCost: 0.92 },
  "conduit/deep-pool": { resourceCap: 26 },
  "conduit/live-wire": { resourcePerHit: 2.2 },
  "conduit/twin-school": { damageBonus: 0.2 },
  "conduit/edge": { damageBonus: 0.4, castCost: 0.9 },
  "conduit/artillery-eyes": { accuracy: 0.06 },
  "conduit/war-licence": { damageBonus: 0.2 },
  "conduit/field-control": { control: 0.12 },
  "conduit/battle-channel": { accuracy: 0.05 },
  "conduit/neat-lines": { partyMitigation: 0.06 },
  "conduit/certified-strike": { damageBonus: 0.4 },
  "conduit/master-of-war": { damageBonus: 0.8 },
  "conduit/hands-that-listen": { partyHeal: 0.4 },
  "conduit/healers-licence": { partyHeal: 1 },
  "conduit/triage-sense": { detection: 0.08 },
  "conduit/thread-and-sinew": { partyHeal: 0.5 },
  "conduit/surgeons-calm": { partyHeal: 0.6 },
  "conduit/share-the-cost": { partyHeal: 0.6, incoming: 1.08 },
  "conduit/debridement": { partyHeal: 0.8 },
  "conduit/rebuild": { partyHeal: 1.2, partyMitigation: 0.05 },
  "conduit/standing-ward": { partyMitigation: 0.08 },
  "conduit/brace-the-world": { partyMitigation: 0.1 },
  "conduit/certified-boundary": { control: 0.12 },
  "conduit/dissolution": { damageBonus: 0.6 },
  "conduit/anchor": { partyMitigation: 0.08 },
  "conduit/seed": { control: 0.1 },
  "conduit/doctrine": { control: 0.15 },
  "conduit/register": { detection: 0.06 },
  "conduit/echo-read": { detection: 0.08 },
  "conduit/steady-the-hand": { extraAction: 0.12 },
  "conduit/call": { partyHeal: 0.5 },

  // ----------------------------------------------------------------- Surger
  "surger/first-dose": { resourceCap: 4 },
  "surger/honest-rig": { castCost: 0.92 },
  "surger/vein-map": { concealment: 0.06 },
  "surger/hot-load": { resourceCap: 4 },
  "surger/soft-landing": { selfRepair: 0.06 },
  "surger/clean-burn": { castCost: 0.9 },
  "surger/red-line": { damageBonus: 0.5, incoming: 1.06 },
  "surger/overrun": { resourceCap: 8 },
  "surger/surge": { burst: 6, damageBonus: 0.3 },
  "surger/headlong": { initiative: 0.15 },
  "surger/wrecking-weight": { damageBonus: 0.3 },
  "surger/flywheel": { resourcePerHit: 1.6, damageBonus: 0.2 },
  "surger/brace": { incoming: 0.92 },
  "surger/ride-the-hit": { resourcePerWound: 2.5, damageBonus: 0.2 },
  "surger/arrest": { control: 0.12 },
  "surger/return": { damageBonus: 0.8 },
  "surger/adjust": { accuracy: 0.04 },
  "surger/quick-molt": { extraAction: 0.08 },
  "surger/battle-form": { damageBonus: 0.3, toughness: 1 },
  "surger/graft": { damageBonus: 0.2, toughness: 1 },
  "surger/assume": { damageBonus: 0.5, concealment: 0.1 },
  "surger/reach-gut": { selfRepair: 0.05 },
  "surger/render-down": { resourceCap: 8 },
  "surger/thick-blood": { incoming: 0.95 },
  "surger/walk-among": { concealment: 0.1 },
  "surger/the-reach-wears-you": { selfRepair: 0.12, incoming: 0.92 },
  "surger/scar-socket": { chrome: true, concealment: 0.06 },
  "surger/accept": { chrome: true, toughness: 1 },
  "surger/dose-router": { resourceCap: 6 },
  "surger/show-the-steam": { castCost: 0.92 },
  "surger/one-flesh": { toughness: 1, selfRepair: 0.06 },
  "surger/conversion": { toughness: 2, damageBonus: 0.3, chrome: true },
  "surger/staunch": { selfRepair: 0.1 },
  "surger/clot-craft": { partyHeal: 0.5, selfRepair: 0.08 },
  "surger/vein-tax": { resourceCap: 10, incoming: 1.05 },
  "surger/tithe": { resourcePerHit: 1.4 },
  "surger/levy": { damageBonus: 0.4 },
  "surger/transfusion": { partyHeal: 1, selfRepair: 0.1 },

  // ----------------------------------------------------------------- Archon
  "archon/first-bond": { minions: 1 },
  "archon/soft-signal": { concealment: 0.06 },
  "archon/borrowed-eyes": { detection: 0.12 },
  "archon/fed-first": { damageBonus: 0.1 },
  "archon/splints-and-solder": { selfRepair: 0.06 },
  "archon/two-voices": { minions: 1 },
  "archon/one-bond": { damageBonus: 0.6, toughness: 1 },
  "archon/many-voices": { minions: 1 },
  "archon/the-chorus": { extraAction: 0.2, damageBonus: 0.2 },
  "archon/scent-line": { detection: 0.08 },
  "archon/pack-tactics": { damageBonus: 0.3 },
  "archon/blooded-pack": { damageBonus: 0.3 },
  "archon/fangs-beside-you": { damageBonus: 0.4 },
  "archon/rung-read": { detection: 0.15, damageBonus: 0.2 },
  "archon/saddle-bond": { toughness: 1 },
  "archon/combat-drop": { initiative: 0.2, damageBonus: 0.3 },
  "archon/war-mount": { damageBonus: 0.4, toughness: 1 },
  "archon/riders-eye": { initiative: 0.15, detection: 0.1 },
  "archon/skyborne": { concealment: 0.15, initiative: 0.2, damageBonus: 0.2 },
  "archon/everything-flies-twice": { minions: 0.5 },
  "archon/wake": { minions: 0.5 },
  "archon/standing-orders": { damageBonus: 0.2 },
  "archon/swarm-logic": { minions: 1, damageBonus: 0.1 },
  "archon/loyal-code": { control: 0.06 },
  "archon/interlock": { control: 0.15 },
  "archon/consignment": { extraAction: 0.1 },
  "archon/crossing": { initiative: 0.25 },
  "archon/stand": { minions: 1 },
  "archon/shift-work": { damageBonus: 0.15 },
  "archon/double-shift": { minions: 1 },
  "archon/witness": { control: 0.1 },

  // ------------------------------------------------------------- Procurator
  "procurator/voice-that-carries": { partyMitigation: 0.06 },
  "procurator/rally": { partyHeal: 0.6 },
  "procurator/triage-order": { partyMitigation: 0.08 },
  "procurator/dry-powder": { incoming: 0.96 },
  "procurator/steady-the-line": { partyMitigation: 0.14 },
  "procurator/the-field": { partyMitigation: 0.16 },
  "procurator/the-map": { partyMitigation: 0.1, detection: 0.15 },
  "procurator/the-long-column": { partyMitigation: 0.12, partyHeal: 0.4 },
  "procurator/sand-table-mind": { initiative: 0.12 },
  "procurator/walk-the-fire": { control: 0.14 },
  "procurator/clockwork-advance": { initiative: 0.14 },
  "procurator/danger-close": { damageBonus: 0.4 },
  "procurator/kill-box": { damageBonus: 0.3, initiative: 0.1 },
  "procurator/overwatch-grid": { detection: 0.15, initiative: 0.1 },
  "procurator/battery-voice": { damageBonus: 0.8, initiative: 0.2 },
  "procurator/the-count": { ammo: 0.3 },
  "procurator/dose-ledger": { extraAction: 0.05 },
  "procurator/one-more-crate": { ammo: 0.4 },
  "procurator/stretch-the-store": { ammo: 0.4 },
  "procurator/cold-chain": { ammo: 0.2 },
  "procurator/convoy-discipline": { ammo: 0.4 },
  "procurator/the-order": { partyHeal: 0.6, partyMitigation: 0.06 },
  "procurator/read-the-table": { detection: 0.1 },
  "procurator/safe-passage": { concealment: 0.06 },

  // -------------------------------------------------------------- Cypherist
  "cypherist/make-it-run": { selfRepair: 0.06 },
  "cypherist/salvage-rights": { ammo: 0.3 },
  "cypherist/overclock-anything": { damageBonus: 0.2 },
  "cypherist/patents-be-damned": { damageBonus: 0.2 },
  "cypherist/true": { damageBonus: 0.3, accuracy: 0.04 },
  "cypherist/wired": { chrome: true, initiative: 0.2, extraAction: 0.1 },
  "cypherist/clean-hands": { incoming: 0.95, toughness: 1 },
  "cypherist/prototype": { damageBonus: 0.5 },
  "cypherist/frame-fit": { toughness: 1, chrome: true },
  "cypherist/load-servos": { ammo: 0.3 },
  "cypherist/hardpoints": { damageBonus: 0.3 },
  "cypherist/crash-brace": { toughness: 1, incoming: 0.92 },
  "cypherist/hydraulic-answer": { damageBonus: 0.4 },
  "cypherist/dead-mans-frame": { refuseDown: true },
  "cypherist/pilot": { damageBonus: 0.5, toughness: 1 },
  "cypherist/instant-architecture": { minions: 0.5 },
  "cypherist/sentry": { minions: 1 },
  "cypherist/barricade": { partyMitigation: 0.1, extraPlates: 1 },
  "cypherist/part-of-the-scenery": { concealment: 0.1 },
  "cypherist/ammo-feed": { ammo: 0.4 },
  "cypherist/shield-pylon": { partyMitigation: 0.12 },
  "cypherist/overwatch-net": { detection: 0.12, damageBonus: 0.2 },
  "cypherist/firebase": { minions: 1, partyMitigation: 0.12 },
  "cypherist/radio-weather": { detection: 0.12 },
  "cypherist/tap-the-lattice": { detection: 0.15 },
  "cypherist/loop-the-feed": { concealment: 0.12 },
  "cypherist/handshake": { control: 0.1 },
  "cypherist/dead-mans-switch": { damageBonus: 0.3 },
  "cypherist/testimony": { detection: 0.2, control: 0.1 },
  "cypherist/uplink": { minions: 1, concealment: 0.3, incoming: 0.85 },
  "cypherist/fit-a-friend": { partyMitigation: 0.08 },
  "cypherist/cosmesis": { concealment: 0.12 },
  "cypherist/aftermarket": { damageBonus: 0.3 },
  "cypherist/interface": { toughness: 1 },
  "cypherist/second-skeleton": { toughness: 2, incoming: 0.9, chrome: true },
  "cypherist/charge-packing": { resourceCap: 6 },
  "cypherist/stormglass-loads": { damageBonus: 0.2, accuracy: 0.04 },
  "cypherist/trigger-craft": { damageBonus: 0.2 },
  "cypherist/capacitor-array": { resourceCap: 10 },
  "cypherist/grid-tap": { resourcePerHit: 1 },
  "cypherist/dampening-coil": { enemyCastCost: 2 },
  "cypherist/spell-in-a-can": { damageBonus: 0.4, extraAction: 0.08 },

  // ---------------------------------------------------------------- Maverick
  "maverick/loose-holster": { initiative: 0.15 },
  "maverick/born-standing": { incoming: 0.95 },
  "maverick/fast-hands": { ammo: 0.3 },
  "maverick/blink-last": { accuracy: 0.04 },
  "maverick/read-the-hand": { initiative: 0.15, accuracy: 0.04 },
  "maverick/two-irons": { damageBonus: 0.5, extraAction: 0.1 },
  "maverick/iron-and-ember": { damageBonus: 0.3, castCost: 0.85 },
  "maverick/fan-the-hammer": { damageBonus: 0.3 },
  "maverick/first-and-last": { initiative: 0.3, damageBonus: 0.3 },
  "maverick/matched-pair": { damageBonus: 0.2 },
  "maverick/hipfire-doctrine": { accuracy: 0.06 },
  "maverick/crossfire": { extraAction: 0.12 },
  "maverick/stagger-fire": { ammo: 0.3, extraAction: 0.08 },
  "maverick/twinned-recoil": { accuracy: 0.06 },
  "maverick/iron-rain": { control: 0.12, damageBonus: 0.2 },
  "maverick/walking-fire": { accuracy: 0.06, damageBonus: 0.2 },
  "maverick/dead-level": { damageBonus: 0.6, accuracy: 0.08 },
  "maverick/ember-palm": { damageBonus: 0.1 },
  "maverick/snap-cast": { damageBonus: 0.2 },
  "maverick/gun-hand-grammar": { extraAction: 0.12 },
  "maverick/glasscharge": { resourceCap: 8 },
  "maverick/split-the-ember": { damageBonus: 0.3 },
  "maverick/certified-spark": { damageBonus: 0.4 },
  "maverick/left-hand-law": { damageBonus: 0.7 },
  "maverick/ten-paces": { damageBonus: 0.3, accuracy: 0.05 },
  "maverick/cold-walk": { incoming: 0.95 },
  "maverick/the-circle": { incoming: 0.9 },
  "maverick/opening-twitch": { initiative: 0.3 },
  "maverick/one-bullet": { damageBonus: 0.6 },
  "maverick/bloodless": { control: 0.2 },
  "maverick/ricochet": { accuracy: 0.05 },
  "maverick/glassload": { damageBonus: 0.3 },
  "maverick/bank-shot": { damageBonus: 0.2, accuracy: 0.05 },
  "maverick/by-ear": { detection: 0.15 },
  "maverick/impossible-shot": { damageBonus: 0.8 },
  "maverick/stare-down": { control: 0.1 },
  "maverick/larger-than-life": { partyMitigation: 0.08 },
  "maverick/sung-about": { control: 0.12 },
  "maverick/myth": { control: 0.12, concealment: 0.08 },
};

/**
 * The corrupted branch, as arithmetic: what each phase hands you for free.
 *
 * Cumulative — phase 4 owns the first four nodes. This is the half of the
 * ladder the attribute trades never showed: corruption takes rungs and pays
 * in capability, and the simulations are where "the ladder pays" stops being
 * a claim.
 */
export const corruptedEffects: Record<string, Record<number, NodeEffect>> = {
  bastion: { 1: { accuracy: 0.04 }, 2: { incoming: 0.95 }, 3: { selfRepair: 0.08 }, 4: { detection: 0.1 }, 5: { damageBonus: 0.2 }, 6: { toughness: 2, incoming: 0.92 } },
  spector: { 1: { accuracy: 0.06 }, 2: { concealment: 0.1 }, 3: { accuracy: 0.04 }, 4: { detection: 0.2 }, 5: { damageBonus: 0.25 }, 6: { concealment: 0.25 } },
  conduit: { 1: { castCost: 0.95 }, 2: { resourceCap: 8 }, 3: { resourcePerHit: 1 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.3 }, 6: { castCost: 0.85, incoming: 0.95 } },
  surger: { 1: { extraAction: 0.05 }, 2: { resourceCap: 8 }, 3: { damageBonus: 0.2 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.3 }, 6: { damageBonus: 0.4, refuseDown: true } },
  archon: { 1: { initiative: 0.1 }, 2: { toughness: 1 }, 3: { minions: 1 }, 4: { detection: 0.2 }, 5: { damageBonus: 0.2 }, 6: { concealment: 0.15 } },
  procurator: { 1: { partyMitigation: 0.05 }, 2: { control: 0.08 }, 3: { partyHeal: 0.3 }, 4: { detection: 0.2 }, 5: { damageBonus: 0.3 }, 6: { control: 0.12 } },
  cypherist: { 1: { accuracy: 0.05 }, 2: { resourceCap: 6 }, 3: { selfRepair: 0.06 }, 4: { detection: 0.2 }, 5: { damageBonus: 0.3 }, 6: { concealment: 0.2 } },
  maverick: { 1: { extraAction: 0.1 }, 2: { control: 0.08 }, 3: { damageBonus: 0.2 }, 4: { detection: 0.2 }, 5: { initiative: 0.3 }, 6: { control: 0.2 } },
};

/** Base attacks per class. Spell attacks drop out for a `none` origin. */
const classAttacks: Record<string, AttackProfile[]> = {
  bastion: [
    { name: "Rifle", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" },
    { name: "Plate and boot", type: "PHYSICAL", wounds: 1, accuracy: 0.62, cost: 0, costs: "none" },
    { name: "Seal (Containment)", type: "ARCANE", wounds: 1, accuracy: 0.6, cost: 2, costs: "pool" },
  ],
  spector: [
    { name: "Aimed shot", type: "PHYSICAL", wounds: 2, accuracy: 0.48, cost: 2, costs: "ammo" },
    { name: "Quick shot", type: "PHYSICAL", wounds: 1, accuracy: 0.58, cost: 1, costs: "ammo" },
    { name: "Blur (Perceptual)", type: "ARCANE", wounds: 0.5, accuracy: 0.7, cost: 2, costs: "pool" },
  ],
  conduit: [
    { name: "Thermal cast", type: "FIRE", wounds: 2, accuracy: 0.6, cost: 4, costs: "pool" },
    { name: "Licensed cast", type: "ARCANE", wounds: 1, accuracy: 0.66, cost: 2, costs: "pool" },
    { name: "Master signature", type: "ARCANE", wounds: 3, accuracy: 0.66, cost: 8, costs: "pool" },
    { name: "Sidearm", type: "PHYSICAL", wounds: 0.5, accuracy: 0.5, cost: 1, costs: "ammo" },
  ],
  surger: [
    { name: "Kinetic shove", type: "PHYSICAL", wounds: 1.5, accuracy: 0.62, cost: 1, costs: "charges" },
    { name: "Fists and momentum", type: "PHYSICAL", wounds: 1, accuracy: 0.66, cost: 0, costs: "none" },
    { name: "Return (Master)", type: "ARCANE", wounds: 3, accuracy: 0.6, cost: 4, costs: "charges" },
  ],
  archon: [
    { name: "Sidearm", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" },
    { name: "Set the bond on them", type: "PHYSICAL", wounds: 1.5, accuracy: 0.6, cost: 0, costs: "none", bleeds: true },
    { name: "Consignment", type: "ARCANE", wounds: 2, accuracy: 0.6, cost: 4, costs: "pool" },
  ],
  procurator: [
    { name: "Sidearm", type: "PHYSICAL", wounds: 1, accuracy: 0.52, cost: 1, costs: "ammo" },
    { name: "Called fire mission", type: "FIRE", wounds: 2.5, accuracy: 0.55, cost: 4, costs: "ammo" },
  ],
  cypherist: [
    { name: "Frame strike", type: "PHYSICAL", wounds: 1.5, accuracy: 0.58, cost: 0, costs: "none" },
    { name: "Carbine", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" },
    { name: "Spell in a can", type: "ELECTRICAL", wounds: 2, accuracy: 0.62, cost: 2, costs: "charges" },
  ],
  maverick: [
    { name: "Twin irons", type: "PHYSICAL", wounds: 1.5, accuracy: 0.6, cost: 2, costs: "ammo" },
    { name: "Single iron", type: "PHYSICAL", wounds: 1, accuracy: 0.62, cost: 1, costs: "ammo" },
    { name: "Fan the hammer", type: "PHYSICAL", wounds: 3, accuracy: 0.5, cost: 6, costs: "ammo", onceOnly: true },
    { name: "Ember cast", type: "FIRE", wounds: 2, accuracy: 0.62, cost: 2, costs: "pool" },
  ],
};

const primaries: Record<string, [AttributeKey, AttributeKey]> = {
  bastion: ["conditioning", "resilience"],
  spector: ["coordination", "acuity"],
  conduit: ["conductivity", "composure"],
  surger: ["conditioning", "conductivity"],
  archon: ["acuity", "composure"],
  procurator: ["composure", "acuity"],
  cypherist: ["acuity", "coordination"],
  maverick: ["coordination", "composure"],
};

export type BuildSpec = {
  label: string;
  classSlug: string;
  /** How many nodes to take from each branch, in tree order. */
  take: Record<string, number>;
  /** Fork ids kept; the partner of each is skipped. */
  forks?: string[];
};

export type ValidatedBuild = { spec: BuildSpec; nodes: TalentNode[]; cost: number; problems: string[] };

/** Walks the real tree, so a build that cheats fails here rather than lying
 *  in a result table. */
export function validateBuild(spec: BuildSpec): ValidatedBuild {
  const tree = getTalentClass(spec.classSlug);
  const problems: string[] = [];
  if (!tree) return { spec, nodes: [], cost: 0, problems: [`unknown class ${spec.classSlug}`] };

  const chosenForks = new Set(spec.forks ?? []);
  const owned: TalentNode[] = [];
  const ownedIds = new Set<string>();

  for (const [branchName, count] of Object.entries(spec.take)) {
    const branch = tree.branches.find((entry) => entry.name === branchName);
    if (!branch) { problems.push(`${spec.classSlug} has no branch "${branchName}"`); continue; }
    let taken = 0;
    for (const node of branch.nodes) {
      if (taken >= count) break;
      // Skip the fork side this build did not choose.
      if (node.fork && !chosenForks.has(node.id) && (chosenForks.has(node.fork) || (spec.forks ?? []).length > 0)) continue;
      owned.push(node); ownedIds.add(node.id); taken += 1;
    }
    if (taken < count) problems.push(`${spec.label}: asked for ${count} of ${branchName}, took ${taken}`);
  }

  // Prerequisites, checked the way the calculator checks them.
  for (const branch of tree.branches) {
    branch.nodes.forEach((node, index) => {
      if (!ownedIds.has(node.id)) return;
      if (node.requiresAny) {
        if (!node.requiresAny.some((id) => ownedIds.has(id))) problems.push(`${spec.label}: ${node.id} needs one of ${node.requiresAny.join("/")}`);
        return;
      }
      if (index === 0) return;
      const previous = branch.nodes[index - 1];
      if (!ownedIds.has(previous.id) && !(node.weave && ownedIds.has(node.weave))) {
        problems.push(`${spec.label}: ${node.id} stands on nothing`);
      }
    });
  }
  for (const node of owned) {
    if (node.fork && ownedIds.has(node.fork)) problems.push(`${spec.label}: took both sides of the ${node.id}/${node.fork} fork`);
  }
  const cost = owned.reduce((sum, node) => sum + node.cost, 0);
  if (cost > talentPointsAtLevel(100)) problems.push(`${spec.label}: costs ${cost}, over the ${talentPointsAtLevel(100)} budget`);
  return { spec, nodes: owned, cost, problems };
}

export function makeCharacter(build: ValidatedBuild, speciesSlug: string, originSlug: string, professionSlugs: string[], phase = 0, level = 100): SimCharacter {
  const kind = species.find((entry) => entry.slug === speciesSlug) ?? species[0];
  const origin = origins.find((entry) => entry.slug === originSlug) ?? origins[0];
  const trades = professionSlugs.map((slug) => professions.find((entry) => entry.slug === slug) ?? professions[5]);
  const [primary, secondary] = primaries[build.spec.classSlug];

  const corrupted = Object.entries(corruptedEffects[build.spec.classSlug] ?? {})
    .filter(([phaseKey]) => Number(phaseKey) <= phase)
    .map(([, effect]) => effect);
  const effects = mergeEffects([...build.nodes.map((node) => nodeEffects[`${build.spec.classSlug}/${node.id}`] ?? {}), ...corrupted]);
  const attributes = attributesFor(level, primary, secondary, kind, phase);
  attributes.composure = Math.min(kind.caps.composure, attributes.composure + origin.composureBonus);

  const attacks = classAttacks[build.spec.classSlug].filter((attack) => {
    if (attack.costs === "pool") return origin.economy === "pool";
    if (attack.costs === "charges") return origin.economy === "charges";
    return true;
  });

  const character: SimCharacter = {
    label: `${build.spec.label} · ${kind.name} · ${origin.name}${phase ? ` · P${phase}` : ""}`,
    classSlug: build.spec.classSlug,
    species: kind, origin, professions: trades, level, phase,
    attributes, attacks, effects,
    wounds: 0, bleeding: 0, plates: 0, resource: 0, resourceMax: 0, ammo: 0,
    down: false, dying: 0, dead: false, usedOnce: new Set(), refusedDown: false, burstUsed: false,
  };
  return character;
}

/** The archetype builds: the shapes the gameplay audit said each tree makes. */
export const archetypes: BuildSpec[] = [
  { label: "Bastion · Fortress", classSlug: "bastion", forks: ["immovable"], take: { "The Line": 8, "Shieldwall": 8, "Last Stand": 8, "Aegis": 6 } },
  { label: "Bastion · Breach", classSlug: "bastion", forks: ["unstoppable"], take: { "The Line": 5, "Breacher": 8, "Juggernaut": 8, "Last Stand": 6 } },
  { label: "Spector · One Round", classSlug: "spector", forks: ["signature-shot"], take: { "Fieldcraft": 9, "Marksman": 8, "Tracker": 6, "Saboteur": 4 } },
  { label: "Spector · The Nobody", classSlug: "spector", forks: ["never-here"], take: { "Fieldcraft": 8, "Ghost": 8, "Face": 8, "Saboteur": 5 } },
  { label: "Conduit · Siege Lantern", classSlug: "conduit", forks: ["deep-pool"], take: { "Channelling": 8, "Warcaster": 8, "Shaper": 6, "Mindworker": 3 } },
  { label: "Conduit · Field Surgeon", classSlug: "conduit", forks: ["live-wire"], take: { "Channelling": 8, "Mender": 8, "Mindworker": 6, "Resonant": 4 } },
  { label: "Surger · Red Ladder", classSlug: "surger", forks: ["red-line"], take: { "Overdrive": 8, "Berserk": 8, "Bloodwork": 8, "Ironvein": 4 } },
  { label: "Surger · Clean Shifter", classSlug: "surger", forks: ["clean-burn"], take: { "Overdrive": 8, "Shifter": 8, "Symbiont": 8, "Berserk": 4 } },
  { label: "Archon · Sky Cavalry", classSlug: "archon", forks: ["one-bond"], take: { "The Bond": 8, "Apex": 8, "Packleader": 7, "Dronewright": 3 } },
  { label: "Archon · The Flock", classSlug: "archon", forks: ["many-voices"], take: { "The Bond": 8, "Dronewright": 8, "Packleader": 8, "Gravecaller": 4 } },
  { label: "Procurator · Fire Plan", classSlug: "procurator", forks: ["the-map"], take: { "Command": 8, "Tactician": 8, "Quartermaster": 8, "Envoy": 3 } },
  { label: "Procurator · Supply Line", classSlug: "procurator", forks: ["the-field"], take: { "Command": 8, "Quartermaster": 8, "Sovereign": 6, "Envoy": 5 } },
  { label: "Cypherist · Warframe", classSlug: "cypherist", forks: ["wired", "pilot"], take: { "The Bench": 9, "Exoframe": 8, "Chromewright": 7, "Cellworks": 4 } },
  { label: "Cypherist · Remote War", classSlug: "cypherist", forks: ["clean-hands", "uplink"], take: { "The Bench": 9, "Gridrunner": 8, "Emplacer": 8, "Cellworks": 5 } },
  { label: "Maverick · Cylinder Storm", classSlug: "maverick", forks: ["two-irons"], take: { "The Draw": 8, "Twin Irons": 8, "Trickwork": 7, "The Legend": 4 } },
  { label: "Maverick · Ember Duelist", classSlug: "maverick", forks: ["iron-and-ember"], take: { "The Draw": 8, "Spellhand": 8, "The Duel": 8, "The Legend": 4 } },
];

/** The opposition, drawn from the fourteen kinds. */
export type Encounter = { name: string; make: () => SimCharacter[]; note: string };

const enemy = (name: string, attributes: Partial<Record<AttributeKey, number>>, attacks: AttackProfile[], effects: NodeEffect = {}, plates = 1): SimCharacter => ({
  label: name, classSlug: "enemy",
  species: species[0], origin: origins[0], professions: [], level: 60, phase: 0,
  attributes: { conditioning: 5, coordination: 5, resilience: 5, acuity: 5, composure: 5, conductivity: 0, ...attributes },
  attacks, effects: { ...effects, extraPlates: plates - 2 },
  wounds: 0, bleeding: 0, plates, resource: 0, resourceMax: 0, ammo: 0,
  down: false, dying: 0, dead: false, usedOnce: new Set(), refusedDown: false, burstUsed: false,
});

const rifle: AttackProfile = { name: "Rifle", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" };
const heavy: AttackProfile = { name: "Heavy", type: "PHYSICAL", wounds: 2, accuracy: 0.5, cost: 2, costs: "ammo" };

export const encounters: Encounter[] = [
  { name: "Pearl fire team (3)", note: "canon's line infantry � plate sigils say which ward they bought",
    make: () => [enemy("Pearl rifleman", { coordination: 6 }, [rifle]), enemy("Pearl rifleman", { coordination: 6 }, [rifle]), enemy("Pearl gunner", { coordination: 5 }, [heavy])] },
  { name: "Iron Saints shock team (2)", note: "cosmesis, no tells, and ELECTRICAL vents them",
    make: () => [enemy("Saint", { coordination: 7, conditioning: 7, resilience: 7 }, [heavy], { chrome: true, damageBonus: 0.3 }, 3), enemy("Saint", { coordination: 7, conditioning: 7, resilience: 7 }, [heavy], { chrome: true, damageBonus: 0.3 }, 3)] },
  { name: "ACA cordon team (4)", note: "grey coats who do not want to kill you",
    make: () => Array.from({ length: 4 }, (_, index) => enemy(`Cordon ${index + 1}`, { coordination: 6, resilience: 6 }, [{ name: "Tranquilliser", type: "TOXIC", wounds: 1.5, accuracy: 0.55, cost: 0, costs: "none" }], { control: 0.1 }, 2)) },
  { name: "Reach creature, Advanced rung", note: "trained on, harvested from, and still faster than you",
    make: () => [enemy("Adapted predator", { conditioning: 8, coordination: 7, resilience: 8 }, [{ name: "Rend", type: "PHYSICAL", wounds: 2, accuracy: 0.6, cost: 0, costs: "none", bleeds: true }, { name: "Spore burst", type: "TOXIC", wounds: 1.5, accuracy: 0.6, cost: 0, costs: "none" }], { toughness: 4 }, 0)] },
  { name: "Abomination (phase seven)", note: "used to be someone",
    make: () => [enemy("Abomination", { conditioning: 9, coordination: 6, resilience: 9 }, [{ name: "Arcane sweep", type: "ARCANE", wounds: 2.5, accuracy: 0.62, cost: 0, costs: "none", ignoresPlates: true }], { toughness: 8, damageBonus: 0.2 }, 0)] },
  { name: "Risen wave (6)", note: "no stat block, ever � they simply keep coming",
    make: () => Array.from({ length: 6 }, (_, index) => enemy(`Risen ${index + 1}`, { conditioning: 6, coordination: 4, resilience: 4 }, [{ name: "Grasp", type: "PHYSICAL", wounds: 1, accuracy: 0.5, cost: 0, costs: "none" }], {}, 0)) },
  { name: "Directorate checkpoint (2)", note: "reads paper before it reads people",
    make: () => [enemy("Officer", { coordination: 6 }, [rifle], { detection: 0.2 }), enemy("Conscript", { coordination: 4 }, [rifle])] },
  { name: "Monstrosity", note: "has a budget line and a name on the sign-off",
    make: () => [enemy("Monstrosity", { conditioning: 9, coordination: 5, resilience: 9 }, [{ name: "Slam", type: "PHYSICAL", wounds: 3, accuracy: 0.55, cost: 0, costs: "none" }], { toughness: 10 }, 2)] },
];
