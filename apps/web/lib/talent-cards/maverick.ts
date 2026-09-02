import type { AbilityCard } from "../ability-cards";

/** Maverick — every node's card, keyed by node id; corrupted phases keyed corrupt-1..corrupt-7. */
export const maverickCards: Record<string, AbilityCard> = {
  // ---------------------------------------------------------------- The Draw (core)
  "loose-holster": {
    kind: "Passive",
    effect: "Readiness +15% (draw, mount and first shot come sooner). Drawing a sidearm takes 0.3s instead of 0.6s.",
    untested: true,
  },
  "born-standing": {
    kind: "Passive",
    effect: "Damage taken −5%, in the open as well as behind cover.",
  },
  "fast-hands": {
    kind: "Passive",
    effect: "Ammunition carried +30%. You reload a sidearm at a full sprint with no slowdown.",
  },
  "blink-last": {
    kind: "Passive",
    effect: "Hit chance +4%. Being watched, scanned or held at gunpoint never costs you a Composure tick.",
  },
  "read-the-hand": {
    kind: "Passive",
    effect: "Readiness +15% (draw, mount and first shot come sooner). Hit chance +4%. An enemy's draw shows to you before it starts.",
  },
  "two-irons": {
    kind: "Choice",
    effect: "Damage dealt +50%. Action speed +10% (attacks, casts and swaps cycle faster). Both hands hold a pistol; you have no casting hand.",
    notes: "Locks Iron & Ember for good. Needs Read the Hand. Opens Fan the Hammer. The bonus applies to every Twin Irons node.",
  },
  "iron-and-ember": {
    kind: "Choice",
    effect: "Damage dealt +30%. Cast costs −15%. One hand holds a pistol, the other casts; your school is Thermal unless a licence says otherwise.",
    notes: "Locks Two Irons for good. Needs Read the Hand. Opens Fan the Hammer. The bonus applies to every Spellhand node; Certified Spark and Left-Hand Law open your school's abilities.",
  },
  "fan-the-hammer": {
    kind: "Active",
    cooldown: "20s",
    range: "10m",
    duration: "Instant",
    effect: "Empties the cylinder in 1s: 6 rounds into one target within 10m, each rolled separately. Damage dealt +30%.",
    notes: "Needs Two Irons or Iron & Ember. With Two Irons both cylinders empty: 12 rounds. The cylinder is empty afterwards; Fast Hands and Stagger Fire cover the reload.",
    untested: true,
  },
  "first-and-last": {
    kind: "Passive",
    effect: "Readiness +30% (draw, mount and first shot come sooner). Damage dealt +30%. Ties on who shoots first go to you.",
  },

  // ---------------------------------------------------------------- Twin Irons
  "matched-pair": {
    kind: "Passive",
    effect: "Damage dealt +20%. Your off-hand pistol fires with the same hit chance as your main hand.",
  },
  "hipfire-doctrine": {
    kind: "Passive",
    effect: "Hit chance +6%. Within 15m you fire from the hip with no penalty for not aiming down sights.",
    untested: true,
  },
  "crossfire": {
    kind: "Passive",
    effect: "Action speed +12% (attacks, casts and swaps cycle faster). Each pistol may hold a different target; both fire in the same beat.",
    notes: "Weave: buying this or Bank Shot links both paths.",
  },
  "stagger-fire": {
    kind: "Passive",
    effect: "Ammunition carried +30%. Action speed +8% (attacks, casts and swaps cycle faster). One pistol reloads while the other keeps firing; you are never without a loaded gun.",
  },
  "twinned-recoil": {
    kind: "Passive",
    effect: "Hit chance +6%. Firing both pistols together has the recoil of one.",
  },
  "iron-rain": {
    kind: "Passive",
    effect: "12% chance per attack to strip a plate or stagger. Damage dealt +20%. Enemies under sustained fire from both pistols keep their heads down: they neither advance nor fire back while it lasts.",
  },
  "walking-fire": {
    kind: "Passive",
    effect: "Hit chance +6%. Damage dealt +20%. Moving at full speed costs you no hit chance with either pistol.",
  },
  "dead-level": {
    kind: "Capstone",
    effect: "Damage dealt +60%. Hit chance +8%. Grazed, Hit and Bleeding no longer lower your hit chance; only a Broken arm drops that pistol.",
    notes: "Trainer: the Gun. Points alone never open it.",
  },

  // ---------------------------------------------------------------- Spellhand
  "ember-palm": {
    kind: "Passive",
    effect: "Damage dealt +10%. Your casting hand always carries a FIRE spark at touch: it lights a fuse, a lamp or a spilled dose, costs no pool and needs no licence.",
    notes: "Unlicensed casting: an inspector who sees it raises your suspicion with the Bureau.",
  },
  "snap-cast": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    effect: "Unlocks Ignition and Warmth (Thermal, Licensed): Ignition lights one target within 25m for a FIRE Hit plus Burning for 5s; Warmth keeps allies within 10m working in cold for 1 hour. Damage dealt +20%.",
    notes: "Both cast at trigger speed with no licence on file: the scar reads as a spell and can be traced. Overcharge Ignition and what lit was your sleeve.",
    untested: true,
  },
  "gun-hand-grammar": {
    kind: "Passive",
    effect: "Action speed +12% (attacks, casts and swaps cycle faster). Swapping between a shot and a cast costs no time in either direction.",
  },
  "glasscharge": {
    kind: "Unlock",
    cost: "1 stormglass round",
    effect: "+8 maximum pool / charges. Load a stormglass round into your casting hand instead of a cylinder: it fuels one Licensed cast in full or half of a Certified one.",
    notes: "One pouch feeds both hands. A round spent this way misfires one time in ten like any stormglass; a misfire fizzles the cast.",
    untested: true,
  },
  "showmans-flame": {
    kind: "Passive",
    effect: "Every cast is signed: witnesses attribute your wins correctly. Your legend spreads 50% faster.",
    notes: "Weave: buying this or A Name That Travels links both paths. A signed cast is a signed unlicensed cast: the Bureau can attribute it too.",
  },
  "split-the-ember": {
    kind: "Active",
    cooldown: "20s",
    range: "25m",
    effect: "Your next Thermal cast lands on two targets within 25m instead of one, at full effect on each. Damage dealt +30%.",
    notes: "Spends the cast's normal pool and nothing more. Warmth is already an aura and gains nothing.",
    untested: true,
  },
  "certified-spark": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    effect: "Unlocks Flashover (Thermal, Certified): the air of one room up to 10m across ignites at once, doors first; everyone inside takes a FIRE Hit that ignores half a plate. Damage dealt +40%.",
    notes: "Your school is Thermal unless Iron & Ember set another; then this opens that school's Certified ability. Overcharge: the room includes the one you are standing in.",
    untested: true,
  },
  "left-hand-law": {
    kind: "Spell",
    cost: "8 pool · 4 charges",
    range: "10m",
    effect: "Unlocks Sublimation (Thermal, Master): one target within 10m goes to steam inside its armour, 3 FIRE Hits at once with plates ignored. Cast one-handed with a pistol in the other. Damage dealt +70%.",
    notes: "Overcharge lands it inside your own sealed armour. Another school through Iron & Ember opens that school's Master ability instead.",
    untested: true,
  },

  // ---------------------------------------------------------------- The Duel
  "call-it": {
    kind: "Active",
    cooldown: "Once per fight",
    range: "Line of sight",
    duration: "Until one of you goes Down",
    effect: "Names one enemy for a one-on-one: most take it, and refusing costs them standing. A refuser who fights you anyway does it shaken: −10% hit chance.",
    notes: "Every Duel node below counts only inside a called duel. A won duel with witnesses feeds Witnesses.",
  },
  "ten-paces": {
    kind: "Passive",
    effect: "Within 10m of your target: damage dealt +30%, hit chance +5%.",
    untested: true,
  },
  "cold-walk": {
    kind: "Passive",
    effect: "Damage taken −5%. Advancing under fire never slows you or costs a Composure tick.",
  },
  "witnesses": {
    kind: "Passive",
    effect: "Each witnessed duel you win: hit chance +5% in your next duel. Stacks to +15%.",
    notes: "Weave: buying this or Sung About links both paths. The bonus is spent when the next duel ends, win or lose.",
  },
  "the-circle": {
    kind: "Passive",
    duration: "While a called duel lasts",
    effect: "Damage taken −10%. In a called duel, rounds from anyone but your opponent miss you, and your rounds never hit a bystander.",
  },
  "opening-twitch": {
    kind: "Passive",
    effect: "Readiness +30% (draw, mount and first shot come sooner). In a called duel you act first, whatever the other side's readiness.",
  },
  "one-bullet": {
    kind: "Passive",
    effect: "Damage dealt +60%. The first round you fire in a called duel counts as a head shot: an opponent with no helmet plate goes Down.",
  },
  "bloodless": {
    kind: "Capstone",
    effect: "20% chance per attack to strip a plate or stagger. In a called duel, an opponent staggered while already Hit holsters: the duel ends, you win it, and every witness counts it.",
    notes: "Trainer: Serrat the Once. Points alone never open it. A win this way feeds Witnesses like any other.",
  },

  // ---------------------------------------------------------------- Trickwork
  "spin-and-show": {
    kind: "Passive",
    effect: "Handling alone announces you: 60% of small trouble stands down before it starts.",
    notes: "Small trouble is unnamed, outnumbered or drunk; named enemies and anyone under orders keep coming.",
  },
  "ricochet": {
    kind: "Passive",
    effect: "Hit chance +5%. Your round may take one corner off a hard surface to reach a target out of your line of sight.",
  },
  "disarming-shot": {
    kind: "Active",
    cooldown: "12s",
    range: "10m",
    effect: "Shoots the weapon, not the hand: 70% chance to disarm at pistol range (10m). The iron lands 3m away.",
    untested: true,
  },
  "cut-the-rope": {
    kind: "Passive",
    effect: "Called shots on objects hit 90% at pistol range: locks, lines, triggers, hinges.",
  },
  "glassload": {
    kind: "Unlock",
    effect: "Damage dealt +30%. Cut your own stormglass rounds and choose each one's payload: flash (blinds 3s), shatter (strips one plate), or burn (adds Burning). All still deal ARCANE.",
    notes: "Hand-cut glass misfires one time in ten like any stormglass. Glasscharge can burn a cut round as fuel.",
    untested: true,
  },
  "bank-shot": {
    kind: "Passive",
    effect: "Damage dealt +20%. Hit chance +5%. Your round may take two corners.",
    notes: "Weave: buying this or Crossfire links both paths. Builds on Ricochet's one corner.",
  },
  "by-ear": {
    kind: "Passive",
    effect: "Sees through 15% concealment. Darkness, smoke and Overexpose cost you no hit chance against a target you can hear.",
  },
  "impossible-shot": {
    kind: "Capstone",
    cooldown: "Once per day",
    range: "Any range",
    effect: "Once per day, declare one shot: it hits, whatever the range, cover, concealment or hit chance, and lands where you name it. Damage dealt +80%.",
    notes: "Trainer: a crossroads bargain, they say. A declared shot never misfires, stormglass or not. A declared head shot on a target with no helmet plate is Down.",
  },

  // ---------------------------------------------------------------- The Legend
  "a-name-that-travels": {
    kind: "Passive",
    effect: "The next town has already heard of you: +10 disposition on arrival.",
    notes: "Weave: buying this or Showman's Flame links both paths.",
  },
  "a-round-on-the-house": {
    kind: "Passive",
    effect: "Lodging and information find you free anywhere the name has reached. One solid rumor per night, unasked.",
  },
  "table-stakes": {
    kind: "Passive",
    effect: "Name your loss cap before cards, bets or shakedowns; it holds. You never lose more than you meant to.",
  },
  "stare-down": {
    kind: "Active",
    cooldown: "30s",
    range: "10m",
    effect: "10% chance per attack to strip a plate or stagger. Fix one unnamed enemy within 10m: it leaves the fight for 15s, or for good if nobody rallies it.",
    notes: "Named enemies and anyone under orders are not lesser and do not leave.",
    untested: true,
  },
  "price-on-paper": {
    kind: "Passive",
    effect: "Bounties on you are leverage: spend them as fear, or bargain them down. Bounties you claim pay double.",
  },
  "larger-than-life": {
    kind: "Passive",
    effect: "Allies within 10m take −8% damage.",
  },
  "sung-about": {
    kind: "Passive",
    effect: "12% chance per attack to strip a plate or stagger. A named enemy hesitates before its first shot at you: you fire first in that exchange.",
    notes: "Weave: buying this or Witnesses links both paths.",
  },
  "myth": {
    kind: "Passive",
    effect: "12% chance per attack to strip a plate or stagger. 8% harder to target and to hit. Suspicion, standing and disposition read your legend before they read you: on arrival you are treated as the story says.",
  },

  // ---------------------------------------------------------------- The Dead Man's Hand (corrupted)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Action speed +8% (attacks, casts and swaps cycle faster).",
    notes: "Lit at phase 1 (Tremor): costs a Coordination rung. Costs no points; stacks with every later phase.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "6% chance per attack to strip a plate or stagger.",
    notes: "Lit at phase 2 (Veining): −1 Conditioning rung, +1 Conductivity rung above ceiling, reclamation +10%. Stacks with phase 1.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "Damage dealt +15%.",
    notes: "Lit at phase 3 (Appetite): −2 Composure rungs; Command ceilings close. Stacks with phases 1 and 2.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 15% concealment.",
    notes: "Lit at phase 4 (Sensitivity). Institutional cost: 12% easier to read and to hit. Reclamation +20%; instruments flag you at every checkpoint. Stacks with phases 1 to 3.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Readiness +20% (draw, mount and first shot come sooner).",
    notes: "Lit at phase 5 (Drift). Institutional cost: nobody sells you plates, so you are one plate slot short (−1 plate slot); the phase 4 cost stays. Skill ceilings −1 rank. Stacks with phases 1 to 4.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "14% chance per attack to strip a plate or stagger.",
    notes: "Lit at phase 6 (Turning). Institutional cost: nobody billets with you, so between-fight care halves; the phase 4 and 5 costs stay. Reclamation +40%; Forges with a policy refuse to bind you. Stacks with phases 1 to 5.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
  },
};
