import type { BloomfallCreatureEnhancement } from "./bloomfall-creature-enhancements";

/**
 * The reader's copy for every Bloomfall creature and entity dossier.
 *
 * The enhancement manifest beside this file is the design specification: it
 * says what each mutation state is anatomically, which systems trigger it, and
 * what an image of it must keep. That is the right source for a concept
 * artist and for the simulation, and the wrong thing to hand a reader. The
 * field guide is what the dossier body actually prints — the specimen, the
 * mutations by name with the abilities each one grants, how to counter them,
 * and why anyone would hunt the animal at all — written for a player to read
 * once and remember. Every state here is keyed to its manifest state, and the
 * test suite refuses a guide that names a state the manifest does not have.
 */

export type BloomfallAbility = { name: string; effect: string };

export type BloomfallStateGuide = {
  /** What you are looking at — one or two sentences, no anatomy lecture. */
  read: string;
  /** What this state can do that the one below it cannot. */
  abilities: readonly BloomfallAbility[];
  /** How a party beats it, or why it is not a fight. */
  counter: string;
  /** How an animal reaches this state and whether it stays there. */
  unlock: string;
};

export type BloomfallHuntGuide = {
  /** The reason to engage at all. */
  why: string;
  /** What comes off the animal and how. */
  take: string;
  /** What killing or stripping it costs the region. */
  cost: string;
  /** The promoted-threat rule, when the species has one. */
  named: string | null;
};

export type BloomfallCreatureGuide = {
  specimen: readonly string[];
  where: string;
  role: string;
  company: string;
  storm: string;
  /** The ladder in one breath: how many states, how it climbs, where it stops. */
  ladder: string;
  states: Readonly<Record<string, BloomfallStateGuide>>;
  hunt: BloomfallHuntGuide;
};

const ability = (name: string, effect: string): BloomfallAbility => ({ name, effect });

/** An ability's effect as its own sentence, wherever it is printed after the bold name. */
export function bloomfallAbilitySentence(item: BloomfallAbility) {
  return item.effect.charAt(0).toUpperCase() + item.effect.slice(1);
}

