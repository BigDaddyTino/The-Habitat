"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Layers, MessageSquareText, Trash2 } from "lucide-react";
import { storyIdeaFacetBlurbs, storyIdeaFacetLabels, storyThreadCategoryLabels, storyStoryStageLabels, type StoryIdeaFacet, type StoryIdeaSection, type StoryThreadCategory, type StoryStoryStage } from "@habitat/shared";
import { addIdeaSection, removeIdeaSection } from "@/app/codex/ideas/actions";
import { ideaTabs } from "@/lib/story-ideas-pure";
import { StoryProse } from "@/components/story-prose";
import { FacetBadge } from "@/components/idea-badges";

/**
 * An idea, read in tabs: Overview always, then one tab per facet it touches.
 *
 * The overview is the proposer's whole idea and is never split up. A facet
 * tab holds the extra detail anybody added about that one aspect, each piece
 * carrying its author's name. "Read all" lays every tab out in a row for the
 * day an idea has grown into several pages and somebody wants to review it as
 * one document.
 *
 * The same component renders inside the gallery's pop-out (read-only — the
 * forms wait for the idea's own page) and on that page (interactive).
 */
export type IdeaDetailData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  facets: StoryIdeaFacet[];
  sections: StoryIdeaSection[];
  categories?: string[];
  stages?: string[];
  openQuestions?: string[];
  canonPacketCount?: number;
};

const resolve = (slug: string) => ({ title: slug.replaceAll("-", " "), href: `/codex/bible/${slug}` });

export function IdeaDetail({ idea, viewerId, interactive, initialTab = "overview" }: { idea: IdeaDetailData; viewerId: string; interactive: boolean; initialTab?: "overview" | StoryIdeaFacet }) {
  const tabs = useMemo(() => ideaTabs(idea.facets), [idea.facets]);
  const [tab, setTab] = useState<"overview" | StoryIdeaFacet | "all">(tabs.includes(initialTab) ? initialTab : "overview");
  const showing = (facet: "overview" | StoryIdeaFacet) => tab === "all" || tab === facet;
  const sectionsFor = (facet: StoryIdeaFacet) => idea.sections.filter((section) => section.facet === facet);

  return (
    <div className="idea-detail">
      <div className="idea-detail-tabs" role="tablist" aria-label="Parts of this idea">
        {tabs.map((item) => (
          <button aria-selected={tab === item} className={`idea-tab${tab === item ? " is-active" : ""}`} data-facet={item} key={item} onClick={() => setTab(item)} role="tab" type="button">
            {item === "overview" ? <><BookOpen aria-hidden="true" size={13} /> Overview</> : <><i aria-hidden="true" className="idea-tab-dot" data-facet={item} /> {storyIdeaFacetLabels[item]}{sectionsFor(item).length ? <em>{sectionsFor(item).length}</em> : null}</>}
          </button>
        ))}
        {tabs.length > 1 ? <button aria-selected={tab === "all"} className={`idea-tab is-all${tab === "all" ? " is-active" : ""}`} onClick={() => setTab("all")} role="tab" type="button"><Layers aria-hidden="true" size={13} /> Read all</button> : null}
      </div>

      {showing("overview") ? (
        <section className="idea-pane" data-facet="overview">
          {tab === "all" ? <h3 className="idea-pane-title">Overview</h3> : null}
          {idea.summary ? <p className="idea-lead">{idea.summary}</p> : null}
          {idea.body ? <div className="idea-prose"><StoryProse body={idea.body} resolve={resolve} /></div> : <p className="idea-empty">No write-up yet — just the name and a feeling. That counts.</p>}
        </section>
      ) : null}

      {idea.facets.map((facet) => showing(facet) ? (
        <section className="idea-pane" data-facet={facet} key={facet}>
          <h3 className="idea-pane-title"><FacetBadge facet={facet} /> {tab === "all" ? null : <span className="idea-pane-blurb">{storyIdeaFacetBlurbs[facet]}</span>}</h3>
          {tab === "all" ? <p className="idea-pane-blurb">{storyIdeaFacetBlurbs[facet]}</p> : null}

          {facet === "story" && (idea.categories?.length || idea.stages?.length || idea.openQuestions?.length || idea.canonPacketCount) ? (
            <div className="idea-story-facts">
              {idea.categories?.length ? <p><b>Kind of story:</b> {idea.categories.map((category) => (storyThreadCategoryLabels as Record<string, string>)[category as StoryThreadCategory] ?? category).join(" · ")}</p> : null}
              {idea.stages?.length ? <p><b>Where in the game:</b> {idea.stages.map((stage) => (storyStoryStageLabels as Record<string, string>)[stage as StoryStoryStage] ?? stage).join(" · ")}</p> : null}
              {idea.openQuestions?.length ? <div><b>Still open:</b><ul>{idea.openQuestions.map((question) => <li key={question}>{question}</li>)}</ul></div> : null}
              {idea.canonPacketCount ? <p><b>{idea.canonPacketCount}</b> piece{idea.canonPacketCount === 1 ? "" : "s"} of this already sent toward canon — see the <Link href={`/codex/bible/${idea.slug}`}>full story sheet</Link>.</p> : null}
            </div>
          ) : null}

          {sectionsFor(facet).length ? sectionsFor(facet).map((section) => (
            <article className="idea-section" key={section.id}>
              <header>
                <MessageSquareText aria-hidden="true" size={12} />
                <strong>{section.authorName}</strong>
                {section.at ? <time dateTime={section.at}>{new Date(section.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time> : null}
                {interactive && section.authorUserId === viewerId ? (
                  <form action={removeIdeaSection}><input name="entryId" type="hidden" value={idea.id} /><input name="sectionId" type="hidden" value={section.id} /><button className="idea-icon-button" title="Remove what you wrote" type="submit"><Trash2 aria-hidden="true" size={13} /></button></form>
                ) : null}
              </header>
              <div className="idea-prose"><StoryProse body={section.body} resolve={resolve} /></div>
            </article>
          )) : <p className="idea-empty">Nothing written under {storyIdeaFacetLabels[facet]} yet.</p>}

          {interactive ? (
            <form action={addIdeaSection} className="idea-section-form">
              <input name="entryId" type="hidden" value={idea.id} />
              <input name="facet" type="hidden" value={facet} />
              <label>Add to {storyIdeaFacetLabels[facet]}<textarea maxLength={6000} name="body" placeholder={storyIdeaFacetBlurbs[facet]} required rows={4} /></label>
              <button className="save-server" type="submit">Add it, with my name on it</button>
            </form>
          ) : <p className="idea-hint"><Link href={`/codex/ideas/${idea.slug}`}>Open the idea</Link> to add to this tab.</p>}
        </section>
      ) : null)}
    </div>
  );
}
