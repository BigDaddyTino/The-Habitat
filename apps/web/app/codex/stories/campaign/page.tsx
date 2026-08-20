import Link from "next/link";
import { ArrowLeft, GitMerge, MapPinned } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { getCampaignFlow, getCanonNavigator, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { CanonNavigator } from "@/components/canon-navigator";
import { CampaignFlow } from "@/components/campaign-flow";

export const metadata = { title: "The campaign | Story Codex" };

/**
 * The macro board answers the question an individual quest cannot: which
 * complete board follows which, where the campaign genuinely branches, and
 * where authored roads converge again. Every line is derived from an ENDING's
 * structural continuation, the same field exported to the game.
 */
export default async function CampaignPage() {
  await requireRole(storyReadRole);
  const [graph, nav] = await Promise.all([getCampaignFlow(), getCanonNavigator()]);

  return (
    <section className="page-shell codex-shell codex-campaign-shell">
      <StoryLiveSync />
      <div className="page-intro campaign-flow-intro">
        <Link className="codex-back" href="/codex/stories/canon"><ArrowLeft aria-hidden="true" size={13} /> Canon navigator</Link>
        <p className="eyebrow"><MapPinned aria-hidden="true" size={12} /> Martino · the campaign</p>
        <h1>Every road through the war</h1>
        <p>Click a chapter to open its full playable flow. Gold lines are real handoffs between quest endings—not a planning sketch—so the campaign map and the game export stay in agreement.</p>
      </div>

      <div className="canon-workspace">
        <CanonNavigator campaignOverview nav={nav} />
        <main className="canon-workspace-main campaign-flow-main">
          <header className="campaign-flow-heading">
            <div><p className="eyebrow"><GitMerge aria-hidden="true" size={12} /> Opening campaign · branch and convergence</p><h2>The island falls. The choice changes how you reach Arcadia.</h2></div>
            <p>The Last Days of Kestrel and The Evacuation are both fully played. They arrive at different places, carry different consequences, and rejoin only when the party finds Arcadia&apos;s Soul Forge and binds to it.</p>
          </header>
          {graph.arcs.length > 0 ? <CampaignFlow graph={graph} /> : <p className="story-inspector-hint">No campaign chapters have been built yet.</p>}
          <footer className="campaign-flow-law">
            <GitMerge aria-hidden="true" size={16} />
            <p><strong>Convergence keeps the cost.</strong> Rejoining the campaign never erases who survived, what crossed the water, where the party landed, or which road they chose.</p>
          </footer>
        </main>
      </div>
    </section>
  );
}