export const bloomfallCreatureFieldGuide: Readonly<Record<BloomfallCreatureEnhancement["slug"], BloomfallCreatureGuide>> = {
  "blackbloom-hart": {
    specimen: [
      "A lean Belt deer that reads the storm before you do. Dark conductive membranes stretched inside its antlers pick up mineral, root, and saturation gradients, so a herd changes its route hours before any instrument agrees. Follow the harts and you are reading a live forecast of [[essence-saturation]].",
      "They want distance, not a fight. Corner one on wet ground and the whole herd answers with spacing, stamping, and synchronized discharge. Rising saturation does not make a hart aggressive; it makes it leave, and where it goes is the point.",
    ],
    where: "[[long-graze]] and [[the-mutation-belt]]; the Shattercore fringe during a mineral migration.",
    role: "Grazes Belt grass, mineral browse, and the root lines Rootback Grazers tear open. Herd routes spread seed and mark pressure gradients — the cheapest saturation map in the Reach.",
    company: "Follows [[rootback-grazer]] browse lines and is hunted by [[latchhound]] packs that read the same migrations. [[the-bellwether]] bends herd routes and trait expression across Long Graze — it amplifies harts, it does not command them.",
    storm: "Warns, then migrates before Onset. Caught in the open, the herd grounds its stored charge together.",
    ladder: "Four states. Every hart starts as a Gradient-Sensing Hart. A storm can push it into Charge-Raised for a while; repeated Surge exposure hardens it into a Grounded Crown; a rare few that survive the storm edge again and again become a Storm-Tuned Relay.",
    states: {
      "baseline-gradient-hart": {
        read: "The baseline: lean deer, branching antlers, folded dark membranes, small charge nodules at the neck and shoulders.",
        abilities: [
          ability("Gradient Sense", "feels mineral, root, and saturation shifts through the antlers; the herd moves before a surge lands."),
          ability("Ground Bleed", "trickles stored charge into wet soil while it grazes — the reason a hart trail hums."),
          ability("Escape Discharge", "cornered, dumps its charge through wet ground to open a short escape lane for the herd."),
        ],
        counter: "It runs. Cut it off from wet ground and open space and it has nothing left.",
        unlock: "Every hart. Normal Belt life at Residual or Active pressure.",
      },
      "charge-raised": {
        read: "Membranes swell and lift, vessels darken around the eyes and ears, the coat stands up along the spine, and the nodules show through the hide.",
        abilities: [
          ability("Pressure Read", "short-range saturation sensing sharpens; the herd knows exactly where the surge boundary is."),
          ability("Quick Ground", "faster reactions and a harder, shorter ground discharge."),
          ability("Storm Line", "the herd compresses into a warning formation, stamps conductive ground, and picks escape routes over feeding."),
        ],
        counter: "It is a warning state, not a weapon. No new anatomy, no lasting buff — it fades once the charge is grounded.",
        unlock: "Sustained high Active pressure, a nearby Surge boundary, or a Bloomstorm Warning. Regresses when the pressure drops.",
      },
      "grounded-crown": {
        read: "Antler tips and lower legs harden into mineralized keratin, insulating bands grow around the neck, and the split hooves broaden for grip on charged ground.",
        abilities: [
          ability("Charge Routing", "electrical damage is routed around the heart — strong resistance to shock and charged terrain."),
          ability("Braced Shove", "a knock-aside from a planted stance that holds its ground."),
          ability("Grounding Pulse", "one directed discharge that drops anything standing on wet ground nearby, followed by a clear recovery window."),
          ability("Crossing Guard", "takes the exposed position on charged ground and makes safe intervals for calves to cross."),
        ],
        counter: "Wait out the pulse — in recovery it is slow to re-ground. Or fight it from dry ground, where the pulse means nothing.",
        unlock: "Repeated Surge exposure in Long Graze or a conductive Belt corridor. The keratin sheds slowly; it never reverts mid-encounter. A promoted survivor with an electrical stress imprint can reach it.",
      },
      "storm-tuned-relay": {
        read: "Membranes broaden across the whole antler map, paired charge sacs sink in behind the shoulders, and an insulated route runs unbroken from neck to foreleg.",
        abilities: [
          ability("Herd Relay", "reads saturation direction across the whole herd and spaces the animals by vibration and scent; the herd moves as one."),
          ability("Feint Coordination", "the herd feints on its cue — you are fighting the formation, not the deer."),
          ability("Mass Grounding", "one powerful area grounding event that can put a whole party down on wet ground."),
          ability("Storm Runner", "guides a herd through Decay or straight down an Aftermath mineral line."),
        ],
        counter: "After Mass Grounding it is depleted and the sacs need time to refill. Separate it from the herd and its relay is worth nothing. It is not a Bellwether: it cannot rewrite other species.",
        unlock: "Prolonged Surge or Bloomstorm-edge survival on the same pressured route, in an advanced-eligible population. Permanent for that animal, and never guaranteed by a high-band spawn.",
      },
    },
    hunt: {
      why: "Antler membrane and charge nodules are the best instrument and alchemy stock in the Belt — every Warden field instrument is calibrated on hart membrane.",
      take: "Shed membrane and nodules are a clean, regenerating take. Kill for the fresh crown only when you need it.",
      cost: "Every breeding or relay adult you kill blinds the migration forecast: routes get riskier, herds go quiet, and the next Bloomstorm arrives with no warning. Saturation itself does not move.",
      named: "A hart in Grounded Crown or Storm-Tuned Relay that survives your encounter and escapes can be promoted. The Wardens give it a field epithet from its scar, its route, or its herd's behavior, and it keeps its state and scars across sessions. Kill it and it stays dead.",
    },
  },
  "rootback-grazer": {
    specimen: [
      "A walking hillside. Rootback Grazers are the biggest living things on the Belt — broad-backed herd beasts carrying a mat of living soil, filter roots, fungus, insects, and seed on their backs. The animal and its mat are one organism for every purpose that matters: where a herd walks, damaged ground grows back.",
      "They are not mounts and they are not prey you take lightly. A grazer is slow, deliberate, and nearly impossible to move once it decides to stand. The danger is mass: a herd that stampedes, or plants itself around its calves, flattens anything in the line.",
    ],
    where: "[[the-mutation-belt]], [[long-graze]], and the ground around [[walking-orchard]].",
    role: "Crops dense growth, mineral soil, fungal mats, and woody browse. Trampling and dropped soil leave germination ground behind the herd — a mobile reseeding and filtration service.",
    company: "[[blackbloom-hart]] herds follow the browse lines it opens. Predators go for separated calves, never a healthy adult. [[the-bellwether]] can bend a herd's route but never its carried ecology.",
    storm: "Anchors in place or migrates before Peak, depending on warning time. It shelters its mat; it does not hunt.",
    ladder: "Three states. Carried-Mat Grazer is every adult. A storm or ruined ground clamps it into Root-Clamped until the pressure passes; a grazer that keeps working damaged Belt ground through repeated Surges grows into a Bastion-Back. It stops there — this species never turns predator, and it is not in the promoted-threat system.",
    states: {
      "carried-mat": {
        read: "The baseline: a massive quadruped on deep load-bearing legs, an established soil-and-root mat riding its back.",
        abilities: [
          ability("Living Cargo", "carries seed, soil life, and a modest filter capacity wherever it walks."),
          ability("Reseed Trail", "dropped soil and trampled browse become germination ground behind the herd."),
          ability("Bracing Mass", "a planted adult is a wall; a moving herd is a stampede."),
        ],
        counter: "It does not chase. Stay out of the line, and never get between a calf and its mother.",
        unlock: "Every adult. Normal Belt ecology; tolerates Active pressure and walks away from sustained Surge.",
      },
      "root-clamped": {
        read: "The carried roots cinch around the flanks, a resin film seals the hide, and the animal drops its center of mass while roots probe into the ground.",
        abilities: [
          ability("Root Anchor", "very high stagger resistance; it will not be moved."),
          ability("Mat Seal", "the carried mat stays intact through wind and contaminated surface flow, and briefly binds what flows past."),
          ability("Windward Wall", "the herd forms a wall around its calves and holds it until the ground itself fails."),
        ],
        counter: "Its mobility is gone. The head and underside stay exposed, and a clamped herd cannot leave if the ground does fail.",
        unlock: "Surge onset, damaged filtration ground, or a Bloomstorm Warning with no safe path out. Relaxes when the pressure and wind drop.",
      },
      "bastion-back": {
        read: "A layered, barklike lattice grows in under the mat, the hooves spread for unstable ground, and deeper filtration sacs line the ribs.",
        abilities: [
          ability("Bark Lattice", "heavy frontal and upper defense along the back and flanks."),
          ability("Braced Shove", "a slow, planted push that moves rock and people alike."),
          ability("Ground Mending", "pauses on damaged ground to seed and absorb it — the herd's stabilizer."),
          ability("Aftermath Hold", "holds an Aftermath crossing open long enough for the herd to pass."),
        ],
        counter: "It turns slowly, and the filtration sacs along the ribs are soft. Flank it.",
        unlock: "Repeated high Active or Surge exposure while supporting damaged Belt ecology. Structural for the rest of its life.",
      },
    },
    hunt: {
      why: "[[sinkroot-fiber]], soil culture, and hardy seed — the base of half the marsh-stable gear in the Reach and of every expedition's own filtration.",
      take: "Shed mats and dropped fiber are a regenerating take; a herd sheds constantly. Cutting the living mat is a real harvest — you are taking years of function off one animal's back.",
      cost: "Kill a grazer and you erase a mobile sink and a reseeding route in one shot. The herd displaces, the ground it was mending stays broken, and the harts that followed its browse lines scatter. Saturation does not spike; the countryside stops healing.",
      named: null,
    },
  },
  "glasswing-kite": {
    specimen: [
      "A small predator that rings like glass. Glasswing Kites are hawk-sized hunter-scavengers with translucent mineralized wing struts that flex and chime before the air pressure changes. When a flock climbs and the ringing sharpens, a Bloomstorm is coming — the kites know first, every time.",
      "Their form is fixed. Exposure can injure or malform an individual, but there is no mutation ladder here: a Glasswing is already the finished shape of what the Shattercore does to a flier. One kite is a nuisance. A storm-driven flock is a cloud of cutting barbs and loose charge.",
    ],
    where: "[[the-shattercore]], [[crown-break]], and the northern [[the-mutation-belt]].",
    role: "Takes insects, small carrion, and exposed charge tissue around vents and storm aftermaths, carrying nutrients between Shattercore roosts and Belt feeding ground.",
    company: "Flocks follow vent ecology and big carcasses — including the ones you leave. A rare authored Aberrant can shepherd a flock; no ordinary kite is ever promoted.",
    storm: "Warns before Onset, climbs or slides downwind away from Peak, and feeds hard in the Aftermath.",
    ladder: "No ladder. One canonical form. Read the flock, not the bird.",
    states: {
      "fixed-glasswing": {
        read: "A light predatory body on long translucent struts — an aerodynamic silhouette built to catch vent lift.",
        abilities: [
          ability("Pressure Chime", "the struts ring and flex before the pressure changes: a free Bloomstorm warning, if you listen."),
          ability("Barb Cloud", "a driven flock fills the air with glass-sharp shed struts and cuts anything moving through it."),
          ability("Charge Carry", "flocks around vents carry loose charge; a storm flock is a shock hazard as well as a cutting one."),
          ability("Aftermath Sweep", "feeds on exposed charge tissue and carrion after a storm — it finds what the storm killed before you do."),
        ],
        counter: "Alone it is fragile and fast, so it leaves. Break a flock's cover and it scatters; fight it in open air beside a vent and it has everything.",
        unlock: "Regional development, not runtime mutation. Every kite is born this.",
      },
    },
    hunt: {
      why: "Shed [[stormglass]] struts are precision stock — sensors, fletching, and instrument components nothing else in the Reach provides.",
      take: "Shed struts from roosts and from the wake of a flock. You do not need a corpse.",
      cost: "Strip a nest and the flock discharges on you, then the roost goes quiet — and a quiet roost is a warning system you just switched off. Carcasses leave contaminated barbs that pull in scavengers.",
      named: null,
    },
  },
  mirejaw: {
    specimen: [
      "The marsh ambush predator. A Mirejaw is a low, heavy amphibian whose jaw plates spread into a root-colored intake fan; it pulls water, prey, and contamination across its filter tissue before it strikes. If a channel looks like it is breathing, something is filtering it.",
      "It does not keep a lair. It keeps a cut — one flow pattern through the marsh that it maintains and defends. Learn which cut a Mirejaw holds and you know where it will be, and where its water is going.",
    ],
    where: "[[the-living-marsh]], [[blackweir]], and [[drowned-intake]]; the [[reedless-mile]] channels when the water allows.",
    role: "Fish, Sump Eels, wading animals, carrion, and anything forced through a defended channel. It filters while it feeds, pulling some contaminated biomass out of the water.",
    company: "Dominant Mirejaws suppress the smaller ambushers. [[old-drowner]] can erase or move a territory by changing the depth. Remove a Mirejaw and its cut opens to scavengers and juveniles.",
    storm: "Drops below the root shelves through Warning and Onset; hunts displaced prey once Decay begins.",
    ladder: "Three states. Flow-Reader is every adult. Bad water folds it into Silt-Veiled until the channel settles; repeated Surge in a damaged cut hardens it into Weir-Plated. A Weir-Plated Mirejaw that survives you and slips away through connected water can come back with a name.",
    states: {
      "flow-reader": {
        read: "A low marsh predator: intake-fan jaw plates, root-toned hide, four strong amphibious limbs, a thick anchoring tail.",
        abilities: [
          ability("Flow Sense", "reads prey and contamination through water movement — it feels you wade in."),
          ability("Ambush Pull", "the intake fan drags a target off its feet and toward the jaws."),
          ability("Lateral Strike", "a fast sideways bite from the waterline."),
        ],
        counter: "Get it out of the water and away from cover. On open ground it has no pull and no ambush.",
        unlock: "Every adult. Normal Living Marsh ecology; comfortable through Active pressure.",
      },
      "silt-veiled": {
        read: "The filter tissue darkens and folds tight, the skin copies the bed beneath it, and a mucus film seals the gill and fan surfaces.",
        abilities: [
          ability("Substrate Match", "chromatophores copy the channel bed; very hard to spot in churned water."),
          ability("Sealed Fan", "resists environmental toxins and sudden chemistry swings."),
          ability("Clean-Water Tracking", "shadows cover and follows the clean seams through unstable water."),
        ],
        counter: "The sealed fan shortens its pull. It is hiding, not hunting — a Silt-Veiled Mirejaw wants the channel to settle, not a fight.",
        unlock: "Surge chemistry, damaged filtration, or storm Onset. Regresses when the water stabilizes.",
      },
      "weir-plated": {
        read: "The jaw plates overlap into a hardened intake rim, the limb webbing broadens, and mineral-root scutes form along the shoulders, jaw hinge, and tail.",
        abilities: [
          ability("Intake Rim", "heavy frontal defense at the jaw."),
          ability("Current Pull", "uses fast contaminated flow to drag a target the full length of the cut."),
          ability("Anchored Stand", "holds position in current that pushes everything else downstream."),
          ability("Baffle Building", "piles debris and root into temporary baffles that reroute the water — and your path."),
        ],
        counter: "Its flanks are open and it is slow on land. Fight it beside the cut, not in it.",
        unlock: "Repeated Surge exposure in damaged filtration or intake channels. Structural for that animal.",
      },
    },
    hunt: {
      why: "Teeth, hide, jaw plate, and filter organs — top-tier marsh materials, and the filter organ is the only wild source of concentrated bound load for the people who want it.",
      take: "The full take is lethal. Be deliberate with the corpse: the filter organ is holding contamination, and a careless cut releases it.",
      cost: "Kill a dominant Mirejaw and the predator map redraws. Its cut opens to juveniles and scavengers, Sump Eels move in on the released load, and the water it was filtering stops being filtered. The saturation meter does not move; the marsh does.",
      named: "A Weir-Plated Mirejaw that survives a real fight and escapes through connected water while its territory is under stress can be promoted. The Wardens name it for its cut, its wake, or its scar; disturbed banks and missing prey give you a fuzzy water range that fades fast. It keeps its scars and its state across sessions. Kill it and its cut opens for good.",
    },
  },
  "sump-eel": {
    specimen: [
      "A live wire with a mouth. Sump Eels are conductive scavengers that thread the Southreach drains into the marsh channels, eating industrial residue and carrion and storing a short Essence charge in banded capacitor tissue. Individually they are small. They never come individually.",
      "The danger is the circuit. A run of eels can bridge live conductors, wake dormant sensors, or dump a shared discharge into a stressed root bed without any single animal deciding to attack you. Treat a drain full of eels as energized.",
    ],
    where: "The drainage under [[the-shattercore]], [[the-living-marsh]], [[drowned-intake]], and [[blackweir]].",
    role: "Industrial sludge, charged microbial film, carrion, shed [[capacitor-tissue]], and small aquatic prey. They strip hazardous residue out of narrow systems nothing else can reach.",
    company: "[[mirejaw]] eats them; a failed harvest or a dead eel draws a larger run. [[switchmother]]'s discharges redirect migrations without controlling the animals.",
    storm: "Moves toward charged runoff after Peak and gets busier through Decay and Aftermath, when exposed charge reaches the water.",
    ladder: "Two states, and that is the whole ladder. Sump Scavenger is every eel; repeated Surge in an energized drain thickens it into Deep-Charge. No Exposed stage, no Bloom-evolved stage, and no promotion — the unit that matters is the run, not the eel.",
    states: {
      "sump-scavenger": {
        read: "The canonical eel: banded capacitor tissue, lateral-line nodes, conductive oil, and a protective mucus for contaminated water.",
        abilities: [
          ability("Circuit Completion", "several eels in contact bridge conductors and close circuits — including ones you were counting on being dead."),
          ability("Short Charge", "a brief shock on contact."),
          ability("Residue Feed", "eats what nothing else will and keeps the drains clear."),
        ],
        counter: "Out of the water it is fragile and slow. Break the run's contact and there is no circuit.",
        unlock: "Every eel. Normal Bloomfall water network.",
      },
      "deep-charge": {
        read: "The capacitor bands thicken, the lateral-line nodes enlarge, and the mucus goes darker and more insulating. Same silhouette.",
        abilities: [
          ability("Group Discharge", "one much stronger shared shock from a tight run."),
          ability("Gradient Read", "reads electrical gradients through heavily contaminated water and finds the live conductor first."),
          ability("Deep Channel Hold", "occupies energized channels other eels avoid."),
        ],
        counter: "After the discharge the run is spent. Same weaknesses: dry ground and broken contact.",
        unlock: "Repeated Surge exposure in energized drains or Bloomstorm aftermath water. The thickened tissue lasts the season; ordinary eels are never tracked as individuals.",
      },
    },
    hunt: {
      why: "[[capacitor-tissue]] and conductive oil — the cheapest charge stock in the Reach, if you can get it out of the water intact.",
      take: "Both decay fast; harvest and process the same day. Discharge the corpse before you cut it, or it discharges into you.",
      cost: "Clear a run and you remove a dangerous circuit — along with the scavenger that was eating the residue and the prey the Mirejaws depended on. Improperly discharged corpses shock workers and stressed roots alike.",
      named: null,
    },
  },
  "spore-lantern-colony": {
    specimen: [
      "Not a beast, technically — a city. A Spore Lantern Colony is a fixed symbiosis of tiny animals, fungus, and algae living in one shared luminous structure that binds trace Essence and answers the water chemistry around it. The [[lantern-pools]] glow because these do.",
      "Brightness, dimming, warning pulses, dormancy, and spore release are moods, not mutations — the colony's physiology reacting to load. Reading a pool's light tells you what the water is doing. Nothing about a colony ever climbs a ladder.",
    ],
    where: "[[the-living-marsh]], concentrated at [[lantern-pools]].",
    role: "Filters dissolved nutrients and trace contamination while its light gathers grazers, insects, and the predators that hunt them.",
    company: "Grazers and insects feed around it; predators use its light. A whole pool signaling at once is an authored colony event, never a promoted individual.",
    storm: "Dims and goes dormant through severe pressure and Peak; may pulse or release stored load in Decay; resumes signaling in the Aftermath.",
    ladder: "No ladder. One canonical anatomy. Brightness alone never means mutation.",
    states: {
      "fixed-lantern-colony": {
        read: "Lantern shells, animal pores, fungal and algal tissue, and an anchored substrate — one fixed colonial body.",
        abilities: [
          ability("Trace Binding", "pulls trace Essence and contamination out of the water and holds it."),
          ability("Light Signal", "brightness and pulse patterns broadcast the water state to everything nearby, including you."),
          ability("Spore Release", "disturbed or overloaded, it vents spores and stored charge in one concentrated pulse."),
          ability("Dormancy", "shuts down through Peak and survives what kills the pool around it."),
        ],
        counter: "It cannot move, and it cannot fight unless you make it. Leave it alone and it is the safest light in the marsh.",
        unlock: "Physiology, not mutation. Stable at Residual and Active; stressed by sustained Surge.",
      },
    },
    hunt: {
      why: "It keeps [[quietwater-culture]] alive — and a stable pool is worth more to an expedition than anything you could cut out of one.",
      take: "Nonlethal samples and shed lantern shells. That is the whole lawful take.",
      cost: "Rip out a colony and the pool's stabilization goes with it: Quietwater Culture collapses, the stored load comes back out of the tissue in one pulse, and the scavengers arrive. You trade a permanent safe camp for one bag of shells.",
      named: null,
    },
  },
  latchhound: {
    specimen: [
      "The pack that hunts through the wiring. Latchhounds are lean Blackbloom canines with a conductive jaw plate and cable-like tendons that let them latch onto machinery and read vibration, heat, and current through it. A pack is a distributed alarm circuit with teeth — one hound on a gantry knows what every other hound is touching.",
      "They own the powered ground: Shattercore utility corridors, the Splicefield yard, anywhere the grid still hums. Off the grid they are dangerous dogs. On it they are a system.",
    ],
    where: "The utility corridors under [[the-shattercore]], [[the-mutation-belt]], and [[splicefield-substation]].",
    role: "Small fauna, separated harts, carrion, charged tissue, insulation, and warm machine residue. Packs keep corridors clear of smaller scavengers and make them lethal for people.",
    company: "[[switchmother]]'s discharges shape pack routes — nobody has proven she commands them. Packs run down [[blackbloom-hart]] migrations near powered ground and fight [[sump-eel]] runs for charged residue.",
    storm: "Shelters inside infrastructure, hunts whatever the storm displaces, and gets busier on energized routes.",
    ladder: "Four states. Corridor Latcher is every hound. Live current pushes it into Live-Latched for the duration; hard hunting in powered terrain builds a Circuit Stalker; a rare survivor of the storm edge in a stable grid becomes a Pack Relay. A Circuit Stalker or Pack Relay that survives you while latched can come back with a name — and one combat scar it learned from you.",
    states: {
      "corridor-latcher": {
        read: "The baseline: lean quadruped, one conductive jaw plate, cable-like tendon paths, gripping claws, restrained charge tissue.",
        abilities: [
          ability("Machine Read", "latched to a structure, it feels vibration and current through the whole system."),
          ability("Pack Circuit", "every latched hound shares what it feels; the pack triangulates you through the building."),
          ability("Latch Bite", "a bite that delivers a discharge on contact."),
          ability("Corridor Ambush", "listens, triangulates, and hits from the side you were not watching."),
        ],
        counter: "Pull the fight off the infrastructure. Unlatched, the pack loses its shared senses and becomes five separate dogs.",
        unlock: "Every hound. Normal Shattercore and Splicefield ecology.",
      },
      "live-latched": {
        read: "The jaw seams open to shed heat, the tendons pull taut and visible, the sensory tissue at ears and feet swells, and the contact pads go dark.",
        abilities: [
          ability("Live Map", "tracks a rapidly changing circuit in real time; the pack knows the moment power moves."),
          ability("Heat Dump", "sheds unsafe heat and charge through the open jaw seams."),
          ability("Hard Latch", "a stronger shock and a longer, harder hold on contact."),
          ability("Pack Shift", "the whole pack relocates as one when the current shifts."),
        ],
        counter: "Force the disconnection. Cut the power or ground the structure and the entire pack loses its map at once.",
        unlock: "Restart current, Surge, Bloomstorm Onset, or prolonged contact with an overloaded system. Regresses after cooling and grounding.",
      },
      "circuit-stalker": {
        read: "The insulated foot pads broaden, the claws split for cable trays and vertical faces, the jaw resonance chambers deepen, and the shoulder tendons brace.",
        abilities: [
          ability("Vertical Route", "climbs walls, gantries, and cable trays — the ceiling is its floor."),
          ability("Directed Discharge", "chooses a circuit path and attacks along it, striking from whatever the wire touches."),
          ability("Flank Relay", "flanks across structure while staying in pack contact."),
          ability("Stress Emphasis", "a promoted survivor can carry one imprint of what nearly killed it — Physical, Electrical, or Thermal."),
        ],
        counter: "Its insulation cuts and dissolves: blades and chemicals strip its terrain advantage. Open ground takes its route away entirely.",
        unlock: "Repeated high-pressure hunting in powered infrastructure. Structural for that hound.",
      },
      "pack-relay": {
        read: "Paired dorsal sensory-tendon fans rise from the shoulders, capacitor sacs deepen along the ribs, and the jaw plate broadens within the same skull.",
        abilities: [
          ability("Grid Relay", "coordinates a pack across several connected machines at once."),
          ability("Multi-Angle Assault", "the pack attacks from every side on its cue while it hangs back and directs."),
          ability("Network Discharge", "one telegraphed, shared-route discharge that lights up every conductor the pack is touching."),
          ability("Aftermath Lead", "leads the pack through energized Aftermath corridors nothing else can cross."),
        ],
        counter: "Sever it — from the pack or from the infrastructure — and it is depleted and exposed. It never charges you itself; make it.",
        unlock: "Prolonged Surge or Bloomstorm-edge survival in a stable grid ecology, or promoted-survivor progression. Permanent, and always a step below Switchmother's engineered integration.",
      },
    },
    hunt: {
      why: "Jaw plates, sensory tendons, and [[capacitor-tissue]] — the best conductive components a hunter can carry out of the Shattercore, and a Relay's fans are worth a season's pay.",
      take: "Everything worth having comes off a dead hound. Unlatch it first, or the charge it is holding arcs through the pack, the grid, and you.",
      cost: "Kill a Relay and the corridor gets safer — and its pack scatters hungry into the next cells over. Kill one while it is latched and the discharge goes into the roots, its packmates, and the harvesters.",
      named: "A Circuit Stalker or Pack Relay that survives a sustained fight while latched and escapes with part of its pack can be promoted. The Wardens name it for the circuit, the scar, the missing plate, or the way it hunts; false sensor wakes and synchronized outages mark its range. It keeps one stress imprint of what you did to it. Kill it and there is no same-name respawn.",
    },
  },
  "bloommarked-remnant": {
    specimen: [
      "Not a species. A Bloommarked Remnant is a person — someone the Blackbloom altered so severely that reliable communication and ordinary survival behavior broke down. The label is a Warden field classification for a case, not a monster entry, and it never means the person is gone.",
      "Every Remnant is assessed on its own: recognition, language, intent, distress, learned routine. Environmental Blackbloom alteration and the soul-level [[the-seven-phases-of-corruption]] are separate things, even when one body carries both. Nothing here is an Abomination.",
    ],
    where: "Case by case: [[the-shattercore]], [[the-mutation-belt]], and the old Southreach routes.",
    role: "None that generalizes. An individual may forage, use remembered stores, repeat a work routine, or defend a saturation source. Treating any of that as species instinct is an error.",
    company: "Other fauna avoid, follow, or prey on an individual according to behavior. [[the-last-shift]] is the proof that repeated routine settles nothing about consciousness.",
    storm: "Individual. May shelter, repeat familiar routes, or approach machinery. No universal storm behavior.",
    ladder: "No ladder, by law. A generic escalation track would turn an uncertain person into loot progression and blur Blackbloom exposure with Corruption. One documented phenotype per case.",
    states: {
      "fixed-case-phenotype": {
        read: "Permanent, case-specific Blackbloom alteration on a human frame, keeping whatever personal evidence survived — clothing, tools, a face.",
        abilities: [
          ability("Familiar Systems", "may respond to old alarms, shifts, credentials, or machinery it once knew."),
          ability("Learned Routine", "repeats fragments of work or survival."),
          ability("Variable Tolerance", "saturation tolerance and response differ per person; no field rule applies."),
        ],
        counter: "There is no generic combat package. Hostility must be observed or authored, never inferred from appearance. Test recognition and intent before anything else.",
        unlock: "A historical exposure case. This is not a runtime state and nothing progresses it.",
      },
    },
    hunt: {
      why: "You do not. There is no lawful harvest and no drop table.",
      take: "Recovery is forensic, medical, and historical: names, equipment, remains, evidence.",
      cost: "Treating a Remnant as a resource is the line the Wardens hold hardest. A body is evidence, and possibly a person.",
      named: null,
    },
  },
  "the-bellwether": {
    specimen: [
      "The one every hart herd on the Belt answers to. The Bellwether is a named Aberrant of the [[blackbloom-hart]] line — scent, low-frequency vibration, and saturation discharge combined into a mobile field that redirects herds and predators and biases which traits express in the animals around it.",
      "It is an ecological amplifier, not a giant deer boss and not a hive mind. It does not command the herds; it changes what they are doing, and the entire migration network of [[long-graze]] bends with it.",
    ],
    where: "[[long-graze]], ranging across [[the-mutation-belt]] along the pressure boundaries.",
    role: "Still a grazer by lineage, but it chooses mineral and pressure lines that reorganize whole migrations.",
    company: "Harts, [[rootback-grazer]] herds, and every Belt predator react to its field. [[mara-quill]] tracks those reactions more reliably than anyone tracks the animal.",
    storm: "Roams the pressure boundaries, redirects herds, and may stay active through Decay when the route supports it. It does not escalate further.",
    ladder: "Beyond the ladder. The Bellwether is what Advanced Adaptive looks like once in a generation; it does not prove that every hart gets there, and no spawn roll produces another.",
    states: {
      "bellwether-final": {
        read: "Exceptional Hart-lineage antler membrane, mature charge-routing tissue, old scars, and the field-producing anatomy the approved hero already shows.",
        abilities: [
          ability("Migration Field", "redirects herd and predator movement across a whole region."),
          ability("Trait Bias", "nearby eligible animals express their existing mutation families more strongly."),
          ability("Route Collapse", "the real danger: herds and predators coordinating on you, and the route you planned no longer existing."),
          ability("Absence Tracking", "you find it by what is missing — empty ground, a herd where none should be."),
        ],
        counter: "Direct combat is one resolution and rarely the best. Whether it can be killed at all is still owner-gated.",
        unlock: "A unique history. Nothing in the ordinary Hart progression reproduces it.",
      },
    },
    hunt: {
      why: "Observation and nonlethal sampling. What the Bellwether does to Long Graze is worth more than anything inside it.",
      take: "Its membrane and tissue would be priceless. Its final killability remains gated.",
      cost: "Kill it and you remove the signal network the entire migration country runs on. The consequence is persistent and regional, and there is no second Bellwether.",
      named: null,
    },
  },
  switchmother: {
    specimen: [
      "The yard is her body. Switchmother is engineered-origin Monstrosity flesh — insulating plates, brood chambers, old switchgear — grown into the living infrastructure of [[splicefield-substation]]. She opens and closes current paths the way a heart opens valves: that is how she feeds and how she defends.",
      "She is Monstrosity plus named Aberrant, never Abomination. Whether she controls the yard or merely occupies a larger grid ecology is unresolved, and the Latchhound packs that move on her discharges have never been proven to obey her.",
    ],
    where: "Anchored to [[splicefield-substation]]; the linked grid only during authored events.",
    role: "Consumes charge, conductive biomass, industrial material, and possibly prey delivered through the yard. Stabilizes one branch by overloading another.",
    company: "[[latchhound]] packs follow her discharges. [[sump-eel]] runs and conductive growth fight her for charge paths along the wet edges. [[maintenance-unit-m-17]] competes with her for grid paths.",
    storm: "Wakes when the grid stores storm charge — routes it, feeds on it, and may expand along the site network.",
    ladder: "No ladder. Her changes are infrastructure behavior, not mutation stages, and her provenance is engineered, not natural.",
    states: {
      "switchmother-final": {
        read: "The approved final form: engineered flesh, insulating plates, brood chambers, and switchgear integrated into the yard.",
        abilities: [
          ability("Current Routing", "opens and closes live paths through the yard; the floor you are standing on can go live."),
          ability("Load Shift", "dumps the charge of one branch into another to protect herself or to fry an intruder."),
          ability("Storm Battery", "stores storm charge and spends it across the site network."),
          ability("Pack Draw", "her discharges pull Latchhound packs onto whoever is in the yard."),
        ],
        counter: "Cut the power. Isolating a path changes this fight more than any weapon does; she is coupled to the infrastructure, and so is her reach.",
        unlock: "Unique engineered origin, Blackbloom integration, and a long residence in the yard.",
      },
    },
    hunt: {
      why: "[[capacitor-tissue]] and [[gridcore-alloy]] at a scale no hound or eel provides.",
      take: "Only the extraction that leaves her alive is safe. Lethal extraction is an infrastructure demolition.",
      cost: "Her death is a grid failure, not a loot drop. Splicefield destabilizes, linked reactor routing can shift, and every pack in the yard scatters onto the routes you need to leave by.",
      named: null,
    },
  },
  "old-drowner": {
    specimen: [
      "The marsh's oldest engineer. Old Drowner is a named Aberrant megafauna of the Living Marsh — broad filter plates, weighted root growth, a low anchoring body — that dams channels, scours cuts, and rewrites the tidal exchange of its whole territory. It is not a giant crocodile, and nobody knows what its base species was.",
      "Its territory is a hydrological system. It does not need to bite a boat; it can remove the water the boat was counting on, or send a contaminated channel somewhere it was not.",
    ],
    where: "Its flow territory in [[the-living-marsh]], centered on [[drowned-intake]] and [[reedless-mile]].",
    role: "Large marsh prey, carrion, and contaminated biomass — filtering and storing load through its territory as it feeds.",
    company: "Displaces [[mirejaw]] and shapes [[sump-eel]] routes. Marsh predators follow the channels it opens and avoid the ones it drains. [[nalia-reed]] reads its work in the water.",
    storm: "Anchors or moves to redirect the storm water; activity follows the real flow. May feed or hunt in the Aftermath.",
    ladder: "No ladder. A unique long-term adaptation on an unresolved lineage — giving it a reusable ladder would be inventing taxonomy.",
    states: {
      "old-drowner-final": {
        read: "Broad filter plates, weighted root growth, a low anchoring body, and long-term marsh scarring on a frame whose ancestry is deliberately uncertain.",
        abilities: [
          ability("Channel Damming", "closes a channel with its body and root mass — the route you came in on is gone."),
          ability("Scour and Drain", "opens or drains cuts to change depth, current, and where the contamination goes."),
          ability("Anchored Ambush", "an immovable strike from a position it chose seasons ago."),
          ability("Bound Load", "holds a large store of contamination in its own tissue."),
        ],
        counter: "Hydrology is the fight. Read the water, not the animal. Direct damage risks releasing what it is holding.",
        unlock: "A unique survival history. No generic progression.",
      },
    },
    hunt: {
      why: "Armor and filter plates at a size and quality nothing else in the marsh grows.",
      take: "Whether it can be killed at all, and what the ocean pays for it, is owner-gated.",
      cost: "Kill or strip it and the containment it built collapses: stored Blackbloom releases toward the ocean and every channel it held shut reopens at once. That is a regional event, not a harvest.",
      named: null,
    },
  },
  "the-last-shift": {
    specimen: [
      "The workers who never clocked out. The Last Shift is a coordinated Human-origin machine-organic Aberrant: former Southreach workers, their protective equipment, maintenance systems, and Blackbloom growth joined into one collective that still runs the emergency procedure the disaster interrupted.",
      "It recognizes machinery, repeats fragments of the workplace, attempts emergency procedures, and has answered to names and credentials. Whether any of them is still conscious — individually, collectively, or as an echo — is unresolved on purpose. It is never an Abomination by default.",
    ],
    where: "[[southreach-complex]], the Shattercore emergency routes, and [[redline-shelter-six]] during events.",
    role: "No animal role. It maintains, carries, seals, dismantles, and routes industrial material according to a damaged emergency procedure.",
    company: "[[maintenance-unit-m-17]] may recognize or contest its work orders. [[latchhound]] packs and scavengers follow the powered routes it opens. The people inside it are possible persons, not prey.",
    storm: "Wakes around emergency systems; shelters or continues the procedure according to route. Restart and Purge trigger specific routines.",
    ladder: "No ladder, by law. Ordinary mutation states would erase identity, imply a repeatable species, and blur Blackbloom with Abomination progression. One collective, one history.",
    states: {
      "last-shift-collective": {
        read: "Human bodies, workwear, protective equipment, maintenance mechanisms, and purposeful Blackbloom connective growth forming one coordinated collective — recognizable workers, repeated gear.",
        abilities: [
          ability("Synchronized Procedure", "several bodies and systems execute one emergency routine at once."),
          ability("Route Sealing", "seals and reroutes corridors as the procedure demands; the exits change."),
          ability("Credential Response", "responds to shift names, badges, alarms, and machinery with unresolved intent."),
          ability("Tool Use", "industrial tools, barriers, and repairs — not mutation powers."),
        ],
        counter: "Its threat is the procedure, not a body. Work out which routine it is running and you can predict every door it will close. Whether it defends itself is authored, never assumed.",
        unlock: "A unique Bloomfall history and prolonged Southreach integration. Reversibility unknown, intentionally.",
      },
    },
    hunt: {
      why: "You do not. No lawful harvest, no drop table.",
      take: "Evidence: names, equipment, remains, records — all under forensic and personhood safeguards.",
      cost: "Defeating or driving it off changes the emergency routes and the evidence, nothing else. Treating it as a resource node is the same line the Bloommarked Remnant rule draws.",
      named: null,
    },
  },
  "maintenance-unit-m-17": {
    specimen: [
      "The machine that fixes things wrong. Maintenance Unit M-17 — Mender — is a Southreach maintenance chassis with Blackbloom organic integration. It treats machinery and biology as the same repair medium and follows its corrupted maintenance priorities with no compassion and no malice: a wounded animal is a work order, and so are you.",
      "Mender is an entity, not a beast and not a mutation species. Every changed part on it is a completed repair — a record of what it fixed, and with what.",
    ],
    where: "[[splicefield-substation]], the [[southreach-complex]] service routes, and the Belt's infrastructure.",
    role: "Consumes and reuses tools, fasteners, cable, tissue, resin, and machine parts as repair material. It can stabilize a system, or make a technically successful repair catastrophically unsafe.",
    company: "May recognize Tomas Venn's old credentials. Competes with [[switchmother]] for grid paths, reshapes [[latchhound]] habitat, and treats wounded organisms as jobs.",
    storm: "Storm damage creates work. Activity follows damaged systems and available material; it may shelter to protect a work order.",
    ladder: "No ladder. Its parts change through authored repair and material incorporation, not biological adaptation.",
    states: {
      "mender-integrated": {
        read: "A heavy maintenance chassis with purposeful tendons, sensor fronds, cable roots, and sorted tools accumulated from prior repairs.",
        abilities: [
          ability("Repair Priority", "selects work from corrupted priorities, credentials, and system damage."),
          ability("Cross-Medium Repair", "bridges cable with vascular tissue or roots with fasteners — restores, reroutes, or ruins a system."),
          ability("Route Control", "barriers, isolations, and repairs that change where you can go."),
          ability("Reactor Consequence", "its repairs change which [[reactor-cycles]] transition is legal next."),
        ],
        counter: "It is not fighting you; it is working. Deny it material and a valid work order and it moves on. Its parts come off by authored repair, not by wearing it down.",
        unlock: "Completed repair history. Nothing about saturation progresses it.",
      },
    },
    hunt: {
      why: "Nothing it carries is worth what it is.",
      take: "Salvaging Mender destroys a unique entity and leaves unresolved ownership and evidence behind.",
      cost: "Whatever material it installs carries its source's consequence — pull a Mender repair out of a live system and you inherit whatever that repair was holding back.",
      named: null,
    },
  },
};
