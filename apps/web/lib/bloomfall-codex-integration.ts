import type { StoryEntryKind } from "@habitat/shared";
import { bloomfallCreatureEnhancementBySlug, renderBloomfallCreatureEnhancement } from "@/lib/bloomfall-creature-enhancements";
import { bloomfallMainRegion, bloomfallNewEntries } from "@/lib/bloomfall-reach-content";

/**
 * Prompt E — the Bloomfall Codex systems integration layer.
 *
 * Prompt A locked the regional rules, Prompt B classified the creatures,
 * Prompts C/C2 produced the Adaptive Mutation art, and Prompt D classified the
 * routes. None of that reached the Codex as one connected reading experience:
 * the Systems pages were two-paragraph stubs, the enhanced creature dossiers
 * carried almost no outbound links, and Bloomstorms and Bloomfall travel had
 * no page at all.
 *
 * This module is the single source of truth for that integration. The same
 * structured records generate the stored Codex prose — deterministically, so
 * an audit can prove the database matches this file — and drive the
 * development presentation panel. Nothing here implements a runtime system,
 * and every page states which part is canon and which part is design intent.
 */

export const bloomfallCodexIntegrationContract = "martino-bloomfall-codex-integration" as const;
export const bloomfallCodexIntegrationVersion = 1 as const;

/** The regional dossier is not part of the new-entry package; name it once. */
const bloomfallReachSlug = "bloomfall-reach" as const;
const packageBodyBySlug = new Map(bloomfallNewEntries.map((entry) => [entry.slug, entry.body] as const));

/** Canonical Prompt A saturation bands, player-facing and strictly qualitative. */
export type BloomfallSaturationBand = {
  key: "RESIDUAL" | "ACTIVE" | "SURGE" | "BLOOMSTORM";
  name: string;
  shortRead: string;
  environment: string;
  creatures: string;
  mutation: string;
  resources: string;
  travel: string;
  risk: string;
};

export const bloomfallSaturationBands: readonly BloomfallSaturationBand[] = [
  {
    key: "RESIDUAL", name: "Residual", shortRead: "Old contamination, no active pressure.",
    environment: "Old stains, mineral grain in the soil, stable air and water. The damage is historical rather than ongoing.",
    creatures: "Ordinary regional behaviour. Animals use the ground the way the ground looks.",
    mutation: "No pressure beyond the established regional baseline. Nothing progresses here.",
    resources: "Ordinary salvage and shed material: low yield, low consequence.",
    travel: "Routes behave as their geography suggests, and field instruments stay quiet.",
    risk: "Chronic contamination precautions only.",
  },
  {
    key: "ACTIVE", name: "Active", shortRead: "The Reach's ordinary working condition.",
    environment: "Roots lean toward the pressure, conductors carry a mild charge, and contaminated runoff is visible.",
    creatures: "Saturation-seeking and saturation-avoiding routes become obvious to anyone reading tracks.",
    mutation: "Exposure begins accumulating for eligible species. Nothing expresses yet.",
    resources: "Regional resources at ordinary risk. This is where licensed work happens.",
    travel: "Passable with current field knowledge. Cost, not closure.",
    risk: "Exposure precautions plus local conductive and biological hazards.",
  },
  {
    key: "SURGE", name: "Surge", shortRead: "Pressure the ecology is visibly reacting to.",
    environment: "Accelerated growth, charged mist and rain, active vents, and filtration beds under obvious strain.",
    creatures: "Aggression, migration, and feeding change. Herds leave, and predators follow what left.",
    mutation: "Adapted-state expression is weighted strongly for species that carry an authored family.",
    resources: "Higher-grade deposits and tissue taken from sources that are themselves stressed.",
    travel: "Segments become expensive or close. Detours are the normal answer.",
    risk: "Serious exposure, traversal, structural, and spell danger.",
  },
  {
    key: "BLOOMSTORM", name: "Bloomstorm", shortRead: "Critical load: storm-capable ground.",
    environment: "Violent transport of contaminated material, and sinks that begin sacrificing ground rather than holding it.",
    creatures: "Shelter, frenzy, and coordinated movement. Rare escalation windows open.",
    mutation: "Bloom-evolved expression and survivor promotion can qualify. Never automatic, never universal.",
    resources: "Rare storm and vent deposits under hard caps, followed by an aftermath window.",
    travel: "Low ground, conductors, and unstable structures are the danger. Some crossings exist only now.",
    risk: "Lethal without preparation, and the Lasting Wound risk is telegraphed before it lands.",
  },
] as const;

/** Prompt A's seven observed Southreach states with their frequency class. */
export type BloomfallReactorState = {
  key: string;
  name: string;
  frequencyClass: "NORMAL_CYCLE" | "RARE_CONTROLLED" | "FAILURE";
  entry: string;
  regionalEffect: string;
  opportunity: string;
};

export const bloomfallReactorStates: readonly BloomfallReactorState[] = [
  { key: "DORMANT_INTERVAL", name: "Dormant Interval", frequencyClass: "NORMAL_CYCLE", entry: "The previous cycle completes, or an emergency shutdown holds.", regionalEffect: "Source output falls. Powered defences and grid-feeding predators withdraw, and powered doors and lifts stay dead.", opportunity: "Manual and service routes may be walkable. Unpowered salvage is at its safest and its least valuable." },
  { key: "STABILIZATION", name: "Stabilization", frequencyClass: "NORMAL_CYCLE", entry: "A dormant sector begins balancing, or an Overflow is being brought back under control.", regionalEffect: "The readable warning window. Little new load reaches the Belt, and the Marsh gets time to recover.", opportunity: "Control rooms, sensor points, and evacuation routes matter. Intervening here changes which state comes next." },
  { key: "SECTOR_RESTART", name: "Sector Restart", frequencyClass: "NORMAL_CYCLE", entry: "Stabilization succeeds and energises one sector.", regionalEffect: "Charge returns to linked grid ground, defence systems wake, and the Last Shift runs emergency routines.", opportunity: "Powered doors, lifts, archives, and live high-grade salvage become reachable, at the price of the systems that guard them." },
  { key: "VENTING", name: "Venting", frequencyClass: "NORMAL_CYCLE", entry: "A restart sheds expected pressure, or a sector exceeds its operating envelope.", regionalEffect: "Crown Break and the declared vents move load into air and drainage. Downwind ground is warned before the load arrives.", opportunity: "Vent deposits and stormglass become available while exposed crossings close under the plume." },
  { key: "PURGE", name: "Purge", frequencyClass: "RARE_CONTROLLED", entry: "A forecast control program, a successful intervention, or breach recovery selects a clearing path.", regionalEffect: "Source pressure drops sharply while a larger declared load is exported downstream toward the weir.", opportunity: "The maximum access window: sealed sectors open, defences shut down, and rare records and reserve material become reachable on a strict timer." },
  { key: "OVERFLOW", name: "Overflow", frequencyClass: "FAILURE", entry: "Restart, vent, or purge load exceeds available routing, or a containment path is damaged.", regionalEffect: "Several linked areas rise quickly. Powered infrastructure behaves unpredictably and safe corridors become costly.", opportunity: "Material is exposed because containment is failing, not as a reward. Evacuation is usually wiser than extraction." },
  { key: "CONTAINMENT_BREACH", name: "Containment Breach", frequencyClass: "FAILURE", entry: "An Overflow crosses a failure threshold, or a story action breaks containment.", regionalEffect: "A persistent wound: new damage, a strong storm source, lost routes, displacement, and Lasting Wound risk.", opportunity: "Breached stores may be recoverable only after survival and containment. The world resolves this one with or without the party." },
] as const;

/** Prompt A's five-stage Bloomstorm progression. */
export type BloomfallStormStage = {
  key: string;
  name: string;
  window: string;
  signs: string;
  choice: string;
};

export const bloomfallStormStages: readonly BloomfallStormStage[] = [
  { key: "WARNING", name: "Warning", window: "The longest stage, and long enough to act on.", signs: "Glasswing flocks ring and drop, hart herds abandon the gradient, instruments pulse, and the wind carries a metallic root smell.", choice: "Shelter, route, equipment — or deliberate entry." },
  { key: "ONSET", name: "Onset", window: "Short. The last honest exit.", signs: "Visibility falls, charged rain and fog follow the terrain, conductors and growth activate, and peripheral routes begin closing.", choice: "Leave now, or commit to the whole storm." },
  { key: "PEAK", name: "Peak", window: "The dangerous middle.", signs: "Maximum spell instability, exposure, mutation pressure, and disruption of anything electrical or magitech. Rare nodes lie exposed.", choice: "Survival is active play. Shelter is a place, not a screen effect." },
  { key: "DECAY", name: "Decay", window: "Pressure moves on or settles.", signs: "Visibility returns unevenly, hazards remain, creatures leave shelter, and new crossings and debris become visible.", choice: "Take the temporary crossing, or let it reseal." },
  { key: "AFTERMATH", name: "Aftermath", window: "The long tail, and often the best exploration window in the Reach.", signs: "Rare deposits, carcasses, shed tissue, altered creature states, unstable sinks, and fresh Aberrant tracks.", choice: "Harvest, track, or repair, knowing the sinks are still weak." },
] as const;

/** Prompt A's five harvesting consequence classes. */
export type BloomfallHarvestClass = {
  key: string;
  name: string;
  meaning: string;
  pressure: string;
  examples: readonly string[];
};

export const bloomfallHarvestClasses: readonly BloomfallHarvestClass[] = [
  { key: "INERT_SALVAGE", name: "Inert salvage", meaning: "Loose or dead material that no longer performs an ecological or containment function.", pressure: "None to low. The risk is structural and legal rather than ecological.", examples: ["gridcore-alloy"] },
  { key: "REGENERATIVE_TAKE", name: "Regenerative take", meaning: "Shed, trimmed, sampled, or seasonally renewed material.", pressure: "Low within quota, and it recovers naturally while the incoming load stays low.", examples: ["sinkroot-fiber"] },
  { key: "FUNCTIONAL_HARVEST", name: "Functional harvest", meaning: "Removal weakens an organism, a herd role, a conductor, a predator boundary, or a machine ecology.", pressure: "Moderate, with a local behaviour or resource consequence that arrives later.", examples: ["capacitor-tissue"] },
  { key: "SINK_HARVEST", name: "Sink harvest", meaning: "The material being harvested is binding or transforming contamination right now.", pressure: "High: absorption is lost, and a stripped bed can release what it was holding.", examples: ["blackweir-resin", "quietwater-culture"] },
  { key: "BREACH_EXTRACTION", name: "Breach extraction", meaning: "Removal breaks a seal, a live grid, a reserve bank, a major organism, or a containment structure.", pressure: "Critical. This is an authored event, never an ordinary gather interaction.", examples: ["reserve-glass"] },
] as const;

