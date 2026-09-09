import { permanentRedirect } from "next/navigation";

/**
 * Story Threads moved into the Idea Center on 2026-09-09: a thread is an idea
 * whose kind is "Story", and the room that argues ideas into canon is the same
 * room for every kind. Old links and bookmarks land on the new board with
 * their filters intact.
 */
export default async function StoryThreadsMoved({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = await searchParams;
  const next = new URLSearchParams();
  const q = filters.q; if (typeof q === "string" && q.trim()) next.set("q", q.trim());
  const tag = filters.tag; if (typeof tag === "string" && tag.trim()) next.set("tag", tag.trim());
  const by = filters.by; if (typeof by === "string" && by.trim()) next.set("by", by.trim());
  const status = filters.status; if (typeof status === "string" && status.trim()) next.set("stage", status.trim());
  next.set("facet", "story");
  permanentRedirect(`/codex/ideas?${next.toString()}`);
}
