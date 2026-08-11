import "@/lib/environment";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { avatarStorageDirectory, resolveAvatarFile, uploadedAvatarFilename } from "@/lib/avatar-storage";
import { hasRequiredRole } from "@/lib/permissions";

const db = getPrismaClient();
const maxAvatarBytes = 2 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": { extension: "jpg", magic: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", magic: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", magic: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
  "image/gif": { extension: "gif", magic: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a" },
} as const;

async function removePreviousUpload(image: string | null) {
  const filename = uploadedAvatarFilename(image);
  const target = filename ? resolveAvatarFile(filename) : null;
  if (!target) return;
  await unlink(target).catch(() => undefined);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, "USER")) return NextResponse.redirect(new URL("/sign-in", request.url), 303);
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.redirect(new URL("/profile?avatar=invalid", request.url), 303);
  const upload = formData.get("avatar");
  if (!(upload instanceof File) || upload.size === 0 || upload.size > maxAvatarBytes || !(upload.type in imageTypes)) {
    return NextResponse.redirect(new URL("/profile?avatar=invalid", request.url), 303);
  }
  const bytes = new Uint8Array(await upload.arrayBuffer());
  const imageType = imageTypes[upload.type as keyof typeof imageTypes];
  if (!imageType.magic(bytes)) return NextResponse.redirect(new URL("/profile?avatar=invalid", request.url), 303);

  const directory = avatarStorageDirectory();
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${imageType.extension}`;
  const target = path.resolve(directory, filename);
  if (!target.startsWith(`${directory}${path.sep}`)) return NextResponse.redirect(new URL("/profile?avatar=invalid", request.url), 303);
  await writeFile(target, bytes, { flag: "wx" });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
  const image = `/member-avatars/${filename}`;
  try {
    await db.$transaction([
      db.user.update({ where: { id: session.user.id }, data: { image } }),
      db.auditLog.create({ data: { actorUserId: session.user.id, action: "PROFILE_AVATAR_UPLOADED", entityType: "User", entityId: session.user.id, after: { storage: "member-avatar" } } }),
    ]);
  } catch (error) {
    await unlink(target).catch(() => undefined);
    throw error;
  }
  await removePreviousUpload(user?.image ?? null);
  return NextResponse.redirect(new URL("/profile?avatar=uploaded", request.url), 303);
}
