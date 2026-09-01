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
  "SYSTEM",
  "THREAD",
  "COMPANION_MISSION",
] as const;

export type StoryEntryKind = (typeof storyEntryKinds)[number];

export const storyStatuses = ["DRAFT", "PROPOSED", "CANON", "REJECTED", "ARCHIVED"] as const;

export type StoryStatus = (typeof storyStatuses)[number];

/**
 * The codex is an open writers' room: any member edits anything, canon
 * included, and the audit log on the landing page — not an approval gate —
 * is what keeps everyone honest. (Tino's call, 2026-08-18, reversing the
 * original propose→approve ladder.)
 *
 * Nothing is frozen by what status it carries. A flow freezes only when an
 * admin locks it, deliberately, and thaws when they lift that lock. (Tino's
 * call, 2026-08-19.) The lock binds everyone — the admin who set it included;
 * an admin who wants to write here unlocks first, which keeps "is this
 * settled?" a question with one answer rather than one answer per reader.
 */
export function isStoryFlowEditable(locked: boolean) {
  return !locked;
}

/**
 * How a locked flow explains itself. One sentence, shared by the canvas badge,
 * the card editor, and the branch editor, so a writer meets the same words
 * wherever they run into the freeze.
 */
export function storyLockNotice(lockedBy: string | null) {
  return lockedBy
    ? `${lockedBy} locked this flow. It is settled story — an admin can unlock it to change anything here.`
    : "This flow is locked. It is settled story — an admin can unlock it to change anything here.";
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
  SYSTEM: "Game system",
  THREAD: "Story thread",
  COMPANION_MISSION: "Companion mission",
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
  // Only an edge between two nodes that are actually on the board marks its
  // target as entered. An edge can legitimately outlive one of its endpoints
  // (a cut or non-canon node), and counting such a ghost edge here declared a
  // healthy opening "entered" — reporting NO_ENTRY_POINT on a walkable arc and
  // suppressing every UNREACHABLE check along with it.
  const known = new Set(nodes.map((node) => node.key));
  const entered = new Set(edges.filter((edge) => known.has(edge.fromKey) && known.has(edge.toKey)).map((edge) => edge.toKey));
  return nodes.filter((node) => !entered.has(node.key)).map((node) => node.key);
}

/**
 * A small number of authored cards are independent subsystem roots as well as
 * steps reached through the visible quest flow. They stay connected on the
 * board, but the game importer must also be able to address them as roots when
 * it merges the relevant dialogue graph.
 *
 * Keep these exceptions explicit and key-based. The natural graph openings
 * remain first (and therefore keep the canonical start stable), and a stale
 * exception is ignored when its card is absent from the exported node set.
 */
const additionalStoryEntryNodeKeys: Readonly<Record<string, readonly string[]>> = {
  "the-danger-of-true-death": ["bind-again"],
};

