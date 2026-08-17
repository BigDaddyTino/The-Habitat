import Link from "next/link";
import { BookOpen, GitBranch, Inbox, Plus } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { hasRole } from "@/lib/authorization";
import { getStoryActivity, getStoryReviewQueue, listStoryArcs, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { createArc } from "./actions";

export const metadata = { title: "Story Codex" };

function shortDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function CodexPage() {
  await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [arcs, activity, queue] = await Promise.all([listStoryArcs(), getStoryActivity(24), canReview ? getStoryReviewQueue() : Promise.resolve(null)]);
  const mainline = arcs.filter((arc) => arc.isMainline);
  const side = arcs.filter((arc) => !arc.isMainline);

  return (
    <section className="page-shell codex-shell codex-landing-shell">
      <StoryLiveSync />
      <div className="codex-landing-hero">
        <div className="page-intro">
        <p className="eyebrow">Martino — story codex</p>
        <h1>Where the story gets built</h1>
        <p>Every arc is a board of scenes and the choices between them. Write freely: what you add is marked proposed until it is reviewed, and only canon reaches the game.</p>
        </div>
        <p className="codex-hero-caption"><span>Private writers&apos; room</span><strong>Draft together. Guard the canon.</strong></p>
      </div>

      <div className="codex-quicklinks">
        <Link className="codex-quicklink" href="/codex/bible"><BookOpen aria-hidden="true" size={18} /><span><strong>The bible</strong><small>Theme, regions, creatures, characters — read this before you write.</small></span></Link>
        {canReview && queue ? <Link className="codex-quicklink" href="/codex/review"><Inbox aria-hidden="true" size={18} /><span><strong>Review queue</strong><small>{queue.total === 0 ? "Nothing waiting." : `${queue.total} contribution${queue.total === 1 ? "" : "s"} waiting on you.`}</small></span></Link> : null}
      </div>

      {[{ title: "The mainline", arcs: mainline }, { title: "Side quests", arcs: side }].map((group) => (
        <div className="codex-section" key={group.title}>
          <div className="section-heading"><h2>{group.title}</h2></div>
          {group.arcs.length === 0 ? (
            <div className="empty-data"><GitBranch aria-hidden="true" size={24} /><div><h2>No arcs yet.</h2><p>Open one below and start dropping scenes onto its board.</p></div></div>
          ) : (
            <div className="codex-arc-grid">
              {group.arcs.map((arc) => (
                <Link className={`codex-arc-card status-${arc.status.toLowerCase()}`} href={`/codex/arc/${arc.slug}`} key={arc.id}>
                  <p className="eyebrow">{arc.status === "CANON" ? "Canon" : arc.status === "PROPOSED" ? "Proposed" : "Draft"}</p>
                  <h3>{arc.title}</h3>
                  {arc.summary ? <p className="codex-arc-summary">{arc.summary}</p> : null}
                  <footer><span>{arc.nodeCount} node{arc.nodeCount === 1 ? "" : "s"}</span><span>{arc.canonNodeCount} canon</span><span>by {arc.author}</span></footer>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="codex-lower">
        <form action={createArc} className="story-form codex-new-arc">
          <p className="eyebrow"><Plus aria-hidden="true" size={12} /> Open a new arc</p>
          <label>Title<input maxLength={120} name="title" placeholder="The drowned chapel" required type="text" /></label>
          <label>Summary<textarea maxLength={500} name="summary" placeholder="What is this chapter or side quest about?" rows={3} /></label>
          {canReview ? <label className="enabled-toggle"><input name="isMainline" type="checkbox" /> Part of the mainline</label> : null}
          <button className="save-server" type="submit">Open arc</button>
        </form>

        <div className="codex-activity">
          <div className="panel-heading"><h2>Recent work</h2></div>
          {activity.length === 0 ? <p className="story-inspector-hint">Nothing has been written yet.</p> : (
            <ul className="chronicle-list">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <time>{shortDate(entry.createdAt)}</time>
                  <span className="chronicle-symbol" />
                  <p><strong>{entry.actor}</strong> {entry.summary.toLowerCase()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
