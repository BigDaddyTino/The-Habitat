import "@/lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { avatarContentTypes, resolveAvatarFile } from "@/lib/avatar-storage";

/**
 * Member avatars are stored on a persistent volume outside the build output, so they
 * cannot be served from `public/`. Uploads are magic-byte checked and renamed to a
 * UUID before they land on disk, and the filename pattern here is the only way in.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const target = resolveAvatarFile(filename);
  if (!target) return new NextResponse("Not found", { status: 404 });

  const extension = path.extname(target).slice(1).toLowerCase() as keyof typeof avatarContentTypes;
  const contentType = avatarContentTypes[extension];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  const bytes = await readFile(target).catch(() => null);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
