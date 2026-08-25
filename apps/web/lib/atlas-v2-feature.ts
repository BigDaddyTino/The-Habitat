import type { HabitatRole } from "./permissions";

export const atlasV2FeatureEnvironmentKey = "HABITAT_ATLAS_V2_INTERNAL_ENABLED" as const;
export const atlasV2ProductionDefaultEnvironmentKey = "HABITAT_ATLAS_V2_PRODUCTION_DEFAULT_ENABLED" as const;

type AtlasFeatureEnvironment = Readonly<Record<string, string | undefined>>;

export function atlasV2FeatureAvailable(environment: AtlasFeatureEnvironment = process.env) {
  return environment[atlasV2FeatureEnvironmentKey]?.trim().toLowerCase() === "true";
}

export function atlasV2InternalDefaultAvailable(input: { role: HabitatRole; environment?: AtlasFeatureEnvironment }) {
  const environment = input.environment ?? process.env;
  return input.role === "ADMIN"
    && environment.HABITAT_ENVIRONMENT?.trim().toLowerCase() === "development"
    && atlasV2FeatureAvailable(environment);
}

export function atlasV2ProductionDefaultAvailable(environment: AtlasFeatureEnvironment = process.env) {
  return environment.NODE_ENV?.trim().toLowerCase() === "production"
    && environment[atlasV2ProductionDefaultEnvironmentKey]?.trim().toLowerCase() === "true";
}

export function resolveAtlasProjectionVersion(input: { requested: string | null | undefined; role: HabitatRole; environment?: AtlasFeatureEnvironment }) {
  const requested = input.requested?.trim().toLowerCase();
  if (requested === "v1") return "V1" as const;
  if (requested === "v2") return input.role === "ADMIN" && atlasV2FeatureAvailable(input.environment) ? "V2" as const : "V1" as const;
  return requested === undefined && (atlasV2InternalDefaultAvailable(input) || atlasV2ProductionDefaultAvailable(input.environment)) ? "V2" as const : "V1" as const;
}
