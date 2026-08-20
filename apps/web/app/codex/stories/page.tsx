import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, GitBranch, Inbox, Lightbulb, Plus, Scale, Send, Sprout, History } from "lucide-react";
import { storyArcCategoryLabels, storyArcCategories, type StoryArcCategory } from "@habitat/shared";
import { hasRole, requireRole } from "@/lib/authorization";
import { getCanonInbox, getStoryReviewQueue, listStoryArcs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { StoryRoomGuide } from "@/components/story-room-guide";
import { ArcFields } from "@/components/story-arc-form";
import { createArc } from "@/app/codex/actions";

export const metadata = { title: "Stories & quests | Story Codex" };

/**
 * The stories room's front door.
 *
 * Everything about story used to live inline on the codex landing page — the
 * arc grids, the create form, the writers' room law, the links to threads and
 * promises — while the "Stories & quests" card pointed at an anchor on that
 * same page rather than anywhere. This is that page, and the two halves of the
 * work have their own doors: canon is what is settled, threads are what is
 * still being argued, and the road between them runs through the canon inbox.
 */
export default async function StoryHubPage() {
  await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [arcs, inbox, threads, rules, regions, characters, queue] = await Promise.all([
    listStoryArcs(),
    getCanonInbox(),
    listStoryEntries({ kind: "THREAD" }),
    listStoryEntries({ kind: "RULE" }),
    listStoryEntries({ kind: "REGION" }),
    listStoryEntries({ kind: "CHARACTER" }),
    canReview ? getStoryReviewQueue() : Promise.resolve(null),
  ]);

  const laws = rules.filter((rule) => rule.status === "CANON");
  const countOf = (category: StoryArcCategory) => arcs.filter((arc) => arc.category === category).length;
  const locked = arcs.filter((arc) => arc.locked).length;
  const shaped = storyArcCategories.filter((category) => countOf(category) > 0);
  const threadsWithPackets = threads.filter((thread) => {
    const packets = (thread.meta as Record<string, unknown> | null)?.canonPackets;
    return Array.isArray(packets) && packets.some((row) => typeof row === "object" && row !== null && (row as Record<string, unknown>).status === "pending");
  }).length;

  return (
    <section className="page-shell codex-shell codex-stories-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> Story codex</Link>
        <p className="eyebrow"><GitBranch aria-hidden="true" size={12} /> Martino — stories &amp; quests</p>
        <h1>Everything the party can live through</h1>
        <p>
          The main story, the side quests, the contracts posted around the map, each companion&apos;s own road, and everything
          that comes through the Veil. Settled story lives in <strong>canon</strong>; ideas still being argued live in
          <strong> threads</strong>, and travel across when the room stops arguing about them.
        </p>
        <Link className="primary-link story-open-shortcut" href="#open-a-story"><Plus aria-hidden="true" size={14} /> Open a new story</Link>
      </div>

      <StoryRoomGuide />

      <div className="codex-stories-hero">
        <Link className="codex-stories-card is-canon" href="/codex/stories/canon">
          <Compass aria-hidden="true" size={22} />
          <span>
            <small>{arcs.length} stor{arcs.length === 1 ? "y" : "ies"}{locked > 0 ? ` · ${locked} settled` : ""}</small>
            <strong>Canon</strong>
            <p>The whole settled story, navigable section by section — the campaign, the map, the companions, the incursions, the world events.</p>
            {shaped.length > 0 ? <em>{shaped.map((category) => `${countOf(category)} ${storyArcCategoryLabels[category].toLowerCase()}${countOf(category) === 1 ? "" : "s"}`).join(" · ")}</em> : <em>Nothing built yet — open the first story below.</em>}
          </span>
          {inbox.pending.total > 0 ? <b className="codex-stories-bubble">{inbox.pending.total}</b> : null}
          <ArrowRight aria-hidden="true" size={15} />
        </Link>

        <Link className="codex-stories-card is-threads" href="/codex/threads">
          <Lightbulb aria-hidden="true" size={22} />
          <span>
            <small>{threads.length} thread{threads.length === 1 ? "" : "s"}</small>
            <strong>Story threads</strong>
            <p>Where an idea gets argued into existence — proposed by a member, discussed in the open, and moved toward canon a piece at a time.</p>
            <em>{threadsWithPackets > 0
              ? `${threadsWithPackets} thread${threadsWithPackets === 1 ? " has" : "s have"} material waiting in the canon inbox.`
              : "Nothing is waiting to be woven in right now."}</em>
          </span>
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>

      <div className="codex-quicklinks">
        <Link className="codex-quicklink" href="/codex/promises"><Sprout aria-hidden="true" size={18} /><span><strong>Story promises</strong><small>Every promise a scene plants and where the story answers it, derived from the boards themselves.</small></span></Link>
        <Link className="codex-quicklink" href="/codex/timeline"><History aria-hidden="true" size={18} /><span><strong>The timeline</strong><small>Ten thousand years of the long hunt on one golden line — and where the present sits on it.</small></span></Link>
        {inbox.pending.total > 0 ? <Link className="codex-quicklink" href="/codex/stories/canon#canon-inbox"><Send aria-hidden="true" size={18} /><span><strong>The canon inbox</strong><small>{`${inbox.pending.total} settled piece${inbox.pending.total === 1 ? "" : "s"} waiting to be woven into a story board.`}</small></span></Link> : null}
        {/* The approval ladder is gone; the queue only resurfaces if legacy
            proposed material still exists somewhere. */}
        {canReview && queue && queue.total > 0 ? <Link className="codex-quicklink" href="/codex/review"><Inbox aria-hidden="true" size={18} /><span><strong>Review queue</strong><small>{`${queue.total} older contribution${queue.total === 1 ? "" : "s"} still marked proposed.`}</small></span></Link> : null}
      </div>

      <span aria-hidden="true" className="story-form-anchor" id="open-a-story" />
      <div className="codex-lower story-start-band">
        <form action={createArc} className="story-form codex-new-arc">
          <div className="story-start-heading">
            <p className="eyebrow"><Plus aria-hidden="true" size={12} /> Open a new story</p>
            <h2>Start with the spark.</h2>
            <p>Name it, choose what kind of story it is, and give the party a way in. The new board opens unlocked so the room can build its beats together.</p>
          </div>
          <ArcFields
            canReview={canReview}
            characters={characters.map((character) => ({ id: character.id, title: character.title }))}
            regions={regions.map((region) => ({ id: region.id, title: region.title }))}
            submitLabel="Open the board"
            threads={threads.map((thread) => ({ id: thread.id, title: thread.title }))}
          />
        </form>
      </div>

      {laws.length > 0 ? (
        <details className="codex-laws">
          <summary><Scale aria-hidden="true" size={12} /><span>Writers&apos; room law</span><b>{laws.length} binding rule{laws.length === 1 ? "" : "s"}</b></summary>
          <p className="codex-laws-intro">Read these before you write. They are the load-bearing rules every story contribution has to honor.</p>
          <ul>
            {laws.map((law) => (
              <li key={law.id}>
                <Link href={`/codex/bible/${law.slug}`}>{law.title}</Link>
                {law.summary ? <span>{law.summary}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} guide nodeId={null} />
    </section>
  );
}
