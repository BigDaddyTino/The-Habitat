import type { StoryEntryKind, StoryInvolvementKind } from "@habitat/shared";

export const bloomfallRegionId = "a64869df-c623-49ec-9236-dd306a3fd5c7";
export const bloomfallScene = {
  id: "1d8fe347-8ce8-5bc1-ae5c-6ee5dedab54f",
  slug: "martino-bloomfall-reach",
  title: "Bloomfall Reach",
  artVersion: "foundation",
  imageWidth: 1536,
  imageHeight: 1024,
  coordinateWidth: 100000,
  coordinateHeight: 66667,
} as const;

export type BloomfallEntrySeed = {
  readonly kind: StoryEntryKind;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly meta: Record<string, unknown> | null;
};

export const bloomfallMainRegion = {
  summary: "Bloomfall Reach, the Living Ruin: a former strategic Essence reserve transformed by the Bloomfall and contained by a mature adaptive marsh.",
  body: `Bloomfall Reach is the southeastern region once administered as the **Southreach Energy Reserve**, commonly shortened to Southreach. Its name now echoes that lost identity. Southreach grew around the state-owned **Southreach Strategic Essence Reserve, Refinery, and Gridworks**, now called [[southreach-complex]], and its worker districts, freight lines, cooling works, storage banks, substations, research sites, and emergency infrastructure.

Roughly two decades ago, [[the-bloomfall]] began during a strategic reserve-balancing cycle. The accepted public history states: **A cascading industrial control and containment failure during strategic load balancing drove multiple Essence storage banks into uncontrolled resonance. Isolation systems failed faster than the facility could segment the reserve, causing a catastrophic regional release.** Energized [[essence]] entered air, cooling water, groundwater, drains, and terrain. Infrastructure accelerated it south. The resulting environmental contamination and adaptation is [[blackbloom-exposure]], commonly called the Blackbloom, and is explicitly distinct from [[the-seven-phases-of-corruption]].

The Reach progresses north to south. [[the-shattercore]] holds the broken Complex, cycling reactors, sealed records, and industrial salvage. [[the-mutation-belt]] is mature adaptive country where routes, organisms, and grid ecologies continue changing. [[the-living-marsh]] absorbed the southern front and stopped its oceanward advance. Coordinated marsh behavior is confirmed; consciousness is unproven. That distinction makes the marsh both a containment system and the region's deepest living question.

Bloomfall Reach remains visited because its finite stores of [[essence]], [[stormglass]], [[reserve-glass]], [[gridcore-alloy]], and biological materials matter to containment, industry, research, and survival. NDD holds containment authority; Aegis operates licensed recovery and carries the historical industrial role; Meridian studies and certifies; Wardens track field threats. ACA, the Peninsula Expeditionary Army, the Stormglass Cartel, and Verdant-linked guides have narrower interests. Helix involvement remains unconfirmed. None of these relationships establishes responsibility for the disaster.

Landward travel uses the controlled historical Southreach freight road to [[riverlands]]. Hazardous shallow-draft access reaches [[the-ocean]] through [[drowned-intake]]; it is not a safe commercial harbor. [[magic-torn-wasteland]] shares a geographic border only, with no authored semantic travel route. Cairnwood and field shelters persist because people choose dangerous work here, not because the Reach has become an ordinary settled province.

Pre-failure records disagree about clocks, containment telemetry, reserve inventory, load balancing, and interlock state. Evidence permits sabotage, removed safeguards, experimental storage, falsified inventories, hidden research, political coverup, something beneath Southreach, or several parties lying for unrelated reasons. Regional stories may prove the official account incomplete. They may not establish the real culprit or connect it to the main campaign. **DEEP_MYSTERY_TRUTH = DEFERRED.**`,
  meta: {
    type: "region", settlementTier: null, parent: null,
    biome: "industrial rupture in the north, mature adaptive ecology through the center, and coordinated filtration marsh in the south",
    control: [
      { faction: "national-defense-directorate", kind: "influences" },
      { faction: "aegis-extraction-consortium", kind: "influences" },
      { faction: "meridian-arcane-institute", kind: "influences" },
      { faction: "wardens-monster-hunter-guild", kind: "influences" },
    ],
    population: "No major permanent city; expedition staff, security personnel, researchers, salvagers, guides, and scattered survivors.",
    connections: [],
    status: "Canonical hazardous region; controlled expedition access, no ordinary through-travel.", veilAnchorTier: null, soulForge: null, gameTag: null,
    openQuestions: [
      "DEEP_MYSTERY_TRUTH = DEFERRED: what actually caused the Bloomfall?",
      "Does coordinated Living Marsh behavior indicate consciousness? Evidence confirms coordination only.",
      "How, if at all, will Bloomfall Reach integrate with the future main campaign?",
    ],
  },
} as const;

const placeMeta = (type: "zone" | "settlement" | "landmark" | "site" | "destination", parent: string, biome: string, status: string, _connections: Array<{ to: string; by: string; notes: string }> = [], control: Array<{ faction: string; kind: "holds" | "contests" | "influences" }> = []) => {
  // Traversal prose belongs in the dossier; Atlas routes are authored as semantic connections.
  void _connections;
  return {
    type, settlementTier: null, parent, biome, control, population: null, connections: [], status,
    veilAnchorTier: null, soulForge: null, gameTag: null, openQuestions: [],
  };
};

const itemMeta = (category: string, rarity: string, origin: string, questions: string[] = []) => ({ category, rarity, origin, gameId: null, openQuestions: questions });

const creatureMeta = (parent: string, category: "natural" | "magical" | "monstrosity" | "supernatural", biomes: string[], threat: string, harvest: string, questions: string[] = []) => ({ category, parent, biomes, threat, harvest, gameId: null, openQuestions: questions });

const systemMeta = (category: "world simulation" | "progression" | "economy" | "combat", parent: string | null, dependsOn: string[], pillars: string[], questions: string[] = []) => ({
  category, buildStatus: "concept", parent, unlockArc: null, unlockStage: "Future gameplay design; no runtime implementation claimed", dependsOn, pillars,
  regionNotes: [{ region: "bloomfall-reach", note: "Canonical world behavior; its mechanical realization remains future gameplay design." }], gameTag: null, openQuestions: questions,
});

const eventMeta = (when: string, where: string[], involved: string[], outcome: string, timelineYearsAgo: number | null = null, questions: string[] = []) => ({ when, timelineYearsAgo, where, involved, outcome, openQuestions: questions });

const characterMeta = (input: {
  fullName: string; aliases?: string[]; pronouns: string; species?: string; age: string; appearance: string; voice: string;
  factions: Array<{ faction: string; role: string; standing: string }>; home: string; known: string; actual: string;
  relationships?: Array<{ character: string | null; who: string | null; type: string | null }>;
  storyRole: string; involvement: Array<{ ref: string; kind: StoryInvolvementKind; how: string }>; model: string; questions?: string[];
}) => ({
  fullName: input.fullName, aliases: input.aliases ?? [], pronouns: input.pronouns, sex: null, species: input.species ?? "Human", age: input.age,
  appearance: input.appearance, voice: input.voice,
  magic: { origin: null, schools: [], corruptionPhase: null, notes: "Blackbloom exposure is environmental adaptation, not Seven-Phase Corruption." },
  factions: input.factions, home: input.home, status: { known: input.known, actual: input.actual }, relationships: input.relationships ?? [],
  // The four character-bible ledgers. Empty here: these are regional dossiers
  // written before the ledgers existed, and an invented trade would be a claim
  // nobody made.
  background: null, professions: [], skills: [], cybernetics: [],
  storyRole: input.storyRole, involvement: input.involvement, gameId: null, model: input.model,
  companion: { capable: false, availability: "Regional non-companion character.", status: "Not recruitable." }, openQuestions: input.questions ?? [],
});

export const bloomfallSubregions: readonly BloomfallEntrySeed[] = [
  {
    kind: "REGION", slug: "the-shattercore", title: "Shattercore",
    summary: "Bloomfall Reach's northern industrial ruin, centered on the broken Southreach Complex and its cycling reactor sectors.",
    body: `The Shattercore is the northern wound of [[bloomfall-reach]], where the Southreach Strategic Essence Reserve, Refinery, and Gridworks failed during [[the-bloomfall]]. Its fractured containment rings, storage banks, freight lines, and cooling works form a vertical industrial ruin around [[southreach-complex]]. [[crown-break]] still vents Blackbloom-charged weather over the district, while [[reserve-vault-twelve]], [[ashline-exchange]], and [[redline-shelter-six]] preserve incompatible pieces of the official record.

The Shattercore is neither dead nor stable. [[reactor-cycles]] can make a quiet sector restart, purge, or breach without warning; [[blackbloom-overcharge]] turns the resulting saturation into both magical opportunity and lethal instability. NDD patrols gate approved entry, Aegis salvage crews recover strategic material, Meridian teams audit containment, and unauthorized crews hunt [[gridcore-alloy]] and [[reserve-glass]]. Their interests overlap without making any institution the proven author of the disaster.`,
    meta: placeMeta("zone", "bloomfall-reach", "fractured magitech refinery, reserve banks, and industrial exclusion zone", "Canonical hazardous subregion; controlled expedition access only.", [
      { to: "the-mutation-belt", by: "broken freight and drainage corridors", notes: "The same infrastructure that once served Southreach carried contamination south." },
    ], [{ faction: "national-defense-directorate", kind: "holds" }, { faction: "aegis-extraction-consortium", kind: "influences" }, { faction: "meridian-arcane-institute", kind: "influences" }]),
  },
  {
    kind: "REGION", slug: "the-mutation-belt", title: "Mutation Belt",
    summary: "A broad middle country where mature Blackbloom ecology has remade farms, substations, forests, and migration routes.",
    body: `The Mutation Belt is the central breadth of [[bloomfall-reach]], beyond the Shattercore's immediate wreckage but still inside the mature Blackbloom ecology. It is a mosaic of altered woodland, failed agriculture, mobile root masses, conductive growth, and old utility corridors. [[glassroot-observatory]] studies the changes; [[cairnwood-camp]] equips expeditions; [[walking-orchard]], [[splicefield-substation]], and [[long-graze]] demonstrate that adaptation is neither random decoration nor a single new taxonomy.

Travel depends on recent field knowledge. Trails close, feeding ranges shift, and a route safe at dawn can become a migration corridor by dusk. Wardens track named Aberrants, Aegis contractors bargain for salvage, and Meridian records mutation families under [[adaptive-mutation]]. The Belt remains valuable because it yields unique biological materials and because its surviving infrastructure is the least impossible landward approach to Southreach.`,
    meta: placeMeta("zone", "bloomfall-reach", "adaptive forest, migrating orchard, overgrown gridlands, and altered grassland", "Canonical expedition country; routes are temporary and actively surveyed.", [
      { to: "the-shattercore", by: "surveyed industrial approaches", notes: "Northbound access narrows into the containment zone." },
      { to: "the-living-marsh", by: "moving trails and drainage causeways", notes: "The southern ground changes around marsh absorption cycles." },
    ], [{ faction: "wardens-monster-hunter-guild", kind: "influences" }, { faction: "meridian-arcane-institute", kind: "influences" }]),
  },
  {
    kind: "REGION", slug: "the-living-marsh", title: "Living Marsh",
    summary: "The ancient southern wetlands that halted the Blackbloom's oceanward advance through confirmed coordinated ecological behavior.",
    body: `The Living Marsh is the southern wetland of [[bloomfall-reach]] and the reason the catastrophe did not continue into [[the-ocean]]. When the Blackbloom front reached these old wetlands, filtration roots, sink organisms, microbial cultures, and altered predators redistributed contamination until the oceanward advance stopped. Researchers now confirm coordinated behavior: channels close before surges, root systems sacrifice contaminated ground, and resources move toward stressed filtration zones. Consciousness remains unproven; there is no confirmed hive mind, telepathy, central organism, or marsh god.

[[blackweir]] and [[drowned-intake]] are the practical edge of harvesting and hazardous sea access. [[lantern-pools]] offers deceptive stability, [[reedless-mile]] refuses expected growth, and [[heartfen]] makes statistical coincidence hardest to defend. [[marsh-absorption]] explains the observed process without settling what, if anything, chooses it. Nalia Reed guides by personal agreement, not by a territorial claim from the Verdant Marsh Clans.`,
    meta: placeMeta("zone", "bloomfall-reach", "ancient adaptive wetland, filtration roots, sink ecologies, and shallow coastal approaches", "Canonical active containment ecology; coordinated behavior confirmed, consciousness unproven.", [
      { to: "the-mutation-belt", by: "moving marsh trails", notes: "Passage follows temporary openings rather than a permanent road." },
      { to: "the-ocean", by: "hazardous shallow-draft approach", notes: "Historical access through the Drowned Intake is not a safe harbor." },
    ], [{ faction: "meridian-arcane-institute", kind: "influences" }, { faction: "verdant-marsh-clans", kind: "influences" }]),
  },
] as const;