/** What ground looks like as repeated extraction accumulates. */
export const bloomfallHarvestPressureBands = [
  { key: "LIGHT", name: "Light", observable: "Normal regrowth and animal use. Nothing warns you, because nothing is wrong.", consequence: "Ordinary recovery." },
  { key: "WORKED", name: "Worked", observable: "Cut marks, fewer carriers and grazers, changed calls, and quota signs going up.", consequence: "Slightly lower yield and absorption, and more defensive animal behaviour." },
  { key: "STRESSED", name: "Stressed", observable: "Exposed roots, abandoned nests, unstable channels, and instruments repeating the same warning.", consequence: "Real sink loss. Routes and creatures change, and the ground becomes susceptible to upstream pressure." },
  { key: "CRITICAL", name: "Critical", observable: "A failing bed, seal, or network, with an explicit extraction warning.", consequence: "Event-scale release, migration, storm and Aberrant attention, and persistent local damage." },
] as const;

/** Prompt A's player-information states for regional threats. */
export const bloomfallIntelStates = [
  { key: "RUMORED", name: "Rumoured", meaning: "A credible report with a broad area and an age. Useful for planning, useless for pointing." },
  { key: "TRACKED", name: "Tracked", meaning: "Fresh signs support a direction or a range. Not a position." },
  { key: "CONFIRMED", name: "Confirmed", meaning: "A sighting or a trusted live instrument gives a short-lived local fix that begins decaying immediately." },
  { key: "LOST", name: "Lost", meaning: "The information expired, or behaviour contradicted it. The last known evidence stays on the record." },
] as const;

/** Prompt A's mobility profiles for named and promoted threats. */
export const bloomfallMobilityClasses = [
  { key: "RANGE_ROAMER", name: "Range roamer", meaning: "Moves among a finite range of ground according to prey, pressure, and disturbance.", holder: "the-bellwether" },
  { key: "SITE_ANCHORED", name: "Site anchored", meaning: "Its body and function depend on one place; its reach grows through the systems that place is wired into.", holder: "switchmother" },
  { key: "FLOW_TERRITORIAL", name: "Flow territorial", meaning: "Its territory is a water system, so its position changes as the channels and the load change.", holder: "old-drowner" },
  { key: "EVENT_MOBILE", name: "Event mobile", meaning: "Normally bound to a site, but moves along known routes when a qualifying reactor or story state calls it out.", holder: "the-last-shift" },
] as const;

/** Prompt D's four route classes. */
export type BloomfallRouteClassKey = "PERMANENT" | "CONDITIONAL" | "DYNAMIC" | "DEFERRED";

export const bloomfallRouteClasses: readonly { key: BloomfallRouteClassKey; name: string; meaning: string; atlas: string }[] = [
  { key: "PERMANENT", name: "Permanent", meaning: "Stable infrastructure or geography whose identity survives even while a stretch of it is hazardous or blocked.", atlas: "Drawn as an ordinary route. Only the changed segment carries a state treatment." },
  { key: "CONDITIONAL", name: "Conditional", meaning: "The ground does not move; its usability does. Open, dangerous, and closed are all normal states for the same line.", atlas: "The line stays drawn, with a restrained open, dangerous, or closed treatment and the age of the report." },
  { key: "DYNAMIC", name: "Dynamic", meaning: "The path itself moves. An ecology, a hydrology, or a herd decides where it currently runs.", atlas: "Only a currently observed corridor or a broad envelope, with freshness. Never a default permanent line." },
  { key: "DEFERRED", name: "Deferred", meaning: "No route is authored, because canon, art, endpoint meaning, or ownership is not sufficient yet.", atlas: "Nothing is drawn. An absent line is an honest answer." },
] as const;

export type BloomfallRouteRecord = {
  key: string;
  name: string;
  classKey: BloomfallRouteClassKey;
  endpoints: string;
  conditionOwner: string;
  note: string;
  persisted: boolean;
};

/** Exact parity with Docs/bloomfall-routes/bloomfall-route-status-manifest.json. */
export const bloomfallRouteRecords: readonly BloomfallRouteRecord[] = [
  { key: "riverlands-ashline-corridor", name: "Riverlands and Ashline historical corridor", classKey: "PERMANENT", endpoints: "Bloomfall Reach to the Riverlands, through Ashline Exchange, the Southreach Complex, and the Redline spur.", conditionOwner: "Regional route condition", note: "The controlled landward corridor. The road identity survives; individual segments can still become dangerous or closed.", persisted: true },
  { key: "drowned-intake-ocean-approach", name: "Drowned Intake shallow-draft sea approach", classKey: "CONDITIONAL", endpoints: "Bloomfall Reach to the Ocean, through the Drowned Intake and Blackweir.", conditionOwner: "Living Marsh hydrology", note: "The only sea approach, and never a safe harbour. Hydrology, storms, intake state, and the Old Drowner decide whether it is usable today.", persisted: true },
  { key: "cairnwood-glassroot-expedition-trail", name: "Cairnwood to Glassroot expedition trail", classKey: "CONDITIONAL", endpoints: "Cairnwood Camp to Glassroot Observatory.", conditionOwner: "Mutation Belt route state", note: "One surveyed alignment across the Belt. Saturation, storms, damaged root ground, migration, and stale field reports raise its cost or close it.", persisted: true },
  { key: "southreach-service-rail-alignment", name: "Southreach reserve and service alignment", classKey: "CONDITIONAL", endpoints: "Reserve Vault Twelve to Crown Break, through the Southreach Complex.", conditionOwner: "Reactor cycle and structure", note: "The northern industrial spine. Dormant may allow manual access, Restart and Purge may power it, and Overflow or Breach may take segments away.", persisted: true },
  { key: "walking-orchard-reedless-moving-corridor", name: "Walking Orchard moving corridor", classKey: "DYNAMIC", endpoints: "The ground behind the Walking Orchard, toward the Reedless Mile.", conditionOwner: "Orchard migration", note: "The orchard leaves usable ground behind it as it abandons rising pressure. The Route That Moves is this corridor being read correctly.", persisted: false },
  { key: "reedless-mile-openings", name: "Reedless Mile openings", classKey: "DYNAMIC", endpoints: "Crossings within the Reedless Mile.", conditionOwner: "Marsh hydrology", note: "Bare substrate creates narrow, scheduled opportunities. A crossing that worked last week proves nothing about this week.", persisted: false },
  { key: "long-graze-herd-corridor", name: "Long Graze herd corridor", classKey: "DYNAMIC", endpoints: "Migration ground across Long Graze.", conditionOwner: "Herd ecology", note: "This is herd range, not a road. Gradients, disturbance, predators, storms, and the Bellwether decide where it currently runs.", persisted: false },
  { key: "heartfen-openings", name: "Heartfen openings", classKey: "DYNAMIC", endpoints: "Access into Heartfen.", conditionOwner: "Marsh coordination", note: "Heartfen receives no convenient road. Its openings belong to marsh coordination and may read as unverified even when they are genuinely there.", persisted: false },
  { key: "living-marsh-secondary-waterways", name: "Living Marsh secondary waterways", classKey: "DYNAMIC", endpoints: "Channels through the Living Marsh beyond the persisted sea approach.", conditionOwner: "Living Marsh hydrology", note: "Controlled local channels around Blackweir and lesser passages move with load and season. The Lantern Pools are refuge water, not a through-channel.", persisted: false },
  { key: "riverlands-world-continuation", name: "Riverlands world continuation", classKey: "DEFERRED", endpoints: "Beyond the regional boundary toward the Riverlands.", conditionOwner: "World-scale authoring", note: "The world map establishes landmass adjacency, not an exact world-scene road. The semantic connection and the local corridor remain authoritative.", persisted: false },
  { key: "ocean-world-continuation", name: "Ocean world continuation", classKey: "DEFERRED", endpoints: "Beyond the regional boundary toward the Ocean.", conditionOwner: "World-scale authoring", note: "The coast and marsh edge are established; a defensible shallow-draft world continuation is not.", persisted: false },
  { key: "magic-torn-adjacency", name: "Magic-Torn adjacency", classKey: "DEFERRED", endpoints: "The shared border with the Magic-Torn Wasteland.", conditionOwner: "None; no connection exists", note: "Geographic adjacency only. No road, trail, hidden passage, or travel semantics have ever been authored across this border, and none is implied.", persisted: false },
] as const;

/** What a party knows about a route, which is never the same as what is true. */
export const bloomfallRouteKnowledgeStates = [
  { key: "KNOWN_OPEN", name: "Known open", meaning: "Someone the party trusts has been through recently." },
  { key: "KNOWN_CLOSED", name: "Known closed", meaning: "A report says it is shut. Reports age." },
  { key: "HAZARDOUS", name: "Hazardous", meaning: "Passable at a price that has been named." },
  { key: "UNVERIFIED", name: "Unverified", meaning: "Nobody current has checked. Most Bloomfall travel starts here." },
  { key: "LOST", name: "Lost", meaning: "The knowledge expired. The last evidence stays on the map; the confidence does not." },
] as const;

/** The causal chain Prompt A locked, drawn rather than described. */
export type BloomfallDiagramNode = { key: string; label: string; slug: string | null; lane: number; column: number; tone: "SOURCE" | "PRESSURE" | "LIFE" | "PLAYER" | "SINK" };
export type BloomfallDiagramEdge = { from: string; to: string; label: string | null };

export const bloomfallRelationshipDiagram = {
  caption: "How one pressure becomes a consequence. Every arrow is a canon rule; none of it is a runtime simulation.",
  nodes: [
    { key: "reactor", label: "Southreach reactor cycles", slug: "reactor-cycles", lane: 0, column: 0, tone: "SOURCE" },
    { key: "saturation", label: "Essence Saturation", slug: "essence-saturation", lane: 0, column: 1, tone: "PRESSURE" },
    { key: "storms", label: "Bloomstorms", slug: "bloomstorms", lane: 0, column: 2, tone: "PRESSURE" },
    { key: "mutation", label: "Adaptive Mutation", slug: "adaptive-mutation", lane: 0, column: 3, tone: "LIFE" },
    { key: "aberrants", label: "Aberrant pressure", slug: "aberrant-escalation", lane: 0, column: 4, tone: "LIFE" },
    { key: "harvest", label: "Harvesting", slug: "harvesting-consequences", lane: 1, column: 0, tone: "PLAYER" },
    { key: "stability", label: "Reduced ecological stability", slug: null, lane: 1, column: 1, tone: "PLAYER" },
    { key: "travel", label: "Travel conditions", slug: "bloomfall-travel", lane: 1, column: 3, tone: "PLAYER" },
    { key: "marsh", label: "Living Marsh absorption", slug: "marsh-absorption", lane: 2, column: 1, tone: "SINK" },
    { key: "containment", label: "Containment", slug: "the-living-marsh", lane: 2, column: 2, tone: "SINK" },
  ] satisfies readonly BloomfallDiagramNode[],
  edges: [
    { from: "reactor", to: "saturation", label: "releases" },
    { from: "saturation", to: "storms", label: "at critical load" },
    { from: "storms", to: "mutation", label: "accelerates" },
    { from: "mutation", to: "aberrants", label: "rarely promotes" },
    { from: "harvest", to: "stability", label: "removes function" },
    { from: "stability", to: "saturation", label: "raises free pressure" },
    { from: "stability", to: "travel", label: "changes cost" },
    { from: "saturation", to: "marsh", label: "is absorbed by" },
    { from: "marsh", to: "containment", label: "at a stored cost" },
    { from: "containment", to: "saturation", label: "lowers, never erases" },
    { from: "aberrants", to: "travel", label: "reroutes" },
  ] satisfies readonly BloomfallDiagramEdge[],
} as const;

