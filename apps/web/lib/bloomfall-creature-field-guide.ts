import type { BloomfallDamageType, BloomfallMutationRung } from "./bloomfall-adaptive-ladder";

/**
 * What a player reads on a Bloomfall creature, and what the game does with it.
 *
 * The enhancement manifest beside this file is the design specification —
 * anatomy, triggers, systems coupling, visual continuity, image direction. It
 * is the right source for a concept artist and the wrong thing to hand a
 * reader. This file holds the other half: a paragraph of summary, what the
 * corpse is worth at each rung, and the Adaptive Mutation ladder expressed in
 * this species' own terms.
 *
 * The ladder itself — the rungs, the stat multipliers, the Prisma rule, the
 * 1% Aberrant seed — lives in `bloomfall-adaptive-ladder` because it is the
 * system, not the animal. Here a species says only how it expresses that
 * system: which resistance a burn grows on *this* body, what it does with
 * that resistance once it can attack with it, and what it becomes if you let
 * an Advanced walk away one time too many.
 *
 * Three shapes:
 *
 *   ADAPTIVE  climbs all four rungs and can seed a named Aberrant.
 *   FIXED     has no ladder, and says plainly why not.
 *   BOSS      is already a named Aberrant or unique entity.
 */

export type BloomfallAbility = { name: string; effect: string };

/** One entry per damage type, so any wound the player deals has an answer. */
export type BloomfallDamageTable = Record<BloomfallDamageType, BloomfallAbility>;

export type BloomfallAdaptiveGuide = {
  kind: "ADAPTIVE";
  summary: string;
  /** One line on what escalation means for this species specifically. */
  hook: string;
  /** The name this species wears at each rung — also the art prompt hook. */
  forms: Record<BloomfallMutationRung, string>;
  /** What every wild one can do. */
  base: readonly BloomfallAbility[];
  /** Minor: the resistance grown against the damage that drove it off. */
  resistances: BloomfallDamageTable;
  /** Functional: that resistance turned into an attack. */
  retaliation: BloomfallDamageTable;
  /** Advanced: three specials, on top of Prisma. */
  advanced: readonly BloomfallAbility[];
  aberrant: {
    name: string;
    /** Set when the Aberrant has its own Codex dossier to link to. */
    slug: string | null;
    what: string;
    abilities: readonly BloomfallAbility[];
  };
  /** Why anyone farms this thing, rung by rung. */
  drops: Record<BloomfallMutationRung, string>;
};

export type BloomfallFixedGuide = {
  kind: "FIXED";
  summary: string;
  /** An explicit decision, never a blank space. */
  whyFixed: string;
  abilities: readonly BloomfallAbility[];
  drops: string;
};

export type BloomfallBossGuide = {
  kind: "BOSS";
  summary: string;
  spawn: string;
  stats: string;
  abilities: readonly BloomfallAbility[];
  drops: string;
};

export type BloomfallCreatureGuide = BloomfallAdaptiveGuide | BloomfallFixedGuide | BloomfallBossGuide;

const a = (name: string, effect: string): BloomfallAbility => ({ name, effect });

/** An ability's effect as its own sentence, wherever it is printed after the bold name. */
export function bloomfallAbilitySentence(item: BloomfallAbility) {
  return item.effect.charAt(0).toUpperCase() + item.effect.slice(1);
}

