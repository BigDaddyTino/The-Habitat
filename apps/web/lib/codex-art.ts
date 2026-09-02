import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Key art for codex dossiers, found by convention rather than a hand-kept map:
 * drop a file named for the entry's slug and the card and dossier wear it.
 *
 *   private/codex-art/systems/<slug>.(png|jpg|webp)    — game systems
 *   private/codex-art/timeline/<slug>.(png|jpg|webp)   — timeline events
 *
 * Every directory here lives under `private/` — still version-controlled with
 * the rest of the art, but NOT served as a static asset. That is the point:
 * anything Next finds under `public/` it hands to anonymous callers at its own
 * URL, so the whole codex art set was reachable without signing in while the
 * codex pages around it required a member account. Unreleased key art is
 * unreleased plot, so it is served through /codex-art, which checks the same
 * USER gate the dossiers do.
 *
 * Serving from disk per request also keeps the older promise true — Next
 * indexes `public/` at build time, so a file dropped in afterwards would have
 * 404ed until the next build. Here it appears on the next reload.
 *
 * Server-only (node:fs). Never import from a "use client" module.
 */

export const codexArtKinds = {
  systems: "systems",
  timeline: "timeline",
  // The Eight Trees: one constellation per class, worn by /codex/talents.
  talents: "talents",
  // The Nine Trades: one plate per profession, worn by /codex/professions.
  trades: "trades",
  // The Eight Trees as people: one key-art plate per class, worn by /codex/classes.
  classes: "classes",
  // The Crown: the Nation page hero, one plate per Rank of the Crown and one
  // sigil per realm tree. private/codex-art/nation/<slug>.png
  nation: "nation",
  // Behind each class's tree in the calculator: a class-specific scene the
  // constellation lines are drawn over. private/codex-art/talent-backdrops/<class>.png
  "talent-backdrops": "talent-backdrops",
  // One icon per talent node, flat-named <class>-<node-id>.png so a directory
  // listing resolves all ~400 at once. private/codex-art/talent-icons/
  "talent-icons": "talent-icons",
  // One plate per skill (20) and one icon per licensed spell (108).
  skills: "skills",
  spells: "spells",
  // The dossier art that used to sit in public/images. Each one is a
  // directory under private/codex-art named for the shelf it serves.
  characters: "characters",
  regions: "regions",
  races: "races",
  creatures: "creatures",
  factions: "factions",
  "faction-logos": "faction-logos",
  items: "items",
  themes: "themes",
  threads: "threads",
  "companion-missions": "companion-missions",
  rules: "rules",
  flags: "flags",
  "bloomfall-v3": "bloomfall-v3",
  "bloomfall-adaptive-p0": "bloomfall-adaptive-p0",
  "bloomfall-adaptive-p0-source": "bloomfall-adaptive-p0-source",
  "bloomfall-adaptive-p1p2": "bloomfall-adaptive-p1p2",
  "bloomfall-adaptive-p1p2-source": "bloomfall-adaptive-p1p2-source",
  "bloomfall-creatures-v4": "bloomfall-creatures-v4",
} as const;
export type CodexArtKind = keyof typeof codexArtKinds;

export const codexArtContentTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

const artExtensions = ["png", "jpg", "jpeg", "webp"] as const;

/**
 * Runtime-only, and deliberately opaque to the bundler.
 *
 * These paths are read per request off disk; they are not modules and nothing
 * about them is knowable at build time. Without the ignore, Turbopack tries to
 * follow the dynamic join, matches every one of the ~12,000 files under
 * apps/web, and reports that "the whole project was traced unintentionally" on
 * every single build — which is exactly what it was doing.
 */
const artRoot = () => path.join(/*turbopackIgnore: true*/ process.cwd(), "private", "codex-art");

