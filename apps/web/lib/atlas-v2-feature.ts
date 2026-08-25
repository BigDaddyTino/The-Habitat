import type { HabitatRole } from "./permissions";

export const atlasV2FeatureEnvironmentKey = "HABITAT_ATLAS_V2_INTERNAL_ENABLED" as const;

type AtlasFeatureEnvironment = Readonly<Record<string, string | undefined>>;

export function atlasV2FeatureAvailable(environment: AtlasFeatureEnvironment = process.env) {
  return environment[atlasV2FeatureEnvironmentKey]?.trim().toLowerCase() === "true";
}

export function resolveAtlasProjectionVersion(input: { requested: string | null | undefined; role: HabitatRole; environment?: AtlasFeatureEnvironment }) {
  return input.requested?.toLowerCase() === "v2" && input.role === "ADMIN" && atlasV2FeatureAvailable(input.environment) ? "V2" as const : "V1" as const;
}