/** A grouped, slug-typed cross-link block rendered into the stored prose. */
export type BloomfallRelatedLinks = {
  systems: readonly string[];
  places: readonly string[];
  creatures: readonly string[];
  resources: readonly string[];
  story: readonly string[];
  people: readonly string[];
};

export type BloomfallSystemPage = {
  slug: string;
  title: string;
  summary: string;
  /** Whether the record is created by this phase or upgraded in place. */
  authoring: "NEW" | "UPGRADED";
  parent: string;
  category: "world simulation" | "economy" | "combat";
  dependsOn: readonly string[];
  pillars: readonly string[];
  openQuestions: readonly string[];
  regionNotes: readonly { region: string; note: string }[];
  /** Prose sections, in the order Prompt E's system-page standard requires. */
  whatItIs: string;
  whyItExists: string;
  whereItOperates: string;
  inputs: string;
  consequences: string;
  playerFacing: string;
  canonRule: string;
  futureGameplay: string;
  atlas: string | null;
  related: BloomfallRelatedLinks;
  /** Which structured card set the development panel renders for this page. */
  panel: "SATURATION_BANDS" | "REACTOR_STATES" | "MUTATION_TIERS" | "STORM_STAGES" | "HARVEST_CLASSES" | "ABERRANT_PROFILES" | "ROUTE_CLASSES";
};

const links = (input: Partial<BloomfallRelatedLinks>): BloomfallRelatedLinks => ({
  systems: input.systems ?? [], places: input.places ?? [], creatures: input.creatures ?? [],
  resources: input.resources ?? [], story: input.story ?? [], people: input.people ?? [],
});

/** Shared closing sentence so every Bloomfall system page draws the same line. */
export const bloomfallFutureGameplayNotice =
  "**Implementation status.** Everything above is canon: it is true in the world whether or not anyone is playing. The mechanics described under *In play* are **future gameplay design**. No runtime simulation of this system exists in the game build today.";

