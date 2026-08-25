import { notFound } from "next/navigation";
import { StoryAtlas } from "@/components/story-atlas";
import { StoryAtlasV2 } from "@/components/story-atlas-v2";
import { resolveAtlasProjectionVersion } from "@/lib/atlas-v2-feature";
import { requireRole } from "@/lib/authorization";
import { getStoryAtlasProjection } from "@/lib/story-atlas";
import { getStoryAtlasV2Projection } from "@/lib/story-atlas-v2";
import { storyReadRole } from "@/lib/story-codex";

export const dynamic = "force-dynamic";

export default async function StoryAtlasPage({ searchParams }: { searchParams: Promise<{ atlas?: string }> }) {
  const user = await requireRole(storyReadRole);
  const requested = (await searchParams).atlas;
  const version = resolveAtlasProjectionVersion({ requested, role: user.role });
  if (version === "V2") {
    const projection = await getStoryAtlasV2Projection("martino-world");
    if (!projection) notFound();
    return <main className="codex-atlas-page"><StoryAtlasV2 initialProjection={projection}/></main>;
  }
  const projection = await getStoryAtlasProjection("martino-world");
  if (!projection) notFound();
  return <main className="codex-atlas-page"><StoryAtlas initialProjection={projection}/></main>;
}
