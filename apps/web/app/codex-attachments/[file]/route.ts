import "@/lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { hasRequiredRole } from "@/lib/permissions";
import { ideaAttachmentContentTypes, resolveIdeaAttachmentFile } from "@/lib/idea-attachments";
import { storyReadRole } from "@/lib/story-codex";

/**
 * Serves an idea's pictures and files off disk, behind the codex gate.
 *
 * Same law as codex art: an unreleased drawing is unreleased plot, so nothing
 * here is reachable without a member session. The stored name is the only
 * key, it is pattern-checked before it touches the filesystem, and the row
 * must exist — a file whose row was deleted is gone from the web even if the
 * bytes are still on disk.
 */
const db = getPrismaClient();

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const { file } = await params;
  const target = resolveIdeaAttachmentFile(file);
  if (!target) return new NextResponse("Not found", { status: 404 });
  const row = await db.storyEntryAttachment.findUnique({ where: { storedName: file }, select: { contentType: true, fileName: true } });
  if (!row) return new NextResponse("Not found", { status: 404 });

  const extension = path.extname(target).slice(1).toLowerCase();
  const contentType = ideaAttachmentContentTypes[extension] ?? row.contentType;
  const bytes = await readFile(target).catch(() => null);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  const inline = contentType.startsWith("image/") || contentType === "application/pdf";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType.startsWith("text/") ? `${contentType}; charset=utf-8` : contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,
      "Cache-Control": "private, max-age=3600",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
