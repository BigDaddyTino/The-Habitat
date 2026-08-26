import "../lib/environment";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import {
  assertBloomfallProductionActivationTarget,
  captureBloomfallActivationSnapshot,
  classifyBloomfallActivationSnapshot,
} from "./lib/bloomfall-production-activation";

async function main() {
  const sourceUrl = process.env.BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL;
  const targetUrl = process.env.BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error("Explicit BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL and BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL are required.");
  const identity = assertBloomfallProductionActivationTarget(sourceUrl, targetUrl, process.env);
  const database = createPrismaClient(targetUrl);
  try {
    const snapshot = await captureBloomfallActivationSnapshot(database);
    process.stdout.write(stableAtlasJson({ action: "READ_ONLY_BASELINE", writes: 0, identity, state: classifyBloomfallActivationSnapshot(snapshot), snapshot }));
  } finally {
    await database.$disconnect();
  }
}

void main();
