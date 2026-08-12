import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "@habitat/db/client";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import "@/lib/environment";
import type { HabitatRole } from "@/lib/permissions";

const db = getPrismaClient();

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
          where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true, role: true },
        });
        if (!pendingInvitation) return false;

        const username = existingUser.username ?? await availableUsername(existingUser.id, existingUser.name ?? user.name, email);
        await db.$transaction([
          db.user.update({ where: { id: existingUser.id }, data: { role: pendingInvitation.role, isActive: true, username } }),
          db.invitation.update({ where: { id: pendingInvitation.id }, data: { acceptedAt: new Date() } }),
        ]);
        return true;
      }

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
      });
      return Boolean(invitation);
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

      const email = normalizedEmail(user.email);
      const username = await availableUsername(user.id, user.name, email);
      if (isBootstrapAdmin(email)) {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN", isActive: true, username } });
        return;
      }

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, role: true },
      });
      if (!invitation) return;

      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { role: invitation.role, isActive: true, username } }),
        db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
      ]);
    },
  },
});
