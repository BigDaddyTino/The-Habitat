import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget } from "./lib/atlas-v2-activation";
import { activateBloomfallLocalAtlas, verifyBloomfallLocalAtlas } from "./lib/bloomfall-local-atlas-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { verifyBloomfallLocalAtlasArtFiles } from "./lib/bloomfall-local-atlas";

async function main() {
 const root = path.resolve(process.cwd(), "..", "..");
 dotenv.config({ path: path.join(root, ".env"), quiet: true });
 dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
 const url = resolveAtlasDevelopmentDatabaseUrl(process.env);
 if (!url) throw new Error("Bloomfall local Atlas requires the guarded development database.");
 assertAtlasPersistentDevelopmentTarget(url);
 await verifyBloomfallLocalAtlasArtFiles();
 const db = createPrismaClient(url);
 try { const result = process.argv.includes("--verify") ? await verifyBloomfallLocalAtlas(db) : await activateBloomfallLocalAtlas(db); process.stdout.write(stableAtlasJson(result)); }
 finally { await db.$disconnect(); }
}
void main();
