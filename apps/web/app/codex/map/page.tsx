import { notFound } from "next/navigation";
import Link from "next/link";
import { StoryAtlas } from "@/components/story-atlas";
import { StoryAtlasV2 } from "@/components/story-atlas-v2";
import { atlasV2InternalDefaultAvailable, resolveAtlasProjectionVersion } from "@/lib/atlas-v2-feature";
import { requireRole } from "@/lib/authorization";
import { getStoryAtlasProjection } from "@/lib/story-atlas";
import { getStoryAtlasV2Projection } from "@/lib/story-atlas-v2";
import { storyReadRole } from "@/lib/story-codex";

export const dynamic = "force-dynamic";

export default async function StoryAtlasPage({ searchParams }: { searchParams: Promise<{ atlas?: string; scene?: string }> }) {
  const user = await requireRole(storyReadRole);
  const query = await searchParams;
  const requested = query.atlas;
  const version = resolveAtlasProjectionVersion({ requested, role: user.role });
  const comparisonAvailable = atlasV2InternalDefaultAvailable({ role: user.role });
  if (version === "V2") {
    const projection = await getStoryAtlasV2Projection(query.scene ?? "martino-world");
    if (!projection) notFound();
    return <main className="codex-atlas-page">{comparisonAvailable ? <aside className="atlas-version-indicator"><span>Atlas V2</span><Link href="/codex/map?atlas=v1">View Legacy Atlas</Link></aside> : null}<StoryAtlasV2 initialProjection={projection}/></main>;
  }
  const projection = await getStoryAtlasProjection("martino-world");
  if (!projection) notFound();
  return <main className="codex-atlas-page">{comparisonAvailable ? <aside className="atlas-version-indicator"><span>Legacy Atlas</span><Link href="/codex/map">Return to Atlas V2</Link></aside> : null}<StoryAtlas initialProjection={projection}/></main>;
}
