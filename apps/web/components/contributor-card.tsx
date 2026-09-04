import { Award } from "lucide-react";
import { StoryProse } from "@/components/story-prose";

/**
 * A contributor's original submission, kept whole, under their own name.
 *
 * The house law, established with Schlotzsky's Radiant Path on 2026-09-03:
 * when a member writes something the codex then builds on, their original
 * stays on the page, credited, verbatim — and **the codex the game reads never
 * carries it.** That second half is structural rather than a filter: this
 * renders from `StoryEntryContribution`, a table the outbound bundle's entry
 * mapper cannot name, because the mapper is an explicit allowlist of
 * `StoryEntry` columns.
 *
 * Every contributor gets the same treatment. The gold is the point.
 */
export type Contribution = {
  id: string;
  label: string;
  /**
   * Their words, or `null` when the words did not survive.
   *
   * The second case is a CREDIT, added by owner ruling on 2026-09-04: a member
   * designed something, the codex built on it, and nobody kept what they
   * actually wrote. The authorship is not in doubt and the prose is gone.
   *
   * A credit renders at the same weight, in the same gold, under the same
   * name — and says so, rather than putting the codex's writing in the box and
   * calling it theirs. **Credit does not require a surviving artifact, and a
   * missing original is never quietly filled in.**
   */
  body: string | null;
  contributor: string;
  submittedAt: string;
};

/**
 * Presentation only. The stored row is byte-for-byte what the member
 * submitted, and it is never rewritten — but a contributor writes markdown the
 * way people write markdown, not the way this codex's prose blocker parses it.
 *
 * Two adjustments, both purely about display:
 *   CRLF to LF, because the blocker splits paragraphs on a blank line and
 *   Schlotzsky pasted his dossier out of a Windows editor.
 *   A blank line after a `##`/`###` heading that is glued to the paragraph
 *   under it, because otherwise his section headings render as the literal
 *   characters "###" in the middle of a sentence.
 *
 * Fix the presentation. Never the record.
 */
function forDisplay(body: string) {
  return body.replace(/\r\n/g, "\n").replace(/^(#{2,3}\s+.+)\n(?!\n)/gm, "$1\n\n");
}

export function ContributorCards({ contributions }: { contributions: Contribution[] }) {
  if (contributions.length === 0) return null;
  return (
    <div className="contributor-cards">
      {contributions.map((contribution) => (
        <article className="contributor-card" key={contribution.id}>
          <header>
            <p className="contributor-eyebrow">
              <Award aria-hidden="true" size={13} /> {contribution.body === null ? "Designed by" : "Contributor's original"}
            </p>
            <h2>{contribution.contributor}</h2>
            <p className="contributor-label">{contribution.label} · submitted {contribution.submittedAt}</p>
          </header>
          {contribution.body !== null ? (
            <div className="contributor-body">
              {/* A resolver that resolves nothing, on purpose: a contributor's
                  words render as they were written and are never silently turned
                  into links to pages that did not exist when they wrote them. */}
              <StoryProse body={forDisplay(contribution.body)} resolve={() => null} />
            </div>
          ) : null}
          <footer>
            {contribution.body !== null ? (
              <>
                Written by {contribution.contributor} and kept here whole. The dossier above is the codex&apos;s
                build on top of it; this is the original, unedited. It stays on the website and is never
                written to the outbound codex.
              </>
            ) : (
              <>
                This creature was designed by {contribution.contributor}, and the dossier above is the
                codex&apos;s build on top of that design. Their original wording was not kept, so there is
                nothing to quote here — and nothing else goes in this box, because the codex&apos;s prose
                under somebody else&apos;s name is not a credit. The authorship is theirs regardless.
              </>
            )}
          </footer>
        </article>
      ))}
    </div>
  );
}
