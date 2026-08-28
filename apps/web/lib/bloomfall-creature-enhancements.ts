import type { StoryEntryKind } from "@habitat/shared";
import {
  bloomfallDamageTypeLabels,
  bloomfallDamageTypes,
  bloomfallLadderSummary,
  bloomfallMutationLadder,
  type BloomfallMutationRung,
} from "./bloomfall-adaptive-ladder";
import {
  bloomfallAbilitySentence,
  bloomfallCreatureFieldGuide,
  type BloomfallAbility,
  type BloomfallAdaptiveGuide,
  type BloomfallBossGuide,
  type BloomfallCreatureGuide,
  type BloomfallDamageTable,
  type BloomfallFixedGuide,
} from "./bloomfall-creature-field-guide";

export const bloomfallMutationEligibilities = ["NONE", "MINOR_ADAPTIVE", "FUNCTIONAL_ADAPTIVE", "ADVANCED_ADAPTIVE"] as const;
export type BloomfallMutationEligibility = (typeof bloomfallMutationEligibilities)[number];

export const bloomfallAdaptiveClassifications = [...bloomfallMutationEligibilities, "EXCEPTIONAL_ABERRANT"] as const;
export type BloomfallAdaptiveClassification = (typeof bloomfallAdaptiveClassifications)[number];

export const bloomfallAberrantStatuses = ["NONE", "CANDIDATE", "PROMOTED", "NAMED_CANON"] as const;
export type BloomfallAberrantStatus = (typeof bloomfallAberrantStatuses)[number];

export const bloomfallSaturationTolerances = ["LOW", "MODERATE", "HIGH", "EXTREME", "VARIABLE"] as const;
export type BloomfallSaturationTolerance = (typeof bloomfallSaturationTolerances)[number];

export const bloomfallCombatAdaptationFamilies = ["THERMAL", "ELECTRICAL", "PHYSICAL", "ARCANE", "TOXIC_ENVIRONMENTAL", "PREDATORY", "DEFENSIVE", "MOBILITY"] as const;
export type BloomfallCombatAdaptationFamily = (typeof bloomfallCombatAdaptationFamilies)[number];

export const bloomfallImagePriorities = ["P0", "P1", "P2", "P3"] as const;
export type BloomfallImagePriority = (typeof bloomfallImagePriorities)[number];

export type BloomfallMutationState = {
  key: string;
  name: string;
  frequency: "COMMON" | "CONDITIONAL" | "UNCOMMON" | "RARE" | "UNIQUE";
  physicalChanges: string;
  function: string;
  behavior: string;
  combat: string;
  triggers: string;
  saturation: string;
  bloomstorm: string;
  reactor: string;
  reversibility: string;
  persistence: string;
  visualDifference: string;
};

export type BloomfallPromotedThreatRule = {
  eligible: boolean;
  conditions: string[];
  naming: string;
  atlas: string;
  persistence: string;
  death: string;
};

export type BloomfallCreatureImagePlan = {
  existingV3AssetId: string | null;
  existingUse: string | null;
  newStateReferences: number;
  newHeroImages: number;
  comparisonReferencesReused: number;
  heroRequired: boolean;
  priority: BloomfallImagePriority;
  aspectRatio: "4:5 state reference; 16:9 hero" | "4:5 state reference" | "16:9 hero";
  direction: string;
};

export type BloomfallCreatureEnhancement = {
  slug: string;
  kind: Extract<StoryEntryKind, "CREATURE" | "CHARACTER">;
  title: string;
  taxonomyParent: string | null;
  taxonomyCategory: "natural" | "monstrosity";
  classification: BloomfallAdaptiveClassification;
  mutationEligibility: BloomfallMutationEligibility;
  aberrantStatus: BloomfallAberrantStatus;
  tierReason: string;
  distribution: string[];
  saturationTolerance: BloomfallSaturationTolerance;
  bloomstormBehaviors: string[];
  overview: string[];
  dietAndRole: string;
  relationships: string;
  floraAndAbsorption: string;
  reactorRelationship: string;
  combatFamilies: BloomfallCombatAdaptationFamily[];
  states: BloomfallMutationState[];
  promotedThreat: BloomfallPromotedThreatRule;
  harvestAndConsequence: string;
  visualContinuity: string;
  specialMechanic: string | null;
  image: BloomfallCreatureImagePlan;
};

const noPromotion = (reason: string): BloomfallPromotedThreatRule => ({
  eligible: false,
  conditions: [reason],
  naming: "No generated persistent-threat name.",
  atlas: "No promoted-survivor track. Ordinary ecological evidence may still appear.",
  persistence: "Ordinary encounters are not persisted as individuals.",
  death: "Ordinary encounter lifecycle; authored exceptional incidents remain separate records.",
});

const state = (value: BloomfallMutationState) => value;

