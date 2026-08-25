import { atlasDevelopmentDatabaseName } from "./atlas-development-database";
import { atlasV2FeatureAvailable } from "./atlas-v2-feature";

export const atlasAuthoringEnvironmentKey = "HABITAT_ATLAS_AUTHORING_ENABLED" as const;

export function assertAtlasAuthoringEnvironment(environment: Readonly<Record<string, string | undefined>> = process.env) {
  if (environment.HABITAT_ENVIRONMENT !== "development") throw new Error("Atlas authoring is development-only.");
  if (environment[atlasAuthoringEnvironmentKey]?.trim().toLowerCase() !== "true") throw new Error("Atlas authoring is not enabled for this process.");
  if (!atlasV2FeatureAvailable(environment)) throw new Error("Atlas authoring requires the internal V2 projection.");
  const raw = environment.DATABASE_URL;
  if (!raw) throw new Error("Atlas authoring requires an explicit database target.");
  const url = new URL(raw);
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase()) || url.pathname.replace(/^\//, "") !== atlasDevelopmentDatabaseName) throw new Error(`Atlas authoring requires loopback database ${atlasDevelopmentDatabaseName}.`);
  return { database: atlasDevelopmentDatabaseName, hostname: url.hostname, port: url.port || "5432" };
}

export function atlasAuthoringEnvironmentAvailable(environment: Readonly<Record<string, string | undefined>> = process.env) {
  try { assertAtlasAuthoringEnvironment(environment); return true; } catch { return false; }
}
