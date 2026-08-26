/**
 * The tiny markup the writers' room actually uses in codex prose.
 *
 * Bodies were rendered as raw text, so `**bold**` showed its asterisks and
 * `[[some-entry]]` sat there as punctuation instead of a link — which meant the
 * cross-references the whole codex is built on were the one thing you could not
 * click. This parses the three marks that appear in real entries and nothing
 * else: no HTML, no arbitrary markdown, no `dangerouslySetInnerHTML` anywhere
 * downstream. Anything unrecognised stays literal text, which is the safe way
 * to be wrong.
 *
 * Nesting is deliberate: `**a [[link]] inside bold**` is common in canon, so
 * bold and italic carry parsed children rather than a flat string.
 */

export type ProseToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: ProseToken[] }
  | { kind: "italic"; children: ProseToken[] }
  | { kind: "link"; slug: string; elideLeadingThe: boolean };

// Order matters: the link form is tried first, then bold, then italic — so the
// two asterisks of `**` can never be eaten by the single-asterisk rule.
//
// Scanned with matchAll rather than exec. This function recurses into bold and
// italic contents, and a shared /g regex driven by exec carries `lastIndex`
// across calls — the inner call rewinds it and the outer loop rescans the same
// match forever. matchAll iterates over its own clone, so recursion is safe.
const MARKUP = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;

const ARTICLE_BEFORE_LINK = /(?:^|[\s(])(?:a|an|the)\s+$/i;

function tokenText(tokens: ProseToken[]): string {
  return tokens.map((token) =>
    token.kind === "text" ? token.text
      : token.kind === "link" ? unwrittenLinkLabel(token.slug)
      : tokenText(token.children)).join("");
}

function parseWithPrefix(input: string, prefix: string): ProseToken[] {
  const tokens: ProseToken[] = [];
  let cursor = 0;

  for (const match of input.matchAll(MARKUP)) {
    const at = match.index ?? 0;
    if (at > cursor) tokens.push({ kind: "text", text: input.slice(cursor, at) });
    const [, slug, bold, italic] = match;
    const precedingText = prefix + tokenText(tokens);
    if (slug !== undefined) tokens.push({ kind: "link", slug, elideLeadingThe: ARTICLE_BEFORE_LINK.test(precedingText) });
    else if (bold !== undefined) tokens.push({ kind: "bold", children: parseWithPrefix(bold, precedingText) });
    else if (italic !== undefined) tokens.push({ kind: "italic", children: parseWithPrefix(italic, precedingText) });
    cursor = at + match[0].length;
  }

  if (cursor < input.length) tokens.push({ kind: "text", text: input.slice(cursor) });
  return tokens;
}

export function parseStoryProse(input: string): ProseToken[] {
  return parseWithPrefix(input, "");
}

/** Paragraphs, split on blank lines the way the editor's textarea implies. */
export function splitStoryParagraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export type ProseBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string };

const HEADING = /^(#{2,3})\s+(.+)$/;

/**
 * A body as its blocks rather than a flat list of paragraphs.
 *
 * Generated dossiers — the Bloomfall ecology sheets, the system pages — have
 * always written their sections as `## Ecology`. Rendered as paragraphs those
 * hashes showed up as literal punctuation, which is the same failure the link
 * markup was written to fix: the structure the writer expressed was the one
 * thing the reader could not see. Only two levels are recognised, because a
 * dossier already owns its `h1` and nothing in canon nests deeper.
 */
export function storyProseBlocks(body: string): ProseBlock[] {
  return splitStoryParagraphs(body).map((paragraph) => {
    const heading = HEADING.exec(paragraph);
    return heading
      ? { kind: "heading" as const, level: heading[1]!.length as 2 | 3, text: heading[2]!.trim() }
      : { kind: "paragraph" as const, text: paragraph };
  });
}

/** Every entry or arc a body links to, for prefetching titles in one query. */
export function storyProseLinks(body: string): string[] {
  return [...new Set([...body.matchAll(/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g)].map((match) => match[1]))];
}

/** What a link with no target should read as: the slug, spoken aloud. */
export function unwrittenLinkLabel(slug: string): string {
  return slug.replaceAll("-", " ");
}

/** Avoids prose such as "a the Soul Forge" without changing the stored copy. */
export function storyProseLinkLabel(label: string, elideLeadingThe: boolean): string {
  return elideLeadingThe ? label.replace(/^the\s+/i, "") : label;
}

/**
 * The same prose with its markup removed rather than rendered — for dense card
 * grids and list rows, where a one-line summary should read cleanly but a link
 * inside a truncated card would be noise. Never show raw `[[slug]]` to a
 * reader; either resolve it or speak it.
 */
export function plainStoryProse(input: string): string {
  const flatten = (tokens: ProseToken[]): string =>
    tokens.map((token) =>
      token.kind === "text" ? token.text
        : token.kind === "link" ? storyProseLinkLabel(unwrittenLinkLabel(token.slug), token.elideLeadingThe)
        : flatten(token.children)).join("");
  return flatten(parseStoryProse(input));
}