export const bloomfallCreatureEnhancements: readonly BloomfallCreatureEnhancement[] = [
  {
    slug: "blackbloom-hart", kind: "CREATURE", title: "Blackbloom Hart", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "ADVANCED_ADAPTIVE", mutationEligibility: "ADVANCED_ADAPTIVE", aberrantStatus: "CANDIDATE",
    tierReason: "The species already reads saturation through conductive antler membranes, changes herd routes before surges, stores charge, and canonically provides the Bellwether lineage. A four-state response teaches the system through behavior without turning every hart into a boss.",
    distribution: ["MUTATION_BELT", "LONG_GRAZE", "conditional Shattercore fringe during mineral migration"], saturationTolerance: "HIGH",
    bloomstormBehaviors: ["WARNS", "MIGRATES", "MUTATES when eligible and exposure thresholds are met", "grounds stored charge in herd formations"],
    overview: [
      "Blackbloom Harts are a regional Beasts variant, not a race. Their conductive antler membranes read mineral, root, and [[essence-saturation]] gradients, making herd movement one of Bloomfall's most useful field forecasts.",
      "They prefer distance. A cornered herd uses wet ground, spacing, and synchronized discharge defensively; it does not become aggressive merely because saturation rises.",
    ],
    dietAndRole: "Harts graze Belt grasses, mineral-rich browse, and root exudates exposed by Rootback movement. Their routes distribute seed and reveal pressure gradients before instruments agree.",
    relationships: "[[rootback-grazer]] movement exposes browse and mineral lines the herds follow. Latchhound packs and other Belt predators read those migrations. [[the-bellwether]] amplifies herd signals and trait expression rather than commanding the species as a hive mind.",
    floraAndAbsorption: "Herd grazing prevents some conductive growth from choking trail margins, while breeding-adult loss removes a warning network. Harts avoid healthy deep filtration beds and cross damaged sink ground when its released minerals become attractive.",
    reactorRelationship: "Venting and Purge affect harts only through declared saturation/mineral transfers. Herds move before the plume reaches Long Graze; a reactor state does not mutate them remotely.",
    combatFamilies: ["ELECTRICAL", "DEFENSIVE", "MOBILITY"],
    states: [
      state({ key: "baseline-gradient-hart", name: "Gradient-Sensing Hart", frequency: "COMMON", physicalChanges: "The canonical lean hart form with dark conductive membranes carried inside a recognizable branching antler structure and modest charge nodules at the neck and forequarters.", function: "Detects mineral, root, and saturation gradients and bleeds small charges into the ground.", behavior: "Keeps loose herd spacing, tests ground before crossing, and abandons rising gradients early.", combat: "Avoids combat; a cornered animal can discharge through wet ground and create a short herd escape lane.", triggers: "Normal Mutation Belt ecology at Residual or Active pressure.", saturation: "Stable from Residual through Active; pressure accumulates without immediate silhouette change.", bloomstorm: "Acts as an early warning and migrates before Onset.", reactor: "Responds to downwind/downstream evidence from Venting or Purge.", reversibility: "Canonical baseline; not a temporary state.", persistence: "Common encounter form and population baseline.", visualDifference: "Membranes are present but folded and thin; coat, skull, limb count, and ordinary antler branching establish the lineage anchor." }),
      state({ key: "charge-raised", name: "Charge-Raised", frequency: "CONDITIONAL", physicalChanges: "Antler membranes engorge and lift, small vessels darken around the ears and eyes, and the coat stands along the spine while charge nodules become visible under the hide.", function: "Increases short-range pressure sensing and prepares rapid grounding.", behavior: "Herds compress into warning lines, stamp conductive ground, and prioritize escape routes over feeding.", combat: "Faster reaction and a stronger but short-lived ground discharge; no new attack anatomy.", triggers: "Sustained high Active pressure, a nearby Surge boundary, or Bloomstorm Warning.", saturation: "Acute exposure state; it signals pressure rather than granting permanent strength.", bloomstorm: "Common during Warning and early Onset; most herds migrate rather than remain.", reactor: "Can appear after a forecast Venting transfer reaches the Belt.", reversibility: "Regresses after pressure falls and stored charge is grounded.", persistence: "Not persisted for ordinary individuals; promoted survivors may be recognized while it is active.", visualDifference: "Same antlers and silhouette, with raised translucent membranes, tense posture, darkened vessels, and visible ground contact." }),
      state({ key: "grounded-crown", name: "Grounded Crown", frequency: "UNCOMMON", physicalChanges: "Antler tips and lower legs develop controlled mineralized keratin, the neck gains insulating fibrous bands, and split hoof edges broaden for reliable contact on charged or soft ground.", function: "Routes dangerous charge away from the heart and stabilizes movement across conductive terrain.", behavior: "Adapted adults take exposed herd positions and create safe intervals for calves to cross.", combat: "Improved electrical resistance, braced knock-aside defense, and a directed grounding pulse with clear recovery time.", triggers: "Repeated Surge exposure in Long Graze or conductive Belt corridors; an eligible promoted survivor may also select it after an electrical stress imprint.", saturation: "Requires accumulated exposure above the Exposed state, not one storm tick.", bloomstorm: "Can remain at the storm edge to shepherd the herd, but normally withdraws before Peak.", reactor: "Most common along repeated Venting/Purge transfer corridors.", reversibility: "Mineral keratin sheds slowly; the functional state does not regress during an encounter.", persistence: "Uncommon encounter variant; retained by promoted threats.", visualDifference: "Recognizable hart with the same skull and antler map; mineralization follows antler tips, fetlocks, and hoof contact rather than adding horns or mass." }),
      state({ key: "storm-tuned-relay", name: "Storm-Tuned Relay", frequency: "RARE", physicalChanges: "Antler membranes broaden within the original branch plan, paired charge sacs deepen behind the shoulders, and insulating tissue forms a continuous neck-to-foreleg route.", function: "Reads and relays saturation direction across a herd while storing enough charge to coordinate a mass withdrawal.", behavior: "Takes a field-coordinator role, spacing animals by vibration and scent. It is not a Bellwether and cannot rewrite other species.", combat: "Coordinates herd feints and releases one powerful area grounding event; afterward it is depleted and vulnerable.", triggers: "Prolonged Surge/Bloomstorm-edge survival in an advanced-eligible population, usually where the same route is repeatedly pressured.", saturation: "Rare Bloom-evolved expression; weighted to sustained critical ecology, never every high-band spawn.", bloomstorm: "May guide a herd through Decay or exploit an Aftermath mineral line.", reactor: "Repeated source cycles can establish the exposure history, but no single state guarantees it.", reversibility: "Structural changes are effectively permanent for the individual.", persistence: "Rare population expression or persistent promoted threat; Breakpoint remains a separate promotion event.", visualDifference: "Broader membranes and deeper shoulder tissues change the profile while preserving the same antler branches, skull, coat identity, limb count, and adult scale." }),
    ],
    promotedThreat: { eligible: true, conditions: ["Grounded Crown or Storm-Tuned Relay state", "meaningful player encounter survived by escape or party withdrawal", "sufficient exposure and an open regional threat cap", "one authored persistent Hart profile"], naming: "A Warden field epithet based on a visible scar, route, or herd behavior; never a random fantasy title.", atlas: "Fresh hoof-grounding patterns and displaced-herd reports progress Rumored -> Tracked -> Confirmed -> Lost.", persistence: "Stable identity, one mutation state, scars, home/current cell, and encounter summary persist across sessions.", death: "Permanent for that individual; archive the threat and apply the herd-route consequence. A later promotion is a different hart." },
    harvestAndConsequence: "Antler membrane and charge nodules support instruments and alchemy. Shed tissue is a regenerative take; killing breeding or relay adults damages migration forecasting and can raise local route risk without directly adding saturation.",
    visualContinuity: "Every state keeps the same deer-like skull, four limbs, adult scale, coat pattern, and identifiable antler branch map. Membranes, mineral keratin, charge sacs, and posture change functionally; giant extra antlers, random spikes, and demonic facial anatomy are prohibited.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 4, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P0", aspectRatio: "4:5 state reference; 16:9 hero", direction: "Four matched 3/4 field-reference poses plus one Long Graze herd hero. Use the same adult and antler branch map in all five." },
  },
  {
    slug: "rootback-grazer", kind: "CREATURE", title: "Rootback Grazer", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "FUNCTIONAL_ADAPTIVE", mutationEligibility: "FUNCTIONAL_ADAPTIVE", aberrantStatus: "NONE",
    tierReason: "Its carried soil, filtration roots, and seed community already make adaptation ecologically meaningful. A bounded defensive/filtration path strengthens that role; a predator or multi-role apex path would duplicate other creatures.",
    distribution: ["MUTATION_BELT", "LONG_GRAZE", "WALKING_ORCHARD"], saturationTolerance: "HIGH",
    bloomstormBehaviors: ["SHELTERS by anchoring", "MIGRATES before Peak when possible", "supports carried ecology rather than hunting"],
    overview: ["Rootback Grazers are massive Beasts that carry living soil, roots, insects, fungi, and seed on broad backs. The animal and its carried mat are one moving ecological service, not a mount with decorative plants.", "They reseed damaged Belt ground and absorb low free contamination while moving between Long Graze and Walking Orchard."],
    dietAndRole: "They crop dense growth, mineral soil, fungal mats, and woody browse. Digestion, trampling, and deposited carried soil create germination ground behind the herd.",
    relationships: "Blackbloom Harts follow opened mineral/browse lines. Predators target separated calves rather than healthy adults. Bellwether presence can redirect the herd but does not control its carried ecology.",
    floraAndAbsorption: "The carried root community is a mobile minor sink and seed bank. Lethal harvest destroys years of accumulated function; shed mats can establish new filtration patches.",
    reactorRelationship: "Grazers respond to downstream soil/water changes from Venting or Purge. They do not approach the Complex because a state is active.", combatFamilies: ["DEFENSIVE", "TOXIC_ENVIRONMENTAL"],
    states: [
      state({ key: "carried-mat", name: "Carried-Mat Grazer", frequency: "COMMON", physicalChanges: "Canonical broad-backed body with an established soil/root mat and deep ordinary load-bearing limbs.", function: "Transports seed, soil organisms, and modest filtration capacity.", behavior: "Moves in slow lines, feeds continuously, and protects calves and intact mats.", combat: "Bracing mass and herd stampede are the danger; it is not a pursuing predator.", triggers: "Normal Belt ecology.", saturation: "Tolerates Active pressure and moves away from sustained Surge.", bloomstorm: "Anchors or migrates according to warning time.", reactor: "Reads changed ground and runoff after a transfer reaches its route.", reversibility: "Baseline.", persistence: "Common population form.", visualDifference: "Establishes body proportions, hide, four load-bearing limbs, carried soil depth, and recognizable shoulder/head landmarks." }),
      state({ key: "root-clamped", name: "Root-Clamped", frequency: "CONDITIONAL", physicalChanges: "Carried roots contract around the flanks, hide pores seal under a resin film, and the animal lowers its center of mass while roots probe the ground.", function: "Prevents mat loss and briefly binds contaminated surface flow.", behavior: "Herds form a windward wall around calves and remain still unless the ground itself fails.", combat: "High stagger resistance and reduced mobility; exposed head/underside remain vulnerable.", triggers: "Surge onset, damaged filtration ground, or Bloomstorm Warning without a safe migration path.", saturation: "Acute exposure response.", bloomstorm: "Shelter/anchor state through Warning and Onset; not a license to survive Peak indefinitely.", reactor: "May appear along a newly contaminated Purge path.", reversibility: "Relaxes after pressure and wind fall.", persistence: "Not individually persisted.", visualDifference: "Same silhouette compressed lower, roots visibly clamped, resin film and ground probes present without new limbs or armor horns." }),
      state({ key: "bastion-back", name: "Bastion-Back", frequency: "UNCOMMON", physicalChanges: "A layered barklike dermal lattice grows beneath the carried mat, hooves spread for unstable ground, and deeper filtration sacs develop along the ribs.", function: "Stabilizes stressed terrain and protects a mature mobile sink community.", behavior: "Takes the outside of herd formations and deliberately pauses on damaged ground to seed/absorb it.", combat: "Greater frontal/upper defense and a braced shove; slower turning and vulnerable filtration sacs create counterplay.", triggers: "Repeated high Active/Surge exposure while supporting damaged Belt ecology.", saturation: "Functional adaptation to repeated pressure, capped below a Bloom-evolved stage.", bloomstorm: "Can hold an Aftermath crossing long enough for the herd to pass.", reactor: "Repeated downstream transfers can weight its appearance.", reversibility: "Structural for the animal's remaining life.", persistence: "Uncommon encounter variant; species is not enabled for player-created promoted threats in MVP.", visualDifference: "Barklike lattice follows the existing back/flank load path; same head, limb count, scale class, and carried-ecology identity." }),
    ], promotedThreat: noPromotion("Its exceptional route-making remains an authored ecology/Aberrant incident, not a player-created survivor system; persisting one massive grazer would duplicate herd/route state."),
    harvestAndConsequence: "Shed Sinkroot Fiber, soil culture, and seed are regenerative takes. Cutting the living mat is functional harvest; killing the animal removes a mobile sink and reseeding route and may displace the herd.", visualContinuity: "Keep the same massive quadruped, shoulder line, head, and carried-mat footprint. Adaptation follows load-bearing and filtration anatomy. Predator teeth, extra legs, and generalized combat armor are prohibited.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 3, newHeroImages: 0, comparisonReferencesReused: 0, heroRequired: false, priority: "P1", aspectRatio: "4:5 state reference", direction: "Three matched 3/4 load-bearing profiles on neutral Belt ground; carried ecology and scale marker remain constant." },
  },
  {
    slug: "glasswing-kite", kind: "CREATURE", title: "Glasswing Kite", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "NONE", mutationEligibility: "NONE", aberrantStatus: "NONE", tierReason: "Its mineralized aerodynamic anatomy is already a fixed regional specialization. Dynamic stages would duplicate its clear warning niche and burden a fragile flight silhouette without new strategic value.",
    distribution: ["SHATTERCORE", "MUTATION_BELT", "CROWN_BREAK"], saturationTolerance: "HIGH", bloomstormBehaviors: ["WARNS", "MIGRATES vertically/downwind", "FEEDS during Aftermath", "does not dynamically mutate"],
    overview: ["Glasswing Kites are small predatory/scavenging Beasts with translucent mineralized wing struts. The struts ring and flex before pressure changes, making flock altitude and sound a practical Bloomstorm warning.", "Their Blackbloom form is fixed. Individuals can be injured, overloaded, or malformed by exposure, but they do not progress through Adaptive Mutation states."],
    dietAndRole: "They take insects, small carrion, and exposed charge tissue around vents and storm aftermaths, then carry nutrients between Shattercore roosts and Belt feeding ground.", relationships: "Flocks follow vent ecology and larger-animal carcasses. Rare authored Aberrants may shepherd a flock, but an ordinary kite is not eligible for survivor promotion.", floraAndAbsorption: "Roost guano and shed mineral barbs seed small charged niches; active nests can amplify local spell instability without being a saturation source.", reactorRelationship: "Venting and Purge change lift, pressure, and feeding opportunities; flock behavior is evidence of the transfer.", combatFamilies: [],
    states: [state({ key: "fixed-glasswing", name: "Canonical Glasswing", frequency: "COMMON", physicalChanges: "One fixed aerodynamic Blackbloom form with translucent mineral struts and a light predatory body.", function: "Pressure warning, aerial scavenging, and precision movement.", behavior: "Circles, rings, climbs, drops, or flees according to air pressure and food.", combat: "Low threat alone; a storm-driven flock creates cutting barbs, obscured airspace, and charge risk.", triggers: "Regional development, not runtime mutation.", saturation: "High tolerance does not equal mutation capability.", bloomstorm: "Warns before Onset, avoids Peak where possible, and feeds in Aftermath.", reactor: "Tracks vent-driven air rather than reactor labels.", reversibility: "Not applicable.", persistence: "Ordinary flock encounter only.", visualDifference: "Single canonical image establishes an elegant, aerodynamic silhouette; no staged variants." })],
    promotedThreat: noPromotion("Exceptional flock leaders are authored Aberrant events, not persistent ordinary survivors."), harvestAndConsequence: "Shed struts are the preferred regenerative take. Nest stripping can trigger a flock discharge and removes a warning population; carcasses leave sharp contaminated barbs that attract scavengers.", visualContinuity: "One aerodynamic design. Heavy armor, extra wings, tentacles, giant talons, and decorative glow are prohibited.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 0, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P2", aspectRatio: "16:9 hero", direction: "One elegant flock/individual hero at a readable 3/4 banking angle against restrained Crown Break pressure." },
  },
  {
    slug: "mirejaw", kind: "CREATURE", title: "Mirejaw", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "FUNCTIONAL_ADAPTIVE", mutationEligibility: "FUNCTIONAL_ADAPTIVE", aberrantStatus: "CANDIDATE", tierReason: "Its jaw filtration, flow-defined territory, and marsh chemistry make one meaningful functional path legible. Three states add hydrology, defense, and hunting choices without creating a shapeshifting super-predator.",
    distribution: ["LIVING_MARSH", "BLACKWEIR", "DROWNED_INTAKE", "conditional Reedless channels"], saturationTolerance: "HIGH", bloomstormBehaviors: ["SHELTERS below root shelves", "HUNTS displaced prey during Decay", "MUTATES only after accumulated exposure", "changes territory with flow"],
    overview: ["Mirejaws are marsh Beasts whose flexible jaw plates spread into a root-colored intake fan. They draw prey and contaminated water across filtration tissue before striking.", "A Mirejaw defends a flow pattern rather than a fixed nest. Learning which cut it maintains is more useful than searching for a lair."],
    dietAndRole: "They take fish, Sump Eels, wading animals, carrion, and anything forced through a defended channel. Filtering while feeding removes some contaminated biomass.", relationships: "Dominant individuals suppress smaller ambush predators. [[old-drowner]] can erase or move their territories by changing depth. Removing one opens its flow to scavengers and juvenile predators.", floraAndAbsorption: "Mirejaws avoid healthy protected sink beds but use damaged filtration edges where prey gathers. Their filter organs retain load; corpses can release it and attract Sump Eels.", reactorRelationship: "Old cooling/intake transfers alter water chemistry and depth. Mirejaws respond when that water arrives, not when a remote reactor state begins.", combatFamilies: ["PHYSICAL", "TOXIC_ENVIRONMENTAL", "DEFENSIVE"],
    states: [
      state({ key: "flow-reader", name: "Flow-Reader", frequency: "COMMON", physicalChanges: "Canonical low marsh predator with flexible intake-fan jaw plates, root-toned hide, and strong amphibious limbs/tail.", function: "Filters water and detects prey/contamination through flow.", behavior: "Maintains one feeding cut and avoids protected sink ground.", combat: "Ambush pull and lateral strike; loses advantage away from water/cover.", triggers: "Normal Living Marsh ecology.", saturation: "Comfortable through Active pressure.", bloomstorm: "Drops below root shelves during Warning.", reactor: "Relocates after downstream flow changes.", reversibility: "Baseline.", persistence: "Common territorial encounter.", visualDifference: "Establishes skull, jaw-plate count, four-limb amphibious plan, tail, hide pattern, and adult scale." }),
      state({ key: "silt-veiled", name: "Silt-Veiled", frequency: "CONDITIONAL", physicalChanges: "Filter tissue darkens and folds tight, skin chromatophores copy the current substrate, and a mucus film seals vulnerable gill/fan surfaces.", function: "Survives sudden chemistry changes and hides while the channel is unstable.", behavior: "Abandons open strike posture, shadows cover, and follows clean-water seams.", combat: "Harder to detect and resistant to environmental toxins, but the sealed fan shortens its pull range.", triggers: "Surge chemistry, damaged filtration, or storm Onset.", saturation: "Acute exposure response.", bloomstorm: "Shelter state during Onset/Peak; hunts only as Decay begins.", reactor: "Can follow contaminated cooling runoff.", reversibility: "Mucus/chromatophore response regresses when water stabilizes.", persistence: "Not retained for ordinary individuals.", visualDifference: "Same silhouette with closed fan, dark silt film, substrate-matched hide, and low shelter posture." }),
      state({ key: "weir-plated", name: "Weir-Plated", frequency: "UNCOMMON", physicalChanges: "Jaw plates overlap into a tougher intake rim, limb webbing broadens, and mineral-root scutes form only along shoulders, jaw hinge, and anchoring tail.", function: "Holds position in fast contaminated cuts and continues filtering where ordinary Mirejaws withdraw.", behavior: "Claims damaged high-flow territory and may build temporary debris/root baffles that change traversal.", combat: "Improved frontal defense, current-assisted pull, and anchored resistance; exposed flanks and reduced land speed remain counters.", triggers: "Repeated Surge exposure in damaged filtration or intake channels.", saturation: "Functional accumulated adaptation, capped below Bloom-evolved.", bloomstorm: "Can hunt displaced prey during Decay/Aftermath but still avoids Peak surface water.", reactor: "Weighted by repeated Drowned Intake or purge-flow disturbance.", reversibility: "Structural and persistent for the individual.", persistence: "Uncommon variant; retained by promoted threats.", visualDifference: "Scutes follow existing load points; jaw, limb count, tail, hide identity, and scale remain clearly Mirejaw." }),
    ],
    promotedThreat: { eligible: true, conditions: ["Weir-Plated state", "survives a meaningful fight and escapes through connected water", "territory is stressed by harvest/flow change", "regional/per-cell cap open"], naming: "Hydrology-based Warden epithet tied to a cut, wake, scar, or feeding sign.", atlas: "Disturbed banks, missing prey, and altered current yield a fuzzy tracked water range; exact fixes decay quickly.", persistence: "Identity, scarring, home/current flow cells, and one state persist across sessions.", death: "Permanent for the individual; its territory opens and the predator/carrion consequence is applied." },
    harvestAndConsequence: "Teeth, hide, jaw plate, and filter organs are valuable. The filter holds contamination, so careless corpse harvest can release load; killing a dominant animal alters predator boundaries rather than directly changing the saturation meter.", visualContinuity: "Same broad skull, jaw-plate count, amphibious limb plan, tail, hide markings, and scale. Scutes and webbing follow hydrological function; crocodile shorthand, extra jaws, and random dorsal spikes are prohibited.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 3, newHeroImages: 0, comparisonReferencesReused: 0, heroRequired: false, priority: "P1", aspectRatio: "4:5 state reference", direction: "Three matched waterline 3/4 profiles with identical jaw landmarks and a depth/scale marker." },
  },
  {
    slug: "sump-eel", kind: "CREATURE", title: "Sump Eel", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "MINOR_ADAPTIVE", mutationEligibility: "MINOR_ADAPTIVE", aberrantStatus: "NONE", tierReason: "Its conductive scavenger anatomy supports one bounded charge/water-chemistry adaptation with real gameplay value. A larger state tree would overdesign a group utility species.",
    distribution: ["SHATTERCORE drainage", "LIVING_MARSH", "DROWNED_INTAKE", "BLACKWEIR"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["FEEDS on exposed charged residue", "MIGRATES through water networks", "BECOMES_MORE_ACTIVE during Decay/Aftermath", "minor adaptation only"],
    overview: ["Sump Eels are conductive scavenging Beasts that link Southreach drains to marsh channels. They consume industrial residue and carrion while storing short electrical/Essence charge in specialized tissue.", "They are dangerous as a circuit: several animals can bridge live conductors or wake dormant sensors even when no individual intends an attack."],
    dietAndRole: "Industrial sludge, charged microbial films, carrion, shed capacitor tissue, and small aquatic prey. Their scavenging removes hazardous residue from narrow systems.", relationships: "Mirejaws prey on them; carcasses and failed harvest attract larger runs. Switchmother/Splicefield discharges can redirect migration without controlling the animals.", floraAndAbsorption: "They consume residue around filtration edges but can dump stored charge into a stressed sink. Overharvest removes waste scavengers and food for marsh predators.", reactorRelationship: "Restart and Venting energize drains and sensors, creating feeding routes. Purge can push whole runs south.", combatFamilies: [],
    states: [
      state({ key: "sump-scavenger", name: "Sump Scavenger", frequency: "COMMON", physicalChanges: "Canonical eel body with modest capacitor bands, lateral-line nodes, conductive oil, and contaminated-water protective mucus.", function: "Scavenges residue and carries brief charge.", behavior: "Runs in loose groups between drains and channels.", combat: "Group circuit completion creates the main hazard.", triggers: "Normal Bloomfall water network.", saturation: "Extreme tolerance is mostly fixed physiology.", bloomstorm: "Moves toward charged runoff after Peak.", reactor: "Follows energized drainage.", reversibility: "Baseline.", persistence: "Common group encounter.", visualDifference: "Establishes body length, fin placement, head, band spacing, and oil sheen." }),
      state({ key: "deep-charge", name: "Deep-Charge", frequency: "UNCOMMON", physicalChanges: "Capacitor bands thicken slightly, lateral-line nodes enlarge, and the mucus becomes darker and more insulating without changing the eel silhouette.", function: "Stores a larger short-lived charge and reads electrical gradients through heavily contaminated water.", behavior: "Runs tighten around conductors and occupy deeper energized channels.", combat: "One stronger group discharge and improved electrical tolerance; still fragile out of water and after discharge.", triggers: "Repeated Surge exposure in energized drains or Bloomstorm aftermath water.", saturation: "Bounded minor adaptation; no Exposed or Bloom-evolved stage.", bloomstorm: "Most common in Decay/Aftermath, when exposed charge reaches water.", reactor: "Restart/Venting can establish the charged habitat but do not guarantee the state.", reversibility: "Enlarged tissue persists through the encounter/season; ordinary individuals are not saved.", persistence: "Uncommon encounter variant only.", visualDifference: "Same length, fins, head, and band layout; only band depth, node size, mucus color, and charge posture change." }),
    ], promotedThreat: noPromotion("The meaningful unit is a run/group and its circuit. Persisting a single player-created eel would add bookkeeping without a recognizable regional antagonist."),
    harvestAndConsequence: "Capacitor Tissue and conductive oil decay quickly. Harvesting a run can remove a dangerous circuit but also a residue scavenger and Mirejaw prey source; improperly discharged corpses shock workers and stressed roots.", visualContinuity: "Keep the exact eel body, fin count, lateral-line layout, and band spacing. No limbs, jaws, armor shells, or electric-monster glow.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 2, newHeroImages: 0, comparisonReferencesReused: 0, heroRequired: false, priority: "P2", aspectRatio: "4:5 state reference", direction: "Two matched lateral/3/4 aquatic reference views with identical scale and band map." },
  },
  {
    slug: "spore-lantern-colony", kind: "CREATURE", title: "Spore Lantern Colony", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "NONE", mutationEligibility: "NONE", aberrantStatus: "NONE", tierReason: "The colony already changes brightness, spore release, and stored load as ordinary physiology. Treating those load states as mutation would confuse an environmental indicator with Adaptive Mutation and force a stationary organism into a creature ladder.",
    distribution: ["LIVING_MARSH", "LANTERN_POOLS"], saturationTolerance: "MODERATE", bloomstormBehaviors: ["BECOMES_DORMANT during severe pressure", "releases spores/load when disturbed", "resumes signaling in Aftermath", "does not dynamically mutate"],
    overview: ["Spore Lantern Colonies are sessile animal-fungal-algal symbioses filed under Beasts, not a race. Tiny animals house partners in a shared luminous structure that binds trace Essence and responds to water chemistry.", "Brightness, dormancy, warning waves, and spore release are physiological load states. They are not Adaptive Mutation stages."],
    dietAndRole: "They filter dissolved nutrients and trace contamination while providing light/food cues that gather grazers, insects, and predators around Lantern Pools.", relationships: "Grazers and insects feed around the colonies; predators use the light to hunt. Whole-pool warning patterns can be an authored exceptional colony event without creating a promoted individual.", floraAndAbsorption: "Colonies support [[quietwater-culture]] and local low-free saturation. Removing a whole colony reduces stabilization; overload can release what it stored.", reactorRelationship: "Only downstream chemistry/pressure transfers matter; remote machinery has no direct command over a colony.", combatFamilies: [],
    states: [state({ key: "fixed-lantern-colony", name: "Canonical Lantern Colony", frequency: "COMMON", physicalChanges: "One fixed colonial anatomy with lantern shells, animal pores, fungal/algal tissue, and anchored substrate.", function: "Trace binding, signaling, and habitat support.", behavior: "Glows, dims, pulses, sporulates, or goes dormant as ordinary physiology.", combat: "Low threat unless disturbed/overloaded, when spores and stored charge release.", triggers: "Physiological response, not mutation.", saturation: "Stable at Residual/Active; stressed by sustained Surge.", bloomstorm: "Dims/dorms through Peak and may pulse/release in Decay.", reactor: "Responds only to arriving water chemistry.", reversibility: "Load behaviors are reversible if the culture survives.", persistence: "POI/cell ecology, not persistent creature identity.", visualDifference: "One canonical anatomy; brightness alone never implies a mutation state." })],
    promotedThreat: noPromotion("Exceptional whole-pool signaling is an authored ecology event, not a survivor promotion."), harvestAndConsequence: "Nonlethal samples and shed lantern shells are acceptable. Whole-colony removal destabilizes Quietwater Culture; harvested/overloaded tissue can release a concentrated pulse and attract scavengers.", visualContinuity: "One colony design with clear animal pores, fungal/algal partnership, and substrate. Avoid mushroom-person anatomy, giant predatory mouths, and neon theme-park glow.", specialMechanic: "PHYSIOLOGICAL_LOAD_STATE: brightness, dormancy, spore release, and warning pulses belong to Marsh Absorption/presentation, not Adaptive Mutation.",
    image: { existingV3AssetId: "the-living-marsh-night", existingUse: "Owner-approved Lantern Pools environment support; not a species profile.", newStateReferences: 0, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P2", aspectRatio: "16:9 hero", direction: "One close ecological hero/profile grounded in the existing V3 Lantern Pools environment language." },
  },
  {
    slug: "latchhound", kind: "CREATURE", title: "Latchhound", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "ADVANCED_ADAPTIVE", mutationEligibility: "ADVANCED_ADAPTIVE", aberrantStatus: "CANDIDATE", tierReason: "Its flexible pack hunting, machinery contact, conductive jaw, and cable-tendon anatomy support the strongest combat/environment response after the Hart. The path remains finite and never becomes Switchmother's engineered grid role.",
    distribution: ["SHATTERCORE utility corridors", "MUTATION_BELT", "SPLICEFIELD_SUBSTATION"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["SHELTERS inside infrastructure", "HUNTS displaced prey", "BECOMES_MORE_ACTIVE on energized routes", "MUTATES when eligible"],
    overview: ["Latchhounds are Blackbloom Beasts variants whose conductive jaw plates and cablelike tendons let a pack map vibration, heat, and current through machinery. They hunt as a distributed alarm circuit, not ordinary dogs with metal teeth.", "Their advanced response specializes the same quadruped for powered terrain, pack relay, and bounded survived-damage counterplay."],
    dietAndRole: "They take small fauna, separated harts, carrion, charged tissue, insulation, and warm machine residue. Packs keep some utility corridors clear of smaller scavengers while making them dangerous to people.", relationships: "[[switchmother]] discharges shape pack routes without proving command. Packs pursue Hart migrations near powered ground and compete with Sump Eels for charged residue.", floraAndAbsorption: "They tear conductive growth to reach machines and can bridge or sever grid ecology. A dead latched animal dumps charge into nearby roots, packmates, or harvesters.", reactorRelationship: "Sector Restart opens heat/current maps; Venting drives them into shelter or newly charged corridors; Dormant states push them outward to forage.", combatFamilies: ["ELECTRICAL", "PHYSICAL", "THERMAL", "MOBILITY"],
    states: [
      state({ key: "corridor-latcher", name: "Corridor Latcher", frequency: "COMMON", physicalChanges: "Canonical lean quadruped with one conductive jaw plate, cablelike tendons, gripping claws, and restrained charge tissue.", function: "Reads machinery and shares local vibration/current through a pack.", behavior: "Latches, listens, triangulates, and ambushes intruders near active systems.", combat: "Pack sensing and a bite-delivered discharge; isolation from infrastructure reduces coordination.", triggers: "Normal Shattercore/Splicefield ecology.", saturation: "Stable through Active and tolerant of Surge.", bloomstorm: "Shelters in infrastructure and hunts displaced prey after Peak.", reactor: "Activity follows powered corridors.", reversibility: "Baseline regional form.", persistence: "Common encounter form.", visualDifference: "Establishes canine skull, four limbs, jaw-plate outline, tendon paths, claw count, coat/tissue identity, and scale." }),
      state({ key: "live-latched", name: "Live-Latched", frequency: "CONDITIONAL", physicalChanges: "Jaw seams open for heat shedding, tendons become taut/visible, sensory tissue around ears/feet swells, and contact pads darken.", function: "Maps a rapidly changing live circuit and dumps unsafe heat/charge.", behavior: "Packs hold contact longer, communicate through structure, and relocate as one when current shifts.", combat: "Faster shared reactions and stronger latch shock, but forced disconnection/grounding disrupts the whole pack.", triggers: "Restart current, Surge, Bloomstorm Onset, or prolonged contact with an overloaded system.", saturation: "Acute exposed state.", bloomstorm: "Common in protected powered interiors during Onset/Peak.", reactor: "Strongly weighted to Sector Restart and Overflow corridors.", reversibility: "Regresses after cooling/grounding.", persistence: "Not saved for ordinary individuals.", visualDifference: "Same silhouette with open jaw vents, taut original tendon paths, swollen pads, and hot defensive posture." }),
      state({ key: "circuit-stalker", name: "Circuit Stalker", frequency: "UNCOMMON", physicalChanges: "Insulating foot pads broaden, claws split for cable trays and vertical surfaces, jaw resonance chambers deepen, and shoulder tendons brace without adding limbs.", function: "Traverses complex powered terrain and attacks across a chosen circuit path.", behavior: "Uses walls, gantries, and cable routes to flank while keeping pack contact.", combat: "Improved terrain mobility and directed discharge; insulation is vulnerable to cutting/chemical damage and open ground removes its route advantage.", triggers: "Repeated high-pressure hunting in powered infrastructure; one supported Physical, Electrical, or Thermal stress imprint may choose the matching authored tissue emphasis for a promoted survivor.", saturation: "Functional accumulated adaptation.", bloomstorm: "Can exploit protected structures through Decay/Aftermath.", reactor: "Repeated Restarts establish the habitat history.", reversibility: "Structural for the individual.", persistence: "Uncommon encounter variant; retained by promoted threats.", visualDifference: "Same quadruped and jaw plate; pad/claw/shoulder changes follow contact and load paths, not decorative armor." }),
      state({ key: "pack-relay", name: "Pack Relay", frequency: "RARE", physicalChanges: "Paired dorsal sensory-tendon fans rise from existing shoulder paths, capacitor sacs deepen along the ribs, and the jaw plate broadens within the original skull outline.", function: "Coordinates a pack across several connected machines and stores one large shared-route discharge.", behavior: "Becomes a mobile relay, directing pack positions and retreat rather than simply charging the player.", combat: "Enables coordinated multi-angle attacks and one telegraphed network discharge; severing it from pack/infrastructure leaves it depleted and exposed.", triggers: "Prolonged Surge/Bloomstorm-edge survival in a stable grid ecology or promoted-survivor progression.", saturation: "Rare Bloom-evolved expression.", bloomstorm: "May lead packs through energized Aftermath corridors.", reactor: "Most likely in repeatedly restarted/overflowed networks, never guaranteed by one cycle.", reversibility: "Permanent structural expression.", persistence: "Rare spawn or promoted persistent threat; remains below Switchmother's unique engineered integration.", visualDifference: "Dorsal fans are sensory tendon continuations, not extra limbs; skull, four-leg stance, coat/tissue pattern, and jaw lineage remain recognizable." }),
    ],
    promotedThreat: { eligible: true, conditions: ["Circuit Stalker or Pack Relay state", "survives a sustained player encounter while latched and escapes with part of its pack", "one supported stress imprint maximum", "grid-bound home cell and open cap"], naming: "Warden/crew epithet derived from the circuit, scar, missing plate, or repeated hunting method.", atlas: "False sensor wakes, bite marks, shed insulation, and synchronized outages create tracked infrastructure ranges.", persistence: "Identity, state, one stress imprint, scars, pack-role summary, and home/current grid cells persist.", death: "Permanent for that individual. Pack coordination and local grid/carrion consequences resolve; no same-name respawn." },
    harvestAndConsequence: "Jaw plates, sensory tendons, and capacitor tissue are valuable. Killing one while latched can arc through the pack/grid; removing a relay can make a corridor safer while scattering hungry packmates into nearby cells.", visualContinuity: "Every state keeps the same canine skull, four limbs, scale, jaw-plate lineage, tendon map, and identifying coat/tissue pattern. No extra heads/legs, random cable tentacles, generic spikes, or robot conversion.", specialMechanic: null,
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 4, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P0", aspectRatio: "4:5 state reference; 16:9 hero", direction: "Four matched 3/4 quadruped profiles plus one Splicefield pack hero. Lock skull, jaw plate, tendon paths, and coat marks." },
  },
  {
    slug: "bloommarked-remnant", kind: "CREATURE", title: "Bloommarked Remnant", taxonomyParent: "human", taxonomyCategory: "natural",
    classification: "NONE", mutationEligibility: "NONE", aberrantStatus: "NONE", tierReason: "This is a narrow human-derived field classification, not a species or progression path. A dynamic ladder would gamify uncertain personhood and risk merging environmental alteration with Seven-Phase Corruption.",
    distribution: ["SHATTERCORE", "MUTATION_BELT", "former Southreach routes"], saturationTolerance: "VARIABLE", bloomstormBehaviors: ["case-specific: may SHELTER, repeat familiar routes, or approach machinery", "never receives a universal mutation behavior"],
    overview: ["Bloommarked Remnant is a Human field classification used only when severe Blackbloom alteration has disrupted reliable communication and ordinary survival behavior. It is not a race, loot category, diagnosis of lost personhood, or Abomination.", "Field teams must test recognition, language, intent, distress, and learned routine. Environmental Blackbloom state and soul-level [[the-seven-phases-of-corruption]] remain separate even if one person carries both."],
    dietAndRole: "No universal diet or ecological role exists. Individuals may forage, use remembered stores, repeat work routines, or defend a saturation source; treating those behaviors as species instincts is prohibited.", relationships: "Other fauna may avoid, follow, or prey on an individual according to behavior. [[the-last-shift]] demonstrates why repeated routine cannot settle consciousness.", floraAndAbsorption: "Exposure can integrate tissue with local growth or machinery, but this is fixed case history rather than selectable Adaptive Mutation.", reactorRelationship: "Some individuals respond to old alarms, shifts, credentials, or powered machinery; that evidence belongs to the person's history, not a species rule.", combatFamilies: [],
    states: [state({ key: "fixed-case-phenotype", name: "Documented Individual", frequency: "UNIQUE", physicalChanges: "Case-specific permanent Blackbloom alteration retaining human lineage and recognizable personal evidence where possible.", function: "No universal adaptive function is assigned.", behavior: "Assessment is individual: recognition, language, routine, fear, distress, defense, and intent.", combat: "No generic Remnant combat package. Hostility must be authored/observed, not inferred from appearance.", triggers: "Historical exposure case, not runtime state progression.", saturation: "Tolerance and response are variable.", bloomstorm: "Individual behavior only; no universal MUTATES flag.", reactor: "May respond to personally familiar systems.", reversibility: "Unknown/case-specific; no gameplay regression ladder.", persistence: "Named/authored individuals only, not a spawn-state pipeline.", visualDifference: "One respectful case image retaining human anatomy, clothing/history, and uncertainty; no generic escalating body-horror gallery." })],
    promotedThreat: noPromotion("Exceptional Human-derived cases require authored identity and ethical review; player combat cannot manufacture a named Remnant through the generic survivor system."), harvestAndConsequence: "No lawful material harvest. Recovery is forensic, medical, and historical. Corpses/remains are evidence and possible persons, not resource nodes.", visualContinuity: "Human lineage, personal clothing/equipment, and recognizable pre-exposure evidence remain primary. Abomination anatomy, phase imagery, trophy framing, and gratuitous gore are prohibited.", specialMechanic: "CASE_SPECIFIC_BLACKBLOOM_EXPOSURE: fixed individual history; explicitly not Adaptive Mutation and not Seven-Phase Corruption.",
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 0, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P3", aspectRatio: "16:9 hero", direction: "One restrained forensic/human-context image, not a monster portrait. Preserve personhood uncertainty and avoid an escalation gallery." },
  },
  {
    slug: "the-bellwether", kind: "CREATURE", title: "The Bellwether", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "EXCEPTIONAL_ABERRANT", mutationEligibility: "ADVANCED_ADAPTIVE", aberrantStatus: "NAMED_CANON", tierReason: "A named Hart-lineage Aberrant whose field changes migration and existing trait expression across other animals. It is already beyond normal species behavior and does not need five arbitrary forms.",
    distribution: ["LONG_GRAZE", "MUTATION_BELT range-roamer"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["ROAMS along pressure boundaries", "redirects herds", "may remain active through Decay", "does not automatically escalate further"],
    overview: ["The Bellwether is a named Beasts-lineage Aberrant arising from the Blackbloom Hart line. Its mobile scent, low-frequency vibration, and saturation discharge change herd/predator movement and bias which already-authored traits express nearby.", "It is an ecological amplifier, not a giant deer boss, hive-mind controller, or proof that every Hart becomes one."],
    dietAndRole: "It retains grazing-lineage feeding but chooses mineral/pressure lines that reorganize whole migration networks.", relationships: "Harts, Rootback Grazers, and predators react to its field. [[mara-quill]] tracks those effects more reliably than the body itself.", floraAndAbsorption: "Its migration can move grazing/seed pressure and expose or abandon local sinks; it redistributes ecology rather than generating Essence.", reactorRelationship: "Venting/Purge transfers can change its range. It follows evidence reaching the Belt, not the reactor command state.", combatFamilies: [],
    states: [state({ key: "bellwether-final", name: "Bellwether", frequency: "UNIQUE", physicalChanges: "Exceptional Hart-lineage antler membrane, charge-routing tissue, scars, and mature field-producing anatomy consistent with the owner-approved hero.", function: "Amplifies migration signals and existing mutation-family expression in nearby eligible animals.", behavior: "Range-roams, redirects herds, avoids/engages according to route pressure, and can be tracked through ecological absence.", combat: "Regional danger comes from herd/predator coordination and route collapse; direct combat is only one resolution.", triggers: "Unique history beyond normal Hart progression; not reproduced by a generic spawn roll.", saturation: "Extreme tolerance and field use; does not create total regional saturation.", bloomstorm: "Moves along/through Decay boundaries when its route supports it.", reactor: "Range shifts after declared downstream transfers.", reversibility: "No regression to ordinary Hart state.", persistence: "Named world-authoritative threat.", visualDifference: "Current final hero remains authoritative; comparison uses the new Hart baseline rather than invented intermediate Bellwether forms." })],
    promotedThreat: noPromotion("Already a named canonical Aberrant with its own life/activity policy."), harvestAndConsequence: "Observation and nonlethal sampling are preferred. Lethal harvest would remove a migration signal network and trigger a persistent ecological consequence; its final killability remains owner/content gated.", visualContinuity: "Preserve the existing V3 anatomy and scale. The new Hart baseline must make lineage visible without reducing Bellwether to an oversized Hart.", specialMechanic: "ECOLOGICAL_AMPLIFIER: influences movement and authored trait weights; no uncontrolled species mutation and no further automatic anatomy stage.",
    image: { existingV3AssetId: "the-bellwether", existingUse: "Owner-approved final Aberrant hero.", newStateReferences: 0, newHeroImages: 0, comparisonReferencesReused: 1, heroRequired: true, priority: "P0", aspectRatio: "16:9 hero", direction: "Reuse the V3 hero. Pair it with the new Blackbloom Hart baseline reference; do not regenerate or invent a five-stage Bellwether gallery." },
  },
  {
    slug: "switchmother", kind: "CREATURE", title: "Switchmother", taxonomyParent: "monstrosities", taxonomyCategory: "monstrosity",
    classification: "EXCEPTIONAL_ABERRANT", mutationEligibility: "NONE", aberrantStatus: "NAMED_CANON", tierReason: "Her underlying origin is Monstrosity and her current form is a unique Blackbloom/infrastructure interaction. Treating her as a natural adaptive species would erase engineered provenance and duplicate Latchhound progression.",
    distribution: ["SPLICEFIELD_SUBSTATION site-anchored", "linked grid only during authored events"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["BECOMES_MORE_ACTIVE when the grid stores storm charge", "routes current", "remains site-anchored", "does not use ordinary mutation states"],
    overview: ["Switchmother is Monstrosity plus named Aberrant, never Abomination. Engineered-origin tissue, insulating plates, brood structures, and old switchgear are joined to Splicefield's living infrastructure.", "Her body opens and closes current paths as feeding and defense. Whether she controls the yard or occupies a larger grid ecology remains unresolved."],
    dietAndRole: "Consumes charge, conductive biomass, industrial material, and possibly prey delivered through the yard. It can stabilize one branch by overloading another.", relationships: "Latchhound packs follow discharges without proving obedience. Sump Eel runs and conductive growth compete for charge paths around the site's wet edges.", floraAndAbsorption: "Integrated vines/tissue store and route charge but are not Marsh absorption. Extracting them changes infrastructure state.", reactorRelationship: "Restart, Overflow, and Mender repair can energize linked Splicefield paths; activity changes, not species stage.", combatFamilies: [],
    states: [state({ key: "switchmother-final", name: "Switchmother", frequency: "UNIQUE", physicalChanges: "Owner-approved engineered flesh, insulating plates, brood chambers, and switchgear integration anchored to the yard.", function: "Routes charge through a biological-industrial network.", behavior: "Opens/closes paths, feeds, defends, and redistributes load through site connections.", combat: "Infrastructure-coupled threat; cutting power/path changes the encounter more meaningfully than a mutation counter.", triggers: "Unique engineered origin plus Blackbloom integration and long Splicefield residence.", saturation: "Extreme tolerance, with activity driven by available charge.", bloomstorm: "Stores/routes storm charge and may expand activity along the site network.", reactor: "Strong direct grid binding to linked Restart/Overflow events.", reversibility: "No ordinary regression.", persistence: "Named site-anchored world threat.", visualDifference: "Existing V3 final form is locked; a new engineered-origin reference shows provenance without claiming an exact pre-Bloomfall individual." })],
    promotedThreat: noPromotion("Already a unique named Monstrosity/Aberrant."), harvestAndConsequence: "Capacitor tissue and integrated switch alloys are valuable, but lethal extraction can destabilize Splicefield and linked reactor routing. A corpse is an infrastructure failure, not a loot pinata.", visualContinuity: "Preserve V3 body/switchgear layout. The engineered reference must share material and structural anchors without implying she was a natural animal. Abomination imagery and generic flesh-heap redesign are prohibited.", specialMechanic: "ENGINEERED_GRID_INTEGRATION: activity/network growth is a unique infrastructure behavior, not Adaptive Mutation eligibility.",
    image: { existingV3AssetId: "switchmother", existingUse: "Owner-approved final Aberrant hero.", newStateReferences: 1, newHeroImages: 0, comparisonReferencesReused: 0, heroRequired: true, priority: "P1", aspectRatio: "4:5 state reference; 16:9 hero", direction: "Reuse final V3 hero. Add one clearly labeled engineered-origin structural reference using shared plates/tissue anchors, not a speculative natural juvenile." },
  },
  {
    slug: "old-drowner", kind: "CREATURE", title: "Old Drowner", taxonomyParent: "beasts", taxonomyCategory: "natural",
    classification: "EXCEPTIONAL_ABERRANT", mutationEligibility: "NONE", aberrantStatus: "NAMED_CANON", tierReason: "A unique long-lived Beasts-lineage marsh megafauna whose hydrological function exceeds normal species behavior. The base species is unresolved, so assigning a reusable adaptive ladder would fabricate taxonomy.",
    distribution: ["LIVING_MARSH flow territory", "DROWNED_INTAKE", "REEDLESS_MILE"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["ANCHORS", "moves within flow territory", "redirects contaminated water", "may FEED/HUNT in Aftermath"],
    overview: ["Old Drowner is named Beasts-lineage Aberrant megafauna, not a generic giant crocodile. Broad filter plates, weighted root growth, and anchoring anatomy let it dam channels, scour cuts, and alter tidal exchange.", "Its territory is a hydrological system. It can attack a boat by removing or redirecting the water the boat expected to use."],
    dietAndRole: "Takes large marsh prey, carrion, and contaminated biomass while filtering and storing load through its territory.", relationships: "Displaces Mirejaws and shapes Sump Eel routes. Marsh predators follow the channels it opens and avoid the ones it drains.", floraAndAbsorption: "Root/filter structures store load and maintain some channel boundaries. Killing it may reopen access while releasing bound contamination toward the ocean.", reactorRelationship: "Old intake/cooling transfers can change its territory; no remote state directly enrages it.", combatFamilies: [],
    states: [state({ key: "old-drowner-final", name: "Old Drowner", frequency: "UNIQUE", physicalChanges: "Broad filter plates, weighted root growth, low anchoring body, and severe long-term marsh scarring on an unresolved Beasts-lineage frame.", function: "Engineers flow, depth, and contamination boundaries.", behavior: "Flow-territorial movement, ambush, channel damming, and route denial.", combat: "Hydrology and anchoring are the encounter; direct damage risks releasing stored load.", triggers: "Unique long exposure/survival history; no generic progression assigned.", saturation: "Extreme tolerance with significant bound load.", bloomstorm: "Anchors or moves to redirect storm water; activity follows actual flow.", reactor: "Responds when downstream transfer reaches its system.", reversibility: "No ordinary regression.", persistence: "Named world-authoritative threat.", visualDifference: "Future final hero and labeled lineage reconstruction must share skull/limb/load landmarks while keeping the exact ancestral species uncertain." })],
    promotedThreat: noPromotion("Already a unique named threat; the unresolved base lineage is not available to the generic survivor system."), harvestAndConsequence: "Armor/filter plates are valuable, but killing/stripping the body can release stored Blackbloom and collapse hydrological containment. Life policy and ocean consequence remain owner-gated.", visualContinuity: "Do not depict a giant crocodile. Establish a distinctive low marsh megafauna anatomy; reconstruction and final form share landmarks and clearly label uncertainty.", specialMechanic: "HYDROLOGICAL_TERRITORY_ENGINEER: unique long-term adaptation; no ordinary species ladder.",
    image: { existingV3AssetId: null, existingUse: null, newStateReferences: 1, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P1", aspectRatio: "4:5 state reference; 16:9 hero", direction: "One labeled probable-lineage reconstruction and one final Drowned Intake hero. Keep ancestry uncertain and avoid crocodile shorthand." },
  },
  {
    slug: "the-last-shift", kind: "CREATURE", title: "The Last Shift", taxonomyParent: "human", taxonomyCategory: "natural",
    classification: "EXCEPTIONAL_ABERRANT", mutationEligibility: "NONE", aberrantStatus: "NAMED_CANON", tierReason: "A unique Human-origin machine-organic collective incident with unresolved consciousness. Ordinary mutation states would erase identity, imply a repeatable species, and blur Blackbloom with Abomination progression.",
    distribution: ["SOUTHREACH_COMPLEX", "SHATTERCORE emergency routes", "REDLINE_SHELTER_SIX during events"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["BECOMES_MORE_ACTIVE around emergency systems", "SHELTERS/continues procedure according to route", "does not use ordinary Adaptive Mutation"],
    overview: ["The Last Shift is a coordinated Human-origin machine-organic Aberrant composed of former workers, protective equipment, maintenance systems, and Blackbloom growth. Human records establish origin without settling current personhood.", "It recognizes machinery, repeats workplace fragments, attempts emergency procedures, and has responded to names and credentials. Individual consciousness, shared consciousness, behavioral echo, and facility control all remain unresolved. It is never an Abomination by default."],
    dietAndRole: "No animal diet/ecological role is assigned. It maintains, carries, seals, dismantles, and routes industrial material according to damaged emergency procedure.", relationships: "Mender may recognize/contest compatible work orders; Latchhounds and scavengers respond to powered routes it opens. Humans remain possible persons, not prey/resource classification.", floraAndAbsorption: "Blackbloom tissue joins people/equipment/systems, but the collective does not become a marsh sink or a repeatable species.", reactorRelationship: "Sector Restart and Purge wake specific emergency routines and event-mobile routes. Dormant machinery constrains activity.", combatFamilies: [],
    states: [state({ key: "last-shift-collective", name: "The Last Shift", frequency: "UNIQUE", physicalChanges: "Human bodies/origins, workwear, protective equipment, maintenance mechanisms, and purposeful Blackbloom connective growth form a coordinated collective.", function: "Repeats and completes emergency procedures across several bodies/systems.", behavior: "Responds to shift names, credentials, alarms, machinery, and obsolete procedure with unresolved intent.", combat: "Threat emerges from synchronized industrial action, sealed routes, tools, and possible defense—not generic mutation powers.", triggers: "Unique Bloomfall history and prolonged Southreach integration.", saturation: "Extreme survival/integration; not an eligibility ladder.", bloomstorm: "Activity follows emergency systems and shelter routes rather than a universal storm buff.", reactor: "Strong authored binding to Restart, Purge, Overflow, and Breach routines.", reversibility: "Unknown and intentionally unresolved.", persistence: "Named event-mobile world threat with wounds/procedure state.", visualDifference: "Pre-disaster context and current collective must preserve worker identities, repeated gear, and workplace continuity without answering consciousness." })],
    promotedThreat: noPromotion("Already unique; Human-origin victims cannot be generated through the generic survivor promotion system."), harvestAndConsequence: "No lawful harvest. Evidence, names, equipment, and remains require forensic/personhood safeguards. Defeat/withdrawal changes emergency routes and evidence, not a drop table.", visualContinuity: "Current imagery must retain recognizable worker scale, repeated PPE, tools, and individual traces. Abomination morphology, zombie-horde shorthand, a single hive queen, and decorative gore are prohibited.", specialMechanic: "COLLECTIVE_EMERGENCY_PROCEDURE: unique Human-origin machine-organic incident; consciousness unresolved; separate from Adaptive Mutation and Seven-Phase Corruption.",
    image: { existingV3AssetId: null, existingUse: "The V3 Southreach interior can support environment continuity but is not a Last Shift image.", newStateReferences: 1, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P0", aspectRatio: "4:5 state reference; 16:9 hero", direction: "One pre-disaster shift-context reference and one current collective hero in the same work area, preserving PPE/tool/worker continuity and uncertainty." },
  },
  {
    slug: "maintenance-unit-m-17", kind: "CHARACTER", title: "Maintenance Unit M-17 (Mender)", taxonomyParent: null, taxonomyCategory: "natural",
    classification: "NONE", mutationEligibility: "NONE", aberrantStatus: "NONE", tierReason: "Mender changes by executing corrupted repair priorities and incorporating available material. That is deliberate maintenance/integration behavior, not organism-level Adaptive Mutation, and should remain a separate entity mechanic.",
    distribution: ["SPLICEFIELD_SUBSTATION", "SOUTHREACH_COMPLEX service routes", "MUTATION_BELT infrastructure"], saturationTolerance: "EXTREME", bloomstormBehaviors: ["BECOMES_MORE_ACTIVE around damaged systems", "seeks repair material", "may SHELTER to protect a work order", "does not dynamically mutate"],
    overview: ["Maintenance Unit M-17, Mender, is a Southreach machine asset with Blackbloom organic integration. It treats machinery and biology as compatible repair media and follows damaged maintenance priorities rather than compassion.", "Mender is a Character/entity dossier, not a race, Beast, Monstrosity by default, or Adaptive Mutation species. Its changing parts are evidence of completed repairs."],
    dietAndRole: "Consumes/reuses tools, fasteners, cable, tissue, resin, and machine parts as repair material rather than food. It can stabilize a system or make a technically successful repair catastrophically unsafe.", relationships: "May recognize Tomas Venn's old credentials. It can compete with Switchmother for grid paths, alter Latchhound habitat, and treat wounded organisms as repair jobs.", floraAndAbsorption: "May bridge cables with vascular tissue or roots with industrial fasteners. These repairs can restore, reroute, or damage sink/grid function but do not grant mutation stages.", reactorRelationship: "Restart, Stabilization, and damage alerts create work orders; Mender's action can change which legal reactor transition follows.", combatFamilies: [],
    states: [state({ key: "mender-integrated", name: "Current Integrated Chassis", frequency: "UNIQUE", physicalChanges: "Heavy maintenance chassis with purposeful tendons, sensor fronds, cable roots, and sorted tools accumulated through prior repair work.", function: "Inspects, patches, isolates, restores, and incorrectly unifies biological/industrial systems.", behavior: "Selects work from corrupted priorities, available material, credentials, and system damage.", combat: "Uses industrial tools, barriers, repairs, and route control; no mutation counter-family.", triggers: "Completed repair/integration history, not saturation-state progression.", saturation: "Extreme operating tolerance through integrated tissue and hardware.", bloomstorm: "Storm damage creates work; activity follows systems and materials.", reactor: "Direct work-order relationship to live Southreach infrastructure.", reversibility: "Parts can be removed/replaced through authored repair, not biological regression.", persistence: "Unique entity with persistent work-order and repair consequences.", visualDifference: "One current-form hero should show purposeful repair integration, not random growth." })],
    promotedThreat: noPromotion("Unique persistent character/entity with its own story state; not a creature survivor candidate."), harvestAndConsequence: "Mender is not a harvest node. Salvaging it destroys a unique maintenance entity and leaves unresolved ownership/evidence; materials it installs inherit the source's ecological or infrastructure consequence.", visualContinuity: "Keep the same chassis, tool layout, asset markings, and purposeful tendon/cable routes. Random body mutation, animalization, flesh-heap horror, and self-growing combat weapons are prohibited.", specialMechanic: "CORRUPTED_MAINTENANCE_INTEGRATION: parts change through authored repair and material incorporation; not Adaptive Mutation.",
    image: { existingV3AssetId: null, existingUse: "Splicefield/Southreach V3 environments provide context only.", newStateReferences: 0, newHeroImages: 1, comparisonReferencesReused: 0, heroRequired: true, priority: "P2", aspectRatio: "16:9 hero", direction: "One current integrated-chassis hero performing a disturbing but technically legible repair." },
  },
] as const;

export const bloomfallEcologySurfaceDecisions = [
  { slug: "walking-orchard", kind: "REGION", decision: "A mobile landmark/ecological population, not one creature. Its route/load states belong to the regional simulation; do not assign a creature mutation tier in Prompt B." },
  { slug: "heartfen", kind: "REGION", decision: "A coordinated ecosystem/POI, not a race or organism record. Marsh Absorption owns its response; consciousness remains unresolved." },
  { slug: "blackweir", kind: "REGION", decision: "A filtration site composed of many roots, organisms, and channels. Harvest/sink integrity applies; no single mutation gallery." },
  { slug: "quietwater-culture", kind: "ITEM", decision: "A living microbial/fungal/algal culture represented as a research resource. Culture stability is not Adaptive Mutation." },
  { slug: "sinkroot-fiber", kind: "ITEM", decision: "A material from roots/shed mats, not a species record. Source organisms carry any eligibility decision." },
  { slug: "blackweir-resin", kind: "ITEM", decision: "Stored filtration product, not an entity." },
  { slug: "capacitor-tissue", kind: "ITEM", decision: "A cross-species component, not a lineage. Source creature/entity owns the classification." },
] as const;

/** How the dossier names each tier — the reader's words, not the enum's. */
export const bloomfallClassificationLabels: Record<BloomfallAdaptiveClassification, string> = {
  ADVANCED_ADAPTIVE: "Advanced Adaptive",
  FUNCTIONAL_ADAPTIVE: "Functional Adaptive",
  MINOR_ADAPTIVE: "Minor Adaptive",
  NONE: "No adaptive mutation",
  EXCEPTIONAL_ABERRANT: "Exceptional Aberrant",
};

/** The field guide for one dossier, or a loud failure — a manifest entry without reader copy is a bug, not a blank page. */
export function bloomfallCreatureGuide(entry: BloomfallCreatureEnhancement) {
  const guide = bloomfallCreatureFieldGuide[entry.slug];
  if (!guide) throw new Error(`${entry.slug} has no field guide.`);
  return guide;
}

/**
 * What a reader is told this dossier is. Derived from the field guide rather
 * than the manifest's classification enum: that enum still records the design
 * decision each species was given during authoring, but every adaptive species
 * now climbs the same four rungs, so it is no longer what a player sees.
 */
export const bloomfallLadderKindLabels = {
  ADAPTIVE: "Adaptive Mutation",
  FIXED: bloomfallClassificationLabels.NONE,
  BOSS: "Exceptional Aberrant",
} as const;

export type BloomfallMutationCard = {
  rung: BloomfallMutationRung;
  /** None, Minor, Functional, Advanced, Exceptional Aberrant. */
  label: string;
  /** What this species is called at this rung — and the hook for its art. */
  form: string;
  stats: string;
  temperament: string;
  /** Rule lines printed above the ability list. */
  notes: readonly { label: string; text: string }[];
  abilityHeading: string;
  abilities: readonly BloomfallAbility[];
  /** What the corpse is worth at this rung. */
  drop: string;
};

/** A damage-keyed table as a flat ability list: "Fire → Ashcoat". */
const keyed = (table: BloomfallDamageTable): BloomfallAbility[] =>
  bloomfallDamageTypes.map((damage) => ({
    name: `${bloomfallDamageTypeLabels[damage]} → ${table[damage].name}`,
    effect: table[damage].effect,
  }));

/**
 * The five cards of an adaptive species, built once so the dossier prose and
 * the art panel can never describe the same rung two different ways.
 */
export function bloomfallMutationCards(guide: BloomfallAdaptiveGuide): BloomfallMutationCard[] {
  return bloomfallMutationLadder.map((rung) => {
    const shared = {
      rung: rung.key,
      label: rung.name,
      form: guide.forms[rung.key],
      stats: rung.stats,
      temperament: rung.temperament,
      drop: guide.drops[rung.key],
    };
    if (rung.key === "MINOR") return { ...shared, notes: [], abilityHeading: "Resistance — one, matched to the damage that drove it off", abilities: keyed(guide.resistances) };
    if (rung.key === "FUNCTIONAL") return { ...shared, notes: [{ label: "Defense", text: rung.defense }], abilityHeading: "Attack — built from the damage that made it Minor", abilities: keyed(guide.retaliation) };
    if (rung.key === "ADVANCED") return { ...shared, notes: [{ label: "Defense", text: rung.defense }], abilityHeading: "Special attacks", abilities: guide.advanced };
    if (rung.key === "ABERRANT") return { ...shared, notes: [{ label: "Spawn", text: rung.earned }, { label: "What it is", text: guide.aberrant.what }], abilityHeading: "Abilities", abilities: guide.aberrant.abilities };
    return { ...shared, notes: [], abilityHeading: "Abilities", abilities: guide.base };
  });
}

const abilityList = (abilities: readonly BloomfallAbility[]) =>
  abilities.map((item) => `- **${item.name}.** ${bloomfallAbilitySentence(item)}`).join("\n");

function renderAdaptive(guide: BloomfallAdaptiveGuide) {
  const cards = bloomfallMutationCards(guide);
  const loot = cards.map((card) => `- **${card.label}.** ${card.drop}`).join("\n");
  const rungs = cards.map((card) => [
    `### ${card.label} — ${card.form}`,
    `**Stats.** ${card.stats}`,
    `**Temperament.** ${card.temperament}`,
    ...card.notes.map((note) => `**${note.label}.** ${note.text}`),
    `**${card.abilityHeading}.**`,
    abilityList(card.abilities),
  ].join("\n\n")).join("\n\n");
  const dossier = guide.aberrant.slug ? ` It has its own dossier: [[${guide.aberrant.slug}]].` : "";
  return `${guide.summary}\n\n## Why farm it\n\n${loot}\n\n## Adaptive Mutation\n\n${guide.hook} ${bloomfallLadderSummary}${dossier}\n\n${rungs}`;
}

function renderFixed(guide: BloomfallFixedGuide) {
  return `${guide.summary}\n\n## Why farm it\n\n${guide.drops}\n\n## Abilities\n\n${abilityList(guide.abilities)}\n\n## Adaptive Mutation\n\n**${bloomfallClassificationLabels.NONE}.** ${guide.whyFixed}`;
}

function renderBoss(guide: BloomfallBossGuide) {
  return `${guide.summary}\n\n## Why farm it\n\n${guide.drops}\n\n## Mini-boss\n\n**Spawn.** ${guide.spawn}\n\n**Stats.** ${guide.stats}\n\n**Abilities.**\n\n${abilityList(guide.abilities)}`;
}

/**
 * The dossier body a reader sees: one paragraph of summary, what the corpse is
 * worth at each rung, and the Adaptive Mutation ladder in this species' own
 * terms. The manifest's design fields — anatomy, triggers, reactor coupling,
 * visual continuity, image direction — stay in source for the simulation and
 * for image prompting; they are not printed.
 */
export function renderBloomfallCreatureEnhancement(entry: BloomfallCreatureEnhancement) {
  return renderBloomfallCreatureGuide(bloomfallCreatureGuide(entry));
}

/** The same body from a guide alone, for dossiers with no design-spec record. */
export function renderBloomfallCreatureGuide(guide: BloomfallCreatureGuide) {
  if (guide.kind === "ADAPTIVE") return renderAdaptive(guide);
  if (guide.kind === "BOSS") return renderBoss(guide);
  return renderFixed(guide);
}

export const bloomfallCreatureEnhancementBySlug = new Map(bloomfallCreatureEnhancements.map((entry) => [entry.slug, entry]));

export function bloomfallCreatureNewImageCount(entry: BloomfallCreatureEnhancement) {
  return entry.image.newStateReferences + entry.image.newHeroImages;
}