export const bloomfallSystemPages: readonly BloomfallSystemPage[] = [
  {
    slug: "essence-saturation", title: "Essence Saturation", authoring: "UPGRADED",
    summary: "Ambient Blackbloom pressure across the Reach, read in four field bands: Residual, Active, Surge, and Bloomstorm.",
    parent: "blackbloom-exposure", category: "world simulation",
    dependsOn: ["blackbloom-exposure", "reactor-cycles", "marsh-absorption", "weather"],
    pillars: [
      "Four readable bands, never a number on the screen",
      "Pressure moves and is absorbed; it is never created for free",
      "One band changes ecology, magic, resources, and travel together",
    ],
    openQuestions: ["Do parties share discovered saturation knowledge in co-op, or does each character learn the ground separately?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "The regional pressure every other Bloomfall system reads. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-shattercore", note: "Active floor, highest volatility, sharp source-driven spikes. Quiet here can be a Dormant Interval rather than safety." },
      { region: "the-mutation-belt", note: "Active tendency with the highest mutation responsiveness: a small change in pressure produces a large change in what lives here." },
      { region: "the-living-marsh", note: "Low free saturation in healthy ground despite carrying the region's greatest bound load. Damaged sinks create delayed, steep spikes." },
      { region: "crown-break", note: "The Reach's principal atmospheric source. Saturation downwind of the vent is a forecast, not a fixed value." },
      { region: "lantern-pools", note: "Locally the lowest free saturation in the Marsh, and only because a fragile living culture is holding it there." },
      { region: "blackweir", note: "Low free saturation, high bound load. The weir is the reason the numbers here look better than the ground deserves." },
      { region: "glassroot-observatory", note: "The survey line where the bands were first defined, and where field instruments are calibrated against them." },
    ],
    whatItIs: "Essence Saturation is the ambient pressure of energised [[essence]] in a given piece of Bloomfall ground. It is a property of the place, not of a person: a character standing in a Surge cell is in danger, but nothing is being written to their soul. Fieldwork reads it in four bands — **Residual**, **Active**, **Surge**, and **Bloomstorm** — because those are the four differences a surveyor can actually see, hear, and act on.",
    whyItExists: "[[the-bloomfall]] did not end when the banks failed. It left a landscape that still holds, moves, and sheds contamination, and [[southreach-complex]] still adds to it. Saturation is the canon that keeps every other regional system honest: a creature changes, a storm forms, a route closes, or a spell goes wrong because pressure reached that ground from a source that can be named.",
    whereItOperates: "Everywhere in [[bloomfall-reach]], with a different character in each subregion. [[the-shattercore]] is volatile and source-driven. [[the-mutation-belt]] converts a small pressure change into a large ecological one. [[the-living-marsh]] usually shows the lowest free saturation in the Reach while carrying the greatest bound load — which is exactly why damage there is so expensive.",
    inputs: "Reactor sector output under [[reactor-cycles]]; active vents and damaged reserve banks such as [[crown-break]] and [[reserve-vault-twelve]]; contaminated water moving downstream; the [[bloomstorms]] that redistribute what already exists; and a sink that was stripped or destroyed under [[harvesting-consequences]]. Combat, proximity, and the importance of a quest never raise saturation. Every rise has an owner that can be named.",
    consequences: "Saturation sets mutation pressure under [[adaptive-mutation]], decides whether [[bloomstorms]] are possible, raises the reward and the backlash of [[blackbloom-overcharge]], changes which resources are worth taking and what taking them costs, and drives most of the hazards on the [[bloomfall-environmental-hazards]] sheet. It is also the main input to [[bloomfall-travel]]: a Surge band is why a known trail suddenly costs three days.",
    playerFacing: "A band should be readable before an instrument confirms it. Root posture, water and air condition, conductor activity, which animals are absent, and the specific sound of the ground all move together. Instruments give a qualitative band on inspection, never a percentage; guides describe evidence rather than hidden numbers. Band recognition must never depend on colour alone.",
    canonRule: "Saturation is environmental. It is not [[the-seven-phases-of-corruption]], it is not a player meter, and it cannot be cleansed: ground recovers toward its regional floor and no further.",
    futureGameplay: "A future runtime would hold a bounded internal value per authored area and expose only the four bands, with overlap at the edges so a place cannot flicker between labels. The number is a tuning tool, not lore, and should never be shown.",
    atlas: "A discovered saturation overlay is optional, qualitative, and one layer at a time. The Atlas is a map, not a telemetry wall, and undiscovered ground carries no colour wash at all.",
    related: links({
      systems: ["blackbloom-exposure", "reactor-cycles", "bloomstorms", "marsh-absorption", "harvesting-consequences", "adaptive-mutation", "blackbloom-overcharge", "bloomfall-environmental-hazards", "bloomfall-travel"],
      places: ["the-shattercore", "the-mutation-belt", "the-living-marsh", "crown-break", "blackweir", "lantern-pools", "glassroot-observatory"],
      creatures: ["blackbloom-hart", "glasswing-kite"],
      resources: ["essence", "stormglass"],
      people: ["keira-ansel", "tomas-vey"],
    }),
    panel: "SATURATION_BANDS",
  },
  {
    slug: "reactor-cycles", title: "Reactor Cycles", authoring: "UPGRADED",
    summary: "The Southreach Complex still runs a seven-state operating pattern two decades after it failed, and the Reach lives downstream of it.",
    parent: "environment", category: "world simulation",
    dependsOn: ["essence-saturation", "persistent-damage", "bloomstorms"],
    pillars: [
      "The ruin keeps working whether or not anyone is watching",
      "Every state trades access against risk",
      "Forecasting buys a choice, never a certainty",
    ],
    openQuestions: ["Which Southreach sectors are distinct enough to cycle independently, and which move together?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "The Reach's largest single source of new pressure. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-shattercore", note: "Where the cycle is felt as machinery: lights, vents, powered doors, live rails, and defences that wake without warning." },
      { region: "the-mutation-belt", note: "Receives the cycle as weather and migration. Restart charges the grid ecology; Venting draws a saturation line downwind." },
      { region: "the-living-marsh", note: "Receives the cycle last and pays for it longest. A Purge upstream becomes a containment decision at the weir days later." },
      { region: "southreach-complex", note: "Owns the cycle. Sector states, vents, and the surviving controls all live here." },
      { region: "crown-break", note: "The principal vent. When a sector sheds pressure, this is usually where it goes." },
      { region: "reserve-vault-twelve", note: "Access, reserve pressure, and Reserve Glass are all gated by the current state of the cycle." },
      { region: "splicefield-substation", note: "A Sector Restart can send live current into the grid ecology here and get a fault back." },
      { region: "ashline-exchange", note: "Power and structure decide whether the interchange is a usable junction or a closed one." },
      { region: "redline-shelter-six", note: "Sealed compartments, obsolete procedures, and Last Shift routines respond to Restart and Purge states." },
    ],
    whatItIs: "Reactor Cycles are the recurring states that surviving [[southreach-complex]] sectors still move through: **Dormant Interval**, **Stabilization**, **Sector Restart**, **Venting**, **Purge**, **Overflow**, and **Containment Breach**. They are not equally likely. Four are the ruin's ordinary operating pattern, Purge is a rare controlled clearing window, and Overflow and Containment Breach are failures caused by load that had nowhere to go.",
    whyItExists: "Southreach was a strategic reserve with automatic balancing, isolation, and venting systems. Those systems were built to keep running without people, and enough of them survived [[the-bloomfall]] to keep trying. The cycle is what a machine designed for continuity looks like twenty years after the continuity stopped mattering.",
    whereItOperates: "Inside [[the-shattercore]], anchored on [[southreach-complex]], with declared vents at [[crown-break]] and gated access at [[reserve-vault-twelve]], [[ashline-exchange]], and [[redline-shelter-six]]. Its consequences reach [[the-mutation-belt]] as charge and weather, and [[the-living-marsh]] as a downstream load the weir has to accept.",
    inputs: "The previous state and its elapsed time, the amount of pressure the selected sector is holding, whether a routing or containment path is intact, and any deliberate interference — a repair, an extraction, or a stripped conductor. [[maintenance-unit-m-17]] can change which transition is legal simply by finishing a work order.",
    consequences: "Each state changes [[essence-saturation]] at its source, opens or closes doors, lifts, rails, and archives, changes what [[latchhound]] packs and [[sump-eel]] shoals do with the current, wakes [[the-last-shift]], and decides whether [[reserve-glass]] and [[gridcore-alloy]] are reachable at all. A Venting or Breach state is one of the few legal ways [[bloomstorms]] can begin.",
    playerFacing: "The Complex announces itself. Machinery cadence, lights, vent noise, the behaviour of grid-feeding animals, and [[tomas-vey]] reading obsolete controls all give the same forecast from different directions. The reward for reading it correctly is access; the cost of reading it wrong is being inside the sector when it energises.",
    canonRule: "Sector states are observed behaviour, not proof that one intact controller survived. A cycle can open a route, energise salvage, displace an Aberrant, or close the Complex with nobody present — [[the-purge-window]] is what that looks like as a story.",
    futureGameplay: "A future runtime would hold one authoritative regional controller with these seven states, an explicit affected sector for every transition, and a forecast that players can improve but never guarantee. No state would be selected as ordinary weather, and no failure state would be rolled without a cause.",
    atlas: "An optional cycle overlay shows the affected sector and the direction of the next likely transition. It is not a facility telemetry dashboard, and it never lights the whole region because one sector woke up.",
    related: links({
      systems: ["essence-saturation", "bloomstorms", "harvesting-consequences", "bloomfall-travel", "bloomfall-environmental-hazards", "persistent-damage"],
      places: ["southreach-complex", "crown-break", "reserve-vault-twelve", "ashline-exchange", "redline-shelter-six", "splicefield-substation", "the-shattercore"],
      creatures: ["the-last-shift", "latchhound", "sump-eel", "switchmother"],
      resources: ["reserve-glass", "gridcore-alloy", "essence", "stormglass"],
      story: ["the-purge-window", "menders-work", "three-failure-reports"],
      people: ["tomas-vey", "maintenance-unit-m-17", "selene-ward"],
    }),
    panel: "REACTOR_STATES",
  },
  {
    slug: "adaptive-mutation", title: "Adaptive Mutation", authoring: "UPGRADED",
    summary: "Bloomfall's signature rule: wound an eligible creature and let it escape, and it heals into something worse. Four rungs, climbed the same way on every species that has them.",
    parent: "blackbloom-exposure", category: "world simulation",
    dependsOn: ["blackbloom-exposure", "essence-saturation", "nature"],
    pillars: [
      "Base taxonomy always survives the mutation",
      "Eligibility is selective, and None is a real answer",
      "Every state is a function with a counter, never a bigger number",
    ],
    openQuestions: ["Which changes should be inherited by a herd or nest rather than expressed by one animal?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "Unique to the Reach. No other Martino region receives Adaptive Mutation. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-mutation-belt", note: "The strongest expression ground in the Reach, and the reason the Belt is named for the system rather than the terrain." },
      { region: "the-shattercore", note: "Expression follows infrastructure: charge, heat, and powered corridors rather than browse and mineral lines." },
      { region: "the-living-marsh", note: "Expression follows flow and filtration. Marsh species adapt toward sealing and anchoring rather than toward charge." },
      { region: "long-graze", note: "Herd-scale expression: what one hart does here changes what a whole migration does next season." },
      { region: "splicefield-substation", note: "The clearest case of a machine ecology shaping a living one — and the reason Latchhound states read as circuitry." },
      { region: "glassroot-observatory", note: "Where the families, states, and counters were catalogued, and where a field sample can identify which family is present." },
    ],
    whatItIs: "Adaptive Mutation is the canonical rule for how Bloomfall organisms change under sustained Blackbloom pressure, and the player is what drives it. Wound an eligible creature, fail to kill it, and let it get away: it heals into the next rung and remembers what hurt it. The rungs are identical on every eligible species, so a player learns them once and reads them on anything. **None** is the animal as the Reach made it. **Minor** is +20% across the board and one resistance keyed to whatever drove it off. **Functional** is +100%, a second resistance for the second thing that wounded it, and the first resistance turned into an attack. **Advanced** is +250% and **Prisma**: every damage type halved except one hidden weakness that takes 25% extra, and nothing tells you which. **Aberrant status** stays a separate, individual fact — a surviving Advanced carries a 1% chance of seeding a named Exceptional Aberrant, a mini-boss layered on top of its ordinary taxonomy rather than a new species. Eligibility is still selective: species with no ladder have that recorded as a decision, not a gap.",
    whyItExists: "The Reach needed adaptation that a player could learn rather than merely survive. A finite authored ladder gives recurring, recognisable outcomes: the same species produces the same states, for the same reasons, with the same counters. That is what makes the region readable instead of merely strange, and it is why Adaptive Mutation exists here and nowhere else in Martino.",
    whereItOperates: "Only in [[bloomfall-reach]]. [[the-mutation-belt]] is the strongest expression ground, [[the-shattercore]] pushes expression toward charge and heat, and [[the-living-marsh]] pushes it toward sealing and flow. [[glassroot-observatory]] holds the catalogue.",
    inputs: "Whether the species has a ladder at all; how many times this individual has been wounded and escaped; and the damage type that did it each time, which is what selects the resistance and the retaliation it grows. Accumulated exposure from [[essence-saturation]] and the habitat it heals in shape how the change expresses. Reactor states, storms, harvesting, and Aberrant proximity all matter — but they matter by changing saturation, habitat, or disturbance, not as separate meters.",
    consequences: "Expression changes what an encounter is: armour, sensing, mobility, tolerance, charge, feeding, attack, or pack coordination. It changes what a body is worth under [[harvesting-consequences]], and a rare qualifying survivor can escalate into a persistent regional threat under [[aberrant-escalation]].",
    playerFacing: "A changed animal should be legible on sight, from continuous anatomy rather than a badge: the same skull, the same limb count, the same scars, with tissue that has visibly answered a specific problem. Behaviour changes with the body. Field scopes and samples identify a family; Wardens report the behaviour that follows.",
    canonRule: "Base taxonomy is never replaced. A [[blackbloom-hart]] stays within Beasts, a Bloommarked human stays Human, and Aberrant is a designation layered on top rather than a race. Adaptive Mutation is also not [[the-seven-phases-of-corruption]]: the two never share a value, a phase, a cure, or a colour.",
    futureGameplay: "A future runtime would track the wound history of individuals a player failed to finish, and select an authored form from species data plus the damage types recorded against it — not generate anatomy. The stat curve (+20%, +100%, +250%), the Prisma rule, and the 1% Aberrant seed are the tuning surface; the forms themselves stay authored per species.",
    atlas: null,
    related: links({
      systems: ["blackbloom-exposure", "essence-saturation", "aberrant-escalation", "bloomstorms", "harvesting-consequences", "marsh-absorption"],
      places: ["the-mutation-belt", "the-shattercore", "the-living-marsh", "long-graze", "splicefield-substation", "glassroot-observatory"],
      creatures: ["blackbloom-hart", "latchhound", "rootback-grazer", "mirejaw", "sump-eel", "glasswing-kite", "spore-lantern-colony", "bloommarked-remnant", "the-bellwether", "switchmother", "old-drowner", "the-last-shift"],
      resources: ["capacitor-tissue", "sinkroot-fiber"],
      story: ["the-bellwether-event"],
      people: ["keira-ansel", "mara-quill", "maintenance-unit-m-17"],
    }),
    panel: "MUTATION_TIERS",
  },
  {
    slug: "bloomstorms", title: "Bloomstorms", authoring: "NEW",
    summary: "Severe transport events that move contaminated material through real weather, in five stages that can be read and acted on.",
    parent: "weather", category: "world simulation",
    dependsOn: ["weather", "essence-saturation", "reactor-cycles", "marsh-absorption"],
    pillars: [
      "A storm needs a source, a carrier, and a failure to absorb",
      "Five stages, each with a different honest choice",
      "It moves pressure; it does not invent it",
    ],
    openQuestions: ["Which Lasting Wounds can follow storm exposure for player characters, and which only for companions and NPCs?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "The Reach's severe weather. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-shattercore", note: "Where most storms are born, out of venting, overflow, or a breach with a weather front on top of it." },
      { region: "the-mutation-belt", note: "Where storms do their work: exposure, expression, displaced herds, and an aftermath worth walking into." },
      { region: "the-living-marsh", note: "Where storms are absorbed, at a cost. A storm over weakened sinks is how a safe pool becomes a Surge." },
      { region: "crown-break", note: "The most common storm source in the Reach. A vent plume plus a strong front is the classic formation." },
      { region: "long-graze", note: "Herds read the warning stage before instruments do. An abandoned gradient is a forecast." },
    ],
    whatItIs: "A Bloomstorm is a severe weather event that picks up energised contaminated material and moves it. It forms when critical local [[essence-saturation]] meets a physical release and a real atmospheric or water carrier, and local absorption cannot keep up. It then runs through five stages: **Warning**, **Onset**, **Peak**, **Decay**, and **Aftermath**.",
    whyItExists: "The Reach needed a way for pressure to travel that was neither a slow creep nor a scripted set piece. A storm is the region redistributing itself: it explains how a distant vent becomes a local crisis, why some ground changes overnight, and why the most valuable exploration window in Bloomfall is the day after the worst weather.",
    whereItOperates: "Formation is usually a [[the-shattercore]] problem, most often at [[crown-break]] or after an Overflow. Expression is usually a [[the-mutation-belt]] problem. Absorption is always a [[the-living-marsh]] problem, and a storm passing over stripped sinks is how a stable pool becomes dangerous.",
    inputs: "Critical saturation, a release event — venting, overflow, breach, exposed saturated drainage, or a sink failure that lets bound load go — a valid weather or water carrier, and insufficient local absorption. High saturation alone produces a warning-capable place, not a storm on a clear stable day.",
    consequences: "Visibility, traversal, and equipment all degrade. Creatures shelter, migrate, or hunt the displaced. [[blackbloom-overcharge]] becomes both stronger and far more dangerous. Exposure accelerates for species eligible under [[adaptive-mutation]]. Stormglass and vent deposits become briefly available, some routes close and others open, and [[bloomfall-travel]] conditions can change for days afterwards.",
    playerFacing: "The warning stage is the design. [[glasswing-kite]] flocks ring and drop, [[blackbloom-hart]] herds abandon the gradient, instruments pulse, and the air smells of hot metal and cut root. A party that reads those signs gets a real choice: shelter, reroute, or go in on purpose because Peak is the only moment the thing they want is exposed.",
    canonRule: "A Bloomstorm is energised material moving through ordinary physics. Wind, rain, drainage, vegetation, conductors, and structures all behave normally. It is **not** a Magic-Torn event: no floating terrain, no broken gravity, no spatial rupture, and no universal purple fracture language.",
    futureGameplay: "A future runtime would run a storm director that checks source, carrier, and absorption before a storm can exist, then advances the five stages with capped rewards tied to the source rather than a general loot table.",
    atlas: "A forecast cone while the warning holds, an observed footprint while the storm runs, and a fading aftermath trace afterwards — all gated by what the party actually knows. It replaces the saturation overlay rather than stacking on top of it.",
    related: links({
      systems: ["weather", "essence-saturation", "reactor-cycles", "marsh-absorption", "adaptive-mutation", "blackbloom-overcharge", "bloomfall-environmental-hazards", "bloomfall-travel", "lasting-wounds"],
      places: ["the-shattercore", "the-mutation-belt", "the-living-marsh", "crown-break", "long-graze", "blackweir", "lantern-pools"],
      creatures: ["glasswing-kite", "blackbloom-hart", "rootback-grazer", "latchhound", "spore-lantern-colony", "mirejaw"],
      resources: ["stormglass", "reserve-glass"],
      story: ["black-tide-at-blackweir"],
      people: ["tomas-vey", "mara-quill"],
    }),
    panel: "STORM_STAGES",
  },
  {
    slug: "harvesting-consequences", title: "Bloomfall Harvesting Consequences", authoring: "UPGRADED",
    summary: "What players remove from Bloomfall can change Bloomfall, because the valuable material and the working part are usually the same thing.",
    parent: "gathering-and-harvest", category: "economy",
    dependsOn: ["gathering-and-harvest", "marsh-absorption", "essence-saturation", "adaptive-mutation", "persistent-damage"],
    pillars: [
      "Every rare material is doing a job right now",
      "Consequence is ecological, not moral",
      "Ground recovers toward its baseline and no further",
    ],
    openQuestions: ["Which extractions should require a licence, and who is entitled to issue one?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "Why salvage in the Reach is a risk decision rather than a loot table. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-shattercore", note: "Industrial extraction: the difference between dead scrap and a live bus is the difference between salvage and a breach." },
      { region: "the-mutation-belt", note: "Biological and grid harvest. Taking a herd role or a conductor changes migration and charge paths, not just inventory." },
      { region: "the-living-marsh", note: "Sink harvest country. The material that pays best is the material currently holding contamination out of the ocean." },
      { region: "blackweir", note: "The principal lawful harvest zone, and the clearest case of value and containment being the same tissue." },
      { region: "walking-orchard", note: "Cutting here can redirect an entire migration through a camp or a filtration bed." },
      { region: "splicefield-substation", note: "Live extraction reroutes charge through a hybrid ecology, and the fault comes back through the Complex." },
      { region: "lantern-pools", note: "Small repeated unlicensed sampling is the canonical way a stable place stops being stable." },
      { region: "reserve-vault-twelve", note: "Breach extraction: pulling material from an intact seal is an authored event, never an ordinary gather." },
      { region: "long-graze", note: "Removing herd organisms changes predators, browse, and the trail forecasts that other people rely on." },
    ],
    whatItIs: "Bloomfall harvesting is ordinary [[gathering-and-harvest]] with the regional consequence made explicit. Every take falls into one of five classes — **inert salvage**, **regenerative take**, **functional harvest**, **sink harvest**, and **breach extraction** — and the class, the method, and how much the ground can spare decide what happens afterwards.",
    whyItExists: "Bloomfall's economy is the reason anyone comes here. If extraction were consequence-free, the Reach would resolve into a farm and every other system would stop mattering. Tying the material to the function it performs turns each take into a legible trade: this resin is worth a great deal, and it is currently holding contamination out of [[the-ocean]].",
    whereItOperates: "[[blackweir]] and [[lantern-pools]] for sink material, [[walking-orchard]] and [[long-graze]] for biological and herd material, [[splicefield-substation]] and [[ashline-exchange]] for grid and industrial salvage, and [[reserve-vault-twelve]] for the material that cannot be taken without opening something.",
    inputs: "The consequence class of the resource, the extraction method, how much is taken relative to what that ground can spare, and its current recovery state. One sample does not trigger a catastrophe; accumulated removal past the ground's capacity does.",
    consequences: "Removing material removes function. Lower absorption raises free [[essence-saturation]]; a stripped conductor reroutes charge into [[reactor-cycles]]; a displaced herd changes what [[bloomfall-travel]] costs and where predators go. Creature aggression follows territory, brood disruption, exposed food, or altered flow — never a world that detects greed.",
    playerFacing: "Before a consequential take, the environment, the tools, and the people present should make the class understandable. Cut marks, missing carriers, exposed roots, and an instrument repeating itself are the field states. A player is allowed to decide the resource is worth the damage; they are not supposed to be surprised by it.",
    canonRule: "Absorption stores and transforms danger rather than erasing it, so a harvested sink transfers its cost rather than cancelling it. Recovery returns ground toward its regional baseline only. Bloomfall can never be cleansed or optimised into a safe farm.",
    futureGameplay: "A future runtime would track a bounded harvest pressure and sink integrity per authored area, expose them as qualitative field states rather than a score, and resolve delayed consequences through the systems that own them.",
    atlas: "Harvest stress appears only after inspection or a trusted report, as a mark on the place rather than a region-wide overlay.",
    related: links({
      systems: ["gathering-and-harvest", "marsh-absorption", "essence-saturation", "adaptive-mutation", "reactor-cycles", "bloomfall-travel", "persistent-damage"],
      places: ["blackweir", "lantern-pools", "walking-orchard", "long-graze", "splicefield-substation", "reserve-vault-twelve", "ashline-exchange", "the-living-marsh"],
      creatures: ["rootback-grazer", "sump-eel", "latchhound", "spore-lantern-colony", "mirejaw"],
      resources: ["sinkroot-fiber", "blackweir-resin", "quietwater-culture", "capacitor-tissue", "gridcore-alloy", "reserve-glass", "stormglass", "essence"],
      story: ["black-tide-at-blackweir", "root-of-the-bargain"],
      people: ["jaro-fen", "keira-ansel", "nalia-reed"],
    }),
    panel: "HARVEST_CLASSES",
  },
  {
    slug: "aberrant-escalation", title: "Aberrant Escalation & Roaming Threats", authoring: "UPGRADED",
    summary: "How a rare individual becomes a regional threat, how it moves, and why the map shows what the party knows rather than where it is.",
    parent: "adaptive-mutation", category: "world simulation",
    dependsOn: ["adaptive-mutation", "blackbloom-exposure", "essence-saturation"],
    pillars: [
      "A designation never replaces the base taxonomy",
      "Not every Aberrant roams, and none of them teleports",
      "The map shows information, not omniscience",
    ],
    openQuestions: [
      "Can each named Aberrant be permanently killed, and what replaces the role it was playing?",
      "Should a non-lethal resolution be able to retire a promoted survivor for good?",
    ],
    regionNotes: [
      { region: "bloomfall-reach", note: "The regional threat layer. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-mutation-belt", note: "Range-roaming country. The Bellwether changes migration here without ever having to fight anyone." },
      { region: "the-shattercore", note: "Site-anchored and event-mobile threats. Switchmother grows through the grid; the Last Shift answers a restart." },
      { region: "the-living-marsh", note: "Flow-territorial threats. The Old Drowner's territory is a hydrology, so its position changes as the water does." },
      { region: "long-graze", note: "Where tracking is taught: displaced herds, damaged browse, and several plausible directions at once." },
      { region: "splicefield-substation", note: "Switchmother's anchor. Her reach expands along powered ground rather than by roaming." },
      { region: "drowned-intake", note: "The Old Drowner's working range, and the reason the sea approach is conditional rather than permanent." },
    ],
    whatItIs: "An **Aberrant** is an organism, construct, or hybrid whose Blackbloom adaptation has reached an exceptional, individually recognisable state. It is a Bloomfall designation layered on an existing taxonomy — never a race, never a parent class replacing Monstrosity, and never a synonym for Abomination. This page also covers how such a threat persists, how it moves, and what the party is allowed to know about it.",
    whyItExists: "A region that keeps producing dangerous animals still needs a reason for any of them to be memorable. Escalation gives the Reach a small number of individuals with histories: a hart that changed a migration network, a monstrosity that became part of a substation, an animal that rebuilt a river, and a shift that never went home.",
    whereItOperates: "Across [[bloomfall-reach]], with each named threat bound to the kind of ground its body depends on: [[long-graze]] and the wider [[the-mutation-belt]] for [[the-bellwether]], [[splicefield-substation]] for [[switchmother]], [[drowned-intake]] and the marsh hydrology for [[old-drowner]], and the emergency routes of [[southreach-complex]] for [[the-last-shift]].",
    inputs: "Current and neighbouring [[essence-saturation]]; the [[reactor-cycles]] state where the threat is wired into infrastructure; the stage and path of any active [[bloomstorms]]; the condition of prey, herds, sinks, and machinery; harvesting or combat disturbance; and recent contact with the party. There is no separate mutation-pressure meter and no random boss spawn.",
    consequences: "An active threat changes what other animals do, which routes are worth using, and what a place is worth harvesting. Killing one is a legitimate answer with a cost: the Bellwether is also a regional warning network, and the Old Drowner is also a flood control structure.",
    playerFacing: "Tracks, displaced prey, damaged vegetation, altered hydrology, and specific wounds are the evidence. What the Atlas shows is an information state — **Rumoured**, **Tracked**, **Confirmed**, or **Lost** — with an age attached. A confirmed fix decays back toward tracked unless the threat is observed again or deliberately tagged.",
    canonRule: "Aberrant status is orthogonal to species eligibility under [[adaptive-mutation]]. Only [[blackbloom-hart]], [[mirejaw]], and [[latchhound]] can currently produce a promoted survivor. Named threats retreat when wounded rather than despawning, do not casually respawn, and a successor is a separate authored outcome rather than the same creature returning unexplained.",
    futureGameplay: "A future runtime would hold a small capped registry of promoted survivors alongside the named threats, move them off-screen with a scheduler, and keep the player's information as a separate record from the world's truth. Permanent GPS boss markers are prohibited.",
    atlas: "Fuzzy areas and directional arrows with an explicit freshness and information state. Never a permanent icon, and never a marker the party did not earn.",
    related: links({
      systems: ["adaptive-mutation", "essence-saturation", "reactor-cycles", "bloomstorms", "bloomfall-travel", "blackbloom-exposure", "harvesting-consequences"],
      places: ["long-graze", "splicefield-substation", "drowned-intake", "southreach-complex", "the-mutation-belt", "the-living-marsh", "cairnwood-camp"],
      creatures: ["the-bellwether", "switchmother", "old-drowner", "the-last-shift", "blackbloom-hart", "mirejaw", "latchhound", "bloommarked-remnant"],
      resources: ["capacitor-tissue"],
      story: ["the-bellwether-event", "menders-work"],
      people: ["mara-quill", "selene-ward", "maintenance-unit-m-17"],
    }),
    panel: "ABERRANT_PROFILES",
  },
  {
    slug: "bloomfall-travel", title: "Bloomfall Travel Conditions", authoring: "NEW",
    summary: "Why getting anywhere in the Reach is a decision: four classes of route, and a map that records what people know rather than what is true.",
    parent: "transportation", category: "world simulation",
    dependsOn: ["transportation", "essence-saturation", "reactor-cycles", "bloomstorms", "marsh-absorption", "aberrant-escalation"],
    pillars: [
      "A route's identity and a route's usability are different facts",
      "Some paths move, and the map should admit it",
      "Knowledge has an age",
    ],
    openQuestions: ["Should route knowledge be shared across a co-op party, or earned separately by whoever walked it?"],
    regionNotes: [
      { region: "bloomfall-reach", note: "Why the Reach has no ordinary through-travel. Canonical world behaviour; its mechanical realisation remains future gameplay design." },
      { region: "the-shattercore", note: "Conditional industrial travel: power, structure, and procedure decide which segments exist today." },
      { region: "the-mutation-belt", note: "Conditional and dynamic travel together. The surveyed trail is real; the herd corridor beside it is not a road." },
      { region: "the-living-marsh", note: "Almost entirely dynamic. Channels open and close with load, season, and coordination, and Heartfen gets no road at all." },
      { region: "ashline-exchange", note: "The controlled junction where the permanent landward corridor meets the rest of the Reach." },
      { region: "cairnwood-camp", note: "Where current field knowledge is bought, sold, and argued about before anyone leaves." },
      { region: "drowned-intake", note: "The conditional sea approach. Never a harbour, and never the same twice." },
      { region: "reedless-mile", note: "Dynamic crossings on narrow schedules. A corridor that existed last week proves nothing about this one." },
      { region: "walking-orchard", note: "The corridor moves because the landmark does. Marking it permanently would falsify it." },
      { region: "heartfen", note: "No canonical route. Access is an opening, not a path, and it may read as unverified even when it is there." },
    ],
    whatItIs: "Bloomfall travel separates three things that are usually collapsed together. A **connection** is what two places mean to each other. A **path** is stable geometry. **Usability** is whether that path is worth attempting today. Routes therefore fall into four classes: **permanent**, **conditional**, **dynamic**, and **deferred**.",
    whyItExists: "The Reach is a place where the ground itself is a hazard system, so travel had to stop being a solved problem. Classifying routes rather than drawing them all as roads keeps the Atlas honest: it can show a real corridor whose usability changes, or a corridor that genuinely moves, without pretending either is a highway.",
    whereItOperates: "Every approach into and across [[bloomfall-reach]]. One permanent corridor runs landward through [[ashline-exchange]] to [[riverlands]]. Three conditional lines carry the sea approach at [[drowned-intake]], the Belt survey trail from [[cairnwood-camp]] to [[glassroot-observatory]], and the Southreach service spine. Five dynamic corridors belong to ecology and hydrology, and three candidates remain deferred.",
    inputs: "Local [[essence-saturation]], the current [[reactor-cycles]] state where a segment is powered or structural, the stage and path of active [[bloomstorms]], harvest pressure under [[harvesting-consequences]], marsh coordination under [[marsh-absorption]], and named threat activity under [[aberrant-escalation]]. A reactor state never closes a distant trail by itself; it closes it by moving pressure there.",
    consequences: "A closed or expensive route changes which stories are reachable, which resources are worth taking, and whether a camp can hold its stock. Travel is also the most common way a player learns that something upstream has changed.",
    playerFacing: "Field reports have an age. A route is **known open**, **known closed**, **hazardous**, **unverified**, or **lost**, and most Bloomfall travel begins at unverified. [[mara-quill]] sells current trail knowledge; [[nalia-reed]] reads marsh openings; and the honest answer is sometimes that nobody has been through recently.",
    canonRule: "The border with [[magic-torn-wasteland]] is **geographic adjacency only**. No road, trail, hidden passage, or travel semantics exist across it, and none is implied by the two regions sharing an edge. Dynamic corridors are never promoted into base Atlas topology, and a deferred route is drawn as nothing at all.",
    futureGameplay: "A future runtime would own an authoritative route condition service keyed to the stable route identity, recording open, dangerous, or closed with a cause and a time, plus a separate per-party knowledge record with freshness.",
    atlas: "Permanent routes draw normally. Conditional routes keep their line and gain a restrained state treatment. Dynamic corridors appear only as a currently observed envelope with freshness. Deferred routes draw nothing, and route state never relies on colour alone.",
    related: links({
      systems: ["transportation", "essence-saturation", "reactor-cycles", "bloomstorms", "marsh-absorption", "aberrant-escalation", "harvesting-consequences", "bloomfall-environmental-hazards"],
      places: ["ashline-exchange", "cairnwood-camp", "glassroot-observatory", "drowned-intake", "reserve-vault-twelve", "crown-break", "walking-orchard", "reedless-mile", "long-graze", "heartfen", "blackweir", "redline-shelter-six"],
      creatures: ["old-drowner", "the-bellwether", "the-last-shift", "rootback-grazer"],
      resources: [],
      story: ["the-route-that-moves", "the-purge-window"],
      people: ["mara-quill", "nalia-reed", "jaro-fen"],
    }),
    panel: "ROUTE_CLASSES",
  },
] as const;

