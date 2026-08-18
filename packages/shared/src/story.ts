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
  "FLAG",
] as const;

export type StoryEntryKind = (typeof storyEntryKinds)[number];

export const storyStatuses = ["DRAFT", "PROPOSED", "CANON", "REJECTED", "ARCHIVED"] as const;

export type StoryStatus = (typeof storyStatuses)[number];

/**
 * The codex is an open writers' room: any member edits anything, canon
 * included, and the audit log on the landing page — not an approval gate —
 * is what keeps everyone honest. (Tino's call, 2026-08-18, reversing the
 * original propose→approve ladder.) The hook survives so a review ladder
 * could come back without touching a single call site.
 */
export function isStoryContentEditable(_status: StoryStatus, _canReview: boolean) {
  return true;
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
 * The valence of an ENDING, for the importer's quest state machine. NEUTRAL is
 * an authored answer — a choice that is neither victory nor defeat — not the
 * absence of one; absence is null, on nodes that are not endings at all.
 */
export const storyEndingKinds = ["SUCCESS", "FAILURE", "NEUTRAL"] as const;

export type StoryEndingKind = (typeof storyEndingKinds)[number];

export const storyEndingKindLabels: Record<StoryEndingKind, string> = {
  SUCCESS: "Success",
  FAILURE: "Failure",
  NEUTRAL: "Neutral",
};

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
  FLAG: "Flag",
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
  /**
   * Whether choosing this branch records anything — effects the game acts on.
   * A condition is not a consequence: it gates whether the choice is offered,
   * not what picking it changes.
   */
  hasConsequence?: boolean;
};

