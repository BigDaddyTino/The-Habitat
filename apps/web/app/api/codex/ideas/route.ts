import "@/lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import {
  canonicalStoryEntryRouteSlug,
  isValidStoryKey,
  persistedStoryEntrySlug,
  slugifyStoryKey,
  storyEntrySlugAliases,
  storyIdeaFacets,
  type StoryIdeaFacet,
  type StoryThreadMeta,
} from "@habitat/shared";
import { hasRequiredRole } from "@/lib/permissions";
import { publicUrl } from "@/lib/public-url";
import { storyReadRole } from "@/lib/story-codex";
import {
  cleanIdeaFileName,
  ideaAttachmentDirectory,
  ideaAttachmentTypes,
  maxIdeaAttachmentBytes,
  maxIdeaAttachmentsPerUpload,
  normaliseIdeaContentType,
} from "@/lib/idea-attachments";

/**
 * The Idea Center's one write that carries files: a new idea, or more
 * pictures on an existing one.
 *
 * A route handler rather than a server action because attachments are
 * multipart uploads that can run to megabytes, and this is the same door the
 * avatar upload already uses. Text-only edits (sections, stage, bookmarks)
 * are ordinary server actions in app/codex/ideas/actions.ts.
 *
 * Two shapes, told apart by `entryId`:
 *   - absent  -> create a THREAD entry from `title` (required), `summary`,
 *                `body`, `facets[]`, then attach any `files`;
 *   - present -> attach `files` to that entry.
 *
 * Every file is checked by size, by the type the browser claims, and by its
 * first bytes; the name on disk is a fresh UUID plus an extension from the
 * fixed list, and the member's own filename is only ever shown as a label.
 * Nothing is written to the database until every file is safely on disk, and
 * a database failure removes what was written.
 */
const db = getPrismaClient();
const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

const back = (request: Request, to: string) => NextResponse.redirect(publicUrl(to, request.url), 303);
const refuse = (request: Request, to: string, reason: string) => back(request, `${to}${to.includes("?") ? "&" : "?"}error=${encodeURIComponent(reason)}`);

type Staged = { target: string; storedName: string; fileName: string; contentType: string; bytes: number; sha256: string; caption: string | null };

