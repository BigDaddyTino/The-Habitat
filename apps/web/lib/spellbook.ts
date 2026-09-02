/**
 * The spellbook — the 108 licensed spells of the six pillars, one readable
 * card each.
 *
 * Six pillars, twenty-seven licence classes, four spells per class (two at
 * Licensed, one at Certified, the signature at Master). Every spell embeds an
 * `AbilityCard` written to Docs/codex/ABILITY_CARD_STYLE.md: present tense,
 * second person, numbers in the Effect line, the wound model's words and never
 * hit points. The dossier's own one-liner is kept as `flavor`; the pillar's
 * "When a cast is pushed" clause is kept as `overcharge`.
 *
 * Nothing here has been simulated. Every card carries `untested: true` until
 * the balance campaign measures it.
 */

import type { AbilityCard } from "./ability-cards";

export type SpellTier = "Licensed" | "Certified" | "Master";
export type DamageType = "PHYSICAL" | "FIRE" | "ELECTRICAL" | "ARCANE" | "TOXIC";

export type Pillar = {
  /** Codex slug: thermodynamics | kinetics | structure | biologics | cognition | resonance. */
  slug: string;
  name: string;
  /** One line, from the dossier's opening. */
  tagline: string;
  /** Licence classes in dossier order. */
  licences: string[];
  /** Who licenses it, one line, from the registry's licensing spine. */
  holder: string;
  /** "How the pillar fails" one-liner from the dossier. */
  failure: string;
  /** The Counterplay paragraph, tightened. */
  counterplay: string;
};

export type Spell = {
  /** kebab-case of the name, unique across all 108. */
  id: string;
  name: string;
  /** Pillar slug. */
  pillar: string;
  /** Licence class, e.g. "Thermal". */
  licence: string;
  tier: SpellTier;
  cast: "Instant" | "Channelled";
  /** "Instant" | "1.5s channel" | "3s channel" | "While channelled" … */
  castTime: string;
  /** Only when the spell deals damage. */
  damageType?: DamageType;
  /** The dossier's own one-line description. */
  flavor: string;
  /** The readable card. kind is always "Spell"; untested is always true. */
  card: AbilityCard;
  /** What happens when this spell is pushed and fails. */
  overcharge: string;
};

/** Cost by tier: a born caster's pool, or an infused rig's charges. */
const COST: Record<SpellTier, string> = {
  Licensed: "2 pool · 1 charge",
  Certified: "4 pool · 2 charges",
  Master: "8 pool · 4 charges",
};

/** The registry's law on channelling, printed on every channelled card. */
const CH =
  "Channelled: a commit window nobody can shoot through. A rig hit mid-channel is an automatic overcharge failure, and Coordination decides whether the channel survives being jostled.";

export const pillars: Pillar[] = [
  {
    slug: "thermodynamics",
    name: "Thermodynamics",
    tagline:
      "Energy moved from where it is to where somebody wants it — the most common certification in the world.",
    licences: ["Thermal", "Cryogenic", "Electrical", "Radiant"],
    holder:
      "National Defense Directorate engineering rolls, industrial grade — widely held, lightly policed, and the first licence most working people ever meet.",
    failure:
      "It does not stop at the target: everything wet within reach changes state at once, including whoever is holding on to you.",
    counterplay:
      "Wet ground, Cryogenic or a Containment Seal; shoot the rig. Thermal and Brace beat Cryogenic; unplug and stand on a ground line against Electrical; eyes shut, Dim or smoke against Radiant.",
  },
  {
    slug: "kinetics",
    name: "Kinetics",
    tagline:
      "Momentum and weight, borrowed briefly — the pillar that changed infantry doctrine, and the one every army trains for first.",
    licences: ["Kinetic", "Gravitic", "Inertial", "Ballistic"],
    holder:
      "National Defense Directorate, standard military issue — the most widely held combat certification of the war.",
    failure:
      "What you take, you keep: held force spends itself within seconds, and if you do not choose a target it chooses you.",
    counterplay:
      "Stormglass detonates when Arrested; blades give nothing to catch. Brace, anchor lines and distance beat Gravitic; wait out or jostle an Inertial channel; a Seal or Fade beats Ballistic.",
  },
  {
    slug: "structure",
    name: "Structure",
    tagline:
      "Matter and boundaries — what holds together, what comes apart, and what is permitted to cross a line.",
    licences: ["Containment", "Tensile", "Occlusive", "Corrosive"],
    holder:
      "Abomination Containment Authority for Containment, industrial grade for the rest — hard to obtain, harder to keep, and a revocation follows you from city to city.",
    failure:
      "Boundaries are symmetrical whether you intended them or not; people have died inside their own ward with the door standing open.",
    counterplay:
      "Corrosive Unbind or patience beats Containment. Fire and Load Path beat Tensile. Noon, thermal optics or an Empathic Read beat Occlusive. Brace, distance and gridcore frames beat Corrosive.",
  },
  {
    slug: "biologics",
    name: "Biologics",
    tagline:
      "Living systems — repair, alteration, and the one child no state will license. Nothing here creates tissue; it only moves it.",
    licences: ["Regenerative", "Morphic", "Necrotic", "Xenic", "Bionic", "Hematic"],
    holder:
      "Meridian Arcane Institute teaching hospitals certify and a medical board revokes; the Wardens sign Morphic material, Aegis holds the Bionic patents, and Hematic has no licence — only the Choir's debt.",
    failure:
      "It optimises for the outcome rather than the patient, and it selects the donor site itself.",
    counterplay:
      "Wither, Levy or shooting the medic beat Regenerative. Calm beats Morphic. Regenerative, Cold Store and fire beat Necrotic. Noise beats Xenic. ELECTRICAL vents Bionic. Against Hematic, do not bleed.",
  },
  {
    slug: "cognition",
    name: "Cognition",
    tagline:
      "Minds, born and made — and machines, because a machine that has taken an order has something close enough to a mind to be worth asking.",
    licences: ["Perceptual", "Technomantic", "Empathic", "Memetic", "Coercive"],
    holder:
      "Drone Surveillance Bureau, officially neutral infrastructure, which also sells the blind spots; Coercive has no licence anywhere and never will.",
    failure:
      "The channel closes both ways, and you will not notice which side of it you have ended up on.",
    counterplay:
      "Cameras beat Perceptual; unplugging beats Technomantic; Composure and distance beat Empathic; written orders and a Returnee beat Memetic; Composure at its ceiling or a dead caster beats Coercive.",
  },
  {
    slug: "resonance",
    name: "Resonance",
    tagline:
      "Soul and continuum — the pillar nobody fully understands, touching the same substrate a Forge, the Veil and an Echo all touch.",
    licences: ["Echoic", "Translocative", "Temporal", "Reanimative"],
    holder:
      "Forge-adjacent for Echoic; Skybridge Transit Authority for Translocative, as freight; Ossuary Covenant chapters for Reanimative; Temporal on ninety-day provisional only, never above phase 1.",
    failure:
      "You reach for one and hear all of them at once, and some of them have not finished.",
    counterplay:
      "Distance from a Core, a Muzzle or an Unregistered beat Echoic. Set, Containment and Weight beat Translocative. Nothing reliable beats Temporal. Burn the body or bring lawyers against Reanimative.",
  },
];

