import type { AbilityCard } from "../ability-cards";

/**
 * Archon — every node's card, keyed by node id; corrupted phases keyed
 * corrupt-1..corrupt-7.
 *
 * Numbers agree with lib/talent-effects.ts (the balance truth) wherever a
 * node has an entry there, worded per Docs/codex/ABILITY_CARD_STYLE.md.
 * Cooldowns, ranges and durations on Actives and Spells are the style
 * guide's defaults; `untested` marks an Effect-line number written by hand.
 */
export const archonCards: Record<string, AbilityCard> = {
  // ===================================================== THE BOND (core)
  "first-bond": {
    kind: "Unlock",
    effect: "+1 bonded body fighting beside you: one creature, machine or working body, bonded at a bench or a kill.",
    notes: "Opens the bond slot every other Archon node builds on. A bond that goes Down is patched, not replaced, unless it dies.",
  },
  "soft-signal": {
    kind: "Passive",
    effect: "6% harder to target and to hit. Animals do not spook at your approach and machines do not flag you on sight.",
  },
  "borrowed-eyes": {
    kind: "Active",
    cooldown: "20s",
    range: "Line of sight",
    duration: "10s",
    effect: "Look through your bond's senses: while you do, you see through 12% concealment and mark what the bond can see.",
    notes: "Your own body stands still while you look. Ends early if the bond goes Down.",
  },
  "fed-first": {
    kind: "Passive",
    effect: "Damage dealt +10%. Your bonds hold their orders through FIRE, Burning and a Down beside them instead of breaking.",
  },
  "splints-and-solder": {
    kind: "Passive",
    effect: "One of your bond's wounds closes about every 50s while in combat, whatever the bond is made of: meat, steel or a raised body.",
    notes: "Works on you too when no bond is wounded. Stacks with Patch Loop between fights.",
  },
  "two-voices": {
    kind: "Unlock",
    effect: "+1 bonded body fighting beside you: two bonds active at once, each taking its own orders.",
    notes: "Gate for One Bond and Many Voices.",
  },
  "one-bond": {
    kind: "Choice",
    effect: "Your bonds' damage dealt +60% and +1 Hit before Down.",
    notes: "Locks Many Voices for good. Needs Two Voices.",
  },
  "many-voices": {
    kind: "Choice",
    effect: "+1 bonded body fighting beside you: three bonds active at once.",
    notes: "Locks One Bond for good. Needs Two Voices.",
  },
  "the-chorus": {
    kind: "Active",
    cooldown: "20s",
    range: "Line of sight",
    effect: "Give one order and every bond acts on it at once: action speed +20% (attacks, casts and swaps cycle faster) and damage dealt +20%.",
    notes: "Needs One Bond or Many Voices. Bonds out of your line of sight do not hear the order.",
  },

  // ======================================================== PACKLEADER
  "scent-line": {
    kind: "Passive",
    effect: "Point at a target and your pack tracks it: your bonds see through 8% concealment and follow a trail up to a day old.",
    notes: "Tracking a trail is the beasts' work; machine and raised bonds do not scent.",
    untested: true,
  },
  "calm": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "10m",
    duration: "Instant",
    effect: "Unlocks Calm (Xenic, Licensed): one animal within range, panicked or hostile, settles in seconds. Works up to great-beast size.",
    notes: "Noise beats it: anything louder than you wakes the animal back up. A pushed cast calms you instead.",
  },
  "taught-once": {
    kind: "Passive",
    effect: "Behaviours taught to your bonded animals never decay: one demonstration holds for life.",
  },
  "watchword": {
    kind: "Passive",
    effect: "A bond holds a post alone (ground, a door or a person) for days if fed, and sends for you the moment the post is tested.",
    notes: "The bond stays where it was set until you recall it or it starves.",
  },
  "pack-tactics": {
    kind: "Passive",
    effect: "Damage dealt +30%. Your beasts flank, herd and hold a target on their own without an order.",
  },
  "blooded-pack": {
    kind: "Passive",
    effect: "Damage dealt +30%. The pack keeps what each kill it survives taught it.",
    notes: "Stacks with Pack Tactics for +60% together.",
  },
  "fangs-beside-you": {
    kind: "Passive",
    effect: "A bonded beast's damage dealt +40%.",
  },
  "rung-read": {
    kind: "Capstone",
    effect: "Read a creature's mutation rung and what drove it there on sight: you see through 15% concealment and your damage dealt +20%.",
    notes: "Trainer: Keira Ansel. Reads the Adaptive Mutation ladder (None, Minor, Functional, Advanced, Aberrant) at any range you can see the creature.",
  },

  // ============================================================== APEX
  "groom-and-feed": {
    kind: "Passive",
    effect: "Your great beast opens every fight fight-ready: fed, calm and checked, always and automatically.",
  },
  "saddle-bond": {
    kind: "Unlock",
    effect: "Opens the saddle: one great beast accepts you as its rider. +1 Hit before Down.",
    notes: "Needs a great beast among your bonds. Only one mount at a time.",
  },
  "thermal-roads": {
    kind: "Passive",
    effect: "Mounted flight rides thermals: air travel speed +30% at half the beast's fatigue.",
    notes: "Needs a flying mount (Skyborne) to pay out in the air.",
  },
  "combat-drop": {
    kind: "Active",
    cooldown: "20s",
    range: "10m",
    effect: "Drop from the saddle onto a target below you: readiness +20% (draw, mount and first shot come sooner) and damage dealt +30%.",
    notes: "Needs Saddle Bond and a mount under you. Remounting is a full action.",
  },
  "war-mount": {
    kind: "Passive",
    effect: "Your mount fights under you: damage dealt +40% and +1 Hit before Down while you are in the saddle.",
  },
  "weather-wings": {
    kind: "Passive",
    effect: "Storms are flying weather: wind and rain no longer ground your mount. Lightning still does.",
  },
  "riders-eye": {
    kind: "Capstone",
    effect: "Read a route from above: readiness +15% (draw, mount and first shot come sooner) and you see through 10% concealment.",
    notes: "Trainer: the Captured Rider.",
  },
  "skyborne": {
    kind: "Capstone",
    effect: "Unlocks mounted flight. In the air you are 15% harder to target and to hit, readiness +20% and damage dealt +20%.",
    notes: "Trainer: the Unridden, a beast that consents. Thermal Roads and Weather Wings apply from here.",
  },

  // ======================================================== DRONEWRIGHT
  "everything-flies-twice": {
    kind: "Passive",
    effect: "Downed machines strip to parts and parts fly again as a drone: your bond strikes on its own every few seconds.",
    notes: "One salvage drone at a time. A destroyed machine gives no parts.",
  },
  "ask": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "5m",
    duration: "Instant",
    effect: "Unlocks Ask (Technomantic, Licensed): one question to a working machine, answered honestly. Once per machine per day.",
    notes: "A machine never given an order has nothing to say. A pushed cast asks you instead.",
  },
  "wake": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "5m",
    effect: "Unlocks Wake (Technomantic, Licensed): a dead machine answers once. Woken beside you it strikes on its own every few seconds, then goes dark again.",
    notes: "Once per machine. A pushed cast wakes it displeased with you.",
  },
  "patch-loop": {
    kind: "Passive",
    effect: "Your machines mend themselves between fights to full function by the next one. Destroyed stays destroyed.",
  },
  "standing-orders": {
    kind: "Passive",
    effect: "Damage dealt +20%. Your machines keep working their last order when you look away or leave.",
  },
  "swarm-logic": {
    kind: "Passive",
    effect: "+1 bonded body fighting beside you (a small drone) and damage dealt +10%.",
  },
  "loyal-code": {
    kind: "Passive",
    effect: "Your machines refuse any order that is not yours, and they get 6% chance per attack to strip a plate or stagger.",
    notes: "Beats Technomantic Handshake and a stolen controller.",
  },
  "interlock": {
    kind: "Capstone",
    effect: "Reverse an isolation command meant to be final: the machine returns to your orders, and your machines get 15% chance per attack to strip a plate or stagger.",
    notes: "Trainer: Tomas Vey. Replaces Loyal Code's 6%; the two do not stack.",
  },

  // =========================================================== SUMMONER
  "ledger-of-places": {
    kind: "Unlock",
    effect: "Everywhere you have stood becomes a saved anchor, addressable for Summoner work. No cap; anchors never expire.",
  },
  "fetch": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Any range",
    duration: "30s",
    effect: "Unlocks Fetch (Translocative, Licensed): a known object up to satchel weight is brought to hand from any anchor in 30 seconds.",
    notes: "Needs Ledger of Places for anchors. A pushed cast fetches you.",
  },
  "send": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Any range",
    duration: "30s",
    effect: "Unlocks Send (Translocative, Licensed): up to satchel weight delivered to any anchor in 30 seconds.",
    notes: "A pushed cast sends you away, destination unspecified.",
  },
  "return-address": {
    kind: "Active",
    cooldown: "8s",
    range: "Any range",
    effect: "Say one word and anything you Sent returns to your hand.",
    notes: "Works on Fetch, Send and Consignment loads; Freight Class loads return on their own daily move.",
  },
  "stable-arrival": {
    kind: "Passive",
    effect: "Consignments arrive exactly where declared: no drift, no damage, stacked as packed.",
  },
  "freight-class": {
    kind: "Unlock",
    effect: "Send and Fetch scale to freight: crates, emplacements, a mount. One freight move per day.",
    notes: "Heavy things arrive late against Inertial Set, Containment or Gravitic Weight at the anchor.",
  },
  "consignment": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Any range",
    effect: "Unlocks Consignment (Translocative, Certified): one object above satchel weight, or one person, delivered to any anchor; arrival time is negotiated, never fixed. Action speed +10% (attacks, casts and swaps cycle faster).",
    notes: "Stable Arrival fixes the landing spot but not the time. A pushed cast negotiates and loses.",
  },
  "crossing": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "10m around you, to any anchor",
    effect: "Unlocks Crossing (Translocative, Master): your whole squad within reach of you moves to any anchor at once. Readiness +25% (draw, mount and first shot come sooner).",
    notes: "Trainer: the Gate Clerk. Licensed through the Skybridge Transit Authority as freight. A pushed cast takes the floor and the room with you.",
  },

  // ======================================================== GRAVECALLER
  "respect-the-dead": {
    kind: "Passive",
    effect: "Gravecalling costs no standing with peoples who bury their dead. Rites are observed automatically, so families see care, not theft.",
  },
  "still": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "10m",
    duration: "10s",
    effect: "Unlocks Still (Reanimative, Licensed): one moving dead body stops mid-step. Holds 10 seconds, or until touched.",
    notes: "Works on the dead that move (a Risen, a raised body), not the living. A pushed cast stops what you started mid-cast.",
  },
  "stand": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "Hours",
    effect: "Unlocks Stand (Reanimative, Licensed): a dead body rises and works a shift. +1 bonded body fighting beside you.",
    notes: "One raised body per licence and signature until Double Shift. Preservation Clause stretches the shift to days.",
  },
  "preservation-clause": {
    kind: "Passive",
    effect: "Raised bodies hold four days in the field, not hours.",
  },
  "shift-work": {
    kind: "Passive",
    effect: "A raised body's shift runs longer and its work heavier: damage dealt +15%.",
  },
  "double-shift": {
    kind: "Unlock",
    effect: "+1 bonded body fighting beside you: two raised bodies work on one licence and one signature.",
    notes: "Needs Stand.",
  },
  "last-order": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Melee",
    effect: "Unlocks Last Order (Reanimative, Certified): a raised body's final instruction executes once, exactly as spoken. It survives your distance, your Down and your death.",
    notes: "One Last Order per body. A pushed cast has the nearest body obey your own last order.",
  },
  "witness": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Melee",
    effect: "Unlocks Witness (Reanimative, Master): a dead body testifies, and its testimony is admissible before any Ossuary Covenant chapter. Your raised bodies get 10% chance per attack to strip a plate or stagger.",
    notes: "Trainer: the Advocate of the Dead. Burning the body is the only counter. A pushed cast has the dead testify against you.",
  },

  // ============================================ THE FERAL CHORUS (free)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Readiness +8% (draw, mount and first shot come sooner): your bonds read the tremor and act a beat early.",
    notes: "Lit at phase 1, Tremor. Every phase's effect stays lit as you climb.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "+1 Hit before Down: veining crosses the bond and your bonds harden with you.",
    notes: "Lit at phase 2, Veining.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "Your bond strikes on its own every few seconds, hunting for you and bringing it back.",
    notes: "Lit at phase 3, Appetite.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "You see through 15% concealment, sensing through every bond at once.",
    notes: "Lit at phase 4, Sensitivity. Institutional cost from here: you are 12% easier to read and to hit, and instruments flag you at every checkpoint.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +15%: your bonds carry out orders you never gave, correctly.",
    notes: "Lit at phase 5, Drift. Institutional cost: nobody sells you plates, so you run one plate slot short (−1 plate slot). Phase 4's cost still applies.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "10% harder to target and to hit: at Turning, wild things treat you as one of their own.",
    notes: "Lit at phase 6, Turning. Institutional cost: nobody billets with you, and between-fight care halves. Phase 4 and 5 costs still apply.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
    notes: "Lit at phase 7. The Chorus keeps singing without a singer.",
  },
};
