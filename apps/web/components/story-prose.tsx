import Link from "next/link";
import { parseStoryProse, storyProseBlocks, storyProseLinkLabel, unwrittenLinkLabel, type ProseToken } from "@/lib/story-prose";

/**
 * Renders codex prose: bold, italic, and `[[slug]]` cross-references as real
 * links. Everything is composed from parsed tokens into React elements — no
 * HTML is ever injected, so a writer cannot smuggle markup into an entry.
 *
 * A link whose target does not exist is not an error. "Link now, fill later"
 * is canon law, so an unresolved reference renders as a marked todo rather
 * than a dead link or a silent omission — which also turns every dossier into
 * a list of what still needs writing.
 */

export type ProseTarget = { title: string; href: string };
export type ProseResolver = (slug: string) => ProseTarget | null;

function Tokens({ tokens, resolve }: { tokens: ProseToken[]; resolve: ProseResolver }) {
  return (
    <>
      {tokens.map((token, index) => {
        if (token.kind === "text") return <span key={index}>{token.text}</span>;
        if (token.kind === "bold") return <strong key={index}><Tokens resolve={resolve} tokens={token.children} /></strong>;
        if (token.kind === "italic") return <em key={index}><Tokens resolve={resolve} tokens={token.children} /></em>;
        const target = resolve(token.slug);
        const label = storyProseLinkLabel(target?.title ?? unwrittenLinkLabel(token.slug), token.elideLeadingThe);
        return target
          ? <Link className="prose-link" href={target.href} key={index}>{label}</Link>
          : <span className="prose-link is-unwritten" key={index} title="Nobody has written this yet — link now, fill later">{label}</span>;
      })}
    </>
  );
}

/** One paragraph of codex prose. */
export function StoryProseLine({ text, resolve }: { text: string; resolve: ProseResolver }) {
  return <Tokens resolve={resolve} tokens={parseStoryProse(text)} />;
}

/** A whole body: its sections as real headings, its lists as real lists, everything else as paragraphs. */
export function StoryProse({ body, resolve }: { body: string; resolve: ProseResolver }) {
  return (
    <>
      {storyProseBlocks(body).map((block, index) => {
        if (block.kind === "paragraph") return <p key={index}><Tokens resolve={resolve} tokens={parseStoryProse(block.text)} /></p>;
        if (block.kind === "list") return <ul className="prose-list" key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}><Tokens resolve={resolve} tokens={parseStoryProse(item)} /></li>)}</ul>;
        const Heading = block.level === 2 ? "h2" : "h3";
        return <Heading className="prose-heading" key={index}><Tokens resolve={resolve} tokens={parseStoryProse(block.text)} /></Heading>;
      })}
    </>
  );
}