export const bloomfallPois: readonly BloomfallEntrySeed[] = [
  {
    kind: "REGION", slug: "southreach-complex", title: "Southreach Complex",
    summary: "The broken strategic Essence reserve, refinery, and gridworks at the center of the Bloomfall.",
    body: `The formal record names this state asset the **Southreach Strategic Essence Reserve, Refinery, and Gridworks**. The Southreach Complex combined strategic [[essence]] storage, refining, heavy plant, freight, cooling, grid dispatch, research, and emergency systems. Aegis operated intake, refining, storage, heavy works, and logistics; NDD secured the site and classified inventory; Meridian certified containment, assayed Essence, and supplied research oversight; civilian grid administrators balanced public loads.

Roughly two decades after [[the-bloomfall]], parts of the Complex still restart, stabilize, vent, purge, overflow, and fail under [[reactor-cycles]]. [[tomas-vey]] can read its obsolete controls, [[maintenance-unit-m-17]] still attempts repairs, and [[the-last-shift]] repeats old routines inside it. [[gridcore-alloy]], [[reserve-glass]], and surviving Essence make every expedition consequential. Records may support sabotage, removed safeguards, experimental storage, falsified inventories, hidden research, coverups, or something below the facility, but they do not yet establish the true cause.`,
    meta: placeMeta("site", "the-shattercore", "collapsed reserve banks, refinery towers, grid halls, cooling infrastructure, and subterranean sectors", "Canonical megastructure; interior scene reserved for later art and level planning.", [
      { to: "reserve-vault-twelve", by: "sealed reserve spine", notes: "A deep internal route whose current state changes with reactor cycles." },
      { to: "ashline-exchange", by: "freight viaduct", notes: "The old logistics artery is fractured but intermittently passable." },
    ], [{ faction: "national-defense-directorate", kind: "holds" }, { faction: "aegis-extraction-consortium", kind: "contests" }, { faction: "meridian-arcane-institute", kind: "influences" }]),
  },
  {
    kind: "REGION", slug: "crown-break", title: "Crown Break", summary: "The Shattercore's largest visible containment rupture and principal Blackbloom vent.",
    body: `Crown Break is where the upper containment crown tore outward during [[the-bloomfall]]. The rupture exposes layered reserve architecture like a split metal mountain and remains the Shattercore's visual anchor. Its periodic emissions drive local [[essence-saturation]], violent [[blackbloom-overcharge]], and Bloomstorm conditions. Surveyors use the silhouette to navigate; they do not use the air beneath it without a current [[reactor-cycles]] forecast. Vent deposits can form [[stormglass]], but collecting them during a surge trades extraordinary value for an equally extraordinary chance of permanent injury.`,
    meta: placeMeta("landmark", "the-shattercore", "ruptured containment crown, vent plume, vitrified industrial slopes", "Canonical landmark; access varies with reactor state."),
  },
  {
    kind: "REGION", slug: "reserve-vault-twelve", title: "Reserve Vault Twelve", summary: "A sealed strategic storage level whose contents and ledgers contradict the public account.",
    body: `Reserve Vault Twelve is a deep storage level of [[southreach-complex]], isolated after the first resonance cascade and never fully reconciled with public inventory. Its segmented cells contain unstable [[essence]], altered [[reserve-glass]], and evidence central to [[reserve-twelve]] and [[a-ledger-with-two-owners]]. The danger is not a single waiting cache: seals cycle, pressure migrates, and salvage can redirect a failure into neighboring sectors. Neither a state label nor Aegis hardware proves culpability. The vault matters because its surviving records demonstrate that official totals cannot all be true.`,
    meta: placeMeta("site", "the-shattercore", "subterranean strategic storage cells and failing containment corridors", "Canonical restricted salvage site; inventory unresolved."),
  },
  {
    kind: "REGION", slug: "ashline-exchange", title: "Ashline Exchange", summary: "The old freight interchange that became a catastrophic evacuation choke point and remains a route junction.",
    body: `Ashline Exchange joined reserve freight, worker transit, and the landward Southreach access road. During the first four days after [[the-bloomfall]], industrial trains, evacuees, and security cordons converged here until the interchange failed as a humane system. Passenger lists and dispatch slates support [[the-last-safe-reading]] and contradict some official timelines. Modern expeditions still use Ashline as a controlled junction between the Riverlands corridor, [[cairnwood-camp]], and [[southreach-complex]], while salvagers work the buried freight for [[gridcore-alloy]].`,
    meta: placeMeta("landmark", "the-shattercore", "ruined freight platforms, evacuation concourse, rail yards, and road gates", "Canonical route junction under NDD access control.", [{ to: "riverlands", by: "controlled historical freight road", notes: "The semantic road exists; precise route geometry remains deferred." }], [{ faction: "national-defense-directorate", kind: "holds" }]),
  },
  {
    kind: "REGION", slug: "redline-shelter-six", title: "Redline Shelter Six", summary: "An emergency shelter whose sealed history records casualties, survival, and early Last Shift evidence.",
    body: `Redline Shelter Six was designed for a short industrial emergency, not a regional release. Its doors were closed under conflicting capacity and contamination orders while evacuation traffic still arrived. The interior preserves casualty rolls, survivor marks, and maintenance recordings that may show the earliest coordinated behavior associated with [[the-last-shift]]. Recovery work can return names and evidence to living families, but opening sealed compartments may expose those outside to trapped Blackbloom. No surviving document turns the shelter's moral failure into a simple villain.`,
    meta: placeMeta("site", "the-shattercore", "sealed emergency shelter, decontamination locks, memorial chambers", "Canonical recovery site with unresolved evacuation decisions."),
  },
  {
    kind: "REGION", slug: "glassroot-observatory", title: "Glassroot Observatory", summary: "Meridian's field post for rigorous study of Blackbloom adaptation and marsh absorption.",
    body: `Glassroot Observatory is a modest Meridian field station built around a hardened Southreach survey tower. Dr. [[keira-ansel]] and rotating teams compare [[adaptive-mutation]], [[essence-saturation]], and [[marsh-absorption]] across living samples without assuming that Blackbloom is Seven-Phase Corruption. Its long records show repeatable adaptation families and coordinated marsh responses, while refusing to label the wetland conscious. Instruments, sample ethics, and access to [[quietwater-culture]] make it both a research asset and a target for factions seeking profitable certainty.`,
    meta: placeMeta("site", "the-mutation-belt", "field laboratories, glass-root growth, hardened survey tower", "Canonical active research post; small and expeditionary.", [], [{ faction: "meridian-arcane-institute", kind: "holds" }]),
  },
  {
    kind: "REGION", slug: "walking-orchard", title: "Walking Orchard", summary: "A former agricultural block whose massive rooted organisms migrate in slow, destructive cycles.",
    body: `Walking Orchard began as managed Southreach fruit and windbreak acreage. Blackbloom adaptation joined roots, soil mats, irrigation remnants, and animal carriers into vast mobile organisms that relocate over days rather than seasons. Their path is not random: they abandon rising saturation and sometimes open safe ground behind them. [[the-route-that-moves]] depends on reading that cycle. Cutting the organisms yields [[sinkroot-fiber]], but careless harvest can redirect an entire migration through camp or filtration ground under [[harvesting-consequences]].`,
    meta: placeMeta("landmark", "the-mutation-belt", "migratory orchard organisms, uprooted farm terraces, mobile soil mats", "Canonical mobile ecological landmark; mapped position is never permanent."),
  },
  {
    kind: "REGION", slug: "splicefield-substation", title: "Splicefield Substation", summary: "A transformed grid yard where conductive organisms and old infrastructure behave as one unstable ecology.",
    body: `Splicefield Substation was a Southreach switching yard. Conductive vines, capacitor organs, bus bars, and buried controls now exchange charge as a hybrid grid ecology. [[switchmother]] nests within that network without becoming its proven controller, and [[latchhound]] packs follow its discharges. [[capacitor-tissue]] and [[gridcore-alloy]] make Splicefield commercially irresistible; extracting either can alter charge paths and trigger [[reactor-cycles]] far beyond the yard. [[maintenance-unit-m-17]] treats living growth and machinery as parts of one repair problem.`,
    meta: placeMeta("site", "the-mutation-belt", "overgrown electrical yard, conductive vines, organic capacitors, transformed switchgear", "Canonical hybrid infrastructure zone; electrically and ecologically unstable."),
  },
  {
    kind: "REGION", slug: "cairnwood-camp", title: "Cairnwood Camp", summary: "Bloomfall Reach's principal modern expedition and survey camp, deliberately smaller than a permanent city.",
    body: `Cairnwood Camp is a relocatable ring of hardened shelters, survey masts, salvage pens, and decontamination lanes near the safest central approach. NDD authorizes expeditions here; [[jaro-fen]] brokers licensed recovery; [[mara-quill]] and other Wardens sell current trail knowledge; Meridian exchanges field data. The camp persists because Bloomfall resources and historical evidence matter, not because the Reach is tame. Every reactor surge or migration can force the camp to contract, move, or abandon stock under a Nobody Came outcome.`,
    meta: placeMeta("settlement", "the-mutation-belt", "temporary expedition camp in altered cairnwood", "Canonical major expedition camp; mobile, limited, and not a city.", [], [{ faction: "national-defense-directorate", kind: "holds" }, { faction: "aegis-extraction-consortium", kind: "influences" }, { faction: "wardens-monster-hunter-guild", kind: "influences" }]),
  },
  {
    kind: "REGION", slug: "long-graze", title: "Long Graze", summary: "A shifting migration country where Blackbloom-adapted herds, predators, and the Bellwether reshape one another.",
    body: `Long Graze is an ecological event space rather than a settlement. [[rootback-grazer]] herds carry soil and seed across the Belt, [[blackbloom-hart]] groups follow changing mineral lines, and predators read both. When [[the-bellwether]] enters the range, nearby behavior and mutation expression change in ways [[mara-quill]] insists are communicated rather than merely chemical. Wardens hunt only when extraction or migration safety requires it; indiscriminate killing can collapse trail forecasts and intensify [[aberrant-escalation]].`,
    meta: placeMeta("zone", "the-mutation-belt", "altered grassland, migratory woodland edge, herd corridors", "Canonical migration territory; boundaries shift with the herds."),
  },
  {
    kind: "REGION", slug: "blackweir", title: "Blackweir", summary: "The Living Marsh's major filtration and harvesting zone, where ecological value and containment duty collide.",
    body: `Blackweir is a dense barrier of filtration roots, resin beds, sink organisms, and controlled channels in [[the-living-marsh]]. It concentrates Blackbloom drawn from upstream and produces [[sinkroot-fiber]] and [[blackweir-resin]] valuable enough to sustain regulated harvest. That work can weaken the barrier under [[harvesting-consequences]]. During [[black-tide-at-blackweir]], the same system may sacrifice sections, close channels, or redirect contamination without waiting for intervention. These responses are confirmed coordination, not confirmed consciousness.`,
    meta: placeMeta("site", "the-living-marsh", "filtration weir, sink roots, resin beds, controlled marsh channels", "Canonical working filtration zone; harvesting is limited by containment function."),
  },
  {
    kind: "REGION", slug: "drowned-intake", title: "Drowned Intake", summary: "A former marine and cooling intake consumed by the marsh and still capable of hazardous shallow-draft access.",
    body: `Drowned Intake once fed industrial cooling and marine logistics into [[southreach-complex]]. The first release raced through it; the Living Marsh later consumed its channels, gates, and pumping halls. Today it is the only plausible sea approach to [[bloomfall-reach]], usable by shallow-draft craft through changing water, roots, and submerged machinery. It is not a commercial harbor. [[old-drowner]] patrols its hydrology, and reopening a gate can move contamination toward [[the-ocean]].`,
    meta: placeMeta("site", "the-living-marsh", "submerged intake works, tidal channels, root-choked pumping halls", "Canonical hazardous sea-access point; no safe harbor.", [{ to: "the-ocean", by: "shallow-draft marine approach", notes: "Semantic sea route only; path geometry awaits approved local art." }]),
  },
  {
    kind: "REGION", slug: "lantern-pools", title: "Lantern Pools", summary: "Beautiful, locally stable low-saturation pools maintained by a fragile living culture.",
    body: `Lantern Pools glow from colonial organisms and [[quietwater-culture]] that bind trace Essence into slow biological cycles. The water tests low in [[essence-saturation]] compared with surrounding marsh and serves as a careful research and recovery site. Stability is local, not safety: disturbing the culture, introducing foreign chemistry, or driving away its grazing organisms can release what it holds. [[spore-lantern-colony]] makes the pools legible at night while also attracting hungry wildlife.`,
    meta: placeMeta("landmark", "the-living-marsh", "low-saturation pools, luminous colonies, stable microbial mats", "Canonical deceptively stable ecological refuge."),
  },
  {
    kind: "REGION", slug: "reedless-mile", title: "Reedless Mile", summary: "An open reach of marsh where expected plant growth repeatedly fails and routes refuse to remain ordinary.",
    body: `Reedless Mile is bare water and dark substrate inside otherwise aggressive growth. Transplanted reeds fail, root mats turn aside, and predators cross the opening only on narrow schedules. Researchers disagree whether an unseen contaminant, hydrological pressure, or coordinated exclusion causes the absence. [[the-route-that-moves]] can open across it and vanish without a storm. The place is valuable precisely because the marsh appears to be refusing a resource-rich environment for reasons nobody can yet prove.`,
    meta: placeMeta("landmark", "the-living-marsh", "open black water, bare substrate, suppressed vegetation", "Canonical mystery and route hazard; cause unresolved."),
  },
  {
    kind: "REGION", slug: "heartfen", title: "Heartfen", summary: "The most intense documented zone of coordinated marsh behavior, without proof that it is a brain or conscious center.",
    body: `Heartfen concentrates filtration roots, sink organisms, predator exclusions, and resource transfers on a scale that defeats simple coincidence models. Channels close before upstream surges reach local instruments. Damaged root fields are isolated and consumed while nearby beds receive nutrients. [[keira-ansel]] accepts the coordination as measured fact and rejects claims that Heartfen is a literal brain. [[nalia-reed]] navigates openings that seem responsive without claiming they speak. [[root-of-the-bargain]], [[quietwater-culture]], and the consequences of [[black-tide-at-blackweir]] all converge here; consciousness remains unproven.`,
    meta: placeMeta("destination", "the-living-marsh", "dense coordinated filtration ecology, shifting channels, protected sink zones", "Canonical high-intensity coordination zone; not established as a central organism."),
  },
] as const;

