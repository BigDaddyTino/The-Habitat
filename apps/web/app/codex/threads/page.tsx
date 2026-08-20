import Link from "next/link";
import { ArrowLeft, ArrowRight, Flag, Lightbulb, MessagesSquare, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import {
  isUnconfirmedThreadStatus,
  storyStoryStageLabels,
  storyStoryStages,
  storyThreadCategories,
  storyThreadCategoryLabels,
  storyThreadStatusLabels,
  storyThreadStatuses,
  type StoryStoryStage,
  type StoryThreadCategory,
  type StoryThreadStatus,
} from "@habitat/shared";
import { createEntry } from "@/app/codex/actions";
import { requireRole } from "@/lib/authorization";
import { listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { plainStoryProse } from "@/lib/story-prose";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";

export const metadata = { title: "Story threads | Story Codex" };

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []);

/**
 * The narrative development room: where major story concepts get proposed,
 * argued over, revised, and eventually approved or rejected — without ever
 * losing who proposed them or the discussion around them. A thread here is
 * NOT the flag ledger (that lives at /codex/promises now); it is an evolving
 * idea — an arc, a mystery, a boss, an ending — statused from brainstorming
 * to implemented, and loudly marked as unconfirmed until the room decides.
 */
export default async function StoryThreadsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; stage?: string; character?: string; by?: string; tag?: string }> }) {
  await requireRole(storyReadRole);
  const filters = await searchParams;
  const q = filters.q?.trim() || undefined;
  const [threads, everything] = await Promise.all([
    listStoryEntries({ kind: "THREAD", search: q }),
    listStoryEntries({}),
  ]);
  const titles = new Map(everything.map((entry) => [entry.slug, entry.title]));
  const characters = everything.filter((entry) => entry.kind === "CHARACTER");
  const locations = everything.filter((entry) => entry.kind === "REGION");

  const metaOf = (thread: (typeof threads)[number]) => thread.meta ?? {};
  const statusOf = (thread: (typeof threads)[number]): StoryThreadStatus | null => {
    const value = metaOf(thread).threadStatus;
    return (storyThreadStatuses as readonly unknown[]).includes(value) ? (value as StoryThreadStatus) : null;
  };

  // Every filter is a plain query param, so a filtered view is a shareable URL.
  const wantStatus = (storyThreadStatuses as readonly string[]).includes(filters.status ?? "") ? (filters.status as StoryThreadStatus) : null;
  const wantCategory = (storyThreadCategories as readonly string[]).includes(filters.category ?? "") ? (filters.category as StoryThreadCategory) : null;
  const wantStage = (storyStoryStages as readonly string[]).includes(filters.stage ?? "") ? (filters.stage as StoryStoryStage) : null;
  const wantCharacter = filters.character?.trim() || null;
  const wantBy = filters.by?.trim() || null;
  const wantTag = filters.tag?.trim().toLowerCase() || null;

  const shown = threads.filter((thread) => {
    const meta = metaOf(thread);
    if (wantStatus && statusOf(thread) !== wantStatus) return false;
    if (wantCategory && !strings(meta.categories).includes(wantCategory)) return false;
    if (wantStage && !strings(meta.stages).includes(wantStage)) return false;
    if (wantCharacter && !strings(meta.characters).includes(wantCharacter) && !strings(meta.companions).includes(wantCharacter)) return false;
    if (wantBy && thread.author !== wantBy) return false;
    if (wantTag && !strings(meta.tags).some((tag) => tag.toLowerCase() === wantTag)) return false;
    return true;
  });

  const filtering = Boolean(q || wantStatus || wantCategory || wantStage || wantCharacter || wantBy || wantTag);
  const submitters = [...new Set(threads.map((thread) => thread.author))].sort();
  const parents = [...threads].sort((a, b) => a.title.localeCompare(b.title));
  const childrenOf = new Map<string, number>();
  for (const thread of threads) {
    const parent = typeof metaOf(thread).parent === "string" ? String(metaOf(thread).parent) : null;
    if (parent) childrenOf.set(parent, (childrenOf.get(parent) ?? 0) + 1);
  }
  const unconfirmed = threads.filter((thread) => isUnconfirmedThreadStatus(statusOf(thread))).length;

  return (
    <section className="page-shell codex-shell codex-threads-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex/stories"><ArrowLeft aria-hidden="true" size={13} /> Stories &amp; quests</Link>
        <p className="eyebrow"><Lightbulb aria-hidden="true" size={12} /> Martino — story threads</p>
        <h1>Where the story gets argued into existence</h1>
        <p>
          A thread is an evolving narrative concept — an arc, a mystery, a betrayal, a boss, an ending — proposed by a member,
          discussed in the open, and moved from <strong>brainstorming</strong> toward <strong>approved</strong> or <strong>rejected</strong>{" "}
          without losing who proposed it or the argument around it. {unconfirmed > 0 ? <strong>{unconfirmed} of {threads.length} {threads.length === 1 ? "is" : "are"} still unconfirmed — brainstorming, not canon.</strong> : null}{" "}
          The flag ledger this page used to hold lives at <Link href="/codex/promises">story promises</Link>.
        </p>
      </div>

      <div className="thread-board-toolbar">
        <form method="get">
          <div className="thread-board-search"><Search aria-hidden="true" size={15} /><input aria-label="Search story threads" defaultValue={q ?? ""} name="q" placeholder="Search title, summary, and narrative…" type="search" /></div>
          <select aria-label="Filter by status" defaultValue={wantStatus ?? ""} name="status"><option value="">Any status</option>{storyThreadStatuses.map((status) => <option key={status} value={status}>{storyThreadStatusLabels[status]}</option>)}</select>
          <select aria-label="Filter by category" defaultValue={wantCategory ?? ""} name="category"><option value="">Any category</option>{storyThreadCategories.map((category) => <option key={category} value={category}>{storyThreadCategoryLabels[category]}</option>)}</select>
          <select aria-label="Filter by story stage" defaultValue={wantStage ?? ""} name="stage"><option value="">Any stage</option>{storyStoryStages.map((stage) => <option key={stage} value={stage}>{storyStoryStageLabels[stage]}</option>)}</select>
          <select aria-label="Filter by character" defaultValue={wantCharacter ?? ""} name="character"><option value="">Any character</option>{characters.map((character) => <option key={character.slug} value={character.slug}>{character.title}</option>)}</select>
          <select aria-label="Filter by who proposed it" defaultValue={wantBy ?? ""} name="by"><option value="">Anyone</option>{submitters.map((name) => <option key={name} value={name}>{name}</option>)}</select>
          <input aria-label="Filter by tag" defaultValue={filters.tag ?? ""} maxLength={40} name="tag" placeholder="tag" type="text" />
          <button className="save-server" type="submit">Filter</button>
          {filtering ? <Link className="thread-board-clear" href="/codex/threads">Clear</Link> : null}
        </form>
      </div>

      {shown.length === 0 ? (
        <div className="empty-data"><MessagesSquare aria-hidden="true" size={24} /><div><h2>{filtering ? "No thread matches that." : "No story threads yet."}</h2><p>{filtering ? "Loosen a filter, or propose the thread that is missing." : "Propose the first one below — it lands as brainstorming, visibly unconfirmed, ready to be argued over."}</p></div></div>
      ) : (
        <div className="thread-board-grid">
          {shown.map((thread) => {
            const meta = metaOf(thread);
            const status = statusOf(thread);
            const categories = strings(meta.categories).filter((value): value is StoryThreadCategory => (storyThreadCategories as readonly string[]).includes(value));
            const stages = strings(meta.stages).filter((value): value is StoryStoryStage => (storyStoryStages as readonly string[]).includes(value));
            const cast = [...new Set([...strings(meta.characters), ...strings(meta.companions)])];
            const tags = strings(meta.tags);
            const parent = typeof meta.parent === "string" && meta.parent ? meta.parent : null;
            const children = childrenOf.get(thread.slug) ?? 0;
            return (
              <article className={`thread-board-card status-${status ?? "unstatused"}${isUnconfirmedThreadStatus(status) ? " is-unconfirmed" : ""}`} key={thread.id}>
                <header>
                  <span className={`thread-status-badge tone-${status ?? "unstatused"}`}>{status ? storyThreadStatusLabels[status] : "No status yet"}</span>
                  {isUnconfirmedThreadStatus(status) ? <span className="thread-unconfirmed-mark" title="This is a proposal under development — not confirmed canon.">not canon</span> : null}
                </header>
                <h2><Link href={`/codex/bible/${thread.slug}`}>{thread.title}</Link></h2>
                {categories.length || stages.length ? <p className="thread-board-taxonomy">
                  {categories.map((category) => <span className="thread-chip is-category" key={category}>{storyThreadCategoryLabels[category]}</span>)}
                  {stages.map((stage) => <span className="thread-chip is-stage" key={stage}>{storyStoryStageLabels[stage]}</span>)}
                </p> : null}
                <p className="thread-board-summary">{thread.summary ? plainStoryProse(thread.summary) : "No summary yet — open it and give the room the one-line pitch."}</p>
                {cast.length ? <p className="thread-board-cast"><UsersRound aria-hidden="true" size={11} />
                  {cast.slice(0, 5).map((slug) => <Link href={`/codex/bible/${slug}`} key={slug}>{titles.get(slug) ?? slug.replaceAll("-", " ")}</Link>)}
                  {cast.length > 5 ? <span>+{cast.length - 5} more</span> : null}
                </p> : null}
                {tags.length ? <p className="thread-board-tags">{tags.map((tag) => <Link href={`/codex/threads?tag=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</p> : null}
                <footer>
                  <span>Submitted by <strong>{thread.author}</strong></span>
                  <span>{thread.commentCount} comment{thread.commentCount === 1 ? "" : "s"}</span>
                  <span>updated {thread.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  {parent ? <span className="thread-lineage">grew out of <Link href={`/codex/bible/${parent}`}>{titles.get(parent) ?? parent.replaceAll("-", " ")}</Link></span> : null}
                  {children > 0 ? <span className="thread-lineage">{children} child thread{children === 1 ? "" : "s"}</span> : null}
                  <Link className="thread-board-open" href={`/codex/bible/${thread.slug}`}>Open <ArrowRight aria-hidden="true" size={11} /></Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <details className="entity-create-panel" id="new-thread" open={threads.length === 0 && !filtering}>
        <summary><Plus aria-hidden="true" size={15} /><span>
          <strong>Propose a story thread</strong>
          <small>It lands as brainstorming — visibly unconfirmed — with your name on it. The room takes it from there.</small>
        </span></summary>
        <form action={createEntry} className="story-form">
          <input name="kind" type="hidden" value="THREAD" />
          <label>Title<input maxLength={120} name="title" placeholder="The Empty Cribs" required type="text" /></label>
          <label>One-line pitch<textarea maxLength={500} name="summary" placeholder="What is this concept, in a sentence the whole room can argue about?" rows={2} /></label>
          <label>The concept<textarea maxLength={20000} name="body" placeholder="Write it all down — the idea, the beats, the open questions. Mark what is TBD. Nothing here is canon until the room says so." rows={8} /></label>
          <div className="thread-create-taxonomy">
            <fieldset><legend>Categories</legend>{storyThreadCategories.map((category) => <label key={category}><input name="categories" type="checkbox" value={category} /> {storyThreadCategoryLabels[category]}</label>)}</fieldset>
            <fieldset><legend>Story stages it touches</legend>{storyStoryStages.map((stage) => <label key={stage}><input name="stages" type="checkbox" value={stage} /> {storyStoryStageLabels[stage]}</label>)}</fieldset>
          </div>
          <div className="sheet-grid">
            <label>Who is it about?<select multiple name="characters" size={4}>
              {characters.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select>
            <small className="sheet-hint">Hold Ctrl (or ⌘) to pick more than one. You can add the rest later.</small></label>
            <label>Where does it happen?<select multiple name="locations" size={4}>
              {locations.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select>
            <small className="sheet-hint">Everywhere the idea touches — the thread shows up on each of those pages.</small></label>
          </div>
          {parents.length ? <label>Grew out of which thread<select defaultValue="" name="parent">
            <option value="">Nothing — a top-level thread</option>
            {parents.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select></label> : null}
          <button className="save-server" type="submit"><Sparkles aria-hidden="true" size={14} /> Propose it</button>
        </form>
      </details>

      <p className="thread-footnote">
        <Flag aria-hidden="true" size={12} /> Looking for the flag ledger — every promise a scene plants and where the story answers it?
        That lives at <Link href="/codex/promises">story promises</Link> now.
      </p>

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