export const bloomfallSystemPageBySlug = new Map(bloomfallSystemPages.map((page) => [page.slug, page]));

const groupLabels: readonly (readonly [keyof BloomfallRelatedLinks, string])[] = [
  ["systems", "Systems"],
  ["places", "Places"],
  ["creatures", "Creatures"],
  ["resources", "Resources"],
  ["story", "Regional stories"],
  ["people", "People"],
];

function renderRelated(related: BloomfallRelatedLinks) {
  const rows = groupLabels
    .map(([key, label]) => [label, related[key]] as const)
    .filter(([, slugs]) => slugs.length > 0)
    .map(([label, slugs]) => `**${label}.** ${slugs.map((slug) => `[[${slug}]]`).join(" · ")}`);
  return rows.join("\n\n");
}

/** Deterministic Codex prose for one system page. The audit compares stored
 *  bodies against this exact output, so the database can never drift from the
 *  reviewed source without a test noticing. */
export function renderBloomfallSystemPage(page: BloomfallSystemPage) {
  const atlas = page.atlas ? `\n\n**On the Atlas.** ${page.atlas}` : "";
  return `${page.whatItIs}

## Why it exists

${page.whyItExists}

## Where it operates

${page.whereItOperates}

## What feeds it

${page.inputs}

## What it changes

${page.consequences}

## In play

${page.playerFacing}${atlas}

## Canon and status

${page.canonRule}

**Future gameplay behaviour.** ${page.futureGameplay}

${bloomfallFutureGameplayNotice}

## Related in the Codex

${renderRelated(page.related)}`;
}

