import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { storyExportContractVersion } from "@habitat/shared";
import { buildStoryExport } from "../lib/story-export";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import { loadAtlasAuditSource } from "./lib/atlas-integrity-db";
import { renderReleaseAudit, runReleaseAudit } from "./lib/release-audit";

/**
 * Cuts a named, frozen, hash-locked release of canon.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/cut-story-release.ts \
 *     --name martino-2026.08.1 [--notes "..."] [--apply]
 *
 * The writers' room lands every save straight at CANON, which is the point of
 * it — and it meant everything downstream read a moving target. A release is
 * the boundary: the room goes on moving, and nothing outside it shifts until
 * somebody deliberately cuts.
 *
 * THIS IS THE STRICTEST GATE IN THE SYSTEM, and deliberately stricter than a
 * deploy. `deploy-web.ps1` runs the same audit honouring the waiver map,
 * because a bad deploy costs a website. A cut honours nothing: a release is
 * what the game imports and what an importer pins by hash, so a defect
 * somebody agreed to live with is not a defect that gets to travel.
 *
 * What it refuses to do:
 *   - cut while any release check fails
 *   - cut while any finding is only passing because of a waiver
 *   - cut a payload identical to the newest release (nothing changed)
 *   - cut a name that already exists (names are frozen identities)
 *
 * The row it writes cannot be updated or deleted — the database refuses both
 * (migration 20260828150000). A release is withdrawn by cutting a newer one.
 */
const db = getPrismaClient();

function argument(flag: string) {
  const at = process.argv.indexOf(flag);
  return at === -1 ? null : process.argv[at + 1] ?? null;
}

/**
 * The Atlas at cut time.
 *
 * Deliberately outside the export contract. Whether Atlas topology ships to
 * the game is an open question for the importer work, and a release should be
 * a complete record of canon regardless of what the wire format currently
 * carries — so it is captured, hashed, and not served.
 */
