import { getPrismaClient } from "@habitat/db/client";
import {
  canonicalStoryEntryRouteSlug,
  storyIdeaStageLabel,
  type StoryIdeaFacet,
  type StoryIdeaSection,
  type StoryThreadStatus,
} from "@habitat/shared";
import { ideaAttachmentUrl, isIdeaImageType } from "./idea-attachments";
import { ideaFacetsOf, ideaPreview, ideaSectionsOf, ideaStatusOf } from "./story-ideas-pure";

export { ideaFacetsOf, ideaPreview, ideaSectionsOf, ideaStatusOf, ideaTabs } from "./story-ideas-pure";

/**
 * The Idea Center's reading side.
 *
 * An idea is a THREAD entry. This module reads threads the way the Idea Center
 * shows them — facets, a plain-language stage, the proposer, pictures, how
 * much discussion there is — and keeps the pure parts (facet parsing, tab
 * order, the card preview) separate so they can be tested without a database.
 */
const db = getPrismaClient();
const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;
const writerSelect = { id: true, displayName: true, name: true, username: true, image: true } as const;

type Writer = { id: string; displayName: string | null; name: string | null; username: string | null; image: string | null };
export type IdeaPerson = { id: string; name: string; username: string | null; image: string | null };

const person = (user: Writer): IdeaPerson => ({ id: user.id, name: user.displayName ?? user.name ?? user.username ?? "A Habitat member", username: user.username, image: user.image });
const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []);

// ------------------------------------------------------------------ reads

export type IdeaAttachment = {
  id: string;
  fileName: string;
  storedName: string;
  contentType: string;
  bytes: number;
  caption: string | null;
  isImage: boolean;
  url: string;
  uploadedBy: IdeaPerson;
  createdAt: Date;
};

export type IdeaCard = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  preview: string;
  facets: StoryIdeaFacet[];
  status: StoryThreadStatus | null;
  stage: string;
  proposer: IdeaPerson;
  commentCount: number;
  attachmentCount: number;
  cover: IdeaAttachment | null;
  sections: StoryIdeaSection[];
  tags: string[];
  bookmarked: boolean;
  bookmarkCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaFilter = {
  search?: string;
  facet?: StoryIdeaFacet | null;
  status?: StoryThreadStatus | null;
  by?: string | null;
  tag?: string | null;
  /** Only the viewer's own ideas. */
  mine?: boolean;
  /** Only the viewer's saved ideas. */
  saved?: boolean;
};

const attachmentSelect = { id: true, fileName: true, storedName: true, contentType: true, bytes: true, caption: true, createdAt: true, uploader: { select: writerSelect } } as const;
type AttachmentRow = { id: string; fileName: string; storedName: string; contentType: string; bytes: number; caption: string | null; createdAt: Date; uploader: Writer };
const attachment = (row: AttachmentRow): IdeaAttachment => ({
  id: row.id, fileName: row.fileName, storedName: row.storedName, contentType: row.contentType, bytes: row.bytes, caption: row.caption,
  isImage: isIdeaImageType(row.contentType), url: ideaAttachmentUrl(row.storedName), uploadedBy: person(row.uploader), createdAt: row.createdAt,
});

