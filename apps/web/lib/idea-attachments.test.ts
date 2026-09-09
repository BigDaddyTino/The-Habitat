import assert from "node:assert/strict";
import test from "node:test";
import { cleanIdeaFileName, formatIdeaBytes, ideaAttachmentTypes, ideaAttachmentUrl, isIdeaImageType, normaliseIdeaContentType, resolveIdeaAttachmentFile } from "./idea-attachments";

test("only stored names the upload route could have minted resolve to a file", () => {
  assert.equal(resolveIdeaAttachmentFile("../../.env"), null);
  assert.equal(resolveIdeaAttachmentFile("..%2F..%2F.env"), null);
  assert.equal(resolveIdeaAttachmentFile("C:\\Windows\\win.ini"), null);
  assert.equal(resolveIdeaAttachmentFile("not-a-uuid.png"), null);
  assert.equal(resolveIdeaAttachmentFile("0b1e7f4a-3c2d-4e5f-8a9b-0c1d2e3f4a5b.exe"), null);
  assert.equal(resolveIdeaAttachmentFile("0b1e7f4a-3c2d-4e5f-8a9b-0c1d2e3f4a5b.html"), null);
  const ok = resolveIdeaAttachmentFile("0b1e7f4a-3c2d-4e5f-8a9b-0c1d2e3f4a5b.png");
  assert.ok(ok && ok.endsWith("0b1e7f4a-3c2d-4e5f-8a9b-0c1d2e3f4a5b.png"));
  assert.ok(!ok.includes(".."));
});

test("the claimed type is checked against the file name, not trusted", () => {
  assert.equal(normaliseIdeaContentType("image/png", "sketch.png"), "image/png");
  assert.equal(normaliseIdeaContentType("image/jpeg; charset=binary", "photo.jpg"), "image/jpeg");
  assert.equal(normaliseIdeaContentType("", "photo.JPEG"), "image/jpeg");
  assert.equal(normaliseIdeaContentType("application/octet-stream", "notes.md"), "text/markdown");
  assert.equal(normaliseIdeaContentType("text/x-markdown", "notes.markdown"), "text/markdown");
  assert.equal(normaliseIdeaContentType("application/octet-stream", "notes.txt"), "text/plain");
  assert.equal(normaliseIdeaContentType("application/pdf", "brief.pdf"), "application/pdf");
  assert.equal(normaliseIdeaContentType("application/x-msdownload", "virus.exe"), null);
  assert.equal(normaliseIdeaContentType("text/html", "page.html"), null);
  assert.equal(normaliseIdeaContentType("image/svg+xml", "vector.svg"), null);
  assert.equal(normaliseIdeaContentType("application/octet-stream", "mystery.bin"), null);
});

test("magic bytes are checked for every binary type we accept", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const gif = Buffer.from("GIF89a\0\0");
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
  const pdf = Buffer.from("%PDF-1.7\n");
  assert.equal(ideaAttachmentTypes["image/png"].magic(png), true);
  assert.equal(ideaAttachmentTypes["image/png"].magic(jpeg), false);
  assert.equal(ideaAttachmentTypes["image/jpeg"].magic(jpeg), true);
  assert.equal(ideaAttachmentTypes["image/gif"].magic(gif), true);
  assert.equal(ideaAttachmentTypes["image/webp"].magic(webp), true);
  assert.equal(ideaAttachmentTypes["image/webp"].magic(png), false);
  assert.equal(ideaAttachmentTypes["application/pdf"].magic(pdf), true);
  assert.equal(ideaAttachmentTypes["application/pdf"].magic(png), false);
  // Text is anything without a NUL up front; a PNG renamed .txt is refused.
  assert.equal(ideaAttachmentTypes["text/plain"].magic(Buffer.from("hello\nworld")), true);
  assert.equal(ideaAttachmentTypes["text/markdown"].magic(png), false);
});

test("images are the ones that get a cover and a gallery", () => {
  assert.equal(isIdeaImageType("image/png"), true);
  assert.equal(isIdeaImageType("image/webp"), true);
  assert.equal(isIdeaImageType("application/pdf"), false);
  assert.equal(isIdeaImageType("text/plain"), false);
  assert.equal(isIdeaImageType("text/html"), false);
});

test("URLs, names and sizes are safe to print", () => {
  assert.equal(ideaAttachmentUrl("abc.png"), "/codex-attachments/abc.png");
  const cleaned = cleanIdeaFileName("  ../..\\weird\u0000name\u001f.png  ");
  assert.ok(!cleaned.includes("/") && !cleaned.includes("\\"), "no path separators survive");
  assert.ok(Array.from(cleaned).every((char) => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127), "no control characters survive");
  assert.ok(cleaned.endsWith(".png"));
  assert.equal(cleanIdeaFileName(""), "attachment");
  assert.ok(cleanIdeaFileName("x".repeat(400)).length <= 200);
  assert.equal(formatIdeaBytes(512), "512 B");
  assert.equal(formatIdeaBytes(1536), "2 KB");
  assert.equal(formatIdeaBytes(3 * 1024 * 1024), "3.0 MB");
});
