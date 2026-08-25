export const atlasDevelopmentDatabaseName = "habitat_atlas_dev" as const;

export function resolveAtlasDevelopmentDatabaseUrl(environment: Readonly<Record<string, string | undefined>> = process.env) {
  if (environment.HABITAT_ENVIRONMENT !== "development") return null;
  if (environment.HABITAT_DEVELOPMENT_DATABASE !== atlasDevelopmentDatabaseName) throw new Error(`Development requires HABITAT_DEVELOPMENT_DATABASE=${atlasDevelopmentDatabaseName}.`);
  const source = environment.DATABASE_URL;
  if (!source) throw new Error("Development requires a base DATABASE_URL before the Atlas development target can be resolved.");
  const url = new URL(source);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) throw new Error("Atlas development database resolution requires a loopback PostgreSQL base URL.");
  url.pathname = `/${atlasDevelopmentDatabaseName}`;
  return url.toString();
}
