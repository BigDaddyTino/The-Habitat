import Link from "next/link";
import { ArrowRight, BookOpen, GitBranch, Inbox, Map, Plus, Scale, Shield, Sparkles, Sprout, UsersRound } from "lucide-react";
import { hasRole, requireRole } from "@/lib/authorization";
import { getStoryActivity, getStoryReviewQueue, getStoryThreads, listStoryArcs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { createArc } from "./actions";

export const metadata = { title: "Story Codex" };

function auditStamp(value: Date) {
  return value.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * The color language of the audit log: green for what arrived, yellow for
 * what changed, red for what left. With the approval ladder gone, this list
 * is how the crew keeps each other honest.
 */
function auditTone(action: string, statusTo: string | null): { label: string; tone: "added" | "edited" | "removed" | "linked" } {
  if (action === "CREATED") return { label: "added", tone: "added" };
  if (action === "UPDATED") return { label: "edited", tone: "edited" };
  if (action === "DELETED") return { label: "removed", tone: "removed" };
  if (action === "LINKED") return { label: "linked", tone: "linked" };
  if (action === "UNLINKED") return { label: "unlinked", tone: "linked" };
  if (action === "STATUS_CHANGED") {
    if (statusTo === "CANON") return { label: "made canon", tone: "added" };
    if (statusTo === "ARCHIVED") return { label: "archived", tone: "removed" };
    if (statusTo === "REJECTED") return { label: "rejected", tone: "removed" };
    return { label: "status changed", tone: "edited" };
  }
  return { label: action.toLowerCase().replace(/_/g, " "), tone: "edited" };
}

export default async function CodexPage() {
  await requireRole(storyReadRole);
  const canReview = await hasRole("ADMIN");
  const [arcs, activity, queue, rules, regions, themes, characters, factions, threads] = await Promise.all([
    listStoryArcs(), getStoryActivity(50), canReview ? getStoryReviewQueue() : Promise.resolve(null),
    listStoryEntries({ kind: "RULE" }), listStoryEntries({ kind: "REGION" }), listStoryEntries({ kind: "THEME" }),
    listStoryEntries({ kind: "CHARACTER" }), listStoryEntries({ kind: "FACTION" }), getStoryThreads(),
  ]);
  const mainline = arcs.filter((arc) => arc.isMainline);
  const side = arcs.filter((arc) => !arc.isMainline);
  const laws = rules.filter((rule) => rule.status === "CANON");

  return (
    <section className="page-shell codex-shell codex-landing-shell">
      <StoryLiveSync />
      <div className="codex-landing-hero">
        <div className="page-intro">
        <p className="eyebrow">Martino — the story compass</p>
        <h1>A war over magic.<br /><em>Something beneath it.</em></h1>
        <p>MARTINO is a dark near-future fantasy about a war fueled by harvested magic. Borrowed power saves lives and corrupts the people who wield it, while something older and more patient moves beneath a conflict neither army truly understands.</p>
        </div>
        <p className="codex-hero-caption"><span>What every writer protects</span><strong>Power has a price. The war is not the whole story.</strong></p>
      </div>

      <section className="codex-story-compass">
        <div className="codex-compass-heading"><div><p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> Start here</p><h2>The game in three truths</h2></div><p>Every character, place, faction, and quest should pull on at least one of these. Open a truth to read the full canon before you build.</p></div>
        <div className="codex-theme-grid">
          {themes.map((theme, index) => <Link href={`/codex/bible/${theme.slug}`} key={theme.id}><span>0{index + 1}</span><div><p className="eyebrow">Core theme</p><h3>{theme.title}</h3><p>{theme.summary}</p><strong>Read the canon <ArrowRight aria-hidden="true" size={12} /></strong></div></Link>)}
        </div>
      </section>

      <section className="codex-world-libraries">
        <div className="section-heading"><div><p className="eyebrow">Build the world</p><h2>Choose what you want to shape</h2></div><p>No JSON. Open a visual library, create an entry, and fill out its connected sheet.</p></div>
        <div>
          <Link href="/codex/library/characters"><UsersRound aria-hidden="true" /><span><small>{characters.length} characters</small><strong>Characters</strong><p>Voice, relationships, factions, quests, and game models.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/codex/library/factions"><Shield aria-hidden="true" /><span><small>{factions.length} factions</small><strong>Factions</strong><p>Leadership, territory, goals, allies, enemies, and influence.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/codex/library/regions"><Map aria-hidden="true" /><span><small>{regions.length} regions</small><strong>Regions</strong><p>World hierarchy, control, travel connections, and game tags.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="#stories"><GitBranch aria-hidden="true" /><span><small>{arcs.length} arcs</small><strong>Stories &amp; quests</strong><p>Scene flow, decisions, consequences, rewards, and endings.</p></span><ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="codex-quicklinks">
        <Link className="codex-quicklink" href="/codex/bible"><BookOpen aria-hidden="true" size={18} /><span><strong>All lore</strong><small>Creatures, items, events, rules, flags, and every world entry in one searchable archive.</small></span></Link>
        <Link className="codex-quicklink" href="/codex/threads"><Sprout aria-hidden="true" size={18} /><span><strong>Story threads</strong><small>{threads.planted > 0 ? `${threads.planted} promise${threads.planted === 1 ? "" : "s"} planted and waiting for a payoff.` : threads.threads.length > 0 ? "Every promise the story has made, and where it stands." : "Set a flag in one scene, answer it chapters later — tracked here."}</small></span></Link>
        {/* The approval ladder is gone; the queue only resurfaces if legacy
            proposed material still exists somewhere. */}
        {canReview && queue && queue.total > 0 ? <Link className="codex-quicklink" href="/codex/review"><Inbox aria-hidden="true" size={18} /><span><strong>Review queue</strong><small>{`${queue.total} older contribution${queue.total === 1 ? "" : "s"} still marked proposed.`}</small></span></Link> : null}
      </div>

      {laws.length > 0 ? (
        <div className="codex-laws">
          <p className="eyebrow"><Scale aria-hidden="true" size={12} /> Writers&apos; room law — read before you write, binding on every contribution</p>
          <ul>
            {laws.map((law) => (
              <li key={law.id}>
                <Link href={`/codex/bible/${law.slug}`}>{law.title}</Link>
                {law.summary ? <span>{law.summary}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {[{ title: "The mainline", arcs: mainline }, { title: "Side quests", arcs: side }].map((group) => (
        <div className="codex-section" id={group.title === "The mainline" ? "stories" : undefined} key={group.title}>
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
                  <footer><span>{arc.nodeCount} scene{arc.nodeCount === 1 ? "" : "s"}</span><span>by {arc.author}</span><span className="codex-arc-open">Read the story →</span></footer>
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
          <label>Picked up in<select defaultValue="" name="regionEntryId">
            <option value="">No particular place</option>
            {regions.map((region) => <option key={region.id} value={region.id}>{region.title}</option>)}
          </select></label>
          <label>Hook — how the party finds it<textarea maxLength={500} name="hook" placeholder="A notice board. A dying stranger. A rumor nobody should repeat." rows={2} /></label>
          {canReview ? <label className="enabled-toggle"><input name="isMainline" type="checkbox" /> Part of the mainline</label> : null}
          <button className="save-server" type="submit">Open arc</button>
        </form>
      </div>

      <div className="codex-audit">
        <div className="section-heading"><h2>The audit log</h2></div>
        <p className="codex-audit-intro">Everything anyone changed, newest first. <span className="audit-chip tone-added">added</span> <span className="audit-chip tone-edited">edited</span> <span className="audit-chip tone-removed">removed</span> <span className="audit-chip tone-linked">linked</span></p>
        {activity.length === 0 ? <p className="story-inspector-hint">Nothing has been written yet.</p> : (
          <ul className="codex-audit-list">
            {activity.map((entry) => {
              const { label, tone } = auditTone(entry.action, entry.statusTo);
              return (
                <li key={entry.id}>
                  <time>{auditStamp(entry.createdAt)}</time>
                  <span className={`audit-chip tone-${tone}`}>{label}</span>
                  <p><strong>{entry.actor}</strong> {entry.summary.toLowerCase()}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
