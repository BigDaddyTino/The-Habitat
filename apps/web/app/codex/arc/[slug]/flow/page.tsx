import { permanentRedirect } from "next/navigation";

/**
 * The reader and the whiteboard merged into one view — the arc page itself is
 * the story tree now. This route survives only so old links keep working.
 */
export default async function StoryFlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/codex/arc/${slug}`);
}
