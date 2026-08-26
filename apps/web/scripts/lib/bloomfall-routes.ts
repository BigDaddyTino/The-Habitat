import { createHash } from "node:crypto";
import type {
  AtlasBoundedMetadata,
  AtlasMapConnectionPath,
  AtlasWorldConnectionType,
  BloomfallRouteAuthoringMetadata,
  BloomfallRouteClass,
  BloomfallTravelSystem,
} from "@habitat/shared";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";
import { bloomfallAtlasId, bloomfallLocalRoutes } from "./bloomfall-local-atlas";

export const bloomfallRouteStatusContract = "martino-bloomfall-route-status" as const;
export const bloomfallRouteStatusContractVersion = 1 as const;
export const bloomfallRouteSceneSlug = "martino-bloomfall-reach" as const;

type RouteAvailability = "OPEN" | "DANGEROUS" | "CLOSED";
type RouteKnowledge = "KNOWN_OPEN" | "KNOWN_CLOSED" | "HAZARDOUS" | "UNVERIFIED" | "LOST";
type RouteAuthoringDecision = "PRESERVE" | "AUTHOR_NOW" | "DO_NOT_PERSIST";

export type BloomfallRouteCandidate = {
  readonly key: string;
  readonly name: string;
  readonly source: string;
  readonly destination: string;
  readonly via: readonly string[];
  readonly type: AtlasWorldConnectionType;
  readonly classification: BloomfallRouteClass;
  readonly persisted: boolean;
  readonly authoringDecision: RouteAuthoringDecision;
  readonly conditionOwner: string;
  readonly systemDependencies: readonly BloomfallTravelSystem[];
  readonly defaultAvailability: RouteAvailability | null;
  readonly defaultKnowledge: RouteKnowledge;
  readonly pathSha256: string | null;
  readonly notes: string;
};

export type BloomfallPersistedRoute = {
  readonly key: string;
  readonly name: string;
  readonly source: string;
  readonly destination: string;
  readonly via: readonly string[];
  readonly type: AtlasWorldConnectionType;
  readonly classification: Extract<BloomfallRouteClass, "PERMANENT" | "CONDITIONAL">;
  readonly authoringDecision: Extract<RouteAuthoringDecision, "PRESERVE" | "AUTHOR_NOW">;
  readonly connectionId: string;
  readonly pathId: string;
  readonly originalWording: string;
  readonly editorialNotes: string;
  readonly metadata: AtlasBoundedMetadata & BloomfallRouteAuthoringMetadata;
  readonly geometry: AtlasMapConnectionPath["geometry"];
  readonly minZoom: number;
  readonly maxZoom: null;
  readonly priority: number;
};