async function buildAtlasSnapshot() {
  const source = await loadAtlasAuditSource();
  return {
    capturedFor: "record-only",
    note: "Not part of the story export contract. Captured so a release is a complete picture of canon; whether Atlas topology ships is decided by the importer work.",
    maps: source.maps.map((map) => ({
      slug: map.slug,
      artVersion: map.artVersion,
      imageWidth: map.imageWidth,
      imageHeight: map.imageHeight,
      coordinateWidth: map.coordinateWidth,
      coordinateHeight: map.coordinateHeight,
      parent: map.parentSlug,
      owner: map.ownerEntrySlug,
      placements: map.placements.map((placement) => ({
        entrySlug: placement.entrySlug,
        geometryKind: placement.geometryKind,
        geometry: placement.geometry,
        labelX: placement.labelX,
        labelY: placement.labelY,
        priority: placement.priority,
      })),
      questPlacements: map.nodePlacements.map((placement) => ({
        geometryKind: placement.geometryKind,
        geometry: placement.geometry,
        labelX: placement.labelX,
        labelY: placement.labelY,
      })),
    })),
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const name = argument("--name");
  const notes = argument("--notes");
  if (!name) throw new Error(`A release needs a name: --name martino-2026.08.1`);
  if (!/^[a-z0-9]+(-[a-z0-9.]+)*$/.test(name) || name.length > 80) throw new Error(`"${name}" is not a valid release name (lowercase, dot/dash separated, 80 characters).`);

  const existing = await db.storyRelease.findUnique({ where: { name }, select: { cutAt: true } });
  if (existing) throw new Error(`Release "${name}" was already cut on ${existing.cutAt.toISOString()}. Release names are frozen identities; pick the next one.`);

  // --- the gate ---------------------------------------------------------

  console.log("Running the release audit in strict mode — no waivers are honoured for a cut.\n");
  const audit = await runReleaseAudit({ honourWaivers: false });
  console.log(renderReleaseAudit(audit, true));
  if (!audit.ok) {
    throw new Error("The release audit failed. Nothing was cut. A release is what the game imports — fix the findings above and cut again.");
  }
  if (audit.waived.length > 0) {
    throw new Error(`${audit.waived.length} finding(s) are only passing because of a waiver, and a cut honours none. Fix them properly and cut again.`);
  }

  // --- the payload ------------------------------------------------------

  const payload = await buildStoryExport();
  const payloadJson = stableAtlasJson(payload as unknown as Parameters<typeof stableAtlasJson>[0], false);

  // The hash is over CONTENT, not over the moment it was serialised.
  //
  // `generatedAt` is a timestamp and `revisionCursor` is a bookmark; both move
  // when nothing about the story has. Hashing them would make every cut
  // unique by construction, which quietly defeats two things at once: the
  // "canon is identical to the last release, there is nothing to cut" guard
  // below, and an importer's ability to notice that a new release does not
  // actually differ. Codex Sync's own content hash normalises exactly these
  // two fields for exactly this reason; this matches it deliberately.
  const contentJson = stableAtlasJson({ ...payload, generatedAt: "", revisionCursor: null } as unknown as Parameters<typeof stableAtlasJson>[0], false);
  const sha256 = atlasSha256(contentJson);
  const atlas = await buildAtlasSnapshot();
  const atlasJson = stableAtlasJson(atlas as unknown as Parameters<typeof stableAtlasJson>[0], false);

  const counts = {
    arcs: payload.arcs.length,
    scenes: payload.arcs.reduce((total, arc) => total + arc.nodes.length, 0),
    branches: payload.arcs.reduce((total, arc) => total + arc.nodes.reduce((inner, node) => inner + node.choices.length, 0), 0),
    bible: payload.bible.length,
    flags: payload.bible.filter((entry) => entry.kind === "FLAG").length,
    atlasScenes: atlas.maps.length,
  };

  const newest = await db.storyRelease.findFirst({ orderBy: { cutAt: "desc" }, select: { name: true, sha256: true, cutAt: true } });
  console.log(`\nrelease   ${name}`);
  console.log(`contract  v${storyExportContractVersion}`);
  console.log(`sha256    ${sha256}`);
  console.log(`bytes     ${payloadJson.length}`);
  console.log(`contents  ${counts.arcs} arcs, ${counts.scenes} scenes, ${counts.branches} branches, ${counts.bible} bible entries (${counts.flags} flags), ${counts.atlasScenes} atlas scenes`);
  console.log(`previous  ${newest ? `${newest.name} (${newest.sha256.slice(0, 12)}…)` : "none — this is the first cut"}`);

  if (newest?.sha256 === sha256) {
    throw new Error(`Canon is byte-identical to "${newest.name}". There is nothing to cut — a release that says the same thing as the last one is noise an importer has to diff to discover.`);
  }

  if (!apply) { console.log("\nDry run. Re-run with --apply to cut it."); return; }

  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Cutting a release requires an active administrator for authorship.");

  const release = await db.storyRelease.create({
    data: {
      name,
      notes,
      contractVersion: storyExportContractVersion,
      payload: payload as unknown as Prisma.InputJsonValue,
      sha256,
      bytes: payloadJson.length,
      atlas: atlas as unknown as Prisma.InputJsonValue,
      atlasSha256: atlasSha256(atlasJson),
      counts: counts as unknown as Prisma.InputJsonValue,
      audit: {
        strict: true,
        checks: audit.checks.map((entry) => ({ name: entry.name, notes: entry.notes })),
        waived: audit.waived,
      } as unknown as Prisma.InputJsonValue,
      cutByUserId: actor.id,
    },
    select: { id: true, name: true, cutAt: true },
  });

  console.log(`\nCut "${release.name}" at ${release.cutAt.toISOString()}.`);
  console.log("It is immutable — the database refuses UPDATE and DELETE on it. Withdraw it by cutting a newer one.");
}

main().then(() => db.$disconnect(), (error) => { console.error(`\n${(error as Error).message}`); return db.$disconnect().then(() => process.exit(1)); });
