import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "@habitat/db/client";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { cookies } from "next/headers";
import "@/lib/environment";
import type { HabitatRole } from "@/lib/permissions";
import { hasRequiredRole } from "@/lib/permissions";
import { publicOrigin } from "@/lib/public-url";
import { INVITE_GRANT_COOKIE, readInviteGrant } from "@/lib/weekly-invite-code";

const db = getPrismaClient();

// Auth.js rewrites each request's origin from AUTH_URL, but when AUTH_URL is
// missing it silently keeps the incoming URL instead. Behind the tunnel that is
// a loopback address, so Discord would be handed
// http://127.0.0.1:3000/api/auth/callback/discord and sign-in would break in a
// way that looks like a provider problem. publicOrigin() throws on a missing,
// non-HTTPS, or path-bearing value, so asserting it here turns that silent
// misconfiguration into a refusal to boot. Development is left alone: there,
// inferring the origin from the request is legitimate.
if (process.env.NODE_ENV === "production") publicOrigin();

export const isDiscordConfigured = Boolean(
  process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
);

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function isBootstrapAdmin(email: string) {
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  return Boolean(bootstrapEmail && normalizedEmail(email) === normalizedEmail(bootstrapEmail));
}

async function availableUsername(userId: string, name: string | null | undefined, email: string) {
  const base = (name ?? email.split("@")[0] ?? "member")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "member";
  const owner = await db.user.findUnique({ where: { username: base }, select: { id: true } });
  return !owner || owner.id === userId ? base : `${base.slice(0, 17)}-${userId.slice(0, 6)}`;
}

async function currentCodeReferral() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get(INVITE_GRANT_COOKIE)?.value;
  const grant = readInviteGrant(token, secret);
  if (!grant) return null;
  const inviter = await db.user.findUnique({
    where: { id: grant.inviterUserId },
    select: { id: true, isActive: true, role: true },
  });
  return inviter?.isActive && hasRequiredRole(inviter.role, "USER") ? grant : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  pages: { signIn: "/sign-in", error: "/sign-in" },
  providers: isDiscordConfigured
    ? [
        Discord({
          clientId: process.env.AUTH_DISCORD_ID,
          clientSecret: process.env.AUTH_DISCORD_SECRET,
          profile(profile) {
            return {
              id: profile.id,
              name: profile.global_name ?? profile.username,
              email: profile.email ? normalizedEmail(profile.email) : null,
              image: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : null,
            };
          },
        }),
      ]
    : [],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "discord" || !user.email) return false;

      const email = normalizedEmail(user.email);
      if (isBootstrapAdmin(email)) return true;

      const existingUser = await db.user.findUnique({
        where: { email },
        select: { id: true, isActive: true, username: true, name: true },
      });
      if (existingUser) {
        if (existingUser.isActive) return true;

        // Heal a locked-out row: if the invitation expired between the signIn
        // check and the createUser event, the user was created inactive. A
        // currently valid unconsumed invitation reactivates the member.
        const pendingInvitation = await db.invitation.findFirst({
          where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true, role: true, invitedByUserId: true },
        });
        const codeReferral = pendingInvitation ? null : await currentCodeReferral();
        if (!pendingInvitation && !codeReferral) return false;

        const username = existingUser.username ?? await availableUsername(existingUser.id, existingUser.name ?? user.name, email);
        const inviterUserId = pendingInvitation?.invitedByUserId ?? codeReferral?.inviterUserId ?? null;
        const method = pendingInvitation ? "EMAIL" : "CODE";
        await db.$transaction(async (transaction) => {
          await transaction.user.update({ where: { id: existingUser.id }, data: { role: pendingInvitation?.role ?? "USER", isActive: true, username } });
          if (pendingInvitation) await transaction.invitation.update({ where: { id: pendingInvitation.id }, data: { acceptedAt: new Date() } });
          if (inviterUserId && inviterUserId !== existingUser.id) {
            await transaction.memberReferral.upsert({
              where: { invitedUserId: existingUser.id },
              create: { inviterUserId, invitedUserId: existingUser.id, invitationId: pendingInvitation?.id, method, codeWeek: codeReferral?.codeWeek },
              update: {},
            });
            await transaction.auditLog.create({ data: { actorUserId: inviterUserId, action: `MEMBER_JOINED_BY_${method}_INVITATION`, entityType: "User", entityId: existingUser.id, after: { method, codeWeek: codeReferral?.codeWeek ?? null } } });
          }
        });
        return true;
      }

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
      });
      return Boolean(invitation || await currentCodeReferral());
    },
    async session({ session, user }) {
      if (!session.user) return session;

      // PrismaAdapter passes the raw Habitat user row; the AdapterUser typing
      // simply does not declare the extra columns. Fall back to a lookup if a
      // future adapter ever strips them.
      const adapterUser = user as typeof user & { role?: HabitatRole; isActive?: boolean };
      const habitatUser = adapterUser.role !== undefined && adapterUser.isActive !== undefined
        ? { id: adapterUser.id, role: adapterUser.role, isActive: adapterUser.isActive }
        : await db.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, isActive: true },
          });
      if (!habitatUser) return session;

      session.user.id = habitatUser.id;
      session.user.role = habitatUser.role;
      session.user.isActive = habitatUser.isActive;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      const userId = user.id;
      const email = normalizedEmail(user.email);
      const username = await availableUsername(userId, user.name, email);
      if (isBootstrapAdmin(email)) {
        await db.user.update({ where: { id: userId }, data: { role: "ADMIN", isActive: true, username } });
        return;
      }

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, role: true, invitedByUserId: true },
      });
      const codeReferral = invitation ? null : await currentCodeReferral();
      if (!invitation && !codeReferral) return;

      const inviterUserId = invitation?.invitedByUserId ?? codeReferral?.inviterUserId ?? null;
      const method = invitation ? "EMAIL" : "CODE";
      await db.$transaction(async (transaction) => {
        await transaction.user.update({ where: { id: userId }, data: { role: invitation?.role ?? "USER", isActive: true, username } });
        if (invitation) await transaction.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
        if (inviterUserId && inviterUserId !== userId) {
          await transaction.memberReferral.create({ data: { inviterUserId, invitedUserId: userId, invitationId: invitation?.id, method, codeWeek: codeReferral?.codeWeek } });
          await transaction.auditLog.create({ data: { actorUserId: inviterUserId, action: `MEMBER_JOINED_BY_${method}_INVITATION`, entityType: "User", entityId: userId, after: { method, codeWeek: codeReferral?.codeWeek ?? null } } });
        }
      });
    },
  },
});