export function bloomfallSystemPageMeta(page: BloomfallSystemPage) {
  return {
    category: page.category,
    buildStatus: "concept",
    parent: page.parent,
    unlockArc: null,
    unlockStage: "Future gameplay design; no runtime implementation claimed",
    dependsOn: [...page.dependsOn],
    pillars: [...page.pillars],
    regionNotes: page.regionNotes.map((row) => ({ region: row.region, note: row.note })),
    gameTag: null,
    openQuestions: [...page.openQuestions],
  };
}

export type BloomfallIntegrationRecord = {
  slug: string;
  kind: StoryEntryKind;
  authoring: "NEW" | "UPGRADED";
  title: string;
  summary: string;
  body: string;
  meta: Record<string, unknown>;
  revisionSummary: string;
};

const systemRecords: readonly BloomfallIntegrationRecord[] = bloomfallSystemPages.map((page) => ({
  slug: page.slug,
  kind: "SYSTEM" as StoryEntryKind,
  authoring: page.authoring,
  title: page.title,
  summary: page.summary,
  body: renderBloomfallSystemPage(page),
  meta: bloomfallSystemPageMeta(page),
  revisionSummary: page.authoring === "NEW"
    ? `Prompt E: created the ${page.title} Bloomfall system page`
    : `Prompt E: integrated ${page.title} into the connected Bloomfall system package`,
}));

export const bloomfallIntegrationRecords: readonly BloomfallIntegrationRecord[] = systemRecords;

export const bloomfallIntegrationBySlug = new Map(bloomfallIntegrationRecords.map((record) => [record.slug, record]));

export const bloomfallIntegrationNewSlugs = bloomfallIntegrationRecords.filter((record) => record.authoring === "NEW").map((record) => record.slug);
export const bloomfallIntegrationUpgradedSlugs = bloomfallIntegrationRecords.filter((record) => record.authoring === "UPGRADED").map((record) => record.slug);

/**
 * The second half of the integration: short, purposeful cross-link blocks
 * appended to records that Prompt A/B/D left as dead ends. These are appended
 * rather than rewritten, so the reviewed Prompt 3 and Prompt B prose survives
 * exactly as approved and the addition is auditable on its own.
 */
export type BloomfallCrossLinkBlock = {
  slug: string;
  kind: StoryEntryKind;
  source: "REGION_PACKAGE" | "CREATURE_ENHANCEMENT";
  block: string;
  revisionSummary: string;
};

const relatedBlock = (input: Partial<BloomfallRelatedLinks>) => `## Related in the Codex\n\n${renderRelated(links(input))}`;

