import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget } from "./lib/atlas-v2-activation";
import { activateBloomfallLocalAtlas } from "./lib/bloomfall-local-atlas-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { verifyBloomfallLocalAtlasArtFiles } from "./lib/bloomfall-local-atlas";

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const sourceUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!sourceUrl) throw new Error("Bloomfall rehearsal requires the guarded development database.");
  assertAtlasPersistentDevelopmentTarget(sourceUrl);
  await verifyBloomfallLocalAtlasArtFiles();
  const source = new URL(sourceUrl);
  const rehearsalName = `habitat_atlas_p5_rehearsal_${Date.now()}`;
  if (!/^habitat_atlas_p5_rehearsal_[0-9]+$/.test(rehearsalName)) throw new Error("Unsafe rehearsal database identifier.");
  const adminUrl = new URL(source); adminUrl.pathname = "/postgres";
  const rehearsalUrl = new URL(source); rehearsalUrl.pathname = `/${rehearsalName}`;
  const admin = createPrismaClient(adminUrl.toString());
  let clone: ReturnType<typeof createPrismaClient> | null = null;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${rehearsalName}" TEMPLATE "habitat_atlas_dev"`);
    clone = createPrismaClient(rehearsalUrl.toString());
    const first = await activateBloomfallLocalAtlas(clone);
    const second = await activateBloomfallLocalAtlas(clone);
    if (first.status !== "APPLIED" || second.status !== "ALREADY_APPLIED") throw new Error("Rehearsal did not prove apply-then-no-op idempotence.");
    process.stdout.write(stableAtlasJson({ contract: "martino-bloomfall-local-atlas-rehearsal", contractVersion: 1, status: "PASS", disposableDatabase: rehearsalName, firstRun: first.status, secondRun: second.status, counts: second.counts, manifestSha256: second.manifestSha256, productionWrites: 0 }));
  } finally {
    if (clone) await clone.$disconnect();
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${rehearsalName}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}
void main();
