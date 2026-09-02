import { isDialogueRole, unattributedSpeakerRole } from "@habitat/shared";

/**
 * The one-time migration helper behind "Split body into lines": proposes
 * structured line rows from the prose a node already carries, for a writer
 * to accept or edit. The prose is never touched.
 *
 * What it reads, all of which the story already uses:
 *
 *   SPEAKER: "quoted text"                    plain attribution
 *   SPEAKER, in a whisper: "quoted text"      attribution with a direction
 *   SPEAKER: (direction) "quoted text"        direction in parentheses
 *   SPEAKER (direction): "quoted text"
 *   "quoted text"                              continuation, same paragraph
 *
 * A speaker name is one or more UPPER-CASE words (digits allowed): TINO,
 * COMMANDER, PEARL MERC 1, RADIO 2. Straight or curly quotes. Several lines
 * may share a paragraph; narration between two quotes in the same paragraph
 * becomes the next line's performance direction, which is usually what it
 * was ("He surveys the incoming battle." → "Naturally."). A quote in a
 * paragraph with no attribution at all is proposed as the "unattributed"
 * role, voiced off, and is listed in the validation report.
 */

export type ProposedLine = {
  /** The CHARACTER slug when the name resolved to one, else null. */
  speakerSlug: string | null;
  /** The role when the name did not resolve, else null. Never both, never neither. */
  speakerRole: string | null;
  /** The name as it appeared in the prose, for the writer to check. */
  spokenAs: string;
  text: string;
  performance: string;
  voiced: boolean;
  /** True when no attribution was found; the writer must name the speaker. */
  unattributed: boolean;
};

export type SpeakerResolver = (name: string) => string | null;

const quoteOpen = "[\"“]";
const quoteClose = "[\"”]";
// NAME[, direction][ (direction)]: [(direction)] "text"
const attributed = new RegExp(
  `\\b([A-Z][A-Z0-9]*(?:[ \\-][A-Z0-9]+)*)` + // the name
    `(?:,\\s*([^:"“\\n]{1,120}?))?` + // ", in a whisper"
    `(?:\\s*\\(([^)]{1,200})\\))?` + // " (direction)"
    `\\s*:\\s*` +
    `(?:\\(([^)]{1,200})\\)\\s*)?` + // ": (direction)"
    `${quoteOpen}([^"“”]{1,1000})${quoteClose}`,
  "g",
);
const bareQuote = new RegExp(`${quoteOpen}([^"“”]{1,1000})${quoteClose}`, "g");

/** The prose a voice model must not read: markdown emphasis and bible links. */
export function cleanSpokenText(text: string) {
  return text
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_match, slug: string) => slug.replaceAll("-", " "))
    .replaceAll("**", "")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** A speaker name as a kebab-case role: "PEARL MERC 1" → "pearl-merc-1". */
export function roleFromName(name: string) {
  const role = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return isDialogueRole(role) ? role : unattributedSpeakerRole;
}

function direction(...parts: Array<string | undefined>) {
  return parts.map((part) => (part ?? "").replace(/\s+/g, " ").trim()).filter(Boolean).join("; ").slice(0, 200);
}

/**
 * Words the prose uses as attribution that are not names: the pattern would
 * otherwise read "OBJECTIVE: REACH..." or a shouted "DOWN." as speakers.
 */
const notSpeakers = new Set(["OBJECTIVE", "CHECKPOINT", "TUTORIAL", "NOTE", "SETTING", "BEAT", "TODO", "TBD", "CO-OP", "BOUND"]);

/**
 * Names the narration mentions, as the splitter's resolver knows them: the
 * capitalised words of a lead-in, upper-cased, kept only when they resolve to
 * a character. Set by `splitBodyIntoLines` from its resolver.
 */
let narrated: (lead: string) => string[] = () => [];

