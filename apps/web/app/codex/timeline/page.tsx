/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, CircleHelp, History, MapPin, Plus, Scale, Shield, Sparkles, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { getEventArt, eventArtSlot } from "@/lib/event-art";
import { findCodexArt } from "@/lib/codex-art";
import { arrangeTimeline, timelineEraLabel } from "@/lib/story-timeline";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import type { StoryEntryKind } from "@habitat/shared";

export const metadata = { title: "The Timeline | Story Codex" };

const asStrings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((row): row is string => typeof row === "string" && row.trim().length > 0) : []);

/**
 * The history of the world as one golden line, oldest at the top, the present
 * at the bottom — the writers' room reading of [[the-long-hunt]]. Cards branch
 * alternately off the spine; events with key art render as major moments.
 *
 * The line is EVENT entries wearing a `timelineYearsAgo` anchor, so adding to
 * history is just writing an event and dating it on its sheet — everything
 * else (editing, archiving, revisions, export) is the codex's ordinary law.
 */
export default async function StoryTimelinePage() {
  await requireRole(storyReadRole);
  const [events, everything] = await Promise.all([listStoryEntries({ kind: "EVENT" }), listStoryEntries({})]);
  const titles = new Map(everything.map((entry) => [entry.slug, { title: entry.title, kind: entry.kind }]));
  const { dated, undated } = arrangeTimeline(events);
  // The archive mural, when somebody has drawn one, sits behind the hero.
  const mural = findCodexArt("timeline", "timeline-archive-mural");

  const chip = (slug: string) => {
    const known = titles.get(slug);
    return { slug, title: known?.title ?? slug.replaceAll("-", " "), kind: known?.kind ?? null, exists: Boolean(known) };
  };
  const chipIcon = (kind: StoryEntryKind | null) =>
    kind === "REGION" ? <MapPin aria-hidden="true" size={10} /> : kind === "FACTION" ? <Shield aria-hidden="true" size={10} /> : kind === "CHARACTER" ? <UsersRound aria-hidden="true" size={10} /> : <Sparkles aria-hidden="true" size={10} />;

  return (
    <section className="page-shell codex-shell codex-timeline-shell">
      <StoryLiveSync />
      <header
        className={`codex-timeline-hero${mural ? " has-mural" : ""}`}
        style={mural ? ({ "--timeline-mural": `url('${mural}')` } as React.CSSProperties) : undefined}
      >
        <div>
          <p className="eyebrow"><History aria-hidden="true" size={12} /> The long hunt</p>
          <h1>How the world got this way</h1>
          <blockquote>
            <Scale aria-hidden="true" size={16} />
            <p>
              Man has hunted magic for nearly ten thousand years. He has only known how to consume it faster than the world can
              replace it for about a century. <Link href="/codex/bible/the-long-hunt">Read the law</Link> — and remember: canon never
              answers whether humanity caused the collapse. Factions answer.
            </p>
          </blockquote>
          <div className="entity-directory-actions">
            <Link className="primary-link" href="/codex/library/events#new-entry"><Plus aria-hidden="true" size={14} /> Add to history</Link>
            <span>{dated.length} placed · {undated.length} outside the count</span>
          </div>
        </div>
      </header>

      <ol className="codex-timeline-rail">
        {dated.map((event, index) => {
          const meta = event.meta ?? {};
          const art = getEventArt(event.slug);
          const places = asStrings(meta.where).map(chip);
          const involved = asStrings(meta.involved).map(chip);
          const era = typeof meta.when === "string" && meta.when.trim() ? meta.when.trim() : timelineEraLabel(event.yearsAgo);
          return (
            <li className={`codex-timeline-entry ${index % 2 === 0 ? "is-left" : "is-right"}${art ? " is-major" : ""}`} key={event.id}>
              <span aria-hidden="true" className="codex-timeline-node" />
              <article className="codex-timeline-card">
                {art ? <Link className="codex-timeline-art" href={`/codex/bible/${event.slug}`}><img alt={`${event.title} key art`} src={art} /></Link> : null}
                <p className="codex-timeline-era">{era}</p>
                <h2><Link href={`/codex/bible/${event.slug}`}>{event.title}</Link></h2>
                <p className="codex-timeline-summary">{event.summary ?? "No summary yet — open the dossier and give this moment its one line."}</p>
                {places.length || involved.length ? (
                  <p className="codex-timeline-chips">
                    {places.map((place) => place.exists
                      ? <Link href={`/codex/bible/${place.slug}`} key={`w-${place.slug}`}>{chipIcon(place.kind)}{place.title}</Link>
                      : <span className="is-missing" key={`w-${place.slug}`} title="This entry does not exist yet">{chipIcon(null)}{place.title}</span>)}
                    {involved.map((party) => party.exists
                      ? <Link href={`/codex/bible/${party.slug}`} key={`i-${party.slug}`}>{chipIcon(party.kind)}{party.title}</Link>
                      : <span className="is-missing" key={`i-${party.slug}`} title="This entry does not exist yet">{chipIcon(null)}{party.title}</span>)}
                  </p>
                ) : null}
                <Link className="codex-timeline-open" href={`/codex/bible/${event.slug}`}>Open the dossier <ArrowRight aria-hidden="true" size={11} /></Link>
              </article>
            </li>
          );
        })}
        <li className="codex-timeline-now"><span aria-hidden="true" className="codex-timeline-node is-now" /><p>Now — <Link href="/codex/bible/the-drain">the Drain</Link>, and whatever the party does about it</p></li>
      </ol>

      {undated.length > 0 ? (
        <section className="codex-timeline-undated">
          <div>
            <p className="eyebrow"><CircleHelp aria-hidden="true" size={12} /> Outside the count</p>
            <p>
              History the timeline cannot place. Sometimes that is a sheet nobody has dated — open it and set the years — and
              sometimes the unknown age <em>is</em> the canon, and it belongs exactly here.
            </p>
          </div>
          <ul>
            {undated.map((event) => (
              <li key={event.id}>
                <Link href={`/codex/bible/${event.slug}`}>
                  <strong>{event.title}</strong>
                  <span>{typeof event.meta?.when === "string" && event.meta.when ? String(event.meta.when) : "undated"}</span>
                  <ArrowRight aria-hidden="true" size={11} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="story-inspector-hint codex-timeline-hint">
        Major moments carry key art: drop an image at <code>images/timeline/&lt;slug&gt;.png</code> — for example{" "}
        <code>{eventArtSlot("the-great-purges")}</code> — and that event grows into a major card on the next load.
      </p>

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