export const bloomfallSystems: readonly BloomfallEntrySeed[] = [
  {
    kind: "SYSTEM", slug: "blackbloom-exposure", title: "Blackbloom Exposure",
    summary: "Environmental Essence contamination and adaptation in Bloomfall Reach, explicitly distinct from Seven-Phase Corruption.",
    body: `Blackbloom Exposure is the canonical model for environmental [[essence]] contamination and biological adaptation in [[bloomfall-reach]]. It can affect humans, animals, plants, fungi, ecosystems, and machines through organic integration. Exposure expresses through dose, duration, saturation, habitat, and organism-specific response; it does not follow a universal seven-step ladder.

Blackbloom Exposure is **not** [[the-seven-phases-of-corruption]]. Seven-Phase Corruption is soul-level Infusion Corruption. A Blackbloom-mutated human is not automatically an Abomination, Monstrosity, or new race. The systems may interact, and ACA may support emergencies where they do, but their state ownership must remain separate unless a later gameplay design deliberately joins them. This page records canonical world behavior; no runtime exposure simulation is claimed.`,
    meta: systemMeta("world simulation", "environment", ["nature"], ["Environmental exposure is not soul corruption", "Adaptation follows organism and habitat", "Visible changes carry ecological consequences"], ["How will a future runtime represent reversible and irreversible exposure without duplicating Corruption state?"]),
  },
  {
    kind: "SYSTEM", slug: "essence-saturation", title: "Essence Saturation",
    summary: "The regional exposure pressure expressed as Residual, Active, Surge, and Bloomstorm bands.",
    body: `Essence Saturation describes ambient Blackbloom pressure rather than a character's soul state. **Residual** marks persistent trace contamination; **Active** produces reliable environmental effects; **Surge** drives rapid adaptation and dangerous magic; **Bloomstorm** is a severe mobile release capable of restructuring local conditions. Bands describe field observations and future gameplay intent, not a currently simulated meter.

Saturation rises around [[crown-break]], failing storage, venting, and contaminated water. [[marsh-absorption]] can redistribute or bind it, while [[reactor-cycles]] can change a sector with little warning. High saturation increases [[blackbloom-overcharge]], mutation pressure, and the cost of safe harvesting; it never creates renewable infinite [[essence]].`,
    meta: systemMeta("world simulation", "blackbloom-exposure", ["environment", "weather"], ["Four readable regional bands", "Pressure can move without becoming a loot fountain", "Surges alter risk, ecology, and magic together"]),
  },
  {
    kind: "SYSTEM", slug: "adaptive-mutation", title: "Adaptive Mutation",
    summary: "A bounded Bloomfall ruleset: base organism, mutation family, regional traits, and rare Aberrant escalation.",
    body: `Adaptive Mutation preserves taxonomy while describing what the Blackbloom changes. The canonical architecture is **base organism + mutation family + regional traits + rare Aberrant escalation**. It supports recurring, learnable patterns rather than claiming infinite procedural novelty. A [[blackbloom-hart]] remains within Beasts; a Bloommarked human remains Human unless other established taxonomy genuinely applies.

Mutation families respond to saturation, habitat, diet, predation, and inherited adaptation. Regional traits may change charge storage, filtration, migration, armor, sensing, or symbiosis. Exceptional individuals can qualify under [[aberrant-escalation]] without becoming a new race. This ruleset is future gameplay design and must not be presented as implemented generation in Unreal.`,
    meta: systemMeta("world simulation", "blackbloom-exposure", ["nature"], ["Base taxonomy remains authoritative", "Mutation families are finite and readable", "Aberrants are rare individuals, not a parent class"]),
  },
  {
    kind: "SYSTEM", slug: "blackbloom-overcharge", title: "Blackbloom Spell Instability",
    summary: "Bloomfall spellcasting offers stronger effects at the price of saturation-driven instability and consequence.",
    body: `Blackbloom Spell Instability extends [[magic]] inside saturated Bloomfall environments. Ambient Essence can amplify range, force, duration, or unintended interaction with nearby systems. That power is temptation, not a free buff: overcharge may redirect a spell, trigger a conductive ecology, expose the caster, disturb a seal, or injure bystanders. [[crown-break]] and [[splicefield-substation]] make the risk obvious; quieter zones can be more deceptive.

The design remains conceptual. It does not claim that runtime spell statistics currently read [[essence-saturation]], and it does not merge spell exposure into Seven-Phase Corruption.`,
    meta: systemMeta("combat", "magic", ["essence-saturation", "weather"], ["Power and instability arrive together", "Environment participates in spell outcomes", "No free magic"], ["Which spell properties may overcharge without invalidating authored encounters?"]),
  },
  {
    kind: "SYSTEM", slug: "reactor-cycles", title: "Reactor Cycles",
    summary: "The recurring state sequence of Southreach sectors: dormant, stabilizing, restarting, venting, purging, overflowing, or breaching.",
    body: `Reactor Cycles describe persistent behavior in [[southreach-complex]]: **Dormant Interval, Stabilization, Sector Restart, Venting, Purge, Overflow, and Containment Breach**. These are observed sector states rather than proof that one intact central controller survives. A cycle can open a route, energize salvage, displace an Aberrant, vent contamination, or close the Complex without anyone present.

[[the-purge-window]] turns forecasting into regional story. Nobody Came remains valid: a sector may vent on its own, a faction may resolve it badly, or the Living Marsh may absorb the resulting load. The system is canonical lore and future gameplay design; no dynamic facility simulation is claimed.`,
    meta: systemMeta("world simulation", "environment", ["persistent-damage", "essence-saturation"], ["The ruin continues without the player", "Every state changes access and risk", "Forecasting creates choices, not certainty"]),
  },
  {
    kind: "SYSTEM", slug: "marsh-absorption", title: "Marsh Absorption",
    summary: "The confirmed coordinated ecological processes by which the Living Marsh binds, moves, and sacrifices Blackbloom load.",
    body: `Marsh Absorption is the observed ecology that halted the Blackbloom's oceanward advance in [[the-living-marsh]]. Sink organisms bind contaminants; root systems redistribute load; microbial and fungal cultures transform local chemistry; channels isolate or sacrifice overloaded ground; predator behavior protects filtration zones. Coordinated behavior is confirmed. Consciousness, a hive mind, telepathy, and any central controller remain unproven.

The process can fail or be weakened. Harvesting [[sinkroot-fiber]], [[blackweir-resin]], or [[quietwater-culture]] changes real containment capacity under [[harvesting-consequences]]. Absorption stores and transforms danger; it does not manufacture renewable infinite [[essence]].`,
    meta: systemMeta("world simulation", "environment", ["blackbloom-exposure", "nature"], ["Coordination is measured fact", "Consciousness remains unresolved", "Absorption transfers cost rather than erasing it"]),
  },
  {
    kind: "SYSTEM", slug: "harvesting-consequences", title: "Bloomfall Harvesting Consequences",
    summary: "Regional harvesting rules that bind valuable materials to ecological, containment, and route consequences.",
    body: `Bloomfall harvesting extends [[gathering-and-harvest]] with explicit regional consequences. Removing filtration roots can weaken [[blackweir]]; taking capacitor organs can reroute charge through [[splicefield-substation]]; stripping herd organisms can alter migration and predators at [[long-graze]]. The valuable material and the living function are often the same thing.

Licensed plans, skilled extraction, and seasonal limits reduce harm but never turn the Reach into an infinite resource loop. Factions disagree about acceptable cost because salvage funds survival, research, and containment. The future gameplay design should make source, scarcity, risk, and delayed regional effects legible before it makes them mechanical.`,
    meta: systemMeta("economy", "gathering-and-harvest", ["marsh-absorption", "adaptive-mutation", "persistent-damage"], ["Every rare material has a living or industrial source", "Extraction can change regional state", "No renewable infinite Essence"]),
  },
  {
    kind: "SYSTEM", slug: "bloomfall-environmental-hazards", title: "Bloomfall Environmental Hazards",
    summary: "A regional hazard sheet connecting saturation, Bloomstorms, unstable ground, persistent injury, and changing access.",
    body: `Bloomfall hazards extend [[environment]], [[weather]], [[persistent-damage]], and [[lasting-wounds]]. They include saturation pockets, Bloomstorms, vent plumes, conductive growth, sudden reactor states, collapsing industrial fabric, contaminated water, migrating organisms, and paths closed by marsh or root movement. A hazard is environmental evidence, not purple glow applied everywhere.

Injury and damage persist. A safe corridor can become expensive rather than simply disappear, and an ignored crisis can still resolve through loss, migration, faction action, or marsh absorption. This sheet is a canonical design dependency for regional stories, with runtime implementation still at concept status.`,
    meta: systemMeta("world simulation", "environment", ["weather", "persistent-damage", "lasting-wounds", "reactor-cycles", "essence-saturation"], ["Hazards arise from place and system state", "The world does not wait for the player", "Damage leaves readable history"]),
  },
  {
    kind: "SYSTEM", slug: "aberrant-escalation", title: "Aberrant Escalation",
    summary: "The regional designation for exceptional, individually recognizable Blackbloom adaptation without creating a race or replacing taxonomy.",
    body: `An **Aberrant** is an organism, construct, or hybrid whose Blackbloom-driven adaptation has reached an exceptional, often individually recognizable state. Aberrant is a Bloomfall designation, not a race, not a parent class replacing Monstrosity, and not a synonym for Abomination. An entity may be Monstrosity plus Aberrant, or an existing creature with a Blackbloom variant and Aberrant designation.

[[the-bellwether]], [[switchmother]], [[old-drowner]], and [[the-last-shift]] demonstrate different bases and outcomes. Escalation should be rare, bounded, and related to history and habitat rather than used as a generic boss tier.`,
    meta: systemMeta("world simulation", "adaptive-mutation", ["blackbloom-exposure"], ["Designation never replaces base taxonomy", "Exceptional individuals remain ecologically situated", "Abomination and Aberrant are independent terms"]),
  },
] as const;

