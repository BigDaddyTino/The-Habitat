import { createHash } from "node:crypto";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import {
  bloomfallV3CodexAssets,
  bloomfallV3Package,
  bloomfallV3PublicationMarker,
  bloomfallV3Published,
  bloomfallV3Version,
} from "../../lib/bloomfall-v3-art";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";

type Database = ReturnType<typeof createPrismaClient>;

function stableUuid(key: string) {
  const source = createHash("sha256").update(`martino:bloomfall-v3-publication:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "5";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function verifyBloomfallV3Publication(database: Database) {
  const [maps, entries] = await Promise.all([
    database.storyMap.findMany({ where: { slug: { in: ["martino-world", "martino-bloomfall-reach"] } }, orderBy: { slug: "asc" }, select: { id: true, slug: true, artVersion: true } }),
    database.storyEntry.findMany({ where: { slug: { in: bloomfallV3CodexAssets.map((asset) => asset.entrySlug) } }, orderBy: { slug: "asc" }, select: { id: true, slug: true, meta: true } }),
  ]);
  if (maps.length !== 2 || maps.some((map) => map.artVersion !== bloomfallV3Version)) throw new Error("Bloomfall V3 publication requires both registered Atlas scenes to select v3.");
  if (entries.length !== bloomfallV3CodexAssets.length) throw new Error(`Bloomfall V3 publication requires ${bloomfallV3CodexAssets.length} canonical Codex entries.`);
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const bindings = bloomfallV3CodexAssets.map((asset) => {
    const entry = bySlug.get(asset.entrySlug);
    if (!entry || !bloomfallV3Published(entry.meta, asset)) throw new Error(`Bloomfall V3 publication marker differs for ${asset.entrySlug}.`);
    return { entryId: entry.id, entrySlug: entry.slug, assetId: asset.id, sha256: asset.sha256 };
  });
  const value = { package: bloomfallV3Package, version: bloomfallV3Version, maps, bindings };
  return { ...value, counts: { atlas: maps.length, codex: bindings.length, total: maps.length + bindings.length }, logicalSha256: atlasSha256(stableAtlasJson(value, false)) };
}

export async function assessBloomfallV3Publication(database: Database) {
  const [maps, entries] = await Promise.all([
    database.storyMap.findMany({ where: { slug: { in: ["martino-world", "martino-bloomfall-reach"] } }, orderBy: { slug: "asc" }, select: { id: true, slug: true, artVersion: true } }),
    database.storyEntry.findMany({ where: { slug: { in: bloomfallV3CodexAssets.map((asset) => asset.entrySlug) } }, orderBy: { slug: "asc" }, select: { id: true, slug: true, meta: true } }),
  ]);
  if (maps.length !== 2 || entries.length !== bloomfallV3CodexAssets.length) throw new Error("Bloomfall V3 publication baseline is incomplete.");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const selected = maps.filter((map) => map.artVersion === bloomfallV3Version).length + bloomfallV3CodexAssets.filter((asset) => bloomfallV3Published(bySlug.get(asset.entrySlug)?.meta, asset)).length;
  if (selected === 15) return { status: "ALREADY_APPLIED" as const, mutations: 0, maps, entries };
  if (selected !== 0) throw new Error(`Bloomfall V3 publication is partial (${selected}/15); conflicting activation refused.`);
  const world = maps.find((map) => map.slug === "martino-world");
  const local = maps.find((map) => map.slug === "martino-bloomfall-reach");
  if (!world || !["v1", "v2"].includes(world.artVersion)) throw new Error("World Atlas publication baseline must select v1 or v2.");
  if (!local || local.artVersion !== "v1") throw new Error("Bloomfall local Atlas publication baseline must be the fully activated v1 geometry state.");
  for (const asset of bloomfallV3CodexAssets) {
    const marker = record(bySlug.get(asset.entrySlug)?.meta).visualArt;
    if (marker !== undefined) throw new Error(`Existing visual-art publication conflicts for ${asset.entrySlug}.`);
  }
  return { status: "READY" as const, mutations: 15, maps, entries };
}

export async function publishBloomfallV3(database: Database, options: { dryRun?: boolean } = {}) {
  const assessment = await assessBloomfallV3Publication(database);
  if (assessment.status === "ALREADY_APPLIED") return { status: "ALREADY_APPLIED" as const, mutations: 0, ...(await verifyBloomfallV3Publication(database)) };
  if (options.dryRun) return { status: "PREVIEW" as const, mutations: 15, selected: { v1: 0, v2: 0, v3: 15 }, atlas: 2, codex: 13 };
  const actor = await database.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Bloomfall V3 publication requires an active administrator for audit authorship.");
  await database.$transaction(async (tx) => {
    const inside = await assessBloomfallV3Publication(tx as Database);
    if (inside.status !== "READY") throw new Error("Bloomfall V3 publication state changed before the transaction acquired it.");
    for (const map of inside.maps) {
      await tx.storyMap.update({ where: { id: map.id }, data: { artVersion: bloomfallV3Version, version: { increment: 1 }, updatedByUserId: actor.id } });
      await tx.storyRevision.create({ data: { id: stableUuid(`map:${map.slug}`), entityType: "MAP", entityId: map.id, action: "UPDATED", actorUserId: actor.id, summary: `Published owner-approved Bloomfall V3 Atlas art for ${map.slug}`, before: { artVersion: map.artVersion }, after: { artVersion: bloomfallV3Version, package: bloomfallV3Package } } });
    }
    const entryBySlug = new Map(inside.entries.map((entry) => [entry.slug, entry]));
    for (const asset of bloomfallV3CodexAssets) {
      const entry = entryBySlug.get(asset.entrySlug)!;
      const marker = bloomfallV3PublicationMarker(asset);
      await tx.storyEntry.update({ where: { id: entry.id }, data: { meta: { ...record(entry.meta), visualArt: marker } as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
      await tx.storyRevision.create({ data: { id: stableUuid(`entry:${entry.slug}`), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: `Published owner-approved Bloomfall V3 key art for ${entry.slug}`, before: { visualArt: null }, after: { visualArt: marker } } });
    }
  }, { isolationLevel: "Serializable", timeout: 30_000 });
  return { status: "ACTIVATED" as const, mutations: 15, actorUserId: actor.id, ...(await verifyBloomfallV3Publication(database)) };
}
