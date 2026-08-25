"use server";

import "@/lib/environment";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { atlasConnectionDirectionalities, atlasConnectionStatuses, atlasConnectionVisibilityPolicies, atlasWorldConnectionTypes, type AtlasMapConnectionPath } from "@habitat/shared";
import { assertAtlasAuthoringEnvironment } from "@/lib/atlas-authoring";
import { requireRole } from "@/lib/authorization";
import { AtlasPersistenceError, atlasPersistence } from "@/lib/atlas-persistence";
import { refusal } from "@/lib/writer-refusal";

export type AtlasAuthorActionState = { status: "IDLE" | "SAVED" | "ERROR" | "CONFLICT"; message: string };

const uuid = z.string().uuid();
const integer = z.coerce.number().int().safe();
const finite = z.coerce.number().finite();
const optionalFinite = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().finite().nullable());

function jsonField(value: FormDataEntryValue | null) {
  if (typeof value !== "string") throw refusal("Required JSON input is missing.");
  return JSON.parse(value) as unknown;
}

function stateFor(error: unknown): AtlasAuthorActionState {
  if (error instanceof AtlasPersistenceError) return { status: error.code === "STALE_VERSION" ? "CONFLICT" : "ERROR", message: error.message };
  return { status: "ERROR", message: error instanceof Error ? error.message : "Atlas authoring failed." };
}

async function actor() {
  const user = await requireRole("ADMIN");
  assertAtlasAuthoringEnvironment();
  return user;
}

function refresh() {
  revalidatePath("/admin/story/atlas");
  revalidatePath("/codex/map");
}

export async function moveAtlasNode(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try {
    const user = await actor();
    await atlasPersistence.updateTopologyNode({ id: uuid.parse(formData.get("id")), mapId: uuid.parse(formData.get("mapId")), x: integer.parse(formData.get("x")), y: integer.parse(formData.get("y")), expectedVersion: integer.parse(formData.get("expectedVersion")), actorUserId: user.id });
    refresh(); return { status: "SAVED", message: "Shared topology node saved and all affected regions validated." };
  } catch (error) { return stateFor(error); }
}

export async function updateAtlasBoundary(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try {
    const user = await actor();
    const vertices = z.array(z.tuple([z.number().int(), z.number().int()])).parse(jsonField(formData.get("interiorVertices")));
    await atlasPersistence.updateBoundary({ id: uuid.parse(formData.get("id")), mapId: uuid.parse(formData.get("mapId")), startNodeId: uuid.parse(formData.get("startNodeId")), endNodeId: uuid.parse(formData.get("endNodeId")), kind: z.enum(["COAST", "INTERNAL_BORDER", "WATER_BOUNDARY", "OPEN_BOUNDARY"]).parse(formData.get("kind")), interiorVertices: vertices, expectedVersion: integer.parse(formData.get("expectedVersion")), actorUserId: user.id });
    refresh(); return { status: "SAVED", message: "Shared boundary saved transactionally." };
  } catch (error) { return stateFor(error); }
}

export async function splitAtlasBoundary(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); await atlasPersistence.splitBoundaryAtInteriorVertex({ id: uuid.parse(formData.get("id")), expectedVersion: integer.parse(formData.get("expectedVersion")), interiorVertexIndex: integer.parse(formData.get("interiorVertexIndex")), actorUserId: user.id }); refresh(); return { status: "SAVED", message: "Boundary split transactionally; all consuming area rings now reference the two interlocking edges." }; } catch (error) { return stateFor(error); }
}

function pointFields(formData: FormData) {
  return { mapId: uuid.parse(formData.get("mapId")), entryId: uuid.parse(formData.get("entryId")), x: integer.parse(formData.get("x")), y: integer.parse(formData.get("y")), labelX: optionalFinite.parse(formData.get("labelX")), labelY: optionalFinite.parse(formData.get("labelY")), minZoom: finite.parse(formData.get("minZoom")), maxZoom: optionalFinite.parse(formData.get("maxZoom")), priority: integer.parse(formData.get("priority")) };
}

export async function createAtlasPointPlacement(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); const fields = pointFields(formData); await atlasPersistence.createPointPlacement({ ...fields, labelX: fields.labelX === null ? null : integer.parse(formData.get("labelX")), labelY: fields.labelY === null ? null : integer.parse(formData.get("labelY")), actorUserId: user.id }); refresh(); return { status: "SAVED", message: "Canonical Codex location placed." }; } catch (error) { return stateFor(error); }
}

