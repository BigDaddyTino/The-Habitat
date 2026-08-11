import path from "node:path";

const uploadedAvatarPattern = /^[a-f0-9-]{36}\.(?:jpg|png|webp|gif)$/i;

export const avatarContentTypes = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
} as const;

/**
 * Uploaded avatars live outside the repository so a redeploy never destroys member
 * uploads. `/member-avatars/*` is served by its route handler, not by `public/`,
 * whenever this points somewhere else.
 */
export function avatarStorageDirectory() {
  return process.env.HABITAT_AVATAR_STORAGE_PATH
    ? path.resolve(process.env.HABITAT_AVATAR_STORAGE_PATH)
    : path.resolve(process.cwd(), "public", "member-avatars");
}

export function resolveAvatarFile(filename: string) {
  if (!uploadedAvatarPattern.test(filename)) return null;
  const directory = avatarStorageDirectory();
  const target = path.resolve(directory, filename);
  return target.startsWith(`${directory}${path.sep}`) ? target : null;
}

export function uploadedAvatarFilename(image: string | null) {
  const match = image?.match(/^\/member-avatars\/([^/]+)$/);
  return match && uploadedAvatarPattern.test(match[1]) ? match[1] : null;
}
