import "../lib/environment";
import { createHash } from "node:crypto";
import { createPrismaClient } from "@habitat/db/client";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallCodexIntegrationContract,
  bloomfallIntegrationNewSlugs,
  bloomfallIntegrationRecords,
} from "../lib/bloomfall-codex-integration";
import { stableAtlasJson } from "./lib/atlas-integrity";

/**
 * Read-only proof that the Prompt E integration stopped at the development
 * Codex. It fingerprints every record the phase touches as production holds
 * it, and confirms the two new dossiers do not exist there at all.
 *
 * Run it before and after any development authoring: the fingerprint must be
 * identical both times, because this phase never writes to production.
 */

const touched = [...new Set([
  ...bloomfallIntegrationRecords.map((record) => record.slug),
  ...bloomfallAllCrossLinkBlocks.map((block) => block.slug),
])].sort();

const database = createPrismaClient();

async function main() {
  const identity = await database.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (identity[0]?.database === "habitat_atlas_dev") throw new Error("The production comparison refused the development database.");

  const entries = await database.storyEntry.findMany({
    where: { slug: { in: touched } },
    orderBy: { slug: "asc" },
    select: { slug: true, kind: true, title: true, summary: true, body: true, meta: true, status: true, version: true },
  });
  const present = new Set(entries.map((entry) => entry.slug));
  const newRecordsPresent = bloomfallIntegrationNewSlugs.filter((slug) => present.has(slug));
  const integratedBodies = entries.filter((entry) => (entry.body ?? "").includes("## Related in the Codex")).map((entry) => entry.slug);
  const fingerprint = createHash("sha256").update(stableAtlasJson(entries, false)).digest("hex");
  const failures: string[] = [];
  if (newRecordsPresent.length) failures.push(`Development-only dossiers exist in production: ${newRecordsPresent.join(", ")}`);
  if (integratedBodies.length) failures.push(`Prompt E prose reached production records: ${integratedBodies.join(", ")}`);

  process.stdout.write(stableAtlasJson({
    contract: `${bloomfallCodexIntegrationContract}-production-comparison`,
    action: "READ_ONLY_PRODUCTION_COMPARISON",
    database: identity[0],
    touchedSlugs: touched.length,
    recordsFound: entries.length,
    expectedNewRecordsAbsent: bloomfallIntegrationNewSlugs,
    fingerprint,
    writes: 0,
    migrations: 0,
    status: failures.length ? "FAIL" : "PASS",
    failures,
  }));
  if (failures.length) process.exitCode = 1;
}

void main().finally(() => database.$disconnect());
