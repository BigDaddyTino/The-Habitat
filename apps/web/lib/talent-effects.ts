/**
 * The mechanical weight of every talent node — one source of truth.
 *
 * The balance simulations run on these numbers and the calculator's node
 * popout displays them, from the same map, so what a player reads and what
 * the campaign measured can never drift apart. Values are the tuned ones
 * from the 2026-08-31 balance pass (the owner's five rulings, applied and
 * re-measured); `describeEffects` turns them into the plain gameplay lines
 * the popout shows.
 *
 * A node absent from the map is a NARRATIVE node: real in play — a door it
 * opens, a person it changes, a thing the world starts doing — with no
 * arithmetic to simulate yet. The popout says so instead of showing nothing.
 */

export type NodeEffect = Partial<{
  accuracy: number;
  damageBonus: number;
  extraPlates: number;
  /** Multiplier on wounds taken — mitigation below 1, exposure above. */
  incoming: number;
  initiative: number;
  /** Extra Dying-clock rounds for the owner. */
  dyingClock: number;
  /** Wounds before Down, added. */
  toughness: number;
  /** Pool or charge efficiency multiplier on costs. */
  castCost: number;
  /** Resource returned per landed hit — the engines. */
  resourcePerHit: number;
  /** Resource returned per wound taken. */
  resourcePerWound: number;
  /** Flat resource ceiling bonus. */
  resourceCap: number;
  /** Ammunition multiplier bonus (0.3 = +30%). */
  ammo: number;
  /** Chance per round to shrug a bleed or heal a wound. */
  selfRepair: number;
  /** Ally wounds healed per round — party value. */
  partyHeal: number;
  /** Reduces every ally's incoming wounds — auras and cover. */
  partyMitigation: number;
  /** Extra action chance per round. */
  extraAction: number;
  /** Chance to avoid being targeted, and to be missed when targeted. */
  concealment: number;
  /** Sees through concealment. */
  detection: number;
  /** Chance per round to strip a plate or deny the enemy ground. */
  control: number;
  /** Multiplier on enemy cast costs in range — the Dampening Coil. */
  enemyCastCost: number;
  /** Bodies fighting on your side that are not you. */
  minions: number;
  /** Immunity to the ELECTRICAL chrome-vent rule. */
  hardenedChrome: boolean;
  /** Carries chrome at all — what ELECTRICAL vents. */
  chrome: boolean;
  /** Once per fight, refuse Down. */
  refuseDown: boolean;
  /** Once per fight, spend everything for a burst. */
  burst: number;
}>;

/** Keys are `<class>/<node id>`, so a renamed node fails the tests loudly. */
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
  "bastion/answer-in-kind": { damageBonus: 0.45 },
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
  "bastion/knuckle-plate": { damageBonus: 0.3 },
  "bastion/faraday-bones": { hardenedChrome: true },
  "bastion/past-the-governor": { damageBonus: 0.3 },
  "bastion/come-take-it": {},
  "bastion/walking-armoury": { partyMitigation: 0.12, extraPlates: 1 },
  "bastion/slow-leak": { selfRepair: 0.1 },
  "bastion/field-dressing": { selfRepair: 0.12 },
  "bastion/walk-it-off": { toughness: 1 },
  "bastion/pain-ledger": { damageBonus: 0.3 },
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
  "procurator/your-own-orders": { damageBonus: 0.35, accuracy: 0.05, incoming: 0.92 },
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
  "cypherist/uplink": { minions: 1, concealment: 0.14, incoming: 1.1 },
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

/** The corrupted branch's free power, cumulative by phase. Tuned so the
 *  ladder pays without deciding fights on its own. */
export const corruptedEffects: Record<string, Record<number, NodeEffect>> = {
  bastion: { 1: { accuracy: 0.04 }, 2: { incoming: 0.96 }, 3: { selfRepair: 0.06 }, 4: { detection: 0.1 }, 5: { damageBonus: 0.15 }, 6: { toughness: 2 } },
  spector: { 1: { accuracy: 0.05 }, 2: { concealment: 0.08 }, 3: { accuracy: 0.03 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.15 }, 6: { concealment: 0.15 } },
  conduit: { 1: { castCost: 0.96 }, 2: { resourceCap: 6 }, 3: { resourcePerHit: 0.8 }, 4: { detection: 0.12 }, 5: { damageBonus: 0.2 }, 6: { castCost: 0.92 } },
  surger: { 1: { extraAction: 0.05 }, 2: { resourceCap: 6 }, 3: { damageBonus: 0.15 }, 4: { detection: 0.12 }, 5: { damageBonus: 0.2 }, 6: { damageBonus: 0.2, refuseDown: true } },
  archon: { 1: { initiative: 0.08 }, 2: { toughness: 1 }, 3: { minions: 0.5 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.15 }, 6: { concealment: 0.1 } },
  procurator: { 1: { partyMitigation: 0.04 }, 2: { control: 0.06 }, 3: { partyHeal: 0.2 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.2 }, 6: { control: 0.1 } },
  cypherist: { 1: { accuracy: 0.04 }, 2: { resourceCap: 5 }, 3: { selfRepair: 0.05 }, 4: { detection: 0.15 }, 5: { damageBonus: 0.2 }, 6: { concealment: 0.12 } },
  maverick: { 1: { extraAction: 0.08 }, 2: { control: 0.06 }, 3: { damageBonus: 0.15 }, 4: { detection: 0.15 }, 5: { initiative: 0.2 }, 6: { control: 0.14 } },
};

