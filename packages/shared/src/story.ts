/**
 * The Story Codex vocabulary, shared by the web editor and the canon export the
 * Martino Unreal project reads.
 *
 * This module is deliberately pure. It holds no database access and no browser
 * APIs, so the same graph analysis that warns a writer about an orphaned branch
 * on the board also runs over an export before it is handed to the importer.
 */

export const storyEntryKinds = [
  "THEME",
  "REGION",
  "CREATURE",
  "CHARACTER",
  "FACTION",
  "ITEM",
  "EVENT",
  "RULE",
] as const;

export type StoryEntryKind = (typeof storyEntryKinds)[number];

export const storyStatuses = ["DRAFT", "PROPOSED", "CANON", "REJECTED", "ARCHIVED"] as const;

export type StoryStatus = (typeof storyStatuses)[number];

/**
 * Canon is the payload consumed by the game. Contributors can discuss it and
 * build proposed branches around it, but only a reviewer may alter canon in
 * place; otherwise an ordinary edit would bypass the review queue entirely.
 */
export function isStoryContentEditable(status: StoryStatus, canReview: boolean) {
  return status !== "CANON" || canReview;
}

export const storyNodeKinds = [
  "BEAT",
  "SCENE",
  "DIALOGUE",
  "CHOICE",
  "CONDITION",
  "QUEST_START",
  "QUEST_STEP",
  "ENDING",
] as const;

export type StoryNodeKind = (typeof storyNodeKinds)[number];

/**
 * The only status the game is ever built from. Everything else on a board is
 * somebody thinking out loud, and the export refuses to carry it.
 */
export const exportableStoryStatus: StoryStatus = "CANON";

export const storyEntryKindLabels: Record<StoryEntryKind, string> = {
  THEME: "Theme",
  REGION: "Region",
  CREATURE: "Creature",
  CHARACTER: "Character",
  FACTION: "Faction",
  ITEM: "Item",
  EVENT: "Event",
  RULE: "Rule",
};

export const storyNodeKindLabels: Record<StoryNodeKind, string> = {
  BEAT: "Beat",
  SCENE: "Scene",
  DIALOGUE: "Dialogue",
  CHOICE: "Choice",
  CONDITION: "Condition",
  QUEST_START: "Quest start",
  QUEST_STEP: "Quest step",
  ENDING: "Ending",
};

