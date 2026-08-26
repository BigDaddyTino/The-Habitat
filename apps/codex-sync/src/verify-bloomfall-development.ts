import path from "node:path";
import dotenv from "dotenv";
import { buildCodexSnapshot } from "./snapshot";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
if (process.env.HABITAT_ENVIRONMENT !== "development" || process.env.HABITAT_DEVELOPMENT_DATABASE !== "habitat_atlas_dev") throw new Error("Bloomfall Bundle V4 verification requires the guarded development environment.");
const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL is required.");
const target = new URL(sourceUrl);
target.pathname = "/habitat_atlas_dev";
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname.toLowerCase()) || target.pathname.slice(1) !== "habitat_atlas_dev") throw new Error("Bloomfall Bundle V4 verification requires loopback habitat_atlas_dev.");
process.env.DATABASE_URL = target.toString();

const requiredEntries = [
  "bloomfall-reach", "the-shattercore", "the-mutation-belt", "the-living-marsh", "southreach-complex", "blackbloom-exposure",
  "keira-ansel", "tomas-vey", "selene-ward", "mara-quill", "jaro-fen", "nalia-reed", "maintenance-unit-m-17",
  "the-bellwether", "switchmother", "old-drowner", "the-last-shift", "reserve-glass", "gridcore-alloy", "sinkroot-fiber", "blackweir-resin", "capacitor-tissue", "quietwater-culture",
] as const;
const requiredArcs = ["the-southreach-record", "reserve-twelve-contract", "the-purge-window", "the-bellwether-hunt", "root-of-the-bargain", "menders-work"] as const;

async function main() {
  const snapshot = await buildCodexSnapshot(new Date("2026-08-25T00:00:00.000Z"));
  const entrySlugs = new Set(snapshot.entries.map((entry) => entry.slug));
  const arcs = snapshot.arcs.filter((arc) => requiredArcs.includes(arc.slug as typeof requiredArcs[number]));
  const missingEntries = requiredEntries.filter((slug) => !entrySlugs.has(slug));
  const missingArcs = requiredArcs.filter((slug) => !arcs.some((arc) => arc.slug === slug));
  const bloomfallMap = snapshot.maps.find((map) => map.slug === "martino-bloomfall-reach");
  const foundationExported = snapshot.maps.some((map) => map.artVersion === "foundation");
  const bloomfallPlacements = snapshot.placements.filter((placement) => placement.mapSlug === "martino-bloomfall-reach");
  const nobodyCame = snapshot.nodes.filter((node) => requiredArcs.some((slug) => snapshot.arcs.find((arc) => arc.id === node.arcId)?.slug === slug) && node.key === "nobody-came").length;
  if (missingEntries.length || missingArcs.length || arcs.some((arc) => arc.isMainline || arc.regionSlug !== "bloomfall-reach") || nobodyCame !== requiredArcs.length || foundationExported || bloomfallMap?.artVersion !== "v1" || bloomfallPlacements.length !== 18) throw new Error(JSON.stringify({ missingEntries, missingArcs, invalidArcs: arcs.filter((arc) => arc.isMainline || arc.regionSlug !== "bloomfall-reach").map((arc) => arc.slug), nobodyCame, foundationExported, bloomfallMap: bloomfallMap?.artVersion, bloomfallPlacements: bloomfallPlacements.length }));
  process.stdout.write(`${JSON.stringify({ contract: snapshot.contract, contractVersion: snapshot.contractVersion, status: "PASS", database: "habitat_atlas_dev", bloomfallEntriesSampled: requiredEntries.length, bloomfallRegionalArcs: arcs.length, nobodyCameOutcomes: nobodyCame, exportedMaps: snapshot.maps.length, bloomfallMapArtVersion: bloomfallMap.artVersion, bloomfallPlacements: bloomfallPlacements.length, inactiveBloomfallFoundationExported: foundationExported }, null, 2)}\n`);
}

void main();