export const storyGraphProblemKinds = [
  "NO_ENTRY_POINT",
  "ISOLATED",
  "UNREACHABLE",
  "DEAD_END",
  "UNLABELLED_BRANCH",
  "DUPLICATE_BRANCH_LABEL",
  "HOLLOW_CHOICE",
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
          detail: `"${node.title}" splits ${branches.length} ways but ${unlabelled} branch${unlabelled === 1 ? " has" : "es have"} no choice text, so the player cannot tell them apart and the game has no way to offer them as separate choices.`,
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

      // A real decision changes something: it leads somewhere different, or
      // it records a consequence the story can answer later. Several labelled
      // choices converging on one card with nothing written down is theatre —
      // the player deliberates and the world does not notice.
      const byTarget = new Map<string, StoryGraphEdge[]>();
      for (const edge of branches) {
        if (!edge.label?.trim()) continue;
        const group = byTarget.get(edge.toKey);
        if (group) group.push(edge);
        else byTarget.set(edge.toKey, [edge]);
      }
      for (const [toKey, group] of byTarget) {
        if (group.length < 2 || group.some((edge) => edge.hasConsequence)) continue;
        problems.push({
          kind: "HOLLOW_CHOICE",
          nodeKey: node.key,
          detail: `"${node.title}" offers ${group.length} choices that all lead to "${byKey.get(toKey)?.title ?? toKey}" and record nothing — give each choice effects, or send them down different paths, so the decision matters.`,
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
 *
 * Still 1 after the 2026-08-18 additions (choice keys, speakers, ending
 * valence, completion, effects): every one of them is a new nullable field a
 * v1 importer safely ignores. Nullable-additive changes never bump this.
 */
export const storyExportContractVersion = 1;

export type StoryExportChoice = {
  order: number;
  /**
   * The stable handle the importer names this choice's asset by. Unique inside
   * the arc and unaffected by relabelling, retargeting, or reordering.
   */
  key: string;
  /** The text the player is shown. Null means an unconditional continuation. */
  label: string | null;
  /** Free-text gate, interpreted by the game rather than by the codex. */
  condition: string | null;
  /** What choosing this does, as free-text lines the game interprets. Null when empty. */
  effects: string[] | null;
  toKey: string;
};

/** The node's speaker, resolved from a CHARACTER bible entry. */
export type StoryExportSpeaker = {
  slug: string;
  title: string;
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
  /**
   * Null is unattributed narration, which is the correct value for a node
   * whose body carries several voices with inline attribution.
   */
  speaker: StoryExportSpeaker | null;
  /** Set only on ENDING nodes. */
  endingKind: StoryEndingKind | null;
  /**
   * Writer intent for what finishes a QUEST_STEP, in free text. Documentation
   * for the human who authors the real task in Unreal — never parsed.
   */
  completion: string | null;
  /** What the story does here, as free-text lines. Null when empty. */
  effects: string[] | null;
  /** What finishing this pays, one reward per line. Null when empty. */
  rewards: string[] | null;
  /**
   * The arc an ENDING flows into — the structural link that chains quests.
   * Withheld unless that arc is itself canon, like every other reference.
   */
  continuesInArcSlug: string | null;
  choices: StoryExportChoice[];
  references: StoryExportReference[];
};

export type StoryExportArc = {
  slug: string;
  title: string;
  summary: string | null;
  /** How the party finds this quest — roleplay intent, free text. */
  hook: string | null;
  /** Where it is picked up, resolved from a REGION bible entry. */
  region: { slug: string; title: string } | null;
  isMainline: boolean;
  /**
   * Nodes nothing transitions into. Several are legitimate — a side quest can
   * be enterable from more than one place — but importers that must store
   * exactly one start treat `entryNodeKeys[0]` as canonical. Entry keys are
   * emitted oldest-created-first, so the arc's original opening stays at
   * index 0 and a later-added opening can never silently displace it; extras
   * are call-site-only.
   */
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
  /**
   * The typed module object from Codex_Module_Schema.md. Shape depends on
   * kind; every field inside is nullable, and null at this level is exactly
   * as valid as it has always been. Additive — a v1 importer that predates
   * modules ignores it.
   */
  meta: Record<string, unknown> | null;
};

// ---------------------------------------------------------------------------
// Module meta (Codex_Module_Schema.md)
// ---------------------------------------------------------------------------

/** Magic origins, mirroring the game's Magic.Origin.* tags. */
export const storyMagicOrigins = ["none", "born", "infused", "gifted"] as const;

export type StoryCharacterMeta = {
  fullName: string | null;
  aliases: string[];
  pronouns: string | null;
  sex: string | null;
  species: string | null;
  age: string | null;
  appearance: string | null;
  voice: string | null;
  magic: {
    origin: (typeof storyMagicOrigins)[number] | null;
    schools: string[];
    corruptionPhase: number | null;
    notes: string | null;
  };
  factions: Array<{ faction: string; role: string | null; standing: string | null }>;
  home: string | null;
  status: {
    known: string | null;
    /**
     * Writers-room truth, spoiler-tier. Visually gated in the UI, and the
     * standing RULEs govern when story content may collapse the known/actual
     * gap — the Tino rule, generalized.
     */
    actual: string | null;
  };
  relationships: Array<{ character: string | null; who: string | null; type: string | null }>;
  storyRole: string | null;
  involvement: Array<{ arc: string; how: string | null }>;
  gameId: string | null;
  /** In-engine asset reference, e.g. "/Game/Creatures_Pack/Mesh/SK_Daemon". */
  model: string | null;
  openQuestions: string[];
};

/**
 * `destination` is the third rung: a region holds places, a place holds
 * destinations — the grocery store inside Shattermarket, the ward inside the
 * clinic. It is the level the player actually stands in, which is why quests
 * and characters attach to it rather than to the district around it.
 * Additive to the contract: an importer that has never heard of it reads it as
 * one more region-typed hint, exactly as it already reads "site".
 */
export const storyRegionTypes = ["region", "zone", "settlement", "landmark", "site", "destination"] as const;
export const storySettlementTiers = ["village", "town", "city", "major-city"] as const;
export const storyControlKinds = ["holds", "contests", "influences"] as const;

export type StoryRegionMeta = {
  type: (typeof storyRegionTypes)[number] | null;
  settlementTier: (typeof storySettlementTiers)[number] | null;
  parent: string | null;
  biome: string | null;
  control: Array<{ faction: string; kind: (typeof storyControlKinds)[number] | null }>;
  population: string | null;
  /** The connections graph IS the world map — the app renders it, nobody maintains a map file. */
  connections: Array<{ to: string; by: string | null; notes: string | null }>;
  status: string | null;
  gameTag: string | null;
  openQuestions: string[];
};

export const storyFactionStances = ["ally", "enemy", "rival", "client", "unknown"] as const;

export type StoryFactionMeta = {
  /** Intentionally open text: new kinds of power can emerge without a contract bump. */
  scope: string | null;
  seat: string | null;
  leaders: string[];
  relations: Array<{
    faction: string;
    stance: (typeof storyFactionStances)[number] | null;
    notes: string | null;
  }>;
  goals: string[];
  gameTag: string | null;
  openQuestions: string[];
};

/**
 * One picker for "what kind of place is this", because `type` and
 * `settlementTier` are two fields describing one decision, and asking a writer
 * to fill both — while quietly ignoring the tier unless the type happens to be
 * "settlement" — is how the region sheet reads as two puzzles instead of one
 * question. The option value carries both; the server splits it.
 */
export const storyPlaceKinds = [
  { value: "site", label: "Site — a camp, fort, quarry, or other point of interest", type: "site", settlementTier: null },
  { value: "destination", label: "Destination — somewhere inside a place: a shop, a ward, an arena", type: "destination", settlementTier: null },
  { value: "landmark", label: "Landmark — a named feature people navigate by", type: "landmark", settlementTier: null },
  { value: "settlement:village", label: "Village — a small settlement", type: "settlement", settlementTier: "village" },
  { value: "settlement:town", label: "Town — a medium settlement", type: "settlement", settlementTier: "town" },
  { value: "settlement:city", label: "City — a large settlement", type: "settlement", settlementTier: "city" },
  { value: "settlement:major-city", label: "Major city — one of the great cities", type: "settlement", settlementTier: "major-city" },
  { value: "zone", label: "Zone — a stretch of ground inside a region", type: "zone", settlementTier: null },
  { value: "region", label: "Region — a whole landmass, sea, or territory", type: "region", settlementTier: null },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  type: (typeof storyRegionTypes)[number];
  settlementTier: (typeof storySettlementTiers)[number] | null;
}>;

/** Splits a place-kind picker value back into the two stored fields. */
export function parseStoryPlaceKind(value: unknown): { type: (typeof storyRegionTypes)[number]; settlementTier: (typeof storySettlementTiers)[number] | null } | null {
  const match = storyPlaceKinds.find((kind) => kind.value === value);
  return match ? { type: match.type, settlementTier: match.settlementTier } : null;
}

/** The one fact the world hierarchy is built from: a place and what holds it. */
export type StoryPlaceLink = { slug: string; parent: string | null };

/**
 * Walks a place's containers outward, nearest first.
 *
 * `parent` is writer-editable free-form data, so the chain can be broken in
 * ways a tree cannot be: a place can name itself, two places can name each
 * other, or a parent can be a slug nobody has written yet. Every walker here
 * carries a seen-set and stops rather than looping — a mis-set parent must
 * render a short breadcrumb, never hang the page.
 */
export function storyPlaceAncestry(slug: string, places: StoryPlaceLink[]): string[] {
  const parentOf = new Map(places.map((place) => [place.slug, place.parent]));
  const ancestry: string[] = [];
  const seen = new Set([slug]);
  let current = parentOf.get(slug) ?? null;
  while (current && !seen.has(current) && parentOf.has(current)) {
    ancestry.push(current);
    seen.add(current);
    current = parentOf.get(current) ?? null;
  }
  return ancestry;
}

/** Everything inside a place, at any depth, nearest generation first. */
export function storyPlaceDescendants(slug: string, places: StoryPlaceLink[]): string[] {
  const childrenOf = new Map<string, string[]>();
  for (const place of places) {
    if (!place.parent || place.parent === place.slug) continue;
    const siblings = childrenOf.get(place.parent);
    if (siblings) siblings.push(place.slug); else childrenOf.set(place.parent, [place.slug]);
  }
  const found: string[] = [];
  const seen = new Set([slug]);
  let generation = childrenOf.get(slug) ?? [];
  while (generation.length > 0) {
    const next: string[] = [];
    for (const child of generation) {
      if (seen.has(child)) continue;
      seen.add(child);
      found.push(child);
      next.push(...(childrenOf.get(child) ?? []));
    }
    generation = next;
  }
  return found;
}

/**
 * The top-level region a place ultimately sits in — the atlas card it files
 * under, however many rungs down it lives. Null when the chain never reaches
 * one, which is what puts a place in the "not placed yet" strip.
 */
export function storyPlaceRoot(slug: string, places: StoryPlaceLink[], isRoot: (slug: string) => boolean): string | null {
  if (isRoot(slug)) return slug;
  for (const ancestor of storyPlaceAncestry(slug, places)) {
    if (isRoot(ancestor)) return ancestor;
  }
  return null;
}

/** The taxonomy law as a picker — never free text. */
export const storyCreatureCategories = ["natural", "magical", "monstrosity", "abomination", "supernatural"] as const;

export type StoryCreatureMeta = {
  category: (typeof storyCreatureCategories)[number] | null;
  /** Region slugs where they resolve, free-text biomes where they don't. */
  biomes: string[];
  threat: string | null;
  /** What the harvest economy wants from it, if anything. */
  harvest: string | null;
  gameId: string | null;
  openQuestions: string[];
};

export type StoryItemMeta = {
  /** weapon | tool | substance | relic | document — open text by design. */
  category: string | null;
  rarity: string | null;
  /** A faction/region slug where it resolves, free text where it doesn't. */
  origin: string | null;
  /** The DA_* asset name once one exists — the game's save ID, never changed after. */
  gameId: string | null;
  openQuestions: string[];
};

export type StoryEventMeta = {
  /** Free-text era the app can sort: "prologue", "20 years before opening". */
  when: string | null;
  where: string[];
  /** Any entry slug — people, factions, places, items. */
  involved: string[];
  outcome: string | null;
  openQuestions: string[];
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
