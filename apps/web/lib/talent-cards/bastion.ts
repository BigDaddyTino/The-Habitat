import type { AbilityCard } from "../ability-cards";

/**
 * Bastion — every node's card, keyed by node id; corrupted phases keyed
 * corrupt-1..corrupt-7.
 *
 * Numbers agree with lib/talent-effects.ts (the sims' truth) wherever a node
 * has an entry there. Anything hand-written on top — a cooldown, a range, a
 * radius, a duration the map does not carry — is marked `untested`.
 */
export const bastionCards: Record<string, AbilityCard> = {
  // ---------------------------------------------------------------- The Line
  "stand-fast": {
    kind: "Passive",
    effect: "Increases hit chance by 3%. Flinch and sway from incoming fire reduced by 25%.",
    untested: true,
  },
  "bear-the-weight": {
    kind: "Passive",
    effect: "Carry weight +40%. The slowdown for being over your limit is halved.",
  },
  "thousand-round-stare": {
    kind: "Passive",
    range: "Rifle range",
    effect: "Reads an enemy's plate count, ward type and chrome on sight: exact, instant, at rifle range.",
    notes: "Needs a clear look at the body. Occlusive casts (Fade, Shroud, Umbra) hide what they hide from everyone.",
  },
  "spit-and-stand": {
    kind: "Active",
    cooldown: "Once per fight",
    range: "Self",
    duration: "Instant",
    effect: "Clears one Grazed state on you at once. While in combat, one of your wounds closes about every 25s.",
    notes: "Clears Grazed only; a Hit, Bleeding or Broken state stays.",
    untested: true,
  },
  "forced-march": {
    kind: "Passive",
    effect: "Your squad travels overland 20% faster. March noise −50%: the column moves quiet.",
    notes: "Overland only. Does nothing inside a fight.",
  },
  "dig-in": {
    kind: "Passive",
    duration: "Until moved",
    effect: "Stand on one spot for 30s and it counts as cover: damage taken −10% until you leave it.",
    notes: "Turns off the moment you step off the spot; the 30s starts again from zero.",
  },
  "hold-the-line": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −10% damage.",
    notes: "Adds to Stand Over Them, Lend the Wall and Walking Armoury.",
  },
  "written-defeat": {
    kind: "Capstone",
    range: "10m",
    effect: "Allies within 10m take −10% damage. +3s on your Dying clock.",
    notes: "Trainer: Commander Rook. Command ceilings close at corruption phase 3 (Appetite); Rook will not teach a phase-three.",
  },

  // -------------------------------------------------------------- Shieldwall
  "stand-over-them": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −8% damage. While you stand within 2m of a Down ally, shots aimed at them hit you instead.",
    notes: "You still take those Hits in full; your plates absorb them like any other.",
    untested: true,
  },
  "meet-the-wall": {
    kind: "Active",
    cooldown: "20s",
    range: "Melee",
    duration: "Instant",
    effect: "Shield check: knocks the target 3m back and staggers it for 2s. Every attack you make has a 10% chance to strip a plate or stagger.",
    notes: "The 10% chance is always on once bought; the check is the cooldown.",
    untested: true,
  },
  "look-at-me": {
    kind: "Active",
    cooldown: "45s",
    range: "25m",
    duration: "5s",
    effect: "For 5s, every enemy within 25m turns its fire on you. Allies within 10m take −15% damage; damage taken +12%.",
    notes: "Does nothing to an enemy that cannot see you. Pairs with One More Hit and Dig In.",
    untested: true,
  },
  "one-more-hit": {
    kind: "Passive",
    effect: "+1 plate slot.",
    notes: "Stacks with Walking Armoury. A plate still absorbs one Hit and is gone.",
  },
  "lend-the-wall": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −8% damage.",
    notes: "Owning First Ward also opens this node. Strongest with a Seal standing: the line inside it counts the ward as theirs.",
  },
  rooted: {
    kind: "Passive",
    effect: "Damage taken −5%. Knockback from blasts, shoves and shield checks is reduced by 75%.",
    notes: "Immovable makes the knockback figure zero.",
    untested: true,
  },
  between: {
    kind: "Passive",
    range: "Melee",
    effect: "When an ally within a step of you is shot, you take the Hit: allies within 10m take −12% damage; damage taken +5%.",
    notes: "Only within a step; you cannot Between for someone across the room. Turns off while you are Down.",
  },
  "answer-in-kind": {
    kind: "Active",
    cooldown: "60s",
    range: "Self",
    duration: "10s",
    effect: "For 10s, damage dealt +45%. Needs at least one plate lost this fight to fire.",
    notes: "The debt resets when the fight ends. Cannot be used while Down.",
    untested: true,
  },
  immovable: {
    kind: "Choice",
    effect: "Damage taken −15%. +1 Hit before Down. Knockback, shove, pull and Hold cannot move you.",
    notes: "Locks Unstoppable for good.",
  },

  // ---------------------------------------------------------------- Breacher
  "point-man": {
    kind: "Passive",
    effect: "Increases hit chance by 3%. The first shot fired at you in a fight misses 25% more often.",
    untested: true,
  },
  doorway: {
    kind: "Passive",
    effect: "Damage dealt +30%. Readiness +10% (draw, mount and first shot come sooner).",
    notes: "Built for the first 3s through a door: the readiness is what puts your shot before theirs.",
  },
  "loud-mercy": {
    kind: "Unlock",
    range: "8m",
    duration: "6s",
    effect: "Breach charges can be set non-lethal: an 8m blind-and-deafen for 6s, nobody dies. Lethal or loud is chosen at placement.",
    notes: "Cannot be changed after the charge is set.",
  },
  "shaped-charge": {
    kind: "Passive",
    effect: "Damage dealt +20%. When you set a breach charge, you choose which side of the wall the blast leaves through and who stands in it.",
    notes: "A Loud Mercy charge keeps its shape too.",
  },
  "through-the-gap": {
    kind: "Passive",
    effect: "Readiness +10% (draw, mount and first shot come sooner).",
    notes: "Owning Past the Governor also opens this node. Stacks with Doorway.",
  },
  "rolling-breach": {
    kind: "Passive",
    effect: "Action speed +15% (attacks, casts and swaps cycle faster).",
    notes: "Nothing resets between rooms: charges, cooldowns and Doorway all carry.",
  },
  "controlled-collapse": {
    kind: "Capstone",
    effect: "Damage dealt +50%. A charge you set on a load path brings the structure down onto the spot you marked.",
    notes: "Trainer: the Blast Foreman. Every teacher but the Choir and the Covenant closes at corruption phase 5.",
  },
  unstoppable: {
    kind: "Choice",
    effect: "Damage dealt +60%. Readiness +15%. No Seal, Hold, lock or barricade stops you at a door: you go through it.",
    notes: "Locks Immovable for good.",
  },

  // ------------------------------------------------------------------- Aegis
  "static-on-the-skin": {
    kind: "Passive",
    range: "10m",
    effect: "Feels every ward within 10m through the skin: direction and rough strength. No line of sight needed.",
    notes: "Tells you a ward is there, not what it is; Thousand-Round Stare reads the type.",
  },
  "first-ward": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "While you hold it",
    effect: "Unlocks Seal (Containment, Licensed): a ward across one door, window or breach that no body or round crosses while you stand it. Breaks if you move or go Down.",
    notes: "Owning this node also opens Lend the Wall. A pushed cast seals against you. Corrosive Unbind takes it down; so does waiting.",
  },
  hold: {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "10m",
    duration: "30s",
    effect: "Unlocks Hold (Containment, Licensed): one object up to door weight is kept exactly where it is for 30s per cast.",
    notes: "A pushed cast makes the jar the room: you are what gets held. Recast to keep it.",
    untested: true,
  },
  "the-moving-wall": {
    kind: "Passive",
    effect: "Your Seal advances with you at walking pace instead of breaking when you step, and covers a doorway's width as it moves.",
    notes: "Needs First Ward. Running, or going Down, still breaks it.",
  },
  "quiet-ground": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Self",
    duration: "Until moved",
    effect: "Unlocks Quiet (Containment, Certified): no sound leaves a 6m radius around you, gunfire included, while you hold still.",
    notes: "A pushed cast takes your own squad's voices instead.",
  },
  "second-nature": {
    kind: "Passive",
    effect: "Cast costs −15%. Your Hold lasts 45s per cast instead of 30s.",
    notes: "Applies to every cast you make, not only Containment.",
    untested: true,
  },
  "seal-the-breach": {
    kind: "Active",
    cost: "2 pool · 1 charge",
    cooldown: "20s",
    range: "10m",
    duration: "While you hold it",
    effect: "Casts Seal instantly on any breach within 10m as it opens, no channel. Allies within 10m take −8% damage.",
    notes: "Needs First Ward. The −8% stays on once bought; the instant Seal is the cooldown.",
    untested: true,
  },
  muzzle: {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "10m",
    duration: "While you hold it",
    effect: "Unlocks Muzzle (Containment, Master): nothing leaves a 6m radius you seal, not light, sound, blood or air. 18% chance per attack to strip a plate or stagger; allies within 10m take −8% damage.",
    notes: "Trainer: the Cordon Captain. A pushed cast takes the air inside with it, yours included.",
    untested: true,
  },

  // -------------------------------------------------------------- Juggernaut
  "first-chrome": {
    kind: "Unlock",
    effect: "Opens 1 augment slot. Damage dealt +10%. Counts as chrome: ELECTRICAL can vent it.",
    notes: "Financed chrome comes with a repossession agent who knows where you bind. Faraday Bones removes the vent.",
  },
  "union-fittings": {
    kind: "Passive",
    effect: "Union counters sell to you at member prices: −15% on parts, plate and chrome work. No questions on chrome-legal goods.",
    notes: "Illegal chrome is still illegal at the counter.",
  },
  "room-for-more": {
    kind: "Unlock",
    effect: "Opens a second augment slot. Damage dealt +10%.",
    notes: "Stacks with First Chrome: two slots, +20% together.",
  },
  "knuckle-plate": {
    kind: "Passive",
    range: "Melee",
    effect: "Damage dealt +30%. Your unarmed strikes count as PHYSICAL weapon hits and strip a plate the way a round does.",
    notes: "Counts as chrome; ELECTRICAL vents it unless you own Faraday Bones.",
  },
  "faraday-bones": {
    kind: "Passive",
    effect: "ELECTRICAL no longer vents your chrome.",
    notes: "You are still stunned by it and still drop what you hold on a failed Coordination check.",
  },
  "past-the-governor": {
    kind: "Active",
    cooldown: "30s",
    range: "Self",
    duration: "10s",
    effect: "For 10s, damage dealt +30%. When it winds down the limb takes a Grazed state.",
    notes: "Owning this node also opens Through the Gap. Needs at least one augment slot filled.",
    untested: true,
  },
  "come-take-it": {
    kind: "Passive",
    effect: "Your chrome ignores every remote lockout and kill-switch. A revocation agent must reach you in person.",
    notes: "Does nothing against ELECTRICAL; that is a vent, not a lockout.",
  },
  "walking-armoury": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −12% damage. +1 plate slot.",
    notes: "Stacks with One More Hit. Adds to Hold the Line.",
  },

  // -------------------------------------------------------------- Last Stand
  "slow-leak": {
    kind: "Passive",
    effect: "One of your wounds closes about every 30s while in combat.",
    notes: "A Bleeding state still halves your Dying clock if it is on you when you go Down.",
  },
  "field-dressing": {
    kind: "Passive",
    effect: "One of your wounds closes about every 25s while in combat, and you keep firing while it does.",
    notes: "Stacks with Slow Leak. Stops while you are Down.",
  },
  "walk-it-off": {
    kind: "Active",
    cooldown: "Once per day",
    range: "Self",
    duration: "1 day",
    effect: "+1 Hit before Down. Once per day, suppress one lasting wound for the day: the limp, the stiff hand, the scar stops counting.",
    notes: "Suppressed, not cured; it is back tomorrow. The +1 Hit is always on.",
  },
  "pain-ledger": {
    kind: "Passive",
    effect: "Damage dealt +30%.",
    notes: "Applies whatever state you carry, Grazed through Broken. Nothing while clean.",
  },
  "on-your-feet": {
    kind: "Active",
    cooldown: "60s",
    range: "Melee",
    duration: "Instant",
    effect: "Pulls a Down ally back up with 1 wound restored, in half the time a plain revive takes.",
    notes: "Stops their Dying clock. Cannot be used on yourself.",
    untested: true,
  },
  "argue-with-the-clock": {
    kind: "Passive",
    effect: "+9s on your Dying clock.",
    notes: "Adds to Written Defeat's +3s. Bleeding still halves the clock.",
  },
  "refuse-the-ground": {
    kind: "Active",
    cooldown: "Once per fight",
    range: "Self",
    duration: "10s",
    effect: "Once per fight, refuse to go Down: you stay at Hit for 10s, then Down applies unless you were healed.",
    notes: "The sims run it once per fight; the trainer says once a day. Bleeding keeps ticking through the 10s.",
  },
  "three-seconds": {
    kind: "Capstone",
    effect: "Damage dealt +60%. Readiness +20% (draw, mount and first shot come sooner).",
    notes: "Trainer: the Drill Master. Every teacher but the Choir and the Covenant closes at corruption phase 5.",
  },

  // ------------------------------------------------------- Rustline (corrupted)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Hit chance +4%. The Tremor no longer shows on a shouldered weapon.",
    notes: "Lit at corruption phase 1 (Tremor); never goes out. The phase takes a Coordination rung. Nothing else closes.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "Damage taken −4%.",
    notes: "Lit at phase 2 (Veining). The phase takes a Conditioning rung, puts +10% on every reclamation, and pays a Conductivity rung above your ceiling. Temporal licences close.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "One of your wounds closes about every 50s while in combat.",
    notes: "Lit at phase 3 (Appetite). The phase takes two Composure rungs. Command ceilings close: Written Defeat cannot be learned from here on.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 10% concealment. Loads and failing structure are felt through your boots.",
    notes: "Lit at phase 4 (Sensitivity). Cost: 12% easier to read and to hit. +20% on reclamation; instruments flag you at every checkpoint that has one. Pays an Acuity rung above your ceiling.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +15%.",
    notes: "Lit at phase 5 (Drift). Cost: nobody sells you plates, so you run one plate slot short (−1 plate slot). A rank comes off your skill ceilings; every teacher closes except the Choir and the Covenant.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "+2 Hits before Down. Your body counts as a barricade: no body or round passes the doorway you stand in.",
    notes: "Lit at phase 6 (Turning). Cost: nobody billets with you, so between-fight care halves. +40% on reclamation; binding closes at any Forge with a policy. Pays a Resilience rung above your ceiling.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
    notes: "Lit at phase 7. The line continues without you; a faction may field what is left.",
  },
};
