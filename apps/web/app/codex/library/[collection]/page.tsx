import { notFound, redirect } from "next/navigation";
import { StoryEntityDirectory } from "@/components/story-entity-directory";
import { requireRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";
import { isStoryCollectionSlug, renamedStoryCollections, storyCollections } from "@/lib/story-library";

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  return { title: isStoryCollectionSlug(collection) ? `${storyCollections[collection].label} | Story Codex` : "Story Codex" };
}

export default async function StoryLibraryPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<{ q?: string; parent?: string; placeKind?: string }> }) {
  await requireRole(storyReadRole);
  const [{ collection }, filters] = await Promise.all([params, searchParams]);
  // A renamed shelf keeps answering at its old address. Bookmarks, links
  // written into prose before the rename, and anything the game machine has
  // cached all still land — a 404 here would look like the section was
  // deleted rather than renamed.
  const renamed = renamedStoryCollections[collection];
  if (renamed) redirect(`/codex/library/${renamed}`);
  if (!isStoryCollectionSlug(collection)) notFound();
  return (
    <StoryEntityDirectory
      collectionSlug={collection}
      parent={filters.parent?.trim() || undefined}
      placeKind={filters.placeKind?.trim() || undefined}
      search={filters.q?.trim() || undefined}
    />
  );
}
