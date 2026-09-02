import type { AbilityCard } from "../ability-cards";
import { archonCards } from "./archon";
import { bastionCards } from "./bastion";
import { conduitCards } from "./conduit";
import { cypheristCards } from "./cypherist";
import { maverickCards } from "./maverick";
import { procuratorCards } from "./procurator";
import { spectorCards } from "./spector";
import { surgerCards } from "./surger";

/**
 * Every talent node's readable card, keyed `<class>/<node id>`; the
 * corrupted ladder keyed `<class>/corrupt-<phase>`. One file per class in
 * this directory, all written to Docs/codex/ABILITY_CARD_STYLE.md; the
 * numbers agree with lib/talent-effects.ts (the balance truth) and the
 * test in lib/talent-cards.test.ts holds them to it.
 */
const byClass: Record<string, Record<string, AbilityCard>> = {
  bastion: bastionCards,
  spector: spectorCards,
  conduit: conduitCards,
  surger: surgerCards,
  archon: archonCards,
  procurator: procuratorCards,
  cypherist: cypheristCards,
  maverick: maverickCards,
};

export const talentCards: Record<string, AbilityCard> = Object.fromEntries(
  Object.entries(byClass).flatMap(([slug, cards]) => Object.entries(cards).map(([id, card]) => [`${slug}/${id}`, card])),
);

export function cardForNode(classSlug: string, nodeId: string): AbilityCard | null {
  return byClass[classSlug]?.[nodeId] ?? null;
}

export function cardForCorruptedPhase(classSlug: string, phase: number): AbilityCard | null {
  return byClass[classSlug]?.[`corrupt-${phase}`] ?? null;
}
