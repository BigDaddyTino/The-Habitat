import type { AbilityCard } from "./ability-cards";
import { effectsForTrade, type Blueprint, type ProfessionEffect, type Rung } from "./professions";

/**
 * The Trades page's readable layer over lib/professions.ts: a blueprint as
 * an ability card (Type Blueprint · Rung · Effect · Notes), and the balance
 * campaign's per-rung weights as one plain line — the same numbers the sims
 * run on, worded the way the talent cards word theirs.
 */
export const rungLabel: Record<Rung, string> = { apprentice: "Apprentice", licensed: "Licensed", journeyman: "Journeyman", master: "Master" };

export function blueprintCard(blueprint: Blueprint): AbilityCard {
  const [effect, ...rest] = blueprint.does;
  return {
    kind: "Blueprint",
    effect: effect ?? blueprint.name,
    notes: rest.length ? rest.join(" ") : undefined,
  };
}

const pct = (value: number) => `${value >= 0 ? "+" : "−"}${Math.round(Math.abs(value) * 100)}%`;

/** The rung's standing bonus to the party, from the sim weights. */
export function describeTradeEffects(effect: ProfessionEffect): string[] {
  const lines: string[] = [];
  if (effect.extraDoses) lines.push(`+${effect.extraDoses} dose${effect.extraDoses === 1 ? "" : "s"} carried into every fight`);
  if (effect.ammoMultiplier && effect.ammoMultiplier !== 1) lines.push(`ammunition carried ${pct(effect.ammoMultiplier - 1)}`);
  if (effect.extraPlates) lines.push(`+${effect.extraPlates} plate${effect.extraPlates === 1 ? "" : "s"} carried beyond issue`);
  if (effect.partyRecovery) lines.push(`${effect.partyRecovery} wound${effect.partyRecovery === 1 ? "" : "s"} healed per person between fights`);
  if (effect.partyDyingClock) lines.push(`+${effect.partyDyingClock}s on every ally's Dying clock`);
  if (effect.composureRestore) lines.push(`${effect.composureRestore} Composure restored between fights`);
  if (effect.poolRestore) lines.push(`${pct(effect.poolRestore)} of a caster's pool back between fights`);
  if (effect.castCostRelief) lines.push(`cast costs ${pct(-effect.castCostRelief)} for whoever wears the rig`);
  if (effect.damageReduction) lines.push(`damage taken ${pct(-effect.damageReduction)} on ground you prepared`);
  if (effect.corruptionPace && effect.corruptionPace !== 1) lines.push(`corruption advances ${Math.round((1 - effect.corruptionPace) * 100)}% slower per dose`);
  return lines;
}

export function rungBonus(slug: string, rung: Rung): string[] {
  return describeTradeEffects(effectsForTrade(slug, rung));
}
