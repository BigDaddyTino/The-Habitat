"use server";

import { getPrismaClient } from "@habitat/db/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const invitationSchema = z.string().trim().toLowerCase().email().max(254);
const INVITATION_LIFETIME_DAYS = 14;

export async function inviteMember(formData: FormData) {
  const user = await requireRole("USER");

  const parsed = invitationSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/members?invite=invalid#invite");
  const email = parsed.data;
  const existingMember = await db.user.findUnique({ where: { email }, select: { isActive: true } });
  if (existingMember?.isActive) redirect("/members?invite=member#invite");

  const recentInvitations = await db.invitation.count({
    where: { invitedByUserId: user.id, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (recentInvitations >= 25) redirect("/members?invite=limit#invite");

  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  await db.$transaction(async (transaction) => {
    const invitation = await transaction.invitation.upsert({
      where: { email },
      create: { email, role: "USER", expiresAt, invitedByUserId: user.id },
      update: { role: "USER", expiresAt, acceptedAt: null, revokedAt: null, invitedByUserId: user.id, createdAt: new Date() },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "MEMBER_INVITATION_SENT",
        entityType: "Invitation",
        entityId: invitation.id,
        after: { expiresAt: invitation.expiresAt.toISOString(), role: "USER" },
      },
    });
  });
  redirect("/members?invite=sent#invite");
}