export const storyStatusLabels: Record<StoryStatus, string> = {
  DRAFT: "Draft",
  PROPOSED: "Proposed",
  CANON: "Canon",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

/**
 * A node kind that legitimately has nowhere to go. Flagging an ENDING as a dead
 * end would train writers to ignore the problems panel, which is how a real
 * dangling branch gets shipped.
 */
export function isTerminalStoryNodeKind(kind: StoryNodeKind) {
  return kind === "ENDING";
}

/**
 * Node keys and slugs reach the Unreal importer as asset-path segments, so they
 * are held to the same kebab-case shape the database CHECKs enforce. Returns an
 * empty string when nothing usable survives, and callers must treat that as a
 * validation failure rather than writing it.
 */
export function slugifyStoryKey(value: string, maxLength = 64) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function isValidStoryKey(value: string) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * How long a courtesy edit lock survives without being renewed. A lock is only
 * ever a hint layered on top of version checks, so this is short enough that a
 * closed laptop frees the node quickly and long enough to survive a slow save.
 */
export const storyLockTtlMs = 120_000;

/** A writer is shown as present on a board for this long after their last ping. */
export const storyPresenceTtlMs = 45_000;

/** How often the browser renews presence and lock claims. */
export const storyHeartbeatMs = 15_000;

export function isStoryLockHeld(
  lock: { lockedByUserId: string | null; lockExpiresAt: Date | null } | null | undefined,
  now: Date,
) {
  return Boolean(lock?.lockedByUserId && lock.lockExpiresAt && lock.lockExpiresAt > now);
}

export function isStoryPresenceFresh(lastSeenAt: Date, now: Date) {
  return now.getTime() - lastSeenAt.getTime() <= storyPresenceTtlMs;
}

// ---------------------------------------------------------------------------
// Graph analysis
// ---------------------------------------------------------------------------

export type StoryGraphNode = {
  key: string;
  kind: StoryNodeKind;
  title: string;
};

export type StoryGraphEdge = {
  fromKey: string;
  toKey: string;
  label: string | null;
};

export const storyGraphProblemKinds = [
  "NO_ENTRY_POINT",
  "ISOLATED",
  "UNREACHABLE",
  "DEAD_END",
  "UNLABELLED_BRANCH",
  "DUPLICATE_BRANCH_LABEL",
] as const;

export type StoryGraphProblemKind = (typeof storyGraphProblemKinds)[number];

export type StoryGraphProblem = {
  kind: StoryGraphProblemKind;
  nodeKey: string | null;
  detail: string;
};

/**
 * Entry points are nodes nothing transitions into. A board with several is fine
 * — a side quest can be enterable from more than one place — but a board with
 * none is a cycle the player can never get into.
 */
export function findStoryEntryNodeKeys(nodes: StoryGraphNode[], edges: StoryGraphEdge[]) {
  const entered = new Set(edges.map((edge) => edge.toKey));
  return nodes.filter((node) => !entered.has(node.key)).map((node) => node.key);
}

/**
 * The problems panel behind every board, and the gate the export reports on.
 *
 * These are warnings rather than errors on purpose: a story in progress is
 * supposed to have loose ends, and refusing to save one would make the board
 * useless for actual drafting. The export surfaces them so nobody imports a
 * branch that silently drops the player.
 */
export function analyzeStoryGraph(nodes: StoryGraphNode[], edges: StoryGraphEdge[]): StoryGraphProblem[] {
  const problems: StoryGraphProblem[] = [];
  if (nodes.length === 0) return problems;

  const byKey = new Map(nodes.map((node) => [node.key, node]));
  const outgoing = new Map<string, StoryGraphEdge[]>();
  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    if (!byKey.has(edge.fromKey) || !byKey.has(edge.toKey)) continue;
    hasIncoming.add(edge.toKey);
    const list = outgoing.get(edge.fromKey);
    if (list) list.push(edge);
    else outgoing.set(edge.fromKey, [edge]);
  }

  const entryKeys = findStoryEntryNodeKeys(nodes, edges);
  if (entryKeys.length === 0) {
    problems.push({
      kind: "NO_ENTRY_POINT",
      nodeKey: null,
      detail: "Every node on this arc is reachable from another one, so nothing opens it. The player can never enter.",
    });
  }

  const reachable = new Set<string>();
  const queue = [...entryKeys];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || reachable.has(key)) continue;
    reachable.add(key);
    for (const edge of outgoing.get(key) ?? []) queue.push(edge.toKey);
  }

  for (const node of nodes) {
    if (entryKeys.length > 0 && !reachable.has(node.key)) {
      problems.push({
        kind: "UNREACHABLE",
        nodeKey: node.key,
        detail: `"${node.title}" has no path leading to it from any opening of this arc.`,
      });
    }

    const branches = outgoing.get(node.key) ?? [];

    // A node wired to nothing at either end counts as its own opening, so the
    // reachability walk above can never flag it — including an Ending nobody
    // can arrive at. On a board with other nodes it is almost always a card
    // somebody dropped and forgot, so it is called out on its own terms.
    if (nodes.length > 1 && branches.length === 0 && !hasIncoming.has(node.key)) {
      problems.push({
        kind: "ISOLATED",
        nodeKey: node.key,
        detail: `"${node.title}" is connected to nothing. Draw a branch into it, or remove it.`,
      });
    } else if (branches.length === 0 && !isTerminalStoryNodeKind(node.kind)) {
      problems.push({
        kind: "DEAD_END",
        nodeKey: node.key,
        detail: `"${node.title}" continues nowhere. Give it a transition, or make it an Ending.`,
      });
    }

    if (branches.length > 1) {
      const unlabelled = branches.filter((edge) => !edge.label?.trim()).length;
      if (unlabelled > 0) {
        problems.push({
          kind: "UNLABELLED_BRANCH",
          nodeKey: node.key,
          detail: `"${node.title}" splits ${branches.length} ways but ${unlabelled} branch${unlabelled === 1 ? " has" : "es have"} no choice text, so the player cannot tell them apart.`,
        });
      }

      const labels = branches.map((edge) => edge.label?.trim().toLowerCase()).filter((label): label is string => Boolean(label));
      const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
      for (const duplicate of new Set(duplicates)) {
        problems.push({
          kind: "DUPLICATE_BRANCH_LABEL",
          nodeKey: node.key,
          detail: `"${node.title}" offers the choice "${duplicate}" more than once.`,
        });
      }
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Export contract
// ---------------------------------------------------------------------------

/**
 * Bumped only when the shape below changes in a way an existing importer could
 * not read. The Unreal side checks it and refuses rather than guessing, because
 * a half-understood story import corrupts assets that are expensive to rebuild.
 */
export const storyExportContractVersion = 1;

export type StoryExportChoice = {
  order: number;
  /** The text the player is shown. Null means an unconditional continuation. */
  label: string | null;
  /** Free-text gate, interpreted by the game rather than by the codex. */
  condition: string | null;
  toKey: string;
};

export type StoryExportReference = {
  kind: StoryEntryKind;
  slug: string;
  title: string;
};

export type StoryExportNode = {
  key: string;
  kind: StoryNodeKind;
  title: string;
  summary: string | null;
  body: string | null;
  choices: StoryExportChoice[];
  references: StoryExportReference[];
};

export type StoryExportArc = {
  slug: string;
  title: string;
  summary: string | null;
  isMainline: boolean;
  entryNodeKeys: string[];
  nodes: StoryExportNode[];
  problems: StoryGraphProblem[];
};

export type StoryExportEntry = {
  kind: StoryEntryKind;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
};

/**
 * What `GET /api/story/export` returns, and the only representation of the
 * story the game is built from.
 *
 * `revisionCursor` is the newest change included. The importer stores it and
 * sends it back as `?since=`, which answers "has anything changed" without
 * transferring the whole codex again.
 */
export type MartinoStoryExport = {
  contractVersion: typeof storyExportContractVersion;
  generatedAt: string;
  revisionCursor: string | null;
  arcs: StoryExportArc[];
  bible: StoryExportEntry[];
};