export async function listIdeas(viewerId: string, filter: IdeaFilter = {}): Promise<IdeaCard[]> {
  const search = filter.search?.trim();
  const rows = await db.storyEntry.findMany({
    where: {
      kind: "THREAD",
      status: { in: [...workingStatuses] },
      ...(filter.mine ? { createdByUserId: viewerId } : {}),
      ...(filter.saved ? { bookmarks: { some: { userId: viewerId } } } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { summary: { contains: search, mode: "insensitive" as const } }, { body: { contains: search, mode: "insensitive" as const } }] } : {}),
    },
    select: {
      id: true, slug: true, title: true, summary: true, body: true, meta: true, createdAt: true, updatedAt: true,
      creator: { select: writerSelect },
      attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" } },
      bookmarks: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rows
    .map((row) => {
      const facets = ideaFacetsOf(row.meta);
      const status = ideaStatusOf(row.meta);
      const attachments = row.attachments.map(attachment);
      return {
        id: row.id,
        slug: canonicalStoryEntryRouteSlug(row.slug),
        title: row.title,
        summary: row.summary,
        body: row.body,
        preview: ideaPreview(row.summary, row.body),
        facets,
        status,
        stage: storyIdeaStageLabel(status),
        proposer: person(row.creator),
        commentCount: row._count.comments,
        attachmentCount: attachments.length,
        cover: attachments.find((item) => item.isImage) ?? null,
        sections: ideaSectionsOf(row.meta),
        tags: strings(asRecord(row.meta).tags),
        bookmarked: row.bookmarks.some((bookmark) => bookmark.userId === viewerId),
        bookmarkCount: row.bookmarks.length,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } satisfies IdeaCard;
    })
    .filter((card) => (filter.facet ? card.facets.includes(filter.facet) : true))
    .filter((card) => (filter.status ? card.status === filter.status : true))
    .filter((card) => (filter.by ? card.proposer.username === filter.by || card.proposer.name === filter.by : true))
    .filter((card) => (filter.tag ? card.tags.some((tag) => tag.toLowerCase() === filter.tag!.toLowerCase()) : true));
}

export type IdeaComment = { id: string; body: string; author: IdeaPerson; createdAt: Date; resolvedAt: Date | null };

export type Idea = IdeaCard & {
  version: number;
  attachments: IdeaAttachment[];
  comments: IdeaComment[];
  /** Thread-only detail, shown inside the Story tab. */
  categories: string[];
  stages: string[];
  openQuestions: string[];
  canonPacketCount: number;
  /** Slugs the thread names, with titles where they resolve. */
  links: Array<{ slug: string; title: string; kind: string; group: "characters" | "companions" | "factions" | "locations" | "arcs" | "bosses" }>;
  parent: { slug: string; title: string } | null;
  children: Array<{ slug: string; title: string }>;
};

export async function getIdea(slug: string, viewerId: string): Promise<Idea | null> {
  const row = await db.storyEntry.findFirst({
    where: { kind: "THREAD", status: { in: [...workingStatuses] }, OR: [{ slug }, { slug: `the-${slug}` }] },
    select: {
      id: true, slug: true, title: true, summary: true, body: true, meta: true, version: true, createdAt: true, updatedAt: true,
      creator: { select: writerSelect },
      attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" } },
      bookmarks: { select: { userId: true } },
      comments: { select: { id: true, body: true, createdAt: true, resolvedAt: true, author: { select: writerSelect } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return null;
  const meta = asRecord(row.meta);
  const facets = ideaFacetsOf(row.meta);
  const status = ideaStatusOf(row.meta);
  const attachments = row.attachments.map(attachment);

  const groups = [["characters", "characters"], ["companions", "companions"], ["factions", "factions"], ["locations", "locations"], ["bosses", "bosses"]] as const;
  const wanted = new Set<string>();
  for (const [key] of groups) for (const value of strings(meta[key])) wanted.add(value);
  const arcSlugs = strings(meta.arcs);
  const parentSlug = typeof meta.parent === "string" && meta.parent ? meta.parent : null;
  if (parentSlug) wanted.add(parentSlug);

  const [entries, arcs, children] = await Promise.all([
    wanted.size ? db.storyEntry.findMany({ where: { slug: { in: [...wanted] } }, select: { slug: true, title: true, kind: true } }) : Promise.resolve([]),
    arcSlugs.length ? db.storyArc.findMany({ where: { slug: { in: arcSlugs } }, select: { slug: true, title: true } }) : Promise.resolve([]),
    db.storyEntry.findMany({ where: { kind: "THREAD", status: { in: [...workingStatuses] }, meta: { path: ["parent"], equals: row.slug } }, select: { slug: true, title: true } }),
  ]);
  const titleOf = new Map(entries.map((entry) => [entry.slug, entry]));
  const links: Idea["links"] = [];
  for (const [key, group] of groups) {
    for (const value of strings(meta[key])) {
      const found = titleOf.get(value);
      links.push({ slug: value, title: found?.title ?? value.replaceAll("-", " "), kind: found?.kind ?? "ENTRY", group });
    }
  }
  for (const arc of arcs) links.push({ slug: arc.slug, title: arc.title, kind: "ARC", group: "arcs" });
  const parentEntry = parentSlug ? titleOf.get(parentSlug) : null;

  return {
    id: row.id,
    slug: canonicalStoryEntryRouteSlug(row.slug),
    title: row.title,
    summary: row.summary,
    body: row.body,
    preview: ideaPreview(row.summary, row.body),
    facets,
    status,
    stage: storyIdeaStageLabel(status),
    proposer: person(row.creator),
    commentCount: row.comments.length,
    attachmentCount: attachments.length,
    cover: attachments.find((item) => item.isImage) ?? null,
    sections: ideaSectionsOf(row.meta),
    tags: strings(meta.tags),
    bookmarked: row.bookmarks.some((bookmark) => bookmark.userId === viewerId),
    bookmarkCount: row.bookmarks.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    version: row.version,
    attachments,
    comments: row.comments.map((comment) => ({ id: comment.id, body: comment.body, author: person(comment.author), createdAt: comment.createdAt, resolvedAt: comment.resolvedAt })),
    categories: strings(meta.categories),
    stages: strings(meta.stages),
    openQuestions: strings(meta.openQuestions),
    canonPacketCount: Array.isArray(meta.canonPackets) ? meta.canonPackets.length : 0,
    links,
    parent: parentSlug ? { slug: parentSlug, title: parentEntry?.title ?? parentSlug.replaceAll("-", " ") } : null,
    children: children.map((child) => ({ slug: canonicalStoryEntryRouteSlug(child.slug), title: child.title })),
  };
}

/** Everyone who has proposed an idea, for the filter. */
export async function listIdeaProposers() {
  const rows = await db.storyEntry.findMany({ where: { kind: "THREAD", status: { in: [...workingStatuses] } }, select: { creator: { select: writerSelect } }, distinct: ["createdByUserId"] });
  return rows.map((row) => person(row.creator)).sort((a, b) => a.name.localeCompare(b.name));
}
