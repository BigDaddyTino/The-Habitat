import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Renders a line of codex prose that carries `[[slug]]` references.
 *
 * The dossier renderer turns those into links on entry bodies; anywhere else
 * that prints the same strings — a boss page, a panel, a card — used to have
 * to strip them, and stripping is what put a literal "[[adaptive-mutation]]"
 * on a live page and lower-cased every proper noun beside it. This does the
 * one correct thing instead: a real link, with the name spelled properly.
 *
 * `[[slug|label]]` is deliberately NOT supported. The codex has no piped-link
 * syntax and never has — writing one renders as literal text in a dossier and
 * is invisible to the unwritten-link audit, so it fails silently twice.
 */

const reference = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g;

/** Slugs are kebab; entries are proper nouns. "elias-vey" → "Elias Vey". */
export function codexSlugLabel(slug: string) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function CodexProse({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(reference)) {
    const at = match.index ?? 0;
    if (at > cursor) parts.push(text.slice(cursor, at));
    const slug = match[1]!;
    parts.push(<Link key={`${slug}-${at}`} className="codex-ref" href={`/codex/bible/${slug}`}>{codexSlugLabel(slug)}</Link>);
    cursor = at + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}