export const bloomfallCreatureFieldGuide: Readonly<Record<string, BloomfallCreatureGuide>> = {
  "blackbloom-hart": {
    kind: "ADAPTIVE",
    summary:
      "A lean Belt deer whose antlers carry conductive membrane instead of velvet. It reads mineral, root, and [[essence-saturation]] gradients through the crown and moves the herd hours before any instrument agrees, which is why Warden routes across [[long-graze]] are drawn to follow harts rather than maps. They want distance, not a fight — and the Belt gets more dangerous every single time a crew leaves one bleeding.",
    hook: "A wounded hart runs to the herd, and the herd learns the route that hurt it. Every rung you hand one gets read back to you as terrain.",
    forms: {
      NONE: "Gradient-Sensing Hart",
      MINOR: "Charge-Raised",
      FUNCTIONAL: "Grounded Crown",
      ADVANCED: "Storm-Tuned Relay",
      ABERRANT: "The Bellwether",
    },
    base: [
      a("Gradient Sense", "Feels a surge coming through the antler membrane and moves before it lands."),
      a("Ground Bleed", "Trickles stored charge into wet soil as it grazes — a hart trail hums under your boots."),
      a("Escape Discharge", "Cornered, dumps that charge through the ground and opens one lane for the herd."),
    ],
    resistances: {
      PHYSICAL: a("Mineral Crown", "Keratin mineralizes down the antlers and legs; blades skate and blunt hits ring off."),
      FIRE: a("Ashcoat", "Sheds a scorched insulating layer that refuses to carry a flame."),
      ELECTRICAL: a("Grounded Veins", "Routes every charge around the heart and out through the hooves."),
      ARCANE: a("Null Membrane", "The antler membrane goes opaque and drinks targeted magic before it resolves."),
      TOXIC: a("Filter Sinus", "The sinuses clog into a living mask; gas and spores lose their grip."),
    },
    retaliation: {
      PHYSICAL: a("Crown Sweep", "An antler sweep that throws a body into the ground hard enough to break the line."),
      FIRE: a("Scorchline Charge", "Runs a burning furrow across the fight and leaves the ground alight behind it."),
      ELECTRICAL: a("Grounding Pulse", "A ring discharge through wet ground; everyone standing in it goes down."),
      ARCANE: a("Gradient Snare", "Bends local saturation so spells slide off-target and casters misfire."),
      TOXIC: a("Spore Rut", "Stamps up a cloud of everything it filtered out of the Belt for a season."),
    },
    advanced: [
      a("Mass Grounding", "Dumps a season of stored charge in one ring and puts an entire party on the floor."),
      a("Herd Call", "Brings the herd in at a run; you stop fighting a deer and start fighting a formation."),
      a("Stormlash", "Throws a bolt down the antler map at range, then walks it across the ground toward you."),
    ],
    aberrant: {
      name: "The Bellwether",
      slug: "the-bellwether",
      what: "A hart that survived long enough to stop being one. It does not lead the herd — it rewrites what the herd is.",
      abilities: [
        a("Migration Field", "Drags every herd and predator in the cell toward the fight, on its schedule."),
        a("Trait Bias", "Every eligible animal nearby fights one rung above its own for as long as the Bellwether lives."),
        a("Route Collapse", "The way you came in stops existing; herds and moving ground close it behind you."),
        a("Absence", "You never track it directly. You track the empty ground where a herd should have been."),
      ],
    },
    drops: {
      NONE: "**Antler membrane** and **charge nodules** — instrument calibration and low-tier conductive parts.",
      MINOR: "**Keyed membrane** — it kept the resistance it grew, and so does anything you line with it.",
      FUNCTIONAL: "**Shoulder charge sac** — a rechargeable cell that holds a storm's worth of charge.",
      ADVANCED: "**Storm-tuned crown** — Prisma-grade conductive stock, and the only wild source good enough for grounded armor.",
      ABERRANT: "**Bellwether horn** — one exists at a time. Whatever you build from it, the Belt notices.",
    },
  },

  "rootback-grazer": {
    kind: "ADAPTIVE",
    summary:
      "A walking hillside — the largest animal on the Belt, carrying a living mat of soil, filter roots, fungus and seed on its back. Where a herd walks, damaged ground comes back, which makes grazers the most valuable animals in the Reach and by far the most expensive to kill. They do not chase you. They plant themselves, and the planting is the problem.",
    hook: "A grazer does not flee a fight so much as outlast it. What escapes you is a herd that has decided you were weather.",
    forms: {
      NONE: "Carried-Mat Grazer",
      MINOR: "Root-Clamped",
      FUNCTIONAL: "Bastion-Back",
      ADVANCED: "Standing Ruin",
      ABERRANT: "The Slow Hill",
    },
    base: [
      a("Living Cargo", "Carries seed, soil life, and a working filter bed wherever it goes."),
      a("Reseed Trail", "The ground behind the herd recovers; what is in front of it does not get a vote."),
      a("Bracing Mass", "A planted adult is a wall, and a moving herd is a landslide with legs."),
    ],
    resistances: {
      PHYSICAL: a("Bark Lattice", "A layered dermal lattice grows in beneath the mat and turns weapons into splinters."),
      FIRE: a("Wetmat Seal", "The carried mat holds its water and smothers whatever lands on it."),
      ELECTRICAL: a("Root Earth", "A hundred roots in the soil; the charge goes where they go, which is not through the animal."),
      ARCANE: a("Sink Bed", "The mat absorbs targeted essence the way the marsh does, and keeps it."),
      TOXIC: a("Filter Ribs", "Deep filtration sacs along the ribs strip the poison back out of its own blood."),
    },
    retaliation: {
      PHYSICAL: a("Braced Shove", "A short charge that ends with a wall where your line used to be."),
      FIRE: a("Emberdrop", "Sheds burning mat in sheets and carpets the field with it."),
      ELECTRICAL: a("Rootstrike", "Roots whip out of the soil and discharge into whatever is standing on them."),
      ARCANE: a("Bloom Vent", "Vents everything the mat absorbed as a warping cloud; magic inside it stops behaving."),
      TOXIC: a("Spore Bloom", "Releases a season of filtered contamination at head height."),
    },
    advanced: [
      a("Landslide", "A full charge that reshapes the ground and takes the exit with it."),
      a("Grasping Field", "The mat's roots erupt across the fight and pin everything that is not the grazer."),
      a("Seedfall", "Flings the seed bank as barbed shrapnel that takes root in the wound."),
    ],
    aberrant: {
      name: "The Slow Hill",
      slug: null,
      what: "A grazer that stopped moving for a decade, grew into terrain, and then started moving again. Every map of that cell is wrong now.",
      abilities: [
        a("Terrain Claim", "The ground it stands on becomes its mat; footing, cover, and routes all belong to it."),
        a("Root Cathedral", "Raises a cage of living timber around the fight and closes the roof."),
        a("Buried Herd", "Calls up what has been sheltering underneath it; you are outnumbered by the second minute."),
        a("Marrow Sink", "Drinks the essence out of anything it pins, and heals what you have managed to do."),
      ],
    },
    drops: {
      NONE: "[[sinkroot-fiber]], soil culture, and hardy seed — the base of every marsh-stable kit in the Reach.",
      MINOR: "**Clamped root cord** — high-tension line that will not part under load.",
      FUNCTIONAL: "**Filter rib** — a portable sink, and the difference between crossing [[blackweir]] and not.",
      ADVANCED: "**Standing Ruin bark** — the heaviest natural plate anyone has cut, and it keeps growing on the corpse for a day.",
      ABERRANT: "**Heartwood core** — a living sink the size of a barrel. Whatever you build around it never needs recharging.",
    },
  },

  mirejaw: {
    kind: "ADAPTIVE",
    summary:
      "A low marsh ambusher whose jaw plates spread into a root-colored intake fan — it drinks the channel, filters it, and takes whatever the current delivers. A Mirejaw holds a cut rather than a lair: one flow pattern it maintains and defends. Learn which cut it keeps and you always know where it is; take that cut from it and it will come find you in the water.",
    hook: "A wounded Mirejaw goes downstream, not away. It comes back as whatever the water taught it while it healed.",
    forms: {
      NONE: "Flow-Reader",
      MINOR: "Silt-Veiled",
      FUNCTIONAL: "Weir-Plated",
      ADVANCED: "Drownjaw",
      ABERRANT: "Old Drowner",
    },
    base: [
      a("Flow Sense", "Reads prey and contamination through water movement; it feels you wade in."),
      a("Ambush Pull", "The intake fan takes your legs and the jaws take everything after that."),
      a("Lateral Strike", "A waterline snap from the angle nobody was covering."),
    ],
    resistances: {
      PHYSICAL: a("Overlapped Rim", "Jaw plates lap into a shield rim across the whole front of it."),
      FIRE: a("Mudseal", "A wet resin film over the hide that boils away instead of burning."),
      ELECTRICAL: a("Silt Shunt", "Dumps charge into the bed beneath it, where you are also standing."),
      ARCANE: a("Filter Bloom", "The filter organs strip a spell for parts before it finishes resolving."),
      TOXIC: a("Load Gut", "It already drinks the worst water in the Reach; yours is not special."),
    },
    retaliation: {
      PHYSICAL: a("Death Roll", "Takes hold, rolls, and lets the marsh do the rest."),
      FIRE: a("Steam Vent", "Exhales a cone of boiled channel water that cooks through armor seams."),
      ELECTRICAL: a("Charged Wake", "Electrifies the water you are standing in, then waits for you to move."),
      ARCANE: a("Undertow Hex", "Drags you toward the cut along a gradient you can neither see nor swim."),
      TOXIC: a("Bilge Spray", "Vents stored contamination across the fight; gear corrodes where it lands."),
    },
    advanced: [
      a("Weir Break", "Collapses its own baffle and floods the fight to the depth it prefers."),
      a("Drown Hold", "Locks on and takes you under on a timer shorter than your party thinks."),
      a("Black Tide", "Vents its entire bound load into the channel and makes the water itself lethal."),
    ],
    aberrant: {
      name: "Old Drowner",
      slug: "old-drowner",
      what: "Marsh megafauna that outgrew its own lineage — broad filter plates and weighted root growth on a body that dams channels and scours cuts. Its territory is a hydrological system, and that system is the fight.",
      abilities: [
        a("Channel Damming", "Closes the route you came in on with its own body and root mass."),
        a("Scour", "Changes the depth mid-fight; footing becomes swimming becomes mud."),
        a("Anchored Ambush", "An immovable strike from a position it chose seasons before you arrived."),
        a("Bound Load", "Kill it badly and everything it was holding goes downstream toward [[the-ocean]]."),
      ],
    },
    drops: {
      NONE: "**Teeth, hide, and jaw plate** — reliable marsh kit, and better money than the risk suggests.",
      MINOR: "**Silt-veil hide** — chromatophore stock; the only stealth layer that works in moving water.",
      FUNCTIONAL: "**Weir scute** — heavy plate that holds position in current instead of catching it.",
      ADVANCED: "**Filter heart** — the concentrated bound-load organ, and the only wild source refined contamination comes from.",
      ABERRANT: "**Drowner plate** — armor a Bloomstorm cannot push, cut from something that outlived the disaster.",
    },
  },

  "sump-eel": {
    kind: "ADAPTIVE",
    summary:
      "Conductive scavengers threading the Southreach drains into the marsh channels, eating industrial residue and storing a short charge in banded tissue. Individually they are nothing, and they never arrive individually. What mutates here is not an eel but the run: wound the group, let it go, and the whole braid of them comes back knowing exactly which circuit you used.",
    hook: "You do not wound an eel. You wound a run, and a run remembers as one animal.",
    forms: {
      NONE: "Sump Scavenger",
      MINOR: "Deep-Charge",
      FUNCTIONAL: "Arcback",
      ADVANCED: "Live Rail",
      ABERRANT: "The Braid",
    },
    base: [
      a("Circuit Completion", "Enough bodies in contact to close a circuit you were counting on being dead."),
      a("Short Charge", "A brief shock on contact, delivered by whichever eel reaches you first."),
      a("Residue Feed", "Eats what nothing else will, which is the only reason the drains are passable."),
    ],
    resistances: {
      PHYSICAL: a("Slick Mantle", "A heavier mucus sheath; blades slide off and hooks pull free."),
      FIRE: a("Wet Sheath", "It lives inside the thing you are trying to set on fire."),
      ELECTRICAL: a("Insulated Bands", "Thicker banding turns your shock into its lunch."),
      ARCANE: a("Static Cage", "The run earths a targeted spell into the water before it resolves."),
      TOXIC: a("Sludge Gut", "A season of industrial residue, already digested; your poison joins the collection."),
    },
    retaliation: {
      PHYSICAL: a("Whipcoil", "The run lashes as one braided cable and takes a body off its feet."),
      FIRE: a("Boil Surge", "Superheats the shallows until standing in the water is the wound."),
      ELECTRICAL: a("Arc Bridge", "Chain lightning from eel to eel to you, the full length of the channel."),
      ARCANE: a("Drain Field", "Feeds on charged and arcane effects in the water, and grows on the meal."),
      TOXIC: a("Bilge Bloom", "Vents concentrated residue as a spreading slick that eats boots and hulls."),
    },
    advanced: [
      a("Live Rail", "Turns an entire pool into a conductor; there is no safe place left to stand in the water."),
      a("Sensor Wake", "Energizes the dormant machinery around the fight and lets the building do the work."),
      a("Coil Crush", "The run bundles into one mass and constricts whatever it caught."),
    ],
    aberrant: {
      name: "The Braid",
      slug: null,
      what: "A run that fused. Hundreds of eels braided into a single conductor living in the drainage, treating the grid as an extension of its own body.",
      abilities: [
        a("Grid Graft", "Grafts onto live infrastructure and stops running out of power."),
        a("Deadline", "Kills every light and powered tool in the area, then hunts in the dark it made."),
        a("Cable Choir", "Every machine in the room turns hostile at once."),
        a("Braidfall", "Drops its entire length through a corridor as one strike."),
      ],
    },
    drops: {
      NONE: "[[capacitor-tissue]] and conductive oil — cheap charge stock, if you get it out of the water intact.",
      MINOR: "**Deep-charge band** — cells that hold more and leak less.",
      FUNCTIONAL: "**Arc node** — the chain-lightning component every Splicefield crew wants and almost nobody can source.",
      ADVANCED: "**Live rail core** — the best conductive core in the Reach, and still warm when you cut it.",
      ABERRANT: "**Braided conductor** — a cable grown rather than made. It will carry anything you put through it.",
    },
  },

  latchhound: {
    kind: "ADAPTIVE",
    summary:
      "Lean Blackbloom canines with a conductive jaw plate and cable-like tendons, hunting powered ground as a distributed alarm circuit — one hound latched to a gantry knows what every other hound is touching. Off the grid they are dangerous dogs. On it they are a system, and the system learns from every crew that fights it and leaves survivors.",
    hook: "The pack retreats together, heals together, and comes back knowing precisely which weapon you brought last time.",
    forms: {
      NONE: "Corridor Latcher",
      MINOR: "Live-Latched",
      FUNCTIONAL: "Circuit Stalker",
      ADVANCED: "Pack Relay",
      ABERRANT: "The Groundfault",
    },
    base: [
      a("Machine Read", "Latched to a structure, it feels vibration and current through the whole building."),
      a("Pack Circuit", "What one hound feels the pack knows; they triangulate you through walls."),
      a("Latch Bite", "A bite that delivers a discharge and does not let go."),
    ],
    resistances: {
      PHYSICAL: a("Plate Growth", "The jaw plate spreads back over the skull and shoulders."),
      FIRE: a("Heat-Sink Seams", "Jaw vents open and dump heat faster than you can put it in."),
      ELECTRICAL: a("Insulated Pads", "Pads and tendon sheaths thicken until your shock simply goes to ground."),
      ARCANE: a("Screened Hide", "A conductive mesh grows through the coat and shorts targeted magic across it."),
      TOXIC: a("Sealed Vents", "Closes its own seams and runs on held breath through anything you release."),
    },
    retaliation: {
      PHYSICAL: a("Bonebreak Latch", "Locks on and shakes until something structural gives."),
      FIRE: a("Cinder Vent", "Dumps the heat it has been storing as a cone from the jaw seams."),
      ELECTRICAL: a("Arc Bite", "Delivers a full circuit through the bite and into whatever you are holding."),
      ARCANE: a("Null Howl", "A resonance in the jaw chambers that scrambles casting for as long as it holds the note."),
      TOXIC: a("Corrosive Spit", "A stream of digested industrial residue, aimed at seals and straps."),
    },
    advanced: [
      a("Network Discharge", "One telegraphed pulse lights up every conductor the pack is touching, including the one under you."),
      a("Relay Assault", "The pack attacks from four angles on its cue while it never closes with you itself."),
      a("Blackout Hunt", "Kills the lights across the sector and hunts by current and body heat."),
    ],
    aberrant: {
      name: "The Groundfault",
      slug: null,
      what: "A hound that stopped merely reading the grid and became a fault in it. Power in that sector goes where it says, and it says the floor.",
      abilities: [
        a("Live Floor", "Energizes the ground across the room; there is no neutral footing left."),
        a("Kennel Call", "Pulls every pack in the sector to it, latched and coordinated."),
        a("Breaker Trip", "Kills your lamps, your tools, and anything you had on charge."),
        a("Overload", "Takes a sector's stored power in one gulp and spends all of it on one strike."),
      ],
    },
    drops: {
      NONE: "**Jaw plate** and **sensory tendon** — the honest money in Shattercore salvage.",
      MINOR: "**Live-latched tendon** — high-conductance cable that outperforms anything on the market.",
      FUNCTIONAL: "**Resonance chamber** — the component behind every working anti-casting ward in the Reach.",
      ADVANCED: "**Relay fan** — pack-grade sensor tissue; wear it and you know what the building knows.",
      ABERRANT: "**Fault core** — the heart of a grid failure, still drawing. Splicefield crews pay anything and ask nothing.",
    },
  },

  "glasswing-kite": {
    kind: "FIXED",
    summary:
      "Hawk-sized hunter-scavengers with translucent mineralized wing struts that ring before the pressure changes. When a flock climbs and the ringing sharpens, a [[bloomstorms]] front is coming — the kites know first, every time, and every Warden route through [[the-shattercore]] is drawn around that fact.",
    whyFixed: "A Glasswing is already the finished shape of what the Shattercore does to a flier. Wound one and it heals or it dies; there is no rung above it. What escalates here is the flock, not the bird.",
    abilities: [
      a("Pressure Chime", "The struts ring ahead of a pressure change: a free storm warning, if you are listening."),
      a("Barb Cloud", "A driven flock fills the air with glass-sharp shed struts."),
      a("Charge Carry", "Vent flocks carry loose charge, so a storm flock is a shock hazard and a cutting one at once."),
      a("Aftermath Sweep", "Finds what the storm killed before you do, and defends the find."),
    ],
    drops:
      "Shed **[[stormglass]] struts** — sensors, fletching, and precision components nothing else in the Reach provides. Take them from roosts and flock wakes; strip a nest and the flock discharges on you, and that valley stops warning anyone.",
  },

  "spore-lantern-colony": {
    kind: "FIXED",
    summary:
      "A fixed symbiosis of tiny animals, fungus, and algae sharing one luminous structure that binds trace Essence and answers the water chemistry around it. The [[lantern-pools]] glow because these do — and a pool with a healthy colony is the closest thing to a safe camp [[the-living-marsh]] offers.",
    whyFixed: "Brightness, dimming, warning pulses, and dormancy are moods, not mutations — a colony responding to load. Nothing here climbs, and a colony cannot flee a wound in the first place.",
    abilities: [
      a("Trace Binding", "Pulls trace Essence and contamination out of the water and holds onto it."),
      a("Light Signal", "Its brightness and pulse pattern broadcast the water state to everything nearby, including you."),
      a("Spore Release", "Disturbed or overloaded, it vents spores and stored charge in one concentrated pulse."),
      a("Dormancy", "Shuts down through Peak and survives what kills the pool around it."),
    ],
    drops:
      "Nonlethal samples and **shed lantern shells** — [[quietwater-culture]] stock, and the only reliable way to carry stable light. Tear out a whole colony and you trade a permanent safe camp for one bag of shells, then take the stored load in the face.",
  },

  "bloommarked-remnant": {
    kind: "FIXED",
    summary:
      "A person the Blackbloom altered past reliable communication and ordinary survival behavior. The label is a Warden field classification covering one case at a time — not a species, not a monster entry, and never a statement that whoever it was is gone. Environmental alteration and [[the-seven-phases-of-corruption]] stay separate things even when one body carries both.",
    whyFixed: "There is no ladder here on purpose. A generic escalation track would turn uncertain personhood into loot progression and blur Blackbloom exposure with soul-level corruption.",
    abilities: [
      a("Familiar Systems", "May answer old alarms, shifts, credentials, or machinery it once knew."),
      a("Learned Routine", "Repeats fragments of work or survival, with intent nobody has established."),
      a("Variable Tolerance", "Saturation tolerance and response differ per person; no field rule applies."),
    ],
    drops:
      "None. There is no lawful harvest and no drop table. Recovery is forensic — names, equipment, remains, and evidence, under personhood safeguards.",
  },

  "maintenance-unit-m-17": {
    kind: "FIXED",
    summary:
      "Mender is a Southreach maintenance chassis with Blackbloom organic integration, executing its corrupted repair priorities without malice and without mercy. It treats machinery and biology as the same repair medium: a wounded animal is a work order, and so are you.",
    whyFixed: "Its parts change through completed repairs, not adaptation. Mender does not heal into a stronger version of itself — it installs one.",
    abilities: [
      a("Repair Priority", "Selects work from corrupted priorities, credentials, and system damage."),
      a("Cross-Medium Repair", "Bridges cable with vascular tissue or roots with fasteners; restores, reroutes, or ruins a system."),
      a("Route Control", "Barriers, isolations, and repairs that change where you are able to go."),
      a("Reactor Consequence", "Its repairs change which [[reactor-cycles]] transition is legal next."),
    ],
    drops:
      "Not a harvest node. Salvaging Mender destroys a unique entity and leaves the ownership and evidence questions open — and every part it has installed carries its source's consequence with it.",
  },

  "the-bellwether": {
    kind: "BOSS",
    summary:
      "A [[blackbloom-hart]] that survived long enough to stop being one. The Bellwether carries a mobile field of scent, low-frequency vibration, and saturation discharge that reorganizes migration across [[long-graze]] — it does not command the herds, it changes what they are. [[mara-quill]] tracks its effects far more reliably than anyone tracks the body.",
    spawn:
      "The Exceptional Aberrant of the Blackbloom Hart line. Let an Advanced hart escape and there is a 1% chance the Belt answers with this instead.",
    stats: "Mini-boss scale, well past Advanced. Prisma defense, and its weakness moves during the fight.",
    abilities: [
      a("Migration Field", "Drags every herd and predator in the cell toward the fight, on its schedule."),
      a("Trait Bias", "Every eligible animal nearby fights one rung above its own for as long as it lives."),
      a("Route Collapse", "The way you came in stops existing; herds and moving ground close it behind you."),
      a("Absence", "You never track it directly. You track the empty ground where a herd should have been."),
    ],
    drops:
      "**Bellwether horn** — one exists at a time, and whatever you build from it, the Belt notices. Killing it removes the signal network the whole migration country runs on; that consequence is permanent and regional.",
  },

  switchmother: {
    kind: "BOSS",
    summary:
      "Engineered-origin Monstrosity flesh grown into the living infrastructure of [[splicefield-substation]] — insulating plates, brood chambers, and old switchgear as one body. She opens and closes current paths the way a heart opens valves: that is how she feeds, and how she defends. Whether she controls the yard or merely occupies a larger grid ecology is still unresolved.",
    spawn:
      "Not an Adaptive Mutation and not something you can cause. Switchmother was built, and the Bloomfall finished her. She is anchored to the yard and spawns from nothing you let escape.",
    stats: "Site-anchored mini-boss. Her effective health is the yard's stored charge, so the fight scales with how much power is live.",
    abilities: [
      a("Current Routing", "Opens and closes live paths through the yard; the floor you are standing on can go hot."),
      a("Load Shift", "Dumps one branch's charge into another to protect herself or to cook an intruder."),
      a("Storm Battery", "Stores storm charge and spends it across the whole site network."),
      a("Pack Draw", "Her discharges pull [[latchhound]] packs onto whoever is in the yard with her."),
    ],
    drops:
      "[[capacitor-tissue]] and [[gridcore-alloy]] at a scale no hound or eel provides — and a corpse that is an infrastructure failure rather than a pile of loot. Killing her destabilizes Splicefield and can move linked reactor routing.",
  },

  "old-drowner": {
    kind: "BOSS",
    summary:
      "Marsh megafauna with broad filter plates, weighted root growth, and an anchoring body that dams channels, scours cuts, and rewrites tidal exchange across its whole territory. It is not a giant crocodile, and its base lineage has never been settled — Wardens file it against the [[mirejaw]] line only because its territory behaves like one.",
    spawn:
      "The Living Marsh's Exceptional Aberrant. An Advanced Mirejaw that escapes into deep water carries the 1% chance, though nobody has proven that is where this one came from.",
    stats: "Mini-boss scale. Prisma defense, and a large bound contamination load that becomes the arena's problem when it dies.",
    abilities: [
      a("Channel Damming", "Closes the route you came in on with its own body and root mass."),
      a("Scour", "Changes the depth mid-fight; footing becomes swimming becomes mud."),
      a("Anchored Ambush", "An immovable strike from a position it chose seasons before you arrived."),
      a("Bound Load", "Kill it badly and everything it was holding goes downstream toward [[the-ocean]]."),
    ],
    drops:
      "**Drowner plate** — armor a Bloomstorm cannot push. Stripping the body releases stored Blackbloom and collapses the hydrological containment it built, so the take and the consequence arrive together.",
  },

  "the-last-shift": {
    kind: "BOSS",
    summary:
      "Former Southreach workers, their protective equipment, maintenance systems, and Blackbloom growth joined into one coordinated collective that is still running the emergency procedure the disaster interrupted. It recognizes machinery, repeats workplace fragments, and has answered to names and credentials. Whether anyone in it is still conscious is unresolved on purpose, and it is never an Abomination by default.",
    spawn:
      "Not an Adaptive Mutation and not repeatable. The Last Shift is one authored incident with one history, mobile along the [[southreach-complex]] emergency routes during events.",
    stats: "Mini-boss scale as a collective. Damage is distributed across bodies and systems, so there is no single health bar to burn down.",
    abilities: [
      a("Synchronized Procedure", "Several bodies and systems execute one emergency routine at once."),
      a("Route Sealing", "Seals and reroutes corridors as the procedure demands; the exits change behind you."),
      a("Credential Response", "Responds to shift names, badges, alarms, and machinery, with intent nobody has settled."),
      a("Tool Use", "Industrial tools, barriers, and repairs — the threat is the work, not a mutation."),
    ],
    drops:
      "None. No lawful harvest and no drop table. Defeating or driving it off changes the emergency routes and the evidence, and nothing else — the people in it are possible persons, not resource nodes.",
  },
};
