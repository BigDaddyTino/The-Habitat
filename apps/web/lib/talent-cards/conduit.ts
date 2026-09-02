import type { AbilityCard } from "../ability-cards";

/**
 * Conduit — every node's card, keyed by node id; corrupted phases keyed
 * corrupt-1..corrupt-7.
 *
 * Numbers agree with lib/talent-effects.ts where a node has an entry there
 * (every Conduit node does — combat numbers or `world` lines). `untested`
 * marks cards whose only numbers were written by hand for the spell text.
 */
export const conduitCards: Record<string, AbilityCard> = {
  // ------------------------------------------------------------ Channelling (core)
  "envelope": {
    kind: "Passive",
    effect: "Cast costs −5%. Your overcharge line is shown exactly: a cast that would cross it warns you before you commit.",
  },
  "name-the-cast": {
    kind: "Passive",
    effect: "Sees through 12% concealment. Every cast that begins within line of sight is labelled as it happens: pillar, licence class, tier, and whether it is instant or channelled.",
    notes: "A squad under Occlusive Shroud still shows nothing.",
  },
  "sustain": {
    kind: "Passive",
    effect: "Hit chance +4%. A shove, a fall or a Grazed state no longer breaks a channelled cast; only a Hit does.",
    notes: "A rig hit mid-channel is still an automatic overcharge failure.",
  },
  "tight-seals": {
    kind: "Passive",
    effect: "+4 maximum pool / charges. Every charge a cell lights is delivered: your rig stops reading one charge high.",
    notes: "Born and gifted casters get the cap alone; the delivery line only matters through a rig.",
  },
  "controlled-burn": {
    kind: "Passive",
    effect: "Cast costs −8%. A pushed cast that fails does so one tier lighter than it was cast: a Master failure lands as Certified, a Licensed failure fizzles.",
  },
  "deep-pool": {
    kind: "Choice",
    effect: "+26 maximum pool / charges. Recovery from sleep, meals and tonics is unchanged.",
    notes: "Locks Live Wire for good. Requires Controlled Burn.",
  },
  "live-wire": {
    kind: "Choice",
    effect: "+2.2 pool or charges per landed hit. Your maximum is unchanged.",
    notes: "Locks Deep Pool for good. Requires Controlled Burn. A landed spell counts as a hit; a ward or a heal does not.",
  },
  "twin-school": {
    kind: "Unlock",
    effect: "Damage dealt +20%. Opens a second licence class: one more branch's Licence node can be bought, and both classes' Licensed pairs cast at full effect.",
    notes: "Requires Deep Pool or Live Wire. Three classes across two pillars is still the ceiling; this is the second class, not a third.",
  },
  "edge": {
    kind: "Capstone",
    range: "Self",
    effect: "Damage dealt +40%, cast costs −10%. A pushed cast cannot fail while your Composure holds; if Composure breaks mid-cast, the pillar's failure lands on you as normal.",
    notes: "Ceiling: opened only by the hidden Concordance elder. This is what spares you Flashover, Sublimation and every other failure that includes the room you stand in.",
  },

  // ------------------------------------------------------------ Warcaster
  "artillery-eyes": {
    kind: "Passive",
    effect: "Hit chance +6%. Range no longer costs accuracy: a cast at any distance within line of sight lands as if made at 10m.",
  },
  "war-licence": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    effect: "Unlocks one class's Licensed pair (Thermal, Cryogenic, Kinetic or Ballistic; Licensed): Ignition (lights one target at 25m) and Warmth; Freeze the Ground (5m of footing denied for 30s) and Cold Store; Shove (one body thrown 3m) and Catch; Correct (a fired shot re-aimed) and Carry. Damage dealt +20%.",
    notes: "One pick, permanent: there is no respec. Certified Strike and Master of War follow the class you choose here.",
  },
  "field-control": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "25m",
    duration: "30s",
    effect: "Unlocks Freeze the Ground (Cryogenic, Licensed) if that is your War class, otherwise Weight (Gravitic, Licensed): a 5m patch of ground is denied for 30s; anyone crossing it moves at a walk and passes a Coordination check or falls. 12% chance per attack to strip a plate or stagger footing.",
    notes: "Weight counts as a licence class you hold. Pushed and failed, Freeze the Ground takes the road for a season and Weight finds your own boots.",
  },
  "cook-the-air": {
    kind: "Passive",
    range: "10m",
    effect: "Your squad is immune to cold-weather penalties, and 10m around you stays warm through hard frost. Enemies inside that 10m lose frost, fog and cold optics as cover.",
  },
  "battle-channel": {
    kind: "Passive",
    effect: "Hit chance +5%. You cast while moving at a walk and from behind cover, and being under fire no longer forces a Coordination check on a channel.",
  },
  "neat-lines": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −6% damage. Your area casts stop at the edge you drew: no ally inside the line takes anything from them.",
  },
  "certified-strike": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "25m",
    effect: "Unlocks your War class's Certified ability: Flashover (Thermal) ignites a room's air at once, doors first; Brittle (Cryogenic) takes one plate or limb past brittleness so the next hit shatters it; Arrest (Kinetic) catches one round in flight and holds it; Curve (Ballistic) sends one round around a corner. Damage dealt +40%.",
    notes: "Follows the class picked at War Licence. Flashover pushed and failed includes the room you are standing in.",
  },
  "master-of-war": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "25m",
    effect: "Unlocks your War class's Master ability: Sublimation (Thermal) sends one body to steam inside armour that stays sealed; Vitrify (Cryogenic) glasses one target so the next PHYSICAL hit shatters it; Return (Kinetic) sends held momentum back into whoever fired it; Convoy (Ballistic) sends every round in the air where you look. Damage dealt +80%.",
    notes: "Ceiling: the Instructor of the Ninth. A Master licence review asks your corruption phase. Convoy pushed and failed sends every round where you looked, which was at your medic.",
  },

  // ------------------------------------------------------------ Mender
  "hands-that-listen": {
    kind: "Passive",
    range: "Melee",
    effect: "Field-mends nearby allies 8 wounds' worth a minute. A touch reads a body's whole state: every wound and its location, Bleeding, Broken, and the seconds left on a Dying clock.",
  },
  "healers-licence": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    effect: "Unlocks Close and Knit (Regenerative, Licensed): Close stops a Bleeding state within 2s at touch; Knit closes one Hit over 6s. Pulls a downed ally back up with 1 wound restored.",
    notes: "Both are channelled: a Hit taken mid-Knit fizzles it. Knit on a Down body stands them up at Hit. Pushed and failed, Close closes the airway and Knit knits wrong.",
  },
  "triage-sense": {
    kind: "Passive",
    effect: "Sees through 8% concealment. A glance reads a body's wound history and its corruption phase two phases before the tells show.",
  },
  "thread-and-sinew": {
    kind: "Passive",
    effect: "Field-mends nearby allies 10 wounds' worth a minute. Trauma-bag work and Regenerative casts on the same patient both apply in full instead of the later one cancelling the earlier.",
  },
  "surgeons-calm": {
    kind: "Passive",
    effect: "Field-mends nearby allies 12 wounds' worth a minute. A Hit you take while channelling Close, Knit, Debridement or Rebuild no longer breaks the channel.",
    notes: "Weaves to Anchor (Mindworker): buying either end links both paths. A rig hit mid-channel is still an automatic overcharge failure.",
  },
  "share-the-cost": {
    kind: "Passive",
    effect: "Field-mends nearby allies 12 wounds' worth a minute; damage taken +8%. Each wound you close puts a Grazed state on you that clears in a minute.",
    notes: "The +8% damage taken is always on, not only while you heal. Grazed states tick your Composure.",
  },
  "debridement": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "Melee",
    effect: "Unlocks Debridement (Regenerative, Certified): closes one Hit, Bleeding or Broken state on a patient within 5s by taking the mass from another site on the same body, which you choose; that site is Grazed for an hour. Field-mends nearby allies 16 wounds' worth a minute.",
    notes: "Pushed and failed, it chooses the donor site for you.",
  },
  "rebuild": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "Melee",
    duration: "60s",
    effect: "Unlocks Rebuild (Regenerative, Master): rebuilds one Broken or lost limb from the patient's own mass over a 60s channel, clearing its lasting-wound entry; the patient loses one Conditioning rung for a month. Pulls a downed ally back up with 1.2 wounds restored; allies within 10m take −5% damage.",
    notes: "Ceiling: the Kestrel Medic. Pushed and failed, the limb comes from the surgeon.",
  },

  // ------------------------------------------------------------ Shaper
  "masons-eye": {
    kind: "Passive",
    range: "Line of sight",
    effect: "Every load-bearing point of a structure in line of sight is shown after 2s of looking: where to cut, where to brace, what comes down.",
    untested: true,
  },
  "shapers-licence": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    effect: "Unlocks Patch and Set (Tensile, Licensed): Patch mends one break in kit, a plate or a wall clean in 10s with no bench; Set holds one surface up to 2m across in the shape you give it for as long as you keep the channel.",
    notes: "Set is channelled. Pushed and failed, Patch closes over the wound as well and Set holds your shape.",
    untested: true,
  },
  "etch": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Melee",
    duration: "Until repaired",
    effect: "Unlocks Etch (Corrosive, Licensed): marks or weakens one surface by touch. Cutting along a weakened line takes half the work.",
    notes: "Pushed and failed, the mark goes into you.",
  },
  "standing-ward": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −8% damage. A Set, Brace or ward you hold outlives your attention: it stands 10s after the channel drops or you step out of range.",
  },
  "where-it-falls": {
    kind: "Passive",
    effect: "On your own demolitions the collapse shape and timing are predicted exactly and shown before you commit; nothing lands where you did not say. Allies inside the footprint are warned 3s before it comes down.",
    untested: true,
  },
  "brace-the-world": {
    kind: "Passive",
    range: "10m",
    effect: "Allies within 10m take −10% damage. A wall you Set or Brace holds as a load-bearing wall, and a floor you Brace holds any load a vehicle puts on it.",
  },
  "certified-boundary": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    effect: "Unlocks your Shaper class's Certified ability: Brace (Tensile) gives one wall load capacity structural integrity reads, for an hour; Shroud (Occlusive) makes a squad within 10m cast nothing and key no ward for 30s; Unbind (Corrosive) makes one material up to 2m across stop being one piece. 12% chance per attack to strip a plate or stagger footing.",
    notes: "One pick, permanent. Shroud pushed and failed cuts your own squad off from Anchor, Warmth and Close too.",
  },
  "dissolution": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    range: "25m",
    duration: "10s",
    effect: "Unlocks Dissolution (Corrosive, Master): one structure within 25m comes down the way it went up, reversed, over 10s; nothing inside is left standing. Damage dealt +60%.",
    notes: "Ceiling: ACA, slot reserved; no trainer exists yet. Pushed and failed, it reverses the floor you cast from.",
  },

  // ------------------------------------------------------------ Mindworker
  "blank-ledger": {
    kind: "Passive",
    effect: "Your face shows only what you choose: lie-reads, Empathic Read and empaths get a wall. Tells below the collar, hands, veins and appetite, still show.",
    notes: "People, never instruments: a checkpoint scanner reads you as before.",
  },
  "empaths-licence": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "10m",
    effect: "Unlocks Steady and Read (Empathic, Licensed): Steady takes the edge off one mind within 10m, ending a panic and returning one Composure tick within 3s; Read surfaces one feeling from a consenting person at touch.",
    notes: "Pushed and failed, Steady takes the edge into you and Read cannot be switched off.",
    untested: true,
  },
  "distant-pulse": {
    kind: "Passive",
    range: "Any range",
    effect: "You feel your party's vitals at any range: every wound, panic, Down, and their direction from you. No line of sight is needed and nothing jams it.",
  },
  "room-tone": {
    kind: "Passive",
    effect: "You read a room's mood half a second before it turns: riots, ambushes and drawn steel stop being surprises, and you act in that half second.",
  },
  "whisper-range": {
    kind: "Passive",
    range: "40m",
    effect: "Your Empathic and Memetic casts work at conversation subtlety from 40m. Nobody sees you working.",
  },
  "anchor": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "25m",
    duration: "30s",
    effect: "Unlocks Anchor (Empathic, Certified): one companion within 25m has their Composure held to yours for 30s; they cannot break while you have not. Allies within 10m take −8% damage.",
    notes: "Weaves to Surgeon's Calm (Mender): buying either end links both paths. Pushed and failed, it breaks your Composure instead of holding theirs.",
  },
  "seed": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    effect: "Unlocks Seed (Memetic, Certified): plants one idea in a person within 10m that arrives with a memory of always having been there; it holds until written orders or a Returnee contradict it. 10% chance per attack to strip a plate or stagger footing.",
    notes: "Pushed and failed, it seeds the idea in your own memory.",
  },
  "doctrine": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    cooldown: "Once per day",
    range: "Line of sight",
    duration: "Until contradicted",
    effect: "Unlocks Doctrine (Memetic, Master): a settlement you stand inside believes one statement by morning; it holds until a written record or a Returnee contradicts it. 15% chance per attack to strip a plate or stagger footing.",
    notes: "Ceiling: the Bureau Examiner. Pushed and failed, it convinces you along with the settlement, by morning.",
  },

  // ------------------------------------------------------------ Resonant
  "grave-quiet": {
    kind: "Passive",
    range: "20m",
    effect: "Death within 20m registers: the count, direction and freshness of every body.",
  },
  "presence": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Any range",
    effect: "Unlocks Presence and Register (Echoic, Licensed): Presence tells you whether an Echo sits in a named Core, and whether it is lit, from anywhere; Register tells you which Forges hold you, and which hold a body you touch.",
    notes: "Pushed and failed, Presence makes you feel every Echo in the Core and Register shows you a Forge you never bound at.",
  },
  "register": {
    kind: "Passive",
    effect: "Sees through 6% concealment. Register runs without a cast: which Forges hold you is always known, and any body you can see shows which Forges hold it.",
  },
  "second-look": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    cooldown: "5 min",
    range: "Self",
    duration: "3s",
    effect: "Unlocks Second Look (Temporal, Licensed): the last three seconds replay for you alone, enough to re-read a face, a hand or a card. 5-minute cooldown.",
    notes: "Temporal licences are 90-day provisional and close at corruption phase 2. Pushed and failed, the three seconds loop again and again.",
  },
  "echo-read": {
    kind: "Spell",
    cost: "4 pool · 2 charges",
    range: "10m",
    effect: "Unlocks Echo Read (Echoic, Certified): inside a register, reads the shape an ending left on one body or place within 10m: how, when, and who was there. Sees through 8% concealment.",
    notes: "Outside a register there is only the roar and the cast gives nothing.",
  },
  "forge-manners": {
    kind: "Passive",
    effect: "Forge Cores answer you first: −10% on all Core work, and the queue moves you up one place.",
  },
  "steady-the-hand": {
    kind: "Spell",
    cost: "2 pool · 1 charge",
    range: "Self",
    effect: "Unlocks Steady the Hand (Temporal, Licensed): half a second returned; one missed shot, dropped cast or failed check from the last 0.5s is taken back and made again. Action speed +12% (attacks, casts and swaps cycle faster).",
    notes: "Ninety-day provisional licence, closes at corruption phase 2. Pushed and failed, the half second comes out of your own future.",
  },
  "call": {
    kind: "Capstone",
    cost: "8 pool · 4 charges",
    cooldown: "Once per day",
    range: "Any range",
    effect: "Unlocks Call (Echoic, Master): begins a reclamation from where you stand for one Dead ally whose Echo is lit in a Forge that holds them; the Forge still builds the body, at the Forge. Field-mends nearby allies 10 wounds' worth a minute.",
    notes: "Ceiling: the Resident, an Echo in a Core. Pushed and failed, it begins somebody else's reclamation.",
  },

  // ------------------------------------------------------------ The Overflow (corrupted)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Cast costs −4%. Your envelope reads to the unit and a channel does not drift with the tremor.",
    notes: "Phase 1, Tremor: costs a Coordination rung. Shuts no door. Each phase's power stays lit when the next comes.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "+6 maximum pool / charges. You conduct past your gear's rating: a rig delivers every charge it lights.",
    notes: "Phase 2, Veining: costs a Conditioning rung and +10% on every reclamation; pays a Conductivity rung above your ceiling. Temporal licences close: Second Look and Steady the Hand.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "+0.8 pool or charges per landed hit. You always know the direction and distance of the nearest open Essence.",
    notes: "Phase 3, Appetite: costs two Composure rungs. Command ceilings close.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 12% concealment. Casts, wards and Echoes within line of sight show as light.",
    notes: "Phase 4, Sensitivity: 12% easier to read and to hit; +20% on reclamation; instruments flag you at every checkpoint that has one.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +20%. Once per fight you cast one Licensed ability from a class you never licensed, whichever the last dose used to be.",
    notes: "Phase 5, Drift: nobody sells you plates, one plate slot short; skill ceilings lose a rank; every teacher closes except the Choir and the Covenant.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "Cast costs −8%. Once per day one overcharge failure is spared: the cast resolves as pushed and the pillar's failure does not land.",
    notes: "Phase 6, Turning: nobody billets with you, between-fight care halves; +40% on reclamation; binding closes at any Forge with a policy, and the ACA collects at phase 6.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
  },
};
