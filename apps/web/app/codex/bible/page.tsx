import Link from "next/link";
import { ArrowLeft, BookOpen, Hammer } from "lucide-react";
import { storyEntryKindLabels, storyEntryKinds, type StoryEntryKind } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { getStoryNeedsWork, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { plainStoryProse } from "@/lib/story-prose";
import { StoryLiveSync } from "@/components/story-live-sync";
import { createEntry } from "@/app/codex/actions";
import { storyCollections } from "@/lib/story-library";

export const metadata = { title: "Story bible" };

export default async function StoryBiblePage({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string }> }) {
  await requireRole(storyReadRole);
  const filters = await searchParams;
  const kind = storyEntryKinds.includes(filters.kind as StoryEntryKind) ? (filters.kind as StoryEntryKind) : undefined;
  const search = filters.q?.trim() || undefined;
  const [entries, needsWork] = await Promise.all([listStoryEntries({ kind, search }), getStoryNeedsWork()]);

  return (
    <section className="page-shell codex-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex"><ArrowLeft aria-hidden="true" size={13} /> Story codex</Link>
        <p className="eyebrow">Martino — the bible</p>
        <h1>What is already true</h1>
        <p>The theme, the places, the creatures, the people, and the rules the world runs on. Read the entries that touch your quest before you write it, and add anything you invent so the next writer finds it here.</p>
      </div>

      <div className="codex-library-shortcuts" aria-label="Lore libraries">
        {Object.entries(storyCollections).map(([slug, collection]) => <Link href={`/codex/library/${slug}`} key={slug}><span>{collection.label}</span><small>{collection.description}</small></Link>)}
      </div>

      <form className="codex-bible-filters" method="get">
        <input aria-label="Search the bible" defaultValue={search ?? ""} name="q" placeholder="Search entries" type="search" />
        <select aria-label="Filter by kind" defaultValue={kind ?? ""} name="kind">
          <option value="">Everything</option>
          {storyEntryKinds.map((option) => <option key={option} value={option}>{storyEntryKindLabels[option]}</option>)}
        </select>
        <button className="save-server" type="submit">Filter</button>
      </form>

      {entries.length === 0 ? (
        <div className="empty-data"><BookOpen aria-hidden="true" size={24} /><div><h2>Nothing here yet.</h2><p>{search || kind ? "No entry matches that." : "Write the first entry below — start with the theme, so everyone builds on the same ground."}</p></div></div>
      ) : (
        <div className="codex-bible-grid">
          {entries.map((entry) => (
            <Link className={`codex-bible-card status-${entry.status.toLowerCase()}`} href={`/codex/bible/${entry.slug}`} key={entry.id}>
              <p className="eyebrow">{storyEntryKindLabels[entry.kind]}</p>
              <h3>{entry.title}</h3>
              {entry.summary ? <p>{plainStoryProse(entry.summary)}</p> : null}
              <footer><span>{entry.status === "CANON" ? "Canon" : entry.status === "PROPOSED" ? "Proposed" : "Draft"}</span><span>{entry.appearanceCount} appearance{entry.appearanceCount === 1 ? "" : "s"}</span></footer>
            </Link>
          ))}
        </div>
      )}

      {needsWork.total > 0 ? (
        <details className="codex-problems codex-needs-work">
          <summary><Hammer aria-hidden="true" size={14} /> Needs work — {needsWork.total} unanswered corner{needsWork.total === 1 ? "" : "s"} of the world</summary>
          <div className="codex-needs-work-body">
            {needsWork.openQuestions.length > 0 ? <>
              <p className="eyebrow">Open questions</p>
              <ul>{needsWork.openQuestions.slice(0, 30).map((item, index) => <li key={`q-${index}`}><Link href={`/codex/bible/${item.slug}`}>{item.title}</Link> — {item.question}</li>)}</ul>
            </> : null}
            {needsWork.unresolvedLinks.length > 0 ? <>
              <p className="eyebrow">Links waiting for an entry — claim one and write it</p>
              <ul>{needsWork.unresolvedLinks.slice(0, 30).map((item, index) => <li key={`l-${index}`}><Link href={`/codex/bible/${item.slug}`}>{item.title}</Link> links <code>[[{item.target}]]</code>, which nobody has written yet</li>)}</ul>
            </> : null}
            {needsWork.planned.length > 0 ? <>
              <p className="eyebrow">Planned but not written yet — sheets pointing at future work</p>
              <ul>{needsWork.planned.slice(0, 30).map((item, index) => <li key={`p-${index}`}><Link href={`/codex/bible/${item.slug}`}>{item.title}</Link> names <code>{item.target}</code> as {item.field === "involvement" ? "an arc they belong in" : `a ${item.field}`}, and it does not exist yet</li>)}</ul>
            </> : null}
            {needsWork.unconnected.length > 0 ? <>
              <p className="eyebrow">Floating free — nothing links these to the world, and they link to nothing</p>
              <ul>{needsWork.unconnected.slice(0, 30).map((item) => <li key={`u-${item.slug}`}><Link href={`/codex/bible/${item.slug}`}>{item.title}</Link> <span>{storyEntryKindLabels[item.kind].toLowerCase()}</span> — open it and connect it: a [[link]], a sheet field, or a scene reference</li>)}</ul>
            </> : null}
            {needsWork.missingMeta.length > 0 ? <>
              <p className="eyebrow">No sheet filled in yet</p>
              <ul>{needsWork.missingMeta.slice(0, 40).map((item) => <li key={item.slug}><Link href={`/codex/bible/${item.slug}`}>{item.title}</Link> <span>{storyEntryKindLabels[item.kind].toLowerCase()}</span></li>)}</ul>
            </> : null}
          </div>
        </details>
      ) : null}

      <form action={createEntry} className="story-form codex-new-entry">
        <p className="eyebrow">Add an entry</p>
        <label>Kind<select defaultValue="CHARACTER" name="kind">{storyEntryKinds.map((option) => <option key={option} value={option}>{storyEntryKindLabels[option]}</option>)}</select></label>
        <label>Title<input maxLength={120} name="title" placeholder="Ashwarden of the Low Fen" required type="text" /></label>
        <label>Summary<textarea maxLength={500} name="summary" placeholder="One line somebody can read at a glance." rows={2} /></label>
        <label>Detail<textarea maxLength={20000} name="body" placeholder="Everything a writer needs: how it behaves, what it wants, what it must never do." rows={8} /></label>
        <button className="save-server" type="submit">Add to the bible</button>
      </form>
    </section>
  );
}
