import type { AbilityCard } from "../ability-cards";

/** Spector — every node's card, keyed by node id; corrupted phases keyed corrupt-1..corrupt-7. */
export const spectorCards: Record<string, AbilityCard> = {
  // ---------------------------------------------------------------- Fieldcraft (core)
  "nothing-underfoot": {
    kind: "Passive",
    effect: "8% harder to target and to hit. Movement noise −30% at any speed.",
    untested: true,
  },
  "taped-and-blacked": {
    kind: "Passive",
    effect: "8% harder to target and to hit. Nothing you carry rattles, glints or beeps, in any light.",
    notes: "Stacks with Nothing Underfoot.",
  },
  "read-the-room": {
    kind: "Passive",
    effect: "Sees through 10% concealment. On entering a room, every person in it reads as armed, carrying money, or neither.",
  },
  "patience": {
    kind: "Passive",
    effect: "Hit chance +5%. You hold a position or a sight picture for up to 10 minutes with no Composure tick and no sway creep.",
    untested: true,
  },
  "neck-hairs": {
    kind: "Passive",
    effect: "Readiness +12% (draw, mount and first shot come sooner). An ambush within 25m warns you 2s before it springs.",
    untested: true,
  },
  "second-entry": {
    kind: "Passive",
    effect: "Readiness +10% (draw, mount and first shot come sooner). Any building shows you a second way in after 30s of study.",
    untested: true,
  },
  "one-breath": {
    kind: "Passive",
    effect: "Hit chance +6%. While you hold your breath on a sight picture (up to 5s) your sway drops to zero.",
    untested: true,
  },
  "cold-adrenaline": {
    kind: "Passive",
    effect: "Hit chance +5%. Incoming fire adds no sway and no Composure tick.",
  },
  "clean-exit": {
    kind: "Active",
    cooldown: "Once per day",
    range: "Self",
    duration: "8s",
    effect: "Once per fight, refuse to go Down: you stay at Hit and break contact. For 8s nothing can target you while you move away.",
    notes: "The sims model the refusal once per fight; the day limit is the rule in play. Ends early if you fire.",
    untested: true,
  },

  // ---------------------------------------------------------------- Marksman
  "steady-breath": {
    kind: "Passive",
    effect: "Hit chance +5%. The first shot after you settle carries no sway.",
  },
  "mil-dot-mind": {
    kind: "Passive",
    effect: "Hit chance +4%. Ranges read true to the metre without instruments.",
  },
  "double-tap": {
    kind: "Passive",
    effect: "Damage dealt +30%. A second round fired within 1s at the same target lands where the first did.",
    untested: true,
  },
  "windage": {
    kind: "Passive",
    effect: "Hit chance +4%. Wind, rain and distance add no spread to your shot.",
  },
  "seam-finder": {
    kind: "Passive",
    effect: "Damage dealt +40%: your rounds find the seam in a plate instead of the plate.",
  },
  "cold-barrel": {
    kind: "Passive",
    effect: "Damage dealt +40%. Readiness +10% (draw, mount and first shot come sooner).",
    notes: "The first round of a fight is the one that carries it.",
  },
  "called-shot": {
    kind: "Capstone",
    cooldown: "10s",
    range: "Rifle range",
    effect: "Damage dealt +70%, hit chance +6%. Name the plate location before you fire; the round lands there.",
    notes: "Taught by the Range Instructor; points alone never open it. A head Hit with no helmet plate is Down.",
    untested: true,
  },
  "signature-shot": {
    kind: "Choice",
    cooldown: "Once per fight",
    range: "Rifle range",
    effect: "Once per fight, one round at damage dealt +90%. Everyone within earshot knows it was you: suspicion +10 with every institution that hears of it.",
    notes: "Locks Never Here for good.",
    untested: true,
  },

  // ---------------------------------------------------------------- Ghost
  "old-floorboards": {
    kind: "Passive",
    effect: "6% harder to target and to hit. Gravel, glass and old boards make no noise under you.",
  },
  "fade-drill": {
    kind: "Passive",
    effect: "10% harder to target and to hit. Once you break line of sight, enemies lose your position within 2s and search where they last saw you.",
    untested: true,
  },
  "blur": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Self",
    duration: "60s",
    effect: "Unlocks Blur (Perceptual, Licensed): for 60s you are unmemorable. 12% harder to target and to hit, and no witness can describe you afterwards.",
    notes: "Instruments retain you when people cannot. Pushed cast: you forget yourself for a minute.",
    untested: true,
  },
  "static": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    duration: "10s",
    effect: "Unlocks Static (Perceptual, Licensed): fuzzes one sense of one target for 10s. 8% chance per attack to strip a plate or stagger.",
    notes: "Pushed cast: the sense closes in you instead.",
    untested: true,
  },
  "crowd-skin": {
    kind: "Passive",
    effect: "10% harder to target and to hit. In any crowd, no witness can describe you.",
  },
  "dim": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    duration: "30s",
    effect: "Unlocks Dim (Occlusive, Licensed): kills the light in a 10m radius for 30s without touching the source. 10% harder to target and to hit; 5% chance per attack to strip a plate or stagger.",
    notes: "Owning Kill the Circuit also opens this node. Pushed cast: your own optics go dark too.",
    untested: true,
  },
  "blind-spot": {
    kind: "Capstone",
    effect: "15% harder to target and to hit. The lattice's blind spots show on your map; cameras and drone sweeps never log you while you keep to them.",
    notes: "Taught by the Bureau Analyst; points alone never open it.",
  },
  "never-here": {
    kind: "Choice",
    effect: "22% harder to target and to hit. Suspicion scores on you decay twice as fast, and witnesses lose your face within a day.",
    notes: "Locks Signature Shot for good.",
    untested: true,
  },

  // ---------------------------------------------------------------- Saboteur
  "pocket-arsenal": {
    kind: "Passive",
    effect: "Ammunition carried +20%. The right tool is in your hand with no swap delay.",
  },
  "quiet-lock": {
    kind: "Passive",
    effect: "Standard locks open silent in 10s, every time. Quality locks open in 30s with a kit.",
  },
  "ward-seam": {
    kind: "Passive",
    effect: "After 6s of study a ward's weak seam shows. You cross it without tripping it, one person at a time.",
  },
  "wrong-shadow": {
    kind: "Passive",
    effect: "Traps, rigged doors and doctored rigs reveal themselves within 8m. Automatic; no searching.",
  },
  "pocket-thunder": {
    kind: "Active",
    cost: "1 breach charge",
    cooldown: "20s",
    range: "Melee",
    duration: "5–60s fuse",
    effect: "Damage dealt +30%. Place a pocket charge on a door, wall or emplacement with a fuse you set from 5s to 60s; it goes off on the second you named.",
    untested: true,
  },
  "kill-the-circuit": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    duration: "30s",
    effect: "Unlocks Kill the Circuit (Electrical, Licensed): every door, camera and ignition within 10m of the point you name holds off for 30s. 12% chance per attack to strip a plate or stagger.",
    notes: "Owning Dim also opens this node. Pushed cast: kills your own circuit; augments vent and your rig goes dark.",
    untested: true,
  },
  "daisy-chain": {
    kind: "Passive",
    effect: "Damage dealt +40%. Up to 4 charges ride one detonator and fire in the order you set, spaced anywhere from together to 10s apart.",
    untested: true,
  },
  "credential": {
    kind: "Capstone",
    cooldown: "Once per day",
    range: "Self",
    effect: "Once per day: a paper that passes one checkpoint, any checkpoint. It burns on use; a second look kills it.",
    notes: "Taught by the Ashline Fixer; points alone never open it.",
  },

  // ---------------------------------------------------------------- Tracker
  "dead-reckoning": {
    kind: "Passive",
    effect: "Your position, heading and depth are always known. No sky, no map needed.",
  },
  "weather-nose": {
    kind: "Passive",
    effect: "Tomorrow's weather is known today, to the hour. Storms are called a full day early.",
  },
  "sign": {
    kind: "Passive",
    effect: "Tracks read the number, species, load and age of what passed. Up to three days cold, on any ground.",
  },
  "clean-water": {
    kind: "Passive",
    effect: "One of your wounds closes about every 50s while in combat. Your squad finds water and food on any ground; no rations needed.",
  },
  "cold-camp": {
    kind: "Passive",
    effect: "Your party's camp cannot be found unless you want it found. Fire shielded, tracks swept, scent killed, every night, automatic.",
  },
  "high-route": {
    kind: "Passive",
    effect: "Rooftops, ridges and rigging at full move speed. Anything with a handhold climbs like a ladder.",
  },
  "search-pattern": {
    kind: "Passive",
    effect: "Sees through 12% concealment. Readiness +8% (draw, mount and first shot come sooner). A hunting thing's sweep shows on your map before it reaches you.",
  },
  "agreement": {
    kind: "Capstone",
    effect: "Readiness +10% (draw, mount and first shot come sooner). Any route that changed in the last 3 days shows you where: the fresh crossing, the moved ford, the new watch.",
    notes: "Taught by Mara Quill; points alone never open it.",
    untested: true,
  },

  // ---------------------------------------------------------------- Face
  "everyones-cousin": {
    kind: "Passive",
    effect: "Strangers open friendly: +20 disposition everywhere. Rumors surface 2× faster when you ask around.",
  },
  "cover-story": {
    kind: "Passive",
    effect: "A worked identity: name, history and references that survive a records check.",
  },
  "paper": {
    kind: "Passive",
    effect: "Forged documents pass first inspection anywhere. Under expert scrutiny they hold 50% of the time.",
  },
  "borrowed-voice": {
    kind: "Passive",
    effect: "Any accent, cadence or rank you have heard for one minute is yours to wear convincingly. Voice-keyed doors and codewords included.",
  },
  "forget": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    cooldown: "15 min",
    range: "5m",
    effect: "Unlocks Forget (Memetic, Licensed): once every 15 minutes, the last 30 seconds are removed from one witness. They fill the gap themselves; no trace.",
    notes: "Written orders and a Returnee's long memory beat it. Pushed cast: you forget the cast.",
    untested: true,
  },
  "tell": {
    kind: "Passive",
    effect: "Sees through 10% concealment. Anyone talking to you reads as lying, afraid, armed or bought before they finish the sentence.",
  },
  "suggest": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    cooldown: "15 min",
    range: "5m",
    effect: "Unlocks Suggest (Memetic, Licensed): once every 15 minutes, one small idea is planted mid-sentence and acted on as their own. Nothing against their core interests.",
    notes: "Pushed cast: the suggestion lands in you.",
    untested: true,
  },
  "one-signature": {
    kind: "Capstone",
    effect: "Your casts carry no arcane signature. No reader, instrument or scar ever traces a cast to you.",
    notes: "Taught by the Paper-Hand; points alone never open it.",
  },

  // ---------------------------------------------------------------- The Hollow (corrupted)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Hit chance +5%. Between heartbeats your hold is perfectly still.",
    notes: "Lights at phase 1 (Tremor), which costs a Coordination rung. Never goes out.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "8% harder to target and to hit. In darkness your veining does not show and you read as clean.",
    notes: "Lights at phase 2 (Veining): a Conditioning rung, +10% on every reclamation, Temporal licences close.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "Hit chance +3% while you hold a position.",
    notes: "Lights at phase 3 (Appetite): two Composure rungs, and Command ceilings close.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 15% concealment. Things nobody else in the squad reacts to highlight for you.",
    notes: "Lights at phase 4 (Sensitivity). Institutional cost: 12% easier to read and to hit; instruments flag you at every checkpoint; reclamation +20%.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +15%. Techniques you were never taught arrive mid-job.",
    notes: "Lights at phase 5 (Drift). Institutional cost: nobody sells you plates, so you run one plate slot short (−1 plate slot); skill ceilings lose a rank; every teacher closes except the Choir and the Covenant.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "15% harder to target and to hit. Suspicion instruments read you one phase wrong.",
    notes: "Lights at phase 6 (Turning). Institutional cost: nobody billets with you, so between-fight care halves; reclamation +40%; binding closes at any Forge with a policy.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
  },
};