async function stageFiles(formData: FormData): Promise<{ staged: Staged[]; problem: string | null }> {
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > maxIdeaAttachmentsPerUpload) return { staged: [], problem: `Ten files at a time, please — that was ${files.length}.` };
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300) || null;
  const directory = ideaAttachmentDirectory();
  await mkdir(directory, { recursive: true });
  const staged: Staged[] = [];
  for (const file of files) {
    const contentType = normaliseIdeaContentType(file.type, file.name);
    if (!contentType) { await Promise.all(staged.map((item) => unlink(item.target).catch(() => undefined))); return { staged: [], problem: `"${file.name}" is not a kind of file the Idea Center takes — pictures (PNG, JPG, WebP, GIF), PDFs, or plain text.` }; }
    if (file.size > maxIdeaAttachmentBytes) { await Promise.all(staged.map((item) => unlink(item.target).catch(() => undefined))); return { staged: [], problem: `"${file.name}" is over 20 MB.` }; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const spec = ideaAttachmentTypes[contentType];
    if (!spec.magic(bytes)) { await Promise.all(staged.map((item) => unlink(item.target).catch(() => undefined))); return { staged: [], problem: `"${file.name}" does not look like what it says it is.` }; }
    const storedName = `${randomUUID()}.${spec.extension}`;
    const target = path.resolve(directory, storedName);
    if (!target.startsWith(`${directory}${path.sep}`)) return { staged: [], problem: "That file could not be stored." };
    await writeFile(target, bytes, { flag: "wx" });
    staged.push({ target, storedName, fileName: cleanIdeaFileName(file.name), contentType, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), caption });
  }
  return { staged, problem: null };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) return back(request, "/sign-in");
  const userId = session.user.id;
  const formData = await request.formData().catch(() => null);
  if (!formData) return refuse(request, "/codex/ideas", "That form could not be read.");

  const entryIdRaw = String(formData.get("entryId") ?? "").trim();

  // ---- attach to an existing idea -----------------------------------------
  if (entryIdRaw) {
    const entry = await db.storyEntry.findFirst({ where: { id: entryIdRaw, kind: "THREAD", status: { in: [...workingStatuses] } }, select: { id: true, slug: true, title: true } });
    if (!entry) return refuse(request, "/codex/ideas", "That idea no longer exists.");
    const page = `/codex/ideas/${canonicalStoryEntryRouteSlug(entry.slug)}`;
    const { staged, problem } = await stageFiles(formData);
    if (problem) return refuse(request, page, problem);
    if (staged.length === 0) return refuse(request, page, "Pick at least one file to add.");
    try {
      await db.$transaction([
        ...staged.map((item) => db.storyEntryAttachment.create({ data: { entryId: entry.id, fileName: item.fileName, storedName: item.storedName, contentType: item.contentType, bytes: item.bytes, sha256: item.sha256, caption: item.caption, uploadedByUserId: userId } })),
        db.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: userId, summary: `Added ${staged.length} attachment${staged.length === 1 ? "" : "s"} to "${entry.title}"` } }),
      ]);
    } catch (error) {
      await Promise.all(staged.map((item) => unlink(item.target).catch(() => undefined)));
      throw error;
    }
    revalidatePath("/codex/ideas");
    revalidatePath(page);
    revalidatePath(`/codex/bible/${entry.slug}`);
    return back(request, `${page}?attached=${staged.length}#pictures`);
  }

  // ---- a new idea -----------------------------------------------------------
  const title = String(formData.get("title") ?? "").trim();
  if (!title || title.length > 120) return refuse(request, "/codex/ideas#new-idea", "Give the idea a name — up to 120 characters.");
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 500) || null;
  const body = String(formData.get("body") ?? "").trim().slice(0, 20000) || null;
  const facets = [...new Set(formData.getAll("facets").filter((value): value is StoryIdeaFacet => (storyIdeaFacets as readonly unknown[]).includes(value)))];

  const publicSlug = slugifyStoryKey(title);
  if (!isValidStoryKey(publicSlug)) return refuse(request, "/codex/ideas#new-idea", "That name needs at least one letter or number.");
  const slug = persistedStoryEntrySlug(publicSlug);
  const collision = await db.storyEntry.findFirst({ where: { slug: { in: storyEntrySlugAliases(publicSlug) } }, select: { title: true } });
  if (collision) return refuse(request, "/codex/ideas#new-idea", `The codex already has something called "${collision.title}" — give this one a different name.`);

  const meta: StoryThreadMeta = {
    threadStatus: "brainstorming",
    categories: [],
    stages: [],
    priority: null,
    spoilerLevel: null,
    parent: null,
    characters: [],
    companions: [],
    factions: [],
    locations: [],
    arcs: [],
    companionMissions: [],
    bosses: [],
    canonPackets: [],
    facets,
    sections: [],
    tags: [],
    openQuestions: [],
  };

  const { staged, problem } = await stageFiles(formData);
  if (problem) return refuse(request, "/codex/ideas#new-idea", problem);

  let created: { id: string; slug: string };
  try {
    created = await db.$transaction(async (tx) => {
      const entry = await tx.storyEntry.create({ data: { id: randomUUID(), kind: "THREAD", slug, title, summary, body, status: "CANON", createdByUserId: userId, meta: meta as unknown as Prisma.InputJsonValue }, select: { id: true, slug: true } });
      await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: userId, summary: `Proposed the idea "${title}"` } });
      for (const item of staged) {
        await tx.storyEntryAttachment.create({ data: { entryId: entry.id, fileName: item.fileName, storedName: item.storedName, contentType: item.contentType, bytes: item.bytes, sha256: item.sha256, caption: item.caption, uploadedByUserId: userId } });
      }
      return entry;
    });
  } catch (error) {
    await Promise.all(staged.map((item) => unlink(item.target).catch(() => undefined)));
    throw error;
  }

  revalidatePath("/codex/ideas");
  revalidatePath("/codex/stories");
  revalidatePath("/codex/bible");
  revalidatePath(`/codex/bible/${created.slug}`);
  return back(request, `/codex/ideas/${canonicalStoryEntryRouteSlug(created.slug)}?created=1`);
}