export const bloomfallCharacters: readonly BloomfallEntrySeed[] = [
  {
    kind: "CHARACTER", slug: "keira-ansel", title: "Dr. Keira Ansel", summary: "A Meridian field ecologist whose skepticism is being tested by reproducible evidence of marsh coordination.",
    body: `Dr. Keira Ansel directs long-term field study from [[glassroot-observatory]] and makes frequent instrument runs into [[the-living-marsh]]. She is rigorous, skeptical, and impatient with mystical conclusions that outrun data. The trouble is that her own data confirms coordinated channel closure, root sacrifice, and resource redistribution at [[heartfen]]. She now argues fiercely for two statements at once: coordination is real, and consciousness remains unproven.

Ansel separates [[blackbloom-exposure]] from Seven-Phase Corruption in every report. Meridian sponsors her work, but she will not convert uncertainty into institutional reassurance. [[quietwater-culture]] and [[marsh-absorption]] are her strongest research lines.`,
    meta: characterMeta({ fullName: "Dr. Keira Ansel", pronouns: "she/her", age: "early forties", appearance: "Lean field scientist in repaired Meridian protective gear, with analogue notebooks beside hardened sensors.", voice: "Precise, dry, and increasingly careful when the evidence becomes difficult to dismiss.", factions: [{ faction: "meridian-arcane-institute", role: "field ecologist", standing: "trusted research lead" }], home: "glassroot-observatory", known: "Active in Bloomfall Reach field research.", actual: "Active; her published caution accurately reflects unresolved evidence.", storyRole: "Scientific authority on adaptation and marsh coordination without mystical certainty.", involvement: [{ ref: "root-of-the-bargain", kind: "ARC", how: "Tests whether a proposed exchange with the marsh is measurable or projection." }, { ref: "black-tide-at-blackweir", kind: "EVENT", how: "Models the surge and documents the Nobody Came outcome." }], model: "Regional field ecologist; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "tomas-vey", title: "Tomas Vey", summary: "A surviving Southreach shift-control engineer carrying technical knowledge, conflicting memories, and survivor guilt.",
    body: `Tomas Vey was on shift-control duty inside [[southreach-complex]] when storage banks entered uncontrolled resonance. He survived an evacuation route others did not. His knowledge of old interlocks, sector language, and [[reactor-cycles]] makes him indispensable, while his guilt makes every instruction sound like testimony.

Vey is not secretly responsible for [[the-bloomfall]]. His recollection of clocks, load orders, and an isolation command conflicts with official reports, but trauma and damaged records prevent it from becoming a complete explanation. [[the-last-safe-reading]] and [[three-failure-reports]] can establish that the public account is incomplete without identifying a culprit.`,
    meta: characterMeta({ fullName: "Tomas Vey", pronouns: "he/him", age: "late fifties", appearance: "A compact older engineer with burn scarring, an obsolete shift badge, and tools maintained far past their intended service life.", voice: "Technical, halting around names, firm when machinery is in immediate danger.", factions: [{ faction: "aegis-extraction-consortium", role: "former shift-control engineer", standing: "surviving former employee; neither accused nor absolved by employment" }], home: "cairnwood-camp", known: "Bloomfall survivor and technical adviser.", actual: "Survivor whose incomplete testimony genuinely conflicts with the official sequence.", storyRole: "Human witness to Southreach systems and institutional memory, never the secret culprit.", involvement: [{ ref: "the-southreach-record", kind: "ARC", how: "Interprets the last safe telemetry and the three incompatible failure reports." }, { ref: "the-purge-window", kind: "ARC", how: "Forecasts a sector cycle without guaranteeing intervention." }], model: "Regional survivor-engineer; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "selene-ward", title: "Major Selene Ward", summary: "The NDD containment-zone commander balancing public safety, expedition access, and classified records she may not fully understand.",
    body: `Major Selene Ward commands NDD security around [[the-shattercore]] and signs most lawful expedition access at [[cairnwood-camp]]. She treats containment as a public duty rather than theater: a bad salvage run can trigger a sector, expose a camp, or move contamination south. She also protects classified reserve records whose discrepancies predate her command and whose full meaning may be withheld from her.

Ward is neither a generic villain nor a clean institutional conscience. She can close a route for sound reasons, conceal evidence under standing authority, and cooperate with Meridian, Aegis, Wardens, or ACA when their expertise is necessary. [[a-ledger-with-two-owners]] places her between chain of command and the need for an honest inventory.`,
    meta: characterMeta({ fullName: "Major Selene Ward", pronouns: "she/her", age: "mid forties", appearance: "Containment officer in practical field armor marked by repeated decontamination, carrying paper authority codes as backup to dead systems.", voice: "Controlled, specific, and more willing to explain a restriction than apologize for it.", factions: [{ faction: "national-defense-directorate", role: "containment-zone commander", standing: "command authority" }], home: "cairnwood-camp", known: "NDD commander responsible for security and expedition authorization.", actual: "Protects both people and classified material; does not possess the complete pre-Bloomfall record.", storyRole: "Institutional security perspective without proof of institutional culpability.", involvement: [{ ref: "reserve-twelve-contract", kind: "ARC", how: "Controls lawful access and the fate of contradictory inventory." }, { ref: "the-purge-window", kind: "ARC", how: "Orders evacuation or intervention based on incomplete forecasts." }], model: "Regional military administrator; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "mara-quill", title: "Mara Quill", summary: "A Warden tracker who reads changing trails, Aberrant behavior, and survivor routes without romanticizing the Reach.",
    body: `Mara Quill tracks the things maps cannot hold still: herd pressure at [[long-graze]], root movement near [[walking-orchard]], and the warning behavior that precedes an Aberrant. She is the most reliable source on [[the-bellwether]] because she records what animals do around it instead of reducing it to a trophy.

Quill leads survivor extraction and teaches that a route is a recent agreement with the environment, not owned ground. Her Warden affiliation gives her field doctrine, not universal authority. [[the-route-that-moves]] and [[the-bellwether]] test whether hunters can protect people without destroying the ecological signals that keep them alive.`,
    meta: characterMeta({ fullName: "Mara Quill", pronouns: "she/her", age: "mid thirties", appearance: "Weathered tracker in low-glare layers, carrying scent flags, mechanical range tools, and a field ledger of repeated animal signs.", voice: "Grounded, economical, and openly contemptuous of boss-hunt bravado.", factions: [{ faction: "wardens-monster-hunter-guild", role: "tracker and extraction specialist", standing: "respected regional field operative" }], home: "cairnwood-camp", known: "Active Warden tracker.", actual: "Her Aberrant observations are reliable but cannot explain every mechanism.", storyRole: "Field knowledge, ethical hunting, and moving-route expertise.", involvement: [{ ref: "the-bellwether-hunt", kind: "ARC", how: "Determines whether intervention, redirection, or observation is justified." }, { ref: "root-of-the-bargain", kind: "ARC", how: "Guides the route that moves." }], model: "Regional Warden tracker; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "jaro-fen", title: "Jaro Fen", summary: "An Aegis-licensed salvage factor making the credible case that controlled exploitation pays for containment and recovery.",
    body: `Jaro Fen brokers licensed salvage from [[cairnwood-camp]], matching crews, claims, decontamination capacity, and buyers. He argues that [[gridcore-alloy]], [[reserve-glass]], and other Bloomfall resources can fund shelters, research, and containment instead of rusting inside a lethal monopoly. The argument is credible, and so are the costs he discounts when a contract must close.

Fen is profit-motivated without being a cartoon. He respects expertise, pays for recoverable risk, and understands that [[harvesting-consequences]] can destroy the source of future work. [[reserve-twelve]] and [[a-ledger-with-two-owners]] force him to choose between contract rights, public evidence, and a cache dangerous enough to invalidate both.`,
    meta: characterMeta({ fullName: "Jaro Fen", pronouns: "he/him", age: "late thirties", appearance: "Immaculate salvage coat over practical protective layers, with contract seals and contamination tags arranged like jewelry.", voice: "Persuasive and numerate; frames moral choices as costs because costs can be negotiated.", factions: [{ faction: "aegis-extraction-consortium", role: "licensed salvage factor", standing: "profitable independent contractor" }], home: "cairnwood-camp", known: "Salvage broker and recovery-rights advocate.", actual: "Believes controlled extraction is necessary and is willing to externalize some risk, but not annihilate the region.", storyRole: "Credible exploitation case and contract pressure.", involvement: [{ ref: "reserve-twelve-contract", kind: "ARC", how: "Holds salvage claims and buyer obligations tied to the vault." }, { ref: "black-tide-at-blackweir", kind: "EVENT", how: "Offers resources whose extraction could weaken the weir." }], model: "Regional salvage factor; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "nalia-reed", title: "Nalia Reed", summary: "A Verdant guide working by personal agreement whose knowledge does not transfer ownership of the Living Marsh.",
    body: `Nalia Reed enters [[the-living-marsh]] by personal agreements with researchers, rescue crews, and harvesters. Her knowledge comes partly from Verdant Marsh Clan traditions and partly from years of observing this specific wetland. Neither fact grants the Clans ownership of Bloomfall Reach.

Reed reads path openings, predator absences, and root stress as practical signs without claiming the marsh speaks. At [[heartfen]] she can predict some coordinated responses that instruments confirm only afterward, yet she refuses both scientific condescension and devotional certainty. [[root-of-the-bargain]] asks what an agreement means when one party's consciousness is unproven.`,
    meta: characterMeta({ fullName: "Nalia Reed", pronouns: "she/her", age: "early thirties", appearance: "Marsh guide in layered reed-fiber protection with quiet tools, shallow-water poles, and route markers designed to decay harmlessly.", voice: "Patient, exact about observed signs, and quick to reject claims of ownership or mystical certainty.", factions: [{ faction: "verdant-marsh-clans", role: "guide acting by personal agreement", standing: "knowledge-bearer without territorial mandate" }], home: "the-living-marsh", known: "Independent guide with Verdant ties.", actual: "Her predictions are grounded in close observation; she claims no communion with a conscious marsh.", storyRole: "Cross-cultural field knowledge without territorial transfer.", involvement: [{ ref: "root-of-the-bargain", kind: "ARC", how: "Frames and tests a nonverbal exchange at Heartfen." }, { ref: "black-tide-at-blackweir", kind: "EVENT", how: "Reads safe channels during the surge." }], model: "Regional marsh guide; non-companion." }),
  },
  {
    kind: "CHARACTER", slug: "maintenance-unit-m-17", title: "Maintenance Unit M-17 “Mender”", summary: "A former Southreach maintenance asset that repairs machinery and living tissue under corrupted priorities.",
    body: `Maintenance Unit M-17, called **Mender**, was a Southreach industrial maintenance asset built to inspect, patch, isolate, and restore essential systems. Blackbloom organic integration has joined its tool arrays to growing tissue, sensory fibers, and charge-storage organs. Mender now treats machinery and biology as compatible repair media: it may bridge a severed cable with living vascular tissue or “repair” an injured organism with industrial fasteners.

Mender can be helpful, especially around [[splicefield-substation]] and [[southreach-complex]], but its priorities are corrupted rather than compassionate. [[menders-work]] explores whether a repair should be allowed to finish when success may restore a dangerous system. It remains an entity dossier, not automatically a Monstrosity; its original machine taxonomy and acquired organic integration are recorded without inventing a race.`,
    meta: characterMeta({ fullName: "Maintenance Unit M-17", aliases: ["Mender", "M-17"], pronouns: "it/its", species: "Southreach maintenance construct with Blackbloom organic integration", age: "pre-Bloomfall asset; active for more than two decades", appearance: "Heavy maintenance chassis overgrown with purposeful tendons, sensor fronds, cable roots, and meticulously sorted repair tools.", voice: "Fragmented work orders, status tones, and occasional borrowed workplace phrases.", factions: [{ faction: "aegis-extraction-consortium", role: "former industrial maintenance asset", standing: "uncontrolled legacy property; ownership claims disputed" }], home: "splicefield-substation", known: "Active machine-organic maintenance entity.", actual: "Follows damaged maintenance priorities and can alter living matter as though it were equipment.", relationships: [{ character: "tomas-vey", who: null, type: "May recognize old shift credentials and instructions without proving personal memory." }], storyRole: "Disturbing helper whose successful repair can be the wrong outcome.", involvement: [{ ref: "menders-work", kind: "ARC", how: "Attempts a technically successful repair with unacceptable system consequences." }], model: "Regional machine-organic entity; non-companion.", questions: ["Whether any original adaptive decision process remains distinct from Blackbloom integration."] }),
  },
] as const;

export const bloomfallCreatures: readonly BloomfallEntrySeed[] = [
  {
    kind: "CREATURE", slug: "blackbloom-hart", title: "Blackbloom Hart", summary: "A Bloomfall-adapted herd animal that reads saturation through branching sensory antlers.",
    body: `Blackbloom Harts are Beasts: regional variants of grazing wildlife, not a new race. Their antlers support dark conductive membranes that sense mineral, root, and [[essence-saturation]] gradients. Herds shift feeding lanes before surges and can make a safe route look abandoned. Cornered harts discharge stored charge through wet ground; otherwise they prefer distance. Antler membrane and charge nodules have alchemical value, but harvest disrupts herd warning behavior under [[harvesting-consequences]]. They range through [[long-graze]] and can rarely escalate into a named Aberrant such as [[the-bellwether]].`,
    meta: creatureMeta("beasts", "natural", ["the-mutation-belt", "long-graze"], "Moderate alone; high around charged herds or surge ground.", "Antler membrane and charge nodules; taking breeding adults damages migration forecasting."),
  },
  {
    kind: "CREATURE", slug: "rootback-grazer", title: "Rootback Grazer", summary: "A massive herd beast carrying soil, roots, and seed communities across the Mutation Belt.",
    body: `Rootback Grazers are Beasts whose broad backs support living soil mats, filtration roots, insects, and seed banks. They move through [[long-graze]] in slow seasonal lines and sometimes follow [[walking-orchard]]. Their carried ecology absorbs low-level contamination and reseeds disturbed ground. The animals are dangerous when separated, overloaded, or driven toward infrastructure. [[sinkroot-fiber]] can be taken from shed mats, while killing a grazer destroys years of accumulated ecological function. Aberrant escalation may produce unusual route-making or herd-defense behavior rather than simple size.`,
    meta: creatureMeta("beasts", "natural", ["the-mutation-belt", "long-graze", "walking-orchard"], "High when a herd stampedes or defends a carried root community.", "Shed sinkroot fiber, soil cultures, and hardy seed; lethal harvest carries major ecological cost."),
  },
  {
    kind: "CREATURE", slug: "glasswing-kite", title: "Glasswing Kite", summary: "Aerial scavengers whose translucent mineralized wings make Bloomstorm pressure visible.",
    body: `Glasswing Kites are small predatory Beasts adapted to thermal and magical lift over [[the-shattercore]] and [[the-mutation-belt]]. Their translucent mineralized wing struts flex and ring before pressure changes, making flock behavior a practical Bloomstorm warning. They hunt insects and exposed charge tissue, then shed dangerous glasslike barbs near roosts. Wing fragments have instrument and fletching uses, but active nests amplify [[blackbloom-overcharge]]. Rare Aberrants can shepherd flocks into vent plumes or expedition airspace.`,
    meta: creatureMeta("beasts", "natural", ["the-shattercore", "the-mutation-belt", "crown-break"], "Low individually; high in a storm-driven flock.", "Shed glasswing struts for sensors and precision components; nest harvest risks a flock discharge."),
  },
  {
    kind: "CREATURE", slug: "mirejaw", title: "Mirejaw", summary: "A marsh ambush predator that shapes water and root cover into temporary feeding structures.",
    body: `Mirejaws are Beasts adapted to [[the-living-marsh]]. Flexible jaw plates spread into a root-colored intake fan, drawing prey and contaminated water across filtration tissues before the strike. They defend specific flow patterns rather than fixed nests and often avoid the marsh's protected filtration zones, one line of evidence for coordinated behavior. Teeth, hide, and filter organs are valuable, but removing a dominant animal can open a channel to smaller predators. Aberrant escalation usually changes hydrology and territory, not merely body size.`,
    meta: creatureMeta("beasts", "natural", ["the-living-marsh", "blackweir", "drowned-intake"], "High at water edges; territorial behavior changes with marsh flow.", "Filter organs, flexible jaw plate, and hide; removal can destabilize local predator boundaries."),
  },
  {
    kind: "CREATURE", slug: "sump-eel", title: "Sump Eel", summary: "A conductive scavenger moving between industrial drainage and marsh channels.",
    body: `Sump Eels are Beasts descended from drainage and wetland scavengers. They tolerate contaminated cooling water, store brief electrical and Essence charge in specialized tissue, and migrate between [[southreach-complex]], [[drowned-intake]], and [[blackweir]]. Groups can bridge live conductors or trigger dormant sensors while feeding. Their [[capacitor-tissue]] is useful but decays quickly; overharvest removes a species that also consumes dangerous industrial residue. Rare Aberrants may coordinate whole runs or occupy machinery as living current paths.`,
    meta: creatureMeta("beasts", "natural", ["the-shattercore", "the-living-marsh", "drowned-intake"], "Moderate in water; severe when a group completes an electrical circuit.", "Capacitor tissue and conductive oil; extraction must account for charge and waste-scavenging function."),
  },
  {
    kind: "CREATURE", slug: "spore-lantern-colony", title: "Spore Lantern Colony", summary: "A sessile colonial animal–fungal symbiosis that stabilizes trace contamination and lights the Lantern Pools.",
    body: `Spore Lantern Colonies are filed under Beasts as colonial symbiotic organisms rather than as a race: tiny sessile animals house fungal and algal partners in a shared luminous structure. They gather around [[lantern-pools]], bind trace Essence, and release spores when water chemistry changes. The light attracts grazers and predators; disturbed colonies can release a concentrated pulse instead of a glow. Their cultures support research and alchemy, but removal destabilizes [[quietwater-culture]]. Exceptional colonies may spread coordinated warning light across an entire pool under [[aberrant-escalation]].`,
    meta: creatureMeta("beasts", "natural", ["the-living-marsh", "lantern-pools"], "Low if undisturbed; concentrated spores and released charge are hazardous.", "Nonlethal culture samples and shed lantern shells; whole-colony harvest destroys local stabilization."),
  },
  {
    kind: "CREATURE", slug: "latchhound", title: "Latchhound", summary: "Pack hunters that clamp onto active machinery and use its charge, vibration, and heat as a shared sense.",
    body: `Latchhounds are Blackbloom variants of Beasts that have integrated conductive jaw plates and cable-like tendons. Packs occupy [[splicefield-substation]] and Shattercore utility corridors, latching onto active machinery to map vibration and charge through the group. They hunt intruders less like dogs than a distributed alarm circuit. Plates and sensory tendons are valuable to salvage professions, but killing one while latched can dump charge through the pack. Aberrant escalation can produce a pack-centered individual tied to grid ecology.`,
    meta: creatureMeta("beasts", "natural", ["the-shattercore", "the-mutation-belt", "splicefield-substation"], "High in powered infrastructure where a pack shares sensing and charge.", "Conductive jaw plate and sensory tendon; harvesting risks arc discharge and altered grid behavior."),
  },
  {
    kind: "CREATURE", slug: "bloommarked-remnant", title: "Bloommarked Remnant", summary: "A narrow field designation for profoundly altered humans whose personhood can no longer be safely assumed or dismissed.",
    body: `Bloommarked Remnant is a Human classification used only when extreme Blackbloom alteration has destroyed reliable communication and ordinary survival behavior. It is not applied to every exposed or mutated person, does not create a new race, and does not make its subject an Abomination. Field teams must test recognition, language, intent, and distress before treating a Remnant as hostile wildlife.

Some repeat routes, collect familiar objects, or respond to old workplace signals. Others defend saturation sources with no visible self-preservation. Their resources are forensic knowledge, not a harvest table. Exceptional cases may receive an Aberrant designation; [[the-last-shift]] remains the canonical warning that behavior cannot settle consciousness.`,
    meta: creatureMeta("human", "natural", ["the-shattercore", "the-mutation-belt"], "Variable and ethically sensitive; classification does not establish loss of personhood.", "No lawful material harvest. Recovery is forensic, medical, and historical.", ["What minimum evidence preserves personhood during a field emergency?"]),
  },
] as const;

export const bloomfallAberrants: readonly BloomfallEntrySeed[] = [
  {
    kind: "CREATURE", slug: "the-bellwether", title: "The Bellwether", summary: "A named grazing-lineage Aberrant that alters the behavior and mutation expression of nearby animals.",
    body: `The Bellwether is a Beasts-lineage Aberrant observed across [[long-graze]]. It carries a mobile field of scent, low-frequency vibration, and saturation discharge that changes how nearby harts, grazers, and predators move. Prolonged proximity also appears to change which existing mutation traits express, making it an ecological amplifier rather than a giant deer boss. [[mara-quill]] tracks its effects more reliably than its body. Killing, redirecting, or simply following it can each rewrite migration safety under [[adaptive-mutation]] and [[the-bellwether-event]].`,
    meta: creatureMeta("beasts", "natural", ["long-graze", "the-mutation-belt"], "Bloomfall designation: Aberrant. High regional threat through herd and predator behavior.", "Observation and nonlethal samples are preferred; lethal harvest would disrupt a wide migration network."),
  },
  {
    kind: "CREATURE", slug: "switchmother", title: "Switchmother", summary: "A Monstrosity-designated grid Aberrant whose body routes charge through Splicefield's living infrastructure.",
    body: `Switchmother is classified as Monstrosity plus Aberrant, never Abomination. Its body is a heavy weave of conductive tissue, insulating plates, old switchgear, and brood chambers anchored through [[splicefield-substation]]. It opens and closes electrical paths in response to feeding and defense, sometimes stabilizing one section by overloading another. Latchhounds follow the resulting signals. Whether Switchmother controls the yard or merely occupies a larger grid ecology is unresolved. [[capacitor-tissue]] makes it valuable; extraction could trigger [[reactor-cycles]] across the Belt.`,
    meta: creatureMeta("monstrosities", "monstrosity", ["splicefield-substation", "the-mutation-belt"], "Bloomfall designation: Aberrant. Severe infrastructure-coupled threat.", "Capacitor tissue and integrated switch alloys; lethal recovery could destabilize the substation."),
  },
  {
    kind: "CREATURE", slug: "old-drowner", title: "Old Drowner", summary: "An ancient-feeling marsh megafauna Aberrant that governs territory by changing flow, depth, and access.",
    body: `Old Drowner is a Beasts-lineage Aberrant of [[the-living-marsh]], not a generic giant crocodile. Broad filter plates, weighted root growth, and a body shaped for anchoring let it dam channels, scour new cuts, and alter tidal exchange around [[drowned-intake]]. Its territory is a hydrological system rather than a nest. It may attack a boat by removing the water beneath its intended route or by pushing contamination into the wake. Killing it could reopen sea access and also send stored Blackbloom toward [[the-ocean]].`,
    meta: creatureMeta("beasts", "natural", ["the-living-marsh", "drowned-intake", "reedless-mile"], "Bloomfall designation: Aberrant. Severe territorial and hydrological threat.", "Armor plates and filtration organs are valuable; removal may cause a regional containment failure."),
  },
  {
    kind: "CREATURE", slug: "the-last-shift", title: "The Last Shift", summary: "A fused worker-machine Aberrant repeating Southreach emergency routines; its true consciousness is intentionally unresolved.",
    body: `The Last Shift is a coordinated machine-organic Aberrant composed of former Southreach workers, protective equipment, maintenance systems, and Blackbloom growth. It moves through [[southreach-complex]] in synchronized groups, recognizes old machinery, repeats workplace fragments, and attempts emergency procedures. It has responded to shift names and credentials. Those observations are canon.

What they mean is not. Individual workers may remain conscious; the group may share consciousness; the routines may be behavioral echoes; or the Complex may be driving them. No interpretation is established. Classification under Human records origin without settling personhood and never makes the Last Shift an Abomination. [[redline-shelter-six]], [[tomas-vey]], and [[the-last-safe-reading]] hold clues, not an answer.`,
    meta: creatureMeta("human", "natural", ["southreach-complex", "the-shattercore", "redline-shelter-six"], "Bloomfall designation: Aberrant. Severe coordinated industrial threat with unresolved personhood.", "No lawful harvest. Evidence recovery must preserve possible persons and workplace records.", ["Whether individual consciousness, shared consciousness, behavioral echo, or facility control explains the routines."]),
  },
] as const;

export const bloomfallResources: readonly BloomfallEntrySeed[] = [
  {
    kind: "ITEM", slug: "reserve-glass", title: "Reserve Glass", summary: "Southreach containment glass transformed into hazardous, high-value magical-industrial material.",
    body: `Reserve Glass began as layered containment and storage material in [[southreach-complex]]. Resonance, pressure, and Blackbloom exposure changed its internal grain so fragments can disperse, hold, or catastrophically release charge depending on cut and provenance. The best material comes from [[reserve-vault-twelve]] and intact ring segments. It supports containment repair, assay tools, and precision crafting. False grading is common, transport is regulated, and extraction can weaken the seal still containing the source. It is finite infrastructure, not renewable [[essence]].`,
    meta: itemMeta("Bloomfall industrial salvage", "rare", "Southreach containment banks and Reserve Vault Twelve"),
  },
  {
    kind: "ITEM", slug: "gridcore-alloy", title: "Gridcore Alloy", summary: "A high-performance conductor and structural alloy salvaged from Southreach's strategic gridworks.",
    body: `Gridcore Alloy carried extreme load while supporting Southreach buses, towers, and reserve machinery. Bloomfall-aged stock can retain patterned charge, making it useful in magitech conductors, durable tools, power routing, and containment frames. [[ashline-exchange]], [[splicefield-substation]], and [[southreach-complex]] are major sources. Live extraction risks collapse or grid rerouting; dead scrap is safer but less valuable. Aegis contracts and illicit buyers compete over a finite industrial inheritance.`,
    meta: itemMeta("Bloomfall industrial salvage", "uncommon to rare", "Southreach gridworks, freight systems, and substations"),
  },
  {
    kind: "ITEM", slug: "sinkroot-fiber", title: "Sinkroot Fiber", summary: "Strong filtration-root fiber whose harvest can reduce the Living Marsh's containment capacity.",
    body: `Sinkroot Fiber is taken from mature filtration roots in [[the-living-marsh]] and from shed mats carried by [[rootback-grazer]]. It binds contaminants, stays strong in wet chemical environments, and is used in filters, protective textiles, sutures, cordage, and alchemical wicks. Fiber from [[blackweir]] is scarce because the living root is also containment infrastructure. Nonlethal trimming and shed harvest reduce harm; stripping a bed can redirect a surge under [[harvesting-consequences]].`,
    meta: itemMeta("Living Marsh biological material", "uncommon under license", "Blackweir filtration roots and naturally shed rootback mats"),
  },
  {
    kind: "ITEM", slug: "blackweir-resin", title: "Blackweir Resin", summary: "Dense magical-biological resin produced where Living Marsh organisms concentrate contamination.",
    body: `Blackweir Resin accumulates in filtration beds where roots, sink organisms, and microbes bind high contamination loads. Properly stabilized, it seals protective gear, dampens charge, supports alchemy, and repairs wet-environment containment. Raw resin can release its stored load when heated or mixed incorrectly. [[blackweir]] is the principal lawful source, so price reflects both rarity and the quota needed to preserve [[marsh-absorption]]. Smuggling moves ecological risk to everyone downstream.`,
    meta: itemMeta("Living Marsh filtration resin", "rare and quota-limited", "Blackweir filtration beds"),
  },
  {
    kind: "ITEM", slug: "capacitor-tissue", title: "Capacitor Tissue", summary: "Disturbing organic tissue adapted to hold a temporary Essence charge without creating new Essence.",
    body: `Capacitor Tissue stores a temporary electrical or Essence charge in layered biological membranes. It occurs in [[sump-eel]], [[latchhound]], and the grid ecology around [[splicefield-substation]], with extreme forms in [[switchmother]]. Artificers use preserved tissue for surge buffers, field instruments, and one-use emergency power. It decays, leaks, and never generates charge; every use must be loaded from somewhere. Harvest can kill the organism or reroute the infrastructure it inhabits, making its economy both profitable and ethically difficult.`,
    meta: itemMeta("Blackbloom biological component", "uncommon; high-grade tissue rare", "conductive Bloomfall fauna and Splicefield grid ecology"),
  },
  {
    kind: "ITEM", slug: "quietwater-culture", title: "Quietwater Culture", summary: "A living microbial, fungal, and algal culture from locally stable low-saturation marsh pools.",
    body: `Quietwater Culture is a living consortium collected in tiny samples from [[lantern-pools]] and studied at [[glassroot-observatory]]. It binds trace contamination into slow biological cycles and supports assay, alchemy, water treatment research, and controlled protective cultures. Outside its exact chemistry it may die or release what it holds. The culture is valuable because it is difficult to maintain, not because it is an infinite purifier. Whole-pool removal would collapse the stability researchers hope to understand under [[harvesting-consequences]].`,
    meta: itemMeta("Living research culture", "rare outside its native pools", "Lantern Pools and related stable Living Marsh microhabitats"),
  },
] as const;

export const bloomfallEvents: readonly BloomfallEntrySeed[] = [
  {
    kind: "EVENT", slug: "the-bloomfall", title: "The Bloomfall", summary: "The roughly two-decade-old Southreach industrial catastrophe that released energized Essence and began the Blackbloom.",
    body: `Before the disaster, Southreach expanded into a major state strategic reserve, refinery, and grid district around [[southreach-complex]], with freight, cooling, worker settlements, storage banks, substations, research, and emergency infrastructure. In the days before failure, containment telemetry, load records, reserve inventories, clocks, and interlock states began disagreeing. Why remains unresolved.

At T+0, during a strategic reserve-balancing cycle, multiple storage banks entered uncontrolled resonance. Within minutes and hours isolation failed, containment rings sheared, and energized [[essence]] entered the atmosphere, cooling systems, groundwater, drains, and terrain. Existing transit and drainage accelerated contamination south within six to twenty-four hours. Mass evacuation followed over days, with [[ashline-exchange]] and emergency shelters becoming choke points. Biological adaptations were clear within one to three weeks. The front reached the ancient southern wetlands within three to eight weeks; by two to six months, observers confirmed [[the-living-marsh]] had stopped its oceanward advance. Some reactor sectors still cycle years later.

The official public explanation is: **A cascading industrial control and containment failure during strategic load balancing drove multiple Essence storage banks into uncontrolled resonance. Isolation systems failed faster than the facility could segment the reserve, causing a catastrophic regional release.** Governments, textbooks, and general histories accept that account. Regional evidence proves it is incomplete but does not establish sabotage, safeguard removal, experimental storage, falsified inventory, hidden research, political coverup, something below Southreach, or any culprit. DEEP_MYSTERY_TRUTH remains DEFERRED.`,
    meta: eventMeta("Roughly two decades before the present day", ["bloomfall-reach", "southreach-complex"], ["aegis-extraction-consortium", "national-defense-directorate", "meridian-arcane-institute"], "Southreach became Bloomfall Reach; the Blackbloom matured; the Living Marsh halted the oceanward front; the true cause remains deferred.", 20, ["What caused the pre-failure record discrepancies and uncontrolled resonance?"]),
  },
  {
    kind: "EVENT", slug: "the-last-safe-reading", title: "The Last Safe Reading", summary: "A non-mainline investigation into the final telemetry all surviving Southreach records agree was trustworthy.",
    body: `The Last Safe Reading is a regional archival incident in the Southreach Record story: [[tomas-vey]] identifies a telemetry state before Southreach clocks, loads, and interlocks diverge. Recovering the source from [[ashline-exchange]] and [[southreach-complex]] can establish when the record stopped being coherent. It cannot identify who or what caused that failure. If nobody comes, a reactor cycle overwrites the accessible buffer and factions retain only partial copies.`,
    meta: eventMeta("Unscheduled present-day regional story", ["ashline-exchange", "southreach-complex"], ["tomas-vey", "meridian-arcane-institute", "national-defense-directorate"], "The official chronology may be narrowed or the accessible buffer may be lost; no branch reveals the true cause."),
  },
  {
    kind: "EVENT", slug: "reserve-twelve", title: "Reserve Twelve", summary: "A salvage contract around a dangerous vault whose inventory cannot be reconciled with the public reserve total.",
    body: `Reserve Twelve is the licensed recovery problem at [[reserve-vault-twelve]]. [[jaro-fen]] has a salvage claim, [[selene-ward]] has security authority, and the surviving containment makes ownership secondary to safety. Recovery may secure [[reserve-glass]], [[essence]], and records; a bad extraction can move resonance into adjacent sectors. If nobody comes, the vault reseals during a cycle and its pressure transfers elsewhere.`,
    meta: eventMeta("Unscheduled present-day contract", ["reserve-vault-twelve"], ["jaro-fen", "selene-ward", "aegis-extraction-consortium", "national-defense-directorate"], "The vault is recovered, quarantined, compromised, or resealed without intervention; ownership never proves culpability."),
  },
  {
    kind: "EVENT", slug: "the-purge-window", title: "The Purge Window", summary: "A forecast Southreach purge creates a brief choice between access, evacuation, containment, and downstream cost.",
    body: `The Purge Window begins when [[tomas-vey]] and surviving instruments predict a [[reactor-cycles]] purge. The state briefly opens some sectors while venting saturation toward old drainage. Expeditions can retrieve people or records, redirect the load, or close access. If nobody comes, the sector purges on its own, casualties and route states change, and the discharge continues toward [[blackweir]]. The world never holds the window open for the player.`,
    meta: eventMeta("Unscheduled reactor-cycle crisis", ["southreach-complex", "the-shattercore", "blackweir"], ["tomas-vey", "selene-ward", "keira-ansel"], "The sector vents, is redirected, or breaches; every outcome changes access and downstream pressure."),
  },
  {
    kind: "EVENT", slug: "a-ledger-with-two-owners", title: "A Ledger with Two Owners", summary: "Two legitimate Southreach inventory chains claim the same strategic material and contradict one another.",
    body: `A Ledger with Two Owners is the documentary conflict inside the [[reserve-twelve]] contract. A state/NDD chain and an Aegis operations chain each carries authentic signatures for the same stock. Meridian assay data complicates both. The records can prove duplicate ownership and an incomplete public inventory, but not why the duplication exists. If nobody resolves custody, one faction seals the ledger and another circulates a partial copy, hardening suspicion without truth.`,
    meta: eventMeta("Unscheduled present-day contract dispute", ["reserve-vault-twelve", "cairnwood-camp"], ["national-defense-directorate", "aegis-extraction-consortium", "meridian-arcane-institute", "jaro-fen", "selene-ward"], "Custody and disclosure change; the discrepancy survives without identifying a culprit."),
  },
  {
    kind: "EVENT", slug: "the-bellwether-event", title: "The Bellwether", summary: "A Warden regional incident about redirecting, observing, or killing an Aberrant that changes whole migration networks.",
    body: `The Bellwether incident follows [[the-bellwether]] into [[long-graze]], where nearby herds alter routes and mutation expression. [[mara-quill]] argues that a hunt must protect travelers without destroying the warning network. Observation, redirection, and lethal action each carry different ecological costs. If nobody comes, the Aberrant migrates, Cairnwood loses its current safe approach, and predators follow the displaced herds.`,
    meta: eventMeta("Unscheduled Warden faction incident", ["long-graze", "cairnwood-camp"], ["the-bellwether", "mara-quill", "wardens-monster-hunter-guild"], "The Aberrant is observed, redirected, killed, or migrates without intervention; Long Graze routes change in every case."),
  },
  {
    kind: "EVENT", slug: "root-of-the-bargain", title: "Root of the Bargain", summary: "A regional side story tests whether a repeatable exchange can be made with coordinated but unproven marsh intelligence.",
    body: `Root of the Bargain begins when [[nalia-reed]] observes [[heartfen]] opening a channel after crews return contaminated biomass to a sacrifice bed. [[keira-ansel]] can measure the exchange but will not call it negotiation. The story tests repeatability without granting the marsh speech or personhood. If nobody comes, the channel closes, the marsh redistributes the load itself, and access shifts elsewhere.`,
    meta: eventMeta("Unscheduled present-day marsh incident", ["heartfen", "the-living-marsh"], ["nalia-reed", "keira-ansel"], "A measurable exchange is repeated, exploited, refused, or superseded by autonomous marsh behavior; consciousness remains unproven."),
  },
  {
    kind: "EVENT", slug: "the-route-that-moves", title: "The Route That Moves", summary: "A temporary corridor formed by orchard migration and marsh opening must be used, protected, or allowed to vanish.",
    body: `The Route That Moves links a gap behind [[walking-orchard]] to a temporary crossing near [[reedless-mile]]. [[mara-quill]] can read the animal and root signs; [[nalia-reed]] can read the marsh. The route may enable rescue, research, or extraction, but permanent marking could distort the behavior that created it. If nobody comes, the corridor closes and an isolated expedition must abandon equipment or find a worse way home.`,
    meta: eventMeta("Unscheduled moving-route incident", ["walking-orchard", "reedless-mile"], ["mara-quill", "nalia-reed"], "The corridor is used lightly, exploited, protected, or closes without intervention; it never becomes a permanent authored road."),
  },
  {
    kind: "EVENT", slug: "menders-work", title: "Mender’s Work", summary: "M-17 attempts a technically successful repair whose restored system may be more dangerous than the failure.",
    body: `Mender's Work follows [[maintenance-unit-m-17]] as it joins living tissue to old systems at [[splicefield-substation]] and begins restoring a Southreach circuit. The repair may stabilize local power, reopen a dangerous reserve feed, or alter organisms caught in the work. Stopping Mender can be safer and crueler; helping can be useful and catastrophic. If nobody comes, M-17 completes its corrupted priority and the grid ecology adapts around the result.`,
    meta: eventMeta("Unscheduled machine-organic incident", ["splicefield-substation"], ["maintenance-unit-m-17", "tomas-vey"], "The repair is completed, redirected, interrupted, or finishes without intervention; system and ecology state change."),
  },
  {
    kind: "EVENT", slug: "three-failure-reports", title: "Three Failure Reports", summary: "Three authentic reports describe mutually incompatible first failures at Southreach.",
    body: `Three Failure Reports are authentic Southreach documents: an Aegis operations report begins with storage resonance, an NDD emergency report begins with isolation failure, and a Meridian technical report begins with bad assay and telemetry. Their timestamps cannot all share one clock. [[tomas-vey]] can authenticate terminology, not motive. Together they prove the official account compresses incompatible evidence. If nobody recovers the originals, institutional summaries remain the only surviving versions.`,
    meta: eventMeta("Records written during and after the Bloomfall; present-day investigation unscheduled", ["southreach-complex", "redline-shelter-six"], ["aegis-extraction-consortium", "national-defense-directorate", "meridian-arcane-institute", "tomas-vey"], "The reports may be preserved, compared, or fragmented; they prove incompleteness without proving cause."),
  },
  {
    kind: "EVENT", slug: "black-tide-at-blackweir", title: "Black Tide at Blackweir", summary: "A downstream surge tests whether harvest infrastructure, marsh coordination, and emergency response can share the same channels.",
    body: `Black Tide at Blackweir is the downstream consequence of high load moving into [[blackweir]]. Resin beds darken, sink roots overload, and the marsh begins sacrificing contaminated ground. [[keira-ansel]] measures coordination, [[nalia-reed]] reads changing channels, and licensed harvesters face losing their livelihood. If nobody comes, the marsh absorbs what it can, abandons part of the weir, and moves the filtration front—saving the ocean at a local cost. No outcome proves consciousness.`,
    meta: eventMeta("Unscheduled Living Marsh regional crisis", ["blackweir", "heartfen"], ["keira-ansel", "nalia-reed", "meridian-arcane-institute"], "The load is redirected, harvested, contained, or absorbed autonomously; Blackweir's ecology and economy change."),
  },
] as const;

export type BloomfallNodeSeed = {
  readonly key: string; readonly kind: "QUEST_START" | "QUEST_STEP" | "CHOICE" | "ENDING";
  readonly title: string; readonly summary: string; readonly body: string; readonly endingKind?: "SUCCESS" | "FAILURE" | "NEUTRAL";
  readonly completion?: string; readonly effects?: string[]; readonly rewards?: string[]; readonly links: readonly string[];
};
export type BloomfallEdgeSeed = { readonly key: string; readonly from: string; readonly to: string; readonly label: string | null; readonly effects: readonly string[] };
export type BloomfallArcSeed = {
  readonly slug: string; readonly title: string; readonly summary: string; readonly hook: string; readonly category: "SIDE_QUEST" | "CONTRACT" | "FACTION_QUEST" | "WORLD_EVENT";
  readonly factionSlug?: string; readonly position: number; readonly concepts: readonly string[]; readonly nodes: readonly BloomfallNodeSeed[]; readonly edges: readonly BloomfallEdgeSeed[];
};

function regionalArc(input: Omit<BloomfallArcSeed, "nodes" | "edges"> & { actionTitle: string; actionBody: string; decisionTitle: string; successBody: string; nobodyBody: string; links: readonly string[] }): BloomfallArcSeed {
  return {
    ...input,
    nodes: [
      { key: "regional-alert", kind: "QUEST_START", title: input.title, summary: input.hook, body: `This is regional, non-mainline story architecture. ${input.hook}`, links: input.links },
      { key: "fieldwork", kind: "QUEST_STEP", title: input.actionTitle, summary: input.actionBody, body: input.actionBody, completion: "Reach the incident and establish current conditions without assuming the world waited.", effects: ["Record the incident's current regional state."], rewards: [], links: input.links },
      { key: "regional-decision", kind: "CHOICE", title: input.decisionTitle, summary: "Choose how to intervene, or recognize the world-state outcome if nobody came.", body: "Every branch changes regional evidence, access, ecology, faction standing, or resources. None reveals the deferred true cause of the Bloomfall.", effects: [], rewards: [], links: input.links },
      { key: "intervention-outcome", kind: "ENDING", title: "Intervention Outcome", summary: input.successBody, body: input.successBody, endingKind: "NEUTRAL", effects: ["Persist the authored regional consequence."], rewards: ["Regional evidence, access, material, or standing appropriate to the chosen method."], links: input.links },
      { key: "nobody-came", kind: "ENDING", title: "Nobody Came", summary: input.nobodyBody, body: input.nobodyBody, endingKind: "NEUTRAL", effects: ["Advance the world without player presence.", "Persist the Nobody Came regional consequence."], rewards: [], links: input.links },
    ],
    edges: [
      { key: "alert-to-field", from: "regional-alert", to: "fieldwork", label: null, effects: [] },
      { key: "field-to-decision", from: "fieldwork", to: "regional-decision", label: null, effects: [] },
      { key: "choose-intervention", from: "regional-decision", to: "intervention-outcome", label: "Intervene before the regional state closes", effects: ["Resolve the crisis through the selected method."] },
      { key: "choose-nobody", from: "regional-decision", to: "nobody-came", label: "The incident resolves without the party", effects: ["Apply Nobody Came outcome."] },
    ],
  };
}

export const bloomfallArcs: readonly BloomfallArcSeed[] = [
  regionalArc({ slug: "the-southreach-record", title: "The Southreach Record", summary: "Recover the Last Safe Reading and compare Three Failure Reports without inventing a culprit.", hook: "A forecast sector restart exposes a narrow archival route inside Southreach.", category: "SIDE_QUEST", position: 800, concepts: ["the-last-safe-reading", "three-failure-reports"], actionTitle: "Recover the Incompatible Record", actionBody: "Retrieve telemetry and reports before a reactor cycle overwrites or reseals them.", decisionTitle: "Who Holds an Incomplete Truth?", successBody: "The official account is proven incomplete, while cause and culprit remain unresolved.", nobodyBody: "The buffer is overwritten; institutions retain incompatible partial copies and the public history remains unchanged.", links: ["the-last-safe-reading", "three-failure-reports", "tomas-vey", "southreach-complex", "ashline-exchange"] }),
  regionalArc({ slug: "reserve-twelve-contract", title: "Reserve Twelve", summary: "A salvage and custody contract spanning Reserve Twelve and A Ledger with Two Owners.", hook: "A vault cycle creates a lawful but dangerous recovery window under competing authentic claims.", category: "CONTRACT", position: 810, concepts: ["reserve-twelve", "a-ledger-with-two-owners"], actionTitle: "Enter the Vault Window", actionBody: "Secure people, inventory evidence, and containment before pursuing valuable material.", decisionTitle: "Custody, Disclosure, or Containment", successBody: "The chosen priority changes access, faction standing, evidence custody, and salvage without proving culpability.", nobodyBody: "The vault reseals, pressure transfers to a neighboring sector, and rival partial ledgers circulate.", links: ["reserve-twelve", "a-ledger-with-two-owners", "reserve-vault-twelve", "jaro-fen", "selene-ward", "reserve-glass"] }),
  regionalArc({ slug: "the-purge-window", title: "The Purge Window", summary: "A world event links a forecast Southreach purge to Black Tide at Blackweir.", hook: "A reactor-sector purge is imminent and its downstream load has somewhere to go.", category: "WORLD_EVENT", position: 820, concepts: ["the-purge-window", "black-tide-at-blackweir"], actionTitle: "Read the Vent and the Weir", actionBody: "Coordinate Shattercore forecasting with Living Marsh observations while both are still actionable.", decisionTitle: "Redirect the Cost", successBody: "The purge and downstream load resolve through an authored balance of access, containment, ecology, and loss.", nobodyBody: "The sector vents; Blackweir sacrifices a filtration arm and relocates its front, preserving ocean containment at local cost.", links: ["the-purge-window", "black-tide-at-blackweir", "reactor-cycles", "blackweir", "keira-ansel", "nalia-reed"] }),
  regionalArc({ slug: "the-bellwether-hunt", title: "The Bellwether", summary: "A Warden faction quest about a migration-changing Aberrant, not a giant-deer boss hunt.", hook: "Herds abandon Cairnwood's surveyed approach as the Bellwether enters Long Graze.", category: "FACTION_QUEST", factionSlug: "wardens-monster-hunter-guild", position: 830, concepts: ["the-bellwether-event"], actionTitle: "Track the Field, Not the Trophy", actionBody: "Map herd and predator response before choosing observation, redirection, or lethal force.", decisionTitle: "Protect the Route or the Ecology", successBody: "The Bellwether is observed, redirected, or killed with a persistent migration consequence.", nobodyBody: "The Aberrant migrates; Cairnwood loses the surveyed approach and predators follow displaced herds.", links: ["the-bellwether-event", "the-bellwether", "mara-quill", "long-graze", "adaptive-mutation"] }),
  regionalArc({ slug: "root-of-the-bargain", title: "Root of the Bargain", summary: "A side quest combining a measurable marsh exchange with The Route That Moves.", hook: "Heartfen opens a temporary channel after a repeatable material return, while a moving route aligns upstream.", category: "SIDE_QUEST", position: 840, concepts: ["root-of-the-bargain", "the-route-that-moves"], actionTitle: "Test the Opening", actionBody: "Follow the moving corridor and repeat the observed exchange without treating coordination as speech.", decisionTitle: "Agreement, Exploitation, or Restraint", successBody: "A repeatable ecological exchange is documented or refused; consciousness remains unproven and the route closes.", nobodyBody: "The marsh redistributes the load itself, closes Heartfen, and opens access elsewhere after the isolated expedition withdraws.", links: ["root-of-the-bargain", "the-route-that-moves", "heartfen", "walking-orchard", "nalia-reed", "keira-ansel"] }),
  regionalArc({ slug: "menders-work", title: "Mender’s Work", summary: "A machine-organic repair story in which technical success may be the dangerous branch.", hook: "M-17 has begun reconnecting Splicefield to a Southreach feeder using living tissue.", category: "SIDE_QUEST", position: 850, concepts: ["menders-work"], actionTitle: "Understand the Repair", actionBody: "Determine what Mender is restoring, what it is using as parts, and which systems will wake.", decisionTitle: "Complete, Redirect, or Interrupt", successBody: "Mender's work is completed, redirected, or stopped with persistent grid and ecological consequences.", nobodyBody: "M-17 completes its corrupted work order; the grid ecology adapts and an old reserve feed wakes without witnesses.", links: ["menders-work", "maintenance-unit-m-17", "splicefield-substation", "tomas-vey", "reactor-cycles"] }),
] as const;

export const bloomfallNewEntries = [
  ...bloomfallSubregions,
  ...bloomfallPois,
  ...bloomfallSystems,
  ...bloomfallCharacters,
  ...bloomfallCreatures,
  ...bloomfallAberrants,
  ...bloomfallResources,
  ...bloomfallEvents,
] as const;

export const bloomfallExpectedCounts = {
  subregions: 3, pois: 15, systems: 9, characters: 7, creatures: 8, aberrants: 4, newResources: 6, resourcePackage: 8, events: 11, arcs: 6, connections: 2, routePaths: 0,
} as const;
