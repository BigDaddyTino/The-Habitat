"use server";

import { getPrismaClient } from "@habitat/db/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";

const db = getPrismaClient();
const invitationSchema = z.string().trim().toLowerCase().email().max(254);
const INVITATION_LIFETIME_DAYS = 14;

export async function inviteMember(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");

  const parsed = invitationSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/members?invite=invalid#invite");
  const email = parsed.data;
  const existingMember = await db.user.findUnique({ where: { email }, select: { isActive: true } });
  if (existingMember?.isActive) redirect("/members?invite=member#invite");

  const recentInvitations = await db.invitation.count({
    where: { invitedByUserId: session.user.id, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (recentInvitations >= 25) redirect("/members?invite=limit#invite");

  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await db.invitation.upsert({
    where: { email },
    create: { email, role: "USER", expiresAt, invitedByUserId: session.user.id },
    update: { role: "USER", expiresAt, acceptedAt: null, invitedByUserId: session.user.id, createdAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "MEMBER_INVITATION_SENT",
      entityType: "Invitation",
      entityId: invitation.id,
      after: { expiresAt: invitation.expiresAt.toISOString(), role: "USER" },
    },
  });
  redirect("/members?invite=sent#invite");
}