export const bloomfallCrossLinkBlocks: readonly BloomfallCrossLinkBlock[] = [
  {
    slug: "bloomfall-reach", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: introduced the connected Bloomfall system package on the regional dossier",
    block: `**How the Reach behaves.** Eight rules explain almost everything a party will meet here, and each has its own dossier. [[essence-saturation]] is the ambient pressure, read in four field bands. [[reactor-cycles]] is the source that still adds to it from [[southreach-complex]]. [[bloomstorms]] are how that pressure travels. [[adaptive-mutation]] is how eligible life answers it, and [[aberrant-escalation]] is what happens on the rare occasion one individual answers it exceptionally. [[marsh-absorption]] is the ecology that binds the load instead of passing it to [[the-ocean]]. [[harvesting-consequences]] is why taking the valuable material has a price, and [[bloomfall-travel]] is why getting anywhere here is a decision rather than a distance.`,
  },
  {
    slug: "the-shattercore", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: linked the Shattercore to the systems that drive it",
    block: `**Systems that shape this ground.** The Shattercore is the region's source. [[reactor-cycles]] decides what is powered, what is venting, and what is about to fail; [[essence-saturation]] runs at an Active floor with the sharpest spikes in the Reach; and most [[bloomstorms]] are born here, usually at [[crown-break]]. Salvage is governed by [[harvesting-consequences]], where the difference between dead scrap and a live bus is the difference between a payment and a breach. Travel is conditional throughout under [[bloomfall-travel]]: power, structure, and obsolete procedure decide which segments exist today.`,
  },
  {
    slug: "the-mutation-belt", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: linked the Mutation Belt to the systems that drive it",
    block: `**Systems that shape this ground.** The Belt turns a small change in [[essence-saturation]] into a large change in what lives here, which is why [[adaptive-mutation]] expresses more strongly across this country than anywhere else in Martino. [[the-bellwether]] demonstrates what [[aberrant-escalation]] costs a migration network, and [[splicefield-substation]] shows what happens when a machine ecology and a living one share a circuit. Travel here is conditional and dynamic at once under [[bloomfall-travel]]: the surveyed trail to [[glassroot-observatory]] is real, and the herd corridor beside it is not a road.`,
  },
  {
    slug: "the-living-marsh", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: linked the Living Marsh to the systems that drive it",
    block: `**Systems that shape this ground.** [[marsh-absorption]] is the reason the Marsh usually shows the lowest free [[essence-saturation]] in the Reach while carrying its greatest bound load, and the reason damage here is so expensive. That makes [[harvesting-consequences]] sharper in the Marsh than anywhere else: the material worth the most is the material currently holding contamination out of [[the-ocean]]. [[bloomstorms]] passing over weakened sinks are how a stable pool becomes dangerous overnight. Travel is almost entirely dynamic under [[bloomfall-travel]], and [[heartfen]] receives no road at all.`,
  },
  {
    slug: "redline-shelter-six", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Redline Shelter Six to its systems and neighbours",
    block: `**In the wider Reach.** The shelter sits on the permanent landward corridor described in [[bloomfall-travel]], one stop past [[ashline-exchange]], which is why evacuation traffic reached it at all. Its sealed compartments answer to [[reactor-cycles]]: a Restart or a Purge can power a door that has not moved in twenty years, and opening one has to be weighed against the [[bloomfall-environmental-hazards]] trapped behind it. The maintenance recordings held here are the earliest evidence for [[the-last-shift]], and its casualty rolls are read alongside [[three-failure-reports]].`,
  },
  {
    slug: "cairnwood-camp", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Cairnwood Camp to its systems and neighbours",
    block: `**In the wider Reach.** Cairnwood is where Bloomfall travel is priced. Current field knowledge under [[bloomfall-travel]] is the camp's real trade: the conditional trail to [[glassroot-observatory]], the state of the corridor back through [[ashline-exchange]], and whatever [[aberrant-escalation]] has done to [[long-graze]] this month. Salvage contracts written here are governed by [[harvesting-consequences]], and a forecast under [[reactor-cycles]] or a warning under [[bloomstorms]] can force the whole camp to contract, move, or abandon stock.`,
  },
  {
    slug: "drowned-intake", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected the Drowned Intake to its systems and neighbours",
    block: `**In the wider Reach.** The Intake is the Reach's one conditional sea approach under [[bloomfall-travel]]: the alignment is stable and its usability is not. Hydrology under [[marsh-absorption]], storm state under [[bloomstorms]], old cooling flow waking under [[reactor-cycles]], and [[old-drowner]] working within its range can each close it. Reopening a gate is a [[harvesting-consequences]] decision as much as a navigational one, because the water beyond it reaches [[the-ocean]].`,
  },
  {
    slug: "reedless-mile", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected the Reedless Mile to its systems and neighbours",
    block: `**In the wider Reach.** The Mile's crossings are dynamic under [[bloomfall-travel]]: real, useful, and never permanent. Whatever suppresses the growth here is bound up with [[marsh-absorption]] and the local [[essence-saturation]], and researchers from [[glassroot-observatory]] still cannot separate contaminant, hydrology, and coordinated exclusion as explanations. [[mirejaw]] cross the opening on narrow schedules, and a corridor that opens after [[bloomstorms]] may close again before anyone maps it.`,
  },
  {
    slug: "reserve-vault-twelve", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Reserve Vault Twelve to its systems and neighbours",
    block: `**In the wider Reach.** Whether the vault is reachable at all is a [[reactor-cycles]] question: seals cycle, a Purge can open a reserve spine, and an Overflow can close it for good. What comes out is the Reach's clearest case of breach extraction under [[harvesting-consequences]], because cutting at an intact seal releases what the seal was holding and raises local [[essence-saturation]] in neighbouring sectors. The vault sits on the conditional Southreach service alignment described in [[bloomfall-travel]].`,
  },
  {
    slug: "ashline-exchange", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Ashline Exchange to its systems and neighbours",
    block: `**In the wider Reach.** Ashline is the one place on the Reach's only permanent route, and [[bloomfall-travel]] is why that matters: everything landward passes through here, so a closure at this junction is felt at [[cairnwood-camp]] and [[southreach-complex]] alike. Whether the interchange is usable depends on power and structure under [[reactor-cycles]] rather than on anyone locking a door, and its buried freight is inert salvage under [[harvesting-consequences]] — the safest class of work in the Shattercore, and the least valuable.`,
  },
  {
    slug: "heartfen", kind: "REGION", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Heartfen to its systems and neighbours",
    block: `**In the wider Reach.** Heartfen is [[marsh-absorption]] at its most concentrated and least explicable: channels close before upstream surges reach local instruments, and damaged beds are isolated and consumed while their neighbours are fed. That makes its free [[essence-saturation]] low and its bound load enormous, and it makes [[harvesting-consequences]] here a containment question rather than an economic one. [[bloomfall-travel]] gives it no road at all; access is an opening, and an opening is not a path.`,
  },
  {
    slug: "reserve-glass", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Reserve Glass its harvest class and system links",
    block: `**Harvest class.** Loose vault fragments are inert salvage; cutting from an intact seal is **breach extraction** under [[harvesting-consequences]], which is an authored incident rather than a gather. Availability is gated by [[reactor-cycles]], since [[reserve-vault-twelve]] opens and reseals with the cycle, and a bad extraction moves pressure into neighbouring sectors and raises local [[essence-saturation]].`,
  },
  {
    slug: "gridcore-alloy", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Gridcore Alloy its harvest class and system links",
    block: `**Harvest class.** Dead scrap is **inert salvage**; pulling a live bus is functional harvest or worse under [[harvesting-consequences]]. A stripped conductor changes what happens at the next Sector Restart under [[reactor-cycles]], and at [[splicefield-substation]] it changes the circuit that [[latchhound]] packs and [[switchmother]] already share.`,
  },
  {
    slug: "capacitor-tissue", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Capacitor Tissue its harvest class and system links",
    block: `**Harvest class.** Shed and dead tissue is a regenerative take; cutting it from a living animal or from the live network is **functional harvest** under [[harvesting-consequences]]. The organs exist because of [[adaptive-mutation]], so removing them from a population changes what that population expresses next, and taking them out of the Splicefield network reroutes charge back through [[reactor-cycles]].`,
  },
  {
    slug: "sinkroot-fiber", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Sinkroot Fiber its harvest class and system links",
    block: `**Harvest class.** Shed mats and nonlethal trimming are a **regenerative take**; stripping a bed is **sink harvest**, because that root is containment infrastructure under [[marsh-absorption]]. A stripped bed lowers absorption, which raises free [[essence-saturation]] downstream and can change what [[bloomstorms]] do to ground that used to be safe.`,
  },
  {
    slug: "blackweir-resin", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Blackweir Resin its harvest class and system links",
    block: `**Harvest class.** **Sink harvest** beyond a small licensed sample, under [[harvesting-consequences]]. The resin is valuable precisely because it is holding a load; the quota exists to keep [[blackweir]] performing the containment that [[marsh-absorption]] depends on. [[black-tide-at-blackweir]] is what that trade-off looks like when the load arrives faster than the beds can take it.`,
  },
  {
    slug: "quietwater-culture", kind: "ITEM", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: gave Quietwater Culture its harvest class and system links",
    block: `**Harvest class.** **Sink harvest**, even in small volumes, under [[harvesting-consequences]]. The culture is the reason [[lantern-pools]] reads low on [[essence-saturation]], so repeated unlicensed sampling is the canonical way a stable place stops being stable. [[spore-lantern-colony]] growth makes the pools legible at night and belongs to the same fragile chemistry.`,
  },
  {
    slug: "selene-ward", kind: "CHARACTER", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Major Ward to the systems her authority covers",
    block: `**Where her authority meets the systems.** Ward's containment mandate is written against [[reactor-cycles]] and [[bloomfall-environmental-hazards]]: she decides who is allowed inside a sector and when a forecast closes it. She rules on access along the corridor described in [[bloomfall-travel]], signs or refuses the extraction permits governed by [[harvesting-consequences]], and calls the evacuation when [[bloomstorms]] warnings reach [[cairnwood-camp]].`,
  },
  {
    slug: "mara-quill", kind: "CHARACTER", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Mara Quill to the systems her fieldwork reads",
    block: `**Where her fieldwork meets the systems.** Quill sells the thing [[bloomfall-travel]] makes valuable: current knowledge, with an honest age on it. She reads [[adaptive-mutation]] from behaviour rather than anatomy, tracks named threats under [[aberrant-escalation]] without pretending a sighting is a position, and treats the warning stage of [[bloomstorms]] as an animal signal long before an instrument agrees.`,
  },
  {
    slug: "nalia-reed", kind: "CHARACTER", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Nalia Reed to the systems the Marsh runs on",
    block: `**Where her guiding meets the systems.** Reed navigates the dynamic marsh corridors described in [[bloomfall-travel]], which means she is reading [[marsh-absorption]] directly: which channel closed, which bed is being sacrificed, and which opening is worth trusting. She argues that [[harvesting-consequences]] reach the people living downstream long before they appear in a survey, and she will not describe coordinated behaviour as speech.`,
  },
  {
    slug: "the-bloomfall", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected the Bloomfall to the systems it created",
    block: `**Systems in play.** Every Bloomfall system dates from this event. The release created [[blackbloom-exposure]] and the ambient pressure now read as [[essence-saturation]]; the surviving plant is why [[reactor-cycles]] still run; the ecology that answered the pressure is [[adaptive-mutation]]; and the front stopped because [[marsh-absorption]] stopped it. What the disaster did not do is settle its own cause.`,
  },
  {
    slug: "the-last-safe-reading", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected the Last Safe Reading to its systems",
    block: `**Systems in play.** The window is owned by [[reactor-cycles]]: a sector state opens the archive, and the next one overwrites the buffer, so the investigation is a forecast problem before it is a research one. Reaching it at all is a [[bloomfall-travel]] question along the conditional Southreach alignment, and the interior belongs to [[the-last-shift]] and its routines.`,
  },
  {
    slug: "three-failure-reports", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Three Failure Reports to its systems",
    block: `**Systems in play.** The three reports disagree about where the first failure began, which is why the Codex describes [[reactor-cycles]] as observed sector behaviour rather than as one surviving controller. They are recovered under the same conditions as any Southreach salvage — cycle state, structure, and [[bloomfall-travel]] — and what they establish is that [[blackbloom-exposure]] has an incomplete origin story, not a proven culprit.`,
  },
  {
    slug: "reserve-twelve", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Reserve Twelve to its systems",
    block: `**Systems in play.** The recovery window is a [[reactor-cycles]] state and the recovery itself is breach extraction under [[harvesting-consequences]]: the material is valuable because a seal is still holding it. A bad cut moves pressure into neighbouring sectors and raises [[essence-saturation]] where nobody is standing, which is the whole reason ownership of the vault matters less than the timing of the entry.`,
  },
  {
    slug: "root-of-the-bargain", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Root of the Bargain to its systems",
    block: `**Systems in play.** The exchange being tested is [[marsh-absorption]] behaving as though it were negotiating: returned biomass, then an opening. Whether the return is worth anything to the marsh is a [[harvesting-consequences]] question about restoring sink capacity, and the opening it grants is a dynamic corridor under [[bloomfall-travel]] that will close again. Coordination is measured; consciousness is not.`,
  },
  {
    slug: "the-bellwether-event", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected the Bellwether incident to its systems",
    block: `**Systems in play.** This is [[aberrant-escalation]] as a story rather than a boss: one individual whose presence changes expression under [[adaptive-mutation]] across a whole migration. The consequence lands through [[bloomfall-travel]], because the herd corridor across [[long-graze]] is what [[cairnwood-camp]] uses to reach the north.`,
  },
  {
    slug: "menders-work", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Mender's Work to its systems",
    block: `**Systems in play.** A completed repair changes which transition is legal under [[reactor-cycles]], which is why the technically successful outcome can be the dangerous one. The material M-17 uses is governed by [[harvesting-consequences]], and waking an old feeder raises [[essence-saturation]] along the grid ground that [[switchmother]] and [[latchhound]] already occupy.`,
  },
  {
    slug: "the-route-that-moves", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected The Route That Moves to its systems",
    block: `**Systems in play.** This is the canonical dynamic corridor described in [[bloomfall-travel]]: real, useful, and impossible to keep. The orchard leaves the ground behind it because it is abandoning rising [[essence-saturation]], and the marsh opening that completes the crossing belongs to [[marsh-absorption]]. Marking the corridor permanently would falsify the behaviour that created it.`,
  },
  {
    slug: "black-tide-at-blackweir", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected Black Tide at Blackweir to its systems",
    block: `**Systems in play.** The load arrives through [[reactor-cycles]] and [[essence-saturation]] and is answered by [[marsh-absorption]], which is why the weir sacrifices ground rather than failing outright. Whether the beds could have taken it depends on how much [[harvesting-consequences]] had already cost them, and the shifting front changes the conditional sea approach under [[bloomfall-travel]].`,
  },
  {
    slug: "the-purge-window", kind: "EVENT", source: "REGION_PACKAGE",
    revisionSummary: "Prompt E: connected The Purge Window to its systems",
    block: `**Systems in play.** A Purge is the rare controlled state in [[reactor-cycles]], and the whole incident is a trade: source [[essence-saturation]] drops sharply while a larger declared load is exported downstream into [[marsh-absorption]]. Sealed access opens on a strict timer, so [[bloomfall-travel]] conditions and [[harvesting-consequences]] decide together whether the window is worth entering.`,
  },
];