export const spells: Spell[] = [
  // ───────────────────────── THERMODYNAMICS ─────────────────────────

  // Thermal
  {
    id: "ignition",
    name: "Ignition",
    pillar: "thermodynamics",
    licence: "Thermal",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "FIRE",
    flavor: "A thing lit at distance with no visible source.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "6s",
      effect:
        "Sets one flammable target within 25m alight. FIRE: 1 Hit now and Burning for 6s (1 Hit every 3s until out). Ignores half a plate.",
      notes: "A dose or a leaking rig on the target cooks off. Water, Cryogenic or a full roll ends the Burning early.",
      untested: true,
    },
    overcharge: "What lit was your sleeve: you take the Hit and the Burning instead of the target.",
  },
  {
    id: "warmth",
    name: "Warmth",
    pillar: "thermodynamics",
    licence: "Thermal",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A squad's hands kept working in the cold.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "1 hour",
      effect:
        "Allies within 10m ignore cold for 1 hour: no Coordination penalty from cold, no cold Composure tick, and hands keep working at any temperature.",
      notes: "Does not reach an ally under Occlusive Shroud or Fade.",
      untested: true,
    },
    overcharge: "The hands keep working while the skin does not: everyone under the Warmth is Grazed on both hands, and it reads as frostbite.",
  },
  {
    id: "flashover",
    name: "Flashover",
    pillar: "thermodynamics",
    licence: "Thermal",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    damageType: "FIRE",
    flavor: "A room's air igniting at once, doors first.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "25m",
      duration: "6s",
      effect:
        "Ignites the air of one room up to 10m across within 25m, doors first. FIRE to every body inside: 2 Hits and Burning for 6s, ignoring half a plate. Anyone standing in a doorway takes it first and is thrown 2m clear.",
      notes: `${CH} Needs a closed volume; in the open it is a 5m ball.`,
      untested: true,
    },
    overcharge: "The flashover includes the room you are standing in.",
  },
  {
    id: "sublimation",
    name: "Sublimation",
    pillar: "thermodynamics",
    licence: "Thermal",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "FIRE",
    flavor: "Skipping the liquid phase, so a body goes to steam inside armour that stays sealed.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      effect:
        "One target within 10m goes to steam: 4 Hits FIRE that ignore the plate entirely. A target in sealed armour or an exoframe is Down at once, and its plates are untouched for whoever wants them.",
      notes: `${CH} Does nothing to a target that is already open to the air at every location.`,
      untested: true,
    },
    overcharge: "Sublimation is beautiful inside sealed armour, and you are wearing some: the 4 Hits land on you, plate ignored.",
  },

  // Cryogenic
  {
    id: "freeze-the-ground",
    name: "Freeze the Ground",
    pillar: "thermodynamics",
    licence: "Cryogenic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Footing and routes, denied.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "30s",
      effect:
        "Ices a 5m patch of ground within 25m for 30s. Anyone crossing it makes a Coordination check or falls (staggered 2s); vehicles lose steering on it; no sprint and no Traversal across it.",
      notes: "Inertial Brace keeps footing on it. Thermal Warmth or a fire clears it early.",
      untested: true,
    },
    overcharge: "Freeze the Ground takes the road with it for a season, and persistent damage keeps it.",
  },
  {
    id: "cold-store",
    name: "Cold Store",
    pillar: "thermodynamics",
    licence: "Cryogenic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Keeps a body, a sample or a dose.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      duration: "24 hours",
      effect:
        "Keeps one body, sample or dose within 2m at cold store for 24 hours: it does not spoil, a dose does not expire, a body does not decay, and a Necrotic Spoil cannot take it.",
      notes: "A stored body's Dying clock does not run, but nothing can stand it back up while it is stored.",
      untested: true,
    },
    overcharge: "Cold Store keeps your hand: the casting hand is Broken by cold until treated.",
  },
  {
    id: "brittle",
    name: "Brittle",
    pillar: "thermodynamics",
    licence: "Cryogenic",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "Taking a plate or a limb past brittleness so the next hit shatters it.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "10s",
      effect:
        "Takes one plate or one limb within 10m past brittleness for 10s. The next PHYSICAL Hit on a brittle plate shatters it and passes through as a second Hit; the next Hit on a brittle limb also Breaks it.",
      notes: "Cryogenic's signature is vitrify, then strike: this does nothing on its own, and everything with a rifle behind it.",
      untested: true,
    },
    overcharge: "Brittle finds your own plate first: your nearest plate shatters on the next Hit you take.",
  },
  {
    id: "vitrify",
    name: "Vitrify",
    pillar: "thermodynamics",
    licence: "Cryogenic",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "PHYSICAL",
    flavor: "Glass bows before it breaks, which is canon's arcane scar, on anything you like.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "10s",
      effect:
        "Vitrifies everything within 5m of a point up to 25m away for 10s. Plates in it shatter on the next Hit, walls and vehicles lose their load path and open under the next PHYSICAL Hit, and every Hit on a vitrified body counts as 2 and Breaks the limb.",
      notes: `${CH} The scar it leaves reads as ARCANE to anyone who looks.`,
      untested: true,
    },
    overcharge: "Vitrify bows the glass in your own optics: every lens, sight and eye augment you wear is gone.",
  },

  // Electrical
  {
    id: "kill-the-circuit",
    name: "Kill the Circuit",
    pillar: "thermodynamics",
    licence: "Electrical",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Holding doors, cameras and ignition off.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "60s",
      effect:
        "Holds one circuit within 25m off for 60s: a door stays where it is, a camera sees nothing, an engine will not start, a turret goes idle. No damage, and nothing visible afterwards.",
      notes: "A gridcore ground line is not a circuit and cannot be killed.",
      untested: true,
    },
    overcharge: "Kill the Circuit kills yours: your augments vent and your rig goes dark for a minute.",
  },
  {
    id: "jump",
    name: "Jump",
    pillar: "thermodynamics",
    licence: "Electrical",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Starting a dead machine once.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      duration: "30s",
      effect:
        "Starts one dead machine within 2m once: an engine, a door motor, a drained drone. It runs 30s on the jolt with no fuel and no cell. On a body at Down it restarts the heart once: +2 minutes on the Dying clock.",
      untested: true,
    },
    overcharge: "Jump starts it and does not stop it: the machine runs until it breaks, ignoring every control.",
  },
  {
    id: "ground",
    name: "Ground",
    pillar: "thermodynamics",
    licence: "Electrical",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "ELECTRICAL",
    flavor: "Deciding what is grounded, spine included.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "15s",
      effect:
        "Chooses what is grounded within 10m for 15s. Grounded bodies take every ELECTRICAL Hit in the volume: 2 Hits ELECTRICAL now through the plate, a Coordination check or they drop what they hold, and their chrome goes offline for a minute. Everything else in the volume is spared.",
      notes: "Vents a grounded rig to zero charges.",
      untested: true,
    },
    overcharge: "Ground makes you the ground: every ELECTRICAL Hit in the volume lands on you.",
  },
  {
    id: "conduction",
    name: "Conduction",
    pillar: "thermodynamics",
    licence: "Electrical",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "ELECTRICAL",
    flavor: "Every conductor in the room becomes one circuit and you close it.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      effect:
        "Joins every conductor within 25m — rails, rigs, augments, wet floor — into one circuit and closes it. Every body in it takes 4 Hits ELECTRICAL through the plate, drops what it holds, vents its rig to zero charges, and its chrome goes offline for a minute.",
      notes: `${CH} Leaves nothing visible on anyone.`,
      untested: true,
    },
    overcharge: "Conduction closes the circuit with your spine: you take the full 4 Hits and your own rig and chrome vent.",
  },

  // Radiant
  {
    id: "overexpose",
    name: "Overexpose",
    pillar: "thermodynamics",
    licence: "Radiant",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Light where eyes were.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "5s",
      effect:
        "Puts light where eyes were in a 5m cone out to 25m: every target in it is blind for 5s (cannot target, hit chance −50% firing blind) and optics whitewash for 10s.",
      notes: "Eyes closed on the call take nothing. Occlusive Dim halves the cone.",
      untested: true,
    },
    overcharge: "Overexpose blinds you for a minute.",
  },
  {
    id: "dark-flash",
    name: "Dark Flash",
    pillar: "thermodynamics",
    licence: "Radiant",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A signal only your squad sees.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Line of sight",
      duration: "15s",
      effect:
        "Marks one point in line of sight for 15s in a light only your squad's eyes are keyed to. Every squadmate sees it through smoke, Dim and dark, and it wakes nobody else.",
      untested: true,
    },
    overcharge: "Dark Flash is seen by the enemy's optics too.",
  },
  {
    id: "bleach",
    name: "Bleach",
    pillar: "thermodynamics",
    licence: "Radiant",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "FIRE",
    flavor: "Light delivered as a dose, with nothing looking damaged for six hours.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "6 hours",
      effect:
        "Delivers light as a dose to one target within 10m. Nothing looks damaged for 6 hours; then 2 Hits FIRE that ignore the plate arrive all at once, wherever they are.",
      notes: "Nothing reads it before it lands except an Empathic Read or a medical instrument. Regenerative Knit cast in the window cancels it.",
      untested: true,
    },
    overcharge: "Bleach lands its dose on the nearest skin, which is the caster's.",
  },
  {
    id: "noon",
    name: "Noon",
    pillar: "thermodynamics",
    licence: "Radiant",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "No shadow anywhere in the volume, so nothing Occlusive works and nothing hides.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "While channelled",
      effect:
        "No shadow anywhere within 25m while you channel. Nothing Occlusive works in the volume (Dim, Fade, Shroud and Umbra end and cannot be cast), no concealment counts, and hit chance is +20% for everyone firing into it.",
      notes: `${CH} Both sides lose their cover from sight; only Containment still hides a body.`,
      untested: true,
    },
    overcharge: "Noon leaves no cover for either side: your own squad's concealment is gone and every ward on them ends too.",
  },

  // ───────────────────────────── KINETICS ─────────────────────────────

  // Kinetic
  {
    id: "shove",
    name: "Shove",
    pillar: "kinetics",
    licence: "Kinetic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "Force, applied.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Throws one body or object up to 100kg within 10m 3m back and staggers it for 2s. A body that hits a wall takes 1 Hit PHYSICAL.",
      notes: "Inertial Brace on the target stops it cold.",
      untested: true,
    },
    overcharge: "Shove puts him through the wall and you through the opposite one: both of you take 2 Hits PHYSICAL and are staggered 2s.",
  },
  {
    id: "catch",
    name: "Catch",
    pillar: "kinetics",
    licence: "Kinetic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Stopping one thrown thing.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "3s",
      effect:
        "Stops one thrown thing within 10m in the air — a grenade, a bottle, a knife — and holds it there 3s, then it drops where it is. A grenade drops live.",
      notes: "Rounds are too fast for Catch; that is Arrest.",
      untested: true,
    },
    overcharge: "You caught it and cannot let go: it stays in your hand for 10s, live if it was live.",
  },
  {
    id: "arrest",
    name: "Arrest",
    pillar: "kinetics",
    licence: "Kinetic",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A round caught in flight and held.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "10s",
      effect:
        "Catches one round in flight within 10m and holds it for 10s. The shot never lands. A stormglass round cannot be held: it detonates where it was caught.",
      notes: "Sets up Return. Held force spends itself within seconds — drop it or send it.",
      untested: true,
    },
    overcharge: "Arrest leaves the round travelling, in your hand: 2 Hits PHYSICAL to the casting arm and it is Broken.",
  },
  {
    id: "return",
    name: "Return",
    pillar: "kinetics",
    licence: "Kinetic",
    tier: "Master",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "Held momentum sent back to whoever fired it, at speed, starting from inside them.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      effect:
        "Sends the round you are holding back to whoever fired it, starting from inside them: 4 Hits PHYSICAL that ignore the plate, and Bleeding at the location. Needs a round held by Arrest or a thing held by Catch.",
      notes: "Line of sight to the shooter is not needed; the round remembers.",
      untested: true,
    },
    overcharge: "Return arrives from inside the wrong person — the nearest body to you, which is usually a squadmate.",
  },

  // Gravitic
  {
    id: "lighten",
    name: "Lighten",
    pillar: "kinetics",
    licence: "Gravitic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Which is every salvage crew's first hire.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "5 min",
      effect:
        "Halves the weight of one object or body up to 500kg within 10m for 5 minutes. Two people carry what took eight; a lightened body falls at half speed and lands Grazed instead of Hit.",
      notes: "Gravitic is short-ranged by design.",
      untested: true,
    },
    overcharge: "Lighten lifts the load, then the crew: everyone within 3m floats 2m up for 10s and lands Hit.",
  },
  {
    id: "weight",
    name: "Weight",
    pillar: "kinetics",
    licence: "Gravitic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "The reverse.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "10s",
      effect:
        "Doubles the weight of one body or object within 10m for 10s. A body loses sprint, Traversal and climbing and moves at half speed; a vehicle on soft ground sinks to the axle; a hanging thing tears free and lands for 1 Hit PHYSICAL on whatever is under it.",
      notes: "Heavy things arrive late: a Weighted body cannot be Fetched, Sent or Consigned.",
      untested: true,
    },
    overcharge: "Weight finds your own boots: you cannot move for 10s.",
  },
  {
    id: "plumb",
    name: "Plumb",
    pillar: "kinetics",
    licence: "Gravitic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    damageType: "PHYSICAL",
    flavor: "Down is now that way, and a stairwell becomes a well.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "15s",
      effect:
        "Turns down sideways in a volume 10m across within 10m for 15s. Everything unsecured falls that way at 3m per second; a stairwell becomes a well, and a body that lands on a wall takes 2 Hits PHYSICAL.",
      notes: `${CH} Anchor lines and Inertial Brace hold against it.`,
      untested: true,
    },
    overcharge: "Plumb points down at you first: you fall into your own volume.",
  },
  {
    id: "well",
    name: "Well",
    pillar: "kinetics",
    licence: "Gravitic",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "PHYSICAL",
    flavor: "A volume where everything falls toward one point and stays. It persists after you leave.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      duration: "1 hour",
      effect:
        "Opens a well 5m across up to 10m away for 1 hour. Everything in it falls toward one point and stays, rounds and thrown things included; bodies dragged in take 4 Hits PHYSICAL from the crush and cannot climb out without a rope and a Conditioning check.",
      notes: `${CH} It persists after you leave, and it does not care who walks in.`,
      untested: true,
    },
    overcharge: "A failed Well will not close, and the locals route around it for forty years.",
  },

  // Inertial
  {
    id: "brace-inertial",
    name: "Brace",
    pillar: "kinetics",
    licence: "Inertial",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "So you do not get moved by blast, current or anybody bigger.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      duration: "15s",
      effect:
        "For 15s nothing moves you: blast, current, Shove, Gravitic or anyone bigger. You cannot be knocked back, staggered or pulled, and you keep your footing on frozen ground.",
      notes: "You can still walk. Cast on yourself only.",
      untested: true,
    },
    overcharge: "Brace means you cannot move either: rooted where you stand for the full 15s.",
  },
  {
    id: "set-inertial",
    name: "Set",
    pillar: "kinetics",
    licence: "Inertial",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A thing fixed where it is.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "30s",
      effect:
        "Fixes one object or body up to 200kg within 10m where it is for 30s. A door stays open, a ladder stays put, a Set target cannot move its feet but can still shoot. Ends when the thing takes a Hit.",
      notes: "A Set thing cannot be Fetched or Sent.",
      untested: true,
    },
    overcharge: "Set holds your shape too: you are fixed where you stand for 30s.",
  },
  {
    id: "anchor-inertial",
    name: "Anchor",
    pillar: "kinetics",
    licence: "Inertial",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    damageType: "PHYSICAL",
    flavor: "Stopping a moving vehicle, badly.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "25m",
      effect:
        "Stops one moving vehicle within 25m dead. It halts within 1m of where it was; everyone aboard takes 2 Hits PHYSICAL and is staggered 2s, and unsecured cargo shifts.",
      notes: `${CH} Works on anything on wheels, tracks or rails; nothing airborne.`,
      untested: true,
    },
    overcharge: "Anchor stops the vehicle and not its cargo: everything loose aboard keeps travelling at the vehicle's speed, and it was coming toward you.",
  },
  {
    id: "stillpoint",
    name: "Stillpoint",
    pillar: "kinetics",
    licence: "Inertial",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "Nothing in the volume moves that you did not move.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      duration: "While channelled",
      effect:
        "Nothing within 10m moves that you did not move while you channel: bodies cannot step, rounds stop in the air and drop, grenades sit, vehicles idle. You can still walk, aim and fire, and anything you touch or shoot moves normally.",
      notes: `${CH} Every Inertial master ability is channelled: wait it out, or hit the channel.`,
      untested: true,
    },
    overcharge: "Stillpoint includes you: you are held in your own volume for 10s after the channel breaks.",
  },

  // Ballistic
  {
    id: "correct",
    name: "Correct",
    pillar: "kinetics",
    licence: "Ballistic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "A shot, adjusted after firing.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Rifle range",
      effect:
        "Adjusts one shot after it leaves the barrel — yours, or a squadmate's within 10m of you. A miss becomes a Hit at the location you name, or a Hit moves one location (arm to head). Once per round fired.",
      notes: "A called head shot still needs the helmet plate gone first.",
      untested: true,
    },
    overcharge: "Correct corrects onto the nearest warm thing, which is usually a squadmate.",
  },
  {
    id: "carry",
    name: "Carry",
    pillar: "kinetics",
    licence: "Ballistic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "One more decision for something already thrown.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "3s",
      effect:
        "Gives one thrown thing in the air within 25m one more decision: +10m of flight, one turn of up to 90°, or a stop at a point you name. A grenade lands within 1m of where you looked.",
      untested: true,
    },
    overcharge: "Carry lets the round decide: it lands wherever it likes, including at your feet.",
  },
  {
    id: "curve",
    name: "Curve",
    pillar: "kinetics",
    licence: "Ballistic",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "A round around a corner.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Rifle range",
      effect:
        "Bends your next round around one corner or over one piece of cover within rifle range. Cover does not count, the round lands at the location you name, and it counts as 2 Hits PHYSICAL.",
      notes: "A Containment Seal on the corner stops it; Occlusive Fade on the target breaks the look.",
      untested: true,
    },
    overcharge: "Curve comes back around the corner and finds you.",
  },
  {
    id: "convoy",
    name: "Convoy",
    pillar: "kinetics",
    licence: "Ballistic",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    damageType: "PHYSICAL",
    flavor: "Every round in the air goes where you are looking.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Line of sight",
      duration: "While channelled",
      effect:
        "Every round in the air within line of sight — yours, your squad's and theirs — goes where you are looking while you channel, and lands at the location you name. A squad volley on one target lands as 4 Hits PHYSICAL at minimum.",
      notes: `${CH} Look away and the rounds follow. Do not look at your medic.`,
      untested: true,
    },
    overcharge: "Convoy sends every round where you looked — which was at your medic.",
  },

  // ───────────────────────────── STRUCTURE ─────────────────────────────

  // Containment
  {
    id: "seal",
    name: "Seal",
    pillar: "structure",
    licence: "Containment",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A doorway or hull that holds as long as you do.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "5m",
      duration: "Until moved",
      effect:
        "A ward across one door, window or breach up to 3m wide. No body or round crosses it while you stand within 3m. Holds until you move or go Down.",
      notes: "Corrosive Unbind ends it. An ally under Occlusive Shroud or Umbra passes through.",
      untested: true,
    },
    overcharge: "A failed Seal seals against you: you are on the wrong side of your own ward and cannot cross it until you go Down.",
  },
  {
    id: "hold",
    name: "Hold",
    pillar: "structure",
    licence: "Containment",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A thing kept where it is.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "Until moved",
      effect:
        "Keeps one thing within 10m where it is — a body in a chair, a creature in a jar, a door shut — until you move more than 10m away or go Down. It cannot leave a 1m circle; it can still act inside it.",
      notes: "Boundaries are symmetrical: nothing gets in to it either, medic included.",
      untested: true,
    },
    overcharge: "Hold makes the jar the room: everything in the room is held, you included.",
  },
  {
    id: "quiet",
    name: "Quiet",
    pillar: "structure",
    licence: "Containment",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    flavor: "No sound leaving.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "5 min",
      effect:
        "No sound leaves a volume 10m across within 10m for 5 minutes. Gunfire, screams and a Xenic call inside it are heard by nobody outside, and suspicion from noise does not tick.",
      notes: "Sound still travels inside the volume. Radio still leaves it.",
      untested: true,
    },
    overcharge: "Quiet takes your own squad's voices: nobody in the volume can speak or call for 5 minutes.",
  },
  {
    id: "muzzle",
    name: "Muzzle",
    pillar: "structure",
    licence: "Containment",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "Nothing leaves at all: not light, not sound, not blood, not air if you are careless.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      duration: "While channelled",
      effect:
        "Nothing leaves a volume 10m across within 10m while you channel: no light, no sound, no blood, no resonance, no round. Nothing outside can Hit, read or Register anything inside. At 60s of channel the air is gone and everyone inside is Down.",
      notes: `${CH} Nothing gets in either. It is how a Core is silenced and how a Risen is boxed.`,
      untested: true,
    },
    overcharge: "Muzzle takes the air: everyone inside, you included, is Down in 30s unless the channel breaks.",
  },

  // Tensile
  {
    id: "patch",
    name: "Patch",
    pillar: "structure",
    licence: "Tensile",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A field repair with no bench.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      duration: "24 hours",
      effect:
        "Repairs one piece of kit within 2m with no bench: restores 1 spent plate to its slot, or +25% durability to a weapon, hull or vehicle panel. The patch holds 24 hours or until the next Hit on it.",
      notes: "A patched plate absorbs one Hit like any other and is gone.",
      untested: true,
    },
    overcharge: "Patch closes over the wound as well: the nearest open wound is sealed under the material and keeps Bleeding under a plate until it is cut open.",
  },
  {
    id: "set-tensile",
    name: "Set",
    pillar: "structure",
    licence: "Tensile",
    tier: "Licensed",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "Matter holding a shape while you keep telling it.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "While channelled",
      effect:
        "Holds matter within 10m in a shape while you keep telling it: a bent bar stays bent, a poured seal stays put, loose stone spans a 5m gap and takes a squad's weight. It collapses the moment you stop.",
      notes: `${CH} The shape carries 2 Hits before it fails.`,
      untested: true,
    },
    overcharge: "Set holds your shape: you cannot change your stance or move a limb for 10s.",
  },
  {
    id: "brace-tensile",
    name: "Brace",
    pillar: "structure",
    licence: "Tensile",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A wall that gains capacity structural integrity can read.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "1 hour",
      effect:
        "Adds load capacity a structural reading can see to one wall, floor or frame within 10m for 1 hour: +2 Hits before it fails, and Demolition's Load Path cannot bring it down by charge alone.",
      notes: "Beats Corrosive Etch and Unbind on the braced piece. Does not brace what it stands on.",
      untested: true,
    },
    overcharge: "Brace braces the wall and not the floor: the floor under you gives, and you take 2 Hits from the fall.",
  },
  {
    id: "frame",
    name: "Frame",
    pillar: "structure",
    licence: "Tensile",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "A structure built from what is lying there, standing while you stand.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "Until you go Down",
      effect:
        "Builds a structure from what is lying within 25m — rubble, rail, wreck — up to 10m across: cover with 4 Hits before it fails, a bridge, a stair, a roof. It stands while you stand and comes down when you go Down or walk more than 25m from it.",
      notes: `${CH} You channel to raise it; once raised it holds without your hands but not without you.`,
      untested: true,
    },
    overcharge: "Frame stands while you stand, so you cannot sit down: it holds until you go Down, and then it comes down on whoever is inside.",
  },

  // Occlusive
  {
    id: "dim",
    name: "Dim",
    pillar: "structure",
    licence: "Occlusive",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Killing the light without touching the source.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      duration: "60s",
      effect:
        "Kills the light in a volume 10m across within 25m for 60s without touching the source. Everything inside is 30% harder to target and to hit, and cameras see black.",
      notes: "Radiant Noon ends it. Thermal optics see through it.",
      untested: true,
    },
    overcharge: "Dim includes your optics: you are blind in the volume for its full 60s.",
  },
  {
    id: "fade",
    name: "Fade",
    pillar: "structure",
    licence: "Occlusive",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Harder to see.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      duration: "30s",
      effect:
        "You are 25% harder to target and to hit for 30s, and 50% while you stand still. Firing ends it.",
      notes: "Breaks a Ballistic caster's look. An Empathic Read still feels you.",
      untested: true,
    },
    overcharge: "Fade fades you from your own squad: their Anchor, Warmth and Close cannot find you for 30s.",
  },
  {
    id: "shroud",
    name: "Shroud",
    pillar: "structure",
    licence: "Occlusive",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A squad casts nothing and no ward keys on them.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "5 min",
      effect:
        "Your squad within 10m casts no shadow and no signal for 5 minutes: no ward keys on them (Seal, Hold and Muzzle let them pass), no lattice or Echoic Register reads them, and they are 20% harder to target.",
      notes: "Ends for anyone who fires. Noon ends it for everyone.",
      untested: true,
    },
    overcharge: "Shroud means the squad receives nothing either: no Empathic Anchor, no Warmth, no Close for the full 5 minutes.",
  },
  {
    id: "umbra",
    name: "Umbra",
    pillar: "structure",
    licence: "Occlusive",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "You are not there to be warded against.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Self",
      duration: "While channelled",
      effect:
        "You are not there to be warded against while you channel: you pass through any Seal, Hold, Muzzle or ward, nothing Cognition reads you, nothing Echoic registers you, and you are 75% harder to target. Firing ends it.",
      notes: `${CH} You can walk while channelling this one; a Hit breaks it.`,
      untested: true,
    },
    overcharge: "Umbra means you are not there to the Forge, briefly, so do not die inside it: a Dying clock that runs out during the channel lights no Echo.",
  },

  // Corrosive
  {
    id: "open",
    name: "Open",
    pillar: "structure",
    licence: "Corrosive",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A silent lock or weld.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "Opens one lock or weld within 2m silently in 3s. No breach charge, no noise, no suspicion tick. A gridcore-framed lock resists it.",
      untested: true,
    },
    overcharge: "A failed Open opens the frame and the wall as well: the whole doorway comes down, and everyone within 3m takes 1 Hit.",
  },
  {
    id: "etch",
    name: "Etch",
    pillar: "structure",
    licence: "Corrosive",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "A surface marked or weakened.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "Until repaired",
      effect:
        "Marks or weakens one surface within 10m. Marked: a sign anyone reads, for good. Weakened: the next PHYSICAL Hit on that plate or panel counts as 2, and a weakened wall opens to a shoulder.",
      notes: "Tensile Brace on the surface cancels the weakening.",
      untested: true,
    },
    overcharge: "Etch puts the mark in you: a scar on the casting hand that reads as ARCANE, and 1 Hit.",
  },
  {
    id: "unbind",
    name: "Unbind",
    pillar: "structure",
    licence: "Corrosive",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "PHYSICAL",
    flavor: "A material that stops being one piece.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      effect:
        "One piece of material up to 2m across within 10m stops being one piece: a plate is gone, a weapon loses its stock, a door leaves its hinges, a Containment Seal or Hold on it ends. A body wearing it takes 2 Hits PHYSICAL from the debris.",
      notes: "The counter to Containment. Gridcore framing resists it.",
      untested: true,
    },
    overcharge: "Unbind unbinds your own plate first: every plate you wear is gone.",
  },
  {
    id: "dissolution",
    name: "Dissolution",
    pillar: "structure",
    licence: "Corrosive",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "PHYSICAL",
    flavor: "Removes the reason a structure is a structure, and brings it down the way it went up, reversed.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "10s",
      effect:
        "Removes the reason one structure within 25m — a wall, a bridge, a floor, a vehicle — is a structure. It comes down the way it went up, reversed, over 10s. Everyone in it or under it takes 4 Hits PHYSICAL and is buried, and every door, ward and load path it held is gone.",
      notes: `${CH} A Tensile Brace on the structure buys it 2 more Hits before it goes.`,
      untested: true,
    },
    overcharge: "Dissolution reverses the construction of the floor you cast from.",
  },

  // ───────────────────────────── BIOLOGICS ─────────────────────────────

  // Regenerative
  {
    id: "close",
    name: "Close",
    pillar: "biologics",
    licence: "Regenerative",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Stopping a four-minute bleed.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "Stops one bleed within 2m: Bleeding ends, and a Dying clock it had halved is restored to full. Does not close the Hit.",
      notes: "Cannot reach an ally under Occlusive Fade or Shroud. Necrotic Wither on the location blocks it.",
      untested: true,
    },
    overcharge: "Close closes the airway: the patient is Down at once and the clock starts.",
  },
  {
    id: "knit",
    name: "Knit",
    pillar: "biologics",
    licence: "Regenerative",
    tier: "Licensed",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "Tissue mended.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "Mends one wound within 2m: 1 Hit is gone from the location you name, or a Broken limb is set to Hit. The tissue comes from the same body, about a kilo of it.",
      notes: `${CH} Nothing here creates tissue; a patient Knit five times is visibly thinner.`,
      untested: true,
    },
    overcharge: "Knit knits wrong: the location stays at Hit, and it enters lasting wounds for good if you bind again afterwards.",
  },
  {
    id: "debridement",
    name: "Debridement",
    pillar: "biologics",
    licence: "Regenerative",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "A wound closed from elsewhere on the same body, where the donor site is the entire conversation.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Melee",
      effect:
        "Closes wounds within 2m from elsewhere on the same body: 2 Hits gone from the location you name, or a Broken limb to Hit plus 1 more Hit gone. The donor site you name is Grazed and stiff for a day. Name the site, or the spell does.",
      notes: `${CH} A donor site named twice in a week becomes a lasting-wounds entry.`,
      untested: true,
    },
    overcharge: "Debridement chooses the donor site for you.",
  },
  {
    id: "rebuild",
    name: "Rebuild",
    pillar: "biologics",
    licence: "Regenerative",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "A limb made from the patient's own mass, so somebody walks away lighter.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Melee",
      effect:
        "Rebuilds one limb within 2m — Broken, lost, or a lasting-wounds entry — from the patient's own mass. The limb is whole, the entry is gone, and the patient is 8kg lighter and Grazed everywhere for a day. Once per limb per patient.",
      notes: `${CH} The surgeon must be standing; the patient need not be conscious.`,
      untested: true,
    },
    overcharge: "Rebuild takes the limb from the surgeon: the mass comes out of you, and your matching limb is Broken.",
  },

  // Morphic
  {
    id: "adjust",
    name: "Adjust",
    pillar: "biologics",
    licence: "Morphic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "An hour of grip or lungs or night sight.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      duration: "1 hour",
      effect:
        "Retunes one of your own systems for 1 hour. Grip: Conditioning +1 for climbing and holding. Lungs: 5 minutes of breath, no filter needed. Night sight: sees through 30% concealment in the dark. One at a time.",
      notes: "Casting a second Adjust ends the first.",
      untested: true,
    },
    overcharge: "Adjust leaves the night sight in and makes daylight the problem: blind in daylight for a day.",
  },
  {
    id: "wear",
    name: "Wear",
    pillar: "biologics",
    licence: "Morphic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "One trait from harvested material.",
    card: {
      kind: "Spell",
      cost: `${COST.Licensed} · harvested material`,
      range: "Self",
      duration: "1 hour",
      effect:
        "Wears one trait from harvested material you carry for 1 hour. Hide: +1 plate slot, filled. Claws: your hands count as a bladed weapon. Scent: animals do not alarm on you. Consumes the material.",
      notes: "Unsigned material is fine at this tier; nobody checks a one-hour hide.",
      untested: true,
    },
    overcharge: "Wear wears you: the trait does not come off for a day, the material is spending you, and you take 1 Hit at the site when it finally does.",
  },
  {
    id: "graft",
    name: "Graft",
    pillar: "biologics",
    licence: "Morphic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "A trait that holds a week with the Wardens signing the material.",
    card: {
      kind: "Spell",
      cost: `${COST.Certified} · Warden-signed material`,
      range: "Melee",
      duration: "1 week",
      effect:
        "Grafts one trait from signed material onto a body within 2m for a week: +1 plate slot, filled; night sight through 30% concealment; lungs that need no filter; or a limb that counts as a bladed weapon. Two grafts can hold at once.",
      notes: `${CH} Unsigned material grafts, but the wearer takes one corruption-phase tick and the Wardens are entitled to ask.`,
      untested: true,
    },
    overcharge: "A failed Graft does not come off.",
  },
  {
    id: "assume",
    name: "Assume",
    pillar: "biologics",
    licence: "Morphic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "A whole body's shape taken from what you killed, which comes off on schedule or does not.",
    card: {
      kind: "Spell",
      cost: `${COST.Master} · material from a kill`,
      range: "Self",
      duration: "1 hour",
      effect:
        "Takes the whole shape of something you killed and carry material from, for 1 hour: its size, its plates (+2 plate slots, filled), its speed and Traversal, its senses, its scent. Weapons and rig go where the shape allows. Comes off on the hour.",
      notes: `${CH} Provenance run on you while Assumed reads the creature, not you.`,
      untested: true,
    },
    overcharge: "Assume comes off on its own schedule, mid-crossing.",
  },

  // Necrotic
  {
    id: "spoil",
    name: "Spoil",
    pillar: "biologics",
    licence: "Necrotic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Supplies or a sample, ruined.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Ruins one cache within 10m in 3s: a crate of rations, a day's water, one rig's dose, a Wardens' specimen. It is worthless afterwards, and anything that eats it anyway takes a TOXIC clock.",
      notes: "Cold Store on the cache blocks it.",
      untested: true,
    },
    overcharge: "Spoil spoils your own supply: your rations, water and doses are gone.",
  },
  {
    id: "wither",
    name: "Wither",
    pillar: "biologics",
    licence: "Necrotic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "TOXIC",
    flavor: "A wound that will not close.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "Until treated",
      effect:
        "Puts a wound on one target within 10m that will not close: 1 Hit TOXIC that ignores the plate, and no Close, Knit or self-repair works on that location until a Chemistry antitoxin is applied.",
      notes: "The counter to a squad's medic.",
      untested: true,
    },
    overcharge: "Wither puts the wound on the caster.",
  },
  {
    id: "hasten",
    name: "Hasten",
    pillar: "biologics",
    licence: "Necrotic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "TOXIC",
    flavor: "All the years a thing has not had, at once.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      effect:
        "Gives one thing within 10m all the years it has not had, at once. A body takes 2 Hits TOXIC that ignore the plate and one limb goes Broken with age; a machine takes a year of wear in 3s and stops; a wall's load path rots to half.",
      notes: `${CH} Resilience resists the TOXIC clock as usual; nothing resists the years.`,
      untested: true,
    },
    overcharge: "Hasten lands the years on the nearest living thing, which may be you.",
  },
  {
    id: "season",
    name: "Season",
    pillar: "biologics",
    licence: "Necrotic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    damageType: "TOXIC",
    flavor: "A district's harvest gone. It is an economy weapon and everybody treats it as one.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "1km",
      effect:
        "Every growing or stored thing within 1km — a district's harvest, its herds, its seed stock — is gone within a day. Bodies within 25m of you when it lands take 4 Hits TOXIC that ignore the plate. The district's disposition to you is hostile the moment it is traced.",
      notes: `${CH} Once per day. Everybody treats it as a war crime, because it is one.`,
      untested: true,
    },
    overcharge: "Season takes a district's harvest and its dead at once, which is when the Covenant calls.",
  },

  // Xenic
  {
    id: "calm",
    name: "Calm",
    pillar: "biologics",
    licence: "Xenic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "An animal, settled.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "5 min",
      effect:
        "Settles one animal or creature within 10m for 5 minutes: it does not attack, does not flee, and lets you within 2m. A Hit on it ends the calm.",
      notes: "The Wardens' counter to Morphic. Noise louder than the animal breaks it.",
      untested: true,
    },
    overcharge: "Calm calms the caster: you cannot attack or run for 5 minutes.",
  },
  {
    id: "provenance",
    name: "Provenance",
    pillar: "biologics",
    licence: "Xenic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "What a creature is, what it was, and in the Reach what drove its rung.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Reads one creature within 10m in 3s: what it is, what it was, what it has eaten, where it came from, and in the Reach what drove its mutation rung. Adds its entry to your bestiary at once.",
      untested: true,
    },
    overcharge: "Provenance teaches you what you are: a Composure check, or Composure one rung lower for the day.",
  },
  {
    id: "herd",
    name: "Herd",
    pillar: "biologics",
    licence: "Xenic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "Changing a migration's next move.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Line of sight",
      duration: "1 hour",
      effect:
        "Changes a migration's next move: a herd or pack of up to 40 bodies in line of sight goes where you point for the next hour — through a checkpoint, off a road, over a camp.",
      notes: `${CH} It is not an attack; the animals do not fight for you, they merely arrive.`,
      untested: true,
    },
    overcharge: "Herd routes the migration through you.",
  },
  {
    id: "bellwether",
    name: "Bellwether",
    pillar: "biologics",
    licence: "Xenic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "A region's animals read you as the signal — and the Reach already has the Bellwether, which noticed.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "1km",
      duration: "1 day",
      effect:
        "Every animal within 1km reads you as the signal for a day, up to 200 bodies: they move when you move, stop when you stop, and go where you go — a herd as a wall, a flock as a screen. They do not attack for you.",
      notes: `${CH} Once per day. In the Reach, something else is already the signal, and it notices.`,
      untested: true,
    },
    overcharge: "Bellwether makes a region's animals read you as the signal for good, and the Reach already has one.",
  },

  // Bionic
  {
    id: "accept",
    name: "Accept",
    pillar: "biologics",
    licence: "Bionic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A body takes hardware without rejection.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      duration: "24 hours",
      effect:
        "One body within 2m takes hardware without rejection for 24 hours: an augment seats with no Resilience check, no rejection fever, and no Composure tick.",
      notes: "The seating still needs a bench; this only makes the body agree.",
      untested: true,
    },
    overcharge: "Accept accepts the toxin too: the body stops rejecting anything for a day, poison included.",
  },
  {
    id: "seat",
    name: "Seat",
    pillar: "biologics",
    licence: "Bionic",
    tier: "Licensed",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "Hardware taking with no scar at the boundary.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "Seats one augment within 2m with no scar at the boundary: it reads as skin to a search or an instrument, takes no lasting-wounds entry at the seat, and the wearer takes no Composure tick from carrying it.",
      notes: `${CH} It is still chrome: ELECTRICAL vents it like any other.`,
      untested: true,
    },
    overcharge: "Seat seats deeper than intended: the augment cannot be removed, and it counts as chrome that ELECTRICAL can vent.",
  },
  {
    id: "interface",
    name: "Interface",
    pillar: "biologics",
    licence: "Bionic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "An implant answering to a body it was not built for, at which point Aegis's lawyers are informed.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Melee",
      duration: "1 week",
      effect:
        "Makes one implant answer a body it was not built for, for a week: an Aegis-patent augment runs on anybody within 2m, salvaged chrome obeys its new wearer, an enemy's rig accepts your doses. Aegis's patent lockout can still kill it remotely.",
      notes: `${CH} Aegis suspicion +1 every time it is cast on patented hardware.`,
      untested: true,
    },
    overcharge: "Interface hands the implant to somebody else: the nearest body with a compatible seat controls it for the week.",
  },
  {
    id: "conversion",
    name: "Conversion",
    pillar: "biologics",
    licence: "Bionic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "A body that is mostly hardware — and the Forge rebuilds only the meat, so you come back a fraction.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Melee",
      duration: "Permanent",
      effect:
        "Converts one body within 2m to mostly hardware, permanently: +2 plate slots, filled; 4 Hits before Down regardless of Resilience; ELECTRICAL vents it and puts it offline for a minute; and the Forge rebuilds only the meat, so a reclamation returns a fraction.",
      notes: `${CH} Once per body, ever. The Ascendancy's dream and its trap in one ability.`,
      untested: true,
    },
    overcharge: "Conversion brings you back a fraction — and the fraction remembers.",
  },

  // Hematic
  {
    id: "staunch",
    name: "Staunch",
    pillar: "biologics",
    licence: "Hematic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Bleeding stopped, anyone's.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Stops bleeding at range on anyone within 10m: Bleeding ends and the Dying clock is restored to full. It is not a Close — the wound is still open, the blood merely stopped.",
      notes: "No licence anywhere; the Choir issues a debt instead.",
      untested: true,
    },
    overcharge: "Staunch reopens with the next wound: the next Hit they take is Bleeding and the clock halves.",
  },
  {
    id: "draw",
    name: "Draw",
    pillar: "biologics",
    licence: "Hematic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "TOXIC",
    flavor: "Blood taken at range.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Takes blood from one body within 10m: 1 Hit TOXIC that ignores the plate, the target is Bleeding, and you gain 2 pool or 1 charge. Works on the Down and the Dying.",
      notes: "The only spell that pays for itself. The counter is not bleeding.",
      untested: true,
    },
    overcharge: "Draw draws from the caster's own: you take the Hit and the Bleeding.",
  },
  {
    id: "levy",
    name: "Levy",
    pillar: "biologics",
    licence: "Hematic",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    damageType: "TOXIC",
    flavor: "Every open wound in range, which opens none and distinguishes nobody.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      effect:
        "Every open wound within 10m pays — friend, enemy, animal. Each body carrying a Hit takes 1 more Hit TOXIC and is Bleeding, and you gain 1 pool or half a charge per wound counted, up to 8 pool or 4 charges.",
      notes: "Opens no wound of its own. A squad with no Hits on it pays nothing.",
      untested: true,
    },
    overcharge: "Levy counts the caster: your own wounds pay too.",
  },
  {
    id: "transfusion",
    name: "Transfusion",
    pillar: "biologics",
    licence: "Hematic",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    damageType: "TOXIC",
    flavor: "One body's vitality into another. The Choir's loan, made literal.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      effect:
        "Moves one body's vitality into another within 10m. The donor takes 4 Hits TOXIC that ignore the plate and is Bleeding; the receiver closes 4 Hits, ends Bleeding, and stands from Down at Hit.",
      notes: `${CH} The donor need not consent. The Choir counts every cast as a loan.`,
      untested: true,
    },
    overcharge: "Transfusion calls the loan: the vitality moves out of you, and the Choir's ledger opens in your name.",
  },

  // ───────────────────────────── COGNITION ─────────────────────────────

  // Perceptual
  {
    id: "blur",
    name: "Blur",
    pillar: "cognition",
    licence: "Perceptual",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Unmemorable rather than invisible.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      duration: "5 min",
      effect:
        "You are unmemorable for 5 minutes: anyone who sees you cannot describe you afterwards, suspicion from being seen does not tick, and a witness gives no name. Cameras still retain you.",
      notes: "Instruments beat it; the lattice does not blink.",
      untested: true,
    },
    overcharge: "Blur makes you forget yourself for a minute: no casting, no calling, and no name for 60s.",
  },
  {
    id: "static",
    name: "Static",
    pillar: "cognition",
    licence: "Perceptual",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A sense, fuzzed.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "10s",
      effect:
        "Fuzzes one sense of one target within 10m for 10s. Sight: hit chance −30%. Hearing: no calls and no footsteps. Smell: a tracker or animal loses you.",
      untested: true,
    },
    overcharge: "Static closes the sense in you for 10s.",
  },
  {
    id: "jam",
    name: "Jam",
    pillar: "cognition",
    licence: "Perceptual",
    tier: "Certified",
    cast: "Instant",
    castTime: "Instant",
    flavor: "One sense closed for everyone in range.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "15s",
      effect:
        "Closes one sense for everyone within 10m of a point for 15s, friend and enemy alike. Sight: nobody targets, hit chance −60%. Hearing: no calls and no orders. Touch: Coordination checks fail and weapons drop.",
      notes: "Cameras and drones in the volume are unaffected.",
      untested: true,
    },
    overcharge: "Jam takes your squad's sense and leaves the enemy's.",
  },
  {
    id: "erase",
    name: "Erase",
    pillar: "cognition",
    licence: "Perceptual",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "They cannot retain you, and every glance is the first.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "While channelled",
      effect:
        "Nobody within 25m can retain you while you channel: every glance is the first, so nobody targets you twice in a row, no alarm names you, and no order about you survives being given. Firing does not end it; a Hit does.",
      notes: `${CH} You can walk while channelling this one. A camera still retains you.`,
      untested: true,
    },
    overcharge: "Erase means you cannot retain yourself, and every glance in a mirror is the first: for a day you do not know your own face or your own licence.",
  },

  // Technomantic
  {
    id: "ask",
    name: "Ask",
    pillar: "cognition",
    licence: "Technomantic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "One question to a working machine.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "Asks one working machine within 2m one question it can answer from its own record: who opened this door last, where this drone was an hour ago, what this rig's last dose was. It answers in 3s, honestly.",
      notes: "A machine that was never given an order has nothing to say.",
      untested: true,
    },
    overcharge: "Ask asks you: you answer one question aloud, truthfully, to everyone in the room.",
  },
  {
    id: "wake",
    name: "Wake",
    pillar: "cognition",
    licence: "Technomantic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A dead machine answering once.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      effect:
        "A dead machine within 2m answers once: one question, or one action it was built for — a door cycles, a drone reports, a turret fires one round at what you point at. Then it is dead again.",
      notes: "Electrical Jump gives it 30s of power; Wake gives it one answer.",
      untested: true,
    },
    overcharge: "Wake wakes it, displeased: it stays awake for a minute and its first action is against you.",
  },
  {
    id: "handshake",
    name: "Handshake",
    pillar: "cognition",
    licence: "Technomantic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    flavor: "One question about the last person who gave it an order.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Melee",
      effect:
        "One question to a machine within 2m about the last person who gave it an order: their name as it knew them, their face, their licence number, or where they went. Answered in 3s.",
      notes: `${CH} Works on a dead machine too, if you Wake it first.`,
      untested: true,
    },
    overcharge: "Handshake tells you about the last person, and then about everyone: a minute of every order it ever took, and a Composure check to stay standing.",
  },
  {
    id: "testimony",
    name: "Testimony",
    pillar: "cognition",
    licence: "Technomantic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "Everything it has ever been told, in order. It is what NAG gives you if you push, and pushing is the whole scene.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Melee",
      effect:
        "Everything one machine within 2m has ever been told, in order, in 10s: every order, every operator, every location, every date. Admissible to nobody, and all of it true.",
      notes: `${CH} On a machine with something close enough to a mind, it is a conversation, and it may push back.`,
      untested: true,
    },
    overcharge: "Testimony includes what it was told about you, and everybody in the room hears it.",
  },

  // Empathic
  {
    id: "steady",
    name: "Steady",
    pillar: "cognition",
    licence: "Empathic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "The edge, taken off.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "30s",
      effect:
        "Takes the edge off one ally within 10m for 30s: their Composure counts one rung higher, a Composure tick they just took is cancelled, and a break in progress stops.",
      untested: true,
    },
    overcharge: "Steady takes the edge into the caster: you take the Composure tick, and the break they were about to.",
  },
  {
    id: "read",
    name: "Read",
    pillar: "cognition",
    licence: "Empathic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "What a room feels slightly before it feels it.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "15s",
      effect:
        "For 15s you feel what a room within 10m feels slightly before it does: who is about to fire, who is about to run, who is lying, and who is hidden in it — Read feels through Occlusive Dim and Fade.",
      notes: "The counter to Occlusive. An Unregistered offers nothing to feel.",
      untested: true,
    },
    overcharge: "Read cannot be switched off: you feel every room you enter for a day, and every Composure tick in it is yours too.",
  },
  {
    id: "anchor-empathic",
    name: "Anchor",
    pillar: "cognition",
    licence: "Empathic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "A companion's Composure held to yours.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "While channelled",
      effect:
        "Holds one companion's Composure to yours within 10m while you channel: they use your Composure rung, they cannot break while you stand, and a Coercive Halt or Yield on them fails.",
      notes: `${CH} Cannot reach a companion under Occlusive Fade or Shroud.`,
      untested: true,
    },
    overcharge: "Anchor breaks yours instead of holding theirs: you take their break.",
  },
  {
    id: "communion",
    name: "Communion",
    pillar: "cognition",
    licence: "Empathic",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "A squad sharing one nerve — so when one breaks, all of them do.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      duration: "While channelled",
      effect:
        "Your squad within 10m shares one nerve while you channel: everyone uses the highest Composure in the squad, hit chance +10%, and each of you knows what the others see. If one of you breaks, all of you break.",
      notes: `${CH} A squad that has already broken has nothing left to share.`,
      untested: true,
    },
    overcharge: "Communion means the horn breaks all of you at once: one Composure failure anywhere in the squad breaks the whole squad.",
  },

  // Memetic
  {
    id: "suggest",
    name: "Suggest",
    pillar: "cognition",
    licence: "Memetic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A small idea, planted.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "5 min",
      effect:
        "Plants one small idea in one person within 10m: leave the door, check the other street, this is fine. They act on it within 5 minutes if it costs them nothing. Composure at its ceiling resists.",
      untested: true,
    },
    overcharge: "Suggest puts the suggestion in you.",
  },
  {
    id: "forget",
    name: "Forget",
    pillar: "cognition",
    licence: "Memetic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A recent detail, removed.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Removes one recent detail from one person within 10m — the last 60s, a face, a licence number they read. Suspicion from that detail is gone. A Returnee's long memory keeps it.",
      notes: "Written orders beat it: the paper still remembers.",
      untested: true,
    },
    overcharge: "Forget makes you forget the cast: you do not know it was you, and the pool or charge is still spent.",
  },
  {
    id: "seed",
    name: "Seed",
    pillar: "cognition",
    licence: "Memetic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "An idea that arrives with a memory of always having been there.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      duration: "Until contradicted",
      effect:
        "Plants one idea in one person within 10m that arrives with a memory of always having been there: a debt owed, a friend trusted, a door that was always locked. It holds until a written record or a Returnee contradicts it to their face.",
      notes: `${CH} Composure at its ceiling resists.`,
      untested: true,
    },
    overcharge: "Seed seeds the idea in your own memory, and you remember always having believed it.",
  },
  {
    id: "doctrine",
    name: "Doctrine",
    pillar: "cognition",
    licence: "Memetic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "A settlement believing something by morning. The Bureau would pay anything for it.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "1km",
      duration: "Until contradicted",
      effect:
        "A settlement within 1km believes one thing by morning: up to 500 people, one sentence, arriving as common knowledge. Standing with them moves 2 steps in the direction you chose. Written records and Returnees are the only ones who notice.",
      notes: `${CH} Once per day. The Bureau logs every cast it can prove and pays for every one it cannot.`,
      untested: true,
    },
    overcharge: "Doctrine convinces you along with the settlement, by morning.",
  },

  // Coercive
  {
    id: "halt",
    name: "Halt",
    pillar: "cognition",
    licence: "Coercive",
    tier: "Licensed",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "A person stopped mid-step.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "While channelled",
      effect:
        "Stops one person within 10m mid-step while you channel, up to 3s: they cannot move, fire or cast. Composure at its ceiling or an Unregistered's nerve resists.",
      notes: `${CH} Coercive is channelled and short: kill the caster.`,
      untested: true,
    },
    overcharge: "Halt halts you for 3s.",
  },
  {
    id: "yield",
    name: "Yield",
    pillar: "cognition",
    licence: "Coercive",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A hand opened, a weapon lowered.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Opens one hand within 10m: the target drops what it holds or lowers its weapon, and takes 3s to bring it up again. Composure at its ceiling resists.",
      untested: true,
    },
    overcharge: "Yield opens your hand: you drop what you hold.",
  },
  {
    id: "imperative",
    name: "Imperative",
    pillar: "cognition",
    licence: "Coercive",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    flavor: "One instruction obeyed once, and they remember choosing it.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      effect:
        "One instruction, obeyed once, by one person within 10m: open the gate, stand down, walk to the car. One sentence, done within 30s, and they remember choosing it. Composure at its ceiling resists.",
      notes: `${CH} An instruction that would put them Down or Dead fails.`,
      untested: true,
    },
    overcharge: "Imperative makes you obey your own instruction.",
  },
  {
    id: "muster",
    name: "Muster",
    pillar: "cognition",
    licence: "Coercive",
    tier: "Master",
    cast: "Channelled",
    castTime: "While channelled",
    flavor: "A line obeying as though it chose to. Illegal everywhere and denied by everyone who has ever used it.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "25m",
      duration: "While channelled",
      effect:
        "A line obeys you as though it chose to: up to 20 people within 25m follow your orders while you channel — hold, advance, fire, lower arms — and afterwards remember agreeing. Any witness raises your suspicion with every institution at once.",
      notes: `${CH} No licence anywhere, ever. Every officer on the coast has seen it used.`,
      untested: true,
    },
    overcharge: "Muster has the line obey you as if it chose to, and then remember that it did not: every one of them turns on you when the channel ends.",
  },

  // ───────────────────────────── RESONANCE ─────────────────────────────

  // Echoic
  {
    id: "presence",
    name: "Presence",
    pillar: "resonance",
    licence: "Echoic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Whether an Echo is in the Core, and lit.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Any range",
      effect:
        "Tells you in 3s whether one named person's Echo is in the Core, and whether it is lit: so whether they are Dead, being rebuilt, or still walking.",
      notes: "A Containment Muzzle around you or them blocks it. An Unregistered shows nothing.",
      untested: true,
    },
    overcharge: "Presence makes you feel every Echo in the Core, lit or not: a Composure check, or Down for a minute.",
  },
  {
    id: "register",
    name: "Register",
    pillar: "resonance",
    licence: "Echoic",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Which Forges hold you and which hold them.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      effect:
        "Shows you which Forges hold you, and which hold one person within 10m: their nearest reclamation point, and whether they are bound at all. An Unregistered shows nothing; a body under Occlusive Shroud shows nothing.",
      untested: true,
    },
    overcharge: "Register shows you a Forge you never bound at, and it is holding you.",
  },
  {
    id: "echo-read",
    name: "Echo Read",
    pillar: "resonance",
    licence: "Echoic",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "The shape an ending left, inside a register only; outside one, there is only the roar.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "10m",
      effect:
        "Inside a register, reads the shape an ending left in a spot within 10m: how the last person died here, when, from which direction, and by which damage type. Outside a register there is only the roar: a Composure check, and nothing learned.",
      notes: `${CH} A scar that reads as ARCANE reads clearest.`,
      untested: true,
    },
    overcharge: "Echo Read gives the roar: a Composure check at −2, or Down for a minute.",
  },
  {
    id: "call",
    name: "Call",
    pillar: "resonance",
    licence: "Echoic",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    damageType: "ARCANE",
    flavor: "A reclamation beginning from where you stand. The Forge still does the building. You rang the bell.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Any range",
      effect:
        "Begins a reclamation from where you stand: the Forge that holds one Dead person builds them here, at your feet, in 60s, instead of at the Forge. Everything within 3m of the point takes 1 Hit ARCANE as the Veil opens. Once per day.",
      notes: `${CH} The Forge still does the building, and it may be holding somebody it cannot afford to build.`,
      untested: true,
    },
    overcharge: "A failed Call begins somebody else's reclamation: the wrong Echo is built at your feet, and it is somebody nobody wanted back.",
  },

  // Translocative
  {
    id: "fetch",
    name: "Fetch",
    pillar: "resonance",
    licence: "Translocative",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "A thing brought to hand.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      effect:
        "Brings one thing up to 10kg within 25m to your hand in 1s: a dropped rifle, a key, a dose, a grenade off an enemy's belt. A thing somebody is holding needs a Coordination contest first.",
      notes: "Heavy things arrive late: a Weighted or Set thing does not come.",
      untested: true,
    },
    overcharge: "Fetch fetches you: you arrive at the object instead.",
  },
  {
    id: "send",
    name: "Send",
    pillar: "resonance",
    licence: "Translocative",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "The reverse.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "25m",
      effect:
        "Puts one thing up to 10kg from your hand at a point within 25m in 1s: a grenade into a room, a dose to a medic, a key to the locked side. It arrives within 1m of where you looked.",
      notes: "A Containment Seal on the room stops it at the line.",
      untested: true,
    },
    overcharge: "Send sends you away, unspecified: you arrive somewhere within 25m the spell chose, alone.",
  },
  {
    id: "consignment",
    name: "Consignment",
    pillar: "resonance",
    licence: "Translocative",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "An object or a person, where arrival is negotiated with something that does not negotiate.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Any range",
      effect:
        "Sends one object up to 100kg, or one willing person, to a Forge or a point you have stood at, anywhere. Arrival is negotiated with the Veil: 90% on the mark, else within 100m of it and Hit. A person arrives 1 minute after you sent them.",
      notes: `${CH} Skybridge treats it as freight and taxes it accordingly.`,
      untested: true,
    },
    overcharge: "Consignment negotiates and loses: the cargo arrives in the wrong place, or the wrong cargo arrives.",
  },
  {
    id: "crossing",
    name: "Crossing",
    pillar: "resonance",
    licence: "Translocative",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    damageType: "ARCANE",
    flavor: "A whole squad — the Veil's discourtesy at close range.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Any range",
      effect:
        "Your whole squad within 5m of you crosses to a point you have stood at, anywhere, in 10s. Anything standing within 2m of the arrival takes 2 Hits ARCANE from the discourtesy, and everyone who crossed takes a Composure tick. Once per day.",
      notes: `${CH} A Weighted or Set squadmate is left behind.`,
      untested: true,
    },
    overcharge: "Crossing takes the floor, and the room, with you: everything within 5m of where you stood arrives too, walls included, on top of the squad.",
  },

  // Temporal
  {
    id: "steady-the-hand",
    name: "Steady the Hand",
    pillar: "resonance",
    licence: "Temporal",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "Half a second returned.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      effect:
        "Returns half a second: one shot, one step or one word you just made is unmade, and you take it again. It cannot unmake a Hit you took. Once every 10s.",
      notes: "Nothing reliable counters Temporal, which is why the licence is provisional.",
      untested: true,
    },
    overcharge: "Steady the Hand takes the half second from your own future: your next action comes half a second late, and the enemy's first.",
  },
  {
    id: "second-look",
    name: "Second Look",
    pillar: "resonance",
    licence: "Temporal",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    flavor: "The last three seconds again, for you alone.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Self",
      effect:
        "The last 3 seconds again, for you alone: you see once more what happened from where you stood — who fired, from where, what moved, what was said. Nobody else lives it again, and nothing changes.",
      untested: true,
    },
    overcharge: "Second Look loops the 3 seconds again and again: you are Down for a minute, watching.",
  },
  {
    id: "recoil",
    name: "Recoil",
    pillar: "resonance",
    licence: "Temporal",
    tier: "Certified",
    cast: "Channelled",
    castTime: "1.5s channel",
    flavor: "A wound returned to the state it held seconds ago, because the tissue forgets.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Melee",
      effect:
        "Returns one wound within 2m to the state it held 10 seconds ago, because the tissue forgets: a Hit taken in that window is gone, a Break is undone, a Dying clock that started then has not. Anything older than 10s stays.",
      notes: `${CH} A plate lost in the window does not come back; tissue forgets, steel does not.`,
      untested: true,
    },
    overcharge: "Recoil makes you forget along with the tissue: the last 10 seconds are gone from you as well, and so is what you learned in them.",
  },
  {
    id: "rewind",
    name: "Rewind",
    pillar: "resonance",
    licence: "Temporal",
    tier: "Master",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "A room, ten seconds. You remember. They do not.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "10m",
      effect:
        "A room 10m across goes back 10 seconds: every body, wound, round and door in it is where and how it was. You remember; they do not. Anything that entered or left the room in that window is unmoved. Once per day.",
      notes: `${CH} A Returnee in the room remembers too. Never licensed above corruption phase 1.`,
      untested: true,
    },
    overcharge: "Rewind leaves you remembering ten seconds you did not have: the room stays as it is, and your memory of the next ten seconds is already wrong.",
  },

  // Reanimative
  {
    id: "still",
    name: "Still",
    pillar: "resonance",
    licence: "Reanimative",
    tier: "Licensed",
    cast: "Instant",
    castTime: "Instant",
    damageType: "ARCANE",
    flavor: "A moving body, stopped.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "10m",
      duration: "10s",
      effect:
        "Stops one moving dead body within 10m: a Stand ends, a raised body holds still for 10s, a Risen is held for 3s and takes 1 Hit ARCANE. Does nothing to the living.",
      notes: "The Risen are not this class's work, but this is the one thing in it that touches them.",
      untested: true,
    },
    overcharge: "Still stops what you started mid-cast: your own Stand ends and the body drops where it is.",
  },
  {
    id: "stand",
    name: "Stand",
    pillar: "resonance",
    licence: "Reanimative",
    tier: "Licensed",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "A body working a shift.",
    card: {
      kind: "Spell",
      cost: COST.Licensed,
      range: "Melee",
      duration: "8 hours",
      effect:
        "One dead body within 2m works a shift: 8 hours of carrying, digging, holding a door or walking a patrol route at half speed. It cannot fight or speak, and it drops at the shift's end or at 1 Hit.",
      notes: `${CH} A licensed chapter files every Stand; an unfiled one is a charge the Covenant will press.`,
      untested: true,
    },
    overcharge: "Stand has the body work your shift: it takes your post, your orders and your name for 8 hours, and you cannot dismiss it.",
  },
  {
    id: "last-order",
    name: "Last Order",
    pillar: "resonance",
    licence: "Reanimative",
    tier: "Certified",
    cast: "Channelled",
    castTime: "3s channel",
    flavor: "Its final instruction once and correctly, and whoever gave it is usually nearby.",
    card: {
      kind: "Spell",
      cost: COST.Certified,
      range: "Melee",
      effect:
        "A body within 2m carries out its final instruction, once and correctly, within 60s — and says aloud who gave it. Whoever did is usually nearby. The body drops when it is done.",
      notes: `${CH} Burn the body and there is no order left to give.`,
      untested: true,
    },
    overcharge: "Last Order has the nearest body obey your own last order, and it was not addressed to it.",
  },
  {
    id: "witness",
    name: "Witness",
    pillar: "resonance",
    licence: "Reanimative",
    tier: "Master",
    cast: "Channelled",
    castTime: "10s channel",
    flavor: "The dead testify, and the Covenant's lawyers make it admissible.",
    card: {
      kind: "Spell",
      cost: COST.Master,
      range: "Melee",
      duration: "5 min",
      effect:
        "One dead body within 2m testifies for 5 minutes: true answers about what it saw and who did it. With a Covenant chapter present it is admissible: standing with the Covenant +1, and suspicion on the named party with every institution at once. Once per body.",
      notes: `${CH} Without the chapter it is still true; it is just not evidence. Bring lawyers.`,
      untested: true,
    },
    overcharge: "Witness has the dead testify against you, and it is admissible.",
  },
];

export function spellsForLicence(licence: string): Spell[] {
  return spells.filter((s) => s.licence === licence);
}

export function getSpell(id: string): Spell | undefined {
  return spells.find((s) => s.id === id);
}
