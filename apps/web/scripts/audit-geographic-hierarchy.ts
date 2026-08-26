import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget } from "./lib/atlas-v2-activation";
import { auditGeographicHierarchy, type GeographicEntry } from "./lib/geographic-hierarchy";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  const productionUrl = process.env.DATABASE_URL;
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const targetName = process.argv.includes("--production") ? "production" : "development";
  const url = targetName === "production" ? productionUrl : resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!url) throw new Error("Geographic hierarchy audit target URL is unavailable.");
  const identity = new URL(url);
  if (targetName === "development") assertAtlasPersistentDevelopmentTarget(url);
  else if (!["localhost", "127.0.0.1", "::1"].includes(identity.hostname.toLowerCase()) || identity.pathname.slice(1) !== "habitat") throw new Error("Production comparison is restricted to the loopback canonical habitat database.");
  const db = createPrismaClient(url);
  try {
    const rows = await db.storyEntry.findMany({ where: { kind: "REGION", status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, orderBy: { slug: "asc" }, include: { mapPlacements: { include: { map: { select: { slug: true } } } }, ownedMap: { include: { parent: { select: { slug: true } } } } } });
    const entries: GeographicEntry[] = rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, kind: row.kind, status: row.status, meta: row.meta, placements: row.mapPlacements.map((placement) => ({ mapSlug: placement.map.slug, geometryKind: placement.geometryKind })), ownedMap: row.ownedMap ? { slug: row.ownedMap.slug, parentSlug: row.ownedMap.parent?.slug ?? null } : null }));
    const audit = auditGeographicHierarchy(entries);
    const payload = { contract: "martino-global-geographic-hierarchy-audit", contractVersion: 1, target: targetName, database: identity.pathname.slice(1), geographicEntriesAudited: entries.length, ...audit };
    const report = { ...payload, logicalSha256: atlasSha256(stableAtlasJson(payload, false)) };
    if (process.argv.includes("--write")) {
      const directory = path.join(root, "Docs", "geographic-hierarchy");
      const developmentName = process.argv.includes("--after") ? "development-after.json" : "development-before.json";
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, targetName === "production" ? "production-comparison.json" : developmentName), stableAtlasJson(report), "utf8");
    }
    process.stdout.write(stableAtlasJson(report));
  } finally { await db.$disconnect(); }
}
void main();