export async function updateAtlasPointPlacement(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); const fields = pointFields(formData); await atlasPersistence.updatePointPlacement({ ...fields, labelX: fields.labelX === null ? null : integer.parse(formData.get("labelX")), labelY: fields.labelY === null ? null : integer.parse(formData.get("labelY")), id: uuid.parse(formData.get("id")), expectedVersion: integer.parse(formData.get("expectedVersion")), actorUserId: user.id }); refresh(); return { status: "SAVED", message: "POI position and label presentation saved." }; } catch (error) { return stateFor(error); }
}

export async function unplaceAtlasPoint(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); await atlasPersistence.deletePointPlacement(uuid.parse(formData.get("id")), integer.parse(formData.get("expectedVersion")), user.id); refresh(); return { status: "SAVED", message: "Placement removed; the Codex entry was preserved." }; } catch (error) { return stateFor(error); }
}

function connectionFields(formData: FormData) {
  return { fromEntryId: uuid.parse(formData.get("fromEntryId")), toEntryId: uuid.parse(formData.get("toEntryId")), type: z.enum(atlasWorldConnectionTypes).parse(formData.get("type")), directionality: z.enum(atlasConnectionDirectionalities).parse(formData.get("directionality")), status: z.enum(atlasConnectionStatuses).parse(formData.get("status")), visibility: z.enum(atlasConnectionVisibilityPolicies).parse(formData.get("visibility")), originalWording: z.string().trim().max(2000).nullable().parse(formData.get("originalWording") || null), editorialNotes: z.string().trim().max(2000).nullable().parse(formData.get("editorialNotes") || null), metadata: {} };
}

export async function createAtlasConnection(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try {
    const user = await actor();
    await atlasPersistence.createWorldConnection({ ...connectionFields(formData), actorUserId: user.id });
    refresh(); return { status: "SAVED", message: "Semantic world connection created without inventing path geometry." };
  } catch (error) { return stateFor(error); }
}

export async function updateAtlasConnection(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); await atlasPersistence.updateWorldConnection({ ...connectionFields(formData), id: uuid.parse(formData.get("id")), expectedVersion: integer.parse(formData.get("expectedVersion")), actorUserId: user.id }); refresh(); return { status: "SAVED", message: "Semantic world connection updated." }; } catch (error) { return stateFor(error); }
}

export async function deleteAtlasConnection(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); z.literal("DELETE WORLD CONNECTION").parse(formData.get("confirmation")); await atlasPersistence.deleteWorldConnection(uuid.parse(formData.get("id")), integer.parse(formData.get("expectedVersion")), user.id); refresh(); return { status: "SAVED", message: "Unused semantic world connection deleted." }; } catch (error) { return stateFor(error); }
}

export async function saveAtlasConnectionPath(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try {
    const user = await actor(); const geometry = z.union([z.object({ type: z.literal("LINESTRING"), coordinates: z.array(z.tuple([z.number().int(), z.number().int()])).min(2) }), z.object({ type: z.literal("MULTILINESTRING"), coordinates: z.array(z.array(z.tuple([z.number().int(), z.number().int()])).min(2)).min(1) })]).parse(jsonField(formData.get("geometry"))) as unknown as AtlasMapConnectionPath["geometry"];
    const common = { connectionId: uuid.parse(formData.get("connectionId")), mapId: uuid.parse(formData.get("mapId")), geometry, minZoom: finite.parse(formData.get("minZoom")), maxZoom: optionalFinite.parse(formData.get("maxZoom")), priority: integer.parse(formData.get("priority")), actorUserId: user.id };
    const id = formData.get("id");
    if (typeof id === "string" && id) await atlasPersistence.updateConnectionPath({ ...common, id: uuid.parse(id), expectedVersion: integer.parse(formData.get("expectedVersion")) });
    else await atlasPersistence.createConnectionPath(common);
    refresh(); return { status: "SAVED", message: "Scene connection path saved and validated." };
  } catch (error) { return stateFor(error); }
}

export async function removeAtlasConnectionPath(_previous: AtlasAuthorActionState, formData: FormData): Promise<AtlasAuthorActionState> {
  try { const user = await actor(); await atlasPersistence.deleteConnectionPath(uuid.parse(formData.get("id")), integer.parse(formData.get("expectedVersion")), user.id); refresh(); return { status: "SAVED", message: "Path removed from this scene; semantic connection preserved." }; } catch (error) { return stateFor(error); }
}
