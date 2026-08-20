"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { refusal } from "@/lib/writer-refusal";

const db = getPrismaClient();
const voteSchema = z.object({ pollId: z.string().uuid(), optionId: z.string().uuid() });

export async function votePoll(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = voteSchema.safeParse({ pollId: formData.get("pollId"), optionId: formData.get("optionId") });
  if (!parsed.success) throw refusal("Invalid poll vote.");
  await db.$transaction(async (transaction) => {
    const poll = await transaction.serverPoll.findUnique({ where: { id: parsed.data.pollId }, include: { options: { select: { id: true } } } });
    if (!poll || poll.status !== "ACTIVE" || poll.closesAt <= new Date() || !poll.options.some((option) => option.id === parsed.data.optionId)) throw refusal("This poll is no longer open.");
    await transaction.serverPollVote.upsert({ where: { pollId_userId: { pollId: poll.id, userId: user.id } }, create: { pollId: poll.id, userId: user.id, optionId: parsed.data.optionId }, update: { optionId: parsed.data.optionId } });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "SERVER_POLL_VOTED", entityType: "ServerPoll", entityId: poll.id, after: { optionId: parsed.data.optionId } } });
  });
  revalidatePath("/");
  revalidatePath("/polls");
}
