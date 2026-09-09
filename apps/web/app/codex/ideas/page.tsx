import Link from "next/link";
import { ArrowLeft, Bookmark, Grid2x2, Lightbulb, List, Plus, Search, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { storyIdeaFacetBlurbs, storyIdeaFacetColors, storyIdeaFacetLabels, storyIdeaFacets, storyIdeaStageLabels, storyThreadStatuses, type StoryIdeaFacet, type StoryThreadStatus } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";
import { listIdeaProposers, listIdeas } from "@/lib/story-ideas";
import { IdeaGallery } from "@/components/idea-gallery";
import { StoryLiveSync } from "@/components/story-live-sync";

export const metadata = { title: "Idea Center | Story Codex" };

type Params = { q?: string; facet?: string; stage?: string; by?: string; tab?: string; view?: string; tag?: string; idea?: string; error?: string };

/**
 * The Idea Center: one room where anybody in the family puts an idea down —
 * story, systems, models, regions, characters, or several at once — and finds
 * it again. An idea is a thread entry underneath; the old Story Threads board
 * is one facet of this one, and its machinery (statuses, canon packets, the
 * connection web) is unchanged behind the new front door.
 */
export default async function IdeaCenterPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireRole(storyReadRole);
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const facet = (storyIdeaFacets as readonly string[]).includes(params.facet ?? "") ? (params.facet as StoryIdeaFacet) : null;
  const stage = (storyThreadStatuses as readonly string[]).includes(params.stage ?? "") ? (params.stage as StoryThreadStatus) : null;
  const tab = params.tab === "mine" || params.tab === "saved" ? params.tab : "all";
  const view = params.view === "list" ? "list" : "grid";
  const by = params.by?.trim() || null;
  const tag = params.tag?.trim() || null;

  const [ideas, proposers] = await Promise.all([
    listIdeas(user.id, { search: q, facet, status: stage, by, tag, mine: tab === "mine", saved: tab === "saved" }),
    listIdeaProposers(),
  ]);
  const filtering = Boolean(q || facet || stage || by || tag);

  // Every filter is a plain query param, so a view is a shareable URL.
  const href = (patch: Partial<Params>) => {
    const next = new URLSearchParams();
    const merged: Params = { q, facet: facet ?? undefined, stage: stage ?? undefined, by: by ?? undefined, tab, view, tag: tag ?? undefined, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value && !(key === "tab" && value === "all") && !(key === "view" && value === "grid")) next.set(key, value);
    const query = next.toString();
    return `/codex/ideas${query ? `?${query}` : ""}`;
  };

  return (
    <section className="page-shell codex-shell codex-ideas-shell">
      <StoryLiveSync refreshOnHeartbeat />
      <div className="page-intro">
        <Link className="codex-back" href="/codex/stories"><ArrowLeft aria-hidden="true" size={13} /> Stories &amp; quests</Link>
        <p className="eyebrow"><Lightbulb aria-hidden="true" size={12} /> Martino · the Idea Center</p>
        <h1>Every idea, in one room</h1>
        <p>
          Put an idea down before it gets away — a scene, a system, a creature, a place, a person, or all of them at once.
          Say what kind of thing it is, and it gets a tab for each. Nothing here is canon until the room says so; everything here
          keeps the name of whoever thought of it.
        </p>
        <a className="idea-new-cta" href="#new-idea"><Plus aria-hidden="true" size={15} /> New idea</a>
      </div>

      {params.error ? <p className="idea-error" role="alert"><TriangleAlert aria-hidden="true" size={14} /> {params.error}</p> : null}

      <div className="idea-toolbar">
        <nav aria-label="Whose ideas" className="idea-tabs">
          <Link aria-current={tab === "all" ? "page" : undefined} href={href({ tab: "all" })}>All ideas</Link>
          <Link aria-current={tab === "mine" ? "page" : undefined} href={href({ tab: "mine" })}><UserRound aria-hidden="true" size={12} /> My ideas</Link>
          <Link aria-current={tab === "saved" ? "page" : undefined} href={href({ tab: "saved" })}><Bookmark aria-hidden="true" size={12} /> Saved</Link>
        </nav>
        <form className="idea-search" method="get">
          {facet ? <input name="facet" type="hidden" value={facet} /> : null}
          {stage ? <input name="stage" type="hidden" value={stage} /> : null}
          {tab !== "all" ? <input name="tab" type="hidden" value={tab} /> : null}
          {view !== "grid" ? <input name="view" type="hidden" value={view} /> : null}
          <Search aria-hidden="true" size={14} />
          <input aria-label="Search ideas" defaultValue={q ?? ""} name="q" placeholder="Search ideas…" type="search" />
        </form>
        <div className="idea-view-toggle" role="group" aria-label="Layout">
          <Link aria-current={view === "grid" ? "page" : undefined} href={href({ view: "grid" })} title="Cards"><Grid2x2 aria-hidden="true" size={14} /></Link>
          <Link aria-current={view === "list" ? "page" : undefined} href={href({ view: "list" })} title="List"><List aria-hidden="true" size={14} /></Link>
        </div>
      </div>

      <div className="idea-filters">
        <div className="idea-facet-filter" role="group" aria-label="Kind of idea">
          <Link aria-current={!facet ? "page" : undefined} className="idea-chip" href={href({ facet: undefined })}>Everything</Link>
          {storyIdeaFacets.map((item) => (
            <Link aria-current={facet === item ? "page" : undefined} className="idea-chip" data-facet={item} href={href({ facet: facet === item ? undefined : item })} key={item} style={{ ["--facet" as string]: storyIdeaFacetColors[item] }}>
              <i aria-hidden="true" />{storyIdeaFacetLabels[item]}
            </Link>
          ))}
        </div>
        <details className="idea-more-filters">
          <summary>More filters{stage || by || tag ? <b> · on</b> : null}</summary>
          <form className="idea-more-filters-form" method="get">
            {facet ? <input name="facet" type="hidden" value={facet} /> : null}
            {q ? <input name="q" type="hidden" value={q} /> : null}
            {tab !== "all" ? <input name="tab" type="hidden" value={tab} /> : null}
            {view !== "grid" ? <input name="view" type="hidden" value={view} /> : null}
            <label>Stage<select defaultValue={stage ?? ""} name="stage"><option value="">Any stage</option>{storyThreadStatuses.map((status) => <option key={status} value={status}>{storyIdeaStageLabels[status]}</option>)}</select></label>
            <label>Proposed by<select defaultValue={by ?? ""} name="by"><option value="">Anyone</option>{proposers.map((person) => <option key={person.id} value={person.username ?? person.name}>{person.name}</option>)}</select></label>
            <label>Tag<input defaultValue={tag ?? ""} maxLength={40} name="tag" placeholder="#tag" type="text" /></label>
            <button className="save-server" type="submit">Apply</button>
            {filtering ? <Link className="idea-clear" href="/codex/ideas">Clear all</Link> : null}
          </form>
        </details>
      </div>

      <p className="idea-count">
        {ideas.length} idea{ideas.length === 1 ? "" : "s"}{filtering ? " match" : ""}{tab === "mine" ? " of yours" : tab === "saved" ? " saved" : ""}.
        {tab === "all" && !filtering ? " Newest change first. Click a card to read it here; open it for the discussion and the pictures." : ""}
      </p>

      {ideas.length === 0 ? (
        <div className="empty-data"><Lightbulb aria-hidden="true" size={24} /><div>
          <h2>{filtering ? "Nothing matches that." : tab === "saved" ? "Nothing saved yet." : tab === "mine" ? "You have not put an idea down yet." : "The room is empty."}</h2>
          <p>{filtering ? "Loosen a filter, or write the idea that is missing." : tab === "saved" ? "The bookmark on any card saves it here." : "Start with a name. Everything else is optional."}</p>
        </div></div>
      ) : <IdeaGallery ideas={ideas} openSlug={params.idea?.trim() || null} view={view} viewerId={user.id} />}

      <details className="idea-new" id="new-idea" open={Boolean(params.error) || (ideas.length === 0 && tab === "all" && !filtering)}>
        <summary><Plus aria-hidden="true" size={15} /><span><strong>New idea</strong><small>Give it a name. Everything else is optional, and it lands with your name on it.</small></span></summary>
        <form action="/api/codex/ideas" className="story-form idea-new-form" encType="multipart/form-data" method="post">
          <label>Give it a name<input autoComplete="off" maxLength={120} name="title" placeholder="The traveling market" required type="text" /></label>
          <label>One line, if you have one<input maxLength={500} name="summary" placeholder="A market that is never in the same place twice." type="text" /></label>
          <label>Tell us about it<textarea maxLength={20000} name="body" placeholder="Write as much or as little as you like. Not sure yet is a fine place to start." rows={7} /></label>
          <fieldset className="idea-facet-picker">
            <legend>What does it touch? <small>Pick any. Each one becomes a tab on the idea.</small></legend>
            {storyIdeaFacets.map((item) => (
              <label className="idea-facet-option" data-facet={item} key={item} style={{ ["--facet" as string]: storyIdeaFacetColors[item] }}>
                <input name="facets" type="checkbox" value={item} />
                <span><strong>{storyIdeaFacetLabels[item]}</strong><small>{storyIdeaFacetBlurbs[item]}</small></span>
              </label>
            ))}
          </fieldset>
          <label className="idea-files">Pictures and files <small>Drawings, references, PDFs, notes. Up to ten, 20 MB each. Optional.</small>
            <input accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,.md,.txt" multiple name="files" type="file" />
          </label>
          <button className="save-server" type="submit"><Sparkles aria-hidden="true" size={14} /> Put it in the room</button>
        </form>
      </details>

      <p className="idea-footnote">
        Story Threads live here now — every story idea is a thread, and its full sheet (status, canon packets, the connection web) is one click from its page.
        Settled pieces still travel to the <Link href="/codex/stories/canon">canon inbox</Link> the same way.
      </p>
    </section>
  );
}
