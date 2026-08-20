import Link from "next/link";
import { ArrowRight, CircleDot, Compass, Flame, History, Lock, MapPin, UsersRound } from "lucide-react";
import { storyArcCategoryLabels } from "@habitat/shared";
import type { CanonNavArc, StoryCanonNavigator } from "@/lib/story-codex";

const inboxHref = (target: string) => `/codex/stories/canon?target=${encodeURIComponent(target)}#canon-inbox`;

/** Canon material waiting for one section, linking straight into the inbox. */
function Bubble({ count, target, what }: { count: number; target: string; what: string }) {
  if (count < 1) return null;
  return <Link aria-label={`${count} piece${count === 1 ? "" : "s"} of canon material waiting for ${what}`} className="canon-nav-badge" href={inboxHref(target)}>{count}</Link>;
}

function ArcLink({ arc, current }: { arc: CanonNavArc; current: string | null }) {
  return (
    <Link
      className={`canon-nav-arc${arc.slug === current ? " is-current" : ""}${arc.locked ? " is-locked" : ""}`}
      href={`/codex/arc/${arc.slug}`}
      title={arc.locked ? `${arc.title} — settled and locked` : arc.title}
    >
      {arc.locked ? <Lock aria-hidden="true" size={10} /> : null}
      <span>{arc.title}</span>
      <i>{arc.nodeCount}</i>
    </Link>
  );
}

/**
 * The navigator down the left of every canon surface: the settled story as one
 * tree, in the order a reader looks for things — the campaign spine first,
 * then the map, then the companions, then what comes through and what happens
 * to the world.
 *
 * A server component with no client JavaScript at all. It renders on every arc
 * page, so a component that shipped a hydration bundle would put that cost on
 * the surface writers keep open all day. The mobile drawer is a plain
 * `<details>`; the summary is hidden by CSS on wide screens, where the sidebar
 * is simply always open.
 *
 * Counted bubbles are canon material still waiting in the inbox. They deep-link
 * into the inbox filtered to that destination, which is the whole point of
 * showing them here: a writer sees where work is waiting on the same map they
 * use to navigate.
 */
function NavigatorTree({ nav, currentArcSlug }: { nav: StoryCanonNavigator; currentArcSlug: string | null }) {
  return (
    <nav aria-label="Canon navigator">
        <section>
          <p className="eyebrow"><CircleDot aria-hidden="true" size={11} /> The campaign<Bubble count={nav.pending.campaign} target="campaign" what="the main story" /></p>
          {nav.campaign.length > 0
            ? <ul>{nav.campaign.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul>
            : <p className="canon-nav-empty">No chapters yet. <Link href="/codex/stories#open-a-story">Open the first chapter →</Link></p>}
        </section>

        {/* The heavy rule: above it is the spine, below it is everything the
            spine passes through. */}
        <hr className="canon-nav-divider" />

        <section>
          <p className="eyebrow"><MapPin aria-hidden="true" size={11} /> The map</p>
          {nav.regions.length > 0 ? (
            <ul className="canon-nav-tree">
              {nav.regions.map((region) => (
                <li className={`depth-${Math.min(region.depth, 3)}`} key={region.slug}>
                  <p className="canon-nav-place">
                    <Link href={`/codex/bible/${region.slug}`}>{region.title}</Link>
                    <Bubble count={region.pendingPackets} target={`region:${region.slug}`} what={region.title} />
                  </p>
                  {region.sideQuests.length > 0 ? <ul>{region.sideQuests.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul> : null}
                  {region.contracts.length > 0 ? (
                    <>
                      <p className="canon-nav-eyebrow">Contracts</p>
                      <ul>{region.contracts.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : <p className="canon-nav-empty">No quest is filed to a place yet. <Link href="/codex/stories#open-a-story">Post the first one →</Link></p>}

          {nav.unfiled.length > 0 ? (
            <>
              <p className="canon-nav-eyebrow">Not filed anywhere yet</p>
              <ul>{nav.unfiled.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul>
            </>
          ) : null}
        </section>

        <section>
          <p className="eyebrow"><UsersRound aria-hidden="true" size={11} /> The companions</p>
          {nav.companions.length > 0 ? nav.companions.map((companion) => (
            <div className="canon-nav-companion" key={companion.slug || "unfiled"}>
              <p className="canon-nav-place">
                {companion.slug
                  ? <Link href={`/codex/bible/${companion.slug}`}>{companion.title}</Link>
                  : <span>{companion.title}</span>}
                <Bubble count={companion.pendingPackets} target={companion.slug ? `companion:${companion.slug}` : "companions"} what={companion.title} />
              </p>
              {companion.chain.length > 0 ? (
                <ul>{companion.chain.map((step) => (
                  <li key={step.missionSlug}>
                    {step.arc
                      ? <ArcLink arc={step.arc} current={currentArcSlug} />
                      // Written down but not built. It links to the mission
                      // dossier, where the writing lives, and reads as planned
                      // rather than pretending to be a board.
                      : <Link className="canon-nav-arc is-planned" href={`/codex/bible/${step.missionSlug}`} title={`${step.title} — written down, no board yet`}>
                          <span>{step.title}</span>
                          <i>planned</i>
                        </Link>}
                  </li>
                ))}</ul>
              ) : null}
              {companion.looseArcs.length > 0 ? <ul>{companion.looseArcs.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul> : null}
            </div>
          )) : <p className="canon-nav-empty">No companion has a quest yet. <Link href="/codex/stories#open-a-story">Give one their own story →</Link></p>}
        </section>

        <section>
          <p className="eyebrow"><Flame aria-hidden="true" size={11} /> Incursions<Bubble count={nav.pending.incursions} target="incursions" what="incursions" /></p>
          {nav.incursions.length > 0
            ? <ul>{nav.incursions.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul>
            : <p className="canon-nav-empty">Nothing has come through yet. <Link href="/codex/stories#open-a-story">Open the first incursion →</Link></p>}
        </section>

        <section>
          <p className="eyebrow"><History aria-hidden="true" size={11} /> World events<Bubble count={nav.pending.events} target="events" what="world events" /></p>
          {nav.events.length > 0
            ? <ul>{nav.events.map((arc) => <li key={arc.slug}><ArcLink arc={arc} current={currentArcSlug} /></li>)}</ul>
            : <p className="canon-nav-empty">Nothing happens to the world on its own yet. <Link href="/codex/stories#open-a-story">Write the first world event →</Link></p>}
          <p className="canon-nav-timeline"><Link href="/codex/timeline">Deep history — the timeline <ArrowRight aria-hidden="true" size={11} /></Link></p>
        </section>
    </nav>
  );
}

export function CanonNavigator({ nav, currentArcSlug = null }: { nav: StoryCanonNavigator; currentArcSlug?: string | null }) {
  return (
    <>
      <aside className="canon-nav canon-nav-desktop"><NavigatorTree currentArcSlug={currentArcSlug} nav={nav} /></aside>
      <details className="canon-nav canon-nav-mobile">
        <summary><Compass aria-hidden="true" size={14} /> The story, section by section</summary>
        <NavigatorTree currentArcSlug={currentArcSlug} nav={nav} />
      </details>
    </>
  );
}

/** The label a category wears wherever a board is listed outside its section. */
export function arcCategoryLabel(arc: Pick<CanonNavArc, "category">) {
  return storyArcCategoryLabels[arc.category];
}