export function splitBodyIntoLines(body: string, resolve: SpeakerResolver): ProposedLine[] {
  const proposals: ProposedLine[] = [];
  narrated = (lead) => {
    const names: string[] = [];
    for (const match of lead.matchAll(/\b([A-Z][a-z]+)(?:'s)?\b/g)) {
      const upper = match[1]!.toUpperCase();
      if (resolve(upper)) names.push(upper);
    }
    return names;
  };
  const paragraphs = body.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    // Headings and bullet metadata are never dialogue.
    if (/^\s*#/.test(paragraph)) continue;
    type Hit = { start: number; end: number; name: string | null; direction: string; text: string; skip?: boolean };
    const hits: Hit[] = [];
    attributed.lastIndex = 0;
    for (let match = attributed.exec(paragraph); match; match = attributed.exec(paragraph)) {
      const [, name, lead, paren, paren2, text] = match;
      // A label such as OBJECTIVE: "..." is claimed (so the bare-quote pass
      // does not resurrect it as unattributed) and proposed as nothing.
      hits.push({ start: match.index, end: attributed.lastIndex, name, direction: direction(lead, paren, paren2), text, skip: notSpeakers.has(name) });
    }
    // Quotes not claimed by an attribution: continuation or unattributed.
    bareQuote.lastIndex = 0;
    for (let match = bareQuote.exec(paragraph); match; match = bareQuote.exec(paragraph)) {
      const start = match.index;
      const end = bareQuote.lastIndex;
      if (hits.some((hit) => start >= hit.start && end <= hit.end)) continue;
      hits.push({ start, end, name: null, direction: "", text: match[1] });
    }
    hits.sort((left, right) => left.start - right.start);

    // A paragraph with no SPEAKER: attribution at all may still name exactly
    // one character in its narration before the first quote ("Tino's verdict
    // depends on who you are. To the soldier: ..."). That is proposed as the
    // speaker, with the narration as direction; two names, or none, stay
    // unattributed for the writer.
    let lastName: string | null = null;
    if (hits.length && !hits.some((hit) => hit.name && !hit.skip)) {
      const lead = paragraph.slice(0, hits[0]!.start);
      const named = [...new Set(narrated(lead))];
      if (named.length === 1) lastName = named[0]!;
    }
    let cursor = 0;
    for (const hit of hits) {
      const between = paragraph.slice(cursor, hit.start).replace(/\s+/g, " ").trim();
      cursor = hit.end;
      if (hit.skip) continue;
      const text = cleanSpokenText(hit.text);
      if (!text) continue;
      const name = hit.name ?? lastName;
      if (hit.name) lastName = hit.name;
      // Narration between two quotes of one speaker reads as direction for the
      // second: "He surveys the incoming battle." before "Naturally."
      const performance = hit.name ? hit.direction : direction(between.replace(/^[.,;:!?\-—\s]+/, ""));
      if (!name) {
        proposals.push({ speakerSlug: null, speakerRole: unattributedSpeakerRole, spokenAs: "", text, performance, voiced: false, unattributed: true });
        continue;
      }
      const slug = resolve(name);
      proposals.push({
        speakerSlug: slug,
        speakerRole: slug ? null : roleFromName(name),
        spokenAs: name,
        text,
        performance,
        voiced: slug !== null || roleFromName(name) !== "player",
        unattributed: false,
      });
    }
  }
  return proposals;
}

/**
 * Builds the resolver the splitter uses: a prose name matches a character by
 * title, full name, or alias (case-insensitive, whole string), and "COMMANDER"
 * or any single word inside the node's own speaker's title matches that
 * speaker. Anything else is a role.
 */
export function speakerResolverFor(
  characters: Array<{ slug: string; title: string; fullName?: string | null; aliases?: string[] }>,
  nodeSpeaker: { slug: string; title: string } | null,
): SpeakerResolver {
  const byName = new Map<string, string>();
  for (const character of characters) {
    for (const name of [character.title, character.fullName ?? "", ...(character.aliases ?? [])]) {
      const key = name.trim().toUpperCase();
      if (key && !byName.has(key)) byName.set(key, character.slug);
    }
    // "COMMANDER ROOK" also answers to ROOK: the last word of a titled name.
    const words = character.title.trim().toUpperCase().split(/\s+/);
    if (words.length > 1) {
      const last = words[words.length - 1]!;
      if (!byName.has(last)) byName.set(last, character.slug);
    }
  }
  return (name) => {
    const key = name.trim().toUpperCase();
    if (byName.has(key)) return byName.get(key)!;
    if (nodeSpeaker && nodeSpeaker.title.toUpperCase().split(/\s+/).includes(key)) return nodeSpeaker.slug;
    return null;
  };
}
