import { NextResponse, type NextRequest } from "next/server";
import { getPrismaClient } from "@habitat/db/client";
import { buildMemberDataExport, memberExportFileName } from "@habitat/identity";
import { z } from "zod";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";

const db = getPrismaClient();

/**
 * Full export of one member's Habitat record as JSON.
 *
 * Administrator-only, audit logged, and never cached: the payload is the most
 * concentrated collection of member data the installation can produce. Secrets
 * are excluded structurally by the builder rather than filtered here.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.isActive) return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!hasRequiredRole(user.role, "ADMIN")) return NextResponse.json({ error: "Administrator access required" }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const parsed = z.string().uuid().safeParse((await params).userId);
  if (!parsed.success) return NextResponse.json({ error: "Member not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const userId = parsed.data;
  const subject = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, username: true } });
  if (!subject) return NextResponse.json({ error: "Member not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  const exportedAt = new Date();
  const payload = await buildMemberDataExport(db, userId, exportedAt);
  if (!payload) return NextResponse.json({ error: "Member not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  await db.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "MEMBER_DATA_EXPORTED",
      entityType: "User",
      entityId: userId,
      after: { exportedAt: exportedAt.toISOString(), identities: payload.identities.length, xpEntries: payload.xpEntries.length, achievements: payload.achievements.length },
    },
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${memberExportFileName(subject, exportedAt)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
