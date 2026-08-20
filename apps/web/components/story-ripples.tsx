import Link from "next/link";
import { ArrowRight, Waves } from "lucide-react";
import type { StoryFutureRipple, StoryRipple, StoryRippleChain, StoryRippleWeb } from "@/lib/story-codex";
import { ripplesForArc } from "@/lib/story-codex";

/**
 * A ripple row reads as a sentence: something happens in one quest, and
 * another quest somewhere else notices. Every link lands on the exact scene,
 * not just the board, so "where does this actually pay off?" is one click.
 */
function RippleRow({ ripple, side }: { ripple: StoryRipple; side: "outgoing" | "incoming" }) {
  const far = side === "outgoing" ? ripple.to : ripple.from;
  return (
    <li>
      <Link href={`/codex/arc/${far.arcSlug}?node=${far.nodeId}`}>
        <strong>{far.arcTitle}</strong>
        <span>{far.label}</span>
        <ArrowRight aria-hidden="true" size={11} />
      </Link>
      <span className="story-ripple-detail">{side === "outgoing" ? "reads" : "sets"} <em>{ripple.flagTitle}</em> — {far.detail}</span>
    </li>
  );
}

function ChainRow({ chain, side }: { chain: StoryRippleChain; side: "continues" | "continuedFrom" }) {
  return side === "continues" ? (
    <li>
      <Link href={`/codex/arc/${chain.to.arcSlug}`}><strong>{chain.to.arcTitle}</strong><span>picks the story up</span><ArrowRight aria-hidden="true" size={11} /></Link>
      <span className="story-ripple-detail">from the ending &ldquo;{chain.from.nodeTitle}&rdquo;</span>
    </li>
  ) : (
    <li>
      <Link href={`/codex/arc/${chain.from.arcSlug}?node=${chain.from.nodeId}`}><strong>{chain.from.arcTitle}</strong><span>hands the story here</span><ArrowRight aria-hidden="true" size={11} /></Link>
      <span className="story-ripple-detail">at its ending &ldquo;{chain.from.nodeTitle}&rdquo;</span>
    </li>
  );
}

/** The amber half: connections written down before they were built. */
function FutureRow({ row }: { row: StoryFutureRipple }) {
  return (
    <li className="is-future">
      {row.packet
        ? <Link href={`/codex/bible/${row.packet.threadSlug}`}><strong>{row.flagTitle}</strong><span>waiting in {row.packet.threadTitle}</span><ArrowRight aria-hidden="true" size={11} /></Link>
        : <Link href={`/codex/bible/${row.flag}`}><strong>{row.flagTitle}</strong><span>not connected yet</span><ArrowRight aria-hidden="true" size={11} /></Link>}
      <span className="story-ripple-detail">{row.detail}</span>
    </li>
  );
}

/**
 * "What does this quest touch, and what touches it back?" — rendered beside a
 * board, derived from the same flag scan the promises ledger reads. Nobody
 * maintains this list; a writer who sets a flag in one scene and reads it in a
 * chapter three quests away sees the connection appear on both.
 */
export function RipplePanel({ web, arcSlug, arcTitle }: { web: StoryRippleWeb; arcSlug: string; arcTitle: string }) {
  const here = ripplesForArc(web, arcSlug);
  const nothing = here.outgoing.length + here.incoming.length + here.continues.length + here.continuedFrom.length + here.future.length === 0;

  return (
    <section className="story-ripples">
      <div className="section-heading"><h2><Waves aria-hidden="true" size={18} /> What this story touches</h2></div>
      {nothing ? (
        <div className="empty-data"><Waves aria-hidden="true" size={22} /><div>
          <h2>Nothing reaches out of this story yet.</h2>
          <p>Set a flag in a scene&apos;s effects, then read it from a choice in another quest — the connection shows up here, on both boards, without anyone writing it down.</p>
        </div></div>
      ) : (
        <div className="story-ripple-columns">
          {here.outgoing.length > 0 || here.continues.length > 0 ? (
            <div>
              <p className="eyebrow">{arcTitle} ripples into…</p>
              <ul>
                {here.outgoing.map((ripple) => <RippleRow key={`${ripple.flag}-${ripple.to.nodeId}`} ripple={ripple} side="outgoing" />)}
                {here.continues.map((chain) => <ChainRow chain={chain} key={`continues-${chain.from.nodeId}-${chain.to.arcSlug}`} side="continues" />)}
              </ul>
            </div>
          ) : null}

          {here.incoming.length > 0 || here.continuedFrom.length > 0 ? (
            <div>
              <p className="eyebrow">…and is shaped by</p>
              <ul>
                {here.incoming.map((ripple) => <RippleRow key={`${ripple.flag}-${ripple.from.nodeId}`} ripple={ripple} side="incoming" />)}
                {here.continuedFrom.map((chain) => <ChainRow chain={chain} key={`from-${chain.from.nodeId}`} side="continuedFrom" />)}
              </ul>
            </div>
          ) : null}

          {here.future.length > 0 ? (
            <div>
              <p className="eyebrow">Written down, not built yet</p>
              <ul>{here.future.map((row, index) => <FutureRow key={`${row.flag}-${row.kind}-${index}`} row={row} />)}</ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/**
 * Every cross-quest connection in the game at once, in campaign order — the
 * "does the story actually hang together?" view. Amber rows are the parts
 * somebody has written down and nobody has built.
 */
export function RippleOverview({ web }: { web: StoryRippleWeb }) {
  if (web.ripples.length === 0 && web.chains.length === 0 && web.future.length === 0) {
    return (
      <div className="empty-data"><Waves aria-hidden="true" size={24} /><div>
        <h2>No quest reaches into another one yet.</h2>
        <p>Set a flag in one story and read it in the next — every crossing lands on this list automatically, in the order the campaign meets them.</p>
      </div></div>
    );
  }

  return (
    <ul className="story-ripples story-ripple-web">
      {web.ripples.map((ripple) => (
        <li key={`${ripple.flag}-${ripple.from.nodeId}-${ripple.to.nodeId}`}>
          <Link href={`/codex/arc/${ripple.from.arcSlug}?node=${ripple.from.nodeId}`}>{ripple.from.arcTitle}</Link>
          <em>{ripple.flagTitle}</em>
          <ArrowRight aria-hidden="true" size={11} />
          <Link href={`/codex/arc/${ripple.to.arcSlug}?node=${ripple.to.nodeId}`}>{ripple.to.arcTitle} · {ripple.to.label}</Link>
        </li>
      ))}
      {web.chains.map((chain) => (
        <li key={`chain-${chain.from.nodeId}-${chain.to.arcSlug}`}>
          <Link href={`/codex/arc/${chain.from.arcSlug}?node=${chain.from.nodeId}`}>{chain.from.arcTitle}</Link>
          <em>continues in</em>
          <ArrowRight aria-hidden="true" size={11} />
          <Link href={`/codex/arc/${chain.to.arcSlug}`}>{chain.to.arcTitle}</Link>
        </li>
      ))}
      {web.future.map((row, index) => (
        <li className="is-future" key={`future-${row.flag}-${row.kind}-${index}`}>
          {row.where
            ? <Link href={`/codex/arc/${row.where.arcSlug}?node=${row.where.nodeId}`}>{row.where.arcTitle}</Link>
            : <Link href={`/codex/bible/${row.packet?.threadSlug ?? row.flag}`}>{row.packet?.threadTitle ?? "Not written yet"}</Link>}
          <em>{row.flagTitle}</em>
          <ArrowRight aria-hidden="true" size={11} />
          <span>{row.detail}</span>
        </li>
      ))}
    </ul>
  );
}