function canonicalConnectionId(key: string) {
  const source = createHash("sha256").update(`martino:bloomfall-reach:prompt-3:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "5";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function routeMetadata(input: Omit<BloomfallRouteAuthoringMetadata, "contract" | "contractVersion" | "stableGeometry">, provenance: AtlasBoundedMetadata): AtlasBoundedMetadata & BloomfallRouteAuthoringMetadata {
  return {
    ...provenance,
    contract: "martino-bloomfall-route-metadata",
    contractVersion: 1,
    stableGeometry: true,
    ...input,
  };
}

const riverlands = bloomfallLocalRoutes.find((route) => route.key === "riverlands-road")!;
const ocean = bloomfallLocalRoutes.find((route) => route.key === "ocean-sea-route")!;
const lineGeometry = (coordinates: readonly (readonly [number, number])[]) => ({ type: "LINESTRING", coordinates }) as unknown as AtlasMapConnectionPath["geometry"];

export const bloomfallPersistedRoutes: readonly BloomfallPersistedRoute[] = [
  {
    key: "riverlands-ashline-corridor",
    name: "Riverlands / Ashline historical corridor",
    source: "bloomfall-reach",
    destination: "riverlands",
    via: ["ashline-exchange", "southreach-complex", "redline-shelter-six"],
    type: "ROAD",
    classification: "PERMANENT",
    authoringDecision: "PRESERVE",
    connectionId: canonicalConnectionId("connection:bloomfall-reach:riverlands:road"),
    pathId: bloomfallAtlasId("connection-path", "riverlands-road"),
    originalWording: "Historical Southreach freight/access road now functioning as a controlled and gated expedition corridor.",
    editorialNotes: "Prompt D preserves the approved local geometry. Permanent means the road identity survives; system-owned condition records may still make a segment dangerous or closed.",
    metadata: routeMetadata({ routeKey: "riverlands-ashline-corridor", routeClass: "PERMANENT", conditionOwner: "BLOOMFALL_ROUTE_CONDITION_SERVICE", systemDependencies: ["ESSENCE_SATURATION", "REACTOR_CYCLES", "BLOOMSTORMS", "ABERRANTS"], defaultAvailability: "OPEN", defaultKnowledge: "KNOWN_OPEN" }, { canonSource: "Bloomfall Reach Prompts 3, A, and D", historicalFunction: "Southreach freight and access road", currentUse: "controlled gated expedition corridor", geometryStatus: "LOCAL_PATH_AUTHORED" }),
    geometry: riverlands.geometry as unknown as AtlasMapConnectionPath["geometry"],
    minZoom: riverlands.minZoom,
    maxZoom: null,
    priority: riverlands.priority,
  },
  {
    key: "drowned-intake-ocean-approach",
    name: "Drowned Intake / Ocean shallow-draft approach",
    source: "bloomfall-reach",
    destination: "the-ocean",
    via: ["drowned-intake", "blackweir"],
    type: "SEA_ROUTE",
    classification: "CONDITIONAL",
    authoringDecision: "PRESERVE",
    connectionId: canonicalConnectionId("connection:bloomfall-reach:the-ocean:sea-route"),
    pathId: bloomfallAtlasId("connection-path", "ocean-sea-route"),
    originalWording: "Historical Drowned Intake marine/logistics access now usable only through hazardous shallow-draft approaches.",
    editorialNotes: "Prompt D preserves the approved base alignment. Hydrology, Bloomstorms, intake state, and Old Drowner change usability through route-state records, never alternate static paths.",
    metadata: routeMetadata({ routeKey: "drowned-intake-ocean-approach", routeClass: "CONDITIONAL", conditionOwner: "LIVING_MARSH_HYDROLOGY", systemDependencies: ["ESSENCE_SATURATION", "REACTOR_CYCLES", "BLOOMSTORMS", "HARVESTING_PRESSURE", "ABERRANTS"], defaultAvailability: "DANGEROUS", defaultKnowledge: "UNVERIFIED" }, { canonSource: "Bloomfall Reach Prompts 3, A, and D", historicalFunction: "Drowned Intake marine and logistics access", currentUse: "hazardous shallow-draft approach", safeCommercialHarbor: false, geometryStatus: "LOCAL_BASE_PATH_AUTHORED" }),
    geometry: ocean.geometry as unknown as AtlasMapConnectionPath["geometry"],
    minZoom: ocean.minZoom,
    maxZoom: null,
    priority: ocean.priority,
  },
  {
    key: "cairnwood-glassroot-expedition-trail",
    name: "Cairnwood Camp / Glassroot Observatory expedition trail",
    source: "cairnwood-camp",
    destination: "glassroot-observatory",
    via: [],
    type: "TRAIL",
    classification: "CONDITIONAL",
    authoringDecision: "AUTHOR_NOW",
    connectionId: bloomfallAtlasId("system-aware-connection", "cairnwood-glassroot-expedition-trail"),
    pathId: bloomfallAtlasId("system-aware-path", "cairnwood-glassroot-expedition-trail"),
    originalWording: "Surveyed expedition trail between Cairnwood Camp and Glassroot Observatory.",
    editorialNotes: "V3 review supports one stable surveyed alignment. Migration, saturation, Bloomstorms, and field disturbance alter cost or close it through future condition records.",
    metadata: routeMetadata({ routeKey: "cairnwood-glassroot-expedition-trail", routeClass: "CONDITIONAL", conditionOwner: "MUTATION_BELT_ROUTE_STATE", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE", "ABERRANTS"], defaultAvailability: "OPEN", defaultKnowledge: "UNVERIFIED" }, { canonSource: "Bloomfall Reach Prompts A and D", historicalFunction: "surveyed expedition access", currentUse: "field trail between camp and observatory", geometryStatus: "LOCAL_BASE_PATH_AUTHORED" }),
    geometry: lineGeometry([[17904,34180],[23500,33750],[29200,32750],[35000,31500],[41000,29900],[47000,28600],[53500,27800],[60000,28200],[65104,29297]]),
    minZoom: 0.8,
    maxZoom: null,
    priority: 42,
  },
  {
    key: "southreach-service-rail-alignment",
    name: "Southreach reserve/service rail alignment",
    source: "reserve-vault-twelve",
    destination: "crown-break",
    via: ["southreach-complex"],
    type: "OTHER",
    classification: "CONDITIONAL",
    authoringDecision: "AUTHOR_NOW",
    connectionId: bloomfallAtlasId("system-aware-connection", "southreach-service-rail-alignment"),
    pathId: bloomfallAtlasId("system-aware-path", "southreach-service-rail-alignment"),
    originalWording: "Fixed reserve/service rail bed from Reserve Vault Twelve through Southreach Complex to Crown Break.",
    editorialNotes: "OTHER is the closest existing taxonomy for mixed rail, service bed, and plant access. Ashline-Southreach and the Redline spur remain represented by the preserved Riverlands corridor, avoiding duplicate geometry.",
    metadata: routeMetadata({ routeKey: "southreach-service-rail-alignment", routeClass: "CONDITIONAL", conditionOwner: "SOUTHREACH_REACTOR_CONTROLLER", systemDependencies: ["ESSENCE_SATURATION", "REACTOR_CYCLES", "BLOOMSTORMS", "ABERRANTS"], defaultAvailability: "DANGEROUS", defaultKnowledge: "UNVERIFIED" }, { canonSource: "Bloomfall Reach Prompts A and D", historicalFunction: "reserve freight, service rail, and emergency plant access", currentUse: "forecast-gated industrial traversal", geometryStatus: "LOCAL_BASE_PATH_AUTHORED" }),
    geometry: lineGeometry([[32552,3255],[38000,4100],[43000,5400],[47000,7000],[48828,8138],[55500,7300],[62000,6000],[69000,4300],[74870,3255]]),
    minZoom: 1,
    maxZoom: null,
    priority: 40,
  },
] as const;

const withoutPath = (candidate: Omit<BloomfallRouteCandidate, "persisted" | "pathSha256">): BloomfallRouteCandidate => ({ ...candidate, persisted: false, pathSha256: null });

export const bloomfallUnpersistedRouteCandidates: readonly BloomfallRouteCandidate[] = [
  withoutPath({ key: "walking-orchard-reedless-moving-corridor", name: "Walking Orchard / Reedless moving corridor", source: "walking-orchard", destination: "reedless-mile", via: [], type: "TRAIL", classification: "DYNAMIC", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "LIVING_MARSH_DYNAMIC_CORRIDOR_RESOLVER", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE"], defaultAvailability: null, defaultKnowledge: "LOST", notes: "The Orchard moves and the Reedless opening can vanish. Runtime may select from authored corridor envelopes; no canonical line exists." }),
  withoutPath({ key: "reedless-mile-openings", name: "Reedless Mile temporary openings", source: "the-mutation-belt", destination: "reedless-mile", via: [], type: "TRAIL", classification: "DYNAMIC", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "LIVING_MARSH_DYNAMIC_CORRIDOR_RESOLVER", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE"], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "Bare substrate creates schedule-bound openings, not a stable trail." }),
  withoutPath({ key: "long-graze-herd-corridor", name: "Long Graze herd corridor", source: "cairnwood-camp", destination: "long-graze", via: [], type: "TRAIL", classification: "DYNAMIC", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "MUTATION_BELT_HERD_SCHEDULER", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE", "ABERRANTS"], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "Herd and predator movement creates a temporary travel corridor, never a guaranteed player road." }),
  withoutPath({ key: "heartfen-openings", name: "Heartfen access openings", source: "the-living-marsh", destination: "heartfen", via: [], type: "RIVER_TRAVEL", classification: "DYNAMIC", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "LIVING_MARSH_DYNAMIC_CORRIDOR_RESOLVER", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE"], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "Access is a changing ecological opening or route-less exploration. Heartfen receives no convenient permanent road." }),
  withoutPath({ key: "living-marsh-secondary-waterways", name: "Living Marsh secondary waterways", source: "blackweir", destination: "lantern-pools", via: ["reedless-mile", "heartfen"], type: "RIVER_TRAVEL", classification: "DYNAMIC", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "LIVING_MARSH_DYNAMIC_CORRIDOR_RESOLVER", systemDependencies: ["ESSENCE_SATURATION", "BLOOMSTORMS", "HARVESTING_PRESSURE", "ABERRANTS"], defaultAvailability: null, defaultKnowledge: "LOST", notes: "Secondary channels close, redirect, or cease to be navigable. Only the Drowned Intake approach has a stable base alignment." }),
  withoutPath({ key: "riverlands-world-continuation", name: "Riverlands world-scene continuation", source: "bloomfall-reach", destination: "riverlands", via: [], type: "ROAD", classification: "DEFERRED", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "NONE_UNTIL_WORLD_GEOMETRY_REVIEW", systemDependencies: [], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "The V3 world Atlas establishes adjacency and landmass context but does not show a defensible exact road line. The semantic connection and local Ashline path remain sufficient." }),
  withoutPath({ key: "ocean-world-continuation", name: "Ocean world-scene continuation", source: "bloomfall-reach", destination: "the-ocean", via: [], type: "SEA_ROUTE", classification: "DEFERRED", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "NONE_UNTIL_WORLD_GEOMETRY_REVIEW", systemDependencies: [], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "The V3 world coast does not provide exact shallow-draft continuation geometry. Preserve the semantic connection and local Drowned Intake alignment only." }),
  withoutPath({ key: "magic-torn-adjacency", name: "Magic-Torn Wasteland adjacency", source: "bloomfall-reach", destination: "magic-torn-wasteland", via: [], type: "UNKNOWN", classification: "DEFERRED", authoringDecision: "DO_NOT_PERSIST", conditionOwner: "NONE", systemDependencies: [], defaultAvailability: null, defaultKnowledge: "UNVERIFIED", notes: "Geographic adjacency only. Current Codex contains no semantic travel route, trail, road, or hidden passage." }),
] as const;

export const bloomfallRouteCandidates: readonly BloomfallRouteCandidate[] = [
  ...bloomfallPersistedRoutes.map((route) => ({ key: route.key, name: route.name, source: route.source, destination: route.destination, via: route.via, type: route.type, classification: route.classification, persisted: true, authoringDecision: route.authoringDecision, conditionOwner: route.metadata.conditionOwner, systemDependencies: route.metadata.systemDependencies, defaultAvailability: route.metadata.defaultAvailability, defaultKnowledge: route.metadata.defaultKnowledge, pathSha256: atlasSha256(stableAtlasJson(route.geometry, false)), notes: route.editorialNotes })),
  ...bloomfallUnpersistedRouteCandidates,
];

export const bloomfallTravelMatrix = [
  { routeKey: "riverlands-ashline-corridor", essenceSaturation: "May raise cost and warnings; does not erase the road.", reactorCycles: "Southreach/Ashline segments can become dangerous or closed; bed persists.", bloomstorms: "Usually usable with exposure/visibility risk; severe footprints can close a segment.", harvestingPressure: "No default effect; only an authored structural consequence may alter a local spur.", aberrants: "Occupation changes risk and intel, never topology." },
  { routeKey: "drowned-intake-ocean-approach", essenceSaturation: "Contaminated flow raises exposure and spell/equipment risk.", reactorCycles: "Venting, Purge, Overflow, or Breach can send load through the intake.", bloomstorms: "Onset/Peak can close shallow water; Decay/Aftermath may create a valuable window.", harvestingPressure: "Sink loss can raise water/load and close the approach.", aberrants: "Old Drowner can make the channel unsafe or impassable without deleting its alignment." },
  { routeKey: "cairnwood-glassroot-expedition-trail", essenceSaturation: "Active/Surge bands raise warnings, creature density, and traversal cost.", reactorCycles: "Only indirect transferred pressure affects it; a reactor label cannot close it remotely.", bloomstorms: "Warning supports evacuation; Peak may close exposed sections; Aftermath may reward travel.", harvestingPressure: "Local root/ground damage can make the surveyed bed dangerous or temporarily closed.", aberrants: "Bellwether/herd displacement changes safety and confidence, not the surveyed alignment." },
  { routeKey: "southreach-service-rail-alignment", essenceSaturation: "Charge and contamination make fixed segments dangerous.", reactorCycles: "Dormant may permit manual access; Restart/Purge may open systems; Venting/Overflow/Breach can close segments.", bloomstorms: "Exposed conductors and visibility make Onset/Peak hazardous or closed.", harvestingPressure: "No generic effect; only removal of functional infrastructure can alter access.", aberrants: "Last Shift procedures can open one access while sealing another; route identity persists." },
  { routeKey: "dynamic-corridors", essenceSaturation: "Pressure gradients help select or remove a temporary corridor.", reactorCycles: "Only transferred air/water/grid effects participate.", bloomstorms: "Storm and aftermath can move, expose, or erase current geometry.", harvestingPressure: "Sink/root/herd disruption can move the corridor instead of toggling a fixed line.", aberrants: "Bellwether and Old Drowner influence corridor selection through ecology/hydrology." },
] as const;

export function buildBloomfallRouteStatusManifest() {
  const counts = {
    PERMANENT: bloomfallRouteCandidates.filter((route) => route.classification === "PERMANENT").length,
    CONDITIONAL: bloomfallRouteCandidates.filter((route) => route.classification === "CONDITIONAL").length,
    DYNAMIC: bloomfallRouteCandidates.filter((route) => route.classification === "DYNAMIC").length,
    DEFERRED: bloomfallRouteCandidates.filter((route) => route.classification === "DEFERRED").length,
  };
  const payload = {
    contract: bloomfallRouteStatusContract,
    contractVersion: bloomfallRouteStatusContractVersion,
    scene: bloomfallRouteSceneSlug,
    policy: "World connection is semantic; connection path is stable scene geometry; current gameplay usability belongs to a future authoritative route-state service.",
    definitions: {
      PERMANENT: "Stable infrastructure or geography whose identity persists even while hazardous or locally blocked.",
      CONDITIONAL: "Stable base alignment whose OPEN, DANGEROUS, or CLOSED usability changes through bounded world-state records.",
      DYNAMIC: "Traversal geometry is selected, moved, or removed by an owning ecology/system and is never stored as base topology.",
      DEFERRED: "No path is authored because canon, art, endpoint meaning, or later world/runtime ownership is insufficient.",
    },
    counts: { candidates: bloomfallRouteCandidates.length, persistedBefore: 2, persistedAfter: bloomfallPersistedRoutes.length, newPersisted: bloomfallPersistedRoutes.filter((route) => route.authoringDecision === "AUTHOR_NOW").length, ...counts },
    routes: bloomfallRouteCandidates,
    travelMatrix: bloomfallTravelMatrix,
    playerKnowledge: { values: ["KNOWN_OPEN", "KNOWN_CLOSED", "HAZARDOUS", "UNVERIFIED", "LOST"], rule: "Knowledge is player/party information with freshness; it never replaces authoritative OPEN/DANGEROUS/CLOSED route state." },
    productionSafety: { writes: 0, migrations: 0, atlasChanges: 0, codexChanges: 0 },
  } as const;
  return { ...payload, logicalSha256: atlasSha256(stableAtlasJson(payload, false)) };
}
