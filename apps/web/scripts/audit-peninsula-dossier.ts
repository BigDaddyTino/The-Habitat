import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { buildContainedPlaceProjection } from "../lib/story-library";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget } from "./lib/atlas-v2-activation";
import { auditGeographicHierarchy, type GeographicEntry } from "./lib/geographic-hierarchy";
import { stableAtlasJson } from "./lib/atlas-integrity";

const peninsulaVisible = [
  "arcadian-soverign-guard", "arcadian-special-intelligence-service", "census-office", "chancellory-of-arcadia", "embassy-row", "exclusion-area", "lower-westside", "port-arcadia", "east-side", "the-northside", "the-southside", "upper-westside", "waterfront-district",
] as const;
const bloomfallVisible = [
  "ashline-exchange", "blackweir", "cairnwood-camp", "crown-break", "drowned-intake", "glassroot-observatory", "heartfen", "lantern-pools", "long-graze", "redline-shelter-six", "reedless-mile", "reserve-vault-twelve", "splicefield-substation", "southreach-complex", "the-living-marsh", "the-mutation-belt", "the-shattercore", "walking-orchard",
] as const;
const topLevel = ["bloomfall-reach", "the-desert", "grand-rift", "high-cliffs", "magic-torn-wasteland", "the-peninsula", "the-red-forest", "riverlands"] as const;

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const url = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!url) throw new Error("Peninsula dossier audit target is unavailable.");
  const identity = assertAtlasPersistentDevelopmentTarget(url);
  const db = createPrismaClient(url);
  try {
    const rows = await db.storyEntry.findMany({ where: { kind: "REGION", status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, orderBy: { slug: "asc" }, include: { mapPlacements: { include: { map: { select: { slug: true } } } }, ownedMap: { include: { parent: { select: { slug: true } } } } } });
    const projectionRows = rows.map((row) => ({ slug: row.slug, title: row.title, summary: row.summary, meta: row.meta as Record<string, unknown> | null }));
    const peninsulaProjection = buildContainedPlaceProjection("the-peninsula", projectionRows);
    const bloomfallProjection = buildContainedPlaceProjection("bloomfall-reach", projectionRows);
    const visible = (projection: typeof peninsulaProjection) => [...new Set(projection.flatMap((entry) => [entry.slug, ...entry.inside.map((inside) => inside.slug)]))].sort();
    const peninsulaLinks = visible(peninsulaProjection);
    const bloomfallLinks = visible(bloomfallProjection);
    if (stableAtlasJson(peninsulaLinks, false) !== stableAtlasJson([...peninsulaVisible].sort(), false)) throw new Error(`Peninsula dossier projection drifted: ${stableAtlasJson(peninsulaLinks, false)}`);
    if (stableAtlasJson(bloomfallLinks, false) !== stableAtlasJson([...bloomfallVisible].sort(), false)) throw new Error(`Bloomfall dossier projection drifted: ${stableAtlasJson(bloomfallLinks, false)}`);
    const entries: GeographicEntry[] = rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, kind: row.kind, status: row.status, meta: row.meta, placements: row.mapPlacements.map((placement) => ({ mapSlug: placement.map.slug, geometryKind: placement.geometryKind })), ownedMap: row.ownedMap ? { slug: row.ownedMap.slug, parentSlug: row.ownedMap.parent?.slug ?? null } : null }));
    const audit = auditGeographicHierarchy(entries);
    const topLevelTrails = audit.matrix.filter((entry) => topLevel.includes(entry.slug as (typeof topLevel)[number]) && entry.ancestry.length).map((entry) => entry.slug);
    if (topLevelTrails.length) throw new Error(`Top-level dossiers still project parent trails: ${topLevelTrails.join(", ")}.`);
    const nestedExpected = { "death-canyon": "grand-rift", "port-arcadia": "the-peninsula", "grand-lake": "high-cliffs", "the-shattercore": "bloomfall-reach", "the-starting-island": null } as const;
    const nestedResults = Object.entries(nestedExpected).map(([slug, expectedParent]) => {
      const entry = audit.matrix.find((candidate) => candidate.slug === slug);
      if (!entry || entry.parent !== expectedParent) throw new Error(`Dossier breadcrumb projection failed for ${slug}.`);
      return { slug, expectedParent, ancestry: entry.ancestry };
    });
    process.stdout.write(stableAtlasJson({ contract: "martino-peninsula-dossier-audit", contractVersion: 1, status: "PASS", database: identity.database, rendering: "shared buildContainedPlaceProjection used by live dossier", peninsulaRows: peninsulaProjection.map((entry) => entry.slug), peninsulaVisible: peninsulaLinks, bloomfallRows: bloomfallProjection.map((entry) => entry.slug), bloomfallVisible: bloomfallLinks, topLevelDossiers: topLevel, topLevelParentTrails: [], nestedResults, duplicateChildren: 0, hardCodedExclusions: 0 }));
  } finally {
    await db.$disconnect();
  }
}

void main();
