import path from "node:path";

/**
 * Where an idea's pictures and files live, and the only rules for reaching them.
 *
 * Attachments are member uploads, so they live outside the build output (a
 * redeploy must never destroy a drawing) and outside `public/` (an unreleased
 * design is unreleased plot — the codex's art already learned that). The
 * `/codex-attachments/<storedName>` route serves them behind the same USER gate
 * as the rest of the codex, and `storedName` — a UUID plus an extension from
 * the fixed list below — is the only thing that route will resolve.
 *
 * What is accepted is deliberately short: the image types a browser renders
 * inline, a PDF, and plain text or Markdown. Every upload is checked by its
 * first bytes as well as by the type the browser claims, and the extension on
 * disk comes from the table here, never from the filename the member typed.
 */
export const ideaAttachmentTypes = {
  "image/jpeg": { extension: "jpg", image: true, magic: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: "png", image: true, magic: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": { extension: "webp", image: true, magic: (b: Uint8Array) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  "image/gif": { extension: "gif", image: true, magic: (b: Uint8Array) => ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a" },
  "application/pdf": { extension: "pdf", image: false, magic: (b: Uint8Array) => ascii(b, 0, 4) === "%PDF" },
  "text/plain": { extension: "txt", image: false, magic: (b: Uint8Array) => looksLikeText(b) },
  "text/markdown": { extension: "md", image: false, magic: (b: Uint8Array) => looksLikeText(b) },
} as const;

export type IdeaAttachmentContentType = keyof typeof ideaAttachmentTypes;

export const ideaAttachmentContentTypes: Record<string, string> = Object.fromEntries(
  Object.entries(ideaAttachmentTypes).map(([contentType, spec]) => [spec.extension, contentType]),
);

/** 20 MB per file, ten files per upload — a scan of a drawing fits; a video does not belong here. */
export const maxIdeaAttachmentBytes = 20 * 1024 * 1024;
export const maxIdeaAttachmentsPerUpload = 10;

const storedNamePattern = /^[a-f0-9-]{36}\.(?:jpg|png|webp|gif|pdf|txt|md)$/i;

function ascii(bytes: Uint8Array, from: number, to: number) {
  return String.fromCharCode(...bytes.slice(from, to));
}

/** No NUL in the first few kilobytes: the cheapest honest test for "this is text". */
function looksLikeText(bytes: Uint8Array) {
  const head = bytes.slice(0, 4096);
  for (const byte of head) if (byte === 0) return false;
  return true;
}

/** Browsers send Markdown as text/markdown, text/x-markdown, or nothing at all; the extension decides. */
export function normaliseIdeaContentType(claimed: string, fileName: string): IdeaAttachmentContentType | null {
  const lower = claimed.toLowerCase().split(";")[0]!.trim();
  if (lower in ideaAttachmentTypes) return lower as IdeaAttachmentContentType;
  const extension = path.extname(fileName).slice(1).toLowerCase();
  if (extension === "md" || extension === "markdown") return "text/markdown";
  if (extension === "txt" && (lower === "" || lower === "application/octet-stream")) return "text/plain";
  if (extension === "jpeg" || extension === "jpg") return lower === "" ? "image/jpeg" : null;
  return null;
}

export function isIdeaImageType(contentType: string) {
  return contentType in ideaAttachmentTypes && ideaAttachmentTypes[contentType as IdeaAttachmentContentType].image;
}

/**
 * Uploads live outside the repository so a redeploy never destroys them.
 * `HABITAT_CODEX_ATTACHMENT_PATH` points somewhere persistent in production;
 * the default is a gitignored directory beside the codex art.
 */
export function ideaAttachmentDirectory() {
  return process.env.HABITAT_CODEX_ATTACHMENT_PATH
    ? path.resolve(process.env.HABITAT_CODEX_ATTACHMENT_PATH)
    : path.resolve(process.cwd(), "private", "codex-attachments");
}

/** The absolute path for a stored name, or null when the name is not one this module issued. */
export function resolveIdeaAttachmentFile(storedName: string) {
  if (!storedNamePattern.test(storedName)) return null;
  const directory = ideaAttachmentDirectory();
  const target = path.resolve(directory, storedName);
  return target.startsWith(`${directory}${path.sep}`) ? target : null;
}

export function ideaAttachmentUrl(storedName: string) {
  return `/codex-attachments/${storedName}`;
}

/** A member's filename, made safe to display and bounded to the column. */
export function cleanIdeaFileName(name: string) {
  const trimmed = Array.from(name).filter((char) => { const code = char.charCodeAt(0); return code > 31 && code !== 127; }).join("").replace(/[\\/]/g, "-").trim();
  return (trimmed || "attachment").slice(0, 200);
}

export function formatIdeaBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
