import type { AbilityCard } from "../ability-cards";

/**
 * Cypherist — every node's card, keyed by node id; corrupted phases keyed
 * corrupt-1..corrupt-7.
 *
 * Numbers agree with lib/talent-effects.ts wherever that map has an entry;
 * `untested` marks any number written by hand (cooldowns, durations, deploy
 * times, the extra mechanics a flavor line implied) that the balance campaign
 * has not measured. Flavor stays on the node's `desc` in lib/talent-trees.ts.
 */
export const cypheristCards: Record<string, AbilityCard> = {
  // ===================================================== THE BENCH (core)
  "make-it-run": {
    kind: "Active",
    cooldown: "45s",
    range: "Melee",
    effect: "Field-fix one weapon, rig or augment to working order for the rest of the fight. One of your wounds closes about every 50s while in combat.",
    notes: "The fix holds until the fight ends, then the piece needs a bench.",
    untested: true,
  },
  "salvage-rights": {
    kind: "Passive",
    effect: "Ammunition carried +30%. Strip a body or a wreck for rounds and parts in 15s instead of a minute.",
    untested: true,
  },
  "bench-anywhere": {
    kind: "Unlock",
    effect: "Stands up a working bench on anything flat in 60 seconds. Opens the full crafting menu anywhere.",
    notes: "No town, no shop, no licence check at the bench. A named piece is still never made here.",
  },
  "schematic-memory": {
    kind: "Passive",
    effect: "Anything you have taken apart becomes a known schematic: you build it from memory at any bench, with no plans in hand.",
    notes: "Pairs with Bench Anywhere. Licensed or patented designs still add suspicion when you build them.",
  },
  "overclock-anything": {
    kind: "Active",
    cooldown: "30s",
    range: "Melee",
    duration: "20s",
    effect: "Push one weapon, rig or device you can touch past spec: damage dealt +20%.",
    notes: "Works on an ally's gear as well as yours. The piece loses one durability step when the overclock ends.",
    untested: true,
  },
  "patents-be-damned": {
    kind: "Passive",
    effect: "Aegis lockouts, warranty seals and licence checks no longer stop hardware working for you: damage dealt +20%.",
    notes: "Every bypass adds suspicion with Aegis Extraction Consortium; the lawyers are informed.",
  },
  "true": {
    kind: "Capstone",
    effect: "Restores one weapon to its original spec: damage dealt +30%, hit chance +4%.",
    notes: "Trainer: the Kestrel Mechanic. Points alone never open it. Gate to the Wired / Clean Hands fork.",
  },
  "wired": {
    kind: "Choice",
    effect: "Readiness +20% (draw, mount and first shot come sooner) and action speed +10% (attacks, casts and swaps cycle faster). Counts as chrome: ELECTRICAL can vent it.",
    notes: "Locks Clean Hands for good. Needs True. ELECTRICAL puts the chrome offline for a minute unless hardened. The Forge never records chrome: die and it stays in the corpse, and a financed piece brings the repossession agent to where you bind.",
  },
  "clean-hands": {
    kind: "Choice",
    effect: "Damage taken −5%, +1 Hit before Down. Nothing in your body counts as chrome, so ELECTRICAL vents nothing on you.",
    notes: "Locks Wired for good. Needs True. You die whole and the Forge rebuilds you whole.",
  },
  "prototype": {
    kind: "Capstone",
    effect: "Builds one piece nobody else owns: damage dealt +50% while you carry it.",
    notes: "Trainer: the Foundry-Master. Needs Wired or Clean Hands. The piece is a named item: at most one named piece at a time, and it stays on your corpse.",
  },

  // ===================================================== EXOFRAME
  "quick-doff": {
    kind: "Passive",
    effect: "Exoframe on or off in 5 seconds, with no help and no crane.",
    notes: "Without it a frame takes a minute and a second pair of hands.",
  },
  "frame-fit": {
    kind: "Unlock",
    effect: "Opens the exoframe: +1 Hit before Down while you wear it. Counts as chrome: ELECTRICAL can vent it.",
    notes: "Every other Exoframe node needs the frame worn. ELECTRICAL puts the frame offline for a minute unless hardened. The Forge never records it: die and the frame stays on the corpse.",
  },
  "load-servos": {
    kind: "Passive",
    effect: "Ammunition carried +30%. In the frame you carry a crew-served weapon and its crate alone, with no Conditioning penalty.",
    notes: "Frame only.",
  },
  "hardpoints": {
    kind: "Passive",
    effect: "Mounts one weapon or tool on the frame and fires it hands-free: damage dealt +30%.",
    notes: "Frame only. The mount fires alongside whatever is in your hands.",
  },
  "crash-brace": {
    kind: "Passive",
    effect: "+1 Hit before Down, damage taken −8%.",
    notes: "Frame only. The frame takes the Hit that would have put you Down, and keeps the hole until it is repaired at a bench.",
  },
  "hydraulic-answer": {
    kind: "Passive",
    effect: "Melee strikes from the frame deal damage +40% and knock the target 2m back.",
    notes: "Frame only. Weave: buying this or Interface links both branches. Counts as PHYSICAL: a plate still absorbs the Hit.",
    untested: true,
  },
  "dead-mans-frame": {
    kind: "Passive",
    effect: "Once per fight, refuse to go Down: the frame keeps you standing at Hit for 10s, then Down applies unless you were healed.",
    notes: "Frame only. A frame ELECTRICAL has vented cannot catch you.",
    untested: true,
  },
  "pilot": {
    kind: "Choice",
    effect: "Damage dealt +50%, +1 Hit before Down while you wear the frame.",
    notes: "Locks Uplink for good. Frame only: no frame, no bonus.",
  },

  // ===================================================== EMPLACER
  "instant-architecture": {
    kind: "Passive",
    effect: "Emplacements deploy in 5s instead of a minute. Your emplacement strikes on its own every few seconds.",
    untested: true,
  },
  "sentry": {
    kind: "Active",
    cooldown: "45s",
    range: "10m",
    duration: "Until destroyed or moved",
    effect: "Deploys a turret that holds one 90° arc: +1 emplacement fighting beside you.",
    notes: "Draws from the party's crate. One turret at a time; Firebase allows a second.",
    untested: true,
  },
  "barricade": {
    kind: "Active",
    cooldown: "30s",
    range: "5m",
    duration: "Until destroyed",
    effect: "Deploys 3m of hard cover: allies within 10m take −10% damage, and you carry +1 plate slot.",
    notes: "Cover is a plate with a location: PHYSICAL chews it, FIRE ignores half of it, ARCANE ignores it.",
    untested: true,
  },
  "part-of-the-scenery": {
    kind: "Passive",
    effect: "You and your emplacements are 10% harder to target and to hit. An emplacement that has not fired yet reads as furniture to anyone who did not see it placed.",
  },
  "ammo-feed": {
    kind: "Passive",
    effect: "Ammunition carried +40%. Emplacements draw from the party's crate at no extra cost.",
  },
  "shield-pylon": {
    kind: "Spell",
    cost: "1 capacitor cell",
    range: "5m",
    duration: "While the cell holds (about 60s)",
    effect: "Unlocks Seal (Containment, Licensed) as hardware: a pylon wards one door, window or breach, and no body or round crosses it while the cell holds. Allies within 10m take −12% damage.",
    notes: "Runs off a capacitor cell instead of pool or charges: anyone can plant it, no Containment licence needed. A drained pylon fails like a pushed Seal and seals against you. ELECTRICAL vents the cell.",
    untested: true,
  },
  "overwatch-net": {
    kind: "Passive",
    effect: "Every emplacement and squadmate shares your target picture: sees through 12% concealment, damage dealt +20%.",
    notes: "Weave: buying this or Tap the Lattice links both branches.",
  },
  "firebase": {
    kind: "Unlock",
    effect: "Opens the full network: turrets, pylons and net run as one. +1 emplacement fighting beside you, and allies within 10m take −12% damage.",
    notes: "Stacks with Sentry (a second emplacement) and Shield Pylon.",
  },

  // ===================================================== GRIDRUNNER
  "radio-weather": {
    kind: "Passive",
    effect: "Sees through 12% concealment. Every transmitter, drone and live feed within 25m is felt as a direction, walls or not.",
    untested: true,
  },
  "tap-the-lattice": {
    kind: "Passive",
    effect: "Sees through 15% concealment: the Bureau's lattice feeds you every camera and drone on the same grid.",
    notes: "Weave: buying this or Overwatch Net links both branches. Each borrowed look adds suspicion with the Drone Surveillance Bureau. Nothing to borrow where the lattice does not reach.",
  },
  "ghost-credentials": {
    kind: "Passive",
    effect: "Machine systems remember you as cleared: doors, terminals and checkpoints open for you. Human double-checks are still your problem.",
  },
  "loop-the-feed": {
    kind: "Active",
    cooldown: "90s",
    range: "25m",
    duration: "60s",
    effect: "Every camera within 25m replays a quiet minute: 12% harder to target and to hit, and nothing on the feed shows you for 60s.",
    notes: "Beats instruments, not eyes. Ends early if a feed is cut or a camera is moved.",
    untested: true,
  },
  "handshake": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Melee",
    effect: "Unlocks Handshake (Technomantic, Certified): a machine you touch answers one question about the last person who gave it an order. Reading enemy hardware in the fight: 10% chance per attack to strip a plate or stagger.",
    notes: "Licence: Drone Surveillance Bureau. A machine never given an order has nothing to say. Pushed, it tells you about the last person and then about everyone.",
  },
  "dead-mans-switch": {
    kind: "Active",
    cooldown: "Once per fight",
    range: "25m",
    duration: "Until triggered",
    effect: "Rigs one device to fire the moment you go Down or stop answering for 10s. Every device you rig is set hotter: damage dealt +30%.",
    notes: "The switch fires even if you are Dead. Disarm it yourself before you leave the fight or it stays armed.",
    untested: true,
  },
  "testimony": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Melee",
    effect: "Unlocks Testimony (Technomantic, Master): a machine you touch gives everything it has ever been told, in order. Sees through 20% concealment; 10% chance per attack to strip a plate or stagger.",
    notes: "Trainer: NAG — yes, the watch. Points alone never open it. Pushed, the testimony includes what it was told about you.",
  },
  "uplink": {
    kind: "Choice",
    range: "Any range",
    effect: "+1 drone fighting beside you, run from cover at any range while a feed holds; 14% harder to target and to hit. Damage taken +10%: the body is soft.",
    notes: "Locks Pilot for good. The feed traces both ways: anything that sees through concealment finds the body.",
  },

  // ===================================================== CHROMEWRIGHT
  "steady-scalpel": {
    kind: "Passive",
    effect: "Install work heals clean every time: no infection, no rejection, recovery time halved.",
  },
  "fit-a-friend": {
    kind: "Unlock",
    effect: "Opens install and tuning work on the whole party: allies within 10m take −8% damage.",
    notes: "Whatever you fit to a friend is chrome on them: ELECTRICAL can vent it, and the Forge never records it.",
  },
  "ninety-seconds": {
    kind: "Passive",
    effect: "Full augment recovery from a body takes 90 seconds, anywhere, no bench. The trade's named time, met every time.",
    notes: "Without it, recovery needs Engineering at licensed rung or the Bone Market.",
  },
  "donor-bank": {
    kind: "Passive",
    effect: "Recovered augments are cleaned, tuned and kept ready. Sell or install them at full value, not salvage rates.",
  },
  "cosmesis": {
    kind: "Passive",
    effect: "12% harder to target and to hit. Your chrome and your corruption tells read as flesh to instruments and strangers.",
    notes: "Never fools people who know you, and never the Forge: die in public and it rebuilds the meat, not the mask.",
  },
  "aftermarket": {
    kind: "Passive",
    effect: "Unlicensed mods on every piece you fit: damage dealt +30%.",
    notes: "Each mod adds suspicion with the licensing bodies. Modded chrome still counts as chrome for ELECTRICAL.",
  },
  "interface": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Melee",
    effect: "Unlocks Interface (Bionic, Certified): an implant answers to a body it was not built for, so any recovered augment fits any body. The fit holds: +1 Hit before Down.",
    notes: "Weave: buying this or Hydraulic Answer links both branches. Aegis's lawyers are informed with every cast. ELECTRICAL vents Bionic work. Pushed, the implant answers to somebody else.",
  },
  "second-skeleton": {
    kind: "Capstone",
    effect: "+2 Hits before Down, damage taken −10%. Counts as chrome: ELECTRICAL can vent it.",
    notes: "Trainer: the Fully Converted. ELECTRICAL puts the frame offline for a minute unless hardened. The Forge rebuilds only the meat: die and the skeleton stays in the corpse, and you come back a fraction.",
  },

  // ===================================================== CELLWORKS
  "safe-hands": {
    kind: "Passive",
    effect: "Unstable devices go stable in your hands: bombs, cores and hot cells. Set one down and its countdown resumes.",
  },
  "charge-packing": {
    kind: "Passive",
    effect: "+6 maximum pool / charges: every capacitor cell holds more and does not leak inside the day.",
  },
  "stormglass-loads": {
    kind: "Passive",
    effect: "Stormglass rounds no longer misfire: damage dealt +20%, hit chance +4%.",
    notes: "Stormglass deals ARCANE, which ignores the plate entirely and leaves a scar a reader knows.",
  },
  "trigger-craft": {
    kind: "Passive",
    effect: "Every device you build can fire by remote, on a timer or on a tripwire: damage dealt +20%.",
    notes: "Dead Man's Switch and Spell in a Can use these triggers.",
  },
  "capacitor-array": {
    kind: "Unlock",
    effect: "Opens the battery bank: +10 maximum pool / charges, carried as cells beyond the two-cell reserve.",
    notes: "Cells are loaded before a fight from a pool or a dose, spent once, and decay inside a day. ELECTRICAL vents cells.",
  },
  "grid-tap": {
    kind: "Passive",
    effect: "+1 pool or charges per landed hit. Any live grid you touch recharges your cells, metered or not.",
    notes: "Tapping a metered grid without paying adds suspicion with whoever owns it.",
  },
  "dampening-coil": {
    kind: "Active",
    cost: "1 capacitor cell",
    cooldown: "60s",
    range: "Self",
    duration: "30s",
    effect: "Raises a bubble around you: enemy casts within 10m cost ×2.",
    notes: "Your own casts inside the bubble pay double too, and so does Spell in a Can. Tech's standing answer to magic, portable.",
    untested: true,
  },
  "spell-in-a-can": {
    kind: "Active",
    cost: "1 capacitor cell",
    cooldown: "20s",
    range: "10m",
    effect: "Packs one Licensed-tier spell from any caster at your bench into a cell that anyone can trigger once. Damage dealt +40%, action speed +8% (attacks, casts and swaps cycle faster).",
    notes: "The can fires by any Trigger Craft trigger. It counts as a cast where it goes off: Dampening Coil doubles its cost, and ELECTRICAL vents it unfired.",
    untested: true,
  },

  // ===================================================== THE GLITCH (corrupted, free)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Hit chance +4%: your machines correct for the tremor in your hands.",
    notes: "Phase 1, Tremor. Nothing closes at phase 1. A medic sees the hand; a stranger does not, yet.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "+5 maximum pool / charges: veining conducts, and small devices run off your touch.",
    notes: "Phase 2, Veining. Temporal licences close at any tier and every future reclamation costs +10%.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "One of your wounds closes about every 60s while in combat.",
    notes: "Phase 3, Appetite. Command ceilings close; you ask when the next issue is due and everyone hears it.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 15% concealment: current, signal and charge, heard through walls.",
    notes: "Phase 4, Sensitivity. Institutional cost: 12% easier to read and to hit. Instruments flag you at every checkpoint; reclamation costs +20%.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +20%: designs surface from whoever the dose used to be, and you build them.",
    notes: "Phase 5, Drift. Institutional costs: 12% easier to read and to hit, and nobody sells you plates — one plate slot short. Every teacher closes except the Choir and the Covenant.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "12% harder to target and to hit: instruments file you as hardware, and hardware files you as friendly.",
    notes: "Phase 6, Turning. Institutional costs: 12% easier to read and to hit, one plate slot short, and nobody billets with you — between-fight care halves. Binding closes at any Forge with a policy.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
    notes: "Phase 7. The bench keeps working. Nobody is at it.",
  },
};
