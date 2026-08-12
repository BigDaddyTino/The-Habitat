"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrismaClient } from "@habitat/db/client";
import { createInviteGrant, INVITE_GRANT_COOKIE, INVITE_GRANT_LIFETIME_SECONDS, resolveWeeklyInviteCode } from "@/lib/weekly-invite-code";

const db = getPrismaClient();
const codeSchema = z.string().trim().min(8).max(32);

export async function redeemInviteCode(formData: FormData) {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_GRANT_COOKIE);
  const parsed = codeSchema.safeParse(formData.get("inviteCode"));
  const secret = process.env.AUTH_SECRET;
  if (!parsed.success || !secret) redirect("/sign-in?code=invalid");

  const members = await db.user.findMany({ where: { isActive: true }, select: { id: true } });
  const referral = resolveWeeklyInviteCode(parsed.data, members, secret);
  if (!referral) redirect("/sign-in?code=invalid");

  cookieStore.set(INVITE_GRANT_COOKIE, createInviteGrant(referral.inviterUserId, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_GRANT_LIFETIME_SECONDS,
  });
  redirect("/sign-in?code=ready");
}