export function findStoryArcEntryNodeKeys(arcSlug: string, nodes: StoryGraphNode[], edges: StoryGraphEdge[]) {
  const entryKeys = findStoryEntryNodeKeys(nodes, edges);
  const knownKeys = new Set(nodes.map((node) => node.key));
  for (const key of additionalStoryEntryNodeKeys[arcSlug] ?? []) {
    if (knownKeys.has(key) && !entryKeys.includes(key)) entryKeys.push(key);
  }
  return entryKeys;
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

/**
 * What kind of story an arc is — the filing the writers' room works in.
 *
 * MAINLINE is the spine. SIDE_QUEST is optional story. CONTRACT is a bounty
 * posted at a place (so it is always filed to a region). COMPANION_QUEST is
 * one companion's own story (so it is always filed to a character).
 * FACTION_QUEST is one faction's own operation (so it is always filed to a
 * faction). INCURSION is something that comes through. WORLD_EVENT is something that
 * happens to the world rather than to the party.
 *
 * MAINLINE and `StoryArc.isMainline` mean exactly the same thing, and a
 * database CHECK keeps them that way — see the schema note. Every writer of
 * an arc sets both.
 */
export const storyArcCategories = ["MAINLINE", "SIDE_QUEST", "CONTRACT", "COMPANION_QUEST", "FACTION_QUEST", "INCURSION", "WORLD_EVENT"] as const;

export type StoryArcCategory = (typeof storyArcCategories)[number];

export const storyArcCategoryLabels: Record<StoryArcCategory, string> = {
  MAINLINE: "Mainline chapter",
  SIDE_QUEST: "Side quest",
  CONTRACT: "Contract",
  COMPANION_QUEST: "Companion quest",
  FACTION_QUEST: "Faction quest",
  INCURSION: "Incursion",
  WORLD_EVENT: "World event",
};

/** One line of plain help per category, used wherever a writer picks one. */
export const storyArcCategoryHints: Record<StoryArcCategory, string> = {
  MAINLINE: "A chapter of the main story. Only an admin opens one.",
  SIDE_QUEST: "Optional story the party can find and finish on its own.",
  CONTRACT: "A bounty posted at a place — say where it is posted.",
  COMPANION_QUEST: "One companion's own story — say whose it is.",
  FACTION_QUEST: "One faction's own operation — say whose banner it flies.",
  INCURSION: "Something that comes through and has to be pushed back.",
  WORLD_EVENT: "Something that happens to the world, party or no party.",
};

/** True for the categories that keep `isMainline` true. */
export function isMainlineArcCategory(category: StoryArcCategory) {
  return category === "MAINLINE";
}

export type StoryExportArc = {
  slug: string;
  title: string;
  summary: string | null;
  /** How the party finds this quest — roleplay intent, free text. */
  hook: string | null;
  /** Where it is picked up, resolved from a REGION bible entry. */
  region: { slug: string; title: string } | null;
  isMainline: boolean;
  /** What kind of story this is. Additive to the v1 contract; `isMainline`
   *  stays authoritative for importers that only know the boolean, and the
   *  two can never disagree. */
  category: StoryArcCategory;
  /** The companion whose story this is, for COMPANION_QUEST arcs. */
  companion: { slug: string; title: string } | null;
  /** The faction whose banner this flies, for FACTION_QUEST arcs. */
  faction: { slug: string; title: string } | null;
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

/**
 * The five damage types, promoted from Bloomfall's constants to the game's.
 *
 * They were written for one region's creature ladder and turned out to be the
 * whole taxonomy: every weapon, ward, plate and licence class in the character
 * bible resolves to one of these five, and there is deliberately no COLD among
 * them — Cryogenic deals PHYSICAL, because its signature is *vitrify, then
 * strike*. It is the pillar that does not hurt you until something else does.
 *
 * `bloomfall-adaptive-ladder` re-exports this list rather than keeping its own,
 * so the region and the game can never drift apart.
 */
export const storyDamageTypes = ["PHYSICAL", "FIRE", "ELECTRICAL", "ARCANE", "TOXIC"] as const;
export type StoryDamageType = (typeof storyDamageTypes)[number];

export const storyDamageTypeLabels: Record<StoryDamageType, string> = {
  PHYSICAL: "Physical",
  FIRE: "Fire",
  ELECTRICAL: "Electrical",
  ARCANE: "Arcane",
  TOXIC: "Toxic",
};

/** What each type argues with a plate about — the one line a writer needs. */
export const storyDamageTypeNotes: Record<StoryDamageType, string> = {
  PHYSICAL: "The plate game. A plate absorbs one hit and is gone; the next round finds the hole.",
  FIRE: "Ignores half a plate, and a fire-warded plate ignores it back. Doses cook off, and a leaking rig is a fuse.",
  ELECTRICAL: "Through the plate to whatever conducts. Vents rigs and augments, and leaves nothing visible — the most deniable damage there is.",
  ARCANE: "Ignores the plate entirely. Leaves a scar that reads as itself, so anyone who walks past later knows a spell was here.",
  TOXIC: "Does not care about the plate; it cares about the air. A clock that resilience resists and an antitoxin stops.",
};

// ---------------------------------------------------------------------------
// The seven phases of corruption
// ---------------------------------------------------------------------------

/**
 * The ladder every infused character descends, one dose at a time.
 *
 * This lives in code rather than only in the rule's prose because the phases
 * are referenced from three places that must never disagree: the character
 * sheet's picker, the character dossier that reads a phase back, and the
 * rule and system dossiers that document the ladder. A writer choosing "4"
 * from a bare 0–7 number picker was choosing blind — which is exactly why no
 * character in the codex had a phase set at all.
 *
 * The first four phases are not invented here. Canon already named the tells
 * in order — "tremors, veins, appetite, sensitivity to things others cannot
 * feel" ([[the-corruption-system]]) — so phases one through four are that
 * sentence made explicit, and five through seven carry it the rest of the way
 * to the abomination the rule already promises.
 *
 * Two laws bind every row, both from [[the-seven-phases-of-corruption]]: a
 * phase is a floor nobody descends below once reached, and corruption can be
 * hidden but never erased.
 */
export type StoryCorruptionPhase = {
  /** 0–7, matching the character sheet's stored `magic.corruptionPhase`. */
  phase: number;
  name: string;
  /** The one visible sign — what a scene shows instead of a number. */
  tell: string;
  /** What is actually happening to the person at this phase. */
  detail: string;
  /** How it gets concealed at this phase, and what the concealment costs. */
  hiding: string;
  /**
   * Whether a person at this phase is still a playable, writable character.
   * False only at the end: phase seven is not a condition somebody has, it is
   * somebody who is gone.
   */
  playable: boolean;
};

export const storyCorruptionPhases: readonly StoryCorruptionPhase[] = [
  {
    phase: 0,
    name: "Clean",
    tell: "Nothing at all.",
    detail:
      "No dose has ever landed. The only phase a person can leave and never return to, and the reason a character who refuses infusion in a crisis is making a real choice with a real cost.",
    hiding: "Nothing to hide — though plenty of people at phase one would like to be believed to be here.",
    playable: true,
  },
  {
    phase: 1,
    name: "The Tremor",
    tell: "The hand shakes — under stress, after a dose, reaching for something small.",
    detail:
      "A self that is not theirs is inside them, and nothing has been lost yet that cannot be worked back. This is the floor most infused soldiers never fall below again, and the first payment the player ever witnesses.",
    hiding:
      "A pocket, a glove, a joke, something to blame. Tino hides his in a grocery store and the player almost misses it — the canonical way to play this phase is a tell, not a lecture.",
    playable: true,
  },
  {
    phase: 2,
    name: "The Veining",
    tell: "Tracery under the skin, darkest at the injection sites, following the vessels outward.",
    detail:
      "The borrowed grain is now visible in tissue. It does not hurt, which is part of why people let it get this far — at phase two the bargain still looks like it is working.",
    hiding:
      "Long sleeves, high collars, and a doctor willing to write it up as a circulatory condition. Most infused soldiers live here, and most of their officers know exactly what they are looking at.",
    playable: true,
  },
  {
    phase: 3,
    name: "The Appetite",
    tell: "The body starts asking on its own schedule rather than the user's.",
    detail:
      "The first phase where the person's choices change instead of their body. Cravings arrive between doses; a foul mood lifts the moment one lands. People at phase three start making the decisions that carry them to phase four.",
    hiding:
      "Trivially hidden from strangers and nearly impossible to hide from anyone who shares a room with them. This is where companions start lying for each other.",
    playable: true,
  },
  {
    phase: 4,
    name: "The Sensitivity",
    tell: "They perceive what nobody around them can — essence residue, another infused across a room, a Veil Anchor going thin.",
    detail:
      "The phase that pays. Prospectors, trackers, and Anchor scouts are worth hiring precisely because they are this far down, which is the setting's cruellest employment market. It also does not switch off: crowds become unbearable and sleep stops being reliable.",
    hiding:
      "There is nothing on the body to conceal. What gives them away is behaviour — flinching at a quiet room, knowing something they had no way to know.",
    playable: true,
  },
  {
    phase: 5,
    name: "The Drift",
    tell: "A memory that is not theirs. A preference they never had. One sentence in a cadence their friends do not recognise, and a long silence afterwards.",
    detail:
      "The borrowed self begins contributing. Souls do not share, and this is the phase where that stops being an abstraction — some of what is looking out is not theirs, and they know it before anyone else does.",
    hiding:
      "Where concealment finally fails, and not because the body shows. Masks, forged scans and bribed doctors all still work perfectly. The disguise is intact; the friend is not.",
    playable: true,
  },
  {
    phase: 6,
    name: "The Turning",
    tell: "Mutation no clothing covers — structural, permanent, and obvious to any layperson at ten paces.",
    detail:
      "Reportable in most places, and the point at which the Abomination Containment Authority opens a file. Still a person, and that is the part that matters: almost everything genuinely cruel in this setting happens to people at phase six.",
    hiding: "Over. What is left to decide is where they go and who goes with them.",
    playable: true,
  },
  {
    phase: 7,
    name: "The Completion",
    tell: "None. An abomination stands where they stood.",
    detail:
      "Their own soul finally loses the argument. No reversal has ever been recorded, and every abomination in the world used to be someone — which is the whole reason they are written as grief rather than as monsters.",
    hiding: "Nothing left to hide, and nobody left to hide it.",
    playable: false,
  },
];

/** The phase a stored `magic.corruptionPhase` names, or null when unset. */
export function storyCorruptionPhase(value: unknown): StoryCorruptionPhase | null {
  return typeof value === "number" && Number.isInteger(value)
    ? storyCorruptionPhases.find((row) => row.phase === value) ?? null
    : null;
}

/** How a phase reads wherever it is shown: "Phase 3 — The Appetite". */
export function storyCorruptionPhaseLabel(value: unknown): string | null {
  const phase = storyCorruptionPhase(value);
  return phase ? (phase.phase === 0 ? "Phase 0 — Clean" : `Phase ${phase.phase} — ${phase.name}`) : null;
}

/**
 * The two dossiers that document the ladder itself, and so render it in full
 * from the constant above rather than restating it in prose that could drift.
 */
export const storyCorruptionLadderSlugs = ["the-seven-phases-of-corruption", "the-corruption-system"] as const;

/**
 * Where the generated enumeration begins inside a rule's stored body.
 *
 * The phases have to exist as prose because the game export ships bodies, not
 * web pages — but a reader on the dossier gets the rendered ladder, so the
 * generated block is cut from what the page shows. Both the script that
 * writes the block and the page that hides it read this one marker, so the
 * seam can never drift.
 */
export const storyCorruptionLadderMarker = "**The ladder, phase by phase.**";

/** The hand-written half of a body, with the generated enumeration removed. */
export function storyBodyWithoutCorruptionLadder(body: string): string {
  const at = body.indexOf(storyCorruptionLadderMarker);
  return at === -1 ? body : body.slice(0, at).trimEnd();
}

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
  /**
   * The four character-bible ledgers a sheet had no place for.
   *
   * All four are free text rather than slugs, and deliberately so: a
   * background, a trade rung, a skill rank and a fitted augment are all
   * *positions inside* a system dossier rather than entries of their own, and
   * a slug-typed field whose target can never exist is a link that
   * structurally cannot come true. Write them the way the world writes them —
   * "Contract Security", "Medicine · licensed", "Trauma · Expert",
   * "Limb — Union shop, financed" — and the prose stays primary.
   */
  background: string | null;
  professions: string[];
  skills: string[];
  cybernetics: string[];
  storyRole: string | null;
  /** Quest arcs and world events this character is part of. `kind` says which
   *  namespace `ref` lives in; an ARC row resolves against StoryArc, an EVENT
   *  row against an EVENT entry in the bible. */
  involvement: Array<{ ref: string; kind: StoryInvolvementKind; how: string | null }>;
  gameId: string | null;
  /** In-engine asset reference, e.g. "/Game/Creatures_Pack/Mesh/SK_Daemon". */
  model: string | null;
  /** Whether and when this character can join the party — the COMPANION badge. */
  companion: StoryCompanionCapability;
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

/**
 * What a character's involvement row points AT.
 *
 * The field used to be a bare `arc` slug, and six production rows pointed at
 * canon EVENT entries instead — legitimate involvement ("Reads safe channels
 * during the surge") in something that has no quest board and may never get
 * one. Nothing caught it, because the Needs Work scanner validated the slug
 * against entries and arcs merged into one pool, so an event slug looked like
 * a resolved arc. The reference carries its own namespace now, and each kind
 * is checked against only its own pool.
 */
export const storyInvolvementKinds = ["ARC", "EVENT"] as const;
export type StoryInvolvementKind = (typeof storyInvolvementKinds)[number];
export const storyInvolvementKindLabels: Record<StoryInvolvementKind, string> = {
  ARC: "Quest arc",
  EVENT: "World event",
};

/**
 * A Veil Anchor's tier, I through V — the ladder that decides how dangerous a
 * Crossing is and how valuable what comes back. Anchors are places, so the tier
 * lives on the REGION entry that IS the Anchor rather than in prose about it;
 * that is what lets the atlas show which POIs open onto other Shards, and at
 * what risk. Null on every place that is not an Anchor, which is most of them.
 */
export const storyVeilAnchorTiers = ["I", "II", "III", "IV", "V"] as const;

export type StoryVeilAnchorTier = (typeof storyVeilAnchorTiers)[number];

/** What each tier promises, for the picker and the dossier. */
export const storyVeilAnchorTierLabels: Record<StoryVeilAnchorTier, string> = {
  I: "Tier I — low threat, common returns, introductory Crossings",
  II: "Tier II — moderate threat, uncommon and rare returns",
  III: "Tier III — high threat, rare and epic returns, full Incursions",
  IV: "Tier IV — extreme threat, epic and legendary returns, endgame",
  V: "Tier V — catastrophic threat, legendary and artifact returns",
};

/**
 * Whether a place holds a Soul Forge, and what state it is in. Forges are the
 * only places a bound player returns to, so where they stand — and where they
 * have stopped standing — is map information a writer needs at a glance.
 * Null on every place that has no Forge, which is most of them.
 */
export const storySoulForgeStates = ["active", "damaged", "destroyed"] as const;

export type StorySoulForgeState = (typeof storySoulForgeStates)[number];

export const storySoulForgeStateLabels: Record<StorySoulForgeState, string> = {
  active: "Active — bindable, and people reclaim here",
  damaged: "Damaged — running, but not to be relied on",
  destroyed: "Destroyed — anyone bound here has nowhere to return to",
};

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
  /** Set only on places that ARE a Veil Anchor; null everywhere else. */
  veilAnchorTier: StoryVeilAnchorTier | null;
  /** Set only on places that hold a Soul Forge; null everywhere else. */
  soulForge: StorySoulForgeState | null;
  gameTag: string | null;
  openQuestions: string[];
};

export const storyFactionStances = ["ally", "enemy", "rival", "client", "unknown"] as const;

export type StoryFactionMeta = {
  /** Intentionally open text: new kinds of power can emerge without a contract bump. */
  scope: string | null;
  /** The faction this one answers to. Null means this IS a major power —
   *  the same law the regions atlas, the systems shelf, and the races
   *  library already run on, so a wing is never stored twice. */
  parent: string | null;
  /** Whether this power stands outside every banner's sphere, rather than
   *  simply having no wings filed under it yet. Those two look identical in
   *  the data, so the shelf cannot infer this — it is a world fact a writer
   *  sets, and it is never true at the same time as `parent`. */
  independent: boolean;
  /** The faith this power keeps — slug-or-prose like `species` and `home`:
   *  an exact faith-entry slug links both ways; prose is a writer's note.
   *  Null means secular or undeclared, which is itself information. */
  faith: string | null;
  /** PLACEHOLDER. Strength is meant to be counted from what a faction
   *  physically holds — territory, cities, wealth, population, armies —
   *  and that reckoning is not built. Until it is, this is a number a
   *  writer sets by hand, and a major's standing reads as its own plus
   *  its wings'. Nothing computes anything from it yet. */
  power: number | null;
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

/** The taxonomy law as a picker — never free text. "machine" (owner ruling
 *  2026-09-01) sits BESIDE the taxonomy of monsters rather than inside it:
 *  the locked rule classifies the living, and a machine has no soul, no
 *  phase, and no place in a Forge — the taxonomy rule's prose is untouched. */
export const storyCreatureCategories = ["natural", "magical", "monstrosity", "abomination", "supernatural", "machine"] as const;

/**
 * The races library is a two-rung tree, the same law regions and systems
 * already run on: a top-level entry (`parent: null`) IS a race — Mythical,
 * Beasts, Humans, the Risen — and everything else names the race it belongs
 * to. Nothing marks a race except having nobody above it, so a race with no
 * members yet is still visibly a race, and a member can never be orphaned
 * into a category that does not exist.
 */
export type StoryCreatureMeta = {
  category: (typeof storyCreatureCategories)[number] | null;
  /** Slug of the race this belongs to. Null = this entry is itself a race. */
  parent: string | null;
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
  /** Free-text era, shown on cards: "prologue", "~2,000 years before the present". */
  when: string | null;
  /** Years before the present, as a sortable anchor for the timeline. Fractions
   *  order same-era events (0.02 sits above 0.01 on the way down to now);
   *  null = the timeline cannot place it, which is sometimes the point — the
   *  Riftwood Breach's age being unknown is canon, not an omission. */
  timelineYearsAgo: number | null;
  where: string[];
  /** Any entry slug — people, factions, places, items. */
  involved: string[];
  outcome: string | null;
  openQuestions: string[];
};

/** What part of the game a system belongs to, as a picker rather than prose. */
export const storySystemCategories = [
  "core loop",
  "progression",
  "combat",
  "economy",
  "social",
  "management",
  "world simulation",
  "cooperative",
] as const;

/**
 * How real a system currently is on the game side. Writers read this before
 * leaning on a mechanic: a scene hinged on a "concept" system is a promise the
 * build cannot keep yet, and should stay soft enough to survive redesign.
 */
export const storySystemStatuses = ["concept", "designed", "in-build", "playable", "live"] as const;

/**
 * SYSTEM entries are the game's mechanics written down for the writers' room —
 * what the player can actually do, so quests are written toward systems that
 * exist instead of inventing verbs the game never ships.
 *
 * `unlockArc` is the release gate: the quest arc that switches this system on
 * for the player. Kingdom management is not a day-one verb — it arrives when
 * the story hands the player a kingdom, and this field is where that pacing
 * lives. `unlockStage` carries the same intent as prose while the gating arc
 * does not exist yet to link.
 */
export type StorySystemMeta = {
  category: (typeof storySystemCategories)[number] | null;
  buildStatus: (typeof storySystemStatuses)[number] | null;
  /** Slug of the SYSTEM this one lives inside — Weather sits in Environment
   *  the way a district sits in a city. Null = a top-level system. Children
   *  without their own release gate ship with their parent. */
  parent: string | null;
  /** Slug of the arc that unlocks this system for the player; null = day one or unscheduled. */
  unlockArc: string | null;
  /** Prose release intent while no arc exists to link: "Day one", "Act II — once the party holds ground". */
  unlockStage: string | null;
  /** Slugs of other SYSTEM entries this one cannot ship without. */
  dependsOn: string[];
  /** The promises of the loop, one per line — what the system guarantees the player. */
  pillars: string[];
  /** How the system expresses per region — the tropical island runs cooler in
   *  winter but never sees snow. The region end shows these back. */
  regionNotes: Array<{ region: string; note: string }>;
  gameTag: string | null;
  openQuestions: string[];
};

// ---------------------------------------------------------------------------
// Story threads & companion missions — the narrative development room
// ---------------------------------------------------------------------------

/**
 * Where a story thread stands. A THREAD is an evolving narrative concept —
 * an arc, a mystery, a betrayal, an ending — worked the way brainstorms are:
 * proposed, argued over in comments, revised, and eventually approved or
 * rejected without ever losing who proposed it or the discussion around it.
 *
 * This status is the thread's truth, deliberately separate from the entry's
 * CANON/PROPOSED status: the room's open-write law lands every save as a
 * working entry, but a thread marked "brainstorming" is NOT confirmed canon
 * and every surface says so. Threads never reach the game export at all —
 * an implemented thread's content ships as real arcs and entries, not as the
 * discussion that produced them.
 */
/**
 * The kinds that are the writers' room arguing with itself rather than world
 * truth. The game export withholds them completely — the bible never carries
 * them, and a scene that links one exports without that reference — because
 * an implemented thread ships as real arcs and entries, never as the
 * discussion that produced them.
 */
export const developmentOnlyStoryKinds = ["THREAD", "COMPANION_MISSION"] as const satisfies readonly StoryEntryKind[];

export function isDevelopmentOnlyStoryKind(kind: StoryEntryKind): boolean {
  return (developmentOnlyStoryKinds as readonly StoryEntryKind[]).includes(kind);
}

export const storyThreadStatuses = [
  "brainstorming",
  "under-discussion",
  "planned",
  "approved",
  "in-development",
  "implemented",
  "on-hold",
  "rejected",
  "archived",
] as const;

export type StoryThreadStatus = (typeof storyThreadStatuses)[number];

export const storyThreadStatusLabels: Record<StoryThreadStatus, string> = {
  "brainstorming": "Brainstorming",
  "under-discussion": "Under discussion",
  "planned": "Planned",
  "approved": "Approved",
  "in-development": "In development",
  "implemented": "Implemented",
  "on-hold": "On hold",
  "rejected": "Rejected",
  "archived": "Archived",
};

/** Statuses that mean "this is not settled story" — badged loudly. */
export function isUnconfirmedThreadStatus(status: StoryThreadStatus | null) {
  return status === null || status === "brainstorming" || status === "under-discussion" || status === "on-hold";
}

export const storyThreadCategories = [
  "main-story",
  "character-arc",
  "companion-arc",
  "mystery",
  "relationship",
  "lore",
  "faction-conflict",
  "boss-encounter",
  "world-event",
  "side-story",
  "reveal",
  "ending",
  "future-content",
  "expansion-sequel",
] as const;

export type StoryThreadCategory = (typeof storyThreadCategories)[number];

export const storyThreadCategoryLabels: Record<StoryThreadCategory, string> = {
  "main-story": "Main story",
  "character-arc": "Character arc",
  "companion-arc": "Companion arc",
  "mystery": "Mystery",
  "relationship": "Relationship",
  "lore": "Lore",
  "faction-conflict": "Faction conflict",
  "boss-encounter": "Boss encounter",
  "world-event": "World event",
  "side-story": "Side story",
  "reveal": "Reveal",
  "ending": "Ending",
  "future-content": "Future content",
  "expansion-sequel": "Expansion / sequel setup",
};

/**
 * Approximate placement in the campaign. A thread can span several — the
 * Amanda/Tino line runs Peninsula to post-credits — so threads carry an array
 * while a single companion mission carries one.
 */
export const storyStoryStages = [
  "prologue",
  "tutorial",
  "peninsula",
  "early-game",
  "mid-game",
  "late-game",
  "endgame",
  "final-boss",
  "epilogue",
  "post-credits",
  "unknown",
] as const;

export type StoryStoryStage = (typeof storyStoryStages)[number];

export const storyStoryStageLabels: Record<StoryStoryStage, string> = {
  "prologue": "Prologue",
  "tutorial": "Tutorial",
  "peninsula": "Peninsula",
  "early-game": "Early game",
  "mid-game": "Mid game",
  "late-game": "Late game",
  "endgame": "Endgame",
  "final-boss": "Final boss",
  "epilogue": "Epilogue",
  "post-credits": "Post-credits",
  "unknown": "Unknown / TBD",
};

export const storyThreadPriorities = ["low", "medium", "high", "critical"] as const;

export const storySpoilerLevels = ["none", "minor", "major", "ending"] as const;

/**
 * Where a canon packet is headed — the section of the canon navigator whose
 * inbox it lands in. "region", "companions", and "factions" narrow further
 * through `targetRegion` / `targetCompanion` / `targetFaction`, which is what
 * lights one place's bubble rather than the whole section's.
 */
export const storyCanonPacketTargetKinds = ["campaign", "region", "companions", "factions", "incursions", "events"] as const;

export type StoryCanonPacketTargetKind = (typeof storyCanonPacketTargetKinds)[number];

export const storyCanonPacketTargetLabels: Record<StoryCanonPacketTargetKind, string> = {
  campaign: "The main story",
  region: "A place on the map",
  companions: "A companion",
  factions: "A faction",
  incursions: "Incursions",
  events: "World events",
};

/**
 * A settled piece of a story thread, pushed out of the development room and
 * waiting in the canon inbox for a writer to weave it into a flow.
 *
 * This is deliberately NOT a freeze. Pushing changes nothing about what is
 * canon; the arc padlock remains the only thing that settles story. A packet
 * is a hand-off: "this part of the argument is done, here is the material, it
 * belongs over there". It stays `pending` until somebody marks it woven and
 * says which arcs it became.
 *
 * Packets live inside the thread's own meta rather than in a table of their
 * own, so a packet can never outlive or drift from the thread it came out of,
 * and the export — which withholds threads entirely — never has to learn about
 * them.
 */
export type StoryCanonPacket = {
  /** UUID minted server-side when the packet is pushed. */
  id: string;
  title: string;
  /** The settled material itself, in the same prose the codex reads elsewhere. */
  body: string;
  targetKind: StoryCanonPacketTargetKind;
  /** REGION slug — required when `targetKind` is "region", null otherwise. */
  targetRegion: string | null;
  /** CHARACTER slug — optional when `targetKind` is "companions"; null means
   *  the general companions bucket rather than one companion's bubble. */
  targetCompanion: string | null;
  /** FACTION slug — optional when `targetKind` is "factions"; null means the
   *  general factions bucket rather than one banner's bubble. */
  targetFaction: string | null;
  /** Entry slugs this material touches, so the packet shows up on their
   *  dossiers the same way every other connection does. */
  entries: string[];
  status: "pending" | "woven";
  pushedAt: string;
  pushedBy: string;
  wovenAt: string | null;
  wovenBy: string | null;
  /** Arc slugs the material actually became. Unioned into the thread's
   *  `arcs` on weave, which is how a thread keeps its shipped trace. */
  wovenInto: string[];
};

/**
 * The narrative-development sheet. Every related-* field is entry or arc
 * slugs — real relationships, never names as text — under the same
 * link-now-fill-later law the rest of the codex runs on. `parent` nests
 * threads: the child-abduction mystery can grow out of The Empty Cribs
 * without either losing its own discussion.
 */
export type StoryThreadMeta = {
  threadStatus: StoryThreadStatus | null;
  categories: StoryThreadCategory[];
  stages: StoryStoryStage[];
  priority: (typeof storyThreadPriorities)[number] | null;
  spoilerLevel: (typeof storySpoilerLevels)[number] | null;
  /** Slug of the THREAD this one grew out of; children are derived, never stored. */
  parent: string | null;
  /** CHARACTER slugs this thread is about. */
  characters: string[];
  /** CHARACTER slugs specifically in their companion capacity. */
  companions: string[];
  factions: string[];
  /** REGION slugs. */
  locations: string[];
  /** Quest arc slugs — the missions this thread touches. */
  arcs: string[];
  /** COMPANION_MISSION slugs. */
  companionMissions: string[];
  /** Slugs of the entries (characters, creatures) fought as bosses in this thread. */
  bosses: string[];
  /** Settled material pushed toward canon, still waiting to be woven in. */
  canonPackets: StoryCanonPacket[];
  tags: string[];
  openQuestions: string[];
};

/**
 * How real a companion mission currently is. Same idea as the thread status:
 * the development truth, separate from the entry's room status, badged
 * everywhere the mission is listed.
 */
export const storyCompanionMissionStatuses = [
  "brainstorming",
  "concept",
  "planned",
  "approved",
  "in-development",
  "implemented",
  "cut",
  "archived",
] as const;

export type StoryCompanionMissionStatus = (typeof storyCompanionMissionStatuses)[number];

export const storyCompanionMissionStatusLabels: Record<StoryCompanionMissionStatus, string> = {
  "brainstorming": "Brainstorming",
  "concept": "Concept",
  "planned": "Planned",
  "approved": "Approved",
  "in-development": "In development",
  "implemented": "Implemented",
  "cut": "Cut",
  "archived": "Archived",
};

/**
 * A companion's personal mission — a first-class record, not a text field on
 * the character. `companion` names the CHARACTER whose arc this belongs to,
 * and `order` places it in that companion's chain (Amanda's runs 1–9).
 */
export type StoryCompanionMissionMeta = {
  /** CHARACTER slug whose arc this mission belongs to. */
  companion: string | null;
  /** The canon arc slug this mission actually became, once someone built it.
   *  Null means planned but not yet a board — which is how the canon
   *  navigator tells an implemented chain step from a written-down one. */
  arc: string | null;
  /** Position in the companion's mission chain, 1-first. */
  order: number | null;
  missionStatus: StoryCompanionMissionStatus | null;
  stage: StoryStoryStage | null;
  /** What has to be true before this mission opens — prose intent. */
  unlockConditions: string | null;
  rewards: string[];
  /** How completing it moves the companion relationship. */
  relationshipEffects: string | null;
  /** What it changes in the world or the story. */
  consequences: string | null;
  characters: string[];
  locations: string[];
  factions: string[];
  /** THREAD slugs this mission advances. */
  threads: string[];
  openQuestions: string[];
};

/**
 * Files companion missions under the companion they belong to, each chain in
 * `order`, with anything unfiled kept aside rather than dropped.
 *
 * Two surfaces need exactly this grouping — the missions library and the canon
 * navigator's companion sections — and a second copy would be the kind that
 * drifts: one sorting by order, the other by title, and the same chain reading
 * differently in two places.
 */
export function groupStoryMissionChains<T extends { slug: string; title: string; meta: Record<string, unknown> | null }>(missions: T[]): { chains: Map<string, T[]>; loose: T[] } {
  const slugOf = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const orderOf = (mission: T) => (typeof mission.meta?.order === "number" ? (mission.meta.order as number) : 99);
  const chains = new Map<string, T[]>();
  const loose: T[] = [];
  for (const mission of [...missions].sort((left, right) => orderOf(left) - orderOf(right) || left.title.localeCompare(right.title))) {
    const companion = slugOf(mission.meta?.companion);
    if (!companion) { loose.push(mission); continue; }
    const bucket = chains.get(companion);
    if (bucket) bucket.push(mission); else chains.set(companion, [mission]);
  }
  return { chains, loose };
}

/**
 * A character's companion capability, shown as the COMPANION badge on cards
 * and dossiers. `capable` is the machine-readable fact; the two prose fields
 * carry the story shape ("Peninsula / Early game", "Former companion —
 * deceased") because recruitment windows and fates are narrative, not enums.
 * A character record is never deleted or overwritten when their companion
 * story ends — Amanda remains a character forever; only this object changes.
 */
export type StoryCompanionCapability = {
  capable: boolean | null;
  /** When the player can recruit them. */
  availability: string | null;
  /** Where they stand now: active, future, former — deceased. */
  status: string | null;
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
