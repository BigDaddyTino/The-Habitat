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
  /** Extra SECONDS on the owner's bleed-out timer. */
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
  /** Chance per 3s contact beat to shrug a bleed or heal a wound. */
  selfRepair: number;
  /** Ally wounds restored when pulling somebody back up — party value. */
  partyHeal: number;
  /** Reduces every ally's incoming wounds — auras and cover. */
  partyMitigation: number;
  /** Action tempo bonus — attacks, casts and swaps cycle faster. */
  extraAction: number;
  /** Chance to avoid being targeted, and to be missed when targeted. */
  concealment: number;
  /** Sees through concealment. */
  detection: number;
  /** Chance per committed attack to strip a plate or stagger footing. */
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
  /**
   * Concrete out-of-combat numbers, written by hand per node: carry weight,
   * travel speed, prices, durations, chances. The popout shows them first;
   * the combat simulations ignore them (mergeEffects skips non-numerics).
   */
  world: string[];
}>;

/** Keys are `<class>/<node id>`, so a renamed node fails the tests loudly. */
export const nodeEffects: Record<string, NodeEffect> = {
  // ---------------------------------------------------------------- Bastion
  "bastion/stand-fast": { accuracy: 0.03 },
  "bastion/spit-and-stand": { selfRepair: 0.12 },
  "bastion/dig-in": { incoming: 0.9 },
  "bastion/hold-the-line": { partyMitigation: 0.1 },
  "bastion/written-defeat": { partyMitigation: 0.1, dyingClock: 3 },
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
  "bastion/walking-armoury": { partyMitigation: 0.12, extraPlates: 1 },
  "bastion/slow-leak": { selfRepair: 0.1 },
  "bastion/field-dressing": { selfRepair: 0.12 },
  "bastion/walk-it-off": { toughness: 1 },
  "bastion/pain-ledger": { damageBonus: 0.3 },
  "bastion/on-your-feet": { partyHeal: 1 },
  "bastion/argue-with-the-clock": { dyingClock: 9 },
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
  "spector/clean-water": { selfRepair: 0.06 },
  "spector/search-pattern": { detection: 0.12, initiative: 0.08 },
  "spector/agreement": { initiative: 0.1 },
  "spector/tell": { detection: 0.1 },

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

  // ------------------------------------------------------- The world pass
  // Out-of-combat nodes, given their real numbers by hand (2026-08-31 owner
  // ruling: every node labeled accurately — carry weight is carry weight,
  // not "narrative"). The sims ignore `world` lines; the popout leads with
  // them.
  "bastion/bear-the-weight": { world: ["+40% carry weight", "Over-limit slowdown halved"] },
  "bastion/thousand-round-stare": { world: ["Enemy plate count, ward type and chrome read on sight — exact, instantly", "Works at rifle range"] },
  "bastion/forced-march": { world: ["Squad overland travel +20% faster", "March noise −50% — the column moves quiet"] },
  "bastion/loud-mercy": { world: ["Breach charges can be set non-lethal: 8m blind-and-deafen, 6 seconds, nobody dies", "Lethal or loud is chosen at placement"] },
  "bastion/static-on-the-skin": { world: ["Wards within 10m felt through the skin — direction and rough strength", "No line of sight needed"] },
  "bastion/first-ward": { world: ["Unlocks Seal: a doorway ward that holds as long as you stand it", "One door, window or breach; breaks if you move or go Down"] },
  "bastion/hold": { world: ["Unlocks Hold: one object kept exactly where it is", "Up to door weight, 30 seconds per cast"] },
  "bastion/the-moving-wall": { world: ["Your Seal advances with you at walking pace", "Covers a doorway's width as it moves"] },
  "bastion/quiet-ground": { world: ["No sound leaves your position — 6m radius, gunfire included", "Holds while you hold still"] },
  "bastion/union-fittings": { world: ["Union counters sell at member prices: −15% on parts, plate and chrome work", "No questions on chrome-legal goods"] },
  "bastion/come-take-it": { world: ["Your chrome ignores every remote lockout and kill-switch", "A revocation agent must reach you in person"] },

  "spector/quiet-lock": { world: ["Standard locks open silent in 10 seconds, every time", "Quality locks: 30 seconds with kit"] },
  "spector/ward-seam": { world: ["A ward's weak seam shown after 6 seconds of study", "Cross it without tripping — one person at a time"] },
  "spector/wrong-shadow": { world: ["Traps, rigged doors and doctored rigs reveal themselves within 8m", "Automatic — no searching"] },
  "spector/credential": { world: ["Once per day: a paper that passes one checkpoint — any checkpoint", "Burns on use; a second look kills it"] },
  "spector/dead-reckoning": { world: ["Position, heading and depth always known — no sky, no map needed"] },
  "spector/weather-nose": { world: ["Tomorrow's weather known today, to the hour", "Storms called a full day early"] },
  "spector/sign": { world: ["Tracks read number, species, load and age of what passed", "Up to three days cold, on any ground"] },
  "spector/cold-camp": { world: ["Your party's camp cannot be found unless you want it found", "Fire shielded, tracks swept, scent killed — every night, automatic"] },
  "spector/high-route": { world: ["Rooftops, ridges and rigging at full move speed", "Anything with a handhold climbs like a ladder"] },
  "spector/everyones-cousin": { world: ["Strangers open friendly: +20 disposition everywhere", "Rumors surface 2× faster when you ask around"] },
  "spector/cover-story": { world: ["A worked identity: name, history and references that survive a records check"] },
  "spector/paper": { world: ["Forged documents pass first inspection anywhere", "Expert scrutiny: even odds"] },
  "spector/borrowed-voice": { world: ["Any accent, cadence or rank heard for one minute, worn convincingly", "Voice-keyed doors and codewords included"] },
  "spector/forget": { world: ["Once every 15 minutes: the last 30 seconds removed from one witness", "They fill the gap themselves — no trace"] },
  "spector/suggest": { world: ["Once every 15 minutes: one small idea planted mid-sentence, acted on as their own", "Nothing against their core interests"] },
  "spector/one-signature": { world: ["Your casts carry no arcane signature — untraceable to you, ever"] },

  "conduit/cook-the-air": { world: ["Squad immune to cold-weather penalties", "10m around you stays warm through hard frost"] },
  "conduit/masons-eye": { world: ["Load-bearing points of any structure shown at a glance", "Where to cut, where to brace, what comes down"] },
  "conduit/shapers-licence": { world: ["Unlocks the Tensile pair: Patch (mend a break clean) and Set (harden a surface)"] },
  "conduit/etch": { world: ["Unlocks Etch: mark or weaken a surface by touch", "Cutting a weakened line takes half the work"] },
  "conduit/where-it-falls": { world: ["Collapse shape and timing predicted exactly on your own demolitions", "Nothing lands where you didn't say"] },
  "conduit/blank-ledger": { world: ["Your face shows only what you choose — lie-reads and empaths get a wall"] },
  "conduit/empaths-licence": { world: ["Unlocks the Empathic pair: Steady (calm a mind) and Read (surface a feeling, consented)"] },
  "conduit/distant-pulse": { world: ["Party vitals felt at any range — wounds, panic, Down, direction", "No line of sight; nothing to jam"] },
  "conduit/room-tone": { world: ["A room's mood read half a second before it turns", "Riots, ambushes and drawn steel stop being surprises"] },
  "conduit/whisper-range": { world: ["Mindwork at conversation subtlety from 40m", "Nobody sees you working"] },
  "conduit/grave-quiet": { world: ["Death within 20m registers — count, direction, freshness"] },
  "conduit/presence": { world: ["Whether an Echo sits in its Core — and whether it's lit — known from anywhere"] },
  "conduit/second-look": { world: ["On a 5-minute cooldown: the last three seconds replayed, for you alone", "Enough to re-read a face, a hand, a card"] },
  "conduit/forge-manners": { world: ["Forge Cores answer you first: −10% on all Core work", "The queue moves you up one place"] },

  "surger/shove": { world: ["Active — borrowed momentum in someone's face: thrown 2m", "60% to floor anyone your size or lighter"] },
  "surger/skin-sense": { world: ["Borrowed traits report their needs — feeding, cooling, rest — before they fail"] },
  "surger/wear": { world: ["Hold one trait from harvested material: claws, gills, plate, eyes", "Swapped at a bench in ten minutes"] },
  "surger/trophy-rack": { world: ["Three harvested traits kept ready to wear", "Signed, sealed, and legal-ish at checkpoints"] },
  "surger/quiet-blood": { world: ["Predators read you as neither prey nor threat", "Wild beasts will not start a fight with you"] },
  "surger/marsh-lungs": { world: ["Immune to bad air: spore, smoke, swamp gas, mine damp"] },
  "surger/sporecast": { world: ["Overcharge weather and sporefall felt one hour out", "Time enough to shelter the squad"] },
  "surger/seat": { world: ["Augments seat clean: no scar, no inflammation, no rejection, ever"] },
  "surger/hot-swap": { world: ["Field augment swaps in 5 minutes — no surgeon, no bench", "One free swap per day; more cost a wound"] },
  "surger/red-scent": { world: ["Blood and open wounds smelled through walls — 15m, with direction and freshness"] },
  "surger/draw": { world: ["Active — blood pulled from a wound at 10m: the target staggers, your Bloodwork feeds", "Once per fight per target"] },

  "archon/calm": { world: ["Active — one animal settled in seconds, panicked or hostile", "Works up to great-beast size"] },
  "archon/taught-once": { world: ["Behaviours taught to bonded animals never decay", "One demonstration holds for life"] },
  "archon/watchword": { world: ["A bond holds a post alone — ground, door or person — for days if fed", "It sends for you the moment it's tested"] },
  "archon/groom-and-feed": { world: ["Your great beast opens every fight fight-ready — fed, calm, checked", "Always, automatically"] },
  "archon/thermal-roads": { world: ["Mounted flight rides thermals: +30% air travel speed at half the beast's fatigue"] },
  "archon/weather-wings": { world: ["Storms are flying weather — wind and rain no longer ground you", "Lightning still will"] },
  "archon/ask": { world: ["Active — one question to a working machine, answered honestly", "Once per machine per day"] },
  "archon/patch-loop": { world: ["Your machines mend themselves between fights — full function by the next one", "Destroyed stays destroyed"] },
  "archon/ledger-of-places": { world: ["Everywhere you've stood is a saved anchor, addressable for Summoner work", "No cap; anchors never expire"] },
  "archon/fetch": { world: ["Unlocks Fetch: a known object brought to hand from any anchor", "Satchel weight, 30 seconds"] },
  "archon/send": { world: ["Unlocks Send: satchel weight delivered to any anchor in 30 seconds"] },
  "archon/return-address": { world: ["Anything you sent returns on one word — back in hand"] },
  "archon/stable-arrival": { world: ["Consignments arrive exactly where declared — no drift, no damage, stacked as packed"] },
  "archon/freight-class": { world: ["Send and Fetch scale to freight: crates, emplacements, a mount", "One freight move per day"] },
  "archon/respect-the-dead": { world: ["Gravecalling costs no standing with peoples who bury their dead", "Rites observed automatically — families see care, not theft"] },
  "archon/still": { world: ["Active — one moving body stopped mid-step", "Holds 10 seconds, or until touched"] },
  "archon/preservation-clause": { world: ["Raised bodies hold four days in the field, not hours"] },
  "archon/last-order": { world: ["A body's final instruction executes once, exactly as spoken", "Survives your distance, your Down, your death"] },

  "procurator/names-and-faces": { world: ["Every name, face, debt and grudge you've met, recalled perfectly", "+10 disposition — people remember being remembered"] },
  "procurator/read-the-horn": { world: ["Reserve state known live — counts, morale, ammunition — before the quartermaster reports"] },
  "procurator/ledger-hand": { world: ["Your books audit clean, always", "Inspectors wave you through — institutional trust +15%"] },
  "procurator/protocol": { world: ["Every institution's manners, fluent — zero etiquette failures", "Doors open one rank above your station"] },
  "procurator/terms": { world: ["Every deal opens on your paper — your clauses are the baseline"] },
  "procurator/the-right-gift": { world: ["The correct gift known before the door opens — rank, faith and grudge accounted"] },
  "procurator/what-theyll-take": { world: ["The other side's bottom line read before it's spoken"] },
  "procurator/back-channel": { world: ["Every organization holds someone who'll talk to you first — quietly, within a day"] },
  "procurator/close": { world: ["Closed deals stay closed — both sides think they won", "Renegotiation fails unless you allow it"] },
  "procurator/coin-eye": { world: ["True value, provenance and best buyer of anything, at a glance"] },
  "procurator/price-the-room": { world: ["Who is paid, who is owed and who is for sale — read on entry"] },
  "procurator/margin": { world: ["Trade runs profit +15% — buy low here, sell high there, repeat"] },
  "procurator/escrow": { world: ["Your deals cannot be welched — the structure guarantees both deliveries"] },
  "procurator/black-book": { world: ["Black markets open to your knock in any port", "Fence prices run 10% in your favour"] },
  "procurator/cornered-market": { world: ["For one good in one port, you set the price", "Changing the good or the port takes a season"] },
  "procurator/letters-of-credit": { world: ["Your paper spends as coin in four ports of your choosing", "Nothing worth robbing in your strongbox"] },
  "procurator/cartel-terms": { world: ["Trade at price-making scale: your volume moves any market ±10%"] },
  "procurator/claim-ground": { world: ["Claimed ground produces: scavenge rights, rents or taxes flow weekly"] },
  "procurator/census": { world: ["Your ground's people known live: heads, skills, needs, grudges"] },
  "procurator/boots-on-the-wall": { world: ["No surprise attacks on your ground — patrols actually patrol", "Watch rotations run themselves"] },
  "procurator/the-board": { world: ["Unlocks Outpost management: walls, beds, workshops, a Forge housing"] },
  "procurator/tithe-and-wage": { world: ["Staying pays: +20% settler growth and a raised loyalty floor"] },
  "procurator/standing-court": { world: ["Disputes end at your table and rulings stick", "Loyalty compounds +10% a season"] },
  "procurator/charter": { world: ["Your ground becomes a jurisdiction — your signature carries law beyond it"] },
  "procurator/crown-without-a-name": { world: ["Unlocks Nation management — holding ground becomes ruling it", "Vassals, levies, law, legacy"] },

  "cypherist/bench-anywhere": { world: ["A working bench stood up on anything flat in 60 seconds", "Full crafting menu, anywhere"] },
  "cypherist/schematic-memory": { world: ["Anything you've taken apart is a known schematic — buildable from memory"] },
  "cypherist/quick-doff": { world: ["Exoframe on or off in 5 seconds — no help, no crane"] },
  "cypherist/ghost-credentials": { world: ["Machine systems remember you as cleared — doors, terminals, checkpoints", "Human double-checks are still your problem"] },
  "cypherist/steady-scalpel": { world: ["Install work heals clean every time: no infection, no rejection, half recovery"] },
  "cypherist/ninety-seconds": { world: ["Full augment recovery from a body in 90 seconds, anywhere", "The trade's named time, met every time"] },
  "cypherist/donor-bank": { world: ["Recovered augments cleaned, tuned and kept ready", "Sell or install at full value, not salvage rates"] },
  "cypherist/safe-hands": { world: ["Unstable devices go stable in your hands — bombs, cores, hot cells", "Set down, the countdown resumes"] },

  "maverick/showmans-flame": { world: ["Every cast is signed — witnesses attribute your wins correctly", "Your legend spreads 50% faster"] },
  "maverick/call-it": { world: ["Active — name a one-on-one: most take it, refusing costs them standing", "A refuser who fights you anyway does it shaken: −10% hit"] },
  "maverick/witnesses": { world: ["Each witnessed duel won: +5% hit chance in your next duel", "Stacks to +15%"] },
  "maverick/spin-and-show": { world: ["Handling alone announces you — 60% of small trouble stands down before it starts"] },
  "maverick/disarming-shot": { world: ["Active — shoot the weapon, not the hand: 70% disarm at pistol range", "The iron lands 3m away"] },
  "maverick/cut-the-rope": { world: ["Called shots on objects: 90% at pistol range — locks, lines, triggers, hinges"] },
  "maverick/a-name-that-travels": { world: ["The next town has already heard of you: +10 disposition on arrival"] },
  "maverick/a-round-on-the-house": { world: ["Lodging and information find you free anywhere the name has reached", "One solid rumor per night, unasked"] },
  "maverick/table-stakes": { world: ["Name your loss cap before cards, bets or shakedowns — it holds", "You never lose more than you meant to"] },
  "maverick/price-on-paper": { world: ["Bounties on you are leverage — spend them as fear, or bargain them down", "Bounties you claim pay double"] },
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

const signed = (value: number, digits = 0) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits).replace(/\.?0+$/, "")}`;
const signedPct = (value: number) => `${value >= 0 ? "+" : "−"}${Math.round(Math.abs(value) * 100)}%`;
const plural = (value: number, word: string) => `${word}${Math.abs(value) === 1 ? "" : "s"}`;
/** A per-contact-beat rate shown as a human interval: "about every 25s". */
const everySeconds = (perBeat: number) => {
  const seconds = 3 / perBeat;
  return seconds >= 10 ? `${Math.round(seconds / 5) * 5}s` : `${Math.round(seconds)}s`;
};

/**
 * The plain gameplay lines a popout shows for one effect object.
 *
 * LIVE-SERVER LANGUAGE: this is an FPS on a dedicated server — no rounds,
 * no turns, no pausing — so every line speaks in seconds, rates, and
 * per-shot chances. Internal rates are stored per contact beat (3s) and
 * converted here; the Dying clock is stored in seconds outright.
 */
export function describeEffects(effect: NodeEffect): string[] {
  const lines: string[] = [];
  if (effect.world) lines.push(...effect.world);
  if (effect.accuracy) lines.push(`${signedPct(effect.accuracy)} shots on target — tighter spread, steadier recoil`);
  if (effect.damageBonus) lines.push(`${signed(effect.damageBonus, 2)} damage on every hit that lands`);
  if (effect.incoming !== undefined && effect.incoming !== 1) {
    lines.push(effect.incoming < 1 ? `${signedPct(effect.incoming - 1)} damage taken` : `${signedPct(effect.incoming - 1)} damage taken (the cost half)`);
  }
  if (effect.toughness) lines.push(`${signed(effect.toughness)} ${plural(effect.toughness, "hit")} before Down`);
  if (effect.extraPlates) lines.push(`${signed(effect.extraPlates)} armour ${plural(effect.extraPlates, "plate")} carried`);
  if (effect.dyingClock) lines.push(`${signed(effect.dyingClock)} seconds on your bleed-out timer once you're Down`);
  if (effect.initiative) lines.push(`${signedPct(effect.initiative)} readiness — draw, mount and first shot come sooner`);
  if (effect.castCost !== undefined && effect.castCost !== 1) lines.push(`${signedPct(effect.castCost - 1)} cast costs`);
  if (effect.resourceCap) lines.push(`${signed(effect.resourceCap)} maximum pool / charges`);
  if (effect.resourcePerHit) lines.push(`${signed(effect.resourcePerHit, 1)} pool or charges back per landed hit`);
  if (effect.resourcePerWound) lines.push(`${signed(effect.resourcePerWound, 1)} back per wound taken`);
  if (effect.ammo) lines.push(`${signedPct(effect.ammo)} ammunition carried`);
  if (effect.selfRepair) lines.push(`one of your wounds closes about every ${everySeconds(effect.selfRepair)} while you're in the fight`);
  if (effect.partyHeal) {
    lines.push(effect.partyHeal >= 1
      ? `pulls a downed ally back to their feet — up with ${effect.partyHeal} ${plural(effect.partyHeal, "wound")} restored`
      : `field-mends nearby allies ${Math.round(effect.partyHeal * 20)} wounds' worth a minute`);
  }
  if (effect.partyMitigation) lines.push(`allies near you take ${signedPct(-effect.partyMitigation)} damage`);
  if (effect.extraAction) lines.push(`${signedPct(effect.extraAction)} action tempo — attacks, casts and swaps cycle faster`);
  if (effect.concealment) {
    lines.push(effect.concealment > 0
      ? `${Math.round(effect.concealment * 100)}% harder to target — and to hit when targeted`
      : `${Math.round(-effect.concealment * 100)}% easier to read and to hit (a cost)`);
  }
  if (effect.detection) lines.push(`sees through ${Math.round(effect.detection * 100)}% concealment`);
  if (effect.control) lines.push(`${Math.round(effect.control * 100)}% chance on each attack to strip a plate or stagger footing`);
  if (effect.enemyCastCost && effect.enemyCastCost !== 1) lines.push(`enemy casts in range cost ×${effect.enemyCastCost}`);
  if (effect.minions) {
    lines.push(effect.minions >= 1
      ? `${effect.minions} bonded ${effect.minions === 1 ? "body fights" : "bodies fight"} beside you, on their own strength`
      : `your bond strikes on its own every few seconds`);
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
