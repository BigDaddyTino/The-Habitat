import Link from "next/link";
import { ArrowLeft, CircleDot, Flag, Link2Off, Sprout } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { getStoryPromises, storyReadRole } from "@/lib/story-codex";
import { plainStoryProse } from "@/lib/story-prose";
import { StoryLiveSync } from "@/components/story-live-sync";

export const metadata = { title: "Story promises" };

/**
 * The ledger of every promise the story has made. Derived entirely from the
 * canonical flag slugs appearing in effects and conditions — nobody maintains
 * this page, which is the only way a list like this stays true as the world
 * grows past what anyone can hold in their head.
 */
export default async function StoryPromisesPage() {
  await requireRole(storyReadRole);
  const ledger = await getStoryPromises();

  const sections = [
    {
      state: "planted" as const,
      title: "Planted — waiting for a payoff",
      hint: "The story sets these and never looks at them again. Every one is an open promise: write the scene that checks it, or know that you owe one.",
      icon: Sprout,
    },
    {
      state: "unset" as const,
      title: "Payoff without a setup",
      hint: "Something checks these, but nothing ever sets them — the payoff can never fire. Usually a renamed flag or a scene that was cut.",
      icon: Link2Off,
    },
    {
      state: "dormant" as const,
      title: "Dormant — nothing touches them yet",
      hint: "The flag exists in the bible but no scene sets or checks it. Fine while it waits for its chapter.",
      icon: CircleDot,
    },
    {
      state: "wired" as const,
      title: "Wired — set and answered",
      hint: "Planted somewhere, checked somewhere else. These promises are working.",
      icon: Flag,
    },
  ];

  return (
    <section className="page-shell codex-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> Story codex</Link>
        <p className="eyebrow">Martino — story promises</p>
        <h1>Every promise the story has made</h1>
        <p>
          A promise is a flag: one quest sets it, another answers it — sometimes chapters apart. This page derives all of them from the
          scenes and choices themselves, so nothing has to be remembered by anyone. <strong>{ledger.planted} planted and waiting</strong>,
          {" "}{ledger.wired} wired, {ledger.dormant} dormant{ledger.unset > 0 ? <>, <strong>{ledger.unset} broken</strong></> : null}.
        </p>
      </div>

      {ledger.threads.length === 0 ? (
        <div className="empty-data"><Flag aria-hidden="true" size={24} /><div><h2>No promises yet.</h2><p>Create a FLAG entry in the bible and set it from a scene&apos;s effects — it will appear here with everywhere it&apos;s touched.</p></div></div>
      ) : (
        sections.map((section) => {
          const threads = ledger.threads.filter((thread) => thread.state === section.state);
          if (threads.length === 0) return null;
          const Icon = section.icon;
          return (
            <div className="codex-section" key={section.state}>
              <div className="section-heading"><h2><Icon aria-hidden="true" size={20} /> {section.title}</h2></div>
              <p className="thread-section-hint">{section.hint}</p>
              <div className="thread-list">
                {threads.map((thread) => (
                  <article className={`thread-card is-${thread.state}`} key={thread.slug}>
                    <header>
                      <Link href={`/codex/bible/${thread.slug}`}>{thread.title}</Link>
                      <span className={`audit-chip tone-${thread.state === "wired" ? "added" : thread.state === "unset" ? "removed" : thread.state === "planted" ? "edited" : "linked"}`}>
                        {thread.state === "planted" ? "waiting for payoff" : thread.state === "unset" ? "no setup" : thread.state}
                      </span>
                    </header>
                    {thread.summary ? <p className="thread-summary">{plainStoryProse(thread.summary)}</p> : null}
                    <div className="thread-sites">
                      <div>
                        <p className="eyebrow">Set at</p>
                        {thread.setAt.length === 0 ? <p className="story-inspector-hint">Nowhere — nothing plants this.</p> : (
                          <ul>{thread.setAt.map((site, index) => (
                            <li key={index}><Link href={`/codex/arc/${site.arcSlug}?node=${site.nodeId}`}>{site.label}</Link><span>{site.detail} · {site.arcTitle}</span></li>
                          ))}</ul>
                        )}
                      </div>
                      <div>
                        <p className="eyebrow">Answered at</p>
                        {thread.checkedAt.length === 0 ? <p className="story-inspector-hint">Nowhere yet — this is the open end.</p> : (
                          <ul>{thread.checkedAt.map((site, index) => (
                            <li key={index}><Link href={`/codex/arc/${site.arcSlug}?node=${site.nodeId}`}>{site.label}</Link><span>{site.detail} · {site.arcTitle}</span></li>
                          ))}</ul>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })
      )}

      <p className="thread-footnote">
        To open a new promise: add a FLAG entry in <Link href="/codex/bible">the bible</Link>, then write <code>set flag: its-slug</code> in the effects of the scene or choice
        that plants it. To pay one off: name the slug in a choice&apos;s condition where the story answers it. This page picks both up on its own.
      </p>
    </section>
  );
}
