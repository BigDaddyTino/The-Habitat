import { notFound } from "next/navigation";
import { StoryEntityDirectory } from "@/components/story-entity-directory";
import { requireRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";
import { isStoryCollectionSlug, storyCollections } from "@/lib/story-library";

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  return { title: isStoryCollectionSlug(collection) ? `${storyCollections[collection].label} | Story Codex` : "Story Codex" };
}

export default async function StoryLibraryPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<{ q?: string; parent?: string; placeKind?: string }> }) {
  await requireRole(storyReadRole);
  const [{ collection }, filters] = await Promise.all([params, searchParams]);
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
