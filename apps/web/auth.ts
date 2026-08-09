import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "@habitat/db/client";
import dotenv from "dotenv";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
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
        select: { isActive: true },
      });
      if (existingUser) return existingUser.isActive;

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
      });
      return Boolean(invitation);
    },
    async session({ session, user }) {
      if (!session.user) return session;

      const habitatUser = await db.user.findUnique({
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
      if (!user.email) return;

      const email = normalizedEmail(user.email);
      if (isBootstrapAdmin(email)) {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN", isActive: true } });
        return;
      }

      const invitation = await db.invitation.findFirst({
        where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, role: true },
      });
      if (!invitation) return;

      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { role: invitation.role, isActive: true } }),
        db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
      ]);
    },
  },
});