/**
 * The ruling that makes the ladder a bargain instead of a checklist: the
 * institutional costs are mechanically real. Tells show (you are easier to
 * read and to hit), nobody sells to a phase-five (one plate short), and at
 * Turning nobody billets with you — between-fight care halves.
 */
export function institutionalCosts(phase: number): NodeEffect {
  const costs: NodeEffect = {};
  if (phase >= 4) costs.concealment = -0.12;
  if (phase >= 5) costs.extraPlates = -1;
  return costs;
}

const signed = (value: number, digits = 0) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}`;
const signedPct = (value: number) => `${value >= 0 ? "+" : "−"}${Math.round(Math.abs(value) * 100)}%`;

/** The plain gameplay lines a popout shows for one effect object. */
export function describeEffects(effect: NodeEffect): string[] {
  const lines: string[] = [];
  if (effect.accuracy) lines.push(`${signedPct(effect.accuracy)} hit chance`);
  if (effect.damageBonus) lines.push(`${signed(effect.damageBonus, 2).replace(/\.?0+$/, "")} damage on every hit that lands`);
  if (effect.incoming !== undefined && effect.incoming !== 1) {
    lines.push(effect.incoming < 1 ? `${signedPct(effect.incoming - 1)} damage taken` : `${signedPct(effect.incoming - 1)} damage taken (the cost half)`);
  }
  if (effect.toughness) lines.push(`${signed(effect.toughness)} hits before Down`);
  if (effect.extraPlates) lines.push(`${signed(effect.extraPlates)} armour plate${Math.abs(effect.extraPlates) === 1 ? "" : "s"} carried`);
  if (effect.dyingClock) lines.push(`${signed(effect.dyingClock)} rounds on your Dying clock`);
  if (effect.initiative) lines.push(`${signedPct(effect.initiative)} initiative — you act earlier`);
  if (effect.castCost !== undefined && effect.castCost !== 1) lines.push(`${signedPct(effect.castCost - 1)} cast costs`);
  if (effect.resourceCap) lines.push(`${signed(effect.resourceCap)} maximum pool / charges`);
  if (effect.resourcePerHit) lines.push(`${signed(effect.resourcePerHit, 1)} pool or charges back per landed hit`);
  if (effect.resourcePerWound) lines.push(`${signed(effect.resourcePerWound, 1)} back per wound taken`);
  if (effect.ammo) lines.push(`${signedPct(effect.ammo)} ammunition carried`);
  if (effect.selfRepair) lines.push(`${Math.round(effect.selfRepair * 100)}% chance each round to close one of your own wounds`);
  if (effect.partyHeal) lines.push(`heals allies ${effect.partyHeal} wound${effect.partyHeal === 1 ? "" : "s"} worth per round`);
  if (effect.partyMitigation) lines.push(`allies near you take ${signedPct(-effect.partyMitigation)} damage`);
  if (effect.extraAction) lines.push(`${Math.round(effect.extraAction * 100)}% chance of an extra action each round`);
  if (effect.concealment) {
    lines.push(effect.concealment > 0
      ? `${Math.round(effect.concealment * 100)}% harder to target — and to hit when targeted`
      : `${Math.round(-effect.concealment * 100)}% easier to read and to hit (a cost)`);
  }
  if (effect.detection) lines.push(`sees through ${Math.round(effect.detection * 100)}% concealment`);
  if (effect.control) lines.push(`${Math.round(effect.control * 100)}% chance each round to strip a plate or deny ground`);
  if (effect.enemyCastCost && effect.enemyCastCost !== 1) lines.push(`enemy casts in range cost ×${effect.enemyCastCost}`);
  if (effect.minions) {
    lines.push(effect.minions >= 1
      ? `${effect.minions} bonded ${effect.minions === 1 ? "body fights" : "bodies fight"} beside you, on their own strength`
      : `an extra bonded action every other round`);
  }
  if (effect.hardenedChrome) lines.push(`ELECTRICAL no longer vents your chrome`);
  if (effect.chrome) lines.push(`counts as chrome — ELECTRICAL can vent it (a cost, unless hardened)`);
  if (effect.refuseDown) lines.push(`once per fight: refuse to go Down`);
  if (effect.burst) lines.push(`once per fight: everything at once — a ${effect.burst}-charge burst`);
  return lines;
}

export function effectsForNode(classSlug: string, nodeId: string): NodeEffect | null {
  return nodeEffects[`${classSlug}/${nodeId}`] ?? null;
}
