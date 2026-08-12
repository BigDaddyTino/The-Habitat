"use server";

import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const memberIdSchema = z.string().uuid();
const roleSchema = z.enum(["VIEWER", "USER", "ADMIN"]);

class MemberActionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function refreshMemberSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/members", "layout");
}

function memberId(formData: FormData) {
  const parsed = memberIdSchema.safeParse(formData.get("memberId"));
  if (!parsed.success) throw new MemberActionError("invalid-member");
  return parsed.data;
}

async function runMemberAction(action: () => Promise<void>, success: string) {
  try {
    await action();
  } catch (error) {
    if (error instanceof MemberActionError) redirect(`/admin/members?error=${error.code}`);
    throw error;
  }
  refreshMemberSurfaces();
  redirect(`/admin/members?notice=${success}`);
}

export async function updateMemberRole(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const targetId = memberId(formData);
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) redirect("/admin/members?error=invalid-role");
  if (targetId === actor.id) redirect("/admin/members?error=self-protected");

  await runMemberAction(async () => {
    await db.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({ where: { id: targetId }, select: { id: true, role: true, isActive: true } });
      if (!target) throw new MemberActionError("not-found");
      if (target.role === role.data) return;
      if (target.isActive && target.role === "ADMIN" && role.data !== "ADMIN") {
        const activeAdmins = await transaction.user.count({ where: { role: "ADMIN", isActive: true } });
        if (activeAdmins <= 1) throw new MemberActionError("last-admin");
      }
      await transaction.user.update({ where: { id: target.id }, data: { role: role.data } });
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "MEMBER_ROLE_CHANGED",
          entityType: "User",
          entityId: target.id,
          before: { role: target.role },
          after: { role: role.data },
        },
      });
    }, { isolationLevel: "Serializable" });
  }, "role-updated");
}

export async function setMemberActive(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const targetId = memberId(formData);
  const active = formData.get("active") === "true";
  if (targetId === actor.id) redirect("/admin/members?error=self-protected");

  await runMemberAction(async () => {
    await db.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({ where: { id: targetId }, select: { id: true, role: true, isActive: true } });
      if (!target) throw new MemberActionError("not-found");
      if (target.isActive === active) return;
      if (!active && target.role === "ADMIN") {
        const activeAdmins = await transaction.user.count({ where: { role: "ADMIN", isActive: true } });
        if (activeAdmins <= 1) throw new MemberActionError("last-admin");
      }
      const revokedSessions = active ? 0 : (await transaction.session.deleteMany({ where: { userId: target.id } })).count;
      await transaction.user.update({ where: { id: target.id }, data: { isActive: active } });
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: active ? "MEMBER_REACTIVATED" : "MEMBER_SUSPENDED",
          entityType: "User",
          entityId: target.id,
          before: { isActive: target.isActive },
          after: { isActive: active, revokedSessions },
        },
      });
    }, { isolationLevel: "Serializable" });
  }, active ? "member-reactivated" : "member-suspended");
}

export async function revokeMemberSessions(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const targetId = memberId(formData);
  if (targetId === actor.id) redirect("/admin/members?error=self-protected");

  await runMemberAction(async () => {
    await db.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!target) throw new MemberActionError("not-found");
      const revokedSessions = (await transaction.session.deleteMany({ where: { userId: target.id } })).count;
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "MEMBER_SESSIONS_REVOKED",
          entityType: "User",
          entityId: target.id,
          after: { revokedSessions },
        },
      });
    });
  }, "sessions-revoked");
}

export async function revokeInvitation(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const parsed = memberIdSchema.safeParse(formData.get("invitationId"));
  if (!parsed.success) redirect("/admin/members?error=invalid-invitation");

  await runMemberAction(async () => {
    await db.$transaction(async (transaction) => {
      const invitation = await transaction.invitation.findUnique({
        where: { id: parsed.data },
        select: { id: true, email: true, role: true, acceptedAt: true, revokedAt: true, invitedByUserId: true },
      });
      if (!invitation || invitation.acceptedAt || invitation.revokedAt) throw new MemberActionError("invitation-unavailable");
      await transaction.invitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "MEMBER_INVITATION_REVOKED",
          entityType: "Invitation",
          entityId: invitation.id,
          before: { email: invitation.email, role: invitation.role, invitedByUserId: invitation.invitedByUserId },
          after: { revoked: true },
        },
      });
    });
  }, "invitation-revoked");
}
