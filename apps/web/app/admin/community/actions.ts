"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const resolveSchema = z.object({ wakeRequestId: z.string().uuid(), status: z.enum(["APPROVED", "REJECTED"]), resolutionNote: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(240).nullable()) });
const pollSchema = z.object({ question: z.string().trim().min(3).max(100), closesAt: z.string().datetime(), serverIds: z.array(z.string().uuid()).min(2).max(6).refine((values) => new Set(values).size === values.length) });

export async function resolveWakeRequest(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = resolveSchema.safeParse({ wakeRequestId: formData.get("wakeRequestId"), status: formData.get("status"), resolutionNote: formData.get("resolutionNote") });
  if (!parsed.success) throw new Error("Invalid wake-request decision.");
  await db.$transaction(async (transaction) => {
    const request = await transaction.wakeRequest.findUnique({ where: { id: parsed.data.wakeRequestId }, include: { server: { select: { id: true, gameType: true } } } });
    if (!request || request.status !== "PENDING") return;
    await transaction.wakeRequest.update({ where: { id: request.id }, data: { status: parsed.data.status, resolvedAt: new Date(), resolvedByUserId: admin.id, resolutionNote: parsed.data.resolutionNote } });
    if (parsed.data.status === "APPROVED") await transaction.serverEvent.create({ data: { serverId: request.server.id, gameType: request.server.gameType, eventType: "WAKE_APPROVED", occurredAt: new Date(), source: "HABITAT_ADMIN", sourceConfidence: 100, dedupeKey: `wake-approved:${request.id}` } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: `WAKE_REQUEST_${parsed.data.status}`, entityType: "WakeRequest", entityId: request.id, after: { resolutionNote: parsed.data.resolutionNote } } });
  });
  revalidatePath("/");
  revalidatePath("/admin/community");
}

export async function createServerPoll(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const closesAt = new Date(String(formData.get("closesAt")));
  if (Number.isNaN(closesAt.getTime())) throw new Error("Choose a valid poll close time.");
  const parsed = pollSchema.safeParse({ question: formData.get("question"), closesAt: closesAt.toISOString(), serverIds: formData.getAll("serverIds") });
  if (!parsed.success || new Date(parsed.data.closesAt) <= new Date()) throw new Error("Choose at least two worlds and a future close time.");
  await db.$transaction(async (transaction) => {
    await transaction.serverPoll.updateMany({ where: { status: "ACTIVE", closesAt: { lte: new Date() } }, data: { status: "CLOSED", closedAt: new Date() } });
    const existing = await transaction.serverPoll.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
    if (existing) throw new Error("Close the current poll before opening another.");
    const servers = await transaction.gameServer.findMany({ where: { id: { in: parsed.data.serverIds }, enabled: true }, select: { id: true } });
    if (servers.length !== parsed.data.serverIds.length) throw new Error("One or more selected worlds are unavailable.");
    const poll = await transaction.serverPoll.create({ data: { question: parsed.data.question, closesAt: new Date(parsed.data.closesAt), createdByUserId: admin.id, options: { create: parsed.data.serverIds.map((serverId, position) => ({ serverId, position })) } } });
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "SERVER_POLL_CREATED", entityType: "ServerPoll", entityId: poll.id, after: { question: poll.question, closesAt: poll.closesAt, optionCount: parsed.data.serverIds.length } } });
  });
  revalidatePath("/");
  revalidatePath("/polls");
  revalidatePath("/admin/community");
}

export async function closeServerPoll(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const pollId = z.string().uuid().safeParse(formData.get("pollId"));
  if (!pollId.success) throw new Error("Invalid poll.");
  const result = await db.serverPoll.updateMany({ where: { id: pollId.data, status: "ACTIVE" }, data: { status: "CLOSED", closedAt: new Date() } });
  if (result.count === 1) await db.auditLog.create({ data: { actorUserId: admin.id, action: "SERVER_POLL_CLOSED", entityType: "ServerPoll", entityId: pollId.data } });
  revalidatePath("/");
  revalidatePath("/polls");
  revalidatePath("/admin/community");
}
