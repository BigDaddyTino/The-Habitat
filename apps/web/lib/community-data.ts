import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

export async function getActivePoll(viewerUserId?: string) {
  return db.serverPoll.findFirst({
    where: { status: "ACTIVE", closesAt: { gt: new Date() } },
    include: {
      options: { include: { server: { select: { displayName: true, worldName: true } }, _count: { select: { votes: true } } }, orderBy: { position: "asc" } },
      votes: viewerUserId ? { where: { userId: viewerUserId }, select: { optionId: true } } : false,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingWakeRequest(serverId: string, viewerUserId?: string) {
  return db.wakeRequest.findFirst({
    where: { serverId, status: "PENDING" },
    include: { requester: { select: { name: true, displayName: true } }, _count: { select: { votes: true } }, votes: viewerUserId ? { where: { userId: viewerUserId }, select: { userId: true } } : false },
    orderBy: { requestedAt: "desc" },
  });
}
