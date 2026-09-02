/**
 * The ability card — one shape for every readable power in the codex.
 *
 * Talent nodes, the 108 licensed spells, and the 60 skill techniques all
 * render through the same labeled-field block (Type · Cost · Cooldown ·
 * Range · Duration · Effect · Notes), the way a Final Fantasy XIV action
 * tooltip reads. The rule that makes the whole section legible: the
 * Effect line says exactly what happens, in numbers, in one or two plain
 * sentences. Flavor lives elsewhere (a node's `desc`, a spell's `flavor`)
 * and is never allowed into the Effect row.
 *
 * `untested` marks numbers written by hand for readability that the balance
 * campaign has not measured. The page prints a small tag so the owner can
 * spot them; the simulations ignore cards entirely and run on
 * lib/talent-effects.ts, which every card's numbers must agree with.
 */

export type AbilityKind =
  /** Always on once bought. */
  | "Passive"
  /** Triggered by the player; carries a cooldown or a use limit. */
  | "Active"
  /** Buying the node opens a licensed spell from the six pillars. */
  | "Spell"
  /** One of an exclusive pair: buying it locks its partner for good. */
  | "Choice"
  /** A teacher-gated ceiling; points alone never open it. */
  | "Capstone"
  /** Opens a system, slot, or surface rather than a stat. */
  | "Unlock"
  /** Lit by corruption phase; costs no points. */
  | "Corrupted";

export type AbilityCard = {
  kind: AbilityKind;
  /** What it does, present tense, with the numbers. One or two sentences. */
  effect: string;
  /** Resource cost beyond talent points: "2 pool · 1 charge", "1 breach charge". */
  cost?: string;
  /** "20s", "Once per fight", "Once per day", "15 min". Actives must carry one. */
  cooldown?: string;
  /** "Self", "Melee", "10m", "Rifle range", "Line of sight", "Any range". */
  range?: string;
  /** "Instant", "5s", "While channelled", "Until moved". */
  duration?: string;
  /** Interactions, stacking, what turns it off. Plain words. */
  notes?: string;
  /** Hand-written tuning values the balance sims have not measured. */
  untested?: boolean;
};

export const abilityKindLabel: Record<AbilityKind, string> = {
  Passive: "Passive",
  Active: "Active",
  Spell: "Spell unlock",
  Choice: "Choice node",
  Capstone: "Capstone · trainer",
  Unlock: "Unlock",
  Corrupted: "Corrupted · free",
};

/** Field order as the card prints it. */
export const abilityFieldOrder = ["cost", "cooldown", "range", "duration"] as const;
export const abilityFieldLabel: Record<(typeof abilityFieldOrder)[number], string> = {
  cost: "Cost",
  cooldown: "Cooldown",
  range: "Range",
  duration: "Duration",
};
