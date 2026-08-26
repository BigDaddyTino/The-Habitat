export const bloomfallRouteClasses = ["PERMANENT", "CONDITIONAL", "DYNAMIC", "DEFERRED"] as const;
export type BloomfallRouteClass = (typeof bloomfallRouteClasses)[number];

export const bloomfallRouteAvailabilityStates = ["OPEN", "DANGEROUS", "CLOSED"] as const;
export type BloomfallRouteAvailabilityState = (typeof bloomfallRouteAvailabilityStates)[number];

export const bloomfallRouteKnowledgeStates = ["KNOWN_OPEN", "KNOWN_CLOSED", "HAZARDOUS", "UNVERIFIED", "LOST"] as const;
export type BloomfallRouteKnowledgeState = (typeof bloomfallRouteKnowledgeStates)[number];

export const bloomfallTravelSystems = ["ESSENCE_SATURATION", "REACTOR_CYCLES", "BLOOMSTORMS", "HARVESTING_PRESSURE", "ABERRANTS"] as const;
export type BloomfallTravelSystem = (typeof bloomfallTravelSystems)[number];

/**
 * Canonical authoring metadata for a stable Bloomfall connection. This is not
 * runtime route state: a future world service owns OPEN/DANGEROUS/CLOSED while
 * player knowledge separately owns KNOWN_OPEN/KNOWN_CLOSED/HAZARDOUS/UNVERIFIED/LOST.
 */
export type BloomfallRouteAuthoringMetadata = {
  readonly contract: "martino-bloomfall-route-metadata";
  readonly contractVersion: 1;
  readonly routeKey: string;
  readonly routeClass: Extract<BloomfallRouteClass, "PERMANENT" | "CONDITIONAL">;
  readonly stableGeometry: true;
  readonly conditionOwner: string;
  readonly systemDependencies: readonly BloomfallTravelSystem[];
  readonly defaultAvailability: BloomfallRouteAvailabilityState;
  readonly defaultKnowledge: BloomfallRouteKnowledgeState;
};
