import type { AbilityCard } from "../ability-cards";

/**
 * Surger — every node's card, keyed by node id; corrupted phases keyed
 * corrupt-1..corrupt-7.
 *
 * Numbers agree with lib/talent-effects.ts (the sims' truth) wherever a node
 * has an entry there. Anything hand-written on top — a cooldown, a hold
 * time, an exchange rate, a duration the map does not carry — is marked
 * `untested`. The casting economy the cards lean on is the codex's: a dose
 * loads 5 charges, the body holds Conductivity + 2, casts cost 1 / 2 / 4
 * charges by tier, and a standard rig reads one charge high.
 */
export const surgerCards: Record<string, AbilityCard> = {
  // --------------------------------------------------------------- Overdrive
  "first-dose": {
    kind: "Passive",
    effect: "+4 maximum pool / charges. Dosing takes one motion (1s) instead of three.",
  },
  "honest-rig": {
    kind: "Passive",
    effect: "Your rig delivers every charge it lights: no one-charge-high misread. Cast costs −8%.",
    notes: "Only your own rig in your own hands; anyone else on it reads one charge high, as standard.",
  },
  "vein-map": {
    kind: "Passive",
    effect: "6% harder to target and to hit. Your corruption tells are hidden from strangers at any distance without sleeves; medics and instruments still read them.",
  },
  "hot-load": {
    kind: "Passive",
    effect: "+4 maximum pool / charges. A dose that overfills you keeps the overflow instead of venting it.",
    notes: "Nothing stacks past the raised cap; Overrun is the only way over it.",
  },
  "soft-landing": {
    kind: "Passive",
    effect: "One of your wounds closes about every 50s while in combat. The comedown never lands mid-fight: it waits until you have been out of contact for 30s.",
  },
  "clean-burn": {
    kind: "Choice",
    effect: "Cast costs −10%. Corruption advances 0.5× per dose; Surge and Overrun spike at 75% strength.",
    notes: "Locks Red Line for good. Opens Overrun.",
    untested: true,
  },
  "red-line": {
    kind: "Choice",
    effect: "Damage dealt +50%; damage taken +6%. Corruption advances 1.5× per dose, so the corrupted ladder climbs faster and each phase pays out sooner.",
    notes: "Locks Clean Burn for good. Opens Overrun. The institutional costs of phases 4, 5 and 6 arrive at the same faster rate.",
    untested: true,
  },
  overrun: {
    kind: "Capstone",
    cooldown: "Once per day",
    range: "Self",
    duration: "Until spent",
    effect: "+8 maximum pool / charges. Once per day, load a second dose on a full rig: +5 charges over cap with no vent and no rig damage.",
    notes: "Trainer: the Infuser-Tech. Needs Clean Burn or Red Line. A second overrun in the same day burns the rig out: 1 hour at a bench before it lights again.",
    untested: true,
  },
  surge: {
    kind: "Capstone",
    cooldown: "Once per fight",
    range: "Melee",
    duration: "Instant",
    effect: "Once per fight, spend everything at once: a 6-charge burst delivered as a single strike. Damage dealt +30%.",
    notes: "Trainer: the Phase-Five. The burst empties the rig; with fewer than 6 charges loaded it fires what you have. Clean Burn fires it at 75%; Red Line does not shrink it.",
  },

  // ----------------------------------------------------------------- Berserk
  headlong: {
    kind: "Passive",
    effect: "Readiness +15% (draw, mount and first shot come sooner).",
  },
  shove: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "Instant",
    effect: "Unlocks Shove (Kinetic, Licensed): throws one target 2m back; 60% chance to floor anyone your size or lighter.",
    notes: "A floored target is up again in 2s. Pushed cast: the target goes through the wall and you through the opposite one.",
  },
  "wrecking-weight": {
    kind: "Passive",
    effect: "Damage dealt +30%. Doors, boards and light walls count as targets: one melee hit puts a door down.",
  },
  flywheel: {
    kind: "Passive",
    effect: "+1.6 pool or charges per landed hit. Damage dealt +20%.",
    notes: "Stacks with Tithe (+1.4 per landed hit) and Ride the Hit. Nothing returns past your cap; Hot Load keeps the overflow.",
  },
  brace: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Self",
    duration: "10s",
    effect: "Unlocks Brace (Inertial, Licensed): for 10s no blast, current, shove or body moves you from where you stand. Damage taken −8%.",
    notes: "Weave: buying Brace or One Flesh links both paths. Does not stop Down. Pushed cast: you cannot move either until it ends.",
  },
  "ride-the-hit": {
    kind: "Passive",
    effect: "+2.5 pool or charges per Hit taken. Damage dealt +20%.",
    notes: "A Hit a plate absorbs still pays; a Graze does not. Feeds Flywheel's spend.",
  },
  arrest: {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    duration: "5s",
    effect: "Unlocks Arrest (Kinetic, Certified): catches one round in flight and holds it in your hand for up to 5s. 12% chance per attack to strip a plate or stagger.",
    notes: "A held round drops harmless when the 5s runs out unless Return sends it. Stormglass rounds cannot be Arrested: they detonate in the hand. Pushed cast: the round is still travelling, in your hand.",
    untested: true,
  },
  return: {
    kind: "Spell",
    cost: "8 pool · 4 charges",
    range: "Line of sight",
    duration: "Instant",
    effect: "Unlocks Return (Kinetic, Master): sends a held round back to whoever fired it, starting from inside them: an automatic Hit that ignores plates. Damage dealt +80%.",
    notes: "Needs a round held by Arrest. Pushed cast: it arrives from inside the wrong person.",
  },

  // ----------------------------------------------------------------- Shifter
  "skin-sense": {
    kind: "Passive",
    effect: "Borrowed traits report their needs (feeding, cooling, rest) 60s before they fail, so a Wear, Graft or Adjust never drops without warning.",
    untested: true,
  },
  adjust: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Self",
    duration: "1 hour",
    effect: "Unlocks Adjust (Morphic, Licensed): 1 hour of one bodily trait: grip, lungs or night sight. Hit chance +4%.",
    notes: "One Adjust at a time unless you own Battle Form. Pushed cast: leaves the night sight and makes daylight the problem.",
  },
  wear: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Self",
    duration: "Until swapped",
    effect: "Unlocks Wear (Morphic, Licensed): holds one trait from harvested material (claws, gills, plate, eyes) until you swap it; a swap takes 10 minutes at a bench.",
    notes: "Claws hit as a melee weapon, plate counts as one plate, gills breathe water, eyes see in the dark. Trophy Rack keeps three ready. Pushed cast: it wears you.",
  },
  "quick-molt": {
    kind: "Active",
    cooldown: "12s",
    range: "Self",
    duration: "Instant",
    effect: "Swaps one Adjust or worn trait mid-fight in one breath (1s) with no bench. Action speed +8% (attacks, casts and swaps cycle faster).",
    notes: "The swap itself costs no charges; a new Adjust still costs its cast. Skin Sense warns you before the outgoing trait fails.",
    untested: true,
  },
  "battle-form": {
    kind: "Passive",
    duration: "Until the fight ends",
    effect: "Your Adjusts stack, up to 3 at once, and hold until the fight ends instead of their hour. Damage dealt +30%; +1 Hit before Down.",
    notes: "Weave: buying Battle Form or Walk Among links both paths. Stacked Adjusts drop 60s after the last enemy falls.",
    untested: true,
  },
  "trophy-rack": {
    kind: "Unlock",
    effect: "Opens a rack of 3 harvested traits kept ready for Wear; each carries a Wardens signature and passes a checkpoint on paper.",
    notes: "Filling a slot needs harvested material and a bench. Swapping a racked trait in still takes Wear's 10 minutes, or Quick Molt's breath. Legal-ish: a Wardens inspector can still challenge the paper.",
  },
  graft: {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Self",
    duration: "1 week",
    effect: "Unlocks Graft (Morphic, Certified): a harvested trait that holds 1 week, the Wardens signing the material. Damage dealt +20%; +1 Hit before Down.",
    notes: "One Graft at a time. Unsigned material grafts the same and fails any checkpoint that reads paper. Pushed cast: it does not come off.",
  },
  assume: {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Self",
    duration: "1 hour",
    effect: "Unlocks Assume (Morphic, Master): takes the whole shape of a body you killed for 1 hour: its size, natural weapons and face. Damage dealt +50%; 10% harder to target and to hit.",
    notes: "Trainer: the Skinner of the Red Forest. Comes off on schedule or does not: a pushed cast sheds mid-crossing. Instruments still read your corruption phase through it.",
    untested: true,
  },

  // ---------------------------------------------------------------- Symbiont
  "reach-gut": {
    kind: "Passive",
    effect: "Anything harvested in the Reach counts as a real meal for you. One of your wounds closes about every 60s while in combat.",
  },
  "quiet-blood": {
    kind: "Passive",
    effect: "Predators read you as neither prey nor threat: wild beasts will not start a fight with you.",
    notes: "Ends the moment you attack an animal, until that fight ends. Mutated fauna in the Reach need Walk Among.",
  },
  "render-down": {
    kind: "Unlock",
    effect: "+8 maximum pool / charges. Harvested material renders into dose-grade fuel inside you: 1 unit of harvest eaten loads 1 charge, no rig needed.",
    notes: "Rendered charges carry no severed soul: they do not advance corruption. They still vent past cap unless Hot Load holds them.",
    untested: true,
  },
  "marsh-lungs": {
    kind: "Passive",
    effect: "Immune to bad air: spore, smoke, swamp gas, mine damp. You need no filter, and airborne TOXIC starts no clock on you.",
    notes: "Injected or ingested TOXIC still lands; Thick Blood slows it.",
  },
  "thick-blood": {
    kind: "Passive",
    effect: "Damage taken −5%. TOXIC clocks on you run at half speed and end on their own without antitoxin.",
    untested: true,
  },
  sporecast: {
    kind: "Passive",
    effect: "You feel overcharge weather and sporefall 1 hour before it lands, with direction: time enough to shelter the squad.",
  },
  "walk-among": {
    kind: "Passive",
    effect: "10% harder to target and to hit. In mutated territory the fauna read you as local: nothing hunts you unless you strike first.",
    notes: "Weave: buying Walk Among or Battle Form links both paths. Ends for the fight the moment you attack the region's fauna.",
  },
  "the-reach-wears-you": {
    kind: "Capstone",
    effect: "In a hostile biome your body adapts in real time: its air, water, spore and heat treat you as native. One of your wounds closes about every 25s while in combat; damage taken −8%.",
    notes: "Trainer: Nalia Reed. Adaptation takes 60s after you enter a new biome and shows on your skin, which instruments read as a corruption tell.",
    untested: true,
  },

  // ---------------------------------------------------------------- Ironvein
  "scar-socket": {
    kind: "Unlock",
    effect: "Opens one hidden augment socket: an implant seated in scar tissue that checkpoint instruments miss. 6% harder to target and to hit. Counts as chrome: ELECTRICAL can vent it.",
    notes: "The hidden socket holds one Sensory or Internal piece. People who know your body still find it.",
  },
  accept: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "Instant",
    effect: "Unlocks Accept (Bionic, Licensed): a body takes hardware with no rejection, so an augment seats in 1 hour instead of a week of recovery. +1 Hit before Down. Counts as chrome: ELECTRICAL can vent it.",
    notes: "Cast on yourself or a patient under your hands. Pushed cast: the body accepts the toxin too.",
  },
  seat: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "Instant",
    effect: "Unlocks Seat (Bionic, Licensed): hardware seats with no scar at the boundary: no inflammation, no rejection, ever, and no join for an instrument to find.",
    notes: "Pushed cast: seats deeper than intended; the piece cannot be recovered from the body in the field.",
  },
  "hot-swap": {
    kind: "Active",
    cooldown: "Once per day",
    range: "Self",
    duration: "5 min",
    effect: "Swaps one augment in the field in 5 minutes with no surgeon and no bench. The first swap each day is free; every further swap that day costs you one Hit.",
    notes: "The Hit is real and takes a plate if you wear one. Seat makes the swapped piece scar-free; Accept makes it take at once.",
  },
  "dose-router": {
    kind: "Unlock",
    effect: "+6 maximum pool / charges. Your chrome runs on your charges: one supply feeds body and hardware, and any augment that wants a capacitor cell draws 1 charge instead.",
    notes: "ELECTRICAL that vents an augment vents the charges routed through it too, unless Show the Steam carries them off.",
    untested: true,
  },
  "show-the-steam": {
    kind: "Passive",
    effect: "Cast costs −8%. Charges over cap and pushed-cast overcharge vent through your hardware harmlessly: no failure lands on you, but the vent is visible at 25m.",
    untested: true,
  },
  "one-flesh": {
    kind: "Passive",
    effect: "Your augments count as body: doses fuel them and Biologics casts heal them. +1 Hit before Down; one of your wounds closes about every 50s while in combat.",
    notes: "Weave: buying One Flesh or Brace links both paths. ELECTRICAL still vents them. The Forge still records only meat.",
  },
  conversion: {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Self",
    duration: "Until you die",
    effect: "Unlocks Conversion (Bionic, Master): rebuilds you as a body that is mostly hardware. +2 Hits before Down; damage dealt +30%. Counts as chrome: ELECTRICAL can vent it.",
    notes: "Trainer: the Clinic Surgeon. The Forge rebuilds only the meat: die and you come back a fraction, with the hardware still in the corpse. Corruption tells stop showing on converted tissue; the phase keeps climbing.",
  },

  // --------------------------------------------------------------- Bloodwork
  "red-scent": {
    kind: "Passive",
    range: "15m",
    effect: "You smell blood and open wounds through walls at 15m, with direction and freshness.",
  },
  staunch: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "10m",
    duration: "Instant",
    effect: "Unlocks Staunch (Hematic, Licensed): stops Bleeding on anyone within 10m, so their Dying clock is no longer halved. One of your wounds closes about every 30s while in combat.",
    notes: "No state licenses Hematic: casting it in front of a licence board is evidence. Pushed cast: the wound reopens with the next one.",
  },
  draw: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    cooldown: "Once per fight per target",
    range: "10m",
    duration: "Instant",
    effect: "Unlocks Draw (Hematic, Licensed): pulls blood from an open wound at 10m: the target staggers 2s and you gain 2 charges. Once per fight per target.",
    notes: "Needs a target already Hit or Bleeding. Pushed cast: it draws from your own wound instead.",
    untested: true,
  },
  "clot-craft": {
    kind: "Passive",
    range: "10m",
    effect: "Field-mends nearby allies 10 wounds' worth a minute: your squad's wounds close half again as fast. One of your wounds closes about every 40s while in combat.",
    notes: "Counts allies within 10m. Stacks with Staunch and Transfusion's self-repair.",
  },
  "vein-tax": {
    kind: "Unlock",
    effect: "+10 maximum pool / charges. With the rig empty you spend your own blood as charges: every 5 charges cost you one Hit. Damage taken +5%.",
    notes: "It shows: veining reads at any range while you are spending blood. A Hit paid this way is Bleeding until Staunched, and halves the Dying clock like any other.",
    untested: true,
  },
  tithe: {
    kind: "Passive",
    range: "10m",
    effect: "+1.4 pool or charges per landed hit, taken from the enemy's blood. Every enemy Bleeding within 10m pays you a further 1 charge a minute.",
    notes: "Stacks with Flywheel (+1.6 per landed hit). Nothing returns past your cap.",
    untested: true,
  },
  levy: {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    duration: "Instant",
    effect: "Unlocks Levy (Hematic, Certified): every open wound within 10m pays: each Hit or Bleeding body in range takes one further Hit, and you gain 1 charge per body. Damage dealt +40%.",
    notes: "Distinguishes nobody: allies with open wounds pay the same. Pushed cast: counts you in the Levy.",
    untested: true,
  },
  transfusion: {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Melee",
    duration: "Instant",
    effect: "Unlocks Transfusion (Hematic, Master): pulls a downed ally back up with 1 wound restored, paid with one Hit taken off a body you touch, yours included. One of your wounds closes about every 30s while in combat.",
    notes: "Trainer: the Choir does not teach, it collects; sign the page. Pushed cast: calls the loan, and the vitality comes out of you.",
    untested: true,
  },

  // ---------------------------------------------------- The Red Ladder (free)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Action speed +5% (attacks, casts and swaps cycle faster). Dosing mid-tremor costs no motion.",
    notes: "Lit at corruption phase 1 (Tremor): takes a Coordination rung. A medic sees the hand; a stranger does not, yet. No door closes at this phase.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "+6 maximum pool / charges. Every branch of you counts as fueled: augments and worn traits draw on the same charges.",
    notes: "Phase 2 (Veining): takes a Conditioning rung and +10% on every reclamation; pays a Conductivity rung above your ceiling. Temporal licences close; the Church stops calling you brother.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "Damage dealt +15%. A dose taken with the rig empty lands all 5 charges, even on a standard rig.",
    notes: "Phase 3 (Appetite): takes two Composure rungs. Command ceilings close; Rook will not teach a phase-three. Companions at this phase dose before contact without orders.",
    untested: true,
  },
  "corrupt-4": {
    kind: "Corrupted",
    range: "10m",
    effect: "Sees through 12% concealment. Every rig, dose and vein within 10m reads at a glance: each caster's charge count and corruption phase, in any light.",
    notes: "Phase 4 (Sensitivity): 12% easier to read and to hit, and +20% on every reclamation; pays an Acuity rung above your ceiling. Instruments flag you at every checkpoint that has one.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +20%. Whoever the dose used to be fights beside your hands: once per fight you perform one technique you were never taught.",
    notes: "Phase 5 (Drift): nobody sells you plates, so you run one plate slot short; a rank comes off your skill ceilings. Every teacher closes except the Choir and the Covenant.",
    untested: true,
  },
  "corrupt-6": {
    kind: "Corrupted",
    cooldown: "Once per fight",
    duration: "10s",
    effect: "Damage dealt +20%. Once per fight, refuse to go Down: for 10s you spike like a phase seven, then walk it back to Hit.",
    notes: "Phase 6 (Turning): nobody billets with you, so between-fight care halves; +40% on every reclamation; pays a Resilience rung above your ceiling. Binding closes at any Forge with a policy, and the horn sounds early for you.",
    untested: true,
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
    notes: "Phase 7 (Completion): takes everything. The Long Game lets a faction field what is left, and the campaign continues without you.",
  },
};
