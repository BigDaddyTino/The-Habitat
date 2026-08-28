import "../lib/environment";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { atlasCoordinateWidth, deriveAtlasCoordinateDimensions } from "@habitat/shared";
import { resolveStoryAtlasArt } from "../lib/story-atlas-art";

/**
 * Recalibrates the Port Arcadia Atlas scene against its actual artwork.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/recalibrate-port-arcadia.ts [--apply]
 *
 * The scene's row declared 1536x1024 while the file on disk decodes 1599x984,
 * and the atlas integrity audit has reported it as RECALIBRATION_REQUIRED for
 * months. It was the one standing waiver in the release audit, and under the
 * release-canon rules a waiver does not travel — so it would have blocked the
 * first release cut.
 *
 * WHY IT IS NOT A NUMBER CHANGE. The coordinate space is derived from the
 * artwork: width is the fixed `atlasCoordinateWidth`, and height is
 * `round(width * artHeight / artWidth)`. A declared 1536x1024 gives 66667,
 * which is what the row holds. The real 1599x984 gives 61538. So the scene's
 * coordinate box is about 8% taller than the picture it is drawn from, the
 * artwork is being stretched vertically to fill it, and every placement was
 * authored against that stretched image.
 *
 * Correcting only the declaration would leave every Y in a space that no
 * longer exists — and `waterfront-district` already reaches 64128, which falls
 * outside the corrected 61538 extent entirely.
 *
 * WHAT IT DOES. Fixes the declaration and rescales every Y by
 * newHeight/oldHeight, which preserves each feature's position as a FRACTION
 * of the image. A pin 96.2% of the way down the stretched box is still 96.2%
 * of the way down the unstretched one, so nothing moves relative to the art —
 * the art simply stops being stretched. X is untouched: coordinate width is
 * constant, so the horizontal mapping was never wrong.
 *
 * Idempotent, preview by default, and it refuses to write if the numbers do
 * not check out.
 *
 * WHAT THIS DELIBERATELY DOES NOT TOUCH, and why.
 *
 * `Docs/atlas-migration-rehearsal/atlas-v2-topology-manifest.json` records
 * `portArcadia: RECALIBRATION_REQUIRED`, and its sha256 is locked in
 * `atlasV2ArtifactHashes.topologyManifest`. That file is a frozen record of a
 * rehearsal that ran on a particular day, and on that day the statement was
 * true. Editing it — or editing the generator in atlas-canonical-topology.ts
 * that reproduces it — would rewrite an accurate historical artifact and break
 * the lock the next time anybody regenerates. Both are left exactly as they
 * are.
 *
 * FOLLOW-UP for whoever picks up the Atlas V2 migration: seven Port Arcadia
 * areas are marked `PORT_ARCADIA_RECALIBRATION` in atlas-migration-rehearsal.ts
 * with the rationale "Area tracing is blocked by the decoded/declared artwork
 * aspect-ratio mismatch." That blocker is now cleared. The dispositions are
 * hardcoded planning data rather than a live check, so they will not update
 * themselves — a future rehearsal pass can trace those areas.
 */
const db = getPrismaClient();
const MAP = "martino-port-arcadia";

/** Reads the dimensions off the actual file rather than trusting any record. */
function decodePng(file: string) {
  const bytes = readFileSync(file);
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") throw new Error(`${file} is not a PNG.`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** Scales every Y in a GeoJSON-ish coordinate tree, leaving X alone. */
function scaleGeometry(value: unknown, factor: number): unknown {
  if (!Array.isArray(value)) return value;
  if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return [value[0], Math.round(value[1] * factor)];
  }
  return value.map((item) => scaleGeometry(item, factor));
}

