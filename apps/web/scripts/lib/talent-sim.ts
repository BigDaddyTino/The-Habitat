/**
 * The combat model the balance simulations run on.
 *
 * Everything here is canon's own arithmetic where canon has any: the wound
 * model's six states and the Dying clock, the five damage types against
 * plates, both casting economies (a born caster's pool of 8 + level + twice
 * Conductivity; an infused caster's charges at Conductivity + 2 with a
 * standard rig delivering four of five), the corruption ladder's attribute
 * trades, and the species ceilings.
 *
 * Where canon has no number, this file invents one and says so. Those are
 * MODEL ASSUMPTIONS, listed at the bottom of the report, and they are the
 * part a designer should argue with. The simulations are not proof about a
 * game that does not exist yet; they are a structural test of whether the
 * trees produce builds that function, run dry, counter each other, and need
 * a party  which is exactly what the design claims.
 */

export type DamageType = "PHYSICAL" | "FIRE" | "ELECTRICAL" | "ARCANE" | "TOXIC";

export type Attributes = {
  conditioning: number; coordination: number; resilience: number;
  acuity: number; composure: number; conductivity: number;
};
export type AttributeKey = keyof Attributes;

export type SpeciesProfile = {
  slug: string; name: string;
  caps: Attributes;
  /** Corruption advances at this multiple of the standard pace. */
  corruptionPace: number;
  /** Resilience recovery multiplier between fights. */
  mendPace: number;
  /** True death: no reclamation, ever. */
  permadeath: boolean;
  /** Instruments cannot read them at all. */
  unreadable: boolean;
  /** One attribute begins at rung 5  the thing they were built for. */
  specification?: AttributeKey;
  note: string;
};

export type OriginProfile = {
  slug: string; name: string;
  economy: "none" | "pool" | "charges";
  /** Infused characters start on the ladder. */
  startingPhase: number;
  composureBonus: number;
};

/** A profession's mechanical weight in a fight or across a day of them. */
export type ProfessionProfile = {
  slug: string; name: string;
  effects: Partial<{
    /** Doses carried into a fight beyond the standard issue. */
    extraDoses: number;
    /** Rounds of Dying clock added to the whole party. */
    partyDyingClock: number;
    /** Wounds healed between fights, per person. */
    partyRecovery: number;
    /** Composure restored between fights  Culinary's real meal. */
    composureRestore: number;
    /** Multiplier on ammunition carried. */
    ammoMultiplier: number;
    /** Corruption pace multiplier  Chemistry's cut. */
    corruptionPace: number;
    /** Plates carried beyond issue. */
    extraPlates: number;
  }>;
};

export type AttackProfile = {
  name: string;
  type: DamageType;
  /** Wounds inflicted when it lands and is not stopped by a plate. */
  wounds: number;
  /** Base chance before the attribute contest. */
  accuracy: number;
  /** Pool units, rig charges, or rounds  whichever the economy uses. */
  cost: number;
  costs: "none" | "pool" | "charges" | "ammo";
  /** Opens a bleed that ticks until treated. */
  bleeds?: boolean;
  /** Ignores plates outright  the arcane scar. */
  ignoresPlates?: boolean;
  /** Usable once per fight. */
  onceOnly?: boolean;
};

/** Everything a talent node can do to the model. Nodes not listed here are
 * — narrative in-sim: real in play, no arithmetic to test. */
export type NodeEffect = Partial<{
  accuracy: number;
  damageBonus: number;
  extraPlates: number;
  /** Multiplier on wounds taken  mitigation. */
  incoming: number;
  initiative: number;
  /** Extra Dying-clock rounds for the owner. */
  dyingClock: number;
  /** Wounds before Down, added. */
  toughness: number;
  /** Pool or charge efficiency multiplier on costs. */
  castCost: number;
  /** Resource returned per landed hit  the engines. */
  resourcePerHit: number;
  /** Resource returned per wound taken. */
  resourcePerWound: number;
  /** Flat resource ceiling bonus. */
  resourceCap: number;
  /** Ammunition multiplier. */
  ammo: number;
  /** Chance per round to shrug a bleed or heal a wound. */
  selfRepair: number;
  /** Ally wounds healed per round  party value. */
  partyHeal: number;
  /** Reduces every ally's incoming wounds  auras and cover. */
  partyMitigation: number;
  /** Extra action chance per round. */
  extraAction: number;
  /** Chance to avoid being targeted first in PvP  the unseen. */
  concealment: number;
  /** Sees through concealment. */
  detection: number;
  /** Chance per round to deny the enemy their action  control. */
  control: number;
  /** Multiplier on enemy cast costs in range  the Dampening Coil. */
  enemyCastCost: number;
  /** Bodies fighting on your side that are not you. */
  minions: number;
  /** Immunity to the ELECTRICAL chrome-vent rule. */
  hardenedChrome: boolean;
  /** Carries chrome at all  what ELECTRICAL vents. */
  chrome: boolean;
  /** Once per fight, refuse Down. */
  refuseDown: boolean;
  /** Once per fight, spend everything for a burst. */
  burst: number;
}>;