function directoryFor(kind: CodexArtKind) {
  // The review packages nest their finals and their history separately.
  if (kind === "bloomfall-adaptive-p0") return path.join(/*turbopackIgnore: true*/ artRoot(), "bloomfall-adaptive-p0", "candidates");
  if (kind === "bloomfall-adaptive-p0-source") return path.join(/*turbopackIgnore: true*/ artRoot(), "bloomfall-adaptive-p0", "sources");
  if (kind === "bloomfall-adaptive-p1p2") return path.join(/*turbopackIgnore: true*/ artRoot(), "bloomfall-adaptive-p1p2", "candidates");
  if (kind === "bloomfall-adaptive-p1p2-source") return path.join(/*turbopackIgnore: true*/ artRoot(), "bloomfall-adaptive-p1p2", "sources");
  return path.join(/*turbopackIgnore: true*/ artRoot(), codexArtKinds[kind]);
}

/**
 * The generation history — every iteration, including the ones review sent
 * back — is local evidence and never leaves development. The candidate
 * directories beside it hold only the owner-approved finals, so those are
 * ordinary served art once a release promotes them.
 */
function isDevelopmentReviewKind(kind: string) {
  return kind === "bloomfall-adaptive-p0-source" || kind === "bloomfall-adaptive-p1p2-source";
}

/** The URL for an entry's art, or null when nobody has dropped one in yet. */
export function findCodexArt(kind: CodexArtKind, slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  for (const extension of artExtensions) {
    if (existsSync(path.join(/*turbopackIgnore: true*/ directoryFor(kind), `${slug}.${extension}`))) {
      return `/codex-art/${codexArtKinds[kind]}/${slug}.${extension}`;
    }
  }
  return null;
}

/**
 * Every slug with art in a directory, resolved with one readdir — for the
 * surfaces that wear hundreds of small images (talent icons, spell icons)
 * where an existsSync per slug would be hundreds of stats per request.
 */
export function listCodexArt(kind: CodexArtKind): Map<string, string> {
  const found = new Map<string, string>();
  const directory = directoryFor(kind);
  if (!existsSync(directory)) return found;
  for (const file of readdirSync(directory)) {
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*).(png|jpg|jpeg|webp)$/.exec(file);
    if (match && !found.has(match[1])) found.set(match[1], `/codex-art/${codexArtKinds[kind]}/${file}`);
  }
  return found;
}

/** Where to drop the art, shown verbatim on the empty slot. */
export function codexArtSlot(kind: CodexArtKind, slug: string) {
  return `private/codex-art/${codexArtKinds[kind]}/${slug}.png`;
}

/**
 * Resolves a request path to a file on disk, or null. The kind must be one of
 * the known directories and the filename must be `<slug>.<ext>`, so there is
 * no way to express a traversal — and the resolved path is re-checked to be
 * inside its directory regardless.
 */
export function resolveCodexArtFile(kind: string, file: string, environment: Readonly<Record<string, string | undefined>> = process.env): string | null {
  if (!(kind in codexArtKinds)) return null;
  if (isDevelopmentReviewKind(kind) && environment.HABITAT_ENVIRONMENT !== "development") return null;
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(png|jpg|jpeg|webp)$/.exec(file);
  if (!match) return null;
  const directory = directoryFor(kind as CodexArtKind);
  const target = path.resolve(/*turbopackIgnore: true*/ directory, file);
  if (target !== path.join(/*turbopackIgnore: true*/ directory, file)) return null;
  return existsSync(target) ? target : null;
}

/**
 * The file behind a `/codex-art/...` URL, or null.
 *
 * Every art resolver returns a URL, and the audits and tests that check the
 * art is really on disk used to rebuild the path themselves by joining the URL
 * onto `public/`. That stopped being true when the art moved behind the
 * authenticated route, and it was never something a caller should have had to
 * know. Ask here instead — this is the same resolution the route performs.
 */
export function codexArtFileForUrl(url: string, environment: Readonly<Record<string, string | undefined>> = process.env): string | null {
  const match = /^\/codex-art\/([a-z0-9-]+)\/([^/]+)$/.exec(url);
  return match ? resolveCodexArtFile(match[1], match[2], environment) : null;
}