async function main() {
  const apply = process.argv.includes("--apply");

  const map = await db.storyMap.findUnique({
    where: { slug: MAP },
    select: { id: true, title: true, artVersion: true, imageWidth: true, imageHeight: true, coordinateWidth: true, coordinateHeight: true },
  });
  if (!map) throw new Error(`No Atlas scene "${MAP}".`);

  const file = resolveStoryAtlasArt(MAP, `${map.artVersion}.png`);
  if (!file || !existsSync(file)) throw new Error(`Registered artwork for ${MAP}:${map.artVersion} is not on disk.`);
  const art = decodePng(file);

  const derived = deriveAtlasCoordinateDimensions(art);
  if (!derived.ok) throw new Error(`Cannot derive a coordinate space from ${art.width}x${art.height}: ${derived.issue}`);
  const target = derived.value;

  console.log(`scene       ${MAP} (${map.artVersion})`);
  console.log(`artwork     ${path.basename(file)} decodes ${art.width}x${art.height}`);
  console.log(`declared    ${map.imageWidth}x${map.imageHeight}, coordinate space ${map.coordinateWidth}x${map.coordinateHeight}`);
  console.log(`correct     ${art.width}x${art.height}, coordinate space ${target.width}x${target.height}`);

  if (map.imageWidth === art.width && map.imageHeight === art.height && map.coordinateHeight === target.height) {
    console.log("\nAlready recalibrated. Nothing to do.");
    return;
  }
  if (map.coordinateWidth !== atlasCoordinateWidth) throw new Error(`Coordinate width is ${map.coordinateWidth}, expected the fixed ${atlasCoordinateWidth}. Refusing to guess.`);

  const factor = target.height / map.coordinateHeight;
  console.log(`\nY scale     ${map.coordinateHeight} -> ${target.height}  (x${factor.toFixed(9)})`);

  const [places, quests] = await Promise.all([
    db.storyMapPlacement.findMany({ where: { mapId: map.id }, select: { id: true, geometry: true, labelY: true, entry: { select: { slug: true } } } }),
    db.storyMapNodePlacement.findMany({ where: { mapId: map.id }, select: { id: true, geometry: true, labelY: true, node: { select: { key: true } } } }),
  ]);
  const rings = await db.storyMapAreaRing.count({ where: { placement: { mapId: map.id } } });
  if (rings > 0) throw new Error(`${rings} area rings hang off this scene and this script does not rescale them. Extend it before running.`);

  const maxY = (geometry: unknown): number => {
    let highest = 0;
    const walk = (value: unknown) => {
      if (!Array.isArray(value)) return;
      if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") { highest = Math.max(highest, value[1]); return; }
      value.forEach(walk);
    };
    walk((geometry as { coordinates?: unknown }).coordinates);
    return highest;
  };

  const placeWork = places.map((row) => ({
    id: row.id, label: `place ${row.entry.slug}`,
    geometry: { ...(row.geometry as object), coordinates: scaleGeometry((row.geometry as { coordinates: unknown }).coordinates, factor) },
    labelY: row.labelY === null ? null : Math.round(row.labelY * factor),
    before: maxY(row.geometry),
  }));
  const questWork = quests.map((row) => ({
    id: row.id, label: `quest ${row.node.key}`,
    geometry: { ...(row.geometry as object), coordinates: scaleGeometry((row.geometry as { coordinates: unknown }).coordinates, factor) },
    labelY: row.labelY === null ? null : Math.round(row.labelY * factor),
    before: maxY(row.geometry),
  }));

  console.log(`\nplacements  ${places.length} places, ${quests.length} quest anchors, ${rings} area rings`);
  for (const item of [...placeWork, ...questWork]) {
    const after = maxY(item.geometry);
    console.log(`  ${item.label.padEnd(44)} maxY ${String(item.before).padStart(5)} -> ${String(after).padStart(5)}`);
    // The whole point of rescaling: nothing may end up outside the new extent.
    if (after > target.height) throw new Error(`${item.label} would sit at Y=${after}, outside the corrected extent ${target.height}.`);
  }

  if (!apply) { console.log("\nDry run. Re-run with --apply to write it."); return; }

  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Recalibration requires an active administrator for revision authorship.");

  await db.$transaction(async (tx) => {
    for (const item of [...placeWork]) {
      await tx.storyMapPlacement.update({ where: { id: item.id }, data: { geometry: item.geometry as Prisma.InputJsonValue, labelY: item.labelY, updatedByUserId: actor.id, version: { increment: 1 } } });
    }
    for (const item of questWork) {
      await tx.storyMapNodePlacement.update({ where: { id: item.id }, data: { geometry: item.geometry as Prisma.InputJsonValue, labelY: item.labelY, updatedByUserId: actor.id, version: { increment: 1 } } });
    }
    await tx.storyMap.update({
      where: { id: map.id },
      data: { imageWidth: art.width, imageHeight: art.height, coordinateHeight: target.height, updatedByUserId: actor.id, version: { increment: 1 } },
    });
    await tx.storyRevision.create({
      data: {
        id: randomUUID(), entityType: "MAP", entityId: map.id, action: "UPDATED", actorUserId: actor.id,
        summary: `Recalibrated ${MAP} to its real artwork: declared ${map.imageWidth}x${map.imageHeight} -> ${art.width}x${art.height}, coordinate height ${map.coordinateHeight} -> ${target.height}, ${places.length + quests.length} placements rescaled on Y`,
        before: { imageWidth: map.imageWidth, imageHeight: map.imageHeight, coordinateHeight: map.coordinateHeight },
        after: { imageWidth: art.width, imageHeight: art.height, coordinateHeight: target.height },
      },
    });
  }, { isolationLevel: "Serializable", timeout: 30_000 });

  console.log(`\nApplied. ${places.length + quests.length} placements rescaled; the scene now declares what it draws.`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