export type SimCharacter = {
  label: string;
  classSlug: string;
  species: SpeciesProfile;
  origin: OriginProfile;
  professions: ProfessionProfile[];
  level: number;
  phase: number;
  attributes: Attributes;
  attacks: AttackProfile[];
  effects: NodeEffect;
  // Live state
  wounds: number;
  bleeding: number;
  plates: number;
  resource: number;
  resourceMax: number;
  ammo: number;
  down: boolean;
  dying: number;
  dead: boolean;
  usedOnce: Set<string>;
  refusedDown: boolean;
  burstUsed: boolean;
};

/** Deterministic RNG: the same seed always produces the same campaign. */
export function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0; state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * MODEL ASSUMPTION  attribute growth.
 *
 * Canon fixes the rungs (09) and the species ceilings but not the curve a
 * hundred levels draws through them. The class growth line ("+2 Conditioning
 * / +1 Resilience") is read as weights: the primary reaches its ceiling
 * around level 80, the secondary near the cap, and everything untouched
 * drifts to about 5  a developed character, never a maxed one.
 */
export function attributesFor(level: number, primary: AttributeKey, secondary: AttributeKey, species: SpeciesProfile, phase: number): Attributes {
  const base = (weight: number) => 2 + level * weight;
  const raw: Attributes = {
    conditioning: base(0.035), coordination: base(0.035), resilience: base(0.035),
    acuity: base(0.035), composure: base(0.035), conductivity: base(0.035),
  };
  raw[primary] = base(0.08);
  raw[secondary] = base(0.06);
  if (species.specification) raw[species.specification] = Math.max(raw[species.specification], 5 + level * 0.045);

  const out = {} as Attributes;
  for (const key of Object.keys(raw) as AttributeKey[]) {
    out[key] = Math.min(species.caps[key], Math.round(raw[key] * 10) / 10);
  }
  // The corruption ladder trades rungs  canon's own table.
  if (phase >= 1) out.coordination -= 1;
  if (phase >= 2) { out.conditioning -= 1; out.conductivity += 1; }
  if (phase >= 3) out.composure -= 2;
  if (phase >= 4) out.acuity += 1;
  if (phase >= 6) out.resilience += 1;
  for (const key of Object.keys(out) as AttributeKey[]) out[key] = Math.max(0, Math.round(out[key] * 10) / 10);
  return out;
}

export function mergeEffects(effects: NodeEffect[]): NodeEffect {
  const sum: NodeEffect = {};
  for (const effect of effects) {
    for (const [key, value] of Object.entries(effect)) {
      // Display-only keys (the hand-written `world` lines) never sum.
      if (typeof value !== "number" && typeof value !== "boolean") continue;
      if (typeof value === "boolean") { (sum as Record<string, unknown>)[key] = ((sum as Record<string, unknown>)[key] as boolean) || value; continue; }
      const multiplicative = key === "incoming" || key === "castCost" || key === "enemyCastCost";
      const current = (sum as Record<string, number>)[key];
      (sum as Record<string, number>)[key] = multiplicative
        ? (current === undefined ? 1 : current) * (value as number)
        : (current ?? 0) + (value as number);
    }
  }
  return sum;
}

export function hitsBeforeDown(character: SimCharacter): number {
  return 2 + Math.floor(character.attributes.resilience / 2) + (character.effects.toughness ?? 0);
}

export function resourceCeiling(character: SimCharacter): number {
  const { origin, attributes, level, effects } = character;
  if (origin.economy === "pool") return Math.round(8 + level * 0.35 + 2 * attributes.conductivity + (effects.resourceCap ?? 0));
  if (origin.economy === "charges") {
    const perDose = 4; // standard rig: three lit, two delivered  a full dose of five lands four
    const doses = 3 + (character.professions.reduce((sum, p) => sum + (p.effects.extraDoses ?? 0), 0));
    return Math.round(doses * perDose + (effects.resourceCap ?? 0));
  }
  return 0;
}

export function reset(character: SimCharacter) {
  character.wounds = 0;
  character.bleeding = 0;
  character.down = false;
  character.dead = false;
  character.dying = 0;
  character.usedOnce = new Set();
  character.refusedDown = false;
  character.burstUsed = false;
  character.resourceMax = resourceCeiling(character);
  character.resource = character.resourceMax;
  character.plates = 2 + (character.effects.extraPlates ?? 0) + character.professions.reduce((sum, p) => sum + (p.effects.extraPlates ?? 0), 0);
  const ammoMultiplier = (character.effects.ammo ?? 0) + character.professions.reduce((sum, p) => sum + ((p.effects.ammoMultiplier ?? 1) - 1), 0);
  character.ammo = Math.round(30 * (1 + ammoMultiplier));
}

function affordable(character: SimCharacter, attack: AttackProfile): boolean {
  if (attack.onceOnly && character.usedOnce.has(attack.name)) return false;
  const cost = Math.max(1, Math.round(attack.cost * (character.effects.castCost ?? 1)));
  if (attack.costs === "pool" || attack.costs === "charges") return character.resource >= cost;
  if (attack.costs === "ammo") return character.ammo >= cost;
  return true;
}

function spend(character: SimCharacter, attack: AttackProfile) {
  const cost = Math.max(1, Math.round(attack.cost * (character.effects.castCost ?? 1)));
  if (attack.costs === "pool" || attack.costs === "charges") character.resource -= cost;
  else if (attack.costs === "ammo") character.ammo -= cost;
  if (attack.onceOnly) character.usedOnce.add(attack.name);
}

/** The best thing this character can still do, or null when dry. */
export function chooseAttack(character: SimCharacter): AttackProfile | null {
  const usable = character.attacks.filter((attack) => affordable(character, attack));
  if (!usable.length) return null;
  return usable.reduce((best, attack) => (attack.wounds > best.wounds ? attack : best), usable[0]);
}

/**
 * One attack resolved. Returns the wounds that actually landed.
 *
 * The damage-type table is canon's: a plate stops one hit and is gone; FIRE
 * ignores half a plate; ELECTRICAL goes through to whatever conducts, which
 * only matters to somebody carrying chrome; ARCANE ignores the plate
 * entirely; TOXIC does not care about the plate and is resisted by the body.
 */
export function resolveAttack(attacker: SimCharacter, defender: SimCharacter, attack: AttackProfile, rng: () => number): number {
  // Concealment is not only about who gets picked: a person you cannot hold
  // in your eye is a person you shoot worse at, even when they are the only
  // one in the room. Detection reads back through it.
  const unseen = Math.max(0, (defender.effects.concealment ?? 0) - (attacker.effects.detection ?? 0));
  const evasion = (defender.attributes.coordination + defender.attributes.acuity) / 2;
  const aim = attacker.attributes.coordination + (attacker.effects.accuracy ?? 0) * 10;
  const chance = Math.max(0.1, Math.min(0.94, attack.accuracy + (aim - evasion) * 0.035 - unseen * 0.55));
  if (rng() > chance) return 0;

  let wounds = attack.wounds + (attacker.effects.damageBonus ?? 0);
  if (attack.type === "TOXIC" && rng() < defender.attributes.resilience * 0.06) return 0;

  const platesMatter = !attack.ignoresPlates && attack.type !== "ARCANE" && attack.type !== "TOXIC";
  if (platesMatter && defender.plates > 0) {
    const stopped = attack.type === "FIRE" ? rng() < 0.5 : attack.type === "ELECTRICAL" ? !defender.effects.chrome || Boolean(defender.effects.hardenedChrome) : true;
    if (stopped) { defender.plates -= 1; return 0; }
  }
  if (attack.type === "ELECTRICAL" && defender.effects.chrome && !defender.effects.hardenedChrome) {
    wounds += 1; // vented chrome is a limb that does not answer
  }

  wounds = Math.max(0, wounds * (defender.effects.incoming ?? 1));
  defender.wounds += wounds;
  if (attack.bleeds) defender.bleeding += 1;
  return wounds;
}

export function tickState(character: SimCharacter, rng: () => number) {
  if (character.dead) return;
  if (character.bleeding > 0 && rng() < 0.5) character.wounds += 0.5 * character.bleeding;
  if ((character.effects.selfRepair ?? 0) > 0 && rng() < (character.effects.selfRepair ?? 0)) {
    character.wounds = Math.max(0, character.wounds - 1);
    character.bleeding = Math.max(0, character.bleeding - 1);
  }
  if (!character.down && character.wounds >= hitsBeforeDown(character)) {
    if (character.effects.refuseDown && !character.refusedDown) {
      character.refusedDown = true;
      character.wounds = hitsBeforeDown(character) - 1;
    } else {
      character.down = true;
      character.dying = 3 + Math.floor(character.attributes.resilience / 3) + (character.effects.dyingClock ?? 0)
        + character.professions.reduce((sum, p) => sum + (p.effects.partyDyingClock ?? 0), 0);
    }
  }
  if (character.down) {
    character.dying -= 1;
    if (character.dying <= 0) character.dead = true;
  }
}

/**
 * What a night's rest and a working party do between two fights.
 *
 * This is where canon's two casting economies finally differ: a born
 * caster's pool comes back from sleep and a real meal, and an infused
 * caster's charges come back only from the next dose  which is a finite
 * number carried into the day. A Returnee mends at half pace, which no
 * single fight can show.
 */
export function recover(character: SimCharacter, hoursOfCare = 1) {
  if (character.dead) return;
  const trades = character.professions.reduce((sum, p) => sum + (p.effects.partyRecovery ?? 0), 0);
  // Hours between engagements, not a night's sleep: most of a body back,
  // and a Returnee gets half of what everyone else does. At Turning nobody
  // billets with you, and care that will not touch you is half care.
  const billeted = character.phase >= 6 ? 0.5 : 1;
  const care = (hitsBeforeDown(character) * 0.45 + trades) * character.species.mendPace * billeted * hoursOfCare;
  character.wounds = Math.max(0, character.wounds - care);
  character.bleeding = 0;
  character.down = false;
  character.dying = 0;
  character.usedOnce = new Set();
  character.refusedDown = false;
  character.plates = Math.min(character.plates + 1, 2 + (character.effects.extraPlates ?? 0) + character.professions.reduce((sum, p) => sum + (p.effects.extraPlates ?? 0), 0));
  const ammoMultiplier = (character.effects.ammo ?? 0) + character.professions.reduce((sum, p) => sum + ((p.effects.ammoMultiplier ?? 1) - 1), 0);
  character.ammo = Math.min(Math.round(30 * (1 + ammoMultiplier)), character.ammo + Math.round(12 * (1 + ammoMultiplier)));
  if (character.origin.economy === "pool") {
    // Sleep is full; a real meal is a quarter. A fight-to-fight lull is neither.
    character.resource = Math.min(character.resourceMax, character.resource + character.resourceMax * 0.45);
  }
  // Charges do not come back. Only the next dose does, and the doses were
  // counted into the ceiling when the day started.
}

export type FightResult = {
  winner: "a" | "b" | "draw"; rounds: number; aDry: boolean; bDry: boolean; aDownRound: number | null;
  /** Rounds side A spent on a worse attack than their best, because the
   * — better one was unaffordable  canon's person with a rifle. */
  aDegraded: number; aRounds: number;
};

/** One fight between two sides. A side is one or more characters.
 * — `fresh` false continues a day already in progress. */
export function fight(sideA: SimCharacter[], sideB: SimCharacter[], rng: () => number, maxRounds = 25, fresh = true): FightResult {
  for (const character of [...sideA, ...sideB]) if (fresh || character.classSlug === "enemy") reset(character);
  let aDry = false, bDry = false, aDownRound: number | null = null, aDegraded = 0, aRounds = 0;

  const initiative = (side: SimCharacter[]) => side.reduce((sum, c) => sum + c.attributes.coordination + (c.effects.initiative ?? 0) * 10, 0) / side.length;
  const aFirst = initiative(sideA) >= initiative(sideB);

  const standing = (side: SimCharacter[]) => side.filter((c) => !c.down && !c.dead);

  for (let round = 1; round <= maxRounds; round++) {
    const order: Array<["a" | "b", SimCharacter]> = aFirst
      ? [...sideA.map((c) => ["a", c] as ["a", SimCharacter]), ...sideB.map((c) => ["b", c] as ["b", SimCharacter])]
      : [...sideB.map((c) => ["b", c] as ["b", SimCharacter]), ...sideA.map((c) => ["a", c] as ["a", SimCharacter])];

    for (const [side, actor] of order) {
      if (actor.down || actor.dead) continue;
      const allies = side === "a" ? sideA : sideB;
      const foes = standing(side === "a" ? sideB : sideA);
      if (!foes.length) break;

      // A medic pulls somebody off the floor before doing anything else.
      const fallen = allies.find((c) => c.down && !c.dead);
      if (fallen && (actor.effects.partyHeal ?? 0) > 0 && rng() < 0.7) {
        fallen.down = false;
        fallen.wounds = Math.max(0, hitsBeforeDown(fallen) - 1 - (actor.effects.partyHeal ?? 0));
        continue;
      }

      // The owner acts, then anything bonded to them acts  at its own
      // strength, not the owner's. A drone is a body on the field, never a
      // second copy of the person who built it.
      const minionActions = Math.round(actor.effects.minions ?? 0);
      const actions = 1 + ((actor.effects.extraAction ?? 0) > rng() ? 1 : 0) + minionActions;
      for (let act = 0; act < actions; act++) {
        const isMinion = act >= actions - minionActions;
        const live = standing(side === "a" ? sideB : sideA);
        if (!live.length) break;
        // Concealment decides who gets shot at: the unseen are chosen last.
        const visible = live.filter((c) => rng() > (c.effects.concealment ?? 0) - (actor.effects.detection ?? 0));
        const target = (visible.length ? visible : live)[Math.floor(rng() * (visible.length ? visible.length : live.length))];

        if (!isMinion && (actor.effects.control ?? 0) > 0 && rng() < (actor.effects.control ?? 0)) { target.plates = Math.max(0, target.plates - 1); }
        if (isMinion) {
          // A bonded body: its own claws or rounds, free, and weaker.
          const bite: AttackProfile = { name: "Bonded body", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 0, costs: "none" };
          const minion: SimCharacter = { ...actor, effects: { accuracy: actor.effects.accuracy, damageBonus: (actor.effects.damageBonus ?? 0) * 0.35 } };
          resolveAttack(minion, target, bite, rng);
          continue;
        }
        const attack = chooseAttack(actor);
        if (!attack) { if (side === "a") aDry = true; else bDry = true; break; }
        if (side === "a") {
          aRounds += 1;
          const best = actor.attacks.reduce((top, candidate) => (candidate.wounds > top.wounds ? candidate : top), actor.attacks[0]);
          if (attack.wounds < best.wounds) aDegraded += 1;
        }
        spend(actor, attack);
        const landed = resolveAttack(actor, target, attack, rng);
        if (landed > 0) {
          if ((actor.effects.resourcePerHit ?? 0) > 0) actor.resource = Math.min(actor.resourceMax, actor.resource + (actor.effects.resourcePerHit ?? 0));
        }
      }
    }

    for (const character of [...sideA, ...sideB]) {
      const before = character.down;
      tickState(character, rng);
      if (!before && character.down && sideA.includes(character) && aDownRound === null) aDownRound = round;
      if (character.down && (character.effects.resourcePerWound ?? 0) > 0) character.resource = Math.min(character.resourceMax, character.resource);
    }

    if (!standing(sideA).length && !standing(sideB).length) return { winner: "draw", rounds: round, aDry, bDry, aDownRound, aDegraded, aRounds };
    if (!standing(sideB).length) return { winner: "a", rounds: round, aDry, bDry, aDownRound, aDegraded, aRounds };
    if (!standing(sideA).length) return { winner: "b", rounds: round, aDry, bDry, aDownRound, aDegraded, aRounds };
  }
  // A fight nobody can finish is decided by who is closer to the floor.
  const health = (side: SimCharacter[]) => side.reduce((sum, c) => sum + (hitsBeforeDown(c) - c.wounds), 0);
  const gap = health(sideA) - health(sideB);
  return { winner: gap > 0.5 ? "a" : gap < -0.5 ? "b" : "draw", rounds: maxRounds, aDry, bDry, aDownRound, aDegraded, aRounds };
}
