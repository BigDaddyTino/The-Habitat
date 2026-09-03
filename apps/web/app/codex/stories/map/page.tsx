import Link from "next/link";
import { ArrowLeft, GitMerge, MapPinned, TriangleAlert, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { getCampaignAtlas, getCanonNavigator, storyReadRole } from "@/lib/story-codex";
import { atlasHealth } from "@/lib/campaign-atlas";
import { storyArcCategoryLabels } from "@habitat/shared";
import { StoryLiveSync } from "@/components/story-live-sync";
import { CanonNavigator } from "@/components/canon-navigator";
import { CampaignAtlasMap } from "@/components/campaign-atlas-map";

export const metadata = { title: "The campaign map | Story Codex" };

/**
 * The whole campaign on one canvas: every mainline card from the first quest
 * down, every branch inside every chapter, the joins between chapters, and
 * each side board, contract and companion chain hung off the card it reaches.
 *
 * The chapter-level view at /codex/stories/campaign answers "which board
 * follows which". This answers the question underneath it — what the campaign
 * actually is, scene by scene, and what hangs off it — and it is honest about
 * the places where nothing has been wired yet.
 */
export default async function CampaignMapPage() {
  await requireRole(storyReadRole);
  const [atlas, nav] = await Promise.all([getCampaignAtlas(), getCanonNavigator()]);
  const health = atlasHealth(atlas);
  const titleOf = (slug: string) => [...atlas.spine, ...atlas.side].find((arc) => arc.slug === slug)?.title ?? slug;

  return (
    <section className="page-shell codex-shell codex-atlas-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <div className="page-intro">
        <Link className="codex-back" href="/codex/stories"><ArrowLeft aria-hidden="true" size={13} /> Stories</Link>
        <p className="eyebrow"><MapPinned aria-hidden="true" size={12} /> Martino · the campaign, scene by scene</p>
        <h1>One map, first quest to last</h1>
        <p>
          Every card of the main campaign on a single canvas, in the order it is played, with every branch
          inside each chapter and every board, contract and companion chain that spiders off it. Nothing here
          is drawn by hand: the lines come from the same endings, flags and conditions the game export reads,
          so this map and the boards cannot disagree. <b>It also shows what is missing.</b>
        </p>
      </div>

      <div className="canon-workspace">
        <CanonNavigator nav={nav} />
        <main className="canon-workspace-main atlas-main">
          <div className="atlas-counts">
            <div><b>{health.chapters}</b><span>chapters</span></div>
            <div><b>{health.cards}</b><span>cards</span></div>
            <div><b>{health.branches}</b><span>branches</span></div>
            <div><b>{health.handoffs}</b><span>handoffs</span></div>
            <div><b>{health.flagJoins}</b><span>flag joins</span></div>
            <div><b>{health.sideBoards}</b><span>boards off it</span></div>
            <div><b>{health.companions}</b><span>companion chains</span></div>
            <div className={health.gaps > 0 ? "is-gap" : undefined}><b>{health.gaps}</b><span>unwired</span></div>
          </div>

          {health.gaps > 0 ? (
            <div className="atlas-gaps">
              <p className="eyebrow"><TriangleAlert aria-hidden="true" size={12} /> Chapters nothing connects</p>
              <p>
                These sit next to each other in the campaign order and no ending, flag or condition joins them.
                Not an error — an unfinished road, and the map refuses to draw one that is not there.
              </p>
              <ul>{health.gapLabels.map((gap) => {
                const [from, to] = gap.split(" → ");
                return <li key={gap}>
                  <Link href={`/codex/arc/${from}`}>{titleOf(from ?? "")}</Link>
                  <i>→</i>
                  <Link href={`/codex/arc/${to}`}>{titleOf(to ?? "")}</Link>
                </li>;
              })}</ul>
            </div>
          ) : null}

          {atlas.nodes.length > 0
            ? <CampaignAtlasMap atlas={atlas} />
            : <p className="story-inspector-hint">No mainline chapters have been built yet.</p>}

          <div className="atlas-tables">
            <section>
              <p className="eyebrow"><GitMerge aria-hidden="true" size={12} /> What spiders off the campaign · {atlas.side.length}</p>
              {atlas.side.length ? <ul className="atlas-list">{atlas.side.map((arc) => (
                <li key={arc.slug}>
                  <Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{storyArcCategoryLabels[arc.category].toLowerCase()}</i></Link>
                  {arc.summary ? <p>{arc.summary}</p> : null}
                </li>
              ))}</ul> : <p className="story-inspector-hint">Nothing outside the mainline reaches it yet.</p>}
            </section>

            <section>
              <p className="eyebrow"><UsersRound aria-hidden="true" size={12} /> Companion chains · {atlas.companions.length}</p>
              {atlas.companions.length ? <ul className="atlas-list">{atlas.companions.map((companion) => (
                <li key={companion.slug}>
                  <Link href={`/codex/bible/${companion.slug}`}><strong>{companion.title}</strong><i>{companion.missions.length} missions</i></Link>
                  <p>First named on <Link href={`/codex/arc/${companion.atArc}?node=${companion.atNode}`}>{companion.namedOn[0]?.nodeTitle ?? titleOf(companion.atArc)}</Link>{companion.namedOn.length > 1 ? `, and on ${companion.namedOn.length - 1} card${companion.namedOn.length === 2 ? "" : "s"} after it` : ""}. The chain runs on its own clock from wherever they actually join.</p>
                </li>
              ))}</ul> : <p className="story-inspector-hint">No mainline card recruits anybody yet.</p>}
            </section>

            {atlas.orphans.length ? (
              <section className="atlas-orphans">
                <p className="eyebrow"><TriangleAlert aria-hidden="true" size={12} /> Boards nothing reaches · {atlas.orphans.length}</p>
                <p className="story-inspector-hint">Written, playable, and connected to nothing the campaign passes through. Set a flag in one and read it in another, or point an ending at it.</p>
                <ul className="atlas-list">{atlas.orphans.map((arc) => (
                  <li key={arc.slug}><Link href={`/codex/arc/${arc.slug}`}><strong>{arc.title}</strong><i>{storyArcCategoryLabels[arc.category].toLowerCase()}</i></Link></li>
                ))}</ul>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </section>
  );
}
