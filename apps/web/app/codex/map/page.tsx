import { notFound } from "next/navigation";
import { StoryAtlas } from "@/components/story-atlas";
import { requireRole } from "@/lib/authorization";
import { getStoryAtlasProjection } from "@/lib/story-atlas";
import { storyReadRole } from "@/lib/story-codex";

export const dynamic = "force-dynamic";

export default async function StoryAtlasPage() {
  await requireRole(storyReadRole);
  const projection = await getStoryAtlasProjection("martino-world");
  if (!projection) notFound();
  return <main className="codex-atlas-page"><StoryAtlas initialProjection={projection}/></main>;
}