const creatureCrossLinks: readonly { slug: string; kind: StoryEntryKind; related: Partial<BloomfallRelatedLinks> }[] = [
  { slug: "blackbloom-hart", kind: "CREATURE", related: { systems: ["adaptive-mutation", "essence-saturation", "bloomstorms", "aberrant-escalation"], places: ["long-graze", "the-mutation-belt", "cairnwood-camp"], creatures: ["the-bellwether", "rootback-grazer", "latchhound"], story: ["the-bellwether-event"], people: ["mara-quill"] } },
  { slug: "rootback-grazer", kind: "CREATURE", related: { systems: ["adaptive-mutation", "harvesting-consequences", "marsh-absorption"], places: ["long-graze", "walking-orchard", "the-mutation-belt"], creatures: ["blackbloom-hart", "mirejaw"], resources: ["sinkroot-fiber"], story: ["the-route-that-moves"], people: ["mara-quill"] } },
  { slug: "glasswing-kite", kind: "CREATURE", related: { systems: ["adaptive-mutation", "bloomstorms", "essence-saturation"], places: ["crown-break", "the-shattercore", "the-mutation-belt"], creatures: ["blackbloom-hart"], resources: ["stormglass"], people: ["mara-quill"] } },
  { slug: "mirejaw", kind: "CREATURE", related: { systems: ["adaptive-mutation", "marsh-absorption", "aberrant-escalation", "harvesting-consequences"], places: ["blackweir", "reedless-mile", "the-living-marsh"], creatures: ["sump-eel", "old-drowner"], story: ["black-tide-at-blackweir"], people: ["nalia-reed"] } },
  { slug: "sump-eel", kind: "CREATURE", related: { systems: ["adaptive-mutation", "reactor-cycles", "harvesting-consequences"], places: ["splicefield-substation", "drowned-intake", "the-shattercore"], creatures: ["mirejaw", "latchhound"], resources: ["capacitor-tissue"] } },
  { slug: "spore-lantern-colony", kind: "CREATURE", related: { systems: ["adaptive-mutation", "marsh-absorption", "harvesting-consequences"], places: ["lantern-pools", "the-living-marsh"], resources: ["quietwater-culture"], people: ["keira-ansel"] } },
  { slug: "latchhound", kind: "CREATURE", related: { systems: ["adaptive-mutation", "reactor-cycles", "aberrant-escalation", "essence-saturation"], places: ["splicefield-substation", "southreach-complex", "the-shattercore"], creatures: ["switchmother", "sump-eel", "blackbloom-hart"], resources: ["capacitor-tissue", "gridcore-alloy"], story: ["menders-work"] } },
  { slug: "bloommarked-remnant", kind: "CREATURE", related: { systems: ["blackbloom-exposure", "adaptive-mutation", "bloomfall-environmental-hazards", "lasting-wounds"], places: ["redline-shelter-six", "the-shattercore", "cairnwood-camp"], creatures: ["the-last-shift"], story: ["three-failure-reports"] } },
  { slug: "the-bellwether", kind: "CREATURE", related: { systems: ["aberrant-escalation", "adaptive-mutation", "bloomfall-travel"], places: ["long-graze", "cairnwood-camp", "the-mutation-belt"], creatures: ["blackbloom-hart", "rootback-grazer"], story: ["the-bellwether-event"], people: ["mara-quill"] } },
  { slug: "switchmother", kind: "CREATURE", related: { systems: ["aberrant-escalation", "reactor-cycles", "harvesting-consequences"], places: ["splicefield-substation", "southreach-complex"], creatures: ["latchhound", "sump-eel"], resources: ["capacitor-tissue", "gridcore-alloy"], story: ["menders-work"], people: ["maintenance-unit-m-17"] } },
  { slug: "old-drowner", kind: "CREATURE", related: { systems: ["aberrant-escalation", "marsh-absorption", "bloomfall-travel"], places: ["drowned-intake", "blackweir", "the-living-marsh"], creatures: ["mirejaw"], people: ["nalia-reed"] } },
  { slug: "the-last-shift", kind: "CREATURE", related: { systems: ["aberrant-escalation", "reactor-cycles", "bloomfall-travel"], places: ["southreach-complex", "redline-shelter-six", "ashline-exchange"], creatures: ["bloommarked-remnant"], story: ["three-failure-reports", "the-last-safe-reading"], people: ["tomas-vey"] } },
  { slug: "maintenance-unit-m-17", kind: "CHARACTER", related: { systems: ["reactor-cycles", "adaptive-mutation", "harvesting-consequences"], places: ["splicefield-substation", "southreach-complex"], creatures: ["switchmother", "latchhound"], resources: ["gridcore-alloy", "capacitor-tissue"], story: ["menders-work"], people: ["tomas-vey"] } },
];

export const bloomfallCreatureCrossLinkBlocks: readonly BloomfallCrossLinkBlock[] = creatureCrossLinks.map((entry) => ({
  slug: entry.slug,
  kind: entry.kind,
  source: "CREATURE_ENHANCEMENT" as const,
  block: relatedBlock(entry.related),
  revisionSummary: "Prompt E: connected the dossier to the Bloomfall systems, places, and resources it belongs to",
}));

export const bloomfallAllCrossLinkBlocks: readonly BloomfallCrossLinkBlock[] = [...bloomfallCrossLinkBlocks, ...bloomfallCreatureCrossLinkBlocks];

export const bloomfallCrossLinkBlockBySlug = new Map(bloomfallAllCrossLinkBlocks.map((block) => [block.slug, block]));

/** Every slug this phase writes to, in one place for the apply tool and audit. */
export const bloomfallIntegrationTouchedSlugs = [
  ...bloomfallIntegrationRecords.map((record) => record.slug),
  ...bloomfallAllCrossLinkBlocks.map((block) => block.slug),
];

/**
 * The approved body a record held before this phase, read from the Prompt 3
 * package or the Prompt B renderer rather than from the database. The apply
 * tool writes only when what it finds is exactly this, or already the target.
 */
export function bloomfallIntegrationBaselineBody(slug: string): string | null {
  const enhancement = bloomfallCreatureEnhancementBySlug.get(slug);
  if (enhancement) return renderBloomfallCreatureEnhancement(enhancement);
  if (slug === bloomfallReachSlug) return bloomfallMainRegion.body;
  return packageBodyBySlug.get(slug) ?? null;
}

/**
 * Every approved state a record may be found in before this phase lands.
 *
 * A Codex that has already received the creature enhancement holds the
 * rendered Prompt B dossier; one that has not — production, until this
 * release — still holds the original Prompt 3 body. Both are reviewed states,
 * and both promote to the same target, so a release accepts either and
 * refuses anything else.
 */
export function bloomfallIntegrationPriorBodies(slug: string): string[] {
  const bodies = [
    slug === bloomfallReachSlug ? bloomfallMainRegion.body : packageBodyBySlug.get(slug) ?? null,
    bloomfallIntegrationBaselineBody(slug),
  ].filter((body): body is string => body !== null);
  return [...new Set(bodies)];
}

/** What the record must hold once this phase has been applied. */
export function bloomfallIntegrationExpectedBody(slug: string): string | null {
  const record = bloomfallIntegrationBySlug.get(slug);
  if (record) return record.body;
  const block = bloomfallCrossLinkBlockBySlug.get(slug);
  if (!block) return null;
  const baseline = bloomfallIntegrationBaselineBody(slug);
  return baseline === null ? null : `${baseline}\n\n${block.block}`;
}

/** Slug-typed references this phase introduces, for the broken-link audit. */
export function bloomfallIntegrationReferencedSlugs(): string[] {
  const bodies = [
    ...bloomfallIntegrationRecords.map((record) => record.body),
    ...bloomfallAllCrossLinkBlocks.map((block) => block.block),
  ];
  const found = new Set<string>();
  for (const body of bodies) for (const match of body.matchAll(/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|[^\]]*)?\]\]/g)) found.add(match[1]!);
  for (const record of bloomfallIntegrationRecords) {
    const meta = record.meta as { parent?: unknown; dependsOn?: unknown; regionNotes?: unknown };
    if (typeof meta.parent === "string") found.add(meta.parent);
    if (Array.isArray(meta.dependsOn)) for (const slug of meta.dependsOn) if (typeof slug === "string") found.add(slug);
    if (Array.isArray(meta.regionNotes)) for (const row of meta.regionNotes) if (row && typeof row === "object" && typeof (row as { region?: unknown }).region === "string") found.add((row as { region: string }).region);
  }
  return [...found].sort();
}
