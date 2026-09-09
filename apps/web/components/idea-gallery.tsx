"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, ImageIcon, MessageSquareText, Paperclip, X } from "lucide-react";
import { toggleIdeaBookmark } from "@/app/codex/ideas/actions";
import type { IdeaCard } from "@/lib/story-ideas";
import { FacetBadges, MemberAvatar, StageChip } from "@/components/idea-badges";
import { IdeaDetail } from "@/components/idea-detail";

/**
 * The gallery: every idea the same size, three across on a wide screen, two
 * on a small one, one on a phone — and a list view for the day there are
 * hundreds. A two-sentence thought and a thirty-page proposal take the same
 * room here; the idea itself lives behind the card.
 *
 * Clicking a card opens it in a pop-out beside the gallery (full-screen on a
 * phone) with the Overview and one tab per facet. The URL follows along
 * (`?idea=slug`), so a pop-out can be shared and survives a refresh, and the
 * idea's own page is one click away for anything that needs a form.
 */
export function IdeaGallery({ ideas, viewerId, view, openSlug }: { ideas: IdeaCard[]; viewerId: string; view: "grid" | "list"; openSlug: string | null }) {
  const [open, setOpen] = useState<string | null>(openSlug);
  const current = useMemo(() => ideas.find((idea) => idea.slug === open) ?? null, [ideas, open]);

  const show = useCallback((slug: string | null) => {
    setOpen(slug);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("idea", slug); else url.searchParams.delete("idea");
    window.history.replaceState(null, "", url.toString());
  }, []);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") show(null); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [current, show]);

  // A click on a link or a button inside the card does its own thing; a click
  // anywhere else on the card opens the pop-out.
  const onCardClick = (slug: string) => (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, form, input, textarea")) return;
    show(slug);
  };

  return (
    <>
      <div className={view === "list" ? "idea-list" : "idea-grid"}>
        {ideas.map((idea) => (
          <article className={`idea-card${view === "list" ? " is-list" : ""}${idea.cover ? " has-cover" : ""}`} key={idea.id} onClick={onCardClick(idea.slug)} onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) show(idea.slug); }} tabIndex={0}>
            {idea.cover && view === "grid" ? <img alt={idea.cover.caption ?? ""} className="idea-cover" loading="lazy" src={`${idea.cover.url}`} /> : null}
            <div className="idea-card-body">
              <header className="idea-card-head">
                <FacetBadges facets={idea.facets} small />
                <StageChip status={idea.status} />
              </header>
              <h3><Link href={`/codex/ideas/${idea.slug}`}>{idea.title}</Link></h3>
              <p className="idea-card-preview">{idea.preview || "No write-up yet."}</p>
              <footer className="idea-card-foot">
                <span className="idea-card-by"><MemberAvatar image={idea.proposer.image} name={idea.proposer.name} size={20} /> {idea.proposer.name}</span>
                <span className="idea-card-counts">
                  {idea.commentCount ? <i title={`${idea.commentCount} note${idea.commentCount === 1 ? "" : "s"}`}><MessageSquareText aria-hidden="true" size={12} /> {idea.commentCount}</i> : null}
                  {idea.attachmentCount ? <i title={`${idea.attachmentCount} attachment${idea.attachmentCount === 1 ? "" : "s"}`}>{idea.cover ? <ImageIcon aria-hidden="true" size={12} /> : <Paperclip aria-hidden="true" size={12} />} {idea.attachmentCount}</i> : null}
                  <form action={toggleIdeaBookmark}>
                    <input name="entryId" type="hidden" value={idea.id} />
                    <button aria-pressed={idea.bookmarked} className={`idea-icon-button is-bookmark${idea.bookmarked ? " is-on" : ""}`} title={idea.bookmarked ? "Saved — click to unsave" : "Save this idea"} type="submit">
                      {idea.bookmarked ? <BookmarkCheck aria-hidden="true" size={14} /> : <Bookmark aria-hidden="true" size={14} />}
                    </button>
                  </form>
                </span>
              </footer>
            </div>
          </article>
        ))}
      </div>

      {current ? (
        <div className="idea-drawer-backdrop" onClick={() => show(null)} role="presentation">
          <aside aria-label={current.title} aria-modal="true" className="idea-drawer" onClick={(event) => event.stopPropagation()} role="dialog">
            <header className="idea-drawer-head">
              <div>
                <p className="idea-drawer-kicker"><FacetBadges facets={current.facets} max={5} small /> <StageChip status={current.status} /></p>
                <h2>{current.title}</h2>
                <p className="idea-drawer-by"><MemberAvatar image={current.proposer.image} name={current.proposer.name} size={20} /> Proposed by <strong>{current.proposer.name}</strong> · {current.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <button aria-label="Close" className="idea-icon-button is-close" onClick={() => show(null)} type="button"><X aria-hidden="true" size={18} /></button>
            </header>
            {current.cover ? <img alt={current.cover.caption ?? ""} className="idea-drawer-cover" src={current.cover.url} /> : null}
            <IdeaDetail idea={current} interactive={false} viewerId={viewerId} />
            <footer className="idea-drawer-foot">
              <Link className="save-server" href={`/codex/ideas/${current.slug}`}>Open the full page <ArrowUpRight aria-hidden="true" size={13} /></Link>
              <span>{current.commentCount} note{current.commentCount === 1 ? "" : "s"} · {current.attachmentCount} attachment{current.attachmentCount === 1 ? "" : "s"}</span>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
